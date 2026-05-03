import os
from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import Config
from app.models.models import db

# Import Blueprints
from app.routes.admin import admin_bp
from app.routes.notifications import notify_bp
from app.routes.quiz_routes import quiz_bp
from app.routes.auth import auth_bp
from app.routes.upload import upload_bp
from app.routes.content import content_bp
from app.routes.dashboard import dashboard_bp
from app.routes.student import student_bp 

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # 1. UPDATED CORS FIX
    # Added your Vercel URL so the browser allows the login request
    CORS(app, resources={
        r"/*": {
            "origins": [
                "http://localhost:5173", 
                "https://ai-teaching-assistant-ecru.vercel.app"
            ]
        }
    }, supports_credentials=True)

    # Initialize Extensions
    JWTManager(app)
    db.init_app(app)

    # Register Blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(upload_bp, url_prefix='/api/upload')
    app.register_blueprint(content_bp, url_prefix='/api/content')
    app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(notify_bp, url_prefix='/api/notifications')
    app.register_blueprint(quiz_bp, url_prefix='/api/quiz')
    app.register_blueprint(student_bp, url_prefix='/api/student')

    with app.app_context():
        # create_all() is safe; it won't delete your existing Supabase data
        db.create_all()
        
        # 2. CLEANER MIGRATION (PostgreSQL Compatible)
        # Removed PRAGMA to stop the syntax errors in your logs
        try:
            from sqlalchemy import text
            with db.engine.connect() as conn:
                # This block will now silently skip if columns exist in PostgreSQL
                migrations = {
                    'department':      "ALTER TABLE users ADD COLUMN IF NOT EXISTS department VARCHAR(100)",
                    'bio':             "ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT",
                    'profile_picture': "ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture TEXT",
                }
                for col, sql in migrations.items():
                    conn.execute(text(sql))
                conn.commit()
        except Exception as e:
            # We print this but don't let it stop the server
            print(f"ℹ️ Migration info: {e}")

    return app