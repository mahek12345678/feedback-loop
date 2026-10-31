from app.models.models import Department, Course, FeedbackOpportunity, CourseEnrollment, FacultyCourseAssignment, User, UserRole
from app.core.security import get_password_hash

def setup_course_and_student(db_session):
    dept = Department(name="CSE", code="CSE")
    db_session.add(dept)
    db_session.commit()

    course = Course(code="CS101", title="Intro to CS", department_id=dept.id, privacy_threshold=3)
    db_session.add(course)
    db_session.commit()

    faculty = User(email="fac@test.edu", hashed_password=get_password_hash("pass"), full_name="Faculty", role=UserRole.FACULTY)
    student1 = User(email="s1@test.edu", hashed_password=get_password_hash("pass"), full_name="Student 1", role=UserRole.STUDENT)
    student2 = User(email="s2@test.edu", hashed_password=get_password_hash("pass"), full_name="Student 2", role=UserRole.STUDENT)
    student3 = User(email="s3@test.edu", hashed_password=get_password_hash("pass"), full_name="Student 3", role=UserRole.STUDENT)
    db_session.add_all([faculty, student1, student2, student3])
    db_session.commit()

    # Assign faculty and enroll students
    db_session.add(FacultyCourseAssignment(faculty_id=faculty.id, course_id=course.id, is_primary=True))
    db_session.add(CourseEnrollment(student_id=student1.id, course_id=course.id))
    db_session.add(CourseEnrollment(student_id=student2.id, course_id=course.id))
    db_session.add(CourseEnrollment(student_id=student3.id, course_id=course.id))

    opp = FeedbackOpportunity(course_id=course.id, week_number=1, title="Week 1", topic="Loops", is_active=True)
    db_session.add(opp)
    db_session.commit()

    return course, opp, faculty, student1, student2, student3

def test_feedback_submission_and_duplicate_prevention(client, db_session):
    course, opp, faculty, s1, s2, s3 = setup_course_and_student(db_session)

    # Login as Student 1
    login_res = client.post("/api/auth/login", json={"email": "s1@test.edu", "password": "pass"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Submit feedback
    sub_res = client.post("/api/feedback/submit", json={
        "opportunity_id": opp.id,
        "category": "Lecture pace",
        "rating": 2,
        "written_feedback": "Loops moved too fast"
    }, headers=headers)
    assert sub_res.status_code == 201

    # Attempt duplicate submission
    dup_res = client.post("/api/feedback/submit", json={
        "opportunity_id": opp.id,
        "category": "Lecture pace",
        "rating": 1,
        "written_feedback": "Second submission attempt"
    }, headers=headers)
    assert dup_res.status_code == 400
    assert "already submitted" in dup_res.json()["detail"].lower()

def test_privacy_threshold_enforcement(client, db_session):
    course, opp, faculty, s1, s2, s3 = setup_course_and_student(db_session)

    # Login faculty
    fac_token = client.post("/api/auth/login", json={"email": "fac@test.edu", "password": "pass"}).json()["access_token"]
    fac_headers = {"Authorization": f"Bearer {fac_token}"}

    # 1. When only 1 student has submitted (< privacy_threshold of 3)
    s1_token = client.post("/api/auth/login", json={"email": "s1@test.edu", "password": "pass"}).json()["access_token"]
    client.post("/api/feedback/submit", json={
        "opportunity_id": opp.id,
        "category": "Teaching clarity",
        "rating": 2,
        "written_feedback": "Secret individual comment"
    }, headers={"Authorization": f"Bearer {s1_token}"})

    view1 = client.get(f"/api/feedback/course/{course.id}", headers=fac_headers).json()
    assert view1["total_submissions"] == 1
    assert view1["is_privacy_shield_active"] is True
    assert len(view1["comments"]) == 0 # Comments protected!

    # 2. When threshold of 3 submissions is reached
    s2_token = client.post("/api/auth/login", json={"email": "s2@test.edu", "password": "pass"}).json()["access_token"]
    client.post("/api/feedback/submit", json={
        "opportunity_id": opp.id,
        "category": "Teaching clarity",
        "rating": 3,
        "written_feedback": "Second comment"
    }, headers={"Authorization": f"Bearer {s2_token}"})

    s3_token = client.post("/api/auth/login", json={"email": "s3@test.edu", "password": "pass"}).json()["access_token"]
    client.post("/api/feedback/submit", json={
        "opportunity_id": opp.id,
        "category": "Teaching clarity",
        "rating": 4,
        "written_feedback": "Third comment"
    }, headers={"Authorization": f"Bearer {s3_token}"})

    view2 = client.get(f"/api/feedback/course/{course.id}", headers=fac_headers).json()
    assert view2["total_submissions"] == 3
    assert view2["is_privacy_shield_active"] is False
    assert len(view2["comments"]) == 3 # Now visible anonymously
