import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../api/auth';

const ROLES = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'MANAGEMENT', label: 'Menejment' },
  { value: 'ADMINSTRATOR', label: 'Administrator' },
  
];

const initialForm = {
  fullName: '',
  email: '',
  position: '',
  hire_date: '',
  role: '',
  address: '',
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = 'Ism majburiy';
    if (!form.email.trim()) e.email = 'Email majburiy';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Email noto\'g\'ri';
    if (!form.position.trim()) e.position = 'Lavozim majburiy';
    if (!form.hire_date) e.hire_date = 'Ishga qabul sanasi majburiy';
    if (!form.role) e.role = 'Rol tanlash majburiy';
    return e;
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: undefined });
    setServerError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setLoading(true);
    try {
      await registerUser(form);
      setSuccess('Foydalanuvchi muvaffaqiyatli ro\'yxatdan o\'tkazildi!');
      setForm(initialForm);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setServerError(
        err?.response?.data?.message || 'Xatolik yuz berdi. Qayta urinib ko\'ring.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-4 py-10">
      {/* Background blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/40 mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Yangi Foydalanuvchi</h1>
          <p className="text-slate-400 mt-1 text-sm">Admin paneli — foydalanuvchi qo'shish</p>
        </div>

        {/* Card */}
        <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/60 rounded-2xl shadow-2xl p-8">
          {success && (
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm px-4 py-3 rounded-xl mb-5">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {success}
            </div>
          )}

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
            {/* Full Name */}
            <FormField label="To'liq ism" error={errors.fullName}>
              <div className="relative">
                <FieldIcon>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </FieldIcon>
                <input
                  type="text"
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder="Ali Valiyev"
                  className={inputClass(errors.fullName)}
                />
              </div>
            </FormField>

            {/* Email */}
            <FormField label="Email manzil" error={errors.email}>
              <div className="relative">
                <FieldIcon>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </FieldIcon>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="ali@gmail.com"
                  className={inputClass(errors.email)}
                />
              </div>
            </FormField>

            {/* Position & Hire Date — 2-column */}
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Lavozim" error={errors.position}>
                <div className="relative">
                  <FieldIcon>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                      d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </FieldIcon>
                  <input
                    type="text"
                    name="position"
                    value={form.position}
                    onChange={handleChange}
                    placeholder="Manager"
                    className={inputClass(errors.position)}
                  />
                </div>
              </FormField>

              <FormField label="Ishga qabul sanasi" error={errors.hire_date}>
                <input
                  type="date"
                  name="hire_date"
                  value={form.hire_date}
                  onChange={handleChange}
                  className={`${inputClass(errors.hire_date)} pl-4`}
                />
              </FormField>
            </div>

            {/* Role */}
            <FormField label="Rol" error={errors.role}>
              <div className="relative">
                <FieldIcon>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </FieldIcon>
                <select
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  className={`${inputClass(errors.role)} appearance-none`}
                >
                  <option value="" disabled>Rol tanlang...</option>
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value} className="bg-slate-800">
                      {r.label}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </FormField>

            {/* Address (optional) */}
            <FormField label="Manzil (ixtiyoriy)" error={null}>
              <div className="relative">
                <FieldIcon>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </FieldIcon>
                <input
                  type="text"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Toshkent, Chilonzor"
                  className={inputClass(null)}
                />
              </div>
            </FormField>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 mt-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-lg shadow-violet-600/30 transition-all duration-200 text-sm flex items-center justify-center gap-2"
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Foydalanuvchi qo'shish
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-700/50 text-center">
            <span className="text-slate-500 text-sm">Hisobingiz bormi? </span>
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors">
              Kirish
            </Link>
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

function FormField({ label, error, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1.5">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}

function FieldIcon({ children }) {
  return (
    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
      <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        {children}
      </svg>
    </div>
  );
}

function inputClass(hasError) {
  return `w-full pl-10 pr-4 py-2.5 bg-slate-700/50 border ${
    hasError ? 'border-red-500/60' : 'border-slate-600/60'
  } text-white placeholder-slate-500 rounded-xl focus:outline-none focus:ring-2 ${
    hasError ? 'focus:ring-red-500' : 'focus:ring-indigo-500'
  } focus:border-transparent transition-all text-sm`;
}
