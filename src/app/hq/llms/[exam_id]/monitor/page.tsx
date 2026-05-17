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
  Lock,
  Users,
  Radio,
  RefreshCw
} from 'lucide-react';

export default function LiveMonitor({ params }: { params: { exam_id: string } }) {
  const examId = params.exam_id;
  const supabase = createClient();

  const [participants, setParticipants] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, working: 0, submitted: 0, cheating: 0, blocked: 0 });
  const [search, setSearch] = useState('');
  const [lastSync, setLastSync] = useState<Date>(new Date());

  const fetchCCTVData = async () => {
    try {
      const { data } = await supabase
        .from('cbt_attempts')
        .select('*')
        .order('updated_at', { ascending: false });

      if (data) {
        setParticipants(data);
        setLastSync(new Date());

        let w = 0, s = 0, c = 0, b = 0;
        data.forEach(p => {
          if (p.submitted_at) s++; else w++;
          if (p.violations_count > 0 && p.violations_count < 3) c++;
          if (p.violations_count >= 3) b++;
        });
        setStats({ total: data.length, working: w, submitted: s, cheating: c, blocked: b });
      }
    } catch (err) {
      console.error('Error fetching CCTV:', err);
    }
  };

  useEffect(() => {
    fetchCCTVData();

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

  const getStatusConfig = (p: any) => {
    if (p.violations_count >= 3) return { label: 'DIBLOKIR', color: 'rose', icon: Lock };
    if (p.submitted_at) return { label: 'SELESAI', color: 'emerald', icon: BadgeCheck };
    if (p.violations_count > 0) return { label: 'PERINGATAN', color: 'amber', icon: ShieldAlert };
    return { label: 'AKTIF', color: 'indigo', icon: Monitor };
  };

  return (
    <div className="min-h-screen bg-[#f4f7fe] font-sans text-gray-800">

      {/* STICKY TOP BAR */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-3">
          <div className="flex items-center space-x-4 w-full md:w-auto">
            <Link href="/hq/llms" className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-indigo-50 hover:text-[#5145cd] transition-all flex-shrink-0">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-lg font-black text-gray-900 tracking-tight leading-none">Live Monitor CCTV</h1>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">NCC 13th · Sistem Pengawasan Real-Time</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-56">
              <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Cari NISN peserta..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-xs font-bold focus:outline-none focus:border-[#5145cd] focus:bg-white transition-all"
              />
            </div>
            <button onClick={fetchCCTVData} className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-indigo-50 hover:text-[#5145cd] transition-all flex-shrink-0">
              <RefreshCw className="w-4 h-4" />
            </button>
            <div className="flex items-center px-3 py-2 bg-rose-50 border border-rose-100 rounded-full flex-shrink-0">
              <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse mr-2"></span>
              <span className="text-[10px] font-black tracking-widest uppercase text-rose-600">Live</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-6">

        {/* STATS STRIP */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Peserta', value: stats.total, icon: Users, color: 'indigo', bg: 'bg-indigo-50', text: 'text-[#5145cd]' },
            { label: 'Sedang Aktif', value: stats.working, icon: Radio, color: 'sky', bg: 'bg-sky-50', text: 'text-sky-500' },
            { label: 'Telah Submit', value: stats.submitted, icon: BadgeCheck, color: 'emerald', bg: 'bg-emerald-50', text: 'text-emerald-500' },
            { label: 'Pelanggaran', value: stats.cheating + stats.blocked, icon: ShieldAlert, color: 'rose', bg: stats.cheating + stats.blocked > 0 ? 'bg-rose-500' : 'bg-gray-100', text: stats.cheating + stats.blocked > 0 ? 'text-white' : 'text-gray-400' },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-[20px] p-5 border border-gray-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{s.label}</p>
                <p className={`text-4xl font-black mt-1 ${s.color === 'rose' && s.value > 0 ? 'text-rose-600' : 'text-gray-900'}`}>{s.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${s.bg} ${s.text} ${s.color === 'rose' && s.value > 0 ? 'animate-pulse shadow-lg shadow-rose-200' : ''}`}>
                <s.icon className="w-5 h-5" />
              </div>
            </div>
          ))}
        </div>

        {/* CCTV GRID */}
        <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm overflow-hidden">
          {/* Panel Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
            <h2 className="text-sm font-black text-gray-900">Layar Perangkat Peserta</h2>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-gray-400 font-bold">
                Sync: {lastSync.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
              <span className="px-3 py-1 bg-indigo-50 text-[#5145cd] text-[9px] font-black uppercase tracking-widest rounded-full">
                {filteredParticipants.length} Peserta
              </span>
            </div>
          </div>

          <div className="p-6">
            {filteredParticipants.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-300">
                <Monitor className="w-16 h-16 mb-4" />
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Belum Ada Peserta Aktif</p>
                <p className="text-xs text-gray-300 mt-1">Kartu akan muncul otomatis saat peserta masuk</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredParticipants.map(p => {
                  const status = getStatusConfig(p);
                  const isBlocked = p.violations_count >= 3;
                  const isWarning = p.violations_count > 0 && !isBlocked;
                  const isDone = !!p.submitted_at;

                  const cardBg = isBlocked ? 'bg-rose-50 border-rose-300' 
                    : isWarning ? 'bg-amber-50 border-amber-300' 
                    : isDone ? 'bg-emerald-50 border-emerald-200' 
                    : 'bg-gray-50 border-gray-200';
                  
                  const iconBg = isBlocked ? 'bg-rose-500 text-white' 
                    : isWarning ? 'bg-amber-100 text-amber-600' 
                    : isDone ? 'bg-emerald-100 text-emerald-600' 
                    : 'bg-white text-gray-400';

                  const labelColor = isBlocked ? 'text-rose-600'
                    : isWarning ? 'text-amber-600'
                    : isDone ? 'text-emerald-600'
                    : 'text-indigo-500';

                  return (
                    <div key={p.user_id} className={`rounded-2xl border-2 p-4 flex flex-col gap-3 transition-all relative overflow-hidden ${cardBg}`}>
                      
                      {/* Top pulse bar for warnings */}
                      {isWarning && <div className="absolute top-0 inset-x-0 h-0.5 bg-amber-400 animate-pulse" />}
                      {isBlocked && <div className="absolute top-0 inset-x-0 h-0.5 bg-rose-500" />}

                      {/* Header row */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-black text-gray-900 truncate">{p.user_id}</p>
                          <p className={`text-[9px] font-black uppercase tracking-widest mt-0.5 ${labelColor}`}>
                            {status.label}
                          </p>
                        </div>
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg} ${isBlocked ? 'shadow-md shadow-rose-200' : ''}`}>
                          <status.icon className="w-4 h-4" />
                        </div>
                      </div>

                      {/* Stats row */}
                      <div className="flex items-center justify-between pt-2 border-t border-black/5">
                        <div className="flex items-center text-[10px] text-gray-400 font-bold">
                          <Clock className="w-3 h-3 mr-1" />
                          {new Date(p.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </div>

                        {p.violations_count > 0 ? (
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${
                            isBlocked ? 'bg-rose-200 text-rose-800' : 'bg-amber-200 text-amber-800'
                          }`}>
                            {p.violations_count}× ⚠️
                          </span>
                        ) : isDone ? (
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-emerald-100 text-emerald-700">✓ Selesai</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-indigo-100 text-indigo-600">● Online</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* LEGEND */}
        <div className="flex flex-wrap gap-4 justify-center pb-2">
          {[
            { color: 'bg-indigo-100 border-indigo-300', label: 'Aktif' },
            { color: 'bg-amber-100 border-amber-300', label: 'Ada Pelanggaran' },
            { color: 'bg-rose-100 border-rose-300', label: 'Diblokir (3x)' },
            { color: 'bg-emerald-100 border-emerald-300', label: 'Selesai' },
          ].map((l, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded-md border-2 ${l.color}`} />
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{l.label}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
