export type UserRole = 'STUDENT' | 'FACULTY' | 'ADMIN';

export type IssueSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type IssueStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'ACTION_PLANNED'
  | 'IN_PROGRESS'
  | 'ACTION_COMPLETED'
  | 'VERIFICATION_PENDING'
  | 'VERIFIED_RESOLVED'
  | 'REOPENED';

export type WarningSeverity = 'NORMAL' | 'WATCH' | 'HIGH_CONCERN' | 'CRITICAL_CONCERN';

export type RecommendationStatus = 'SUGGESTED' | 'ACCEPTED' | 'MODIFIED' | 'REJECTED';

export type VerificationOutcome = 'YES' | 'PARTIALLY' | 'NO';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  department_id?: number;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Course {
  id: number;
  code: string;
  title: string;
  department_id: number;
  department_name?: string;
  term: string;
  academic_year: string;
  privacy_threshold: number;
  enrolled_count: number;
  faculty_names: string[];
  has_active_opportunity: boolean;
  active_week?: number;
  active_topic?: string;
}

export interface FeedbackOpportunity {
  id: number;
  course_id: number;
  course_title?: string;
  course_code?: string;
  week_number: number;
  title: string;
  topic: string;
  start_date: string;
  end_date?: string;
  is_active: boolean;
  has_submitted?: boolean;
}

export interface ExtractedFeedback {
  course?: string;
  topic?: string;
  category: string;
  issue: string;
  suggested_need: string;
  rating: number;
  sentiment: string;
}

export interface AIChatResponse {
  session_token: string;
  reply: string;
  is_completed: boolean;
  extracted_feedback?: ExtractedFeedback;
  turn_count: number;
}

export interface FeedbackSubmission {
  id: number;
  course_id: number;
  opportunity_id: number;
  topic: string;
  category: string;
  rating: number;
  written_feedback?: string;
  structured_need?: string;
  sentiment: string;
  sentiment_score: number;
  created_at: string;
}

export interface CourseFeedbackData {
  course_id: number;
  course_title: string;
  course_code: string;
  privacy_threshold: number;
  total_submissions: number;
  is_privacy_shield_active: boolean;
  average_rating: number;
  difficulty_percentage: number;
  sentiment_counts: {
    positive: number;
    neutral: number;
    negative: number;
  };
  category_counts: Record<string, number>;
  comments: Array<{
    id: number;
    topic: string;
    category: string;
    rating: number;
    written_feedback: string;
    structured_need?: string;
    sentiment: string;
    created_at: string;
  }>;
}

export interface EarlyWarningAlert {
  id: number;
  course_id: number;
  course_code?: string;
  course_title?: string;
  topic: string;
  week_number: number;
  severity: WarningSeverity;
  respondent_count: number;
  difficulty_percentage: number;
  wow_change: number;
  consecutive_worsening_weeks: number;
  rule_triggered: string;
  ai_explanation: string;
  is_acknowledged: boolean;
  created_at: string;
}

export interface AcademicIssue {
  id: number;
  course_id: number;
  course_code?: string;
  title: string;
  topic: string;
  category: string;
  description: string;
  severity: IssueSeverity;
  status: IssueStatus;
  created_at: string;
  updated_at: string;
  actions_count?: number;
  latest_public_update?: string;
}

export interface InterventionRecommendation {
  id: number;
  issue_id?: number;
  course_id: number;
  title: string;
  problem_addressed: string;
  explanation: string;
  suggested_action: string;
  expected_benefit: string;
  priority: string;
  status: RecommendationStatus;
  created_at: string;
}

export interface ActionStatusHistory {
  id: number;
  from_status: IssueStatus;
  to_status: IssueStatus;
  changed_by_name: string;
  comment?: string;
  created_at: string;
}

export interface FacultyAction {
  id: number;
  issue_id: number;
  issue_title?: string;
  issue_topic?: string;
  course_id?: number;
  course_code?: string;
  faculty_id: number;
  faculty_name?: string;
  title: string;
  description: string;
  target_completion_date?: string;
  current_status: IssueStatus;
  public_update?: string;
  created_at: string;
  completed_at?: string;
  history: ActionStatusHistory[];
}

export interface VerificationSummary {
  action_id: number;
  total_votes: number;
  yes_count: number;
  partially_count: number;
  no_count: number;
  effectiveness_score: number;
  comments: string[];
}

export interface StudentAnalytics {
  enrolled_courses_count: number;
  feedback_submitted_count: number;
  pending_feedback_count: number;
  pending_verifications_count: number;
  recent_actions: Array<{
    action_id: number;
    title: string;
    topic: string;
    course_code: string;
    current_status: string;
    public_update?: string;
    updated_at: string;
  }>;
}

export interface FacultyAnalytics {
  assigned_courses_count: number;
  total_feedback_count: number;
  overall_sentiment_positive: number;
  overall_sentiment_neutral: number;
  overall_sentiment_negative: number;
  active_warnings_count: number;
  open_issues_count: number;
  actions_in_progress_count: number;
  resolved_actions_count: number;
  avg_effectiveness_score: number;
}

export interface AdminAnalytics {
  total_students: number;
  total_faculty: number;
  total_courses: number;
  total_feedback_count: number;
  avg_response_rate: number;
  open_issues_count: number;
  total_actions_count: number;
  avg_resolution_days: number;
  overall_resolution_rate: number;
  department_stats: Array<{
    department_id: number;
    department_name: string;
    code: string;
    courses_count: number;
    feedback_count: number;
    open_issues_count: number;
    resolved_actions_count: number;
  }>;
}
