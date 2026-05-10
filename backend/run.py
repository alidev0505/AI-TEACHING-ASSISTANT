import os
import sys

# 1. FORCE PATH DETECTION (Add this at the very top)
# This tells Python to look for libraries in the root where we will install them
base_dir = os.path.abspath(os.path.dirname(__file__))
sys.path.append(base_dir)
sys.path.append(os.path.join(base_dir, ".python_packages/lib/site-packages"))

# Disable hardware optimizations
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'

from app import create_app
app = create_app()

# Ensure folders exist at startup
os.makedirs(app.config.get('UPLOAD_FOLDER', 'uploads'), exist_ok=True)
os.makedirs(app.config.get('GENERATED_FOLDER', 'generated'), exist_ok=True)
os.makedirs(app.config.get('VECTOR_DB_PATH', 'vector_db'), exist_ok=True)

if __name__ == '__main__':
    app.run(debug=True, port=5000, use_reloader=False)