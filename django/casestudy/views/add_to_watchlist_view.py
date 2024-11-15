from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from casestudy.models import Watchlist
from django.contrib.auth.models import User
import redis
import os
import json

# Connect to Redis
redis_client = redis.Redis(host=os.getenv("REDIS_HOST", "localhost"), port=6379, db=0)

class AddToWatchlistView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        ticker = request.data.get("ticker")
        name = request.data.get("name")
        
        if not ticker or not name:
            return Response({"error": "Ticker and name are required"}, status=status.HTTP_400_BAD_REQUEST)

        # Check if already in watchlist
        if Watchlist.objects.filter(user=request.user, ticker=ticker).exists():
            return Response({"message": "Stock is already in watchlist"}, status=status.HTTP_200_OK)

        # Add to the database
        Watchlist.objects.create(user=request.user, ticker=ticker, name=name)
        
        # Update Redis cache for this user's watchlist
        user_watchlist_key = "user_watchlist"
        
        # Fetch the cached watchlist from Redis
        cached_watchlist = redis_client.get(user_watchlist_key)
        user_watchlist = json.loads(cached_watchlist) if cached_watchlist else {}

        # Ensure user-specific watchlist is a list and add the new ticker
        user_id = str(request.user.id)
        if user_id not in user_watchlist:
            user_watchlist[user_id] = []
        
        if ticker not in user_watchlist[user_id]:
            user_watchlist[user_id].append(ticker)
        
        print("ttt", user_watchlist)
        # Save the updated watchlist back to Redis
        redis_client.setex(user_watchlist_key, 3600, json.dumps(user_watchlist))  # Cache for 1 hour
        
        return Response({"message": "Added to watchlist"}, status=status.HTTP_201_CREATED)

    def get(self, request, userid):
        try:
            # Fetch the user by userid
            user = User.objects.get(id=userid)
            
            # Check if the logged-in user is the same as the one requested
            if request.user != user:
                return Response({"error": "Unauthorized access"}, status=403)
            
            # Retrieve the watchlist from the database
            watchlist_items = Watchlist.objects.filter(user=user)
            data = [{"ticker": item.ticker, "name": item.name} for item in watchlist_items]
                
            return Response(data, status=200)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)
