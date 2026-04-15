import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { PageHeader } from '../../components/UI';
import { useStudentAuth } from '../../context/StudentAuthContext';
import { attendanceAPI } from '../../services/api';

export default function StudentAttendance() {
  const { user } = useStudentAuth();
  const [attendance, setAttendance] = useState([]);

  useEffect(() => {
    if (!user?.id) return;
    attendanceAPI.getByStudent(user.id).then(r => setAttendance(r.data || [])).catch(() => {});
  }, [user]);

  const presentCount = attendance.filter(a => a.isPresent).length;
  const rate = attendance.length ? Math.round((presentCount / attendance.length) * 100) : 0;
  const totalXpFromAttendance = attendance.reduce((sum, a) => sum + (a.awardedXp || 0), 0);
  const totalCoinFromAttendance = attendance.reduce((sum, a) => sum + (a.awardedCoin || 0), 0);

  return (
    <div className="fade-in space-y-6">
      <PageHeader
        title="Davomatim"
        subtitle={`O'zlashtirish: ${rate}% | Davomatdan: +${totalXpFromAttendance} XP, +${totalCoinFromAttendance} Kumush`}
      />
      <div className="card overflow-hidden shadow-xl shadow-primary/5">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50/50 dark:bg-white/5">
              <th className="table-header pl-6">#</th>
              <th className="table-header">Dars mavzusi</th>
              <th className="table-header">Holati</th>
              <th className="table-header">XP</th>
              <th className="table-header">Kumush</th>
              <th className="table-header pr-6 text-right">Sana</th>
            </tr>
          </thead>
          <tbody>
            {attendance.map((a, i) => (
              <tr key={a.id} className="hover:bg-gray-50/60 transition-colors">
                <td className="table-cell pl-6 text-gray-400 font-900 text-[10px]">{i + 1}</td>
                <td className="table-cell font-800 text-sm text-gray-800 dark:text-gray-100">{a.lesson?.title || `Dars #${a.lessonId}`}</td>
                <td className="table-cell">
                  <span className={`px-3 py-1 rounded-lg text-[10px] font-900 uppercase tracking-widest ${a.isPresent ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>
                    {a.isPresent ? '✓ KELDI' : '✗ KELMADI'}
                  </span>
                </td>
                <td className="table-cell text-sm font-800 text-gray-700">+{a.awardedXp || 0}</td>
                <td className="table-cell text-sm font-800 text-gray-700">+{a.awardedCoin || 0}</td>
                <td className="table-cell pr-6 text-right text-xs font-700 text-gray-400">
                  {a.created_at || a.createdAt ? dayjs(a.created_at || a.createdAt).format('DD.MM.YYYY HH:mm') : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
