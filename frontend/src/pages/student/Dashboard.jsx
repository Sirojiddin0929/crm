import React, { useEffect, useState, useMemo } from 'react';
import { 
  Users, BookOpen, Clock, Star, Trophy, Target, Zap, 
  ChevronRight, ChevronLeft, Calendar as CalIcon, PlayCircle
} from 'lucide-react';
import { useStudentAuth } from '../../context/StudentAuthContext';
import { studentsAPI } from '../../services/api';
import dayjs from 'dayjs';
import { Avatar } from '../../components/UI';

export default function StudentDashboard() {
  const { user } = useStudentAuth();
  const [stats, setStats] = useState({ groups: 0, lessons: 0, attendance: 0, xp: 1298, level: 4, rating: 250 });
  const [nextLessons, setNextLessons] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(dayjs());

  useEffect(() => {
    if (user?.id) {
      studentsAPI.getGroups(user.id).then(res => {
        const list = res.data || [];
        setStats(prev => ({ ...prev, groups: list.length }));
      });
    }
  }, [user]);

  const daysInMonth = useMemo(() => {
    const s = currentMonth.startOf('month');
    return Array.from({ length: currentMonth.daysInMonth() }, (_, i) => s.add(i, 'day'));
  }, [currentMonth]);

  // Fake lesson schedule for demo (red dots)
  const scheduleDates = ['2026-04-03', '2026-04-06', '2026-04-08', '2026-04-10', '2026-04-13', '2026-04-15', '2026-04-17'];

  return (
    <div className="fade-in space-y-6 pb-10 font-inter">
      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Profile Card */}
        <div className="flex-1 card p-8 bg-white dark:bg-white/5 border-none shadow-xl shadow-primary/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
          
          <div className="relative z-10 flex items-center gap-6">
            <Avatar name={user?.fullName} photo={user?.photo} size="xl" className="w-20 h-20 ring-4 ring-primary/10 shadow-2xl" />
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-900 text-gray-800 dark:text-gray-100 uppercase tracking-tight truncate">Kumushlar: {user?.coin || 0} <Star className="inline-block text-amber-400 ml-1" size={24} fill="currentColor"/></h2>
              <p className="text-gray-400 font-700 uppercase tracking-widest text-[10px] mt-1 truncate">{user?.fullName}</p>
            </div>
          </div>

          <div className="mt-8 space-y-6 relative z-10">
            <div className="flex justify-between items-end mb-2">
              <span className="text-xs font-900 text-gray-700 dark:text-gray-200 uppercase flex items-center gap-2">
                <Target size={14} className="text-primary"/> Bosqich: {stats.level}
              </span>
              <span className="text-[10px] font-900 text-primary uppercase tracking-widest">1298 / 1500 XP</span>
            </div>
            <div className="h-3 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden p-0.5 border border-gray-100 dark:border-white/5">
              <div className="h-full bg-green-500 rounded-full transition-all duration-1000 shadow-sm" style={{ width: '86%' }} />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="p-4 bg-gray-50/50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                <p className="text-[10px] font-900 text-gray-400 uppercase tracking-widest mb-1">BALLAR</p>
                <p className="text-xl font-900 text-gray-800 dark:text-gray-100">{user?.coin || 0}</p>
              </div>
              <div className="p-4 bg-gray-50/50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                <p className="text-[10px] font-900 text-gray-400 uppercase tracking-widest mb-1">Reyting</p>
                <p className="text-xl font-900 text-gray-800 dark:text-gray-100">{stats.rating} - o'rin</p>
              </div>
            </div>
          </div>
        </div>

        {/* Schedule Calendar */}
        <div className="w-full md:w-[400px] card p-6 bg-white dark:bg-white/5 border-none shadow-xl shadow-primary/5">
          <div className="flex items-center justify-between mb-6">
             <h3 className="text-sm font-900 text-gray-800 dark:text-gray-100 uppercase tracking-tight flex items-center gap-2">
               <CalIcon size={16} className="text-primary"/> Dars jadvali
             </h3>
             <div className="flex items-center gap-2">
               <button onClick={() => setCurrentMonth(m => m.subtract(1, 'month'))} className="w-7 h-7 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 flex items-center justify-center transition-colors">
                 <ChevronLeft size={14}/>
               </button>
               <span className="text-[10px] font-900 uppercase tracking-widest w-24 text-center">{currentMonth.format('MMM YYYY')}</span>
               <button onClick={() => setCurrentMonth(m => m.add(1, 'month'))} className="w-7 h-7 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 flex items-center justify-center transition-colors">
                 <ChevronRight size={14}/>
               </button>
             </div>
          </div>

          <div className="grid grid-cols-7 gap-y-4 text-center">
            {['D', 'S', 'C', 'P', 'J', 'S', 'Y'].map(d => (
              <div key={d} className="text-[10px] font-900 text-gray-400 uppercase">{d}</div>
            ))}
            {Array.from({ length: currentMonth.startOf('month').day() === 0 ? 6 : currentMonth.startOf('month').day() - 1 }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {daysInMonth.map(d => {
              const isToday = d.isSame(dayjs(), 'day');
              const isLesson = scheduleDates.includes(d.format('YYYY-MM-DD'));
              return (
                <div key={d.toString()} className="relative group cursor-pointer py-1">
                  <span className={`text-[11px] font-800 ${isToday ? 'text-primary' : 'text-gray-600 dark:text-gray-400'}`}>
                    {d.date()}
                  </span>
                  {isToday && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-6 border border-primary/30 rounded-full" />}
                  {isLesson && <div className="mt-0.5 mx-auto w-1.5 h-1.5 rounded-full bg-red-500 shadow-sm shadow-red-500/50" />}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recommended Lessons / Continue Learning */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6 bg-white dark:bg-white/5 border-none shadow-xl shadow-primary/5">
          <h3 className="text-[11px] font-900 text-gray-400 uppercase tracking-widest mb-6 flex items-center justify-between">
            DAVOM ETTIRISH <button className="text-primary hover:underline transition-all">Barchasi</button>
          </h3>
          <div className="space-y-4">
             <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50/50 dark:bg-white/5 border border-gray-100 dark:border-white/5 hover:border-primary/20 transition-all cursor-pointer group">
               <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-inner group-hover:bg-primary group-hover:text-white transition-all">
                 <PlayCircle size={24}/>
               </div>
               <div className="flex-1 min-w-0">
                 <h4 className="text-sm font-900 text-gray-800 dark:text-gray-100 uppercase truncate">Next.js 14 server actions</h4>
                 <p className="text-[10px] text-gray-400 font-700 uppercase tracking-widest mt-1 truncate">Dars #45 · Frontend Bootcamp</p>
               </div>
               <ChevronRight size={16} className="text-gray-300"/>
             </div>
             <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50/50 dark:bg-white/5 border border-gray-100 dark:border-white/5 hover:border-primary/20 transition-all cursor-pointer group">
               <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500 shadow-inner group-hover:bg-green-500 group-hover:text-white transition-all">
                 <Zap size={24}/>
               </div>
               <div className="flex-1 min-w-0">
                 <h4 className="text-sm font-900 text-gray-800 dark:text-gray-100 uppercase truncate">Nestjs Auth with JWT</h4>
                 <p className="text-[10px] text-gray-400 font-700 uppercase tracking-widest mt-1 truncate">Dars #12 · Nodejs Backend</p>
               </div>
               <ChevronRight size={16} className="text-gray-300"/>
             </div>
          </div>
        </div>

        <div className="card p-6 bg-white dark:bg-white/5 border-none shadow-xl shadow-primary/5">
           <h3 className="text-[11px] font-900 text-gray-400 uppercase tracking-widest mb-6">SO'NGGI NATIJALAR</h3>
           <div className="space-y-4">
              {[
                { title: 'Home Task #4', score: 95, status: 'APPROVED', color: 'bg-green-500' },
                { title: 'Project Architecture', score: 88, status: 'APPROVED', color: 'bg-green-500' },
                { title: 'TypeScript Quiz', score: 45, status: 'REJECTED', color: 'bg-red-500' }
              ].map((res, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-gray-50/50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                  <div className="flex items-center gap-3">
                    <div className={`w-1.5 h-8 rounded-full ${res.color}`} />
                    <div>
                      <p className="text-xs font-900 text-gray-800 dark:text-gray-100 uppercase tracking-tight">{res.title}</p>
                      <p className="text-[9px] text-gray-400 font-700 uppercase tracking-widest">{res.status}</p>
                    </div>
                  </div>
                  <span className="text-sm font-900 text-gray-800 dark:text-gray-100">{res.score}%</span>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}
