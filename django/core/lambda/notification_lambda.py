import json
import boto3
import requests
import os

# Set the WebSocket URL from environment variables
websocket_url = os.getenv("WEBSOCKET_URL")

def lambda_handler(event, context):
    for record in event['Records']:
        message = json.loads(record['body'])
        updated_tickers = list(message.keys())
        
        # Send a POST request to the WebSocket server to notify about updated tickers
        response = requests.post(websocket_url, json={"updated_tickers": updated_tickers})
        
        if response.status_code == 200:
            print("WebSocket server notified successfully.")
        else:
            print("Failed to notify WebSocket server:", response.status_code, response.text)
