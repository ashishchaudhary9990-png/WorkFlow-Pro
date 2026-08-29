from dotenv import load_dotenv
load_dotenv()

import os
import sys
from datetime import datetime, date, timedelta

# Add backend directory to Python path
sys.path.append(os.path.abspath(os.path.dirname(os.path.dirname(__file__))))

from backend.app.models import db, User, Employee, Department, Project, Task, TaskComment, TaskHistory


def seed_data():
    """Populate the database with demo data. Assumes tables already exist and an app context is active."""

    # Create Departments
    engineering = Department(name="Engineering", description="Software development, DevOps, and systems engineering")
    product = Department(name="Product Management", description="Product strategy, roadmaps, and requirements gathering")
    qa = Department(name="Quality Assurance", description="Manual testing, automated verification, and performance analysis")
    marketing = Department(name="Marketing", description="Corporate branding, campaigns, and user growth strategy")

    db.session.add_all([engineering, product, qa, marketing])
    db.session.flush()

    # Create Admin User
    admin_user = User(username="admin", email="admin@workflowpro.com", role="admin")
    admin_user.set_password("admin123")
    db.session.add(admin_user)
    db.session.flush()

    admin_emp = Employee(
        user_id=admin_user.id,
        department_id=engineering.id,
        first_name="Ashish",
        last_name="Kumar",
        phone="+1-555-0100",
        job_title="VP of Engineering & Admin",
        salary=120000.00,
        hire_date=date(2025, 1, 1),
        status="active"
    )
    db.session.add(admin_emp)

    dev_user = User(username="lalit_dev", email="lalit.dev@workflowpro.com", role="employee")
    dev_user.set_password("password123")
    db.session.add(dev_user)
    db.session.flush()

    dev_emp = Employee(
        user_id=dev_user.id,
        department_id=engineering.id,
        first_name="Lalit",
        last_name="Chauhan",
        phone="+1-555-0101",
        job_title="Senior Software Engineer",
        salary=95000.00,
        hire_date=date(2025, 3, 15),
        status="active"
    )
    db.session.add(dev_emp)

    pm_user = User(username="anshu_pm", email="anshu.pm@workflowpro.com", role="employee")
    pm_user.set_password("password123")
    db.session.add(pm_user)
    db.session.flush()

    pm_emp = Employee(
        user_id=pm_user.id,
        department_id=product.id,
        first_name="Anshu",
        last_name="Dalal",
        phone="+1-555-0102",
        job_title="Technical Product Manager",
        salary=105000.00,
        hire_date=date(2025, 2, 10),
        status="active"
    )
    db.session.add(pm_emp)

    qa_user = User(username="kunal_qa", email="kunal.qa@workflowpro.com", role="employee")
    qa_user.set_password("password123")
    db.session.add(qa_user)
    db.session.flush()

    qa_emp = Employee(
        user_id=qa_user.id,
        department_id=qa.id,
        first_name="Kunal",
        last_name="Sindhu",
        phone="+1-555-0103",
        job_title="QA Automation Engineer",
        salary=85000.00,
        hire_date=date(2025, 4, 1),
        status="active"
    )
    db.session.add(qa_emp)
    db.session.flush()

    today = date.today()

    proj_cloud = Project(
        name="Cloud Portal Migration",
        description="Migrating legacy dashboard portals to secure cloud-native infrastructure.",
        start_date=today - timedelta(days=30),
        end_date=today + timedelta(days=60),
        status="active",
        completion_percentage=0
    )
    proj_cloud.members.extend([dev_emp, pm_emp, qa_emp])

    proj_mobile = Project(
        name="Mobile Application v2",
        description="Revamping mobile apps on iOS and Android platforms with fresh features.",
        start_date=today + timedelta(days=10),
        end_date=today + timedelta(days=120),
        status="planning",
        completion_percentage=0
    )
    proj_mobile.members.extend([dev_emp, pm_emp])

    proj_security = Project(
        name="Security Vulnerability Audit",
        description="Identifying and remediating potential security leaks in public routing APIs.",
        start_date=today - timedelta(days=60),
        end_date=today - timedelta(days=10),
        status="completed",
        completion_percentage=100
    )
    proj_security.members.extend([dev_emp, qa_emp])

    db.session.add_all([proj_cloud, proj_mobile, proj_security])
    db.session.flush()

    t1 = Task(
        project_id=proj_cloud.id, assigned_to_id=pm_emp.id,
        title="Define API Schema Contract",
        description="Document REST endpoint input/output schemas for developers to build backend controllers.",
        priority="high", status="completed",
        start_date=today - timedelta(days=28), due_date=today - timedelta(days=15),
        completed_at=datetime.utcnow() - timedelta(days=16)
    )
    t2 = Task(
        project_id=proj_cloud.id, assigned_to_id=dev_emp.id,
        title="Implement Token Authorization Controllers",
        description="Secure endpoints using stateless JWT signatures and create login filters.",
        priority="high", status="in_progress",
        start_date=today - timedelta(days=15), due_date=today + timedelta(days=5)
    )
    t3 = Task(
        project_id=proj_cloud.id, assigned_to_id=qa_emp.id,
        title="Configure Automated E2E Security Tests",
        description="Write integration suites verifying unauthorized roles cannot access admin modules.",
        priority="medium", status="pending",
        start_date=today - timedelta(days=5), due_date=today + timedelta(days=15)
    )
    t4 = Task(
        project_id=proj_cloud.id, assigned_to_id=dev_emp.id,
        title="Refactor Legacy Database Index Models",
        description="Optimize slow query logs by introducing primary/foreign keys indexes in SQLite.",
        priority="high", status="in_progress",
        start_date=today - timedelta(days=20), due_date=today - timedelta(days=2)
    )
    t5 = Task(
        project_id=proj_security.id, assigned_to_id=dev_emp.id,
        title="Analyze CORS Permissions Policy",
        description="Ensure API only resolves requests stemming from approved corporate domains.",
        priority="medium", status="completed",
        start_date=today - timedelta(days=55), due_date=today - timedelta(days=40),
        completed_at=datetime.utcnow() - timedelta(days=42)
    )
    t6 = Task(
        project_id=proj_security.id, assigned_to_id=qa_emp.id,
        title="Perform Penetration Testing on Auth Endpoints",
        description="Ensure brute force protections and JWT keys validation blocks token tampering.",
        priority="high", status="completed",
        start_date=today - timedelta(days=40), due_date=today - timedelta(days=15),
        completed_at=datetime.utcnow() - timedelta(days=15)
    )

    db.session.add_all([t1, t2, t3, t4, t5, t6])
    db.session.flush()

    c1 = TaskComment(task_id=t2.id, user_id=pm_user.id,
                      comment_text="Lalit, please make sure the JWT secret key is loaded from config/environment variables.")
    c2 = TaskComment(task_id=t2.id, user_id=dev_user.id,
                      comment_text="Yes Anshu, it's already configured to read from os.environ, falling back to a dev secret.")
    db.session.add_all([c1, c2])

    h1 = TaskHistory(task_id=t1.id, user_id=admin_user.id, action="Task Created",
                      new_value="Task created and assigned to Anshu Dalal.")
    h2 = TaskHistory(task_id=t2.id, user_id=admin_user.id, action="Task Created",
                      new_value="Task created and assigned to Lalit Chauhan.")
    h3 = TaskHistory(task_id=t2.id, user_id=dev_user.id, action="Status Changed",
                      old_value="pending", new_value="in_progress")
    db.session.add_all([h1, h2, h3])

    db.session.commit()

    proj_cloud.update_progress()
    proj_mobile.update_progress()
    proj_security.update_progress()

    print("Database seeded with mock entries successfully.")


def reset_and_seed():
    """Destructive: wipes all tables, recreates them, and seeds fresh demo data. Local dev use only."""
    db.drop_all()
    db.create_all()
    print("Database tables initialized.")
    seed_data()


if __name__ == '__main__':
    from backend.app import create_app
    app = create_app()
    with app.app_context():
        reset_and_seed()