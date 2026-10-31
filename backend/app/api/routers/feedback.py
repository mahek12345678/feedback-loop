from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from app.core.database import get_db
from app.models.models import (
    Course, CourseEnrollment, FeedbackOpportunity, SubmissionToken, FeedbackSubmission,
    User, UserRole, FacultyCourseAssignment
)
from app.schemas.schemas import (
    FeedbackOpportunityResponse, FeedbackSubmitRequest, FeedbackSubmissionResponse
)
from app.api.deps import get_current_user, require_role

router = APIRouter(prefix="/feedback", tags=["Feedback"])

def analyze_simple_sentiment(rating: int, text: Optional[str]) -> tuple[str, float]:
    """Helper for instant rule-based sentiment calculation."""
    score = (rating - 3.0) / 2.0  # rating 1=-1.0, 3=0.0, 5=1.0
    if text:
        neg_words = {"difficult", "hard", "confusing", "fast", "terrible", "struggling", "unclear", "poor", "too fast", "lost"}
        pos_words = {"clear", "great", "helpful", "good", "excellent", "understood", "paced well", "awesome"}
        lower_text = text.lower()
        neg_count = sum(1 for w in neg_words if w in lower_text)
        pos_count = sum(1 for w in pos_words if w in lower_text)
        if neg_count > pos_count:
            score = min(score, -0.4)
        elif pos_count > neg_count:
            score = max(score, 0.4)
    
    if score > 0.2:
        return "positive", round(score, 2)
    elif score < -0.2:
        return "negative", round(score, 2)
    else:
        return "neutral", round(score, 2)

@router.get("/opportunities", response_model=List[FeedbackOpportunityResponse])
def get_feedback_opportunities(
    current_user: User = Depends(require_role(UserRole.STUDENT)),
    db: Session = Depends(get_db)
):
    enrolled_courses = db.query(CourseEnrollment).filter(CourseEnrollment.student_id == current_user.id).all()
    course_ids = [e.course_id for e in enrolled_courses]
    if not course_ids:
        return []

    opportunities = db.query(FeedbackOpportunity).filter(
        FeedbackOpportunity.course_id.in_(course_ids),
        FeedbackOpportunity.is_active == True
    ).all()

    result = []
    for opp in opportunities:
        course = db.query(Course).filter(Course.id == opp.course_id).first()
        token = db.query(SubmissionToken).filter(
            SubmissionToken.opportunity_id == opp.id,
            SubmissionToken.student_id == current_user.id
        ).first()
        has_submitted = token.has_submitted if token else False

        result.append(FeedbackOpportunityResponse(
            id=opp.id,
            course_id=opp.course_id,
            course_title=course.title if course else None,
            course_code=course.code if course else None,
            week_number=opp.week_number,
            title=opp.title,
            topic=opp.topic,
            start_date=opp.start_date,
            end_date=opp.end_date,
            is_active=opp.is_active,
            has_submitted=has_submitted
        ))
    return result

@router.post("/submit", status_code=status.HTTP_201_CREATED)
def submit_feedback(
    submission: FeedbackSubmitRequest,
    current_user: User = Depends(require_role(UserRole.STUDENT)),
    db: Session = Depends(get_db)
):
    opportunity = db.query(FeedbackOpportunity).filter(FeedbackOpportunity.id == submission.opportunity_id).first()
    if not opportunity or not opportunity.is_active:
        raise HTTPException(status_code=400, detail="This feedback opportunity is not currently active")

    # Check student is enrolled
    enrollment = db.query(CourseEnrollment).filter(
        CourseEnrollment.student_id == current_user.id,
        CourseEnrollment.course_id == opportunity.course_id
    ).first()
    if not enrollment:
        raise HTTPException(status_code=403, detail="You are not enrolled in this course")

    # Check duplicate submission token
    token = db.query(SubmissionToken).filter(
        SubmissionToken.opportunity_id == opportunity.id,
        SubmissionToken.student_id == current_user.id
    ).first()

    if token and token.has_submitted:
        raise HTTPException(status_code=400, detail="You have already submitted feedback for this opportunity")

    if not token:
        token = SubmissionToken(
            opportunity_id=opportunity.id,
            student_id=current_user.id,
            has_submitted=True,
            submitted_at=datetime.now(timezone.utc)
        )
        db.add(token)
    else:
        token.has_submitted = True
        token.submitted_at = datetime.now(timezone.utc)

    # Compute sentiment
    sentiment_label, sentiment_score = analyze_simple_sentiment(submission.rating, submission.written_feedback)

    # Store fully anonymous feedback submission (NO student_id stored)
    feedback_entry = FeedbackSubmission(
        course_id=opportunity.course_id,
        opportunity_id=opportunity.id,
        faculty_id=submission.faculty_id,
        topic=opportunity.topic,
        category=submission.category,
        rating=submission.rating,
        written_feedback=submission.written_feedback,
        structured_need=submission.structured_need,
        sentiment=sentiment_label,
        sentiment_score=sentiment_score
    )
    db.add(feedback_entry)
    db.commit()

    return {
        "status": "success",
        "message": "Your anonymous feedback has been recorded securely.",
        "course_id": opportunity.course_id,
        "week_number": opportunity.week_number
    }

