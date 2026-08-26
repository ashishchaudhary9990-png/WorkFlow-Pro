from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from backend.app.models import db, Department, Employee
from backend.app.utils.auth_helpers import admin_required

dept_bp = Blueprint('departments', __name__)

@dept_bp.route('', methods=['GET'])
@jwt_required()
def get_departments():
    depts = Department.query.all()
    return jsonify([dept.to_dict() for dept in depts]), 200

@dept_bp.route('/<int:dept_id>', methods=['GET'])
@jwt_required()
def get_department(dept_id):
    dept = Department.query.get_or_404(dept_id)
    dept_data = dept.to_dict()
    # Include list of employees in this department
    dept_data['employees'] = [emp.to_dict() for emp in dept.employees]
    return jsonify(dept_data), 200

@dept_bp.route('', methods=['POST'])
@admin_required()
def create_department():
    data = request.get_json() or {}
    name = data.get('name')
    description = data.get('description')

    if not name:
        return jsonify({"error": "Department name is required"}), 400

    existing = Department.query.filter_by(name=name).first()
    if existing:
        return jsonify({"error": "Department with this name already exists"}), 400

    dept = Department(name=name, description=description)
    db.session.add(dept)
    db.session.commit()

    return jsonify({
        "message": "Department created successfully",
        "department": dept.to_dict()
    }), 201

@dept_bp.route('/<int:dept_id>', methods=['PUT'])
@admin_required()
def update_department(dept_id):
    dept = Department.query.get_or_404(dept_id)
    data = request.get_json() or {}
    name = data.get('name')
    description = data.get('description')

    if name:
        existing = Department.query.filter(Department.name == name, Department.id != dept_id).first()
        if existing:
            return jsonify({"error": "Department with this name already exists"}), 400
        dept.name = name
    
    if 'description' in data:
        dept.description = description

    db.session.commit()
    return jsonify({
        "message": "Department updated successfully",
        "department": dept.to_dict()
    }), 200

@dept_bp.route('/<int:dept_id>', methods=['DELETE'])
@admin_required()
def delete_department(dept_id):
    dept = Department.query.get_or_404(dept_id)
    
    # SQLAlchemy will handle unassigning employees because of foreign key setting ondelete='SET NULL'
    db.session.delete(dept)
    db.session.commit()
    return jsonify({"message": "Department deleted successfully"}), 200
