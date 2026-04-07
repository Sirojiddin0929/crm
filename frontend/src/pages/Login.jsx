import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      navigate('/admin');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Email yoki parol noto\'g\'ri');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#F4F4F8' }}>
      {/* Left decorative */}
      <div className="hidden lg:flex flex-1 items-center justify-center" style={{ background: '#1E1B2E' }}>
        <div className="text-center">
          <div className="w-20 h-20 rounded-2xl bg-yellow-400 flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl font-900 text-[#1E1B2E]">Z</span>
          </div>
          <h1 className="text-4xl font-900 text-white mb-3">ZiyoNex</h1>
          <p className="text-gray-400 text-base font-500 max-w-xs">
            O'quv markazini boshqarish uchun zamonaviy platforma
          </p>
          <div className="mt-10 flex flex-col gap-3 max-w-xs mx-auto">
            {['👨‍🎓 Talabalar boshqaruvi', '👩‍🏫 O\'qituvchilar paneli', '📊 Guruh va davomat', '💰 To\'lov tizimi'].map(t => (
              <div key={t} className="flex items-center gap-3 bg-white/8 rounded-xl px-4 py-3 text-gray-300 text-sm font-600">
                {t}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form */}
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
            <button onClick={() => navigate('/login')} className="flex-1 py-1.5 text-xs font-700 rounded-lg bg-white shadow text-gray-800">Admin</button>
            <button onClick={() => navigate('/teacher/login')} className="flex-1 py-1.5 text-xs font-700 rounded-lg text-gray-500 hover:text-gray-800 transition-colors">O'qituvchi</button>
            <button onClick={() => navigate('/student/login')} className="flex-1 py-1.5 text-xs font-700 rounded-lg text-gray-500 hover:text-gray-800 transition-colors">O'quvchi</button>
          </div>

          <h2 className="text-2xl font-900 text-gray-800 mb-1">Admin kirish</h2>
          <p className="text-gray-400 text-sm font-500 mb-7">Tizimga kirish uchun ma'lumotlarni kiriting</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-700 text-gray-600 block mb-1.5">Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@gmail.com"
                  required
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all font-500 text-gray-800 placeholder-gray-400"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-700 text-gray-600 block mb-1.5">Parol</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={show ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all font-500 text-gray-800"
                />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-700 text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : null}
              Kirish
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
