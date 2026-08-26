from dotenv import load_dotenv
load_dotenv()

import os
import sys
import pytest
from datetime import date, timedelta

# Add backend directory to Python path
sys.path.append(os.path.abspath(os.path.dirname(os.path.dirname(__file__))))

from backend.app import create_app
from backend.app.models import db, User, Employee, Department, Project, Task

@pytest.fixture
def app():
    # Use in-memory SQLite for testing
    app = create_app({
        'TESTING': True,
        'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
        'SQLALCHEMY_TRACK_MODIFICATIONS': False,
        'JWT_SECRET_KEY': 'test-secret-key',
        'SECRET_KEY': 'test-secret-key'
    })
    
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def admin_token(client, app):
    with app.app_context():
        admin = User(username="admin_test", email="admin@test.com", role="admin")
        admin.set_password("adminpass")
        db.session.add(admin)
        db.session.commit()
        
    response = client.post('/api/auth/login', json={
        "username": "admin_test",
        "password": "adminpass"
    })
    return response.json['token']

@pytest.fixture
def employee_token(client, app):
    with app.app_context():
        emp_user = User(username="emp_test", email="emp@test.com", role="employee")
        emp_user.set_password("emppass")
        db.session.add(emp_user)
        db.session.flush()
        
        emp = Employee(
            user_id=emp_user.id,
            first_name="Test",
            last_name="Employee",
            status="active"
        )
        db.session.add(emp)
        db.session.commit()
        
    response = client.post('/api/auth/login', json={
        "username": "emp_test",
        "password": "emppass"
    })
    return response.json['token']

def test_auth_login(client, app):
    with app.app_context():
        user = User(username="login_test", email="login@test.com", role="employee")
        user.set_password("mypassword")
        db.session.add(user)
        db.session.commit()

    # Test invalid login
    res = client.post('/api/auth/login', json={"username": "login_test", "password": "wrongpassword"})
    assert res.status_code == 401

    # Test valid login
    res = client.post('/api/auth/login', json={"username": "login_test", "password": "mypassword"})
    assert res.status_code == 200
    assert "token" in res.json
    assert res.json["user"]["username"] == "login_test"

def test_department_crud_admin_only(client, admin_token, employee_token):
    # Try creating department with employee token (should fail)
    headers_emp = {"Authorization": f"Bearer {employee_token}"}
    res = client.post('/api/departments', json={"name": "Engineering", "description": "Dev Team"}, headers=headers_emp)
    assert res.status_code == 403

    # Create department with admin token
    headers_admin = {"Authorization": f"Bearer {admin_token}"}
    res = client.post('/api/departments', json={"name": "Engineering", "description": "Dev Team"}, headers=headers_admin)
    assert res.status_code == 201
    assert res.json["department"]["name"] == "Engineering"

    # List departments (accessible to employee too)
    res = client.get('/api/departments', headers=headers_emp)
    assert res.status_code == 200
    assert len(res.json) == 1

def test_salary_visibility(client, admin_token, employee_token, app):
    with app.app_context():
        dept = Department(name="R&D")
        db.session.add(dept)
        db.session.commit()

    headers_admin = {"Authorization": f"Bearer {admin_token}"}
    headers_emp = {"Authorization": f"Bearer {employee_token}"}

    # Add employee via admin
    res = client.post('/api/employees', json={
        "username": "coder_jack",
        "email": "jack@test.com",
        "password": "password123",
        "first_name": "Jack",
        "last_name": "Coder",
        "salary": 75000.00,
        "hire_date": "2025-05-01"
    }, headers=headers_admin)
    assert res.status_code == 201
    assert "salary" in res.json["employee"]
    assert res.json["employee"]["salary"] == 75000.00

    # Get employee details as admin (salary should be visible)
    emp_id = res.json["employee"]["id"]
    res_admin = client.get(f'/api/employees/{emp_id}', headers=headers_admin)
    assert res_admin.status_code == 200
    assert "salary" in res_admin.json
    assert res_admin.json["salary"] == 75000.00

    # Get employee details as employee (salary should NOT be visible)
    res_emp = client.get(f'/api/employees/{emp_id}', headers=headers_emp)
    assert res_emp.status_code == 200
    assert "salary" not in res_emp.json

