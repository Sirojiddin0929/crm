import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import TeacherGroups from '../teacher/Groups';
import { useAuth } from '../../context/AuthContext';
import { coursesAPI, groupsAPI, roomsAPI, teachersAPI, studentsAPI } from '../../services/api';
import { Drawer, Field, Input, Select } from '../../components/UI';

const DAYS_UZ = {
  MONDAY: 'Du',
  TUESDAY: 'Se',
  WEDNESDAY: 'Ch',
  THURSDAY: 'Pa',
  FRIDAY: 'Ju',
  SATURDAY: 'Sh',
  SUNDAY: 'Ya',
};
const ALL_DAYS = Object.keys(DAYS_UZ);

const defaultForm = {
  name: '',
  teacherId: '',
  courseId: '',
  roomId: '',
  startDate: '',
  startTime: '',
  weekDays: [],
};

export default function AdminGroups() {
  const { user } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [assignDrawerOpen, setAssignDrawerOpen] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [courses, setCourses] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [form, setForm] = useState(defaultForm);
  const [assignForm, setAssignForm] = useState({ groupId: '', teacherId: '', studentIds: [] });
  const [assignStudentSearch, setAssignStudentSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const [groupStudentIds, setGroupStudentIds] = useState([]);

  const openCreate = async () => {
    try {
      const [t, c, r] = await Promise.all([
        teachersAPI.getAll({ page: 1, limit: 300, status: 'ACTIVE' }),
        coursesAPI.getAll(),
        roomsAPI.getAll(),
      ]);
      setTeachers(t.data?.data || t.data || []);
      setCourses(c.data || []);
      setRooms(r.data || []);
      setForm(defaultForm);
      setDrawerOpen(true);
    } catch {
      toast.error('Formani yuklashda xatolik');
    }
  };

  const handleSave = async () => {
    if (!form.name?.trim()) return toast.error("Guruh nomini kiriting");
    if (!form.teacherId) return toast.error("O'qituvchini tanlang");
    if (!form.courseId) return toast.error("Kursni tanlang");
    if (!form.roomId) return toast.error("Xonani tanlang");
    if (!form.startDate) return toast.error('Boshlanish sanasini tanlang');
    if (!form.startTime) return toast.error('Dars vaqtini kiriting');
    if (!form.weekDays.length) return toast.error("Kamida bitta o'quv kunini tanlang");
    if (!user?.id) return toast.error('Admin sessiyasi topilmadi');

    setSaving(true);
    try {
      await groupsAPI.create({
        name: form.name.trim(),
        teacherId: Number(form.teacherId),
        courseId: Number(form.courseId),
        roomId: Number(form.roomId),
        startDate: form.startDate,
        startTime: form.startTime,
        weekDays: form.weekDays,
        userId: Number(user.id),
      });
      toast.success("Guruh yaratildi");
      setDrawerOpen(false);
      setRefreshToken(prev => prev + 1);
    } catch (e) {
      const message = e?.response?.data?.message;
      toast.error(Array.isArray(message) ? message[0] : (message || 'Saqlashda xatolik'));
    } finally {
      setSaving(false);
    }
  };

  const openAssign = async () => {
    try {
      const [g, t, s] = await Promise.all([
        groupsAPI.getAll({ compact: true, status: 'ACTIVE' }),
        teachersAPI.getAll({ compact: true, status: 'ACTIVE' }),
        studentsAPI.getAll({ compact: true, status: 'ACTIVE', page: 1, limit: 1000 }),
      ]);
      setGroups(g.data?.data || g.data || []);
      setTeachers(t.data?.data || t.data || []);
      setStudents(s.data?.data || s.data || []);
      setAssignForm({ groupId: '', teacherId: '', studentIds: [] });
      setAssignStudentSearch('');
      setAssignDrawerOpen(true);
    } catch {
      toast.error("Biriktirish formasini yuklashda xatolik");
    }
  };

  const handleAssign = async () => {
    if (!assignForm.groupId) return toast.error("Guruhni tanlang");
    if (!assignForm.teacherId && assignForm.studentIds.length === 0) {
      return toast.error("Kamida ustoz yoki bitta talaba tanlang");
    }

    setAssigning(true);
    try {
      const gid = Number(assignForm.groupId);
      if (assignForm.teacherId) {
        await groupsAPI.update(gid, { teacherId: Number(assignForm.teacherId) });
      }
      if (assignForm.studentIds.length > 0) {
        await groupsAPI.addStudentsBulk(gid, { studentIds: assignForm.studentIds.map(Number) });
      }
      toast.success("Mavjud guruhga biriktirish bajarildi");
      setAssignDrawerOpen(false);
      setRefreshToken(prev => prev + 1);
    } catch (e) {
      const message = e?.response?.data?.message;
      toast.error(Array.isArray(message) ? message[0] : (message || "Biriktirishda xatolik"));
    } finally {
      setAssigning(false);
    }
  };

  useEffect(() => {
    if (!assignDrawerOpen || !assignForm.groupId) {
      setGroupStudentIds([]);
      return;
    }

    groupsAPI.getStudents(Number(assignForm.groupId))
      .then(r => {
        const ids = (r.data || []).map(item => Number(item?.student?.id ?? item?.id)).filter(Boolean);
        setGroupStudentIds(ids);
      })
      .catch(() => setGroupStudentIds([]));
  }, [assignDrawerOpen, assignForm.groupId]);

  const filteredAssignStudents = useMemo(() => {
    const q = assignStudentSearch.trim().toLowerCase();
    const inGroup = new Set(groupStudentIds);
    return students
      .filter(s => !inGroup.has(Number(s.id)))
      .filter(s => `${s.fullName || ''} ${s.email || ''}`.toLowerCase().includes(q));
  }, [students, assignStudentSearch, groupStudentIds]);

  const toggleAssignStudent = (studentId) => {
    setAssignForm(prev => ({
      ...prev,
      studentIds: prev.studentIds.includes(studentId)
        ? prev.studentIds.filter(id => id !== studentId)
        : [...prev.studentIds, studentId],
    }));
  };

  return (
    <>
      <div className="flex justify-end mb-3">
        <button className="btn-secondary py-2.5 px-5 text-[11px] font-900 uppercase tracking-widest" onClick={openAssign}>
          Mavjud guruhga biriktirish
        </button>
      </div>

      <TeacherGroups mode="admin" actorUser={user} canCreateGroup onCreateGroup={openCreate} refreshToken={refreshToken} />

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Yangi guruh">
        <div className="space-y-4">
          <Field label="Guruh nomi" required>
            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="O'qituvchi" required>
            <Select value={form.teacherId} onChange={e => setForm({ ...form, teacherId: e.target.value })}>
              <option value="">Tanlang</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.fullName}</option>)}
            </Select>
          </Field>
          <Field label="Kurs" required>
            <Select value={form.courseId} onChange={e => setForm({ ...form, courseId: e.target.value })}>
              <option value="">Tanlang</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </Field>
          <Field label="Xona" required>
            <Select value={form.roomId} onChange={e => setForm({ ...form, roomId: e.target.value })}>
              <option value="">Tanlang</option>
              {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </Select>
          </Field>
          <Field label="Boshlanish sanasi" required>
            <Input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
          </Field>
          <Field label="Dars vaqti" required>
            <Input type="time" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} />
          </Field>
          <Field label="O'quv kunlari" required>
            <div className="flex flex-wrap gap-2">
              {ALL_DAYS.map(day => (
                <button
                  key={day}
                  type="button"
                  onClick={() => {
                    setForm(prev => ({
                      ...prev,
                      weekDays: prev.weekDays.includes(day)
                        ? prev.weekDays.filter(d => d !== day)
                        : [...prev.weekDays, day],
                    }));
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-900 border transition-all ${
                    form.weekDays.includes(day)
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-gray-500 border-gray-200'
                  }`}
                >
                  {DAYS_UZ[day]}
                </button>
              ))}
            </div>
          </Field>

          <div className="flex gap-3 pt-4">
            <button onClick={() => setDrawerOpen(false)} className="btn-secondary flex-1 justify-center">Bekor qilish</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 justify-center">
              {saving ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>
        </div>
      </Drawer>

      <Drawer open={assignDrawerOpen} onClose={() => setAssignDrawerOpen(false)} title="Mavjud guruhga biriktirish">
        <div className="space-y-4">
          <Field label="Guruh" required>
            <Select value={assignForm.groupId} onChange={e => setAssignForm(prev => ({ ...prev, groupId: e.target.value, studentIds: [] }))}>
              <option value="">Tanlang</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </Select>
          </Field>

          <Field label="Ustoz (ixtiyoriy)">
            <Select value={assignForm.teacherId} onChange={e => setAssignForm(prev => ({ ...prev, teacherId: e.target.value }))}>
              <option value="">O'zgartirmaslik</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.fullName}</option>)}
            </Select>
          </Field>

          <Field label="Talabalar (bir nechta tanlash)">
            <Input
              placeholder="Ism yoki email bo'yicha qidirish..."
              value={assignStudentSearch}
              onChange={e => setAssignStudentSearch(e.target.value)}
            />
            <div className="mt-2 max-h-[220px] overflow-auto border border-gray-200 rounded-xl p-2 space-y-1">
              {filteredAssignStudents.length === 0 ? (
                <p className="text-xs text-gray-400 py-4 text-center">Mos o'quvchilar topilmadi</p>
              ) : filteredAssignStudents.map(s => (
                <label key={s.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={assignForm.studentIds.includes(s.id)}
                    onChange={() => toggleAssignStudent(s.id)}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-700 text-gray-800 truncate">{s.fullName}</p>
                    <p className="text-xs text-gray-400 truncate">{s.email}</p>
                  </div>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">{assignForm.studentIds.length} ta talaba tanlandi</p>
          </Field>

          <div className="flex gap-3 pt-3">
            <button onClick={() => setAssignDrawerOpen(false)} className="btn-secondary flex-1 justify-center">Bekor qilish</button>
            <button onClick={handleAssign} disabled={assigning} className="btn-primary flex-1 justify-center">
              {assigning ? 'Saqlanmoqda...' : 'Biriktirish'}
            </button>
          </div>
        </div>
      </Drawer>
    </>
  );
}
