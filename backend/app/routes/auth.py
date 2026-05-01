from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from app.models.models import db, User, Course, Enrollment, Material, GeneratedContent
from datetime import datetime, timedelta
import smtplib
import secrets
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

auth_bp = Blueprint('auth', __name__)


# ── Helper: send email via SMTP ─────────────────────────────────────────────
def send_email(to_email, subject, html_body):
    """Send an email using the SMTP credentials stored in app config."""
    try:
        cfg = current_app.config
        username = cfg.get('MAIL_USERNAME', '')
        password = cfg.get('MAIL_PASSWORD', '')

        print(f"📧 Attempting to send email to: {to_email}")
        print(f"📧 Using sender: {username!r}  |  password set: {'YES' if password else 'NO'}")

        if not username or not password or username == 'your-gmail@gmail.com':
            print("⚠️  SMTP credentials not configured. Update SMTP_EMAIL and SMTP_PASSWORD in backend/.env")
            return False

        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = username
        msg['To'] = to_email
        msg.attach(MIMEText(html_body, 'html'))

        with smtplib.SMTP(cfg['MAIL_SERVER'], cfg['MAIL_PORT']) as server:
            server.ehlo()
            server.starttls()
            server.login(username, password)
            server.sendmail(username, to_email, msg.as_string())

        print(f"✅ Email sent successfully to {to_email}")
        return True
    except smtplib.SMTPAuthenticationError:
        print("❌ SMTP Auth Error: Gmail rejected the password.")
        print("   → Make sure you are using a Gmail APP PASSWORD (not your regular password).")
        print("   → Get one at: https://myaccount.google.com/apppasswords")
        return False
    except smtplib.SMTPException as e:
        print(f"❌ SMTP Error: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected email error: {type(e).__name__}: {e}")
        return False


# ── Signup ───────────────────────────────────────────────────────────────────
@auth_bp.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()

    # Validate input
    if not all(k in data for k in ('username', 'email', 'password', 'role')):
        return jsonify({'error': 'Missing required fields'}), 400

    if data['role'] not in ['teacher', 'student']:
        return jsonify({'error': 'Invalid role'}), 400

    # Check if user exists
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already registered'}), 400

    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already taken'}), 400

    # Create new user with a verification token
    hashed_password = generate_password_hash(data['password'])
    verification_token = secrets.token_urlsafe(32)

    new_user = User(
        username=data['username'],
        email=data['email'],
        password_hash=hashed_password,
        role=data['role'],
        university_id=data.get('university_id', ''),
        is_verified=False,
        verification_token=verification_token
    )

    db.session.add(new_user)
    db.session.commit()

    # Send verification email
    frontend_url = current_app.config.get('FRONTEND_URL', 'http://localhost:5173')
    verify_link = f"{frontend_url}/verify-email/{verification_token}"
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#4f46e5">Verify Your Email</h2>
      <p>Hi <b>{new_user.username}</b>, thanks for signing up!</p>
      <p>Click the button below to verify your email address:</p>
      <a href="{verify_link}" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold">
        Verify Email
      </a>
      <p style="margin-top:20px;color:#888;font-size:0.85rem">
        If you did not sign up, you can safely ignore this email.
      </p>
    </div>
    """
    send_email(new_user.email, "Verify your AI Teaching Assistant account", html)

    return jsonify({
        'message': 'User created successfully. Please check your email to verify your account.',
        'user': new_user.to_dict()
    }), 201


# ── Verify Email ─────────────────────────────────────────────────────────────
@auth_bp.route('/verify-email/<token>', methods=['GET'])
def verify_email(token):
    user = User.query.filter_by(verification_token=token).first()

    if not user:
        return jsonify({'error': 'Invalid or expired verification link.'}), 400

    if user.is_verified:
        return jsonify({'message': 'Email already verified. You can log in.'}), 200

    user.is_verified = True
    user.verification_token = None
    db.session.commit()

    return jsonify({'message': 'Email verified successfully! You can now log in.'}), 200


# ── Login ─────────────────────────────────────────────────────────────────────
@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    user = User.query.filter_by(email=email).first()

    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({'error': 'Invalid credentials'}), 401

    # Block login if email is not verified (Admin and Teacher accounts bypass this)
    if not user.is_verified and user.role == 'student':
        return jsonify({
            'error': 'Please verify your email before logging in. Check your inbox for the verification link.',
            'code': 'EMAIL_NOT_VERIFIED'
        }), 403

    # Convert ID to string for token
    access_token = create_access_token(identity=str(user.id))

    return jsonify({
        'access_token': access_token,
        'token': access_token,
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'role': user.role
        }
    }), 200


# ── Forgot Password ───────────────────────────────────────────────────────────
@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json()
    email = data.get('email', '').strip().lower()

    if not email:
        return jsonify({'error': 'Email is required.'}), 400

    user = User.query.filter_by(email=email).first()

    # Always return 200 to avoid revealing whether email exists
    if not user:
        return jsonify({'message': 'If an account with that email exists, a reset link has been sent.'}), 200

    # Generate a secure token valid for 1 hour
    token = secrets.token_urlsafe(32)
    user.reset_token = token
    user.reset_token_expires = datetime.utcnow() + timedelta(hours=1)
    db.session.commit()

    frontend_url = current_app.config.get('FRONTEND_URL', 'http://localhost:5173')
    reset_link = f"{frontend_url}/reset-password/{token}"

    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#4f46e5">Reset Your Password</h2>
      <p>Hi <b>{user.username}</b>,</p>
      <p>We received a request to reset your password. Click the button below — this link expires in <b>1 hour</b>:</p>
      <a href="{reset_link}" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold">
        Reset Password
      </a>
      <p style="margin-top:20px;color:#888;font-size:0.85rem">
        If you did not request a password reset, you can safely ignore this email.
      </p>
    </div>
    """
    send_email(user.email, "Reset your AI Teaching Assistant password", html)

    return jsonify({'message': 'If an account with that email exists, a reset link has been sent.'}), 200


