import React, { useEffect, useRef, useState } from 'react';
import { Users, Clock, CheckCircle, Edit2, MoreVertical, Upload, ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import { Avatar, Drawer, Empty, Field, Input } from '../../../components/UI';
import { groupsAPI, lessonsAPI, homeworkAPI, homeworkResultsAPI } from '../../../services/api';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

export default function HomeworkView({ group, teacher }) {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Homework list states
  const [allHWs, setAllHWs] = useState([]);
  const [studentsCount, setStudentsCount] = useState(0);

  // Homework creation/editing states
  const [creatingHW, setCreatingHW] = useState(false);
  const [hwLessonId, setHwLessonId] = useState('');
  const [hwTitle, setHwTitle] = useState('');
  const [hwFile, setHwFile] = useState(null);
  const [editingHWId, setEditingHWId] = useState(null);
  const [hwSaving, setHwSaving] = useState(false);
  const fileInputRef = useRef(null);

  // Homework detail states
  const [selectedHW, setSelectedHW] = useState(null);
  const [hwTab, setHwTab] = useState('Kutayotganlar');
  const [hwStatuses, setHwStatuses] = useState(null);

  const [grading, setGrading] = useState(null);
  const [score, setScore] = useState('');
  const [xp, setXp] = useState('');
  const [comment, setComment] = useState('');
  const autoCoins = Math.floor(Math.max(0, Number(xp || 0))) * 10;

  useEffect(() => {
    setLoading(true);
    Promise.all([
      lessonsAPI.getAll({ groupId: group.id }),
      homeworkAPI.getAll({ groupId: group.id, teacherId: teacher.id }),
      groupsAPI.getStudents(group.id),
    ])
      .then(([lessonRes, hwRes, studentRes]) => {
        setLessons(lessonRes.data || []);
        setAllHWs(hwRes.data || []);
        setStudentsCount(studentRes.data?.length || 0);
      })
      .finally(() => setLoading(false));
  }, [group.id, teacher.id]);

  const availableLessons = lessons.filter(l => 
    !allHWs.some(h => h.lessonId === l.id) || (editingHWId && Number(hwLessonId) === l.id)
  );

  const openEdit = (hw, e) => {
    e.stopPropagation();
    setEditingHWId(hw.id);
    setHwLessonId(hw.lessonId);
    setHwTitle(hw.title || '');
    setHwFile(null);
    setCreatingHW(true);
  };

  const closeForm = () => {
    setCreatingHW(false);
    setEditingHWId(null);
    setHwLessonId('');
    setHwTitle('');
    setHwFile(null);
  };

  const handleCreateHW = async () => {
    if (!hwLessonId || !hwTitle) {
      toast.error('Mavzu va izohni kiritish shart!');
      return;
    }
    setHwSaving(true);
    try {
      let newHwId = null;

      if (editingHWId) {
        await homeworkAPI.update(editingHWId, {
          title: hwTitle,
          lessonId: Number(hwLessonId),
          durationTime: 12
        });
        newHwId = editingHWId;
        toast.success("Uyga vazifa muvaffaqiyatli tahrirlandi!");
      } else {
        const res = await homeworkAPI.create({
          lessonId: Number(hwLessonId),
          title: hwTitle,
          durationTime: 12, // 12 soat
          teacherId: teacher.id
        });
        newHwId = res.data?.homework?.id || res.data?.id;
        toast.success("Uyga vazifa muvaffaqiyatli qo'shildi!");
      }
      
      if (hwFile && newHwId) {
        const fd = new FormData();
        fd.append('file', hwFile);
        await homeworkAPI.uploadFile(newHwId, fd);
      }
      
      closeForm();
      homeworkAPI.getAll({ groupId: group.id, teacherId: teacher.id }).then(r => setAllHWs(r.data || []));
    } catch {
      toast.error('Xatolik yuz berdi');
    } finally {
      setHwSaving(false);
    }
  };

  const loadResponses = async (hw) => {
    setSelectedHW(hw);
    setHwTab('Kutayotganlar');
    setHwStatuses(null);
    try {
       const r = await homeworkAPI.getStudentStatuses(hw.id);
       setHwStatuses(r.data);
    } catch { toast.error("Ma'lumot topilmadi"); }
  };

  const handleGrade = async () => {
    const numericScore = Math.floor(Number(score));
    const numericXp = Math.floor(Math.max(0, Number(xp || 0)));
    const numericCoin = numericXp * 10;
    const targetStudentId = Number(grading?.studentId ?? grading?.student?.id ?? grading?.response?.studentId);
    if (!score || Number.isNaN(numericScore)) {
      toast.error("Ballni to'g'ri kiriting");
      return;
    }
    if (numericScore < 0 || numericScore > 100) {
      toast.error('Ball 0 dan 100 gacha bo\'lishi kerak');
      return;
    }
    if (!targetStudentId || Number.isNaN(targetStudentId)) {
      toast.error("O'quvchi aniqlanmadi, sahifani yangilab qayta urinib ko'ring");
      return;
    }
    try {
      await homeworkResultsAPI.create({ 
        homeworkId: selectedHW.id, 
        studentId: targetStudentId, 
        score: numericScore, 
        xp: numericXp, 
        coin: numericCoin, 
        title: comment, 
        teacherId: teacher.id
      });
      toast.success('Talaba muvaffaqiyatli baholandi!');
      closeGrading();
      loadResponses(selectedHW); // refresh modal details
    } catch (err) {
      const apiMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Xatolik";
      toast.error(Array.isArray(apiMsg) ? apiMsg.join(', ') : apiMsg);
    }
  };

  const openGrading = (entry) => {
    setGrading(entry);
    setScore(entry?.result?.score !== undefined ? String(entry.result.score) : '');
    setXp(entry?.result?.xp !== undefined ? String(entry.result.xp) : '');
    setComment(entry?.result?.title || '');
  };

  const closeGrading = () => {
    setGrading(null);
    setScore('');
    setXp('');
    setComment('');
  };

  const getFileUrl = (file) => {
    if (!file) return '#';
    if (file.startsWith('http')) return file;
    return `http://localhost:4000/uploads/${file.split('/').pop()}`;
  };

  if (creatingHW) {
     return (
        <div className="bg-white rounded-2xl w-full border border-gray-100 shadow-sm p-8 mt-6">
           <div className="flex items-center gap-3 mb-8">
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-800 transition-colors">
                 <ChevronLeft size={20}/>
              </button>
              <h2 className="text-xl font-900 text-gray-800">{editingHWId ? 'Uyga vazifani tahrirlash' : 'Yangi uyga vazifa yaratish'}</h2>
           </div>
           
           <div className="max-w-4xl">
              <div className="mb-6">
                 <label className="text-[12px] font-800 text-red-500 mb-1.5 block">
                    * <span className="text-gray-800">Mavzu</span>
                 </label>
                 <select 
                   value={hwLessonId} 
                   onChange={(e) => setHwLessonId(e.target.value)}
                   className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-800 text-gray-800 outline-none focus:border-[#00b58e] appearance-none bg-transparent"
                 >
                    <option value="" disabled>Mavzulardan birini tanlang</option>
                    {availableLessons.map(l => (
                      <option key={l.id} value={l.id}>{l.title}</option>
                    ))}
                    {availableLessons.length === 0 && <option value="" disabled>Barcha mavzularga uyga vazifa biriktirilgan</option>}
                 </select>
              </div>
              
              <div className="mb-6">
                 <label className="text-[12px] font-800 text-red-500 mb-1.5 block">
                    * <span className="text-gray-800">Izoh</span>
                 </label>
                 <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="flex flex-wrap items-center gap-4 p-3 border-b border-gray-200 bg-gray-50 text-gray-600">
                       <span className="font-bold text-xs cursor-pointer hover:text-gray-800">H1</span>
                       <span className="font-bold text-xs cursor-pointer hover:text-gray-800">H2</span>
                       <span className="text-xs cursor-pointer hover:text-gray-800 flex items-center gap-1">Sans Serif <ChevronRight size={12} className="rotate-90"/></span>
                       <span className="text-xs cursor-pointer hover:text-gray-800 flex items-center gap-1">Normal <ChevronRight size={12} className="rotate-90"/></span>
                       <span className="font-bold cursor-pointer hover:text-gray-800 ml-4">B</span>
                       <span className="italic cursor-pointer hover:text-gray-800 font-serif">I</span>
                       <span className="underline cursor-pointer hover:text-gray-800">U</span>
                       <span className="line-through cursor-pointer hover:text-gray-800">S</span>
                       <span className="cursor-pointer hover:text-gray-800 font-serif">❞</span>
                       <span className="cursor-pointer hover:text-gray-800 text-xs font-mono">&lt;/&gt;</span>
                    </div>
                    <textarea 
                      value={hwTitle}
                      onChange={(e) => setHwTitle(e.target.value)}
                      className="w-full h-32 p-4 outline-none text-sm font-800 text-gray-800 resize-none bg-white placeholder-gray-400" 
                      placeholder="Vazifa tafsilotlarini yozing..."
                    ></textarea>
                 </div>
              </div>
  
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={(e) => setHwFile(e.target.files[0])} 
                className="hidden" 
              />
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="mb-8 border border-dashed border-gray-200 rounded-xl p-4 py-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors text-gray-400"
              >
                  <div className="flex flex-col items-center gap-2">
                     <Upload size={24} className={hwFile ? 'text-[#00b58e]' : ''} />
                     <span className={`text-[13px] font-800 ${hwFile ? 'text-[#00b58e]' : ''}`}>
                       {hwFile ? hwFile.name : 'Faylni tanlash yoki yuklash'}
                     </span>
                  </div>
              </div>
  
              <div className="flex items-center justify-center gap-4 border-t border-gray-100 mt-6 pt-6 -mx-8 px-8">
                 <button onClick={closeForm} disabled={hwSaving} className="px-8 py-2.5 border border-gray-200 text-gray-600 text-[13px] font-900 rounded-xl hover:bg-gray-50 transition-all bg-white disabled:opacity-50">Bekor qilish</button>
                 <button onClick={handleCreateHW} disabled={hwSaving} className="px-8 py-2.5 bg-[#00b58e] text-white text-[13px] font-900 rounded-xl hover:bg-emerald-600 transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50">
                    {hwSaving ? "Saqlanmoqda..." : (editingHWId ? "Saqlash" : "E'lon qilish")}
                 </button>
              </div>
           </div>
        </div>
     );
  }

  if (selectedHW) {
    const l = lessons.find(lx => lx.id === selectedHW.lessonId);
    return (
        <div className="bg-white rounded-2xl w-full border border-gray-100 shadow-sm overflow-hidden mt-6 p-6">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-6">
             <button onClick={() => setSelectedHW(null)} className="text-gray-400 hover:text-gray-800 transition-colors">
                <ChevronLeft size={20}/>
             </button>
             <h3 className="text-xl font-900 text-gray-800">{l?.title || 'Uyga vazifa'}</h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-6 pb-6 border-b border-gray-100">
             <div>
                <p className="text-[12px] font-800 text-gray-400 mb-1">Mavzu</p>
                <p className="text-[14px] font-900 text-gray-800">{l?.title}</p>
             </div>
             <div>
                <p className="text-[12px] font-800 text-gray-400 mb-1">Berilgan vaqt</p>
                <p className="text-[14px] font-900 text-gray-800">
                   {dayjs(selectedHW.created_at).format('DD MMM, YYYY HH:mm')}
                </p>
             </div>
             <div>
                <p className="text-[12px] font-800 text-gray-400 mb-1">Tugash vaqti</p>
                <p className="text-[14px] font-900 text-gray-800">
                   {dayjs(selectedHW.created_at).add(selectedHW.durationTime || 12, 'hour').format('DD MMM, YYYY HH:mm')}
                </p>
             </div>
             {selectedHW.file && (
                <div>
                  <p className="text-[12px] font-800 text-gray-400 mb-1">Biriktirilgan fayl</p>
                  <a 
                    href={selectedHW.file.startsWith('http') ? selectedHW.file : `http://localhost:4000/uploads/${selectedHW.file.split('/').pop()}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-[#00b58e] text-[13px] font-900 rounded-lg hover:bg-emerald-100 transition-colors"
                  >
                     Hujjatni ochish
                  </a>
                </div>
             )}
          </div>
          
          <div className="mb-8">
             <p className="text-[12px] font-800 text-gray-400 mb-2">Ustoz izohi</p>
             <div className="bg-gray-50 p-4 rounded-xl text-[14px] font-800 text-gray-700 whitespace-pre-wrap leading-relaxed">
                {selectedHW.title}
             </div>
          </div>

          <div className="flex gap-8 border-b border-gray-100 mb-6 px-4">
           {[
             { id: 'Kutayotganlar', key: 'PENDING', badgeColor: 'bg-yellow-400' },
             { id: 'Qaytarilganlar', key: 'RETURNED' },
             { id: 'Qabul qilinganlar', key: 'CHECKED' },
             { id: 'Bajarilmagan', key: 'NOT_SUBMITTED', badgeColor: 'bg-yellow-400' }
           ].map(t => {
             const count = hwStatuses?.grouped?.[t.key]?.length || 0;
             return (
               <button key={t.id} onClick={() => setHwTab(t.id)}
                 className={`pb-3 text-sm font-900 transition-all flex items-center gap-2 ${hwTab === t.id ? 'text-[#00b58e] border-b-[3px] border-[#00b58e]' : 'text-gray-400 hover:text-gray-600'}`}>
                 {t.id}
                 {count > 0 && <span className={`w-[22px] h-[22px] flex items-center justify-center rounded-full text-[10px] text-white ${t.badgeColor || 'bg-gray-400'}`}>{count}</span>}
               </button>
             );
           })}
          </div>

          {hwTab === 'Kutayotganlar' ? (
             <table className="w-full text-left table-fixed">
                <thead>
                  <tr className="border-b border-gray-100">
                     <th className="px-4 py-3 text-xs font-900 text-gray-500 w-[24%]">O'quvchi ismi</th>
                     <th className="px-4 py-3 text-xs font-900 text-gray-500 w-[22%]">Uyga vazifa jo'natilgan vaqt</th>
                     <th className="px-4 py-3 text-xs font-900 text-gray-500 w-[28%]">Izoh / Fayl</th>
                     <th className="px-4 py-3 text-xs font-900 text-gray-500 w-[14%]">Holat</th>
                     <th className="px-4 py-3 text-xs font-900 text-gray-500 w-[12%] text-right">Amal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                   {!hwStatuses ? (
                     <tr><td colSpan={5} className="py-12 text-center text-gray-400 font-800">Yuklanmoqda...</td></tr>
                   ) : hwStatuses?.grouped?.PENDING?.map((s, idx) => (
                     <tr key={idx} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-4 text-[13px] font-800 text-gray-800 truncate">{s.student?.fullName}</td>
                        <td className="px-4 py-4 text-[13px] font-800 text-gray-600">
                           {s.response?.created_at ? dayjs(s.response.created_at).format('DD MMM, YYYY HH:mm') : '-'}
                        </td>
                        <td className="px-4 py-4 text-[13px] font-800 text-gray-700">
                          <div className="space-y-1">
                            <p className="truncate">{s.response?.title || '-'}</p>
                            {s.response?.file && (
                              <a
                                href={getFileUrl(s.response.file)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#00b58e] hover:underline"
                              >
                                Faylni ochish
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-[12px] font-900 text-yellow-600">KUTMOQDA</td>
                        <td className="px-4 py-4 text-right">
                          <button
                            onClick={() => openGrading(s)}
                            className="px-3 py-2 rounded-lg bg-[#00b58e] text-white text-[11px] font-900 hover:bg-emerald-600 transition-colors"
                          >
                            Ball qo'yish
                          </button>
                        </td>
                     </tr>
                   ))}
                   {hwStatuses && (!hwStatuses?.grouped?.PENDING || hwStatuses.grouped.PENDING.length === 0) && (
                      <tr><td colSpan={5} className="py-12 text-center text-gray-400 font-800">Kutayotgan vazifalar yo'q</td></tr>
                   )}
                </tbody>
             </table>
          ) : hwTab === 'Qaytarilganlar' ? (
             <table className="w-full text-left table-fixed">
                <thead>
                  <tr className="border-b border-gray-100">
                     <th className="px-4 py-3 text-xs font-900 text-gray-500 w-[24%]">O'quvchi ismi</th>
                     <th className="px-4 py-3 text-xs font-900 text-gray-500 w-[22%]">So'nggi topshirish</th>
                     <th className="px-4 py-3 text-xs font-900 text-gray-500 w-[26%]">Izoh / Fayl</th>
                     <th className="px-4 py-3 text-xs font-900 text-gray-500 w-[12%]">Oldingi ball</th>
                     <th className="px-4 py-3 text-xs font-900 text-gray-500 w-[16%] text-right">Amal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                   {!hwStatuses ? (
                     <tr><td colSpan={5} className="py-12 text-center text-gray-400 font-800">Yuklanmoqda...</td></tr>
                   ) : hwStatuses?.grouped?.RETURNED?.map((s, idx) => (
                     <tr key={idx} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-4 text-[13px] font-800 text-gray-800 truncate">{s.student?.fullName}</td>
                        <td className="px-4 py-4 text-[13px] font-800 text-gray-600">
                           {s.response?.created_at ? dayjs(s.response.created_at).format('DD MMM, YYYY HH:mm') : '-'}
                        </td>
                        <td className="px-4 py-4 text-[13px] font-800 text-gray-700">
                          <div className="space-y-1">
                            <p className="truncate">{s.response?.title || '-'}</p>
                            {s.response?.file && (
                              <a
                                href={getFileUrl(s.response.file)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#00b58e] hover:underline"
                              >
                                Faylni ochish
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-[13px] font-900 text-red-600">
                          {s.result?.score !== undefined ? s.result.score : '-'}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <button
                            onClick={() => openGrading(s)}
                            className="px-3 py-2 rounded-lg bg-[#00b58e] text-white text-[11px] font-900 hover:bg-emerald-600 transition-colors"
                          >
                            Qayta baholash
                          </button>
                        </td>
                     </tr>
                   ))}
                   {hwStatuses && (!hwStatuses?.grouped?.RETURNED || hwStatuses.grouped.RETURNED.length === 0) && (
                      <tr><td colSpan={5} className="py-12 text-center text-gray-400 font-800">Qaytarilgan vazifalar yo'q</td></tr>
                   )}
                </tbody>
             </table>
          ) : hwTab === 'Qabul qilinganlar' ? (
             <table className="w-full text-left table-fixed">
                <thead>
                  <tr className="border-b border-gray-100">
                     <th className="px-4 py-3 text-xs font-900 text-gray-500 w-[26%]">O'quvchi ismi</th>
                     <th className="px-4 py-3 text-xs font-900 text-gray-500 w-[22%]">Baholangan vaqt</th>
                     <th className="px-4 py-3 text-xs font-900 text-gray-500 w-[12%]">Ball</th>
                     <th className="px-4 py-3 text-xs font-900 text-gray-500 w-[12%]">XP / Coin</th>
                     <th className="px-4 py-3 text-xs font-900 text-gray-500 w-[28%]">Ustoz izohi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                   {!hwStatuses ? (
                     <tr><td colSpan={5} className="py-12 text-center text-gray-400 font-800">Yuklanmoqda...</td></tr>
                   ) : hwStatuses?.grouped?.CHECKED?.map((s, idx) => (
                     <tr key={idx} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-4 text-[13px] font-800 text-gray-800 truncate">{s.student?.fullName}</td>
                        <td className="px-4 py-4 text-[13px] font-800 text-gray-600">
                           {s.result?.created_at ? dayjs(s.result.created_at).format('DD MMM, YYYY HH:mm') : '-'}
                        </td>
                        <td className="px-4 py-4 text-[13px] font-900 text-[#00b58e]">
                          {s.result?.score !== undefined ? s.result.score : '-'}
                        </td>
                        <td className="px-4 py-4 text-[13px] font-800 text-gray-700">
                          {(s.result?.xp ?? 0)} / {(s.result?.coin ?? 0)}
                        </td>
                        <td className="px-4 py-4 text-[13px] font-800 text-gray-700 truncate">
                          {s.result?.title || '-'}
                        </td>
                     </tr>
                   ))}
                   {hwStatuses && (!hwStatuses?.grouped?.CHECKED || hwStatuses.grouped.CHECKED.length === 0) && (
                      <tr><td colSpan={5} className="py-12 text-center text-gray-400 font-800">Qabul qilingan vazifalar yo'q</td></tr>
                   )}
                </tbody>
             </table>
          ) : hwTab === 'Bajarilmagan' ? (
             <table className="w-full text-left table-fixed">
                <thead>
                  <tr className="border-b border-gray-100">
                     <th className="px-4 py-3 text-xs font-900 text-gray-500 w-1/2">O'quvchi ismi</th>
                     <th className="px-4 py-3 text-xs font-900 text-gray-500 w-1/2">Holat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                   {!hwStatuses ? (
                     <tr><td colSpan={2} className="py-12 text-center text-gray-400 font-800">Yuklanmoqda...</td></tr>
                   ) : hwStatuses?.grouped?.NOT_SUBMITTED?.map((s, idx) => (
                     <tr key={idx} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-4 text-[13px] font-800 text-gray-800 truncate">{s.student?.fullName}</td>
                        <td className="px-4 py-4 text-[13px] font-800 text-gray-400">Topshirmagan</td>
                     </tr>
                   ))}
                   {hwStatuses && (!hwStatuses?.grouped?.NOT_SUBMITTED || hwStatuses.grouped.NOT_SUBMITTED.length === 0) && (
                      <tr><td colSpan={2} className="py-12 text-center text-gray-400 font-800">Bajarilmaganlar yo'q</td></tr>
                   )}
                </tbody>
             </table>
          ) : (
             <div className="py-20 flex flex-col items-center justify-center text-gray-400">
                <img src="https://i.ibb.co/30Zc9f2/empty-state.png" alt="Empty" className="w-32 h-32 mb-4 opacity-50 grayscale" />
                <p className="text-sm font-800">Ma'lumot topilmadi</p>
             </div>
          )}

          <Drawer open={!!grading} onClose={closeGrading} title="Vazifani baholash">
             <div className="space-y-6">
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
                   <Avatar name={grading?.student?.fullName || `Talaba ${grading?.studentId}`} size="md" />
                   <div>
                     <p className="font-900 text-gray-800 uppercase tracking-tight">
                       {grading?.student?.fullName || `Talaba #${grading?.studentId}`}
                     </p>
                   </div>
                </div>
                <Field label="Ball (0-100)" required><Input type="number" value={score} onChange={e=>setScore(e.target.value)} placeholder="85"/></Field>
                
                <Field label="Izoh"><Input value={comment} onChange={e=>setComment(e.target.value)} placeholder="Yaxshi natija!"/></Field>
                <button onClick={handleGrade} className="btn-primary w-full justify-center h-12 text-[12px] font-900 uppercase tracking-widest shadow-xl shadow-[#00b58e]/20 bg-[#00b58e] text-white rounded-xl">Tasdiqlash va yuborish</button>
             </div>
          </Drawer>
        </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl w-full border border-gray-100 shadow-sm overflow-hidden mt-6">
      <div className="w-full flex justify-end p-4 border-b border-gray-100 bg-white">
         <button onClick={() => setCreatingHW(true)} className="px-4 py-2 bg-[#00b58e] text-white text-[13px] font-900 rounded-xl hover:bg-emerald-600 transition-all shadow-md shadow-emerald-500/20">
            Uyga vazifa qo'shish
         </button>
      </div>
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-gray-100 bg-white">
            <th className="px-6 py-4 text-[13px] font-900 text-gray-800 w-12">#</th>
            <th className="px-6 py-4 text-[13px] font-900 text-gray-800">Mavzu</th>
            <th className="px-4 py-4 text-center text-gray-400 w-16" title="Jami o'quvchilar"><Users size={16} className="mx-auto"/></th>
            <th className="px-4 py-4 text-center text-orange-400 w-16" title="Kutayotganlar (topshirgan)"><Clock size={16} className="mx-auto"/></th>
            <th className="px-4 py-4 text-center text-[#00b58e] w-16" title="Qabul qilinganlar (tekshirilgan)"><CheckCircle size={16} className="mx-auto"/></th>
            <th className="px-6 py-4 text-[13px] font-900 text-gray-800 w-36">Berilgan vaqt</th>
            <th className="px-6 py-4 text-[13px] font-900 text-gray-800 w-36">Tugash vaqti</th>
            <th className="px-6 py-4 text-[13px] font-900 text-gray-800 w-36">Dars sanasi</th>
            <th className="px-4 py-4 w-12"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 bg-white">
          {lessons.map((l, i) => {
             const hw = allHWs.find(h => h.lessonId === l.id);
             
             // Hisoblashlar
             const total = studentsCount;
             const submitted = hw?._count?.homeworkResponse || 0;
             const checked = hw?._count?.homeworkResult || 0;
             const pending = Math.max(0, submitted - checked);

             return (
               <tr key={l.id} 
                   onClick={() => hw ? loadResponses(hw) : null}
                   className={`transition-colors ${hw ? 'hover:bg-gray-50 cursor-pointer' : ''}`}>
                 <td className="px-6 py-4 text-[13px] font-800 text-gray-800">{i + 1}</td>
                 <td className="px-6 py-4 text-[13px] font-800 text-gray-800 truncate max-w-xs">{l.title}</td>
                 <td className="px-4 py-4 text-[13px] font-800 text-gray-800 text-center">{hw ? total : '-'}</td>
                 <td className="px-4 py-4 text-[13px] font-800 text-gray-800 text-center">{hw ? pending : '-'}</td>
                 <td className="px-4 py-4 text-[13px] font-800 text-gray-800 text-center">{hw ? checked : '-'}</td>
                 <td className="px-6 py-4 text-[12px] font-800 text-gray-600 whitespace-pre-line leading-tight">
                    {hw ? dayjs(hw.created_at).format('DD MMM, YYYY\nHH:mm') : '—'}
                 </td>
                 <td className="px-6 py-4 text-[12px] font-800 text-gray-600 whitespace-pre-line leading-tight">
                    {hw ? dayjs(hw.created_at).add(hw.durationTime || 12, 'hour').format('DD MMM, YYYY\nHH:mm') : '—'}
                 </td>
                 <td className="px-6 py-4 text-[13px] font-800 text-gray-800">
                    {dayjs(l.date).format('DD MMM, YYYY')}
                 </td>
                 <td className="px-4 py-4 text-right">
                    {hw ? (
                      <button onClick={(e) => openEdit(hw, e)} className="text-gray-400 hover:text-[#00b58e] p-2 rounded-lg hover:bg-emerald-50 transition-all">
                         <Edit2 size={16}/>
                      </button>
                    ) : (
                      <button className="text-gray-200 cursor-not-allowed p-2 rounded-lg transition-all">
                         <MoreVertical size={16}/>
                      </button>
                    )}
                 </td>
               </tr>
             );
          })}
          {lessons.length === 0 && !loading && <tr><td colSpan={9} className="py-20"><Empty text="Darslar topilmadi"/></td></tr>}
        </tbody>
      </table>
    </div>
  );
}

