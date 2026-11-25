def test_register_and_login(client):
    # Register student
    reg_res = client.post("/api/auth/register", json={
        "email": "teststudent@feedbackloop.edu",
        "password": "Password123!",
        "full_name": "Test Student",
        "role": "STUDENT"
    })
    assert reg_res.status_code == 201
    token_data = reg_res.json()
    assert "access_token" in token_data
    assert token_data["user"]["email"] == "teststudent@feedbackloop.edu"
    assert token_data["user"]["role"] == "STUDENT"

    # Login
    login_res = client.post("/api/auth/login", json={
        "email": "teststudent@feedbackloop.edu",
        "password": "Password123!"
    })
    assert login_res.status_code == 200
    assert "access_token" in login_res.json()

    # Get /me
    token = login_res.json()["access_token"]
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["full_name"] == "Test Student"

def test_login_invalid_password(client):
    client.post("/api/auth/register", json={
        "email": "faculty@feedbackloop.edu",
        "password": "CorrectPassword",
        "full_name": "Prof. Test",
        "role": "FACULTY"
    })

    bad_res = client.post("/api/auth/login", json={
        "email": "faculty@feedbackloop.edu",
        "password": "WrongPassword"
    })
    assert bad_res.status_code == 401

def test_role_authorization_guards(client):
    """Verify role-based access control guards (students cannot access faculty endpoints and vice-versa)."""
    # 1. Unauthenticated request to protected endpoint
    unauth_res = client.get("/api/auth/me")
    assert unauth_res.status_code in [401, 403]

    # 2. Register student and faculty
    client.post("/api/auth/register", json={
        "email": "student_guard@feedbackloop.edu",
        "password": "PassWord123!",
        "full_name": "Guard Student",
        "role": "STUDENT"
    })
    client.post("/api/auth/register", json={
        "email": "faculty_guard@feedbackloop.edu",
        "password": "PassWord123!",
        "full_name": "Guard Faculty",
        "role": "FACULTY"
    })

    student_token = client.post("/api/auth/login", json={"email": "student_guard@feedbackloop.edu", "password": "PassWord123!"}).json()["access_token"]
    faculty_token = client.post("/api/auth/login", json={"email": "faculty_guard@feedbackloop.edu", "password": "PassWord123!"}).json()["access_token"]

    # Student cannot create academic issue (faculty/admin only)
    forbidden_issue = client.post("/api/actions/issues", json={
        "course_id": 1,
        "title": "Unauthorized Issue",
        "topic": "Testing",
        "category": "Teaching clarity",
        "description": "Student shouldn't be allowed here"
    }, headers={"Authorization": f"Bearer {student_token}"})
    assert forbidden_issue.status_code == 403

    # Faculty cannot submit student feedback
    forbidden_feedback = client.post("/api/feedback/submit", json={
        "opportunity_id": 1,
        "category": "Lecture pace",
        "rating": 3
    }, headers={"Authorization": f"Bearer {faculty_token}"})
    assert forbidden_feedback.status_code == 403

