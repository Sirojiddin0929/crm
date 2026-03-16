import React, { useEffect, useState } from 'react';
import { Plus, RefreshCw, Trash2, Edit2, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { lessonsAPI, groupsAPI, attendanceAPI } from '../../services/api';
import { useTeacherAuth } from '../../context/TeacherAuthContext';
import { PageHeader, Drawer, Field, Input, Select, Textarea, Dialog, Empty, Avatar, Toggle } from '../../components/UI';

const defaultForm = { title: '', groupId: '', date: '', description: '' };

export default function TeacherLessons() {
  const { user } = useTeacherAuth();
  const [lessons, setLessons] = useState([]);
  const [groups, setGroups] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [deleteId, setDeleteId] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [attendanceData, setAttendanceData] = useState({});
  const [groupStudents, setGroupStudents] = useState({});
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const [l, g] = await Promise.all([
        lessonsAPI.getAll({ teacherId: user?.id }),
        groupsAPI.getAll({ teacherId: user?.id }),
      ]);
      setLessons(l.data || []);
      setGroups(g.data || []);
    } catch { toast.error('Xatolik'); }
  };
  useEffect(() => { if (user?.id) load(); }, [user]);

  const openAdd = () => { setEditItem(null); setForm(defaultForm); setDrawerOpen(true); };
  const openEdit = l => { setEditItem(l); setForm({ title: l.title, groupId: l.groupId || '', date: l.date || '', description: l.description || '' }); setDrawerOpen(true); };

  const handleSave = async () => {
    try {
      const data = { ...form, groupId: Number(form.groupId), teacherId: user?.id, userId: 1 };
      if (editItem) { await lessonsAPI.update(editItem.id, data); toast.success('Yangilandi'); }
      else { await lessonsAPI.create(data); toast.success('Dars qo\'shildi'); }
      setDrawerOpen(false); load();
    } catch (e) { toast.error(e.response?.data?.message || 'Xatolik'); }
  };

  const toggleLesson = async lesson => {
    if (expanded === lesson.id) { setExpanded(null); return; }
    setExpanded(lesson.id);
    if (!groupStudents[lesson.groupId]) {
      try {
        const [students, att] = await Promise.all([
          groupsAPI.getStudents(lesson.groupId),
          attendanceAPI.getByLesson(lesson.id),
        ]);
        const studs = students.data || [];
        setGroupStudents(prev => ({ ...prev, [lesson.groupId]: studs }));
        const map = {};
        studs.forEach(s => { map[s.id] = false; });
        (att.data || []).forEach(a => { map[a.studentId] = a.isPresent; });
        setAttendanceData(prev => ({ ...prev, [lesson.id]: map }));
      } catch {}
    } else {
      try {
        const att = await attendanceAPI.getByLesson(lesson.id);
        const studs = groupStudents[lesson.groupId] || [];
        const map = {};
        studs.forEach(s => { map[s.id] = false; });
        (att.data || []).forEach(a => { map[a.studentId] = a.isPresent; });
        setAttendanceData(prev => ({ ...prev, [lesson.id]: map }));
      } catch {}
    }
  };

  const toggleStudent = (lessonId, studentId) => {
    setAttendanceData(prev => ({
      ...prev,
      [lessonId]: { ...prev[lessonId], [studentId]: !prev[lessonId]?.[studentId] }
    }));
  };

  const saveAttendance = async lesson => {
    setSaving(true);
    try {
      const studs = groupStudents[lesson.groupId] || [];
      const records = studs.map(s => ({
        lessonId: lesson.id,
        studentId: s.id,
        isPresent: attendanceData[lesson.id]?.[s.id] || false,
        teacherId: user?.id,
        userId: 1,
      }));
      await attendanceAPI.bulkCreate({ records });
      toast.success('Davomat saqlandi!');
    } catch (e) { toast.error(e.response?.data?.message || 'Xatolik'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fade-in">
      <PageHeader
        title="Darslar"
        subtitle={`${lessons.length} ta dars`}
        actions={
          <>
            <button className="btn-secondary text-xs" onClick={load}><RefreshCw size={13}/></button>
            <button className="btn-primary" onClick={openAdd}><Plus size={14}/> Dars qo'shish</button>
          </>
        }
      />

      <div className="space-y-2">
        {lessons.length === 0 && <div className="card"><Empty text="Darslar topilmadi"/></div>}
        {lessons.map((lesson, idx) => {
          const studs = groupStudents[lesson.groupId] || [];
          const att = attendanceData[lesson.id] || {};
          const presentCount = Object.values(att).filter(Boolean).length;
          const isOpen = expanded === lesson.id;

          return (
            <div key={lesson.id} className="card overflow-hidden">
              {/* Header */}
              <div className="flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-gray-50/60 transition-colors" onClick={() => toggleLesson(lesson)}>
                <span className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-800 text-primary flex-shrink-0">{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-800 text-gray-800 text-sm">{lesson.title}</p>
                  <p className="text-xs text-gray-400 font-500">{lesson.date || '—'} · Guruh #{lesson.groupId}</p>
                </div>
                {studs.length > 0 && (
                  <div className="flex items-center gap-3 text-xs font-700">
                    <span className="text-green-600">{presentCount} keldi</span>
                    <span className="text-red-400">{studs.length - presentCount} kelmadi</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                  <button onClick={() => openEdit(lesson)} className="w-7 h-7 rounded-md bg-blue-50 text-blue-500 hover:bg-blue-100 flex items-center justify-center"><Edit2 size={13}/></button>
                  <button onClick={() => setDeleteId(lesson.id)} className="w-7 h-7 rounded-md bg-red-50 text-red-400 hover:bg-red-100 flex items-center justify-center"><Trash2 size={13}/></button>
                </div>
                <div className="text-gray-400">{isOpen ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}</div>
              </div>

              {/* Attendance panel */}
              {isOpen && (
                <div className="border-t border-gray-100">
                  <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
                    <div>
                      <p className="text-sm font-800 text-gray-700">Yo'qlama</p>
                      <p className="text-xs text-gray-400">Talabalar davomatini belgilang</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const all = {};
                          studs.forEach(s => { all[s.id] = true; });
                          setAttendanceData(prev => ({ ...prev, [lesson.id]: all }));
                        }}
                        className="px-3 py-1.5 bg-green-50 text-green-700 text-xs font-700 rounded-lg hover:bg-green-100"
                      >
                        Barchasi keldi
                      </button>
                      <button onClick={() => saveAttendance(lesson)} disabled={saving}
                        className="btn-primary text-xs">{saving ? 'Saqlanmoqda...' : 'Saqlash'}</button>
                    </div>
                  </div>

                  {studs.length === 0 ? (
                    <div className="py-6 text-center text-sm text-gray-400">Talabalar topilmadi</div>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {studs.map(s => {
                        const present = att[s.id] ?? false;
                        return (
                          <div key={s.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50/40">
                            <div className="flex items-center gap-2.5">
                              <Avatar name={s.fullName} size="sm"/>
                              <div>
                                <p className="font-700 text-sm text-gray-800">{s.fullName}</p>
                                <p className="text-xs text-gray-400">{s.phone || '—'}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`text-xs font-700 ${present ? 'text-green-600' : 'text-red-400'}`}>
                                {present ? '✓ Keldi' : '✗ Kelmadi'}
                              </span>
                              <Toggle value={present} onChange={() => toggleStudent(lesson.id, s.id)}/>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={editItem ? 'Darsni tahrirlash' : 'Yangi dars'}>
        <Field label="Mavzu" required><Input placeholder="Dars mavzusi" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}/></Field>
        <Field label="Guruh" required>
          <Select value={form.groupId} onChange={e => setForm({ ...form, groupId: e.target.value })}>
            <option value="">Guruhni tanlang</option>
            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </Select>
        </Field>
        <Field label="Sana"><Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}/></Field>
        <Field label="Tavsif"><Textarea rows={3} placeholder="Dars haqida..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}/></Field>
        <div className="flex gap-3 pt-2">
          <button onClick={() => setDrawerOpen(false)} className="btn-secondary flex-1 justify-center">Bekor</button>
          <button onClick={handleSave} className="btn-primary flex-1 justify-center">Saqlash</button>
        </div>
      </Drawer>

      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)} title="Darsni o'chirish"
        description="Bu darsni o'chirishni tasdiqlaysizmi?"
        onConfirm={async () => { await lessonsAPI.delete(deleteId); setDeleteId(null); load(); toast.success("O'chirildi"); }}/>
    </div>
  );
}
