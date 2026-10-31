import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from app.core.database import get_db
from app.models.models import (
    Course, FeedbackOpportunity, FeedbackConversation, FeedbackTheme, User, UserRole
)
from app.schemas.schemas import AIChatRequest, AIChatResponse, FeedbackThemeResponse
from app.services.ollama_client import ollama_client
from app.services.ai_assistant import feedback_assistant
from app.services.feedback_analyzer import feedback_analyzer
from app.api.deps import get_current_user, require_role

router = APIRouter(prefix="/ai", tags=["AI Integration"])

@router.get("/health")
async def check_ai_health():
    """Verify local Ollama service health and active models."""
    return await ollama_client.check_health()

@router.post("/chat", response_model=AIChatResponse)
async def chat_with_assistant(
    chat_req: AIChatRequest,
    current_user: User = Depends(require_role(UserRole.STUDENT)),
    db: Session = Depends(get_db)
):
    """
    Multi-turn conversational feedback assistant.
    Guides students to turn vague observations into structured feedback.
    """
    opportunity = db.query(FeedbackOpportunity).filter(FeedbackOpportunity.id == chat_req.opportunity_id).first()
    topic_hint = opportunity.topic if opportunity else None

    # Retrieve or generate session token
    session_token = chat_req.session_token or f"sess_{uuid.uuid4().hex[:12]}"

    conv = db.query(FeedbackConversation).filter(FeedbackConversation.session_token == session_token).first()
    if not conv:
        conv = FeedbackConversation(
            session_token=session_token,
            course_id=chat_req.course_id,
            turn_count=0
        )
        db.add(conv)
        db.commit()

    turn_count = conv.turn_count
    history_dicts = [{"role": m.role, "content": m.content} for m in chat_req.conversation_history]

    result = await feedback_assistant.process_turn(
        user_message=chat_req.message,
        conversation_history=history_dicts,
        turn_count=turn_count,
        topic_hint=topic_hint
    )

    conv.turn_count = result["turn_count"]
    conv.is_completed = result["is_completed"]
    db.commit()

    return AIChatResponse(
        session_token=session_token,
        reply=result["reply"],
        is_completed=result["is_completed"],
        extracted_feedback=result["extracted_feedback"],
        turn_count=result["turn_count"]
    )

@router.post("/analyze/{course_id}")
async def trigger_analysis(
    course_id: int,
    week_number: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Triggers clustering and thematic summarization for course feedback."""
    themes = await feedback_analyzer.cluster_and_summarize(db, course_id, week_number)
    return {
        "status": "success",
        "generated_themes_count": len(themes),
        "themes": themes
    }

@router.get("/themes/{course_id}", response_model=List[FeedbackThemeResponse])
def get_course_themes(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns AI-synthesized feedback themes for a course."""
    themes = db.query(FeedbackTheme).filter(
        FeedbackTheme.course_id == course_id
    ).order_by(FeedbackTheme.created_at.desc()).all()
    return themes
