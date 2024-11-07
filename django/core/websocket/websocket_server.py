import asyncio
import json
import websockets
import redis

redis_client = redis.Redis(host='redis', port=6379, db=0)

async def notify_clients(websocket, path):
    connected_users = {}  # Map of websocket connection to user watchlists
    
    async for message in websocket:
        data = json.loads(message)
        user_watchlist = data.get("watchlist", [])
        connected_users[websocket] = user_watchlist

        # Fetch stock prices for tickers in user's watchlist
        relevant_prices = redis_client.hmget("stock_prices", user_watchlist)
        updates = dict(zip(user_watchlist, relevant_prices))
        await websocket.send(json.dumps({"type": "initial_data", "data": updates}))

        # Listen for new updates from Redis or Lambda trigger
        while True:
            # Simulate receiving update notification from Lambda
            updated_tickers = await receive_from_lambda()  # Implement this to capture Lambda trigger
            if any(ticker in user_watchlist for ticker in updated_tickers):
                relevant_prices = redis_client.hmget("stock_prices", user_watchlist)
                updates = dict(zip(user_watchlist, relevant_prices))
                await websocket.send(json.dumps({"type": "update", "data": updates}))

# Start the WebSocket server
async def main():
    async with websockets.serve(notify_clients, "0.0.0.0", 8001):
        await asyncio.Future()

asyncio.run(main())
