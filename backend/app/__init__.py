from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from backend.app.models import db, User
from backend.config import Config

jwt = JWTManager()

def create_app(config_class=Config):
    app = Flask(__name__)
    if isinstance(config_class, dict):
        app.config.from_object(Config)
        app.config.update(config_class)
    else:
        app.config.from_object(config_class)

    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

    # User loader callback for JWT custom claims if needed
    @jwt.user_lookup_loader
    def user_lookup_callback(_jwt_header, jwt_data):
        identity = jwt_data["sub"]
        return User.query.filter_by(username=identity).one_or_none()

    # Register Blueprints
    from backend.app.routes.auth import auth_bp
    from backend.app.routes.departments import dept_bp
    from backend.app.routes.employees import emp_bp
    from backend.app.routes.projects import project_bp
    from backend.app.routes.tasks import task_bp
    from backend.app.routes.dashboard import dashboard_bp
    from backend.app.routes.reports import reports_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(dept_bp, url_prefix='/api/departments')
    app.register_blueprint(emp_bp, url_prefix='/api/employees')
    app.register_blueprint(project_bp, url_prefix='/api/projects')
    app.register_blueprint(task_bp, url_prefix='/api/tasks')
    app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
    app.register_blueprint(reports_bp, url_prefix='/api/reports')

    # Global context processor or database creation
    with app.app_context():
        db.create_all()

    return app
