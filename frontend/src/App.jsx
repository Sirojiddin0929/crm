import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import { logoutUser } from './api/auth';

const ROLE_LABELS = {
  ADMIN: 'Admin', SUPERADMIN: 'Super Admin', MANAGEMENT: 'Menejment',
  ADMINSTRATOR: 'Administrator', TEACHER: 'O\'qituvchi', STUDENT: 'O\'quvchi',
};

function DashboardPlaceholder() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('crm_user') || '{}');

  const handleLogout = async () => {
    try { await logoutUser(); } catch (_) {}
    localStorage.removeItem('crm_user');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
      {/* Navbar */}
      <header className="border-b border-slate-700/50 bg-slate-800/60 backdrop-blur-xl px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span className="text-white font-bold text-lg">CRM Tizimi</span>
          </div>

          <div className="flex items-center gap-3">
            {/* User pill */}
            <div className="hidden sm:flex items-center gap-2 bg-slate-700/50 border border-slate-600/50 rounded-xl px-3 py-1.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold">
                {user.fullName?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="leading-tight">
                <p className="text-white text-xs font-medium">{user.fullName || 'Foydalanuvchi'}</p>
                <p className="text-slate-400 text-xs">{ROLE_LABELS[user.role] || user.role || ''}</p>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 hover:text-red-300 rounded-xl text-sm font-medium transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Chiqish
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">
            Xush kelibsiz, {user.fullName?.split(' ')[0] || 'Foydalanuvchi'}! 👋
          </h1>
          <p className="text-slate-400 mt-1">CRM boshqaruv paneliga xush kelibsiz.</p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <QuickCard
            icon="key"
            title="Parolni o'zgartirish"
            desc="Hisobingiz xavfsizligini ta'minlang"
            color="indigo"
            onClick={() => navigate('/change-password')}
          />
          <QuickCard
            icon="add-user"
            title="Foydalanuvchi qo'shish"
            desc="Yangi xodim ro'yxatdan o'tkazish"
            color="violet"
            onClick={() => navigate('/register')}
          />
          <QuickCard
            icon="logout"
            title="Tizimdan chiqish"
            desc="Hisobdan xavfsiz chiqish"
            color="red"
            onClick={handleLogout}
          />
        </div>

        {/* Info card */}
        <div className="mt-6 bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
          <h2 className="text-slate-300 font-semibold mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Hisob ma'lumotlari
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Ism', value: user.fullName },
              { label: 'Email', value: user.email },
              { label: 'Rol', value: ROLE_LABELS[user.role] || user.role },
              { label: 'Status', value: user.status },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-slate-500 text-xs mb-0.5">{label}</p>
                <p className="text-slate-200 text-sm font-medium">{value || '—'}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

function QuickCard({ icon, title, desc, color, onClick }) {
  const colors = {
    indigo: 'from-indigo-500/10 to-indigo-600/5 border-indigo-500/20 hover:border-indigo-500/40',
    violet: 'from-violet-500/10 to-violet-600/5 border-violet-500/20 hover:border-violet-500/40',
    red:    'from-red-500/10 to-red-600/5 border-red-500/20 hover:border-red-500/40',
  };
  const iconColors = { indigo: 'text-indigo-400', violet: 'text-violet-400', red: 'text-red-400' };

  const icons = {
    key: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
    ),
    'add-user': (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    ),
    logout: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    ),
  };

  return (
    <button
      onClick={onClick}
      className={`w-full text-left bg-gradient-to-br ${colors[color]} border rounded-2xl p-5 transition-all hover:scale-[1.02] cursor-pointer`}
    >
      <div className={`${iconColors[color]} mb-3`}>
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {icons[icon]}
        </svg>
      </div>
      <p className="text-white font-semibold text-sm">{title}</p>
      <p className="text-slate-400 text-xs mt-0.5">{desc}</p>
    </button>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/change-password" element={<ChangePasswordPage />} />
        <Route path="/dashboard" element={<DashboardPlaceholder />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
