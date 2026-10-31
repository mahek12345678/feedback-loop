import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AppLayout } from './components/layout/AppLayout';
import { Login } from './pages/auth/Login';
import { StudentDashboard } from './pages/student/StudentDashboard';
import { StudentCourses } from './pages/student/StudentCourses';
import { StudentHistory } from './pages/student/StudentHistory';
import { FacultyDashboard } from './pages/faculty/FacultyDashboard';
import { AdminDashboard } from './pages/admin/AdminDashboard';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const RoleHomeRedirect: React.FC = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
  if (user.role === 'FACULTY') return <Navigate to="/faculty" replace />;
  return <Navigate to="/student" replace />;
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />

              <Route path="/" element={<AppLayout />}>
                <Route index element={<RoleHomeRedirect />} />

                {/* Student Routes */}
                <Route path="student" element={<StudentDashboard />} />
                <Route path="student/courses" element={<StudentCourses />} />
                <Route path="student/history" element={<StudentHistory />} />

                {/* Faculty Routes */}
                <Route path="faculty" element={<FacultyDashboard />} />
                <Route path="faculty/warnings" element={<FacultyDashboard />} />
                <Route path="faculty/actions" element={<FacultyDashboard />} />

                {/* Admin Routes */}
                <Route path="admin" element={<AdminDashboard />} />
                <Route path="admin/courses" element={<AdminDashboard />} />
              </Route>

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
