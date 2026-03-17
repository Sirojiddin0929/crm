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
  Avatar, StatCard, Modal, Textarea,
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
  if (val === 'present') return <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-green-100 text-green-600 text-[10px] font-700">✓ Bor</span>;
  if (val === 'absent')  return <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-red-100 text-red-500 text-[10px] font-700">✗ Yo'q</span>;
  return <span className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-gray-100 text-gray-200 text-xs">○</span>;
}

/* ─── AddStudentModal ─────────────────────────── */
function AddStudentModal({ open, onClose, groupId, groupStudents, onAdded }) {
  const [all, setAll]         = React.useState([]);
  const [search, setSearch]   = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving]   = React.useState(null);
  React.useEffect(() => {
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
      <div className="space-y-3">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Qidirish..."
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary"/>
        {loading ? <p className="text-xs text-gray-400 text-center py-6">Yuklanmoqda...</p>
          : filtered.length === 0 ? <p className="text-xs text-gray-400 text-center py-6">{search ? 'Topilmadi' : "Barcha o'quvchilar guruhda"}</p>
          : <div className="space-y-1 max-h-72 overflow-y-auto">
              {filtered.map(s => (
                <div key={s.id} className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-gray-50">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-700">{s.fullName?.charAt(0) || '?'}</div>
                    <div><p className="text-sm font-700 text-gray-800">{s.fullName}</p><p className="text-xs text-gray-400">{s.phone || s.email || '—'}</p></div>
                  </div>
                  <button onClick={() => handleAdd(s)} disabled={saving === s.id} className="btn-primary text-xs px-3 py-1">{saving === s.id ? '...' : "Qo'shish"}</button>
                </div>
              ))}
            </div>}
        <button onClick={onClose} className="btn-secondary w-full justify-center mt-2">Yopish</button>
      </div>
    </Modal>
  );
}

/* ─── AddTeacherModal ─────────────────────────── */
function AddTeacherModal({ open, onClose, group, teachers, onAdded }) {
  const [saving, setSaving] = React.useState(null);
  const available = teachers.filter(t => t.id !== group?.teacherId);
  const handleAssign = async t => {
    setSaving(t.id);
    try { await groupsAPI.update(group.id, { teacherId: t.id }); toast.success(`${t.fullName} biriktirildi`); onAdded(t); }
    catch (e) { toast.error(e.response?.data?.message || 'Xatolik'); }
    finally { setSaving(null); }
  };
  if (!open) return null;
  return (
    <Modal open={open} onClose={onClose} title="O'qituvchi biriktirish">
      <div className="space-y-3">
        {available.length === 0 ? <p className="text-xs text-gray-400 text-center py-6">O'qituvchilar topilmadi</p>
          : <div className="space-y-1 max-h-72 overflow-y-auto">
              {available.map(t => (
                <div key={t.id} className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-gray-50">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-700">{t.fullName?.charAt(0) || '?'}</div>
                    <div><p className="text-sm font-700 text-gray-800">{t.fullName}</p><p className="text-xs text-gray-400">{t.phone || t.email || '—'}</p></div>
                  </div>
                  <button onClick={() => handleAssign(t)} disabled={saving === t.id} className="btn-primary text-xs px-3 py-1">{saving === t.id ? '...' : 'Biriktirish'}</button>
                </div>
              ))}
            </div>}
        <button onClick={onClose} className="btn-secondary w-full justify-center mt-2">Yopish</button>
      </div>
    </Modal>
  );
}

