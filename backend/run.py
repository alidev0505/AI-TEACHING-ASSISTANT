import os
import sys

# Disable hardware optimizations
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'

from app import create_app

app = create_app()

# Ensure folders exist relative to the current running directory
# This is better for Azure's file system
basedir = os.path.abspath(os.path.dirname(__file__))
os.makedirs(os.path.join(basedir, app.config.get('UPLOAD_FOLDER', 'uploads')), exist_ok=True)
os.makedirs(os.path.join(basedir, app.config.get('GENERATED_FOLDER', 'generated')), exist_ok=True)
os.makedirs(os.path.join(basedir, app.config.get('VECTOR_DB_PATH', 'vector_db')), exist_ok=True)

if __name__ == '__main__':
    # On Azure, Gunicorn handles the port, so this is mainly for local testing
    app.run(debug=True, port=5000, use_reloader=False)
# Force Deployment: 05/11/2026 00:55:56
