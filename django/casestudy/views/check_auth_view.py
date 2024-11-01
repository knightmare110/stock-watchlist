from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

class CheckAuthView(APIView):
    permission_classes = [IsAuthenticated]  # Only accessible if the token is valid

    def get(self, request, *args, **kwargs):
        return Response({"message": "Token is valid"}, status=status.HTTP_200_OK)
