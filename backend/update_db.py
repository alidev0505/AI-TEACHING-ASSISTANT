import sqlite3
import os

# Path to your database
db_path = os.path.join('instance', 'school.db')

def update_database():
    try:
        # 1. Connect to the database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        print(f"Checking database at {db_path}...")

        # 2. Add the course_id column to generated_content
        # We use a try-except here in case the column already exists
        try:
            cursor.execute("ALTER TABLE generated_content ADD COLUMN course_id INTEGER REFERENCES courses(id);")
            print("✅ Column 'course_id' added successfully.")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e).lower():
                print("ℹ️ Column 'course_id' already exists.")
            else:
                raise e

        # 3. Update existing records to link them to their courses
        # (This joins the materials table to find the correct course_id)
        cursor.execute("""
            UPDATE generated_content 
            SET course_id = (
                SELECT course_id FROM materials 
                WHERE materials.id = generated_content.material_id
            )
            WHERE course_id IS NULL;
        """)
        print(f"✅ Updated {conn.total_changes} existing rows with correct course IDs.")

        # 4. Commit and close
        conn.commit()
        conn.close()
        print("🚀 Database migration complete! You can delete this script now.")

    except Exception as e:
        print(f"❌ Error updating database: {e}")

if __name__ == "__main__":
    update_database()