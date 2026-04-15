import React, { useEffect, useState } from 'react';
import { BookOpen, Users, ClipboardList, Star, TrendingUp, Calendar } from 'lucide-react';
import { MiniAreaChart, StatCard, PageHeader, Avatar } from '../../components/UI';
import { useTeacherAuth } from '../../context/TeacherAuthContext';
import { groupsAPI, lessonsAPI, homeworkAPI } from '../../services/api';
import dayjs from 'dayjs';

const chartData = [
  { name: 'Du', davomat: 12 }, { name: 'Se', davomat: 10 },
  { name: 'Ch', davomat: 14 }, { name: 'Pa', davomat: 11 },
  { name: 'Ju', davomat: 13 }, { name: 'Sh', davomat: 8 },
];

export default function TeacherDashboard() {
  const { user } = useTeacherAuth();
  const [groups, setGroups] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [homework, setHomework] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    Promise.all([
      groupsAPI.getAll({ teacherId: user.id }),
      lessonsAPI.getAll({ teacherId: user.id }),
      homeworkAPI.getAll({ teacherId: user.id }),
    ]).then(([g, l, h]) => {
      setGroups(g.data || []);
      setLessons(l.data || []);
      setHomework(h.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  const todayLessons = lessons.filter(l => dayjs(l.date).isSame(dayjs(), 'day'));
  const recentLessons = [...lessons].sort((a, b) => dayjs(b.date || b.created_at).valueOf() - dayjs(a.date || a.created_at).valueOf()).slice(0, 5);

  return (
    <div className="fade-in">
      <PageHeader
        title={`Salom, ${user?.fullName?.split(' ')[0] || "O'qituvchi"} 👋`}
        subtitle={`Bugun: ${dayjs().format('DD MMMM YYYY')}`}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatCard icon={<Users size={20}/>} label="Guruhlarim" value={groups.length} color="#7C3AED"/>
        <StatCard icon={<BookOpen size={20}/>} label="Jami darslar" value={lessons.length} color="#2563EB"/>
        <StatCard icon={<ClipboardList size={20}/>} label="Vazifalar" value={homework.length} color="#D97706"/>
        <StatCard icon={<Star size={20}/>} label="Reytinglar" value="Admin panelda" color="#059669" sub="student baholari admin ko'radi"/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Chart */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-800 text-gray-800 dark:text-gray-100 text-sm">Haftalik davomat</h3>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 font-700 uppercase tracking-widest mt-0.5">Oxirgi 6 kunlik statistika</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <TrendingUp size={18}/>
            </div>
          </div>
          <MiniAreaChart
            data={chartData}
            lines={[
              { dataKey: 'davomat', color: '#7C3AED', fill: 'rgba(124,58,237,0.12)', name: 'Talabalar' },
            ]}
            height={200}
          />
        </div>

        {/* Today lessons */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={18} className="text-primary"/>
            <h3 className="font-800 text-gray-800 dark:text-gray-100 text-sm">Bugungi darslar</h3>
          </div>
          {todayLessons.length === 0 ? (
            <div className="text-center py-10 bg-gray-50/50 dark:bg-white/5 rounded-2xl border border-dashed border-gray-100 dark:border-white/5">
              <div className="text-4xl mb-2">📅</div>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 font-800 uppercase tracking-widest">Bugun dars belgilanmagan</p>
            </div>
          ) : todayLessons.map(l => {
            const group = groups.find(g => g.id === l.groupId);
            return (
            <div key={l.id} className="flex items-center gap-3 py-3 border-b border-gray-50 dark:border-white/5 last:border-0 hover:bg-gray-50/50 dark:hover:bg-white/5 px-2 -mx-2 rounded-xl transition-colors">
              <div className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center flex-shrink-0">
                <BookOpen size={16} className="text-primary"/>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-800 text-gray-800 dark:text-gray-100 text-xs truncate uppercase tracking-tight">{l.title}</p>
                <p className="text-gray-400 dark:text-gray-500 text-[10px] font-700 mt-0.5">{group ? `${group.name} · ${group.startTime || 'Vaqt yo\'q'}` : 'Vaqt belgilanmagan'}</p>
              </div>
            </div>
          )})}
        </div>
      </div>

      {/* Recent lessons */}
      <div className="card overflow-hidden mt-2">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 flex items-center justify-between">
          <h3 className="font-800 text-gray-800 dark:text-gray-100 text-sm">So'nggi darslar ro'yxati</h3>
          <span className="badge badge-blue">{recentLessons.length} ta dars</span>
        </div>
        <table className="w-full">
          <thead>
            <tr>
              {['#', 'Dars mavzusi', 'Guruh', 'Sana', 'Status'].map(h => (
                <th key={h} className="table-header first:pl-5 last:pr-5">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recentLessons.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-10 text-gray-400 dark:text-gray-500 font-700 text-sm italic">Hali darslar o'tilmagan</td></tr>
            ) : recentLessons.map((l, i) => {
              const groupName = groups.find(g => g.id === l.groupId)?.name || `Guruh #${l.groupId}`;
              return (
              <tr key={l.id} className="hover:bg-gray-50/60 dark:hover:bg-white/5 transition-colors">
                <td className="table-cell pl-5 text-gray-400 dark:text-gray-500 font-900 text-[10px]">{i + 1}</td>
                <td className="table-cell font-800 text-gray-800 dark:text-gray-100 text-sm">{l.title}</td>
                <td className="table-cell text-[11px] font-800 text-primary uppercase tracking-tighter">{groupName}</td>
                <td className="table-cell text-[11px] text-gray-400 dark:text-gray-500 font-700">{dayjs(l.date).format('DD MMM, YYYY')}</td>
                <td className="table-cell pr-5"><span className="badge badge-green">O'tildi</span></td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>
    </div>
  );
}
