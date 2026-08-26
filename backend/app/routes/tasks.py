from datetime import datetime, date
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, current_user
from backend.app.models import db, Task, Project, Employee, TaskComment, TaskHistory
from backend.app.utils.auth_helpers import admin_required

task_bp = Blueprint('tasks', __name__)

@task_bp.route('', methods=['GET'])
@jwt_required()
def get_tasks():
    # Admin sees all. Employees see tasks assigned to them.
    project_id = request.args.get('project_id')
    status = request.args.get('status')
    priority = request.args.get('priority')
    search = request.args.get('search', '').strip()

    if current_user.role == 'admin':
        query = Task.query
    else:
        if not current_user.employee:
            return jsonify([]), 200
        query = Task.query.filter(Task.assigned_to_id == current_user.employee.id)

    if project_id:
        query = query.filter(Task.project_id == project_id)
    if status:
        query = query.filter(Task.status == status)
    if priority:
        query = query.filter(Task.priority == priority)
    if search:
        query = query.filter((Task.title.ilike(f"%{search}%")) | (Task.description.ilike(f"%{search}%")))

    tasks = query.all()
    return jsonify([task.to_dict() for task in tasks]), 200

@task_bp.route('/<int:task_id>', methods=['GET'])
@jwt_required()
def get_task(task_id):
    task = Task.query.get_or_404(task_id)
    
    # Check permissions
    if current_user.role != 'admin':
        if not current_user.employee or task.assigned_to_id != current_user.employee.id:
            return jsonify({"error": "Access denied to this task"}), 403

    task_data = task.to_dict()
    # Add comments and history
    task_data['comments'] = [c.to_dict() for c in task.comments]
    task_data['history'] = [h.to_dict() for h in task.history]
    return jsonify(task_data), 200

