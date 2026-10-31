import pytest
from app.services.ollama_client import ollama_client
from app.services.ai_assistant import feedback_assistant

@pytest.mark.asyncio
async def test_ollama_client_fallback_mode():
    # When Ollama is offline, check_health gracefully reports status without crashing
    health = await ollama_client.check_health()
    assert "status" in health
    assert "active_model" in health

    # Fallback chat response
    messages = [
        {"role": "user", "content": "The teacher is moving way too fast in recursion"}
    ]
    reply = await ollama_client.chat(messages, format_json=False)
    assert isinstance(reply, str)
    assert len(reply) > 10

@pytest.mark.asyncio
async def test_ai_assistant_multi_turn_and_extraction():
    # Turn 1
    t1 = await feedback_assistant.process_turn(
        user_message="I'm struggling with this course",
        conversation_history=[],
        turn_count=0,
        topic_hint="Recursion"
    )
    assert t1["is_completed"] is False
    assert t1["turn_count"] == 1

    # Turn 2 with ready intent
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
    assert t2["extracted_feedback"].category in ["Lecture pace", "Teaching clarity", "Practical examples"]
