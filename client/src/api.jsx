import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { handleMockApi, resetMockDb } from './mockBackend.js';

const AuthContext = createContext(null);

// null = untested, 'live' = real API, 'mock' = standalone in-browser
let activeBackendMode = null;

export const checkBackendHealth = async () => {
  if (activeBackendMode === 'mock') return false;
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  if (!isLocal && !import.meta.env.VITE_API_URL) {
    activeBackendMode = 'mock';
    return false;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1200);
    const res = await fetch('/api/stats/public', { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      activeBackendMode = 'live';
      return true;
    }
  } catch (e) {
    // Server unavailable
  }

  activeBackendMode = 'mock';
  return false;
};

export const apiFetch = async (endpoint, options = {}) => {
  // If we know we're in mock mode, route directly to mock
  if (activeBackendMode === 'mock') {
    return handleMockApi(endpoint, options);
  }

  // If untested, check health first
  if (activeBackendMode === null) {
    const isLive = await checkBackendHealth();
    if (!isLive) {
      return handleMockApi(endpoint, options);
    }
  }

  const token = localStorage.getItem('token');
  const url = endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`;

  const headers = { ...options.headers };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let body = options.body;
  if (body && !(body instanceof FormData) && typeof body === 'object') {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      body
    });

    if (response.status === 204) {
      return null;
    }

    let data;
    try {
      data = await response.json();
    } catch (err) {
      data = null;
    }

    if (!response.ok) {
      if (response.status === 404 && activeBackendMode !== 'live') {
        activeBackendMode = 'mock';
        return handleMockApi(endpoint, options);
      }
      const error = new Error((data && data.message) || `HTTP error ${response.status}`);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    // If it's a known HTTP error thrown above, rethrow
    if (err.status) {
      throw err;
    }
    // Network failure (e.g. backend down or static GitHub Pages) -> switch to mock
    console.warn('Backend unreachable, running in Standalone In-Browser Mode:', err.message);
    activeBackendMode = 'mock';
    return handleMockApi(endpoint, options);
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const fetchCurrentUser = useCallback(async () => {
    const currentToken = localStorage.getItem('token');
    if (!currentToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const data = await apiFetch('/auth/me');
      setUser(data.user);
    } catch (err) {
      console.warn('Failed to restore session:', err.message);
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
      setIsDemoMode(activeBackendMode === 'mock');
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = async (email, password) => {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: { email, password }
    });
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
    setIsDemoMode(activeBackendMode === 'mock');
    return data.user;
  };

  const register = async (name, email, password, area) => {
    const data = await apiFetch('/auth/register', {
      method: 'POST',
      body: { name, email, password, area }
    });
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
    setIsDemoMode(activeBackendMode === 'mock');
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const resetData = () => {
    resetMockDb();
    window.location.reload();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isDemoMode,
        login,
        register,
        logout,
        resetData,
        refreshUser: fetchCurrentUser
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
