from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from casestudy.models import Watchlist
from django.contrib.auth.models import User

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

        # Add to watchlist
        Watchlist.objects.create(user=request.user, ticker=ticker, name=name)
        return Response({"message": "Added to watchlist"}, status=status.HTTP_201_CREATED)

    def get(self, request, username):
        try:
            # Fetch the user by username
            user = User.objects.get(username=username)
            
            # Check if the logged-in user is the same as the one requested
            if request.user != user:
                return Response({"error": "Unauthorized access"}, status=403)
            
            # Retrieve watchlist items for the user
            watchlist_items = Watchlist.objects.filter(user=user)
            data = [{"ticker": item.ticker, "name": item.name} for item in watchlist_items]
            return Response(data, status=200)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)
