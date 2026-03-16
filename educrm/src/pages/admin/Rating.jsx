import React, { useEffect, useState, useMemo } from 'react';
import { Star, Trash2, Search, Edit2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { ratingsAPI, teachersAPI, lessonsAPI, groupsAPI, coursesAPI } from '../../services/api';
import { PageHeader, Avatar, Dialog, Empty, Field } from '../../components/UI';
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
function RatingModal({ open, onClose, onSave, teachers, lessons, groups, courses, editData }) {
  const isEdit = !!editData;

  const [courseId,  setCourseId]  = useState('');
  const [groupId,   setGroupId]   = useState('');
  const [lessonId,  setLessonId]  = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [score,     setScore]     = useState(0);
  const [comment,   setComment]   = useState('');
  const [saving,    setSaving]    = useState(false);

  // Edit modeda prefill
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
      setCourseId(''); setGroupId(''); setLessonId('');
      setTeacherId(''); setScore(0); setComment('');
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
    setTeacherId(g?.teacherId ? String(g.teacherId) : '');
  };

  const reset = () => {
    setCourseId(''); setGroupId(''); setLessonId('');
    setTeacherId(''); setScore(0); setComment('');
  };

  const handleSave = async () => {
    if (!lessonId)   { toast.error('Darsni tanlang');       return; }
    if (!teacherId)  { toast.error("O'qituvchini tanlang"); return; }
    if (score === 0) { toast.error('Bahoni belgilang');     return; }
    setSaving(true);
    try {
      if (isEdit) {
        // Edit: faqat score va comment yangilanadi
        await ratingsAPI.delete(editData.id);
        await ratingsAPI.create({ teacherId:Number(teacherId), lessonId:Number(lessonId), score, comment:comment||undefined });
        toast.success('Baho yangilandi!');
      } else {
        await ratingsAPI.create({ teacherId:Number(teacherId), lessonId:Number(lessonId), score, comment:comment||undefined });
        toast.success('Baho berildi! ⭐');
      }
      onSave(); onClose(); reset();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Xatolik');
    } finally { setSaving(false); }
  };

  if (!open) return null;

  const selectedTeacher = teachers.find(t => String(t.id) === String(teacherId));
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
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-800 text-gray-800 text-base">
              {isEdit ? 'Bahoni tahrirlash' : "O'qituvchini baholash"}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">Kurs → Guruh → Dars tartibida tanlang</p>
          </div>
          <button onClick={() => { onClose(); reset(); }} className="w-7 h-7 rounded-md hover:bg-gray-100 flex items-center justify-center text-gray-400">
            <X size={16}/>
          </button>
        </div>

        {/* Steps */}
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
          {/* 1. Kurs */}
          <Field label="1. Kurs" required>
            <select value={courseId}
              onChange={e => { setCourseId(e.target.value); setGroupId(''); setLessonId(''); setTeacherId(''); }}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-primary bg-white font-500">
              <option value="">Kursni tanlang</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>

          {/* 2. Guruh */}
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

          {/* O'qituvchi — guruh tanlanganda avtomatik */}
          {groupId && selectedTeacher && (
            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl border border-purple-100">
              <Avatar name={selectedTeacher.fullName} photo={selectedTeacher.photo} size="md"/>
              <div>
                <p className="font-700 text-gray-800 text-sm">{selectedTeacher.fullName}</p>
                <p className="text-xs text-gray-400">{selectedTeacher.position || '—'}</p>
                {selectedTeacher.avgRating && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <Star size={11} className="text-yellow-400 fill-yellow-400"/>
                    <span className="text-xs font-700 text-amber-600">{Number(selectedTeacher.avgRating).toFixed(1)} o'rtacha</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Guruhda o'qituvchi yo'q — manual tanlash */}
          {groupId && !teacherId && (
            <Field label="O'qituvchi" required>
              <select value={teacherId}
                onChange={e => setTeacherId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-primary bg-white font-500">
                <option value="">O'qituvchini tanlang</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.fullName}</option>)}
              </select>
            </Field>
          )}

          {/* 3. Dars */}
          {groupId && (
            <Field label="3. Dars" required>
              <select value={lessonId}
                onChange={e => setLessonId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-primary bg-white font-500">
                <option value="">Darsni tanlang</option>
                {groupLessons.map(l => (
                  <option key={l.id} value={l.id}>
                    {l.title}{l.date ? ' — ' + dayjs(l.date).format('DD.MM.YYYY') : ''}
                  </option>
                ))}
              </select>
              {groupLessons.length === 0 && (
                <p className="text-xs text-amber-500 mt-1 font-600">⚠ Bu guruhda darslar topilmadi</p>
              )}
            </Field>
          )}

          {/* 4. Yulduz baho */}
          {lessonId && (
            <div>
              <label className="block text-xs font-700 text-gray-600 mb-2">
                4. Baho <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-xl">
                <StarRating value={score} onChange={setScore} size={36}/>
                <p className="text-xs text-gray-400">{scoreLabel(score)}</p>
              </div>
            </div>
          )}

          {/* Izoh */}
          {lessonId && (
            <div>
              <label className="block text-xs font-700 text-gray-600 mb-1.5">Izoh (ixtiyoriy)</label>
              <textarea value={comment} onChange={e => setComment(e.target.value)}
                placeholder="Dars haqida fikringiz..." rows={3}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-primary resize-none font-500"/>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button onClick={() => { onClose(); reset(); }} className="btn-secondary flex-1 justify-center">
              Bekor qilish
            </button>
            <button onClick={handleSave}
              disabled={saving || score === 0 || !teacherId || !lessonId}
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
  const [ratings,  setRatings]  = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [lessons,  setLessons]  = useState([]);
  const [groups,   setGroups]   = useState([]);
  const [courses,  setCourses]  = useState([]);
  const [modalOpen,   setModalOpen]   = useState(false);
  const [editData,    setEditData]    = useState(null);
  const [deleteId,    setDeleteId]    = useState(null);
  const [search,      setSearch]      = useState('');
  const [filterTeacher, setFilterTeacher] = useState('');

  const load = async () => {
    try {
      const [r, t, l, g, c] = await Promise.all([
        ratingsAPI.getAll(),
        teachersAPI.getAll(),
        lessonsAPI.getAll({}),
        groupsAPI.getAll(),
        coursesAPI.getAll(),
      ]);
      
      setRatings(r.data  || []);
      setTeachers(t.data || []);
      setLessons(l.data  || []);
      setGroups(g.data   || []);
      setCourses(c.data  || []);
    } catch { toast.error('Xatolik'); }
  };
  useEffect(() => { load(); }, []);

  // ── O'qituvchi ismini olish (nested yoki flat) ──
  const getTeacher = r => {
    if (r.teacher?.fullName) return r.teacher;
    return teachers.find(t => t.id === r.teacherId) || null;
  };

  // ── Dars nomini olish (nested yoki flat) ──
  const getLesson = r => {
    if (r.lesson?.title) return r.lesson;
    return lessons.find(l => l.id === r.lessonId) || null;
  };

  // ── Sanani olish ──
  const getDate = r => {
    const d = r.createdAt || r.created_at || r.date;
    return d ? dayjs(d).format('DD.MM.YYYY') : '—';
  };

  // ── Statistika ──
  const stats = useMemo(() => {
    const map = {};
    ratings.forEach(r => {
      const t = getTeacher(r);
      const tid = r.teacher?.id ?? r.teacherId;
      if (!tid) return;
      if (!map[tid]) map[tid] = { count:0, total:0, teacher:t };
      map[tid].count++;
      map[tid].total += r.score;
    });
    return Object.values(map)
      .map(s => ({ ...s, avg: s.count ? (s.total / s.count).toFixed(1) : '0' }))
      .sort((a, b) => b.avg - a.avg);
  }, [ratings, teachers]);

  // ── Filter ──
  const filtered = useMemo(() => {
    let list = [...ratings].sort((a, b) => new Date(b.createdAt || b.created_at || 0) - new Date(a.createdAt || a.created_at || 0));
    if (filterTeacher) list = list.filter(r => String(r.teacher?.id ?? r.teacherId) === String(filterTeacher));
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(r => {
        const t = getTeacher(r);
        const l = getLesson(r);
        return t?.fullName?.toLowerCase().includes(q)
          || l?.title?.toLowerCase().includes(q)
          || r.comment?.toLowerCase().includes(q);
      });
    }
    return list;
  }, [ratings, filterTeacher, search, teachers, lessons]);

  // ── Star distribution ──
  const totalFiltered = filterTeacher
    ? ratings.filter(r => String(r.teacher?.id ?? r.teacherId) === String(filterTeacher))
    : ratings;
  const avgFiltered = totalFiltered.length
    ? (totalFiltered.reduce((s, r) => s + r.score, 0) / totalFiltered.length).toFixed(1)
    : '0';
  const starDist = [5, 4, 3, 2, 1].map(s => ({
    star: s,
    count: totalFiltered.filter(r => {
      const v = Math.round(r.score * 2) / 2;
      return v >= s && v < s + 1;
    }).length,
  }));

  const openEdit = r => {
    setEditData(r);
    setModalOpen(true);
  };

  const openAdd = () => {
    setEditData(null);
    setModalOpen(true);
  };

  return (
    <div className="fade-in">
      <PageHeader
        title="Reytinglar"
        subtitle={`${ratings.length} ta baho`}
        actions={
          <button className="btn-primary" onClick={openAdd}>
            <Star size={14}/> Baho berish
          </button>
        }
      />

      {/* Top 3 */}
      {stats.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
          {stats.slice(0, 3).map((s, i) => (
            <div key={i} className="card p-4 flex items-center gap-3">
              <div className="relative flex-shrink-0">
                <Avatar name={s.teacher?.fullName} photo={s.teacher?.photo} size="md"/>
                <span className="absolute -top-1 -right-1 text-base">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-800 text-gray-800 text-sm truncate">{s.teacher?.fullName || '—'}</p>
                <StarRating value={Number(s.avg)} readonly size={14}/>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-2xl font-900 text-amber-500">{s.avg}</p>
                <p className="text-xs text-gray-400">{s.count} baho</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-5">
        {/* Taqsimot */}
        <div className="card p-4">
          <h3 className="font-800 text-gray-800 text-sm mb-3">Baho taqsimoti</h3>
          <div className="flex items-center gap-3 mb-4">
            <p className="text-4xl font-900 text-gray-800">{avgFiltered}</p>
            <div>
              <StarRating value={Number(avgFiltered)} readonly size={16}/>
              <p className="text-xs text-gray-400 mt-1">{totalFiltered.length} ta baho</p>
            </div>
          </div>
          <div className="space-y-2">
            {starDist.map(d => (
              <div key={d.star} className="flex items-center gap-2">
                <span className="text-xs font-700 text-gray-500 w-4 text-right">{d.star}</span>
                <Star size={11} className="text-yellow-400 fill-yellow-400 flex-shrink-0"/>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-400 rounded-full transition-all"
                    style={{ width: totalFiltered.length ? `${(d.count/totalFiltered.length)*100}%` : '0%' }}/>
                </div>
                <span className="text-xs text-gray-400 w-4">{d.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Jadval */}
        <div className="lg:col-span-3 card overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Qidirish..."
                className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 text-xs outline-none focus:border-primary bg-gray-50 font-500"/>
            </div>
            <select value={filterTeacher} onChange={e => setFilterTeacher(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-200 text-xs font-600 text-gray-600 bg-white outline-none focus:border-primary">
              <option value="">Barcha o'qituvchilar</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.fullName}</option>)}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  {['#', "O'qituvchi", 'Dars', 'Baho', 'Izoh', 'Sana', 'Amallar'].map(h => (
                    <th key={h} className="table-header first:pl-4 last:pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7}><Empty icon="⭐" text="Baholar topilmadi"/></td></tr>
                ) : filtered.map((r, i) => {
                  const teacher = getTeacher(r);
                  const lesson  = getLesson(r);
                  return (
                    <tr key={r.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="table-cell pl-4 text-gray-400 font-700 text-xs">{i + 1}</td>
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <Avatar name={teacher?.fullName} photo={teacher?.photo} size="sm"/>
                          <span className="font-700 text-gray-800 text-xs">{teacher?.fullName || '—'}</span>
                        </div>
                      </td>
                      <td className="table-cell text-xs text-gray-500 max-w-32">
                        <span className="truncate block max-w-28">{lesson?.title || '—'}</span>
                        {lesson?.date && <span className="text-gray-400 block text-[10px]">{dayjs(lesson.date).format('DD.MM.YYYY')}</span>}
                      </td>
                      <td className="table-cell">
                        <StarRating value={r.score} readonly size={14}/>
                      </td>
                      <td className="table-cell text-xs text-gray-500 max-w-40">
                        <span className="truncate block max-w-36">{r.comment || '—'}</span>
                      </td>
                      <td className="table-cell text-xs text-gray-400 whitespace-nowrap">
                        {getDate(r)}
                      </td>
                      <td className="table-cell pr-4">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEdit(r)}
                            className="w-6 h-6 rounded-md bg-blue-50 text-blue-500 hover:bg-blue-100 flex items-center justify-center transition-colors">
                            <Edit2 size={11}/>
                          </button>
                          <button onClick={() => setDeleteId(r.id)}
                            className="w-6 h-6 rounded-md bg-red-50 text-red-400 hover:bg-red-100 flex items-center justify-center transition-colors">
                            <Trash2 size={11}/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <RatingModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditData(null); }}
        onSave={load}
        teachers={teachers}
        lessons={lessons}
        groups={groups}
        courses={courses}
        editData={editData}
      />

      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}
        title="Bahoni o'chirish" description="Bu bahoni o'chirishni tasdiqlaysizmi?"
        onConfirm={async () => {
          await ratingsAPI.delete(deleteId);
          setDeleteId(null); load();
          toast.success("O'chirildi");
        }}
      />
    </div>
  );
}
