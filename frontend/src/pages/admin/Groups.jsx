import React, { useEffect, useState, useMemo } from 'react';
import {
  Plus, Edit2, Trash2, ChevronLeft, ChevronRight,
  Users, GraduationCap, School, BookOpen, Search,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  groupsAPI, teachersAPI, coursesAPI, roomsAPI, attendanceAPI,
  lessonsAPI, studentsAPI, homeworkAPI,
} from '../../services/api';
import {
  PageHeader, Drawer, Field, Input, Select, Dialog, Empty, Toggle,
  Avatar, Modal, Textarea,
} from '../../components/UI';
import dayjs from 'dayjs';

const DAYS_UZ = {
  MONDAY:'Du', TUESDAY:'Se', WEDNESDAY:'Ch',
  THURSDAY:'Pa', FRIDAY:'Ju', SATURDAY:'Sh', SUNDAY:'Ya',
};
const ALL_DAYS = Object.keys(DAYS_UZ);

const defaultForm = {
  name:'', teacherId:'', courseId:'', roomId:'',
  userId:1, capacity:'', startDate:'', startTime:'', endDate:'', weekDays:[],
};

const DAY_MAP = {
  MONDAY:1, TUESDAY:2, WEDNESDAY:3,
  THURSDAY:4, FRIDAY:5, SATURDAY:6, SUNDAY:0,
};

/* ─── generateLessonDates ──────────────────────── */
function generateLessonDates(group, courseDurationMonth, courseDurationLesson, existingLessons = []) {
  if (!group?.startDate || !group?.weekDays?.length) return [];
  const today = dayjs().startOf('day')
  const start = dayjs(group.startDate).startOf('day')

  const effectiveStart = today.isAfter(start) ? today :start
  const end   = courseDurationMonth ? effectiveStart.add(courseDurationMonth, 'month') : effectiveStart.add(3, 'month');
  const usedDates = new Set(existingLessons.filter(l => l.date).map(l => dayjs(l.date).format('YYYY-MM-DD')));
  const [h, m]    = (group.startTime || '09:00').split(':').map(Number);
  const endMin    = h * 60 + m + (Number(courseDurationLesson) || 90);
  const timeRange = `${group.startTime || '09:00'} – ${String(Math.floor(endMin/60)).padStart(2,'0')}:${String(endMin%60).padStart(2,'0')}`;
  const results = [];
  let current = effectiveStart.clone();
  while (current.isBefore(end)) {
    const matchedDay = group.weekDays.find(d => DAY_MAP[d] === current.day());
    if (matchedDay) {
      const dateStr = current.format('YYYY-MM-DD');

      if(current.isSame(today,'day') || current.isAfter(today)){
        if(!usedDates.has(dateStr)){
          results.push({
            date:dateStr,
            label:`${current.format('DD.MM.YYYY')} (${DAYS_UZ[matchedDay]})-${timeRange}`
          })
        }
      }
    }
    current = current.add(1, 'day');
  }
  return results;
}

/* ─── AttCell ─────────────────────────────────── */
function AttCell({ val }) {
  if (val === 'present') return <div className="w-6 h-6 rounded-lg bg-green-500 scale-90 shadow-sm shadow-green-500/30 flex items-center justify-center text-white text-[10px]"><Plus size={10} className="rotate-45" /></div>;
  if (val === 'absent')  return <div className="w-6 h-6 rounded-lg bg-red-500 scale-90 shadow-sm shadow-red-500/30 flex items-center justify-center text-white text-[10px]">✕</div>;
  return <div className="w-6 h-6 rounded-lg border-2 border-gray-100 dark:border-white/5 opacity-50 scale-75" />;
}

/* ─── AddStudentModal ─────────────────────────── */
function AddStudentModal({ open, onClose, groupId, groupStudents, onAdded }) {
  const [all, setAll]         = useState([]);
  const [search, setSearch]   = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving]   = useState(null);
  
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    studentsAPI.getAll().then(r => setAll(r.data || [])).catch(() => toast.error('Xatolik')).finally(() => setLoading(false));
  }, [open]);

  const alreadyIds = new Set(groupStudents.map(s => s.id));
  const filtered   = all.filter(s => !alreadyIds.has(s.id) && s.fullName?.toLowerCase().includes(search.toLowerCase()));

  const handleAdd  = async s => {
    setSaving(s.id);
    try { await groupsAPI.addStudent(groupId, { studentId: s.id }); toast.success(`${s.fullName} qo'shildi`); onAdded(); }
    catch (e) { toast.error(e.response?.data?.message || 'Xatolik'); }
    finally { setSaving(null); }
  };

  if (!open) return null;
  return (
    <Modal open={open} onClose={onClose} title="O'quvchi qo'shish">
      <div className="space-y-4">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="O'quvchi ismini kiriting..."
            className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-100 dark:border-white/10 text-sm outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/50 dark:bg-white/5 font-700"/>
        </div>
        
        {loading ? <div className="py-10 text-center text-xs font-900 text-gray-400 uppercase tracking-widest">Yuklanmoqda...</div>
          : filtered.length === 0 ? <Empty text={search ? 'Natija topilmadi' : "Barcha o'quvchilar qo'shilgan"}/>
          : <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar pr-1">
              {filtered.map(s => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 hover:border-primary/30 transition-all group">
                  <div className="flex items-center gap-3">
                    <Avatar name={s.fullName} size="sm" className="ring-2 ring-white dark:ring-gray-800" />
                    <div><p className="text-xs font-800 text-gray-800 dark:text-gray-100 uppercase">{s.fullName}</p><p className="text-[10px] text-gray-400 font-700 uppercase">{s.phone || '—'}</p></div>
                  </div>
                  <button onClick={() => handleAdd(s)} disabled={saving === s.id} className="px-4 py-2 bg-primary text-white text-[10px] font-900 uppercase tracking-widest rounded-xl shadow-md shadow-primary/20 hover:scale-105 active:scale-95 transition-all">{saving === s.id ? '...' : "QO'SHISH"}</button>
                </div>
              ))}
            </div>}
        <button onClick={onClose} className="btn-secondary w-full justify-center py-3 font-900 text-xs uppercase tracking-widest mt-2">YOPISH</button>
      </div>
    </Modal>
  );
}

