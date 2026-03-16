import { X, ChevronLeft, ChevronRight } from 'lucide-react';

// ── MODAL ──────────────────────────────────────────────
export function Modal({ open, onClose, title, children, width = 'max-w-lg' }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]" />
      <div
        className={`relative h-full bg-white shadow-2xl overflow-y-auto slide-in ${width} w-full`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="font-800 text-gray-800 text-base">{title}</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-md hover:bg-gray-100 flex items-center justify-center text-gray-500">
            <X size={16} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// ── DRAWER (bottom sheet style for small forms) ──────
export function Drawer({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute inset-0 bg-black/25 backdrop-blur-[1px]" />
      <div
        className="absolute right-0 top-0 h-full w-[400px] bg-white shadow-2xl overflow-y-auto slide-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-800 text-gray-800 text-base">{title}</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-md hover:bg-gray-100 flex items-center justify-center text-gray-500">
            <X size={16} />
          </button>
        </div>
        <div className="p-5 space-y-4">{children}</div>
      </div>
    </div>
  );
}

// ── DIALOG (center confirm) ──────────────────────────
export function Dialog({ open, onClose, title, description, onConfirm, confirmText = "Ha, o'chirish", danger = true }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />
      <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-80 fade-in" onClick={e => e.stopPropagation()}>
        <h3 className="font-800 text-gray-800 mb-2">{title}</h3>
        {description && <p className="text-sm text-gray-500 mb-5">{description}</p>}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-600 text-gray-600 hover:bg-gray-50">
            Bekor qilish
          </button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-700 text-white ${danger ? 'bg-red-500 hover:bg-red-600' : 'bg-primary hover:bg-primary-dark'}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── FORM FIELD ───────────────────────────────────────
export function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-xs font-700 text-gray-600 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

export function Input({ ...props }) {
  return (
    <input
      {...props}
      className={`w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all placeholder-gray-400 font-500 ${props.className || ''}`}
    />
  );
}

export function Select({ children, ...props }) {
  return (
    <select
      {...props}
      className={`w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all bg-white font-500 ${props.className || ''}`}
    >
      {children}
    </select>
  );
}

export function Textarea({ ...props }) {
  return (
    <textarea
      {...props}
      className={`w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all placeholder-gray-400 resize-none font-500 ${props.className || ''}`}
    />
  );
}

// ── STATUS BADGE ─────────────────────────────────────
export function StatusBadge({ status }) {
  const map = {
    ACTIVE: 'badge badge-green',
    INACTIVE: 'badge badge-red',
    FREEZE: 'badge badge-blue',
    PENDING: 'badge badge-yellow',
    CHECKED: 'badge badge-green',
    RETURNED: 'badge badge-blue',
    REJECTED: 'badge badge-red',
    BEGINNER: 'badge badge-green',
    INTERMEDIATE: 'badge badge-yellow',
    ADVANCED: 'badge badge-red',
  };
  const labels = {
    ACTIVE: 'Faol', INACTIVE: 'Nofaol', FREEZE: 'Muzlatilgan',
    PENDING: 'Kutilmoqda', CHECKED: 'Tekshirildi', RETURNED: 'Qaytarildi',
    REJECTED: 'Rad etildi', BEGINNER: 'Boshlang\'ich',
    INTERMEDIATE: "O'rta", ADVANCED: 'Yuqori',
  };
  return (
    <span className={map[status] || 'badge badge-gray'}>
      {labels[status] || status}
    </span>
  );
}

// ── ROLE BADGE ───────────────────────────────────────
export function RoleBadge({ role }) {
  const map = {
    SUPERADMIN: 'badge bg-red-100 text-red-700',
    ADMIN: 'badge bg-purple-100 text-purple-700',
    ADMINSTRATOR: 'badge bg-indigo-100 text-indigo-700',
    MANAGEMENT: 'badge bg-blue-100 text-blue-700',
    TEACHER: 'badge bg-green-100 text-green-700',
    STUDENT: 'badge bg-yellow-100 text-yellow-700',
  };
  return <span className={map[role] || 'badge badge-gray'}>{role}</span>;
}

// ── AVATAR ───────────────────────────────────────────
const COLORS = ['bg-purple-500', 'bg-blue-500', 'bg-green-500', 'bg-orange-500', 'bg-pink-500', 'bg-indigo-500'];
export function Avatar({ name, photo, size = 'md' }) {
  const sz = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-12 h-12 text-base' }[size];
  const color = COLORS[(name?.charCodeAt(0) || 0) % COLORS.length];
  if (photo) return <img src={photo} alt={name} className={`${sz} rounded-full object-cover flex-shrink-0`} />;
  return (
    <div className={`${sz} ${color} rounded-full flex items-center justify-center text-white font-700 flex-shrink-0`}>
      {name?.[0]?.toUpperCase() || '?'}
    </div>
  );
}

// ── COIN BADGE ───────────────────────────────────────
export function CoinBadge({ value }) {
  return (
    <span className="inline-flex items-center gap-1 text-sm font-700 text-amber-600">
      <span className="text-base">🪙</span>{value ?? 0}
    </span>
  );
}

// ── PAGINATION ───────────────────────────────────────
export function Pagination({ page, total, perPage, onChange }) {
  const totalPages = Math.ceil(total / perPage);
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
      <span className="text-xs text-gray-500 font-600">
        {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} / {total} ta
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          className="w-7 h-7 rounded-md border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={13} />
        </button>
        {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
          const p = i + 1;
          return (
            <button
              key={p}
              onClick={() => onChange(p)}
              className={`w-7 h-7 rounded-md text-xs font-700 transition-colors ${p === page ? 'bg-primary text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              {p}
            </button>
          );
        })}
        <button
          onClick={() => onChange(page + 1)}
          disabled={page === totalPages}
          className="w-7 h-7 rounded-md border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
}

// ── STAT CARD ────────────────────────────────────────
export function StatCard({ icon, label, value, color = '#7C3AED', sub }) {
  return (
    <div className="card p-4 flex flex-col items-center text-center gap-1 hover:shadow-md transition-shadow">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-1" style={{ background: color + '18' }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <p className="text-xs font-700 text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-900 text-gray-800">{value ?? 0}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

// ── PAGE HEADER ──────────────────────────────────────
export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div>
        <h1 className="text-xl font-800 text-gray-800">{title}</h1>
        {subtitle && <p className="text-sm text-gray-400 font-500 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

// ── EMPTY STATE ──────────────────────────────────────
export function Empty({ icon, text }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-gray-400">
      <div className="text-4xl mb-3">{icon || '📭'}</div>
      <p className="text-sm font-600">{text || 'Ma\'lumot topilmadi'}</p>
    </div>
  );
}

// ── SEARCH INPUT ─────────────────────────────────────
export function SearchInput({ value, onChange, placeholder = 'Qidirish...' }) {
  return (
    <div className="relative">
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-primary transition-colors bg-gray-50 font-500 text-gray-700 placeholder-gray-400"
      />
      <svg className="absolute left-2.5 top-2.5 text-gray-400" width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" strokeLinecap="round" />
      </svg>
    </div>
  );
}

// ── TOGGLE SWITCH ────────────────────────────────────
export function Toggle({ value, onChange }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`w-9 h-5 rounded-full transition-colors duration-200 relative flex-shrink-0 ${value ? 'bg-primary' : 'bg-gray-300'}`}
    >
      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${value ? 'left-4' : 'left-0.5'}`} />
    </button>
  );
}

export function TabBar({ tabs, active, onChange }) {
  return (
    <div className="px-4 pt-4 border-b border-gray-100 flex gap-2 overflow-x-auto">
      {tabs.map(tab => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={`px-3 py-1.5 rounded-t-lg text-xs font-700 whitespace-nowrap border-b-2 transition-colors ${active === tab ? 'text-primary border-primary' : 'text-gray-500 border-transparent hover:text-gray-700'}`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
