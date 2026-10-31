import React, { useState } from 'react';
import { feedbackApi } from '../../api/services';
import { useToast } from '../../context/ToastContext';
import { Star, X, Check, Shield } from 'lucide-react';

interface FeedbackFormModalProps {
  opportunityId: number;
  courseTitle: string;
  topic: string;
  onClose: () => void;
  onSuccess: () => void;
}

const CATEGORIES = [
  'Teaching clarity',
  'Lecture pace',
  'Course difficulty',
  'Assignment workload',
  'Practical examples',
  'Learning resources',
  'Assessment concerns',
  'Other',
];

export const FeedbackFormModal: React.FC<FeedbackFormModalProps> = ({
  opportunityId,
  courseTitle,
  topic,
  onClose,
  onSuccess,
}) => {
  const { addToast } = useToast();
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [rating, setRating] = useState(4);
  const [hoverRating, setHoverRating] = useState(0);
  const [writtenFeedback, setWrittenFeedback] = useState('');
  const [structuredNeed, setStructuredNeed] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await feedbackApi.submit({
        opportunity_id: opportunityId,
        category,
        rating,
        written_feedback: writtenFeedback.trim() || undefined,
        structured_need: structuredNeed.trim() || undefined,
      });
      addToast('success', 'Feedback Recorded!', 'Your feedback is 100% anonymous and has been securely stored.');
      onSuccess();
      onClose();
    } catch (err: any) {
      addToast('error', 'Submission Failed', err.response?.data?.detail || 'Unable to submit feedback.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-elevated border border-surface-border max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-surface-border flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-ink">Submit Anonymous Feedback</h3>
            <p className="text-xs text-ink-muted mt-0.5">
              {courseTitle} &bull; <span className="font-semibold text-lavender-700">{topic}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-ink-muted hover:text-ink rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Rating */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-2">
              Overall Experience & Comprehension
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-7 h-7 ${
                      (hoverRating || rating) >= star
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-surface-border fill-transparent'
                    }`}
                  />
                </button>
              ))}
              <span className="text-xs font-semibold text-ink-muted ml-2">
                {rating === 1
                  ? 'Very Challenging / Lost'
                  : rating === 2
                  ? 'Needs Improvement'
                  : rating === 3
                  ? 'Adequate / Neutral'
                  : rating === 4
                  ? 'Clear & Engaging'
                  : 'Exceptional Comprehension'}
              </span>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-2">
              Primary Academic Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-surface-border bg-surface-subtle text-sm focus:outline-none focus:ring-2 focus:ring-lavender-400"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Written Feedback */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-2">
              Detailed Comments (Optional)
            </label>
            <textarea
              rows={3}
              value={writtenFeedback}
              onChange={(e) => setWrittenFeedback(e.target.value)}
              placeholder="What specifically worked well or could be improved about this week's topics?"
              className="w-full px-4 py-2.5 rounded-xl border border-surface-border text-sm focus:outline-none focus:ring-2 focus:ring-lavender-400"
            />
          </div>

          {/* Structured Need */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-2">
              Suggested Instructional Adjustment (Optional)
            </label>
            <input
              type="text"
              value={structuredNeed}
              onChange={(e) => setStructuredNeed(e.target.value)}
              placeholder="e.g. 'More visual step-by-step examples', 'Review lecture pace'"
              className="w-full px-4 py-2.5 rounded-xl border border-surface-border text-sm focus:outline-none focus:ring-2 focus:ring-lavender-400"
            />
          </div>

          <div className="flex items-center gap-2 p-3 rounded-xl bg-surface-subtle border border-surface-border text-[11px] text-ink-muted">
            <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Your identity is protected. Professors only see aggregated statistics and anonymized comments once the class privacy threshold is met.
            </span>
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
              {isSubmitting ? 'Submitting...' : 'Submit Anonymous Feedback'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
