import React, { useEffect, useState, useMemo } from 'react';
import { Star, Trash2, Search, Edit2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { ratingsAPI, teachersAPI, lessonsAPI, groupsAPI, coursesAPI } from '../../services/api';
import { PageHeader, Avatar, Dialog, Empty, Field, Pagination } from '../../components/UI';
import dayjs from 'dayjs';

// ── Half-star reyting komponenti ─────────────────────────
function StarRating({ value = 0, onChange, readonly = false, size = 28 }) {
  const [hovered, setHovered] = useState(null);
  const display = hovered !== null ? hovered : value;

  return (
    <div className="flex items-center gap-0.5" onMouseLeave={() => !readonly && setHovered(null)}>
      {[1, 2, 3, 4, 5].map(star => {
        const full = display >= star;
        const half = !full && display >= star - 0.5;
        return (
          <div key={star} className="relative" style={{ width: size, height: size }}>
            <Star size={size} className="absolute top-0 left-0 text-gray-200" fill="currentColor"/>
            {full && <Star size={size} className="absolute top-0 left-0 text-yellow-400" fill="currentColor"/>}
            {half && (
              <div className="absolute top-0 left-0 overflow-hidden" style={{ width: size / 2 }}>
                <Star size={size} className="text-yellow-400" fill="currentColor"/>
              </div>
            )}
            {!readonly && (
              <>
                <div className="absolute top-0 left-0 h-full cursor-pointer z-10" style={{ width:'50%' }}
                  onMouseEnter={() => setHovered(star - 0.5)} onClick={() => onChange?.(star - 0.5)}/>
                <div className="absolute top-0 right-0 h-full cursor-pointer z-10" style={{ width:'50%' }}
                  onMouseEnter={() => setHovered(star)} onClick={() => onChange?.(star)}/>
              </>
            )}
          </div>
        );
      })}
      <span className={`ml-2 font-800 ${readonly ? 'text-sm text-gray-600' : 'text-base text-gray-800'}`}>
        {value > 0 ? value.toFixed(1) : '—'}
      </span>
    </div>
  );
}

// ── Score label ──────────────────────────────────────────
function scoreLabel(score) {
  if (score === 0)   return 'Bahoni tanlang';
  if (score <= 1.5)  return '😞 Yomon';
  if (score <= 2.5)  return '😐 Qoniqarsiz';
  if (score <= 3.5)  return '🙂 Qoniqarli';
  if (score <= 4.5)  return '😊 Yaxshi';
  return "🤩 A'lo";
}

// ── Rating Modal (add + edit) ────────────────────────────
function RatingModal({ open, onClose, onSave, teachers, lessons, groups, courses, editData, ratings }) {
  const isEdit = !!editData;

  const [courseId,  setCourseId]  = useState('');
  const [groupId,   setGroupId]   = useState('');
  const [lessonId,  setLessonId]  = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [score,     setScore]     = useState(0);
  const [comment,   setComment]   = useState('');
  const [saving,    setSaving]    = useState(false);

  useEffect(() => {
    if (!open) return;
    if (isEdit && editData) {
      const tid = editData.teacher?.id ?? editData.teacherId ?? '';
      const lid = editData.lesson?.id  ?? editData.lessonId  ?? '';
      const lesson = lessons.find(l => String(l.id) === String(lid));
      const gid = lesson?.groupId ?? lesson?.group?.id ?? '';
      const group = groups.find(g => String(g.id) === String(gid));
      const cid = group?.course?.id ?? group?.courseId ?? '';
      setCourseId(String(cid));
      setGroupId(String(gid));
      setLessonId(String(lid));
      setTeacherId(String(tid));
      setScore(editData.score || 0);
      setComment(editData.comment || '');
    } else {
      reset();
    }
  }, [open, editData, isEdit, lessons, groups]);

  const courseGroups = useMemo(() =>
    courseId ? groups.filter(g => String(g.course?.id ?? g.courseId) === String(courseId)) : [],
    [courseId, groups]
  );
  
  const groupLessons = useMemo(() =>
    groupId ? lessons.filter(l => String(l.groupId ?? l.group?.id) === String(groupId)) : [],
    [groupId, lessons]
  );

  const handleGroupChange = gid => {
    setGroupId(gid); setLessonId('');
    const g = groups.find(x => String(x.id) === String(gid));
    const teacherIdFromGroup = g?.teacherId || g?.teacher?.id ? String(g?.teacher?.id || g?.teacherId) : '';
    setTeacherId(teacherIdFromGroup);
  };

  const reset = () => {
    setCourseId(''); setGroupId(''); setLessonId('');
    setTeacherId(''); setScore(0); setComment('');
  };

  const handleSave = async () => {
    if (!lessonId)   { toast.error('Darsni tanlang');       return; }
    if (!teacherId)  { toast.error("O'qituvchini tanlang"); return; }
    if (score === 0) { toast.error('Bahoni belgilang');     return; }

    // Takroriy baholashni tekshirish (faqat yangi qo'shishda)
    if (!isEdit) {
      const alreadyRated = ratings.some(r => String(r.lessonId || r.lesson?.id) === String(lessonId));
      if (alreadyRated) {
        toast.error('Bu dars uchun allaqachon baho berilgan!');
        return;
      }
    }

    setSaving(true);
    try {
      const payload = { teacherId: Number(teacherId), lessonId: Number(lessonId), score, comment: comment || undefined };
      if (isEdit) {
        // Edit modeda API-ga qarab update yoki delete/create
        await ratingsAPI.delete(editData.id);
        await ratingsAPI.create(payload);
        toast.success('Baho yangilandi!');
      } else {
        await ratingsAPI.create(payload);
        toast.success('Baho berildi! ⭐');
      }
      onSave(); onClose(); reset();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Xatolik');
    } finally { setSaving(false); }
  };

  if (!open) return null;

  const selectedTeacher = teachers.find(t => String(t.id) === String(teacherId));
  const groupHasTeacher = groupId && selectedTeacher;
  const steps = [
    { label:'Kurs',  done:!!courseId  },
    { label:'Guruh', done:!!groupId   },
    { label:'Dars',  done:!!lessonId  },
    { label:'Baho',  done:score > 0   },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"/>
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 fade-in overflow-y-auto max-h-[90vh]"
        onClick={e => e.stopPropagation()}>
        
        <div className="flex items-center px-6 pt-4 pb-1">
          {steps.map((s, i) => (
            <React.Fragment key={s.label}>
              <div className="flex flex-col items-center">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-800 transition-colors ${s.done ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'}`}>
                  {s.done ? '✓' : i + 1}
                </div>
                <span className={`text-[10px] font-600 mt-0.5 ${s.done ? 'text-primary' : 'text-gray-400'}`}>{s.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mb-3 mx-1 ${s.done ? 'bg-primary/40' : 'bg-gray-100'}`}/>
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="p-6 space-y-4">
          <Field label="1. Kurs" required>
            <select value={courseId}
              onChange={e => { setCourseId(e.target.value); setGroupId(''); setLessonId(''); setTeacherId(''); }}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-primary bg-white font-500">
              <option value="">Kursni tanlang</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>

          {courseId && (
            <Field label="2. Guruh" required>
              <select value={groupId}
                onChange={e => handleGroupChange(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-primary bg-white font-500">
                <option value="">Guruhni tanlang</option>
                {courseGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </Field>
          )}

          {groupId && selectedTeacher && (
            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl border border-purple-100">
              <Avatar name={selectedTeacher.fullName} photo={selectedTeacher.photo} size="md"/>
              <div>
                <p className="font-700 text-gray-800 text-sm">{selectedTeacher.fullName}</p>
                <p className="text-xs text-gray-400">{selectedTeacher.position || '—'}</p>
              </div>
            </div>
          )}

          {groupId && !selectedTeacher && (
            <p className="text-xs text-red-600 bg-red-50 p-3 rounded-xl border border-red-200">
              ⚠ Bu guruhga hali o'qituvchi biriktirilmagan.
            </p>
          )}

          {groupId && (
            <Field label="3. Dars" required>
              <select value={lessonId}
                onChange={e => setLessonId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-primary bg-white font-500">
                <option value="">Darsni tanlang</option>
                {groupLessons.map(l => {
                  const isAlreadyRated = ratings.some(r => String(r.lessonId || r.lesson?.id) === String(l.id));
                  return (
                    <option key={l.id} value={l.id} disabled={isAlreadyRated && !isEdit}>
                      {l.title} {isAlreadyRated ? '— (Baholangan ✓)' : (l.date ? ' — ' + dayjs(l.date).format('DD.MM.YYYY') : '')}
                    </option>
                  );
                })}
              </select>
            </Field>
          )}

          {lessonId && groupHasTeacher && (
            <>
              <div>
                <label className="block text-xs font-700 text-gray-600 mb-2">4. Baho <span className="text-red-500">*</span></label>
                <div className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-xl">
                  <StarRating value={score} onChange={setScore} size={36}/>
                  <p className="text-xs text-gray-400">{scoreLabel(score)}</p>
                </div>
              </div>
              <div>
                <label className="block text-xs font-700 text-gray-600 mb-1.5">Izoh (ixtiyoriy)</label>
                <textarea value={comment} onChange={e => setComment(e.target.value)}
                  placeholder="Dars haqida fikringiz..." rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-primary resize-none font-500"/>
              </div>
            </>
          )}

          <div className="flex gap-3 pt-1">
            <button onClick={() => { onClose(); reset(); }} className="btn-secondary flex-1 justify-center">Bekor qilish</button>
            <button onClick={handleSave}
              disabled={saving || score === 0 || !teacherId || !lessonId || !groupHasTeacher}
              className="btn-primary flex-1 justify-center disabled:opacity-50">
              {saving ? 'Saqlanmoqda...' : isEdit ? '✏️ Saqlash' : '⭐ Baho berish'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Asosiy sahifa ─────────────────────────────────────────
export default function Ratings() {
  const PER_PAGE = 10;
  const [ratings,   setRatings]  = useState([]);
  const [teachers,  setTeachers] = useState([]);
  const [lessons,   setLessons]  = useState([]);
  const [groups,    setGroups]   = useState([]);
  const [courses,   setCourses]  = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editData,  setEditData]  = useState(null);
  const [deleteId,  setDeleteId]  = useState(null);
  const [search,    setSearch]    = useState('');
  const [filterTeacher, setFilterTeacher] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const activeTeachers = useMemo(() => {
    return teachers.filter(t => String(t.status || '').toUpperCase() === 'ACTIVE');
  }, [teachers]);

  const loadMeta = async () => {
    try {
      const [t, l, g, c] = await Promise.all([
        teachersAPI.getSearchSummary({ page: 1, limit: 200, status: 'ACTIVE' }),
        lessonsAPI.getAll({ page: 1, limit: 500 }),
        groupsAPI.getAll({ page: 1, limit: 500, status: 'ACTIVE' }),
        coursesAPI.getAll(),
      ]);
      setTeachers((t.data?.data || t.data || []));
      setLessons((l.data?.data || l.data || []));
      setGroups((g.data?.data || g.data || []));
      setCourses(c.data || []);
    } catch { toast.error('Xatolik'); }
  };
  const loadRatings = async () => {
    try {
      const r = await ratingsAPI.getAll({
        page,
        limit: PER_PAGE,
        search: search || undefined,
        teacherId: filterTeacher || undefined,
      });
      const payload = r.data || {};
      const list = payload.data || payload || [];
      setRatings(list);
      setTotal(payload.pagination?.total ?? list.length);
    } catch { toast.error('Xatolik'); }
  };

  useEffect(() => { loadMeta(); }, []);
  useEffect(() => {
    const timer = setTimeout(() => { loadRatings(); }, 300);
    return () => clearTimeout(timer);
  }, [page, search, filterTeacher]);

  const getTeacher = r => r.teacher || teachers.find(t => t.id === r.teacherId) || null;
  const getLesson  = r => r.lesson || lessons.find(l => l.id === r.lessonId) || null;

  const filtered = ratings;

  return (
    <div className="fade-in">
      <PageHeader 
        title="Reytinglar" 
        subtitle={`${total} ta baho`}
        actions={<button className="btn-primary" onClick={() => { setEditData(null); setModalOpen(true); }}><Star size={14}/> Baho berish</button>}
      />

      <div className="card mb-5 overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Qidirish..." className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 text-xs outline-none bg-gray-50"/>
          </div>
          <select value={filterTeacher} onChange={e => { setFilterTeacher(e.target.value); setPage(1); }} className="px-3 py-2 rounded-lg border border-gray-200 text-xs font-600 bg-white">
            <option value="">Barcha o'qituvchilar</option>
            {activeTeachers.map(t => <option key={t.id} value={t.id}>{t.fullName}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                {['#', "Talaba", "O'qituvchi", 'Dars', 'Baho', 'Izoh', 'Sana', 'Amallar'].map(h => (
                  <th key={h} className="px-4 py-3 text-[11px] font-700 text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8}><Empty icon="⭐" text="Baholar topilmadi"/></td></tr>
              ) : filtered.map((r, i) => (
                <tr key={r.id} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 text-xs text-gray-400 font-600">{(page - 1) * PER_PAGE + i + 1}</td>
                  <td className="px-4 py-3 text-xs font-700 text-gray-700">{r.student?.fullName || (r.studentId ? `Talaba #${r.studentId}` : '—')}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={getTeacher(r)?.fullName} photo={getTeacher(r)?.photo} size="sm"/>
                      <span className="font-700 text-gray-800 text-xs">{getTeacher(r)?.fullName || '—'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{getLesson(r)?.title || '—'}</td>
                  <td className="px-4 py-3"><StarRating value={r.score} readonly size={14}/></td>
                  <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate">{r.comment || '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">{dayjs(r.createdAt || r.created_at).format('DD.MM.YYYY')}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => { setEditData(r); setModalOpen(true); }} className="p-1.5 rounded-md bg-blue-50 text-blue-500 hover:bg-blue-100"><Edit2 size={11}/></button>
                      <button onClick={() => setDeleteId(r.id)} className="p-1.5 rounded-md bg-red-50 text-red-400 hover:bg-red-100"><Trash2 size={11}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} total={total} perPage={PER_PAGE} onChange={setPage}/>
      </div>

      <RatingModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditData(null); }}
        onSave={loadRatings}
        teachers={activeTeachers}
        lessons={lessons}
        groups={groups}
        courses={courses}
        editData={editData}
        ratings={ratings}
      />

      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}
        title="Bahoni o'chirish" description="Bu bahoni o'chirishni tasdiqlaysizmi?"
        onConfirm={async () => {
          await ratingsAPI.delete(deleteId);
          setDeleteId(null); loadRatings();
          toast.success("O'chirildi");
        }}
      />
    </div>
  );
}
