import React, { useState, useEffect } from 'react';
import { feedbackApi, analyticsApi } from '../../api/services';
import { StudentAnalytics } from '../../types';
import { VerificationModal } from '../../components/feedback/VerificationModal';
import { ShieldCheck, Calendar, CheckCircle2, HelpCircle, Clock, ListTodo, MessageSquare } from 'lucide-react';

interface HistoryItem {
  submission_id: number;
  opportunity_title: string;
  week_number: number;
  topic: string;
  course_title: string;
  course_code: string;
  submitted_at: string;
}

export const StudentHistory: React.FC = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [analytics, setAnalytics] = useState<StudentAnalytics | null>(null);
  const [activeTab, setActiveTab] = useState<'submissions' | 'actions'>('submissions');
  const [loading, setLoading] = useState(true);

  const [activeVerification, setActiveVerification] = useState<{
    actionId: number;
    actionTitle: string;
    topic: string;
  } | null>(null);

  const loadData = async () => {
    try {
      const [hRes, aRes] = await Promise.all([
        feedbackApi.getMyHistory(),
        analyticsApi.getStudentAnalytics(),
      ]);
      setHistory(hRes);
      setAnalytics(aRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#203247]">Student Feedback & Resolution Tracker</h2>
          <p className="text-xs text-[#718096]">
            Verify submitted evaluations, review faculty pedagogical adjustments, and participate in resolution voting.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-white rounded-lg border border-[#E1E8F0]">
          <button
            onClick={() => setActiveTab('submissions')}
            className={`px-3.5 py-1.5 rounded text-xs font-semibold transition-all ${
              activeTab === 'submissions'
                ? 'bg-[#1769AA] text-white shadow-sm'
                : 'text-[#718096] hover:text-[#203247]'
            }`}
          >
            My Submitted Feedback ({history.length})
          </button>
          <button
            onClick={() => setActiveTab('actions')}
            className={`px-3.5 py-1.5 rounded text-xs font-semibold transition-all ${
              activeTab === 'actions'
                ? 'bg-[#1769AA] text-white shadow-sm'
                : 'text-[#718096] hover:text-[#203247]'
            }`}
          >
            Action Tracker & Verifications ({analytics?.recent_actions?.length || 0})
          </button>
        </div>
      </div>

      {activeTab === 'submissions' ? (
        <div className="space-y-4">
          <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-start gap-3">
            <ShieldCheck className="w-4 h-4 text-[#28A879] shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-950 leading-relaxed">
              <p className="font-bold">Cryptographic Anonymity Guarantee</p>
              <p className="mt-0.5 text-emerald-800">
                This audit log tracks eligibility tokens to prevent duplicate weekly submissions. Your ratings and written feedback are decoupled from your identity to ensure complete psychological safety.
              </p>
            </div>
          </div>

          {history.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center border border-[#E1E8F0]">
              <CheckCircle2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-[#203247]">No Feedback Records Yet</p>
              <p className="text-xs text-[#718096] mt-1">
                When you evaluate weekly course modules, verified submission records will appear here.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-[#E1E8F0] shadow-card divide-y divide-[#E1E8F0] overflow-hidden">
              {history.map((item) => (
                <div key={item.submission_id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#EAF4FC] text-[#1769AA] flex items-center justify-center font-bold text-xs border border-[#CBD5E1]">
                      W{item.week_number}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#1769AA]">{item.course_code}</span>
                        <span className="text-xs text-[#718096]">&bull;</span>
                        <span className="text-xs font-bold text-[#203247]">{item.topic}</span>
                      </div>
                      <p className="text-xs text-[#718096] mt-0.5">{item.opportunity_title}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#28A879] bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded">
                      <CheckCircle2 className="w-3 h-3" /> Anonymous Token Validated
                    </span>
                    <p className="text-[11px] text-[#718096] mt-1">
                      {new Date(item.submitted_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-3.5 rounded-lg bg-[#EAF4FC] border border-[#CBD5E1] flex items-start gap-3">
            <ListTodo className="w-4 h-4 text-[#1769AA] shrink-0 mt-0.5" />
            <div className="text-xs text-[#0F4C81] leading-relaxed">
              <p className="font-bold">Closed-Loop Resolution Process</p>
              <p className="mt-0.5 text-[#1769AA]">
                Faculty review weekly issues, plan instructional adjustments (e.g., extra tutorials, visual study aids, pacing pauses), and request verification from students to confirm problem resolution.
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
                    <h5 className="text-sm font-bold text-[#203247]">{act.title}</h5>
                    {act.public_update && (
                      <p className="text-xs text-[#718096] mt-1.5 bg-[#F5F8FC] p-2.5 rounded-lg border border-[#E1E8F0]">
                        <span className="font-semibold text-[#1769AA]">Faculty Notice:</span> {act.public_update}
                      </p>
                    )}
                  </div>

                  {act.current_status === 'VERIFICATION_PENDING' ? (
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
                  ) : act.current_status === 'VERIFIED_RESOLVED' ? (
                    <span className="shrink-0 px-3 py-1 rounded bg-emerald-50 text-[#28A879] border border-emerald-200 text-xs font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Verified Resolved
                    </span>
                  ) : (
                    <span className="shrink-0 px-3 py-1 rounded bg-slate-50 text-[#718096] border border-slate-200 text-xs font-medium">
                      Action In Progress
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-white rounded-xl border border-[#E1E8F0] text-xs text-[#718096]">
              No instructional intervention actions on record.
            </div>
          )}
        </div>
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
