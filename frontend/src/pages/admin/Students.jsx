import React, { useEffect, useState, useMemo, useRef } from 'react';
import dayjs from 'dayjs';
import { Plus, Trash2, Edit2, ChevronRight, BookOpen, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { studentsAPI, groupsAPI, coursesAPI } from '../../services/api';
import {
  PageHeader, Avatar, Pagination,
  Drawer, Field, Input, Select, SearchInput, Dialog, Empty,
} from '../../components/UI';

const PER_PAGE = 10;
const defaultForm = { fullName: '', email: '', birth_date: '', courseId: '', groupId: '' };

function toDateInputValue(v) {
  if (!v) return '';
  const d = dayjs(v);
  return d.isValid() ? d.format('YYYY-MM-DD') : '';
}
function formatDate(v) {
  if (!v) return '—';
  const d = dayjs(v);
  return d.isValid() ? d.format('DD.MM.YYYY') : '—';
}

export default function Students() {
  const [students, setStudents]   = useState([]);
  const [groups, setGroups]       = useState([]);
  const [courses, setCourses]     = useState([]);
  const [view, setView]           = useState('courses');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedGroup, setSelectedGroup]   = useState(null);
  const [groupStudents, setGroupStudents]   = useState([]);
  const [search, setSearch]       = useState('');
  const [page, setPage]           = useState(1);
  const [tab, setTab]             = useState('active');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editItem, setEditItem]   = useState(null);
  const [form, setForm]           = useState(defaultForm);
  const [photoFile, setPhotoFile] = useState(null);
  const [deleteId, setDeleteId]   = useState(null);
  const [loading, setLoading]     = useState(false);
  const fileRef = useRef(null);

  const load = async () => {
    try {
      const [s, g, c] = await Promise.all([
        studentsAPI.getAll(),
        groupsAPI.getAll(),
        coursesAPI.getAll(),
      ]);
      console.log('STUDENTS:', s.data);
      setStudents(s.data || []);
      setGroups(g.data || []);
      setCourses(c.data || []);
    } catch { toast.error('Xatolik yuz berdi'); }
  };
  useEffect(() => { load(); }, []);

  const courseGroups = useMemo(() => {
    if (!selectedCourse) return [];
    return groups.filter(g =>
      String(g.course?.id ?? g.courseId) === String(selectedCourse.id)
    );
  }, [groups, selectedCourse]);

  const openCourse = course => {
    setSelectedCourse(course);
    setSelectedGroup(null);
    setGroupStudents([]);
    setView('groups');
  };

  const openGroup = async group => {
    setSelectedGroup(group);
    try {
      const r = await groupsAPI.getStudents(group.id);
      const list = (r.data || []).map(item =>
      item.student ? { ...item.student, groupStudentId: item.id,created_at: item.created_at } : item
    );
    setGroupStudents(list);
    } catch { setGroupStudents([]); }
    setView('students');
  };

  const allFiltered = useMemo(() => {
    let list = students.filter(s =>
      tab === 'active' ? s.status !== 'INACTIVE' : s.status === 'INACTIVE'
    );
    if (search) list = list.filter(s =>
      s.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase())
    );
    return list;
  }, [students, search, tab]);

  const paginated = allFiltered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const openAdd = () => { setEditItem(null); setForm(defaultForm); setPhotoFile(null); setDrawerOpen(true); };
  const openEdit = s => {
    setEditItem(s);
    setForm({ fullName: s.fullName || '', email: s.email || '', birth_date: toDateInputValue(s.birth_date), courseId: '', groupId: '' });
    setPhotoFile(null);
    setDrawerOpen(true);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload = { fullName: form.fullName, email: form.email, birth_date: form.birth_date };
      if (editItem) {
        await studentsAPI.update(editItem.id, payload);
        if (photoFile) { const fd = new FormData(); fd.append('photo', photoFile); await studentsAPI.uploadPhoto(editItem.id, fd); }
        toast.success('Yangilandi');
      } else {
        const created = await studentsAPI.create(payload);
        const sid = created?.data?.id || created?.data?.student?.id;
        if (photoFile && sid) { const fd = new FormData(); fd.append('photo', photoFile); await studentsAPI.uploadPhoto(sid, fd); }
        if (form.groupId && sid) { try { await groupsAPI.addStudent(Number(form.groupId), { studentId: sid }); } catch {} }
        toast.success("Talaba qo'shildi");
      }
      setDrawerOpen(false); load();
      if (selectedGroup) { const r = await groupsAPI.getStudents(selectedGroup.id); setGroupStudents(r.data || []); }
    } catch (e) { toast.error(e.response?.data?.message || 'Xatolik'); }
    finally { setLoading(false); }
  };

  const handleDelete = async () => {
    try {
      await studentsAPI.delete(deleteId); toast.success("O'chirildi"); load();
      if (selectedGroup) { const r = await groupsAPI.getStudents(selectedGroup.id); setGroupStudents(r.data || []); }
    } catch { toast.error('Xatolik'); }
  };

  const onPickPhoto = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Faqat rasm fayli'); return; }
    setPhotoFile(file);
  };

  const DAYS_UZ = { MONDAY:'Du', TUESDAY:'Se', WEDNESDAY:'Ch', THURSDAY:'Pa', FRIDAY:'Ju', SATURDAY:'Sh', SUNDAY:'Ya' };

  const Breadcrumb = () => (
    <div className="flex items-center gap-1.5 text-xs font-700 text-gray-400 mb-4 flex-wrap">
      <button onClick={() => { setView('courses'); setSelectedCourse(null); setSelectedGroup(null); }}
        className={`hover:text-primary transition-colors ${view === 'courses' ? 'text-primary' : ''}`}>
        Kurslar
      </button>
      {selectedCourse && (
        <><ChevronRight size={12} className="text-gray-300"/>
        <button onClick={() => { setView('groups'); setSelectedGroup(null); }}
          className={`hover:text-primary transition-colors ${view === 'groups' ? 'text-primary' : ''}`}>
          {selectedCourse.name}
        </button></>
      )}
      {selectedGroup && (
        <><ChevronRight size={12} className="text-gray-300"/>
        <span className="text-primary">{selectedGroup.name}</span></>
      )}
      <div className="ml-auto">
        <button onClick={() => { setView('all'); setSearch(''); setPage(1); }}
          className={`px-2.5 py-1 rounded-lg text-xs font-700 transition-colors ${view === 'all' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
          Barcha talabalar
        </button>
      </div>
    </div>
  );

  const drawerProps = { drawerOpen, setDrawerOpen, editItem, form, setForm, photoFile, fileRef, onPickPhoto, handleSave, loading, courses, groups };
  const dialogEl = <Dialog open={!!deleteId} onClose={() => setDeleteId(null)} title="Talabani o'chirish" description="Haqiqatan ham bu talabani o'chirmoqchimisiz?" onConfirm={handleDelete}/>;

  // ── VIEW: COURSES ──
  if (view === 'courses') return (
    <div className="fade-in">
      <PageHeader title="Talabalar boshqaruvi" subtitle="Kursni tanlab guruhlarga o'ting"
        actions={<button className="btn-primary py-2.5 px-6 text-xs font-900 uppercase tracking-widest shadow-lg shadow-primary/25" onClick={openAdd}><Plus size={14}/> Talaba qo'shish</button>}/>
      <Breadcrumb/>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {courses.map(c => {
          const cg = groups.filter(g => String(g.course?.id ?? g.courseId) === String(c.id));
          return (
            <div key={c.id} onClick={() => openCourse(c)}
              className="card p-5 cursor-pointer hover:shadow-2xl hover:-translate-y-1.5 transition-all group relative overflow-hidden">
              <div className="flex items-start justify-between mb-5 relative z-10">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner" style={{ background: (c.color || '#7C3AED') + '10' }}>
                  <BookOpen size={22} style={{ color: c.color || '#7C3AED' }}/>
                </div>
                <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                   <ChevronRight size={16} className="text-primary"/>
                </div>
              </div>
              <p className="font-900 text-gray-800 dark:text-gray-100 text-base mb-3 leading-tight uppercase tracking-tight">{c.name}</p>
              <div className="flex items-center gap-4 relative z-10">
                <span className="flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-gray-500 font-800 uppercase tracking-widest"><Users size={12}/> {cg.length} guruh</span>
                <span className="w-1 h-1 rounded-full bg-gray-200 dark:bg-white/10" />
                <span className="text-[11px] text-gray-400 dark:text-gray-500 font-800 uppercase tracking-widest">{c.durationMonth || '—'} OY KURS</span>
              </div>
              {c.price && <p className="text-sm font-900 text-primary mt-4 tracking-tighter">{Number(c.price).toLocaleString()} SO'M</p>}
              <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full transition-all group-hover:scale-150" style={{ background: (c.color || '#7C3AED') + '05' }} />
            </div>
          );
        })}
        {courses.length === 0 && <div className="col-span-4 card py-20"><Empty icon="📚" text="Kurslar topilmadi"/></div>}
      </div>
      <DrawerForm {...drawerProps}/>{dialogEl}
    </div>
  );

  // ── VIEW: GROUPS ──
  if (view === 'groups') return (
    <div className="fade-in">
      <PageHeader title={selectedCourse?.name || 'Guruhlar'} subtitle={`${courseGroups.length} ta mavjud guruhlar`}
        actions={<button className="btn-primary py-2.5 px-6 text-xs font-900 uppercase tracking-widest shadow-lg shadow-primary/25" onClick={openAdd}><Plus size={14}/> Talaba qo'shish</button>}/>
      <Breadcrumb/>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {courseGroups.map(g => (
          <div key={g.id} onClick={() => openGroup(g)}
            className="card p-6 cursor-pointer hover:shadow-2xl hover:-translate-y-1.5 transition-all group">
            <div className="flex items-start justify-between mb-5">
              <div className="w-12 h-12 rounded-2xl bg-primary/5 dark:bg-primary/20 flex items-center justify-center text-primary transition-transform group-hover:rotate-6">
                <Users size={22}/>
              </div>
              <div className="flex items-center gap-2">
                <span className="badge badge-green px-3">ACTIVE</span>
                <div className="w-7 h-7 rounded-lg bg-gray-50 dark:bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                  <ChevronRight size={14} className="text-primary"/>
                </div>
              </div>
            </div>
            <p className="font-900 text-gray-800 dark:text-gray-100 text-base mb-4 uppercase tracking-tight">{g.name}</p>
            <div className="space-y-2.5 p-3 bg-gray-50/50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
              {g.startTime && <p className="text-[11px] text-gray-400 dark:text-gray-500 font-800 uppercase tracking-widest flex items-center gap-2"><span className="text-primary opacity-60">⏰</span> {g.startTime}</p>}
              {g.weekDays?.length > 0 && <p className="text-[11px] text-gray-400 dark:text-gray-500 font-800 uppercase tracking-widest flex items-center gap-2"><span className="text-primary opacity-60">📅</span> {g.weekDays.map(d => DAYS_UZ[d] || d).join(', ')}</p>}
              {g.startDate && <p className="text-[11px] text-gray-400 dark:text-gray-500 font-800 uppercase tracking-widest flex items-center gap-2"><span className="text-primary opacity-60">🗓</span> {formatDate(g.startDate)} → {formatDate(g.endDate) || '...'}</p>}
            </div>
          </div>
        ))}
        {courseGroups.length === 0 && <div className="col-span-3 card py-20"><Empty icon="👥" text="Bu kursda guruhlar topilmadi"/></div>}
      </div>
      <DrawerForm {...drawerProps}/>{dialogEl}
    </div>
  );

  // ── VIEW: STUDENTS (guruh ichida) ──
  if (view === 'students') return (
    <div className="fade-in">
      <PageHeader title={selectedGroup?.name || 'Talabalar'} subtitle={`${groupStudents.length} ta guruhdagi talabalar`}
        actions={<button className="btn-primary py-2.5 px-6 text-xs font-900 uppercase tracking-widest shadow-lg shadow-primary/25" onClick={openAdd}><Plus size={14}/> Talaba qo'shish</button>}/>
      <Breadcrumb/>
      <div className="card overflow-hidden shadow-xl shadow-primary/5">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full">
            <thead><tr>
              {['#','To\'liq ism','Email manzili',"Tug'ilgan sana",'Qo\'shilgan sana','Amallar'].map(h => (
                <th key={h} className="table-header first:pl-6 last:pr-6">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {groupStudents.length === 0
                ? <tr><td colSpan={6}><Empty icon="🎓" text="Bu guruhda talabalar topilmadi"/></td></tr>
                : groupStudents.map((s, i) => (
                <tr key={s.id} className="hover:bg-gray-50/60 dark:hover:bg-white/5 transition-all">
                  <td className="table-cell pl-6 text-gray-400 font-900 text-[10px]">#{i + 1}</td>
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <Avatar name={s.fullName} photo={s.photo} size="md" className="ring-2 ring-white dark:ring-gray-800 shadow-sm"/>
                      <div>
                        <p className="font-800 text-gray-800 dark:text-gray-100 text-sm leading-none mb-1">{s.fullName}</p>
                        {s.phone && <p className="text-[11px] text-gray-400 dark:text-gray-500 font-700 uppercase tracking-tighter">{s.phone}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="table-cell text-xs font-700 text-gray-500 dark:text-gray-400">{s.email || '—'}</td>
                  <td className="table-cell text-[11px] text-gray-400 dark:text-gray-500 font-800 uppercase tracking-widest">{formatDate(s.birth_date)}</td>
                  <td className="table-cell text-[11px] text-gray-400 dark:text-gray-500 font-800 uppercase tracking-widest">{formatDate(s.createdAt || s.created_at)}</td>
                  <td className="table-cell pr-6">
                    <div className="flex items-center gap-1.5 justify-end">
                      <button onClick={() => openEdit(s)} className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-all flex items-center justify-center shadow-sm"><Edit2 size={13}/></button>
                      <button onClick={() => setDeleteId(s.id)} className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-900/10 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center shadow-sm"><Trash2 size={13}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <DrawerForm {...drawerProps}/>{dialogEl}
    </div>
  );

  // ── VIEW: ALL ──
  return (
    <div className="fade-in">
      <PageHeader title="Talabalar bazasi" subtitle={`${allFiltered.length} ta umumiy talabalar ro'yxati`}
        actions={<button className="btn-primary py-2.5 px-6 text-xs font-900 uppercase tracking-widest shadow-lg shadow-primary/25" onClick={openAdd}><Plus size={14}/> Talaba qo'shish</button>}/>
      <Breadcrumb/>
      <div className="card overflow-hidden shadow-xl shadow-primary/5">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 gap-4 flex-wrap">
          <div className="flex gap-1 p-1 bg-white dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm">
            {[['active',"Faol"],['archive','Arxiv']].map(([val,label]) => (
              <button key={val} onClick={() => { setTab(val); setPage(1); }}
                className={`px-5 py-2 rounded-lg text-[11px] font-900 uppercase tracking-widest transition-all ${tab === val ? 'bg-primary text-white shadow-md' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}>{label}</button>
            ))}
          </div>
          <div className="flex items-center gap-3 flex-1 justify-end min-w-[300px]">
            <SearchInput value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Talaba nomi yoki email..."/>
            <select className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-[11px] font-900 uppercase tracking-widest text-gray-600 dark:text-gray-400 bg-white dark:bg-white/5 outline-none focus:ring-2 focus:ring-primary/20 shadow-sm"
              onChange={e => { const g = groups.find(x => String(x.id) === e.target.value); if (g) openGroup(g); }}>
              <option value="">Barcha guruhlar</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full">
            <thead><tr>
              {['#','To\'liq ism','Guruh','Email manzili',"Tug'ilgan sana",'Sana','Amallar'].map(h => (
                <th key={h} className="table-header first:pl-6 last:pr-6">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {paginated.length === 0
                ? <tr><td colSpan={7} className="py-20"><Empty text="Talabalar topilmadi"/></td></tr>
                : paginated.map((s, i) => (
                <tr key={s.id} className="hover:bg-gray-50/60 dark:hover:bg-white/5 transition-all">
                  <td className="table-cell pl-6 text-gray-400 font-900 text-[10px]">{(page-1)*PER_PAGE+i+1}</td>
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <Avatar name={s.fullName} photo={s.photo} size="md" className="ring-2 ring-white dark:ring-gray-800 shadow-sm"/>
                      <div>
                        <p className="font-800 text-gray-800 dark:text-gray-100 text-sm leading-none mb-1">{s.fullName}</p>
                        {s.phone && <p className="text-[11px] text-gray-400 dark:text-gray-500 font-700 uppercase tracking-tighter">{s.phone}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                      <div className="flex flex-wrap gap-1">
                        {s.StudentGroups?.length 
                            ? s.StudentGroups.map(sg => <span key={sg.id} className="text-[10px] font-900 text-primary uppercase tracking-tighter bg-primary/5 px-2 py-0.5 rounded-md border border-primary/10">{sg.group?.name}</span>)
                            : <span className="text-[10px] font-800 text-gray-400 uppercase tracking-widest">—</span>}
                      </div>
                  </td>
                  <td className="table-cell text-xs font-700 text-gray-500 dark:text-gray-400">{s.email || '—'}</td>
                  <td className="table-cell text-[11px] text-gray-400 dark:text-gray-500 font-800 uppercase tracking-widest">{formatDate(s.birth_date)}</td>
                  <td className="table-cell text-[11px] text-gray-400 dark:text-gray-500 font-800 uppercase tracking-widest">{formatDate(s.createdAt || s.created_at)}</td>
                  <td className="table-cell pr-6">
                    <div className="flex items-center gap-1.5 justify-end">
                      <button onClick={() => openEdit(s)} className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-all flex items-center justify-center shadow-sm"><Edit2 size={13}/></button>
                      <button onClick={() => setDeleteId(s.id)} className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-900/10 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center shadow-sm"><Trash2 size={13}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} total={allFiltered.length} perPage={PER_PAGE} onChange={setPage}/>
      </div>
      <DrawerForm {...drawerProps}/>{dialogEl}
    </div>
  );
}

function DrawerForm({ drawerOpen, setDrawerOpen, editItem, form, setForm, photoFile, fileRef, onPickPhoto, handleSave, loading, courses, groups }) {
  return (
    <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={editItem ? 'Talabani tahrirlash' : "Yangi talaba qo'shish"}>
      {!editItem && <p className="text-xs text-gray-400 -mt-2 mb-1 font-500">Bu yerda siz yangi talabani qo'shishingiz mumkin.</p>}
      <Field label="Email" required><Input type="email" placeholder="student@gmail.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}/></Field>
      <Field label="Talaba FIO" required><Input placeholder="Ism Familiya" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })}/></Field>
      <Field label="Tug'ilgan sana" required><Input type="date" value={form.birth_date} onChange={e => setForm({ ...form, birth_date: e.target.value })}/></Field>
      {!editItem && (
        <Field label="Guruh">
          <Select value={form.courseId} onChange={e => setForm({ ...form, courseId: e.target.value, groupId: '' })}>
            <option value="">Kursni tanlang</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          {form.courseId && (
            <Select value={form.groupId} onChange={e => setForm({ ...form, groupId: e.target.value })} className="mt-2">
              <option value="">Guruhni tanlang</option>
              {groups.filter(g => String(g.course?.id ?? g.courseId) === String(form.courseId)).map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </Select>
          )}
        </Field>
      )}
      
      <Field label="Surati">
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickPhoto}/>
        <div onClick={() => fileRef.current?.click()} className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center hover:border-primary/50 transition-colors cursor-pointer">
          <div className="text-2xl mb-1">☁️</div>
          <p className="text-xs font-700 text-gray-600">Rasm tanlash uchun bosing</p>
          <p className="text-xs text-gray-400 mt-0.5">JPG yoki PNG (max. 800x800px)</p>
          {photoFile && <p className="text-xs text-primary mt-1.5 font-700">✓ {photoFile.name}</p>}
        </div>
      </Field>
      <div className="flex gap-3 pt-2">
        <button onClick={() => setDrawerOpen(false)} className="btn-secondary flex-1 justify-center">Bekor qilish</button>
        <button onClick={handleSave} disabled={loading} className="btn-primary flex-1 justify-center">{loading ? 'Saqlanmoqda...' : 'Saqlash'}</button>
      </div>
    </Drawer>
  );
}