/* ═══════════════════════════════════════════════
   MAIN
═══════════════════════════════════════════════ */
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

  // ── lesson states ──
  const [lessonDrawerOpen, setLessonDrawerOpen] = useState(false);
  const [lessonEditItem, setLessonEditItem]     = useState(null);
  const [lessonDeleteId, setLessonDeleteId]     = useState(null);
  const [lessonForm, setLessonForm]             = useState({ title:'', date:'', description:'' });
  const [lessonSaving, setLessonSaving]         = useState(false);
  const [lessonSubTab, setLessonSubTab]         = useState('darslar');

  // ── homework states ──
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

  // ── helpers ──
  const buildCounts = list => {
    const c = {};
    list.forEach(g => { c[g.id] = g._count?.studentGroup ?? g.students?.length ?? 0; });
    return c;
  };

  const normalizeStudents = raw => {
    if (!Array.isArray(raw)) return [];
    return raw.map(item => {
      const s = item?.student ?? item;
      return { id: s?.id ?? item?.studentId ?? item?.id, fullName: s?.fullName ?? s?.full_name ?? '—', phone: s?.phone ?? item?.phone ?? '', email: s?.email ?? item?.email ?? '', createdAt: item?.createdAt ?? s?.createdAt ?? '' };
    }).filter(s => s.id != null);
  };

  // ── loaders ──
  const load = async () => {
    try {
      const [g, t, c, r] = await Promise.all([groupsAPI.getAll(), teachersAPI.getAll(), coursesAPI.getAll(), roomsAPI.getAll()]);
      const gd = g.data || [];
      setGroups(gd); setTeachers(t.data || []); setCourses(c.data || []); setRooms(r.data || []);
      setStudentCounts(buildCounts(gd));
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
        records.forEach(r => { const sId = r.student?.id ?? r.studentId; if (sId && dateKey) map[`${sId}_${dateKey}`] = r.isPresent ? 'present' : 'absent'; });
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

  useEffect(() => { load(); }, []);
  useEffect(() => { if (selectedGroup) loadMonthAttendance(selectedGroup, calendarMonth); }, [calendarMonth]);

  const openCourse = course => { setSelectedCourse(course); setSearch(''); setView('groups'); };

  const openGroupDetail = async group => {
    setSelectedGroup(group); setDetailTab('davomat'); setAttendance({}); setCalendarMonth(dayjs());
    setLessonSubTab('darslar'); setHwList([]); setView('detail');
    loadLessons(group.id);
    try { const r = await groupsAPI.getStudents(group.id); setGroupStudents(normalizeStudents(r.data || [])); loadMonthAttendance(group, dayjs()); }
    catch { setGroupStudents([]); }
  };

  const courseGroups = useMemo(() => {
    if (!selectedCourse) return [];
    let list = groups.filter(g => String(g.course?.id ?? g.courseId) === String(selectedCourse.id));
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(g => { const t = teachers.find(t => String(t.id) === String(g.teacherId)); const r = rooms.find(r => r.id === g.roomId); return g.name?.toLowerCase().includes(q) || t?.fullName?.toLowerCase().includes(q) || r?.name?.toLowerCase().includes(q); });
    }
    return list;
  }, [groups, selectedCourse, search, teachers, rooms]);

  const filteredCourses = useMemo(() => {
    if (!search) return courses;
    return courses.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()));
  }, [courses, search]);

  // ── Breadcrumb ──
  const Breadcrumb = () => (
    <div className="flex items-center gap-1.5 text-xs font-700 text-gray-400 mb-4 flex-wrap">
      <button onClick={() => { setView('courses'); setSelectedCourse(null); setSelectedGroup(null); setSearch(''); }} className={`hover:text-primary transition-colors ${view === 'courses' ? 'text-primary' : ''}`}>Guruhlar</button>
      {selectedCourse && (<><ChevronRight size={12} className="text-gray-300"/><button onClick={() => { setView('groups'); setSelectedGroup(null); setSearch(''); }} className={`hover:text-primary transition-colors ${view === 'groups' ? 'text-primary' : ''}`}>{selectedCourse.name}</button></>)}
      {selectedGroup && (<><ChevronRight size={12} className="text-gray-300"/><span className="text-primary">{selectedGroup.name}</span></>)}
    </div>
  );

  // ── Group CRUD ──
  const handleSave = async () => {
    try {
      const data = { name:form.name, teacherId:Number(form.teacherId), courseId:Number(form.courseId), roomId:Number(form.roomId), capacity:Number(form.capacity), startDate:form.startDate, startTime:form.startTime, weekDays:form.weekDays, userId:form.userId };
      if (editItem) { await groupsAPI.update(editItem.id, data); toast.success('Yangilandi'); }
      else { await groupsAPI.create(data); toast.success("Guruh yaratildi"); }
      setDrawerOpen(false); load();
    } catch (e) { toast.error(e.response?.data?.message || 'Xatolik'); }
  };
  const openAdd  = () => { setEditItem(null); setForm(defaultForm); setDrawerOpen(true); };
  const openEdit = g => { setEditItem(g); setForm({ name:g.name||'', teacherId:g.teacherId||'', courseId:g.courseId||'', roomId:g.roomId||'', userId:g.userId||1, capacity:g.capacity||'', startDate:g.startDate?dayjs(g.startDate).format('YYYY-MM-DD'):'', startTime:g.startTime||'', endDate:'', weekDays:g.weekDays||[] }); setDrawerOpen(true); };

  // ── Lesson CRUD ──
  const openLessonAdd = () => { setLessonEditItem(null); setLessonForm({ title:'', date:'', description:'' }); setLessonDrawerOpen(true); };
  const openLessonEdit = lesson => { setLessonEditItem(lesson); setLessonForm({ title: lesson.title||'', date: lesson.date ? dayjs(lesson.date).format('YYYY-MM-DD') : '', description: lesson.description||'' }); setLessonDrawerOpen(true); };
  const closeLessonDrawer = () => { setLessonDrawerOpen(false); setLessonEditItem(null); setLessonForm({ title:'', date:'', description:'' }); };

  // ── Homework CRUD ──
  const openHwAdd = () => { setHwEditItem(null); setHwForm({ lessonId:'', title:'', durationTime:'', file:null }); setHwDrawerOpen(true); };
  const openHwEdit = hw => {
    setHwEditItem(hw);
    setHwForm({ lessonId: String(hw.lessonId || hw.lesson?.id || ''), title: hw.title||'', durationTime: hw.durationTime ? String(hw.durationTime) : '', file: null });
    setHwDrawerOpen(true);
  };
  const closeHwDrawer = () => { setHwDrawerOpen(false); setHwEditItem(null); setHwForm({ lessonId:'', title:'', durationTime:'', file:null }); };

  const handleHwSave = async () => {
    if (!hwForm.lessonId) { toast.error('Darsni tanlang'); return; }
    if (!hwForm.title)    { toast.error('Mavzu kiriting'); return; }
    setHwSaving(true);
    try {
      if (hwEditItem) {
        // UPDATE
        await homeworkAPI.update(hwEditItem.id, {
          lessonId:     Number(hwForm.lessonId),
          title:        hwForm.title,
          durationTime: hwForm.durationTime ? Number(hwForm.durationTime) : undefined,
          teacherId:    selectedGroup?.teacherId || undefined,
          userId:       selectedGroup?.userId    || 1,
        });
        if (hwForm.file) {
          const fd = new FormData(); fd.append('file', hwForm.file);
          await homeworkAPI.uploadFile(hwEditItem.id, fd);
        }
        toast.success("Vazifa yangilandi");
      } else {
        // CREATE
        const created = await homeworkAPI.create({
          lessonId:     Number(hwForm.lessonId),
          title:        hwForm.title,
          durationTime: hwForm.durationTime ? Number(hwForm.durationTime) : undefined,
          teacherId:    selectedGroup?.teacherId || undefined,
          userId:       selectedGroup?.userId    || 1,
        });
        if (hwForm.file) {
          const hwId = created.data?.homework?.id || created.data?.id;
          if (hwId) { const fd = new FormData(); fd.append('file', hwForm.file); await homeworkAPI.uploadFile(hwId, fd); }
        }
        toast.success("Vazifa qo'shildi");
      }
      closeHwDrawer();
      loadHwList(lessons);
    } catch (e) { toast.error(e.response?.data?.message || 'Xatolik'); }
    finally { setHwSaving(false); }
  };

  const openHwDetail = async hw => {
    setHwDetail(hw); setHwDetailTab('kutayotgan'); setHwDetailStudents([]); setHwDetailOpen(true);
    try {
      const s = await homeworkAPI.getStudentStatuses(hw.id); const d = s.data||{};
      setHwDetailStudents([...(d.submitted||[]).map(x=>({...x,_s:'topshirgan'})),...(d.notSubmitted||[]).map(x=>({...x,_s:'kutayotgan'})),...(d.late||[]).map(x=>({...x,_s:'kech'})),...(d.checked||[]).map(x=>({...x,_s:'tekshirildi'}))]);
    } catch { setHwDetailStudents([]); }
  };

  // ── Attendance ──
  const buildAttState = (students, records=[]) => {
    const map = {}; students.forEach(s => { map[s.id] = { isPresent:true }; });
    records.forEach(r => { const sId = r.student?.id ?? r.studentId; if (sId != null) map[sId] = { isPresent:r.isPresent, recordId:r.id }; });
    return map;
  };
  const openAttendanceModal = async lesson => {
    if (!groupStudents.length) return;
    setSelectedLesson(lesson); setAttendanceModalOpen(true); setAttendanceLoading(true);
    try { const res = await attendanceAPI.getByLesson(lesson.id); setAttendanceState(buildAttState(groupStudents, res.data||[])); }
    catch { setAttendanceState(buildAttState(groupStudents)); }
    finally { setAttendanceLoading(false); }
  };
  const closeAttModal   = () => { setAttendanceModalOpen(false); setSelectedLesson(null); setAttendanceState({}); };
  const handleAttToggle = (sid, val) => setAttendanceState(prev => ({ ...prev, [sid]: { ...prev[sid], isPresent:val } }));
  const handleSaveAtt   = async () => {
    if (!selectedLesson) return;
    setAttendanceSaving(true);
    try {
      const updates=[], newRecs=[];
      groupStudents.forEach(s => {
        const e = attendanceState[s.id]; if (!e) return;
        if (e.recordId) updates.push(attendanceAPI.update(e.recordId, { isPresent:e.isPresent }));
        else newRecs.push({ lessonId:selectedLesson.id, studentId:s.id, isPresent:e.isPresent, teacherId:selectedLesson.teacherId??selectedGroup?.teacherId??undefined, userId:selectedLesson.userId??selectedGroup?.userId??1 });
      });
      await Promise.all(updates);
      if (newRecs.length) await attendanceAPI.bulkCreate({ records:newRecs });
      toast.success('Davomat saqlandi'); closeAttModal(); loadMonthAttendance(selectedGroup, calendarMonth);
    } catch (e) { toast.error(e.response?.data?.message || 'Xatolik'); }
    finally { setAttendanceSaving(false); }
  };

  const calDays = useMemo(() => { const s = calendarMonth.startOf('month'); return Array.from({ length:calendarMonth.daysInMonth() }, (_,i) => s.add(i,'day')); }, [calendarMonth]);

  // ── Available lesson dates ──
  const course_detail = courses.find(c => String(c.id) === String(selectedGroup?.courseId)) ?? selectedGroup?.course ?? null;
  const availableLessonDates = useMemo(() => {
    const filtered = lessons.filter(l => l.id !== lessonEditItem?.id);
    const dates    = generateLessonDates(selectedGroup, course_detail?.durationMonth, course_detail?.durationLesson, filtered);
    if (lessonEditItem?.date) {
      const editDate = dayjs(lessonEditItem.date).format('YYYY-MM-DD');
      if (!dates.some(d => d.date === editDate)) {
        const [h, m] = (selectedGroup?.startTime || '09:00').split(':').map(Number);
        const endMin = h * 60 + m + (Number(course_detail?.durationLesson) || 90);
        dates.unshift({ date: editDate, label: `${dayjs(lessonEditItem.date).format('DD.MM.YYYY')} — ${selectedGroup?.startTime || '09:00'} – ${String(Math.floor(endMin/60)).padStart(2,'0')}:${String(endMin%60).padStart(2,'0')}` });
      }
    }
    return dates;
  }, [selectedGroup, course_detail, lessons, lessonEditItem]);

  // ── Shared elements ──
  const groupDrawerEl = (
    <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={editItem ? "Guruhni tahrirlash" : "Guruh qo'shish"}>
      <Field label="Guruh nomi" required><Input placeholder="Frontend 2024" value={form.name} onChange={e => setForm({...form,name:e.target.value})}/></Field>
      <Field label="O'qituvchi" required>
        <Select value={form.teacherId} onChange={e => setForm({...form,teacherId:e.target.value})}>
          <option value="">O'qituvchini tanlang</option>
          {teachers.map(t => <option key={t.id} value={t.id}>{t.fullName}</option>)}
        </Select>
      </Field>
      <Field label="Kurs" required>
        <Select value={form.courseId} onChange={e => setForm({...form,courseId:e.target.value})}>
          <option value="">Kursni tanlang</option>
          {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
      </Field>
      <Field label="Xona" required>
        <Select value={form.roomId} onChange={e => setForm({...form,roomId:e.target.value})}>
          <option value="">Xonani tanlang</option>
          {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
        </Select>
      </Field>
      <Field label="Dars kunlari" required>
        <div className="flex flex-wrap gap-2">
          {ALL_DAYS.map(d => (
            <button key={d} type="button" onClick={() => setForm(f => ({ ...f, weekDays:f.weekDays.includes(d)?f.weekDays.filter(x=>x!==d):[...f.weekDays,d] }))}
              className={`px-3 py-1.5 rounded-lg text-xs font-700 border transition-colors ${form.weekDays.includes(d)?'bg-primary text-white border-primary':'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
              {DAYS_UZ[d]}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Dars vaqti" required><Input type="time" value={form.startTime} onChange={e => setForm({...form,startTime:e.target.value})}/></Field>
      <Field label="Boshlanish sanasi" required><Input type="date" value={form.startDate} onChange={e => setForm({...form,startDate:e.target.value})}/></Field>
      <Field label="Sig'im" required><Input type="number" placeholder="20" value={form.capacity} onChange={e => setForm({...form,capacity:e.target.value})}/></Field>
      <div className="flex gap-3 pt-2">
        <button onClick={() => setDrawerOpen(false)} className="btn-secondary flex-1 justify-center">Bekor qilish</button>
        <button onClick={handleSave} className="btn-primary flex-1 justify-center">Saqlash</button>
      </div>
    </Drawer>
  );

  const deleteDialogEl = (
    <Dialog open={!!deleteId} onClose={() => setDeleteId(null)} title="Guruhni o'chirish" description="Bu guruhni o'chirishni tasdiqlaysizmi?"
      onConfirm={async () => { await groupsAPI.delete(deleteId); load(); toast.success("O'chirildi"); }}/>
  );

  // ════════════════════════════════════════════
  // VIEW: COURSES
  // ════════════════════════════════════════════
  if (view === 'courses') return (
    <div className="fade-in">
      <PageHeader title="Guruhlar" subtitle="Kurs tanlang" actions={<button className="btn-primary" onClick={openAdd}><Plus size={14}/> Guruh qo'shish</button>}/>
      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          { icon:<School size={20}/>,       label:'Jami guruhlar',  value:groups.length,   color:'#7C3AED' },
          { icon:<GraduationCap size={20}/>, label:"O'qituvchilar", value:teachers.length, color:'#2563EB' },
          { icon:<Users size={20}/>,          label:"O'quvchilar",  value:Object.values(studentCounts).reduce((a,b)=>a+b,0), color:'#059669' },
        ].map((s,i) => <StatCard key={i} {...s}/>)}
      </div>
      <div className="relative mb-4 max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Kurs nomi bo'yicha qidirish..."
          className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-primary bg-gray-50 font-500 text-gray-700 placeholder-gray-400"/>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {filteredCourses.map(c => {
          const cg = groups.filter(g => String(g.course?.id ?? g.courseId) === String(c.id));
          return (
            <div key={c.id} onClick={() => openCourse(c)} className="card p-4 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background:(c.color||'#7C3AED')+'18' }}><BookOpen size={18} style={{ color:c.color||'#7C3AED' }}/></div>
                <ChevronRight size={15} className="text-gray-300 group-hover:text-primary transition-colors mt-1"/>
              </div>
              <p className="font-800 text-gray-800 text-sm mb-2 leading-snug">{c.name}</p>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-xs text-gray-400 font-600"><Users size={11}/> {cg.length} guruh</span>
                {c.durationMonth && <><span className="text-gray-200">·</span><span className="text-xs text-gray-400 font-600">{c.durationMonth} oy</span></>}
              </div>
              {c.price && <p className="text-xs font-800 mt-2" style={{ color:c.color||'#7C3AED' }}>{Number(c.price).toLocaleString()} so'm</p>}
            </div>
          );
        })}
        {filteredCourses.length === 0 && <div className="col-span-4 card"><Empty icon="📚" text="Kurslar topilmadi"/></div>}
      </div>
      {groupDrawerEl}{deleteDialogEl}
    </div>
  );

  // ════════════════════════════════════════════
  // VIEW: GROUPS
  // ════════════════════════════════════════════
  if (view === 'groups') return (
    <div className="fade-in">
      <Breadcrumb/>
      <PageHeader title={selectedCourse?.name || 'Guruhlar'} subtitle={`${courseGroups.length} ta guruh`} actions={<button className="btn-primary" onClick={openAdd}><Plus size={14}/> Guruh qo'shish</button>}/>
      <div className="relative mb-4 max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Guruh, o'qituvchi, xona..."
          className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-primary bg-gray-50 font-500 text-gray-700 placeholder-gray-400"/>
      </div>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr>{['Status','Guruh','Dars vaqti','Xona',"O'qituvchi",'Talabalar','Amallar'].map(h => <th key={h} className="table-header first:pl-4 last:pr-4">{h}</th>)}</tr></thead>
            <tbody>
              {courseGroups.length === 0 ? <tr><td colSpan={7}><Empty icon="👥" text="Guruhlar topilmadi"/></td></tr>
                : courseGroups.map(g => {
                  const teacher = g.teacher || teachers.find(t => String(t.id) === String(g.teacherId));
                  const room    = g.room    || rooms.find(r => r.id === g.roomId);
                  return (
                    <tr key={g.id} onClick={() => openGroupDetail(g)} className="hover:bg-gray-50/60 transition-colors cursor-pointer">
                      <td className="table-cell pl-4"><div className="flex items-center gap-1.5"><Toggle value={g.status === 'ACTIVE'} onChange={() => {}}/><span className="text-xs font-700 text-green-600">{g.status||'ACTIVE'}</span></div></td>
                      <td className="table-cell font-700 text-gray-800 text-sm">{g.name}</td>
                      <td className="table-cell text-xs"><div className="font-700">{g.startTime||'—'}</div><div className="text-gray-400">{g.weekDays?.map(d=>DAYS_UZ[d]).join(', ')}</div></td>
                      <td className="table-cell text-xs text-gray-600">{room?.name||'—'}</td>
                      <td className="table-cell">{teacher ? <div className="flex items-center gap-1.5"><Avatar name={teacher.fullName} size="sm"/><span className="text-xs font-600 text-gray-700">{teacher.fullName}</span></div> : <span className="text-xs text-gray-400">—</span>}</td>
                      <td className="table-cell text-xs font-700 text-gray-700 text-center">{studentCounts[g.id] ?? g._count?.studentGroup ?? 0}</td>
                      <td className="table-cell pr-4" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEdit(g)} className="w-7 h-7 rounded-md bg-blue-50 text-blue-500 hover:bg-blue-100 flex items-center justify-center"><Edit2 size={13}/></button>
                          <button onClick={() => setDeleteId(g.id)} className="w-7 h-7 rounded-md bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center"><Trash2 size={13}/></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
      {groupDrawerEl}{deleteDialogEl}
    </div>
  );

  // ════════════════════════════════════════════
  // VIEW: DETAIL
  // ════════════════════════════════════════════
  const teacher = teachers.find(t => String(t.id) === String(selectedGroup?.teacherId)) ?? selectedGroup?.teacher ?? null;
  const course  = courses.find(c => String(c.id) === String(selectedGroup?.courseId))   ?? selectedGroup?.course  ?? null;
  const HW_DETAIL_TABS = [
    { key:'kutayotgan',   label:'Kutayotganlar',     filter:s=>s._s==='kutayotgan'  },
    { key:'topshirgan',   label:'Topshirganlar',     filter:s=>s._s==='topshirgan'  },
    { key:'tekshirildi',  label:'Qabul qilinganlar', filter:s=>s._s==='tekshirildi' },
    { key:'bajarilmagan', label:'Bajarilmagan',      filter:s=>s._s==='kutayotgan'  },
  ];

  return (
    <div className="fade-in">
      <Breadcrumb/>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-800 text-gray-800">{selectedGroup?.name}</h1>
          <span className="badge badge-green">ACTIVE</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary text-xs" onClick={() => setAddTeacherOpen(true)}><Plus size={13}/> O'qituvchi qo'shish</button>
          <button className="btn-primary text-xs"   onClick={() => setAddStudentOpen(true)}><Plus size={13}/> O'quvchi qo'shish</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left */}
        <div className="space-y-4">
          <div className="card p-4">
            <h3 className="font-700 text-gray-800 text-sm mb-3 flex items-center gap-2"><span className="w-1 h-4 bg-primary rounded-full"/>Ma'lumotlar</h3>
            <div className="space-y-2 text-xs">
              {[
                ['Kurs nomi', course?.name||'—'],
                ["Kurs to'lovi", course?`${Math.round(parseFloat(String(course.price||0))).toLocaleString()} so'm`:'—'],
                ["O'qish kunlari", selectedGroup?.weekDays?.map(d=>DAYS_UZ[d]).join(', ')||'—'],
                ['Dars vaqti', selectedGroup?.startTime||'—'],
                ["O'qish davomiyligi", selectedGroup?.startDate?dayjs(selectedGroup.startDate).format('DD.MM.YYYY')+(course?.durationMonth?` – ${dayjs(selectedGroup.startDate).add(course.durationMonth,'month').format('DD.MM.YYYY')}`:''):'—'],
              ].map(([k,v]) => <div key={k} className="flex justify-between"><span className="text-gray-400 font-600">{k}</span><span className="text-gray-700 font-700 text-right max-w-[55%]">{v}</span></div>)}
            </div>
          </div>
          <div className="card p-4">
            <h3 className="font-700 text-gray-800 text-sm mb-3 flex items-center gap-2"><span className="w-1 h-4 bg-primary rounded-full"/>O'qituvchilar</h3>
            {teacher ? <div className="flex items-center gap-2.5"><Avatar name={teacher.fullName} size="sm"/><div><p className="font-700 text-sm text-gray-800">{teacher.fullName}</p><p className="text-xs text-gray-400">{teacher.phone||teacher.email}</p></div></div> : <p className="text-xs text-gray-400">O'qituvchi yo'q</p>}
          </div>
          <div className="card p-4">
            <h3 className="font-700 text-gray-800 text-sm mb-3 flex items-center gap-2"><span className="w-1 h-4 bg-green-500 rounded-full"/>Talabalar ({groupStudents.length})</h3>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {groupStudents.map(s => (
                <div key={s.id} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2"><Avatar name={s.fullName} size="sm"/><div><p className="font-700 text-xs text-gray-800">{s.fullName}</p><p className="text-xs text-gray-400">{s.phone||'—'}</p></div></div>
                  <span className="badge badge-green text-[10px]">Faol</span>
                </div>
              ))}
              {groupStudents.length === 0 && <p className="text-xs text-gray-400 text-center py-3">Talabalar yo'q</p>}
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="lg:col-span-2">
          <div className="card p-4 space-y-4">
            <div className="flex gap-1">
              {[{key:'davomat',label:'Davomat'},{key:'lessons',label:'Guruh darsliklari'}].map(t => (
                <button key={t.key} onClick={() => setDetailTab(t.key)}
                  className={`px-4 py-1.5 rounded-full text-xs font-700 transition-colors ${detailTab===t.key?'bg-primary text-white':'border border-gray-200 text-gray-500 bg-white hover:text-gray-700'}`}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* ── DAVOMAT ── */}
            {detailTab === 'davomat' && (
              <>
                <div className="flex items-center justify-end">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setCalendarMonth(m => m.subtract(1,'month'))} className="w-7 h-7 rounded-md border border-gray-200 flex items-center justify-center hover:bg-gray-50"><ChevronLeft size={13}/></button>
                    <span className="text-sm font-700 text-gray-700 min-w-28 text-center">{calendarMonth.format('YYYY MMMM')}</span>
                    <button onClick={() => setCalendarMonth(m => m.add(1,'month'))} className="w-7 h-7 rounded-md border border-gray-200 flex items-center justify-center hover:bg-gray-50"><ChevronRight size={13}/></button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead><tr>
                      <th className="text-left py-2 px-2 font-700 text-gray-500 sticky left-0 bg-white min-w-40">Nomi</th>
                      {calDays.map(d => (
                        <th key={d.format('DD')} className="py-2 px-1 font-700 text-gray-400 min-w-10">
                          <div className="text-center text-[10px]">{d.format('ddd').slice(0,3)}</div>
                          <div className="text-center font-800 text-gray-600">{d.format('D')}</div>
                        </th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {groupStudents.map(s => (
                        <tr key={s.id} className="border-t border-gray-50">
                          <td className="py-2 px-2 sticky left-0 bg-white">
                            <div className="flex items-center gap-1.5"><Avatar name={s.fullName} size="sm"/><div><p className="font-700 text-gray-800 text-xs">{s.fullName}</p><p className="text-gray-400" style={{fontSize:10}}>Active</p></div></div>
                          </td>
                          {calDays.map(d => <td key={d.format('DD')} className="py-2 px-1 text-center"><AttCell val={attendance[`${s.id}_${d.format('YYYY-MM-DD')}`]}/></td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {groupStudents.length === 0 && <Empty text="Talabalar yo'q"/>}
                </div>
              </>
            )}

            {/* ── DARSLAR / UY VAZIFA ── */}
            {detailTab === 'lessons' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    {[{key:'darslar',label:'Guruh darsliklari'},{key:'uyga-vazifa',label:'Uyga vazifa'}].map(st => (
                      <button key={st.key} onClick={() => { setLessonSubTab(st.key); if(st.key==='uyga-vazifa'&&hwList.length===0) loadHwList(lessons); }}
                        className={`px-3 py-1.5 rounded-full text-xs font-700 transition-colors ${lessonSubTab===st.key?'bg-primary text-white':'border border-gray-200 text-gray-500 bg-white hover:text-gray-700'}`}>
                        {st.label}
                      </button>
                    ))}
                  </div>
                  {lessonSubTab==='darslar'     && <button onClick={openLessonAdd} className="btn-primary text-xs flex items-center gap-1"><Plus size={12}/>Dars qo'shish</button>}
                  {lessonSubTab==='uyga-vazifa' && <button onClick={openHwAdd}     className="btn-primary text-xs flex items-center gap-1"><Plus size={12}/>Uyga vazifa qo'shish</button>}
                </div>

                {/* Darslar */}
                {lessonSubTab==='darslar' && (
                  <div className="space-y-3">
                    {lessonsLoading ? <div className="text-center text-xs text-gray-500 py-6">Yuklanmoqda...</div>
                      : lessons.length===0 ? <Empty text="Darslar topilmadi"/>
                      : lessons.map(lesson => (
                          <div key={lesson.id} className="border border-gray-100 rounded-2xl p-4 hover:shadow-md transition-shadow flex flex-col gap-3">
                            <div>
                              <p className="text-sm font-700 text-gray-800">{lesson.title}</p>
                              <p className="text-xs text-gray-500">{lesson.date ? dayjs(lesson.date).format('DD.MM.YYYY') : 'Sana belgilanmagan'}</p>
                              {lesson.description && <p className="text-xs text-gray-500 mt-1">{lesson.description}</p>}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 justify-between">
                              <div className="text-xs text-gray-500">O'qituvchi: {lesson.teacher?.fullName||teachers.find(t=>String(t.id)===String(lesson.teacherId??selectedGroup?.teacherId))?.fullName||selectedGroup?.teacher?.fullName||'—'}</div>
                              <div className="flex items-center gap-1.5">
                                <button onClick={() => openAttendanceModal(lesson)} className="btn-secondary text-xs px-3 py-1">Davomat</button>
                                <button onClick={() => openLessonEdit(lesson)} className="w-7 h-7 rounded-md bg-blue-50 text-blue-500 hover:bg-blue-100 flex items-center justify-center" title="Tahrirlash"><Edit2 size={12}/></button>
                              </div>
                            </div>
                          </div>
                        ))}
                  </div>
                )}

                {/* Uyga vazifa */}
                {lessonSubTab==='uyga-vazifa' && (
                  <div>
                    {hwLoading ? <div className="text-center text-xs text-gray-500 py-6">Yuklanmoqda...</div>
                      : hwList.length===0 ? <Empty text="Uyga vazifalar topilmadi"/>
                      : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead><tr className="border-b border-gray-100">
                              {['#','Mavzu','👤','✓','✗','Berilgan vaqt','Tugash vaqti','Dars sanasi','Amallar'].map(h => (
                                <th key={h} className="text-left py-2 px-3 font-700 text-gray-400">{h}</th>
                              ))}
                            </tr></thead>
                            <tbody>
                              {hwList.map((hw,idx) => {
                                const st           = hwStatuses[hw.id]||{};
                                const submitted    = (st.submitted?.length||0)+(st.late?.length||0);
                                const notSubmitted = st.notSubmitted?.length||0;
                                const total        = submitted+notSubmitted+(st.checked?.length||0);
                                return (
                                  <tr key={hw.id} className="border-b border-gray-50 hover:bg-gray-50/60">
                                    <td className="py-2.5 px-3 text-gray-400 font-700">{idx+1}</td>
                                    <td className="py-2.5 px-3 cursor-pointer" onClick={() => openHwDetail(hw)}>
                                      <span className={`inline-block px-3 py-1 rounded-lg text-xs font-700 max-w-xs truncate ${submitted>0?'bg-orange-400 text-white':'text-gray-800'}`}>{hw.title}</span>
                                    </td>
                                    <td className="py-2.5 px-3 text-center font-700 text-gray-700">{total}</td>
                                    <td className="py-2.5 px-3 text-center font-700 text-gray-700">{submitted}</td>
                                    <td className="py-2.5 px-3 text-center font-700 text-gray-700">{notSubmitted}</td>
                                    <td className="py-2.5 px-3 text-gray-500">{hw.created_at?dayjs(hw.created_at).format('DD MMM, YYYY HH:mm'):'—'}</td>
                                    <td className="py-2.5 px-3 text-gray-500">{hw.durationTime?dayjs(hw.created_at).add(hw.durationTime,'hour').format('DD MMM, YYYY HH:mm'):'—'}</td>
                                    <td className="py-2.5 px-3 text-gray-500">{hw._lessonDate?dayjs(hw._lessonDate).format('DD MMM, YYYY'):'—'}</td>
                                    {/* ── Edit / Delete tugmalari ── */}
                                    <td className="py-2.5 px-3">
                                      <div className="flex items-center gap-1">
                                        <button onClick={() => openHwEdit(hw)} className="w-7 h-7 rounded-md bg-blue-50 text-blue-500 hover:bg-blue-100 flex items-center justify-center" title="Tahrirlash"><Edit2 size={12}/></button>
                                        <button onClick={() => setHwDeleteId(hw.id)} className="w-7 h-7 rounded-md bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center" title="O'chirish"><Trash2 size={12}/></button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Lesson Drawer ── */}
      <Drawer open={lessonDrawerOpen} onClose={closeLessonDrawer} title={lessonEditItem ? "Darsni tahrirlash" : "Yangi dars qo'shish"}>
        <Field label="Mavzu" required>
          <Input value={lessonForm.title} onChange={e => setLessonForm({...lessonForm,title:e.target.value})} placeholder="CRM frontend"/>
        </Field>
        <Field label="Dars sanasi" required>
          <Select value={lessonForm.date} onChange={e => setLessonForm({...lessonForm,date:e.target.value})}>
            <option value="">Sanani tanlang</option>
            {availableLessonDates.length === 0
              ? <option disabled value="">— Barcha sanalar band yoki guruh ma'lumoti to'liq emas —</option>
              : availableLessonDates.map(d => <option key={d.date} value={d.date}>{d.label}</option>)}
          </Select>
          {availableLessonDates.length === 0 && selectedGroup?.startDate && <p className="text-xs text-amber-500 mt-1">⚠️ Barcha dars sanalari allaqachon qo'shilgan.</p>}
        </Field>
        <Field label="Izoh"><Textarea value={lessonForm.description} onChange={e => setLessonForm({...lessonForm,description:e.target.value})} rows={4} placeholder="Dars haqida..."/></Field>
        <div className="flex gap-3 pt-2">
          <button onClick={closeLessonDrawer} className="btn-secondary flex-1 justify-center">Bekor qilish</button>
          <button disabled={lessonSaving} className="btn-primary flex-1 justify-center"
            onClick={async () => {
              if (!lessonForm.title) { toast.error('Mavzu kiriting'); return; }
              if (!lessonForm.date)  { toast.error('Sanani tanlang'); return; }
              setLessonSaving(true);
              try {
                if (lessonEditItem) {
                  await lessonsAPI.update(lessonEditItem.id, { title:lessonForm.title, date:lessonForm.date, description:lessonForm.description });
                  toast.success("Dars yangilandi");
                } else {
                  await lessonsAPI.create({ groupId:selectedGroup.id, title:lessonForm.title, date:lessonForm.date, description:lessonForm.description, teacherId:selectedGroup.teacherId||undefined, userId:selectedGroup.userId||1 });
                  toast.success("Dars qo'shildi");
                }
                closeLessonDrawer(); loadLessons(selectedGroup.id);
              } catch (e) { toast.error(e.response?.data?.message || 'Xatolik'); }
              finally { setLessonSaving(false); }
            }}>
            {lessonSaving ? 'Saqlanmoqda...' : 'Saqlash'}
          </button>
        </div>
      </Drawer>

      {/* ── Homework Drawer (qo'shish + tahrirlash) ── */}
      <Drawer open={hwDrawerOpen} onClose={closeHwDrawer} title={hwEditItem ? "Vazifani tahrirlash" : "Yangi uyga vazifa"}>
        <Field label="Dars" required>
          <Select value={hwForm.lessonId} onChange={e => setHwForm({...hwForm,lessonId:e.target.value})}>
            <option value="">Darsdan birini tanlang</option>
            {lessons.map(l => <option key={l.id} value={l.id}>{l.title}{l.date?` — ${dayjs(l.date).format('DD.MM.YYYY')}`:''}</option>)}
          </Select>
        </Field>
        <Field label="Mavzu" required>
          <Input value={hwForm.title} onChange={e => setHwForm({...hwForm,title:e.target.value})} placeholder="HTML layout vazifasi"/>
        </Field>
        <Field label="Topshirish muddati (soat)">
          <Input type="number" placeholder="24" value={hwForm.durationTime} onChange={e => setHwForm({...hwForm,durationTime:e.target.value})}/>
        </Field>
        <Field label={hwEditItem ? "Fayl (yangilash uchun)" : "Fayl (ixtiyoriy)"}>
          <label className="flex items-center justify-center gap-2 w-full border-2 border-dashed border-gray-200 rounded-xl px-3 py-4 cursor-pointer hover:border-primary transition-colors">
            <span className="text-lg">📎</span>
            <span className="text-xs text-gray-500">{hwForm.file ? hwForm.file.name : hwEditItem ? 'Yangi fayl tanlash (ixtiyoriy)' : 'Fayl tanlash'}</span>
            <input type="file" className="hidden" onChange={e => setHwForm({...hwForm,file:e.target.files[0]||null})}/>
          </label>
        </Field>
        <div className="flex gap-3 pt-2">
          <button onClick={closeHwDrawer} className="btn-secondary flex-1 justify-center">Bekor qilish</button>
          <button onClick={handleHwSave} disabled={hwSaving} className="btn-primary flex-1 justify-center">{hwSaving ? 'Saqlanmoqda...' : 'Saqlash'}</button>
        </div>
      </Drawer>

      {/* Attendance Modal */}
      <Modal open={attendanceModalOpen} onClose={closeAttModal} title={selectedLesson?.title||'Davomat'}>
        {attendanceLoading ? <div className="text-center text-xs text-gray-500 py-8">Yuklanmoqda...</div>
          : groupStudents.length===0 ? <Empty text="Talabalar yo'q"/>
          : (
            <div className="space-y-3">
              <p className="text-xs text-gray-500">Har bir o'quvchi uchun ishtirok holatini belgilang.</p>
              {groupStudents.map(s => {
                const status = attendanceState[s.id]?.isPresent;
                return (
                  <div key={s.id} className="flex items-center justify-between gap-3 px-3 py-2 border border-gray-100 rounded-xl">
                    <div className="flex items-center gap-3"><Avatar name={s.fullName} size="sm"/><div><p className="text-sm font-700 text-gray-800">{s.fullName}</p><p className="text-xs text-gray-400">{s.email||'—'}</p></div></div>
                    <div className="flex gap-1">
                      <button onClick={() => handleAttToggle(s.id,true)}  className={`px-3 py-1 rounded-lg text-xs font-700 transition ${status?'bg-green-100 text-green-600':'border border-gray-200 text-gray-500 hover:border-green-200 hover:text-green-600'}`}>Bor</button>
                      <button onClick={() => handleAttToggle(s.id,false)} className={`px-3 py-1 rounded-lg text-xs font-700 transition ${status===false?'bg-red-100 text-red-600':'border border-gray-200 text-gray-500 hover:border-red-200 hover:text-red-600'}`}>Yo'q</button>
                    </div>
                  </div>
                );
              })}
              <div className="flex gap-3 mt-4">
                <button onClick={closeAttModal} className="btn-secondary flex-1">Bekor qilish</button>
                <button onClick={handleSaveAtt} disabled={attendanceSaving} className="btn-primary flex-1">{attendanceSaving?'Saqlanmoqda...':'Saqlash'}</button>
              </div>
            </div>
          )}
      </Modal>

      {/* Homework Detail Modal */}
      <Modal open={hwDetailOpen} onClose={() => { setHwDetailOpen(false); setHwDetail(null); }} title={hwDetail?.title||'Vazifa'}>
        {hwDetail && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-gray-50 rounded-xl p-3"><p className="text-gray-400 mb-1">Mavzu</p><p className="font-700 text-gray-800">{hwDetail.title}</p></div>
              <div className="bg-gray-50 rounded-xl p-3"><p className="text-gray-400 mb-1">Tugash vaqti</p><p className="font-700 text-gray-800">{hwDetail.durationTime?dayjs(hwDetail.created_at).add(hwDetail.durationTime,'hour').format('DD MMM, YYYY HH:mm'):'—'}</p></div>
            </div>
            <div className="flex gap-1 flex-wrap">
              {HW_DETAIL_TABS.map(t => {
                const cnt = hwDetailStudents.filter(t.filter).length;
                return (
                  <button key={t.key} onClick={() => setHwDetailTab(t.key)}
                    className={`px-3 py-1.5 rounded-full text-xs font-700 transition-colors flex items-center gap-1 ${hwDetailTab===t.key?'bg-primary text-white':'border border-gray-200 text-gray-500 bg-white'}`}>
                    {t.label}{cnt>0&&<span className={`text-[10px] rounded-full w-4 h-4 flex items-center justify-center ${hwDetailTab===t.key?'bg-white/30 text-white':'bg-gray-100 text-gray-600'}`}>{cnt}</span>}
                  </button>
                );
              })}
            </div>
            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {(() => {
                const activeTab = HW_DETAIL_TABS.find(t => t.key===hwDetailTab);
                const filtered  = hwDetailStudents.filter(activeTab?.filter||(()=>true));
                if (!filtered.length) return <p className="text-xs text-gray-400 text-center py-4">O'quvchilar yo'q</p>;
                return filtered.map((s,i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-700">{(s.fullName||s.student?.fullName||'?').charAt(0)}</div>
                      <p className="text-xs font-700 text-gray-800">{s.fullName||s.student?.fullName||'—'}</p>
                    </div>
                    <span className={`text-[10px] font-700 px-2 py-0.5 rounded-full ${s._s==='topshirgan'?'bg-green-100 text-green-600':s._s==='kech'?'bg-amber-100 text-amber-600':s._s==='tekshirildi'?'bg-blue-100 text-blue-600':'bg-gray-100 text-gray-500'}`}>
                      {s._s==='topshirgan'?'Topshirdi':s._s==='kech'?'Kech':s._s==='tekshirildi'?'Tekshirildi':'Kutilmoqda'}
                    </span>
                  </div>
                ));
              })()}
            </div>
            <button onClick={() => { setHwDetailOpen(false); setHwDetail(null); }} className="btn-secondary w-full justify-center">Yopish</button>
          </div>
        )}
      </Modal>

      {/* Lesson delete dialog */}
      <Dialog open={!!lessonDeleteId} onClose={() => setLessonDeleteId(null)} title="Darsni o'chirish"
        description="Bu darsni o'chirishni tasdiqlaysizmi? Davomat ma'lumotlari ham o'chishi mumkin."
        onConfirm={async () => { await lessonsAPI.delete(lessonDeleteId); setLessonDeleteId(null); toast.success("Dars o'chirildi"); loadLessons(selectedGroup.id); }}/>

      {/* Homework delete dialog */}
      <Dialog open={!!hwDeleteId} onClose={() => setHwDeleteId(null)} title="Vazifani o'chirish"
        description="Bu vazifani o'chirishni tasdiqlaysizmi? Barcha javoblar ham o'chib ketishi mumkin."
        onConfirm={async () => { await homeworkAPI.delete(hwDeleteId); setHwDeleteId(null); toast.success("Vazifa o'chirildi"); loadHwList(lessons); }}/>

      <AddStudentModal open={addStudentOpen} onClose={() => setAddStudentOpen(false)} groupId={selectedGroup?.id} groupStudents={groupStudents}
        onAdded={async () => { const r = await groupsAPI.getStudents(selectedGroup.id); setGroupStudents(normalizeStudents(r.data||[])); setStudentCounts(prev => ({...prev,[selectedGroup.id]:(prev[selectedGroup.id]||0)+1})); }}/>
      <AddTeacherModal open={addTeacherOpen} onClose={() => setAddTeacherOpen(false)} group={selectedGroup} teachers={teachers}
        onAdded={t => { setSelectedGroup(prev => ({...prev,teacherId:t.id,teacher:t})); setAddTeacherOpen(false); }}/>
      {groupDrawerEl}{deleteDialogEl}
    </div>
  );
}
