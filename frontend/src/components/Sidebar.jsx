import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Users, GraduationCap, BookOpen,
  Settings, LogOut, ChevronLeft, ChevronRight,
  Gift, Wallet, BookMarked, School, Video, ClipboardList,
  Star,
} from 'lucide-react';

const NAV = [
  { path: '/admin', label: 'Asosiy', icon: LayoutDashboard, exact: true },
  { path: '/admin/teachers', label: "O'qituvchilar", icon: GraduationCap },
  { path: '/admin/students', label: 'Talabalar', icon: Users },
  { path: '/admin/groups', label: 'Guruhlar', icon: School },
  { path: '/admin/videos', label: 'Videolar', icon: Video },
  { path: '/admin/manage', label: 'Boshqarish', icon: Settings },
  { path: '/admin/ratings', label: 'Baholash', icon: Star },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();

  const isActive = (item) =>
    item.exact ? loc.pathname === item.path : loc.pathname.startsWith(item.path);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside
      className="flex flex-col h-screen sticky top-0 transition-all duration-300 z-50 bg-[#1E1B2E] dark:bg-black"
      style={{
        width: collapsed ? 68 : 210,
        minWidth: collapsed ? 68 : 210,
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-white/10">
        <div className="w-8 h-8 rounded-lg bg-yellow-400 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-900 text-[#1E1B2E]">Z</span>
        </div>
        {!collapsed && (
          <span className="text-white font-800 text-base tracking-tight">ZiyoNex</span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto w-6 h-6 rounded-md bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-colors flex-shrink-0"
        >
          {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {NAV.map(item => {
          const active = isActive(item);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              title={collapsed ? item.label : ''}
              className={`w-full flex items-center gap-3 px-2.5 py-2.5 rounded-lg text-sm font-600 transition-all duration-150 text-left
                ${active
                  ? 'bg-primary text-white shadow-lg shadow-purple-900/30'
                  : 'text-gray-400 hover:bg-white/8 hover:text-white'
                }`}
            >
              <item.icon size={18} className="flex-shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-white/10">
        {!collapsed ? (
          <div className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/8 cursor-pointer group">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-700 flex-shrink-0">
              {user?.fullName?.[0] || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-700 truncate">{user?.fullName || 'Admin'}</p>
              <p className="text-gray-400 text-xs truncate">{user?.email || ''}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
            >
              <LogOut size={15} />
            </button>
          </div>
        ) : (
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center py-2 text-gray-500 hover:text-red-400 transition-colors"
            title="Chiqish"
          >
            <LogOut size={16} />
          </button>
        )}
      </div>
    </aside>
  );
}
