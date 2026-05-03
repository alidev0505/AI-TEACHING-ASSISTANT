import os
import sys

# Disable hardware optimizations that cause segmentation faults
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'

if __name__ == '__main__':
    # Add project to path
    sys.path.append(os.path.abspath(os.path.dirname(__file__)))
    
    # LAZY IMPORT: Only import the app once inside the main block
    print("🔄 Loading modules one by one to prevent conflicts...")
    from app import create_app
    app = create_app()

    # Folders for your AI Teaching Assistant
    os.makedirs(app.config.get('UPLOAD_FOLDER', 'uploads'), exist_ok=True)
    os.makedirs(app.config.get('GENERATED_FOLDER', 'generated'), exist_ok=True)
    os.makedirs(app.config.get('VECTOR_DB_PATH', 'vector_db'), exist_ok=True)
    
    print("🚀 AI Teaching Assistant Backend LIVE!")
    app.run(debug=True, port=5000, use_reloader=False)