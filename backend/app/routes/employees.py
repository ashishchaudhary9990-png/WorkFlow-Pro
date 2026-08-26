from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, current_user
from backend.app.models import db, User, Employee, Department
from backend.app.utils.auth_helpers import admin_required

emp_bp = Blueprint('employees', __name__)

@emp_bp.route('', methods=['GET'])
@jwt_required()
def get_employees():
    # Admin can see all details (including salary), Employees see non-sensitive details.
    is_admin = (current_user.role == 'admin')
    
    # Query parameters
    search = request.args.get('search', '').strip()
    dept_id = request.args.get('department_id')
    status = request.args.get('status')

    query = Employee.query.join(User)

    if search:
        # search by first name, last name, username or email
        query = query.filter(
            (Employee.first_name.ilike(f"%{search}%")) |
            (Employee.last_name.ilike(f"%{search}%")) |
            (User.username.ilike(f"%{search}%")) |
            (User.email.ilike(f"%{search}%"))
        )

    if dept_id:
        query = query.filter(Employee.department_id == dept_id)
        
    if status:
        query = query.filter(Employee.status == status)

    employees = query.all()
    return jsonify([emp.to_dict(include_salary=is_admin) for emp in employees]), 200

@emp_bp.route('/<int:emp_id>', methods=['GET'])
@jwt_required()
def get_employee(emp_id):
    emp = Employee.query.get_or_404(emp_id)
    is_admin = (current_user.role == 'admin')
    return jsonify(emp.to_dict(include_salary=is_admin)), 200

@emp_bp.route('', methods=['POST'])
@admin_required()
def create_employee():
    data = request.get_json() or {}
    
    # User fields
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    role = data.get('role', 'employee')
    
    # Employee fields
    first_name = data.get('first_name')
    last_name = data.get('last_name')
    phone = data.get('phone')
    job_title = data.get('job_title')
    salary = data.get('salary')
    hire_date_str = data.get('hire_date')
    department_id = data.get('department_id')

    # Basic validations
    if not username or not email or not password or not first_name or not last_name:
        return jsonify({"error": "Username, email, password, first name and last name are required"}), 400

    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters long"}), 400

    # Prevent duplicate usernames/emails
    if User.query.filter_by(username=username).first():
        return jsonify({"error": "Username is already taken"}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email is already registered"}), 400

    # Parse hire date
    hire_date = None
    if hire_date_str:
        try:
            hire_date = datetime.strptime(hire_date_str, "%Y-%m-%d").date()
        except ValueError:
            return jsonify({"error": "Invalid hire_date format (YYYY-MM-DD)"}), 400

    # Verify department exists if provided
    if department_id:
        if not Department.query.get(department_id):
            return jsonify({"error": "Department not found"}), 404

    # Create User
    new_user = User(username=username, email=email, role=role)
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.flush()  # to get new_user.id

    # Create Employee
    new_emp = Employee(
        user_id=new_user.id,
        department_id=department_id,
        first_name=first_name,
        last_name=last_name,
        phone=phone,
        job_title=job_title,
        salary=salary,
        hire_date=hire_date,
        status='active'
    )
    db.session.add(new_emp)
    db.session.commit()

    return jsonify({
        "message": "Employee and user account created successfully",
        "employee": new_emp.to_dict(include_salary=True)
    }), 201

@emp_bp.route('/<int:emp_id>', methods=['PUT'])
@admin_required()
def update_employee(emp_id):
    emp = Employee.query.get_or_404(emp_id)
    user = emp.user
    data = request.get_json() or {}

    # Read user updates
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    role = data.get('role')

    # Read employee updates
    first_name = data.get('first_name')
    last_name = data.get('last_name')
    phone = data.get('phone')
    job_title = data.get('job_title')
    salary = data.get('salary')
    hire_date_str = data.get('hire_date')
    department_id = data.get('department_id')
    status = data.get('status')

    # Validate username uniqueness
    if username and username != user.username:
        if User.query.filter_by(username=username).first():
            return jsonify({"error": "Username is already taken"}), 400
        user.username = username

    # Validate email uniqueness
    if email and email != user.email:
        if User.query.filter_by(email=email).first():
            return jsonify({"error": "Email is already in use"}), 400
        user.email = email

    # Password check
    if password:
        if len(password) < 6:
            return jsonify({"error": "Password must be at least 6 characters long"}), 400
        user.set_password(password)

    # Role check
    if role:
        if role not in ['admin', 'employee']:
            return jsonify({"error": "Invalid role. Must be 'admin' or 'employee'"}), 400
        user.role = role

    # Department validation
    if department_id is not None:
        if department_id == '':
            emp.department_id = None
        else:
            if not Department.query.get(department_id):
                return jsonify({"error": "Department not found"}), 404
            emp.department_id = department_id

    # Update other fields
    if first_name:
        emp.first_name = first_name
    if last_name:
        emp.last_name = last_name
    if 'phone' in data:
        emp.phone = phone
    if 'job_title' in data:
        emp.job_title = job_title
    if 'salary' in data:
        emp.salary = salary
    if status:
        if status not in ['active', 'inactive']:
            return jsonify({"error": "Status must be 'active' or 'inactive'"}), 400
        emp.status = status

    # Parse hire date
    if hire_date_str:
        try:
            emp.hire_date = datetime.strptime(hire_date_str, "%Y-%m-%d").date()
        except ValueError:
            return jsonify({"error": "Invalid hire_date format (YYYY-MM-DD)"}), 400

    db.session.commit()
    return jsonify({
        "message": "Employee details updated successfully",
        "employee": emp.to_dict(include_salary=True)
    }), 200

@emp_bp.route('/<int:emp_id>', methods=['DELETE'])
@admin_required()
def delete_employee(emp_id):
    emp = Employee.query.get_or_404(emp_id)
    user = emp.user

    # Prevent deleting oneself
    if user.id == current_user.id:
        return jsonify({"error": "You cannot delete your own administrative account"}), 400

    # Delete user which cascades and deletes the employee
    db.session.delete(user)
    db.session.commit()

    return jsonify({"message": "Employee and user account deleted successfully"}), 200
