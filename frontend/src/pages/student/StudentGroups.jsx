import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import dayjs from 'dayjs';
import { PageHeader, Empty } from '../../components/UI';
import { useStudentAuth } from '../../context/StudentAuthContext';
import { studentsAPI } from '../../services/api';
import { DAYS_UZ } from './shared';

export default function StudentGroups() {
  const { user } = useStudentAuth();
  const [groups, setGroups] = useState([]);
  const [activeTab, setActiveTab] = useState('active');
  const [teachersModal, setTeachersModal] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user?.id) return;
    studentsAPI.getGroups(user.id).then(r => setGroups(r.data || [])).catch(() => {});
  }, [user]);

  const filteredGroups = groups.filter(g => activeTab === 'active' ? g.status !== 'INACTIVE' : g.status === 'INACTIVE');

  return (
    <div className="fade-in space-y-6">
      <PageHeader title="Guruhlarim" subtitle="Siz o'qiyotgan barcha kurslar ro'yxati" />
      <div className="flex gap-1 p-1 bg-white dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5 w-fit shadow-sm">
        {[['active', 'Faol'], ['completed', 'Tugagan']].map(([v, l]) => (
          <button key={v} onClick={() => setActiveTab(v)} className={`px-6 py-2 rounded-lg text-[11px] font-900 uppercase tracking-widest transition-all ${activeTab === v ? 'bg-primary text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}>
            {l}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden shadow-xl shadow-primary/5">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50/50 dark:bg-white/5">
              <th className="table-header pl-6">#</th>
              <th className="table-header">Guruh nomi</th>
              <th className="table-header">Yo'nalishi</th>
              <th className="table-header text-center">O'qituvchilar soni</th>
              <th className="table-header pr-6 text-right">Boshlash vaqti</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/5">
            {filteredGroups.map((g, i) => {
              const mainGroup = g.group || g;
              const tCount = (mainGroup.teacher ? 1 : 0) + (mainGroup.user ? 1 : 0);
              return (
                <tr key={g.id} className="hover:bg-gray-50/60 dark:hover:bg-white/5 transition-all group">
                  <td onClick={() => navigate(`/student/groups/${mainGroup.id}/lessons`)} className="table-cell pl-6 text-gray-400 font-900 text-[10px] cursor-pointer">{i + 1}</td>
                  <td onClick={() => navigate(`/student/groups/${mainGroup.id}/lessons`)} className="table-cell font-800 text-gray-800 dark:text-gray-100 text-sm cursor-pointer">{mainGroup.name}</td>
                  <td onClick={() => navigate(`/student/groups/${mainGroup.id}/lessons`)} className="table-cell text-[13px] font-700 text-gray-500 cursor-pointer">{mainGroup.course?.name || 'Programming'}</td>
                  <td className="table-cell text-center">
                    <button onClick={e => { e.stopPropagation(); setTeachersModal(mainGroup); }} className="text-primary font-900 text-[13px] hover:underline underline-offset-4">
                      {tCount} kishi
                    </button>
                  </td>
                  <td onClick={() => navigate(`/student/groups/${mainGroup.id}/lessons`)} className="table-cell pr-6 text-right font-800 text-xs text-gray-500 uppercase tracking-tighter cursor-pointer">
                    {mainGroup.startDate ? dayjs(mainGroup.startDate).format('DD MMM, YYYY') : '—'}<br />
                    <span className="text-[10px] text-gray-400 font-700">{mainGroup.startTime}</span>
                  </td>
                </tr>
              );
            })}
            {filteredGroups.length === 0 && <tr><td colSpan={5} className="py-20"><Empty text="Guruhlar topilmadi" /></td></tr>}
          </tbody>
        </table>
      </div>

      {teachersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm fade-in" onClick={() => setTeachersModal(null)}>
          <div className="bg-white dark:bg-[#1A1A24] rounded-2xl w-full max-w-4xl shadow-2xl border border-gray-100 dark:border-white/10 flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
              <h2 className="text-lg font-900 text-gray-800 dark:text-gray-100 tracking-tight">{teachersModal.name}</h2>
              <button onClick={() => setTeachersModal(null)} className="p-2 text-gray-400 hover:text-red-500 transition-colors bg-gray-50 hover:bg-red-50 dark:bg-white/5 dark:hover:bg-red-500/10 rounded-xl">
                <X size={18} />
              </button>
            </div>
            <div className="p-8 overflow-y-auto max-h-[70vh]">
              <h3 className="text-xl font-900 text-gray-800 dark:text-white mb-6">Faol</h3>
              <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl overflow-hidden mb-10">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 dark:bg-white/5 border-b border-gray-100 dark:border-white/10">
                      <th className="table-header pl-6">O'qituvchi</th>
                      <th className="table-header">Roli</th>
                      <th className="table-header">Dars kunlari</th>
                      <th className="table-header">Dars vaqti</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                    {teachersModal.teacher && (
                      <tr>
                        <td className="table-cell pl-6 font-800 text-sm text-gray-800 dark:text-gray-100">{teachersModal.teacher.fullName}</td>
                        <td className="table-cell font-700 text-sm text-gray-500">Teacher</td>
                        <td className="table-cell font-700 text-sm text-gray-500">{(teachersModal.weekDays || []).map(d => DAYS_UZ[d]).join(', ')}</td>
                        <td className="table-cell font-700 text-sm text-gray-500">{teachersModal.startTime} - {teachersModal.startTime ? `${(parseInt(teachersModal.startTime.split(':')[0], 10) + 3).toString().padStart(2, '0')}:${teachersModal.startTime.split(':')[1]}` : ''}</td>
                      </tr>
                    )}
                    {teachersModal.user && (
                      <tr>
                        <td className="table-cell pl-6 font-800 text-sm text-gray-800 dark:text-gray-100">{teachersModal.user.fullName}</td>
                        <td className="table-cell font-700 text-sm text-gray-500">{teachersModal.user.role === 'ADMIN' ? 'Assistant' : teachersModal.user.role}</td>
                        <td className="table-cell font-700 text-sm text-gray-500">{(teachersModal.weekDays || []).map(d => DAYS_UZ[d]).join(', ')}</td>
                        <td className="table-cell font-700 text-sm text-gray-500">{teachersModal.startTime} - {teachersModal.startTime ? `${(parseInt(teachersModal.startTime.split(':')[0], 10) + 3).toString().padStart(2, '0')}:${teachersModal.startTime.split(':')[1]}` : ''}</td>
                      </tr>
                    )}
                    {!teachersModal.teacher && !teachersModal.user && <tr><td colSpan={4} className="py-4 text-center text-sm text-gray-500">O'qituvchilar biriktirilmagan</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
