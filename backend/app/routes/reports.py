from datetime import date
from flask import Blueprint, jsonify
from backend.app.models import db, Employee, Project, Task, Department
from backend.app.utils.auth_helpers import admin_required

reports_bp = Blueprint('reports', __name__)

@reports_bp.route('/employees', methods=['GET'])
@admin_required()
def get_employee_report():
    employees = Employee.query.all()
    today = date.today()
    report_data = []

    for emp in employees:
        tasks = Task.query.filter_by(assigned_to_id=emp.id).all()
        total_tasks = len(tasks)
        completed = sum(1 for t in tasks if t.status == 'completed')
        pending = sum(1 for t in tasks if t.status in ['pending', 'in_progress'])
        overdue = sum(1 for t in tasks if t.status != 'completed' and t.due_date < today)
        
        completion_rate = int((completed / total_tasks * 100)) if total_tasks > 0 else 0

        report_data.append({
            "employee_id": emp.id,
            "name": f"{emp.first_name} {emp.last_name}",
            "job_title": emp.job_title,
            "department": emp.department.name if emp.department else "Unassigned",
            "total_tasks": total_tasks,
            "completed_tasks": completed,
            "pending_tasks": pending,
            "overdue_tasks": overdue,
            "completion_rate": completion_rate
        })

    return jsonify(report_data), 200

@reports_bp.route('/projects', methods=['GET'])
@admin_required()
def get_project_report():
    projects = Project.query.all()
    today = date.today()
    report_data = []

    for proj in projects:
        tasks = Task.query.filter_by(project_id=proj.id).all()
        total_tasks = len(tasks)
        completed = sum(1 for t in tasks if t.status == 'completed')
        pending = sum(1 for t in tasks if t.status in ['pending', 'in_progress'])
        overdue = sum(1 for t in tasks if t.status != 'completed' and t.due_date < today)

        report_data.append({
            "project_id": proj.id,
            "name": proj.name,
            "status": proj.status,
            "start_date": proj.start_date.isoformat() if proj.start_date else None,
            "end_date": proj.end_date.isoformat() if proj.end_date else None,
            "completion_percentage": proj.completion_percentage,
            "total_tasks": total_tasks,
            "completed_tasks": completed,
            "pending_tasks": pending,
            "overdue_tasks": overdue,
            "member_count": len(proj.members)
        })

    return jsonify(report_data), 200

@reports_bp.route('/tasks', methods=['GET'])
@admin_required()
def get_task_report():
    today = date.today()
    
    # Simple aggregations
    total_tasks = Task.query.count()
    completed = Task.query.filter_by(status='completed').count()
    in_progress = Task.query.filter_by(status='in_progress').count()
    pending = Task.query.filter_by(status='pending').count()
    overdue = Task.query.filter(Task.status != 'completed', Task.due_date < today).count()

    # Priorities distribution
    high = Task.query.filter_by(priority='high').count()
    medium = Task.query.filter_by(priority='medium').count()
    low = Task.query.filter_by(priority='low').count()

    return jsonify({
        "overall": {
            "total": total_tasks,
            "pending": pending,
            "in_progress": in_progress,
            "completed": completed,
            "overdue": overdue
        },
        "priorities": {
            "high": high,
            "medium": medium,
            "low": low
        }
    }), 200
