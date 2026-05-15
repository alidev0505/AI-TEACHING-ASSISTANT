from flask import Blueprint, jsonify, request, make_response
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.models import db, User, Course, Material, Announcement, CourseFeedback, Assignment, Submission, Semester, Attendance, Quiz, QuizSubmission, ReportLog
from datetime import datetime, timedelta
from sqlalchemy import func
from werkzeug.security import generate_password_hash
import random
import csv
import io
import secrets
import string
from io import StringIO

admin_bp = Blueprint('admin', __name__)

# --- Helper: Check if current user is Admin ---
def check_admin():
    try:
        user_id = get_jwt_identity()
        if not user_id: return False
        user = User.query.get(user_id)
        if not user or user.role != 'admin':
            return False
        return True
    except:
        return False

# --- HELPER FUNCTIONS ---

def generate_email(name):
    # "Syed Adeel Hussain Shah" -> "syed.adeel.hussain.shah@university.edu"
    clean_name = name.lower().strip().replace(" ", ".")
    return f"{clean_name}@university.edu"

def generate_temp_password():
    # Random secure password
    alphabet = string.ascii_letters + string.digits + "!@#"
    return ''.join(secrets.choice(alphabet) for i in range(10))

def parse_time(time_str):
    # Converts "12:00 PM" to a datetime object for comparison
    try:
        return datetime.strptime(time_str.strip(), '%I:%M %p')
    except:
        return None

def check_time_conflict(teacher_id, day, new_in_str, new_out_str):
    # Check if this teacher is already busy at this time
    existing_courses = Course.query.filter_by(teacher_id=teacher_id, day=day).all()
    
    new_start = parse_time(new_in_str)
    new_end = parse_time(new_out_str)
    
    if not new_start or not new_end:
        return None # Skip check if format is weird

    for c in existing_courses:
        if c.time_in and c.time_out:
            exist_start = parse_time(c.time_in)
            exist_end = parse_time(c.time_out)
            
            if exist_start and exist_end:
                # Conflict Logic: (StartA < EndB) and (EndA > StartB)
                if new_start < exist_end and new_end > exist_start:
                    return f"Conflict with {c.class_code} ({c.time_in} - {c.time_out})"
    return None

# --- MAIN UPLOAD ROUTE ---

# --- UPDATE IN admin.py ---

