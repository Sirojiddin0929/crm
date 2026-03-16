import React, { createContext, useContext, useState } from 'react';
import { authAPI, studentAuthAPI } from '../services/api';

const StudentAuthContext = createContext(null);

export function StudentAuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('student')); } catch { return null; }
  });

  const login = async (email, password) => {
    const res = await studentAuthAPI.login({ email, password });
    const u = res.data;
    setUser(u);
    localStorage.setItem('student', JSON.stringify(u));
    // Clear other roles
    localStorage.removeItem('user');
    localStorage.removeItem('teacher');
    return u;
  };

  const forgotPassword = async (email) => {
    return studentAuthAPI.forgotPassword({ email });
  };

  const resetPassword = async (token, newPassword) => {
    return studentAuthAPI.resetPassword({ token, newPassword });
  };

  const changePassword = async (oldPassword, newPassword) => {
    return studentAuthAPI.changePassword({ oldPassword, newPassword });
  };

  const logout = async () => {
    try { await authAPI.logout(); } catch {}
    setUser(null);
    localStorage.removeItem('student');
  };

  return <StudentAuthContext.Provider value={{ user, login, logout, forgotPassword, resetPassword, changePassword }}>{children}</StudentAuthContext.Provider>;
}

export const useStudentAuth = () => useContext(StudentAuthContext);
