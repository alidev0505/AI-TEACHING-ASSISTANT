print("🚀 Script starting...") 

from app import create_app
from app.models.models import db, Semester 
from datetime import date

print("✅ Imports successful. Initializing App...") 

app = create_app()

with app.app_context():
    print("💾 Creating database tables (if missing)...")
    db.create_all()  # <--- THIS IS CRITICAL for a fresh database

    print("🔍 Checking existing semesters...")
    if not Semester.query.first():
        print("🌱 No semester found. Creating 'Fall 2025'...")
        
        default_sem = Semester(
            name="Fall 2025",
            academic_year="2025-2026",
            start_date=date(2025, 9, 1),
            end_date=date(2026, 1, 30),
            is_active=True
        )
        
        db.session.add(default_sem)
        db.session.commit()
        print("✅ Success: Created 'Fall 2025' (ID: 1)")
    else:
        print("⚠️ A semester already exists. No changes made.")