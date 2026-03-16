import React, { useEffect, useState, useRef } from 'react';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { coursesAPI, roomsAPI, usersAPI } from '../../services/api';
import { PageHeader, Drawer, Field, Input, Select, Dialog, Empty } from '../../components/UI';
import dayjs from 'dayjs';

// ── Sana formatlash ───────────────────────────────────────
function formatDate(v) {
  if (!v) return '—';
  const d = dayjs(v);
  return d.isValid() ? d.format('DD.MM.YYYY') : '—';
}
function toInputDate(v) {
  if (!v) return '';
  const d = dayjs(v);
  return d.isValid() ? d.format('YYYY-MM-DD') : '';
}

// ─── KURSLAR ─────────────────────────────────────────────
function Kurslar() {
  const [courses, setCourses] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState({
    name: '', durationMonth: '', durationLesson: '',
    status: 'ACTIVE', level: 'BEGINNER', price: '', description: '', color: '#7C3AED'
  });

  const COLORS = ['#7C3AED','#e53e3e','#e67e22','#f39c12','#27ae60','#16a085','#2980b9','#8e44ad','#c0392b','#e91e63','#1E1B2E','#000'];

  const load = async () => {
    try { setCourses((await coursesAPI.getAll()).data || []); } catch {}
  };
  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditItem(null);
    setForm({ name:'', durationMonth:'', durationLesson:'', status:'ACTIVE', level:'BEGINNER', price:'', description:'', color:'#7C3AED' });
    setDrawerOpen(true);
  };
  const openEdit = c => {
    setEditItem(c);
    setForm({
      name: c.name || '',
      durationMonth: c.durationMonth || '',
      durationLesson: c.durationLesson || '',
      status: c.status || 'ACTIVE',
      level: c.level || 'BEGINNER',
      price: c.price || '',
      description: c.description || '',
      color: c.color || '#7C3AED',
    });
    setDrawerOpen(true);
  };

  const handleSave = async () => {
    try {
      const data = {
        ...form,
        durationMonth: Number(form.durationMonth),
        durationLesson: Number(form.durationLesson),
        price: Number(form.price),
      };
      if (editItem) { await coursesAPI.update(editItem.id, data); toast.success('Yangilandi'); }
      else { await coursesAPI.create(data); toast.success("Kurs qo'shildi"); }
      setDrawerOpen(false); load();
    } catch (e) { toast.error(e.response?.data?.message || 'Xatolik'); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-800 text-gray-800">Kurslar <span className="text-gray-400 font-500 text-sm">({courses.length})</span></h3>
        <button onClick={openAdd} className="btn-primary text-xs"><Plus size={13}/> Kurs qo'shish</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        {courses.map(c => (
          <div key={c.id} className="card p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                {c.color && <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: c.color }}/>}
                <h4 className="font-800 text-gray-800 text-sm">{c.name}</h4>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(c)} className="w-6 h-6 rounded-md bg-blue-50 text-blue-400 hover:bg-blue-100 flex items-center justify-center"><Edit2 size={11}/></button>
                <button onClick={() => setDeleteId(c.id)} className="w-6 h-6 rounded-md bg-red-50 text-red-400 hover:bg-red-100 flex items-center justify-center"><Trash2 size={11}/></button>
              </div>
            </div>
            {c.description && <p className="text-xs text-gray-400 mb-3 font-500 line-clamp-2">{c.description}</p>}
            <div className="flex flex-wrap gap-1.5">
              <span className="badge badge-gray">{c.durationLesson} min</span>
              <span className="badge badge-gray">{c.durationMonth} oy</span>
              <span className="badge badge-blue">{Number(c.price).toLocaleString()} so'm</span>
            </div>
          </div>
        ))}
        {courses.length === 0 && <div className="col-span-3"><Empty text="Kurslar topilmadi"/></div>}
      </div>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={editItem ? 'Kursni tahrirlash' : "Kurs qo'shish"}>
        <Field label="Nomi" required><Input placeholder="Kurs nomi" value={form.name} onChange={e => setForm({...form, name: e.target.value})}/></Field>
        <Field label="Kurs kategoriyasi">
          <Select value={form.level} onChange={e => setForm({...form, level: e.target.value})}>
            <option value="">Tanlang</option>
            <option value="BEGINNER">Boshlang'ich</option>
            <option value="INTERMEDIATE">O'rta</option>
            <option value="ADVANCED">Yuqori</option>
          </Select>
        </Field>
        <Field label="Dars davomiyligi (min)">
          <Select value={form.durationLesson} onChange={e => setForm({...form, durationLesson: e.target.value})}>
            <option value="">Tanlang</option>
            {[60,75,90,120].map(m => <option key={m} value={m}>{m} min</option>)}
          </Select>
        </Field>
        <Field label="Kurs davomiyligi (oy)">
          <Select value={form.durationMonth} onChange={e => setForm({...form, durationMonth: e.target.value})}>
            <option value="">Tanlang</option>
            {[3,6,9,12].map(m => <option key={m} value={m}>{m} oy</option>)}
          </Select>
        </Field>
        <Field label="Narx"><Input type="number" placeholder="250000" value={form.price} onChange={e => setForm({...form, price: e.target.value})}/></Field>
        <Field label="Tavsif">
          <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})}
            placeholder="Kurs haqida..." rows={3}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-primary resize-none font-500"/>
        </Field>
        <Field label="Rangi">
          <div className="flex gap-2 flex-wrap">
            {COLORS.map(c => (
              <button key={c} onClick={() => setForm({...form, color: c})}
                className={`w-7 h-7 rounded-full border-2 transition-all ${form.color === c ? 'border-gray-500 scale-110' : 'border-gray-200'}`}
                style={{ background: c }}/>
            ))}
          </div>
        </Field>
        <div className="flex gap-3 pt-2">
          <button onClick={() => setDrawerOpen(false)} className="btn-secondary flex-1 justify-center">Bekor qilish</button>
          <button onClick={handleSave} className="btn-primary flex-1 justify-center">Saqlash</button>
        </div>
      </Drawer>

      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)} title="Kursni o'chirish"
        description="Bu kursni o'chirishni tasdiqlaysizmi?"
        onConfirm={async () => { await coursesAPI.delete(deleteId); load(); setDeleteId(null); toast.success("O'chirildi"); }}/>
    </div>
  );
}

