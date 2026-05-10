import os
import sys

# 1. DYNAMIC PATH INJECTION
# Get the absolute path of the 'backend' folder
current_dir = os.path.dirname(os.path.abspath(__file__))
# Get the project root (one level up from backend)
project_root = os.path.dirname(current_dir)

# Define the site-packages path relative to the root
lib_path = os.path.join(project_root, '.python_packages', 'lib', 'site-packages')

# Inject into sys.path
sys.path.insert(0, lib_path)
sys.path.insert(0, project_root)

# Debug print to verify in logs (Optional)
print(f"🔍 Searching for modules in: {lib_path}")

# Now import the rest
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'

from app import create_app
app = create_app()
# ... rest of your code ...

# Ensure folders exist at startup
os.makedirs(app.config.get('UPLOAD_FOLDER', 'uploads'), exist_ok=True)
os.makedirs(app.config.get('GENERATED_FOLDER', 'generated'), exist_ok=True)
os.makedirs(app.config.get('VECTOR_DB_PATH', 'vector_db'), exist_ok=True)

if __name__ == '__main__':
    app.run(debug=True, port=5000, use_reloader=False)