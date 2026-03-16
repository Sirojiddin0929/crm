import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Trash2, Upload, Play, FileVideo, X, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';
import { lessonVideosAPI, lessonsAPI, coursesAPI, groupsAPI } from '../../services/api';
import { PageHeader, Dialog, Empty, Field, Select, SearchInput } from '../../components/UI';
import dayjs from 'dayjs';

function formatBytes(bytes) {
  if (!bytes) return '—';
  const gb = bytes / 1e9;
  if (gb >= 1) return gb.toFixed(2) + ' GB';
  return (bytes / 1e6).toFixed(0) + ' MB';
}

// Upload modal
function UploadModal({ open, onClose, lessons, groups, courses, onSuccess }) {
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [courseId, setCourseId] = useState('');
  const [groupId, setGroupId] = useState('');
  const [lessonId, setLessonId] = useState('');
  const [title, setTitle] = useState('');
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  // ✅ FIX: API g.course.id nested qaytaradi, g.courseId yo'q
  const filteredGroups = useMemo(() => (
    courseId ? groups.filter(g => {
      const gCourseId = g.course?.id || g.courseId;
      return String(gCourseId) === String(courseId);
    }) : []
  ), [courseId, groups]);

  const filteredLessons = useMemo(() => (
    groupId ? lessons.filter(l => String(l.groupId || l.group?.id) === String(groupId)) : []
  ), [groupId, lessons]);

  const handleDrop = e => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) { setFile(f); if (!title) setTitle(f.name.replace(/\.[^.]+$/, '')); }
  };

  const handleFile = e => {
    const f = e.target.files[0];
    if (f) { setFile(f); if (!title) setTitle(f.name.replace(/\.[^.]+$/, '')); }
  };

  const handleUpload = async () => {
    if (!file || !lessonId || !title) { toast.error('Barcha maydonlarni to\'ldiring'); return; }
    setUploading(true);
    setProgress(10);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('lessonId', lessonId);
      fd.append('title', title);
      const timer = setInterval(() => setProgress(p => Math.min(p + 10, 85)), 400);
      await lessonVideosAPI.create(fd);
      clearInterval(timer);
      setProgress(100);
      setTimeout(() => {
        toast.success('Video yuklandi!');
        onSuccess();
        onClose();
        reset();
      }, 600);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Xatolik');
      setUploading(false);
      setProgress(0);
    }
  };

  const reset = useCallback(() => {
    setFile(null);
    setDragging(false);
    setCourseId('');
    setGroupId('');
    setLessonId('');
    setTitle('');
    setProgress(0);
    setUploading(false);
  }, []);

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 fade-in overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-800 text-gray-800">Video yuklash</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-md hover:bg-gray-100 flex items-center justify-center text-gray-500">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Drop zone */}
          {!file ? (
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current.click()}
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${dragging ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'}`}
            >
              <input ref={fileRef} type="file" accept="video/*,.mp4,.webm,.mpeg,.avi,.mkv,.m4v,.ogm,.mov,.mpg" className="hidden" onChange={handleFile} />
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Upload size={22} className="text-primary" />
              </div>
              <p className="font-700 text-gray-700 text-sm">Videofaylni yuklash uchun ushbu hudud ustiga bosing yoki faylni shu yerga olib keling</p>
              <p className="text-xs text-gray-400 mt-2">Videofayl .mp4, .webm, .mpeg, .avi, .mkv, .m4v, .ogm, .mov, .mpg formatlaridan birida bo'lishi kerak</p>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-100">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                <FileVideo size={20} className="text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-700 text-gray-800 text-sm truncate">{file.name}</p>
                <p className="text-xs text-gray-400">{formatBytes(file.size)}</p>
              </div>
              <button onClick={reset} className="w-7 h-7 rounded-md hover:bg-green-100 flex items-center justify-center text-green-600">
                <X size={15} />
              </button>
            </div>
          )}

          <Field label="Kurs" required>
            <Select value={courseId} onChange={e => { setCourseId(e.target.value); setGroupId(''); setLessonId(''); }}>
              <option value="">Kursni tanlang</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </Field>

          <Field label="Guruh" required>
            <Select value={groupId} onChange={e => { setGroupId(e.target.value); setLessonId(''); }} disabled={!courseId}>
              <option value="">Guruhni tanlang</option>
              {filteredGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </Select>
          </Field>
            
          <Field label="Dars" required>
            <Select value={lessonId} onChange={e => setLessonId(e.target.value)} disabled={!groupId}>
              <option value="">Darsni tanlang</option>
              {filteredLessons.map(l => (
                <option key={l.id} value={l.id}>
                  {l.title} {l.date ? `(${dayjs(l.date).format('DD.MM.YYYY')})` : ''}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Video sarlavhasi" required>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Video nomi"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 font-500"
            />
          </Field>

          {/* Progress */}
          {uploading && (
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-xs font-700 text-gray-600">Yuklanmoqda...</span>
                <span className="text-xs font-700 text-primary">{progress}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={onClose} className="btn-secondary flex-1 justify-center">Bekor qilish</button>
            <button
              onClick={handleUpload}
              disabled={uploading || !file}
              className="btn-primary flex-1 justify-center disabled:opacity-60"
            >
              {uploading ? 'Yuklanmoqda...' : 'Yuklash'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditVideoModal({ open, onClose, video, lessons, groups, courses, onSuccess }) {
  const [courseId, setCourseId] = useState('');
  const [groupId, setGroupId] = useState('');
  const [lessonId, setLessonId] = useState('');
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef();

  const reset = useCallback(() => {
    setCourseId('');
    setGroupId('');
    setLessonId('');
    setTitle('');
    setSaving(false);
    setFile(null);
    setDragging(false);
  }, []);

  useEffect(() => {
    if (!open) {
      reset();
      return;
    }
    if (!video) return;
    const lesson = lessons.find(l => l.id === video.lessonId) || {};
    const normalizedGroupId = lesson.groupId || lesson.group?.id || '';
    const group = groups.find(g => g.id === normalizedGroupId) || {};
    const normalizedCourseId = group.course?.id || group.courseId || '';
    setCourseId(normalizedCourseId ? String(normalizedCourseId) : '');
    setGroupId(normalizedGroupId ? String(normalizedGroupId) : '');
    setLessonId(video.lessonId ? String(video.lessonId) : '');
    setTitle(video.title || video.originalName || '');
    setFile(null);
    setDragging(false);
  }, [open, video, lessons, groups, reset]);

  const filteredGroups = useMemo(() => (
    courseId ? groups.filter(g => String(g.course?.id || g.courseId) === String(courseId)) : []
  ), [courseId, groups]);

  const filteredLessons = useMemo(() => (
    groupId ? lessons.filter(l => String(l.groupId || l.group?.id) === String(groupId)) : lessons
  ), [groupId, lessons]);

  const handleDrop = e => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) {
      setFile(f);
    }
  };

  const handleFile = e => {
    const f = e.target.files[0];
    if (f) setFile(f);
  };

  const handleSave = async () => {
    if (!video) return;
    if (!lessonId || !title) { toast.error('Barcha maydonlarni to\'ldiring'); return; }
    setSaving(true);
    try {
      if (file) {
        const fd = new FormData();
        fd.append('title', title);
        fd.append('lessonId', lessonId);
        fd.append('file', file);
        await lessonVideosAPI.update(video.id, fd);
      } else {
        await lessonVideosAPI.update(video.id, { title, lessonId });
      }
      toast.success('Video yangilandi!');
      onSuccess();
      onClose();
      reset();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Xatolik');
    } finally {
      setSaving(false);
    }
  };

  if (!open || !video) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 fade-in overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-800 text-gray-800">Video ma'lumotlarini tahrirlash</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-md hover:bg-gray-100 flex items-center justify-center text-gray-500">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <Field label="Yangi video fayl">
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${dragging ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'}`}
            >
              <input ref={fileRef} type="file" accept="video/*,.mp4,.webm,.mpeg,.avi,.mkv,.m4v,.ogm,.mov,.mpg" className="hidden" onChange={handleFile} />
              {file ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileVideo size={20} className="text-primary" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-700 text-gray-800 text-sm truncate">{file.name}</p>
                    <p className="text-xs text-gray-400">{formatBytes(file.size)}</p>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); setFile(null); }}
                    className="w-7 h-7 rounded-md hover:bg-gray-100 flex items-center justify-center text-gray-500"
                  >
                    <X size={15} />
                  </button>
                </div>
              ) : (
                <div className="space-y-1 text-gray-400 text-xs">
                  <p>Yangi video yuklash uchun shu yerga fayl olib keling yoki ustiga bosing</p>
                  <p className="text-[11px]">.mp4, .webm, .mpeg, .avi, .mkv, .m4v, .ogm, .mov, .mpg</p>
                </div>
              )}
            </div>
            <p className="text-[11px] text-gray-400 mt-2">
              Joriy fayl: {video?.originalName || video?.title || '—'}
              {video?.fileUrl && (
                <a
                  href={video.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline ml-1"
                  onClick={e => e.stopPropagation()}
                >
                  Ko'rish
                </a>
              )}
            </p>
          </Field>
          <Field label="Kurs" required>
            <Select value={courseId} onChange={e => { setCourseId(e.target.value); setGroupId(''); setLessonId(''); }}>
              <option value="">Kursni tanlang</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </Field>

          <Field label="Guruh" required>
            <Select value={groupId} onChange={e => { setGroupId(e.target.value); setLessonId(''); }} disabled={!courseId}>
              <option value="">Guruhni tanlang</option>
              {filteredGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </Select>
          </Field>

          <Field label="Dars" required>
            <Select value={lessonId} onChange={e => setLessonId(e.target.value)} disabled={!groupId}>
              <option value="">Darsni tanlang</option>
              {filteredLessons.map(l => (
                <option key={l.id} value={l.id}>
                  {l.title} {l.date ? `(${dayjs(l.date).format('DD.MM.YYYY')})` : ''}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Video sarlavhasi" required>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Video nomi"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 font-500"
            />
          </Field>

          <div className="flex gap-3">
            <button onClick={onClose} className="btn-secondary flex-1 justify-center">Bekor qilish</button>
            <button
              onClick={handleSave}
              disabled={saving || !lessonId}
              className="btn-primary flex-1 justify-center disabled:opacity-60"
            >
              {saving ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Videos() {
  const [videos, setVideos] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [search, setSearch] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [editVideo, setEditVideo] = useState(null);
  const [filterLesson, setFilterLesson] = useState('');
  const [courses, setCourses] = useState([]);
  const [groups, setGroups] = useState([]);
  const [filterCourse, setFilterCourse] = useState('');
  const [filterGroup, setFilterGroup] = useState('');
  const [activeVideo, setActiveVideo] = useState(null);

  const load = async () => {
    try {
      const [v, l, c, g] = await Promise.all([
        lessonVideosAPI.getAll({}),
        lessonsAPI.getAll({}),
        coursesAPI.getAll(),
        groupsAPI.getAll(),
      ]);
      setVideos(v.data || []);
      setLessons(l.data || []);
      setCourses(c.data || []);
      setGroups(g.data || []);
      setActiveVideo(v.data?.[0] || null);
    } catch { toast.error('Xatolik'); }
  };

  const courseMap = useMemo(() => {
    const map = {};
    courses.forEach(c => { map[c.id] = c; });
    return map;
  }, [courses]);

  const groupMap = useMemo(() => {
    const map = {};
    groups.forEach(g => { map[g.id] = g; });
    return map;
  }, [groups]);

  const lessonMap = useMemo(() => {
    const map = {};
    lessons.forEach(l => {
      const normalizedGroupId = l.groupId || l.group?.id;
      map[l.id] = { ...l, groupId: normalizedGroupId };
    });
    return map;
  }, [lessons]);

  // ✅ FIX: g.course?.id ishlatiladi
  const filteredGroupsForFilter = useMemo(() => (
    filterCourse ? groups.filter(g => String(g.course?.id || g.courseId) === String(filterCourse)) : groups
  ), [filterCourse, groups]);

  const filteredLessonsForFilter = useMemo(() => (
    filterGroup ? lessons.filter(l => String(l.groupId || l.group?.id) === String(filterGroup)) : lessons
  ), [filterGroup, lessons]);

  useEffect(() => {
    setFilterGroup('');
    setFilterLesson('');
  }, [filterCourse]);

  useEffect(() => {
    setFilterLesson('');
  }, [filterGroup]);

  useEffect(() => { load(); }, []);

  const filtered = videos.filter(v => {
    const lesson = lessonMap[v.lessonId];
    const group = lesson ? groupMap[lesson.groupId] : null;
    const matchSearch = v.title?.toLowerCase().includes(search.toLowerCase()) || v.originalName?.toLowerCase().includes(search.toLowerCase());
    // ✅ FIX: filter da ham String() bilan taqqoslash
    const matchCourse = filterCourse ? String(group?.course?.id || group?.courseId) === String(filterCourse) : true;
    const matchGroup = filterGroup ? String(lesson?.groupId) === String(filterGroup) : true;
    const matchLesson = filterLesson ? String(v.lessonId) === String(filterLesson) : true;
    return matchSearch && matchCourse && matchGroup && matchLesson;
  });

  useEffect(() => {
    if (!filtered.length) {
      setActiveVideo(null);
      return;
    }
    if (!activeVideo || !filtered.some(v => v.id === activeVideo.id)) {
      setActiveVideo(filtered[0]);
    }
  }, [filtered, activeVideo]);

  const getLessonName = id => lessonMap[id]?.title || '—';
  const getLessonDate = id => lessonMap[id]?.date ? dayjs(lessonMap[id].date).format('DD MMM, YYYY HH:mm') : '—';
  const getVideoLessonGroup = id => lessonMap[id] ? groupMap[lessonMap[id].groupId]?.name || '—' : '—';
  const getVideoLessonCourse = id => {
    const lesson = lessonMap[id];
    const group = lesson ? groupMap[lesson.groupId] : null;
    // API group.course nested qaytaradi
    return group?.course?.name || courseMap[group?.course?.id || group?.courseId]?.name || '—';
  };

  return (
    <div className="fade-in">
      <PageHeader
        title="Dars Videolari"
        subtitle={`${videos.length} ta video`}
        actions={
          <>
            
            <button className="btn-primary" onClick={() => setUploadOpen(true)}>
              <Plus size={14} /> Video qo'shish
            </button>
          </>
        }
      />

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="w-56"><SearchInput value={search} onChange={setSearch} placeholder="Video nomi" /></div>
        <div className="w-48">
          <Select value={filterCourse} onChange={e => setFilterCourse(e.target.value)} className="w-full text-xs">
            <option value="">Barcha kurslar</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </div>
        <div className="w-48">
          <Select value={filterGroup} onChange={e => setFilterGroup(e.target.value)} className="w-full text-xs" disabled={!filterCourse}>
            <option value="">Barcha guruhlar</option>
            {filteredGroupsForFilter.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </Select>
        </div>
        <div className="w-48">
          <Select value={filterLesson} onChange={e => setFilterLesson(e.target.value)} className="w-full text-xs">
            <option value="">Barcha darslar</option>
            {filteredLessonsForFilter.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
          </Select>
        </div>
      </div>

      <div className="card mb-4">
        {activeVideo ? (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-700 text-sm text-gray-800 truncate">{activeVideo.title || activeVideo.originalName || '—'}</p>
                <p className="text-xs text-gray-500">
                  {getLessonName(activeVideo.lessonId)} · {getVideoLessonCourse(activeVideo.lessonId)} / {getVideoLessonGroup(activeVideo.lessonId)}
                </p>
              </div>
              <button
                onClick={() => activeVideo.fileUrl && window.open(activeVideo.fileUrl, '_blank')}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-primary text-xs font-600 text-primary"
              >
                <Play size={12} /> Videoni ochish
              </button>
            </div>
            {activeVideo.fileUrl ? (
              <video controls src={activeVideo.fileUrl} className="w-full h-48 rounded-2xl bg-black" />
            ) : (
              <div className="px-4 py-6 rounded-2xl bg-gray-50 text-center text-xs text-gray-500">Video manzili topilmadi</div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-500">
              <div>
                <p className="text-gray-400">Dars sanasi</p>
                <p className="font-700 text-gray-800">{getLessonDate(activeVideo.lessonId)}</p>
              </div>
              <div>
                <p className="text-gray-400">Hajmi</p>
                <p className="font-700 text-gray-800">{formatBytes(activeVideo.size || activeVideo.fileSize)}</p>
              </div>
              <div>
                <p className="text-gray-400">Qo'shilgan vaqti</p>
                <p className="font-700 text-gray-800">{(activeVideo.createdAt || activeVideo.created_at) ? dayjs(activeVideo.createdAt || activeVideo.created_at).format('DD MMM, YYYY HH:mm') : '—'}</p>
              </div>
              <div>
                <p className="text-gray-400">Holat</p>
                <p className="font-700 text-gray-800">Tayyor</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-gray-400">Video tanlanmagan — jadvaldan video ustiga bosing</div>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                {['Video nomi', 'Dars nomi', 'Status', 'Dars sanasi', 'Hajmi', "Qo'shilgan vaqti", 'Harakatlar'].map(h => (
                  <th key={h} className="table-header first:pl-4 last:pr-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7}><Empty text="Videolar topilmadi" /></td></tr>
              ) : filtered.map(v => (
                <tr
                  key={v.id}
                  onClick={() => setActiveVideo(v)}
                  className={`transition-colors cursor-pointer ${activeVideo?.id === v.id ? 'bg-primary/10' : 'hover:bg-gray-50/60'}`}
                >
                  <td className="table-cell pl-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Play size={14} className="text-primary" />
                      </div>
                      <a
                        href={v.fileUrl || '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary font-700 text-xs hover:underline truncate max-w-40 block"
                      >
                        {v.title || v.originalName || '—'}
                      </a>
                    </div>
                  </td>
                  <td className="table-cell text-xs text-gray-600 font-600">{getLessonName(v.lessonId)}</td>
                  <td className="table-cell">
                    <span className="badge badge-green">Tayyor</span>
                  </td>
                  <td className="table-cell text-xs text-gray-500">{getLessonDate(v.lessonId)}</td>
                  <td className="table-cell text-xs font-700 text-gray-600">{formatBytes(v.size || v.fileSize)}</td>
                  <td className="table-cell text-xs text-gray-400">
                    {(v.createdAt || v.created_at) ? dayjs(v.createdAt || v.created_at).format('DD MMM, YYYY HH:mm') : '—'}
                  </td>
                  <td className="table-cell pr-4">
                    <div className="flex items-center justify-center">
                      <button
                        onClick={e => { e.stopPropagation(); setEditVideo(v); }}
                        className="w-7 h-7 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 flex items-center justify-center transition-colors"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); setDeleteId(v.id); }}
                        className="w-7 h-7 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 flex items-center justify-center transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        lessons={lessons}
        groups={groups}
        courses={courses}
        onSuccess={load}
      />

      <EditVideoModal
        open={!!editVideo}
        onClose={() => setEditVideo(null)}
        video={editVideo}
        lessons={lessons}
        groups={groups}
        courses={courses}
        onSuccess={load}
      />

      <Dialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Videoni o'chirish"
        description="Bu videoni o'chirishni tasdiqlaysizmi?"
        onConfirm={async () => { await lessonVideosAPI.delete(deleteId); setDeleteId(null); load(); toast.success("O'chirildi"); }}
      />
    </div>
  );
}
