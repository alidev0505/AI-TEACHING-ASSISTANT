from sqlalchemy import create_engine, text
import random

# Your DB URL
DB_URL = "postgresql://postgres:12345@localhost:5432/ai_teacher_db"

print(f"Connecting to: {DB_URL}")

try:
    engine = create_engine(DB_URL)
    with engine.connect() as conn:
        print("Adding class_code column...")
        # Add column
        conn.execute(text("ALTER TABLE courses ADD COLUMN IF NOT EXISTS class_code VARCHAR(10);"))
        conn.commit()
        
        # Generate codes for existing courses
        print("Generating codes for existing courses...")
        result = conn.execute(text("SELECT id FROM courses WHERE class_code IS NULL"))
        courses = result.fetchall()
        
        for row in courses:
            # Generate random 4-digit code (e.g., 4567)
            new_code = str(random.randint(1000, 9999))
            conn.execute(text("UPDATE courses SET class_code = :code WHERE id = :id"), 
                         {"code": new_code, "id": row[0]})
        
        conn.commit()
        
        # Now make it unique
        conn.execute(text("ALTER TABLE courses ADD CONSTRAINT unique_class_code UNIQUE (class_code);"))
        conn.commit()
        
        print("SUCCESS! Class codes added.")

except Exception as e:
    print(f"Error: {e}")