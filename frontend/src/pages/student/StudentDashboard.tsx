import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { feedbackApi, coursesApi, analyticsApi } from '../../api/services';
import { Course, FeedbackOpportunity, StudentAnalytics } from '../../types';
import { AIChatModal } from '../../components/feedback/AIChatModal';
import { FeedbackFormModal } from '../../components/feedback/FeedbackFormModal';
import { VerificationModal } from '../../components/feedback/VerificationModal';
import {
  Sparkles,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  MessageSquare,
  AlertCircle,
  HelpCircle,
  TrendingUp,
} from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [opportunities, setOpportunities] = useState<FeedbackOpportunity[]>([]);
  const [analytics, setAnalytics] = useState<StudentAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [activeAIChat, setActiveAIChat] = useState<{
    courseId: number;
    oppId: number;
    courseTitle: string;
    topic: string;
  } | null>(null);

  const [activeFeedbackForm, setActiveFeedbackForm] = useState<{
    oppId: number;
    courseTitle: string;
    topic: string;
  } | null>(null);

  const [activeVerification, setActiveVerification] = useState<{
    actionId: number;
    actionTitle: string;
    topic: string;
  } | null>(null);

  const loadData = async () => {
    try {
      const [cRes, oRes, aRes] = await Promise.all([
        coursesApi.getCourses(),
        feedbackApi.getOpportunities(),
        analyticsApi.getStudentAnalytics(),
      ]);
      setCourses(cRes);
      setOpportunities(oRes);
      setAnalytics(aRes);
    } catch (err) {
      console.error('Failed to load student data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome Hero */}
      <div className="bg-gradient-to-r from-lavender-600 via-lavender-500 to-indigo-600 rounded-3xl p-8 text-white shadow-elevated relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-md mb-3">
            <Sparkles className="w-3.5 h-3.5" /> Anonymous Student Voice
          </span>
          <h2 className="text-2xl lg:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.full_name?.split(' ')[0]}!
          </h2>
          <p className="text-lavender-100 text-sm mt-2 leading-relaxed">
            Continuous feedback helps faculty refine teaching pace, clarify complex topics, and resolve learning
            barriers in real time throughout the semester.
          </p>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-surface-border shadow-card flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-ink-muted uppercase tracking-wider">Enrolled Courses</p>
            <p className="text-2xl font-black text-ink mt-1">{analytics?.enrolled_courses_count || courses.length}</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-lavender-100 text-lavender-700 flex items-center justify-center font-bold">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-surface-border shadow-card flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-ink-muted uppercase tracking-wider">Feedback Submitted</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">
              {analytics?.feedback_submitted_count || 0}
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-surface-border shadow-card flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-ink-muted uppercase tracking-wider">Pending This Week</p>
            <p className="text-2xl font-black text-amber-500 mt-1">
              {analytics?.pending_feedback_count ?? opportunities.filter((o) => !o.has_submitted).length}
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-surface-border shadow-card flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-ink-muted uppercase tracking-wider">Verifications Needed</p>
            <p className="text-2xl font-black text-lavender-600 mt-1">
              {analytics?.pending_verifications_count || 0}
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-lavender-100 text-lavender-700 flex items-center justify-center font-bold">
            <HelpCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Active Weekly Feedback Opportunities */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-ink">Active Weekly Feedback Windows</h3>
            <p className="text-xs text-ink-muted">
              Opportunities are scheduled weekly. One anonymous submission permitted per topic.
            </p>
          </div>
        </div>

        {opportunities.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-surface-border">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-ink">All caught up!</p>
            <p className="text-xs text-ink-muted mt-1">No active feedback windows require your response right now.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {opportunities.map((opp) => (
              <div
                key={opp.id}
                className="bg-white rounded-3xl p-6 border border-surface-border shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-lavender-700 bg-lavender-100 px-2.5 py-1 rounded-full">
                      Week {opp.week_number} Evaluation
                    </span>
                    {opp.has_submitted ? (
                      <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Submitted
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                        <Clock className="w-3.5 h-3.5" /> Active Window
                      </span>
                    )}
                  </div>

                  <h4 className="text-base font-bold text-ink">{opp.course_title}</h4>
                  <p className="text-xs font-semibold text-lavender-600 mt-0.5">
                    {opp.course_code} &bull; Topic: {opp.topic}
                  </p>
                  <p className="text-xs text-ink-muted mt-2 leading-relaxed">{opp.title}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-surface-border flex items-center gap-2">
                  {opp.has_submitted ? (
                    <p className="text-xs text-emerald-700 font-medium flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> Feedback recorded anonymously for this week.
                    </p>
                  ) : (
                    <>
                      <button
                        onClick={() =>
                          setActiveAIChat({
                            courseId: opp.course_id,
                            oppId: opp.id,
                            courseTitle: opp.course_title || 'Course',
                            topic: opp.topic,
                          })
                        }
                        className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-lavender-600 to-indigo-600 hover:from-lavender-700 hover:to-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-lavender-200 transition-all"
                      >
                        <Sparkles className="w-4 h-4" /> AI Conversational Assistant
                      </button>

                      <button
                        onClick={() =>
                          setActiveFeedbackForm({
                            oppId: opp.id,
                            courseTitle: opp.course_title || 'Course',
                            topic: opp.topic,
                          })
                        }
                        className="py-2.5 px-3.5 rounded-xl border border-surface-border bg-surface-subtle hover:bg-white text-ink text-xs font-semibold transition-colors"
                      >
                        Standard Form
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Closed-Loop Faculty Actions & Resolution Verifications */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-ink">Closed-Loop Resolution & Faculty Actions</h3>
            <p className="text-xs text-ink-muted">
              Track instructional adjustments made by your professors and verify if they improved your understanding.
            </p>
          </div>
        </div>

        {analytics?.recent_actions && analytics.recent_actions.length > 0 ? (
          <div className="bg-white rounded-3xl p-6 border border-surface-border shadow-card divide-y divide-surface-border">
            {analytics.recent_actions.map((act) => (
              <div key={act.action_id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-ink-muted uppercase">{act.course_code}</span>
                    <span className="text-xs px-2 py-0.5 rounded-md font-semibold bg-lavender-100 text-lavender-700">
                      {act.topic}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-md font-semibold ${
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
                  <h5 className="text-sm font-bold text-ink">{act.title}</h5>
                  {act.public_update && (
                    <p className="text-xs text-ink-muted mt-1 bg-surface-subtle p-2.5 rounded-xl border border-surface-border">
                      <span className="font-semibold text-lavender-800">Faculty Update:</span> {act.public_update}
                    </p>
                  )}
                </div>

                {act.current_status === 'VERIFICATION_PENDING' && (
                  <button
                    onClick={() =>
                      setActiveVerification({
                        actionId: act.action_id,
                        actionTitle: act.title,
                        topic: act.topic,
                      })
                    }
                    className="shrink-0 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md shadow-amber-200 transition-all flex items-center gap-1.5"
                  >
                    <HelpCircle className="w-4 h-4" /> Verify Resolution
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center bg-white rounded-3xl border border-surface-border text-xs text-ink-muted">
            No active faculty actions currently posted for your courses.
          </div>
        )}
      </div>

      {/* Modals */}
      {activeAIChat && (
        <AIChatModal
          courseId={activeAIChat.courseId}
          opportunityId={activeAIChat.oppId}
          courseTitle={activeAIChat.courseTitle}
          topic={activeAIChat.topic}
          onClose={() => setActiveAIChat(null)}
          onSuccess={loadData}
        />
      )}

      {activeFeedbackForm && (
        <FeedbackFormModal
          opportunityId={activeFeedbackForm.oppId}
          courseTitle={activeFeedbackForm.courseTitle}
          topic={activeFeedbackForm.topic}
          onClose={() => setActiveFeedbackForm(null)}
          onSuccess={loadData}
        />
      )}

      {activeVerification && (
        <VerificationModal
          actionId={activeVerification.actionId}
          actionTitle={activeVerification.actionTitle}
          topic={activeVerification.topic}
          onClose={() => setActiveVerification(null)}
          onSuccess={loadData}
        />
      )}
    </div>
  );
};
