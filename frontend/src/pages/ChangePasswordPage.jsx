import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { changePassword } from '../api/auth';

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ oldPassword: '', newPassword: '', confirm: '' });
  const [show, setShow] = useState({ old: false, new: false, confirm: false });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: undefined });
    setServerError('');
  };

  const toggleShow = (field) => setShow({ ...show, [field]: !show[field] });

  const validate = () => {
    const e = {};
    if (!form.oldPassword) e.oldPassword = 'Eski parol kiritish majburiy';
    if (!form.newPassword || form.newPassword.length < 6) e.newPassword = 'Kamida 6 ta belgi kiriting';
    if (form.newPassword === form.oldPassword) e.newPassword = 'Yangi parol eskisidan farq qilishi kerak';
    if (!form.confirm) e.confirm = 'Parolni tasdiqlang';
    else if (form.newPassword !== form.confirm) e.confirm = 'Parollar mos kelmayapti';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    try {
      await changePassword({ oldPassword: form.oldPassword, newPassword: form.newPassword });
      setSuccess('Parol muvaffaqiyatli yangilandi!');
      setForm({ oldPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      setServerError(err?.response?.data?.message || 'Xatolik yuz berdi. Eski parolni tekshiring.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/40 mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Parolni o'zgartirish</h1>
          <p className="text-slate-400 mt-1 text-sm">Eski va yangi parolingizni kiriting</p>
        </div>

        <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/60 rounded-2xl shadow-2xl p-8">
          {/* Success */}
          {success && (
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm px-4 py-3 rounded-xl mb-5">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {success}
            </div>
          )}

          {/* Server Error */}
          {serverError && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl mb-5">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Old password */}
            <PasswordField
              label="Eski parol"
              name="oldPassword"
              value={form.oldPassword}
              onChange={handleChange}
              show={show.old}
              onToggle={() => toggleShow('old')}
              error={errors.oldPassword}
              placeholder="Joriy parolingiz"
            />

            {/* Divider */}
            <div className="border-t border-slate-700/50 pt-2" />

            {/* New password */}
            <PasswordField
              label="Yangi parol"
              name="newPassword"
              value={form.newPassword}
              onChange={handleChange}
              show={show.new}
              onToggle={() => toggleShow('new')}
              error={errors.newPassword}
              placeholder="Kamida 6 ta belgi"
              hint="Kamida 6 ta belgi"
            />

            {/* Confirm password */}
            <PasswordField
              label="Yangi parolni tasdiqlang"
              name="confirm"
              value={form.confirm}
              onChange={handleChange}
              show={show.confirm}
              onToggle={() => toggleShow('confirm')}
              error={errors.confirm}
              placeholder="••••••••"
              matchStatus={
                form.confirm
                  ? form.newPassword === form.confirm
                    ? 'match'
                    : 'mismatch'
                  : null
              }
            />

            {/* Strength bar */}
            {form.newPassword && (
              <StrengthBar password={form.newPassword} />
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 mt-1 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all duration-200 text-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saqlanmoqda...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Saqlash
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-700/50 text-center">
            <button
              onClick={() => navigate(-1)}
              className="text-slate-500 hover:text-slate-300 text-sm transition-colors"
            >
              ← Orqaga qaytish
            </button>
          </div>
        </div>

        <p className="text-center text-slate-500 text-xs mt-6">
          © 2026 CRM Tizimi. Barcha huquqlar himoyalangan.
        </p>
      </div>
    </div>
  );
}

/* ─── Helper Components ─────────────────────────────────────────── */

function PasswordField({ label, name, value, onChange, show, onToggle, error, placeholder, hint, matchStatus }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1.5">{label}</label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <input
          type={show ? 'text' : 'password'}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full pl-10 pr-11 py-2.5 bg-slate-700/50 border ${
            error ? 'border-red-500/60' : 'border-slate-600/60'
          } text-white placeholder-slate-500 rounded-xl focus:outline-none focus:ring-2 ${
            error ? 'focus:ring-red-500' : 'focus:ring-indigo-500'
          } focus:border-transparent transition-all text-sm`}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
        >
          {show ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
      {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {matchStatus === 'match' && (
        <p className="mt-1 text-xs text-emerald-400 flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Parollar mos keladi
        </p>
      )}
      {matchStatus === 'mismatch' && (
        <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Parollar mos kelmayapti
        </p>
      )}
    </div>
  );
}

function StrengthBar({ password }) {
  const getStrength = (p) => {
    let score = 0;
    if (p.length >= 6) score++;
    if (p.length >= 10) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return score;
  };

  const score = getStrength(password);
  const labels = ['', 'Juda zaif', 'Zaif', 'O\'rtacha', 'Kuchli', 'Juda kuchli'];
  const colors = ['', 'bg-red-500', 'bg-orange-500', 'bg-amber-400', 'bg-emerald-400', 'bg-emerald-500'];
  const textColors = ['', 'text-red-400', 'text-orange-400', 'text-amber-400', 'text-emerald-400', 'text-emerald-400'];

  return (
    <div>
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all ${i <= score ? colors[score] : 'bg-slate-700'}`}
          />
        ))}
      </div>
      <p className={`text-xs ${textColors[score] || 'text-slate-500'}`}>
        Parol kuchi: {labels[score] || '—'}
      </p>
    </div>
  );
}
