#!/bin/bash
# Using the absolute path where Azure mounts the package
export PYTHONPATH=$PYTHONPATH:/home/site/wwwroot/python_libs/lib/site-packages
cd /home/site/wwwroot/backend
echo "🚀 Starting Gunicorn from Zip Package..."
gunicorn --bind=0.0.0.0 --timeout 600 run:app