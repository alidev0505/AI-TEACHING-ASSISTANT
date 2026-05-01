from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.models import db, Notification

notify_bp = Blueprint('notifications', __name__)

@notify_bp.route('/', methods=['GET'])
@jwt_required()
def get_notifications():
    user_id = get_jwt_identity()
    # Get last 10 notifications
    notifs = Notification.query.filter_by(user_id=user_id)\
        .order_by(Notification.created_at.desc()).limit(10).all()
        
    return jsonify({
        'notifications': [{
            'id': n.id,
            'message': n.message,
            'is_read': n.is_read,
            'created_at': n.created_at.strftime('%Y-%m-%d %H:%M')
        } for n in notifs]
    }), 200

@notify_bp.route('/mark-read/<int:id>', methods=['PUT'])
@jwt_required()
def mark_read(id):
    notif = Notification.query.get(id)
    if notif:
        notif.is_read = True
        db.session.commit()
    return jsonify({'message': 'Marked read'}), 200