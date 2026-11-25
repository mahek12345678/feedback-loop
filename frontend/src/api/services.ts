import { apiClient } from './client';
import {
  AuthResponse, User, Course, FeedbackOpportunity, CourseFeedbackData,
  EarlyWarningAlert, AcademicIssue, InterventionRecommendation, FacultyAction,
  VerificationSummary, StudentAnalytics, FacultyAnalytics, AdminAnalytics, AIChatResponse
} from '../types';

export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/auth/login', { email, password });
    return res.data;
  },
  register: async (data: { email: string; password: string; full_name: string; role: string }): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/auth/register', data);
    return res.data;
  },
  getMe: async (): Promise<User> => {
    const res = await apiClient.get<User>('/auth/me');
    return res.data;
  },
};

export const coursesApi = {
  getCourses: async (browseAll = false): Promise<Course[]> => {
    const res = await apiClient.get<Course[]>('/courses', { params: { browse_all: browseAll } });
    return res.data;
  },
  getCourseDetail: async (id: number): Promise<Course> => {
    const res = await apiClient.get<Course>(`/courses/${id}`);
    return res.data;
  },
  enroll: async (courseId: number): Promise<{ message: string }> => {
    const res = await apiClient.post<{ message: string }>('/courses/enroll', { course_id: courseId });
    return res.data;
  },
};

export const feedbackApi = {
  getOpportunities: async (): Promise<FeedbackOpportunity[]> => {
    const res = await apiClient.get<FeedbackOpportunity[]>('/feedback/opportunities');
    return res.data;
  },
  submit: async (data: {
    opportunity_id: number;
    category: string;
    rating: number;
    written_feedback?: string;
    structured_need?: string;
  }) => {
    const res = await apiClient.post('/feedback/submit', data);
    return res.data;
  },
  getMyHistory: async () => {
    const res = await apiClient.get('/feedback/my-history');
    return res.data;
  },
  getCourseFeedback: async (courseId: number): Promise<CourseFeedbackData> => {
    const res = await apiClient.get<CourseFeedbackData>(`/feedback/course/${courseId}`);
    return res.data;
  },
};

export const aiApi = {
  chat: async (data: {
    course_id: number;
    opportunity_id: number;
    session_token?: string;
    message: string;
    conversation_history: Array<{ role: string; content: string }>;
  }): Promise<AIChatResponse> => {
    const res = await apiClient.post<AIChatResponse>('/ai/chat', data);
    return res.data;
  },
  checkHealth: async () => {
    const res = await apiClient.get('/ai/health');
    return res.data;
  },
  getThemes: async (courseId: number) => {
    const res = await apiClient.get(`/ai/themes/${courseId}`);
    return res.data;
  },
  triggerAnalysis: async (courseId: number, weekNumber?: number) => {
    const res = await apiClient.post(`/ai/analyze/${courseId}`, null, {
      params: weekNumber ? { week_number: weekNumber } : {},
    });
    return res.data;
  },
};

export const warningsApi = {
  getCourseWarnings: async (courseId: number): Promise<EarlyWarningAlert[]> => {
    const res = await apiClient.get<EarlyWarningAlert[]>(`/warnings/course/${courseId}`);
    return res.data;
  },
  acknowledge: async (alertId: number) => {
    const res = await apiClient.post(`/warnings/${alertId}/acknowledge`);
    return res.data;
  },
};

export const actionsApi = {
  getCourseIssues: async (courseId: number): Promise<AcademicIssue[]> => {
    const res = await apiClient.get<AcademicIssue[]>(`/actions/issues/course/${courseId}`);
    return res.data;
  },
  createIssue: async (data: {
    course_id: number;
    title: string;
    topic: string;
    category: string;
    description: string;
    severity: string;
  }): Promise<AcademicIssue> => {
    const res = await apiClient.post<AcademicIssue>('/actions/issues', data);
    return res.data;
  },
  getRecommendations: async (issueId: number): Promise<InterventionRecommendation[]> => {
    const res = await apiClient.post<InterventionRecommendation[]>(`/actions/issues/${issueId}/recommendations`);
    return res.data;
  },
  respondRecommendation: async (recId: number, status: string, modifiedAction?: string): Promise<InterventionRecommendation> => {
    const res = await apiClient.post<InterventionRecommendation>(`/actions/recommendations/${recId}/respond`, {
      status,
      modified_action: modifiedAction,
    });
    return res.data;
  },
  createAction: async (data: {
    issue_id: number;
    title: string;
    description: string;
    target_completion_date?: string;
    public_update?: string;
  }): Promise<FacultyAction> => {
    const res = await apiClient.post<FacultyAction>('/actions', data);
    return res.data;
  },
  updateActionStatus: async (
    actionId: number,
    data: { status: string; public_update?: string; comment?: string }
  ): Promise<FacultyAction> => {
    const res = await apiClient.patch<FacultyAction>(`/actions/${actionId}`, data);
    return res.data;
  },
  getCourseActions: async (courseId: number): Promise<FacultyAction[]> => {
    const res = await apiClient.get<FacultyAction[]>(`/actions/course/${courseId}`);
    return res.data;
  },
};

export const verificationsApi = {
  submit: async (data: {
    action_id: number;
    outcome: 'YES' | 'PARTIALLY' | 'NO';
    updated_understanding_rating?: number;
    comment?: string;
  }) => {
    const res = await apiClient.post('/verifications', data);
    return res.data;
  },
  getSummary: async (actionId: number): Promise<VerificationSummary> => {
    const res = await apiClient.get<VerificationSummary>(`/verifications/action/${actionId}`);
    return res.data;
  },
};

export const analyticsApi = {
  getStudentAnalytics: async (): Promise<StudentAnalytics> => {
    const res = await apiClient.get<StudentAnalytics>('/analytics/student');
    return res.data;
  },
  getFacultyAnalytics: async (): Promise<FacultyAnalytics> => {
    const res = await apiClient.get<FacultyAnalytics>('/analytics/faculty');
    return res.data;
  },
  getAdminAnalytics: async (): Promise<AdminAnalytics> => {
    const res = await apiClient.get<AdminAnalytics>('/analytics/admin');
    return res.data;
  },
};
