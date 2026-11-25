import uuid
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from app.core.database import get_db
from app.models.models import (
    Course, FeedbackOpportunity, FeedbackConversation, FeedbackTheme, User, UserRole
)
from app.schemas.schemas import AIChatRequest, AIChatResponse, FeedbackThemeResponse
from app.services.ollama_client import (
    ollama_client, OllamaServiceError, OllamaUnavailableError, OllamaTimeoutError,
    OllamaAuthError, OllamaAccessDeniedError, OllamaPaymentError, OllamaNotFoundError,
    OllamaRateLimitError
)
from app.services.ai_assistant import feedback_assistant
from app.services.feedback_analyzer import feedback_analyzer
from app.api.deps import get_current_user, require_role

logger = logging.getLogger(__name__)

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

    try:
        result = await feedback_assistant.process_turn(
            user_message=chat_req.message,
            conversation_history=history_dicts,
            turn_count=turn_count,
            topic_hint=topic_hint
        )
    except OllamaAuthError as e:
        logger.warning(f"Remote Ollama authentication error (HTTP 401): {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service authentication issue. Please submit feedback manually using the standard 3-step form."
        )
    except OllamaAccessDeniedError as e:
        logger.warning(f"Remote Ollama access denied (HTTP 403): {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service access restricted by provider policy. Please submit feedback manually using the standard 3-step form."
        )
    except OllamaPaymentError as e:
        logger.warning(f"Remote Ollama account credits required (HTTP 402): {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The AI assistant is temporarily unavailable due to remote inference credit limits. Please submit feedback manually using the standard 3-step form."
        )
    except OllamaNotFoundError as e:
        logger.warning(f"Remote Ollama model not found (HTTP 404): {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The configured AI model is currently unavailable on the remote service. Please submit feedback manually using the standard 3-step form."
        )
    except OllamaRateLimitError as e:
        logger.warning(f"Remote Ollama rate limit exceeded (HTTP 429): {e}")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="The AI assistant is experiencing high request volume. Please wait a moment or submit feedback manually."
        )
    except OllamaTimeoutError as e:
        logger.warning(f"Remote Ollama timeout: {e}")
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="The AI assistant request timed out. Please submit feedback manually using the standard 3-step form."
        )
    except (OllamaUnavailableError, OllamaServiceError) as e:
        logger.warning(f"Remote Ollama service unavailable: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The remote AI service is currently unavailable. Please submit feedback manually using the standard 3-step form."
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
    try:
        themes = await feedback_analyzer.cluster_and_summarize(db, course_id, week_number)
        return {
            "status": "success",
            "generated_themes_count": len(themes),
            "themes": themes
        }
    except Exception as e:
        logger.error(f"Analysis trigger error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Feedback analysis failed: {str(e)}"
        )

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
