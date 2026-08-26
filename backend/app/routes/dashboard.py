from datetime import date, datetime
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, current_user
from backend.app.models import db, User, Employee, Project, Task, TaskHistory

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_dashboard_stats():
    today = date.today()
    
    if current_user.role == 'admin':
        # Admin statistics (company-wide)
        total_employees = Employee.query.filter_by(status='active').count()
        total_projects = Project.query.count()
        active_projects = Project.query.filter_by(status='active').count()
        completed_projects = Project.query.filter_by(status='completed').count()
        
        pending_tasks = Task.query.filter(Task.status.in_(['pending', 'in_progress'])).count()
        completed_tasks = Task.query.filter_by(status='completed').count()
        
        overdue_tasks = Task.query.filter(
            Task.status != 'completed',
            Task.due_date < today
        ).count()
        
        # Recent activity (latest task history entries across the organization)
        recent_activities = TaskHistory.query.order_by(TaskHistory.created_at.desc()).limit(8).all()
        
        return jsonify({
            "summary": {
                "total_employees": total_employees,
                "total_projects": total_projects,
                "active_projects": active_projects,
                "completed_projects": completed_projects,
                "pending_tasks": pending_tasks,
                "completed_tasks": completed_tasks,
                "overdue_tasks": overdue_tasks
            },
            "recent_activity": [act.to_dict() for act in recent_activities]
        }), 200
        
    else:
        # Employee statistics (personalized)
        emp = current_user.employee
        if not emp:
            return jsonify({
                "summary": {
                    "total_projects": 0,
                    "pending_tasks": 0,
                    "completed_tasks": 0,
                    "overdue_tasks": 0
                },
                "recent_activity": []
            }), 200
            
        my_projects_count = emp.projects.count()
        
        pending_tasks = Task.query.filter(
            Task.assigned_to_id == emp.id,
            Task.status.in_(['pending', 'in_progress'])
        ).count()
        
        completed_tasks = Task.query.filter_by(
            assigned_to_id=emp.id,
            status='completed'
        ).count()
        
        overdue_tasks = Task.query.filter(
            Task.assigned_to_id == emp.id,
            Task.status != 'completed',
            Task.due_date < today
        ).count()
        
        # Recent activity on tasks assigned to this employee
        recent_activities = TaskHistory.query.join(Task).filter(
            Task.assigned_to_id == emp.id
        ).order_by(TaskHistory.created_at.desc()).limit(8).all()
        
        return jsonify({
            "summary": {
                "total_projects": my_projects_count,
                "pending_tasks": pending_tasks,
                "completed_tasks": completed_tasks,
                "overdue_tasks": overdue_tasks
            },
            "recent_activity": [act.to_dict() for act in recent_activities]
        }), 200
