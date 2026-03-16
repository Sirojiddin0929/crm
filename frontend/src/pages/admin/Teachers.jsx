import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Plus, Trash2, Edit2, Star, ChevronRight, ChevronLeft, Users, BookOpen, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { teachersAPI, coursesAPI } from '../../services/api';
import dayjs from 'dayjs';
import {
  PageHeader, Avatar, Pagination, RoleBadge,
  Drawer, Field, Input, Select, SearchInput, Dialog, Empty,
} from '../../components/UI';

const PER_PAGE = 10;
const defaultForm = { fullName: '', email: '', position: '', experience: '' };
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
  const [page, setPage]             = useState(1);
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
      const [t, c] = await Promise.all([teachersAPI.getAll(), coursesAPI.getAll()]);
      setTeachers(t.data || []);
      setCourses(c.data || []);
    } catch { toast.error('Xatolik'); }
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    let list = teachers.filter(t =>
      tab === 'active' ? t.status !== 'INACTIVE' : t.status === 'INACTIVE'
    );
    if (search) list = list.filter(t =>
      t.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      t.email?.toLowerCase().includes(search.toLowerCase()) ||
      t.position?.toLowerCase().includes(search.toLowerCase())
    );
    return list;
  }, [teachers, search, tab]);

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

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
    setForm({ fullName: t.fullName || '', email: t.email || '', position: t.position || '', experience: t.experience || '' });
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
        const created = await teachersAPI.create(payload);
        const tid = created?.data?.id || created?.data?.teacher?.id;
        if (photoFile && tid) { const fd = new FormData(); fd.append('photo', photoFile); await teachersAPI.uploadPhoto(tid, fd); }
        toast.success("O'qituvchi qo'shildi");
      }
      setDrawerOpen(false); load();
    } catch (e) { toast.error(e.response?.data?.message || 'Xatolik'); }
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
      <div className="card p-4 mb-4">
        <div className="flex items-center gap-4">
          <Avatar name={selectedTeacher?.fullName} photo={selectedTeacher?.photo} size="lg"/>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-800 text-gray-800">{selectedTeacher?.fullName}</h1>
              {selectedTeacher?.avgRating && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 rounded-lg text-xs font-800 text-amber-600">
                  <Star size={11} fill="currentColor"/> {Number(selectedTeacher.avgRating).toFixed(1)}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-400 font-600">{selectedTeacher?.position || '—'}</p>
            <div className="flex items-center gap-4 mt-1 flex-wrap">
              <span className="text-xs text-gray-400">📧 {selectedTeacher?.email}</span>
              {selectedTeacher?.experience && <span className="text-xs text-gray-400">💼 {selectedTeacher.experience} yil</span>}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => openEdit(selectedTeacher)} className="btn-secondary text-xs"><Edit2 size={13}/> Tahrirlash</button>
            <button onClick={() => setDeleteId(selectedTeacher?.id)} className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-500 hover:bg-red-100 text-xs font-700 rounded-lg transition-colors"><Trash2 size={13}/> O'chirish</button>
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
        title="O'qituvchilar"
        subtitle={`${filtered.length} ta o'qituvchi`}
        actions={
          <button className="btn-primary" onClick={() => { setEditItem(null); setForm(defaultForm); setPhotoFile(null); setDrawerOpen(true); }}>
            <Plus size={14}/> O'qituvchi qo'shish
          </button>
        }
      />

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 gap-3 flex-wrap">
          <div className="flex gap-1">
            {[['active',"Faol o'qituvchi"],['archive','Arxiv']].map(([val,label]) => (
              <button key={val} onClick={() => { setTab(val); setPage(1); }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-700 transition-colors ${tab === val ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                {label}
              </button>
            ))}
          </div>
          <SearchInput value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Ism, email yoki lavozim"/>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr>
              {['#',"O'qituvchi",'Lavozim','Email','Yaratilgan sana','Amallar'].map(h => (
                <th key={h} className="table-header first:pl-4 last:pr-4">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={6}><Empty text="O'qituvchilar topilmadi"/></td></tr>
              ) : paginated.map((t, i) => (
                <tr key={t.id} onClick={() => openTeacher(t)}
                  className="hover:bg-gray-50/60 transition-colors cursor-pointer">
                  <td className="table-cell pl-4 text-gray-400 font-700 text-xs">{(page-1)*PER_PAGE+i+1}</td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={t.fullName} photo={t.photo} size="sm"/>
                      <div>
                        <p className="font-700 text-gray-800 text-sm">{t.fullName}</p>
                        {t.avgRating && (
                          <span className="inline-flex items-center gap-0.5 text-xs text-amber-500 font-700">
                            <Star size={10} fill="currentColor"/> {Number(t.avgRating).toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <RoleBadge role={t.position?.toUpperCase().replace(/ /g,'_') || 'TEACHER'}/>
                  </td>
                  <td className="table-cell text-xs text-gray-500">{t.email}</td>
                  <td className="table-cell text-xs text-gray-400">{formatDate(t.createdAt || t.created_at)}</td>
                  <td className="table-cell pr-4" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(t)} className="w-6 h-6 rounded-md bg-blue-50 text-blue-500 hover:bg-blue-100 flex items-center justify-center"><Edit2 size={11}/></button>
                      <button onClick={() => setDeleteId(t.id)} className="w-6 h-6 rounded-md bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center"><Trash2 size={11}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} total={filtered.length} perPage={PER_PAGE} onChange={setPage}/>
      </div>
      {drawerEl}{dialogEl}
    </div>
  );
}
