import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Shield, GraduationCap, BookOpen, ArrowRight, Lock, Mail, CheckCircle2 } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, quickSwitchDemo } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await login(email, password);
      addToast('success', 'Authentication Successful', 'Logged in to FeedbackLoop academic portal.');
      navigate('/');
    } catch (err: any) {
      addToast('error', 'Login Failed', err.response?.data?.detail || 'Invalid email or password credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async (role: 'student' | 'faculty' | 'admin') => {
    setIsSubmitting(true);
    try {
      await quickSwitchDemo(role);
      addToast('success', 'Demo Session Ready', `Authenticated as ${role.toUpperCase()}.`);
      navigate(role === 'student' ? '/student' : role === 'faculty' ? '/faculty' : '/admin');
    } catch {
      addToast('error', 'Demo Error', 'Could not initialize demo session.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F8FC] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#0F4C81] text-white shadow-sm mb-3 font-bold text-lg">
            FL
          </div>
          <h1 className="text-2xl font-bold text-[#203247] tracking-tight">FeedbackLoop Portal</h1>
          <p className="text-xs text-[#718096] mt-1">
            Continuous Student Feedback, Academic Early Warning & Intervention System
          </p>
        </div>

        {/* 1-Click Demo Personas Card */}
        <div className="bg-white rounded-xl p-5 shadow-card border border-[#E1E8F0] mb-5">
          <p className="text-xs font-bold uppercase tracking-wider text-[#718096] mb-3 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#1769AA]" /> Instant Demo Login (1-Click)
          </p>
          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={() => handleDemoLogin('student')}
              disabled={isSubmitting}
              className="flex items-center justify-between p-2.5 rounded-lg border border-[#E1E8F0] bg-[#F5F8FC] hover:bg-[#EAF4FC] hover:border-[#CBD5E1] transition-all text-left"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md bg-emerald-100 text-[#28A879] flex items-center justify-center font-bold">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#203247]">Alex Rivera (Student)</p>
                  <p className="text-[11px] text-[#718096]">student1@feedbackloop.edu • CS201 & CS301</p>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-[#1769AA]" />
            </button>

            <button
              onClick={() => handleDemoLogin('faculty')}
              disabled={isSubmitting}
              className="flex items-center justify-between p-2.5 rounded-lg border border-[#E1E8F0] bg-[#F5F8FC] hover:bg-[#EAF4FC] hover:border-[#CBD5E1] transition-all text-left"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md bg-blue-100 text-[#1769AA] flex items-center justify-center font-bold">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#203247]">Prof. Marcus Davis (Faculty)</p>
                  <p className="text-[11px] text-[#718096]">prof.davis@feedbackloop.edu • CS201 Instructor</p>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-[#1769AA]" />
            </button>

            <button
              onClick={() => handleDemoLogin('admin')}
              disabled={isSubmitting}
              className="flex items-center justify-between p-2.5 rounded-lg border border-[#E1E8F0] bg-[#F5F8FC] hover:bg-[#EAF4FC] hover:border-[#CBD5E1] transition-all text-left"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md bg-red-100 text-[#D95763] flex items-center justify-center font-bold">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#203247]">Dr. Eleanor Vance (Dean / Admin)</p>
                  <p className="text-[11px] text-[#718096]">admin@feedbackloop.edu • Institutional Oversight</p>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-[#1769AA]" />
            </button>
          </div>
        </div>

        {/* Credentials Form */}
        <div className="bg-white rounded-xl p-6 shadow-card border border-[#E1E8F0]">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#203247] mb-1">
                Institutional Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#718096] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@feedbackloop.edu"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-[#E1E8F0] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1769AA] focus:border-[#1769AA] text-[#203247]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#203247] mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#718096] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-[#E1E8F0] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1769AA] focus:border-[#1769AA] text-[#203247]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2 px-4 rounded-lg bg-[#1769AA] hover:bg-[#12578D] text-white text-xs font-semibold transition-colors disabled:opacity-50 shadow-sm"
            >
              {isSubmitting ? 'Authenticating...' : 'Sign In to Portal'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