@task_bp.route('', methods=['POST'])
@admin_required()
def create_task():
    data = request.get_json() or {}
    project_id = data.get('project_id')
    assigned_to_id = data.get('assigned_to_id')
    title = data.get('title')
    description = data.get('description')
    priority = data.get('priority', 'medium')
    due_date_str = data.get('due_date')
    start_date_str = data.get('start_date')

    if not project_id or not title or not due_date_str:
        return jsonify({"error": "Project ID, title, and due date are required"}), 400

    # Verify project exists
    project = Project.query.get(project_id)
    if not project:
        return jsonify({"error": "Project not found"}), 404

    # Date parsing
    try:
        due_date = datetime.strptime(due_date_str, "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"error": "Invalid due_date format. Use YYYY-MM-DD"}), 400

    start_date = None
    if start_date_str:
        try:
            start_date = datetime.strptime(start_date_str, "%Y-%m-%d").date()
            if start_date > due_date:
                return jsonify({"error": "Start date cannot be after due date"}), 400
        except ValueError:
            return jsonify({"error": "Invalid start_date format. Use YYYY-MM-DD"}), 400

    # Verify assignee
    if assigned_to_id:
        emp = Employee.query.get(assigned_to_id)
        if not emp:
            return jsonify({"error": "Assigned employee not found"}), 404
        # Verification: assignee must be a member of the project
        if emp not in project.members:
            # Auto-assign employee to project members to be helpful, or return error.
            # Let's auto-add them to project members.
            project.members.append(emp)

    task = Task(
        project_id=project_id,
        assigned_to_id=assigned_to_id,
        title=title,
        description=description,
        priority=priority,
        status='pending',
        start_date=start_date,
        due_date=due_date
    )
    db.session.add(task)
    db.session.flush() # get task.id

    # Create history log
    history = TaskHistory(
        task_id=task.id,
        user_id=current_user.id,
        action="Task Created",
        new_value=f"Task '{title}' initialized."
    )
    db.session.add(history)
    db.session.commit()

    # Recalculate project progress
    project.update_progress()

    return jsonify({
        "message": "Task created successfully",
        "task": task.to_dict()
    }), 201

@task_bp.route('/<int:task_id>', methods=['PUT'])
@jwt_required()
def update_task(task_id):
    task = Task.query.get_or_404(task_id)
    project = task.project
    data = request.get_json() or {}

    # Check permission
    is_admin = (current_user.role == 'admin')
    is_assignee = (current_user.employee and task.assigned_to_id == current_user.employee.id)

    if not is_admin and not is_assignee:
        return jsonify({"error": "Access denied. You cannot edit this task."}), 403

    # Business rule: employees can only update task status.
    if not is_admin and is_assignee:
        # Check if they sent fields other than status
        allowed_keys = {'status'}
        received_keys = set(data.keys())
        if not received_keys.issubset(allowed_keys):
            return jsonify({"error": "Employees are only permitted to update task status"}), 403

    status = data.get('status')
    
    # Track change log entries
    change_logs = []

    # Process status update
    if status and task.status != status:
        if status not in ['pending', 'in_progress', 'completed']:
            return jsonify({"error": "Invalid status value"}), 400
            
        change_logs.append(TaskHistory(
            task_id=task.id,
            user_id=current_user.id,
            action="Status Changed",
            old_value=task.status,
            new_value=status
        ))
        task.status = status
        if status == 'completed':
            task.completed_at = datetime.utcnow()
        else:
            task.completed_at = None

    # Admins can edit metadata
    if is_admin:
        title = data.get('title')
        description = data.get('description')
        priority = data.get('priority')
        due_date_str = data.get('due_date')
        start_date_str = data.get('start_date')
        assigned_to_id = data.get('assigned_to_id')

        if title and task.title != title:
            change_logs.append(TaskHistory(
                task_id=task.id,
                user_id=current_user.id,
                action="Title Changed",
                old_value=task.title,
                new_value=title
            ))
            task.title = title

        if 'description' in data and task.description != description:
            change_logs.append(TaskHistory(
                task_id=task.id,
                user_id=current_user.id,
                action="Description Changed",
                old_value=task.description,
                new_value=description
            ))
            task.description = description

        if priority and task.priority != priority:
            if priority not in ['low', 'medium', 'high']:
                return jsonify({"error": "Priority must be low, medium, or high"}), 400
            change_logs.append(TaskHistory(
                task_id=task.id,
                user_id=current_user.id,
                action="Priority Changed",
                old_value=task.priority,
                new_value=priority
            ))
            task.priority = priority

        # Dates check
        due_date = task.due_date
        start_date = task.start_date

        if due_date_str:
            try:
                due_date = datetime.strptime(due_date_str, "%Y-%m-%d").date()
                if task.due_date != due_date:
                    change_logs.append(TaskHistory(
                        task_id=task.id,
                        user_id=current_user.id,
                        action="Due Date Changed",
                        old_value=task.due_date.isoformat(),
                        new_value=due_date.isoformat()
                    ))
                    task.due_date = due_date
            except ValueError:
                return jsonify({"error": "Invalid due_date format"}), 400

        if start_date_str is not None:
            if start_date_str == '':
                task.start_date = None
            else:
                try:
                    start_date = datetime.strptime(start_date_str, "%Y-%m-%d").date()
                    if task.start_date != start_date:
                        change_logs.append(TaskHistory(
                            task_id=task.id,
                            user_id=current_user.id,
                            action="Start Date Changed",
                            old_value=task.start_date.isoformat() if task.start_date else "None",
                            new_value=start_date.isoformat()
                        ))
                        task.start_date = start_date
                except ValueError:
                    return jsonify({"error": "Invalid start_date format"}), 400

        if start_date and due_date and start_date > due_date:
            return jsonify({"error": "Start date cannot be after due date"}), 400

        # Assignee check
        if 'assigned_to_id' in data and task.assigned_to_id != assigned_to_id:
            old_assignee = f"{task.assigned_to.first_name} {task.assigned_to.last_name}" if task.assigned_to else "Unassigned"
            new_assignee = "Unassigned"
            
            if assigned_to_id:
                emp = Employee.query.get(assigned_to_id)
                if not emp:
                    return jsonify({"error": "Assignee not found"}), 404
                new_assignee = f"{emp.first_name} {emp.last_name}"
                # Ensure assignee is project member
                if emp not in project.members:
                    project.members.append(emp)
                    
            change_logs.append(TaskHistory(
                task_id=task.id,
                user_id=current_user.id,
                action="Assignee Changed",
                old_value=old_assignee,
                new_value=new_assignee
            ))
            task.assigned_to_id = assigned_to_id

    # Record changes
    for log in change_logs:
        db.session.add(log)

    db.session.commit()

    # Recalculate project progress
    project.update_progress()

    return jsonify({
        "message": "Task updated successfully",
        "task": task.to_dict()
    }), 200

@task_bp.route('/<int:task_id>', methods=['DELETE'])
@admin_required()
def delete_task(task_id):
    task = Task.query.get_or_404(task_id)
    project = task.project
    db.session.delete(task)
    db.session.commit()
    
    # Recalculate project progress
    project.update_progress()

    return jsonify({"message": "Task deleted successfully"}), 200

@task_bp.route('/<int:task_id>/comments', methods=['POST'])
@jwt_required()
def add_comment(task_id):
    task = Task.query.get_or_404(task_id)
    
    # Check permissions (must be Admin or the assigned employee)
    if current_user.role != 'admin':
        if not current_user.employee or task.assigned_to_id != current_user.employee.id:
            return jsonify({"error": "You can only comment on tasks assigned to you"}), 403

    data = request.get_json() or {}
    text = data.get('comment_text')
    
    if not text or not text.strip():
        return jsonify({"error": "Comment content cannot be empty"}), 400

    comment = TaskComment(
        task_id=task_id,
        user_id=current_user.id,
        comment_text=text.strip()
    )
    db.session.add(comment)
    db.session.commit()

    return jsonify({
        "message": "Comment added successfully",
        "comment": comment.to_dict()
    }), 201

@task_bp.route('/<int:task_id>/comments', methods=['GET'])
@jwt_required()
def get_comments(task_id):
    task = Task.query.get_or_404(task_id)
    if current_user.role != 'admin':
        if not current_user.employee or task.assigned_to_id != current_user.employee.id:
            return jsonify({"error": "Access denied"}), 403

    comments = TaskComment.query.filter_by(task_id=task_id).order_by(TaskComment.created_at.desc()).all()
    return jsonify([c.to_dict() for c in comments]), 200

@task_bp.route('/<int:task_id>/history', methods=['GET'])
@jwt_required()
def get_history(task_id):
    task = Task.query.get_or_404(task_id)
    if current_user.role != 'admin':
        if not current_user.employee or task.assigned_to_id != current_user.employee.id:
            return jsonify({"error": "Access denied"}), 403

    history = TaskHistory.query.filter_by(task_id=task_id).order_by(TaskHistory.created_at.desc()).all()
    return jsonify([h.to_dict() for h in history]), 200
