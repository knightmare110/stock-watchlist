# core/celery_app.py

import os
import json
import requests
import boto3
import redis
from celery import Celery
from celery.schedules import crontab
from datetime import timedelta
from django.conf import settings
from django.db.models import Count

# Initialize Celery app with Redis broker
app = Celery('core')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

app.conf.beat_schedule = {
    # 'update-stock-prices-every-minute': {
    #     'task': 'core.celery.update_stock_prices',
    #     'schedule': crontab(minute='*/1'),  # Run every minute
    # },
    'update-stock-prices-every-5-seconds': {
        'task': 'core.celery.update_stock_prices',
        'schedule': timedelta(seconds=5),  # Run every minute
    },
}

# Set up the SNS client and Redis client
sns_client = boto3.client('sns', aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'), aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'), region_name='us-east-1')
redis_client = redis.Redis(host=os.getenv('REDIS_HOST', 'localhost'), port=6379, db=0)
# redis_client.flushdb()  # For the current database

# Environment variables for SNS Topic ARN and API key
SNS_TOPIC_ARN = os.getenv('SNS_TOPIC_ARN')
STOCK_API_URL = "https://app.albert.com/casestudy/stock/prices/"
API_KEY = os.getenv("ALBERT_CASE_STUDY_API_KEY")

@app.task
def update_stock_prices():
    """Fetches and updates stock prices for unique tickers and notifies via SNS."""
    from casestudy.models import Watchlist

    # Check Redis for the watchlist; if not found, fetch from database and cache it
    watchlist_key = "user_watchlist"
    cached_watchlist = redis_client.get(watchlist_key)

    if cached_watchlist:
        print("Cached Watchlist", cached_watchlist)
        # Decode the cached watchlist from Redis
        user_watchlist = json.loads(cached_watchlist)
        # Ensure user_watchlist is a dictionary, even if Redis returned data in an unexpected format
        if not isinstance(user_watchlist, dict):
            print("User empty")
            user_watchlist = {}
    else:
        print("Non Cached Watchlist")
        # Fetch watchlist from the database
        watchlist_entries = Watchlist.objects.values("user_id", "ticker")
        user_watchlist = {}

        # Normalize data to {"userId": ["ticker1", "ticker2"]}
        for entry in watchlist_entries:
            user_id = entry["user_id"]
            ticker = entry["ticker"]
            if user_id not in user_watchlist:
                user_watchlist[user_id] = []
            user_watchlist[user_id].append(ticker)

        # Cache the watchlist in Redis
        redis_client.setex(watchlist_key, 3600, json.dumps(user_watchlist))  # Cache for 1 hour
        print("Stored watchlist in Redis cache.")

    # Ensure user_watchlist is a dictionary before accessing .values()
    if isinstance(user_watchlist, dict):
        # Flatten the tickers to avoid duplicates, as we need unique stock prices
        unique_tickers = {ticker for tickers in user_watchlist.values() for ticker in tickers}
    else:
        unique_tickers = set()  # Set unique_tickers to empty if user_watchlist isn't a dictionary

    if not unique_tickers:
        print("No tickers found in the watchlist.")
        return

    # Continue with the rest of the logic
    # Convert unique_tickers set to a comma-separated list
    ticker_string = ",".join(unique_tickers)

    # Fetch stock prices for unique tickers from the third-party API
    try:
        response = requests.get(
            f"{STOCK_API_URL}?tickers={ticker_string}",
            headers={"Albert-Case-Study-API-Key": API_KEY}
        )
        response.raise_for_status()  # Raise an exception for HTTP errors
        stock_prices = response.json()

        # Log the fetched stock prices for debugging
        print("Fetched stock prices:", stock_prices)

        # Cache stock prices in Redis
        with redis_client.pipeline() as pipe:
            for ticker, price in stock_prices.items():
                pipe.hset("stock_prices", ticker, json.dumps(price))
            pipe.execute()  # Execute all commands in the pipeline at once

        # Prepare the SNS message
        sns_message = json.dumps({
            "stock_prices": stock_prices,
            "user_watchlist": user_watchlist
        })

        # Publish the updated stock prices and user watchlist to SNS
        sns_client.publish(TopicArn=SNS_TOPIC_ARN, Message=sns_message)
        print("Published stock prices and watchlist to SNS.")

    except requests.exceptions.RequestException as e:
        print(f"Error fetching stock prices: {e}")
