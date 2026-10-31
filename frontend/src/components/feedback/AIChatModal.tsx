import React, { useState } from 'react';
import { aiApi, feedbackApi } from '../../api/services';
import { ExtractedFeedback } from '../../types';
import { useToast } from '../../context/ToastContext';
import { Sparkles, Send, X, Check, ArrowRight, Bot, User, CheckCircle2 } from 'lucide-react';

interface AIChatModalProps {
  courseId: number;
  opportunityId: number;
  courseTitle: string;
  topic: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const AIChatModal: React.FC<AIChatModalProps> = ({
  courseId,
  opportunityId,
  courseTitle,
  topic,
  onClose,
  onSuccess,
}) => {
  const { addToast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hi there! I'm your FeedbackLoop AI assistant for ${courseTitle} (${topic}). What's been on your mind regarding recent classes or assignments?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | undefined>();
  const [extractedFeedback, setExtractedFeedback] = useState<ExtractedFeedback | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    setInput('');
    const newMessages: Message[] = [...messages, { role: 'user', content: userText }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const res = await aiApi.chat({
        course_id: courseId,
        opportunity_id: opportunityId,
        session_token: sessionToken,
        message: userText,
        conversation_history: newMessages.slice(0, -1),
      });

      setSessionToken(res.session_token);
      setMessages((prev) => [...prev, { role: 'assistant', content: res.reply }]);

      if (res.is_completed && res.extracted_feedback) {
        setExtractedFeedback(res.extracted_feedback);
      }
    } catch {
      addToast('error', 'AI Assistant Error', 'Unable to reach the assistant. You can submit via standard form.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmAndSubmit = async () => {
    if (!extractedFeedback) return;
    setIsSubmitting(true);
    try {
      await feedbackApi.submit({
        opportunity_id: opportunityId,
        category: extractedFeedback.category || 'Teaching clarity',
        rating: extractedFeedback.rating || 3,
        written_feedback: extractedFeedback.issue,
        structured_need: extractedFeedback.suggested_need,
      });
      addToast('success', 'Feedback Submitted!', 'Your feedback was structured and anonymously recorded.');
      onSuccess();
      onClose();
    } catch (err: any) {
      addToast('error', 'Submission Failed', err.response?.data?.detail || 'Could not submit feedback.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-elevated border border-surface-border max-w-xl w-full flex flex-col h-[600px] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 px-6 border-b border-surface-border bg-gradient-to-r from-lavender-50 via-white to-lavender-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-lavender-600 flex items-center justify-center text-white shadow-md shadow-lavender-200">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-ink">AI Feedback Assistant</h3>
              <p className="text-xs text-ink-muted">
                {courseTitle} &bull; <span className="font-semibold text-lavender-700">{topic}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-ink-muted hover:text-ink rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  msg.role === 'user'
                    ? 'bg-lavender-600 text-white'
                    : 'bg-lavender-100 text-lavender-700 border border-lavender-200'
                }`}
              >
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div
                className={`max-w-[75%] p-3.5 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-lavender-600 text-white rounded-tr-none'
                    : 'bg-surface-subtle border border-surface-border text-ink rounded-tl-none'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-lavender-100 text-lavender-700 border border-lavender-200 flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-surface-subtle border border-surface-border p-3.5 rounded-2xl text-xs text-ink-muted flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-lavender-500 animate-pulse" />
                <span>Ollama AI is analyzing your thoughts...</span>
              </div>
            </div>
          )}

          {/* Structured Feedback Confirmation Box */}
          {extractedFeedback && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 mt-4 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Structured Academic Observation
              </div>
              <div className="text-xs space-y-1.5 text-emerald-950">
                <p>
                  <span className="font-semibold text-emerald-800">Category:</span> {extractedFeedback.category}
                </p>
                <p>
                  <span className="font-semibold text-emerald-800">Identified Issue:</span> {extractedFeedback.issue}
                </p>
                <p>
                  <span className="font-semibold text-emerald-800">Suggested Resolution:</span>{' '}
                  {extractedFeedback.suggested_need}
                </p>
              </div>
              <button
                onClick={handleConfirmAndSubmit}
                disabled={isSubmitting}
                className="mt-3 w-full py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? 'Recording Feedback...' : 'Confirm & Anonymously Submit'}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSend} className="p-4 border-t border-surface-border bg-white flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your feedback (e.g. 'I don't understand recursion pace')..."
            className="flex-1 px-4 py-2.5 rounded-xl border border-surface-border focus:outline-none focus:ring-2 focus:ring-lavender-400 text-sm"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2.5 bg-lavender-600 hover:bg-lavender-700 disabled:opacity-50 text-white rounded-xl transition-colors shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
