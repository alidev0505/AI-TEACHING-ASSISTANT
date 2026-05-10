#!/bin/bash
# Add the bundled packages to the Python Path
export PYTHONPATH=$PYTHONPATH:/home/site/wwwroot/.python_packages/lib/site-packages
# Start the server
gunicorn --bind=0.0.0.0 --timeout 600 --chdir backend run:app