import React, { useState } from 'react';
import { aiApi, feedbackApi } from '../../api/services';
import { ExtractedFeedback } from '../../types';
import { useToast } from '../../context/ToastContext';
import {
  Send,
  X,
  Check,
  ArrowRight,
  Bot,
  User,
  Shield,
  AlertCircle,
  FileEdit,
  Sparkles,
} from 'lucide-react';

interface AIChatModalProps {
  courseId: number;
  opportunityId: number;
  courseTitle: string;
  topic: string;
  weekNumber?: number;
  onClose: () => void;
  onSuccess: () => void;
  onSwitchToManual?: () => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTED_REPLIES = [
  'The lecture pace was too fast to follow along.',
  'I need more step-by-step visual examples.',
  'The homework assignment instructions were unclear.',
  'Could we have a practice session before the quiz?',
];

export const AIChatModal: React.FC<AIChatModalProps> = ({
  courseId,
  opportunityId,
  courseTitle,
  topic,
  weekNumber = 1,
  onClose,
  onSuccess,
  onSwitchToManual,
}) => {
  const { addToast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hello! I am your FeedbackLoop conversational assistant for ${courseTitle} (Week ${weekNumber}: ${topic}). What specific difficulties or questions arose during recent lectures or assignments?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | undefined>();
  const [extractedFeedback, setExtractedFeedback] = useState<ExtractedFeedback | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ollamaError, setOllamaError] = useState<string | null>(null);

  const sendMessage = async (userText: string) => {
    if (!userText.trim() || isLoading) return;

    setInput('');
    const newMessages: Message[] = [...messages, { role: 'user', content: userText }];
    setMessages(newMessages);
    setIsLoading(true);
    setOllamaError(null);

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
    } catch (err: any) {
      const detail = err.response?.data?.detail || 'Local Ollama service is currently unavailable.';
      setOllamaError(detail);
      addToast('error', 'AI Assistant Unavailable', detail);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
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
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-elevated border border-[#E1E8F0] max-w-xl w-full flex flex-col h-[600px] overflow-hidden">
        {/* Header */}
        <div className="p-4 px-6 border-b border-[#E1E8F0] bg-[#F5F8FC] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#0F4C81] text-white flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#203247]">AI Feedback Assistant</h3>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#EAF4FC] text-[#1769AA] border border-[#CBD5E1]">
                  Remote Ollama
                </span>
              </div>
              <p className="text-xs text-[#718096]">
                {courseTitle} &bull; <span className="font-semibold text-[#1769AA]">{topic}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-[#718096] hover:text-[#203247] rounded transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Offline / Connection Error Notice */}
        {ollamaError && (
          <div className="p-3 bg-amber-50 border-b border-amber-200 text-xs text-amber-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{ollamaError}</span>
            </div>
            {onSwitchToManual && (
              <button
                onClick={() => {
                  onClose();
                  onSwitchToManual();
                }}
                className="px-2.5 py-1 rounded bg-[#1769AA] text-white text-[11px] font-semibold hover:bg-[#12578D] shrink-0 ml-2"
              >
                Switch to Manual Form
              </button>
            )}
          </div>
        )}

        {/* Chat Messages */}
        <div className="flex-1 p-5 overflow-y-auto space-y-3 bg-[#F5F8FC]/50">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-2.5 max-w-[85%] ${
                msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0 ${
                  msg.role === 'user'
                    ? 'bg-[#1769AA] text-white'
                    : 'bg-white border border-[#E1E8F0] text-[#1769AA]'
                }`}
              >
                {msg.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>
              <div
                className={`p-3 rounded-lg text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[#1769AA] text-white'
                    : 'bg-white border border-[#E1E8F0] text-[#203247] shadow-sm'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-2.5 items-center text-xs text-[#718096]">
              <div className="w-7 h-7 rounded-lg bg-white border border-[#E1E8F0] flex items-center justify-center text-[#1769AA]">
                <Bot className="w-3.5 h-3.5 animate-pulse" />
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-[#E1E8F0] text-xs text-[#718096]">
                Analyzing feedback conversation...
              </div>
            </div>
          )}

          {ollamaError && (
            <div className="flex gap-2.5 max-w-[95%]">
              <div className="w-7 h-7 rounded-lg bg-amber-100 border border-amber-200 text-amber-700 flex items-center justify-center text-xs shrink-0">
                <AlertCircle className="w-3.5 h-3.5" />
              </div>
              <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 shadow-sm space-y-2">
                <p className="font-semibold text-amber-950">AI Assistant Notice</p>
                <p className="text-[11px] leading-relaxed text-amber-800">
                  {ollamaError}
                </p>
                {onSwitchToManual && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onSwitchToManual();
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1769AA] text-white text-xs font-semibold hover:bg-[#12578D] transition-colors shadow-sm"
                    >
                      Submit Feedback via 3-Step Form &rarr;
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Structured Feedback Preview */}
          {extractedFeedback && (
            <div className="p-4 rounded-xl bg-white border-2 border-[#1769AA] shadow-sm space-y-3 mt-4">
              <div className="flex items-center justify-between border-b border-[#E1E8F0] pb-2">
                <span className="text-xs font-bold text-[#1769AA] flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" /> Structured Feedback Preview
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#EAF4FC] text-[#1769AA]">
                  {extractedFeedback.category}
                </span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div>
                  <span className="text-[#718096] font-medium">Topic:</span>{' '}
                  <span className="text-[#203247] font-semibold">{extractedFeedback.topic || topic}</span>
                </div>
                <div>
                  <span className="text-[#718096] font-medium">Issue:</span>{' '}
                  <span className="text-[#203247]">{extractedFeedback.issue}</span>
                </div>
                <div>
                  <span className="text-[#718096] font-medium">Suggested Need:</span>{' '}
                  <span className="text-[#203247]">{extractedFeedback.suggested_need}</span>
                </div>
                <div className="flex items-center gap-3 pt-1">
                  <span className="text-[#718096]">Estimated Satisfaction:</span>
                  <span className="font-bold text-[#203247]">{extractedFeedback.rating} / 5</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#E1E8F0]">
                <span className="text-[11px] text-[#28A879] flex items-center gap-1 font-medium">
                  <Shield className="w-3 h-3" /> Anonymous submission
                </span>
                <button
                  onClick={handleConfirmAndSubmit}
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-lg bg-[#1769AA] hover:bg-[#12578D] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  {isSubmitting ? 'Submitting...' : 'Confirm & Submit'} <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Suggested Replies */}
        {!extractedFeedback && messages.length <= 3 && (
          <div className="p-2 px-4 bg-white border-t border-[#E1E8F0] flex gap-1.5 overflow-x-auto">
            <span className="text-[11px] text-[#718096] whitespace-nowrap self-center mr-1">Suggestions:</span>
            {SUGGESTED_REPLIES.map((suggestion, idx) => (
              <button
                key={idx}
                type="button"
                disabled={isLoading}
                onClick={() => sendMessage(suggestion)}
                className="text-[11px] px-2.5 py-1 rounded-full bg-[#F5F8FC] border border-[#E1E8F0] text-[#203247] hover:bg-[#EAF4FC] hover:text-[#1769AA] transition-colors whitespace-nowrap"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-3 px-4 bg-white border-t border-[#E1E8F0] flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading || Boolean(extractedFeedback)}
            placeholder={
              extractedFeedback
                ? 'Feedback structured! Review and confirm above.'
                : 'Describe what was unclear or how the class could improve...'
            }
            className="flex-1 px-3 py-2 text-xs border border-[#E1E8F0] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1769AA] text-[#203247]"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim() || Boolean(extractedFeedback)}
            className="px-3.5 py-2 rounded-lg bg-[#1769AA] hover:bg-[#12578D] text-white text-xs font-medium disabled:opacity-40 transition-colors flex items-center gap-1"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
