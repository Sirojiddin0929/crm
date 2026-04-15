import React, { useEffect, useState } from 'react';
import { Users, BookOpen, Clock, ChevronRight, ChevronLeft, Search, Zap, Calendar as CalIcon } from 'lucide-react';
import { PageHeader, Avatar, Empty } from '../../components/UI';
import { useTeacherAuth } from '../../context/TeacherAuthContext';
import { groupsAPI } from '../../services/api';
import dayjs from 'dayjs';
import JournalView from './groups/JournalView';
import LessonsView from './groups/LessonsView';
import HomeworkView from './groups/HomeworkView';
import VideosView from './groups/VideosView';

const DAYS_UZ = { MONDAY: 'Du', TUESDAY: 'Se', WEDNESDAY: 'Ch', THURSDAY: 'Pa', FRIDAY: 'Ju', SATURDAY: 'Sh', SUNDAY: 'Ya' };

function formatDate(value, pattern = 'DD.MM.YYYY') {
  return value ? dayjs(value).format(pattern) : '—';
}

function getStudentCount(group) {
  return group?._count?.studentGroup ?? group?.students?.length ?? 0;
}

function getLessonCount(group) {
  return group?._count?.lesson ?? 0;
}

function getDirection(group) {
  return group?.course?.category?.name || group?.course?.direction?.name || group?.course?.name || '—';
}

function getEducationType(group) {
  const name = group?.course?.name || '';
  if (!name) return '—';
  return name.toUpperCase().includes('BOOTCAMP') ? 'BOOTCAMP' : 'STANDART';
}

function getTimeRange(group) {
  if (!group?.startTime) return '—';
  const durationHours = Number(group?.course?.durationLesson || 0);
  if (!durationHours) return group.startTime;

  const [hours, minutes] = group.startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + durationHours * 60;
  const endHours = String(Math.floor(totalMinutes / 60) % 24).padStart(2, '0');
  const endMinutes = String(totalMinutes % 60).padStart(2, '0');
  return `${group.startTime} - ${endHours}:${endMinutes}`;
}

function getSchedule(group) {
  const days = (group?.weekDays || []).map(day => DAYS_UZ[day]).filter(Boolean).join(', ');
  const timeRange = getTimeRange(group);
  if (days && timeRange !== '—') return `${timeRange} (${days})`;
  return days || timeRange;
}

