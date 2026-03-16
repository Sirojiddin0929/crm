import React from 'react';
import { Search, Bell, Moon, Sun, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContent';

export default function Topbar({ title }) {
  const { user } = useAuth();
  const { dark, toggle } = useTheme();

  return (
    <header className="h-14 bg-white dark:bg-[#1a1a2e] border-b border-gray-100 dark:border-[#2d2d44] flex items-center px-5 gap-4 sticky top-0 z-40">

      <div className="flex-1" />

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Dark mode toggle */}
        <button
          onClick={toggle}
          className="w-9 h-9 rounded-lg bg-gray-50 dark:bg-[#2d2d44] border border-gray-100 dark:border-[#3d3d55] flex items-center justify-center text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#3d3d55] transition-colors"
        >
          {dark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-700 text-sm cursor-pointer">
          {user?.fullName?.[0] || 'A'}
        </div>
      </div>
    </header>
  );
}