from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone
from app.core.database import get_db
from app.models.models import (
    Course, AcademicIssue, FacultyAction, ActionStatusHistory,
    InterventionRecommendation, CourseEnrollment, Notification, User, UserRole,
    IssueStatus, RecommendationStatus
)
from app.schemas.schemas import (
    AcademicIssueCreate, AcademicIssueResponse, FacultyActionCreate,
    FacultyActionUpdate, FacultyActionResponse, ActionStatusHistoryResponse,
    RecommendationResponse, RecommendationActionRequest
)
from app.services.recommendation_engine import recommendation_engine
from app.api.deps import get_current_user, require_role

router = APIRouter(prefix="/actions", tags=["Actions & Interventions"])

# --- ACADEMIC ISSUES ---
@router.post("/issues", response_model=AcademicIssueResponse, status_code=status.HTTP_201_CREATED)
def create_issue(
    issue_in: AcademicIssueCreate,
    current_user: User = Depends(require_role(UserRole.FACULTY, UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    issue = AcademicIssue(
        course_id=issue_in.course_id,
        title=issue_in.title,
        topic=issue_in.topic,
        category=issue_in.category,
        description=issue_in.description,
        severity=issue_in.severity,
        status=IssueStatus.SUBMITTED
    )
    db.add(issue)
    db.commit()
    db.refresh(issue)
    return issue

@router.get("/issues/course/{course_id}", response_model=List[AcademicIssueResponse])
def get_course_issues(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
        
    issues = db.query(AcademicIssue).filter(
        AcademicIssue.course_id == course_id
    ).order_by(AcademicIssue.created_at.desc()).all()

    result = []
    for issue in issues:
        act_count = db.query(FacultyAction).filter(FacultyAction.issue_id == issue.id).count()
        latest_act = db.query(FacultyAction).filter(FacultyAction.issue_id == issue.id).order_by(FacultyAction.created_at.desc()).first()
        result.append(AcademicIssueResponse(
            id=issue.id,
            course_id=issue.course_id,
            course_code=course.code,
            title=issue.title,
            topic=issue.topic,
            category=issue.category,
            description=issue.description,
            severity=issue.severity,
            status=issue.status,
            created_at=issue.created_at,
            updated_at=issue.updated_at,
            actions_count=act_count,
            latest_public_update=latest_act.public_update if latest_act else None
        ))
    return result

# --- RECOMMENDATIONS ---
@router.post("/issues/{issue_id}/recommendations", response_model=List[RecommendationResponse])
async def get_or_generate_recommendations(
    issue_id: int,
    current_user: User = Depends(require_role(UserRole.FACULTY, UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    issue = db.query(AcademicIssue).filter(AcademicIssue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Academic issue not found")

    recs = await recommendation_engine.generate_recommendations_for_issue(db, issue)
    return recs

@router.post("/recommendations/{rec_id}/respond", response_model=RecommendationResponse)
def respond_to_recommendation(
    rec_id: int,
    req: RecommendationActionRequest,
    current_user: User = Depends(require_role(UserRole.FACULTY, UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    rec = db.query(InterventionRecommendation).filter(InterventionRecommendation.id == rec_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")

    rec.status = req.status
    if req.modified_action:
        rec.suggested_action = req.modified_action

    # If accepted, automatically create a linked FacultyAction draft if not existing
    if req.status == RecommendationStatus.ACCEPTED and rec.issue_id:
        existing_action = db.query(FacultyAction).filter(
            FacultyAction.issue_id == rec.issue_id,
            FacultyAction.title == rec.title
        ).first()
        if not existing_action:
            action = FacultyAction(
                issue_id=rec.issue_id,
                faculty_id=current_user.id,
                title=rec.title,
                description=rec.suggested_action,
                current_status=IssueStatus.ACTION_PLANNED,
                public_update=f"Faculty planned intervention: {rec.title}"
            )
            db.add(action)
            db.flush()
            # Status history
            history = ActionStatusHistory(
                action_id=action.id,
                from_status=IssueStatus.SUBMITTED,
                to_status=IssueStatus.ACTION_PLANNED,
                changed_by_user_id=current_user.id,
                comment="Accepted AI recommended intervention"
            )
            db.add(history)
            
            # Update parent issue status
            issue = db.query(AcademicIssue).filter(AcademicIssue.id == rec.issue_id).first()
            if issue:
                issue.status = IssueStatus.ACTION_PLANNED

    db.commit()
    db.refresh(rec)
    return rec

# --- FACULTY ACTIONS ---
@router.post("", response_model=FacultyActionResponse, status_code=status.HTTP_201_CREATED)
def create_faculty_action(
    action_in: FacultyActionCreate,
    current_user: User = Depends(require_role(UserRole.FACULTY, UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    issue = db.query(AcademicIssue).filter(AcademicIssue.id == action_in.issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Academic issue not found")

    action = FacultyAction(
        issue_id=action_in.issue_id,
        faculty_id=current_user.id,
        title=action_in.title,
        description=action_in.description,
        target_completion_date=action_in.target_completion_date,
        current_status=IssueStatus.ACTION_PLANNED,
        public_update=action_in.public_update or f"Faculty committed to action: {action_in.title}"
    )
    db.add(action)
    db.commit()
    db.refresh(action)

    # History record
    history = ActionStatusHistory(
        action_id=action.id,
        from_status=IssueStatus.SUBMITTED,
        to_status=IssueStatus.ACTION_PLANNED,
        changed_by_user_id=current_user.id,
        comment="Created initial improvement action"
    )
    db.add(history)

    # Update issue status
    issue.status = IssueStatus.ACTION_PLANNED

    # Notify enrolled students
    enrollments = db.query(CourseEnrollment).filter(CourseEnrollment.course_id == issue.course_id).all()
    for e in enrollments:
        notif = Notification(
            user_id=e.student_id,
            title="Faculty Improvement Action Planned",
            message=f"Professor announced an action for {issue.topic}: {action.title}",
            link_url=f"/student/courses/{issue.course_id}"
        )
        db.add(notif)

    db.commit()

    return FacultyActionResponse(
        id=action.id,
        issue_id=action.issue_id,
        issue_title=issue.title,
        issue_topic=issue.topic,
        course_id=issue.course_id,
        faculty_id=action.faculty_id,
        faculty_name=current_user.full_name,
        title=action.title,
        description=action.description,
        target_completion_date=action.target_completion_date,
        current_status=action.current_status,
        public_update=action.public_update,
        created_at=action.created_at,
        completed_at=action.completed_at
    )

@router.patch("/{action_id}", response_model=FacultyActionResponse)
def update_action_status(
    action_id: int,
    update_in: FacultyActionUpdate,
    current_user: User = Depends(require_role(UserRole.FACULTY, UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    action = db.query(FacultyAction).filter(FacultyAction.id == action_id).first()
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")

    old_status = action.current_status
    action.current_status = update_in.status
    if update_in.public_update:
        action.public_update = update_in.public_update

    if update_in.status in [IssueStatus.ACTION_COMPLETED, IssueStatus.VERIFICATION_PENDING]:
        action.completed_at = datetime.now(timezone.utc)

    # Log transition
    history = ActionStatusHistory(
        action_id=action.id,
        from_status=old_status,
        to_status=update_in.status,
        changed_by_user_id=current_user.id,
        comment=update_in.comment or f"Status shifted from {old_status.value} to {update_in.status.value}"
    )
    db.add(history)

    # Sync with issue status
    issue = db.query(AcademicIssue).filter(AcademicIssue.id == action.issue_id).first()
    if issue:
        issue.status = update_in.status

        # If entering verification pending, notify students to verify!
        if update_in.status in [IssueStatus.ACTION_COMPLETED, IssueStatus.VERIFICATION_PENDING]:
            enrollments = db.query(CourseEnrollment).filter(CourseEnrollment.course_id == issue.course_id).all()
            for e in enrollments:
                notif = Notification(
                    user_id=e.student_id,
                    title="Please Verify Improvement: " + action.title,
                    message=f"Faculty completed: '{action.title}'. Did this improve your understanding of {issue.topic}? Tap to verify.",
                    link_url=f"/student/verify/{action.id}"
                )
                db.add(notif)

    db.commit()
    db.refresh(action)

    faculty_user = db.query(User).filter(User.id == action.faculty_id).first()
    return FacultyActionResponse(
        id=action.id,
        issue_id=action.issue_id,
        issue_title=issue.title if issue else None,
        issue_topic=issue.topic if issue else None,
        course_id=issue.course_id if issue else None,
        faculty_id=action.faculty_id,
        faculty_name=faculty_user.full_name if faculty_user else None,
        title=action.title,
        description=action.description,
        target_completion_date=action.target_completion_date,
        current_status=action.current_status,
        public_update=action.public_update,
        created_at=action.created_at,
        completed_at=action.completed_at
    )

@router.get("/course/{course_id}", response_model=List[FacultyActionResponse])
def get_course_actions(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    issues = db.query(AcademicIssue).filter(AcademicIssue.course_id == course_id).all()
    issue_ids = [i.id for i in issues]
    if not issue_ids:
        return []

    actions = db.query(FacultyAction).filter(FacultyAction.issue_id.in_(issue_ids)).order_by(FacultyAction.created_at.desc()).all()
    
    result = []
    for act in actions:
        issue = next((i for i in issues if i.id == act.issue_id), None)
        fac = db.query(User).filter(User.id == act.faculty_id).first()
        histories = db.query(ActionStatusHistory).filter(ActionStatusHistory.action_id == act.id).order_by(ActionStatusHistory.created_at.asc()).all()

        history_items = []
        for h in histories:
            actor = db.query(User).filter(User.id == h.changed_by_user_id).first()
            history_items.append(ActionStatusHistoryResponse(
                id=h.id,
                from_status=h.from_status,
                to_status=h.to_status,
                changed_by_name=actor.full_name if actor else "User",
                comment=h.comment,
                created_at=h.created_at
            ))

        result.append(FacultyActionResponse(
            id=act.id,
            issue_id=act.issue_id,
            issue_title=issue.title if issue else None,
            issue_topic=issue.topic if issue else None,
            course_id=course_id,
            faculty_id=act.faculty_id,
            faculty_name=fac.full_name if fac else None,
            title=act.title,
            description=act.description,
            target_completion_date=act.target_completion_date,
            current_status=act.current_status,
            public_update=act.public_update,
            created_at=act.created_at,
            completed_at=act.completed_at,
            history=history_items
        ))
    return result
