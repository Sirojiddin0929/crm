import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  BookOpen, Users, Clock, ChevronRight, Play, Trash2, 
  Upload, Star, CheckCircle, AlertCircle, X, FileVideo,
  PlayCircle, CheckSquare, List, Filter, Search, Calendar,
  Calendar as CalIcon, Zap, Coins, Eraser, MoveLeft,
  ChevronDown, ChevronUp
} from 'lucide-react';
import { PageHeader, Empty, Avatar, StatusBadge, Drawer, Field, Input, Select, SearchInput } from '../../components/UI';
import { useStudentAuth } from '../../context/StudentAuthContext';
import { studentsAPI, groupsAPI, lessonsAPI, attendanceAPI, lessonVideosAPI, ratingsAPI, homeworkAPI, homeworkResponsesAPI, homeworkResultsAPI } from '../../services/api';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

const DAYS_UZ = { MONDAY: 'Du', TUESDAY: 'Se', WEDNESDAY: 'Ch', THURSDAY: 'Pa', FRIDAY: 'Ju', SATURDAY: 'Sh', SUNDAY: 'Ya' };

// ─── GROUPS ───────────────────────────────────────────────────────────────
export function StudentGroups() {
  const { user } = useStudentAuth();
  const [groups, setGroups] = useState([]);
  const [activeTab, setActiveTab] = useState('active');
  const [teachersModal, setTeachersModal] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user?.id) return;
    studentsAPI.getGroups(user.id).then(r => setGroups(r.data || [])).catch(() => {});
  }, [user]);

  const filteredGroups = groups.filter(g => activeTab === 'active' ? g.status !== 'INACTIVE' : g.status === 'INACTIVE');

  return (
    <div className="fade-in space-y-6">
      <PageHeader title="Guruhlarim" subtitle="Siz o'qiyotgan barcha kurslar ro'yxati"/>
      
      <div className="flex gap-1 p-1 bg-white dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5 w-fit shadow-sm">
        {[['active', 'Faol'], ['completed', 'Tugagan']].map(([v, l]) => (
          <button key={v} onClick={() => setActiveTab(v)}
            className={`px-6 py-2 rounded-lg text-[11px] font-900 uppercase tracking-widest transition-all ${activeTab === v ? 'bg-primary text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}>
            {l}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden shadow-xl shadow-primary/5">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50/50 dark:bg-white/5">
              <th className="table-header pl-6">#</th>
              <th className="table-header">Guruh nomi</th>
              <th className="table-header">Yo'nalishi</th>
              <th className="table-header text-center">O'qituvchilar soni</th>
              <th className="table-header pr-6 text-right">Boshlash vaqti</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/5">
            {filteredGroups.map((g, i) => {
              const mainGroup = g.group || g; // In case backend returns raw group or nested
              const tCount = (mainGroup.teacher ? 1 : 0) + (mainGroup.user ? 1 : 0);
              return (
                <tr key={g.id} className="hover:bg-gray-50/60 dark:hover:bg-white/5 transition-all group">
                  <td onClick={() => navigate(`/student/groups/${mainGroup.id}/lessons`)} className="table-cell pl-6 text-gray-400 font-900 text-[10px] cursor-pointer">{i + 1}</td>
                  <td onClick={() => navigate(`/student/groups/${mainGroup.id}/lessons`)} className="table-cell font-800 text-gray-800 dark:text-gray-100 text-sm cursor-pointer">{mainGroup.name}</td>
                  <td onClick={() => navigate(`/student/groups/${mainGroup.id}/lessons`)} className="table-cell text-[13px] font-700 text-gray-500 cursor-pointer">{mainGroup.course?.name || 'Programming'}</td>
                  <td className="table-cell text-center">
                     <button onClick={(e) => { e.stopPropagation(); setTeachersModal(mainGroup); }} className="text-primary font-900 text-[13px] hover:underline underline-offset-4">
                       {tCount} kishi
                     </button>
                  </td>
                  <td onClick={() => navigate(`/student/groups/${mainGroup.id}/lessons`)} className="table-cell pr-6 text-right font-800 text-xs text-gray-500 uppercase tracking-tighter cursor-pointer">
                     {mainGroup.startDate ? dayjs(mainGroup.startDate).format('DD MMM, YYYY') : '—'} <br/>
                     <span className="text-[10px] text-gray-400 font-700">{mainGroup.startTime}</span>
                  </td>
                </tr>
              );
            })}
            {filteredGroups.length === 0 && (
              <tr><td colSpan={5} className="py-20"><Empty text="Guruhlar topilmadi"/></td></tr>
            )}
          </tbody>
        </table>
      </div>

      {teachersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm fade-in" onClick={() => setTeachersModal(null)}>
          <div className="bg-white dark:bg-[#1A1A24] rounded-2xl w-full max-w-4xl shadow-2xl border border-gray-100 dark:border-white/10 flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
              <h2 className="text-lg font-900 text-gray-800 dark:text-gray-100 tracking-tight">{teachersModal.name}</h2>
              <button onClick={() => setTeachersModal(null)} className="p-2 text-gray-400 hover:text-red-500 transition-colors bg-gray-50 hover:bg-red-50 dark:bg-white/5 dark:hover:bg-red-500/10 rounded-xl">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto max-h-[70vh]">
               <h3 className="text-xl font-900 text-gray-800 dark:text-white mb-6">Faol</h3>
               <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl overflow-hidden mb-10">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50/50 dark:bg-white/5 border-b border-gray-100 dark:border-white/10">
                        <th className="table-header pl-6">O'qituvchi</th>
                        <th className="table-header">Roli</th>
                        <th className="table-header">Dars kunlari</th>
                        <th className="table-header">Dars vaqti</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                      {teachersModal.teacher && (
                        <tr>
                          <td className="table-cell pl-6 font-800 text-sm text-gray-800 dark:text-gray-100">{teachersModal.teacher.fullName}</td>
                          <td className="table-cell font-700 text-sm text-gray-500">Teacher</td>
                          <td className="table-cell font-700 text-sm text-gray-500">{(teachersModal.weekDays || []).map(d => DAYS_UZ[d]).join(', ')}</td>
                          <td className="table-cell font-700 text-sm text-gray-500">{teachersModal.startTime} - {teachersModal.startTime ? `${(parseInt(teachersModal.startTime.split(':')[0]) + 3).toString().padStart(2, '0')}:${teachersModal.startTime.split(':')[1]}` : ''}</td>
                        </tr>
                      )}
                      {teachersModal.user && (
                        <tr>
                          <td className="table-cell pl-6 font-800 text-sm text-gray-800 dark:text-gray-100">{teachersModal.user.fullName}</td>
                          <td className="table-cell font-700 text-sm text-gray-500">{teachersModal.user.role === 'ADMIN' ? 'Assistant' : teachersModal.user.role}</td>
                          <td className="table-cell font-700 text-sm text-gray-500">{(teachersModal.weekDays || []).map(d => DAYS_UZ[d]).join(', ')}</td>
                          <td className="table-cell font-700 text-sm text-gray-500">{teachersModal.startTime} - {teachersModal.startTime ? `${(parseInt(teachersModal.startTime.split(':')[0]) + 3).toString().padStart(2, '0')}:${teachersModal.startTime.split(':')[1]}` : ''}</td>
                        </tr>
                      )}
                      {!teachersModal.teacher && !teachersModal.user && (
                         <tr><td colSpan={4} className="py-4 text-center text-sm text-gray-500">O'qituvchilar biriktirilmagan</td></tr>
                      )}
                    </tbody>
                  </table>
               </div>

               <h3 className="text-xl font-900 text-gray-800 dark:text-white mb-6">Boshqa</h3>
               <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50/50 dark:bg-white/5 border-b border-gray-100 dark:border-white/10">
                        <th className="table-header pl-6">O'qituvchi</th>
                        <th className="table-header">Roli</th>
                        <th className="table-header">Dars kunlari</th>
                        <th className="table-header">Dars vaqti</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                        <tr><td colSpan={4} className="py-6 text-center text-sm font-700 text-gray-400">Boshqa o'qituvchilar xozircha yo'q</td></tr>
                    </tbody>
                  </table>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── LESSONS (Najot Style Video Player) ───────────────────────────────────
export function StudentLessons() {
  const { user } = useStudentAuth();
  const { groupId } = useParams();
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [videos, setVideos] = useState([]);
  
  // List/Detail state
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'detail'
  const [activeTab, setActiveTab] = useState('video');
  const [statusFilter, setStatusFilter] = useState('all');

  // Group data for the overview table
  const [groupHW, setGroupHW] = useState([]);
  const [groupResponses, setGroupResponses] = useState([]);
  const [groupResults, setGroupResults] = useState([]);

  // Current lesson data
  const [homework, setHomework] = useState(null);
  const [response, setResponse] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!user?.id) return;
    studentsAPI.getGroups(user.id).then(r => {
      const gs = r.data || [];
      setGroups(gs);
      const target = gs.find(g => g.id.toString() === groupId) || gs[0];
      if (target) handleGroupChange(target);
    });
  }, [user, groupId]);

  const handleGroupChange = async (g) => {
    setSelectedGroup(g);
    setViewMode('list'); // Always start with list when changing groups
    try {
      const [lRes, vRes, hwRes, respRes, resRes] = await Promise.all([
        lessonsAPI.getAll({ groupId: g.id }),
        lessonVideosAPI.getAll({ groupId: g.id }),
        homeworkAPI.getAll({ groupId: g.id }),
        homeworkResponsesAPI.getAll({ studentId: user.id }),
        homeworkResultsAPI.getAll({ studentId: user.id }),
      ]);
      setLessons(lRes.data || []);
      setVideos(vRes.data || []);
      setGroupHW(hwRes.data || []);
      setGroupResponses(respRes.data || []);
      setGroupResults(resRes.data || []);
      
      if (lRes.data?.[0]) setCurrentLesson(lRes.data[0]);
    } catch { 
      setLessons([]); setVideos([]); setGroupHW([]); setGroupResponses([]); setGroupResults([]);
    }
  };

  useEffect(() => {
    if (!currentLesson?.id || !user?.id) return;
    const hw = groupHW.find(h => h.lessonId === currentLesson.id) || null;
    setHomework(hw);
    if (hw) {
      setResponse(groupResponses.find(r => r.homeworkId === hw.id) || null);
      setResult(groupResults.find(r => r.homeworkId === hw.id) || null);
    } else {
      setResponse(null); setResult(null);
    }
  }, [currentLesson, groupHW, groupResponses, groupResults, user]);

  const currentVideo = videos.find(v => v.lessonId === currentLesson?.id);

  return (
    <div className="fade-in max-w-[1400px] mx-auto pb-10">
      <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-900 text-gray-800 dark:text-gray-100 uppercase tracking-tight mb-1">
             {selectedGroup?.name || 'Darslar'}
          </h1>
          <p className="text-[10px] text-gray-400 font-900 uppercase tracking-widest">
            {lessons.length} ta dars mavjud
          </p>
        </div>
        <div className="flex items-center gap-4">
           {viewMode === 'detail' && (
             <button onClick={() => setViewMode('list')} className="px-4 py-2 rounded-xl text-[10px] font-900 uppercase tracking-widest flex items-center gap-2 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 text-gray-500 hover:text-primary transition-all shadow-sm">
               <MoveLeft size={14}/> Kurs rejasiga qaytish
             </button>
           )}
           <div className="flex gap-2 p-1 bg-white dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm">
              {groups.map(g => (
                <button key={g.id} onClick={() => handleGroupChange(g)}
                  className={`px-4 py-2 rounded-lg text-[10px] font-900 uppercase tracking-widest transition-all ${selectedGroup?.id === g.id ? 'bg-primary text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}>
                  {g.name}
                </button>
              ))}
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
                   <th className="table-header text-center py-4 text-[11px] font-900 uppercase tracking-widest">
                     <span className="inline-flex items-center gap-1 cursor-pointer hover:text-primary">Uyga vazifa tugash vaqti <ChevronDown size={14}/></span>
                   </th>
                   <th className="table-header pr-6 text-right py-4 text-[11px] font-900 uppercase tracking-widest">
                     <span className="inline-flex items-center gap-1 cursor-pointer hover:text-primary">Dars sanasi <ChevronUp size={14}/></span>
                   </th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                 {lessons.map((l) => {
                   const hw = groupHW.find(h => h.lessonId === l.id);
                   const resp = hw ? groupResponses.find(r => r.homeworkId === hw.id) : null;
                   const res = hw ? groupResults.find(r => r.homeworkId === hw.id) : null;
                   const vCount = videos.filter(v => v.lessonId === l.id).length;
                   
                   let statusLabel = "Berilmagan";
                   let statusClass = "bg-gray-400/10 text-gray-400";
                   
                   if (hw) {
                     if (res) {
                       statusLabel = res.status === 'APPROVED' ? "Qabul qilindi" : "Rad etildi";
                       statusClass = res.status === 'APPROVED' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500";
                     } else if (resp) {
                       statusLabel = "Topshirilgan";
                       statusClass = "bg-blue-500/10 text-blue-500";
                     } else {
                       statusLabel = "Berilmagan";
                       statusClass = "bg-gray-500/20 text-gray-500";
                     }
                   }

                   return (
                     <tr key={l.id} onClick={() => { setCurrentLesson(l); setViewMode('detail'); }}
                       className="hover:bg-gray-50/60 dark:hover:bg-white/5 transition-all cursor-pointer group">
                       <td className="table-cell pl-6 font-800 text-sm text-gray-700 dark:text-gray-200 py-4">{l.title}</td>
                       <td className="table-cell text-center py-4">
                          <div className="flex justify-center">
                            <div className="relative">
                              <PlayCircle size={22} strokeWidth={1.5} className={vCount > 0 ? "text-primary" : "text-gray-200 dark:text-gray-700"} />
                              {vCount > 0 && <span className="absolute -top-1.5 -right-1.5 bg-primary text-white text-[8px] min-w-[14px] h-[14px] px-1 rounded-full flex items-center justify-center font-900 ring-2 ring-white dark:ring-gray-800">{vCount}</span>}
                            </div>
                          </div>
                       </td>
                       <td className="table-cell text-center py-4">
                          <span className={`px-3 py-1 rounded-lg text-[10px] font-900 uppercase tracking-widest ${statusClass}`}>
                            {statusLabel}
                          </span>
                       </td>
                       <td className="table-cell text-center font-800 text-xs text-gray-400 py-4">
                          {hw?.deadline ? dayjs(hw.deadline).format('DD MMM, YYYY') : '-'}
                       </td>
                       <td className="table-cell pr-6 text-right font-800 text-xs text-gray-500 uppercase tracking-tighter py-4">
                          {l.date ? dayjs(l.date).format('DD MMM, YYYY') : '—'}
                       </td>
                     </tr>
                   );
                 })}
                 {lessons.length === 0 && (
                   <tr><td colSpan={5} className="py-20 text-center"><Empty text="Mavzular topilmadi"/></td></tr>
                 )}
               </tbody>
             </table>
           </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* Main Content Section */}
          <div className="lg:col-span-3 space-y-6">
            <div className="flex items-center gap-8 border-b border-gray-100 dark:border-white/5 pb-1">
              <button onClick={() => setActiveTab('video')} className={`pb-3 text-xs font-900 uppercase tracking-widest transition-all relative ${activeTab === 'video' ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}`}>
                Video
                {activeTab === 'video' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
              </button>
              <button onClick={() => setActiveTab('task')} className={`pb-3 text-xs font-900 uppercase tracking-widest transition-all relative flex items-center gap-2 ${activeTab === 'task' ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}`}>
                Vazifalar
                {activeTab === 'task' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
              </button>
              {activeTab === 'task' && <span className="ml-auto text-[11px] font-900 text-gray-400 uppercase tracking-widest">Ball: {result?.score || 0}</span>}
            </div>

            {activeTab === 'video' ? (
              <div className="fade-in space-y-6">
                <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl relative">
                   {currentVideo ? (
                     <video controls className="w-full h-full object-cover">
                       <source src={currentVideo.url} type="video/mp4" />
                     </video>
                   ) : (
                     <div className="w-full h-full flex flex-col items-center justify-center text-white/40">
                       <PlayCircle size={64} strokeWidth={1} className="mb-4 opacity-20"/>
                       <p className="text-xs font-900 uppercase tracking-widest">Video dars hozircha yo'q</p>
                     </div>
                   )}
                </div>
                
                <div className="bg-[#FAF9F6] dark:bg-white/5 rounded-2xl p-8 border border-gray-100 dark:border-white/5 shadow-sm shadow-black/5">
                  <h2 className="text-xl font-900 text-gray-800 dark:text-gray-100 uppercase tracking-tight mb-2">
                    {currentLesson?.title || 'Dars mavzusi'}
                    {currentVideo && <span className="text-sm text-gray-400 lowercase ml-3 font-700">({currentVideo.title}.mov)</span>}
                  </h2>
                  <p className="text-[10px] font-900 text-gray-400 uppercase tracking-widest mb-6">Dars sanasi: {currentLesson?.date ? dayjs(currentLesson.date).format('DD MMM, YYYY') : '—'}</p>
                  
                  <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed font-600">
                    {currentLesson?.description || "Ushbu dars uchun qo'shimcha tavsif kiritilmagan."}
                  </div>
                </div>
              </div>
            ) : (
              <div className="fade-in space-y-6">
                {!homework ? (
                  <div className="card p-16 text-center"><Empty text="Bu dars uchun vazifa biriktirilmagan"/></div>
                ) : (
                  <div className="flex flex-col gap-6">
                    {/* HW details block */}
                    <div className="bg-[#FAF9F6] dark:bg-white/5 rounded-2xl p-8 space-y-4 border border-gray-100 dark:border-white/5">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-900 text-gray-800 dark:text-gray-100 uppercase tracking-tight">Uyga vazifa</h3>
                        <div className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-900 flex items-center gap-2 shadow-sm shadow-red-500/20 uppercase tracking-widest">
                           <AlertCircle size={14}/> Uyga vazifa muddati: {homework.deadline ? dayjs(homework.deadline).format('DD MMMM, YYYY HH:mm') : '—'}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 font-600 leading-relaxed">
                        {homework.description || homework.title}
                      </p>
                      <div className="flex items-center justify-between pt-6 border-t border-gray-100 dark:border-white/5">
                        <span className="text-[10px] font-900 text-gray-400 uppercase tracking-widest">Fayllar soni: 0</span>
                        <span className="text-[10px] font-900 text-gray-400">{dayjs(homework.createdAt).format('HH:mm DD MMM, YYYY')}</span>
                      </div>
                    </div>

                    {/* Submission block */}
                    <div className="bg-[#FAF9F6] dark:bg-white/5 rounded-2xl p-8 space-y-4 border border-gray-100 dark:border-white/5">
                      <div className="flex items-center justify-between mb-2">
                         <h3 className="text-lg font-900 text-gray-800 dark:text-gray-100 uppercase tracking-tight">Mening jo'natmalarim</h3>
                      </div>
                      {response ? (
                        <div className="flex flex-col gap-4">
                          <a href={response.url} target="_blank" rel="noreferrer" className="text-sm font-700 text-blue-500 hover:underline break-all inline-block bg-blue-50/50 dark:bg-blue-500/5 p-3 rounded-xl">
                            {response.url}
                          </a>
                          <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-white/5">
                            <span className="text-[10px] font-900 text-gray-400 uppercase tracking-widest">Fayllar soni: {response.url ? 1 : 0}</span>
                            <span className="text-[10px] font-900 text-gray-400">{dayjs(response.createdAt).format('HH:mm DD MMM, YYYY')}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="py-4 flex flex-col items-center gap-4">
                           <p className="text-xs text-gray-400 font-900 uppercase tracking-widest uppercase">Hali vazifa topshirmadingiz</p>
                           <button onClick={() => setViewMode('detail')} className="btn-primary py-2 px-6 rounded-xl text-[10px] font-900 uppercase tracking-widest">Vazifani topshirish</button>
                        </div>
                      )}
                    </div>

                    {/* Feedback block */}
                    {result && (
                      <div className="bg-[#FAF9F6] dark:bg-white/5 rounded-2xl p-8 space-y-4 border border-gray-100 dark:border-white/5 relative overflow-hidden">
                        <div className="flex items-start justify-between">
                           <div>
                             <h3 className="text-lg font-900 text-gray-800 dark:text-gray-100 uppercase tracking-tight mb-4">O'qituvchi izohi</h3>
                             <p className="text-sm font-700 text-gray-600 dark:text-gray-300 leading-relaxed mb-6 max-w-2xl">
                                {result.comment || 'Loyiha yaxshi ishlab chiqilmoqda shunday davom eting'}
                             </p>
                             <div className="flex items-center gap-2">
                                <Avatar size="xs" name={selectedGroup?.teacher?.fullName}/>
                                <span className="text-[10px] text-gray-400 font-900 uppercase tracking-widest">Tekshiruvchi: {selectedGroup?.teacher?.fullName || 'Teacher'}</span>
                             </div>
                           </div>
                           <span className="px-4 py-2 rounded-xl text-[10px] font-900 uppercase tracking-widest bg-green-500/10 text-green-600 whitespace-nowrap shadow-sm shadow-green-500/5">
                             {result.status === 'APPROVED' ? 'Vazifa qabul qilindi' : result.status === 'REJECTED' ? 'Vazifa rad etildi' : result.status}
                           </span>
                        </div>
                        <p className="text-[10px] text-gray-400 font-900 text-right pt-6 border-t border-gray-100 dark:border-white/5">
                           {dayjs(result.createdAt).format('HH:mm DD MMM, YYYY')}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar Lesson List */}
          <div className="lg:col-span-1 space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto pr-2 custom-scrollbar">
             <p className="text-[10px] font-900 text-gray-400 uppercase tracking-widest mb-4 px-2">Darslar ro'yxati</p>
             {lessons.map((l, i) => (
               <div key={l.id} onClick={() => setCurrentLesson(l)}
                 className={`p-4 rounded-2xl cursor-pointer transition-all border group relative overflow-hidden ${currentLesson?.id === l.id ? 'bg-[#FAF9F6] dark:bg-white/10 border-primary shadow-sm shadow-primary/5' : 'bg-white dark:bg-white/5 border-gray-100 dark:border-white/10 hover:border-primary/30 hover:bg-gray-50/50'}`}>
                 <h4 className={`text-sm font-900 tracking-tight leading-tight mb-2 transition-colors ${currentLesson?.id === l.id ? 'text-primary' : 'text-gray-700 dark:text-gray-300'}`}>
                   {l.title}
                 </h4>
                 <p className="text-[10px] font-800 text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                   <Calendar size={12} className="opacity-60"/> {l.date ? dayjs(l.date).format('DD MMM, YYYY') : '—'}
                 </p>
                 {currentLesson?.id === l.id && <div className="absolute top-0 right-0 w-8 h-8 flex items-center justify-center text-primary/20"><PlayCircle size={20}/></div>}
               </div>
             ))}
             {lessons.length === 0 && <div className="p-10 text-center"><Empty text="Darslar yo'q"/></div>}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── HOMEWORK ─────────────────────────────────────────────────────────────
export function StudentHomework() {
  const { user } = useStudentAuth();
  const fileRef = useRef();
  const [homework, setHomework] = useState([]);
  const [responses, setResponses] = useState([]);
  const [results, setResults] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedHW, setSelectedHW] = useState(null);
  const [form, setForm] = useState({ title: '', url: '', file: null });
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

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

  const getResponse = hwId => responses.find(r => r.homeworkId === hwId);
  const getResult = hwId => results.find(r => r.homeworkId === hwId);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { data } = await homeworkResponsesAPI.create({ 
        homeworkId: Number(selectedHW.id), 
        studentId: user.id, 
        title: form.title, 
        url: form.url 
      });

      if (form.file) {
        const fd = new FormData();
        fd.append('file', form.file);
        await homeworkResponsesAPI.uploadFile(data.id, fd);
      }

      toast.success('Javob topshirildi!');
      setDrawerOpen(false); load();
    } catch (e) { toast.error(e.response?.data?.message || 'Xatolik'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fade-in space-y-6">
      <PageHeader title="Vazifalarim" subtitle="Topshiriqlar bo'yicha hisobotlar"/>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <p className="text-[10px] font-900 text-gray-400 uppercase tracking-widest whitespace-nowrap">Uy vazifa statusi</p>
          <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="max-w-[200px]">
            <option value="all">Barchasi</option>
            <option value="PENDING">Kutayotganlar</option>
            <option value="APPROVED">Qabul qilingan</option>
            <option value="REJECTED">Rad etilgan</option>
          </Select>
        </div>
      </div>

      <div className="card overflow-hidden shadow-xl shadow-primary/5">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50/50 dark:bg-white/5">
              <th className="table-header pl-6">Vazifa nomi</th>
              <th className="table-header text-center">Video</th>
              <th className="table-header text-center">Uy vazifa holati</th>
              <th className="table-header text-center">Tugash vaqti</th>
              <th className="table-header pr-6 text-right">Dars sanasi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/5">
            {homework.map(hw => {
              const resp = getResponse(hw.id);
              const res = getResult(hw.id);
              return (
                <tr key={hw.id} onClick={() => { setSelectedHW(hw); setDrawerOpen(true); }} className="hover:bg-gray-50/60 dark:hover:bg-white/5 transition-all cursor-pointer">
                  <td className="table-cell pl-6 max-w-[300px]">
                    <div className="flex flex-col">
                      <p className="font-800 text-[13px] text-gray-800 dark:text-gray-100 truncate">{hw.title}</p>
                    </div>
                  </td>
                  <td className="table-cell text-center">
                    <span className="w-7 h-7 rounded-full border border-blue-400 flex items-center justify-center mx-auto text-blue-500 font-900 text-[10px]">0</span>
                  </td>
                  <td className="table-cell text-center">
                    <span className={`px-4 py-1 rounded-lg text-[10px] font-900 uppercase tracking-widest ${resp ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'}`}>
                      {resp ? (res?.status || resp.status || 'KUTILMOQDA') : 'BERILMAGAN'}
                    </span>
                  </td>
                  <td className="table-cell text-center text-gray-400 font-700">-</td>
                  <td className="table-cell pr-6 text-right text-xs font-800 text-gray-600 dark:text-gray-400 uppercase tracking-tighter">
                    {hw.lesson?.date ? dayjs(hw.lesson.date).format('DD MMM, YYYY') : '01 Apr, 2026'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={`Vazifa topshirish`}>
         <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl mb-6">
           <h4 className="font-900 text-sm text-gray-800 dark:text-gray-200 uppercase tracking-tight mb-1">{selectedHW?.title}</h4>
           <p className="text-xs text-gray-400 font-600 leading-relaxed">{selectedHW?.description || 'Tavsif yo\'q'}</p>
         </div>
         <Field label="Havola (GitHub/Drive)"><Input placeholder="https://..." value={form.url} onChange={e => setForm({...form, url: e.target.value})}/></Field>
         <Field label="Qo'shimcha izoh"><Input placeholder="Vazifa bo'yicha fikrlar..." value={form.title} onChange={e => setForm({...form, title: e.target.value})}/></Field>
         <div onClick={() => fileRef.current.click()} className="border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl p-10 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all">
           <input type="file" hidden ref={fileRef} onChange={e => setForm({...form, file: e.target.files[0]})}/>
           <Upload className="mx-auto mb-3 text-gray-300" size={32}/>
           <p className="text-xs font-900 text-gray-500 uppercase tracking-widest">{form.file ? form.file.name : 'Faylni tanlang'}</p>
         </div>
         <div className="flex gap-3 mt-6">
           <button onClick={() => setDrawerOpen(false)} className="btn-secondary flex-1 justify-center">BEKOR</button>
           <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1 justify-center">{loading ? 'YUBORILMOQDA...' : 'TOPSHIRISH'}</button>
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

  const presentCount = attendance.filter(a => a.isPresent).length;
  const rate = attendance.length ? Math.round((presentCount / attendance.length) * 100) : 0;

  return (
    <div className="fade-in space-y-6">
      <PageHeader title="Davomatim" subtitle="O'zlashtirish ko'rsatkichingiz: " actions={<span className="text-2xl font-900 text-primary">{rate}%</span>}/>
      <div className="card overflow-hidden shadow-xl shadow-primary/5">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50/50 dark:bg-white/5">
              <th className="table-header pl-6">#</th>
              <th className="table-header">Dars mavzusi</th>
              <th className="table-header">Holati</th>
              <th className="table-header pr-6 text-right">Sana</th>
            </tr>
          </thead>
          <tbody>
            {attendance.map((a, i) => (
              <tr key={a.id} className="hover:bg-gray-50/60 transition-colors">
                <td className="table-cell pl-6 text-gray-400 font-900 text-[10px]">{i+1}</td>
                <td className="table-cell font-800 text-sm text-gray-800 dark:text-gray-100">Dars #{a.lessonId}</td>
                <td className="table-cell">
                  <span className={`px-3 py-1 rounded-lg text-[10px] font-900 uppercase tracking-widest ${a.isPresent ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>
                    {a.isPresent ? '✓ KELDI' : '✗ KELMADI'}
                  </span>
                </td>
                <td className="table-cell pr-6 text-right text-xs font-700 text-gray-400">
                  {a.createdAt ? dayjs(a.createdAt).format('DD.MM.YYYY HH:mm') : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── INDICATORS (Ko'rsatkichlarim - Najot Style) ──────────────────────────
export function StudentIndicators() {
  const { user } = useStudentAuth();
  const [activeCategory, setActiveCategory] = useState(null); // 'attendance' | 'homework' | null
  
  if (activeCategory === 'attendance') {
    return (
      <div className="fade-in space-y-6">
        <PageHeader title="Darsga ishtirok bo'yicha natijalar" subtitle="Guruh" />
        <div className="mb-4">
          <Select value="all" onChange={() => {}} className="max-w-[200px]">
            <option value="all">Barchasi</option>
          </Select>
        </div>
        <div className="card overflow-hidden shadow-xl shadow-primary/5">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-white/5">
                <th className="table-header pl-6">Dars mavzusi</th>
                <th className="table-header">Guruh</th>
                <th className="table-header text-center">Holati</th>
                <th className="table-header text-center">XP</th>
                <th className="table-header text-center">Kumush</th>
                <th className="table-header pr-6 text-right">Dars sanasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {[
                { title: 'Interview preperation', group: 'Bootcamp Full Stack (NodeJS+ReactJS) N25', status: '', xp: 2, coin: 16, date: '06 Apr, 2026' },
                { title: 'practice', group: 'Bootcamp Full Stack (NodeJS+ReactJS) N25', status: '', xp: 1, coin: 8, date: '06 Apr, 2026' },
                { title: 'revision', group: 'Bootcamp Full Stack (NodeJS+ReactJS) N25', status: '', xp: 0, coin: 0, date: '03 Apr, 2026' },
                { title: 'Next fetch data, CI/CD nginx domain', group: 'Bootcamp Full Stack (NodeJS+ReactJS) N25', status: '', xp: 2, coin: 16, date: '01 Apr, 2026' },
              ].map((item, i) => (
                <tr key={i} className="hover:bg-gray-50/60 dark:hover:bg-white/5 transition-all">
                  <td className="table-cell pl-6 font-800 text-gray-800 dark:text-gray-100 text-[13px]">{item.title}</td>
                  <td className="table-cell text-xs font-700 text-gray-500">{item.group}</td>
                  <td className="table-cell text-center text-xs font-700 text-gray-500">{item.status}</td>
                  <td className="table-cell text-center text-[13px] font-900 text-gray-800 dark:text-gray-200">{item.xp}</td>
                  <td className="table-cell text-center text-[13px] font-900 text-gray-800 dark:text-gray-200">{item.coin}</td>
                  <td className="table-cell pr-6 text-right font-800 text-[11px] text-gray-500">{item.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button onClick={() => setActiveCategory(null)} className="text-primary text-xs font-900 uppercase tracking-widest mt-4">Ortga qaytish</button>
      </div>
    );
  }

  if (activeCategory === 'homework') {
    return (
      <div className="fade-in space-y-6">
        <PageHeader title="Uyga vazifa bo'yicha natijalar" subtitle="Guruh" />
        <div className="mb-4">
          <Select value="all" onChange={() => {}} className="max-w-[200px]">
            <option value="all">Barchasi</option>
          </Select>
        </div>
        <div className="card overflow-hidden shadow-xl shadow-primary/5">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-white/5">
                <th className="table-header pl-6">Dars mavzusi</th>
                <th className="table-header">Guruh</th>
                <th className="table-header text-center">Uy vazifa statusi</th>
                <th className="table-header text-center">Ball</th>
                <th className="table-header text-center">XP</th>
                <th className="table-header text-center">Kumush</th>
                <th className="table-header pr-6 text-right">Uyga vazifa berilgan sana</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {[
                { title: 'crm continue backend finish', group: 'Bootcamp Full Stack (NodeJS+ReactJS) N25', status: 'Qabul qilindi', ball: 90, xp: 4, coin: 32, date: '17 Mart, 2026' },
                { title: 'crm project continue', group: 'Bootcamp Full Stack (NodeJS+ReactJS) N25', status: 'Qabul qilindi', ball: 86, xp: 4, coin: 32, date: '17 Mart, 2026' },
                { title: 'React continue, nested route', group: 'Bootcamp Full Stack (NodeJS+ReactJS) N25', status: 'Qabul qilindi', ball: 90, xp: 4, coin: 32, date: '17 Mart, 2026' },
              ].map((item, i) => (
                <tr key={i} className="hover:bg-gray-50/60 dark:hover:bg-white/5 transition-all">
                  <td className="table-cell pl-6 font-800 text-[13px] text-gray-800 dark:text-gray-100">{item.title}</td>
                  <td className="table-cell text-xs font-700 text-gray-500">{item.group}</td>
                  <td className="table-cell text-center text-xs font-700 text-gray-500">{item.status}</td>
                  <td className="table-cell text-center text-[13px] font-900 text-gray-800 dark:text-gray-200">{item.ball}</td>
                  <td className="table-cell text-center text-[13px] font-900 text-gray-800 dark:text-gray-200">{item.xp}</td>
                  <td className="table-cell text-center text-[13px] font-900 text-gray-800 dark:text-gray-200">{item.coin}</td>
                  <td className="table-cell pr-6 text-right font-800 text-[11px] text-gray-500">{item.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button onClick={() => setActiveCategory(null)} className="text-primary text-xs font-900 uppercase tracking-widest mt-4">Ortga qaytish</button>
      </div>
    );
  }

  return (
    <div className="fade-in space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-900 text-gray-800 dark:text-gray-100 uppercase tracking-tight">Mening natijalarim</h1>
        <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm">
           <Star className="text-amber-400" size={18} fill="currentColor"/>
           <span className="text-sm font-900 text-gray-800 dark:text-gray-100 uppercase tracking-tight">Kumushlar: {user?.coin || 0}</span>
        </div>
      </div>

      <div className="card p-8 shadow-xl shadow-primary/5 bg-white dark:bg-white/5 border-none">
         <div className="flex items-center gap-2 mb-6">
           <Zap className="text-primary" size={20}/>
           <span className="text-sm font-900 text-gray-800 dark:text-gray-100 uppercase tracking-tight">Bosqich: 4</span>
         </div>
         <div className="h-4 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden p-0.5 border border-gray-100 dark:border-white/5 mb-4">
            <div className="h-full bg-green-500 rounded-full transition-all duration-1000 shadow-sm" style={{ width: '86%' }} />
         </div>
         <div className="flex items-center gap-2 text-primary">
            <Star size={16}/>
            <span className="text-sm font-900 uppercase tracking-widest">XP: {user?.xp || 0}</span>
         </div>
      </div>

      <div className="card p-8 shadow-xl shadow-primary/5 bg-white dark:bg-white/5 border-none">
         <h3 className="text-[11px] font-900 text-gray-400 uppercase tracking-widest mb-8">Yig'ilgan natijalar monitoringi</h3>
          <div className="space-y-4">
            {[
              { id: 'attendance', label: 'Darsga ishtirok bo\'yicha jami XP 542, Jami Kumush 3488', icon: '📋' },
              { id: 'homework', label: 'Uyga vazifa bo\'yicha jami XP 703, Jami Kumush 4060', icon: '📝' },
              { id: 'exam', label: 'Imtihondan o\'tish bo\'yicha jami XP 53, Jami Kumush 323', icon: '🎓' },
              { id: 'admin', label: 'Administratsiya tomonidan berilgan jami XP 0, Jami Kumush -7400', icon: '👤' }
            ].map((m, i) => (
              <div key={i} onClick={() => setActiveCategory(m.id)} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/50 dark:bg-white/5 border border-gray-100 dark:border-white/5 group hover:border-primary/20 transition-all cursor-pointer">
                 <div className="flex items-center gap-4">
                    <span className="text-xl">{m.icon}</span>
                    <span className="text-xs font-800 text-gray-600 dark:text-gray-300 uppercase tracking-tight">{m.label}</span>
                 </div>
                 <ChevronRight size={18} className="text-gray-300 group-hover:text-primary transition-colors"/>
              </div>
            ))}
         </div>

         <div className="mt-10 pt-8 border-t border-gray-100 dark:border-white/5 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-primary">
               <Zap size={16}/>
               <span className="text-sm font-900 uppercase tracking-widest">Jami yig'ilgan XP: {user?.xp || 0}</span>
            </div>
            <div className="flex items-center gap-2 text-amber-500">
               <Star size={16}/>
               <span className="text-sm font-900 uppercase tracking-widest">Jami yig'ilgan Kumushlar: {user?.coin || 0}</span>
            </div>
         </div>
      </div>
    </div>
  );
}

// ─── SHOP (Do'kon - Najot Style) ───────────────────────────────────────────
export function StudentShop() {
  const { user } = useStudentAuth();
  const [activeTab, setActiveTab] = useState('sell');
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // Filters
  const [category, setCategory] = useState('Barchasi');
  const [priceFrom, setPriceFrom] = useState('');
  const [priceTo, setPriceTo] = useState('');
  const [search, setSearch] = useState('');
  const [canAffordOnly, setCanAffordOnly] = useState(false);

  const [products, setProducts] = useState([
     { id: 1, name: "Najot Ta'lim ruchkasi", price: 800, photo: "https://shop.najottalim.uz/storage/products/1/ruchka.png", category: "Aksessuar", description: "O'ziga xos dizaynga ega ruchka." },
     { id: 2, name: "Stikerlar to'plami", price: 1100, photo: "https://shop.najottalim.uz/storage/products/2/stikers.png", category: "Aksessuar", description: "Kompyuteringiz uchun sifatli stikerlar." },
     { id: 3, name: "Najot Ta'lim stakani", price: 1400, photo: "https://shop.najottalim.uz/storage/products/3/cup.png", category: "Aksessuar", description: "Najot Ta'lim Markazi tomonidan taqdim etilgan stakan. Asli mahsulot ko'rinishi suratdagidan farq qilishi mumkin." },
     { id: 4, name: "Sichqoncha uchun gilamcha", price: 1800, photo: "https://shop.najottalim.uz/storage/products/4/mousepad.png", category: "Aksessuar", description: "Qulay va silliq sichqoncha gilamchasi." },
     { id: 5, name: "Najot Ta'lim termosi", price: 2200, photo: "https://shop.najottalim.uz/storage/products/termos.png", category: "Aksessuar", description: "Najot Ta'lim Markazi tomonidan taqdim etilgan termos. Asli mahsulot ko'rinishi suratdagidan farq qilishi mumkin." },
  ]);

  if (selectedProduct) {
    return (
      <div className="fade-in max-w-5xl">
        <div className="flex items-center gap-4 mb-6">
           <button onClick={() => setSelectedProduct(null)} className="w-10 h-10 bg-white dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5 flex items-center justify-center text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors shadow-sm">
             <MoveLeft size={18}/>
           </button>
           <h1 className="text-2xl font-900 text-gray-800 dark:text-gray-100 uppercase tracking-tight">Ortga</h1>
        </div>
        
        <div className="card p-10 bg-white dark:bg-white/5 border-none shadow-xl shadow-primary/5 flex flex-col items-center text-center">
           <div className="w-full max-w-md bg-gray-50 dark:bg-white/5 aspect-[4/5] rounded-3xl p-10 mb-10 flex items-center justify-center">
             <img src={selectedProduct.photo} alt={selectedProduct.name} className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal drop-shadow-xl" />
           </div>
           
           <div className="max-w-2xl text-left w-full space-y-6">
             <h2 className="text-xl font-900 text-gray-800 dark:text-gray-100 tracking-tight">{selectedProduct.name}</h2>
             <p className="text-[13px] font-600 text-gray-500 leading-relaxed max-w-xl">
               {selectedProduct.description}
             </p>
             <div className="flex items-center gap-2 mt-4 text-[15px] font-900 text-gray-800 dark:text-gray-100">
               Qiymati: {selectedProduct.price} <Coins size={16} className="text-[#DEB887]" fill="currentColor"/>
             </div>
             <div className="flex flex-col gap-3 max-w-xs mt-8">
               <button 
                 disabled={user?.coin < selectedProduct.price}
                 className={`w-full py-3.5 rounded-xl text-[12px] font-900 tracking-wider transition-all shadow-sm ${user?.coin >= selectedProduct.price ? 'bg-[#DEB887] hover:bg-[#c9a372] text-white shadow-[#DEB887]/30' : 'bg-gray-400 text-white cursor-not-allowed opacity-80'}`}
               >
                 {user?.coin >= selectedProduct.price ? 'Sotib olish' : 'Kumushingiz yetarli emas'}
               </button>
             </div>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-6 border-b border-gray-100 dark:border-white/5 pb-2">
            <button onClick={() => setActiveTab('sell')} className={`pb-2 text-sm font-900 uppercase tracking-widest transition-all border-b-2 ${activeTab === 'sell' ? 'text-[#DEB887] border-[#DEB887]' : 'text-gray-400 border-transparent hover:text-gray-600'}`}>
              Sotuvda
            </button>
            <button onClick={() => setActiveTab('history')} className={`pb-2 text-sm font-900 uppercase tracking-widest transition-all border-b-2 ${activeTab === 'history' ? 'text-[#DEB887] border-[#DEB887]' : 'text-gray-400 border-transparent hover:text-gray-600'}`}>
              Sotib olganlarim
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-6 mb-8 pt-4">
         <div className="space-y-2">
            <label className="text-[11px] font-900 text-gray-400 tracking-widest uppercase">Kategoriya</label>
            <Select value={category} onChange={e => setCategory(e.target.value)} className="w-40 border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 font-700 text-gray-700">
              <option value="Barchasi">Barchasi</option>
              <option value="Aksessuar">Aksessuar</option>
            </Select>
         </div>
         <div className="space-y-2">
            <label className="text-[11px] font-900 text-gray-400 tracking-widest uppercase">Aksessuar qiymati</label>
            <div className="flex items-center gap-3">
               <input value={priceFrom} onChange={e => setPriceFrom(e.target.value)} type="number" placeholder="dan" className="w-24 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:border-[#DEB887] outline-none transition-colors" />
               <span className="text-xs font-700 text-gray-400">gacha</span>
               <input value={priceTo} onChange={e => setPriceTo(e.target.value)} type="number" placeholder="gacha" className="w-24 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:border-[#DEB887] outline-none transition-colors" />
            </div>
         </div>
         <div className="space-y-2 flex-1 min-w-[200px]">
            <label className="text-[11px] font-900 text-gray-400 tracking-widest uppercase">Aksessuar nomi</label>
            <div className="relative">
              <input value={search} onChange={e => setSearch(e.target.value)} type="text" placeholder="Qidirish..." className="w-full pl-10 pr-4 py-2 text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:border-[#DEB887] outline-none transition-colors" />
              <Search size={16} className="absolute left-3.5 top-2.5 text-gray-400" />
            </div>
         </div>
         <div className="flex items-center gap-3 mb-2">
            <label className="text-[11px] font-900 text-gray-400 tracking-widest uppercase">Kumushlarim yetadi</label>
            <button 
              onClick={() => setCanAffordOnly(!canAffordOnly)}
              className={`w-10 h-5 rounded-full relative transition-colors ${canAffordOnly ? 'bg-[#DEB887]' : 'bg-gray-200 dark:bg-gray-700'}`}
            >
              <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-[3px] transition-all duration-300 ${canAffordOnly ? 'left-[22px]' : 'left-[3px]'}`} />
            </button>
         </div>
         <button onClick={() => {setCategory('Barchasi'); setPriceFrom(''); setPriceTo(''); setSearch(''); setCanAffordOnly(false);}} className="p-2.5 mb-0.5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-400 hover:text-[#DEB887] hover:border-[#DEB887] transition-all bg-white dark:bg-white/5">
            <Eraser size={18} />
         </button>
      </div>

      {activeTab === 'sell' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map(p => (
            <div key={p.id} onClick={() => setSelectedProduct(p)} className="card p-0 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 shadow-md shadow-gray-100/50 dark:shadow-none relative overflow-hidden group hover:shadow-xl hover:border-gray-200 transition-all cursor-pointer rounded-2xl flex flex-col h-full">
               <div className="w-full aspect-[4/3] bg-[#F8F9FA] dark:bg-white/5 flex items-center justify-center p-6 mb-4">
                  <img src={p.photo} alt={p.name} className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal group-hover:scale-105 transition-transform duration-500" />
               </div>
               <div className="px-5 pb-5 flex flex-col flex-1">
                 <h3 className="font-800 text-gray-800 dark:text-gray-200 text-sm mb-4 leading-tight">{p.name}</h3>
                 <div className="flex items-center justify-between gap-4 mt-auto">
                    <div className="flex items-center gap-1.5 font-900 text-sm text-gray-600 dark:text-gray-300">
                      <span>{p.price}</span>
                      <Coins size={16} className="text-[#DEB887]" fill="currentColor"/>
                    </div>
                    <button 
                      disabled={user?.coin < p.price}
                      className={`px-3 py-2 rounded-lg text-[9px] font-900 uppercase tracking-widest transition-all ${user?.coin >= p.price ? 'bg-gray-100 text-gray-800 hover:bg-gray-200' : 'bg-gray-500 text-white'}`}>
                      {user?.coin >= p.price ? 'Sotib olish' : 'Kumushingiz yetarli emas'}
                    </button>
                 </div>
               </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-20 text-center"><Empty text="Siz hali biror narsa sotib olmagansiz"/></div>
      )}
    </div>
  );
}

// ─── VIDEOS & RATINGS ──────────────────────────────────────────────────────
export function StudentVideos() { return <StudentLessons />; }
export function StudentRatings() { return <div className="card p-10 text-center"><Empty text="Reyting xizmati vaqtinchalik mavjud emas"/></div>; }

// ─── NOTIFICATIONS (Xabarnomalar) ───────────────────────────────────────────
export function StudentNotifications() {
  const [filter, setFilter] = useState('all');
  const [ratingModal, setRatingModal] = useState({ open: false, lesson: null, score: 4, text: '' });
  
  const notifications = [
    { id: 1, type: 'rating', title: 'practice darsini baholang', date: '06 Apr, 2026 21:30' },
    { id: 2, type: 'bonus', title: 'Darsda qatnashgani uchun bonuslar taqdim qilindi 🤩', date: '06 Apr, 2026 19:29' },
    { id: 3, type: 'rating', title: 'Practice darsini baholang', date: '03 Apr, 2026 21:30' },
    { id: 4, type: 'rating', title: 'Practice darsini baholang', date: '02 Apr, 2026 21:30' },
    { id: 5, type: 'rating', title: 'Practice darsini baholang', date: '01 Apr, 2026 21:30' },
  ];

  const submitRating = () => {
    toast.success("Baho saqlandi!");
    setRatingModal({ open: false, lesson: null, score: 0, text: '' });
  };

  return (
    <div className="fade-in space-y-6 max-w-5xl mx-auto">
      <div className="card p-8 bg-white dark:bg-white/5 border-none shadow-xl shadow-primary/5">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-900 text-gray-800 dark:text-gray-100 tracking-tight">Xabarnomalar</h1>
          <Select value={filter} onChange={e => setFilter(e.target.value)} className="w-48 bg-gray-50 focus:bg-white rounded-lg border-gray-100 text-sm font-700 shadow-sm">
            <option value="all">Barchasi</option>
            <option value="exam">Imtihon</option>
            <option value="group">Guruhga qo'shilganlik</option>
            <option value="homework">Uyga vazifa</option>
            <option value="rating">Darsni baholang</option>
          </Select>
        </div>

        <div className="space-y-4">
          {notifications.map(n => (
            <div 
              key={n.id} 
              onClick={() => n.type === 'rating' && setRatingModal({ open: true, lesson: n.title, score: 4, text: '' })}
              className={`p-5 rounded-2xl border border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 transition-all ${n.type === 'rating' ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-white/10 hover:border-gray-200 relative group' : ''}`}
            >
              <h4 className="font-800 text-[14px] text-gray-800 dark:text-gray-200">{n.title}</h4>
              <p className="text-[11px] font-700 text-gray-400 mt-2">{n.date}</p>
            </div>
          ))}
        </div>
      </div>

      {ratingModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setRatingModal({ open: false, lesson: null, score: 0, text: '' })}/>
          <div className="relative bg-white dark:bg-[#1A1A24] rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
             <div className="p-8 pb-6 text-center border-b border-gray-100 dark:border-white/5">
                <h3 className="text-lg font-900 text-gray-800 dark:text-gray-100">Darsni baholang</h3>
             </div>
             <div className="p-8 pt-6 flex flex-col items-center">
                <div className="flex gap-2 mb-6">
                  {[1,2,3,4,5].map(s => (
                    <Star 
                      key={s} 
                      size={40} 
                      onClick={() => setRatingModal(prev => ({ ...prev, score: s }))}
                      className={`cursor-pointer transition-all ${ratingModal.score >= s ? 'text-yellow-400 fill-yellow-400 drop-shadow-md scale-110' : 'text-gray-300 dark:text-gray-600 hover:scale-105'}`}
                    />
                  ))}
                </div>
                <textarea 
                  value={ratingModal.text}
                  onChange={e => setRatingModal(prev => ({ ...prev, text: e.target.value }))}
                  className="w-full h-24 p-4 text-sm font-600 text-gray-800 dark:text-gray-200 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl resize-none outline-none focus:border-yellow-400/50 focus:ring-4 focus:ring-yellow-400/10 transition-all shadow-inner"
                  placeholder="Izoh yozish (ixtiyoriy)..."
                />
                <button onClick={submitRating} className="w-full mt-6 py-3.5 bg-[#CFAF85] hover:bg-[#B89870] active:scale-95 text-white text-[13px] font-900 uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-[#CFAF85]/30">
                   Baholash
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
