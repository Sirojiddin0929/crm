import React, { useEffect, useState } from 'react';
import { Calendar as CalIcon, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { Empty, Toggle, resolvePhotoUrl } from '../../../components/UI';
import { groupsAPI, lessonsAPI, attendanceAPI } from '../../../services/api';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

export default function JournalView({ group, teacher }) {
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
               {teacher?.photo ? <img src={resolvePhotoUrl(teacher.photo)} alt="" className="w-full h-full object-cover" /> : <Users size={24}/>}
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


