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
        addToast('success', 'Action Updated!', `Action status progressed to ${status}`);
      } else {
        await actionsApi.createAction({
          issue_id: issueId,
          title,
          description,
          public_update: publicUpdate.trim() || `Faculty committed to action: ${title}`,
        });
        addToast('success', 'Improvement Action Planned!', 'Enrolled students have been notified of this planned action.');
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
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-elevated border border-surface-border max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-surface-border flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-ink">
              {existingActionId ? 'Update Improvement Action' : 'Plan Improvement Action'}
            </h3>
            <p className="text-xs text-ink-muted mt-0.5">
              Targeting: <span className="font-semibold text-lavender-700">{topic}</span> &bull; {issueTitle}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-ink-muted hover:text-ink rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {!existingActionId && (
            <>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1.5">
                  Action Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. 'Supplementary Worked-Examples Tutorial'"
                  className="w-full px-4 py-2.5 rounded-xl border border-surface-border text-sm focus:outline-none focus:ring-2 focus:ring-lavender-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1.5">
                  Detailed Action Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe instructional steps, dates, and materials to be provided..."
                  className="w-full px-4 py-2.5 rounded-xl border border-surface-border text-sm focus:outline-none focus:ring-2 focus:ring-lavender-400"
                />
              </div>
            </>
          )}

          {existingActionId && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1.5">
                Current Lifecycle Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as IssueStatus)}
                className="w-full px-4 py-2.5 rounded-xl border border-surface-border bg-surface-subtle text-sm focus:outline-none focus:ring-2 focus:ring-lavender-400 font-semibold"
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
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1.5">
              Public Student Update Announcement
            </label>
            <textarea
              rows={2}
              value={publicUpdate}
              onChange={(e) => setPublicUpdate(e.target.value)}
              placeholder="e.g. 'Tutorial session conducted on Friday! Visual guide uploaded to portal. Please verify if it helped.'"
              className="w-full px-4 py-2.5 rounded-xl border border-surface-border text-sm focus:outline-none focus:ring-2 focus:ring-lavender-400"
            />
          </div>

          {existingActionId && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1.5">
                Internal Status Log Note
              </label>
              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Internal audit reasoning for status shift..."
                className="w-full px-4 py-2.5 rounded-xl border border-surface-border text-sm focus:outline-none focus:ring-2 focus:ring-lavender-400"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3">
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
              {isSubmitting ? 'Saving...' : existingActionId ? 'Update Status' : 'Create Action'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
