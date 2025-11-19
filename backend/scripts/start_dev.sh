#!/bin/bash

echo "Starting Reel Genie Backend Development Environment"
echo "===================================================="

# Check if .env exists
if [ ! -f .env ]; then
    echo "Error: .env file not found. Copy .env.example to .env and configure it."
    exit 1
fi

# Start services with docker-compose
echo "Starting PostgreSQL and Redis..."
docker-compose up -d postgres redis

# Wait for services to be ready
echo "Waiting for services to be ready..."
sleep 5

# Run migrations
echo "Running database migrations..."
alembic upgrade head

# Initialize database
echo "Initializing database..."
python scripts/init_db.py

# Start all services
echo "Starting all services..."
docker-compose up api celery_worker celery_beat flower
