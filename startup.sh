#!/bin/bash
# Update to python_libs
export PYTHONPATH=$PYTHONPATH:/home/site/wwwroot/python_libs/lib/site-packages
echo "🚀 Starting Gunicorn from manual startup.sh..."
cd /home/site/wwwroot/backend
gunicorn --bind=0.0.0.0 --timeout 600 run:app