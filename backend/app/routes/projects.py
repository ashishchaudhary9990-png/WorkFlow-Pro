from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, current_user
from backend.app.models import db, Project, Employee
from backend.app.utils.auth_helpers import admin_required

project_bp = Blueprint('projects', __name__)

@project_bp.route('', methods=['GET'])
@jwt_required()
def get_projects():
    # Admin sees all. Employees see projects they are assigned to.
    if current_user.role == 'admin':
        projects = Project.query.all()
    else:
        # User is employee, get projects through membership relationship
        if current_user.employee:
            projects = current_user.employee.projects.all()
        else:
            projects = []
            
    return jsonify([proj.to_dict() for proj in projects]), 200

@project_bp.route('/<int:project_id>', methods=['GET'])
@jwt_required()
def get_project(project_id):
    project = Project.query.get_or_404(project_id)
    
    # Check permissions: employee must be a member
    if current_user.role != 'admin':
        if not current_user.employee or current_user.employee not in project.members:
            return jsonify({"error": "Access denied to this project"}), 403

    return jsonify(project.to_dict()), 200

@project_bp.route('', methods=['POST'])
@admin_required()
def create_project():
    data = request.get_json() or {}
    name = data.get('name')
    description = data.get('description')
    start_date_str = data.get('start_date')
    end_date_str = data.get('end_date')
    status = data.get('status', 'planning')
    member_ids = data.get('member_ids', [])

    if not name or not start_date_str or not end_date_str:
        return jsonify({"error": "Name, start date, and end date are required"}), 400

    # Date validations
    try:
        start_date = datetime.strptime(start_date_str, "%Y-%m-%d").date()
        end_date = datetime.strptime(end_date_str, "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400

    if start_date > end_date:
        return jsonify({"error": "Start date cannot be after end date"}), 400

    # Name uniqueness validation
    existing = Project.query.filter_by(name=name).first()
    if existing:
        return jsonify({"error": "Project with this name already exists"}), 400

    # Create Project
    project = Project(
        name=name,
        description=description,
        start_date=start_date,
        end_date=end_date,
        status=status
    )
    
    # Assign members
    if member_ids:
        employees = Employee.query.filter(Employee.id.in_(member_ids)).all()
        project.members = employees

    db.session.add(project)
    db.session.commit()

    return jsonify({
        "message": "Project created successfully",
        "project": project.to_dict()
    }), 201

@project_bp.route('/<int:project_id>', methods=['PUT'])
@admin_required()
def update_project(project_id):
    project = Project.query.get_or_404(project_id)
    data = request.get_json() or {}
    
    name = data.get('name')
    description = data.get('description')
    start_date_str = data.get('start_date')
    end_date_str = data.get('end_date')
    status = data.get('status')
    member_ids = data.get('member_ids')

    if name:
        existing = Project.query.filter(Project.name == name, Project.id != project_id).first()
        if existing:
            return jsonify({"error": "Project with this name already exists"}), 400
        project.name = name

    if 'description' in data:
        project.description = description

    # Handle dates update
    start_date = project.start_date
    end_date = project.end_date

    if start_date_str:
        try:
            start_date = datetime.strptime(start_date_str, "%Y-%m-%d").date()
            project.start_date = start_date
        except ValueError:
            return jsonify({"error": "Invalid start_date format. Use YYYY-MM-DD"}), 400

    if end_date_str:
        try:
            end_date = datetime.strptime(end_date_str, "%Y-%m-%d").date()
            project.end_date = end_date
        except ValueError:
            return jsonify({"error": "Invalid end_date format. Use YYYY-MM-DD"}), 400

    if start_date > end_date:
        return jsonify({"error": "Start date cannot be after end date"}), 400

    if status:
        if status not in ['planning', 'active', 'completed', 'on_hold']:
            return jsonify({"error": "Invalid status value"}), 400
        project.status = status

    # Handle members update
    if member_ids is not None:
        employees = Employee.query.filter(Employee.id.in_(member_ids)).all()
        project.members = employees

    db.session.commit()
    
    # Recalculate progress in case task relationships might be impacted or to verify
    project.update_progress()

    return jsonify({
        "message": "Project updated successfully",
        "project": project.to_dict()
    }), 200

@project_bp.route('/<int:project_id>', methods=['DELETE'])
@admin_required()
def delete_project(project_id):
    project = Project.query.get_or_404(project_id)
    db.session.delete(project)
    db.session.commit()
    return jsonify({"message": "Project deleted successfully"}), 200
