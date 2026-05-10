#!/bin/bash
echo "🚀 Initializing AI Teaching Assistant..."
# Move into the backend folder where run.py is
cd backend
# Start Gunicorn
gunicorn --bind=0.0.0.0 --timeout 600 run:app