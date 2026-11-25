import React, { useState } from 'react';
import { feedbackApi } from '../../api/services';
import { useToast } from '../../context/ToastContext';
import { Star, X, Check, Shield, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface FeedbackFormModalProps {
  opportunityId: number;
  courseTitle: string;
  courseCode?: string;
  topic: string;
  weekNumber?: number;
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
  courseCode = 'CS201',
  topic,
  weekNumber = 1,
  onClose,
  onSuccess,
}) => {
  const { addToast } = useToast();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [rating, setRating] = useState(3);
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
      addToast('success', 'Feedback Submitted!', 'Your feedback is 100% anonymous and has been securely recorded.');
      onSuccess();
      onClose();
    } catch (err: any) {
      addToast('error', 'Submission Failed', err.response?.data?.detail || 'Unable to submit feedback.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRatingLabel = (r: number) => {
    switch (r) {
      case 1:
        return 'Very Difficult / Significant Friction';
      case 2:
        return 'Challenging / Needs Clarification';
      case 3:
        return 'Moderate / Expected Difficulty';
      case 4:
        return 'Good / Well Understood';
      case 5:
        return 'Excellent / Fully Mastered';
      default:
        return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-elevated border border-[#E1E8F0] max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="p-4 px-6 border-b border-[#E1E8F0] flex items-center justify-between bg-[#F5F8FC]">
          <div>
            <h3 className="text-base font-bold text-[#203247]">Continuous Student Feedback</h3>
            <p className="text-xs text-[#718096]">
              {courseCode} - {courseTitle} • <span className="font-semibold text-[#1769AA]">{topic} (Week {weekNumber})</span>
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-[#718096] hover:text-[#203247] rounded transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 3-Step Wizard Indicator */}
        <div className="px-6 pt-4 pb-2 border-b border-[#E1E8F0] bg-white">
          <div className="flex items-center justify-between text-xs">
            <div className={`flex items-center gap-1.5 font-semibold ${currentStep === 1 ? 'text-[#1769AA]' : currentStep > 1 ? 'text-[#28A879]' : 'text-[#718096]'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${currentStep === 1 ? 'bg-[#1769AA] text-white' : currentStep > 1 ? 'bg-[#28A879] text-white' : 'bg-slate-100 text-[#718096]'}`}>
                {currentStep > 1 ? '✓' : '1'}
              </span>
              <span>1. Course & Topic</span>
            </div>
            <div className="h-0.5 flex-1 mx-2 bg-[#E1E8F0]" />
            <div className={`flex items-center gap-1.5 font-semibold ${currentStep === 2 ? 'text-[#1769AA]' : currentStep > 2 ? 'text-[#28A879]' : 'text-[#718096]'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${currentStep === 2 ? 'bg-[#1769AA] text-white' : currentStep > 2 ? 'bg-[#28A879] text-white' : 'bg-slate-100 text-[#718096]'}`}>
                {currentStep > 2 ? '✓' : '2'}
              </span>
              <span>2. Evaluation</span>
            </div>
            <div className="h-0.5 flex-1 mx-2 bg-[#E1E8F0]" />
            <div className={`flex items-center gap-1.5 font-semibold ${currentStep === 3 ? 'text-[#1769AA]' : 'text-[#718096]'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${currentStep === 3 ? 'bg-[#1769AA] text-white' : 'bg-slate-100 text-[#718096]'}`}>
                3
              </span>
              <span>3. Review & Submit</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* STEP 1: Confirm Course, Topic & Academic Week */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <p className="text-xs font-semibold text-[#203247]">
                Please verify the course, topic, and academic period you are providing feedback for:
              </p>
              <div className="p-4 rounded-lg bg-[#F5F8FC] border border-[#E1E8F0] space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-[#E1E8F0]">
                  <span className="text-[#718096]">Course:</span>
                  <span className="font-semibold text-[#203247]">{courseCode} — {courseTitle}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E1E8F0]">
                  <span className="text-[#718096]">Syllabus Topic:</span>
                  <span className="font-semibold text-[#1769AA]">{topic}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E1E8F0]">
                  <span className="text-[#718096]">Academic Week:</span>
                  <span className="font-semibold text-[#203247]">Week {weekNumber}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#718096]">Privacy Guarantee:</span>
                  <span className="font-semibold text-[#28A879]">Strictly Anonymous Submission</span>
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-2 rounded-lg bg-[#1769AA] hover:bg-[#12578D] text-white text-xs font-semibold flex items-center gap-2"
                >
                  Proceed to Evaluation <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Rating, Category & Written Comments */}
          {currentStep === 2 && (
            <div className="space-y-4">
              {/* Rating */}
              <div>
                <label className="block text-xs font-semibold text-[#203247] mb-1">
                  Understanding Rating (1 = Low comprehension, 5 = Complete mastery)
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
                        className={`w-6 h-6 ${
                          (hoverRating || rating) >= star
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-300 fill-transparent'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-medium text-[#718096] ml-2">
                    {getRatingLabel(hoverRating || rating)}
                  </span>
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-[#203247] mb-1">
                  Feedback Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2 text-xs border border-[#E1E8F0] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1769AA] text-[#203247] bg-white"
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
                <label className="block text-xs font-semibold text-[#203247] mb-1">
                  What was unclear or challenging? (Optional)
                </label>
                <textarea
                  rows={3}
                  value={writtenFeedback}
                  onChange={(e) => setWrittenFeedback(e.target.value)}
                  placeholder="e.g., The explanation of recursion trees was very fast and we didn't trace an example..."
                  className="w-full p-2.5 text-xs border border-[#E1E8F0] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1769AA] text-[#203247]"
                />
              </div>

              {/* Structured Need */}
              <div>
                <label className="block text-xs font-semibold text-[#203247] mb-1">
                  What instructional adjustment would help you most? (Optional)
                </label>
                <input
                  type="text"
                  value={structuredNeed}
                  onChange={(e) => setStructuredNeed(e.target.value)}
                  placeholder="e.g., Visual recursion diagrams or an extra 15-minute practice session"
                  className="w-full p-2 text-xs border border-[#E1E8F0] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1769AA] text-[#203247]"
                />
              </div>

              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-3.5 py-2 rounded-lg border border-[#E1E8F0] text-[#718096] hover:text-[#203247] text-xs font-medium flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-4 py-2 rounded-lg bg-[#1769AA] hover:bg-[#12578D] text-white text-xs font-semibold flex items-center gap-2"
                >
                  Review Anonymously <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Review and Submit Anonymously */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-start gap-2.5">
                <Shield className="w-4 h-4 text-[#28A879] mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-emerald-950">Anonymous Ingestion Verification</h4>
                  <p className="text-[11px] text-emerald-800 mt-0.5 leading-relaxed">
                    Eligibility is separated from your response content via cryptographic submission tokens. Your name, student ID, and email are never attached to this feedback.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-[#F5F8FC] border border-[#E1E8F0] space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-[#E1E8F0]">
                  <span className="text-[#718096]">Course & Topic:</span>
                  <span className="font-semibold text-[#203247]">{courseCode} • {topic} (Week {weekNumber})</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E1E8F0]">
                  <span className="text-[#718096]">Rating:</span>
                  <span className="font-semibold text-[#203247]">{rating} / 5 stars ({getRatingLabel(rating)})</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E1E8F0]">
                  <span className="text-[#718096]">Category:</span>
                  <span className="font-semibold text-[#1769AA]">{category}</span>
                </div>
                {writtenFeedback && (
                  <div className="py-1 border-b border-[#E1E8F0]">
                    <span className="text-[#718096] block mb-0.5">Written Concern:</span>
                    <p className="text-[#203247] bg-white p-2 rounded border border-[#E1E8F0]">{writtenFeedback}</p>
                  </div>
                )}
                {structuredNeed && (
                  <div className="py-1">
                    <span className="text-[#718096] block mb-0.5">Requested Improvement:</span>
                    <p className="text-[#203247] bg-white p-2 rounded border border-[#E1E8F0]">{structuredNeed}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-3.5 py-2 rounded-lg border border-[#E1E8F0] text-[#718096] hover:text-[#203247] text-xs font-medium flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Edit
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg bg-[#1769AA] hover:bg-[#12578D] text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                >
                  {isSubmitting ? 'Submitting...' : 'Confirm & Submit Feedback'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
