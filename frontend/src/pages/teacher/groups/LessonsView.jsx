import React, { useEffect, useState } from 'react';
import { BookOpen } from 'lucide-react';
import { Empty } from '../../../components/UI';
import { lessonsAPI } from '../../../services/api';
import dayjs from 'dayjs';

export default function LessonsView({ group }) {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    lessonsAPI.getAll({ groupId: group.id })
      .then(r => setLessons(r.data || []))
      .finally(() => setLoading(false));
  }, [group.id]);

  return (
    <div className="bg-white rounded-2xl w-full border border-gray-100 shadow-sm overflow-hidden mt-6">
      <div className="p-6 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
         <div>
            <h3 className="text-lg font-900 text-gray-800">Guruh darsliklari</h3>
            <p className="text-[13px] font-800 text-gray-400 mt-1">O'quv markaz tomonidan belgilangan o'quv dasturi</p>
         </div>
         <div className="w-12 h-12 rounded-[14px] bg-emerald-100 text-[#00b58e] flex items-center justify-center">
            <BookOpen size={20} />
         </div>
      </div>
      {loading ? (
         <div className="p-8 text-center text-gray-400 font-800 text-sm">Yuklanmoqda...</div>
      ) : (
        <div className="divide-y divide-gray-50">
          {lessons.map((l, i) => (
             <div key={l.id} className="p-5 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                <div className="min-w-[40px] h-[40px] rounded-xl bg-gray-100 text-gray-500 font-900 flex items-center justify-center text-sm">
                   {i + 1}
                </div>
                <div className="flex-1">
                   <h4 className="font-800 text-gray-800 text-[15px]">{l.title}</h4>
                   <p className="font-800 text-gray-400 text-[12px] mt-1">{dayjs(l.date).format('DD MMM, YYYY')}</p>
                </div>
             </div>
          ))}
          {lessons.length === 0 && <div className="py-12"><Empty text="Darsliklar topilmadi" /></div>}
        </div>
      )}
    </div>
  );
}


