from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, current_user

def admin_required():
    """
    Decorator to protect routes so only administrators can access them.
    Ensures a valid JWT is present and current_user.role is 'admin'.
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            if not current_user:
                return jsonify({"error": "Unauthorized"}), 401
            if current_user.role != 'admin':
                return jsonify({"error": "Admin privileges required"}), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator
