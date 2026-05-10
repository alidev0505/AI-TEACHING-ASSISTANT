import os
import sys

# Update this section in your backend/run.py
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
# Look for 'python_libs' instead of '.python_packages'
lib_path = os.path.join(project_root, 'python_libs', 'lib', 'site-packages')

sys.path.insert(0, lib_path)
sys.path.insert(0, project_root)
# --------------------------------

# Disable hardware optimizations
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'

from app import create_app
app = create_app()

# Ensure folders exist
os.makedirs(app.config.get('UPLOAD_FOLDER', 'uploads'), exist_ok=True)
os.makedirs(app.config.get('GENERATED_FOLDER', 'generated'), exist_ok=True)
os.makedirs(app.config.get('VECTOR_DB_PATH', 'vector_db'), exist_ok=True)

if __name__ == '__main__':
    app.run(debug=True, port=5000, use_reloader=False)