import pytest
from app.models.models import (
    Department, Course, CourseEnrollment, FeedbackOpportunity, FeedbackSubmission,
    AcademicIssue, FacultyAction, ActionStatusHistory, ResolutionVerification,
    User, UserRole, IssueStatus, VerificationOutcome, WarningSeverity
)
from app.core.security import get_password_hash

def test_complete_closed_loop_workflow(client, db_session):
    """
    End-to-End Test of the complete 13-step closed-loop workflow:
    1. Student logs in
    2. Enrolled course selected
    3. Student submits feedback anonymously
    4. Duplicate prevention & decoupled privacy token verified
    5. Early warning engine calculates WoW difficulty
    6. Recommendation generated
    7. Faculty accepts recommendation & plans action
    8. Action progresses to completion and verification pending
    9. Student receives verification prompt and submits vote + updated understanding rating
    10. Verification aggregates and resolves issue (VERIFIED_RESOLVED)
    11. Dashboards reflect verified resolution
    """
    # Setup institution data
    dept = Department(name="Computer Science", code="CS")
    db_session.add(dept)
    db_session.commit()

    course = Course(code="CS201", title="Data Structures", department_id=dept.id, privacy_threshold=3)
    db_session.add(course)
    db_session.commit()

    faculty = User(
        email="prof.davis@feedbackloop.edu",
        hashed_password=get_password_hash("faculty123"),
        full_name="Prof. Marcus Davis",
        role=UserRole.FACULTY,
        department_id=dept.id
    )
    student1 = User(
        email="alex@feedbackloop.edu",
        hashed_password=get_password_hash("student123"),
        full_name="Alex Rivera",
        role=UserRole.STUDENT,
        department_id=dept.id
    )
    student2 = User(
        email="bella@feedbackloop.edu",
        hashed_password=get_password_hash("student123"),
        full_name="Bella Martinez",
        role=UserRole.STUDENT,
        department_id=dept.id
    )
    student3 = User(
        email="charlie@feedbackloop.edu",
        hashed_password=get_password_hash("student123"),
        full_name="Charlie Zhang",
        role=UserRole.STUDENT,
        department_id=dept.id
    )
    admin = User(
        email="dean@feedbackloop.edu",
        hashed_password=get_password_hash("admin123"),
        full_name="Dr. Eleanor Vance",
        role=UserRole.ADMIN,
        department_id=dept.id
    )
    db_session.add_all([faculty, student1, student2, student3, admin])
    db_session.commit()

    # Enroll students
    db_session.add(CourseEnrollment(student_id=student1.id, course_id=course.id))
    db_session.add(CourseEnrollment(student_id=student2.id, course_id=course.id))
    db_session.add(CourseEnrollment(student_id=student3.id, course_id=course.id))
    db_session.commit()

    # Create weekly feedback opportunities (Week 1 and Week 2)
    opp1 = FeedbackOpportunity(course_id=course.id, week_number=1, title="Arrays & Pointers", topic="Arrays", is_active=False)
    opp2 = FeedbackOpportunity(course_id=course.id, week_number=2, title="Recursion & Call Stacks", topic="Recursion", is_active=True)
    db_session.add_all([opp1, opp2])
    db_session.commit()

    # Week 1 feedback: low difficulty (10%)
    for i in range(9):
        db_session.add(FeedbackSubmission(course_id=course.id, opportunity_id=opp1.id, topic="Arrays", category="Teaching clarity", rating=4, sentiment="positive"))
    db_session.add(FeedbackSubmission(course_id=course.id, opportunity_id=opp1.id, topic="Arrays", category="Lecture pace", rating=2, sentiment="negative"))
    db_session.commit()

    # STEP 1: Student 1 logs in
    s1_login = client.post("/api/auth/login", json={"email": "alex@feedbackloop.edu", "password": "student123"})
    assert s1_login.status_code == 200
    s1_token = s1_login.json()["access_token"]
    s1_headers = {"Authorization": f"Bearer {s1_token}"}

    # STEP 2: Student retrieves enrolled courses and active opportunities
    courses_res = client.get("/api/courses", headers=s1_headers)
    assert courses_res.status_code == 200
    assert any(c["code"] == "CS201" for c in courses_res.json())

    opps_res = client.get("/api/feedback/opportunities", headers=s1_headers)
    assert opps_res.status_code == 200
    active_opp = next(o for o in opps_res.json() if o["id"] == opp2.id)
    assert active_opp["has_submitted"] is False

    # STEP 3: Student 1 submits anonymous feedback
    sub1_res = client.post("/api/feedback/submit", json={
        "opportunity_id": opp2.id,
        "category": "Lecture pace",
        "rating": 2,
        "written_feedback": "Recursion call stack explanation was too fast",
        "structured_need": "Visual step-by-step recursion tree examples"
    }, headers=s1_headers)
    assert sub1_res.status_code == 201

    # STEP 4: Duplicate submission prevention
    dup_res = client.post("/api/feedback/submit", json={
        "opportunity_id": opp2.id,
        "category": "Lecture pace",
        "rating": 1,
        "written_feedback": "Duplicate attempt"
    }, headers=s1_headers)
    assert dup_res.status_code == 400
    assert "already submitted" in dup_res.json()["detail"].lower()

    # Student 2 & 3 also submit feedback for week 2
    s2_token = client.post("/api/auth/login", json={"email": "bella@feedbackloop.edu", "password": "student123"}).json()["access_token"]
    client.post("/api/feedback/submit", json={
        "opportunity_id": opp2.id,
        "category": "Practical examples",
        "rating": 2,
        "written_feedback": "Need more live tracing examples of binary tree recursion"
    }, headers={"Authorization": f"Bearer {s2_token}"})

    s3_token = client.post("/api/auth/login", json={"email": "charlie@feedbackloop.edu", "password": "student123"}).json()["access_token"]
    client.post("/api/feedback/submit", json={
        "opportunity_id": opp2.id,
        "category": "Teaching clarity",
        "rating": 2,
        "written_feedback": "Call stack returns were confusing without diagrams"
    }, headers={"Authorization": f"Bearer {s3_token}"})

    # STEP 5: Faculty logs in
    fac_login = client.post("/api/auth/login", json={"email": "prof.davis@feedbackloop.edu", "password": "faculty123"})
    assert fac_login.status_code == 200
    fac_token = fac_login.json()["access_token"]
    fac_headers = {"Authorization": f"Bearer {fac_token}"}

    # STEP 6: Academic Early Warning engine detects trend
    warnings_res = client.get(f"/api/warnings/course/{course.id}", headers=fac_headers)
    assert warnings_res.status_code == 200
    alerts = warnings_res.json()
    assert len(alerts) >= 1

    # STEP 7: Faculty creates Academic Issue
    issue_res = client.post("/api/actions/issues", json={
        "course_id": course.id,
        "title": "Recursion Concept & Call Stack Visualization Friction",
        "topic": "Recursion",
        "category": "Teaching clarity",
        "description": "Students struggling with call stack unwinding and recursion tree diagrams.",
        "severity": "HIGH"
    }, headers=fac_headers)
    assert issue_res.status_code == 201
    issue_id = issue_res.json()["id"]

    # STEP 8: Recommendation engine suggests interventions
    recs_res = client.post(f"/api/actions/issues/{issue_id}/recommendations", headers=fac_headers)
    assert recs_res.status_code == 200
    recommendations = recs_res.json()
    assert len(recommendations) > 0
    first_rec = recommendations[0]

    # STEP 9: Faculty accepts recommendation
    accept_res = client.post(f"/api/actions/recommendations/{first_rec['id']}/respond", json={
        "status": "ACCEPTED"
    }, headers=fac_headers)
    assert accept_res.status_code == 200
    assert accept_res.json()["status"] == "ACCEPTED"

    # STEP 10: Faculty creates improvement action and completes it
    action_res = client.post("/api/actions", json={
        "issue_id": issue_id,
        "title": "Supplementary Live Recursion Workshop",
        "description": "45-minute live tracing tutorial with visual recursion diagrams.",
        "public_update": "Tutorial scheduled for Friday 4pm in Hall A."
    }, headers=fac_headers)
    assert action_res.status_code == 201
    action_id = action_res.json()["id"]

    # Faculty transitions action to VERIFICATION_PENDING after tutorial
    status_update = client.patch(f"/api/actions/{action_id}", json={
        "status": "VERIFICATION_PENDING",
        "public_update": "Tutorial completed! Please verify whether your comprehension improved."
    }, headers=fac_headers)
    assert status_update.status_code == 200
    assert status_update.json()["current_status"] == "VERIFICATION_PENDING"

    # STEP 11: Student checks pending verifications
    student_analytics = client.get("/api/analytics/student", headers=s1_headers).json()
    assert student_analytics["pending_verifications_count"] >= 1

    # STEP 12: Students submit resolution verification with outcome and updated understanding rating
    v1_res = client.post("/api/verifications", json={
        "action_id": action_id,
        "outcome": "YES",
        "updated_understanding_rating": 5,
        "comment": "The tree diagrams completely clarified the return values!"
    }, headers=s1_headers)
    assert v1_res.status_code == 201

    v2_res = client.post("/api/verifications", json={
        "action_id": action_id,
        "outcome": "YES",
        "updated_understanding_rating": 4,
        "comment": "Great tutorial, felt much more confident."
    }, headers={"Authorization": f"Bearer {s2_token}"})
    assert v2_res.status_code == 201

    v3_res = client.post("/api/verifications", json={
        "action_id": action_id,
        "outcome": "PARTIALLY",
        "updated_understanding_rating": 3,
        "comment": "Better now, will practice more."
    }, headers={"Authorization": f"Bearer {s3_token}"})
    assert v3_res.status_code == 201

    # STEP 13: Verify summary and auto-resolution
    summary_res = client.get(f"/api/verifications/action/{action_id}", headers=fac_headers)
    assert summary_res.status_code == 200
    summary = summary_res.json()
    assert summary["total_votes"] == 3
    assert summary["yes_count"] == 2
    assert summary["partially_count"] == 1
    assert summary["effectiveness_score"] > 80.0
    assert summary["avg_updated_understanding"] == 4.0

    # Verify action progressed to VERIFIED_RESOLVED
    action_detail = client.get(f"/api/actions/course/{course.id}", headers=fac_headers).json()
    act = next(a for a in action_detail if a["id"] == action_id)
    assert act["current_status"] == "VERIFIED_RESOLVED"

    # Administrator dashboard reflects resolved action
    admin_login = client.post("/api/auth/login", json={"email": "dean@feedbackloop.edu", "password": "admin123"})
    admin_token = admin_login.json()["access_token"]
    admin_res = client.get("/api/analytics/admin", headers={"Authorization": f"Bearer {admin_token}"})
    assert admin_res.status_code == 200
    admin_data = admin_res.json()
    assert admin_data["total_actions_count"] >= 1
    assert admin_data["overall_resolution_rate"] > 0
