import React, { createContext, useContext, useState } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { 
      const u = JSON.parse(localStorage.getItem('user'));
      return u?.user ? u.user : u;
    } catch { return null; }
  });

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    const u = res.data.user; // Get nested user object
    setUser(u);
    localStorage.setItem('user', JSON.stringify(u));
    if (res.data.access_token) localStorage.setItem('admin_token', res.data.access_token);
    // Clear other roles
    localStorage.removeItem('teacher');
    localStorage.removeItem('student');
    localStorage.removeItem('teacher_token');
    localStorage.removeItem('student_token');
    return u;
  };

  const logout = async () => {
    try { await authAPI.logout(); } catch {}
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('admin_token');
  };

  const updateUser = (newData) => {
    setUser(newData);
    localStorage.setItem('user', JSON.stringify(newData));
  };

  return <AuthContext.Provider value={{ user, login, logout, updateUser }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