// ─── XONALAR ─────────────────────────────────────────────
function Xonalar() {
  const [rooms, setRooms] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState({ name: '', capacity: '' });

  const load = async () => {
    try { setRooms((await roomsAPI.getAll()).data || []); } catch {}
  };
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditItem(null); setForm({ name:'', capacity:'' }); setDrawerOpen(true); };
  const openEdit = r => { setEditItem(r); setForm({ name: r.name || '', capacity: r.capacity || '' }); setDrawerOpen(true); };

  const handleSave = async () => {
    try {
      const data = { ...form, capacity: Number(form.capacity) };
      if (editItem) { await roomsAPI.update(editItem.id, data); toast.success('Yangilandi'); }
      else { await roomsAPI.create(data); toast.success("Xona qo'shildi"); }
      setDrawerOpen(false); load();
    } catch (e) { toast.error(e.response?.data?.message || 'Xatolik'); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-800 text-gray-800">Xonalar <span className="text-gray-400 font-500 text-sm">({rooms.length})</span></h3>
        <button onClick={openAdd} className="btn-primary text-xs"><Plus size={13}/> Xonani qo'shish</button>
      </div>

      <div className="card overflow-hidden">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 divide-x divide-y divide-gray-100">
          {rooms.map(r => (
            <div key={r.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-800 text-gray-800 text-sm">{r.name}</p>
                  <p className="text-xs text-gray-400 font-600 mt-0.5">Sig'imi: {r.capacity}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(r)} className="w-6 h-6 rounded-md bg-blue-50 text-blue-400 hover:bg-blue-100 flex items-center justify-center"><Edit2 size={11}/></button>
                  <button onClick={() => setDeleteId(r.id)} className="w-6 h-6 rounded-md bg-red-50 text-red-400 hover:bg-red-100 flex items-center justify-center"><Trash2 size={11}/></button>
                </div>
              </div>
            </div>
          ))}
          {rooms.length === 0 && <div className="col-span-4 py-10 text-center text-sm text-gray-400">Xonalar topilmadi</div>}
        </div>
      </div>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={editItem ? 'Xonani tahrirlash' : "Xonani qo'shish"}>
        <Field label="Nomi" required><Input placeholder="Xona nomi" value={form.name} onChange={e => setForm({...form, name: e.target.value})}/></Field>
        <Field label="Sig'imi" required><Input type="number" placeholder="20" value={form.capacity} onChange={e => setForm({...form, capacity: e.target.value})}/></Field>
        <div className="flex gap-3 pt-2">
          <button onClick={() => setDrawerOpen(false)} className="btn-secondary flex-1 justify-center">Bekor qilish</button>
          <button onClick={handleSave} className="btn-primary flex-1 justify-center">Saqlash</button>
        </div>
      </Drawer>

      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)} title="Xonani o'chirish"
        description="Bu xonani o'chirishni tasdiqlaysizmi?"
        onConfirm={async () => { await roomsAPI.delete(deleteId); load(); setDeleteId(null); toast.success("O'chirildi"); }}/>
    </div>
  );
}

