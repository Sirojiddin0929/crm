import React, { useEffect, useState, useRef } from 'react';
import { 
  Users, BookOpen, Clock, ChevronRight, ChevronLeft, 
  Plus, Trash2, Edit2, PlayCircle, CheckCircle, 
  FileVideo, Calendar as CalIcon, Filter, Search,
  Star, Award, Zap, Coins, MoreVertical, Upload, X, ArrowLeft
} from 'lucide-react';
import { PageHeader, Avatar, Empty, TabBar, Drawer, Field, Input, Select, StatusBadge, Toggle } from '../../components/UI';
import { useTeacherAuth } from '../../context/TeacherAuthContext';
import { groupsAPI, lessonsAPI, attendanceAPI, lessonVideosAPI, homeworkAPI, homeworkResponsesAPI, homeworkResultsAPI, studentsAPI } from '../../services/api';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

const DAYS_UZ = { MONDAY: 'Du', TUESDAY: 'Se', WEDNESDAY: 'Ch', THURSDAY: 'Pa', FRIDAY: 'Ju', SATURDAY: 'Sh', SUNDAY: 'Ya' };

export default function TeacherGroups() {
  const { user } = useTeacherAuth();
  const [groups, setGroups] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);

  // Main Tabs: Ma'lumotlar, Guruh darsliklari, Akademik davomat
  const [mainTab, setMainTab] = useState("Guruh darsliklari");
  // Sub Tabs: Guruh darsliklari, Uyga vazifa, Videolar, Imtihonlar, Jurnal
  const [subTab, setSubTab] = useState("Jurnal");

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    groupsAPI.getAll({ teacherId: user.id })
      .then(r => setGroups(r.data || []))
      .finally(() => setLoading(false));
  }, [user]);

  if (selected) {
    return (
      <div className="fade-in max-w-[1600px] mx-auto pb-10">
        {/* Breadcrumb / Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
             <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-800 transition-colors">
               <ChevronLeft size={20}/>
             </button>
             <h1 className="text-xl font-900 text-gray-800">{selected.name}</h1>
             <span className="px-2 py-0.5 bg-emerald-50 text-[#00b58e] text-[10px] font-900 rounded uppercase">Aktiv</span>
          </div>
          
        </div>

        {/* Main Tabs Navigation */}
        <div className="flex gap-6 border-b border-gray-100 mb-6">
           {["Ma'lumotlar", "Guruh darsliklari"].map(t => (
             <button key={t} onClick={() => setMainTab(t)}
               className={`pb-3 text-sm font-900 transition-all ${mainTab === t ? 'text-[#00b58e] border-b-2 border-[#00b58e]' : 'text-gray-400 hover:text-gray-600'}`}>
               {t}
             </button>
           ))}
        </div>

        {mainTab === "Guruh darsliklari" && (
          <div className="space-y-6">
             <div className="flex gap-2">
                {["Guruh darsliklari", "Uyga vazifa", "Videolar", "Jurnal"].map(t => (
                  <button key={t} onClick={() => setSubTab(t)}
                    className={`px-4 py-2 rounded-xl text-[13px] font-900 transition-all ${subTab === t ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
                    {t}
                  </button>
                ))}
             </div>

             {/* Dynamic Sub-sections */}
             <div className="animate-in fade-in duration-300">
                {subTab === "Jurnal" && <JournalView group={selected} teacher={user} />}
                {subTab === "Guruh darsliklari" && <LessonsView group={selected} teacher={user} />}
                {subTab === "Uyga vazifa" && <HomeworkView group={selected} teacher={user} />}
                {subTab === "Videolar" && <VideosView group={selected} teacher={user} />}
             </div>
          </div>
        )}

        {mainTab === "Ma'lumotlar" && (
           <div className="card p-8 bg-white">
              <h3 className="text-lg font-900 text-gray-800 uppercase tracking-tight mb-6">Guruh ma'lumotlari</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 {[
                   { l: 'O\'qituvchi', v: user?.fullName, i: <Users size={16}/> },
                   { l: 'Kurs nomi', v: selected.course?.name || '-', i: <BookOpen size={16}/> },
                   { l: 'Kurs narxi', v: selected.course?.price ? new Intl.NumberFormat('uz-UZ').format(selected.course.price) + ' so\'m' : '-', i: <Zap size={16}/> },
                   { l: 'Davomiyligi (oy)', v: selected.course?.durationMonth ? `${selected.course.durationMonth} oy` : '-', i: <Clock size={16}/> },
                   { l: 'Davomiyligi (soat)', v: selected.course?.durationLesson ? `${selected.course.durationLesson} soat/dars` : '-', i: <Clock size={16}/> },
                   { l: 'Xona nomi', v: selected.room?.name || '-', i: <Zap size={16}/> },
                   { l: 'Dars boshlanish vaqti', v: selected.startTime, i: <Clock size={16}/> },
                   { l: 'Kunlar', v: selected.weekDays?.map(d => DAYS_UZ[d]).join(', '), i: <CalIcon size={16}/> },
                 ].map((item, idx) => (
                   <div key={idx} className="p-4 bg-gray-50 rounded-2xl border border-gray-100/50 text-gray-800">
                      <p className="text-[10px] font-900 text-gray-400 uppercase tracking-widest mb-1">{item.l}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-500">{item.i}</span>
                        <p className="font-800 text-gray-800 text-[13px]">{item.v || '—'}</p>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        )}
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-900 text-gray-800 uppercase tracking-tight">Mening guruhlarim</h1>
          <p className="text-sm text-gray-400 font-600 mt-0.5">O'zingiz dars o'tadigan barcha faol guruhlar</p>
        </div>
        
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
           {[1,2,3].map(i => <div key={i} className="h-48 bg-white rounded-3xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {groups.map(g => (
            <div key={g.id} onClick={() => setSelected(g)}
              className="group bg-white rounded-[32px] p-6 cursor-pointer border border-transparent hover:border-emerald-500/20 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                 <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                    <Users size={24}/>
                 </div>
                 <div className="px-3 py-1 bg-gray-50 text-gray-400 text-[10px] font-900 rounded-lg uppercase tracking-widest group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-all">Active</div>
              </div>
              <h3 className="text-lg font-900 text-gray-800 uppercase tracking-tight mb-2 group-hover:text-emerald-500 transition-colors">{g.name}</h3>
              <div className="space-y-2.5">
                 <div className="flex items-center gap-2 text-xs font-700 text-gray-400">
                    <Clock size={14} className="text-gray-300"/>
                    <span>{g.startTime} · {g.weekDays?.map(d => DAYS_UZ[d]).join(', ')}</span>
                 </div>
                 <div className="flex items-center gap-2 text-xs font-700 text-gray-400">
                    <CalIcon size={14} className="text-gray-300"/>
                    <span>{dayjs(g.startDate).format('DD MMM, YYYY')} boshlangan</span>
                 </div>
              </div>
              <div className="mt-6 pt-6 border-t border-gray-50 flex items-center justify-between">
                 <p className="text-[10px] font-900 text-gray-400 uppercase tracking-widest">{g.course?.name || '-'}</p>
                 <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                    <ChevronRight size={16}/>
                 </div>
              </div>
            </div>
          ))}
          {groups.length === 0 && <div className="col-span-4"><Empty text="Guruhlar topilmadi"/></div>}
        </div>
      )}
    </div>
  );
}

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────

function JournalView({ group, teacher }) {
  const [students, setStudents] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [saving, setSaving] = useState(false);
  const [topic, setTopic] = useState('');

  const courseDays = React.useMemo(() => {
    if (!group.startDate) return [];
    const start = dayjs(group.startDate);
    // Agar group.endDate bo'lsa uni ishlatamiz, yo'qsa default qilib 6 oy hisoblaymiz (foydalanuvchi misoliga asosan)
    const end = group.endDate ? dayjs(group.endDate) : start.add(6, 'month').endOf('day');
    
    const days = [];
    const weekDaysMap = { MONDAY: 1, TUESDAY: 2, WEDNESDAY: 3, THURSDAY: 4, FRIDAY: 5, SATURDAY: 6, SUNDAY: 0 };
    const allowed = (group.weekDays || []).map(w => weekDaysMap[w]);
    
    let curr = start;
    while (curr.isBefore(end)) {
      if (allowed.includes(curr.day())) days.push(curr);
      curr = curr.add(1, 'day');
    }
    return days;
  }, [group.startDate, group.endDate, group.weekDays]);

  const [selectedDay, setSelectedDay] = useState(dayjs());
  const [visibleMonth, setVisibleMonth] = useState(dayjs().startOf('month'));

  useEffect(() => {
    if (courseDays.length > 0) {
      const exactMatch = courseDays.find(d => d.isSame(dayjs(), 'day'));
      if (exactMatch) {
        setSelectedDay(exactMatch);
        setVisibleMonth(exactMatch.startOf('month'));
      } else {
        const pastDays = courseDays.filter(d => d.isBefore(dayjs(), 'day'));
        const chosen = pastDays.length > 0 ? pastDays[pastDays.length - 1] : courseDays[0];
        setSelectedDay(chosen);
        setVisibleMonth(chosen.startOf('month'));
      }
    }
  }, [courseDays]);

  const displayedDays = React.useMemo(() => {
    return courseDays.filter(d => d.isSame(visibleMonth, 'month'));
  }, [courseDays, visibleMonth]);

  const UZ_DAYS = ['Yak', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh'];
  const UZ_MONTHS = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];

  useEffect(() => {
    groupsAPI.getStudents(group.id).then(r => {
      const studentList = (r.data || []).map(item => typeof item.student === 'object' ? item.student : item);
      setStudents(studentList);
    });
    lessonsAPI.getAll({ groupId: group.id }).then(r => setLessons(r.data || []));
  }, [group.id]);

  const currentLesson = lessons.find(l => dayjs(l.date).isSame(selectedDay, 'day'));

  useEffect(() => {
    if (currentLesson) {
      attendanceAPI.getByLesson(currentLesson.id).then(r => {
        const map = {};
        students.forEach(s => map[s.id] = false);
        (r.data || []).forEach(a => map[a.studentId] = a.isPresent);
        setAttendance(map);
        setTopic(currentLesson.title);
      });
    } else {
      setAttendance({});
      setTopic('');
    }
  }, [currentLesson, students]);

  const saveBatch = async () => {
    if (!currentLesson && !topic) { toast.error('Mavzu kiritilmasa saqlab bo\'lmaydi'); return; }
    setSaving(true);
    try {
      let lId = currentLesson?.id;
      if (!lId) {
        const nr = await lessonsAPI.create({ groupId: group.id, title: topic, date: selectedDay.toISOString(), teacherId: teacher.id });
        lId = nr.data.lesson.id;
      } else if (topic !== currentLesson.title) {
        await lessonsAPI.update(lId, { title: topic });
      }
      
      const records = students.map(s => ({ lessonId: lId, studentId: s.id, isPresent: !!attendance[s.id], teacherId: teacher.id }));
      await attendanceAPI.bulkCreate({ records });
      toast.success('Davomat saqlandi!');
    } catch { toast.error('Xatolik yuz berdi'); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      {/* Calendar Section */}
      <div className="w-full">
         <div className="flex items-center justify-between mb-3">
           <div className="flex items-center gap-3">
             <button onClick={() => setVisibleMonth(prev => prev.subtract(1, 'month'))} className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-800 transition-colors">
               <ChevronLeft size={16}/>
             </button>
             <p className="text-sm font-900 text-gray-800 w-32 text-center capitalize">
               {UZ_MONTHS[visibleMonth.month()]} {visibleMonth.year()}
             </p>
             <button onClick={() => setVisibleMonth(prev => prev.add(1, 'month'))} className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-800 transition-colors">
               <ChevronRight size={16}/>
             </button>
           </div>
           <p className="text-xs font-800 text-gray-400 bg-gray-50 px-3 py-1.5 rounded-lg">Jami darslar: <span className="text-[#00b58e] text-sm font-900">{courseDays.length} ta</span></p>
         </div>

         <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
           {displayedDays.map(d => {
             const isSelected = d.isSame(selectedDay, 'day');
             const isPast = d.isBefore(dayjs(), 'day');
             const isFuture = d.isAfter(dayjs(), 'day');
             return (
               <button key={d.toString()} onClick={() => !isFuture && setSelectedDay(d)}
                 disabled={isFuture}
                 className={`flex-shrink-0 w-14 h-14 rounded-[14px] flex flex-col items-center justify-center transition-all duration-200 border ${isSelected ? 'bg-[#00b58e] text-white border-[#00b58e] shadow-md shadow-emerald-500/20 scale-105' : isFuture ? 'bg-gray-50/50 text-gray-300 border-transparent cursor-not-allowed opacity-50' : isPast ? 'bg-gray-50 text-gray-500 hover:bg-gray-100 border-transparent' : 'bg-white text-gray-500 hover:bg-gray-50 border-gray-100 shadow-sm'}`}>
                 <span className={`text-[10px] font-900 ${isSelected ? 'text-white/80' : isFuture ? 'text-gray-300' : 'text-gray-400'}`}>{UZ_DAYS[d.day()]}</span>
                 <span className={`text-[17px] leading-tight font-900 mt-0.5 ${isSelected ? 'text-white' : isFuture ? 'text-gray-300' : 'text-gray-800'}`}>{d.format('DD')}</span>
               </button>
             );
           })}
           {displayedDays.length === 0 && (
             <div className="w-full py-4 text-center text-sm font-800 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
               Bu oy uchun dars kunlari mavjud emas
             </div>
           )}
         </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-100">
         <button className="pb-2 text-sm font-800 text-[#00b58e] border-b-[3px] border-[#00b58e]">Teacher</button>
      </div>

      {/* Ma'lumot Card */}
      <div className="p-6 bg-gray-50 rounded-2xl w-full max-w-sm">
         <p className="text-sm font-800 text-gray-800 mb-4">Ma'lumot</p>
         <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-white overflow-hidden">
               {teacher?.photo ? <img src={teacher.photo.startsWith('http') ? teacher.photo : `http://localhost:4000/uploads/${teacher.photo.split('/').pop()}`} alt="" className="w-full h-full object-cover" /> : <Users size={24}/>}
            </div>
            <div>
               <p className="text-sm font-900 text-gray-800">{teacher.fullName}</p>
               <p className="text-[11px] font-800 text-gray-500 mt-0.5">Teacher</p>
            </div>
         </div>
         <div className="flex flex-wrap gap-x-8 gap-y-4">
            <div><p className="text-[10px] font-800 text-gray-400 mb-1">Dars kuni</p><p className="text-xs font-900 text-gray-800">{selectedDay.format('DD MMMM, YYYY')}</p></div>
            <div>
               <p className="text-[10px] font-800 text-gray-400 mb-1">Dars vaqti</p>
               <p className="text-xs font-900 text-gray-800">
                  {group.startTime} - {group.course?.durationLesson ? (() => { let [h,m] = group.startTime.split(':').map(Number); h = (h + Number(group.course.durationLesson)) % 24; return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`})() : "..."}
               </p>
            </div>
            <div><p className="text-[10px] font-800 text-gray-400 mb-1">Xona</p><p className="text-xs font-900 text-gray-800">{group.room?.name || '-'}</p></div>
         </div>
      </div>

      {/* Main Content */}
      <div className="pt-2">
         <h2 className="text-base font-900 text-gray-800 mb-6">{group.name} {dayjs(group.startDate).format('DD.MM.YYYY')}</h2>
         <h3 className="text-lg font-900 text-gray-800 mb-4">Yo'qlama va mavzu kiritish</h3>
         
         

         <div className="mb-8 w-full max-w-sm relative">
             <label className="text-[11px] font-800 text-red-500 mb-1.5 block">
                * <span className="text-gray-800">Mavzu</span>
             </label>
             <input value={topic} onChange={e => !currentLesson && setTopic(e.target.value)} disabled={!!currentLesson}
                 className="w-full px-4 py-2.5 rounded-xl bg-gray-100 border border-transparent outline-none focus:bg-white focus:border-[#00b58e] text-sm font-800 text-gray-600 disabled:opacity-60 placeholder-gray-400" 
                 placeholder="exam continue" />
             {!!currentLesson && (
                 <p className="text-[10px] font-800 text-gray-400 mt-2 absolute -bottom-5">Bu kundagi davomat va mavzu saqlangan.</p>
             )}
         </div>

         <div className="w-full overflow-hidden mt-6">
             <div className="flex items-center text-[11px] font-900 text-gray-500 px-4 mb-3">
                <span className="w-8">#</span>
                <span className="flex-1">O'quvchi ismi</span>
                <span className="w-24 text-center">Vaqti</span>
                <span className="w-20 text-center">Keldi</span>
             </div>
             <div className="space-y-1">
               {students.map((s, i) => (
                  <div key={s.id} className="flex items-center px-4 py-2 hover:bg-gray-50 transition-colors">
                     <span className="w-8 text-xs font-900 text-gray-800">{i + 1}</span>
                     <div className="flex-1 text-sm font-800 text-gray-800 truncate pr-4">{s.fullName}</div>
                     <div className="w-24 text-center text-[13px] font-900 text-gray-800">{group.startTime}</div>
                     <div className="w-20 flex justify-center">
                        <Toggle value={attendance[s.id]} onChange={() => !currentLesson && setAttendance(prev => ({ ...prev, [s.id]: !prev[s.id] }))} disabled={!!currentLesson}/>
                     </div>
                  </div>
               ))}
               {students.length === 0 && <div className="py-6"><Empty text="Guruhda talabalar topilmadi" /></div>}
             </div>
         </div>
         
         {!currentLesson && students.length > 0 && (
           <div className="mt-8">
              <button onClick={saveBatch} disabled={saving} className="px-8 py-3 bg-[#00b58e] text-white text-xs font-900 uppercase tracking-widest rounded-xl hover:bg-emerald-600 transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50">
                 {saving ? 'Saqlanmoqda...' : 'Saqlash'}
              </button>
           </div>
         )}
      </div>
    </div>
  );
}

function LessonsView({ group }) {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    lessonsAPI.getAll({ groupId: group.id })
      .then(r => setLessons(r.data || []))
      .finally(() => setLoading(false));
  }, [group.id]);

  return (
    <div className="bg-white rounded-2xl w-full border border-gray-100 shadow-sm overflow-hidden mt-6">
      <div className="p-6 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
         <div>
            <h3 className="text-lg font-900 text-gray-800">Guruh darsliklari</h3>
            <p className="text-[13px] font-800 text-gray-400 mt-1">O'quv markaz tomonidan belgilangan o'quv dasturi</p>
         </div>
         <div className="w-12 h-12 rounded-[14px] bg-emerald-100 text-[#00b58e] flex items-center justify-center">
            <BookOpen size={20} />
         </div>
      </div>
      {loading ? (
         <div className="p-8 text-center text-gray-400 font-800 text-sm">Yuklanmoqda...</div>
      ) : (
        <div className="divide-y divide-gray-50">
          {lessons.map((l, i) => (
             <div key={l.id} className="p-5 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                <div className="min-w-[40px] h-[40px] rounded-xl bg-gray-100 text-gray-500 font-900 flex items-center justify-center text-sm">
                   {i + 1}
                </div>
                <div className="flex-1">
                   <h4 className="font-800 text-gray-800 text-[15px]">{l.title}</h4>
                   <p className="font-800 text-gray-400 text-[12px] mt-1">{dayjs(l.date).format('DD MMM, YYYY')}</p>
                </div>
             </div>
          ))}
          {lessons.length === 0 && <div className="py-12"><Empty text="Darsliklar topilmadi" /></div>}
        </div>
      )}
    </div>
  );
}

function HomeworkView({ group, teacher }) {
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
  const [coins, setCoins] = useState('');
  const [comment, setComment] = useState('');

  useEffect(() => {
    setLoading(true);
    lessonsAPI.getAll({ groupId: group.id })
      .then(r => setLessons(r.data || []))
      .finally(() => setLoading(false));

    homeworkAPI.getAll({ teacherId: teacher.id }).then(r => setAllHWs(r.data || []));
    groupsAPI.getStudents(group.id).then(r => setStudentsCount(r.data?.length || 0));
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
      homeworkAPI.getAll({ teacherId: teacher.id }).then(r => setAllHWs(r.data || []));
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
    if (!score || !xp || !coins) { toast.error('Hamma maydonlarni to\'ldiring'); return; }
    try {
      await homeworkResultsAPI.create({ 
        homeworkId: selectedHW.id, 
        studentId: grading.studentId, 
        score: Number(score), 
        xp: Number(xp), 
        coin: Number(coins), 
        title: comment, 
        teacherId: teacher.id,
        status: 'APPROVED'
      });
      await homeworkResponsesAPI.update(grading.id, { status: 'CHECKED' });
      toast.success('Talaba muvaffaqiyatli baholandi!');
      setGrading(null);
      loadResponses(selectedHW); // refresh modal details
    } catch { toast.error('Xatolik'); }
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
                     <th className="px-4 py-3 text-xs font-900 text-gray-500 w-1/2">O'quvchi ismi</th>
                     <th className="px-4 py-3 text-xs font-900 text-gray-500 w-1/2">Uyga vazifa jo'natilgan vaqt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                   {!hwStatuses ? (
                     <tr><td colSpan={2} className="py-12 text-center text-gray-400 font-800">Yuklanmoqda...</td></tr>
                   ) : hwStatuses?.grouped?.PENDING?.map((s, idx) => (
                     <tr key={idx} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-4 text-[13px] font-800 text-gray-800 truncate">{s.student?.fullName}</td>
                        <td className="px-4 py-4 text-[13px] font-800 text-gray-600">
                           {s.response?.created_at ? dayjs(s.response.created_at).format('DD MMM, YYYY HH:mm') : '-'}
                        </td>
                     </tr>
                   ))}
                   {hwStatuses && (!hwStatuses?.grouped?.PENDING || hwStatuses.grouped.PENDING.length === 0) && (
                      <tr><td colSpan={2} className="py-12 text-center text-gray-400 font-800">Kutayotgan vazifalar yo'q</td></tr>
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

          <Drawer open={!!grading} onClose={() => setGrading(null)} title="Vazifani baholash">
             <div className="space-y-6">
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
                   <Avatar name={`Talaba ${grading?.studentId}`} size="md" />
                   <div><p className="font-900 text-gray-800 uppercase tracking-tight">Talaba #{grading?.studentId}</p></div>
                </div>
                <Field label="Ball (0-100)" required><Input type="number" value={score} onChange={e=>setScore(e.target.value)} placeholder="85"/></Field>
                <div className="grid grid-cols-2 gap-4">
                   <Field label="XP ballari" required><div className="relative text-gray-800"><Input type="number" value={xp} onChange={e=>setXp(e.target.value)} placeholder="5"/><Zap size={14} className="absolute right-3 top-3 text-purple-500 fill-purple-100"/></div></Field>
                   <Field label="Kumush (Coins)" required><div className="relative text-gray-800"><Input type="number" value={coins} onChange={e=>setCoins(e.target.value)} placeholder="10"/><Coins size={14} className="absolute right-3 top-3 text-yellow-500 fill-yellow-100"/></div></Field>
                </div>
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

function VideosView({ group, teacher }) {
  const [videos, setVideos] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form states
  const [videoFile, setVideoFile] = useState(null);
  const [videoTitle, setVideoTitle] = useState('');
  const [lessonId, setLessonId] = useState('');
  const [uploading, setUploading] = useState(false);
  const [editingVideoId, setEditingVideoId] = useState(null);
  const fileInputRef = useRef(null);

  // Player state
  const [playingVideo, setPlayingVideo] = useState(null);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      lessonsAPI.getAll({ groupId: group.id }),
      lessonVideosAPI.getAll()
    ]).then(([lRes, vRes]) => {
      const allL = lRes.data || [];
      const allV = vRes.data || [];
      setLessons(allL);
      setVideos(allV.filter(v => allL.some(l => l.id === v.lessonId)));
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [group.id]);

  const openEdit = (v) => {
    setEditingVideoId(v.id);
    setLessonId(v.lessonId);
    setVideoTitle(v.title || '');
    setVideoFile(null);
    setUploadOpen(true);
  }

  const closeForm = () => {
    setUploadOpen(false);
    setVideoFile(null);
    setVideoTitle('');
    setLessonId('');
    setEditingVideoId(null);
  }

  const handleUpload = async () => {
    if (!lessonId) {
      toast.error("Mavzuni tanlash majburiy!");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('lessonId', Number(lessonId));
      if (videoTitle) fd.append('title', videoTitle);
      
      if (editingVideoId) {
         if (videoFile) fd.append('file', videoFile);
         await lessonVideosAPI.update(editingVideoId, fd);
         toast.success("Video muvaffaqiyatli tahrirlandi!");
      } else {
         if (!videoFile) {
            toast.error("Videofaylni qo'shing!");
            setUploading(false);
            return;
         }
         fd.append('title', videoTitle || videoFile.name);
         fd.append('teacherId', teacher.id);
         fd.append('file', videoFile);
         await lessonVideosAPI.create(fd);
         toast.success("Video muvaffaqiyatli yuklandi!");
      }
      
      closeForm();
      loadData();
    } catch {
      toast.error("Video saqlashda xatolik yuz berdi");
    } finally {
      setUploading(false);
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '-';
    const b = Number(bytes);
    if(isNaN(b)) return bytes;
    if (b < 1048576) return (b / 1024).toFixed(2) + ' KB';
    else if (b < 1073741824) return (b / 1048576).toFixed(2) + ' MB';
    else return (b / 1073741824).toFixed(2) + ' GB';
  };

  return (
    <div className="bg-white rounded-2xl w-full border border-gray-100 shadow-sm overflow-hidden mt-6 relative">
       {playingVideo && (
          <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm">
             <button onClick={() => setPlayingVideo(null)} className="absolute top-6 right-6 text-white hover:text-gray-300 transition-colors bg-white/10 p-2 rounded-full backdrop-blur-md">
                <X size={28}/>
             </button>
             <div className="w-full max-w-5xl bg-black rounded-2xl overflow-hidden flex flex-col shadow-2xl border border-white/10 animate-in zoom-in-95 duration-200">
                <video 
                   controls 
                   autoPlay
                   src={playingVideo.file?.startsWith('http') ? playingVideo.file : `http://localhost:4000/uploads/${playingVideo.file?.split('/').pop()}`}
                   className="w-full h-auto max-h-[80vh] outline-none"
                />
                <div className="p-5 bg-gray-900 border-t border-white/10 flex items-center justify-between">
                   <div>
                      <h3 className="text-white font-900 text-lg">{playingVideo.title}</h3>
                      <p className="text-gray-400 text-sm font-800 mt-0.5">{lessons.find(l => l.id === playingVideo.lessonId)?.title}</p>
                   </div>
                   <div className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-900 uppercase tracking-widest border border-emerald-500/20">
                      {formatSize(playingVideo.size)}
                   </div>
                </div>
             </div>
          </div>
       )}

       {uploadOpen && (
          <div className="fixed inset-0 z-50 bg-gray-500/40 flex items-center justify-center p-4 backdrop-blur-sm">
             <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-[850px] overflow-hidden animate-in zoom-in-95 duration-200 border border-white">
                <div className="flex items-center justify-between p-6 pb-2">
                   <h3 className="text-[19px] font-900 text-gray-800">{editingVideoId ? "Videoni tahrirlash" : "Video qo'shish"}</h3>
                   <button onClick={closeForm} disabled={uploading} className="text-gray-400 hover:text-gray-800 bg-gray-50 p-2 rounded-full"><X size={18}/></button>
                </div>
                <div className="p-6 pt-4 space-y-6">
                   <div className="grid grid-cols-2 gap-6">
                      <div>
                         <label className="text-[12px] font-800 text-red-500 mb-1.5 block uppercase tracking-wide">
                            * <span className="text-gray-800">Dars (Mavzu)</span>
                         </label>
                         <select 
                           value={lessonId} 
                           onChange={(e) => setLessonId(e.target.value)}
                           className="w-full px-4 py-3.5 rounded-xl border border-gray-200 text-[14px] font-800 text-gray-800 outline-none focus:border-[#00b58e] focus:ring-4 focus:ring-[#00b58e]/10 appearance-none bg-white transition-all shadow-sm"
                         >
                            <option value="" disabled>Mavzulardan birini tanlang</option>
                            {lessons.map(l => (
                              <option key={l.id} value={l.id}>{l.title}</option>
                            ))}
                         </select>
                      </div>
                      <div>
                         <label className="text-[12px] font-800 text-gray-800 mb-1.5 block uppercase tracking-wide">Video nomi (ixtiyoriy)</label>
                         <input 
                           type="text" 
                           value={videoTitle}
                           onChange={(e) => setVideoTitle(e.target.value)}
                           placeholder="Dasturlash asoslari..."
                           className="w-full px-4 py-3.5 rounded-xl border border-gray-200 text-[14px] font-800 text-gray-800 outline-none focus:border-[#00b58e] focus:ring-4 focus:ring-[#00b58e]/10 transition-all shadow-sm"
                         />
                      </div>
                   </div>

                   <input 
                     type="file" 
                     ref={fileInputRef} 
                     onChange={(e) => setVideoFile(e.target.files[0])} 
                     accept="video/*"
                     className="hidden" 
                   />
                   <div 
                     onClick={() => !uploading && fileInputRef.current?.click()}
                     className={`border-2 border-dashed border-[#00b58e] rounded-[20px] p-12 flex flex-col items-center justify-center text-center transition-all ${uploading ? 'opacity-50 cursor-wait bg-gray-50' : 'cursor-pointer hover:bg-emerald-50 hover:border-emerald-500 bg-white shadow-sm'}`}
                   >
                      <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-[#00b58e] flex items-center justify-center mb-5 shadow-sm">
                         <FileVideo size={32} strokeWidth={1.5} />
                      </div>
                      <p className="text-[16px] font-900 text-gray-800 mb-1.5">
                        {videoFile ? videoFile.name : (editingVideoId ? "Yangi fayl yuklash uchun bosing (ixtiyoriy)" : "Videofaylni yuklash uchun ustiga bosing")}
                      </p>
                      <p className="text-[13px] font-800 text-gray-400">
                        {videoFile ? formatSize(videoFile.size) : ".mp4, .webm, .mov formatlarida"}
                      </p>
                   </div>
                   
                   <div className="flex justify-end mt-6 gap-3 border-t border-gray-100 pt-6">
                       <button onClick={closeForm} disabled={uploading} className="px-6 py-2.5 bg-gray-100 text-gray-600 text-[13px] font-900 rounded-xl hover:bg-gray-200 transition-all disabled:opacity-50 uppercase tracking-wide">Bekor qilish</button>
                       <button onClick={handleUpload} disabled={uploading} className="min-w-[140px] flex items-center justify-center px-8 py-2.5 bg-[#00b58e] text-white text-[13px] font-900 rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/30 disabled:opacity-70 uppercase tracking-wide">
                          {uploading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : "Saqlash"}
                       </button>
                   </div>
                </div>
             </div>
          </div>
       )}

       <div className="w-full flex justify-between items-center p-5 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-[#00b58e]">
                <FileVideo size={20} />
             </div>
             <div>
                <h3 className="font-900 text-gray-800 text-[16px]">Dars video yozuvlari</h3>
                <p className="text-gray-400 text-[12px] font-800">{videos.length} ta videolar</p>
             </div>
          </div>
          <button onClick={() => { closeForm(); setUploadOpen(true); }} className="px-5 py-2.5 bg-[#00b58e] text-white text-[13px] font-900 uppercase tracking-widest rounded-xl hover:bg-emerald-600 transition-all shadow-md shadow-emerald-500/20 active:scale-95 flex items-center gap-2">
            Video Qo'shish <PlayCircle size={16}/>
          </button>
       </div>
       <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
               {['Video nomi', 'Dars nomi', 'Status', 'Dars sanasi', 'Hajmi', "Qo'shilgan vaqti", 'Harakatlar'].map((h, i) =>(
                 <th key={h} className={`px-6 py-4 text-[12px] uppercase tracking-wider font-900 text-gray-400 ${i === 6 ? 'text-right' : ''}`}>{h}</th>
               ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 bg-white">
             {loading ? <tr><td colSpan={7} className="py-20 text-center text-gray-400 font-800">Yuklanmoqda...</td></tr> : videos.map(v => {
               const lesson = lessons.find(l => l.id === v.lessonId);
               return (
                 <tr key={v.id} className="hover:bg-gray-50/80 transition-colors group">
                    <td className="px-6 py-4 max-w-[200px] truncate">
                       <div className="flex items-center gap-3" title={v.title}>
                          <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center cursor-pointer hover:bg-[#00b58e] hover:text-white text-[#00b58e] transition-colors" onClick={() => setPlayingVideo(v)}>
                             <PlayCircle size={16} className="flex-shrink-0" />
                          </div>
                          <span onClick={() => setPlayingVideo(v)} className="text-[14px] font-900 text-gray-800 hover:text-[#00b58e] cursor-pointer truncate transition-colors">{v.title}</span>
                       </div>
                    </td>
                    <td className="px-6 py-4 text-[13px] font-800 text-gray-600 truncate max-w-[150px]" title={lesson?.title}>{lesson?.title}</td>
                    <td className="px-6 py-4">
                       <span className="px-2.5 py-1 border border-emerald-500/20 text-[#00b58e] text-[10px] font-900 rounded-md bg-emerald-50 uppercase tracking-widest flex items-center gap-1.5 w-max">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#00b58e]"></span> Tayyor
                       </span>
                    </td>
                    <td className="px-6 py-4 text-[13px] font-800 text-gray-600">{lesson ? dayjs(lesson.date).format('DD MMM, YYYY') : '-'}</td>
                    <td className="px-6 py-4 text-[13px] font-800 text-gray-500 bg-gray-50/50">{formatSize(v.size)}</td>
                    <td className="px-6 py-4 text-[12px] font-800 text-gray-400">{dayjs(v.created_at).format('DD MMM, YYYY')}</td>
                    <td className="px-6 py-4 text-right pr-6">
                       <button onClick={() => openEdit(v)} className="text-gray-400 hover:text-[#00b58e] p-2 rounded-xl hover:bg-emerald-50 transition-all">
                          <Edit2 size={16} />
                       </button>
                    </td>
                 </tr>
               );
             })}
             {videos.length === 0 && !loading && <tr><td colSpan={7} className="py-24 text-center text-gray-400 flex flex-col items-center justify-center"><FileVideo size={40} className="text-gray-200 mb-3"/><span className="font-800 text-sm">Videolar topilmadi</span></td></tr>}
          </tbody>
       </table>
    </div>
  );
}
