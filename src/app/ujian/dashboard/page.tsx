'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { 
  UserIcon, 
  AcademicCapIcon, 
  ShieldCheckIcon,
  ArrowRightIcon,
  ArrowLeftOnRectangleIcon,
  ClockIcon,
  ShieldExclamationIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

export default function StudentDashboard() {
  const router = useRouter();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const supabase = createClient(supabaseUrl, supabaseKey);

  const [student, setStudent] = useState<any>(null);
  const [examDetail, setExamDetail] = useState<any>(null);
  const [questionCount, setQuestionCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDone, setIsDone] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('ncc_user');
    if (!savedUser) {
      router.push('/ujian/login');
      return;
    }
    
    const parsedUser = JSON.parse(savedUser);
    setStudent(parsedUser);

    // 1. TANGKAP SURAT PENGANTAR (Notifikasi Sukses)
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('status') === 'success') {
      showToast("Luar biasa! Ujian berhasil diselesaikan dan skor telah diamankan.", "success");
      // Bersihkan URL agar rapi kembali
      window.history.replaceState(null, '', '/ujian/dashboard');
    }

    const fetchExamInfoAndReportPresence = async () => {
        if (parsedUser.active_exam_id) {
          // 1. Ambil detail waktu ujian
          const { data: exData } = await supabase
            .from('cbt_exams')
            .select('duration')
            .eq('id', parsedUser.active_exam_id)
            .single();
          if (exData) setExamDetail(exData);

          // 2. 🔥 KODINGAN BARU: Hitung apakah panitia sudah memasukkan soal?
          const { count } = await supabase
            .from('cbt_questions')
            .select('*', { count: 'exact', head: true })
            .eq('exam_id', parsedUser.active_exam_id);
          setQuestionCount(count || 0);

          // 🔥 KODINGAN BARU: CEK & PISAHKAN DATA BERDASARKAN SESI (exam_id)
          const userId = parsedUser.nisn || parsedUser.username;
          
          const { data: existingAttempt } = await supabase
            .from('cbt_attempts')
            .select('id, submitted_at')
            .eq('user_id', userId)
            .eq('exam_id', parsedUser.active_exam_id)
            .maybeSingle();

          if (existingAttempt) {
            // Jika PESERTA INI sudah punya data di SESI INI, update jam aktifnya
            await supabase.from('cbt_attempts').update({ updated_at: new Date().toISOString() })
              .eq('id', existingAttempt.id);
            
            // Cek apakah di SESI INI dia sudah selesai?
            if (existingAttempt.submitted_at) {
              setIsDone(true);
              localStorage.setItem(`cbt_submitted_${parsedUser.active_exam_id}`, 'true');
            } else {
              setIsDone(false);
              localStorage.removeItem(`cbt_submitted_${parsedUser.active_exam_id}`);
            }
          } else {
            // Jika ini PERTAMA KALINYA masuk ke SESI INI, buatkan KERTAS KOSONG BARU!
            await supabase.from('cbt_attempts').insert({
              user_id: userId,
              exam_id: parsedUser.active_exam_id,
              violations_count: 0,
              score: 0,
              updated_at: new Date().toISOString()
            });
            setIsDone(false);
            localStorage.removeItem(`cbt_submitted_${parsedUser.active_exam_id}`);
          }
        }
        setLoading(false);
      };

      fetchExamInfoAndReportPresence();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('ncc_user');
    router.push('/ujian/login');
  };

  const handleStartExam = () => {
    if (student?.active_exam_id && questionCount && questionCount > 0) {
      router.push(`/ujian/${student.active_exam_id}`);
    }
  };

  if (loading || !student) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center font-sans">
        <div className="text-center space-y-3 animate-pulse">
          <div className="w-10 h-10 bg-indigo-100 rounded-full mx-auto flex items-center justify-center text-[#5145cd]">
            <ClockIcon className="w-6 h-6 animate-spin" />
          </div>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Menyinkronkan Sesi...</p>
        </div>
      </div>
    );
  }

  // Cek apakah soal sudah ada
  const isExamReady = questionCount !== null && questionCount > 0;

  return (
    <div className="min-h-screen bg-[#f4f7fe] p-6 md:p-10 font-sans select-none text-gray-800 relative">
      {/* Toast Notification */}
      {toast.visible && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className={`text-white px-6 py-4 rounded-2xl shadow-xl flex items-center border 
            ${toast.type === 'success' ? 'bg-emerald-500 border-emerald-400 shadow-emerald-200' : 'bg-rose-500 border-rose-400 shadow-rose-200'}`}>
            <ShieldCheckIcon className="w-5 h-5 mr-3" />
            <p className="text-sm font-black tracking-wide">{toast.message}</p>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* TOP BAR / NAVIGASI */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 px-6 rounded-full shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-gray-100">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-[#5145cd] text-white rounded-full flex items-center justify-center font-black text-lg shadow-sm">N</div>
            <div>
               <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">CBT Dashboard</p>
               <h2 className="text-sm font-bold text-[#5145cd]">Peserta Cabang {student.branch || student.lomba || 'MIPA'}</h2>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center px-4 py-2 hover:bg-rose-50 text-gray-400 hover:text-rose-600 rounded-full text-[10px] font-black uppercase tracking-widest transition-all">
            <ArrowLeftOnRectangleIcon className="w-4 h-4 mr-2" /> Keluar Sesi
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* PROFIL PESERTA */}
          <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-[#5145cd]"></div>
            <div className="w-20 h-20 bg-gray-50 border-4 border-white rounded-full flex items-center justify-center text-gray-300 shadow-md mb-5 mt-2">
              <UserIcon className="w-10 h-10" />
            </div>
            <h2 className="text-lg font-black text-gray-900 leading-snug">{student.full_name || student.nama_lengkap || 'Peserta NCC'}</h2>
            <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-full">{student.nisn || student.username}</p>
            <div className="w-full border-t border-gray-100 mt-8 pt-6 space-y-4 text-left">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Kategori</span>
                <span className="font-black text-[#5145cd] bg-indigo-50 px-3 py-1 rounded-full text-[10px] uppercase tracking-wider">{student.branch || student.lomba || 'MIPA'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status Data</span>
                <span className="font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full text-[10px] flex items-center uppercase tracking-wider">
                  <ShieldCheckIcon className="w-3.5 h-3.5 mr-1" /> Verified
                </span>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 space-y-6">
            {/* KOTAK SESI UJIAN */}
            <div className={`p-8 rounded-[32px] shadow-sm border transition-all ${isExamReady ? 'bg-white border-gray-100' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-start justify-between">
                <div>
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${isExamReady ? 'bg-amber-50 text-amber-600' : 'bg-gray-200 text-gray-500'}`}>
                    {isExamReady ? 'Sesi Tersedia' : 'Belum Ada Soal'}
                  </span>
                  <h3 className="text-2xl font-black text-gray-900 mt-3 tracking-tight">
                    {student.active_exam_title || 'Sesi Ujian'}
                  </h3>
                  <div className="flex items-center space-x-4 mt-2">
                    <p className="text-xs font-bold text-gray-400 flex items-center">
                      <ClockIcon className="w-4 h-4 mr-1 text-[#5145cd]" /> {examDetail?.duration || 90} Menit
                    </p>
                    <p className="text-xs font-bold text-gray-400 flex items-center">
                      — {questionCount} Soal
                    </p>
                  </div>
                </div>
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner border ${isExamReady ? 'bg-indigo-50 text-[#5145cd] border-indigo-100' : 'bg-gray-100 text-gray-400 border-gray-200'}`}>
                  <AcademicCapIcon className="w-7 h-7" />
                </div>
              </div>

              {!isExamReady && (
                <div className="mt-6 p-4 bg-amber-50 rounded-2xl flex items-start text-amber-700 border border-amber-200">
                  <ExclamationCircleIcon className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
                  <p className="text-xs font-semibold leading-relaxed">
                    Panitia belum memasukkan / menerbitkan soal untuk ujian ini. Silakan tunggu atau hubungi panitia jika ini adalah sebuah kesalahan.
                  </p>
                </div>
              )}

              {/* JIKA SUDAH SELESAI, TAMPILKAN BADGE HIJAU. JIKA BELUM, TAMPILKAN TOMBOL MASUK */}
              {isDone ? (
                <div className="mt-6 py-4 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-2xl flex items-center justify-center font-black text-xs uppercase tracking-widest shadow-sm">
                  <ShieldCheckIcon className="w-5 h-5 mr-2" /> Ujian Telah Diselesaikan
                </div>
              ) : (
                <button
                  onClick={handleStartExam}
                  disabled={!isExamReady}
                  className={`w-full mt-6 py-4 text-xs font-black uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center space-x-2 group
                    ${isExamReady 
                      ? 'bg-[#5145cd] hover:bg-[#3d32a8] active:scale-[0.99] text-white shadow-lg shadow-indigo-200' 
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                >
                  <span>{isExamReady ? 'Masuk Ruang Ujian' : 'Akses Terkunci'}</span>
                  {isExamReady && <ArrowRightIcon className="w-4 h-4 transition-transform group-hover:translate-x-1" />}
                </button>
              )}
            </div>

            {/* ATURAN */}
            <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center mb-5">
                <ShieldExclamationIcon className="w-4 h-4 mr-2 text-amber-500" /> Protokol Integritas CBT
              </h4>
              <ul className="text-xs text-gray-500 space-y-4">
                <li className="flex items-start">
                  <div className="w-5 h-5 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center font-black text-[10px] mr-3 flex-shrink-0 mt-0.5">1</div>
                  <span className="leading-relaxed"><strong>Sistem Anti-Tab:</strong> Keluar dari layar ujian atau berpindah tab akan tercatat secara otomatis oleh Pusat Komando sebagai upaya diskualifikasi.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
