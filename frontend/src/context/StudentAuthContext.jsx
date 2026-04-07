import React, { createContext, useContext, useState } from 'react';
import { authAPI, studentAuthAPI } from '../services/api';

const StudentAuthContext = createContext(null);

export function StudentAuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { 
      const u = JSON.parse(localStorage.getItem('student'));
      return u?.user ? u.user : u;
    } catch { return null; }
  });

  const login = async (email, password) => {
    const res = await studentAuthAPI.login({ email, password });
    const u = res.data.user; // Get nested user object
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

  const updateUser = (newData) => {
    setUser(newData);
    localStorage.setItem('student', JSON.stringify(newData));
  };

  return <StudentAuthContext.Provider value={{ user, login, logout, forgotPassword, resetPassword, changePassword, updateUser }}>{children}</StudentAuthContext.Provider>;
}

export const useStudentAuth = () => useContext(StudentAuthContext);
