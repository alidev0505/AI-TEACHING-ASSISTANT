from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.models import CourseFeedback, Course

student_bp = Blueprint('student', __name__)

# --- SUBMIT FEEDBACK ROUTE ---
@student_bp.route('/course/<int:course_id>/feedback', methods=['POST'])
@jwt_required()
def submit_feedback(course_id):
    # ✅ FIX STARTS HERE: Handle identity safely
    identity = get_jwt_identity()
    
    # Check if identity is a dictionary (like {'id': 1}) or just the ID directly (like 1 or "1")
    if isinstance(identity, dict):
        current_user_id = identity.get('id')
    else:
        current_user_id = identity
        
    # Ensure it is an integer
    try:
        current_user_id = int(current_user_id)
    except:
        return jsonify({'error': 'Invalid user ID in token'}), 401
    # ✅ FIX ENDS HERE

    data = request.get_json()
    
    # 1. Check if already submitted
    existing = CourseFeedback.query.filter_by(course_id=course_id, student_id=current_user_id).first()
    if existing:
        return jsonify({'error': 'You have already rated this course.'}), 400

    # 2. Save Feedback
    try:
        new_feedback = CourseFeedback(
            course_id=course_id,
            student_id=current_user_id,
            rating=data.get('rating'),
            comment=data.get('comment')
        )
        db.session.add(new_feedback)
        db.session.commit()
        return jsonify({'message': 'Feedback submitted successfully!'}), 201
    except Exception as e:
        db.session.rollback()
        print(f"Error saving feedback: {e}") # Print error to terminal for debugging
        return jsonify({'error': str(e)}), 500