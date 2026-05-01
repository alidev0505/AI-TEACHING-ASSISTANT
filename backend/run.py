from dotenv import load_dotenv
load_dotenv()  # ← must be BEFORE create_app() so os.getenv() reads .env values

from app import create_app
import os

app = create_app()

if __name__ == '__main__':
    # Create necessary folders
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    os.makedirs(app.config['GENERATED_FOLDER'], exist_ok=True)
    os.makedirs(app.config['VECTOR_DB_PATH'], exist_ok=True)
    
    app.run(debug=True, port=5000, use_reloader=False)