@admin_bp.route('/upload-schedule', methods=['POST'])
@jwt_required()
def upload_schedule_csv():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    # Read and Decode with 'utf-8-sig' to remove Excel's BOM markers
    try:
        file_bytes = file.stream.read()
        try:
            decoded_file = file_bytes.decode('utf-8-sig')
        except UnicodeDecodeError:
            decoded_file = file_bytes.decode('latin-1')

        stream = io.StringIO(decoded_file, newline=None)
        csv_input = csv.DictReader(stream)
    except Exception as e:
        return jsonify({'error': f'Failed to read CSV: {str(e)}'}), 400

    report = {'created_teachers': [], 'courses_assigned': 0, 'conflicts': [], 'errors': []}

    # ✅ FIX 1: Fetch active semester BEFORE looping. Guarantees non-null semester_id
    active_semester = Semester.query.filter_by(is_active=True).first() or Semester.query.first()
    if not active_semester:
        return jsonify({'error': 'No active semester found. Please create a semester in the admin panel first.'}), 400
    
    sem_id = active_semester.id

    try:
        for row_num, row in enumerate(csv_input, start=1):
            # ✅ FIX 2: Strip outer spacing AND swap hidden newlines (\n) out of headers
            clean_row = {k.replace('\n', ' ').strip(): v.strip() for k, v in row.items() if k}

            instructor_name = clean_row.get('Instructor')
            institute_code = clean_row.get('Course Code')  # Safely matches your file's "Course\nCode"
            course_name = clean_row.get('Course Name')
            
            # Skip empty rows smoothly
            if not instructor_name or not course_name:
                continue

            day = clean_row.get('Day')
            time_in = clean_row.get('Time In')
            time_out = clean_row.get('Time Out')
            semester_val = clean_row.get('Semester')

            # 2. TEACHER LOGIC
            email = generate_email(instructor_name)
            teacher = User.query.filter_by(email=email).first()
            
            if not teacher:
                current_year = datetime.now().year
                clean_name_pass = instructor_name.replace(" ", "").replace(".", "")
                temp_pass = f"${clean_name_pass}@{current_year}"

                teacher = User(
                    username=instructor_name,
                    email=email,
                    role='teacher',
                    is_verified=True,
                    password_hash=generate_password_hash(temp_pass)
                )
                db.session.add(teacher)
                db.session.flush() # Sync with session to get teacher.id immediately
                
                report['created_teachers'].append({
                    'name': instructor_name, 'email': email, 'password': temp_pass
                })

            # 3. COURSE LOGIC
            course = Course.query.filter_by(name=course_name, semester_code=semester_val).first()
            
            if not course:
                unique_class_code = str(random.randint(10000, 99999))
                while Course.query.filter_by(class_code=unique_class_code).first():
                    unique_class_code = str(random.randint(10000, 99999))

                course = Course(
                    name=course_name,
                    course_catalog_code=institute_code,
                    class_code=unique_class_code,
                    teacher_id=teacher.id,
                    semester_id=sem_id,  # ✅ FIX 3: Assigning verified parent semester ID
                    program=clean_row.get('Program'),
                    semester_code=semester_val,
                    shift=clean_row.get('Shift'),
                    credit_hours=clean_row.get('Credit Hours'),  # Safely matches your file's "Credit\nHours"
                    day=day,
                    time_in=time_in,
                    time_out=time_out,
                    room=clean_row.get('Room')
                )
                db.session.add(course)
                report['courses_assigned'] += 1
            else:
                # Update existing rows safely
                course.teacher_id = teacher.id
                course.day = day
                course.time_in = time_in
                course.time_out = time_out
                course.room = clean_row.get('Room')

        db.session.commit()
        return jsonify({'message': 'Batch process complete', 'report': report}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
    
# ==========================================
# 2. SYSTEM OVERVIEW (Analytics)
# ==========================================

@admin_bp.route('/overview', methods=['GET'])
@jwt_required()
def get_overview():
    if not check_admin(): return jsonify({'error': 'Unauthorized'}), 403

    try:
        # 1. KPI Counts
        students_count = User.query.filter_by(role='student').count()
        teachers_count = User.query.filter_by(role='teacher').count()
        courses_count = Course.query.count()
        submissions_count = Submission.query.count()

        # 2. Recent Activity - New Users
        recent_users_query = User.query.order_by(User.id.desc()).limit(5).all()
        recent_users_list = [{
            'username': u.username, 
            'role': u.role, 
            'date': 'Recently' 
        } for u in recent_users_query]

        # 3. Recent Activity - Submissions
        recent_subs_query = Submission.query.order_by(Submission.submitted_at.desc()).limit(5).all()
        recent_subs_list = []
        for sub in recent_subs_query:
            recent_subs_list.append({
                'student': sub.student.username if sub.student else 'Unknown',
                'assignment': sub.assignment.title if sub.assignment else 'Task',
                'date': sub.submitted_at.strftime('%Y-%m-%d')
            })

        # 4. CHART DATA (Last 7 Days)
        chart_data = []
        today = datetime.utcnow().date()
        
        for i in range(6, -1, -1):
            day = today - timedelta(days=i)
            start_of_day = datetime.combine(day, datetime.min.time())
            end_of_day = datetime.combine(day, datetime.max.time())
            
            count = Submission.query.filter(
                Submission.submitted_at >= start_of_day,
                Submission.submitted_at <= end_of_day
            ).count()
            
            chart_data.append({
                'name': day.strftime('%a'),
                'submissions': count
            })

        return jsonify({
            'kpi': {
                'students': students_count,
                'teachers': teachers_count,
                'courses': courses_count,
                'submissions': submissions_count
            },
            'activity': {
                'new_users': recent_users_list,
                'submissions': recent_subs_list
            },
            'chart': chart_data
        }), 200

    except Exception as e:
        print(f"❌ ADMIN OVERVIEW ERROR: {e}") 
        return jsonify({'error': str(e)}), 500

# ==========================================
# 3. USER MANAGEMENT
# ==========================================

@admin_bp.route('/users', methods=['GET'])
@jwt_required()
def get_users():
    if not check_admin(): return jsonify({'error': 'Unauthorized'}), 403

    users = User.query.order_by(User.id.desc()).all()
    return jsonify({
        'users': [{
            'id': u.id,
            'username': u.username,
            'email': u.email,
            'role': u.role
        } for u in users]
    }), 200

@admin_bp.route('/users/<int:user_id>', methods=['PUT'])
@jwt_required()
def update_user_role(user_id):
    if not check_admin(): return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.get_json()
    user = User.query.get(user_id)
    if not user: return jsonify({'error': 'User not found'}), 404
    
    if 'role' in data:
        user.role = data['role']
    
    db.session.commit()
    return jsonify({'message': 'User updated successfully'}), 200

@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    if not check_admin(): return jsonify({'error': 'Unauthorized'}), 403
    
    user = User.query.get(user_id)
    if user:
        current_id = int(get_jwt_identity())
        if user.id == current_id:
            return jsonify({'error': 'Cannot delete your own admin account'}), 400
            
        db.session.delete(user)
        db.session.commit()
    return jsonify({'message': 'User deleted'}), 200

# ==========================================
# 4. COURSE MANAGEMENT (Fixed Logic)
# ==========================================

@admin_bp.route('/courses', methods=['GET'])
@jwt_required()
def get_all_courses_admin():
    if not check_admin(): return jsonify({'error': 'Unauthorized'}), 403

    courses = Course.query.all()
    output = []
    for course in courses:
        # ✅ FIX: Format the time string correctly
        display_time = None
        if course.time_in:
            display_time = course.time_in
            # Append time_out only if it exists
            if course.time_out:
                display_time += f" - {course.time_out}"

        output.append({
            'id': course.id,
            'name': course.name,
            'class_code': course.class_code,
            'teacher_name': course.teacher.username if course.teacher else "No Teacher",
            'teacher_email': course.teacher.email if course.teacher else "N/A",
            'is_attendance_locked': course.is_attendance_locked,
            'student_count': len(course.enrollments),
            
            # Metadata fields
            'course_catalog_code': course.course_catalog_code, 
            'program': course.program,        
            'semester_code': course.semester_code, 
            'shift': course.shift,            
            'room': course.room,              
            
            # ✅ ADDED: Explicit Day and Time for the Class Schedule page
            'day': course.day,
            'time': display_time 
        })
        
    return jsonify({'courses': output}), 200

@admin_bp.route('/course/<int:course_id>', methods=['DELETE'])
@jwt_required()
def delete_course(course_id):
    if not check_admin(): return jsonify({'error': 'Unauthorized'}), 403
    
    course = Course.query.get(course_id)
    if not course: return jsonify({'error': 'Course not found'}), 404

    try:
        # 1. Delete Attendance
        Attendance.query.filter_by(course_id=course.id).delete()
        
        # 2. Delete Assignments & Submissions
        assignments = Assignment.query.filter_by(course_id=course.id).all()
        for asn in assignments:
            Submission.query.filter_by(assignment_id=asn.id).delete()
            db.session.delete(asn)

        # 3. Delete Materials
        Material.query.filter_by(course_id=course.id).delete()

        # 4. Clear Students (Enrollments)
        course.students = [] 

        # 5. Delete Course
        db.session.delete(course)
        db.session.commit()
        return jsonify({'message': 'Course deleted'}), 200

    except Exception as e:
        db.session.rollback()
        print(f"Error deleting course: {e}")
        return jsonify({'error': 'Failed to delete course'}), 500

# ==========================================
# 5. SEMESTER MANAGEMENT
# ==========================================

@admin_bp.route('/semesters', methods=['GET'])
@jwt_required()
def get_semesters():
    semesters = Semester.query.order_by(Semester.id.desc()).all()
    output = [{
        'id': s.id,
        'name': s.name,
        'academic_year': s.academic_year,
        'start_date': s.start_date,
        'end_date': s.end_date,
        'is_active': s.is_active
    } for s in semesters]
    return jsonify({'semesters': output}), 200

@admin_bp.route('/semester', methods=['POST'])
@jwt_required()
def create_semester():
    if not check_admin(): return jsonify({'error': 'Unauthorized'}), 403
    data = request.get_json()
    
    new_sem = Semester(
        name=data['name'],
        academic_year=data['academic_year'],
        start_date=data['start_date'],
        end_date=data['end_date'],
        is_active=True
    )
    db.session.add(new_sem)
    db.session.commit()
    return jsonify({'message': 'Created'}), 201

@admin_bp.route('/semester/<int:id>/toggle', methods=['PUT'])
@jwt_required()
def toggle_semester(id):
    if not check_admin(): return jsonify({'error': 'Unauthorized'}), 403
    sem = Semester.query.get(id)
    if sem:
        sem.is_active = not sem.is_active
        db.session.commit()
        return jsonify({'message': 'Updated'}), 200
    return jsonify({'error': 'Not found'}), 404

# ==========================================
# 6. ATTENDANCE & REPORTS
# ==========================================

@admin_bp.route('/course/<int:course_id>/unlock', methods=['PUT'])
@jwt_required()
def unlock_attendance(course_id):
    if not check_admin(): return jsonify({'error': 'Unauthorized'}), 403
    course = Course.query.get(course_id)
    if course:
        course.is_attendance_locked = False
        db.session.commit()
        return jsonify({'message': 'Unlocked'}), 200
    return jsonify({'error': 'Not found'}), 404

@admin_bp.route('/course/<int:course_id>/export_attendance', methods=['GET'])
def export_attendance_excel(course_id):
    # Public route (or add token query param logic) for file download
    course = Course.query.get(course_id)
    if not course: return jsonify({'error': 'Not found'}), 404
    
    records = Attendance.query.filter_by(course_id=course_id).all()
    
    si = StringIO()
    cw = csv.writer(si)
    cw.writerow(['Date', 'Student', 'Status'])
    
    for r in records:
        s = User.query.get(r.student_id)
        cw.writerow([r.date, s.username if s else 'Unknown', r.status])

    output = make_response(si.getvalue())
    output.headers["Content-Disposition"] = f"attachment; filename=Attendance_{course_id}.csv"
    output.headers["Content-type"] = "text/csv"
    return output

@admin_bp.route('/reports', methods=['GET'])
def get_reports():
    # Fetch logs or return dummy data
    logs = ReportLog.query.order_by(ReportLog.date.desc()).all()
    if not logs:
        return jsonify({'reports': [
            {"date": "2025-01-01", "generations": 10, "users": 5},
            {"date": "2025-01-02", "generations": 20, "users": 8}
        ]}), 200
        
    return jsonify({'reports': [
        {"date": l.date, "generations": l.generations, "users": l.users} for l in logs
    ]}), 200

# ✅ FIXED: Use @jwt_required() instead of @token_required
@admin_bp.route('/course/<int:course_id>/schedule', methods=['PUT'])
@jwt_required()  # <--- Changed this
def update_course_schedule(course_id):  # <--- Removed 'current_user' argument
    # 1. Admin Check
    if not check_admin():
        return jsonify({'error': 'Unauthorized access'}), 403

    # 2. Find Course
    course = Course.query.get(course_id)
    if not course:
        return jsonify({'error': 'Course not found'}), 404

    # 3. Update Data
    data = request.json
    
    if 'day' in data:
        course.day = data['day']
        
    if 'time' in data:
        # Save the time sent from frontend into 'time_in'
        course.time_in = data['time'] 
        # Optional: You can clear time_out or calculate it if needed
        # course.time_out = ... 

    if 'room' in data:
        course.room = data['room']

    # 4. Save to DB
    try:
        db.session.commit()
        return jsonify({'message': 'Schedule updated successfully!'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
    
# ... existing imports ...

@admin_bp.route('/export-schedule', methods=['GET'])
@jwt_required()
def export_final_schedule():
    if not check_admin(): return jsonify({'error': 'Unauthorized'}), 403

    # 1. Fetch all courses
    courses = Course.query.all()

    # 2. SORTING LOGIC (Structured Data)
    # Sort by: Semester Code -> Day -> Start Time
    # We use a helper dict to sort Days correctly (Mon, Tue...) instead of Alphabetically (Fri, Mon...)
    day_order = {
        'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 
        'Thursday': 4, 'Friday': 5, 'Saturday': 6, 'Sunday': 7,
        '': 8, None: 8, 'Not Set': 8
    }

    courses.sort(key=lambda x: (
        x.semester_code or "Z",          # Group by Semester first
        day_order.get(x.day, 8),         # Then by Day of week
        x.time_in or "23:59"             # Then by Time
    ))

    # 3. Create CSV in memory
    si = StringIO()
    cw = csv.writer(si)
    
    # 4. Write Headers
    cw.writerow(['Course Code', 'Course Name', 'Instructor', 'Program', 'Semester', 'Day', 'Time In', 'Time Out', 'Room'])

    # 5. Helper to Format Time (24h -> 12h AM/PM)
    def format_time(t_str):
        if not t_str: return "-"
        try:
            # Try parsing HH:MM and converting to 00:00 AM/PM
            dt = datetime.strptime(t_str, "%H:%M")
            return dt.strftime("%I:%M %p")
        except:
            return t_str # Return original if parsing fails

    # 6. Write Data rows
    for c in courses:
        teacher_name = c.teacher.username if c.teacher else "Unassigned"
        
        # Format the specific fields
        fmt_time_in = format_time(c.time_in)
        fmt_time_out = format_time(c.time_out)
        
        cw.writerow([
            c.course_catalog_code or "-",
            c.name,
            teacher_name,
            c.program or "-",
            c.semester_code or "-",
            c.day or "-",
            fmt_time_in,
            fmt_time_out,
            c.room or "-"
        ])

    # 7. Create Response
    output = make_response(si.getvalue())
    filename = f"Final_Schedule_{datetime.now().strftime('%Y-%m-%d')}.csv"
    output.headers["Content-Disposition"] = f"attachment; filename={filename}"
    output.headers["Content-type"] = "text/csv"
    return output

# --- ANNOUNCEMENT SYSTEM ---

@admin_bp.route('/announcements', methods=['GET'])
def get_announcements():
    # Allow public read (or secure it if you prefer)
    anns = Announcement.query.order_by(Announcement.created_at.desc()).all()
    return jsonify({'announcements': [{
        'id': a.id,
        'content': a.content,
        'type': a.type,
        'date': a.created_at.strftime('%Y-%m-%d %H:%M')
    } for a in anns]}), 200

@admin_bp.route('/announcement', methods=['POST'])
@jwt_required()
def create_announcement():
    if not check_admin(): return jsonify({'error': 'Unauthorized'}), 403
    data = request.get_json()
    
    new_ann = Announcement(
        content=data['content'],
        type=data.get('type', 'info')
    )
    db.session.add(new_ann)
    db.session.commit()
    return jsonify({'message': 'Posted!'}), 201

@admin_bp.route('/announcement/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_announcement(id):
    if not check_admin(): return jsonify({'error': 'Unauthorized'}), 403
    ann = Announcement.query.get(id)
    if ann:
        db.session.delete(ann)
        db.session.commit()
    return jsonify({'message': 'Deleted'}), 200

from app.models.models import CourseFeedback, Course, User, db # 👈 Ensure User is imported

@admin_bp.route('/feedback-stats', methods=['GET'])
@jwt_required()
def get_feedback_stats():
    if not check_admin(): return jsonify({'error': 'Unauthorized'}), 403

    # ✅ FIX: Join with the User table to get the teacher's name
    results = db.session.query(
        CourseFeedback, 
        Course.name, 
        User.username  # Select User.username instead of Course.teacher_name
    ).join(Course, CourseFeedback.course_id == Course.id)\
     .join(User, Course.teacher_id == User.id).all()

    data = []
    for fb, course_name, teacher_name in results:
        data.append({
            'id': fb.id,
            'course': course_name,
            'teacher': teacher_name, # This now correctly holds the username
            'rating': fb.rating,
            'comment': fb.comment,
            'date': fb.created_at.strftime('%Y-%m-%d')
        })

    return jsonify({'reviews': data}), 200