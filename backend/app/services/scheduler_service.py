from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timedelta
from app.models.models import db, Assignment, Submission, Enrollment
from app.services.notification_service import NotificationService

class SchedulerService:
    def __init__(self, app):
        self.app = app
        self.scheduler = BackgroundScheduler()
        self.notification_service = NotificationService()
    
    def start(self):
        # Check for upcoming deadlines every hour
        self.scheduler.add_job(
            func=self.check_deadlines,
            trigger="interval",
            hours=1
        )
        self.scheduler.start()
    
    def check_deadlines(self):
        with self.app.app_context():
            # Get assignments with deadlines in next 24 hours
            now = datetime.utcnow()
            tomorrow = now + timedelta(hours=24)
            
            assignments = Assignment.query.filter(
                Assignment.deadline.between(now, tomorrow)
            ).all()
            
            for assignment in assignments:
                # Get enrolled students
                enrollments = Enrollment.query.filter_by(
                    course_id=assignment.course_id
                ).all()
                
                for enrollment in enrollments:
                    # Check if student has submitted
                    submission = Submission.query.filter_by(
                        assignment_id=assignment.id,
                        student_id=enrollment.student_id
                    ).first()
                    
                    if not submission:
                        # Send reminder
                        hours_left = int((assignment.deadline - now).total_seconds() / 3600)
                        self.notification_service.send_deadline_reminder(
                            enrollment.student.email,
                            assignment.title,
                            hours_left
                        )