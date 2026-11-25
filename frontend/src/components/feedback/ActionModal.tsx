import React, { useState } from 'react';
import { actionsApi } from '../../api/services';
import { useToast } from '../../context/ToastContext';
import { IssueStatus } from '../../types';
import { X, Calendar, MessageSquare, CheckCircle } from 'lucide-react';

interface ActionModalProps {
  issueId: number;
  issueTitle: string;
  topic: string;
  existingActionId?: number;
  initialTitle?: string;
  initialDescription?: string;
  initialStatus?: IssueStatus;
  initialPublicUpdate?: string;
  onClose: () => void;
  onSuccess: () => void;
}

const STATUS_OPTIONS: IssueStatus[] = [
  'ACTION_PLANNED',
  'IN_PROGRESS',
  'ACTION_COMPLETED',
  'VERIFICATION_PENDING',
  'VERIFIED_RESOLVED',
];

export const ActionModal: React.FC<ActionModalProps> = ({
  issueId,
  issueTitle,
  topic,
  existingActionId,
  initialTitle = '',
  initialDescription = '',
  initialStatus = 'ACTION_PLANNED',
  initialPublicUpdate = '',
  onClose,
  onSuccess,
}) => {
  const { addToast } = useToast();
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [status, setStatus] = useState<IssueStatus>(initialStatus);
  const [publicUpdate, setPublicUpdate] = useState(initialPublicUpdate);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !existingActionId) return;

    setIsSubmitting(true);
    try {
      if (existingActionId) {
        await actionsApi.updateActionStatus(existingActionId, {
          status,
          public_update: publicUpdate.trim() || undefined,
          comment: comment.trim() || undefined,
        });
        addToast('success', 'Action Status Updated', `Action progressed to ${status}`);
      } else {
        await actionsApi.createAction({
          issue_id: issueId,
          title,
          description,
          public_update: publicUpdate.trim() || `Faculty committed to action: ${title}`,
        });
        addToast('success', 'Improvement Action Planned', 'Enrolled students can track this action in real time.');
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      addToast('error', 'Update Failed', err.response?.data?.detail || 'Could not save action.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-elevated border border-[#E1E8F0] max-w-lg w-full overflow-hidden">
        <div className="p-4 px-6 border-b border-[#E1E8F0] bg-[#F5F8FC] flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#203247]">
              {existingActionId ? 'Update Improvement Action' : 'Plan Improvement Action'}
            </h3>
            <p className="text-xs text-[#718096]">
              Targeting: <span className="font-semibold text-[#1769AA]">{topic}</span> &bull; {issueTitle}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-[#718096] hover:text-[#203247] rounded transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {!existingActionId && (
            <>
              <div>
                <label className="block text-xs font-semibold text-[#203247] mb-1">
                  Action Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Conduct Special 45-Min Recursion Problem-Solving Tutorial"
                  className="w-full px-3 py-2 text-xs border border-[#E1E8F0] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1769AA] text-[#203247]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#203247] mb-1">
                  Action Description & Pedagogical Strategy
                </label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detail the specific instructional change, date/time, and materials to be distributed..."
                  className="w-full p-2.5 text-xs border border-[#E1E8F0] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1769AA] text-[#203247]"
                />
              </div>
            </>
          )}

          {existingActionId && (
            <div>
              <label className="block text-xs font-semibold text-[#203247] mb-1">
                Progress Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as IssueStatus)}
                className="w-full p-2 text-xs border border-[#E1E8F0] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1769AA] text-[#203247] bg-white font-medium"
              >
                {STATUS_OPTIONS.map((st) => (
                  <option key={st} value={st}>
                    {st.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#203247] mb-1">
              Public Student Notice (Visible on Student Portal)
            </label>
            <textarea
              rows={2}
              value={publicUpdate}
              onChange={(e) => setPublicUpdate(e.target.value)}
              placeholder="e.g., Workshop scheduled for Friday 4 PM in Hall B. Slides posted to portal."
              className="w-full p-2 text-xs border border-[#E1E8F0] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1769AA] text-[#203247]"
            />
          </div>

          {existingActionId && (
            <div>
              <label className="block text-xs font-semibold text-[#203247] mb-1">
                Internal Faculty Log Note (Audit Trail)
              </label>
              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="e.g. Conducted tutorial with 35 students; requesting student verification."
                className="w-full px-3 py-1.5 text-xs border border-[#E1E8F0] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1769AA] text-[#203247]"
              />
            </div>
          )}

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
              {isSubmitting ? 'Saving...' : existingActionId ? 'Update Action Status' : 'Create Action'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
