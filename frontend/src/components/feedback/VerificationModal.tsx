import React, { useState } from 'react';
import { verificationsApi } from '../../api/services';
import { useToast } from '../../context/ToastContext';
import { VerificationOutcome } from '../../types';
import { CheckCircle2, HelpCircle, XCircle, X } from 'lucide-react';

interface VerificationModalProps {
  actionId: number;
  actionTitle: string;
  topic: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const VerificationModal: React.FC<VerificationModalProps> = ({
  actionId,
  actionTitle,
  topic,
  onClose,
  onSuccess,
}) => {
  const { addToast } = useToast();
  const [outcome, setOutcome] = useState<VerificationOutcome>('YES');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await verificationsApi.submit({
        action_id: actionId,
        outcome,
        comment: comment.trim() || undefined,
      });
      addToast('success', 'Verification Recorded!', 'Thank you! Your feedback closes the loop and evaluates the intervention.');
      onSuccess();
      onClose();
    } catch (err: any) {
      addToast('error', 'Verification Failed', err.response?.data?.detail || 'Unable to submit verification.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-elevated border border-surface-border max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-surface-border flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-ink">Verify Academic Resolution</h3>
            <p className="text-xs text-ink-muted mt-0.5">
              Closed Loop Impact Measurement &bull; <span className="font-semibold text-lavender-700">{topic}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-ink-muted hover:text-ink rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="p-4 rounded-2xl bg-lavender-50 border border-lavender-200">
            <p className="text-xs font-semibold text-lavender-800 uppercase tracking-wider mb-1">
              Implemented Faculty Action:
            </p>
            <p className="text-sm font-bold text-ink">{actionTitle}</p>
            <p className="text-xs text-ink-muted mt-1">
              Did this instructional action effectively improve your comprehension of {topic}?
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-2">
              Resolution Assessment
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setOutcome('YES')}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  outcome === 'YES'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800 font-bold shadow-subtle'
                    : 'border-surface-border hover:bg-surface-subtle text-ink-muted'
                }`}
              >
                <CheckCircle2 className={`w-6 h-6 mx-auto mb-1 ${outcome === 'YES' ? 'text-emerald-600' : 'text-gray-400'}`} />
                <span className="text-xs block">Yes, Resolved</span>
              </button>

              <button
                type="button"
                onClick={() => setOutcome('PARTIALLY')}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  outcome === 'PARTIALLY'
                    ? 'border-amber-500 bg-amber-50 text-amber-800 font-bold shadow-subtle'
                    : 'border-surface-border hover:bg-surface-subtle text-ink-muted'
                }`}
              >
                <HelpCircle className={`w-6 h-6 mx-auto mb-1 ${outcome === 'PARTIALLY' ? 'text-amber-600' : 'text-gray-400'}`} />
                <span className="text-xs block">Partially Helped</span>
              </button>

              <button
                type="button"
                onClick={() => setOutcome('NO')}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  outcome === 'NO'
                    ? 'border-rose-500 bg-rose-50 text-rose-800 font-bold shadow-subtle'
                    : 'border-surface-border hover:bg-surface-subtle text-ink-muted'
                }`}
              >
                <XCircle className={`w-6 h-6 mx-auto mb-1 ${outcome === 'NO' ? 'text-rose-600' : 'text-gray-400'}`} />
                <span className="text-xs block">Still Unclear</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-2">
              Anonymous Feedback on the Resolution (Optional)
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="e.g. 'The worked recursion examples made it click!' or 'Still struggling with homework problem 3.'"
              className="w-full px-4 py-2.5 rounded-xl border border-surface-border text-sm focus:outline-none focus:ring-2 focus:ring-lavender-400"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-ink-muted hover:text-ink transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-lavender-600 hover:bg-lavender-700 text-white text-sm font-semibold shadow-md shadow-lavender-200 transition-colors"
            >
              {isSubmitting ? 'Recording...' : 'Submit Anonymous Verification'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
