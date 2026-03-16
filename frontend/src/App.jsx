import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, BookOpen, School,
  ClipboardList, Video, Star, CheckSquare,
  Settings, LogOut, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TeacherAuthProvider, useTeacherAuth } from './context/TeacherAuthContext';
import { StudentAuthProvider, useStudentAuth } from './context/StudentAuthContext';
import Layout from './components/Layout';
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
import { StudentGroups, StudentLessons, StudentHomework, StudentAttendance, StudentVideos, StudentRatings } from './pages/student/Pages';

function Protected({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
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

function PortalShell({ roleLabel, links, userName, userEmail, onLogout }) {
  const [collapsed, setCollapsed] = useState(false);
  const loc = useLocation();

  const isActive = (link) =>
    link.exact ? loc.pathname === link.path : loc.pathname.startsWith(link.path);

  return (
    <div className="flex h-screen overflow-hidden bg-[#F4F4F8]">
      {/* Sidebar */}
      <aside
        className="flex flex-col h-screen sticky top-0 transition-all duration-300 z-50"
        style={{ width: collapsed ? 68 : 210, minWidth: collapsed ? 68 : 210, background: '#1E1B2E' }}
      >
        {/* Logo / Role */}
        <div className="flex items-center gap-2.5 px-4 py-4 border-b border-white/10">
          <div className="w-8 h-8 rounded-lg bg-yellow-400 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-900 text-[#1E1B2E]">E</span>
          </div>
          {!collapsed && (
            <span className="text-white font-800 text-base tracking-tight truncate">{roleLabel}</span>
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
          {links.map(link => {
            const active = isActive(link);
            const Icon = link.icon;
            return (
              <NavLink
                key={link.path}
                to={link.path}
                end={link.exact}
                title={collapsed ? link.label : ''}
                className={`w-full flex items-center gap-3 px-2.5 py-2.5 rounded-lg text-sm font-600 transition-all duration-150
                  ${active
                    ? 'bg-primary text-white shadow-lg shadow-purple-900/30'
                    : 'text-gray-400 hover:bg-white/8 hover:text-white'
                  }`}
              >
                {Icon && <Icon size={18} className="flex-shrink-0" />}
                {!collapsed && <span className="truncate">{link.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-white/10">
          {!collapsed ? (
            <div className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/8 cursor-pointer group">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-700 flex-shrink-0">
                {userName?.[0] || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-700 truncate">{userName}</p>
                {userEmail && <p className="text-gray-400 text-xs truncate">{userEmail}</p>}
              </div>
              <button
                onClick={onLogout}
                className="text-gray-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <button
              onClick={onLogout}
              title="Chiqish"
              className="w-full flex items-center justify-center py-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-white/8 transition-colors"
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-5">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

function TeacherShell() {
  const { user, logout } = useTeacherAuth();
  const navigate = useNavigate();
  const links = [
    { path: '/teacher/dashboard', label: 'Dashboard',  icon: LayoutDashboard, exact: true },
    { path: '/teacher/groups',    label: 'Guruhlar',   icon: School },
    { path: '/teacher/lessons',   label: 'Darslar',    icon: BookOpen },
    { path: '/teacher/attendance',label: 'Davomat',    icon: CheckSquare },
    { path: '/teacher/homework',  label: 'Vazifalar',  icon: ClipboardList },
    { path: '/teacher/videos',    label: 'Videolar',   icon: Video },
    { path: '/teacher/ratings',   label: 'Reyting',    icon: Star },
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
      onLogout={handleLogout}
    />
  );
}

function StudentShell() {
  const { user, logout } = useStudentAuth();
  const navigate = useNavigate();
  const links = [
    { path: '/student/dashboard', label: 'Dashboard',  icon: LayoutDashboard, exact: true },
    { path: '/student/groups',    label: 'Guruhlar',   icon: School },
    { path: '/student/lessons',   label: 'Darslar',    icon: BookOpen },
    { path: '/student/homework',  label: 'Vazifalar',  icon: ClipboardList },
    { path: '/student/attendance',label: 'Davomat',    icon: CheckSquare },
    { path: '/student/videos',    label: 'Videolar',   icon: Video },
    { path: '/student/ratings',   label: 'Reyting',    icon: Star },
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
      onLogout={handleLogout}
    />
  );
}

function AppRoutes() {
  const { user } = useAuth();
  const { user: teacherUser } = useTeacherAuth();
  const { user: studentUser } = useStudentAuth();

  const rootPath = user ? '/admin' : (teacherUser ? '/teacher/dashboard' : (studentUser ? '/student/dashboard' : '/login'));

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/admin" replace /> : <LoginPage />} />
      <Route path="/teacher/login" element={teacherUser ? <Navigate to="/teacher/dashboard" replace /> : <TeacherLogin />} />
      <Route path="/student/login" element={studentUser ? <Navigate to="/student/dashboard" replace /> : <StudentLogin />} />

      <Route path="/admin" element={<Protected><Dashboard /></Protected>} />
      <Route path="/admin/students" element={<Protected><Students /></Protected>} />
      <Route path="/admin/teachers" element={<Protected><Teachers /></Protected>} />
      <Route path="/admin/groups" element={<Protected><Groups /></Protected>} />
      <Route path="/admin/videos" element={<Protected><Videos /></Protected>} />
      <Route path="/admin/manage" element={<Protected><Manage /></Protected>} />
      <Route path="/admin/ratings" element={<Protected><Ratings /></Protected>} />

      <Route path="/teacher" element={<ProtectedTeacher><TeacherShell /></ProtectedTeacher>}>
        <Route index element={<Navigate to="/teacher/dashboard" replace />} />
        <Route path="dashboard" element={<TeacherDashboard />} />
        <Route path="groups" element={<TeacherGroups />} />
        <Route path="lessons" element={<TeacherLessons />} />
        <Route path="attendance" element={<TeacherAttendance />} />
        <Route path="homework" element={<TeacherHomework />} />
        <Route path="videos" element={<TeacherVideos />} />
        <Route path="ratings" element={<TeacherRatings />} />
      </Route>

      <Route path="/student" element={<ProtectedStudent><StudentShell /></ProtectedStudent>}>
        <Route index element={<Navigate to="/student/dashboard" replace />} />
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="groups" element={<StudentGroups />} />
        <Route path="lessons" element={<StudentLessons />} />
        <Route path="homework" element={<StudentHomework />} />
        <Route path="attendance" element={<StudentAttendance />} />
        <Route path="videos" element={<StudentVideos />} />
        <Route path="ratings" element={<StudentRatings />} />
      </Route>

      <Route path="/" element={<Navigate to={rootPath} replace />} />
      <Route path="*" element={<Navigate to={rootPath} replace />} />
    </Routes>
  );
}
import { ThemeProvider } from './context/ThemeContent';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
      <TeacherAuthProvider>
        <StudentAuthProvider>
          <BrowserRouter>
            <AppRoutes />
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  fontFamily: 'Nunito, sans-serif',
                  fontWeight: 600,
                  fontSize: '13px',
                  borderRadius: '10px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                },
                success: { iconTheme: { primary: '#059669', secondary: 'white' } },
                error: { iconTheme: { primary: '#ef4444', secondary: 'white' } },
              }}
            />
          </BrowserRouter>
        </StudentAuthProvider>
      </TeacherAuthProvider>
    </AuthProvider>
    </ThemeProvider>
  );
}
