import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AlertCircle, Calendar, ChevronDown, ChevronUp, MoveLeft, PlayCircle, Upload } from 'lucide-react';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import { Avatar, Empty, Select } from '../../components/UI';
import { useStudentAuth } from '../../context/StudentAuthContext';
import { homeworkAPI, homeworkResponsesAPI, homeworkResultsAPI, lessonVideosAPI, lessonsAPI, studentsAPI } from '../../services/api';
import { getHomeworkCreatedAt, getHomeworkDeadline, getHomeworkStatus, getUploadUrl } from './shared';

export default function StudentLessons() {
  const { user } = useStudentAuth();
  const { groupId } = useParams();
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [videos, setVideos] = useState([]);
  const [viewMode, setViewMode] = useState('list');
  const [activeTab, setActiveTab] = useState('video');
  const [statusFilter, setStatusFilter] = useState('all');
  const [groupHW, setGroupHW] = useState([]);
  const [groupResponses, setGroupResponses] = useState([]);
  const [groupResults, setGroupResults] = useState([]);
  const [homework, setHomework] = useState(null);
  const [response, setResponse] = useState(null);
  const [result, setResult] = useState(null);
  const [submitForm, setSubmitForm] = useState({ title: '', url: '', file: null });
  const [submitting, setSubmitting] = useState(false);
  const submitFileRef = useRef(null);

  useEffect(() => {
    if (!user?.id) return;
    studentsAPI.getGroups(user.id).then(r => {
      const raw = r.data || [];
      const gs = raw
        .map(item => (item?.group ? { ...item.group, studentGroupId: item.id, studentGroupStatus: item.status } : item))
        .filter(g => (g.studentGroupStatus ? g.studentGroupStatus === 'ACTIVE' : g.status !== 'INACTIVE'));
      setGroups(gs);
      const target = gs.find(g => g.id.toString() === groupId) || gs[0];
      if (target) handleGroupChange(target);
    });
  }, [user, groupId]);

  const handleGroupChange = async g => {
    setSelectedGroup(g);
    setViewMode('list');
    try {
      const [lRes, vRes, hwRes, respRes, resRes] = await Promise.all([
        lessonsAPI.getAll({ groupId: g.id }),
        lessonVideosAPI.getAll({ groupId: g.id }),
        homeworkAPI.getAll({ groupId: g.id, studentId: user.id }),
        homeworkResponsesAPI.getAll({ studentId: user.id, groupId: g.id, compact: true }),
        homeworkResultsAPI.getAll({ studentId: user.id, groupId: g.id, compact: true }),
      ]);
      setLessons(lRes.data || []);
      setVideos(vRes.data || []);
      setGroupHW(hwRes.data || []);
      setGroupResponses(respRes.data || []);
      setGroupResults(resRes.data || []);
      if (lRes.data?.[0]) setCurrentLesson(lRes.data[0]);
    } catch {
      setLessons([]);
      setVideos([]);
      setGroupHW([]);
      setGroupResponses([]);
      setGroupResults([]);
    }
  };

  useEffect(() => {
    if (!currentLesson?.id || !user?.id) return;
    const hw = groupHW.find(h => h.lessonId === currentLesson.id) || null;
    setHomework(hw);
    setResponse(hw ? groupResponses.find(r => r.homeworkId === hw.id) || null : null);
    setResult(hw ? groupResults.find(r => r.homeworkId === hw.id) || null : null);
  }, [currentLesson, groupHW, groupResponses, groupResults, user]);

  const currentVideo = videos.find(v => v.lessonId === currentLesson?.id);
  const detailStatus = getHomeworkStatus(homework, response, result);
  const visibleLessons = lessons.filter(l => {
    if (statusFilter === 'all') return true;
    const hw = groupHW.find(h => h.lessonId === l.id);
    const resp = hw ? groupResponses.find(r => r.homeworkId === hw.id) : null;
    const res = hw ? groupResults.find(r => r.homeworkId === hw.id) : null;
    if (statusFilter === 'PENDING') return !!hw && !resp && !res;
    if (statusFilter === 'CHECKED') return !!resp;
    if (statusFilter === 'APPROVED') return res?.status === 'APPROVED';
    return true;
  });

  const handleSubmitHomework = async () => {
    if (!homework?.id || !user?.id) return;
    setSubmitting(true);
    try {
      const { data } = await homeworkResponsesAPI.create({
        homeworkId: Number(homework.id),
        studentId: user.id,
        title: submitForm.title,
        url: submitForm.url,
      });
      const responseId = data?.response?.id;
      if (submitForm.file && responseId) {
        const fd = new FormData();
        fd.append('file', submitForm.file);
        await homeworkResponsesAPI.uploadFile(responseId, fd);
      }

      const [respRes, resRes] = await Promise.all([
        homeworkResponsesAPI.getAll({ studentId: user.id, groupId: selectedGroup?.id, compact: true }),
        homeworkResultsAPI.getAll({ studentId: user.id, groupId: selectedGroup?.id, compact: true }),
      ]);
      setGroupResponses(respRes.data || []);
      setGroupResults(resRes.data || []);
      setSubmitForm({ title: '', url: '', file: null });
      toast.success("Vazifa yuborildi");
    } catch (e) {
      toast.error(e.response?.data?.message || "Yuborishda xatolik");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fade-in max-w-[1400px] mx-auto pb-10">
      <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-900 text-gray-800 dark:text-gray-100 uppercase tracking-tight mb-1">{selectedGroup?.name || 'Darslar'}</h1>
          <p className="text-[10px] text-gray-400 font-900 uppercase tracking-widest">{lessons.length} ta dars mavjud</p>
        </div>
        <div className="flex items-center gap-4">
          {viewMode === 'detail' && <button onClick={() => setViewMode('list')} className="px-4 py-2 rounded-xl text-[10px] font-900 uppercase tracking-widest flex items-center gap-2 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 text-gray-500 hover:text-primary transition-all shadow-sm"><MoveLeft size={14} /> Kurs rejasiga qaytish</button>}
          <div className="flex gap-2 p-1 bg-white dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm">
            {groups.map(g => <button key={g.id} onClick={() => handleGroupChange(g)} className={`px-4 py-2 rounded-lg text-[10px] font-900 uppercase tracking-widest transition-all ${selectedGroup?.id === g.id ? 'bg-primary text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}>{g.name}</button>)}
          </div>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="space-y-6">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-[11px] font-900 text-gray-400 uppercase tracking-widest">Uy vazifa statusi</span>
            <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-48 bg-white dark:bg-white/5 border-gray-100 dark:border-white/10">
              <option value="all">Barchasi</option>
              <option value="PENDING">Topshirilmagan</option>
              <option value="CHECKED">Topshirilgan</option>
              <option value="APPROVED">Qabul qilingan</option>
            </Select>
          </div>
          <div className="card overflow-hidden shadow-xl shadow-primary/5 bg-white dark:bg-white/5 border-none">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-white/5">
                  <th className="table-header pl-6 py-4 text-[11px] font-900 uppercase tracking-widest text-left">Mavzular</th>
                  <th className="table-header text-center py-4 text-[11px] font-900 uppercase tracking-widest">Video</th>
                  <th className="table-header text-center py-4 text-[11px] font-900 uppercase tracking-widest">Uyga vazifa Holati</th>
                  <th className="table-header text-center py-4 text-[11px] font-900 uppercase tracking-widest"><span className="inline-flex items-center gap-1">Uyga vazifa tugash vaqti <ChevronDown size={14} /></span></th>
                  <th className="table-header pr-6 text-right py-4 text-[11px] font-900 uppercase tracking-widest"><span className="inline-flex items-center gap-1">Dars sanasi <ChevronUp size={14} /></span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {visibleLessons.map(l => {
                  const hw = groupHW.find(h => h.lessonId === l.id);
                  const resp = hw ? groupResponses.find(r => r.homeworkId === hw.id) : null;
                  const res = hw ? groupResults.find(r => r.homeworkId === hw.id) : null;
                  const vCount = videos.filter(v => v.lessonId === l.id).length;
                  const status = getHomeworkStatus(hw, resp, res);
                  const deadline = getHomeworkDeadline(hw);
                  return (
                    <tr key={l.id} onClick={() => { setCurrentLesson(l); setViewMode('detail'); }} className="hover:bg-gray-50/60 dark:hover:bg-white/5 transition-all cursor-pointer group">
                      <td className="table-cell pl-6 font-800 text-sm text-gray-700 dark:text-gray-200 py-4">{l.title}</td>
                      <td className="table-cell text-center py-4"><div className="relative inline-flex"><PlayCircle size={22} strokeWidth={1.5} className={vCount > 0 ? 'text-primary' : 'text-gray-200 dark:text-gray-700'} />{vCount > 0 && <span className="absolute -top-1.5 -right-1.5 bg-primary text-white text-[8px] min-w-[14px] h-[14px] px-1 rounded-full flex items-center justify-center font-900 ring-2 ring-white dark:ring-gray-800">{vCount}</span>}</div></td>
                      <td className="table-cell text-center py-4"><span className={`px-3 py-1 rounded-lg text-[10px] font-900 uppercase tracking-widest ${status.className}`}>{status.label}</span></td>
                      <td className="table-cell text-center font-800 text-xs text-gray-400 py-4">{deadline ? deadline.format('DD MMM, YYYY HH:mm') : '-'}</td>
                      <td className="table-cell pr-6 text-right font-800 text-xs text-gray-500 uppercase tracking-tighter py-4">{l.date ? dayjs(l.date).format('DD MMM, YYYY') : '—'}</td>
                    </tr>
                  );
                })}
                {visibleLessons.length === 0 && <tr><td colSpan={5} className="py-20 text-center"><Empty text="Mavzular topilmadi" /></td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          <div className="lg:col-span-3 space-y-6">
            <div className="flex items-center gap-8 border-b border-gray-100 dark:border-white/5 pb-1">
              <button onClick={() => setActiveTab('video')} className={`pb-3 text-xs font-900 uppercase tracking-widest transition-all relative ${activeTab === 'video' ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}`}>Video{activeTab === 'video' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}</button>
              <button onClick={() => setActiveTab('task')} className={`pb-3 text-xs font-900 uppercase tracking-widest transition-all relative flex items-center gap-2 ${activeTab === 'task' ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}`}>Vazifalar{activeTab === 'task' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}</button>
              {activeTab === 'task' && <span className="ml-auto text-[11px] font-900 text-gray-400 uppercase tracking-widest">Ball: {result?.score || 0}</span>}
            </div>
            {activeTab === 'video' ? (
              <div className="fade-in space-y-6">
                <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl relative">
                  {currentVideo ? <video controls className="w-full h-full object-cover"><source src={currentVideo.url || currentVideo.fileUrl} type="video/mp4" /></video> : <div className="w-full h-full flex flex-col items-center justify-center text-white/40"><PlayCircle size={64} strokeWidth={1} className="mb-4 opacity-20" /><p className="text-xs font-900 uppercase tracking-widest">Video dars hozircha yo'q</p></div>}
                </div>
                <div className="bg-[#FAF9F6] dark:bg-white/5 rounded-2xl p-8 border border-gray-100 dark:border-white/5 shadow-sm shadow-black/5">
                  <h2 className="text-xl font-900 text-gray-800 dark:text-gray-100 uppercase tracking-tight mb-2">{currentLesson?.title || 'Dars mavzusi'}</h2>
                  <p className="text-[10px] font-900 text-gray-400 uppercase tracking-widest mb-6">Dars sanasi: {currentLesson?.date ? dayjs(currentLesson.date).format('DD MMM, YYYY') : '—'}</p>
                  <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed font-600">{currentLesson?.description || "Ushbu dars uchun qo'shimcha tavsif kiritilmagan."}</div>
                </div>
              </div>
            ) : (
              <div className="fade-in space-y-6">
                {!homework ? <div className="card p-16 text-center"><Empty text="Bu dars uchun vazifa biriktirilmagan" /></div> : (
                  <div className="flex flex-col gap-6">
                    <div className="bg-[#FAF9F6] dark:bg-white/5 rounded-2xl p-8 space-y-4 border border-gray-100 dark:border-white/5">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-900 text-gray-800 dark:text-gray-100 uppercase tracking-tight">Uyga vazifa</h3>
                        <div className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-900 flex items-center gap-2 shadow-sm shadow-red-500/20 uppercase tracking-widest"><AlertCircle size={14} /> Uyga vazifa muddati: {getHomeworkDeadline(homework) ? getHomeworkDeadline(homework).format('DD MMMM, YYYY HH:mm') : '—'}</div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 font-600 leading-relaxed">{homework.description || homework.title}</p>
                      {homework.file && (
                        <a
                          href={getUploadUrl(homework.file)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 text-xs font-900 uppercase tracking-widest text-emerald-600 hover:bg-emerald-100 transition-colors"
                        >
                          Ustoz yuklagan faylni ochish
                        </a>
                      )}
                      <div className="flex items-center justify-between pt-6 border-t border-gray-100 dark:border-white/5">
                        <span className="text-[10px] font-900 text-gray-400 uppercase tracking-widest">Fayllar soni: {homework.file ? 1 : 0}</span>
                        <span className="text-[10px] font-900 text-gray-400">{getHomeworkCreatedAt(homework) ? dayjs(getHomeworkCreatedAt(homework)).format('HH:mm DD MMM, YYYY') : '—'}</span>
                      </div>
                    </div>
                    <div className="bg-[#FAF9F6] dark:bg-white/5 rounded-2xl p-8 space-y-4 border border-gray-100 dark:border-white/5">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-lg font-900 text-gray-800 dark:text-gray-100 uppercase tracking-tight">Mening jo'natmalarim</h3>
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-900 uppercase tracking-widest ${detailStatus.className}`}>
                          {detailStatus.label}
                        </span>
                      </div>
                      {response ? (
                        <div className="flex flex-col gap-4">
                          {response.title && (
                            <div className="rounded-xl bg-white/80 p-3 text-sm font-700 text-gray-700 border border-gray-100">
                              {response.title}
                            </div>
                          )}
                          {(response.url || response.file) ? <a href={response.url || `/api/uploads/${String(response.file).split('/').pop()}`} target="_blank" rel="noreferrer" className="text-sm font-700 text-blue-500 hover:underline break-all inline-block bg-blue-50/50 dark:bg-blue-500/5 p-3 rounded-xl">{response.url || response.file}</a> : null}
                          <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-white/5">
                            <span className="text-[10px] font-900 text-gray-400 uppercase tracking-widest">Fayllar soni: {(response.url || response.file) ? 1 : 0}</span>
                            <span className="text-[10px] font-900 text-gray-400">
                              Oxirgi yuborish: {response.updatedAt || response.updated_at || response.createdAt || response.created_at ? dayjs(response.updatedAt || response.updated_at || response.createdAt || response.created_at).format('HH:mm DD MMM, YYYY') : '—'}
                            </span>
                          </div>
                        </div>
                      ) : <div className="py-4 flex flex-col items-center gap-4"><p className="text-xs text-gray-400 font-900 uppercase tracking-widest uppercase">Hali vazifa topshirmadingiz</p></div>}

                      <div className="pt-4 border-t border-gray-100 dark:border-white/5 space-y-3">
                        <p className="text-[11px] font-900 text-gray-500 uppercase tracking-widest">
                          {response ? "Qayta yuborish" : "Vazifani yuborish"}
                        </p>
                        <input
                          type="text"
                          value={submitForm.url}
                          onChange={e => setSubmitForm(prev => ({ ...prev, url: e.target.value }))}
                          placeholder="Havola (GitHub/Drive): https://..."
                          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-700 text-gray-700 outline-none focus:border-primary"
                        />
                        <input
                          type="text"
                          value={submitForm.title}
                          onChange={e => setSubmitForm(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="Qisqa izoh..."
                          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-700 text-gray-700 outline-none focus:border-primary"
                        />
                        <div
                          onClick={() => submitFileRef.current?.click()}
                          className="cursor-pointer rounded-xl border-2 border-dashed border-gray-200 bg-white px-4 py-5 text-center hover:border-primary/40"
                        >
                          <input
                            ref={submitFileRef}
                            type="file"
                            hidden
                            onChange={e => setSubmitForm(prev => ({ ...prev, file: e.target.files?.[0] || null }))}
                          />
                          <Upload size={18} className="mx-auto mb-2 text-gray-400" />
                          <p className="text-[11px] font-900 text-gray-500 uppercase tracking-widest">
                            {submitForm.file ? submitForm.file.name : "Fayl biriktirish"}
                          </p>
                        </div>
                        <button
                          onClick={handleSubmitHomework}
                          disabled={submitting}
                          className="w-full rounded-xl bg-primary px-4 py-3 text-xs font-900 uppercase tracking-widest text-white disabled:opacity-60"
                        >
                          {submitting ? "Yuborilmoqda..." : (response ? "Qayta yuborish" : "Yuborish")}
                        </button>
                      </div>
                    </div>
                    {result && (
                      <div className="bg-[#FAF9F6] dark:bg-white/5 rounded-2xl p-8 space-y-4 border border-gray-100 dark:border-white/5 relative overflow-hidden">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-900 text-gray-800 dark:text-gray-100 uppercase tracking-tight mb-4">O'qituvchi izohi</h3>
                            <p className="text-sm font-700 text-gray-600 dark:text-gray-300 leading-relaxed mb-6 max-w-2xl">{result.comment || result.title || 'Izoh qoldirilmagan'}</p>
                            <div className="flex items-center gap-2"><Avatar size="xs" name={result.teacher?.fullName || selectedGroup?.teacher?.fullName} /><span className="text-[10px] text-gray-400 font-900 uppercase tracking-widest">Tekshiruvchi: {result.teacher?.fullName || selectedGroup?.teacher?.fullName || 'Teacher'}</span></div>
                          </div>
                          <span className="px-4 py-2 rounded-xl text-[10px] font-900 uppercase tracking-widest bg-green-500/10 text-green-600 whitespace-nowrap shadow-sm shadow-green-500/5">{result.status === 'APPROVED' ? 'Vazifa qabul qilindi' : result.status === 'REJECTED' ? 'Vazifa rad etildi' : result.status}</span>
                        </div>
                        <p className="text-[10px] text-gray-400 font-900 text-right pt-6 border-t border-gray-100 dark:border-white/5">{result.createdAt || result.created_at ? dayjs(result.createdAt || result.created_at).format('HH:mm DD MMM, YYYY') : '—'}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="lg:col-span-1 space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto pr-2 custom-scrollbar">
            <p className="text-[10px] font-900 text-gray-400 uppercase tracking-widest mb-4 px-2">Darslar ro'yxati</p>
            {lessons.map(l => (
              <div key={l.id} onClick={() => setCurrentLesson(l)} className={`p-4 rounded-2xl cursor-pointer transition-all border group relative overflow-hidden ${currentLesson?.id === l.id ? 'bg-[#FAF9F6] dark:bg-white/10 border-primary shadow-sm shadow-primary/5' : 'bg-white dark:bg-white/5 border-gray-100 dark:border-white/10 hover:border-primary/30 hover:bg-gray-50/50'}`}>
                <h4 className={`text-sm font-900 tracking-tight leading-tight mb-2 transition-colors ${currentLesson?.id === l.id ? 'text-primary' : 'text-gray-700 dark:text-gray-300'}`}>{l.title}</h4>
                <p className="text-[10px] font-800 text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><Calendar size={12} className="opacity-60" /> {l.date ? dayjs(l.date).format('DD MMM, YYYY') : '—'}</p>
              </div>
            ))}
            {lessons.length === 0 && <div className="p-10 text-center"><Empty text="Darslar yo'q" /></div>}
          </div>
        </div>
      )}
    </div>
  );
}
