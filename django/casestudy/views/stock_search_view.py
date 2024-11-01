# views.py

import requests
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.conf import settings

class StockSearchView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Get the query parameter from the request
        search_query = request.query_params.get("query", "")
        
        # Set up headers with the Albert Case Study API Key
        headers = {
            "Albert-Case-Study-API-Key": settings.ALBERT_CASE_STUDY_API_KEY,
        }
        
        # Make a request to the external stock API
        try:
            response = requests.get(
                "https://app.albert.com/casestudy/stock/tickers/",
                headers=headers,
                params={"query": search_query},
            )
            response.raise_for_status()  # Raise an error for HTTP errors
            
            # Return the JSON response from the external API
            return Response(response.json(), status=response.status_code)
        except requests.RequestException as e:
            return Response(
                {"error": "Unable to fetch stock data"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
