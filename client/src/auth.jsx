import React, { createContext, useContext, useState, useEffect } from 'react';
import api from './api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function restoreSession() {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get('/auth/me');
        setUser(res.user);
      } catch (err) {
        localStorage.removeItem('token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    restoreSession();

    const handleLogout = () => {
      localStorage.removeItem('token');
      setUser(null);
    };

    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', res.token);
    setUser(res.user);
    return res.user;
  };

  const register = async (userData) => {
    const res = await api.post('/auth/register', userData);
    localStorage.setItem('token', res.token);
    setUser(res.user);
    return res.user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
