import React, { useEffect, useState } from 'react';
import { BookOpen, Users, Clock, ChevronRight, Play, Trash2, Upload, Star, CheckCircle, AlertCircle, X, FileVideo } from 'lucide-react';
import { PageHeader, Empty, Avatar, StatusBadge, Drawer, Field, Input, Select } from '../../components/UI';
import { useStudentAuth } from '../../context/StudentAuthContext';
import { studentsAPI, groupsAPI, lessonsAPI, attendanceAPI, lessonVideosAPI, ratingsAPI, homeworkAPI, homeworkResponsesAPI, homeworkResultsAPI } from '../../services/api';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

const DAYS_UZ = { MONDAY: 'Du', TUESDAY: 'Se', WEDNESDAY: 'Ch', THURSDAY: 'Pa', FRIDAY: 'Ju', SATURDAY: 'Sh', SUNDAY: 'Ya' };

// ─── GROUPS ───────────────────────────────────────────────────────────────
export function StudentGroups() {
  const { user } = useStudentAuth();
  const [groups, setGroups] = useState([]);
  const [selected, setSelected] = useState(null);
  const [lessons, setLessons] = useState([]);

  useEffect(() => {
    if (!user?.id) return;
    studentsAPI.getGroups(user.id).then(r => setGroups(r.data || [])).catch(() => {});
  }, [user]);

  const openGroup = async g => {
    setSelected(g);
    try {
      const l = await lessonsAPI.getAll({ groupId: g.id });
      setLessons(l.data || []);
    } catch { setLessons([]); }
  };

  if (selected) {
    return (
      <div className="fade-in">
        <button onClick={() => setSelected(null)} className="flex items-center gap-1.5 text-sm font-700 text-gray-500 hover:text-gray-800 mb-4">
          ← Guruhlar
        </button>
        <div className="flex items-center gap-3 mb-5">
          <h1 className="text-xl font-800 text-gray-800">{selected.name}</h1>
          <span className="badge badge-green">ACTIVE</span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="card p-4">
            <h3 className="font-700 text-sm text-gray-800 mb-3">Guruh ma'lumotlari</h3>
            {[['Boshlanish', selected.startDate || '—'], ['Tugash', selected.endDate || '—'], ['Dars vaqti', selected.startTime || '—'], ['Dars kunlari', selected.weekDays?.map(d => DAYS_UZ[d]).join(', ') || '—']].map(([k, v]) => (
              <div key={k} className="flex justify-between text-xs py-1.5 border-b border-gray-50 last:border-0">
                <span className="text-gray-400 font-600">{k}</span>
                <span className="text-gray-700 font-700">{v}</span>
              </div>
            ))}
          </div>
          <div className="lg:col-span-2 card overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
              <h3 className="font-700 text-sm text-gray-800">Darslar ({lessons.length})</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {lessons.map((l, i) => (
                <div key={l.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
                  <span className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center text-xs font-800 text-primary">{i+1}</span>
                  <div className="flex-1"><p className="font-700 text-sm text-gray-800">{l.title}</p><p className="text-xs text-gray-400">{l.date || '—'}</p></div>
                  <span className="badge badge-green">O'tildi</span>
                </div>
              ))}
              {lessons.length === 0 && <Empty text="Darslar topilmadi"/>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <PageHeader title="Guruhlarim" subtitle={`${groups.length} ta guruh`}/>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {groups.map(g => (
          <div key={g.id} onClick={() => openGroup(g)} className="card p-4 cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Users size={18} className="text-primary"/></div>
              <div><p className="font-800 text-gray-800">{g.name}</p><span className="badge badge-green">ACTIVE</span></div>
            </div>
            <div className="space-y-1 text-xs text-gray-400">
              <p className="flex items-center gap-1.5"><Clock size={11}/>{g.startTime || '—'} · {g.weekDays?.map(d => DAYS_UZ[d]).join(', ') || '—'}</p>
              <p className="flex items-center gap-1.5"><BookOpen size={11}/>{g.startDate || '—'} → {g.endDate || '...'}</p>
            </div>
          </div>
        ))}
        {groups.length === 0 && <div className="col-span-3 card"><Empty text="Guruhlar topilmadi"/></div>}
      </div>
    </div>
  );
}

// ─── LESSONS ──────────────────────────────────────────────────────────────
export function StudentLessons() {
  const { user } = useStudentAuth();
  const [groups, setGroups] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');

  useEffect(() => {
    if (!user?.id) return;
    studentsAPI.getGroups(user.id).then(r => { const gs = r.data || []; setGroups(gs); if (gs[0]) { setSelectedGroup(gs[0].id); lessonsAPI.getAll({ groupId: gs[0].id }).then(l => setLessons(l.data || [])); } }).catch(() => {});
  }, [user]);

  const changeGroup = async gid => {
    setSelectedGroup(gid);
    try { const l = await lessonsAPI.getAll({ groupId: gid }); setLessons(l.data || []); } catch {}
  };

  return (
    <div className="fade-in">
      <PageHeader title="Darslarim"/>
      {groups.length > 1 && (
        <div className="flex gap-2 mb-4 flex-wrap">
          {groups.map(g => (
            <button key={g.id} onClick={() => changeGroup(g.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-700 transition-colors ${selectedGroup == g.id ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-primary/40'}`}>
              {g.name}
            </button>
          ))}
        </div>
      )}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead><tr>{['#', 'Mavzu', 'Sana', 'Tavsif'].map(h => <th key={h} className="table-header first:pl-4">{h}</th>)}</tr></thead>
          <tbody>
            {lessons.length === 0 ? <tr><td colSpan={4}><Empty text="Darslar topilmadi"/></td></tr>
              : lessons.map((l, i) => (
                <tr key={l.id} className="hover:bg-gray-50/60">
                  <td className="table-cell pl-4 text-gray-400 font-700 text-xs">{i+1}</td>
                  <td className="table-cell font-700 text-gray-800 text-sm">{l.title}</td>
                  <td className="table-cell text-xs text-gray-400">{l.date || '—'}</td>
                  <td className="table-cell text-xs text-gray-500">{l.description || '—'}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── HOMEWORK ─────────────────────────────────────────────────────────────
export function StudentHomework() {
  const { user } = useStudentAuth();
  const [homework, setHomework] = useState([]);
  const [responses, setResponses] = useState([]);
  const [results, setResults] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedHW, setSelectedHW] = useState(null);
  const [form, setForm] = useState({ title: '', url: '' });
  const [tab, setTab] = useState('Vazifalar');

  const load = async () => {
    if (!user?.id) return;
    try {
      const [h, r, res] = await Promise.all([
        homeworkAPI.getAll({ studentId: user.id }),
        homeworkResponsesAPI.getAll({ studentId: user.id }),
        homeworkResultsAPI.getAll({ studentId: user.id }),
      ]);
      setHomework(h.data || []);
      setResponses(r.data || []);
      setResults(res.data || []);
    } catch {}
  };
  useEffect(() => { load(); }, [user]);

  const openSubmit = hw => { setSelectedHW(hw); setForm({ title: '', url: '' }); setDrawerOpen(true); };

  const handleSubmit = async () => {
    try {
      await homeworkResponsesAPI.create({ homeworkId: selectedHW.id, studentId: user.id, title: form.title, url: form.url });
      toast.success('Javob topshirildi!');
      setDrawerOpen(false); load();
    } catch (e) { toast.error(e.response?.data?.message || 'Xatolik'); }
  };

  const getResult = hwId => results.find(r => r.homeworkId === hwId);
  const getResponse = hwId => responses.find(r => r.homeworkId === hwId);

  return (
    <div className="fade-in">
      <PageHeader title="Uyga vazifalar" subtitle={`${homework.length} ta vazifa`}/>
      <div className="flex gap-1 mb-4">
        {['Vazifalar', 'Natijalar'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-700 transition-colors ${tab === t ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-primary/40'}`}>{t}</button>
        ))}
      </div>

      {tab === 'Vazifalar' && (
        <div className="space-y-3">
          {homework.map(hw => {
            const response = getResponse(hw.id);
            const result = getResult(hw.id);
            return (
              <div key={hw.id} className="card p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0"><AlertCircle size={18} className="text-amber-500"/></div>
                    <div className="flex-1">
                      <p className="font-800 text-gray-800">{hw.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1"><Clock size={10}/>{hw.durationTime ? `${hw.durationTime} soat` : 'Muddat belgilanmagan'}</p>
                      {response && (
                        <div className="mt-2 p-2 bg-blue-50 rounded-lg text-xs">
                          <p className="font-700 text-blue-700">✓ Javob topshirilgan</p>
                          {response.url && <a href={response.url} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">🔗 Havolani ko'rish</a>}
                        </div>
                      )}
                      {result && (
                        <div className="mt-2 p-2 bg-green-50 rounded-lg text-xs flex items-center justify-between">
                          <p className="font-700 text-green-700">Ball: {result.score}/100</p>
                          {result.title && <p className="text-green-600">{result.title}</p>}
                        </div>
                      )}
                    </div>
                  </div>
                  {!response ? (
                    <button onClick={() => openSubmit(hw)} className="btn-primary text-xs flex-shrink-0">Topshirish</button>
                  ) : <StatusBadge status={response.status || 'PENDING'}/>}
                </div>
              </div>
            );
          })}
          {homework.length === 0 && <div className="card"><Empty text="Vazifalar yo'q"/></div>}
        </div>
      )}

      {tab === 'Natijalar' && (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead><tr>{['#','Vazifa','Ball','Izoh','Sana'].map(h=><th key={h} className="table-header first:pl-4">{h}</th>)}</tr></thead>
            <tbody>
              {results.length === 0 ? <tr><td colSpan={5}><Empty text="Natijalar yo'q"/></td></tr>
                : results.map((r,i)=>(
                  <tr key={r.id} className="hover:bg-gray-50/60">
                    <td className="table-cell pl-4 text-gray-400 font-700 text-xs">{i+1}</td>
                    <td className="table-cell font-700 text-gray-800 text-sm">{r.title || `Vazifa #${r.homeworkId}`}</td>
                    <td className="table-cell">
                      <span className={`text-base font-900 ${r.score>=80?'text-green-600':r.score>=60?'text-amber-500':'text-red-500'}`}>{r.score}</span>
                      <span className="text-xs text-gray-400">/100</span>
                    </td>
                    <td className="table-cell text-xs text-gray-500">{r.comment || '—'}</td>
                    <td className="table-cell text-xs text-gray-400">{r.createdAt?dayjs(r.createdAt).format('DD MMM, YYYY'):'—'}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={`Javob topshirish — ${selectedHW?.title}`}>
        <p className="text-xs text-gray-400 -mt-2">Ishlagan vazifangizni havola yoki fayl orqali yuboring.</p>
        <Field label="Sarlavha"><Input placeholder="Mening yechimim" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}/></Field>
        <Field label="GitHub / Drive havolasi"><Input placeholder="https://github.com/..." value={form.url} onChange={e => setForm({ ...form, url: e.target.value })}/></Field>
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center cursor-pointer hover:border-primary/40 transition-colors">
          <p className="text-xs font-700 text-gray-500">📎 Fayl yuklash (ixtiyoriy)</p>
          <p className="text-xs text-gray-400 mt-1">JPG, PNG, PDF, ZIP</p>
        </div>
        <div className="flex gap-3 pt-1">
          <button onClick={() => setDrawerOpen(false)} className="btn-secondary flex-1 justify-center">Bekor</button>
          <button onClick={handleSubmit} className="btn-primary flex-1 justify-center">Topshirish</button>
        </div>
      </Drawer>
    </div>
  );
}

// ─── ATTENDANCE ────────────────────────────────────────────────────────────
export function StudentAttendance() {
  const { user } = useStudentAuth();
  const [attendance, setAttendance] = useState([]);

  useEffect(() => {
    if (!user?.id) return;
    attendanceAPI.getByStudent(user.id).then(r => setAttendance(r.data || [])).catch(() => {});
  }, [user]);

  const present = attendance.filter(a => a.isPresent).length;
  const absent = attendance.length - present;
  const rate = attendance.length ? Math.round((present / attendance.length) * 100) : 0;

  return (
    <div className="fade-in">
      <PageHeader title="Davomatim" subtitle="Barcha darslar bo'yicha"/>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[{ label: 'Jami darslar', val: attendance.length, color: 'text-gray-800' }, { label: 'Keldim', val: present, color: 'text-green-600' }, { label: 'Kelmadim', val: absent, color: 'text-red-500' }, { label: 'Foiz', val: `${rate}%`, color: 'text-primary' }].map(s => (
          <div key={s.label} className="card p-4 text-center">
            <p className={`text-2xl font-900 ${s.color}`}>{s.val}</p>
            <p className="text-xs text-gray-400 font-700 mt-1">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${rate}%` }}/>
            </div>
            <span className="text-sm font-800 text-primary">{rate}%</span>
          </div>
        </div>
        <table className="w-full">
          <thead><tr>{['#','Dars','Holat','Sana'].map(h=><th key={h} className="table-header first:pl-4">{h}</th>)}</tr></thead>
          <tbody>
            {attendance.length === 0 ? <tr><td colSpan={4}><Empty text="Davomat ma'lumoti topilmadi"/></td></tr>
              : attendance.map((a, i) => (
                <tr key={a.id} className="hover:bg-gray-50/60">
                  <td className="table-cell pl-4 text-gray-400 font-700 text-xs">{i+1}</td>
                  <td className="table-cell text-xs font-600 text-gray-700">Dars #{a.lessonId}</td>
                  <td className="table-cell">
                    {a.isPresent ? <span className="badge badge-green">✓ Keldim</span> : <span className="badge badge-red">✗ Kelmadim</span>}
                  </td>
                  <td className="table-cell text-xs text-gray-400">{a.createdAt ? dayjs(a.createdAt).format('DD MMM, YYYY') : '—'}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── VIDEOS ────────────────────────────────────────────────────────────────
export function StudentVideos() {
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    lessonVideosAPI.getAll({}).then(r => setVideos(r.data || [])).catch(() => {});
  }, []);

  return (
    <div className="fade-in">
      <PageHeader title="Dars Videolari" subtitle={`${videos.length} ta video`}/>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {videos.map(v => (
          <a key={v.id} href={v.url || '#'} target="_blank" rel="noreferrer"
            className="card p-4 hover:shadow-md transition-all hover:-translate-y-0.5 block group">
            <div className="w-full h-28 bg-gradient-to-br from-primary/10 to-purple-100 rounded-xl flex items-center justify-center mb-3 group-hover:from-primary/20 transition-colors">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center"><Play size={18} className="text-primary"/></div>
            </div>
            <p className="font-800 text-gray-800 text-sm truncate">{v.title || 'Video'}</p>
            <p className="text-xs text-gray-400 mt-1">Dars #{v.lessonId} · {v.createdAt ? dayjs(v.createdAt).format('DD MMM') : '—'}</p>
          </a>
        ))}
        {videos.length === 0 && <div className="col-span-3 card"><Empty icon="🎥" text="Videolar topilmadi"/></div>}
      </div>
    </div>
  );
}

// ─── RATINGS ──────────────────────────────────────────────────────────────
export function StudentRatings() {
  const { user } = useStudentAuth();
  const [groups, setGroups] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [form, setForm] = useState({ score: 5, comment: '', lessonId: '' });
  const [myRatings, setMyRatings] = useState([]);

  useEffect(() => {
    if (!user?.id) return;
    Promise.all([
      studentsAPI.getGroups(user.id),
      ratingsAPI.getByStudent(user.id),
    ]).then(([groupsRes, ratingsRes]) => {
      setGroups(groupsRes.data || []);
      setMyRatings(ratingsRes.data || []);
    }).catch(() => {});
  }, [user]);

  const ratingsByTeacher = myRatings.reduce((acc, rating) => {
    const key = Number(rating.teacherId);
    if (!key) return acc;
    if (!acc[key]) acc[key] = [];
    acc[key].push(rating);
    return acc;
  }, {});

  const submitRating = async () => {
    if (!selectedTeacher || !form.score) { toast.error('Ma\'lumotlar to\'liq emas'); return; }
    try {
      await ratingsAPI.create({ teacherId: selectedTeacher.id, score: form.score, comment: form.comment, studentId: user?.id, lessonId: form.lessonId ? Number(form.lessonId) : undefined });
      const updatedRatings = await ratingsAPI.getByStudent(user?.id);
      setMyRatings(updatedRatings.data || []);
      toast.success('Baho berildi! Rahmat! ⭐');
      setDrawerOpen(false);
      setForm({ score: 5, comment: '', lessonId: '' });
    } catch (e) { toast.error(e.response?.data?.message || 'Xatolik'); }
  };

  return (
    <div className="fade-in">
      <PageHeader title="O'qituvchi reytinglari" subtitle="O'qituvchilarga baho bering"/>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {groups.filter((g, i, arr) => arr.findIndex(x => x.teacherId === g.teacherId) === i).map(g => {
          const teacherRatings = ratingsByTeacher[g.teacherId] || [];
          const avg = teacherRatings.length ? (teacherRatings.reduce((s, x) => s + Number(x.score || 0), 0) / teacherRatings.length) : 0;
          return (
          <div key={g.id} className="card p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-full bg-green-100 flex items-center justify-center text-lg font-800 text-green-700">
                {g.teacherId ? g.teacherId.toString()[0] : 'T'}
              </div>
              <div>
                <p className="font-800 text-gray-800">O'qituvchi #{g.teacherId}</p>
                <p className="text-xs text-gray-400">{g.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 mb-3">
              {[1,2,3,4,5].map(i => (
                <Star
                  key={i}
                  size={16}
                  className={i <= Math.round(avg) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}
                />
              ))}
              <span className="text-xs text-gray-400 ml-1">
                {teacherRatings.length ? `Sizning o'rtacha bahongiz: ${avg.toFixed(1)} (${teacherRatings.length} ta)` : 'Hali baholanmagan'}
              </span>
            </div>
            <button
              onClick={() => { setSelectedTeacher({ id: g.teacherId, groupName: g.name }); setDrawerOpen(true); }}
              className="btn-primary w-full justify-center text-xs"
            >
              ⭐ Baho berish
            </button>
          </div>
        )})}
        {groups.length === 0 && <div className="col-span-3 card"><Empty icon="⭐" text="Guruhlar topilmadi"/></div>}
      </div>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={`Baho berish — ${selectedTeacher?.groupName}`}>
        <div className="text-center py-2">
          <p className="text-sm font-700 text-gray-700 mb-3">Bahoni tanlang</p>
          <div className="flex justify-center gap-2">
            {[1,2,3,4,5].map(s => (
              <button key={s} onClick={() => setForm({ ...form, score: s })}
                className="transition-transform hover:scale-110">
                <Star size={32} className={s <= form.score ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}/>
              </button>
            ))}
          </div>
          <p className="text-lg font-900 text-gray-700 mt-2">{form.score}/5</p>
        </div>
        <Field label="Izoh">
          <textarea value={form.comment} onChange={e => setForm({ ...form, comment: e.target.value })} placeholder="O'qituvchi haqida fikringiz..." rows={3}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-primary resize-none font-500"/>
        </Field>
        <div className="flex gap-3 pt-1">
          <button onClick={() => setDrawerOpen(false)} className="btn-secondary flex-1 justify-center">Bekor</button>
          <button onClick={submitRating} className="btn-primary flex-1 justify-center">Yuborish</button>
        </div>
      </Drawer>
    </div>
  );
}
