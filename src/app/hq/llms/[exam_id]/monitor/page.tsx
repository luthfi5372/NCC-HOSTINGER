'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { 
  ArrowLeft,
  Search,
  Clock,
  BadgeCheck,
  ShieldAlert,
  Monitor,
  Lock
} from 'lucide-react';

export default function LiveMonitor({ params }: { params: { exam_id: string } }) {
  const examId = params.exam_id;
  const supabase = createClient();

  const [participants, setParticipants] = useState<any[]>([]);
  const [stats, setStats] = useState({ working: 0, submitted: 0, cheating: 0 });
  const [search, setSearch] = useState('');

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

  useEffect(() => {
    fetchCCTVData();

    // 📡 ANTENA RADAR REAL-TIME
    const channel = supabase.channel('live-cctv')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cbt_attempts' }, () => {
         fetchCCTVData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [examId]);

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
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">Live Monitor CCTV</h1>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Sistem pengawasan real-time NCC 13th.</p>
            </div>
          </div>

          <div className="flex items-center space-x-4 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 absolute left-4 top-3 text-gray-400" />
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
               <span className="text-[10px] font-black tracking-widest uppercase">REC.</span>
            </div>
          </div>
        </div>

        {/* METRIK STATISTIK */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mengerjakan</p>
              <h3 className="text-4xl font-black mt-1 text-gray-800">{stats.working}</h3>
            </div>
            <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-[#5145cd]"><Clock className="w-6 h-6" /></div>
          </div>
          <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Telah Submit</p>
              <h3 className="text-4xl font-black mt-1 text-gray-800">{stats.submitted}</h3>
            </div>
            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500"><BadgeCheck className="w-6 h-6" /></div>
          </div>
          <div className="bg-white p-6 rounded-[24px] shadow-sm border border-rose-100 flex items-center justify-between bg-rose-50/30">
            <div>
              <p className="text-[10px] font-black text-rose-800 uppercase tracking-widest">Deteksi Curang</p>
              <h3 className="text-4xl font-black mt-1 text-rose-600">{stats.cheating}</h3>
            </div>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stats.cheating > 0 ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-200' : 'bg-rose-100 text-rose-400'}`}>
              <ShieldAlert className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* LAYAR CCTV GRID */}
        <div className="bg-white p-6 md:p-8 rounded-[32px] shadow-sm border border-gray-100 min-h-[500px]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-base font-black text-gray-800">Layar Perangkat Peserta</h2>
            <span className="px-3 py-1 bg-indigo-50 text-[#5145cd] text-[9px] font-black uppercase tracking-widest rounded-full">Live Feed • Auto Sync</span>
          </div>

          {filteredParticipants.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <Monitor className="w-16 h-16 mb-4 text-gray-200" />
              <p className="text-[10px] font-black uppercase tracking-widest">TIDAK ADA PESERTA DITEMUKAN</p>
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
                    {/* Aksen Kedip jika Curang */}
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
                      
                      {/* Ikon Status */}
                      <div className={`p-2 rounded-xl 
                        ${isBlocked ? 'bg-rose-500 text-white' : 
                          isWarning ? 'bg-amber-100 text-amber-600' : 
                          isDone ? 'bg-emerald-100 text-emerald-600' : 'bg-white text-gray-400 shadow-sm'}`}>
                        {isBlocked ? <Lock className="w-5 h-5" /> :
                         isWarning ? <ShieldAlert className="w-5 h-5" /> :
                         isDone ? <BadgeCheck className="w-5 h-5" /> :
                         <Monitor className="w-5 h-5" />}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-black/5 flex justify-between items-center">
                      <p className="text-[9px] font-bold text-gray-400 flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(p.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </p>
                      
                      {p.violations_count > 0 && (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black
                          ${isBlocked ? 'bg-rose-200 text-rose-800' : 'bg-amber-200 text-amber-800'}`}>
                          {p.violations_count}x Melanggar
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
