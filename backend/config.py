import os
from datetime import timedelta

class Config:
    # 1. INTELLIGENT PATH DETECTION
    # Get the folder where this file (config.py) lives
    CURRENT_FILE_DIR = os.path.abspath(os.path.dirname(__file__))
    
    # Check if we are inside 'backend/app' or just 'backend'
    if CURRENT_FILE_DIR.endswith('app'):
        # If in 'app', go up one level to find 'backend'
        BACKEND_DIR = os.path.dirname(CURRENT_FILE_DIR)
    else:
        # If already in 'backend', stay here
        BACKEND_DIR = CURRENT_FILE_DIR

    # 2. DEFINE THE INSTANCE FOLDER
    INSTANCE_DIR = os.path.join(BACKEND_DIR, 'instance')

    # 3. DATABASE CONFIGURATION
    # Force DB to be at: backend/instance/school.db
    # Use the connection string with port 6543 for better stability
    SQLALCHEMY_DATABASE_URI = 'postgresql://postgres:Admin%40super12345@db.tycwcajnnuqdxjvtqeua.supabase.co:6543/postgres?sslmode=require'
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # 4. FOLDER PATHS
    UPLOAD_FOLDER = os.path.join(BACKEND_DIR, 'uploads')
    GENERATED_FOLDER = os.path.join(BACKEND_DIR, 'generated')
    VECTOR_DB_PATH = os.path.join(BACKEND_DIR, 'vector_db')

    # 5. SECURITY KEYS
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key')
    JWT_SECRET_KEY = 'super-secret-key-change-this-in-production'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    
    MAX_CONTENT_LENGTH = 50 * 1024 * 1024
    ALLOWED_EXTENSIONS = {'pdf', 'docx', 'txt'}

    # 6. EMAIL / SMTP (for forgot-password & verification emails)
    MAIL_SERVER = 'smtp.gmail.com'
    MAIL_PORT = 587
    MAIL_USE_TLS = True
    MAIL_USERNAME = os.getenv('SMTP_EMAIL', '')
    MAIL_PASSWORD = os.getenv('SMTP_PASSWORD', '')
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173')