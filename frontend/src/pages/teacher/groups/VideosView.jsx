import React, { useEffect, useRef, useState } from 'react';
import { FileVideo, PlayCircle, Edit2, X } from 'lucide-react';
import { Empty } from '../../../components/UI';
import { lessonsAPI, lessonVideosAPI } from '../../../services/api';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

export default function VideosView({ group, teacher }) {
  const [videos, setVideos] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form states
  const [videoFile, setVideoFile] = useState(null);
  const [videoTitle, setVideoTitle] = useState('');
  const [lessonId, setLessonId] = useState('');
  const [uploading, setUploading] = useState(false);
  const [editingVideoId, setEditingVideoId] = useState(null);
  const fileInputRef = useRef(null);

  // Player state
  const [playingVideo, setPlayingVideo] = useState(null);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      lessonsAPI.getAll({ groupId: group.id }),
      lessonVideosAPI.getAll({ groupId: group.id, teacherId: teacher.id })
    ]).then(([lRes, vRes]) => {
      setLessons(lRes.data || []);
      setVideos(vRes.data || []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [group.id]);

  const openEdit = (v) => {
    setEditingVideoId(v.id);
    setLessonId(v.lessonId);
    setVideoTitle(v.title || '');
    setVideoFile(null);
    setUploadOpen(true);
  }

  const closeForm = () => {
    setUploadOpen(false);
    setVideoFile(null);
    setVideoTitle('');
    setLessonId('');
    setEditingVideoId(null);
  }

  const handleUpload = async () => {
    if (!lessonId) {
      toast.error("Mavzuni tanlash majburiy!");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('lessonId', String(Number(lessonId)));
      if (videoTitle) fd.append('title', String(videoTitle));
      
      if (editingVideoId) {
         if (videoFile) fd.append('file', videoFile);
         if (teacher?.id) fd.append('teacherId', String(teacher.id));
         await lessonVideosAPI.update(editingVideoId, fd);
         toast.success("Video muvaffaqiyatli tahrirlandi!");
      } else {
         if (!videoFile) {
            toast.error("Videofaylni qo'shing!");
            setUploading(false);
            return;
         }
         fd.append('title', String(videoTitle || videoFile.name || 'Video'));
         if (teacher?.id) fd.append('teacherId', String(teacher.id));
         fd.append('file', videoFile);
         await lessonVideosAPI.create(fd);
         toast.success("Video muvaffaqiyatli yuklandi!");
      }
      
      closeForm();
      loadData();
    } catch (e) {
      const msg = e?.response?.data?.message || e?.response?.data?.error || "Video saqlashda xatolik yuz berdi";
      toast.error(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setUploading(false);
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '-';
    const b = Number(bytes);
    if(isNaN(b)) return bytes;
    if (b < 1048576) return (b / 1024).toFixed(2) + ' KB';
    else if (b < 1073741824) return (b / 1048576).toFixed(2) + ' MB';
    else return (b / 1073741824).toFixed(2) + ' GB';
  };

  return (
    <div className="bg-white rounded-2xl w-full border border-gray-100 shadow-sm overflow-hidden mt-6 relative">
       {playingVideo && (
          <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm">
             <button onClick={() => setPlayingVideo(null)} className="absolute top-6 right-6 text-white hover:text-gray-300 transition-colors bg-white/10 p-2 rounded-full backdrop-blur-md">
                <X size={28}/>
             </button>
             <div className="w-full max-w-5xl bg-black rounded-2xl overflow-hidden flex flex-col shadow-2xl border border-white/10 animate-in zoom-in-95 duration-200">
                <video 
                   controls 
                   autoPlay
                   src={playingVideo.file?.startsWith('http') ? playingVideo.file : `http://localhost:4000/uploads/${playingVideo.file?.split('/').pop()}`}
                   className="w-full h-auto max-h-[80vh] outline-none"
                />
                <div className="p-5 bg-gray-900 border-t border-white/10 flex items-center justify-between">
                   <div>
                      <h3 className="text-white font-900 text-lg">{playingVideo.title}</h3>
                      <p className="text-gray-400 text-sm font-800 mt-0.5">{lessons.find(l => l.id === playingVideo.lessonId)?.title}</p>
                   </div>
                   <div className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-900 uppercase tracking-widest border border-emerald-500/20">
                      {formatSize(playingVideo.size)}
                   </div>
                </div>
             </div>
          </div>
       )}

       {uploadOpen && (
          <div className="fixed inset-0 z-50 bg-gray-500/40 flex items-center justify-center p-4 backdrop-blur-sm">
             <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-[850px] overflow-hidden animate-in zoom-in-95 duration-200 border border-white">
                <div className="flex items-center justify-between p-6 pb-2">
                   <h3 className="text-[19px] font-900 text-gray-800">{editingVideoId ? "Videoni tahrirlash" : "Video qo'shish"}</h3>
                   <button onClick={closeForm} disabled={uploading} className="text-gray-400 hover:text-gray-800 bg-gray-50 p-2 rounded-full"><X size={18}/></button>
                </div>
                <div className="p-6 pt-4 space-y-6">
                   <div className="grid grid-cols-2 gap-6">
                      <div>
                         <label className="text-[12px] font-800 text-red-500 mb-1.5 block uppercase tracking-wide">
                            * <span className="text-gray-800">Dars (Mavzu)</span>
                         </label>
                         <select 
                           value={lessonId} 
                           onChange={(e) => setLessonId(e.target.value)}
                           className="w-full px-4 py-3.5 rounded-xl border border-gray-200 text-[14px] font-800 text-gray-800 outline-none focus:border-[#00b58e] focus:ring-4 focus:ring-[#00b58e]/10 appearance-none bg-white transition-all shadow-sm"
                         >
                            <option value="" disabled>Mavzulardan birini tanlang</option>
                            {lessons.map(l => (
                              <option key={l.id} value={l.id}>{l.title}</option>
                            ))}
                         </select>
                      </div>
                      <div>
                         <label className="text-[12px] font-800 text-gray-800 mb-1.5 block uppercase tracking-wide">Video nomi (ixtiyoriy)</label>
                         <input 
                           type="text" 
                           value={videoTitle}
                           onChange={(e) => setVideoTitle(e.target.value)}
                           placeholder="Dasturlash asoslari..."
                           className="w-full px-4 py-3.5 rounded-xl border border-gray-200 text-[14px] font-800 text-gray-800 outline-none focus:border-[#00b58e] focus:ring-4 focus:ring-[#00b58e]/10 transition-all shadow-sm"
                         />
                      </div>
                   </div>

                   <input 
                     type="file" 
                     ref={fileInputRef} 
                     onChange={(e) => setVideoFile(e.target.files[0])} 
                     accept="video/*"
                     className="hidden" 
                   />
                   <div 
                     onClick={() => !uploading && fileInputRef.current?.click()}
                     className={`border-2 border-dashed border-[#00b58e] rounded-[20px] p-12 flex flex-col items-center justify-center text-center transition-all ${uploading ? 'opacity-50 cursor-wait bg-gray-50' : 'cursor-pointer hover:bg-emerald-50 hover:border-emerald-500 bg-white shadow-sm'}`}
                   >
                      <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-[#00b58e] flex items-center justify-center mb-5 shadow-sm">
                         <FileVideo size={32} strokeWidth={1.5} />
                      </div>
                      <p className="text-[16px] font-900 text-gray-800 mb-1.5">
                        {videoFile ? videoFile.name : (editingVideoId ? "Yangi fayl yuklash uchun bosing (ixtiyoriy)" : "Videofaylni yuklash uchun ustiga bosing")}
                      </p>
                      <p className="text-[13px] font-800 text-gray-400">
                        {videoFile ? formatSize(videoFile.size) : ".mp4, .webm, .mov formatlarida"}
                      </p>
                   </div>
                   
                   <div className="flex justify-end mt-6 gap-3 border-t border-gray-100 pt-6">
                       <button onClick={closeForm} disabled={uploading} className="px-6 py-2.5 bg-gray-100 text-gray-600 text-[13px] font-900 rounded-xl hover:bg-gray-200 transition-all disabled:opacity-50 uppercase tracking-wide">Bekor qilish</button>
                       <button onClick={handleUpload} disabled={uploading} className="min-w-[140px] flex items-center justify-center px-8 py-2.5 bg-[#00b58e] text-white text-[13px] font-900 rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/30 disabled:opacity-70 uppercase tracking-wide">
                          {uploading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : "Saqlash"}
                       </button>
                   </div>
                </div>
             </div>
          </div>
       )}

       <div className="w-full flex justify-between items-center p-5 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-[#00b58e]">
                <FileVideo size={20} />
             </div>
             <div>
                <h3 className="font-900 text-gray-800 text-[16px]">Dars video yozuvlari</h3>
                <p className="text-gray-400 text-[12px] font-800">{videos.length} ta videolar</p>
             </div>
          </div>
          <button onClick={() => { closeForm(); setUploadOpen(true); }} className="px-5 py-2.5 bg-[#00b58e] text-white text-[13px] font-900 uppercase tracking-widest rounded-xl hover:bg-emerald-600 transition-all shadow-md shadow-emerald-500/20 active:scale-95 flex items-center gap-2">
            Video Qo'shish <PlayCircle size={16}/>
          </button>
       </div>
       <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
               {['Video nomi', 'Dars nomi', 'Status', 'Dars sanasi', 'Hajmi', "Qo'shilgan vaqti", 'Harakatlar'].map((h, i) =>(
                 <th key={h} className={`px-6 py-4 text-[12px] uppercase tracking-wider font-900 text-gray-400 ${i === 6 ? 'text-right' : ''}`}>{h}</th>
               ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 bg-white">
             {loading ? <tr><td colSpan={7} className="py-20 text-center text-gray-400 font-800">Yuklanmoqda...</td></tr> : videos.map(v => {
               const lesson = lessons.find(l => l.id === v.lessonId);
               return (
                 <tr key={v.id} className="hover:bg-gray-50/80 transition-colors group">
                    <td className="px-6 py-4 max-w-[200px] truncate">
                       <div className="flex items-center gap-3" title={v.title}>
                          <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center cursor-pointer hover:bg-[#00b58e] hover:text-white text-[#00b58e] transition-colors" onClick={() => setPlayingVideo(v)}>
                             <PlayCircle size={16} className="flex-shrink-0" />
                          </div>
                          <span onClick={() => setPlayingVideo(v)} className="text-[14px] font-900 text-gray-800 hover:text-[#00b58e] cursor-pointer truncate transition-colors">{v.title}</span>
                       </div>
                    </td>
                    <td className="px-6 py-4 text-[13px] font-800 text-gray-600 truncate max-w-[150px]" title={lesson?.title}>{lesson?.title}</td>
                    <td className="px-6 py-4">
                       <span className="px-2.5 py-1 border border-emerald-500/20 text-[#00b58e] text-[10px] font-900 rounded-md bg-emerald-50 uppercase tracking-widest flex items-center gap-1.5 w-max">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#00b58e]"></span> Tayyor
                       </span>
                    </td>
                    <td className="px-6 py-4 text-[13px] font-800 text-gray-600">{lesson ? dayjs(lesson.date).format('DD MMM, YYYY') : '-'}</td>
                    <td className="px-6 py-4 text-[13px] font-800 text-gray-500 bg-gray-50/50">{formatSize(v.size)}</td>
                    <td className="px-6 py-4 text-[12px] font-800 text-gray-400">{dayjs(v.created_at).format('DD MMM, YYYY')}</td>
                    <td className="px-6 py-4 text-right pr-6">
                       <button onClick={() => openEdit(v)} className="text-gray-400 hover:text-[#00b58e] p-2 rounded-xl hover:bg-emerald-50 transition-all">
                          <Edit2 size={16} />
                       </button>
                    </td>
                 </tr>
               );
             })}
             {videos.length === 0 && !loading && <tr><td colSpan={7} className="py-24 text-center text-gray-400 flex flex-col items-center justify-center"><FileVideo size={40} className="text-gray-200 mb-3"/><span className="font-800 text-sm">Videolar topilmadi</span></td></tr>}
          </tbody>
       </table>
    </div>
  );
}

