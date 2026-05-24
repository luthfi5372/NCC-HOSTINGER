'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useParams } from 'next/navigation'; // 🔥 VAKSIN NEXT.JS
import Link from 'next/link';
import { 
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  CheckBadgeIcon,
  ShieldExclamationIcon,
  ComputerDesktopIcon,
  LockClosedIcon,
  LockOpenIcon
} from '@heroicons/react/24/outline';

export default function LiveMonitor() {
  // 🔥 MENGAMBIL ID DENGAN AMAN
  const params = useParams();
  const examId = params?.exam_id as string;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const supabase = createClient(supabaseUrl, supabaseKey);

  const [examInfo, setExamInfo] = useState({ title: 'Memuat Ruangan...', token: '...' });
  const [participants, setParticipants] = useState<any[]>([]);
  const [stats, setStats] = useState({ working: 0, submitted: 0, cheating: 0 });
  const [search, setSearch] = useState('');

  useEffect(() => {
    // 🔥 CEGAH ERROR JIKA ID BELUM TERBACA
    if (!examId || examId === 'undefined') return;

    // Ambil Nama Ujian dan Token
    const loadTitle = async () => {
      const { data } = await supabase.from('cbt_exams').select('title, token').eq('id', examId).maybeSingle();
      if (data) setExamInfo(data);
    };
    loadTitle();

    // Ambil Data Peserta (CCTV)
    const fetchCCTVData = async () => {
      try {
        const { data } = await supabase
          .from('cbt_attempts')
          .select('*')
          .eq('exam_id', examId)
          .order('updated_at', { ascending: false });

        if (data) {
          setParticipants(data);
          let w = 0, s = 0, c = 0;
          data.forEach(p => {
            if (p.submitted_at) s++; else w++;
            if (p.violations_count > 0) c++;
          });
          setStats({ working: w, submitted: s, cheating: c });
        }
      } catch (err) {
        console.error('Error fetching CCTV:', err);
      }
    };

    fetchCCTVData();

    // 📡 ANTENA RADAR REAL-TIME SUPABASE
    const channel = supabase.channel('live-cctv')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cbt_attempts' }, () => {
         fetchCCTVData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [examId]);

  // State untuk Custom Modal Unblock & Toast
  const [unlockUserId, setUnlockUserId] = useState<string | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success'
  });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 4000);
  };

  // FITUR UNBLOCK PESERTA (Memicu Modal)
  const handleUnlockAccess = (userId: string) => {
    setUnlockUserId(userId);
  };

  // Konfirmasi Eksekusi Unblock dari Modal Custom
  const confirmUnlockAccess = async () => {
    if (!unlockUserId) return;
    setIsUnlocking(true);

    try {
      const { error } = await supabase.from('cbt_attempts').update({
        violations_count: 0,
        updated_at: new Date().toISOString()
      }).eq('user_id', unlockUserId).eq('exam_id', examId);

      if (error) throw error;
      showToast(`Akses untuk ${unlockUserId} berhasil dibuka! Arahkan peserta untuk me-refresh layarnya.`, 'success');
    } catch (err: any) {
      showToast("Terjadi kesalahan: " + err.message, 'error');
    } finally {
      setIsUnlocking(false);
      setUnlockUserId(null);
    }
  };

  const filteredParticipants = participants.filter(p => {
    const uidString = p.user_id ? String(p.user_id).toLowerCase() : '';
    return uidString.includes(search.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-[#f4f7fe] p-6 md:p-8 font-sans text-gray-800">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-4">
            <Link href="/hq/llms" className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-gray-500 hover:text-[#5145cd] shadow-sm transition-colors border border-gray-100">
              <ArrowLeftIcon className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">CCTV: {examInfo.title}</h1>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                Sesi aktif dengan TOKEN: <span className="text-[#5145cd]">{examInfo.token}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <MagnifyingGlassIcon className="w-4 h-4 absolute left-4 top-3 text-gray-400" />
              <input 
                type="text" 
                placeholder="Cari ID Peserta..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-full text-xs font-bold focus:outline-none focus:border-[#5145cd] shadow-sm"
              />
            </div>
            <div className="px-4 py-2 bg-rose-50 text-rose-600 rounded-full flex items-center shadow-sm border border-rose-100 flex-shrink-0">
               <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse mr-2"></span>
               <span className="text-[10px] font-black tracking-widest uppercase">LIVE</span>
            </div>
          </div>
        </div>

        {/* METRIK STATISTIK */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sedang Aktif</p>
              <h3 className="text-4xl font-black mt-1 text-gray-800">{stats.working}</h3>
            </div>
            <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-[#5145cd]"><ClockIcon className="w-6 h-6" /></div>
          </div>
          <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Telah Submit</p>
              <h3 className="text-4xl font-black mt-1 text-gray-800">{stats.submitted}</h3>
            </div>
            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500"><CheckBadgeIcon className="w-6 h-6" /></div>
          </div>
          <div className="bg-white p-6 rounded-[24px] shadow-sm border border-rose-100 flex items-center justify-between bg-rose-50/30">
            <div>
              <p className="text-[10px] font-black text-rose-800 uppercase tracking-widest">Pelanggaran</p>
              <h3 className="text-4xl font-black mt-1 text-rose-600">{stats.cheating}</h3>
            </div>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stats.cheating > 0 ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-200' : 'bg-rose-100 text-rose-400'}`}>
              <ShieldExclamationIcon className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* LAYAR CCTV GRID */}
        <div className="bg-white p-6 md:p-8 rounded-[32px] shadow-sm border border-gray-100 min-h-[500px]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-base font-black text-gray-800">Layar Perangkat Peserta</h2>
            <span className="px-3 py-1 bg-indigo-50 text-[#5145cd] text-[9px] font-black uppercase tracking-widest rounded-full">Sync: {new Date().toLocaleTimeString()}</span>
          </div>

          {filteredParticipants.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <ComputerDesktopIcon className="w-16 h-16 mb-4 text-gray-200" />
              <p className="text-[10px] font-black uppercase tracking-widest">BELUM ADA PESERTA AKTIF</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredParticipants.map(p => {
                const isBlocked = p.violations_count >= 3;
                const isWarning = p.violations_count > 0 && !isBlocked;
                const isDone = !!p.submitted_at;

                return (
                  <div key={p.user_id} className={`p-5 rounded-[24px] border-2 flex flex-col justify-between transition-all relative overflow-hidden
                    ${isBlocked ? 'bg-rose-50 border-rose-500 shadow-md shadow-rose-100' : 
                      isWarning ? 'bg-amber-50 border-amber-400' : 
                      isDone ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-100'}`}
                  >
                    {isWarning && <div className="absolute top-0 left-0 w-full h-1 bg-amber-500 animate-pulse"></div>}
                    {isBlocked && <div className="absolute top-0 left-0 w-full h-1 bg-rose-600"></div>}

                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-sm font-black text-gray-900">{p.user_id}</p>
                        <p className={`text-[9px] font-bold uppercase tracking-widest mt-1
                          ${isBlocked ? 'text-rose-600' : isWarning ? 'text-amber-600' : isDone ? 'text-emerald-600' : 'text-gray-500'}`}>
                          {isBlocked ? 'DIBLOKIR' : isDone ? 'SELESAI' : 'MENGERJAKAN'}
                        </p>
                      </div>
                      
                      {isBlocked ? (
                        <button 
                          onClick={() => handleUnlockAccess(p.user_id)}
                          title="Klik untuk membuka blokir peserta ini"
                          className="p-2 rounded-xl bg-rose-500 text-white hover:bg-emerald-500 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group"
                        >
                          <LockClosedIcon className="w-5 h-5 block group-hover:hidden" />
                          <LockOpenIcon className="w-5 h-5 hidden group-hover:block" />
                        </button>
                      ) : (
                        <div className={`p-2 rounded-xl 
                          ${isWarning ? 'bg-amber-100 text-amber-600' : 
                            isDone ? 'bg-emerald-100 text-emerald-600' : 'bg-white text-gray-400 shadow-sm'}`}>
                          {isWarning ? <ShieldExclamationIcon className="w-5 h-5" /> :
                           isDone ? <CheckBadgeIcon className="w-5 h-5" /> :
                           <ComputerDesktopIcon className="w-5 h-5" />}
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-black/5 flex justify-between items-center">
                      <p className="text-[9px] font-bold text-gray-400 flex items-center">
                        <ClockIcon className="w-3 h-3 mr-1" />
                        {new Date(p.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </p>
                      
                      {p.violations_count > 0 && (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black
                          ${isBlocked ? 'bg-rose-200 text-rose-800' : 'bg-amber-200 text-amber-800'}`}>
                          {p.violations_count}x Curang
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── CUSTOM TOAST NOTIFICATION ── */}
        {toast.show && (
          <div className="fixed bottom-6 right-6 z-[10000] animate-in slide-in-from-bottom-5 fade-in duration-300">
            <div className={`px-5 py-4 rounded-2xl shadow-xl flex items-center border text-white backdrop-blur-md
              ${toast.type === 'success' 
                ? 'bg-emerald-600/95 border-emerald-500 shadow-emerald-100/50' 
                : 'bg-rose-600/95 border-rose-500 shadow-rose-100/50'}`}
            >
              {toast.type === 'success' ? (
                <CheckBadgeIcon className="w-5 h-5 mr-3 shrink-0" />
              ) : (
                <ShieldExclamationIcon className="w-5 h-5 mr-3 shrink-0" />
              )}
              <p className="text-xs font-black tracking-wide leading-relaxed">{toast.message}</p>
            </div>
          </div>
        )}

        {/* ── CUSTOM MODAL UNBLOCK ── */}
        {unlockUserId && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-[32px] p-8 md:p-10 max-w-sm w-full shadow-2xl text-center transform scale-100 animate-in zoom-in-95 duration-200 border border-gray-100 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400" />
              
              <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner relative group">
                <div className="absolute inset-0 bg-emerald-100 rounded-full scale-105 animate-ping opacity-30" />
                <LockOpenIcon className="w-10 h-10 relative z-10" />
              </div>
              
              <h2 className="text-xl font-black text-gray-900 tracking-tight">Buka Blokir Peserta?</h2>
              <p className="text-xs font-semibold text-gray-500 mt-3 leading-relaxed">
                Apakah Anda yakin ingin membuka kembali akses pengerjaan CBT untuk peserta dengan ID:
                <span className="block mt-2 font-mono font-black text-indigo-600 text-sm bg-indigo-50 px-3 py-1.5 rounded-full select-all tracking-wider border border-indigo-100 w-fit mx-auto">
                  {unlockUserId}
                </span>
              </p>
              
              <div className="mt-8 flex space-x-3">
                <button 
                  onClick={() => setUnlockUserId(null)}
                  disabled={isUnlocking}
                  className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Batal
                </button>
                <button 
                  onClick={confirmUnlockAccess}
                  disabled={isUnlocking}
                  className="flex-1 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-emerald-100/50 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUnlocking ? (
                    <>
                      <svg className="animate-spin h-4.5 w-4.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <span>Buka Akses</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
