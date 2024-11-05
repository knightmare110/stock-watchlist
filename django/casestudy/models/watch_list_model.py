from django.db import models
from django.contrib.auth.models import User

class Watchlist(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    ticker = models.CharField(max_length=10)  # Store ticker symbol
    name = models.CharField(max_length=255)   # Store stock name

    class Meta:
        unique_together = ('user', 'ticker')  # Prevent duplicates