@router.get("/my-history")
def get_student_feedback_history(
    current_user: User = Depends(require_role(UserRole.STUDENT)),
    db: Session = Depends(get_db)
):
    tokens = db.query(SubmissionToken).filter(
        SubmissionToken.student_id == current_user.id,
        SubmissionToken.has_submitted == True
    ).order_by(SubmissionToken.submitted_at.desc()).all()

    history = []
    for t in tokens:
        opp = db.query(FeedbackOpportunity).filter(FeedbackOpportunity.id == t.opportunity_id).first()
        if opp:
            course = db.query(Course).filter(Course.id == opp.course_id).first()
            history.append({
                "submission_id": t.id,
                "opportunity_title": opp.title,
                "week_number": opp.week_number,
                "topic": opp.topic,
                "course_title": course.title if course else "Unknown",
                "course_code": course.code if course else "",
                "submitted_at": t.submitted_at
            })
    return history

@router.get("/course/{course_id}")
def get_course_feedback_for_faculty(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify faculty assignment or admin
    if current_user.role == UserRole.FACULTY:
        assigned = db.query(FacultyCourseAssignment).filter(
            FacultyCourseAssignment.faculty_id == current_user.id,
            FacultyCourseAssignment.course_id == course_id
        ).first()
        if not assigned:
            raise HTTPException(status_code=403, detail="You are not assigned to this course")

    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    submissions = db.query(FeedbackSubmission).filter(FeedbackSubmission.course_id == course_id).all()
    total_submissions = len(submissions)

    # Privacy threshold check
    is_privacy_shield_active = total_submissions < course.privacy_threshold

    # Calculate metrics
    avg_rating = round(sum(s.rating for s in submissions) / total_submissions, 2) if total_submissions > 0 else 0.0
    sentiment_counts = {"positive": 0, "neutral": 0, "negative": 0}
    category_counts: Dict[str, int] = {}
    difficulty_reports = 0

    for s in submissions:
        sentiment_counts[s.sentiment] = sentiment_counts.get(s.sentiment, 0) + 1
        category_counts[s.category] = category_counts.get(s.category, 0) + 1
        if s.rating <= 2 or s.sentiment == "negative":
            difficulty_reports += 1

    difficulty_percentage = round((difficulty_reports / total_submissions) * 100, 1) if total_submissions > 0 else 0.0

    # Only show comments if privacy threshold is met
    comments_list = []
    if not is_privacy_shield_active:
        comments_list = [
            {
                "id": s.id,
                "topic": s.topic,
                "category": s.category,
                "rating": s.rating,
                "written_feedback": s.written_feedback,
                "structured_need": s.structured_need,
                "sentiment": s.sentiment,
                "created_at": s.created_at
            }
            for s in submissions if s.written_feedback
        ]

    return {
        "course_id": course.id,
        "course_title": course.title,
        "course_code": course.code,
        "privacy_threshold": course.privacy_threshold,
        "total_submissions": total_submissions,
        "is_privacy_shield_active": is_privacy_shield_active,
        "average_rating": avg_rating,
        "difficulty_percentage": difficulty_percentage,
        "sentiment_counts": sentiment_counts,
        "category_counts": category_counts,
        "comments": comments_list
    }
