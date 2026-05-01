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
# ✅ IMPORT THE NEW STUDENT BLUEPRINT
from app.routes.student import student_bp 

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # 1. DATABASE FOLDER FIX
    try:
        db_uri = app.config['SQLALCHEMY_DATABASE_URI']
        if db_uri.startswith('sqlite:///'):
            path = db_uri.replace('sqlite:///', '')
            folder = os.path.dirname(path)
            if folder and not os.path.exists(folder):
                os.makedirs(folder)
    except:
        pass

    # 2. CORS FIX (CLEAN VERSION)
    CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}}, supports_credentials=True)

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
    
    # ✅ REGISTER THE NEW BLUEPRINT
    app.register_blueprint(student_bp, url_prefix='/api/student')

    with app.app_context():
        db.create_all()
        # Auto-migrate: add new columns if they don't exist yet (safe for SQLite)
        try:
            from sqlalchemy import text
            with db.engine.connect() as conn:
                existing = [row[1] for row in conn.execute(text("PRAGMA table_info(users)")).fetchall()]
                migrations = {
                    'department':      "ALTER TABLE users ADD COLUMN department VARCHAR(100)",
                    'bio':             "ALTER TABLE users ADD COLUMN bio TEXT",
                    'profile_picture': "ALTER TABLE users ADD COLUMN profile_picture TEXT",
                }
                for col, sql in migrations.items():
                    if col not in existing:
                        conn.execute(text(sql))
                        conn.commit()
                        print(f"✅ Migrated: added '{col}' column to users table")
        except Exception as e:
            print(f"⚠️  Auto-migration warning: {e}")

    return app