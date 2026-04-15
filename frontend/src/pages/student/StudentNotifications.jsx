import React, { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import { BellRing, Star, X } from 'lucide-react';
import { useStudentAuth } from '../../context/StudentAuthContext';
import { lessonsAPI, ratingsAPI, studentsAPI } from '../../services/api';

function StarInput({ value, onChange }) {
  return (
    <div className="flex items-center gap-2">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className="text-yellow-400"
        >
          <Star size={38} fill={n <= value ? 'currentColor' : 'none'} />
        </button>
      ))}
    </div>
  );
}

export default function StudentNotifications() {
  const { user } = useStudentAuth();
  const [items, setItems] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  const ratingMap = useMemo(() => {
    const map = new Map();
    ratings.forEach((r) => map.set(r.lesson?.id || r.lessonId, r));
    return map;
  }, [ratings]);

  const load = async () => {
    if (!user?.id) return;
    try {
      const [groupsRes, ratingsRes] = await Promise.all([
        studentsAPI.getGroups(user.id),
        ratingsAPI.getByStudent(user.id),
      ]);
      const groups = (groupsRes.data || []).map((x) => x.group).filter(Boolean);
      setRatings(ratingsRes.data || []);

      const lessonResponses = await Promise.all(
        groups.map((g) => lessonsAPI.getAll({ groupId: g.id }))
      );

      const allLessons = lessonResponses.flatMap((r) => r.data || []);
      const doneLessons = allLessons
        .filter((l) => l?.date && dayjs(l.date).isBefore(dayjs()))
        .sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf());

      setItems(
        doneLessons.map((l) => ({
          id: l.id,
          title: `${l.title} darsini baholang`,
          time: l.date,
          lesson: l,
        }))
      );
    } catch {
      setItems([]);
      setRatings([]);
    }
  };

  useEffect(() => {
    load();
  }, [user?.id]);

  const openRate = (item) => {
    const existing = ratingMap.get(item.lesson.id);
    setSelected(item);
    setScore(existing?.score ? Math.round(existing.score) : 0);
    setComment(existing?.comment || '');
  };

  const submitRating = async () => {
    if (!selected?.lesson) return;
    if (score < 1) {
      toast.error('Bahoni tanlang');
      return;
    }
    const teacherId = selected.lesson.teacherId || selected.lesson.teacher?.id;
    if (!teacherId) {
      toast.error("Ushbu darsga o'qituvchi biriktirilmagan");
      return;
    }

    setSaving(true);
    try {
      await ratingsAPI.create({
        teacherId: Number(teacherId),
        lessonId: Number(selected.lesson.id),
        studentId: Number(user.id),
        score: Number(score),
        comment: comment || undefined,
      });
      toast.success('Baho yuborildi');
      setSelected(null);
      await load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Xatolik');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fade-in space-y-4">
      <h1 className="text-2xl font-900 text-gray-800">Xabarnomalar</h1>
      <p className="text-sm font-700 text-gray-500">O'tilgan darslarga baho bering. Natija admin panelida ko'rinadi.</p>

      <div className="space-y-3">
        {items.map((item) => {
          const existing = ratingMap.get(item.lesson.id);
          return (
            <button
              key={item.id}
              onClick={() => openRate(item)}
              className={`w-full rounded-2xl border p-4 text-left shadow-sm ${existing ? 'border-gray-200 bg-gray-50' : 'border-amber-300 bg-white hover:bg-amber-50/30'}`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <BellRing size={18} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-800 text-gray-800">{item.title}</p>
                  <p className="mt-1 text-xs font-700 text-gray-400">{dayjs(item.time).format('DD MMM, YYYY HH:mm')}</p>
                </div>
                {existing && (
                  <span className="rounded-lg bg-emerald-100 px-2 py-1 text-[10px] font-900 uppercase text-emerald-700">
                    Baholangan ({existing.score})
                  </span>
                )}
              </div>
            </button>
          );
        })}
        {items.length === 0 && (
          <div className="rounded-2xl border border-gray-100 bg-white p-6 text-center text-sm font-700 text-gray-400">
            Baholash uchun o'tilgan dars topilmadi
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-900 text-gray-800">Darsni baholang</h2>
              <button onClick={() => setSelected(null)} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100">
                <X size={16} />
              </button>
            </div>
            <StarInput value={score} onChange={setScore} />
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Izoh qoldiring..."
              className="mt-4 h-32 w-full rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-amber-400"
            />
            <button
              onClick={submitRating}
              disabled={saving}
              className="mt-4 w-full rounded-xl bg-amber-600 py-3 text-sm font-900 text-white disabled:opacity-60"
            >
              {saving ? 'Yuborilmoqda...' : 'Baholash'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
