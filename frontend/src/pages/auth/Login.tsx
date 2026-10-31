import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Sparkles, Shield, GraduationCap, BookOpen, ArrowRight, Lock, Mail } from 'lucide-react';

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
      addToast('success', 'Welcome Back!', 'Logged in successfully.');
      navigate('/');
    } catch (err: any) {
      addToast('error', 'Login Failed', err.response?.data?.detail || 'Invalid email or password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async (role: 'student' | 'faculty' | 'admin') => {
    setIsSubmitting(true);
    try {
      await quickSwitchDemo(role);
      addToast('success', 'Demo Login Successful!', `Signed in as ${role.toUpperCase()}.`);
      navigate(role === 'student' ? '/student' : role === 'faculty' ? '/faculty' : '/admin');
    } catch {
      addToast('error', 'Demo Error', 'Could not initialize demo session.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-lavender-50 via-white to-surface-subtle flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-3xl bg-gradient-to-tr from-lavender-600 to-lavender-400 text-white shadow-elevated mb-4">
            <Sparkles className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-ink tracking-tight">FeedbackLoop</h1>
          <p className="text-sm text-ink-muted mt-1">
            AI-Driven Continuous Student Feedback & Academic Intervention Platform
          </p>
        </div>

        {/* 1-Click Demo Accounts Card */}
        <div className="bg-white rounded-3xl p-6 shadow-card border border-surface-border mb-6">
          <p className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-3 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-lavender-600" /> Instant Demo Personas
          </p>
          <div className="grid grid-cols-1 gap-2.5">
            <button
              onClick={() => handleDemoLogin('student')}
              disabled={isSubmitting}
              className="flex items-center justify-between p-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-50 transition-colors group text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-emerald-950">Alex Rivera (Student)</p>
                  <p className="text-[11px] text-emerald-700">Enrolled in CS201 & CS301</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => handleDemoLogin('faculty')}
              disabled={isSubmitting}
              className="flex items-center justify-between p-3 rounded-2xl border border-lavender-200 bg-lavender-50/60 hover:bg-lavender-50 transition-colors group text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-lavender-100 text-lavender-700 flex items-center justify-center font-bold">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-lavender-950">Prof. Marcus Davis (Faculty)</p>
                  <p className="text-[11px] text-lavender-700">Instructor: CS201 Data Structures</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-lavender-600 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => handleDemoLogin('admin')}
              disabled={isSubmitting}
              className="flex items-center justify-between p-3 rounded-2xl border border-rose-200 bg-rose-50/60 hover:bg-rose-50 transition-colors group text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-rose-950">Dr. Eleanor Vance (Dean / Admin)</p>
                  <p className="text-[11px] text-rose-700">University-wide Oversight</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-rose-600 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Regular Sign In Card */}
        <div className="bg-white rounded-3xl p-6 shadow-card border border-surface-border">
          <p className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-4">
            Or Sign In With Institutional Email
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@feedbackloop.edu"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-border text-sm focus:outline-none focus:ring-2 focus:ring-lavender-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-border text-sm focus:outline-none focus:ring-2 focus:ring-lavender-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl bg-lavender-600 hover:bg-lavender-700 text-white font-semibold text-sm shadow-md shadow-lavender-200 transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
