import React, { useEffect, useState } from 'react';
import { BookOpen, ClipboardList, CheckSquare, Star, Clock, AlertCircle } from 'lucide-react';
import { StatCard, PageHeader, StatusBadge } from '../../components/UI';
import { useStudentAuth } from '../../context/StudentAuthContext';
import { studentsAPI, homeworkAPI, attendanceAPI, homeworkResultsAPI } from '../../services/api';
import dayjs from 'dayjs';

export default function StudentDashboard() {
  const { user } = useStudentAuth();
  const [groups, setGroups] = useState([]);
  const [homework, setHomework] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (!user?.id) return;
    Promise.all([
      studentsAPI.getGroups(user.id),
      homeworkAPI.getAll({ studentId: user.id }),
      attendanceAPI.getByStudent(user.id),
      homeworkResultsAPI.getAll({ studentId: user.id }),
    ]).then(([g, h, a, r]) => {
      setGroups(g.data || []);
      setHomework(h.data || []);
      setAttendance(a.data || []);
      setResults(r.data || []);
    }).catch(() => {});
  }, [user]);

  const present = attendance.filter(a => a.isPresent).length;
  const attRate = attendance.length ? Math.round((present / attendance.length) * 100) : 0;
  const avgScore = results.length ? Math.round(results.reduce((s, r) => s + r.score, 0) / results.length) : 0;

  return (
    <div className="fade-in">
      <PageHeader
        title={`Salom, ${user?.fullName?.split(' ')[0] || "O'quvchi"} 👋`}
        subtitle={`Bugun: ${dayjs().format('DD MMMM YYYY')}`}
        actions={
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-100 rounded-xl">
            <span className="text-base">🪙</span>
            <span className="text-sm font-800 text-amber-700">{user?.coin ?? 0} coin</span>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatCard icon={<BookOpen size={20}/>} label="Guruhlarim" value={groups.length} color="#7C3AED"/>
        <StatCard icon={<ClipboardList size={20}/>} label="Vazifalar" value={homework.length} color="#D97706"/>
        <StatCard icon={<CheckSquare size={20}/>} label="Davomatim" value={`${attRate}%`} color="#059669" sub={`${present}/${attendance.length} dars`}/>
        <StatCard icon={<Star size={20}/>} label="O'rtacha ball" value={avgScore || '—'} color="#2563EB" sub="vazifalar bo'yicha"/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent homework */}
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-800 text-sm text-gray-800">So'nggi vazifalar</h3>
            <AlertCircle size={15} className="text-amber-400"/>
          </div>
          <div className="divide-y divide-gray-50">
            {homework.slice(0, 5).map(h => (
              <div key={h.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50/60">
                <div>
                  <p className="font-700 text-sm text-gray-800">{h.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                    <Clock size={10}/> {h.durationTime ? `${h.durationTime} soat` : 'Muddat belgilanmagan'}
                  </p>
                </div>
                <span className="badge badge-yellow">Kutilmoqda</span>
              </div>
            ))}
            {homework.length === 0 && (
              <div className="py-8 text-center text-sm text-gray-400">Vazifalar yo'q</div>
            )}
          </div>
        </div>

        {/* Guruhlar */}
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="font-800 text-sm text-gray-800">Guruhlarim</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {groups.map(g => (
              <div key={g.id} className="px-4 py-3 hover:bg-gray-50/60">
                <div className="flex items-center justify-between">
                  <p className="font-700 text-sm text-gray-800">{g.name}</p>
                  <span className="badge badge-green">ACTIVE</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {g.startTime || '—'} · {g.startDate || '—'} → {g.endDate || '...'}
                </p>
              </div>
            ))}
            {groups.length === 0 && (
              <div className="py-8 text-center text-sm text-gray-400">Guruhlar yo'q</div>
            )}
          </div>
        </div>

        {/* Davomat */}
        <div className="card p-5">
          <h3 className="font-800 text-sm text-gray-800 mb-4">Davomat statistikasi</h3>
          <div className="flex items-center gap-6 mb-4">
            <div className="text-center">
              <p className="text-3xl font-900 text-primary">{attRate}%</p>
              <p className="text-xs text-gray-400 font-600">Davomat</p>
            </div>
            <div className="flex-1 space-y-2">
              <div>
                <div className="flex justify-between text-xs mb-1"><span className="font-600 text-gray-600">Keldim</span><span className="font-800 text-green-600">{present}</span></div>
                <div className="h-2 bg-gray-100 rounded-full"><div className="h-full bg-green-500 rounded-full" style={{ width: `${attRate}%` }}/></div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1"><span className="font-600 text-gray-600">Kelmadim</span><span className="font-800 text-red-400">{attendance.length - present}</span></div>
                <div className="h-2 bg-gray-100 rounded-full"><div className="h-full bg-red-400 rounded-full" style={{ width: `${100 - attRate}%` }}/></div>
              </div>
            </div>
          </div>
        </div>

        {/* So'nggi natijalar */}
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="font-800 text-sm text-gray-800">Vazifa natijalari</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {results.slice(0, 5).map(r => (
              <div key={r.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50/60">
                <div>
                  <p className="font-700 text-sm text-gray-800">{r.title || `Vazifa #${r.homeworkId}`}</p>
                  <p className="text-xs text-gray-400">{r.createdAt ? dayjs(r.createdAt).format('DD MMM') : '—'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-lg font-900 ${r.score >= 80 ? 'text-green-600' : r.score >= 60 ? 'text-amber-500' : 'text-red-500'}`}>{r.score}</span>
                  <span className="text-xs text-gray-400">/100</span>
                </div>
              </div>
            ))}
            {results.length === 0 && <div className="py-8 text-center text-sm text-gray-400">Natijalar yo'q</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