/* ─── AddTeacherModal ─────────────────────────── */
function AddTeacherModal({ open, onClose, group, teachers, onAdded }) {
  const [saving, setSaving] = useState(null);
  const available = teachers.filter(t => t.id !== group?.teacherId);

  const handleAssign = async t => {
    setSaving(t.id);
    try { await groupsAPI.update(group.id, { teacherId: t.id }); toast.success(`${t.fullName} biriktirildi`); onAdded(t); }
    catch (e) { toast.error(e.response?.data?.message || 'Xatolik'); }
    finally { setSaving(null); }
  };

  if (!open) return null;
  return (
    <Modal open={open} onClose={onClose} title="O'qituvchi tayinlash">
      <div className="space-y-4">
        {available.length === 0 ? <Empty text="Barcha o'qituvchilar band"/>
          : <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar pr-1">
              {available.map(t => (
                <div key={t.id} className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 hover:border-primary/30 transition-all group">
                  <div className="flex items-center gap-3">
                    <Avatar name={t.fullName} size="sm" className="ring-2 ring-white dark:ring-gray-800" />
                    <div><p className="text-xs font-800 text-gray-800 dark:text-gray-100 uppercase">{t.fullName}</p><p className="text-[10px] text-gray-400 font-700 uppercase">{t.phone || '—'}</p></div>
                  </div>
                  <button onClick={() => handleAssign(t)} disabled={saving === t.id} className="px-4 py-2 bg-primary text-white text-[10px] font-900 uppercase tracking-widest rounded-xl shadow-md shadow-primary/20 hover:scale-105 active:scale-95 transition-all">{saving === t.id ? '...' : 'TAYINLASH'}</button>
                </div>
              ))}
            </div>}
        <button onClick={onClose} className="btn-secondary w-full justify-center py-3 font-900 text-xs uppercase tracking-widest mt-2">YOPISH</button>
      </div>
    </Modal>
  );
}

