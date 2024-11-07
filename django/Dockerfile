# Use the official Python image
FROM python:3.11-alpine3.18

# Environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set working directory
WORKDIR /app

# Copy and install dependencies
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY . /app/

# Default command
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
