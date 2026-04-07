import React, { useState, useRef } from 'react';
import { User, Phone, Mail, Lock, Camera, Save } from 'lucide-react';
import { PageHeader, Field, Input, Avatar } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import { useTeacherAuth } from '../context/TeacherAuthContext';
import { useStudentAuth } from '../context/StudentAuthContext';
import { usersAPI, teachersAPI, studentsAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function Profile() {
  const adminAuth = useAuth();
  const teacherAuth = useTeacherAuth();
  const studentAuth = useStudentAuth();

  const user = adminAuth.user || teacherAuth.user || studentAuth.user;
  const role = adminAuth.user ? 'ADMIN' : (teacherAuth.user ? 'TEACHER' : 'STUDENT');
  const api = adminAuth.user ? usersAPI : (teacherAuth.user ? teachersAPI : studentsAPI);

  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    email: user?.email || '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  const fileRef = useRef(null);

  const handlePhotoPick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const fd = new FormData();
    fd.append('photo', file);
    
    setLoading(true);
    try {
      const res = await api.uploadPhoto(user.id, fd);
      const newUser = { ...user, photo: res.data.photo };
      
      if (adminAuth.user) adminAuth.updateUser(newUser);
      else if (teacherAuth.user) teacherAuth.updateUser(newUser);
      else if (studentAuth.user) studentAuth.updateUser(newUser);
      
      toast.success('Rasm muvaffaqiyatli yuklandi!');
    } catch (err) {
      toast.error('Rasmni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = { ...form };
      if (!data.password) delete data.password;
      
      const res = await api.update(user.id, data);
      
      // Update local storage/context
      const newUser = { ...user, ...res.data };
      if (adminAuth.user) adminAuth.updateUser(newUser);
      else if (teacherAuth.user) teacherAuth.updateUser(newUser);
      else if (studentAuth.user) studentAuth.updateUser(newUser);

      toast.success('Ma\'lumotlar muvaffaqiyatli yangilandi!');
      setForm(p => ({ ...p, password: '' }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in max-w-2xl mx-auto">
      <PageHeader 
        title="Profil sozlamalari" 
        subtitle="Shaxsiy ma'lumotlaringizni boshqaring"
      />

        <div className="bg-white dark:bg-[#1A1A24] rounded-2xl p-8 mb-6 shadow-sm border border-gray-100 dark:border-white/5">
          <h3 className="text-lg font-900 text-gray-800 dark:text-gray-100 mb-6">Shaxsiy ma'lumotlar</h3>
          <div className="flex flex-col md:flex-row gap-10">
            <div className="flex flex-col gap-6 w-full md:w-auto shrink-0">
               <div className="flex items-center gap-6">
                 <div className="flex flex-col items-center">
                    <div className="w-32 h-40 border border-gray-200 dark:border-white/10 flex items-center justify-center p-2 mb-2 relative overflow-hidden group">
                      {user?.photo ? (
                         <img src={user.photo} alt="avatar" className="w-full h-full object-cover" />
                      ) : (
                         <Avatar name={user?.fullName || "Namuna"} size="xl" className="w-full h-full rounded-none" />
                      )}
                      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoPick} />
                      <div 
                        onClick={() => fileRef.current?.click()}
                        className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <Camera className="text-white" size={24} />
                      </div>
                    </div>
                    <span className="text-[10px] font-900 uppercase tracking-widest text-gray-500 border border-gray-200 dark:border-white/10 w-full text-center py-1 bg-gray-50 dark:bg-white/5">Namuna</span>
                 </div>
                 
                 <div className="flex flex-col items-center">
                    <div className="w-24 h-24 rounded-full overflow-hidden border border-gray-200 dark:border-white/10 mb-2 relative">
                      <img src="https://ui-avatars.com/api/?name=User&background=random" className="w-full h-full object-cover grayscale opacity-50" alt="view" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                         <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                            <div className="w-2.5 h-2.5 bg-gray-800 rounded-full" />
                         </div>
                      </div>
                    </div>
                    <span className="text-[9px] font-900 text-white bg-[#4CAF50] rounded px-2 py-0.5 mt-2 shadow-sm">Talabga mos</span>
                 </div>
               </div>
               <p className="text-[10px] text-gray-400 font-600 max-w-[200px]">500x500 o'lcham, JPEG, JPG, PNG format, maksimum 2MB</p>
            </div>
            
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div>
                   <p className="text-[11px] font-700 text-gray-400 mb-1">Kategoriya</p>
                   <p className="text-sm font-900 text-gray-800 dark:text-gray-100">{role}</p>
                </div>
                <div>
                   <p className="text-[11px] font-700 text-gray-400 mb-1">Telefon raqam</p>
                   <p className="text-sm font-900 text-gray-800 dark:text-gray-100">{user?.phone || 'Kiritilmagan'}</p>
                </div>
                <div>
                   <p className="text-[11px] font-700 text-gray-400 mb-1">Ism Familiya</p>
                   <p className="text-sm font-900 text-gray-800 dark:text-gray-100">{user?.fullName || 'Kiritilmagan'}</p>
                </div>
                <div>
                   <p className="text-[11px] font-700 text-gray-400 mb-1">Tug'ilgan sana</p>
                   <p className="text-sm font-900 text-gray-800 dark:text-gray-100">Kiritilmagan</p>
                </div>
                <div>
                   <p className="text-[11px] font-700 text-gray-400 mb-1">Jinsi</p>
                   <p className="text-sm font-900 text-gray-800 dark:text-gray-100">Noma'lum</p>
                </div>
                <div>
                   <p className="text-[11px] font-700 text-gray-400 mb-1">HH ID</p>
                   <p className="text-sm font-900 text-gray-800 dark:text-gray-100">{user?.id || '—'}</p>
                </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
           {/* Kirish Box */}
           <div className="bg-white dark:bg-[#1A1A24] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-white/5 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-900 text-gray-800 dark:text-gray-100 mb-6">Kirish (Email/ID)</h3>
                <Input 
                   type="email" 
                   value={form.email} 
                   onChange={e => setForm({ ...form, email: e.target.value })} 
                   placeholder="example@gmail.com" 
                   required
                   className="mt-2"
                />
              </div>
           </div>
           
           {/* Parol Box */}
           <div className="bg-white dark:bg-[#1A1A24] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-white/5 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-900 text-gray-800 dark:text-gray-100 mb-6">Parol</h3>
                <Input 
                   type="password" 
                   value={form.password} 
                   onChange={e => setForm({ ...form, password: e.target.value })} 
                   placeholder="••••••••" 
                   className="mt-2"
                />
                <p className="text-[10px] text-gray-400 mt-2 font-600">Parolni o'zgartirish uchun yozing</p>
              </div>
           </div>
           
           {/* Bildirishnoma Box */}
           <div className="bg-white dark:bg-[#1A1A24] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-white/5 flex flex-col">
              <h3 className="text-sm font-900 text-gray-800 dark:text-gray-100 mb-2">Bildirishnoma sozlamalari</h3>
              <p className="text-xs text-gray-500 font-500 mt-auto">Xabarnomalarni sozlash tizimi hozircha mavjud emas.</p>
           </div>
           
           <div className="col-span-1 md:col-span-3 flex justify-end">
              <button 
                type="submit" 
                className="btn-primary px-8 py-3 rounded-xl font-900 uppercase tracking-widest text-xs flex items-center gap-2 shadow-lg shadow-primary/25 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'SAQLANMOQDA...' : <><Save size={16} /> SAQLASH</>}
              </button>
           </div>
        </form>

        <div className="bg-white dark:bg-[#1A1A24] rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-white/5">
           <h3 className="text-lg font-900 text-gray-800 dark:text-gray-100 mb-6">Shartnomalarim</h3>
           <div className="p-4 border border-gray-100 dark:border-white/5 rounded-xl bg-gray-50/50 dark:bg-white/5 font-600 text-sm text-gray-500">
               Faol shartnomalar topilmadi.
           </div>
        </div>
    </div>
  );
}
