#!/bin/bash
echo "🚀 Initializing AI Teaching Assistant..."
# Use the local path instead of /home/site/wwwroot
cd backend
gunicorn --bind=0.0.0.0 --timeout 600 run:app