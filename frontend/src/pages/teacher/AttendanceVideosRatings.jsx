// ── ATTENDANCE ─────────────────────────────────────────────────────────────
import React, { useEffect, useState } from 'react';
import { RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { PageHeader, Empty, Avatar, Toggle, SearchInput } from '../../components/UI';
import { useTeacherAuth } from '../../context/TeacherAuthContext';
import { groupsAPI, lessonsAPI, attendanceAPI } from '../../services/api';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

export function TeacherAttendance() {
  const { user } = useTeacherAuth();
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [students, setStudents] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [selectedLesson, setSelectedLesson] = useState('');
  const [attendance, setAttendance] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    groupsAPI.getAll({ teacherId: user.id }).then(r => setGroups(r.data || [])).catch(() => {});
  }, [user]);

  const selectGroup = async gid => {
    setSelectedGroup(gid);
    setSelectedLesson('');
    setStudents([]);
    setAttendance({});
    try {
      const [s, l] = await Promise.all([groupsAPI.getStudents(gid), lessonsAPI.getAll({ groupId: gid, teacherId: user?.id })]);
      setStudents(s.data || []);
      setLessons(l.data || []);
    } catch {}
  };

  const selectLesson = async lid => {
    setSelectedLesson(lid);
    try {
      const att = await attendanceAPI.getByLesson(lid);
      const map = {};
      students.forEach(s => { map[s.id] = false; });
      (att.data || []).forEach(a => { map[a.studentId] = a.isPresent; });
      setAttendance(map);
    } catch {}
  };

  const save = async () => {
    if (!selectedLesson) { toast.error('Dars tanlang'); return; }
    setSaving(true);
    try {
      const records = students.map(s => ({ lessonId: Number(selectedLesson), studentId: s.id, isPresent: attendance[s.id] || false, teacherId: user?.id, userId: 1 }));
      await attendanceAPI.bulkCreate({ records });
      toast.success('Davomat saqlandi!');
    } catch (e) { toast.error(e.response?.data?.message || 'Xatolik'); }
    finally { setSaving(false); }
  };

  const presentCount = Object.values(attendance).filter(Boolean).length;

  return (
    <div className="fade-in">
      <PageHeader title="Davomat belgilash" subtitle="Guruh va dars tanlang"/>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Left selectors */}
        <div className="space-y-4">
          <div className="card p-5">
            <p className="text-[10px] font-900 text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">1. Guruh tanlang</p>
            <div className="space-y-2">
              {groups.map(g => (
                <button key={g.id} onClick={() => selectGroup(g.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-800 transition-all ${selectedGroup == g.id ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]' : 'hover:bg-primary/5 text-gray-700 dark:text-gray-300 dark:hover:bg-white/5 border border-transparent'}`}>
                  {g.name}
                </button>
              ))}
              {groups.length === 0 && <p className="text-xs text-gray-400 text-center py-4 italic">Guruhlar yo'q</p>}
            </div>
          </div>
          {selectedGroup && (
            <div className="card p-5 animate-in fade-in slide-in-from-top-2">
              <p className="text-[10px] font-900 text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">2. Dars tanlang</p>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                {lessons.map(l => (
                  <button key={l.id} onClick={() => selectLesson(l.id)}
                    className={`w-full text-left px-4 py-3 rounded-xl text-xs font-800 transition-all border ${selectedLesson == l.id ? 'bg-primary/5 text-primary border-primary/20 ring-1 ring-primary/20' : 'hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300 border-transparent'}`}>
                    <p className="truncate font-900 uppercase tracking-tight">{l.title}</p>
                    <p className="text-gray-400 dark:text-gray-500 font-700 mt-1 flex items-center gap-1">📅 {l.date || '—'}</p>
                  </button>
                ))}
                {lessons.length === 0 && <p className="text-xs text-gray-400 text-center py-4 italic">Darslar hali yaratilmagan</p>}
              </div>
            </div>
          )}
        </div>

        {/* Right attendance list */}
        <div className="lg:col-span-3">
          {!selectedLesson ? (
            <div className="card flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed border-gray-100 dark:border-white/5 bg-gray-50/30 dark:bg-white/[0.02]">
              <div className="w-20 h-20 rounded-3xl bg-primary/5 flex items-center justify-center mb-5">
                <RefreshCw size={32} className="text-primary/40 animate-pulse"/>
              </div>
              <p className="text-base font-900 text-gray-800 dark:text-gray-100">Darsni tanlang</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-700">Davomatni belgilash uchun yuqoridagi ro'yxatdan darsni tanlang</p>
            </div>
          ) : (
            <div className="card overflow-hidden shadow-xl shadow-primary/5">
              <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-5 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5">
                <div>
                  <h3 className="font-900 text-gray-800 dark:text-gray-100 text-lg tracking-tight">Talabalar yo'qlamasi</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] font-900 text-green-600 uppercase tracking-widest bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-md">{presentCount} keldi</span>
                    <span className="text-[10px] font-900 text-red-500 uppercase tracking-widest bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-md">{students.length - presentCount} kelmadi</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => { const all = {}; students.forEach(s => { all[s.id] = true; }); setAttendance(all); }} className="px-4 py-2 bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-500 text-[11px] font-900 uppercase tracking-wider rounded-xl hover:bg-green-100 dark:hover:bg-green-900/20 transition-colors">Barchasi ✅</button>
                  <button onClick={() => { const none = {}; students.forEach(s => { none[s.id] = false; }); setAttendance(none); }} className="px-4 py-2 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-500 text-[11px] font-900 uppercase tracking-wider rounded-xl hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors">Hech kim ❌</button>
                  <button onClick={save} disabled={saving} className="btn-primary py-2 px-6 text-xs font-900 uppercase tracking-widest shadow-lg shadow-primary/25 disabled:opacity-50">{saving ? 'Saqlanmoqda...' : 'Saqlash'}</button>
                </div>
              </div>
              <div className="divide-y divide-gray-50 dark:divide-white/5">
                {students.map((s, i) => {
                  const isPresent = attendance[s.id] ?? false;
                  return (
                    <div key={s.id} className={`flex items-center justify-between px-6 py-4.5 transition-all hover:bg-gray-50 dark:hover:bg-white/5 ${isPresent ? 'dark:bg-green-900/5' : 'dark:bg-red-900/5'}`}>
                      <div className="flex items-center gap-4">
                        <span className="w-6 text-[10px] font-900 text-gray-300 dark:text-gray-600 uppercase">#{i + 1}</span>
                        <Avatar name={s.fullName} size="md" className="ring-2 ring-white dark:ring-gray-800 shadow-sm"/>
                        <div>
                          <p className="font-800 text-[15px] text-gray-800 dark:text-gray-100 leading-none">{s.fullName}</p>
                          <p className="text-[11px] text-gray-400 dark:text-gray-500 font-700 mt-1 uppercase tracking-tighter">{s.phone || 'Telefon raqamsiz'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-5">
                        <span className={`text-[11px] font-900 uppercase tracking-widest hidden sm:block ${isPresent ? 'text-green-600' : 'text-red-500'}`}>
                          {isPresent ? 'Keldi' : 'Kelmagan'}
                        </span>
                        <Toggle value={isPresent} onChange={() => setAttendance(prev => ({ ...prev, [s.id]: !prev[s.id] }))}/>
                      </div>
                    </div>
                  );
                })}
                {students.length === 0 && <div className="p-20"><Empty text="Talabalar topilmadi"/></div>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── VIDEOS ─────────────────────────────────────────────────────────────────
import { lessonVideosAPI } from '../../services/api';
import { useRef } from 'react';
import { Play, FileVideo, Upload, Trash2, X } from 'lucide-react';

export function TeacherVideos() {
  const { user } = useTeacherAuth();
  const [videos, setVideos] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [lessonId, setLessonId] = useState('');
  const [title, setTitle] = useState('');
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef();

  const load = async () => {
    try {
      const [v, l] = await Promise.all([lessonVideosAPI.getAll({}), lessonsAPI.getAll({ teacherId: user?.id })]);
      setVideos(v.data || []);
      setLessons(l.data || []);
    } catch {}
  };
  useEffect(() => { if (user?.id) load(); }, [user]);

  const handleFile = f => { 
    if (f.size > 500 * 1024 * 1024) {
      toast.error("Fayl juda katta. Maksimal 500MB yuklash mumkin.");
      return;
    }
    setFile(f); 
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, '')); 
  };
  const formatBytes = b => { if (!b) return '—'; const gb = b / 1e9; return gb >= 1 ? gb.toFixed(2) + ' GB' : (b / 1e6).toFixed(0) + ' MB'; };

  const handleUpload = async () => {
    if (!file || !lessonId || !title) { toast.error('Barcha maydonlarni to\'ldiring'); return; }
    setUploading(true); setProgress(10);
    try {
      const fd = new FormData();
      fd.append('file', file); fd.append('lessonId', lessonId); fd.append('title', title); fd.append('teacherId', user?.id);
      const timer = setInterval(() => setProgress(p => Math.min(p + 8, 85)), 400);
      await lessonVideosAPI.create(fd);
      clearInterval(timer); setProgress(100);
      setTimeout(() => { toast.success('Video yuklandi!'); setUploadOpen(false); setFile(null); setLessonId(''); setTitle(''); setProgress(0); setUploading(false); load(); }, 600);
    } catch (e) { toast.error(e.response?.data?.message || 'Xatolik'); setUploading(false); setProgress(0); }
  };

  return (
    <div className="fade-in">
      <PageHeader title="Dars Videolari" subtitle={`${videos.length} ta video`}
        actions={<button className="btn-primary" onClick={() => setUploadOpen(true)}><Upload size={14}/> Video yuklash</button>}/>

      <div className="card overflow-hidden shadow-xl shadow-primary/5">
        <div className="px-6 py-5 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 flex items-center justify-between">
            <div>
              <h3 className="font-900 text-gray-800 dark:text-gray-100 text-base tracking-tight uppercase">Barcha videolar</h3>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 font-700 mt-0.5 tracking-widest">{videos.length} TA VIDEO MAVJUD</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary"><FileVideo size={20}/></div>
        </div>
        <table className="w-full">
          <thead><tr>
            {['Video nomi', 'Tegishli dars', 'Holati', 'Yuklangan sana', 'Hajm', 'Amal'].map(h => <th key={h} className="table-header first:pl-6 last:pr-6">{h}</th>)}
          </tr></thead>
          <tbody>
            {videos.length === 0 ? <tr><td colSpan={6}><Empty text="Hali videolar yuklanmagan"/></td></tr>
              : videos.map((v, idx) => {
                const lesson = lessons.find(l => l.id === v.lessonId);
                return (
                  <tr key={v.id} className="group hover:bg-gray-50/60 dark:hover:bg-white/5 transition-all">
                    <td className="table-cell pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary/5 dark:bg-primary/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform"><Play size={16} className="text-primary fill-primary/10"/></div>
                        <a href={v.url || '#'} target="_blank" rel="noreferrer" className="text-gray-800 dark:text-gray-200 font-800 text-xs hover:text-primary transition-colors truncate max-w-48 block">{v.title || '—'}</a>
                      </div>
                    </td>
                    <td className="table-cell">
                        <span className="text-[11px] font-900 text-primary dark:text-primary uppercase tracking-tighter bg-primary/5 px-2 py-1 rounded-lg border border-primary/10">{lesson?.title || `#${v.lessonId}`}</span>
                    </td>
                    <td className="table-cell"><span className="badge badge-green">Ready</span></td>
                    <td className="table-cell text-[11px] text-gray-400 dark:text-gray-500 font-700">{v.createdAt ? dayjs(v.createdAt).format('DD MMMM, YYYY') : '—'}</td>
                    <td className="table-cell text-[11px] font-800 text-gray-600 dark:text-gray-400">{formatBytes(v.size)}</td>
                    <td className="table-cell pr-6">
                      <button onClick={async () => { if(confirm("O'chirilsinmi?")) { await lessonVideosAPI.delete(v.id); load(); toast.success("Video o'chirildi"); } }}
                        className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-900/10 text-red-500 dark:text-red-500 hover:bg-red-500 hover:text-white dark:hover:bg-red-500 border border-transparent hover:border-red-600 transition-all flex items-center justify-center"><Trash2 size={14}/></button>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {/* Upload modal */}
      {uploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setUploadOpen(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"/>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 fade-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-800 text-gray-800">Video yuklash</h2>
              <button onClick={() => setUploadOpen(false)} className="w-7 h-7 rounded-md hover:bg-gray-100 flex items-center justify-center text-gray-500"><X size={16}/></button>
            </div>
            <div className="p-5 space-y-4">
              {!file ? (
                <div onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)}
                  onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if(f) handleFile(f); }}
                  onClick={() => fileRef.current.click()}
                  className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${dragging ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'}`}>
                  <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={e => { const f = e.target.files[0]; if(f) handleFile(f); }}/>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3"><Upload size={22} className="text-primary"/></div>
                  <p className="font-700 text-gray-700 text-sm">Videofaylni yuklash uchun ushbu hudud ustiga bosing yoki faylni shu yerga olib keling</p>
                  <p className="text-xs text-gray-400 mt-2">Videofayl .mp4, .webm, .mpeg, .avi, .mkv, .m4v, .ogm, .mov, .mpg formatlaridan birida bo'lishi kerak</p>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-100">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0"><FileVideo size={20} className="text-green-600"/></div>
                  <div className="flex-1 min-w-0">
                    <p className="font-700 text-gray-800 text-sm truncate">{file.name}</p>
                    <p className="text-xs text-gray-400">{formatBytes(file.size)}</p>
                  </div>
                  <button onClick={() => setFile(null)} className="w-7 h-7 rounded-md hover:bg-green-100 flex items-center justify-center text-green-600"><X size={15}/></button>
                </div>
              )}
              <div>
                <label className="text-xs font-700 text-gray-600 block mb-1.5">Dars <span className="text-red-500">*</span></label>
                <select value={lessonId} onChange={e => setLessonId(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-primary bg-white font-500">
                  <option value="">Darsni tanlang</option>
                  {lessons.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-700 text-gray-600 block mb-1.5">Video sarlavhasi <span className="text-red-500">*</span></label>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Video nomi" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-primary font-500"/>
              </div>
              {uploading && (
                <div>
                  <div className="flex justify-between mb-1"><span className="text-xs font-700 text-gray-600">Yuklanmoqda...</span><span className="text-xs font-700 text-primary">{progress}%</span></div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${progress}%` }}/></div>
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={() => setUploadOpen(false)} className="btn-secondary flex-1 justify-center">Bekor qilish</button>
                <button onClick={handleUpload} disabled={uploading || !file} className="btn-primary flex-1 justify-center disabled:opacity-60">{uploading ? 'Yuklanmoqda...' : 'Yuklash'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── RATINGS ─────────────────────────────────────────────────────────────────
import { ratingsAPI } from '../../services/api';
import { Star, TrendingUp } from 'lucide-react';

export function TeacherRatings() {
  const { user } = useTeacherAuth();
  const [ratings, setRatings] = useState([]);
  const [avg, setAvg] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!user?.id) return;
    ratingsAPI.getByTeacher(user.id).then(r => {
      const d = r.data;
      const list = d?.ratings || (Array.isArray(d) ? d : []);
      setRatings(list);
      setTotal(list.length);
      const a = d?.avgRating || (list.length ? list.reduce((s, x) => s + x.score, 0) / list.length : 0);
      setAvg(Number(a).toFixed(1));
    }).catch(() => {});
  }, [user]);

  const dist = [5, 4, 3, 2, 1].map(s => ({ star: s, count: ratings.filter(r => Math.round(r.score) === s).length }));

  return (
    <div className="fade-in">
      <PageHeader title="Reytingim" subtitle="Talabalar bahosi"/>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Avg */}
        <div className="card p-6 text-center">
          <p className="text-6xl font-900 text-gray-800 mb-2">{avg}</p>
          <div className="flex justify-center gap-1 mb-2">
            {[1,2,3,4,5].map(i => <Star key={i} size={20} className={i <= Math.round(avg) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}/>)}
          </div>
          <p className="text-sm text-gray-400 font-600">{total} ta baho asosida</p>
        </div>

        {/* Distribution */}
        <div className="card p-5">
          <h3 className="font-800 text-gray-800 text-sm mb-4">Taqsimot</h3>
          <div className="space-y-2.5">
            {dist.map(d => (
              <div key={d.star} className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-xs font-700 text-gray-600 w-8"><Star size={11} className="text-yellow-400 fill-yellow-400"/>{d.star}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-400 rounded-full transition-all" style={{ width: total ? `${(d.count / total) * 100}%` : '0%' }}/>
                </div>
                <span className="text-xs font-700 text-gray-500 w-4">{d.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent */}
        <div className="card p-5">
          <h3 className="font-800 text-gray-800 text-sm mb-4">So'nggi baholar</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {ratings.slice(0, 8).map(r => (
              <div key={r.id} className="flex items-start justify-between gap-2 pb-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-xs font-700 text-gray-600">{r.comment || 'Izohsiz'}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Talaba #{r.studentId}</p>
                </div>
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  {[1,2,3,4,5].map(i => <Star key={i} size={11} className={i <= r.score ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}/>)}
                </div>
              </div>
            ))}
            {ratings.length === 0 && <p className="text-xs text-gray-400 text-center py-4">Baholar yo'q</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
