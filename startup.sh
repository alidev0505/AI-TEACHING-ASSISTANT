#!/bin/bash
# 1. Add the libraries we bundled in GitHub to the Python Path
export PYTHONPATH=$PYTHONPATH:/home/site/wwwroot/.python_packages/lib/site-packages

# 2. Enter the backend directory where run.py lives
cd /home/site/wwwroot/backend

# 3. Start Gunicorn
echo "🚀 Starting Gunicorn from manual startup.sh..."
gunicorn --bind=0.0.0.0 --timeout 600 run:app