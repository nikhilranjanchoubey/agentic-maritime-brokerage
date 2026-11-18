import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser, fetchUserProfile } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('maritime_user');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('maritime_token') || null);
  const [loading, setLoading] = useState(true);

  // Validate session on load
  useEffect(() => {
    async function verifySession() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const freshUser = await fetchUserProfile();
        setUser(freshUser);
        localStorage.setItem('maritime_user', JSON.stringify(freshUser));
      } catch (err) {
        console.warn('Session expired or invalid:', err);
        logout();
      } finally {
        setLoading(false);
      }
    }
    verifySession();
  }, [token]);

  const login = async (email, password) => {
    const res = await loginUser(email, password);
    setToken(res.token);
    setUser(res.user);
    localStorage.setItem('maritime_token', res.token);
    localStorage.setItem('maritime_user', JSON.stringify(res.user));
    return res.user;
  };

  const register = async (userData) => {
    const res = await registerUser(userData);
    setToken(res.token);
    setUser(res.user);
    localStorage.setItem('maritime_token', res.token);
    localStorage.setItem('maritime_user', JSON.stringify(res.user));
    return res.user;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('maritime_token');
    localStorage.removeItem('maritime_user');
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('maritime_user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user && !!token,
    isAdmin: user?.role === 'admin',
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
