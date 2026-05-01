import os
from dotenv import load_dotenv
from app import create_app
from app.models.models import db, User
from werkzeug.security import generate_password_hash

load_dotenv()
app = create_app()

def seed_admin():
    with app.app_context():
        admin_email = os.getenv('INITIAL_ADMIN_EMAIL')
        admin_pass = os.getenv('INITIAL_ADMIN_PASSWORD')
        admin_id = os.getenv('INITIAL_ADMIN_ID')
        admin_username = "Super Admin"

        if not admin_email or not admin_pass:
            print("❌ Error: INITIAL_ADMIN_EMAIL or PASSWORD not found in .env")
            return

        # 1. Check if a user with this EMAIL already exists
        user_by_email = User.query.filter_by(email=admin_email).first()

        if user_by_email:
            # If they exist, just update the password and role
            user_by_email.password_hash = generate_password_hash(admin_pass)
            user_by_email.role = 'admin'
            user_by_email.is_verified = True
            db.session.commit()
            print(f"🔄 Admin password and role updated for: {admin_email}")
            return

        # 2. Check if the USERNAME is taken by someone else
        user_by_username = User.query.filter_by(username=admin_username).first()
        if user_by_username:
            # If "Super Admin" is taken, change the name slightly
            admin_username = f"Admin_{admin_id}"

        # 3. Create the new Admin
        try:
            new_admin = User(
                username=admin_username,
                email=admin_email,
                role='admin',
                university_id=admin_id,
                is_verified=True,
                password_hash=generate_password_hash(admin_pass)
            )
            db.session.add(new_admin)
            db.session.commit()
            print(f"✅ Admin created successfully: {admin_email} (Username: {admin_username})")
        except Exception as e:
            db.session.rollback()
            print(f"❌ Failed to seed admin: {e}")

if __name__ == '__main__':
    seed_admin()