from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone
from app.core.database import get_db
from app.models.models import (
    Course, CourseEnrollment, FacultyCourseAssignment, Department, User, UserRole,
    FeedbackOpportunity, SubmissionToken
)
from app.schemas.schemas import CourseResponse, CourseCreate, EnrollmentCreate, DepartmentResponse
from app.api.deps import get_current_user, require_role

router = APIRouter(prefix="/courses", tags=["Courses"])

@router.get("/departments", response_model=List[DepartmentResponse])
def get_departments(db: Session = Depends(get_db)):
    return db.query(Department).all()

@router.get("", response_model=List[CourseResponse])
def get_courses(
    browse_all: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role == UserRole.STUDENT and not browse_all:
        # Enrolled courses only
        enrolled_course_ids = [
            e.course_id for e in db.query(CourseEnrollment).filter(CourseEnrollment.student_id == current_user.id).all()
        ]
        courses = db.query(Course).filter(Course.id.in_(enrolled_course_ids)).all() if enrolled_course_ids else []
    elif current_user.role == UserRole.FACULTY and not browse_all:
        assigned_course_ids = [
            a.course_id for a in db.query(FacultyCourseAssignment).filter(FacultyCourseAssignment.faculty_id == current_user.id).all()
        ]
        courses = db.query(Course).filter(Course.id.in_(assigned_course_ids)).all() if assigned_course_ids else []
    else:
        # Admin or browse_all
        courses = db.query(Course).all()

    result = []
    now = datetime.now(timezone.utc)
    for c in courses:
        dept = db.query(Department).filter(Department.id == c.department_id).first()
        dept_name = dept.name if dept else None
        
        # Enrollment count
        enrolled_count = db.query(CourseEnrollment).filter(CourseEnrollment.course_id == c.id).count()
        
        # Faculty names
        faculty_assigns = db.query(FacultyCourseAssignment).filter(FacultyCourseAssignment.course_id == c.id).all()
        faculty_names = []
        for fa in faculty_assigns:
            fac = db.query(User).filter(User.id == fa.faculty_id).first()
            if fac:
                faculty_names.append(fac.full_name)
        
        # Active opportunity
        active_opp = db.query(FeedbackOpportunity).filter(
            FeedbackOpportunity.course_id == c.id,
            FeedbackOpportunity.is_active == True
        ).first()

        result.append(CourseResponse(
            id=c.id,
            code=c.code,
            title=c.title,
            department_id=c.department_id,
            department_name=dept_name,
            term=c.term,
            academic_year=c.academic_year,
            privacy_threshold=c.privacy_threshold,
            enrolled_count=enrolled_count,
            faculty_names=faculty_names,
            has_active_opportunity=active_opp is not None,
            active_week=active_opp.week_number if active_opp else None,
            active_topic=active_opp.topic if active_opp else None
        ))
    return result

@router.get("/{course_id}", response_model=CourseResponse)
def get_course_detail(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    c = db.query(Course).filter(Course.id == course_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Course not found")
        
    dept = db.query(Department).filter(Department.id == c.department_id).first()
    enrolled_count = db.query(CourseEnrollment).filter(CourseEnrollment.course_id == c.id).count()
    faculty_assigns = db.query(FacultyCourseAssignment).filter(FacultyCourseAssignment.course_id == c.id).all()
    faculty_names = [db.query(User).filter(User.id == fa.faculty_id).first().full_name for fa in faculty_assigns if db.query(User).filter(User.id == fa.faculty_id).first()]
    
    active_opp = db.query(FeedbackOpportunity).filter(
        FeedbackOpportunity.course_id == c.id,
        FeedbackOpportunity.is_active == True
    ).first()

    return CourseResponse(
        id=c.id,
        code=c.code,
        title=c.title,
        department_id=c.department_id,
        department_name=dept.name if dept else None,
        term=c.term,
        academic_year=c.academic_year,
        privacy_threshold=c.privacy_threshold,
        enrolled_count=enrolled_count,
        faculty_names=faculty_names,
        has_active_opportunity=active_opp is not None,
        active_week=active_opp.week_number if active_opp else None,
        active_topic=active_opp.topic if active_opp else None
    )

@router.post("/enroll", status_code=status.HTTP_201_CREATED)
def enroll_student(
    enroll_in: EnrollmentCreate,
    current_user: User = Depends(require_role(UserRole.STUDENT)),
    db: Session = Depends(get_db)
):
    course = db.query(Course).filter(Course.id == enroll_in.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
        
    existing = db.query(CourseEnrollment).filter(
        CourseEnrollment.student_id == current_user.id,
        CourseEnrollment.course_id == enroll_in.course_id
    ).first()
    if existing:
        return {"message": "Already enrolled in this course"}
        
    enrollment = CourseEnrollment(
        student_id=current_user.id,
        course_id=enroll_in.course_id
    )
    db.add(enrollment)
    db.commit()
    return {"message": f"Successfully enrolled in {course.code} - {course.title}"}

@router.post("", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
def create_course(
    course_in: CourseCreate,
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    existing = db.query(Course).filter(Course.code == course_in.code.upper().strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Course with this code already exists")
        
    course = Course(
        code=course_in.code.upper().strip(),
        title=course_in.title,
        department_id=course_in.department_id,
        term=course_in.term,
        academic_year=course_in.academic_year,
        privacy_threshold=course_in.privacy_threshold
    )
    db.add(course)
    db.commit()
    db.refresh(course)
    return CourseResponse(
        id=course.id,
        code=course.code,
        title=course.title,
        department_id=course.department_id,
        term=course.term,
        academic_year=course.academic_year,
        privacy_threshold=course.privacy_threshold,
        enrolled_count=0,
        faculty_names=[],
        has_active_opportunity=False
    )
