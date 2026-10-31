import React, { useState, useEffect } from 'react';
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
  ListTodo, Clock, Shield, Plus, MessageSquare, ArrowUpRight, Check, X, RefreshCw
} from 'lucide-react';

export const FacultyDashboard: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

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
    } catch {
      addToast('error', 'Analysis Error', 'Unable to complete clustering.');
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
      addToast('success', 'Recommendation Handled', `Recommendation marked as ${status}.`);
      if (selectedCourseId) loadCourseData(selectedCourseId);
    } catch {
      addToast('error', 'Error', 'Failed to update recommendation.');
    }
  };

  // Chart data
  const sentimentChartData = feedbackData ? [
    { name: 'Positive', value: feedbackData.sentiment_counts.positive, color: '#32936F' },
    { name: 'Neutral', value: feedbackData.sentiment_counts.neutral, color: '#8F6BD7' },
    { name: 'Negative', value: feedbackData.sentiment_counts.negative, color: '#D65A65' },
  ] : [];

  const categoryChartData = feedbackData ? Object.entries(feedbackData.category_counts).map(([cat, count]) => ({
    category: cat,
    count,
  })) : [];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Header & Course Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-ink tracking-tight">Faculty Instruction Intelligence</h2>
          <p className="text-xs text-ink-muted mt-1">
            Real-time student comprehension metrics, early warnings, and AI-recommended interventions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-ink-muted uppercase">Course Focus:</label>
          <select
            value={selectedCourseId || ''}
            onChange={(e) => setSelectedCourseId(Number(e.target.value))}
            className="px-4 py-2 rounded-xl border border-surface-border bg-white text-sm font-bold text-ink focus:outline-none focus:ring-2 focus:ring-lavender-400 shadow-sm"
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} - {c.title}
              </option>
            ))}
          </select>

          <button
            onClick={handleTriggerAnalysis}
            disabled={analyzing}
            className="px-4 py-2 rounded-xl bg-lavender-600 hover:bg-lavender-700 text-white text-xs font-bold shadow-md shadow-lavender-200 transition-all flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${analyzing ? 'animate-spin' : ''}`} />
            {analyzing ? 'Analyzing...' : 'Run AI Synthesis'}
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-surface-border shadow-card flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-ink-muted uppercase tracking-wider">Total Responses</p>
            <p className="text-2xl font-black text-ink mt-1">{feedbackData?.total_submissions || 0}</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-lavender-100 text-lavender-700 flex items-center justify-center font-bold">
            <MessageSquare className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-surface-border shadow-card flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-ink-muted uppercase tracking-wider">Difficulty Rate</p>
            <p className={`text-2xl font-black mt-1 ${
              (feedbackData?.difficulty_percentage || 0) > 35 ? 'text-rose-600' : 'text-emerald-600'
            }`}>
              {feedbackData?.difficulty_percentage || 0}%
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-surface-border shadow-card flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-ink-muted uppercase tracking-wider">Active Warnings</p>
            <p className="text-2xl font-black text-amber-500 mt-1">
              {warnings.filter((w) => !w.is_acknowledged).length}
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-surface-border shadow-card flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-ink-muted uppercase tracking-wider">Avg Effectiveness</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">
              {analytics?.avg_effectiveness_score || 88.5}%
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Early Warning Alerts Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-ink flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" /> Academic Early Warnings
            </h3>
            <p className="text-xs text-ink-muted">
              Deterministic statistical detection flags sustained increases in student learning difficulty across weeks.
            </p>
          </div>
        </div>

        {warnings.length === 0 ? (
          <div className="p-6 bg-white rounded-3xl border border-surface-border text-center text-xs text-ink-muted">
            No active early warning alerts triggered for this course.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {warnings.map((alert) => (
              <div
                key={alert.id}
                className={`p-6 rounded-3xl border transition-all ${
                  alert.severity === 'CRITICAL_CONCERN'
                    ? 'bg-rose-50/70 border-rose-200'
                    : alert.severity === 'HIGH_CONCERN'
                    ? 'bg-amber-50/70 border-amber-200'
                    : 'bg-lavender-50/70 border-lavender-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      alert.severity === 'CRITICAL_CONCERN'
                        ? 'bg-rose-200 text-rose-900'
                        : alert.severity === 'HIGH_CONCERN'
                        ? 'bg-amber-200 text-amber-900'
                        : 'bg-lavender-200 text-lavender-900'
                    }`}
                  >
                    {alert.severity.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs font-semibold text-ink-muted">Week {alert.week_number} Evaluation</span>
                </div>

                <h4 className="text-base font-bold text-ink">{alert.topic}</h4>
                <p className="text-xs font-medium text-ink-muted mt-1 leading-relaxed">{alert.ai_explanation}</p>

                <div className="mt-4 pt-3 border-t border-black/5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-4">
                    <span>
                      <strong className="text-ink">Respondents:</strong> {alert.respondent_count}
                    </span>
                    <span>
                      <strong className="text-ink">Difficulty Rate:</strong> {alert.difficulty_percentage}%
                    </span>
                    <span>
                      <strong className="text-ink">WoW Change:</strong> +{alert.wow_change}%
                    </span>
                  </div>

                  {!alert.is_acknowledged && (
                    <button
                      onClick={() => handleAcknowledgeWarning(alert.id)}
                      className="px-3 py-1.5 rounded-xl bg-white border border-surface-border hover:bg-surface-subtle font-semibold text-xs transition-colors"
                    >
                      Acknowledge
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Visual Analytics Charts: Sentiment & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-surface-border shadow-card">
          <h3 className="text-base font-bold text-ink mb-1">Student Sentiment Distribution</h3>
          <p className="text-xs text-ink-muted mb-4">Overall emotional sentiment breakdown of submitted responses</p>

          <div className="h-64 flex items-center justify-center">
            {feedbackData && feedbackData.total_submissions > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sentimentChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={4}
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
              <p className="text-xs text-ink-muted">No feedback data available</p>
            )}
          </div>
          <div className="flex items-center justify-center gap-6 text-xs font-semibold pt-2">
            <span className="flex items-center gap-1.5 text-emerald-700">
              <span className="w-3 h-3 rounded-full bg-emerald-600" /> Positive ({feedbackData?.sentiment_counts.positive})
            </span>
            <span className="flex items-center gap-1.5 text-lavender-700">
              <span className="w-3 h-3 rounded-full bg-lavender-500" /> Neutral ({feedbackData?.sentiment_counts.neutral})
            </span>
            <span className="flex items-center gap-1.5 text-rose-700">
              <span className="w-3 h-3 rounded-full bg-rose-500" /> Negative ({feedbackData?.sentiment_counts.negative})
            </span>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-surface-border shadow-card">
          <h3 className="text-base font-bold text-ink mb-1">Feedback Categories</h3>
          <p className="text-xs text-ink-muted mb-4">Most frequently flagged instructional focus areas</p>

          <div className="h-64">
            {categoryChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryChartData} layout="vertical" margin={{ left: 40, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1EFF8" />
                  <XAxis type="number" stroke="#9A95B2" fontSize={11} />
                  <YAxis type="category" dataKey="category" stroke="#6A6584" fontSize={11} width={110} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8F6BD7" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-ink-muted text-center pt-20">No category breakdown available</p>
            )}
          </div>
        </div>
      </div>

      {/* AI Intervention Recommendations Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-ink flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-lavender-600" /> AI-Generated Intervention Recommendations
            </h3>
            <p className="text-xs text-ink-muted">
              Tailored instructional interventions derived from student difficulty trends and academic themes. Requires faculty approval.
            </p>
          </div>
        </div>

        {recommendations.length === 0 ? (
          <div className="p-6 bg-white rounded-3xl border border-surface-border text-center text-xs text-ink-muted">
            No pending recommendations.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.map((rec) => (
              <div key={rec.id} className="bg-white rounded-3xl p-6 border border-surface-border shadow-card flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-lavender-100 text-lavender-700">
                      Priority: {rec.priority}
                    </span>
                    <span className="text-xs font-semibold text-ink-muted">
                      Status: <strong className="text-ink">{rec.status}</strong>
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-ink">{rec.title}</h4>
                  <p className="text-xs text-ink-muted mt-1 leading-relaxed">{rec.explanation}</p>

                  <div className="mt-4 p-3.5 rounded-2xl bg-surface-subtle border border-surface-border text-xs">
                    <p className="font-bold text-lavender-800 mb-0.5">Suggested Action:</p>
                    <p className="text-ink">{rec.suggested_action}</p>
                    <p className="font-bold text-emerald-800 mt-2 mb-0.5">Expected Benefit:</p>
                    <p className="text-ink-muted">{rec.expected_benefit}</p>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-surface-border flex items-center gap-2">
                  {rec.status === 'SUGGESTED' ? (
                    <>
                      <button
                        onClick={() => handleRecommendationAction(rec.id, 'ACCEPTED')}
                        className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <Check className="w-3.5 h-3.5" /> Accept & Plan Action
                      </button>
                      <button
                        onClick={() => handleRecommendationAction(rec.id, 'REJECTED')}
                        className="py-2 px-3 rounded-xl border border-surface-border hover:bg-surface-subtle text-ink-muted text-xs font-semibold transition-colors"
                      >
                        Dismiss
                      </button>
                    </>
                  ) : (
                    <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Recommendation {rec.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Management Tracker & Verification Impact */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-ink flex items-center gap-2">
              <ListTodo className="w-5 h-5 text-lavender-600" /> Active Faculty Improvement Actions
            </h3>
            <p className="text-xs text-ink-muted">
              Progression: Planned &rarr; In Progress &rarr; Completed &rarr; Verification Pending &rarr; Verified Resolved.
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
              className="px-4 py-2 rounded-xl bg-lavender-600 hover:bg-lavender-700 text-white text-xs font-bold shadow-md shadow-lavender-200 transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Plan Custom Action
            </button>
          )}
        </div>

        {actions.length === 0 ? (
          <div className="p-6 bg-white rounded-3xl border border-surface-border text-center text-xs text-ink-muted">
            No improvement actions currently underway for this course.
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-surface-border shadow-card divide-y divide-surface-border overflow-hidden">
            {actions.map((act) => (
              <div key={act.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-bold text-lavender-700 bg-lavender-100 px-2.5 py-0.5 rounded-full">
                      {act.issue_topic}
                    </span>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                        act.current_status === 'VERIFIED_RESOLVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : act.current_status === 'VERIFICATION_PENDING'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}
                    >
                      {act.current_status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-ink">{act.title}</h4>
                  <p className="text-xs text-ink-muted mt-1 leading-relaxed">{act.description}</p>

                  {act.public_update && (
                    <p className="text-xs text-lavender-900 bg-lavender-50 p-2.5 rounded-xl border border-lavender-200 mt-2">
                      <strong className="text-lavender-800">Public Student Notice:</strong> {act.public_update}
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
                    className="px-4 py-2 rounded-xl border border-surface-border bg-surface-subtle hover:bg-white text-xs font-bold text-ink transition-colors"
                  >
                    Update Status & Note
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
