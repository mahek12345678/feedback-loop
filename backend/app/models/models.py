import enum
from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey, Enum as SQLEnum, UniqueConstraint
)
from sqlalchemy.orm import relationship
from app.core.database import Base

def utcnow():
    return datetime.now(timezone.utc)

class UserRole(str, enum.Enum):
    STUDENT = "STUDENT"
    FACULTY = "FACULTY"
    ADMIN = "ADMIN"

class IssueSeverity(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class IssueStatus(str, enum.Enum):
    SUBMITTED = "SUBMITTED"
    UNDER_REVIEW = "UNDER_REVIEW"
    ACTION_PLANNED = "ACTION_PLANNED"
    IN_PROGRESS = "IN_PROGRESS"
    ACTION_COMPLETED = "ACTION_COMPLETED"
    VERIFICATION_PENDING = "VERIFICATION_PENDING"
    VERIFIED_RESOLVED = "VERIFIED_RESOLVED"
    REOPENED = "REOPENED"

class WarningSeverity(str, enum.Enum):
    NORMAL = "NORMAL"
    WATCH = "WATCH"
    HIGH_CONCERN = "HIGH_CONCERN"
    CRITICAL_CONCERN = "CRITICAL_CONCERN"

class RecommendationStatus(str, enum.Enum):
    SUGGESTED = "SUGGESTED"
    ACCEPTED = "ACCEPTED"
    MODIFIED = "MODIFIED"
    REJECTED = "REJECTED"

class VerificationOutcome(str, enum.Enum):
    YES = "YES"
    PARTIALLY = "PARTIALLY"
    NO = "NO"

class Department(Base):
    __tablename__ = "departments"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    code = Column(String(20), unique=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    
    users = relationship("User", back_populates="department")
    courses = relationship("Course", back_populates="department")

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(120), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    role = Column(SQLEnum(UserRole), default=UserRole.STUDENT, nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    
    department = relationship("Department", back_populates="users")
    enrollments = relationship("CourseEnrollment", back_populates="student")
    faculty_assignments = relationship("FacultyCourseAssignment", back_populates="faculty")
    notifications = relationship("Notification", back_populates="user")

class Course(Base):
    __tablename__ = "courses"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(30), unique=True, index=True, nullable=False)
    title = Column(String(150), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    term = Column(String(50), nullable=False, default="Fall 2026")
    academic_year = Column(String(20), nullable=False, default="2026-2027")
    privacy_threshold = Column(Integer, default=3, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    
    department = relationship("Department", back_populates="courses")
    enrollments = relationship("CourseEnrollment", back_populates="course")
    faculty_assignments = relationship("FacultyCourseAssignment", back_populates="course")
    opportunities = relationship("FeedbackOpportunity", back_populates="course")
    submissions = relationship("FeedbackSubmission", back_populates="course")
    issues = relationship("AcademicIssue", back_populates="course")
    early_warnings = relationship("EarlyWarningAlert", back_populates="course")

class CourseEnrollment(Base):
    __tablename__ = "course_enrollments"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    enrolled_at = Column(DateTime(timezone=True), default=utcnow)
    
    __table_args__ = (UniqueConstraint('student_id', 'course_id', name='uq_student_course'),)
    
    student = relationship("User", back_populates="enrollments")
    course = relationship("Course", back_populates="enrollments")

class FacultyCourseAssignment(Base):
    __tablename__ = "faculty_course_assignments"
    id = Column(Integer, primary_key=True, index=True)
    faculty_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    is_primary = Column(Boolean, default=True)
    
    __table_args__ = (UniqueConstraint('faculty_id', 'course_id', name='uq_faculty_course'),)
    
    faculty = relationship("User", back_populates="faculty_assignments")
    course = relationship("Course", back_populates="faculty_assignments")

class FeedbackOpportunity(Base):
    __tablename__ = "feedback_opportunities"
    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    week_number = Column(Integer, nullable=False)
    title = Column(String(150), nullable=False)
    topic = Column(String(100), nullable=False)
    start_date = Column(DateTime(timezone=True), default=utcnow)
    end_date = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, default=True)
    
    course = relationship("Course", back_populates="opportunities")
    submissions = relationship("FeedbackSubmission", back_populates="opportunity")

class SubmissionToken(Base):
    """
    Privacy guard: Separates eligibility from submitted feedback.
    A student gets a token per opportunity so they can submit only once,
    but the actual FeedbackSubmission does NOT reference student_id.
    """
    __tablename__ = "submission_tokens"
    id = Column(Integer, primary_key=True, index=True)
    opportunity_id = Column(Integer, ForeignKey("feedback_opportunities.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    has_submitted = Column(Boolean, default=False)
    submitted_at = Column(DateTime(timezone=True), nullable=True)
    
    __table_args__ = (UniqueConstraint('opportunity_id', 'student_id', name='uq_opp_student'),)

class FeedbackSubmission(Base):
    """
    Fully anonymous feedback: No student_id foreign key.
    """
    __tablename__ = "feedback_submissions"
    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    opportunity_id = Column(Integer, ForeignKey("feedback_opportunities.id"), nullable=False)
    faculty_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    topic = Column(String(100), nullable=False)
    category = Column(String(50), nullable=False)  # Teaching clarity, Lecture pace, Course difficulty, etc.
    rating = Column(Integer, nullable=False)  # 1-5
    written_feedback = Column(Text, nullable=True)
    structured_need = Column(Text, nullable=True)
    sentiment = Column(String(20), default="neutral")  # positive, neutral, negative
    sentiment_score = Column(Float, default=0.0)  # -1.0 to 1.0
    created_at = Column(DateTime(timezone=True), default=utcnow)
    
    course = relationship("Course", back_populates="submissions")
    opportunity = relationship("FeedbackOpportunity", back_populates="submissions")

class FeedbackConversation(Base):
    __tablename__ = "feedback_conversations"
    id = Column(Integer, primary_key=True, index=True)
    session_token = Column(String(100), unique=True, index=True, nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    turn_count = Column(Integer, default=0)
    messages_json = Column(Text, default="[]")  # Serialized list of messages
    extracted_json = Column(Text, nullable=True) # Extracted structured feedback
    is_completed = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=utcnow)

class FeedbackTheme(Base):
    __tablename__ = "feedback_themes"
    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    week_number = Column(Integer, nullable=False)
    topic = Column(String(100), nullable=False)
    theme_title = Column(String(200), nullable=False)
    summary = Column(Text, nullable=False)
    sample_size = Column(Integer, default=0)
    negative_ratio = Column(Float, default=0.0)
    cluster_id = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=utcnow)

class AcademicIssue(Base):
    __tablename__ = "academic_issues"
    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    title = Column(String(200), nullable=False)
    topic = Column(String(100), nullable=False)
    category = Column(String(50), nullable=False)
    description = Column(Text, nullable=False)
    severity = Column(SQLEnum(IssueSeverity), default=IssueSeverity.MEDIUM)
    status = Column(SQLEnum(IssueStatus), default=IssueStatus.SUBMITTED)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
    
    course = relationship("Course", back_populates="issues")
    recommendations = relationship("InterventionRecommendation", back_populates="issue")
    actions = relationship("FacultyAction", back_populates="issue")

class EarlyWarningAlert(Base):
    __tablename__ = "early_warning_alerts"
    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    topic = Column(String(100), nullable=False)
    week_number = Column(Integer, nullable=False)
    severity = Column(SQLEnum(WarningSeverity), default=WarningSeverity.WATCH)
    respondent_count = Column(Integer, nullable=False)
    difficulty_percentage = Column(Float, nullable=False)
    wow_change = Column(Float, nullable=False)
    consecutive_worsening_weeks = Column(Integer, default=1)
    rule_triggered = Column(String(200), nullable=False)
    ai_explanation = Column(Text, nullable=False)
    is_acknowledged = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    
    course = relationship("Course", back_populates="early_warnings")

class InterventionRecommendation(Base):
    __tablename__ = "intervention_recommendations"
    id = Column(Integer, primary_key=True, index=True)
    issue_id = Column(Integer, ForeignKey("academic_issues.id"), nullable=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    title = Column(String(200), nullable=False)
    problem_addressed = Column(Text, nullable=False)
    explanation = Column(Text, nullable=False)
    suggested_action = Column(Text, nullable=False)
    expected_benefit = Column(Text, nullable=False)
    priority = Column(String(20), default="MEDIUM")
    status = Column(SQLEnum(RecommendationStatus), default=RecommendationStatus.SUGGESTED)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    
    issue = relationship("AcademicIssue", back_populates="recommendations")

class FacultyAction(Base):
    __tablename__ = "faculty_actions"
    id = Column(Integer, primary_key=True, index=True)
    issue_id = Column(Integer, ForeignKey("academic_issues.id"), nullable=False)
    faculty_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    target_completion_date = Column(DateTime(timezone=True), nullable=True)
    current_status = Column(SQLEnum(IssueStatus), default=IssueStatus.ACTION_PLANNED)
    public_update = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    issue = relationship("AcademicIssue", back_populates="actions")
    faculty = relationship("User")
    history = relationship("ActionStatusHistory", back_populates="action")
    verifications = relationship("ResolutionVerification", back_populates="action")

class ActionStatusHistory(Base):
    __tablename__ = "action_status_history"
    id = Column(Integer, primary_key=True, index=True)
    action_id = Column(Integer, ForeignKey("faculty_actions.id"), nullable=False)
    from_status = Column(SQLEnum(IssueStatus), nullable=False)
    to_status = Column(SQLEnum(IssueStatus), nullable=False)
    changed_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    
    action = relationship("FacultyAction", back_populates="history")
    changed_by = relationship("User")

class ResolutionVerification(Base):
    __tablename__ = "resolution_verifications"
    id = Column(Integer, primary_key=True, index=True)
    action_id = Column(Integer, ForeignKey("faculty_actions.id"), nullable=False)
    student_id_hash = Column(String(64), nullable=False) # Pseudonymized hash for 1-vote-per-student
    outcome = Column(SQLEnum(VerificationOutcome), nullable=False)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    
    __table_args__ = (UniqueConstraint('action_id', 'student_id_hash', name='uq_action_student_hash'),)
    
    action = relationship("FacultyAction", back_populates="verifications")

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    link_url = Column(String(200), nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    
    user = relationship("User", back_populates="notifications")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False)
    resource_type = Column(String(50), nullable=False)
    resource_id = Column(Integer, nullable=True)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)