def test_project_and_task_progress(client, admin_token, employee_token, app):
    headers_admin = {"Authorization": f"Bearer {admin_token}"}
    
    # 1. Create a project
    proj_res = client.post('/api/projects', json={
        "name": "Beta Release",
        "description": "Beta launch testing",
        "start_date": "2026-01-01",
        "end_date": "2026-06-30",
        "status": "active"
    }, headers=headers_admin)
    assert proj_res.status_code == 201
    proj_id = proj_res.json["project"]["id"]
    assert proj_res.json["project"]["completion_percentage"] == 0

    # 2. Add employee profile and get employee id
    emp_res = client.post('/api/employees', json={
        "username": "tester_bob",
        "email": "bob.tester@test.com",
        "password": "password123",
        "first_name": "Bob",
        "last_name": "Tester"
    }, headers=headers_admin)
    assert emp_res.status_code == 201
    emp_id = emp_res.json["employee"]["id"]

    # 3. Create two tasks assigned to Bob
    task1_res = client.post('/api/tasks', json={
        "project_id": proj_id,
        "assigned_to_id": emp_id,
        "title": "Write unit tests",
        "due_date": "2026-05-01",
        "priority": "high"
    }, headers=headers_admin)
    assert task1_res.status_code == 201
    t1_id = task1_res.json["task"]["id"]

    task2_res = client.post('/api/tasks', json={
        "project_id": proj_id,
        "assigned_to_id": emp_id,
        "title": "Verify API responses",
        "due_date": "2026-05-10",
        "priority": "medium"
    }, headers=headers_admin)
    assert task2_res.status_code == 201
    t2_id = task2_res.json["task"]["id"]

    # Verify project progress is still 0%
    proj_check = client.get(f'/api/projects/{proj_id}', headers=headers_admin)
    assert proj_check.json["completion_percentage"] == 0

    # Log in as tester_bob (Bob)
    bob_login = client.post('/api/auth/login', json={
        "username": "tester_bob",
        "password": "password123"
    })
    bob_token = bob_login.json["token"]
    headers_bob = {"Authorization": f"Bearer {bob_token}"}

    # Update Bob's task 1 to completed
    task1_update = client.put(f'/api/tasks/{t1_id}', json={
        "status": "completed"
    }, headers=headers_bob)
    assert task1_update.status_code == 200

    # Verify project progress recalculation (should be 50% now)
    proj_check2 = client.get(f'/api/projects/{proj_id}', headers=headers_admin)
    assert proj_check2.json["completion_percentage"] == 50

    # Employee Bob tries to update task priority (should fail, restricted)
    task2_fail = client.put(f'/api/tasks/{t2_id}', json={
        "priority": "high"
    }, headers=headers_bob)
    assert task2_fail.status_code == 403

def test_overdue_task_detection(client, admin_token, app):
    headers_admin = {"Authorization": f"Bearer {admin_token}"}
    
    # Create project
    proj_res = client.post('/api/projects', json={
        "name": "Audit Task",
        "description": "Verification audit",
        "start_date": "2025-01-01",
        "end_date": "2026-12-31",
        "status": "active"
    }, headers=headers_admin)
    proj_id = proj_res.json["project"]["id"]

    # Create task with past due date
    past_due_date = (date.today() - timedelta(days=5)).isoformat()
    task_res = client.post('/api/tasks', json={
        "project_id": proj_id,
        "title": "Overdue task",
        "due_date": past_due_date,
        "priority": "high"
    }, headers=headers_admin)
    assert task_res.status_code == 201
    
    # Check if is_overdue returns True
    assert task_res.json["task"]["is_overdue"] is True