export default function TeacherGroups({ mode = 'teacher', actorUser = null, canCreateGroup = false, onCreateGroup = null, refreshToken = 0 }) {
  const { user: teacherAuthUser } = useTeacherAuth();
  const user = actorUser || teacherAuthUser;
  const [groups, setGroups] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Main Tabs: Ma'lumotlar, Guruh darsliklari, Akademik davomat
  const [mainTab, setMainTab] = useState("Guruh darsliklari");
  // Sub Tabs: Guruh darsliklari, Uyga vazifa, Videolar, Imtihonlar, Jurnal
  const [subTab, setSubTab] = useState("Jurnal");

  const isTeacherMode = mode === 'teacher';

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    groupsAPI.getAll(isTeacherMode ? { teacherId: user.id } : {})
      .then(r => setGroups(r.data?.data || r.data || []))
      .finally(() => setLoading(false));
  }, [user, isTeacherMode, refreshToken]);

  const filteredGroups = groups.filter(group => {
    const q = search.trim().toLowerCase();
    if (!q) return true;

    const haystack = [
      group.name,
      group.course?.name,
      group.room?.name,
      group.teacher?.fullName,
      getDirection(group),
      getSchedule(group),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return haystack.includes(q);
  });

  if (selected) {
    return (
      <div className="fade-in max-w-[1600px] mx-auto pb-10">
        {/* Breadcrumb / Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
             <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-800 transition-colors">
               <ChevronLeft size={20}/>
             </button>
             <h1 className="text-xl font-900 text-gray-800">{selected.name}</h1>
             <span className="px-2 py-0.5 bg-emerald-50 text-[#00b58e] text-[10px] font-900 rounded uppercase">Aktiv</span>
          </div>
          
        </div>

        {/* Main Tabs Navigation */}
        <div className="flex gap-6 border-b border-gray-100 mb-6">
           {["Ma'lumotlar", "Guruh darsliklari"].map(t => (
             <button key={t} onClick={() => setMainTab(t)}
               className={`pb-3 text-sm font-900 transition-all ${mainTab === t ? 'text-[#00b58e] border-b-2 border-[#00b58e]' : 'text-gray-400 hover:text-gray-600'}`}>
               {t}
             </button>
           ))}
        </div>

        {mainTab === "Guruh darsliklari" && (
          <div className="space-y-6">
             <div className="flex gap-2">
                {["Guruh darsliklari", "Uyga vazifa", "Videolar", "Jurnal"].map(t => (
                  <button key={t} onClick={() => setSubTab(t)}
                    className={`px-4 py-2 rounded-xl text-[13px] font-900 transition-all ${subTab === t ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
                    {t}
                  </button>
                ))}
             </div>

             {/* Dynamic Sub-sections */}
             <div className="animate-in fade-in duration-300">
                {subTab === "Jurnal" && <JournalView group={selected} teacher={selected?.teacher || user} />}
                {subTab === "Guruh darsliklari" && <LessonsView group={selected} teacher={selected?.teacher || user} />}
                {subTab === "Uyga vazifa" && <HomeworkView group={selected} teacher={selected?.teacher || user} />}
                {subTab === "Videolar" && <VideosView group={selected} teacher={selected?.teacher || user} />}
             </div>
          </div>
        )}

        {mainTab === "Ma'lumotlar" && (
           <div className="card p-8 bg-white">
              <h3 className="text-lg font-900 text-gray-800 uppercase tracking-tight mb-6">Guruh ma'lumotlari</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 {[
                   { l: 'O\'qituvchi', v: user?.fullName, i: <Users size={16}/> },
                   { l: 'Kurs nomi', v: selected.course?.name || '-', i: <BookOpen size={16}/> },
                   { l: 'Kurs narxi', v: selected.course?.price ? new Intl.NumberFormat('uz-UZ').format(selected.course.price) + ' so\'m' : '-', i: <Zap size={16}/> },
                   { l: 'Davomiyligi (oy)', v: selected.course?.durationMonth ? `${selected.course.durationMonth} oy` : '-', i: <Clock size={16}/> },
                   { l: 'Davomiyligi (soat)', v: selected.course?.durationLesson ? `${selected.course.durationLesson} soat/dars` : '-', i: <Clock size={16}/> },
                   { l: 'Xona nomi', v: selected.room?.name || '-', i: <Zap size={16}/> },
                   { l: 'Dars boshlanish vaqti', v: selected.startTime, i: <Clock size={16}/> },
                   { l: 'Kunlar', v: selected.weekDays?.map(d => DAYS_UZ[d]).join(', '), i: <CalIcon size={16}/> },
                 ].map((item, idx) => (
                   <div key={idx} className="p-4 bg-gray-50 rounded-2xl border border-gray-100/50 text-gray-800">
                      <p className="text-[10px] font-900 text-gray-400 uppercase tracking-widest mb-1">{item.l}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-500">{item.i}</span>
                        <p className="font-800 text-gray-800 text-[13px]">{item.v || '—'}</p>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        )}
      </div>
    );
  }

  return (
    <div className="fade-in space-y-6">
      <PageHeader
        title="Guruhlar"
        subtitle={isTeacherMode ? "Teacher panel uchun sizga biriktirilgan barcha guruhlar ro'yxati" : "Admin panel uchun barcha guruhlar ro'yxati"}
        actions={canCreateGroup && typeof onCreateGroup === 'function' ? (
          <button className="btn-primary py-2.5 px-5 text-[11px] font-900 uppercase tracking-widest" onClick={onCreateGroup}>
            Yangi guruh
          </button>
        ) : null}
      />

      <div className="card overflow-hidden border border-gray-100 shadow-sm">
        <div className="flex flex-col gap-4 border-b border-gray-100 bg-white px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <Users size={20} />
            </div>
            <div>
              <h2 className="text-lg font-900 text-gray-800">Mening guruhlarim</h2>
              <p className="text-xs font-700 uppercase tracking-widest text-gray-400">
                {filteredGroups.length} ta guruh topildi
              </p>
            </div>
          </div>

          <div className="flex w-full items-center gap-3 lg:w-auto">
            <div className="relative w-full lg:w-80">
              <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Guruh, kurs yoki xona bo'yicha qidirish..."
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm font-700 text-gray-700 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
              />
            </div>
            <div className="hidden rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-xs font-900 uppercase tracking-widest text-gray-500 lg:flex">
              {isTeacherMode ? 'Teacher Panel' : 'Admin Panel'}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3 p-5 animate-pulse">
            {[1, 2, 3, 4].map(item => (
              <div key={item} className="h-16 rounded-2xl bg-gray-100" />
            ))}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-[1200px] w-full">
                <thead>
                  <tr className="bg-gray-50/70">
                    {['Guruh nomi', 'Kurs', "Yo'nalish", "O'quv turi", 'Boshlangan sana', 'Jadval', 'Akademik', 'Xona', "Bo'sh joy", 'Amal'].map((header, index) => (
                      <th
                        key={header}
                        className={`px-4 py-4 text-left text-[11px] font-900 uppercase tracking-widest text-gray-400 ${index === 0 ? 'pl-6' : ''} ${index === 9 ? 'pr-6 text-right' : ''}`}
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredGroups.map(group => {
                    const studentCount = getStudentCount(group);
                    const capacity = Number(group.capacity || 0);
                    const freeSeats = capacity ? capacity - studentCount : 0;

                    return (
                      <tr
                        key={group.id}
                        className="group cursor-pointer transition-colors hover:bg-emerald-50/40"
                        onClick={() => setSelected(group)}
                      >
                        <td className="pl-6 pr-4 py-4">
                          <div className="min-w-[220px]">
                            <p className="text-sm font-900 text-gray-800 transition-colors group-hover:text-emerald-600">
                              {group.name}
                            </p>
                            <p className="mt-1 text-xs font-700 text-gray-400">
                              {getLessonCount(group)} ta dars
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm font-700 text-gray-700">{group.course?.name || '—'}</td>
                        <td className="px-4 py-4 text-sm font-700 text-gray-600">{getDirection(group)}</td>
                        <td className="px-4 py-4">
                          <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-900 uppercase tracking-widest text-emerald-600">
                            {getEducationType(group)}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm font-700 text-gray-600">{formatDate(group.startDate)}</td>
                        <td className="px-4 py-4">
                          <div className="min-w-[180px] text-sm font-700 text-gray-700">
                            {getTimeRange(group)}
                            <p className="mt-1 text-xs font-700 text-gray-400">
                              {(group.weekDays || []).map(day => DAYS_UZ[day]).filter(Boolean).join(', ') || '—'}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="min-w-[150px]">
                            <p className="text-sm font-800 text-gray-700">{group.teacher?.fullName || user?.fullName || '—'}</p>
                            <p className="mt-1 text-xs font-700 text-gray-400">Teacher</p>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm font-700 text-gray-600">
                          {group.room?.name || '—'}
                          {group.room?.capacity ? (
                            <p className="mt-1 text-xs font-700 text-gray-400">Sig'im: {group.room.capacity}</p>
                          ) : null}
                        </td>
                        <td className="px-4 py-4 text-sm font-900">
                          <span className={freeSeats > 0 ? 'text-emerald-600' : 'text-red-500'}>
                            {capacity ? freeSeats : '—'}
                          </span>
                          <p className="mt-1 text-xs font-700 text-gray-400">{studentCount} / {capacity || '—'} talaba</p>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              setSelected(group);
                            }}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-400 transition-all hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600"
                            aria-label="Guruhni ochish"
                          >
                            <ChevronRight size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredGroups.length === 0 && (
                    <tr>
                      <td colSpan={10} className="py-20">
                        <Empty text="Guruhlar topilmadi" />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-2 border-t border-gray-100 bg-gray-50/60 px-5 py-4 text-xs font-700 text-gray-500 lg:flex-row lg:items-center lg:justify-between">
              <p>
                {isTeacherMode ? "Teacherga biriktirilgan guruhlar soni" : "Jami guruhlar soni"}: <span className="font-900 text-gray-700">{filteredGroups.length}</span>
              </p>
              <p>
                Jami o'quvchi: <span className="font-900 text-gray-700">{filteredGroups.reduce((sum, group) => sum + getStudentCount(group), 0)}</span>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────


