import React, { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { Coins, Globe, TrendingUp } from 'lucide-react';
import { useStudentAuth } from '../../context/StudentAuthContext';
import { attendanceAPI, homeworkResultsAPI, studentsAPI } from '../../services/api';

export default function StudentIndicators() {
  const { user } = useStudentAuth();
  const [stats, setStats] = useState({
    totalXp: 0,
    totalCoin: 0,
    attendanceXp: 0,
    attendanceCoin: 0,
    homeworkXp: 0,
    homeworkCoin: 0,
  });
  const [attendanceRows, setAttendanceRows] = useState([]);
  const [homeworkRows, setHomeworkRows] = useState([]);
  const [detailType, setDetailType] = useState(null); // 'attendance' | 'homework' | null
  const [groupFilter, setGroupFilter] = useState('all');

  const levelData = useMemo(() => {
    const levelBase = 1500;
    const level = Math.floor((stats.totalXp || 0) / levelBase) + 1;
    const inLevelXp = (stats.totalXp || 0) % levelBase;
    const percent = Math.max(0, Math.min(100, Math.round((inLevelXp / levelBase) * 100)));
    return { levelBase, level, inLevelXp, percent };
  }, [stats.totalXp]);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const [attendanceRes, resultsRes, studentRes] = await Promise.all([
          attendanceAPI.getByStudent(user.id),
          homeworkResultsAPI.getAll({ studentId: user.id, compact: true }),
          studentsAPI.getById(user.id),
        ]);

        const attendanceRecords = attendanceRes.data || [];
        const homeworkResults = resultsRes.data || [];
        const student = studentRes.data || {};
        setAttendanceRows(attendanceRecords);
        setHomeworkRows(homeworkResults);

        // Keep only required monitor sources:
        // 1) attendance totals
        // 2) homework totals
        const attendanceXp = attendanceRecords.reduce((sum, a) => sum + (a.awardedXp || 0), 0);
        const attendanceCoin = attendanceRecords.reduce((sum, a) => sum + (a.awardedCoin || 0), 0);
        const homeworkXp = homeworkResults.reduce((sum, r) => sum + (r.xp || 0), 0);
        const homeworkCoin = homeworkResults.reduce((sum, r) => sum + (r.coin || 0), 0);

        setStats({
          totalXp: student.xp || 0,
          totalCoin: student.coin || 0,
          attendanceXp,
          attendanceCoin,
          homeworkXp,
          homeworkCoin,
        });
      } catch {
        setStats({
          groups: 0,
          homeworkTotal: 0,
          homeworkSubmitted: 0,
          lessonsPlanned: 0,
          totalXp: 0,
          totalCoin: 0,
          attendanceXp: 0,
          attendanceCoin: 0,
          homeworkXp: 0,
          homeworkCoin: 0,
        });
        setAttendanceRows([]);
        setHomeworkRows([]);
      }
    })();
  }, [user?.id]);

  useEffect(() => {
    setGroupFilter('all');
  }, [detailType]);

  const detailGroups = useMemo(() => {
    const map = new Map();
    if (detailType === 'attendance') {
      attendanceRows.forEach((row) => {
        const g = row?.lesson?.group;
        if (g?.id && !map.has(g.id)) map.set(g.id, g);
      });
    } else if (detailType === 'homework') {
      homeworkRows.forEach((row) => {
        const g = row?.homework?.lesson?.group;
        if (g?.id && !map.has(g.id)) map.set(g.id, g);
      });
    }
    return Array.from(map.values());
  }, [detailType, attendanceRows, homeworkRows]);

  const filteredAttendance = useMemo(() => {
    if (groupFilter === 'all') return attendanceRows;
    return attendanceRows.filter((row) => String(row?.lesson?.group?.id) === String(groupFilter));
  }, [attendanceRows, groupFilter]);

  const filteredHomework = useMemo(() => {
    if (groupFilter === 'all') return homeworkRows;
    return homeworkRows.filter((row) => String(row?.homework?.lesson?.group?.id) === String(groupFilter));
  }, [homeworkRows, groupFilter]);

  const homeworkStatusText = (status) => {
    if (status === 'APPROVED') return 'Qabul qilindi';
    if (status === 'REJECTED') return 'Rad etildi';
    return status || '-';
  };

  return (
    <div className="fade-in space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-900 text-gray-800">Mening natijalarim</h1>
        <p className="flex items-center gap-2 text-2xl font-900 text-gray-800">
          <Coins size={22} className="text-amber-600" />
          Kumushlar: <span className="text-lg font-800 text-gray-600">{stats.totalCoin}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm lg:col-span-1">
          <p className="mb-3 flex items-center gap-2 text-3xl font-900 text-gray-800">
            <TrendingUp size={20} className="text-sky-600" />
            Bosqich: {levelData.level}
          </p>
          <div className="mb-2 inline-flex rounded-full bg-emerald-600 px-3 py-1 text-xs font-900 text-white">
            {levelData.inLevelXp} / {levelData.levelBase}
          </div>
          <div className="h-3 w-full rounded-full bg-emerald-100">
            <div className="h-3 rounded-full bg-emerald-500" style={{ width: `${levelData.percent}%` }} />
          </div>
          <p className="mt-6 flex items-center gap-2 text-3xl font-900 text-gray-800">
            <Globe size={20} className="text-emerald-600" />
            XP: {stats.totalXp}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-0 shadow-sm lg:col-span-2">
          <div className="border-b border-gray-100 px-6 py-5">
            <h2 className="text-2xl font-900 text-gray-800">Yig'ilgan natijalar monitoringi</h2>
          </div>
          <div className="divide-y divide-gray-100">
            <button
              type="button"
              onClick={() => setDetailType('attendance')}
              className="w-full px-6 py-4 text-left text-sm font-700 text-gray-700 hover:bg-gray-50"
            >
              Darsga ishtirok bo‘yicha jami XP {stats.attendanceXp}, Jami Kumush {stats.attendanceCoin}
            </button>
            <button
              type="button"
              onClick={() => setDetailType('homework')}
              className="w-full px-6 py-4 text-left text-sm font-700 text-gray-700 hover:bg-gray-50"
            >
              Uyga vazifa bo‘yicha jami XP {stats.homeworkXp}, Jami Kumush {stats.homeworkCoin}
            </button>
          </div>
          <div className="border-t border-gray-100 px-6 py-5">
            <p className="text-3xl font-900 text-gray-800">Jami yig'ilgan XP: <span className="text-emerald-600">{stats.totalXp}</span></p>
            <p className="mt-2 text-3xl font-900 text-gray-800">Jami yig'ilgan Kumushlar: <span className="text-gray-600">{stats.totalCoin}</span></p>
          </div>
        </div>
      </div>

      {detailType === 'attendance' && (
        <div className="rounded-2xl border border-gray-100 bg-white p-0 shadow-sm">
          <div className="border-b border-gray-100 px-6 py-5">
            <h2 className="text-2xl font-900 text-gray-800">Darsga ishtirok bo‘yicha natijalar</h2>
            <div className="mt-4">
              <label className="mb-1 block text-xs font-800 text-gray-500">Guruh</label>
              <select
                value={groupFilter}
                onChange={(e) => setGroupFilter(e.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-700 text-gray-700 outline-none"
              >
                <option value="all">Barchasi</option>
                {detailGroups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-4 py-3 text-left text-xs font-900 text-gray-600">Dars mavzusi</th>
                  <th className="px-4 py-3 text-left text-xs font-900 text-gray-600">Guruh</th>
                  <th className="px-4 py-3 text-left text-xs font-900 text-gray-600">Holati</th>
                  <th className="px-4 py-3 text-left text-xs font-900 text-gray-600">XP</th>
                  <th className="px-4 py-3 text-left text-xs font-900 text-gray-600">Kumush</th>
                  <th className="px-4 py-3 text-left text-xs font-900 text-gray-600">Dars sanasi</th>
                </tr>
              </thead>
              <tbody>
                {filteredAttendance.map((row) => (
                  <tr key={row.id} className="border-b border-gray-50">
                    <td className="px-4 py-3 text-sm font-700 text-gray-800">{row.lesson?.title || `Dars #${row.lessonId}`}</td>
                    <td className="px-4 py-3 text-sm font-700 text-gray-700">{row.lesson?.group?.name || '-'}</td>
                    <td className="px-4 py-3 text-sm font-700">
                      <span className={row.isPresent ? 'text-emerald-600' : 'text-red-500'}>
                        {row.isPresent ? 'Keldi' : 'Kelmadi'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-700 text-gray-700">{row.awardedXp || 0}</td>
                    <td className="px-4 py-3 text-sm font-700 text-gray-700">{row.awardedCoin || 0}</td>
                    <td className="px-4 py-3 text-sm font-700 text-gray-700">
                      {row.created_at ? dayjs(row.created_at).format('DD MMM, YYYY') : '-'}
                    </td>
                  </tr>
                ))}
                {filteredAttendance.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm font-700 text-gray-400">Ma'lumot topilmadi</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {detailType === 'homework' && (
        <div className="rounded-2xl border border-gray-100 bg-white p-0 shadow-sm">
          <div className="border-b border-gray-100 px-6 py-5">
            <h2 className="text-2xl font-900 text-gray-800">Uyga vazifa bo‘yicha natijalar</h2>
            <div className="mt-4">
              <label className="mb-1 block text-xs font-800 text-gray-500">Guruh</label>
              <select
                value={groupFilter}
                onChange={(e) => setGroupFilter(e.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-700 text-gray-700 outline-none"
              >
                <option value="all">Barchasi</option>
                {detailGroups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-4 py-3 text-left text-xs font-900 text-gray-600">Dars mavzusi</th>
                  <th className="px-4 py-3 text-left text-xs font-900 text-gray-600">Guruh</th>
                  <th className="px-4 py-3 text-left text-xs font-900 text-gray-600">Uy vazifa statusi</th>
                  <th className="px-4 py-3 text-left text-xs font-900 text-gray-600">Ball</th>
                  <th className="px-4 py-3 text-left text-xs font-900 text-gray-600">XP</th>
                  <th className="px-4 py-3 text-left text-xs font-900 text-gray-600">Kumush</th>
                  <th className="px-4 py-3 text-left text-xs font-900 text-gray-600">Uyga vazifa berilgan sana</th>
                </tr>
              </thead>
              <tbody>
                {filteredHomework.map((row) => (
                  <tr key={row.id} className="border-b border-gray-50">
                    <td className="px-4 py-3 text-sm font-700 text-gray-800">{row.homework?.title || row.homework?.lesson?.title || '-'}</td>
                    <td className="px-4 py-3 text-sm font-700 text-gray-700">{row.homework?.lesson?.group?.name || '-'}</td>
                    <td className="px-4 py-3 text-sm font-700 text-gray-700">{homeworkStatusText(row.status)}</td>
                    <td className="px-4 py-3 text-sm font-700 text-gray-700">{row.score ?? 0}</td>
                    <td className="px-4 py-3 text-sm font-700 text-gray-700">{row.xp ?? 0}</td>
                    <td className="px-4 py-3 text-sm font-700 text-gray-700">{row.coin ?? 0}</td>
                    <td className="px-4 py-3 text-sm font-700 text-gray-700">
                      {row.homework?.created_at ? dayjs(row.homework.created_at).format('DD MMM, YYYY') : '-'}
                    </td>
                  </tr>
                ))}
                {filteredHomework.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-sm font-700 text-gray-400">Ma'lumot topilmadi</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
