import React, { useEffect, useState } from 'react';
import { Users, BookOpen, Clock, ChevronRight, ChevronLeft } from 'lucide-react';
import { PageHeader, Avatar, Empty, TabBar } from '../../components/UI';
import { useTeacherAuth } from '../../context/TeacherAuthContext';
import { groupsAPI, lessonsAPI } from '../../services/api';
import dayjs from 'dayjs';

const DAYS_UZ = { MONDAY: 'Du', TUESDAY: 'Se', WEDNESDAY: 'Ch', THURSDAY: 'Pa', FRIDAY: 'Ju', SATURDAY: 'Sh', SUNDAY: 'Ya' };

export default function TeacherGroups() {
  const { user } = useTeacherAuth();
  const [groups, setGroups] = useState([]);
  const [selected, setSelected] = useState(null);
  const [students, setStudents] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [tab, setTab] = useState("Ma'lumotlar");

  useEffect(() => {
    if (!user?.id) return;
    groupsAPI.getAll({ teacherId: user.id }).then(r => setGroups(r.data || [])).catch(() => {});
  }, [user]);

  const openGroup = async g => {
    setSelected(g);
    setTab("Ma'lumotlar");
    try {
      const [s, l] = await Promise.all([groupsAPI.getStudents(g.id), lessonsAPI.getAll({ groupId: g.id })]);
      setStudents(s.data || []);
      setLessons(l.data || []);
    } catch { setStudents([]); setLessons([]); }
  };

  if (selected) {
    return (
      <div className="fade-in">
        <button onClick={() => setSelected(null)} className="flex items-center gap-1.5 text-sm font-700 text-gray-500 hover:text-gray-800 mb-4">
          <ChevronLeft size={16}/> Guruhlar
        </button>
        <div className="flex items-center gap-3 mb-5">
          <h1 className="text-xl font-800 text-gray-800">{selected.name}</h1>
          <span className="badge badge-green">ACTIVE</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Info */}
          <div className="space-y-3">
            <div className="card p-4">
              <h3 className="font-700 text-sm text-gray-800 mb-3">Guruh ma'lumotlari</h3>
              <div className="space-y-2">
                {[
                  ['Boshlanish', selected.startDate || '—'],
                  ['Tugash', selected.endDate || '—'],
                  ['Dars vaqti', selected.startTime || '—'],
                  ['Sig\'im', `${selected.capacity || 0} kishi`],
                  ['Dars kunlari', selected.weekDays?.map(d => DAYS_UZ[d]).join(', ') || '—'],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between text-xs">
                    <span className="text-gray-400 font-600">{k}</span>
                    <span className="text-gray-700 font-700">{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="card p-4">
              <h3 className="font-700 text-sm text-gray-800 mb-3">Talabalar ({students.length})</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {students.map(s => (
                  <div key={s.id} className="flex items-center gap-2 py-1.5 border-b border-gray-50 last:border-0">
                    <Avatar name={s.fullName} size="sm"/>
                    <div className="flex-1 min-w-0">
                      <p className="font-700 text-xs text-gray-800 truncate">{s.fullName}</p>
                      <p className="text-xs text-gray-400">{s.phone || '—'}</p>
                    </div>
                    <span className="badge badge-green">Faol</span>
                  </div>
                ))}
                {students.length === 0 && <p className="text-xs text-gray-400 text-center py-3">Talabalar yo'q</p>}
              </div>
            </div>
          </div>

          {/* Lessons */}
          <div className="lg:col-span-2 card overflow-hidden">
            <TabBar tabs={["Ma'lumotlar", 'Darslar', 'Davomat']} active={tab} onChange={setTab}/>
            <div className="p-4">
              {tab === "Ma'lumotlar" && (
                <div className="space-y-2">
                  {[
                    { label: 'Jami darslar', value: lessons.length, icon: '📚' },
                    { label: 'Talabalar soni', value: students.length, icon: '👥' },
                    { label: 'Dars kunlari', value: selected.weekDays?.map(d => DAYS_UZ[d]).join(', ') || '—', icon: '📅' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <span className="flex items-center gap-2 text-sm font-600 text-gray-600">{item.icon} {item.label}</span>
                      <span className="font-800 text-gray-800">{item.value}</span>
                    </div>
                  ))}
                </div>
              )}
              {tab === 'Darslar' && (
                <div className="space-y-2">
                  {lessons.map((l, i) => (
                    <div key={l.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                      <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center text-xs font-800 text-primary">{i + 1}</div>
                      <div className="flex-1">
                        <p className="font-700 text-sm text-gray-800">{l.title}</p>
                        <p className="text-xs text-gray-400">{l.date || '—'}</p>
                      </div>
                      <span className="badge badge-green">O'tildi</span>
                    </div>
                  ))}
                  {lessons.length === 0 && <Empty text="Darslar topilmadi"/>}
                </div>
              )}
              {tab === 'Davomat' && (
                <p className="text-center text-gray-400 text-sm py-8">Davomat sahifasidan foydalaning</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <PageHeader title="Guruhlarim" subtitle={`${groups.length} ta guruh`}/>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {groups.map(g => (
          <div key={g.id} onClick={() => openGroup(g)}
            className="card p-4 cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Users size={18} className="text-primary"/>
                </div>
                <div>
                  <p className="font-800 text-gray-800">{g.name}</p>
                  <span className="badge badge-green text-xs">ACTIVE</span>
                </div>
              </div>
              <ChevronRight size={16} className="text-gray-300"/>
            </div>
            <div className="space-y-1.5 text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <Clock size={12}/> <span>{g.startTime || '—'} · {g.weekDays?.map(d => DAYS_UZ[d]).join(', ') || '—'}</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen size={12}/> <span>{g.startDate || '—'} → {g.endDate || '...'}</span>
              </div>
            </div>
          </div>
        ))}
        {groups.length === 0 && <div className="col-span-3 card"><Empty text="Guruhlar topilmadi"/></div>}
      </div>
    </div>
  );
}
