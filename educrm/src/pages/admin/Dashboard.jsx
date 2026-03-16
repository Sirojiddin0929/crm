import  { useEffect, useState } from 'react';
import {  Users, BookOpen, School,  Archive } from 'lucide-react';
import { StatCard, PageHeader } from '../../components/UI';
import { studentsAPI, teachersAPI, coursesAPI, groupsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const chartData = [
  { name: 'Yan', talabalar: 32, guruhlar: 8 },
  { name: 'Fev', talabalar: 41, guruhlar: 10 },
  { name: 'Mar', talabalar: 49, guruhlar: 12 },
  { name: 'Apr', talabalar: 45, guruhlar: 11 },
  { name: 'May', talabalar: 58, guruhlar: 14 },
  { name: 'Iyu', talabalar: 65, guruhlar: 16 },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [counts, setCounts] = useState({ students: 0, teachers: 0, courses: 0, groups: 0 });

  useEffect(() => {
    Promise.all([studentsAPI.getAll(), teachersAPI.getAll(), coursesAPI.getAll(), groupsAPI.getAll()])
      .then(([s, t, c, g]) => setCounts({
        students: s.data?.length || 0,
        teachers: t.data?.length || 0,
        courses: c.data?.length || 0,
        groups: g.data?.length || 0,
      }))
      .catch(() => {});
  }, []);

  return (
    <div className="fade-in">
      <PageHeader
        title={`Salom, ${user?.fullName?.split(' ')[0] || 'Admin'} 👋`}
        subtitle="EduCoin platformasiga xush kelibsiz!"
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {[
          { icon: <Users size={20} />, label: 'Faol talabalar', value: counts.students, color: '#7C3AED' },
          { icon: <School size={20} />, label: 'Guruhlar', value: counts.groups, color: '#2563EB' },
          { icon: <BookOpen size={20} />, label: "O'qituvchilar", value: counts.teachers, color: '#6366F1' },
          { icon: <Archive size={20} />, label: 'Kurslar', value: counts.courses, color: '#64748B' },
        ].map((s, i) => <StatCard key={i} {...s} />)}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="card p-4 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-800 text-gray-800 text-sm">O'sish dinamikasi</h3>
              <p className="text-xs text-gray-400 font-500">Talabalar va guruhlar</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="talabalar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="guruhlar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 12 }} />
              <Area type="monotone" dataKey="talabalar" stroke="#7C3AED" strokeWidth={2} fill="url(#talabalar)" name="Talabalar" />
              <Area type="monotone" dataKey="guruhlar" stroke="#2563EB" strokeWidth={2} fill="url(#guruhlar)" name="Guruhlar" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-4">
          <h3 className="font-800 text-gray-800 text-sm mb-4">Tizim holati</h3>
          <div className="space-y-4">
            {[
              { label: "Faol talabalar", val: counts.students, total: counts.students + 5, color: '#7C3AED' },
              { label: "O'qituvchilar", val: counts.teachers, total: counts.teachers + 2, color: '#2563EB' },
              { label: 'Kurslar', val: counts.courses, total: counts.courses + 1, color: '#059669' },
              { label: 'Guruhlar', val: counts.groups, total: counts.groups + 3, color: '#D97706' },
            ].map((item, i) => {
              const pct = item.total ? Math.round((item.val / item.total) * 100) : 0;
              return (
                <div key={i}>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs font-600 text-gray-600">{item.label}</span>
                    <span className="text-xs font-800" style={{ color: item.color }}>{item.val}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: item.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
