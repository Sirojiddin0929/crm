import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, BookOpen, School,
  ClipboardList, Video, Star, CheckSquare,
  Settings, LogOut, ChevronLeft, ChevronRight,
  Sun, Moon, Search, Bell, User, Menu, X,
  CreditCard, BarChart3, ShoppingCart, Radio
} from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TeacherAuthProvider, useTeacherAuth } from './context/TeacherAuthContext';
import { StudentAuthProvider, useStudentAuth } from './context/StudentAuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContent';
import LoginPage from './pages/Login';
import Dashboard from './pages/admin/Dashboard';
import Students from './pages/admin/Students';
import Teachers from './pages/admin/Teachers';
import Groups from './pages/admin/Groups';
import Videos from './pages/admin/Videos';
import Manage from './pages/admin/Manage';
import Ratings from './pages/admin/Rating';
import TeacherLogin from './pages/teacher/Login';
import TeacherDashboard from './pages/teacher/Dashboard';
import TeacherLessons from './pages/teacher/Lessons';
import TeacherHomework from './pages/teacher/Homework';
import TeacherGroups from './pages/teacher/Groups';
import { TeacherAttendance, TeacherVideos, TeacherRatings } from './pages/teacher/AttendanceVideosRatings';
import StudentLogin from './pages/student/Login';
import StudentDashboard from './pages/student/Dashboard';
import { StudentGroups, StudentLessons, StudentHomework, StudentAttendance, StudentVideos, StudentRatings, StudentIndicators, StudentShop, StudentNotifications } from './pages/student/Pages';
import Profile from './pages/Profile';
import { Avatar, Empty } from './components/UI';

