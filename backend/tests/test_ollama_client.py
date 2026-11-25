import pytest
from unittest.mock import patch, AsyncMock
from app.services.ollama_client import (
    ollama_client, OllamaUnavailableError, OllamaServiceError,
    OllamaAuthError, OllamaAccessDeniedError, OllamaPaymentError,
    OllamaNotFoundError, OllamaRateLimitError, OllamaTimeoutError
)
from app.services.ai_assistant import feedback_assistant
from app.models.models import Department, Course, FeedbackOpportunity, CourseEnrollment, User, UserRole
from app.core.security import get_password_hash

@pytest.mark.asyncio
async def test_ollama_remote_health_check_handling():
    """Verify Ollama client reports remote service status gracefully without crashing."""
    health = await ollama_client.check_health()
    assert "status" in health
    assert "active_model" in health
    assert "remote_url" in health
    assert health["status"] in ["healthy", "unavailable", "auth_error", "payment_required"]

@pytest.mark.asyncio
async def test_ollama_chat_error_handling_no_fake_responses():
    """Verify chat raises structured OllamaServiceError rather than faking AI responses when remote errors occur."""
    messages = [
        {"role": "user", "content": "I am struggling with recursion"}
    ]
    with pytest.raises((OllamaUnavailableError, OllamaServiceError, OllamaAuthError, OllamaPaymentError)):
        await ollama_client.chat(messages, format_json=False)

@pytest.mark.asyncio
async def test_ai_assistant_multi_turn_and_extraction():
    """Verify conversational assistant processes turns and structures feedback when remote LLM responds."""
    turn1_mock_reply = "Are you finding the conceptual explanation or the code examples more challenging?"
    turn2_mock_json = '{"topic": "Recursion", "category": "Lecture pace", "issue": "Fast pace in call stack explanation", "suggested_need": "Visual step-by-step tree diagrams", "rating": 2, "sentiment": "negative"}'

    with patch.object(ollama_client, 'chat', new_callable=AsyncMock) as mock_chat:
        # Turn 1: bot asks clarifying question
        mock_chat.return_value = turn1_mock_reply
        t1 = await feedback_assistant.process_turn(
            user_message="I'm struggling with this course",
            conversation_history=[],
            turn_count=0,
            topic_hint="Recursion"
        )
        assert t1["is_completed"] is False
        assert t1["turn_count"] == 1
        assert t1["reply"] == turn1_mock_reply

        # Turn 2: student provides specific feedback with need -> bot triggers extraction
        mock_chat.return_value = turn2_mock_json
        t2 = await feedback_assistant.process_turn(
            user_message="The pace is too fast and I need more worked examples",
            conversation_history=[
                {"role": "user", "content": "I'm struggling with this course"},
                {"role": "assistant", "content": t1["reply"]}
            ],
            turn_count=1,
            topic_hint="Recursion"
        )
        assert t2["is_completed"] is True
        assert t2["extracted_feedback"] is not None
        assert t2["extracted_feedback"].topic == "Recursion"
        assert t2["extracted_feedback"].category == "Lecture pace"
        assert t2["extracted_feedback"].rating == 2

def test_ai_endpoint_503_when_remote_service_unavailable(client, db_session):
    """Verify FastAPI /ai/chat router returns 503 with manual submission guidance when remote provider errors."""
    dept = Department(name="CSE", code="CSE")
    db_session.add(dept)
    db_session.commit()

    course = Course(code="CS201", title="DSA", department_id=dept.id, privacy_threshold=3)
    db_session.add(course)
    db_session.commit()

    opp = FeedbackOpportunity(course_id=course.id, week_number=1, title="Recursion", topic="Recursion", is_active=True)
    student = User(email="alex@test.edu", hashed_password=get_password_hash("pass"), full_name="Alex", role=UserRole.STUDENT)
    db_session.add_all([opp, student])
    db_session.commit()

    db_session.add(CourseEnrollment(student_id=student.id, course_id=course.id))
    db_session.commit()

    token = client.post("/api/auth/login", json={"email": "alex@test.edu", "password": "pass"}).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    res = client.post("/api/ai/chat", json={
        "course_id": course.id,
        "opportunity_id": opp.id,
        "message": "I don't understand recursion",
        "conversation_history": []
    }, headers=headers)

    assert res.status_code in [503, 504]
    assert "manual" in res.json()["detail"].lower()

@pytest.mark.parametrize("exc,expected_status,keyword", [
    (OllamaAuthError("raw auth error"), 503, "authentication"),
    (OllamaAccessDeniedError("raw policy restriction"), 503, "restricted"),
    (OllamaPaymentError("raw credits error ref: 12345"), 503, "credit limits"),
    (OllamaNotFoundError("raw model not found"), 503, "unavailable"),
    (OllamaRateLimitError("raw rate limit"), 429, "high request volume"),
    (OllamaTimeoutError("timed out after 120s"), 504, "timed out"),
    (OllamaUnavailableError("connection error"), 503, "currently unavailable"),
])
def test_granular_sanitized_error_handling(client, db_session, exc, expected_status, keyword):
    """Verify each remote provider error translates to an appropriate status code and sanitized student message."""
    dept = Department(name="ENG", code="ENG")
    db_session.add(dept)
    db_session.commit()

    course = Course(code="CS202", title="Algorithms", department_id=dept.id, privacy_threshold=3)
    db_session.add(course)
    db_session.commit()

    opp = FeedbackOpportunity(course_id=course.id, week_number=1, title="Graphs", topic="Graphs", is_active=True)
    student = User(email=f"student_{expected_status}@test.edu", hashed_password=get_password_hash("pass"), full_name="Student", role=UserRole.STUDENT)
    db_session.add_all([opp, student])
    db_session.commit()

    db_session.add(CourseEnrollment(student_id=student.id, course_id=course.id))
    db_session.commit()

    token = client.post("/api/auth/login", json={"email": student.email, "password": "pass"}).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    with patch.object(feedback_assistant, 'process_turn', side_effect=exc):
        res = client.post("/api/ai/chat", json={
            "course_id": course.id,
            "opportunity_id": opp.id,
            "message": "Testing errors",
            "conversation_history": []
        }, headers=headers)

        assert res.status_code == expected_status
        detail = res.json()["detail"]
        assert keyword in detail.lower()
        # Verify no raw provider internal references or URLs leaked
        assert "ref:" not in detail
        assert "http" not in detail
        assert "ollama.com" not in detail
        assert "manual" in detail.lower()
