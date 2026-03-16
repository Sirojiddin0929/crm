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
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left selectors */}
        <div className="space-y-3">
          <div className="card p-4">
            <p className="text-xs font-800 text-gray-500 uppercase tracking-wide mb-3">Guruh tanlang</p>
            <div className="space-y-1.5">
              {groups.map(g => (
                <button key={g.id} onClick={() => selectGroup(g.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-700 transition-colors ${selectedGroup == g.id ? 'bg-primary text-white' : 'hover:bg-gray-50 text-gray-700'}`}>
                  {g.name}
                </button>
              ))}
              {groups.length === 0 && <p className="text-xs text-gray-400 text-center py-3">Guruhlar yo'q</p>}
            </div>
          </div>
          {selectedGroup && (
            <div className="card p-4">
              <p className="text-xs font-800 text-gray-500 uppercase tracking-wide mb-3">Dars tanlang</p>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {lessons.map(l => (
                  <button key={l.id} onClick={() => selectLesson(l.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-700 transition-colors ${selectedLesson == l.id ? 'bg-primary/10 text-primary border border-primary/20' : 'hover:bg-gray-50 text-gray-700'}`}>
                    <p className="truncate">{l.title}</p>
                    <p className="text-gray-400 font-500 mt-0.5">{l.date || '—'}</p>
                  </button>
                ))}
                {lessons.length === 0 && <p className="text-xs text-gray-400 text-center py-3">Darslar yo'q</p>}
              </div>
            </div>
          )}
        </div>

        {/* Right attendance list */}
        <div className="lg:col-span-3">
          {!selectedLesson ? (
            <div className="card flex flex-col items-center justify-center h-64">
              <div className="text-4xl mb-3">📋</div>
              <p className="text-sm font-700 text-gray-500">Guruh va dars tanlang</p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                <div>
                  <p className="font-800 text-gray-800 text-sm">Yo'qlama</p>
                  <p className="text-xs text-gray-400">{presentCount} keldi · {students.length - presentCount} kelmadi</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { const all = {}; students.forEach(s => { all[s.id] = true; }); setAttendance(all); }} className="px-3 py-1.5 bg-green-50 text-green-700 text-xs font-700 rounded-lg hover:bg-green-100">Barchasi keldi</button>
                  <button onClick={() => { const none = {}; students.forEach(s => { none[s.id] = false; }); setAttendance(none); }} className="px-3 py-1.5 bg-red-50 text-red-600 text-xs font-700 rounded-lg hover:bg-red-100">Hech kim kelmadi</button>
                  <button onClick={save} disabled={saving} className="btn-primary text-xs">{saving ? 'Saqlanmoqda...' : 'Saqlash'}</button>
                </div>
              </div>
              <div className="divide-y divide-gray-50">
                {students.map((s, i) => {
                  const present = attendance[s.id] ?? false;
                  return (
                    <div key={s.id} className={`flex items-center justify-between px-4 py-3 transition-colors ${present ? 'hover:bg-green-50/30' : 'hover:bg-red-50/20'}`}>
                      <div className="flex items-center gap-3">
                        <span className="w-6 text-xs font-800 text-gray-400">{i + 1}</span>
                        <Avatar name={s.fullName} size="sm"/>
                        <div>
                          <p className="font-700 text-sm text-gray-800">{s.fullName}</p>
                          <p className="text-xs text-gray-400">{s.phone || '—'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-700 ${present ? 'text-green-600' : 'text-red-400'}`}>
                          {present ? '✓ Keldi' : '✗ Kelmadi'}
                        </span>
                        <Toggle value={present} onChange={() => setAttendance(prev => ({ ...prev, [s.id]: !prev[s.id] }))}/>
                      </div>
                    </div>
                  );
                })}
                {students.length === 0 && <Empty text="Talabalar topilmadi"/>}
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

  const handleFile = f => { setFile(f); if (!title) setTitle(f.name.replace(/\.[^.]+$/, '')); };
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

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead><tr>
            {['Video nomi', 'Dars', 'Status', 'Sana', 'Hajm', 'Amal'].map(h => <th key={h} className="table-header first:pl-4 last:pr-4">{h}</th>)}
          </tr></thead>
          <tbody>
            {videos.length === 0 ? <tr><td colSpan={6}><Empty text="Videolar topilmadi"/></td></tr>
              : videos.map(v => {
                const lesson = lessons.find(l => l.id === v.lessonId);
                return (
                  <tr key={v.id} className="hover:bg-gray-50/60">
                    <td className="table-cell pl-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0"><Play size={14} className="text-primary"/></div>
                        <a href={v.url || '#'} target="_blank" rel="noreferrer" className="text-primary font-700 text-xs hover:underline truncate max-w-36 block">{v.title || '—'}</a>
                      </div>
                    </td>
                    <td className="table-cell text-xs font-600 text-gray-600">{lesson?.title || `#${v.lessonId}`}</td>
                    <td className="table-cell"><span className="badge badge-green">Tayyor</span></td>
                    <td className="table-cell text-xs text-gray-400">{v.createdAt ? dayjs(v.createdAt).format('DD MMM, YYYY') : '—'}</td>
                    <td className="table-cell text-xs font-700 text-gray-600">{formatBytes(v.size)}</td>
                    <td className="table-cell pr-4">
                      <button onClick={async () => { await lessonVideosAPI.delete(v.id); load(); toast.success("O'chirildi"); }}
                        className="w-7 h-7 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 flex items-center justify-center"><Trash2 size={13}/></button>
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
