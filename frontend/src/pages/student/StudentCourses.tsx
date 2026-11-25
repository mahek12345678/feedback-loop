import React, { useState, useEffect } from 'react';
import { coursesApi, feedbackApi } from '../../api/services';
import { Course, FeedbackOpportunity } from '../../types';
import { useToast } from '../../context/ToastContext';
import { FeedbackFormModal } from '../../components/feedback/FeedbackFormModal';
import { AIChatModal } from '../../components/feedback/AIChatModal';
import { BookOpen, User, Shield, CheckCircle2, MessageSquarePlus, Clock, Sparkles } from 'lucide-react';

export const StudentCourses: React.FC = () => {
  const { addToast } = useToast();
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [opportunities, setOpportunities] = useState<FeedbackOpportunity[]>([]);
  const [activeTab, setActiveTab] = useState<'enrolled' | 'browse'>('enrolled');
  const [loading, setLoading] = useState(true);

  // Modals
  const [activeFeedbackForm, setActiveFeedbackForm] = useState<{
    oppId: number;
    courseTitle: string;
    courseCode?: string;
    topic: string;
    weekNumber?: number;
  } | null>(null);

  const [activeAIChat, setActiveAIChat] = useState<{
    courseId: number;
    oppId: number;
    courseTitle: string;
    topic: string;
    weekNumber?: number;
  } | null>(null);

  const loadCourses = async () => {
    try {
      const [enrolled, all, opps] = await Promise.all([
        coursesApi.getCourses(false),
        coursesApi.getCourses(true),
        feedbackApi.getOpportunities(),
      ]);
      setEnrolledCourses(enrolled);
      setAllCourses(all);
      setOpportunities(opps);
    } catch {
      addToast('error', 'Error', 'Failed to load courses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const handleEnroll = async (courseId: number) => {
    try {
      await coursesApi.enroll(courseId);
      addToast('success', 'Enrolled!', 'You have successfully enrolled in this course.');
      loadCourses();
    } catch (err: any) {
      addToast('error', 'Enrollment Error', err.response?.data?.detail || 'Could not enroll.');
    }
  };

  const isEnrolled = (courseId: number) => enrolledCourses.some((c) => c.id === courseId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#203247]">My Academic Courses</h2>
          <p className="text-xs text-[#718096]">
            View enrolled subjects, check weekly feedback status, and submit continuous feedback.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-white rounded-lg border border-[#E1E8F0]">
          <button
            onClick={() => setActiveTab('enrolled')}
            className={`px-3.5 py-1.5 rounded text-xs font-semibold transition-all ${
              activeTab === 'enrolled' ? 'bg-[#1769AA] text-white shadow-sm' : 'text-[#718096] hover:text-[#203247]'
            }`}
          >
            My Enrolled ({enrolledCourses.length})
          </button>
          <button
            onClick={() => setActiveTab('browse')}
            className={`px-3.5 py-1.5 rounded text-xs font-semibold transition-all ${
              activeTab === 'browse' ? 'bg-[#1769AA] text-white shadow-sm' : 'text-[#718096] hover:text-[#203247]'
            }`}
          >
            Course Catalog ({allCourses.length})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {(activeTab === 'enrolled' ? enrolledCourses : allCourses).map((course) => {
          const courseOpp = opportunities.find((o) => o.course_id === course.id && o.is_active);
          const hasSubmitted = courseOpp?.has_submitted;

          return (
            <div
              key={course.id}
              className="bg-white rounded-xl p-5 border border-[#E1E8F0] shadow-card hover:border-[#CBD5E1] transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-[#EAF4FC] text-[#1769AA] border border-[#CBD5E1]">
                    {course.code}
                  </span>
                  <span className="text-[11px] text-[#718096] font-medium">{course.term}</span>
                </div>

                <h3 className="text-sm font-bold text-[#203247]">{course.title}</h3>
                <p className="text-xs text-[#718096] mt-0.5">{course.department_name}</p>

                <div className="mt-4 space-y-2 text-xs text-[#718096]">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-[#1769AA]" />
                    <span>Faculty: {course.faculty_names.join(', ') || 'Department Faculty'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-[#28A879]" />
                    <span>Privacy Shield: Min {course.privacy_threshold} respondents</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-[#E7A33E]" />
                    <span>
                      Feedback Status:{' '}
                      {courseOpp ? (
                        hasSubmitted ? (
                          <span className="font-semibold text-[#28A879]">Week {courseOpp.week_number} Submitted</span>
                        ) : (
                          <span className="font-semibold text-[#E7A33E]">Week {courseOpp.week_number} Open</span>
                        )
                      ) : (
                        <span className="text-[#718096]">No Active Window</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-[#E1E8F0]">
                {activeTab === 'enrolled' ? (
                  courseOpp ? (
                    hasSubmitted ? (
                      <div className="flex items-center justify-between gap-2">
                        <div className="py-1 px-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[#28A879] text-xs font-medium flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Feedback Submitted
                        </div>
                        <button
                          onClick={() =>
                            setActiveAIChat({
                              courseId: course.id,
                              oppId: courseOpp.id,
                              courseTitle: course.title,
                              topic: courseOpp.topic,
                              weekNumber: courseOpp.week_number,
                            })
                          }
                          className="py-1 px-2.5 rounded-lg border border-[#CBD5E1] bg-[#EAF4FC] hover:bg-blue-100 text-[#1769AA] text-xs font-semibold flex items-center gap-1 transition-colors"
                        >
                          <Sparkles className="w-3.5 h-3.5" /> Chat with AI
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            setActiveFeedbackForm({
                              oppId: courseOpp.id,
                              courseTitle: course.title,
                              courseCode: course.code,
                              topic: courseOpp.topic,
                              weekNumber: courseOpp.week_number,
                            })
                          }
                          className="flex-1 py-1.5 px-3 rounded-lg bg-[#1769AA] hover:bg-[#12578D] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                        >
                          <MessageSquarePlus className="w-3.5 h-3.5" /> Give Feedback
                        </button>
                        <button
                          onClick={() =>
                            setActiveAIChat({
                              courseId: course.id,
                              oppId: courseOpp.id,
                              courseTitle: course.title,
                              topic: courseOpp.topic,
                              weekNumber: courseOpp.week_number,
                            })
                          }
                          title="Open AI Assistant"
                          className="py-1.5 px-2.5 rounded-lg border border-[#CBD5E1] bg-[#EAF4FC] text-[#1769AA] hover:bg-blue-100 transition-colors"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )
                  ) : (
                    <span className="text-xs text-[#718096] italic block text-center py-1">
                      Next evaluation window opens next week
                    </span>
                  )
                ) : (
                  <div>
                    {isEnrolled(course.id) ? (
                      <span className="text-xs text-[#28A879] font-medium flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Already Enrolled
                      </span>
                    ) : (
                      <button
                        onClick={() => handleEnroll(course.id)}
                        className="w-full py-1.5 px-3 rounded-lg bg-[#1769AA] hover:bg-[#12578D] text-white text-xs font-semibold transition-colors"
                      >
                        Enroll in Course
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {activeFeedbackForm && (
        <FeedbackFormModal
          opportunityId={activeFeedbackForm.oppId}
          courseTitle={activeFeedbackForm.courseTitle}
          courseCode={activeFeedbackForm.courseCode}
          topic={activeFeedbackForm.topic}
          weekNumber={activeFeedbackForm.weekNumber}
          onClose={() => setActiveFeedbackForm(null)}
          onSuccess={loadCourses}
        />
      )}

      {activeAIChat && (
        <AIChatModal
          courseId={activeAIChat.courseId}
          opportunityId={activeAIChat.oppId}
          courseTitle={activeAIChat.courseTitle}
          topic={activeAIChat.topic}
          weekNumber={activeAIChat.weekNumber}
          onClose={() => setActiveAIChat(null)}
          onSuccess={loadCourses}
          onSwitchToManual={() => {
            setActiveFeedbackForm({
              oppId: activeAIChat.oppId,
              courseTitle: activeAIChat.courseTitle,
              courseCode: '',
              topic: activeAIChat.topic,
              weekNumber: activeAIChat.weekNumber,
            });
            setActiveAIChat(null);
          }}
        />
      )}
    </div>
  );
};