export default function Groups() {
  const [groups, setGroups]     = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [courses, setCourses]   = useState([]);
  const [rooms, setRooms]       = useState([]);
  const [studentCounts, setStudentCounts] = useState({});

  const [view, setView]                     = useState('courses');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedGroup, setSelectedGroup]   = useState(null);
  const [search, setSearch]                 = useState('');

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editItem, setEditItem]     = useState(null);
  const [form, setForm]             = useState(defaultForm);
  const [deleteId, setDeleteId]     = useState(null);

  const [groupStudents, setGroupStudents]             = useState([]);
  const [detailTab, setDetailTab]                     = useState('davomat');
  const [calendarMonth, setCalendarMonth]             = useState(dayjs());
  const [attendance, setAttendance]                   = useState({});
  const [selectedLesson, setSelectedLesson]           = useState(null);
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [attendanceState, setAttendanceState]         = useState({});
  const [attendanceLoading, setAttendanceLoading]     = useState(false);
  const [attendanceSaving, setAttendanceSaving]       = useState(false);
  const [lessons, setLessons]                         = useState([]);
  const [lessonsLoading, setLessonsLoading]           = useState(false);

  const [lessonDrawerOpen, setLessonDrawerOpen] = useState(false);
  const [lessonEditItem, setLessonEditItem]     = useState(null);
  const [lessonDeleteId, setLessonDeleteId]     = useState(null);
  const [lessonForm, setLessonForm]             = useState({ title:'', date:'', description:'' });
  const [lessonSaving, setLessonSaving]         = useState(false);
  const [lessonSubTab, setLessonSubTab]         = useState('darslar');

  const [hwList, setHwList]             = useState([]);
  const [hwLoading, setHwLoading]       = useState(false);
  const [hwStatuses, setHwStatuses]     = useState({});
  const [hwDrawerOpen, setHwDrawerOpen] = useState(false);
  const [hwEditItem, setHwEditItem]     = useState(null);
  const [hwDeleteId, setHwDeleteId]     = useState(null);
  const [hwForm, setHwForm]             = useState({ lessonId:'', title:'', durationTime:'', file:null });
  const [hwSaving, setHwSaving]         = useState(false);

  const [hwDetailOpen, setHwDetailOpen]         = useState(false);
  const [hwDetail, setHwDetail]                 = useState(null);
  const [hwDetailStudents, setHwDetailStudents] = useState([]);
  const [hwDetailTab, setHwDetailTab]           = useState('kutayotgan');
  const [addStudentOpen, setAddStudentOpen]     = useState(false);
  const [addTeacherOpen, setAddTeacherOpen]     = useState(false);

  const load = async () => {
    try {
      const [g, t, c, r] = await Promise.all([groupsAPI.getAll(), teachersAPI.getAll(), coursesAPI.getAll(), roomsAPI.getAll()]);
      const gd = g.data || [];
      setGroups(gd); setTeachers(t.data || []); setCourses(c.data || []); setRooms(r.data || []);
      const cnt = {}; gd.forEach(x => { cnt[x.id] = x._count?.studentGroup ?? x.students?.length ?? 0; });
      setStudentCounts(cnt);
    } catch { toast.error('Xatolik'); }
  };

  const loadLessons = async groupId => {
    if (!groupId) return;
    setLessonsLoading(true);
    try { const r = await lessonsAPI.getAll({ groupId }); setLessons(r.data || []); }
    catch { toast.error('Darslar yuklanmadi'); }
    finally { setLessonsLoading(false); }
  };

  const loadMonthAttendance = async (group, month) => {
    try {
      const lRes = await lessonsAPI.getAll({ groupId: group.id });
      const allLessons = lRes.data || [];
      const s = month.startOf('month'), e = month.endOf('month');
      const monthLessons = allLessons.filter(l => { if (!l.date) return false; const d = dayjs(l.date); return d.isAfter(s.subtract(1,'day')) && d.isBefore(e.add(1,'day')); });
      if (!monthLessons.length) { setAttendance({}); return; }
      const results = await Promise.all(monthLessons.map(l => attendanceAPI.getByLesson(l.id).then(r => ({ lesson:l, records:r.data||[] }))));
      const map = {};
      results.forEach(({ lesson, records }) => {
        const dateKey = dayjs(lesson.date).format('YYYY-MM-DD');
        records.forEach(r => { const sId = r.student?.id ?? r.studentId; if (sId) map[`${sId}_${dateKey}`] = r.isPresent ? 'present' : 'absent'; });
      });
      setAttendance(map);
    } catch { setAttendance({}); }
  };

  const loadHwList = async lessonsList => {
    setHwLoading(true);
    try {
      const results = await Promise.all(lessonsList.map(l => homeworkAPI.getAll({ lessonId:l.id }).then(r => (r.data||[]).map(h => ({ ...h, _lessonTitle:l.title, _lessonDate:l.date }))).catch(() => [])));
      const all = results.flat(); setHwList(all);
      const statArr = await Promise.all(all.map(hw => homeworkAPI.getStudentStatuses(hw.id).then(s => ({ id:hw.id, data:s.data||{} })).catch(() => ({ id:hw.id, data:{} }))));
      const map = {}; statArr.forEach(s => { map[s.id] = s.data; }); setHwStatuses(map);
    } finally { setHwLoading(false); }
  };

  const normalizeStudents = raw => {
    if (!Array.isArray(raw)) return [];
    return raw.map(item => {
      const s = item?.student ?? item;
      return { id: s?.id ?? item?.studentId ?? item?.id, fullName: s?.fullName ?? s?.full_name ?? '—', phone: s?.phone ?? item?.phone ?? '', email: s?.email ?? item?.email ?? '' };
    }).filter(s => s.id != null);
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { if (selectedGroup) loadMonthAttendance(selectedGroup, calendarMonth); }, [calendarMonth]);

  const Breadcrumb = () => (
    <div className="flex items-center gap-2 text-[10px] font-900 text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-6">
      <button onClick={() => { setView('courses'); setSelectedCourse(null); setSelectedGroup(null); setSearch(''); }} className={`hover:text-primary transition-colors ${view === 'courses' ? 'text-primary' : ''}`}>GURUHLAR</button>
      {selectedCourse && (<><ChevronRight size={14} className="opacity-30"/><button onClick={() => { setView('groups'); setSelectedGroup(null); setSearch(''); }} className={`hover:text-primary transition-colors ${view === 'groups' ? 'text-primary' : ''}`}>{selectedCourse.name}</button></>)}
      {selectedGroup && (<><ChevronRight size={14} className="opacity-30"/><span className="text-primary">{selectedGroup.name}</span></>)}
    </div>
  );

  const openGroupDetail = async group => {
    setSelectedGroup(group); setDetailTab('davomat'); setView('detail');
    loadLessons(group.id);
    try { const r = await groupsAPI.getStudents(group.id); setGroupStudents(normalizeStudents(r.data || [])); loadMonthAttendance(group, dayjs()); }
    catch { setGroupStudents([]); }
  };

  const filteredCourses = useMemo(() => {
    if (!search) return courses;
    return courses.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()));
  }, [courses, search]);

  const courseGroups = useMemo(() => {
    if (!selectedCourse) return [];
    let list = groups.filter(g => String(g.course?.id ?? g.courseId) === String(selectedCourse.id));
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(g => g.name?.toLowerCase().includes(q) || teachers.find(t => t.id === g.teacherId)?.fullName?.toLowerCase().includes(q));
    }
    return list;
  }, [groups, selectedCourse, search, teachers]);

  const handleSave = async () => {
    try {
      const data = { name:form.name, teacherId:Number(form.teacherId), courseId:Number(form.courseId), roomId:Number(form.roomId), capacity:Number(form.capacity), startDate:form.startDate, startTime:form.startTime, weekDays:form.weekDays, userId:form.userId };
      if (editItem) { await groupsAPI.update(editItem.id, data); toast.success('Yangilandi'); }
      else { await groupsAPI.create(data); toast.success("Guruh yaratildi"); }
      setDrawerOpen(false); load();
    } catch (e) { toast.error('Xatolik'); }
  };

  const openAttendanceModal = async lesson => {
    if (!groupStudents.length) return;
    setSelectedLesson(lesson); setAttendanceModalOpen(true); setAttendanceLoading(true);
    try { const res = await attendanceAPI.getByLesson(lesson.id); const map={}; groupStudents.forEach(s=>map[s.id]={isPresent:true}); (res.data||[]).forEach(r=>map[r.studentId]={isPresent:r.isPresent,recordId:r.id}); setAttendanceState(map); }
    catch { const map={}; groupStudents.forEach(s=>map[s.id]={isPresent:true}); setAttendanceState(map); }
    finally { setAttendanceLoading(false); }
  };

  const handleAttToggle = (sid, val) => setAttendanceState(prev => ({ ...prev, [sid]: { ...prev[sid], isPresent:val } }));
  const handleSaveAtt   = async () => {
    setAttendanceSaving(true);
    try {
      const updates=[], newRecs=[];
      groupStudents.forEach(s => {
        const e = attendanceState[s.id]; if (!e) return;
        if (e.recordId) updates.push(attendanceAPI.update(e.recordId, { isPresent:e.isPresent }));
        else newRecs.push({ lessonId:selectedLesson.id, studentId:s.id, isPresent:e.isPresent, userId:1 });
      });
      await Promise.all(updates); if (newRecs.length) await attendanceAPI.bulkCreate({ records:newRecs });
      toast.success('Saqlandi'); setAttendanceModalOpen(false); loadMonthAttendance(selectedGroup, calendarMonth);
    } catch { toast.error('Xatolik'); }
    finally { setAttendanceSaving(false); }
  };

  const handleHwSave = async () => {
    if (!hwForm.lessonId || !hwForm.title) { toast.error("To'ldiring"); return; }
    setHwSaving(true);
    try {
      const data = { lessonId:Number(hwForm.lessonId), title:hwForm.title, durationTime:Number(hwForm.durationTime), userId:1 };
      let res; if (hwEditItem) res = await homeworkAPI.update(hwEditItem.id, data);
      else res = await homeworkAPI.create(data);
      if (hwForm.file) { const fd = new FormData(); fd.append('file', hwForm.file); await homeworkAPI.uploadFile(res.data?.id || hwEditItem?.id, fd); }
      toast.success("Saqlandi"); setHwDrawerOpen(false); loadHwList(lessons);
    } finally { setHwSaving(false); }
  };

  const openHwDetail = async hw => {
    setHwDetail(hw); setHwDetailTab('kutayotgan'); setHwDetailStudents([]); setHwDetailOpen(true);
    try {
      const s = await homeworkAPI.getStudentStatuses(hw.id); const d = s.data||{};
      setHwDetailStudents([...(d.submitted||[]).map(x=>({...x,_s:'topshirgan'})),...(d.notSubmitted||[]).map(x=>({...x,_s:'kutayotgan'})),...(d.late||[]).map(x=>({...x,_s:'kech'})),...(d.checked||[]).map(x=>({...x,_s:'tekshirildi'}))]);
    } catch { setHwDetailStudents([]); }
  };

  const calDays = useMemo(() => {
    if (!selectedGroup) return [];
    const s = calendarMonth.startOf('month');
    const all = Array.from({ length: calendarMonth.daysInMonth() }, (_, i) => s.add(i, 'day'));
    
    const standardDays = new Set(selectedGroup.weekDays?.map(d => DAY_MAP[d]));
    const lessonDates = new Set(lessons.filter(l => l.date).map(l => dayjs(l.date).format('YYYY-MM-DD')));
    
    return all.filter(d => {
      const dateStr = d.format('YYYY-MM-DD');
      const isStandard = standardDays.has(d.day());
      const hasLesson = lessonDates.has(dateStr);
      
      // Faqat guruh boshlangan sanadan keyingi dars kunlarini yoki dars bor kunlarni chiqarish
      const isAfterStart = d.isAfter(dayjs(selectedGroup.startDate).subtract(1, 'day'));
      
      return (isStandard && isAfterStart) || hasLesson;
    });
  }, [calendarMonth, selectedGroup, lessons]);
  const course_detail = courses.find(c => String(c.id) === String(selectedGroup?.courseId)) ?? selectedGroup?.course ?? null;
  const availableLessonDates = useMemo(() => generateLessonDates(selectedGroup, course_detail?.durationMonth, course_detail?.durationLesson, lessons), [selectedGroup, course_detail, lessons]);

  const groupDrawerEl = (
    <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={editItem ? "Guruh tahriri" : "Yangi guruh"}>
      <div className="space-y-4">
        <Field label="Guruh nomi" required><Input value={form.name} onChange={e => setForm({...form,name:e.target.value})}/></Field>
        <Field label="O'qituvchi" required><Select value={form.teacherId} onChange={e => setForm({...form,teacherId:e.target.value})}>{teachers.map(t => <option key={t.id} value={t.id}>{t.fullName}</option>)}</Select></Field>
        <Field label="Kurs" required><Select value={form.courseId} onChange={e => setForm({...form,courseId:e.target.value})}>{courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>
        <Field label="Xona" required><Select value={form.roomId} onChange={e => setForm({...form,roomId:e.target.value})}>{rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</Select></Field>
        <Field label="Dars vaqti" required><Input type="time" value={form.startTime} onChange={e => setForm({...form,startTime:e.target.value})}/></Field>
        <Field label="Boshlanish sanasi" required><Input type="date" value={form.startDate} onChange={e => setForm({...form,startDate:e.target.value})}/></Field>
        <Field label="O'quv kunlari" required>
            <div className="flex flex-wrap gap-2">
                {ALL_DAYS.map(d => <button key={d} type="button" onClick={() => setForm(f => ({ ...f, weekDays:f.weekDays.includes(d)?f.weekDays.filter(x=>x!==d):[...f.weekDays,d] }))} className={`px-4 py-2 rounded-xl text-[10px] font-900 border uppercase transition-all ${form.weekDays.includes(d)?'bg-primary border-primary text-white shadow-md shadow-primary/20':'bg-white dark:bg-white/5 border-gray-100 dark:border-white/5 text-gray-400'}`}>{DAYS_UZ[d]}</button>)}
            </div>
        </Field>
        <div className="flex gap-3 pt-6"><button onClick={() => setDrawerOpen(false)} className="btn-secondary flex-1 py-3 uppercase tracking-widest font-900 text-xs">BEKOR QILISH</button><button onClick={handleSave} className="btn-primary flex-1 py-3 uppercase tracking-widest font-900 text-xs shadow-lg shadow-primary/25">SAQLASH</button></div>
      </div>
    </Drawer>
  );

  const deleteDialogEl = (
    <Dialog open={!!deleteId} onClose={() => setDeleteId(null)} title="Guruhni o'chirish" description="Tasdiqlaysizmi?" onConfirm={async () => { await groupsAPI.delete(deleteId); load(); toast.success("O'chirildi"); }}/>
  );

  if (view === 'courses') return (
    <div className="fade-in pb-10">
      <PageHeader title="GURUXLAR BOSHQARUVI" subtitle="Platformadagi mavjud kurslar va guruhlar" actions={<button className="btn-primary py-2.5 px-6 text-[10px] font-900 uppercase tracking-widest shadow-lg shadow-primary/25 flex items-center gap-2" onClick={() => { setEditItem(null); setForm(defaultForm); setDrawerOpen(true); }}><Plus size={16}/> Yangi Guruh</button>}/>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8">
        {filteredCourses.map(c => (
            <div key={c.id} onClick={() => { setSelectedCourse(c); setView('groups'); }} className="card p-6 cursor-pointer hover:shadow-2xl transition-all group relative overflow-hidden bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 ring-0 hover:ring-2 hover:ring-primary/20">
               <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 shadow-inner"><BookOpen size={24}/></div>
               <h3 className="text-sm font-900 text-gray-800 dark:text-gray-100 uppercase tracking-tight mb-2 group-hover:text-primary transition-colors">{c.name}</h3>
               <div className="flex items-center gap-4 text-[10px] font-800 text-gray-400 uppercase tracking-widest">
                  <span className="flex items-center gap-1"><Users size={12}/> {groups.filter(g => String(g.course?.id ?? g.courseId) === String(c.id)).length} GURUH</span>
               </div>
               <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-primary/5 group-hover:scale-150 transition-transform" />
            </div>
        ))}
        {filteredCourses.length === 0 && <div className="col-span-full py-20"><Empty icon="🔍" text="Kurslar topilmadi"/></div>}
      </div>
      {groupDrawerEl}{deleteDialogEl}
    </div>
  );

  if (view === 'groups') return (
    <div className="fade-in pb-10">
      <Breadcrumb/>
      <PageHeader title={selectedCourse?.name || 'GURUHLAR'} subtitle={`${courseGroups.length} ta mavjud guruhlar`} actions={<button className="btn-primary py-2.5 px-6 text-[10px] font-900 uppercase tracking-widest shadow-lg shadow-primary/25" onClick={() => { setEditItem(null); setForm(defaultForm); setDrawerOpen(true); }}><Plus size={16}/> Guruh qo'shish</button>}/>
      <div className="card overflow-hidden mt-8 shadow-2xl shadow-primary/5 border border-gray-100 dark:border-white/5">
        <table className="w-full text-left">
          <thead><tr className="bg-gray-50/50 dark:bg-white/5 text-[10px] font-900 text-gray-400 dark:text-gray-500 uppercase tracking-widest border-b border-gray-100 dark:border-white/5"><th className="py-5 px-6">GURUH NOMI</th><th className="py-5 px-6">DARS VAQTI</th><th className="py-5 px-6">O'QITUVCHI</th><th className="py-5 px-6">O'QUVCHILAR</th><th className="py-5 px-6">AMALLAR</th></tr></thead>
          <tbody>
            {courseGroups.map(g => (
              <tr key={g.id} onClick={() => openGroupDetail(g)} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors cursor-pointer border-b border-gray-50 dark:border-white/5 group">
                <td className="py-5 px-6"><p className="font-900 text-gray-800 dark:text-gray-100 text-sm uppercase tracking-tight group-hover:text-primary transition-colors">{g.name}</p></td>
                <td className="py-5 px-6"><p className="text-[11px] font-900 text-gray-700 dark:text-gray-200 uppercase mb-0.5">⏰ {g.startTime}</p><p className="text-[10px] text-gray-400 font-700 uppercase tracking-widest">{g.weekDays?.map(d=>DAYS_UZ[d]).join(', ')}</p></td>
                <td className="py-5 px-6"><div className="flex items-center gap-3"><Avatar name={g.teacher?.fullName} size="sm"/><span className="text-[11px] font-900 text-gray-700 dark:text-gray-200 uppercase tracking-tight">{g.teacher?.fullName||'TAYINLANMAGAN'}</span></div></td>
                <td className="py-5 px-6"><span className="inline-flex items-center justify-center min-w-[28px] h-7 rounded-lg bg-primary/10 text-primary text-[11px] font-900 shadow-inner px-2">{studentCounts[g.id] || 0}</span></td>
                <td className="py-5 px-6 flex items-center gap-2" onClick={e => e.stopPropagation()}><button onClick={() => { setEditItem(g); setForm({...g, startDate:dayjs(g.startDate).format('YYYY-MM-DD')}); setDrawerOpen(true); }} className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-all flex items-center justify-center shadow-sm"><Edit2 size={13}/></button><button onClick={() => setDeleteId(g.id)} className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-900/10 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center shadow-sm"><Trash2 size={13}/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {groupDrawerEl}{deleteDialogEl}
    </div>
  );

  if (view === 'detail') return (
    <div className="fade-in pb-10">
      <Breadcrumb/>
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner"><Users size={28}/></div>
          <div><h1 className="text-2xl font-900 text-gray-800 dark:text-gray-100 uppercase tracking-tight mb-0.5">{selectedGroup?.name}</h1><p className="text-xs text-gray-400 font-900 uppercase tracking-widest">{selectedGroup?.course?.name || 'GURUH'}</p></div>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto"><button className="btn-secondary flex-1 md:flex-none justify-center py-2.5 px-6 text-[10px] font-900 uppercase tracking-widest shadow-sm" onClick={() => setAddTeacherOpen(true)}>O'QITUVCHI QO'SHISH</button><button className="btn-primary flex-1 md:flex-none justify-center py-2.5 px-6 text-[10px] font-900 uppercase tracking-widest shadow-lg shadow-primary/25" onClick={() => setAddStudentOpen(true)}>O'QUVCHI QO'SHISH</button></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <div className="card p-6 shadow-xl shadow-primary/5 border border-gray-100 dark:border-white/5"><h3 className="font-900 text-gray-800 dark:text-gray-100 text-[11px] mb-6 flex items-center gap-3 uppercase tracking-widest leading-none"><span className="w-1.5 h-1.5 rounded-full bg-primary shadow-sm shadow-primary/50"/>TAFSILOTLAR</h3>
            <div className="space-y-4 font-800 uppercase tracking-tighter">
              {[ ['Kurs nomi', selectedGroup?.course?.name||'—'], ["Kurs to'lovi", selectedGroup?.course?`${Number(selectedGroup.course.price||0).toLocaleString()} so'm`:'—'], ["Dars kunlari", selectedGroup?.weekDays?.map(d=>DAYS_UZ[d]).join(', ')||'—'], ['Dars vaqti', selectedGroup?.startTime||'—'], ["Sanasi", selectedGroup?.startDate?dayjs(selectedGroup.startDate).format('DD.MM.YYYY'):'—'] ].map(([k,v]) => <div key={k} className="flex justify-between items-center bg-gray-50/50 dark:bg-white/5 p-3 rounded-2xl border border-gray-100 dark:border-white/5"><span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">{k}</span><span className="text-xs text-gray-700 dark:text-gray-200 text-right max-w-[60%] truncate">{v}</span></div>)}
            </div>
          </div>
          <div className="card p-6 shadow-xl shadow-primary/5 border border-gray-100 dark:border-white/5"><h3 className="font-900 text-gray-800 dark:text-gray-100 text-[11px] mb-6 flex items-center gap-3 uppercase tracking-widest leading-none"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50"/>O'QITUVCHI</h3>
            {selectedGroup?.teacher ? <div className="flex items-center gap-4 p-4 bg-blue-50/30 dark:bg-blue-900/10 rounded-2xl border border-blue-100/50 dark:border-blue-900/20"><Avatar name={selectedGroup.teacher.fullName} size="md" className="ring-4 ring-white dark:ring-gray-800" /><div className="flex-1 min-w-0"><p className="font-900 text-sm text-gray-800 dark:text-gray-100 truncate uppercase tracking-tight">{selectedGroup.teacher.fullName}</p><p className="text-[10px] text-gray-400 font-700 truncate tracking-widest">{selectedGroup.teacher.phone||'—'}</p></div></div> : <Empty text="Biriktirilmagan"/>}
          </div>
          <div className="card p-6 shadow-xl shadow-primary/5 border border-gray-100 dark:border-white/5"><h3 className="font-900 text-gray-800 dark:text-gray-100 text-[11px] mb-6 flex items-center gap-3 uppercase tracking-widest leading-none"><span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-sm shadow-green-500/50"/>O'QUVCHILAR ({groupStudents.length})</h3>
            <div className="space-y-2.5 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">{groupStudents.map(s => <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50/50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 group hover:border-primary/30 transition-all"><div className="flex items-center gap-3"><Avatar name={s.fullName} size="sm" className="ring-2 ring-white dark:ring-gray-800" /><div><p className="font-800 text-xs text-gray-800 dark:text-gray-100 leading-tight truncate uppercase">{s.fullName}</p><p className="text-[9px] text-gray-400 font-700 tracking-widest uppercase">{s.phone||'—'}</p></div></div><span className="w-1.5 h-1.5 rounded-full bg-green-500" /></div>)}{groupStudents.length===0 && <Empty text="Talabalar yo'q"/>}</div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6 shadow-xl shadow-primary/5 min-h-[600px] border border-gray-100 dark:border-white/5">
            <div className="flex gap-1 p-1 bg-gray-100/50 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/5 w-fit mb-8">{['davomat','lessons'].map(t => <button key={t} onClick={() => setDetailTab(t)} className={`px-8 py-3 rounded-xl text-[10px] font-900 uppercase tracking-widest transition-all ${detailTab===t?'bg-primary text-white shadow-lg shadow-primary/25':'text-gray-400 hover:text-gray-700'}`}>{t==='davomat'?'DAVOMAT':'DARSLAR'}</button>)}</div>

            {detailTab === 'davomat' ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-4"><h4 className="text-[11px] font-900 text-gray-400 dark:text-gray-500 uppercase tracking-widest">Oylik Davomat</h4><div className="flex items-center gap-4 p-1 bg-gray-100 dark:bg-white/10 rounded-2xl border border-gray-200 dark:border-white/10"><button onClick={() => setCalendarMonth(m => m.subtract(1,'month'))} className="w-8 h-8 rounded-xl bg-white dark:bg-white/10 flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-sm"><ChevronLeft size={16}/></button><span className="text-[11px] font-900 text-gray-800 dark:text-gray-100 min-w-[120px] text-center uppercase tracking-widest">{calendarMonth.format('MMMM YYYY')}</span><button onClick={() => setCalendarMonth(m => m.add(1,'month'))} className="w-8 h-8 rounded-xl bg-white dark:bg-white/10 flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-sm"><ChevronRight size={16}/></button></div></div>
                <div className="overflow-x-auto custom-scrollbar-h rounded-2xl border border-gray-100 dark:border-white/10"><table className="w-full text-left"><thead><tr className="bg-gray-50 dark:bg-white/5 text-[9px] font-900 text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-white/10"><th className="py-4 px-4 sticky left-0 bg-gray-50 dark:bg-[#1C1C26] min-w-[200px] z-10">TALABA F.I.O</th>{calDays.map(d => <th key={d.format('DD')} className="py-2 px-1 text-center min-w-[40px]"><div className="opacity-60">{d.format('ddd').toUpperCase()}</div><div className={`text-xs mt-0.5 ${d.day()===0?'text-red-500':'text-gray-700 dark:text-gray-300'}`}>{d.format('D')}</div></th>)}</tr></thead><tbody>{groupStudents.map(s => <tr key={s.id} className="border-t border-gray-50 dark:border-white/5 hover:bg-gray-50/20 transition-all"><td className="py-4 px-4 sticky left-0 bg-white dark:bg-[#1A1A23] z-10 border-r border-gray-50 dark:border-white/10"><div className="flex items-center gap-2"><Avatar name={s.fullName} size="xs"/><span className="text-[10px] font-900 text-gray-700 dark:text-gray-200 uppercase truncate max-w-[150px]">{s.fullName}</span></div></td>{calDays.map(d => <td key={d.format('DD')} className="py-4 px-1 text-center border-l border-gray-50 dark:border-white/10"><AttCell val={attendance[`${s.id}_${d.format('YYYY-MM-DD')}`]}/></td>)}</tr>)}</tbody></table>{groupStudents.length===0 && <div className="py-20"><Empty text="Ro'yxat bo'sh"/></div>}</div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4"><div className="flex gap-1 p-1 bg-gray-100 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/5">{['darslar','uyga-vazifa'].map(st => <button key={st} onClick={() => { setLessonSubTab(st); if(st==='uyga-vazifa'&&hwList.length===0) loadHwList(lessons); }} className={`px-5 py-2 rounded-xl text-[9px] font-900 uppercase tracking-widest transition-all ${lessonSubTab===st?'bg-primary text-white shadow-md shadow-primary/20':'text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-200'}`}>{st==='darslar'?'DARSLIKLAR':'VAZIFALAR'}</button>)}</div>{lessonSubTab==='darslar' ? <button onClick={() => { setLessonEditItem(null); setLessonForm({title:'',date:'',description:''}); setLessonDrawerOpen(true); }} className="btn-primary py-2 px-5 text-[10px] font-900 uppercase tracking-widest shadow-lg shadow-primary/20 flex items-center gap-2"><Plus size={14}/> Dars qo'shish</button> : <button onClick={() => { setHwEditItem(null); setHwForm({lessonId:'',title:'',durationTime:'',file:null}); setHwDrawerOpen(true); }} className="btn-primary py-2 px-5 text-[10px] font-900 uppercase tracking-widest shadow-lg shadow-primary/20 flex items-center gap-2"><Plus size={14}/> Vazifa qo'shish</button>}</div>

                {lessonSubTab==='darslar' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{lessonsLoading ? <div className="col-span-2 py-10"><Empty text="Yuklanmoqda..."/></div> : lessons.length===0 ? <div className="col-span-2 py-20 bg-gray-50/50 dark:bg-white/5 border border-dashed border-gray-100 dark:border-white/10 rounded-3xl"><Empty text="Darslar yo'q"/></div> : lessons.map((l, i) => <div key={l.id} className="card p-5 group hover:border-primary/40 transition-all hover:shadow-xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 relative overflow-hidden"><div className="flex justify-between items-start mb-4 relative z-10"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-900 text-xs shadow-inner">#{i+1}</div><div><h5 className="font-900 text-gray-800 dark:text-gray-100 text-sm tracking-tight truncate pr-8 uppercase">{l.title}</h5><p className="text-[10px] text-gray-400 font-900 uppercase tracking-widest">{l.date?dayjs(l.date).format('DD.MM.YYYY'):'—'}</p></div></div><div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all absolute right-0 top-0"><button onClick={() => { setLessonEditItem(l); setLessonForm({title:l.title,date:dayjs(l.date).format('YYYY-MM-DD'),description:l.description}); setLessonDrawerOpen(true); }} className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-all flex items-center justify-center shadow-sm"><Edit2 size={12}/></button><button onClick={() => setLessonDeleteId(l.id)} className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-900/10 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center shadow-sm"><Trash2 size={12}/></button></div></div><p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 mb-4 leading-relaxed font-700 bg-gray-50/50 dark:bg-white/5 p-3 rounded-xl border border-gray-100 dark:border-white/5 relative z-10">{l.description||'—'}</p><div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50 dark:border-white/5 relative z-10"><div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-sm" /><span className="text-[9px] font-900 text-gray-400 uppercase tracking-widest">YAKUNLANDI</span></div><button onClick={() => openAttendanceModal(l)} className="px-5 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[9px] font-900 uppercase tracking-widest rounded-xl hover:bg-primary hover:text-white transition-all shadow-md">Davomatni olish</button></div></div>)}</div>
                )}

                {lessonSubTab==='uyga-vazifa' && (
                  <div className="overflow-hidden rounded-3xl border border-gray-100 dark:border-white/5 shadow-2xl shadow-primary/5 bg-white dark:bg-white/5">{hwLoading ? <div className="py-20"><Empty text="Yuklanmoqda..."/></div> : hwList.length===0 ? <div className="py-20"><Empty text="Vazifalar yo'q"/></div> : <div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="bg-gray-50 dark:bg-white/10 text-[9px] font-900 text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-white/5"><th className="py-4 px-6">#</th><th className="py-4 px-6">VAZIFA MAVZUSI</th><th className="py-4 px-6">TOPHSHIRDI</th><th className="py-4 px-6">SANA</th><th className="py-4 px-6">AMALLAR</th></tr></thead><tbody>{hwList.map((hw,idx) => { const st=hwStatuses[hw.id]||{}; const sub=(st.submitted?.length||0)+(st.late?.length||0)+(st.checked?.length||0); return <tr key={hw.id} className="border-t border-gray-100 dark:border-white/5 hover:bg-gray-50/50 dark:hover:bg-white/10 transition-colors group"><td className="py-5 px-6 text-[10px] font-900 text-gray-400 uppercase">#{(idx+1).toString().padStart(2,'0')}</td><td className="py-5 px-6" onClick={() => openHwDetail(hw)}><div className="cursor-pointer font-900 text-gray-800 dark:text-gray-100 text-sm uppercase tracking-tight hover:text-primary transition-colors">{hw.title}</div><p className="text-[9px] text-gray-400 font-800 uppercase tracking-widest mt-1">Dars: {hw._lessonTitle || '—'}</p></td><td className="py-5 px-6"><span className="px-3 py-1 bg-gray-100 dark:bg-white/10 rounded-lg font-900 text-[10px] text-gray-700 dark:text-gray-300">{sub} o'quvchi</span></td><td className="py-5 px-6 text-[10px] font-900 text-gray-700 dark:text-gray-200 uppercase">{dayjs(hw.created_at).format('DD.MM.YYYY')}</td><td className="py-5 px-6 flex items-center justify-end gap-2"><button onClick={() => { setHwEditItem(hw); setHwForm({lessonId:String(hw.lessonId),title:hw.title,durationTime:String(hw.durationTime),file:null}); setHwDrawerOpen(true); }} className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-all flex items-center justify-center shadow-sm"><Edit2 size={13}/></button><button onClick={() => setHwDeleteId(hw.id)} className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-900/10 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center shadow-sm"><Trash2 size={13}/></button></td></tr>; })}</tbody></table></div>}</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Drawer open={lessonDrawerOpen} onClose={() => setLessonDrawerOpen(false)} title={lessonEditItem ? "Dars tahriri" : "Yangi dars"}>
        <div className="space-y-4"><Field label="Dars mavzusi" required><Input value={lessonForm.title} onChange={e => setLessonForm({...lessonForm,title:e.target.value})}/></Field><Field label="Dars sanasi" required><Select value={lessonForm.date} onChange={e => setLessonForm({...lessonForm,date:e.target.value})}><option value="">Tanlang</option>{availableLessonDates.map(d => <option key={d.date} value={d.date}>{d.label}</option>)}</Select></Field><Field label="Tavsif"><Textarea value={lessonForm.description} onChange={e => setLessonForm({...lessonForm,description:e.target.value})} rows={5}/></Field><div className="flex gap-3 pt-6"><button onClick={() => setLessonDrawerOpen(false)} className="btn-secondary flex-1 py-3 font-900 text-xs uppercase tracking-widest">BEKOR QILISH</button><button disabled={lessonSaving} onClick={async () => { if (!lessonForm.title || !lessonForm.date) { toast.error("To'ldiring"); return; } setLessonSaving(true); try { if (lessonEditItem) await lessonsAPI.update(lessonEditItem.id, lessonForm); else await lessonsAPI.create({...lessonForm, groupId:selectedGroup.id, userId:1}); toast.success("Saqlandi"); setLessonDrawerOpen(false); loadLessons(selectedGroup.id); } catch { toast.error("Xato"); } finally { setLessonSaving(false); } }} className="btn-primary flex-1 py-3 font-900 text-xs uppercase tracking-widest shadow-lg shadow-primary/25">{lessonSaving?'SAQLANMOQDA...':'SAQLASH'}</button></div></div>
      </Drawer>

      <Drawer open={hwDrawerOpen} onClose={() => setHwDrawerOpen(false)} title={hwEditItem ? "Vazifa tahriri" : "Yangi vazifa"}>
        <div className="space-y-4"><Field label="Dars" required><Select value={hwForm.lessonId} onChange={e => setHwForm({...hwForm,lessonId:e.target.value})}>{lessons.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}</Select></Field><Field label="Vazifa nomi" required><Input value={hwForm.title} onChange={e => setHwForm({...hwForm,title:e.target.value})}/></Field><Field label="Muddat (soat)"><Input type="number" value={hwForm.durationTime} onChange={e => setHwForm({...hwForm,durationTime:e.target.value})}/></Field><Field label="Fayl"><label className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-2xl cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 border-gray-100 dark:border-white/10 uppercase font-900 text-[10px] text-gray-400"><Plus size={24} className="mb-2 text-gray-300"/>{hwForm.file ? hwForm.file.name : 'Vazifa faylini tanlang'}<input type="file" className="hidden" onChange={e => setHwForm({...hwForm,file:e.target.files[0]||null})}/></label></Field><div className="flex gap-3 pt-6"><button onClick={() => setHwDrawerOpen(false)} className="btn-secondary flex-1 py-3 font-900 text-xs uppercase tracking-widest">BEKOR QILISH</button><button onClick={handleHwSave} disabled={hwSaving} className="btn-primary flex-1 py-3 font-900 text-xs uppercase tracking-widest shadow-lg shadow-primary/25">{hwSaving?'SAQLANMOQDA...':'SAQLASH'}</button></div></div>
      </Drawer>

      <Modal open={attendanceModalOpen} onClose={() => setAttendanceModalOpen(false)} title={selectedLesson?.title||'DAVOMAT'}>
        <div className="space-y-4">{attendanceLoading ? <div className="py-10 text-center text-xs font-900 tracking-widest animate-pulse">YUKLANMOQDA...</div> : <><div className="max-h-[400px] overflow-y-auto space-y-2.5 custom-scrollbar pr-1">{groupStudents.map(s => <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50/50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5"><div className="flex items-center gap-3"><Avatar name={s.fullName} size="sm"/><span className="text-xs font-800 text-gray-800 dark:text-gray-100 uppercase tracking-tight">{s.fullName}</span></div><div className="flex gap-1"><button onClick={() => handleAttToggle(s.id, true)} className={`px-5 py-2 rounded-xl text-[10px] font-900 transition-all ${attendanceState[s.id]?.isPresent?'bg-green-500 text-white shadow-md shadow-green-500/20':'bg-gray-100 dark:bg-white/5 text-gray-400'}`}>BOR</button><button onClick={() => handleAttToggle(s.id, false)} className={`px-5 py-2 rounded-xl text-[10px] font-900 transition-all ${attendanceState[s.id]?.isPresent===false?'bg-red-500 text-white shadow-md shadow-red-500/20':'bg-gray-100 dark:bg-white/5 text-gray-400'}`}>YO'Q</button></div></div>)}</div><div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-white/5"><button onClick={() => setAttendanceModalOpen(false)} className="btn-secondary flex-1 py-3 font-900 text-xs uppercase tracking-widest">YOPISH</button><button onClick={handleSaveAtt} disabled={attendanceSaving} className="btn-primary flex-1 py-3 font-900 text-xs uppercase tracking-widest shadow-lg shadow-primary/25">{attendanceSaving?'SAQLANMOQDA...':'SAQLASH'}</button></div></>}</div>
      </Modal>

      <Modal open={hwDetailOpen} onClose={() => setHwDetailOpen(false)} title="VAZIFA HOLATI">
        {hwDetail && (
          <div className="space-y-4"><div className="grid grid-cols-2 gap-3">{[ ['Topshirish muddati',`${hwDetail.durationTime} soat`], ['Berilgan sana',dayjs(hwDetail.created_at).format('DD.MM.YYYY')] ].map(([l,v]) => <div key={l} className="bg-gray-50 dark:bg-white/5 p-3 rounded-2xl border border-gray-100 dark:border-white/5"><p className="text-[9px] font-900 text-gray-400 uppercase mb-0.5">{l}</p><p className="text-xs font-800 text-gray-800 dark:text-gray-200">{v}</p></div>)}</div><div className="flex gap-2 flex-wrap">{[ {k:'kutayotgan',l:'KUTMOQDA'}, {k:'topshirgan',l:'TOPSHIRDI'}, {k:'tekshirildi',l:'TEKSHIRILDI'} ].map(t => <button key={t.k} onClick={() => setHwDetailTab(t.k)} className={`px-5 py-2.5 rounded-xl text-[10px] font-900 uppercase tracking-widest transition-all ${hwDetailTab===t.k?'bg-primary text-white shadow-lg shadow-primary/20':'bg-gray-50 dark:bg-white/5 text-gray-400'}`}>{t.l}</button>)}</div><div className="max-h-60 overflow-y-auto space-y-2 custom-scrollbar pr-1">{hwDetailStudents.filter(s => { const cur=hwDetailTab; if(cur==='kutayotgan') return s._s==='kutayotgan'; if(cur==='topshirgan') return s._s==='topshirgan'||s._s==='kech'; return s._s==='tekshirildi'; }).map((s,i) => <div key={i} className="flex items-center justify-between p-3 bg-gray-50/50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5"><div className="flex items-center gap-3"><Avatar name={s.fullName||s.student?.fullName} size="xs"/><span className="text-[11px] font-800 text-gray-700 dark:text-gray-200 uppercase tracking-tight truncate max-w-[150px]">{s.fullName||s.student?.fullName}</span></div><span className={`text-[9px] font-900 px-3 py-1.5 rounded-lg ${s._s==='topshirgan'?'bg-green-100 text-green-600':s._s==='kech'?'bg-amber-100 text-amber-600':s._s==='tekshirildi'?'bg-blue-100 text-blue-600':'bg-gray-100 text-gray-500'}`}>{s._s.toUpperCase()}</span></div>)}</div><button onClick={() => setHwDetailOpen(false)} className="btn-secondary w-full py-3 font-900 text-xs uppercase tracking-widest mt-2 px-6">YOPISH</button></div>
        )}
      </Modal>

      <AddStudentModal open={addStudentOpen} onClose={() => setAddStudentOpen(false)} groupId={selectedGroup?.id} groupStudents={groupStudents} onAdded={() => { load(); groupsAPI.getStudents(selectedGroup.id).then(r => setGroupStudents(normalizeStudents(r.data||[]))); }} />
      <AddTeacherModal open={addTeacherOpen} onClose={() => setAddTeacherOpen(false)} group={selectedGroup} teachers={teachers} onAdded={(t) => { setSelectedGroup({...selectedGroup, teacherId: t.id, teacher: t}); load(); }} />
      <Dialog open={!!lessonDeleteId} onClose={() => setLessonDeleteId(null)} title="Darsni o'chirish" description="Tasdiqlaysizmi?" onConfirm={async () => { await lessonsAPI.delete(lessonDeleteId); setLessonDeleteId(null); toast.success("O'chirildi"); loadLessons(selectedGroup.id); }}/>
      <Dialog open={!!hwDeleteId} onClose={() => setHwDeleteId(null)} title="Vazifani o'chirish" description="Tasdiqlaysizmi?" onConfirm={async () => { await homeworkAPI.delete(hwDeleteId); setHwDeleteId(null); toast.success("O'chirildi"); loadHwList(lessons); }}/>
      {groupDrawerEl}{deleteDialogEl}
    </div>
  );
}
