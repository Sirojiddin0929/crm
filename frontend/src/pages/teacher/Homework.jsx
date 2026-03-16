import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Edit2, ChevronDown, ChevronUp, RefreshCw, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { homeworkAPI, lessonsAPI, homeworkResponsesAPI, homeworkResultsAPI } from '../../services/api';
import { useTeacherAuth } from '../../context/TeacherAuthContext';
import { PageHeader, Drawer, Field, Input, Select, Dialog, Empty, Avatar, StatusBadge } from '../../components/UI';

const defaultForm = { title: '', lessonId: '', durationTime: '' };

export default function TeacherHomework() {
  const { user } = useTeacherAuth();
  const [homework, setHomework] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [deleteId, setDeleteId] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [responses, setResponses] = useState({});
  const [scores, setScores] = useState({});
  const [uploadDrawer, setUploadDrawer] = useState(null);

  const load = async () => {
    try {
      const [h, l] = await Promise.all([homeworkAPI.getAll({}), lessonsAPI.getAll({ teacherId: user?.id })]);
      setHomework(h.data || []);
      setLessons(l.data || []);
    } catch { toast.error('Xatolik'); }
  };
  useEffect(() => { if (user?.id) load(); }, [user]);

  const openAdd = () => { setEditItem(null); setForm(defaultForm); setDrawerOpen(true); };
  const openEdit = h => { setEditItem(h); setForm({ title: h.title, lessonId: h.lessonId || '', durationTime: h.durationTime || '' }); setDrawerOpen(true); };

  const handleSave = async () => {
    try {
      const data = { ...form, lessonId: Number(form.lessonId), durationTime: Number(form.durationTime), teacherId: user?.id, userId: 1 };
      if (editItem) { await homeworkAPI.update(editItem.id, data); toast.success('Yangilandi'); }
      else { await homeworkAPI.create(data); toast.success('Vazifa qo\'shildi'); }
      setDrawerOpen(false); load();
    } catch (e) { toast.error(e.response?.data?.message || 'Xatolik'); }
  };

  const toggleHW = async hw => {
    if (expanded === hw.id) { setExpanded(null); return; }
    setExpanded(hw.id);
    if (!responses[hw.id]) {
      try {
        const r = await homeworkResponsesAPI.getAll({ homeworkId: hw.id });
        setResponses(prev => ({ ...prev, [hw.id]: r.data || [] }));
      } catch { setResponses(prev => ({ ...prev, [hw.id]: [] })); }
    }
  };

  const gradeResponse = async (hwId, resp) => {
    const sc = scores[resp.id] || {};
    if (!sc.score) { toast.error('Ball kiriting'); return; }
    try {
      await homeworkResultsAPI.create({ homeworkId: hwId, studentId: resp.studentId, score: Number(sc.score), title: sc.comment || '', teacherId: user?.id, userId: 1 });
      await homeworkResponsesAPI.update(resp.id, { status: 'CHECKED' });
      toast.success('Baho berildi!');
      const r = await homeworkResponsesAPI.getAll({ homeworkId: hwId });
      setResponses(prev => ({ ...prev, [hwId]: r.data || [] }));
    } catch (e) { toast.error(e.response?.data?.message || 'Xatolik'); }
  };

  const handleFileUpload = async (hwId, file) => {
    const fd = new FormData();
    fd.append('file', file);
    try {
      await homeworkAPI.uploadFile(hwId, fd);
      toast.success('Fayl yuklandi!');
      setUploadDrawer(null);
    } catch { toast.error('Xatolik'); }
  };

  return (
    <div className="fade-in">
      <PageHeader
        title="Uyga vazifalar"
        subtitle={`${homework.length} ta vazifa`}
        actions={
          <>
            <button className="btn-secondary text-xs" onClick={load}><RefreshCw size={13}/></button>
            <button className="btn-primary" onClick={openAdd}><Plus size={14}/> Vazifa qo'shish</button>
          </>
        }
      />

      <div className="space-y-2">
        {homework.length === 0 && <div className="card"><Empty text="Vazifalar topilmadi"/></div>}
        {homework.map((hw, idx) => {
          const resp = responses[hw.id] || [];
          const isOpen = expanded === hw.id;
          const checked = resp.filter(r => r.status === 'CHECKED').length;
          const lesson = lessons.find(l => l.id === hw.lessonId);

          return (
            <div key={hw.id} className="card overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-gray-50/60 transition-colors" onClick={() => toggleHW(hw)}>
                <span className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center text-xs font-800 text-amber-600 flex-shrink-0">{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-800 text-gray-800 text-sm">{hw.title}</p>
                  <p className="text-xs text-gray-400">{lesson?.title || `Dars #${hw.lessonId}`} · {hw.durationTime ? `${hw.durationTime} soat` : '—'}</p>
                </div>
                {resp.length > 0 && (
                  <div className="flex gap-2 text-xs font-700">
                    <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg">{resp.length} javob</span>
                    <span className="px-2 py-1 bg-green-50 text-green-600 rounded-lg">{checked} tekshirildi</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                  <button onClick={() => setUploadDrawer(hw)} className="w-7 h-7 rounded-md bg-purple-50 text-purple-500 hover:bg-purple-100 flex items-center justify-center text-xs font-800">📎</button>
                  <button onClick={() => openEdit(hw)} className="w-7 h-7 rounded-md bg-blue-50 text-blue-500 hover:bg-blue-100 flex items-center justify-center"><Edit2 size={13}/></button>
                  <button onClick={() => setDeleteId(hw.id)} className="w-7 h-7 rounded-md bg-red-50 text-red-400 hover:bg-red-100 flex items-center justify-center"><Trash2 size={13}/></button>
                </div>
                <div className="text-gray-400">{isOpen ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}</div>
              </div>

              {isOpen && (
                <div className="border-t border-gray-100">
                  <div className="px-4 py-3 bg-gray-50 flex items-center justify-between">
                    <p className="text-sm font-800 text-gray-700">Talabalar javoblari</p>
                    <span className="text-xs text-gray-400">{resp.length} ta javob</span>
                  </div>
                  {resp.length === 0 ? (
                    <div className="py-8 text-center text-sm text-gray-400">Hali javoblar yo'q</div>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {resp.map(r => (
                        <div key={r.id} className="px-4 py-3 hover:bg-gray-50/40">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              <Avatar name={`Talaba ${r.studentId}`} size="sm"/>
                              <div>
                                <p className="font-700 text-sm text-gray-800">Talaba #{r.studentId}</p>
                                {r.url && (
                                  <a href={r.url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">🔗 Havolani ko'rish</a>
                                )}
                                {r.title && <p className="text-xs text-gray-500 mt-0.5">{r.title}</p>}
                              </div>
                            </div>
                            <StatusBadge status={r.status || 'PENDING'}/>
                          </div>
                          {r.status !== 'CHECKED' && (
                            <div className="flex items-center gap-2 mt-2.5 pl-9">
                              <input
                                type="number" min="0" max="100" placeholder="Ball (0-100)"
                                value={scores[r.id]?.score || ''}
                                onChange={e => setScores(prev => ({ ...prev, [r.id]: { ...prev[r.id], score: e.target.value } }))}
                                className="w-32 px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-700 outline-none focus:border-primary text-center"
                              />
                              <input
                                type="text" placeholder="Izoh (ixtiyoriy)"
                                value={scores[r.id]?.comment || ''}
                                onChange={e => setScores(prev => ({ ...prev, [r.id]: { ...prev[r.id], comment: e.target.value } }))}
                                className="flex-1 px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs outline-none focus:border-primary font-500"
                              />
                              <button onClick={() => gradeResponse(hw.id, r)} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-700 rounded-lg hover:bg-primary-dark">
                                <CheckCircle size={13}/> Baholash
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add/Edit Drawer */}
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={editItem ? 'Vazifani tahrirlash' : 'Yangi vazifa'}>
        <Field label="Sarlavha" required><Input placeholder="Vazifa nomi" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}/></Field>
        <Field label="Dars" required>
          <Select value={form.lessonId} onChange={e => setForm({ ...form, lessonId: e.target.value })}>
            <option value="">Darsni tanlang</option>
            {lessons.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
          </Select>
        </Field>
        <Field label="Muddat (soat)"><Input type="number" placeholder="Masalan: 24" value={form.durationTime} onChange={e => setForm({ ...form, durationTime: e.target.value })}/></Field>
        <div className="flex gap-3 pt-2">
          <button onClick={() => setDrawerOpen(false)} className="btn-secondary flex-1 justify-center">Bekor</button>
          <button onClick={handleSave} className="btn-primary flex-1 justify-center">Saqlash</button>
        </div>
      </Drawer>

      {/* File upload drawer */}
      <Drawer open={!!uploadDrawer} onClose={() => setUploadDrawer(null)} title="Vazifaga fayl biriktirish">
        <p className="text-sm text-gray-600 font-600">{uploadDrawer?.title}</p>
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => document.getElementById('hw-file').click()}>
          <input id="hw-file" type="file" className="hidden" onChange={e => handleFileUpload(uploadDrawer?.id, e.target.files[0])}/>
          <div className="text-3xl mb-2">📎</div>
          <p className="text-sm font-700 text-gray-600">Fayl tanlash</p>
          <p className="text-xs text-gray-400 mt-1">Istalgan format</p>
        </div>
        <button onClick={() => setUploadDrawer(null)} className="btn-secondary w-full justify-center">Yopish</button>
      </Drawer>

      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)} title="Vazifani o'chirish"
        description="Bu vazifani o'chirishni tasdiqlaysizmi?"
        onConfirm={async () => { await homeworkAPI.delete(deleteId); setDeleteId(null); load(); toast.success("O'chirildi"); }}/>
    </div>
  );
}
