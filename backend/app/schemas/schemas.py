from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.models.models import UserRole, IssueSeverity, IssueStatus, WarningSeverity, RecommendationStatus, VerificationOutcome

# --- AUTH SCHEMAS ---
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: UserRole = UserRole.STUDENT
    department_id: Optional[int] = None

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class TokenData(BaseModel):
    user_id: Optional[int] = None
    role: Optional[str] = None

# --- COURSE SCHEMAS ---
class DepartmentResponse(BaseModel):
    id: int
    name: str
    code: str
    model_config = ConfigDict(from_attributes=True)

class CourseResponse(BaseModel):
    id: int
    code: str
    title: str
    department_id: int
    department_name: Optional[str] = None
    term: str
    academic_year: str
    privacy_threshold: int
    enrolled_count: Optional[int] = 0
    faculty_names: Optional[List[str]] = []
    has_active_opportunity: Optional[bool] = False
    active_week: Optional[int] = None
    active_topic: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class CourseCreate(BaseModel):
    code: str
    title: str
    department_id: int
    term: str = "Fall 2026"
    academic_year: str = "2026-2027"
    privacy_threshold: int = 3

class EnrollmentCreate(BaseModel):
    course_id: int

# --- FEEDBACK SCHEMAS ---
class FeedbackOpportunityResponse(BaseModel):
    id: int
    course_id: int
    course_title: Optional[str] = None
    course_code: Optional[str] = None
    week_number: int
    title: str
    topic: str
    start_date: datetime
    end_date: Optional[datetime] = None
    is_active: bool
    has_submitted: Optional[bool] = False
    model_config = ConfigDict(from_attributes=True)

class FeedbackSubmitRequest(BaseModel):
    opportunity_id: int
    faculty_id: Optional[int] = None
    category: str
    rating: int = Field(ge=1, le=5)
    written_feedback: Optional[str] = None
    structured_need: Optional[str] = None

class FeedbackSubmissionResponse(BaseModel):
    id: int
    course_id: int
    opportunity_id: int
    topic: str
    category: str
    rating: int
    written_feedback: Optional[str]
    structured_need: Optional[str]
    sentiment: str
    sentiment_score: float
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- AI SCHEMAS ---
class AIChatMessage(BaseModel):
    role: str # user, assistant, system
    content: str

class AIChatRequest(BaseModel):
    course_id: int
    opportunity_id: int
    session_token: Optional[str] = None
    message: str
    conversation_history: List[AIChatMessage] = []

class ExtractedFeedback(BaseModel):
    course: Optional[str] = None
    topic: Optional[str] = None
    category: str = "Teaching clarity"
    issue: str
    suggested_need: str
    rating: int = 3
    sentiment: str = "neutral"

class AIChatResponse(BaseModel):
    session_token: str
    reply: str
    is_completed: bool = False
    extracted_feedback: Optional[ExtractedFeedback] = None
    turn_count: int

class FeedbackThemeResponse(BaseModel):
    id: int
    course_id: int
    week_number: int
    topic: str
    theme_title: str
    summary: str
    sample_size: int
    negative_ratio: float
    model_config = ConfigDict(from_attributes=True)

# --- ACADEMIC ISSUES & EARLY WARNINGS ---
class AcademicIssueCreate(BaseModel):
    course_id: int
    title: str
    topic: str
    category: str
    description: str
    severity: IssueSeverity = IssueSeverity.MEDIUM

class AcademicIssueResponse(BaseModel):
    id: int
    course_id: int
    course_code: Optional[str] = None
    title: str
    topic: str
    category: str
    description: str
    severity: IssueSeverity
    status: IssueStatus
    created_at: datetime
    updated_at: datetime
    actions_count: Optional[int] = 0
    latest_public_update: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class EarlyWarningResponse(BaseModel):
    id: int
    course_id: int
    course_code: Optional[str] = None
    course_title: Optional[str] = None
    topic: str
    week_number: int
    severity: WarningSeverity
    respondent_count: int
    difficulty_percentage: float
    wow_change: float
    consecutive_worsening_weeks: int
    rule_triggered: str
    ai_explanation: str
    is_acknowledged: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- INTERVENTION RECOMMENDATIONS ---
class RecommendationResponse(BaseModel):
    id: int
    issue_id: Optional[int]
    course_id: int
    title: str
    problem_addressed: str
    explanation: str
    suggested_action: str
    expected_benefit: str
    priority: str
    status: RecommendationStatus
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class RecommendationActionRequest(BaseModel):
    status: RecommendationStatus
    modified_action: Optional[str] = None

# --- FACULTY ACTIONS ---
class FacultyActionCreate(BaseModel):
    issue_id: int
    title: str
    description: str
    target_completion_date: Optional[datetime] = None
    public_update: Optional[str] = None

class FacultyActionUpdate(BaseModel):
    status: IssueStatus
    public_update: Optional[str] = None
    comment: Optional[str] = None

class ActionStatusHistoryResponse(BaseModel):
    id: int
    from_status: IssueStatus
    to_status: IssueStatus
    changed_by_name: str
    comment: Optional[str]
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class FacultyActionResponse(BaseModel):
    id: int
    issue_id: int
    issue_title: Optional[str] = None
    issue_topic: Optional[str] = None
    course_id: Optional[int] = None
    course_code: Optional[str] = None
    faculty_id: int
    faculty_name: Optional[str] = None
    title: str
    description: str
    target_completion_date: Optional[datetime]
    current_status: IssueStatus
    public_update: Optional[str]
    created_at: datetime
    completed_at: Optional[datetime]
    history: List[ActionStatusHistoryResponse] = []
    model_config = ConfigDict(from_attributes=True)

# --- RESOLUTION VERIFICATION ---
class VerificationSubmitRequest(BaseModel):
    action_id: int
    outcome: VerificationOutcome
    updated_understanding_rating: Optional[int] = Field(None, ge=1, le=5)
    comment: Optional[str] = None

class VerificationSummaryResponse(BaseModel):
    action_id: int
    total_votes: int
    yes_count: int
    partially_count: int
    no_count: int
    effectiveness_score: float # % positive/partially positive
    avg_updated_understanding: Optional[float] = None
    comments: List[str] = []

# --- ANALYTICS SCHEMAS ---
class StudentAnalytics(BaseModel):
    enrolled_courses_count: int
    feedback_submitted_count: int
    pending_feedback_count: int
    pending_verifications_count: int
    recent_actions: List[Dict[str, Any]] = []

class FacultyAnalytics(BaseModel):
    assigned_courses_count: int
    total_feedback_count: int
    overall_sentiment_positive: float
    overall_sentiment_neutral: float
    overall_sentiment_negative: float
    active_warnings_count: int
    open_issues_count: int
    actions_in_progress_count: int
    resolved_actions_count: int
    avg_effectiveness_score: float

class AdminAnalytics(BaseModel):
    total_students: int
    total_faculty: int
    total_courses: int
    total_feedback_count: int
    avg_response_rate: float
    open_issues_count: int
    total_actions_count: int
    avg_resolution_days: float
    overall_resolution_rate: float
    department_stats: List[Dict[str, Any]] = []
