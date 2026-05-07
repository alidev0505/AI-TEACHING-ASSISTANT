import os
import sys

# Disable hardware optimizations
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'

# Add project to path
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

# Move this OUTSIDE the if block so Gunicorn can see it
from app import create_app
app = create_app()

# Ensure folders exist at startup
os.makedirs(app.config.get('UPLOAD_FOLDER', 'uploads'), exist_ok=True)
os.makedirs(app.config.get('GENERATED_FOLDER', 'generated'), exist_ok=True)
os.makedirs(app.config.get('VECTOR_DB_PATH', 'vector_db'), exist_ok=True)

if __name__ == '__main__':
    print("🚀 AI Teaching Assistant Backend LIVE (Development Mode)!")
    app.run(debug=True, port=5000, use_reloader=False)