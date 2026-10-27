import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('apna_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await api.get('/auth/me');
        if (res.data?.success && res.data.user) {
          setUser(res.data.user);
          localStorage.setItem('apna_user', JSON.stringify(res.data.user));
        }
      } catch {
        setUser(null);
        localStorage.removeItem('apna_user');
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, []);

  const login = async (loginId, password) => {
    const res = await api.post('/auth/login', { login: loginId, password });
    if (res.data?.success && res.data.user) {
      setUser(res.data.user);
      localStorage.setItem('apna_user', JSON.stringify(res.data.user));
    }
    return res.data;
  };

  const register = async (username, email, password, telegramChatId) => {
    const res = await api.post('/auth/register', { username, email, password, telegramChatId });
    if (res.data?.success && res.data.user) {
      setUser(res.data.user);
      localStorage.setItem('apna_user', JSON.stringify(res.data.user));
    }
    return res.data;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore network errors on logout
    } finally {
      setUser(null);
      localStorage.removeItem('apna_user');
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
