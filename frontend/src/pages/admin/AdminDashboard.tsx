import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { analyticsApi, coursesApi } from '../../api/services';
import { AdminAnalytics, Course } from '../../types';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';
import {
  Shield, Users, BookOpen, GraduationCap, CheckCircle2,
  Clock, TrendingUp, Building2, AlertCircle, ArrowUpRight, ListTodo, FileText
} from 'lucide-react';

interface AdminDashboardProps {
  initialTab?: 'overview' | 'courses' | 'alerts' | 'actions';
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ initialTab }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const getTabFromPath = (): 'overview' | 'courses' | 'alerts' | 'actions' => {
    if (initialTab) return initialTab;
    const path = location.pathname;
    if (path.includes('/admin/courses')) return 'courses';
    if (path.includes('/admin/alerts')) return 'alerts';
    if (path.includes('/admin/actions')) return 'actions';
    return 'overview';
  };

  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'alerts' | 'actions'>(getTabFromPath());

  useEffect(() => {
    setActiveTab(getTabFromPath());
  }, [location.pathname]);

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
    <div className="space-y-6">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-[#E1E8F0] shadow-card">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-50 text-[#D95763] border border-red-200">
              Institutional Quality & Accreditation Oversight
            </span>
            <span className="text-xs text-[#718096]">Fall 2026 Academic Year</span>
          </div>
          <h2 className="text-xl font-bold text-[#203247] tracking-tight">University Academic Quality Oversight</h2>
          <p className="text-xs text-[#718096] mt-0.5">
            Institutional feedback participation, department responsiveness, academic warnings, and closed-loop resolution rates.
          </p>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-1 p-1 bg-white rounded-lg border border-[#E1E8F0] text-xs">
        <button
          onClick={() => { setActiveTab('overview'); navigate('/admin'); }}
          className={`px-3.5 py-1.5 rounded font-semibold transition-all ${
            activeTab === 'overview' ? 'bg-[#1769AA] text-white shadow-sm' : 'text-[#718096] hover:text-[#203247]'
          }`}
        >
          University Overview
        </button>
        <button
          onClick={() => { setActiveTab('courses'); navigate('/admin/courses'); }}
          className={`px-3.5 py-1.5 rounded font-semibold transition-all ${
            activeTab === 'courses' ? 'bg-[#1769AA] text-white shadow-sm' : 'text-[#718096] hover:text-[#203247]'
          }`}
        >
          Course Directory ({courses.length})
        </button>
        <button
          onClick={() => { setActiveTab('alerts'); navigate('/admin/alerts'); }}
          className={`px-3.5 py-1.5 rounded font-semibold transition-all ${
            activeTab === 'alerts' ? 'bg-[#1769AA] text-white shadow-sm' : 'text-[#718096] hover:text-[#203247]'
          }`}
        >
          Institutional Early Warnings
        </button>
        <button
          onClick={() => { setActiveTab('actions'); navigate('/admin/actions'); }}
          className={`px-3.5 py-1.5 rounded font-semibold transition-all ${
            activeTab === 'actions' ? 'bg-[#1769AA] text-white shadow-sm' : 'text-[#718096] hover:text-[#203247]'
          }`}
        >
          Action & Resolution Monitoring
        </button>
      </div>

      {/* TAB: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Primary KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-5 border border-[#E1E8F0] shadow-card flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#718096] uppercase tracking-wider">Active Students</p>
                <p className="text-2xl font-black text-[#203247] mt-1">{analytics?.total_students || 0}</p>
                <p className="text-[11px] text-[#28A879] font-medium mt-0.5">Continuous feedback active</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-[#EAF4FC] text-[#1769AA] flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-[#E1E8F0] shadow-card flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#718096] uppercase tracking-wider">Instructional Faculty</p>
                <p className="text-2xl font-black text-[#203247] mt-1">{analytics?.total_faculty || 0}</p>
                <p className="text-[11px] text-[#718096] mt-0.5">Across all departments</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#1769AA] flex items-center justify-center font-bold">
                <GraduationCap className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-[#E1E8F0] shadow-card flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#718096] uppercase tracking-wider">Avg Resolution Days</p>
                <p className="text-2xl font-black text-[#28A879] mt-1">{analytics?.avg_resolution_days || 4.2}d</p>
                <p className="text-[11px] text-[#28A879] font-medium mt-0.5">Prompt intervention cycle</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-[#28A879] flex items-center justify-center font-bold">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-[#E1E8F0] shadow-card flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#718096] uppercase tracking-wider">Verified Resolution</p>
                <p className="text-2xl font-black text-[#1769AA] mt-1">{analytics?.overall_resolution_rate || 75.0}%</p>
                <p className="text-[11px] text-[#1769AA] font-medium mt-0.5">Student verified resolution</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-[#EAF4FC] text-[#1769AA] flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Department Comparison Chart */}
          <div className="bg-white rounded-xl p-5 border border-[#E1E8F0] shadow-card">
            <h3 className="text-sm font-bold text-[#203247] mb-0.5">Department Academic Quality & Feedback Volume</h3>
            <p className="text-xs text-[#718096] mb-4">
              Comparison of feedback volume, open instructional concerns, and student-verified resolution outcomes.
            </p>

            <div className="h-64">
              {deptChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={deptChartData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E1E8F0" />
                    <XAxis dataKey="name" stroke="#718096" fontSize={11} />
                    <YAxis stroke="#718096" fontSize={11} />
                    <Tooltip />
                    <Bar dataKey="feedback" fill="#1769AA" name="Total Responses" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="issues" fill="#E7A33E" name="Open Concerns" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="resolved" fill="#28A879" name="Verified Resolved" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-[#718096] text-center pt-24">No department metrics available</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB: COURSES */}
      {activeTab === 'courses' && (
        <div className="bg-white rounded-xl border border-[#E1E8F0] shadow-card overflow-hidden">
          <div className="p-4 border-b border-[#E1E8F0] bg-[#F5F8FC]">
            <h3 className="text-sm font-bold text-[#203247]">University Course Directory</h3>
            <p className="text-xs text-[#718096]">All active courses, assigned faculty instructors, and configured privacy thresholds.</p>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F5F8FC] border-b border-[#E1E8F0] text-[#718096] uppercase font-bold tracking-wider text-[11px]">
              <tr>
                <th className="py-2.5 px-4">Course Code & Title</th>
                <th className="py-2.5 px-4">Department</th>
                <th className="py-2.5 px-4">Enrolled Students</th>
                <th className="py-2.5 px-4">Assigned Faculty</th>
                <th className="py-2.5 px-4">Privacy Threshold</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E1E8F0] text-[#203247]">
              {courses.map((c) => (
                <tr key={c.id} className="hover:bg-[#F5F8FC]/50 transition-colors">
                  <td className="py-3 px-4">
                    <p className="font-bold text-xs text-[#203247]">{c.code}</p>
                    <p className="text-[11px] text-[#718096]">{c.title}</p>
                  </td>
                  <td className="py-3 px-4 font-medium text-[#718096]">{c.department_name}</td>
                  <td className="py-3 px-4 font-semibold">{c.enrolled_count} students</td>
                  <td className="py-3 px-4 text-[#1769AA] font-semibold">{c.faculty_names.join(', ') || 'Pending Assignment'}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-[#F5F8FC] border border-[#E1E8F0] text-[11px] font-medium text-[#718096]">
                      Min {c.privacy_threshold} responses
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB: ALERTS */}
      {activeTab === 'alerts' && (
        <div className="bg-white p-5 rounded-xl border border-[#E1E8F0] shadow-card space-y-4">
          <div>
            <h3 className="text-sm font-bold text-[#203247] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#E7A33E]" /> Academic Alerts & Trend Oversight
            </h3>
            <p className="text-xs text-[#718096]">
              Department-level monitoring of courses experiencing consecutive difficulty spikes or low response sample rates.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-[#EAF4FC] border border-[#CBD5E1] text-xs text-[#0F4C81]">
            <p className="font-bold">Institutional Accreditation Compliance</p>
            <p className="mt-0.5 text-xs text-[#1769AA]">
              Continuous feedback early warnings ensure student comprehension bottlenecks are addressed immediately within the semester rather than at end-of-term evaluations.
            </p>
          </div>
        </div>
      )}

      {/* TAB: ACTIONS */}
      {activeTab === 'actions' && (
        <div className="bg-white p-5 rounded-xl border border-[#E1E8F0] shadow-card space-y-4">
          <div>
            <h3 className="text-sm font-bold text-[#203247] flex items-center gap-2">
              <ListTodo className="w-4 h-4 text-[#1769AA]" /> University Resolution & Action Monitoring
            </h3>
            <p className="text-xs text-[#718096]">
              Monitoring completion cycle and student verification voting rates for faculty interventions across all departments.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-[#F5F8FC] border border-[#E1E8F0]">
              <p className="text-xs font-bold text-[#718096]">Total Interventions Planned</p>
              <p className="text-xl font-bold text-[#203247] mt-1">{analytics?.total_actions_count || 1}</p>
            </div>
            <div className="p-4 rounded-lg bg-[#F5F8FC] border border-[#E1E8F0]">
              <p className="text-xs font-bold text-[#718096]">Open Learning Issues</p>
              <p className="text-xl font-bold text-[#E7A33E] mt-1">{analytics?.open_issues_count || 1}</p>
            </div>
            <div className="p-4 rounded-lg bg-[#F5F8FC] border border-[#E1E8F0]">
              <p className="text-xs font-bold text-[#718096]">Institutional Resolution Rate</p>
              <p className="text-xl font-bold text-[#28A879] mt-1">{analytics?.overall_resolution_rate || 75.0}%</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