function Protected({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function ProtectedTeacher({ children }) {
  const { user } = useTeacherAuth();
  if (!user) return <Navigate to="/teacher/login" replace />;
  return children;
}

function ProtectedStudent({ children }) {
  const { user } = useStudentAuth();
  if (!user) return <Navigate to="/student/login" replace />;
  return children;
}

function PortalShell({ roleLabel, links, userName, userEmail, userPhoto, onLogout }) {
  const [collapsed, setCollapsed] = useState(false);
  const { dark, toggle } = useTheme();
  const loc = useLocation();
  const navigate = useNavigate();

  const isActive = (link) =>
    link.exact ? loc.pathname === link.path : loc.pathname.startsWith(link.path);

  const profilePath = links[0].path.split('/')[1] + '/profile';

  return (
    <div className="flex h-screen overflow-hidden bg-[#F9FAFB] dark:bg-[#0B0B0F] transition-colors font-inter">
      {/* Sidebar */}
      <aside
        className="flex flex-col h-screen sticky top-0 transition-all duration-300 z-50 border-r border-gray-100 dark:border-white/5 bg-white dark:bg-[#12121A]"
        style={{ width: collapsed ? 68 : 240, minWidth: collapsed ? 68 : 240 }}
      >
        {/* Logo / Role */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-50 dark:border-white/5 h-16">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/20">
            <span className="text-sm font-900 text-white italic">Z</span>
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-gray-800 dark:text-gray-100 font-900 text-[13px] tracking-tight truncate uppercase leading-none">Ziyo Ta'lim</span>
              <span className="text-[9px] font-900 text-amber-500 uppercase tracking-widest mt-1 bg-amber-400/10 px-1.5 py-0.5 rounded-md w-fit">Beta</span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto w-6 h-6 rounded-md bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 flex items-center justify-center text-gray-400 dark:text-gray-500 transition-colors flex-shrink-0"
          >
            {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1 custom-scrollbar">
          {links.map(link => {
            const active = isActive(link);
            const Icon = link.icon;
            return (
              <NavLink
                key={link.path}
                to={link.path}
                end={link.exact}
                title={collapsed ? link.label : ''}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-[13px] font-800 transition-all duration-200
                  ${active
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
              >
                {Icon && <Icon size={18} className="flex-shrink-0" />}
                {!collapsed && <span className="truncate">{link.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-50 dark:border-white/5">
          {!collapsed ? (
            <div 
              onClick={() => navigate('/' + profilePath)} 
              className="flex items-center gap-3 p-2 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer group transition-colors"
            >
              <Avatar name={userName} photo={userPhoto} size="sm" className="ring-2 ring-gray-100 dark:ring-white/10" />
              <div className="flex-1 min-w-0">
                <p className="text-gray-800 dark:text-gray-200 text-[11px] font-900 truncate">{userName}</p>
                <p className="text-gray-400 text-[9px] font-800 uppercase tracking-wider truncate">{roleLabel}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onLogout(); }}
                className="text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button onClick={onLogout} title="Chiqish" className="w-full flex items-center justify-center py-2 text-gray-400 hover:text-red-500 transition-colors">
              <LogOut size={18} />
            </button>
          )}
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-8 bg-white dark:bg-[#12121A] border-b border-gray-50 dark:border-white/5 sticky top-0 z-40 transition-colors">
          <div className="flex items-center gap-4 bg-gray-50 dark:bg-white/5 px-4 py-2 rounded-2xl border border-gray-100 dark:border-white/5 w-96 group focus-within:ring-2 focus-within:ring-emerald-500/10 transition-all shadow-sm">
            <Search size={16} className="text-gray-400" />
            <input type="text" placeholder="Qidiruv..." className="bg-transparent border-none outline-none text-sm font-700 w-full text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-600" />
          </div>

          <div className="flex items-center gap-4">
             <button onClick={toggle} className="w-10 h-10 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition-all active:scale-95">
               <Sun size={18} className="dark:hidden" />
               <Moon size={18} className="hidden dark:block" />
             </button>
            <button onClick={() => {
              const base = loc.pathname.split('/')[1];
              if (base === 'student') navigate('/student/notifications');
            }} className="w-10 h-10 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition-all relative active:scale-95">
              <Bell size={18} />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-red-500 border-2 border-white dark:border-[#12121A]" />
            </button>
            <div className="h-8 w-[1px] bg-gray-100 dark:bg-white/10 mx-2" />

            
            <div className="flex items-center gap-3 pl-2 group cursor-pointer" onClick={() => navigate('/' + profilePath)}>
              <div className="text-right hidden sm:block">
                <p className="text-[12px] font-900 text-gray-800 dark:text-gray-200 leading-none mb-1 group-hover:text-emerald-500 transition-colors uppercase tracking-tight">{userName}</p>
                <p className="text-[10px] text-gray-400 font-800 uppercase tracking-widest leading-none">{roleLabel}</p>
              </div>
              <Avatar name={userName} photo={userPhoto} size="md" className="ring-2 ring-gray-100 dark:ring-white/10 group-hover:ring-emerald-500/30 transition-all shadow-sm" />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 scroll-smooth custom-scrollbar bg-[#F9FAFB] dark:bg-[#0B0B0F]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function AdminShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = [
    { path: '/admin', label: 'Asosiy', icon: LayoutDashboard, exact: true },
    { path: '/admin/teachers', label: "O'qituvchilar", icon: Users },
    { path: '/admin/students', label: 'Talabalar', icon: BookOpen },
    { path: '/admin/groups', label: 'Guruhlar', icon: School },
    { path: '/admin/videos', label: 'Videolar', icon: Video },
    { path: '/admin/manage', label: 'Boshqarish', icon: Settings },
    { path: '/admin/ratings', label: 'Baholash', icon: Star },
    { path: '/admin/profile', label: 'Profil / Sozlamalar', icon: Settings },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <PortalShell
      roleLabel="Admin Panel"
      links={links}
      userName={user?.fullName || "Admin"}
      userEmail={user?.email}
      userPhoto={user?.photo}
      onLogout={handleLogout}
    />
  );
}

function TeacherShell() {
  const { user, logout } = useTeacherAuth();
  const navigate = useNavigate();
  const links = [
    { path: '/teacher/dashboard', label: 'Dashboard',  icon: LayoutDashboard, exact: true },
    { path: '/teacher/groups',    label: 'Guruhlar',   icon: School },
    { path: '/teacher/ratings',   label: 'Reyting',    icon: Star },
    { path: '/teacher/profile',   label: 'Profil',     icon: Settings },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/teacher/login');
  };

  return (
    <PortalShell
      roleLabel="Teacher Panel"
      links={links}
      userName={user?.fullName || "O'qituvchi"}
      userEmail={user?.email}
      userPhoto={user?.photo}
      onLogout={handleLogout}
    />
  );
}

function StudentShell() {
  const { user, logout } = useStudentAuth();
  const navigate = useNavigate();
  const links = [
    { path: '/student/dashboard',  label: 'Bosh sahifa',      icon: LayoutDashboard, exact: true },
    { path: '/student/groups',     label: 'Guruhlarim',       icon: School },
    { path: '/student/indicators', label: 'Ko\'rsatkichlarim', icon: BarChart3 },
    { path: '/student/shop',       label: 'Do\'kon',           icon: ShoppingCart },
    { path: '/student/profile',    label: 'Sozlamalar',       icon: Settings },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/student/login');
  };

  return (
    <PortalShell
      roleLabel="Student Panel"
      links={links}
      userName={user?.fullName || "O'quvchi"}
      userEmail={user?.email}
      userPhoto={user?.photo}
      onLogout={handleLogout}
    />
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <TeacherAuthProvider>
          <StudentAuthProvider>
            <BrowserRouter>
              <Routes>
                {/* Admin */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/admin" element={<Protected><AdminShell /></Protected>}>
                  <Route index element={<Dashboard />} />
                  <Route path="students" element={<Students />} />
                  <Route path="teachers" element={<Teachers />} />
                  <Route path="groups" element={<Groups />} />
                  <Route path="videos" element={<Videos />} />
                  <Route path="manage" element={<Manage />} />
                  <Route path="ratings" element={<Ratings />} />
                  <Route path="profile" element={<Profile />} />
                </Route>

                {/* Teacher */}
                <Route path="/teacher/login" element={<TeacherLogin />} />
                <Route path="/teacher" element={<ProtectedTeacher><TeacherShell /></ProtectedTeacher>}>
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<TeacherDashboard />} />
                  <Route path="groups" element={<TeacherGroups />} />
                  <Route path="lessons" element={<TeacherLessons />} />
                  <Route path="homework" element={<TeacherHomework />} />
                  <Route path="attendance" element={<TeacherAttendance />} />
                  <Route path="ratings" element={<TeacherRatings />} />
                  <Route path="profile" element={<Profile />} />
                </Route>

                {/* Student */}
                <Route path="/student/login" element={<StudentLogin />} />
                <Route path="/student" element={<ProtectedStudent><StudentShell /></ProtectedStudent>}>
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<StudentDashboard />} />
                  <Route path="groups" element={<StudentGroups />} />
                  <Route path="groups/:groupId/lessons" element={<StudentLessons />} />
                  <Route path="indicators" element={<StudentIndicators />} />
                  <Route path="notifications" element={<StudentNotifications />} />
                  <Route path="shop" element={<StudentShop />} />
                  <Route path="profile" element={<Profile />} />
                </Route>

                <Route path="/" element={<Navigate to="/login" replace />} />
              </Routes>
              <Toaster position="top-right" />
            </BrowserRouter>
          </StudentAuthProvider>
        </TeacherAuthProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
