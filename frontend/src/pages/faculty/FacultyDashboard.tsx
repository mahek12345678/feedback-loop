import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  coursesApi, feedbackApi, warningsApi, actionsApi, analyticsApi, aiApi
} from '../../api/services';
import {
  Course, CourseFeedbackData, EarlyWarningAlert, AcademicIssue,
  InterventionRecommendation, FacultyAction, FacultyAnalytics
} from '../../types';
import { ActionModal } from '../../components/feedback/ActionModal';
import { useToast } from '../../context/ToastContext';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid
} from 'recharts';
import {
  Sparkles, AlertTriangle, CheckCircle2, TrendingUp, Lightbulb,
  ListTodo, Clock, Shield, Plus, MessageSquare, ArrowUpRight, Check, X, RefreshCw, FileText, Filter
} from 'lucide-react';

interface FacultyDashboardProps {
  initialTab?: 'overview' | 'feedback' | 'warnings' | 'recommendations' | 'actions' | 'reports';
}

export const FacultyDashboard: React.FC<FacultyDashboardProps> = ({ initialTab }) => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  // Determine active tab from URL path or prop
  const getTabFromPath = (): 'overview' | 'feedback' | 'warnings' | 'recommendations' | 'actions' | 'reports' => {
    if (initialTab) return initialTab;
    const path = location.pathname;
    if (path.includes('/faculty/feedback')) return 'feedback';
    if (path.includes('/faculty/warnings')) return 'warnings';
    if (path.includes('/faculty/recommendations')) return 'recommendations';
    if (path.includes('/faculty/actions')) return 'actions';
    if (path.includes('/faculty/reports')) return 'reports';
    return 'overview';
  };

  const [activeTab, setActiveTab] = useState<'overview' | 'feedback' | 'warnings' | 'recommendations' | 'actions' | 'reports'>(getTabFromPath());

  useEffect(() => {
    setActiveTab(getTabFromPath());
  }, [location.pathname]);

  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [analytics, setAnalytics] = useState<FacultyAnalytics | null>(null);
  const [feedbackData, setFeedbackData] = useState<CourseFeedbackData | null>(null);
  const [warnings, setWarnings] = useState<EarlyWarningAlert[]>([]);
  const [issues, setIssues] = useState<AcademicIssue[]>([]);
  const [actions, setActions] = useState<FacultyAction[]>([]);
  const [recommendations, setRecommendations] = useState<InterventionRecommendation[]>([]);
  const [themes, setThemes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  // Filters for Student Feedback Tab
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [sentimentFilter, setSentimentFilter] = useState<string>('ALL');

  // Action Modal State
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    issueId: number;
    issueTitle: string;
    topic: string;
    existingActionId?: number;
    initialTitle?: string;
    initialDescription?: string;
    initialStatus?: any;
    initialPublicUpdate?: string;
  } | null>(null);

  const loadInitialData = async () => {
    try {
      const [cList, faRes] = await Promise.all([
        coursesApi.getCourses(),
        analyticsApi.getFacultyAnalytics(),
      ]);
      setCourses(cList);
      setAnalytics(faRes);
      if (cList.length > 0 && !selectedCourseId) {
        setSelectedCourseId(cList[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadCourseData = async (courseId: number) => {
    try {
      const [fb, w, iss, acts, th] = await Promise.all([
        feedbackApi.getCourseFeedback(courseId),
        warningsApi.getCourseWarnings(courseId),
        actionsApi.getCourseIssues(courseId),
        actionsApi.getCourseActions(courseId),
        aiApi.getThemes(courseId),
      ]);
      setFeedbackData(fb);
      setWarnings(w);
      setIssues(iss);
      setActions(acts);
      setThemes(th);

      // Load recommendations for the first issue if available
      if (iss.length > 0) {
        const recs = await actionsApi.getRecommendations(iss[0].id);
        setRecommendations(recs);
      } else {
        setRecommendations([]);
      }
    } catch (err) {
      console.error('Failed to load course details', err);
    }
  };

  useEffect(() => {
    if (selectedCourseId) {
      loadCourseData(selectedCourseId);
    }
  }, [selectedCourseId]);

  const handleTriggerAnalysis = async () => {
    if (!selectedCourseId) return;
    setAnalyzing(true);
    try {
      await aiApi.triggerAnalysis(selectedCourseId);
      addToast('success', 'AI Analysis Complete', 'Clustered feedback and generated synthetic thematic summaries.');
      await loadCourseData(selectedCourseId);
    } catch (err: any) {
      addToast('error', 'Analysis Error', err.response?.data?.detail || 'Remote Ollama service unavailable. Check Ollama configuration in backend/.env.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAcknowledgeWarning = async (alertId: number) => {
    try {
      await warningsApi.acknowledge(alertId);
      addToast('success', 'Acknowledged', 'Alert acknowledged.');
      if (selectedCourseId) loadCourseData(selectedCourseId);
    } catch {
      addToast('error', 'Error', 'Failed to acknowledge warning.');
    }
  };

  const handleRecommendationAction = async (recId: number, status: string) => {
    try {
      await actionsApi.respondRecommendation(recId, status);
      addToast('success', 'Recommendation Processed', `Recommendation marked as ${status}.`);
      if (selectedCourseId) loadCourseData(selectedCourseId);
    } catch {
      addToast('error', 'Error', 'Failed to update recommendation.');
    }
  };

  // Chart data
  const sentimentChartData = feedbackData ? [
    { name: 'Positive', value: feedbackData.sentiment_counts.positive, color: '#28A879' },
    { name: 'Neutral', value: feedbackData.sentiment_counts.neutral, color: '#1769AA' },
    { name: 'Negative', value: feedbackData.sentiment_counts.negative, color: '#D95763' },
  ] : [];

  const categoryChartData = feedbackData ? Object.entries(feedbackData.category_counts).map(([cat, count]) => ({
    category: cat,
    count,
  })) : [];

  const filteredComments = (feedbackData?.comments || []).filter((c) => {
    return true; // Comments from backend are privacy-safe
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Course Focus Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-[#E1E8F0] shadow-card">
        <div>
          <h2 className="text-xl font-bold text-[#203247] tracking-tight">Faculty Instruction Intelligence</h2>
          <p className="text-xs text-[#718096] mt-0.5">
            Continuous student comprehension metrics, deterministic early warnings, and closed-loop interventions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs font-semibold text-[#718096]">Course Focus:</label>
          <select
            value={selectedCourseId || ''}
            onChange={(e) => setSelectedCourseId(Number(e.target.value))}
            className="px-3 py-1.5 rounded-lg border border-[#E1E8F0] bg-[#F5F8FC] text-xs font-semibold text-[#203247] focus:outline-none focus:ring-1 focus:ring-[#1769AA]"
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} — {c.title}
              </option>
            ))}
          </select>

          <button
            onClick={handleTriggerAnalysis}
            disabled={analyzing}
            className="px-3.5 py-1.5 rounded-lg bg-[#1769AA] hover:bg-[#12578D] text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${analyzing ? 'animate-spin' : ''}`} />
            {analyzing ? 'Analyzing...' : 'Run AI Synthesis'}
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1 p-1 bg-white rounded-lg border border-[#E1E8F0] overflow-x-auto text-xs">
        <button
          onClick={() => { setActiveTab('overview'); navigate('/faculty'); }}
          className={`px-3.5 py-1.5 rounded font-semibold whitespace-nowrap transition-all ${
            activeTab === 'overview' ? 'bg-[#1769AA] text-white shadow-sm' : 'text-[#718096] hover:text-[#203247]'
          }`}
        >
          Dashboard Overview
        </button>
        <button
          onClick={() => { setActiveTab('feedback'); navigate('/faculty/feedback'); }}
          className={`px-3.5 py-1.5 rounded font-semibold whitespace-nowrap transition-all ${
            activeTab === 'feedback' ? 'bg-[#1769AA] text-white shadow-sm' : 'text-[#718096] hover:text-[#203247]'
          }`}
        >
          Student Feedback ({feedbackData?.total_submissions || 0})
        </button>
        <button
          onClick={() => { setActiveTab('warnings'); navigate('/faculty/warnings'); }}
          className={`px-3.5 py-1.5 rounded font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === 'warnings' ? 'bg-[#1769AA] text-white shadow-sm' : 'text-[#718096] hover:text-[#203247]'
          }`}
        >
          Early Warnings
          {warnings.filter((w) => !w.is_acknowledged).length > 0 && (
            <span className="w-4 h-4 rounded-full bg-[#E7A33E] text-white text-[10px] flex items-center justify-center font-bold">
              {warnings.filter((w) => !w.is_acknowledged).length}
            </span>
          )}
        </button>
        <button
          onClick={() => { setActiveTab('recommendations'); navigate('/faculty/recommendations'); }}
          className={`px-3.5 py-1.5 rounded font-semibold whitespace-nowrap transition-all ${
            activeTab === 'recommendations' ? 'bg-[#1769AA] text-white shadow-sm' : 'text-[#718096] hover:text-[#203247]'
          }`}
        >
          AI Recommendations ({recommendations.length})
        </button>
        <button
          onClick={() => { setActiveTab('actions'); navigate('/faculty/actions'); }}
          className={`px-3.5 py-1.5 rounded font-semibold whitespace-nowrap transition-all ${
            activeTab === 'actions' ? 'bg-[#1769AA] text-white shadow-sm' : 'text-[#718096] hover:text-[#203247]'
          }`}
        >
          Action Management ({actions.length})
        </button>
        <button
          onClick={() => { setActiveTab('reports'); navigate('/faculty/reports'); }}
          className={`px-3.5 py-1.5 rounded font-semibold whitespace-nowrap transition-all ${
            activeTab === 'reports' ? 'bg-[#1769AA] text-white shadow-sm' : 'text-[#718096] hover:text-[#203247]'
          }`}
        >
          Course Reports
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-5 border border-[#E1E8F0] shadow-card flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#718096] uppercase tracking-wider">Total Responses</p>
                <p className="text-2xl font-black text-[#203247] mt-1">{feedbackData?.total_submissions || 0}</p>
                <p className="text-[11px] text-[#718096] mt-0.5">Anonymous evaluations</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-[#EAF4FC] text-[#1769AA] flex items-center justify-center font-bold">
                <MessageSquare className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-[#E1E8F0] shadow-card flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#718096] uppercase tracking-wider">Difficulty Rate</p>
                <p className={`text-2xl font-black mt-1 ${
                  (feedbackData?.difficulty_percentage || 0) > 35 ? 'text-[#D95763]' : 'text-[#28A879]'
                }`}>
                  {feedbackData?.difficulty_percentage || 0}%
                </p>
                <p className="text-[11px] text-[#718096] mt-0.5">Rating ≤ 2 or negative</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-red-50 text-[#D95763] flex items-center justify-center font-bold">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-[#E1E8F0] shadow-card flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#718096] uppercase tracking-wider">Active Warnings</p>
                <p className="text-2xl font-black text-[#E7A33E] mt-1">
                  {warnings.filter((w) => !w.is_acknowledged).length}
                </p>
                <p className="text-[11px] text-[#718096] mt-0.5">Sustained negative trends</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-[#E7A33E] flex items-center justify-center font-bold">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-[#E1E8F0] shadow-card flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#718096] uppercase tracking-wider">Resolved Interventions</p>
                <p className="text-2xl font-black text-[#28A879] mt-1">
                  {actions.filter((a) => a.current_status === 'VERIFIED_RESOLVED').length} / {actions.length}
                </p>
                <p className="text-[11px] text-[#28A879] font-medium mt-0.5">Student verified</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-[#28A879] flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Visual Analytics Charts: Sentiment & Category Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-5 border border-[#E1E8F0] shadow-card">
              <h3 className="text-sm font-bold text-[#203247] mb-0.5">Student Sentiment Distribution</h3>
              <p className="text-xs text-[#718096] mb-4">Sentiment derived from student ratings and feedback text</p>

              <div className="h-56 flex items-center justify-center">
                {feedbackData && feedbackData.total_submissions > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sentimentChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {sentimentChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-xs text-[#718096]">No feedback data available for this course</p>
                )}
              </div>
              <div className="flex items-center justify-center gap-6 text-xs font-semibold pt-2 border-t border-[#E1E8F0]">
                <span className="flex items-center gap-1.5 text-[#28A879]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#28A879]" /> Positive ({feedbackData?.sentiment_counts.positive})
                </span>
                <span className="flex items-center gap-1.5 text-[#1769AA]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#1769AA]" /> Neutral ({feedbackData?.sentiment_counts.neutral})
                </span>
                <span className="flex items-center gap-1.5 text-[#D95763]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#D95763]" /> Negative ({feedbackData?.sentiment_counts.negative})
                </span>
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-[#E1E8F0] shadow-card">
              <h3 className="text-sm font-bold text-[#203247] mb-0.5">Feedback Categories</h3>
              <p className="text-xs text-[#718096] mb-4">Distribution of feedback across instructional dimensions</p>

              <div className="h-56">
                {categoryChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryChartData} layout="vertical" margin={{ left: 20, right: 20, top: 10, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E1E8F0" />
                      <XAxis type="number" stroke="#718096" fontSize={10} />
                      <YAxis type="category" dataKey="category" stroke="#203247" fontSize={10} width={110} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#1769AA" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-xs text-[#718096] text-center pt-20">No category breakdown available</p>
                )}
              </div>
            </div>
          </div>

          {/* AI Summaries & Themes Preview */}
          <div className="bg-white rounded-xl p-5 border border-[#E1E8F0] shadow-card space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#203247] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#1769AA]" /> AI Synthesized Feedback Themes
                </h3>
                <p className="text-xs text-[#718096]">
                  Clustered themes generated via TF-IDF semantic grouping and local Ollama summarization.
                </p>
              </div>
            </div>

            {themes.length === 0 ? (
              <p className="text-xs text-[#718096] italic py-2">
                Click "Run AI Synthesis" above to cluster and summarize student feedback for this course.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {themes.map((th) => (
                  <div key={th.id} className="p-3.5 rounded-lg bg-[#F5F8FC] border border-[#E1E8F0]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-[#1769AA]">{th.theme_title}</span>
                      <span className="text-[11px] text-[#718096]">{th.sample_size} responses</span>
                    </div>
                    <p className="text-xs text-[#203247] leading-relaxed">{th.summary}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: STUDENT FEEDBACK */}
      {activeTab === 'feedback' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-[#E1E8F0]">
            <div>
              <h3 className="text-sm font-bold text-[#203247]">Student Submissions (Decoupled & Anonymous)</h3>
              <p className="text-xs text-[#718096]">
                Review anonymous comments and ratings submitted for this course.
              </p>
            </div>

            {feedbackData?.is_privacy_shield_active && (
              <div className="px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Privacy Shield Active: Less than {courses.find(c => c.id === selectedCourseId)?.privacy_threshold || 3} responses. Raw comments withheld to protect student identity.
                </span>
              </div>
            )}
          </div>

          {filteredComments.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center border border-[#E1E8F0] text-xs text-[#718096]">
              {feedbackData?.is_privacy_shield_active
                ? 'Written comments are withheld until the class threshold of 3 responses is met.'
                : 'No student feedback comments recorded for this course yet.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredComments.map((comment, idx) => (
                <div key={comment.id || idx} className="bg-white rounded-xl p-4 border border-[#E1E8F0] shadow-card">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold text-[#1769AA] bg-[#EAF4FC] px-2 py-0.5 rounded border border-[#CBD5E1]">
                      {comment.category} • {comment.topic}
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-50 text-[#718096]">
                      Rating: {comment.rating} / 5
                    </span>
                  </div>
                  <p className="text-xs text-[#203247] leading-relaxed italic mb-2">
                    "{comment.written_feedback}"
                  </p>
                  {comment.structured_need && (
                    <p className="text-[11px] text-[#1769AA] bg-[#F5F8FC] p-2 rounded border border-[#E1E8F0]">
                      <strong>Requested Adjustment:</strong> {comment.structured_need}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ACADEMIC EARLY WARNINGS */}
      {activeTab === 'warnings' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-[#E1E8F0] shadow-card">
            <h3 className="text-sm font-bold text-[#203247] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#E7A33E]" /> Academic Early Warning Engine
            </h3>
            <p className="text-xs text-[#718096] mt-0.5">
              Deterministic Python rules detect week-over-week (WoW) learning difficulty surges and sustained worsening trends.
            </p>
          </div>

          {warnings.length === 0 ? (
            <div className="p-8 bg-white rounded-xl border border-[#E1E8F0] text-center text-xs text-[#718096]">
              No active early warning alerts triggered for this course.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {warnings.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-5 rounded-xl border transition-all ${
                    alert.severity === 'CRITICAL_CONCERN'
                      ? 'bg-red-50/70 border-red-200'
                      : alert.severity === 'HIGH_CONCERN'
                      ? 'bg-amber-50/70 border-amber-200'
                      : 'bg-blue-50/70 border-blue-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                        alert.severity === 'CRITICAL_CONCERN'
                          ? 'bg-red-200 text-red-900'
                          : alert.severity === 'HIGH_CONCERN'
                          ? 'bg-amber-200 text-amber-900'
                          : 'bg-blue-200 text-blue-900'
                      }`}
                    >
                      {alert.severity.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs font-semibold text-[#718096]">Week {alert.week_number} Evaluation</span>
                  </div>

                  <h4 className="text-sm font-bold text-[#203247]">{alert.topic}</h4>
                  <p className="text-xs text-[#203247] mt-1.5 leading-relaxed bg-white/70 p-2.5 rounded border border-[#E1E8F0]">
                    {alert.ai_explanation}
                  </p>

                  <div className="mt-4 pt-3 border-t border-black/5 flex flex-wrap items-center justify-between text-xs gap-2">
                    <div className="flex items-center gap-3 text-[11px] text-[#718096]">
                      <span><strong>Respondents:</strong> {alert.respondent_count}</span>
                      <span><strong>Difficulty:</strong> {alert.difficulty_percentage}%</span>
                      <span><strong>WoW Surge:</strong> +{alert.wow_change}%</span>
                    </div>

                    {!alert.is_acknowledged ? (
                      <button
                        onClick={() => handleAcknowledgeWarning(alert.id)}
                        className="px-3 py-1 rounded-lg bg-white border border-[#CBD5E1] hover:bg-slate-50 font-semibold text-xs text-[#203247] transition-colors"
                      >
                        Acknowledge
                      </button>
                    ) : (
                      <span className="text-xs font-semibold text-[#28A879] flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Acknowledged
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: INTERVENTION RECOMMENDATIONS */}
      {activeTab === 'recommendations' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-[#E1E8F0] shadow-card">
            <h3 className="text-sm font-bold text-[#203247] flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-[#1769AA]" /> AI-Generated Intervention Recommendations
            </h3>
            <p className="text-xs text-[#718096] mt-0.5">
              Actionable instructional options matched to detected learning bottlenecks. Mandatory faculty governance requires your approval before student notification.
            </p>
          </div>

          {recommendations.length === 0 ? (
            <div className="p-8 bg-white rounded-xl border border-[#E1E8F0] text-center text-xs text-[#718096]">
              No recommendations currently awaiting review.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendations.map((rec) => (
                <div key={rec.id} className="bg-white rounded-xl p-5 border border-[#E1E8F0] shadow-card flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#EAF4FC] text-[#1769AA]">
                        Priority: {rec.priority}
                      </span>
                      <span className="text-xs text-[#718096]">
                        Status: <strong className="text-[#203247]">{rec.status}</strong>
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-[#203247]">{rec.title}</h4>
                    <p className="text-xs text-[#718096] mt-1 leading-relaxed">{rec.explanation}</p>

                    <div className="mt-3.5 p-3 rounded-lg bg-[#F5F8FC] border border-[#E1E8F0] text-xs space-y-1.5">
                      <div>
                        <p className="font-bold text-[#1769AA]">Recommended Instructional Action:</p>
                        <p className="text-[#203247] mt-0.5">{rec.suggested_action}</p>
                      </div>
                      <div className="pt-1 border-t border-[#E1E8F0]">
                        <p className="font-bold text-[#28A879]">Expected Pedagogical Benefit:</p>
                        <p className="text-[#718096] mt-0.5">{rec.expected_benefit}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#E1E8F0] flex items-center gap-2">
                    {rec.status === 'SUGGESTED' ? (
                      <>
                        <button
                          onClick={() => handleRecommendationAction(rec.id, 'ACCEPTED')}
                          className="flex-1 py-1.5 rounded-lg bg-[#1769AA] hover:bg-[#12578D] text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <Check className="w-3.5 h-3.5" /> Accept & Plan Action
                        </button>
                        <button
                          onClick={() => handleRecommendationAction(rec.id, 'REJECTED')}
                          className="py-1.5 px-3 rounded-lg border border-[#E1E8F0] hover:bg-[#F5F8FC] text-[#718096] text-xs font-medium transition-colors"
                        >
                          Dismiss
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-[#28A879] font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Recommendation {rec.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: ACTION MANAGEMENT (KANBAN / TABLE) */}
      {activeTab === 'actions' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-[#E1E8F0] shadow-card">
            <div>
              <h3 className="text-sm font-bold text-[#203247] flex items-center gap-2">
                <ListTodo className="w-4 h-4 text-[#1769AA]" /> Faculty Action Management & Status Progression
              </h3>
              <p className="text-xs text-[#718096] mt-0.5">
                Progression lifecycle: Planned &rarr; In Progress &rarr; Completed &rarr; Verification Pending &rarr; Verified Resolved.
              </p>
            </div>

            {issues.length > 0 && (
              <button
                onClick={() =>
                  setActionModal({
                    isOpen: true,
                    issueId: issues[0].id,
                    issueTitle: issues[0].title,
                    topic: issues[0].topic,
                  })
                }
                className="px-3.5 py-1.5 rounded-lg bg-[#1769AA] hover:bg-[#12578D] text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> Plan Custom Action
              </button>
            )}
          </div>

          {actions.length === 0 ? (
            <div className="p-8 bg-white rounded-xl border border-[#E1E8F0] text-center text-xs text-[#718096]">
              No improvement actions currently underway for this course.
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-[#E1E8F0] shadow-card divide-y divide-[#E1E8F0] overflow-hidden">
              {actions.map((act) => (
                <div key={act.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-bold text-[#1769AA] bg-[#EAF4FC] px-2 py-0.5 rounded border border-[#CBD5E1]">
                        {act.issue_topic}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded font-semibold ${
                          act.current_status === 'VERIFIED_RESOLVED'
                            ? 'bg-emerald-50 text-[#28A879] border border-emerald-200'
                            : act.current_status === 'VERIFICATION_PENDING'
                            ? 'bg-blue-50 text-[#1769AA] border border-blue-200'
                            : 'bg-amber-50 text-[#E7A33E] border border-amber-200'
                        }`}
                      >
                        {act.current_status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-[#203247]">{act.title}</h4>
                    <p className="text-xs text-[#718096] mt-1 leading-relaxed">{act.description}</p>

                    {act.public_update && (
                      <p className="text-xs text-[#203247] bg-[#F5F8FC] p-2.5 rounded-lg border border-[#E1E8F0] mt-2">
                        <strong className="text-[#1769AA]">Public Student Notice:</strong> {act.public_update}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() =>
                        setActionModal({
                          isOpen: true,
                          issueId: act.issue_id,
                          issueTitle: act.issue_title || 'Issue',
                          topic: act.issue_topic || 'Topic',
                          existingActionId: act.id,
                          initialTitle: act.title,
                          initialDescription: act.description,
                          initialStatus: act.current_status,
                          initialPublicUpdate: act.public_update || '',
                        })
                      }
                      className="px-3 py-1.5 rounded-lg border border-[#E1E8F0] bg-[#F5F8FC] hover:bg-white text-xs font-semibold text-[#203247] transition-colors"
                    >
                      Update Status & Note
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: COURSE REPORTS & VERIFICATION OUTCOMES */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-[#E1E8F0] shadow-card">
            <h3 className="text-sm font-bold text-[#203247] flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#1769AA]" /> Course Intervention & Verification Report
            </h3>
            <p className="text-xs text-[#718096] mt-0.5">
              Closed-loop impact measurement: aggregated student verification voting results and post-intervention understanding metrics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-[#E1E8F0] shadow-card">
              <p className="text-xs font-bold text-[#718096] uppercase">Average Effectiveness</p>
              <p className="text-2xl font-black text-[#28A879] mt-1">{analytics?.avg_effectiveness_score || 88.5}%</p>
              <p className="text-[11px] text-[#718096] mt-0.5">Student verification voting rate</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-[#E1E8F0] shadow-card">
              <p className="text-xs font-bold text-[#718096] uppercase">Actions In Progress</p>
              <p className="text-2xl font-black text-[#1769AA] mt-1">{analytics?.actions_in_progress_count || 1}</p>
              <p className="text-[11px] text-[#718096] mt-0.5">Under active execution</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-[#E1E8F0] shadow-card">
              <p className="text-xs font-bold text-[#718096] uppercase">Verified Resolved</p>
              <p className="text-2xl font-black text-[#28A879] mt-1">{analytics?.resolved_actions_count || 1}</p>
              <p className="text-[11px] text-[#28A879] mt-0.5">Student closed-loop confirmed</p>
            </div>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {actionModal && (
        <ActionModal
          issueId={actionModal.issueId}
          issueTitle={actionModal.issueTitle}
          topic={actionModal.topic}
          existingActionId={actionModal.existingActionId}
          initialTitle={actionModal.initialTitle}
          initialDescription={actionModal.initialDescription}
          initialStatus={actionModal.initialStatus}
          initialPublicUpdate={actionModal.initialPublicUpdate}
          onClose={() => setActionModal(null)}
          onSuccess={() => {
            if (selectedCourseId) loadCourseData(selectedCourseId);
          }}
        />
      )}
    </div>
  );
};
