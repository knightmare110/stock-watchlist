# core/celery_app.py

import os
import json
import requests
import boto3
import redis
from celery import Celery
from celery.schedules import crontab
from django.conf import settings
from django.db.models import Count

# Initialize Celery app with Redis broker (using 'redis' as host in Docker)
app = Celery('core')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

app.conf.beat_schedule = {
    'update-stock-prices-every-5-seconds': {
        'task': 'core.celery.update_stock_prices',  # Full path to the Celery task
        'schedule': crontab(minute='*/1'),  # Run every 5 seconds
    },
}

# Set up the SNS client and Redis client using environment variables
sns_client = boto3.client('sns', aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'), aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'), region_name='us-east-1')
redis_client = redis.Redis(host=os.getenv('REDIS_HOST', 'redis'), port=6379, db=0)

# Environment variables for SNS Topic ARN and API key
SNS_TOPIC_ARN = os.getenv('SNS_TOPIC_ARN')
STOCK_API_URL = "https://app.albert.com/casestudy/stock/prices/"
API_KEY = os.getenv("ALBERT_CASE_STUDY_API_KEY")

@app.task
def update_stock_prices():
    """Fetches and updates stock prices for unique tickers and notifies via SNS."""
    # Import Watchlist model within the task to avoid AppRegistryNotReady issues
    from casestudy.models import Watchlist
    
    # Query unique tickers from the Watchlist model
    unique_tickers = (
        Watchlist.objects.values('ticker')  # Adjust field name as needed
        .annotate(count=Count('ticker'))
        .values_list('ticker', flat=True)
    )
    if not unique_tickers:
        return

    # Convert unique_tickers queryset to a comma-separated list
    ticker_string = ",".join(unique_tickers)
    print("Unique tickers:" + ticker_string)
    print("Unique API:" + API_KEY)

    # Fetch stock prices for unique tickers in a single API call
    try:
        response = requests.get(
            f"{STOCK_API_URL}?tickers={ticker_string}", 
            headers={"Albert-Case-Study-API-Key": API_KEY}
        )
        response.raise_for_status()  # Raise an exception for HTTP errors
        stock_prices = response.json()

        print(stock_prices)

        # Cache prices in Redis using `hset` (modern Redis API)
        with redis_client.pipeline() as pipe:
            for ticker, price in stock_prices.items():
                print("Ticker" + ticker + "DD:" + json.dumps(price))
                pipe.hset("stock_prices", ticker, json.dumps(price))
            pipe.execute()  # Execute all commands in the pipeline at once
        

        print("Before SNS:")
        # Notify SNS about the update
        sns_message = json.dumps(stock_prices)
        print("Before SNS1:" + sns_message)
        sns_client.publish(TopicArn=SNS_TOPIC_ARN, Message=sns_message)
        print("Stock prices updated and SNS notification sent.")
    
    except requests.exceptions.RequestException as e:
        print(f"Error fetching stock prices: {e}")
