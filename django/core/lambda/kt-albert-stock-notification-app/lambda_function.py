import json
import boto3
import http.client
from urllib.parse import urlparse

def lambda_handler(event, context):
    # Define AppSync API endpoint and API key
    api_url = "https://byknpead3jdqvdgcw6vsvgc6um.appsync-api.us-east-1.amazonaws.com/graphql"
    api_key = "da2-tstrgruhtfhynhssgtj5ljbhe4"
    
    # Check if 'Records' exists in the event
    if 'Records' not in event:
        print("Unexpected event structure:", json.dumps(event))
        return {
            "statusCode": 400,
            "body": json.dumps("Invalid event format: 'Records' field is missing.")
        }
    
    # Parse the URL for making HTTPS requests
    url = urlparse(api_url)
    connection = http.client.HTTPSConnection(url.netloc)
    
    # Loop through each record in the event
    for record in event['Records']:
        # Get the message body (SQS message content is stored in 'body')
        message_body = record.get('body')
        
        if message_body is None:
            print("Missing 'body' in record:", json.dumps(record))
            continue
        
        # Parse the message body as JSON
        try:
            message = json.loads(message_body)
            # Extract the inner message from the SNS payload
            sns_message = json.loads(message.get('Message', '{}'))
        except json.JSONDecodeError:
            print(f"Failed to decode message: {message_body}")
            continue
        
        print("SNS Message:", sns_message)

        # Extract stock prices and user watchlist from the SNS message
        stock_prices = sns_message.get("stock_prices", {})
        user_watchlist = sns_message.get("user_watchlist", {})
        
        # Log received data for debugging
        print("Received stock prices:", stock_prices)
        print("Received user watchlist:", user_watchlist)
        
        # Send stock updates for each user's watchlist
        for user_id, watchlist in user_watchlist.items():
            # Filter stock prices for this user’s watchlist tickers
            user_stock_data = {ticker: stock_prices[ticker] for ticker in watchlist if ticker in stock_prices}
            
            if not user_stock_data:
                print(f"No stock data available for user {user_id}. Skipping.")
                continue
            
            # Define the GraphQL mutation for AppSync
            mutation = """
                mutation publish($name: String!, $data: AWSJSON!) {
                    publish(name: $name, data: $data) {
                        name
                        data
                    }
                }
            """
            
            # Set up variables for AppSync mutation
            variables = {
                "name": f"user_{user_id}_channel",
                "data": json.dumps(user_stock_data)  # Convert user_stock_data dictionary to JSON string
            }
            
            # Prepare the request payload
            payload = json.dumps({
                "query": mutation,
                "variables": variables
            })

            print("Payload:", payload)
            
            headers = {
                "Content-Type": "application/json",
                "x-api-key": api_key
            }
            
            # Make the HTTP request to AppSync
            try:
                connection.request("POST", url.path, body=payload, headers=headers)
                response = connection.getresponse()
                response_data = response.read().decode()
                print("Response from AppSync:", response_data)
                
                response_json = json.loads(response_data)
                if 'errors' in response_json:
                    print("Errors from AppSync:", response_json['errors'])
                else:
                    print("Success response from AppSync:", response_json['data'])
                    
            except Exception as e:
                print(f"Failed to send mutation to AppSync for user {user_id}: {e}")
    
    # Close the connection
    connection.close()
    
    print("Lambda execution completed")

    return {
        "statusCode": 200,
        "body": json.dumps("Processed messages")
    }
