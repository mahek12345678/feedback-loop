import React, { useState, useEffect } from 'react';
import { coursesApi } from '../../api/services';
import { Course } from '../../types';
import { useToast } from '../../context/ToastContext';
import { BookOpen, User, Shield, Plus, Check } from 'lucide-react';

export const StudentCourses: React.FC = () => {
  const { addToast } = useToast();
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [activeTab, setActiveTab] = useState<'enrolled' | 'browse'>('enrolled');
  const [loading, setLoading] = useState(true);

  const loadCourses = async () => {
    try {
      const [enrolled, all] = await Promise.all([
        coursesApi.getCourses(false),
        coursesApi.getCourses(true),
      ]);
      setEnrolledCourses(enrolled);
      setAllCourses(all);
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
          <h2 className="text-xl font-bold text-ink">Course Management</h2>
          <p className="text-xs text-ink-muted">View your active semester enrollments or register for new modules.</p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-white rounded-xl border border-surface-border">
          <button
            onClick={() => setActiveTab('enrolled')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'enrolled' ? 'bg-lavender-600 text-white shadow-sm' : 'text-ink-muted hover:text-ink'
            }`}
          >
            My Enrolled ({enrolledCourses.length})
          </button>
          <button
            onClick={() => setActiveTab('browse')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'browse' ? 'bg-lavender-600 text-white shadow-sm' : 'text-ink-muted hover:text-ink'
            }`}
          >
            Browse All ({allCourses.length})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {(activeTab === 'enrolled' ? enrolledCourses : allCourses).map((course) => (
          <div
            key={course.id}
            className="bg-white rounded-3xl p-6 border border-surface-border shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-lavender-100 text-lavender-700">
                  {course.code}
                </span>
                <span className="text-xs text-ink-muted">{course.term}</span>
              </div>

              <h3 className="text-base font-bold text-ink">{course.title}</h3>
              <p className="text-xs text-ink-muted mt-1">{course.department_name}</p>

              <div className="mt-4 space-y-2 text-xs text-ink-muted">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-lavender-600" />
                  <span>Faculty: {course.faculty_names.join(', ') || 'Department Assigned'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Privacy Shield: Min {course.privacy_threshold} respondents required</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-surface-border">
              {isEnrolled(course.id) ? (
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                  <Check className="w-4 h-4" /> Enrolled for Continuous Feedback
                </div>
              ) : (
                <button
                  onClick={() => handleEnroll(course.id)}
                  className="w-full py-2 px-4 rounded-xl bg-lavender-600 hover:bg-lavender-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Enroll in Course
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