# ── Reset Password ────────────────────────────────────────────────────────────
@auth_bp.route('/reset-password/<token>', methods=['POST'])
def reset_password(token):
    data = request.get_json()
    new_password = data.get('new_password', '')

    if not new_password or len(new_password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters.'}), 400

    user = User.query.filter_by(reset_token=token).first()

    if not user:
        return jsonify({'error': 'Invalid or expired reset link.'}), 400

    if user.reset_token_expires < datetime.utcnow():
        return jsonify({'error': 'This reset link has expired. Please request a new one.'}), 400

    user.password_hash = generate_password_hash(new_password)
    user.reset_token = None
    user.reset_token_expires = None
    db.session.commit()

    return jsonify({'message': 'Password reset successfully. You can now log in.'}), 200


# ── Get Current User ──────────────────────────────────────────────────────────
@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    try:
        identity = get_jwt_identity()
        user_id = int(identity) if isinstance(identity, str) else identity['id'] if isinstance(identity, dict) else identity

        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        return jsonify({'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'role': user.role,
            'university_id': user.university_id or '',
            'is_verified': user.is_verified,
            'created_at': user.created_at.strftime('%B %d, %Y') if user.created_at else 'N/A',
        }}), 200
    except Exception as e:
        print(f"Auth Error: {e}")
        return jsonify({'error': 'Invalid token'}), 401


# ── Profile Stats ─────────────────────────────────────────────────────────────
@auth_bp.route('/profile-stats', methods=['GET'])
@jwt_required()
def get_profile_stats():
    try:
        identity = get_jwt_identity()
        user_id = int(identity) if isinstance(identity, str) else identity['id'] if isinstance(identity, dict) else identity
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        stats = {}
        if user.role == 'teacher':
            courses = Course.query.filter_by(teacher_id=user_id).all()
            course_ids = [c.id for c in courses]
            total_students = sum(Enrollment.query.filter_by(course_id=cid).count() for cid in course_ids)
            
            # Count generated content by type
            material_ids = [m.id for m in Material.query.filter(Material.course_id.in_(course_ids)).all()] if course_ids else []
            gen_counts = {'lecture': 0, 'slides': 0, 'assignment': 0, 'quiz': 0, 'midterm': 0, 'final': 0}
            if material_ids:
                for gc in GeneratedContent.query.filter(GeneratedContent.material_id.in_(material_ids)).all():
                    ct = gc.content_type.lower()
                    if ct in gen_counts:
                        gen_counts[ct] += 1
                    else:
                        gen_counts['quiz'] += 1  # fallback for sub-types like 'mcq'
            
            stats = {
                'courses_taught': len(courses),
                'total_students': total_students,
                'generated': gen_counts,
                'courses': [{'id': c.id, 'name': c.name, 'code': c.class_code} for c in courses]
            }
        elif user.role == 'student':
            enrollments = Enrollment.query.filter_by(student_id=user_id).all()
            stats = {
                'courses_enrolled': len(enrollments),
                'university_id': user.university_id or 'Not set',
                'courses': [{
                    'id': e.course_id,
                    'name': e.course.name if e.course else 'Unknown',
                    'code': e.course.class_code if e.course else '',
                    'teacher': e.course.teacher.username if e.course and e.course.teacher else 'Unknown'
                } for e in enrollments]
            }
        elif user.role == 'admin':
            stats = {
                'total_users': User.query.count(),
                'total_teachers': User.query.filter_by(role='teacher').count(),
                'total_students': User.query.filter_by(role='student').count(),
                'total_courses': Course.query.count(),
            }

        return jsonify({'stats': stats}), 200
    except Exception as e:
        print(f"Profile Stats Error: {e}")
        return jsonify({'error': str(e)}), 500


# ── Update Profile ────────────────────────────────────────────────────────────
@auth_bp.route('/update', methods=['PUT'])
@jwt_required()
def update_profile():
    try:
        identity = get_jwt_identity()
        user_id = int(identity) if isinstance(identity, str) else identity['id'] if isinstance(identity, dict) else identity
        user = User.query.get(user_id)
        data = request.get_json()

        if 'username' in data and data['username'].strip():
            existing = User.query.filter_by(username=data['username']).first()
            if existing and existing.id != user_id:
                return jsonify({'error': 'Username already taken'}), 400
            user.username = data['username'].strip()
        if 'email' in data and data['email'].strip():
            existing = User.query.filter_by(email=data['email']).first()
            if existing and existing.id != user_id:
                return jsonify({'error': 'Email already in use'}), 400
            user.email = data['email'].strip()
        if 'university_id' in data:
            user.university_id = data['university_id']
        if 'department' in data:
            user.department = data['department']
        if 'bio' in data:
            user.bio = data['bio']
        if 'profile_picture' in data:
            user.profile_picture = data['profile_picture']  # base64 string

        db.session.commit()
        return jsonify({'message': 'Profile updated successfully', 'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'role': user.role,
            'university_id': user.university_id or '',
            'is_verified': user.is_verified,
            'created_at': user.created_at.strftime('%B %d, %Y') if user.created_at else 'N/A',
        }}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ── Change Password (for logged-in users) ─────────────────────────────────────
@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        data = request.get_json()

        old_pass = data.get('old_password')
        new_pass = data.get('new_password')

        if not check_password_hash(user.password_hash, old_pass):
            return jsonify({'error': 'Incorrect current password'}), 400

        user.password_hash = generate_password_hash(new_pass)
        db.session.commit()

        return jsonify({'message': 'Password changed successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500