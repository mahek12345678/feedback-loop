import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, Shield, GraduationCap, BookOpen, User as UserIcon } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, quickSwitchDemo } = useAuth();

  const getRoleBadge = () => {
    switch (user?.role) {
      case 'ADMIN':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold bg-red-50 text-[#D95763] border border-red-200">
            <Shield className="w-3 h-3" /> Dean / Administrator
          </span>
        );
      case 'FACULTY':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-[#1769AA] border border-blue-200">
            <GraduationCap className="w-3 h-3" /> Faculty Instructor
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-[#28A879] border border-emerald-200">
            <BookOpen className="w-3 h-3" /> Enrolled Student
          </span>
        );
    }
  };

  return (
    <header className="h-16 bg-white border-b border-[#E1E8F0] sticky top-0 z-30 flex items-center justify-between px-6 shadow-sm">
      <div className="flex items-center gap-3">
        {/* University Portal Brand Mark */}
        <div className="w-9 h-9 rounded-lg bg-[#0F4C81] flex items-center justify-center text-white shadow-sm font-bold text-sm tracking-wider">
          FL
        </div>
        <div>
          <h1 className="text-base font-bold text-[#203247] leading-tight flex items-center gap-2">
            FeedbackLoop
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#EAF4FC] text-[#1769AA] border border-[#CBD5E1]">
              Academic Portal
            </span>
          </h1>
          <p className="text-[11px] text-[#718096]">Continuous Student Feedback & Intervention Platform</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Quick Demo Switcher Bar */}
        <div className="hidden lg:flex items-center gap-1 bg-[#F5F8FC] p-1 rounded-lg border border-[#E1E8F0] text-xs">
          <span className="px-2 text-[#718096] font-medium text-[11px] uppercase tracking-wider">Demo Persona:</span>
          <button
            onClick={() => quickSwitchDemo('student')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
              user?.role === 'STUDENT'
                ? 'bg-white shadow-sm text-[#1769AA] font-semibold border border-[#E1E8F0]'
                : 'text-[#718096] hover:text-[#203247]'
            }`}
          >
            Alex (Student)
          </button>
          <button
            onClick={() => quickSwitchDemo('faculty')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
              user?.role === 'FACULTY'
                ? 'bg-white shadow-sm text-[#1769AA] font-semibold border border-[#E1E8F0]'
                : 'text-[#718096] hover:text-[#203247]'
            }`}
          >
            Prof. Davis (Faculty)
          </button>
          <button
            onClick={() => quickSwitchDemo('admin')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
              user?.role === 'ADMIN'
                ? 'bg-white shadow-sm text-[#1769AA] font-semibold border border-[#E1E8F0]'
                : 'text-[#718096] hover:text-[#203247]'
            }`}
          >
            Dr. Vance (Dean)
          </button>
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-3 border-l border-[#E1E8F0]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#EAF4FC] border border-[#CBD5E1] flex items-center justify-center text-[#1769AA] font-semibold text-xs">
              {user?.full_name?.charAt(0) || <UserIcon className="w-3.5 h-3.5" />}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-[#203247] leading-none">{user?.full_name}</p>
              <div className="mt-1">{getRoleBadge()}</div>
            </div>
          </div>

          <button
            onClick={logout}
            title="Log out"
            className="p-1.5 text-[#718096] hover:text-[#D95763] hover:bg-red-50 rounded transition-colors ml-1"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
