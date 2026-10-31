import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { aiApi } from '../../api/services';
import {
  LayoutDashboard,
  BookOpen,
  MessageSquarePlus,
  History,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  ListTodo,
  ShieldCheck,
  Building2,
  Cpu,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const [aiStatus, setAiStatus] = useState<{ available: boolean; active_model: string; status: string } | null>(null);

  useEffect(() => {
    aiApi.checkHealth().then((res) => {
      setAiStatus(res);
    }).catch(() => {
      setAiStatus({ available: false, active_model: 'llama3.1:8b', status: 'fallback' });
    });
  }, []);

  const studentLinks = [
    { to: '/student', label: 'Student Dashboard', icon: LayoutDashboard },
    { to: '/student/courses', label: 'My Enrolled Courses', icon: BookOpen },
    { to: '/student/history', label: 'Feedback Timeline', icon: History },
  ];

  const facultyLinks = [
    { to: '/faculty', label: 'Faculty Dashboard', icon: LayoutDashboard },
    { to: '/faculty/warnings', label: 'Academic Early Warnings', icon: AlertTriangle },
    { to: '/faculty/actions', label: 'Interventions & Actions', icon: ListTodo },
  ];

  const adminLinks = [
    { to: '/admin', label: 'University Analytics', icon: LayoutDashboard },
    { to: '/admin/courses', label: 'All Courses & Roles', icon: Building2 },
  ];

  const links =
    user?.role === 'ADMIN' ? adminLinks : user?.role === 'FACULTY' ? facultyLinks : studentLinks;

  return (
    <aside className="w-64 bg-white border-r border-surface-border flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4">
        <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-ink-muted mb-2">
          {user?.role === 'ADMIN' ? 'Administration' : user?.role === 'FACULTY' ? 'Instruction Portal' : 'Student Hub'}
        </p>
        <nav className="space-y-1.5">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/student' || link.to === '/faculty' || link.to === '/admin'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-lavender-100 text-lavender-700 font-semibold shadow-subtle'
                      : 'text-ink-muted hover:text-ink hover:bg-surface-subtle'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                {link.label}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Local AI Engine Status card */}
      <div className="p-4 m-3 rounded-2xl bg-surface-subtle border border-surface-border">
        <div className="flex items-center gap-2 mb-1.5">
          <Cpu className="w-4 h-4 text-lavender-600" />
          <span className="text-xs font-bold text-ink">Local Ollama Engine</span>
        </div>
        <p className="text-[11px] text-ink-muted leading-tight">
          Model: <span className="font-semibold text-ink">{aiStatus?.active_model || 'llama3.1:8b'}</span>
        </p>
        <div className="mt-2 flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              aiStatus?.available ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
            }`}
          />
          <span className="text-[11px] font-medium text-ink-muted">
            {aiStatus?.available ? 'Ollama REST Online' : 'Simulation Fallback Ready'}
          </span>
        </div>
      </div>
    </aside>
  );
};
