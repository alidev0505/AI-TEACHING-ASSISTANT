#!/bin/bash
# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

echo "🚀 App Root detected at: $SCRIPT_DIR"

# Set the PYTHONPATH to include the standard Azure environment
export PYTHONPATH=$PYTHONPATH:$SCRIPT_DIR/backend

# Move to the backend folder relative to this script
cd "$SCRIPT_DIR/backend"

echo "🚀 Starting Gunicorn..."
gunicorn --bind=0.0.0.0:8000 --timeout 600 run:app