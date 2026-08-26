from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, current_user
from backend.app.models import db, User, Employee

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    user = User.query.filter_by(username=username).first()
    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid username or password"}), 401

    # Check status if employee
    if user.role == 'employee' and user.employee and user.employee.status == 'inactive':
        return jsonify({"error": "This employee account is deactivated"}), 403

    access_token = create_access_token(identity=user.username)
    
    user_data = user.to_dict()
    if user.employee:
        user_data['employee_profile'] = user.employee.to_dict()
        
    return jsonify({
        "token": access_token,
        "user": user_data
    }), 200

@auth_bp.route('/logout', methods=['POST'])
def logout():
    # In stateless JWT, the client handles logout by clearing the token.
    # We return success message.
    return jsonify({"message": "Logged out successfully"}), 200

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    if not current_user:
        return jsonify({"error": "User not found"}), 404
        
    user_data = current_user.to_dict()
    if current_user.employee:
        user_data['employee_profile'] = current_user.employee.to_dict()
        
    return jsonify(user_data), 200

@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    if not current_user:
        return jsonify({"error": "User not found"}), 404
        
    data = request.get_json() or {}
    email = data.get('email')
    password = data.get('password')
    
    # Validation
    if email and email != current_user.email:
        # Check if email is already taken
        existing_email = User.query.filter_by(email=email).first()
        if existing_email:
            return jsonify({"error": "Email is already in use"}), 400
        current_user.email = email

    if password:
        if len(password) < 6:
            return jsonify({"error": "Password must be at least 6 characters long"}), 400
        current_user.set_password(password)

    # If it's an employee user, we allow updating specific details (first name, last name, phone)
    if current_user.employee:
        employee = current_user.employee
        if 'first_name' in data:
            employee.first_name = data['first_name']
        if 'last_name' in data:
            employee.last_name = data['last_name']
        if 'phone' in data:
            employee.phone = data['phone']

    db.session.commit()
    
    user_data = current_user.to_dict()
    if current_user.employee:
        user_data['employee_profile'] = current_user.employee.to_dict()

    return jsonify({
        "message": "Profile updated successfully",
        "user": user_data
    }), 200
