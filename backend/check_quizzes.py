import sqlite3
import os

# Point to the instance folder where we know the DB lives
base_dir = os.path.abspath(os.path.dirname(__file__))
db_path = os.path.join(base_dir, 'instance', 'school.db')

print(f"\n--- 🕵️ QUIZ DETECTIVE ---")
print(f"📂 Checking Database at: {db_path}")

if not os.path.exists(db_path):
    print("❌ ERROR: Database file not found!")
else:
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # 1. LIST ALL COURSES
        print("\n📚 COURSES FOUND:")
        cursor.execute("SELECT id, name FROM courses")
        courses = cursor.fetchall()
        for c in courses:
            print(f"   [ID: {c[0]}] {c[1]}")

        # 2. LIST ALL QUIZZES
        print("\n📝 QUIZZES FOUND:")
        cursor.execute("SELECT id, title, course_id FROM quizzes")
        quizzes = cursor.fetchall()
        
        if not quizzes:
            print("   ❌ NO QUIZZES FOUND IN DATABASE.")
        else:
            for q in quizzes:
                print(f"   [ID: {q[0]}] '{q[1]}' belongs to Course ID: {q[2]}")
                
        conn.close()
    except Exception as e:
        print(f"❌ Database Error: {e}")
        print("   (This usually means the 'quizzes' table doesn't exist yet.)")