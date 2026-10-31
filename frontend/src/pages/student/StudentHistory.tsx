import React, { useState, useEffect } from 'react';
import { feedbackApi } from '../../api/services';
import { ShieldCheck, Calendar, CheckCircle2, BookOpen } from 'lucide-react';

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    feedbackApi.getMyHistory().then((res) => {
      setHistory(res);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-ink">My Feedback History</h2>
        <p className="text-xs text-ink-muted">
          Record of your submitted feedback opportunities. Raw comments are decoupled from your identity to guarantee privacy.
        </p>
      </div>

      <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="text-xs text-emerald-900 leading-relaxed">
          <p className="font-bold">Institutional Privacy Guarantee</p>
          <p className="mt-0.5 opacity-90">
            This log tracks your eligibility tokens so you are not prompted twice for the same weekly opportunity.
            Your written comments and ratings are stored separately without any link to your student profile.
          </p>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-surface-border">
          <CheckCircle2 className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-ink">No Feedback Submissions Yet</p>
          <p className="text-xs text-ink-muted mt-1">
            As you participate in weekly course reviews, your verified timestamps will appear here.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-surface-border shadow-card divide-y divide-surface-border overflow-hidden">
          {history.map((item) => (
            <div key={item.submission_id} className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-lavender-100 text-lavender-700 flex items-center justify-center font-bold text-sm">
                  W{item.week_number}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-lavender-700">{item.course_code}</span>
                    <span className="text-xs text-ink-muted">&bull;</span>
                    <span className="text-xs font-bold text-ink">{item.topic}</span>
                  </div>
                  <p className="text-xs text-ink-muted mt-0.5">{item.opportunity_title}</p>
                </div>
              </div>

              <div className="text-right">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Verified Anonymous
                </span>
                <p className="text-[11px] text-ink-muted mt-1">
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
  );
};
