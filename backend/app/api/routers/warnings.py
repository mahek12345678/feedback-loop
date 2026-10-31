from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.core.database import get_db
from app.models.models import EarlyWarningAlert, Course, User, UserRole, FacultyCourseAssignment
from app.schemas.schemas import EarlyWarningResponse
from app.services.early_warning import early_warning_engine
from app.api.deps import get_current_user

router = APIRouter(prefix="/warnings", tags=["Early Warnings"])

@router.get("/course/{course_id}", response_model=List[EarlyWarningResponse])
def get_course_warnings(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Computes statistical weekly trends and retrieves active early warning alerts.
    """
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # Run analysis
    early_warning_engine.analyze_course_trends(db, course_id)

    alerts = db.query(EarlyWarningAlert).filter(
        EarlyWarningAlert.course_id == course_id
    ).order_by(EarlyWarningAlert.week_number.desc()).all()

    result = []
    for a in alerts:
        result.append(EarlyWarningResponse(
            id=a.id,
            course_id=a.course_id,
            course_code=course.code,
            course_title=course.title,
            topic=a.topic,
            week_number=a.week_number,
            severity=a.severity,
            respondent_count=a.respondent_count,
            difficulty_percentage=a.difficulty_percentage,
            wow_change=a.wow_change,
            consecutive_worsening_weeks=a.consecutive_worsening_weeks,
            rule_triggered=a.rule_triggered,
            ai_explanation=a.ai_explanation,
            is_acknowledged=a.is_acknowledged,
            created_at=a.created_at
        ))
    return result

@router.post("/{alert_id}/acknowledge")
def acknowledge_warning(
    alert_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    alert = db.query(EarlyWarningAlert).filter(EarlyWarningAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
        
    alert.is_acknowledged = True
    db.commit()
    return {"message": "Alert acknowledged successfully", "alert_id": alert.id}
