import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { aiApi } from '../../api/services';
import {
  LayoutDashboard,
  BookOpen,
  History,
  AlertTriangle,
  ListTodo,
  Building2,
  Cpu,
  FileText,
  Lightbulb,
  MessageSquare,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const [aiStatus, setAiStatus] = useState<{ available: boolean; active_model: string; status: string } | null>(null);

  useEffect(() => {
    aiApi.checkHealth().then((res) => {
      setAiStatus(res);
    }).catch(() => {
      setAiStatus({ available: false, active_model: 'llama3.2:3b', status: 'unavailable' });
    });
  }, []);

  const studentLinks = [
    { to: '/student', label: 'Student Dashboard', icon: LayoutDashboard },
    { to: '/student/courses', label: 'My Enrolled Courses', icon: BookOpen },
    { to: '/student/history', label: 'My Feedback History', icon: History },
  ];

  const facultyLinks = [
    { to: '/faculty', label: 'Faculty Dashboard', icon: LayoutDashboard },
    { to: '/faculty/feedback', label: 'Student Feedback', icon: MessageSquare },
    { to: '/faculty/warnings', label: 'Academic Early Warnings', icon: AlertTriangle },
    { to: '/faculty/recommendations', label: 'AI Recommendations', icon: Lightbulb },
    { to: '/faculty/actions', label: 'Action Management', icon: ListTodo },
    { to: '/faculty/reports', label: 'Course Reports', icon: FileText },
  ];

  const adminLinks = [
    { to: '/admin', label: 'University Analytics', icon: LayoutDashboard },
    { to: '/admin/courses', label: 'Courses & Departments', icon: Building2 },
    { to: '/admin/alerts', label: 'Academic Alerts', icon: AlertTriangle },
    { to: '/admin/actions', label: 'Action Monitoring', icon: ListTodo },
  ];

  const links =
    user?.role === 'ADMIN' ? adminLinks : user?.role === 'FACULTY' ? facultyLinks : studentLinks;

  return (
    <aside className="w-64 bg-white border-r border-[#E1E8F0] flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-3">
        <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-[#718096] mb-2">
          {user?.role === 'ADMIN' ? 'Administration' : user?.role === 'FACULTY' ? 'Instruction Portal' : 'Student Hub'}
        </p>
        <nav className="space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/student' || link.to === '/faculty' || link.to === '/admin'}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-[#EAF4FC] text-[#1769AA] font-semibold border-l-4 border-[#1769AA]'
                      : 'text-[#718096] hover:text-[#203247] hover:bg-[#F5F8FC]'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                {link.label}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Local AI Engine Status card */}
      <div className="p-3 m-3 rounded-lg bg-[#F5F8FC] border border-[#E1E8F0]">
        <div className="flex items-center gap-2 mb-1">
          <Cpu className="w-3.5 h-3.5 text-[#1769AA]" />
          <span className="text-xs font-semibold text-[#203247]">Local Ollama Service</span>
        </div>
        <p className="text-[11px] text-[#718096] leading-tight">
          Model: <span className="font-semibold text-[#203247]">{aiStatus?.active_model || 'llama3.2:3b'}</span>
        </p>
        <div className="mt-2 flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              aiStatus?.available ? 'bg-[#28A879]' : 'bg-[#E7A33E]'
            }`}
          />
          <span className="text-[11px] font-medium text-[#718096]">
            {aiStatus?.available ? 'Ollama REST Online' : 'Manual Submission Active'}
          </span>
        </div>
      </div>
    </aside>
  );
};
