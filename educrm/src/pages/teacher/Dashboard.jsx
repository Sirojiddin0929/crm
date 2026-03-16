import React, { useEffect, useState } from 'react';
import { BookOpen, Users, ClipboardList, Star, TrendingUp, Calendar } from 'lucide-react';
import { StatCard, PageHeader, Avatar } from '../../components/UI';
import { useTeacherAuth } from '../../context/TeacherAuthContext';
import { groupsAPI, lessonsAPI, homeworkAPI, ratingsAPI } from '../../services/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
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
  const [rating, setRating] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    Promise.all([
      groupsAPI.getAll({ teacherId: user.id }),
      lessonsAPI.getAll({ teacherId: user.id }),
      homeworkAPI.getAll({}),
      ratingsAPI.getByTeacher(user.id),
    ]).then(([g, l, h, r]) => {
      setGroups(g.data || []);
      setLessons(l.data || []);
      setHomework(h.data || []);
      const rd = r.data;
      setRating(rd?.avgRating || (Array.isArray(rd) ? (rd.reduce((s, x) => s + x.score, 0) / (rd.length || 1)).toFixed(1) : null));
    }).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  const todayLessons = lessons.filter(l => l.date === dayjs().format('YYYY-MM-DD'));
  const recentLessons = [...lessons].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

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
        <StatCard icon={<Star size={20}/>} label="Reytingim" value={rating ? `${rating} ⭐` : '—'} color="#059669" sub="o'rtacha ball"/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Chart */}
        <div className="card p-4 lg:col-span-2">
          <h3 className="font-800 text-gray-800 text-sm mb-1">Haftalik davomat</h3>
          <p className="text-xs text-gray-400 mb-3">Oxirgi 6 kun</p>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#7C3AED" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }}/>
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }}/>
              <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 12 }}/>
              <Area type="monotone" dataKey="davomat" stroke="#7C3AED" strokeWidth={2.5} fill="url(#grad)" name="Talabalar"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Today lessons */}
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={16} className="text-primary"/>
            <h3 className="font-800 text-gray-800 text-sm">Bugungi darslar</h3>
          </div>
          {todayLessons.length === 0 ? (
            <div className="text-center py-6">
              <div className="text-3xl mb-2">📅</div>
              <p className="text-xs text-gray-400 font-600">Bugun dars yo'q</p>
            </div>
          ) : todayLessons.map(l => (
            <div key={l.id} className="flex items-center gap-2.5 py-2 border-b border-gray-50 last:border-0">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <BookOpen size={14} className="text-primary"/>
              </div>
              <div>
                <p className="font-700 text-gray-800 text-xs">{l.title}</p>
                <p className="text-gray-400 text-xs">{l.startTime || '—'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent lessons */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="font-800 text-gray-800 text-sm">So'nggi darslar</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr>
              {['#', 'Mavzu', 'Guruh', 'Sana', 'Status'].map(h => (
                <th key={h} className="table-header first:pl-4">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recentLessons.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-gray-400 text-sm">Darslar topilmadi</td></tr>
            ) : recentLessons.map((l, i) => (
              <tr key={l.id} className="hover:bg-gray-50/60">
                <td className="table-cell pl-4 text-gray-400 font-700 text-xs">{i + 1}</td>
                <td className="table-cell font-700 text-gray-800 text-sm">{l.title}</td>
                <td className="table-cell text-xs text-gray-500">Guruh #{l.groupId}</td>
                <td className="table-cell text-xs text-gray-400">{l.date || '—'}</td>
                <td className="table-cell"><span className="badge badge-green">O'tildi</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
