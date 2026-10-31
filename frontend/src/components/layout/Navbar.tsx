import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, LogOut, Shield, GraduationCap, BookOpen, User as UserIcon } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, quickSwitchDemo } = useAuth();

  const getRoleBadge = () => {
    switch (user?.role) {
      case 'ADMIN':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <Shield className="w-3.5 h-3.5" /> Dean / Admin
          </span>
        );
      case 'FACULTY':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-lavender-100 text-lavender-700 border border-lavender-200">
            <GraduationCap className="w-3.5 h-3.5" /> Faculty Member
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <BookOpen className="w-3.5 h-3.5" /> Student
          </span>
        );
    }
  };

  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-surface-border sticky top-0 z-30 flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-lavender-600 to-lavender-400 flex items-center justify-center text-white shadow-md shadow-lavender-200">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-base font-bold text-ink leading-tight flex items-center gap-2">
            FeedbackLoop
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-lavender-100 text-lavender-700">
              v1.0
            </span>
          </h1>
          <p className="text-xs text-ink-muted">AI-Driven Continuous Academic Feedback</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Quick Demo Switcher Bar */}
        <div className="hidden lg:flex items-center gap-1 bg-surface-subtle p-1 rounded-xl border border-surface-border text-xs">
          <span className="px-2 text-ink-muted font-medium">Demo Switch:</span>
          <button
            onClick={() => quickSwitchDemo('student')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              user?.role === 'STUDENT'
                ? 'bg-white shadow-subtle text-emerald-700 font-semibold'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            Student
          </button>
          <button
            onClick={() => quickSwitchDemo('faculty')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              user?.role === 'FACULTY'
                ? 'bg-white shadow-subtle text-lavender-700 font-semibold'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            Faculty (Prof. Davis)
          </button>
          <button
            onClick={() => quickSwitchDemo('admin')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              user?.role === 'ADMIN'
                ? 'bg-white shadow-subtle text-rose-700 font-semibold'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            Dean / Admin
          </button>
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-2 border-l border-surface-border">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-lavender-100 border border-lavender-200 flex items-center justify-center text-lavender-700 font-semibold text-sm">
              {user?.full_name?.charAt(0) || <UserIcon className="w-4 h-4" />}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-semibold text-ink leading-none">{user?.full_name}</p>
              <div className="mt-1">{getRoleBadge()}</div>
            </div>
          </div>

          <button
            onClick={logout}
            title="Log out"
            className="p-2 text-ink-muted hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
