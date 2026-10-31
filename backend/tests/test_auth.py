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
