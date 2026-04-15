import React, { useEffect, useRef, useState } from 'react';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import { Upload } from 'lucide-react';
import { Drawer, Empty, Field, Input, PageHeader, Select } from '../../components/UI';
import { useStudentAuth } from '../../context/StudentAuthContext';
import { homeworkAPI, homeworkResponsesAPI, homeworkResultsAPI } from '../../services/api';
import { getHomeworkDeadline, getHomeworkStatus, getUploadUrl } from './shared';

export default function StudentHomework() {
  const { user } = useStudentAuth();
  const fileRef = useRef();
  const [homework, setHomework] = useState([]);
  const [responses, setResponses] = useState([]);
  const [results, setResults] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedHW, setSelectedHW] = useState(null);
  const [form, setForm] = useState({ title: '', url: '', file: null });
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  const load = async () => {
    if (!user?.id) return;
    try {
      const [h, r, res] = await Promise.all([
        homeworkAPI.getAll({ studentId: user.id }),
        homeworkResponsesAPI.getAll({ studentId: user.id, compact: true }),
        homeworkResultsAPI.getAll({ studentId: user.id, compact: true }),
      ]);
      setHomework(h.data || []);
      setResponses(r.data || []);
      setResults(res.data || []);
    } catch {}
  };
  useEffect(() => { load(); }, [user]);

  const getResponse = hwId => responses.find(r => r.homeworkId === hwId);
  const getResult = hwId => results.find(r => r.homeworkId === hwId);
  const filteredHomework = homework.filter(hw => {
    if (statusFilter === 'all') return true;
    const resp = getResponse(hw.id);
    const res = getResult(hw.id);
    if (statusFilter === 'PENDING') return !!hw && !resp && !res;
    if (statusFilter === 'APPROVED') return res?.status === 'APPROVED';
    if (statusFilter === 'REJECTED') return res?.status === 'REJECTED';
    return true;
  });

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { data } = await homeworkResponsesAPI.create({
        homeworkId: Number(selectedHW.id),
        studentId: user.id,
        title: form.title,
        url: form.url,
      });
      const createdResponse = data?.response;
      if (form.file) {
        if (!createdResponse?.id) throw new Error('Response ID not found');
        const fd = new FormData();
        fd.append('file', form.file);
        await homeworkResponsesAPI.uploadFile(createdResponse?.id, fd);
      }
      toast.success('Javob topshirildi!');
      setDrawerOpen(false);
      setForm({ title: '', url: '', file: null });
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Xatolik');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in space-y-6">
      <PageHeader title="Vazifalarim" subtitle="Topshiriqlar bo'yicha hisobotlar" />
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <p className="text-[10px] font-900 text-gray-400 uppercase tracking-widest whitespace-nowrap">Uy vazifa statusi</p>
          <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="max-w-[200px]">
            <option value="all">Barchasi</option>
            <option value="PENDING">Kutayotganlar</option>
            <option value="APPROVED">Qabul qilingan</option>
            <option value="REJECTED">Rad etilgan</option>
          </Select>
        </div>
      </div>
      <div className="card overflow-hidden shadow-xl shadow-primary/5">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50/50 dark:bg-white/5">
              <th className="table-header pl-6">Vazifa nomi</th>
              <th className="table-header text-center">Video</th>
              <th className="table-header text-center">Uy vazifa holati</th>
              <th className="table-header text-center">Tugash vaqti</th>
              <th className="table-header pr-6 text-right">Dars sanasi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/5">
            {filteredHomework.map(hw => {
              const resp = getResponse(hw.id);
              const res = getResult(hw.id);
              const status = getHomeworkStatus(hw, resp, res);
              const deadline = getHomeworkDeadline(hw);
              return (
                <tr key={hw.id} onClick={() => { setSelectedHW(hw); setDrawerOpen(true); setForm({ title: '', url: '', file: null }); }} className="hover:bg-gray-50/60 dark:hover:bg-white/5 transition-all cursor-pointer">
                  <td className="table-cell pl-6 max-w-[300px]"><p className="font-800 text-[13px] text-gray-800 dark:text-gray-100 truncate">{hw.title}</p></td>
                  <td className="table-cell text-center"><span className="w-7 h-7 rounded-full border border-blue-400 flex items-center justify-center mx-auto text-blue-500 font-900 text-[10px]">0</span></td>
                  <td className="table-cell text-center"><span className={`px-4 py-1 rounded-lg text-[10px] font-900 uppercase tracking-widest ${status.className}`}>{status.label}</span></td>
                  <td className="table-cell text-center text-gray-400 font-700">{deadline ? deadline.format('DD MMM, YYYY HH:mm') : '-'}</td>
                  <td className="table-cell pr-6 text-right text-xs font-800 text-gray-600 dark:text-gray-400 uppercase tracking-tighter">{hw.lesson?.date ? dayjs(hw.lesson.date).format('DD MMM, YYYY') : '—'}</td>
                </tr>
              );
            })}
            {filteredHomework.length === 0 && <tr><td colSpan={5} className="py-20 text-center"><Empty text="Vazifalar topilmadi" /></td></tr>}
          </tbody>
        </table>
      </div>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Vazifa topshirish">
        <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl mb-6">
          <h4 className="font-900 text-sm text-gray-800 dark:text-gray-200 uppercase tracking-tight mb-1">{selectedHW?.title}</h4>
          <p className="text-xs text-gray-400 font-600 leading-relaxed">{selectedHW?.description || "Tavsif yo'q"}</p>
          {selectedHW?.file && (
            <a
              href={getUploadUrl(selectedHW.file)}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-[11px] font-900 uppercase tracking-widest text-emerald-600 hover:bg-emerald-100 transition-colors"
            >
              Ustoz faylini ochish
            </a>
          )}
        </div>
        <Field label="Havola (GitHub/Drive)"><Input placeholder="https://..." value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} /></Field>
        <Field label="Qo'shimcha izoh"><Input placeholder="Vazifa bo'yicha fikrlar..." value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></Field>
        <div onClick={() => fileRef.current.click()} className="border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl p-10 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all">
          <input type="file" hidden ref={fileRef} onChange={e => setForm({ ...form, file: e.target.files[0] })} />
          <Upload className="mx-auto mb-3 text-gray-300" size={32} />
          <p className="text-xs font-900 text-gray-500 uppercase tracking-widest">{form.file ? form.file.name : 'Faylni tanlang'}</p>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={() => setDrawerOpen(false)} className="btn-secondary flex-1 justify-center">BEKOR</button>
          <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1 justify-center">{loading ? 'YUBORILMOQDA...' : 'TOPSHIRISH'}</button>
        </div>
      </Drawer>
    </div>
  );
}
