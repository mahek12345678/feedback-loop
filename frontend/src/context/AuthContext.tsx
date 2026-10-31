import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { authApi } from '../api/services';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, name: string, role: string) => Promise<void>;
  logout: () => void;
  quickSwitchDemo: (role: 'student' | 'faculty' | 'admin') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('feedbackloop_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('feedbackloop_token');
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('feedbackloop_token');
      if (storedToken) {
        try {
          const me = await authApi.getMe();
          setUser(me);
          localStorage.setItem('feedbackloop_user', JSON.stringify(me));
        } catch {
          logout();
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await authApi.login(email, pass);
    localStorage.setItem('feedbackloop_token', res.access_token);
    localStorage.setItem('feedbackloop_user', JSON.stringify(res.user));
    setToken(res.access_token);
    setUser(res.user);
  };

  const register = async (email: string, pass: string, name: string, role: string) => {
    const res = await authApi.register({ email, password: pass, full_name: name, role });
    localStorage.setItem('feedbackloop_token', res.access_token);
    localStorage.setItem('feedbackloop_user', JSON.stringify(res.user));
    setToken(res.access_token);
    setUser(res.user);
  };

  const logout = () => {
    localStorage.removeItem('feedbackloop_token');
    localStorage.removeItem('feedbackloop_user');
    setToken(null);
    setUser(null);
  };

  const quickSwitchDemo = async (role: 'student' | 'faculty' | 'admin') => {
    if (role === 'student') {
      await login('student1@feedbackloop.edu', 'student123');
    } else if (role === 'faculty') {
      await login('prof.davis@feedbackloop.edu', 'faculty123');
    } else if (role === 'admin') {
      await login('admin@feedbackloop.edu', 'admin123');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        quickSwitchDemo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
