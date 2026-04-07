import { X, ChevronLeft, ChevronRight } from 'lucide-react';

// ── MODAL ──────────────────────────────────────────────
export function Modal({ open, onClose, title, children, width = 'max-w-lg' }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] dark:bg-black/40" />
      <div
        className={`relative h-full bg-white dark:bg-[#12121A] shadow-2xl overflow-y-auto slide-in ${width} w-full`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/5 sticky top-0 bg-white dark:bg-[#12121A] z-10">
          <h2 className="font-800 text-gray-800 dark:text-gray-100 text-base">{title}</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-md hover:bg-gray-100 dark:hover:bg-white/5 flex items-center justify-center text-gray-500">
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
      <div className="absolute inset-0 bg-black/25 backdrop-blur-[1px] dark:bg-black/50" />
      <div
        className="absolute right-0 top-0 h-full w-[400px] bg-white dark:bg-[#12121A] shadow-2xl overflow-y-auto slide-in border-l border-white/5"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/5 bg-white dark:bg-[#12121A] sticky top-0 z-10">
          <h2 className="font-800 text-gray-800 dark:text-gray-100 text-base">{title}</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-md hover:bg-gray-100 dark:hover:bg-white/5 flex items-center justify-center text-gray-500">
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
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] dark:bg-black/60" />
      <div className="relative bg-white dark:bg-[#171722] rounded-2xl shadow-2xl p-6 w-[340px] border border-gray-100 dark:border-white/5 fade-in" onClick={e => e.stopPropagation()}>
        <h3 className="font-800 text-gray-800 dark:text-gray-100 mb-2">{title}</h3>
        {description && <p className="text-sm text-gray-500 dark:text-gray-400 mb-5 font-500">{description}</p>}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
            Bekor
          </button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-800 text-white shadow-lg transition-all active:scale-95 ${danger ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' : 'bg-primary hover:bg-primary-dark shadow-primary/20'}`}
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
    <div className="space-y-1.5">
      <label className="block text-[11px] font-800 text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">
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
      className={`w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a2e] text-sm text-gray-800 dark:text-gray-100 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all placeholder-gray-400 dark:placeholder-gray-600 font-600 shadow-sm ${props.className || ''}`}
    />
  );
}

export function Select({ children, ...props }) {
  return (
    <select
      {...props}
      className={`w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a2e] text-sm text-gray-800 dark:text-gray-100 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-600 shadow-sm ${props.className || ''}`}
    >
      {children}
    </select>
  );
}

export function Textarea({ ...props }) {
  return (
    <textarea
      {...props}
      className={`w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a2e] text-sm text-gray-800 dark:text-gray-100 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all placeholder-gray-400 dark:placeholder-gray-600 resize-none font-600 shadow-sm ${props.className || ''}`}
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
export function Avatar({ name, photo, size = 'md', className = '' }) {
  const sz = { 
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-7 h-7 text-xs', 
    md: 'w-9 h-9 text-sm', 
    lg: 'w-12 h-12 text-base',
    xl: 'w-24 h-24 text-2xl'
  }[size] || size;
  
  // Use a default user avatar if no photo is provided
  // A generic user icon from flaticon or similar
  const defaultPhoto = `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=0D8ABC&color=fff&rounded=true&font-size=0.4`;
  // Actually, the user asked NOT to see letters. So we use a generic silhouette.
  const silhouette = `https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png`;

  // Handle relative image paths from the backend
  let photoUrl = photo;
  if (photoUrl && !photoUrl.startsWith('http') && !photoUrl.startsWith('data:') && !photoUrl.startsWith('/')) {
    photoUrl = `http://localhost:4000/uploads/${photoUrl}`;
  }

  const imgSrc = photoUrl || silhouette;

  return (
    <img 
      src={imgSrc} 
      alt={name || 'User'} 
      className={`${sz} rounded-full object-cover flex-shrink-0 ${className} ring-1 ring-black/5 dark:ring-white/10`} 
      onError={(e) => { e.target.src = silhouette; }}
    />
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
    <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 dark:border-white/5">
      <span className="text-xs text-gray-400 dark:text-gray-500 font-700 uppercase tracking-wider">
        {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} / {total}
      </span>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          className="w-8 h-8 rounded-lg border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={14} />
        </button>
        {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
          const p = i + 1;
          return (
            <button
              key={p}
              onClick={() => onChange(p)}
              className={`w-8 h-8 rounded-lg text-xs font-800 transition-all ${p === page ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'}`}
            >
              {p}
            </button>
          );
        })}
        <button
          onClick={() => onChange(page + 1)}
          disabled={page === totalPages}
          className="w-8 h-8 rounded-lg border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

// ── STAT CARD ────────────────────────────────────────
export function StatCard({ icon, label, value, color = '#7C3AED', sub }) {
  return (
    <div className="card p-4 flex flex-col items-center text-center gap-1 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-2 shadow-sm" style={{ background: color + '18' }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <p className="text-[10px] font-800 text-gray-400 dark:text-gray-500 uppercase tracking-widest">{label}</p>
      <p className="text-2xl font-900 text-gray-800 dark:text-white">{value ?? 0}</p>
      {sub && <p className="text-[11px] text-gray-400 dark:text-gray-500 font-600">{sub}</p>}
    </div>
  );
}

// ── PAGE HEADER ──────────────────────────────────────
export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-900 text-gray-800 dark:text-white tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-gray-400 dark:text-gray-500 font-600 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
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
    <div className="relative group">
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm outline-none focus:border-primary transition-all bg-gray-50 dark:bg-white/5 font-700 text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600"
      />
      <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-primary" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" strokeLinecap="round" />
      </svg>
    </div>
  );
}

// ── TOGGLE SWITCH ────────────────────────────────────
export function Toggle({ value, onChange, disabled }) {
  return (
    <button
      disabled={disabled}
      onClick={() => onChange(!value)}
      className={`w-10 h-6 rounded-full transition-all duration-300 relative flex-shrink-0 shadow-inner ${value ? 'bg-primary' : 'bg-gray-300 dark:bg-white/10'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-lg transition-all duration-300 ease-out ${value ? 'left-5' : 'left-1'}`} />
    </button>
  );
}

export function TabBar({ tabs, active, onChange }) {
  return (
    <div className="px-5 pt-5 border-b border-gray-100 dark:border-white/5 flex gap-4 overflow-x-auto scrollbar-hide">
      {tabs.map(tab => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={`px-1 pb-3 text-xs font-800 uppercase tracking-wider whitespace-nowrap border-b-2 transition-all duration-200 ${active === tab ? 'text-primary border-primary' : 'text-gray-400 border-transparent hover:text-gray-600 dark:hover:text-gray-300'}`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
