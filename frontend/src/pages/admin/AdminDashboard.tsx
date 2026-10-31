import React, { useState, useEffect } from 'react';
import { analyticsApi, coursesApi } from '../../api/services';
import { AdminAnalytics, Course } from '../../types';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';
import {
  Shield, Users, BookOpen, GraduationCap, CheckCircle2,
  Clock, TrendingUp, Building2, AlertCircle, ArrowUpRight
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([analyticsApi.getAdminAnalytics(), coursesApi.getCourses(true)])
      .then(([aRes, cRes]) => {
        setAnalytics(aRes);
        setCourses(cRes);
        setLoading(false);
      })
      .catch((err) => console.error(err));
  }, []);

  const deptChartData = analytics?.department_stats.map((d) => ({
    name: d.code,
    feedback: d.feedback_count,
    issues: d.open_issues_count,
    resolved: d.resolved_actions_count,
  })) || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700">
              Institutional Administration
            </span>
          </div>
          <h2 className="text-2xl font-black text-ink tracking-tight">University Academic Quality Oversight</h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Department-level continuous feedback health, early warning responsiveness, and closed-loop resolution metrics.
          </p>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-6 border border-surface-border shadow-card flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-ink-muted uppercase tracking-wider">Active Students</p>
            <p className="text-2xl font-black text-ink mt-1">{analytics?.total_students || 0}</p>
            <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">Continuous feedback enabled</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-lavender-100 text-lavender-700 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-surface-border shadow-card flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-ink-muted uppercase tracking-wider">Instructional Faculty</p>
            <p className="text-2xl font-black text-ink mt-1">{analytics?.total_faculty || 0}</p>
            <p className="text-[11px] text-ink-muted font-medium mt-0.5">Across all departments</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
            <GraduationCap className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-surface-border shadow-card flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-ink-muted uppercase tracking-wider">Avg Resolution Days</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{analytics?.avg_resolution_days || 4.2}d</p>
            <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">Swift instructional cycle</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-surface-border shadow-card flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-ink-muted uppercase tracking-wider">Verified Resolution</p>
            <p className="text-2xl font-black text-lavender-600 mt-1">{analytics?.overall_resolution_rate || 75.0}%</p>
            <p className="text-[11px] text-lavender-700 font-semibold mt-0.5">Student-verified outcomes</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-lavender-100 text-lavender-700 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Department Comparison Chart */}
      <div className="bg-white rounded-3xl p-6 border border-surface-border shadow-card">
        <h3 className="text-base font-bold text-ink mb-1">Department Academic Quality & Volume</h3>
        <p className="text-xs text-ink-muted mb-4">
          Comparative volume of feedback submissions, opened academic friction points, and resolved interventions.
        </p>

        <div className="h-72">
          {deptChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptChartData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1EFF8" />
                <XAxis dataKey="name" stroke="#6A6584" fontSize={12} />
                <YAxis stroke="#9A95B2" fontSize={11} />
                <Tooltip />
                <Bar dataKey="feedback" fill="#8F6BD7" name="Total Feedback" radius={[6, 6, 0, 0]} />
                <Bar dataKey="issues" fill="#E3A044" name="Flagged Learning Issues" radius={[6, 6, 0, 0]} />
                <Bar dataKey="resolved" fill="#32936F" name="Verified Resolved" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-ink-muted text-center pt-24">No department metrics available</p>
          )}
        </div>
      </div>

      {/* Active University Courses Table */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-ink">University Course Directory</h3>
        <div className="bg-white rounded-3xl border border-surface-border shadow-card overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-subtle border-b border-surface-border text-ink-muted uppercase font-bold tracking-wider">
              <tr>
                <th className="py-3 px-6">Course Code & Title</th>
                <th className="py-3 px-6">Department</th>
                <th className="py-3 px-6">Enrolled Students</th>
                <th className="py-3 px-6">Assigned Faculty</th>
                <th className="py-3 px-6">Privacy Threshold</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border text-ink">
              {courses.map((c) => (
                <tr key={c.id} className="hover:bg-surface-subtle/50 transition-colors">
                  <td className="py-4 px-6">
                    <p className="font-bold text-sm text-ink">{c.code}</p>
                    <p className="text-xs text-ink-muted">{c.title}</p>
                  </td>
                  <td className="py-4 px-6 font-medium">{c.department_name}</td>
                  <td className="py-4 px-6 font-bold">{c.enrolled_count} students</td>
                  <td className="py-4 px-6 text-lavender-700 font-semibold">{c.faculty_names.join(', ') || 'Pending'}</td>
                  <td className="py-4 px-6">
                    <span className="px-2.5 py-1 rounded-full bg-surface-subtle border border-surface-border font-semibold">
                      Min {c.privacy_threshold} responses
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
