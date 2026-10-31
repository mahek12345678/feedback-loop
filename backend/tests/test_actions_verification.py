from app.models.models import Department, Course, AcademicIssue, FacultyAction, CourseEnrollment, User, UserRole, IssueStatus, VerificationOutcome
from app.core.security import get_password_hash

def test_action_lifecycle_and_verification(client, db_session):
    dept = Department(name="CSE", code="CSE")
    db_session.add(dept)
    db_session.commit()

    course = Course(code="CS201", title="DSA", department_id=dept.id, privacy_threshold=1)
    db_session.add(course)
    db_session.commit()

    faculty = User(email="prof@test.edu", hashed_password=get_password_hash("pass"), full_name="Prof", role=UserRole.FACULTY)
    student1 = User(email="stu1@test.edu", hashed_password=get_password_hash("pass"), full_name="Student 1", role=UserRole.STUDENT)
    student2 = User(email="stu2@test.edu", hashed_password=get_password_hash("pass"), full_name="Student 2", role=UserRole.STUDENT)
    db_session.add_all([faculty, student1, student2])
    db_session.commit()

    db_session.add(CourseEnrollment(student_id=student1.id, course_id=course.id))
    db_session.add(CourseEnrollment(student_id=student2.id, course_id=course.id))
    db_session.commit()

    fac_token = client.post("/api/auth/login", json={"email": "prof@test.edu", "password": "pass"}).json()["access_token"]
    stu1_token = client.post("/api/auth/login", json={"email": "stu1@test.edu", "password": "pass"}).json()["access_token"]

    # 1. Create issue
    issue_res = client.post("/api/actions/issues", json={
        "course_id": course.id,
        "title": "Recursion Difficulty",
        "topic": "Recursion",
        "category": "Teaching clarity",
        "description": "Call stack visualization issue",
        "severity": "HIGH"
    }, headers={"Authorization": f"Bearer {fac_token}"})
    assert issue_res.status_code == 201
    issue_id = issue_res.json()["id"]

    # 2. Create faculty action
    action_res = client.post("/api/actions", json={
        "issue_id": issue_id,
        "title": "Extra Problem-Solving Workshop",
        "description": "45-minute live tracing workshop"
    }, headers={"Authorization": f"Bearer {fac_token}"})
    assert action_res.status_code == 201
    action_id = action_res.json()["id"]
    assert action_res.json()["current_status"] == "ACTION_PLANNED"

    # 3. Update status to IN_PROGRESS
    patch1 = client.patch(f"/api/actions/{action_id}", json={
        "status": "IN_PROGRESS",
        "public_update": "Workshop scheduled for Friday"
    }, headers={"Authorization": f"Bearer {fac_token}"})
    assert patch1.status_code == 200
    assert patch1.json()["current_status"] == "IN_PROGRESS"

    # 4. Update status to VERIFICATION_PENDING
    patch2 = client.patch(f"/api/actions/{action_id}", json={
        "status": "VERIFICATION_PENDING",
        "public_update": "Workshop completed! Did this help?"
    }, headers={"Authorization": f"Bearer {fac_token}"})
    assert patch2.status_code == 200
    assert patch2.json()["current_status"] == "VERIFICATION_PENDING"

    # 5. Student submits verification
    v_res = client.post("/api/verifications", json={
        "action_id": action_id,
        "outcome": "YES",
        "comment": "Workshop was extremely helpful!"
    }, headers={"Authorization": f"Bearer {stu1_token}"})
    assert v_res.status_code == 201

    # 6. Check verification summary
    sum_res = client.get(f"/api/verifications/action/{action_id}", headers={"Authorization": f"Bearer {fac_token}"})
    assert sum_res.status_code == 200
    summary = sum_res.json()
    assert summary["total_votes"] == 1
    assert summary["yes_count"] == 1
    assert summary["effectiveness_score"] == 100.0
