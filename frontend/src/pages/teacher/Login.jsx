import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTeacherAuth } from '../../context/TeacherAuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [changeNewPassword, setChangeNewPassword] = useState('');
  const [mode, setMode] = useState('login');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, forgotPassword, resetPassword, changePassword } = useTeacherAuth();
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      navigate('/teacher/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Email yoki parol noto\'g\'ri');
    } finally { setLoading(false); }
  };

  const handleForgot = async () => {
    if (!forgotEmail) { toast.error('Email kiriting'); return; }
    setLoading(true);
    try {
      await forgotPassword(forgotEmail);
      toast.success('Parol tiklash havolasi yuborildi');
      setMode('reset');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!resetToken || !resetNewPassword) { toast.error('Token va yangi parol kiriting'); return; }
    setLoading(true);
    try {
      await resetPassword(resetToken, resetNewPassword);
      toast.success('Parol yangilandi');
      setMode('login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = async () => {
    if (!oldPassword || !changeNewPassword) { toast.error('Eski va yangi parol kiriting'); return; }
    setLoading(true);
    try {
      await changePassword(oldPassword, changeNewPassword);
      toast.success('Parol almashtirildi');
      setMode('login');
      setOldPassword('');
      setChangeNewPassword('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#F4F4F8' }}>
      {/* Left */}
      <div className="hidden lg:flex flex-1 items-center justify-center" style={{ background: '#1E1B2E' }}>
        <div className="text-center px-8">
          <div className="w-20 h-20 rounded-2xl bg-yellow-400 flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl font-900 text-[#1E1B2E]">E</span>
          </div>
          <h1 className="text-4xl font-900 text-white mb-3">ZiyoNex</h1>
          <p className="text-gray-400 text-base font-500 max-w-xs">O'qituvchi paneli — darslar, davomat va vazifalarni boshqaring</p>
          <div className="mt-10 flex flex-col gap-3 max-w-xs mx-auto">
            {['📚 Guruhlaringizni boshqaring', '✅ Davomat belgilang', '📝 Vazifa bering va baholang', '🎥 Video darslar yuklang'].map(t => (
              <div key={t} className="flex items-center gap-3 bg-white/8 rounded-xl px-4 py-3 text-gray-300 text-sm font-600">{t}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Right */}
      <div className="flex-1 lg:max-w-md flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-xl bg-[#1E1B2E] flex items-center justify-center">
              <span className="text-yellow-400 font-900 text-lg">E</span>
            </div>
            <span className="text-xl font-800 text-gray-800">ZiyoNex</span>
          </div>
          {/* Role switcher */}
          <div className="flex p-1 bg-gray-100 rounded-xl mb-6">
            <button onClick={() => navigate('/login')} className="flex-1 py-1.5 text-xs font-700 rounded-lg text-gray-500 hover:text-gray-800 transition-colors">Admin</button>
            <button onClick={() => navigate('/teacher/login')} className="flex-1 py-1.5 text-xs font-700 rounded-lg bg-white shadow text-gray-800">O'qituvchi</button>
            <button onClick={() => navigate('/student/login')} className="flex-1 py-1.5 text-xs font-700 rounded-lg text-gray-500 hover:text-gray-800 transition-colors">O'quvchi</button>
          </div>

          <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mb-5">
            <span className="text-2xl">👩‍🏫</span>
          </div>
          <h2 className="text-2xl font-900 text-gray-800 mb-1">O'qituvchi kirish</h2>
          <p className="text-gray-400 text-sm font-500 mb-7">Email va parolingizni kiriting</p>

          <div className="mb-4 grid grid-cols-3 gap-2">
            <button type="button" onClick={() => setMode('login')} className={`text-xs py-1.5 rounded-lg font-700 ${mode === 'login' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'}`}>Kirish</button>
            <button type="button" onClick={() => setMode('forgot')} className={`text-xs py-1.5 rounded-lg font-700 ${mode === 'forgot' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'}`}>Unutdim</button>
            <button type="button" onClick={() => setMode('change')} className={`text-xs py-1.5 rounded-lg font-700 ${mode === 'change' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'}`}>Almashtirish</button>
          </div>

          {mode === 'login' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-700 text-gray-600 block mb-1.5">Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="teacher@gmail.com" required
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 font-500 text-gray-800 placeholder-gray-400"/>
              </div>
            </div>
            <div>
              <label className="text-xs font-700 text-gray-600 block mb-1.5">Parol</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                <input type={show ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 font-500 text-gray-800"/>
                <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {show ? <EyeOff size={15}/> : <Eye size={15}/>}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-700 text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              {loading && <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
              Kirish
            </button>
          </form>
          )}

          {mode === 'forgot' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-700 text-gray-600 block mb-1.5">Email</label>
                <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} placeholder="teacher@gmail.com"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-primary"/>
              </div>
              <button type="button" onClick={handleForgot} disabled={loading}
                className="w-full py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-700 text-sm disabled:opacity-60">
                Havola yuborish
              </button>
              <p className="text-xs text-gray-400">Agar token olgan bo'lsangiz, "Reset" bo'limida yangi parol o'rnatasiz.</p>
              <button type="button" onClick={() => setMode('reset')} className="text-xs font-700 text-primary hover:underline">Reset oynasiga o'tish</button>
            </div>
          )}

          {mode === 'reset' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-700 text-gray-600 block mb-1.5">Token</label>
                <input value={resetToken} onChange={e => setResetToken(e.target.value)} placeholder="Emaildagi token"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-primary"/>
              </div>
              <div>
                <label className="text-xs font-700 text-gray-600 block mb-1.5">Yangi parol</label>
                <input type="password" value={resetNewPassword} onChange={e => setResetNewPassword(e.target.value)} placeholder="Yangi parol"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-primary"/>
              </div>
              <button type="button" onClick={handleReset} disabled={loading}
                className="w-full py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-700 text-sm disabled:opacity-60">
                Parolni tiklash
              </button>
            </div>
          )}

          {mode === 'change' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-700 text-gray-600 block mb-1.5">Eski parol</label>
                <input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} placeholder="Eski parol"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-primary"/>
              </div>
              <div>
                <label className="text-xs font-700 text-gray-600 block mb-1.5">Yangi parol</label>
                <input type="password" value={changeNewPassword} onChange={e => setChangeNewPassword(e.target.value)} placeholder="Yangi parol"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-primary"/>
              </div>
              <button type="button" onClick={handleChange} disabled={loading}
                className="w-full py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-700 text-sm disabled:opacity-60">
                Parolni almashtirish
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
