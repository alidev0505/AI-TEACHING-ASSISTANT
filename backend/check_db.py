import sqlite3
import os

# 1. DEFINE PATHS TO CHECK
# We check both common locations where Flask might hide the DB
paths = [
    'school.db',              # Root backend folder
    'app/school.db',          # Inside app folder
    'instance/school.db'      # Inside instance folder
]

print("--- 🕵️ DATABASE TRUTH TEST ---")

found_any = False

for path in paths:
    if os.path.exists(path):
        found_any = True
        print(f"\n📂 FOUND DATABASE AT: {os.path.abspath(path)}")
        
        try:
            conn = sqlite3.connect(path)
            cursor = conn.cursor()
            
            # Check the Course Table
            cursor.execute("SELECT id, name, is_attendance_locked FROM courses")
            courses = cursor.fetchall()
            
            print(f"   📊 Course Data in this file:")
            if not courses:
                print("      (Table is empty)")
            for c in courses:
                # 1=True, 0=False in SQLite
                status = "🔒 LOCKED (True)" if c[2] else "✏️ UNLOCKED (False)"
                print(f"      - Course ID {c[0]} ({c[1]}): {status}")
                
            conn.close()
        except Exception as e:
            print(f"      ❌ Error reading this file: {e}")
    else:
        print(f"❌ No file at: {path}")

if not found_any:
    print("\n😱 CRITICAL ERROR: No 'school.db' file found anywhere!")
else:
    print("\n-------------------------------------")
    print("👉 IF YOU SEE TWO FILES ABOVE, DELETE THE ONE WITH 'UNLOCKED' STATUS!")
    print("👉 IF YOU SEE 'LOCKED' HERE BUT 'UNLOCKED' ON WEB, CLEAR BROWSER CACHE (CTRL+F5)")