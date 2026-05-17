'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  ArrowLeft,
  Monitor,
  ShieldAlert,
  BadgeCheck,
  Clock,
  User,
  Search
} from 'lucide-react';

export default function LiveMonitor() {
  const params = useParams();
  const examId = params.exam_id as string;
  const supabase = createClient();

  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchMonitorData = async () => {
    try {
      const { data, error } = await supabase
        .from('cbt_attempts')
        .select('*')
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
    const channel = supabase
      .channel('live-cctv')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cbt_attempts' }, () => fetchMonitorData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [examId]);

  // Statistik & Filter
  const activeCount = participants.filter(p => !p.submitted_at).length;
  const cheatingCount = participants.filter(p => p.violations_count > 0).length;
  const finishedCount = participants.filter(p => p.submitted_at).length;

  const filteredParticipants = participants.filter(p => 
    p.user_id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f4f7fe] p-6 md:p-10 font-sans select-none text-gray-800 text-left overflow-x-hidden">
      <div className="max-w-[1400px] mx-auto space-y-8">
        
        {/* HEADER AREA (Terinspirasi dari referensi "What are your plans...") */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center space-x-6">
            <Link href="/hq/llms" className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-gray-500 hover:text-[#5145cd] shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_4px_25px_rgb(81,69,205,0.15)] transition-all">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">Live Monitor CCTV</h1>
              <p className="text-sm text-gray-500 mt-1 font-medium">Sistem pengawasan real-time NCC 13th.</p>
            </div>
          </div>

          <div className="flex items-center space-x-4 w-full md:w-auto">
            {/* Search Bar ala Referensi */}
            <div className="relative w-full md:w-64">
              <Search className="w-5 h-5 absolute left-4 top-3.5 text-gray-400" />
              <input 
                type="text" 
                placeholder="Cari ID Peserta..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white pl-11 pr-4 py-3 rounded-full text-sm font-medium outline-none text-gray-700 shadow-[0_4px_20px_rgb(0,0,0,0.02)] focus:shadow-[0_4px_25px_rgb(81,69,205,0.1)] transition-all placeholder-gray-400"
              />
            </div>
            
            <div className="px-5 py-3 bg-white rounded-full flex items-center shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
               <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse mr-2.5 shadow-[0_0_8px_rgba(244,63,94,0.6)]"></span>
               <span className="text-[11px] font-bold text-gray-700 uppercase tracking-widest">Rec.</span>
            </div>
          </div>
        </div>

        {/* METRIK REKAP (Soft Bento Style) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex items-center justify-between transition-transform hover:-translate-y-1 duration-300">
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Mengerjakan</p>
              <h3 className="text-4xl font-black text-gray-800">{activeCount}</h3>
            </div>
            <div className="w-16 h-16 bg-[#f4f7fe] rounded-[20px] flex items-center justify-center text-[#5145cd]">
              <Clock className="w-8 h-8" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex items-center justify-between transition-transform hover:-translate-y-1 duration-300">
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Telah Submit</p>
              <h3 className="text-4xl font-black text-gray-800">{finishedCount}</h3>
            </div>
            <div className="w-16 h-16 bg-emerald-50 rounded-[20px] flex items-center justify-center text-emerald-500">
              <BadgeCheck className="w-8 h-8" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex items-center justify-between relative overflow-hidden transition-transform hover:-translate-y-1 duration-300">
            {cheatingCount > 0 && <div className="absolute top-0 right-0 w-32 h-32 bg-rose-400/10 rounded-full blur-2xl"></div>}
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Deteksi Curang</p>
              <h3 className="text-4xl font-black text-rose-500">{cheatingCount}</h3>
            </div>
            <div className="w-16 h-16 bg-rose-50 rounded-[20px] flex items-center justify-center text-rose-500">
              <ShieldAlert className={`w-8 h-8 ${cheatingCount > 0 ? 'animate-pulse' : ''}`} />
            </div>
          </div>
        </div>

        {/* LAYAR CCTV (Grid of Participants) */}
        <div className="bg-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.02)] p-8 min-h-[500px]">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-lg font-black text-gray-800">Layar Perangkat Peserta</h2>
            <span className="text-xs font-bold text-[#5145cd] bg-[#5145cd]/10 px-4 py-1.5 rounded-full">Live Feed • Auto Sync</span>
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-gray-400">
              <div className="w-16 h-16 border-4 border-gray-100 border-t-[#5145cd] rounded-full animate-spin mb-4"></div>
              <p className="text-xs font-bold uppercase tracking-widest">Menyambungkan...</p>
            </div>
          ) : filteredParticipants.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50 rounded-[24px]">
              <Monitor className="w-16 h-16 mb-4 text-gray-300" />
              <p className="text-xs font-bold uppercase tracking-widest">Tidak ada peserta ditemukan</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
              {filteredParticipants.map((p, idx) => {
                const isCheating = p.violations_count > 0;
                const isFinished = p.submitted_at !== null;
                
                return (
                  <div key={idx} className={`relative p-5 rounded-[24px] transition-all duration-300 flex flex-col justify-between h-40
                    ${isFinished ? 'bg-emerald-50/40 border border-emerald-100/50' : 
                      isCheating ? 'bg-rose-50 border border-rose-100 shadow-[0_4px_20px_rgba(244,63,94,0.15)]' : 
                      'bg-white border border-gray-100 shadow-[0_4px_15px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_25px_rgb(0,0,0,0.05)] hover:-translate-y-1'}`}
                  >
                    {/* Badge Selesai */}
                    {isFinished && (
                      <div className="absolute top-4 right-4 bg-emerald-100 text-emerald-600 p-1.5 rounded-full">
                        <BadgeCheck className="w-4 h-4" />
                      </div>
                    )}

                    {/* Badge Curang Berkedip */}
                    {isCheating && !isFinished && (
                      <div className="absolute top-4 right-4 flex items-center bg-white px-2 py-1 rounded-full shadow-sm border border-rose-100">
                        <span className="w-2 h-2 bg-rose-500 rounded-full animate-ping mr-1.5"></span>
                        <span className="text-[9px] font-black text-rose-600 tracking-wider">ALERT</span>
                      </div>
                    )}

                    {/* Identitas */}
                    <div className="flex items-center space-x-3 mb-4">
                      <div className={`w-10 h-10 rounded-[14px] flex items-center justify-center text-white font-bold text-sm shadow-sm transition-colors
                        ${isFinished ? 'bg-emerald-400' : isCheating ? 'bg-rose-500' : 'bg-[#5145cd]'}`}>
                        <User className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-black text-gray-800 truncate">{p.user_id}</p>
                        <p className={`text-[10px] font-bold uppercase tracking-wider mt-0.5
                          ${isFinished ? 'text-emerald-500' : isCheating ? 'text-rose-500' : 'text-gray-400'}`}>
                          {isFinished ? 'Selesai' : 'Online'}
                        </p>
                      </div>
                    </div>

                    {/* Status Pengerjaan (Bottom) */}
                    <div className="mt-auto">
                      {!isFinished ? (
                        <div className="flex items-center space-x-2">
                          <div className={`w-full h-1.5 rounded-full bg-gray-100 overflow-hidden`}>
                            <div className={`h-full rounded-full transition-all duration-1000 ${isCheating ? 'bg-rose-500 w-full' : 'bg-[#5145cd] w-[70%]'}`}></div>
                          </div>
                          <span className={`text-[10px] font-bold whitespace-nowrap ${isCheating ? 'text-rose-600' : 'text-[#5145cd]'}`}>
                            {isCheating ? `${p.violations_count}x Out` : 'Aktif'}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center text-[10px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 border border-emerald-100/50 w-max px-3 py-1.5 rounded-full">
                          Jawaban Disimpan
                        </div>
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
