import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Plus, Trash2, Edit2, Star, ChevronRight, ChevronLeft, Users, BookOpen, Clock, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { teachersAPI, coursesAPI } from '../../services/api';
import dayjs from 'dayjs';
import {
  PageHeader, Avatar, Pagination, RoleBadge,
  Drawer, Field, Input, Select, SearchInput, Dialog, Empty,
} from '../../components/UI';

const PER_PAGE = 10;
const defaultForm = { fullName: '', email: '', password: '', position: '', experience: '' };
const DAYS_UZ = { MONDAY:'Du', TUESDAY:'Se', WEDNESDAY:'Ch', THURSDAY:'Pa', FRIDAY:'Ju', SATURDAY:'Sh', SUNDAY:'Ya' };

function formatDate(v) {
  if (!v) return '—';
  const d = dayjs(v);
  return d.isValid() ? d.format('DD.MM.YYYY') : '—';
}


export default function Teachers() {
  const [teachers, setTeachers]     = useState([]);
  const [courses, setCourses]       = useState([]);
  const [search, setSearch]         = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage]             = useState(1);
  const [total, setTotal]           = useState(0);
  const [tab, setTab]               = useState('active');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editItem, setEditItem]     = useState(null);
  const [form, setForm]             = useState(defaultForm);
  const [photoFile, setPhotoFile]   = useState(null);
  const [deleteId, setDeleteId]     = useState(null);
  const [loading, setLoading]       = useState(false);
  const fileRef = useRef(null);

  // detail
  const [view, setView]                     = useState('list');
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [teacherGroups, setTeacherGroups]   = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);

  const load = async () => {
    try {
      const status = tab === 'active' ? 'ACTIVE' : 'INACTIVE';
      const [t, c] = await Promise.all([
        teachersAPI.getSearchSummary({ page, limit: PER_PAGE, search: debouncedSearch, status }),
        coursesAPI.getAll(),
      ]);
      const payload = t.data || {};
      setTeachers(payload.data || []);
      setTotal(payload.pagination?.total ?? (payload.data || []).length);
      setCourses(c.data || []);
    } catch { toast.error('Xatolik'); }
  };
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);
  useEffect(() => { load(); }, [page, debouncedSearch, tab]);

  // ── Teacher bosish → guruhlarini yuklash ──
  const openTeacher = async teacher => {
    setSelectedTeacher(teacher);
    setSelectedCourse(null);
    setTeacherGroups([]);
    setView('courses');
    try {
      const r = await teachersAPI.getGroups(teacher.id);
      setTeacherGroups(r.data || []);
    } catch { setTeacherGroups([]); }
  };

  // ── Kurs bosish → o'sha kursning guruhlari ──
  const openCourse = course => {
    setSelectedCourse(course);
    setView('groups');
  };

  // ── Teacher ga biriktirilgan kurslar (unique) ──
  const teacherCourses = useMemo(() => {
    const seen = new Set();
    const result = [];
    teacherGroups.forEach(g => {
      const courseId = g.course?.id ?? g.courseId;
      if (!seen.has(courseId)) {
        seen.add(courseId);
        const course = courses.find(c => String(c.id) === String(courseId));
        result.push({
          id: courseId,
          name: course?.name || g.course?.name || `Kurs #${courseId}`,
          color: course?.color || '#7C3AED',
          price: course?.price,
          durationMonth: course?.durationMonth,
          groupCount: teacherGroups.filter(x => String(x.course?.id ?? x.courseId) === String(courseId)).length,
        });
      }
    });
    return result;
  }, [teacherGroups, courses]);

  // ── Tanlangan kursga tegishli guruhlar ──
  const courseGroups = useMemo(() => {
    if (!selectedCourse) return [];
    return teacherGroups.filter(g =>
      String(g.course?.id ?? g.courseId) === String(selectedCourse.id)
    );
  }, [teacherGroups, selectedCourse]);

  // ── Breadcrumb ──
  const Breadcrumb = () => (
    <div className="flex items-center gap-1.5 text-xs font-700 text-gray-400 mb-4 flex-wrap">
      <button onClick={() => { setView('list'); setSelectedTeacher(null); setSelectedCourse(null); }}
        className="hover:text-primary transition-colors">
        O'qituvchilar
      </button>
      <ChevronRight size={12} className="text-gray-300"/>
      <button onClick={() => { setView('courses'); setSelectedCourse(null); }}
        className={`hover:text-primary transition-colors ${view === 'courses' ? 'text-primary' : ''}`}>
        {selectedTeacher?.fullName}
      </button>
      {selectedCourse && (
        <>
          <ChevronRight size={12} className="text-gray-300"/>
          <span className="text-primary">{selectedCourse.name}</span>
        </>
      )}
    </div>
  );

  const openEdit = t => {
    setEditItem(t);
    setForm({ fullName: t.fullName || '', email: t.email || '', password: '', position: t.position || '', experience: t.experience || '' });
    setPhotoFile(null);
    setDrawerOpen(true);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload = { fullName: form.fullName, email: form.email, position: form.position, experience: Number(form.experience) };
      if (editItem) {
        await teachersAPI.update(editItem.id, payload);
        if (photoFile) { const fd = new FormData(); fd.append('photo', photoFile); await teachersAPI.uploadPhoto(editItem.id, fd); }
        toast.success('Yangilandi');
        if (selectedTeacher?.id === editItem.id) setSelectedTeacher({ ...selectedTeacher, ...payload });
      } else {
        if (!form.password || form.password.length < 6) {
          throw new Error("Parol kamida 6 ta belgidan iborat bo'lishi kerak");
        }
        const created = await teachersAPI.create({ ...payload, password: form.password });
        const tid = created?.data?.id || created?.data?.teacher?.id;
        if (photoFile && tid) { const fd = new FormData(); fd.append('photo', photoFile); await teachersAPI.uploadPhoto(tid, fd); }
        toast.success("O'qituvchi qo'shildi");
      }
      setDrawerOpen(false); load();
    } catch (e) { toast.error(e?.response?.data?.message || e?.message || 'Xatolik'); }
    finally { setLoading(false); }
  };

  const handleDelete = async () => {
    try {
      await teachersAPI.delete(deleteId); toast.success("O'chirildi"); load();
      if (selectedTeacher?.id === deleteId) { setView('list'); setSelectedTeacher(null); }
    } catch { toast.error('Xatolik'); }
  };

  const onPickPhoto = e => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) { toast.error('Faqat rasm fayli'); return; }
    setPhotoFile(f);
  };

  const drawerEl = (
    <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}
      title={editItem ? "O'qituvchini tahrirlash" : "Yangi o'qituvchi qo'shish"}>
      {!editItem && <p className="text-xs text-gray-400 -mt-2 mb-2 font-500">Yangi o'qituvchini qo'shishingiz mumkin.</p>}
      <Field label="FIO" required><Input placeholder="Ism Familiya" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })}/></Field>
      <Field label="Email" required><Input type="email" placeholder="teacher@gmail.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}/></Field>
      {!editItem && (
        <Field label="Parol" required>
          <Input type="password" placeholder="Kamida 6 ta belgi" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}/>
        </Field>
      )}
      <Field label="Lavozim" required>
        <Select value={form.position} onChange={e => setForm({ ...form, position: e.target.value })}>
          <option value="">Tanlang</option>
          <option value="Full Stack Developer">Full Stack Developer</option>
          <option value="Backend Python Developer">Backend Python Developer</option>
          <option value="Frontend React Developer">Frontend React Developer</option>
          <option value="Senior Software Engineering">Senior Software Engineering</option>
        </Select>
      </Field>
      <Field label="Tajriba (yil)">
        <Input type="number" placeholder="3" value={form.experience} onChange={e => setForm({ ...form, experience: e.target.value })}/>
      </Field>
      <Field label="Surati">
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickPhoto}/>
        <div onClick={() => fileRef.current?.click()} className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center cursor-pointer hover:border-primary/50 transition-colors">
          <div className="text-2xl mb-1">☁️</div>
          <p className="text-xs font-700 text-gray-600">Rasm tanlash uchun bosing</p>
          <p className="text-xs text-gray-400 mt-0.5">JPG yoki PNG</p>
          {photoFile && <p className="text-xs text-primary mt-1.5 font-700">✓ {photoFile.name}</p>}
        </div>
      </Field>
      <div className="flex gap-3 pt-2">
        <button onClick={() => setDrawerOpen(false)} className="btn-secondary flex-1 justify-center">Bekor</button>
        <button onClick={handleSave} disabled={loading} className="btn-primary flex-1 justify-center">{loading ? 'Saqlanmoqda...' : 'Saqlash'}</button>
      </div>
    </Drawer>
  );

  const dialogEl = (
    <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}
      title="O'qituvchini o'chirish"
      description="Haqiqatan ham bu o'qituvchini o'chirmoqchimisiz?"
      onConfirm={handleDelete}/>
  );

  // ════════════════════════════════════════════════════════
  // VIEW: COURSES — teacher ga biriktirilgan kurslar
  // ════════════════════════════════════════════════════════
  if (view === 'courses') return (
    <div className="fade-in">
      {/* Teacher profil header */}
      <Breadcrumb/>
      <div className="card p-6 mb-6 shadow-xl shadow-primary/5">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="relative">
            <Avatar name={selectedTeacher?.fullName} photo={selectedTeacher?.photo} size="xl" className="w-24 h-24 ring-4 ring-primary/10 shadow-lg"/>
            {selectedTeacher?.avgRating && (
              <div className="absolute -bottom-1 -right-1 bg-amber-400 text-white text-[10px] font-900 px-2 py-0.5 rounded-lg border-2 border-white dark:border-gray-800 flex items-center gap-1 shadow-md">
                <Star size={10} fill="currentColor"/> {Number(selectedTeacher.avgRating).toFixed(1)}
              </div>
            )}
          </div>
          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
              <h1 className="text-2xl font-900 text-gray-800 dark:text-gray-100 uppercase tracking-tight">{selectedTeacher?.fullName}</h1>
              <span className="badge badge-primary text-[10px] tracking-widest uppercase">O'QITUVCHI</span>
            </div>
            <p className="text-sm text-primary font-800 mb-3 uppercase tracking-widest opacity-80">{selectedTeacher?.position || 'UX/UI DESIGNER'}</p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
              <span className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 font-700 bg-gray-50 dark:bg-white/5 px-3 py-1.5 rounded-xl border border-gray-100 dark:border-white/5">
                <Mail size={12} className="text-primary"/> {selectedTeacher?.email}
              </span>
              {selectedTeacher?.experience && (
                <span className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 font-700 bg-gray-50 dark:bg-white/5 px-3 py-1.5 rounded-xl border border-gray-100 dark:border-white/5">
                  <Star size={12} className="text-amber-400"/> {selectedTeacher.experience} Yillik Tajriba
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => openEdit(selectedTeacher)} className="btn-secondary py-2.5 px-6 text-xs font-900 uppercase tracking-widest shadow-sm">
                <Edit2 size={13}/> Tahrirlash
            </button>
            <button onClick={() => setDeleteId(selectedTeacher?.id)} className="px-6 py-2.5 bg-red-50 dark:bg-red-900/10 text-red-500 hover:bg-red-500 hover:text-white transition-all text-xs font-900 uppercase tracking-widest rounded-xl shadow-sm">
                <Trash2 size={13}/> O'chirish
            </button>
          </div>
        </div>
      </div>

      {/* Kurslar */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-800 text-gray-800">
          Kurslar <span className="text-sm font-600 text-gray-400 ml-1">({teacherCourses.length} ta)</span>
        </h2>
      </div>

      {teacherCourses.length === 0 ? (
        <div className="card"><Empty icon="📚" text="Bu o'qituvchiga kurs biriktirilmagan"/></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {teacherCourses.map(c => (
            <div key={c.id} onClick={() => openCourse(c)}
              className="card p-4 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: (c.color || '#7C3AED') + '18' }}>
                  <BookOpen size={18} style={{ color: c.color || '#7C3AED' }}/>
                </div>
                <ChevronRight size={15} className="text-gray-300 group-hover:text-primary transition-colors mt-1"/>
              </div>
              <p className="font-800 text-gray-800 text-sm mb-2">{c.name}</p>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-xs text-gray-400 font-600">
                  <Users size={11}/> {c.groupCount} guruh
                </span>
                {c.durationMonth && (
                  <><span className="text-gray-200">·</span>
                  <span className="text-xs text-gray-400 font-600">{c.durationMonth} oy</span></>
                )}
              </div>
              {c.price && (
                <p className="text-xs font-800 mt-2" style={{ color: c.color || '#7C3AED' }}>
                  {Number(c.price).toLocaleString()} so'm
                </p>
              )}
            </div>
          ))}
        </div>
      )}
      {drawerEl}{dialogEl}
    </div>
  );

  // ════════════════════════════════════════════════════════
  // VIEW: GROUPS — kurs ichidagi guruhlar
  // ════════════════════════════════════════════════════════
  if (view === 'groups') return (
    <div className="fade-in">
      <Breadcrumb/>
      <PageHeader
        title={selectedCourse?.name || 'Guruhlar'}
        subtitle={`${courseGroups.length} ta guruh`}
      />

      {courseGroups.length === 0 ? (
        <div className="card"><Empty icon="👥" text="Bu kursda guruhlar topilmadi"/></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {courseGroups.map(g => (
            <div key={g.id} className="card p-4 hover:shadow-md hover:-translate-y-0.5 transition-all">
              {/* Kurs rangi */}
              <div className="flex items-center gap-1.5 mb-3">
                <div className="w-6 h-6 rounded-md flex items-center justify-center"
                  style={{ background: (selectedCourse.color || '#7C3AED') + '18' }}>
                  <BookOpen size={12} style={{ color: selectedCourse.color || '#7C3AED' }}/>
                </div>
                <span className="text-xs font-800" style={{ color: selectedCourse.color || '#7C3AED' }}>
                  {selectedCourse.name}
                </span>
              </div>

              <p className="font-800 text-gray-800 text-sm mb-2">{g.name}</p>

              <div className="space-y-1.5">
                {g.startTime && (
                  <div className="flex items-center gap-2 text-xs text-gray-400 font-600">
                    <Clock size={11}/> {g.startTime}
                    {g.weekDays?.length > 0 && (
                      <span>· {g.weekDays.map(d => DAYS_UZ[d] || d).join(', ')}</span>
                    )}
                  </div>
                )}
                {g.startDate && (
                  <p className="text-xs text-gray-400 font-600">
                    📅 {formatDate(g.startDate)} → {formatDate(g.endDate) || '...'}
                  </p>
                )}
                {g.capacity && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 font-600">
                    <Users size={11}/> {g.capacity} o'rin
                  </div>
                )}
              </div>

              <div className="mt-3">
                <span className={`badge ${g.status === 'INACTIVE' ? 'badge-red' : 'badge-green'}`}>
                  {g.status || 'ACTIVE'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
      {drawerEl}{dialogEl}
    </div>
  );

  // ════════════════════════════════════════════════════════
  // VIEW: LIST — barcha o'qituvchilar
  // ════════════════════════════════════════════════════════
  return (
    <div className="fade-in">
      <PageHeader
        title="O'qituvchilar bazasi"
        subtitle={`${total} ta umumiy o'qituvchilar ro'yxati`}
        actions={
          <button className="btn-primary py-2.5 px-6 text-xs font-900 uppercase tracking-widest shadow-lg shadow-primary/25" onClick={() => { setEditItem(null); setForm(defaultForm); setPhotoFile(null); setDrawerOpen(true); }}>
            <Plus size={14}/> O'qituvchi qo'shish
          </button>
        }
      />

      <div className="card overflow-hidden shadow-xl shadow-primary/5">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 gap-4 flex-wrap">
          <div className="flex gap-1 p-1 bg-white dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm">
            {[['active',"Faol"],['archive','Arxiv']].map(([val,label]) => (
              <button key={val} onClick={() => { setTab(val); setPage(1); }}
                className={`px-5 py-2 rounded-lg text-[11px] font-900 uppercase tracking-widest transition-all ${tab === val ? 'bg-primary text-white shadow-md' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}>{label}</button>
            ))}
          </div>
          <SearchInput value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Ism, email yoki lavozim qidirish..."/>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full">
            <thead><tr>
              {['#',"O'qituvchi",'Lavozimi','Email manzili','Sana','Amallar'].map(h => (
                <th key={h} className="table-header first:pl-6 last:pr-6">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {teachers.length === 0 ? (
                <tr><td colSpan={6} className="py-20"><Empty text="O'qituvchilar topilmadi"/></td></tr>
              ) : teachers.map((t, i) => (
                <tr key={t.id} onClick={() => openTeacher(t)}
                  className="hover:bg-gray-50/60 dark:hover:bg-white/5 transition-all cursor-pointer group">
                  <td className="table-cell pl-6 text-gray-400 font-900 text-[10px]">#{(page-1)*PER_PAGE+i+1}</td>
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <Avatar name={t.fullName} photo={t.photo} size="md" className="ring-2 ring-white dark:ring-gray-800 shadow-sm group-hover:ring-primary/30 transition-all"/>
                      <div>
                        <p className="font-800 text-gray-800 dark:text-gray-100 text-sm leading-none mb-1">{t.fullName}</p>
                        {t.avgRating && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-amber-500 font-900 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded-md">
                            <Star size={10} fill="currentColor"/> {Number(t.avgRating).toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <RoleBadge role={t.position?.toUpperCase().replace(/ /g,'_') || 'TEACHER'}/>
                  </td>
                  <td className="table-cell text-xs font-700 text-gray-500 dark:text-gray-400">{t.email}</td>
                  <td className="table-cell text-[11px] text-gray-400 dark:text-gray-500 font-800 uppercase tracking-widest">{formatDate(t.createdAt || t.created_at)}</td>
                  <td className="table-cell pr-6" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-1.5 justify-end">
                      <button onClick={() => openEdit(t)} className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-all flex items-center justify-center shadow-sm"><Edit2 size={13}/></button>
                      <button onClick={() => setDeleteId(t.id)} className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-900/10 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center shadow-sm"><Trash2 size={13}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} total={total} perPage={PER_PAGE} onChange={setPage}/>
      </div>
      {drawerEl}{dialogEl}
    </div>
  );
}
