import os
from datetime import timedelta

class Config:
    # Use absolute paths that work on Linux
    BACKEND_DIR = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
    
    # DATABASE CONFIGURATION
    SQLALCHEMY_DATABASE_URI = 'postgresql://postgres.tycwcajnnuqdxjvtqeua:Admin%40super12345@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres'
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # FOLDER PATHS - Use /tmp for temporary Azure storage if needed
    UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads')
    GENERATED_FOLDER = os.path.join(os.getcwd(), 'generated')
    VECTOR_DB_PATH = os.path.join(os.getcwd(), 'vector_db')

    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key')
    JWT_SECRET_KEY = 'super-secret-key-change-this-in-production'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    
    MAX_CONTENT_LENGTH = 50 * 1024 * 1024
    ALLOWED_EXTENSIONS = {'pdf', 'docx', 'txt'}

    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173')