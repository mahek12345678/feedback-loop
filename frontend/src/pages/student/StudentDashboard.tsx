import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { feedbackApi, coursesApi, analyticsApi } from '../../api/services';
import { Course, FeedbackOpportunity, StudentAnalytics } from '../../types';
import { AIChatModal } from '../../components/feedback/AIChatModal';
import { FeedbackFormModal } from '../../components/feedback/FeedbackFormModal';
import { VerificationModal } from '../../components/feedback/VerificationModal';
import {
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
  Sparkles,
  Bell,
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
    weekNumber?: number;
  } | null>(null);

  const [activeFeedbackForm, setActiveFeedbackForm] = useState<{
    oppId: number;
    courseTitle: string;
    courseCode?: string;
    topic: string;
    weekNumber?: number;
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
    <div className="space-y-6">
      {/* Academic Header Hero */}
      <div className="bg-[#0F4C81] rounded-xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-[#1769AA] text-white">
              <ShieldCheck className="w-3.5 h-3.5" /> 100% Anonymous Student Feedback
            </span>
            <span className="text-xs text-blue-200">Fall 2026 Academic Term</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">
            Welcome, {user?.full_name?.split(' ')[0]}!
          </h2>
          <p className="text-xs text-blue-100 mt-1 max-w-2xl leading-relaxed">
            Your continuous feedback empowers professors to adjust lecture pacing, clarify difficult concepts, and implement targeted interventions before exams.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 shrink-0">
          <button
            onClick={() => {
              const targetOpp = opportunities.find((o) => !o.has_submitted) || opportunities[0];
              if (targetOpp) {
                setActiveAIChat({
                  courseId: targetOpp.course_id,
                  oppId: targetOpp.id,
                  courseTitle: targetOpp.course_title || 'Course',
                  topic: targetOpp.topic,
                  weekNumber: targetOpp.week_number,
                });
              } else if (courses.length > 0) {
                setActiveAIChat({
                  courseId: courses[0].id,
                  oppId: 1,
                  courseTitle: courses[0].title,
                  topic: 'Course Concepts & Feedback',
                  weekNumber: 4,
                });
              }
            }}
            className="px-4 py-2.5 rounded-lg bg-[#1769AA] hover:bg-[#12578D] text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" /> Chat with AI Assistant
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-[#E1E8F0] shadow-card flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-[#718096] uppercase tracking-wider">Enrolled Courses</p>
            <p className="text-2xl font-black text-[#203247] mt-1">{analytics?.enrolled_courses_count || courses.length}</p>
            <p className="text-[11px] text-[#718096] mt-0.5">Active modules</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-[#EAF4FC] text-[#1769AA] flex items-center justify-center font-bold">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-[#E1E8F0] shadow-card flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-[#718096] uppercase tracking-wider">Feedback Submitted</p>
            <p className="text-2xl font-black text-[#28A879] mt-1">
              {analytics?.feedback_submitted_count || 0}
            </p>
            <p className="text-[11px] text-[#28A879] font-medium mt-0.5">Anonymous responses</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-[#28A879] flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-[#E1E8F0] shadow-card flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-[#718096] uppercase tracking-wider">Pending This Week</p>
            <p className="text-2xl font-black text-[#E7A33E] mt-1">
              {analytics?.pending_feedback_count ?? opportunities.filter((o) => !o.has_submitted).length}
            </p>
            <p className="text-[11px] text-[#E7A33E] font-medium mt-0.5">Evaluation windows open</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-[#E7A33E] flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-[#E1E8F0] shadow-card flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-[#718096] uppercase tracking-wider">Verifications Needed</p>
            <p className="text-2xl font-black text-[#1769AA] mt-1">
              {analytics?.pending_verifications_count || 0}
            </p>
            <p className="text-[11px] text-[#1769AA] font-medium mt-0.5">Impact checks waiting</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-[#EAF4FC] text-[#1769AA] flex items-center justify-center font-bold">
            <HelpCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Active Weekly Feedback Opportunities */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#203247]">Weekly Continuous Feedback Windows</h3>
            <p className="text-xs text-[#718096]">
              Submit anonymous impressions on lecture pacing, conceptual clarity, and homework workload.
            </p>
          </div>
        </div>

        {opportunities.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-xl border border-[#E1E8F0]">
            <CheckCircle2 className="w-8 h-8 text-[#28A879] mx-auto mb-2" />
            <p className="text-sm font-semibold text-[#203247]">All feedback windows up to date</p>
            <p className="text-xs text-[#718096] mt-1">No pending feedback requests for your enrolled courses right now.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {opportunities.map((opp) => (
              <div
                key={opp.id}
                className="bg-white rounded-xl p-5 border border-[#E1E8F0] shadow-card hover:border-[#CBD5E1] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-xs font-semibold text-[#1769AA] bg-[#EAF4FC] px-2.5 py-0.5 rounded border border-[#CBD5E1]">
                      Week {opp.week_number} Evaluation
                    </span>
                    {opp.has_submitted ? (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-[#28A879] bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Submitted Anonymously
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-[#E7A33E] bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
                        <Clock className="w-3.5 h-3.5" /> Open Window
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm font-bold text-[#203247]">{opp.course_title}</h4>
                  <p className="text-xs font-semibold text-[#1769AA] mt-0.5">
                    {opp.course_code} &bull; Topic: {opp.topic}
                  </p>
                  <p className="text-xs text-[#718096] mt-1.5 leading-relaxed">{opp.title}</p>
                </div>

                <div className="mt-5 pt-3 border-t border-[#E1E8F0]">
                  {opp.has_submitted ? (
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-[#28A879] font-medium flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" /> Anonymous feedback submitted for this week.
                      </p>
                      <button
                        onClick={() =>
                          setActiveAIChat({
                            courseId: opp.course_id,
                            oppId: opp.id,
                            courseTitle: opp.course_title || 'Course',
                            topic: opp.topic,
                            weekNumber: opp.week_number,
                          })
                        }
                        className="py-1.5 px-3 rounded-lg border border-[#CBD5E1] bg-[#EAF4FC] hover:bg-blue-100 text-[#1769AA] text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> Chat with AI
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          setActiveAIChat({
                            courseId: opp.course_id,
                            oppId: opp.id,
                            courseTitle: opp.course_title || 'Course',
                            topic: opp.topic,
                            weekNumber: opp.week_number,
                          })
                        }
                        className="flex-1 py-2 px-3 rounded-lg bg-[#1769AA] hover:bg-[#12578D] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> AI Feedback Assistant
                      </button>

                      <button
                        onClick={() =>
                          setActiveFeedbackForm({
                            oppId: opp.id,
                            courseTitle: opp.course_title || 'Course',
                            courseCode: opp.course_code,
                            topic: opp.topic,
                            weekNumber: opp.week_number,
                          })
                        }
                        className="py-2 px-3.5 rounded-lg border border-[#E1E8F0] bg-[#F5F8FC] hover:bg-white text-[#203247] text-xs font-semibold transition-colors"
                      >
                        Standard 3-Step Form
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Closed-Loop Faculty Actions & Resolution Verifications */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#203247]">Faculty Interventions & Closed-Loop Action Tracker</h3>
            <p className="text-xs text-[#718096]">
              Real-time progress on teaching adjustments implemented by professors in response to student feedback.
            </p>
          </div>
        </div>

        {analytics?.recent_actions && analytics.recent_actions.length > 0 ? (
          <div className="bg-white rounded-xl border border-[#E1E8F0] shadow-card divide-y divide-[#E1E8F0] overflow-hidden">
            {analytics.recent_actions.map((act) => (
              <div key={act.action_id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-[#718096] uppercase">{act.course_code}</span>
                    <span className="text-xs px-2 py-0.5 rounded font-semibold bg-[#EAF4FC] text-[#1769AA]">
                      {act.topic}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-semibold ${act.current_status === 'VERIFIED_RESOLVED'
                        ? 'bg-emerald-50 text-[#28A879] border border-emerald-200'
                        : act.current_status === 'VERIFICATION_PENDING'
                          ? 'bg-blue-50 text-[#1769AA] border border-blue-200'
                          : 'bg-amber-50 text-[#E7A33E] border border-amber-200'
                        }`}
                    >
                      {act.current_status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <h5 className="text-sm font-bold text-[#203247]">{act.title}</h5>
                  {act.public_update && (
                    <p className="text-xs text-[#718096] mt-1.5 bg-[#F5F8FC] p-2.5 rounded-lg border border-[#E1E8F0]">
                      <span className="font-semibold text-[#1769AA]">Faculty Notice:</span> {act.public_update}
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
                    className="shrink-0 px-3.5 py-2 rounded-lg bg-[#1769AA] hover:bg-[#12578D] text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
                  >
                    <HelpCircle className="w-3.5 h-3.5" /> Verify If Resolved
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center bg-white rounded-xl border border-[#E1E8F0] text-xs text-[#718096]">
            No faculty improvement actions currently awaiting verification.
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
          weekNumber={activeAIChat.weekNumber}
          onClose={() => setActiveAIChat(null)}
          onSuccess={loadData}
          onSwitchToManual={() => {
            setActiveFeedbackForm({
              oppId: activeAIChat.oppId,
              courseTitle: activeAIChat.courseTitle,
              topic: activeAIChat.topic,
              weekNumber: activeAIChat.weekNumber,
            });
          }}
        />
      )}

      {activeFeedbackForm && (
        <FeedbackFormModal
          opportunityId={activeFeedbackForm.oppId}
          courseTitle={activeFeedbackForm.courseTitle}
          courseCode={activeFeedbackForm.courseCode}
          topic={activeFeedbackForm.topic}
          weekNumber={activeFeedbackForm.weekNumber}
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
