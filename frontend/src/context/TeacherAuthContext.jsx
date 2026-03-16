import React, { createContext, useContext, useState } from 'react';
import { authAPI, teachersAPI } from '../services/api';

const TeacherAuthContext = createContext(null);

export function TeacherAuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('teacher')); } catch { return null; }
  });

  const login = async (email, password) => {
    const res = await teachersAPI.login({ email, password });
    const u = res.data;
    setUser(u);
    localStorage.setItem('teacher', JSON.stringify(u));
    // Clear other roles
    localStorage.removeItem('user');
    localStorage.removeItem('student');
    return u;
  };

  const forgotPassword = async (email) => {
    return authAPI.forgotPassword({ email });
  };

  const resetPassword = async (token, newPassword) => {
    return authAPI.resetPassword({ token, newPassword });
  };

  const changePassword = async (oldPassword, newPassword) => {
    return authAPI.changePassword({ oldPassword, newPassword });
  };

  const logout = async () => {
    try { await authAPI.logout(); } catch {};
    setUser(null);
    localStorage.removeItem('teacher');
  };

  return <TeacherAuthContext.Provider value={{ user, login, logout, forgotPassword, resetPassword, changePassword }}>{children}</TeacherAuthContext.Provider>;
}

export const useTeacherAuth = () => useContext(TeacherAuthContext);
