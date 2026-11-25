import React, { useState } from 'react';
import { verificationsApi } from '../../api/services';
import { useToast } from '../../context/ToastContext';
import { VerificationOutcome } from '../../types';
import { CheckCircle2, HelpCircle, XCircle, X, Star } from 'lucide-react';

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
  const [updatedRating, setUpdatedRating] = useState<number>(4);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await verificationsApi.submit({
        action_id: actionId,
        outcome,
        updated_understanding_rating: updatedRating,
        comment: comment.trim() || undefined,
      });
      addToast('success', 'Verification Recorded!', 'Thank you! Your evaluation closes the feedback loop.');
      onSuccess();
      onClose();
    } catch (err: any) {
      addToast('error', 'Verification Failed', err.response?.data?.detail || 'Unable to submit verification.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-elevated border border-[#E1E8F0] max-w-lg w-full overflow-hidden">
        <div className="p-4 px-6 border-b border-[#E1E8F0] bg-[#F5F8FC] flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#203247]">Verify Academic Resolution</h3>
            <p className="text-xs text-[#718096]">
              Closed-Loop Impact Measurement &bull; <span className="font-semibold text-[#1769AA]">{topic}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-[#718096] hover:text-[#203247] rounded transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3.5 rounded-lg bg-[#EAF4FC] border border-[#CBD5E1]">
            <p className="text-[11px] font-bold text-[#0F4C81] uppercase tracking-wider mb-1">
              Implemented Faculty Action:
            </p>
            <p className="text-xs font-bold text-[#203247]">{actionTitle}</p>
            <p className="text-xs text-[#718096] mt-1">
              Did this instructional action effectively improve your comprehension of {topic}?
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#203247] mb-2">
              Did the intervention help your understanding?
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setOutcome('YES');
                  if (updatedRating < 4) setUpdatedRating(4);
                }}
                className={`p-3 rounded-lg border text-center transition-all ${
                  outcome === 'YES'
                    ? 'border-[#28A879] bg-emerald-50 text-emerald-900 font-bold shadow-sm'
                    : 'border-[#E1E8F0] hover:bg-[#F5F8FC] text-[#718096]'
                }`}
              >
                <CheckCircle2 className={`w-5 h-5 mx-auto mb-1 ${outcome === 'YES' ? 'text-[#28A879]' : 'text-slate-400'}`} />
                <span className="text-xs block">Yes, Resolved</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setOutcome('PARTIALLY');
                  setUpdatedRating(3);
                }}
                className={`p-3 rounded-lg border text-center transition-all ${
                  outcome === 'PARTIALLY'
                    ? 'border-[#E7A33E] bg-amber-50 text-amber-900 font-bold shadow-sm'
                    : 'border-[#E1E8F0] hover:bg-[#F5F8FC] text-[#718096]'
                }`}
              >
                <HelpCircle className={`w-5 h-5 mx-auto mb-1 ${outcome === 'PARTIALLY' ? 'text-[#E7A33E]' : 'text-slate-400'}`} />
                <span className="text-xs block">Partially Helped</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setOutcome('NO');
                  if (updatedRating > 2) setUpdatedRating(2);
                }}
                className={`p-3 rounded-lg border text-center transition-all ${
                  outcome === 'NO'
                    ? 'border-[#D95763] bg-red-50 text-red-900 font-bold shadow-sm'
                    : 'border-[#E1E8F0] hover:bg-[#F5F8FC] text-[#718096]'
                }`}
              >
                <XCircle className={`w-5 h-5 mx-auto mb-1 ${outcome === 'NO' ? 'text-[#D95763]' : 'text-slate-400'}`} />
                <span className="text-xs block">No, Still Unclear</span>
              </button>
            </div>
          </div>

          {/* Updated Understanding Rating (1-5) */}
          <div>
            <label className="block text-xs font-semibold text-[#203247] mb-1">
              Updated Understanding Rating (After Intervention)
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setUpdatedRating(star)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-6 h-6 ${
                      updatedRating >= star
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-300 fill-transparent'
                    }`}
                  />
                </button>
              ))}
              <span className="text-xs font-medium text-[#718096] ml-2">
                {updatedRating} / 5 stars
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#203247] mb-1">
              Optional Student Comments
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="e.g., The extra live tracing helped, but I'd still like more sample questions..."
              className="w-full p-2.5 text-xs border border-[#E1E8F0] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1769AA] text-[#203247]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E1E8F0]">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-[#E1E8F0] text-xs font-medium text-[#718096] hover:text-[#203247]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 rounded-lg bg-[#1769AA] hover:bg-[#12578D] text-white text-xs font-semibold transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Recording...' : 'Submit Anonymous Verification'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
