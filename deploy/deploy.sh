#!/bin/bash
set -e

echo "🚀 Starting Deployment Script..."

# 1. Pull latest code (if in git repo)
# git pull origin main

# 2. Build and Start Containers
echo "📦 Building and Starting Containers..."
docker-compose up -d --build

# 3. Clean up unused images
echo "🧹 Cleaning up..."
docker image prune -f

echo "✅ Deployment Successful!"
echo "🌍 Web: http://localhost"
echo "🔌 API: http://localhost:3000"