// ─── XODIMLAR ─────────────────────────────────────────────
function Xodimlar() {
  const [users, setUsers]       = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [loading, setLoading]   = useState(false);
  const fileRef = useRef(null);
  const [form, setForm] = useState({
    fullName: '', email: '', position: '', hire_date: '', role: 'ADMIN', address: ''
  });

  const load = async () => {
    try { setUsers((await usersAPI.getAll()).data || []); } catch {}
  };
  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditItem(null);
    setForm({ fullName:'', email:'', position:'', hire_date:'', role:'ADMIN', address:'' });
    setPhotoFile(null); setPhotoPreview(null);
    setDrawerOpen(true);
  };
  const openEdit = u => {
    setEditItem(u);
    setForm({
      fullName: u.fullName || '',
      email: u.email || '',
      position: u.position || '',
      // ✅ ISO formatdan YYYY-MM-DD ga convert
      hire_date: toInputDate(u.hire_date || u.hireDate),
      role: u.role || 'ADMIN',
      address: u.address || '',
    });
    setPhotoFile(null);
    setPhotoPreview(u.photo || null);
    setDrawerOpen(true);
  };

  const onPickPhoto = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Faqat rasm fayli'); return; }
    setPhotoFile(file);
    // Preview
    const reader = new FileReader();
    reader.onload = ev => setPhotoPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // hire_date ni ISO dan clean qilish
      const payload = {
        ...form,
        hire_date: form.hire_date ? dayjs(form.hire_date).format('YYYY-MM-DD') : undefined,
      };

      if (editItem) {
        await usersAPI.update(editItem.id, payload);
        if (photoFile) {
          const fd = new FormData();
          fd.append('photo', photoFile);
          await usersAPI.uploadPhoto(editItem.id, fd);
        }
        toast.success('Yangilandi');
      } else {
        const created = await usersAPI.register(payload);
        const uid = created?.data?.id || created?.data?.user?.id;
        if (photoFile && uid) {
          const fd = new FormData();
          fd.append('photo', photoFile);
          await usersAPI.uploadPhoto(uid, fd);
        }
        toast.success("Xodim qo'shildi");
      }
      setDrawerOpen(false); load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Xatolik');
    } finally { setLoading(false); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-800 text-gray-800">Xodimlar <span className="text-gray-400 font-500 text-sm">({users.length})</span></h3>
        <button onClick={openAdd} className="btn-primary text-xs"><Plus size={13}/> Xodim qo'shish</button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr>
              {['#', 'Nomi', 'Lavozim', 'Email', "Tug'ilgan kun", 'Yaratilgan sana', 'Amallar'].map(h => (
                <th key={h} className="table-header first:pl-4 last:pr-4">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="table-cell pl-4 text-gray-400 font-700 text-xs">{i+1}</td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      {u.photo
                        ? <img src={u.photo} alt={u.fullName} className="w-7 h-7 rounded-full object-cover flex-shrink-0"/>
                        : <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-xs font-700 flex-shrink-0">{u.fullName?.[0]}</div>
                      }
                      <div>
                        <p className="font-700 text-gray-800 text-sm">{u.fullName}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <span className="badge badge-purple">{u.role || u.position}</span>
                  </td>
                  <td className="table-cell text-xs text-gray-500">{u.email}</td>
                  {/* ✅ Sana to'g'ri formatda */}
                  <td className="table-cell text-xs text-gray-400">{formatDate(u.hire_date || u.hireDate)}</td>
                  <td className="table-cell text-xs text-gray-400">{formatDate(u.createdAt || u.created_at)}</td>
                  <td className="table-cell pr-4">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => openEdit(u)} className="w-6 h-6 rounded-md bg-blue-50 text-blue-400 hover:bg-blue-100 flex items-center justify-center"><Edit2 size={11}/></button>
                      <button onClick={() => setDeleteId(u.id)} className="w-6 h-6 rounded-md bg-red-50 text-red-400 hover:bg-red-100 flex items-center justify-center"><Trash2 size={11}/></button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && <tr><td colSpan={7}><Empty text="Xodimlar topilmadi"/></td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}
        title={editItem ? 'Xodimni tahrirlash' : "Yangi Xodim qo'shish"}>
        {!editItem && <p className="text-xs text-gray-400 -mt-2 mb-2 font-500">Yangi xodimni qo'shishingiz mumkin.</p>}

        <Field label="FIO" required>
          <Input placeholder="Ism Familiya" value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})}/>
        </Field>
        <Field label="Email" required>
          <Input type="email" placeholder="admin@gmail.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})}/>
        </Field>
        
        <Field label="Lavozim (Role)" required>
          <Select value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
            <option value="">Tanlang</option>
            <option value="ADMIN">Admin</option>
            <option value="ADMINSTRATOR">Administrator</option>
            <option value="MANAGEMENT">Management</option>
          </Select>
        </Field>
        <Field label="Tug'ilgan kun">
          {/* ✅ value da ISO emas, YYYY-MM-DD */}
          <Input type="date" value={form.hire_date} onChange={e => setForm({...form, hire_date: e.target.value})}/>
        </Field>
        <Field label="Manzil">
          <Input placeholder="Shahar, tuman" value={form.address} onChange={e => setForm({...form, address: e.target.value})}/>
        </Field>

        {/* ✅ Surat yuklash — ishlaydi */}
        <Field label="Surati">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickPhoto}/>
          <div onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center hover:border-primary/50 transition-colors cursor-pointer">
            {photoPreview ? (
              <div className="flex flex-col items-center gap-2">
                <img src={photoPreview} alt="preview" className="w-16 h-16 rounded-full object-cover"/>
                <p className="text-xs text-primary font-700">Rasm tanlandi ✓</p>
                <p className="text-xs text-gray-400">O'zgartirish uchun bosing</p>
              </div>
            ) : (
              <>
                <div className="text-2xl mb-1">☁️</div>
                <p className="text-xs font-700 text-gray-600">Rasm tanlash uchun bosing</p>
                <p className="text-xs text-gray-400 mt-0.5">JPG yoki PNG (max. 800x800px)</p>
              </>
            )}
          </div>
        </Field>

        <div className="flex gap-3 pt-2">
          <button onClick={() => setDrawerOpen(false)} className="btn-secondary flex-1 justify-center">Bekor qilish</button>
          <button onClick={handleSave} disabled={loading} className="btn-primary flex-1 justify-center">
            {loading ? 'Saqlanmoqda...' : 'Saqlash'}
          </button>
        </div>
      </Drawer>

      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)} title="Xodimni o'chirish"
        description="Bu xodimni o'chirishni tasdiqlaysizmi?"
        onConfirm={async () => { await usersAPI.delete(deleteId); load(); setDeleteId(null); toast.success("O'chirildi"); }}/>
    </div>
  );
}

// ─── MAIN ────────────────────────────────────────────────
const TABS = ['Kurslar', 'Xonalar', 'Xodimlar'];

export default function Manage() {
  const [activeTab, setActiveTab] = useState('Kurslar');

  return (
    <div className="fade-in">
      <PageHeader title="Boshqarish"/>
      <div className="card overflow-hidden">
        <div className="flex overflow-x-auto border-b border-gray-100 px-4">
          {TABS.map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`px-4 py-3 text-xs font-700 whitespace-nowrap border-b-2 transition-colors ${activeTab === t ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
              {t}
            </button>
          ))}
        </div>
        <div className="p-5">
          {activeTab === 'Kurslar'  && <Kurslar/>}
          {activeTab === 'Xonalar'  && <Xonalar/>}
          {activeTab === 'Xodimlar' && <Xodimlar/>}
        </div>
      </div>
    </div>
  );
}
