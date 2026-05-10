import os
import sys

# --- DYNAMIC LIBRARY INJECTION ---
# 1. Get the directory where run.py is currently located
current_dir = os.path.dirname(os.path.abspath(__file__))
# 2. Go up one level to the project root
project_root = os.path.dirname(current_dir)
# 3. Target the .python_packages folder relative to the root
lib_path = os.path.join(project_root, '.python_packages', 'lib', 'site-packages')

# 4. Insert these into the system path so Python finds your libraries first
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