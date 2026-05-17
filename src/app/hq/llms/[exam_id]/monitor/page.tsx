'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { 
  ArrowLeft,
  Monitor,
  ShieldAlert,
  BadgeCheck,
  Clock,
  AlertTriangle,
  UserCircle
} from 'lucide-react';
import { useParams } from 'next/navigation';

export default function LiveMonitor() {
  const params = useParams();
  const examId = params.exam_id as string;
  const supabase = createClient();

  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fungsi mengambil data peserta yang sedang ujian di sesi ini
  const fetchMonitorData = async () => {
    try {
      const { data, error } = await supabase
        .from('cbt_attempts')
        .select('*')
        // .eq('exam_id', examId) // Aktifkan ini jika tabel attempts-mu punya kolom exam_id
        .order('updated_at', { ascending: false });

      if (data) setParticipants(data);
    } catch (err) {
      console.error('Gagal mengambil data monitor:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitorData();

    // Antena Real-time: Berubah seketika jika siswa klik jawaban atau curang!
    const channel = supabase
      .channel('live-cctv')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cbt_attempts' }, (payload) => {
        fetchMonitorData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [examId]);

  // Hitung Statistik Cepat
  const activeCount = participants.filter(p => !p.submitted_at).length;
  const cheatingCount = participants.filter(p => p.violations_count > 0).length;
  const finishedCount = participants.filter(p => p.submitted_at).length;

  return (
    <div className="min-h-screen bg-slate-100 p-6 md:p-8 font-sans select-none text-gray-800 text-left overflow-x-hidden">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* HEADER */}
        <div className="bg-white p-4 rounded-2xl border-2 border-gray-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-4 px-2">
            <Link href="/hq/llms" className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition-colors border border-gray-300">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shadow-inner border border-blue-100">
              <Monitor className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-gray-900">Live Monitor Pengawas</h1>
              <p className="text-xs text-gray-500 font-bold mt-0.5 font-mono uppercase">SESI: {examId?.substring(0, 12)}...</p>
            </div>
          </div>

          {/* INDIKATOR STATUS CCTV */}
          <div className="flex items-center space-x-3">
            <div className="px-4 py-2 bg-slate-800 border-2 border-slate-900 rounded-xl flex items-center shadow-lg">
               <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse mr-2 shadow-[0_0_8px_rgba(244,63,94,0.8)]"></span>
               <span className="text-xs font-black text-white uppercase tracking-widest">Rec. Active</span>
            </div>
          </div>
        </div>

        {/* METRIK REKAP */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white p-5 rounded-2xl border-2 border-indigo-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Peserta Mengerjakan</p>
              <h3 className="text-3xl font-black text-indigo-600 mt-1">{activeCount}</h3>
            </div>
            <Clock className="w-10 h-10 text-indigo-100" />
          </div>
          <div className="bg-white p-5 rounded-2xl border-2 border-emerald-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Selesai / Submit</p>
              <h3 className="text-3xl font-black text-emerald-600 mt-1">{finishedCount}</h3>
            </div>
            <BadgeCheck className="w-10 h-10 text-emerald-100" />
          </div>
          <div className="bg-rose-50/50 p-5 rounded-2xl border-2 border-rose-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-rose-800 uppercase tracking-widest">Deteksi Kecurangan</p>
              <h3 className="text-3xl font-black text-rose-600 mt-1">{cheatingCount}</h3>
            </div>
            <ShieldAlert className={`w-10 h-10 ${cheatingCount > 0 ? 'text-rose-500 animate-pulse' : 'text-rose-200'}`} />
          </div>
        </div>

        {/* PANEL CCTV (BENTO GRID PESERTA) */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-sm p-6">
          <div className="flex justify-between items-center mb-6 border-b-2 border-gray-100 pb-4">
            <h2 className="text-base font-black text-gray-800">Layar Perangkat Peserta</h2>
            <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200 uppercase tracking-widest">Sinkronisasi 1 Detik</span>
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-gray-400">
              <Monitor className="w-12 h-12 animate-pulse mb-3 text-gray-300" />
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Menyambungkan ke perangkat peserta...</p>
            </div>
          ) : participants.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
              <UserCircle className="w-12 h-12 mb-3 text-gray-300" />
              <p className="text-xs font-bold uppercase tracking-widest">Belum ada peserta yang masuk ruangan</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {participants.map((p, idx) => {
                const isCheating = p.violations_count > 0;
                const isFinished = p.submitted_at !== null;
                
                return (
                  <div key={idx} className={`relative p-4 rounded-xl border-2 transition-all flex flex-col h-32
                    ${isFinished ? 'border-emerald-200 bg-emerald-50/30' : 
                      isCheating ? 'border-rose-400 bg-rose-50 shadow-[0_0_15px_rgba(244,63,94,0.15)]' : 
                      'border-indigo-100 bg-white hover:border-indigo-300 shadow-sm'}`}
                  >
                    {/* Badge Selesai */}
                    {isFinished && (
                      <div className="absolute top-3 right-3 text-emerald-500">
                        <BadgeCheck className="w-5 h-5" />
                      </div>
                    )}

                    {/* Badge Curang Berkedip */}
                    {isCheating && !isFinished && (
                      <div className="absolute top-2 right-2 flex items-center bg-rose-100 px-2 py-1 rounded-md border border-rose-300">
                        <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping mr-1.5"></span>
                        <span className="text-[8px] font-black text-rose-700 tracking-widest">PELANGGARAN</span>
                      </div>
                    )}

                    <div className="flex items-center space-x-3 mb-auto mt-1">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-black text-xs shadow-sm
                        ${isFinished ? 'bg-emerald-400' : isCheating ? 'bg-rose-500' : 'bg-indigo-500'}`}>
                        {p.user_id ? p.user_id.substring(0, 2).toUpperCase() : '?'}
                      </div>
                      <div className="min-w-0 flex-1 text-left">
                        <p className="text-xs font-black text-gray-800 truncate">{p.user_id}</p>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">
                          {isFinished ? 'Telah Submit' : 'Online Aktif'}
                        </p>
                      </div>
                    </div>

                    {/* Informasi Status Bawah */}
                    <div className={`mt-3 pt-2.5 border-t-2 flex items-center justify-between
                      ${isFinished ? 'border-emerald-200/50' : isCheating ? 'border-rose-200' : 'border-gray-100'}`}>
                      
                      {!isFinished ? (
                        <div className="flex items-center">
                          <Monitor className={`w-3.5 h-3.5 mr-1.5 ${isCheating ? 'text-rose-500' : 'text-indigo-400'}`} />
                          <span className={`text-[10px] font-black uppercase tracking-wider ${isCheating ? 'text-rose-600' : 'text-gray-600'}`}>
                            {isCheating ? `${p.violations_count}x Keluar Layar` : 'Fokus Mengerjakan'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 flex items-center">
                           <BadgeCheck className="w-3.5 h-3.5 mr-1" /> Jawaban Aman
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
