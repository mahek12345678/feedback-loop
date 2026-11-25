import hashlib
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import (
    FacultyAction, AcademicIssue, CourseEnrollment, ResolutionVerification,
    User, UserRole, IssueStatus, VerificationOutcome
)
from app.schemas.schemas import VerificationSubmitRequest, VerificationSummaryResponse
from app.api.deps import get_current_user, require_role

router = APIRouter(prefix="/verifications", tags=["Resolution Verification"])

def hash_student_vote(student_id: int, action_id: int) -> str:
    salt = "feedbackloop_verification_salt_2026"
    return hashlib.sha256(f"{student_id}:{action_id}:{salt}".encode('utf-8')).hexdigest()

@router.post("", status_code=status.HTTP_201_CREATED)
def submit_verification(
    req: VerificationSubmitRequest,
    current_user: User = Depends(require_role(UserRole.STUDENT)),
    db: Session = Depends(get_db)
):
    action = db.query(FacultyAction).filter(FacultyAction.id == req.action_id).first()
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")

    issue = db.query(AcademicIssue).filter(AcademicIssue.id == action.issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Associated issue not found")

    # Verify student is enrolled in the course
    enrollment = db.query(CourseEnrollment).filter(
        CourseEnrollment.student_id == current_user.id,
        CourseEnrollment.course_id == issue.course_id
    ).first()
    if not enrollment:
        raise HTTPException(status_code=403, detail="You are not enrolled in this course")

    student_hash = hash_student_vote(current_user.id, action.id)

    existing_vote = db.query(ResolutionVerification).filter(
        ResolutionVerification.action_id == action.id,
        ResolutionVerification.student_id_hash == student_hash
    ).first()

    if existing_vote:
        raise HTTPException(status_code=400, detail="You have already submitted a verification vote for this action")

    vote = ResolutionVerification(
        action_id=action.id,
        student_id_hash=student_hash,
        outcome=req.outcome,
        updated_understanding_rating=req.updated_understanding_rating,
        comment=req.comment
    )
    db.add(vote)
    db.commit()

    # Re-evaluate resolution status
    votes = db.query(ResolutionVerification).filter(ResolutionVerification.action_id == action.id).all()
    if len(votes) >= 3:
        yes_count = sum(1 for v in votes if v.outcome == VerificationOutcome.YES)
        partially_count = sum(1 for v in votes if v.outcome == VerificationOutcome.PARTIALLY)
        no_count = sum(1 for v in votes if v.outcome == VerificationOutcome.NO)
        
        pos_rate = (yes_count + 0.5 * partially_count) / len(votes)
        if pos_rate >= 0.6:
            action.current_status = IssueStatus.VERIFIED_RESOLVED
            issue.status = IssueStatus.VERIFIED_RESOLVED
        elif no_count > (yes_count + partially_count):
            action.current_status = IssueStatus.REOPENED
            issue.status = IssueStatus.REOPENED
            action.public_update = "Verification showed unresolved concerns. Faculty notified to reopen review."

        db.commit()

    return {
        "status": "success",
        "message": "Thank you! Your verification feedback has been anonymously submitted.",
        "action_id": action.id,
        "current_status": action.current_status
    }

@router.get("/action/{action_id}", response_model=VerificationSummaryResponse)
def get_action_verification_summary(
    action_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    action = db.query(FacultyAction).filter(FacultyAction.id == action_id).first()
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")

    votes = db.query(ResolutionVerification).filter(ResolutionVerification.action_id == action_id).all()
    total_votes = len(votes)

    yes_count = sum(1 for v in votes if v.outcome == VerificationOutcome.YES)
    partially_count = sum(1 for v in votes if v.outcome == VerificationOutcome.PARTIALLY)
    no_count = sum(1 for v in votes if v.outcome == VerificationOutcome.NO)

    effectiveness = 0.0
    if total_votes > 0:
        effectiveness = round(((yes_count + 0.5 * partially_count) / total_votes) * 100, 1)

    ratings = [v.updated_understanding_rating for v in votes if v.updated_understanding_rating is not None]
    avg_rating = round(sum(ratings) / len(ratings), 1) if ratings else None

    comments = [v.comment for v in votes if v.comment]

    return VerificationSummaryResponse(
        action_id=action_id,
        total_votes=total_votes,
        yes_count=yes_count,
        partially_count=partially_count,
        no_count=no_count,
        effectiveness_score=effectiveness,
        avg_updated_understanding=avg_rating,
        comments=comments
    )
