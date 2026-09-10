import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const fetchMe = useCallback(async () => {
    try {
      const res = await api.me();
      setAdmin(res.admin || null);
    } catch {
      setAdmin(null);
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  useEffect(() => {
    const handler = () => {
      setAdmin(null);
      setLoading(false);
      if (window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login') {
        window.location.href = '/admin/login';
      }
    };
    window.addEventListener('auth:unauthorized', handler);
    return () => window.removeEventListener('auth:unauthorized', handler);
  }, []);

  const login = async (email, password) => {
    const res = await api.login(email, password);
    setAdmin(res.admin);
    return res;
  };

  const logout = async () => {
    try {
      await api.logout();
    } finally {
      setAdmin(null);
    }
  };

  const value = {
    admin,
    loading,
    initialized,
    isAuthenticated: !!admin,
    login,
    logout,
    refresh: fetchMe,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
