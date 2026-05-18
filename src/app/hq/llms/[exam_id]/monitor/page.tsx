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
  LockOpen,
  Users,
  Radio,
  RefreshCw,
  Trash2
} from 'lucide-react';

export default function LiveMonitor({ params }: { params: { exam_id: string } }) {
  const examId = params.exam_id;
  const supabase = createClient();

  const [participants, setParticipants] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, working: 0, submitted: 0, cheating: 0, blocked: 0 });
  const [search, setSearch] = useState('');
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const [showUnblockModal, setShowUnblockModal] = useState(false);
  const [unblockTarget, setUnblockTarget] = useState<string | null>(null);
  const [unblockSuccess, setUnblockSuccess] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCCTVData = async () => {
    setIsRefreshing(true);
    try {
      const { data } = await supabase
        .from('cbt_attempts')
        .select('*')
        .eq('exam_id', examId)
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
    } finally {
      setIsRefreshing(false);
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

  // 🔥 TOMBOL AMPUNAN — pakai custom modal
  const handleUnlockAccess = async () => {
    if (!unblockTarget) return;
    const { error } = await supabase
      .from('cbt_attempts')
      .update({ violations_count: 0, updated_at: new Date().toISOString() })
      .eq('user_id', unblockTarget)
      .eq('exam_id', examId);

    if (!error) {
      setUnblockSuccess(true);
      fetchCCTVData();
    }
  };

  // 🗑️ Hapus semua data CBT (reset ruang ujian)
  const handleDeleteAllData = async () => {
    setIsDeleting(true);
    const { error } = await supabase.from('cbt_attempts').delete().eq('exam_id', examId);
    if (!error) {
      setParticipants([]);
      setStats({ total: 0, working: 0, submitted: 0, cheating: 0, blocked: 0 });
      setShowDeleteModal(false);
    }
    setIsDeleting(false);
  };

  return (
    <div className="min-h-screen bg-[#f4f7fe] font-sans text-gray-800">

      {/* ===== MODAL HAPUS SEMUA DATA ===== */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4">
          <div className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl text-center">
            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <Trash2 className="w-10 h-10 text-rose-500" />
            </div>
            <h2 className="text-xl font-black text-gray-900">Hapus Semua Data?</h2>
            <p className="text-sm text-gray-500 font-medium mt-2 leading-relaxed">
              Seluruh data submit, jawaban, dan skor peserta akan <span className="font-black text-rose-600">dihapus permanen</span> dari database.
            </p>
            <p className="text-xs text-gray-400 mt-2">Lakukan ini hanya untuk mereset ruang ujian sebelum kompetisi dimulai.</p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowDeleteModal(false)} disabled={isDeleting} className="flex-1 py-3.5 bg-gray-100 text-gray-700 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-gray-200 transition-all">Batal</button>
              <button onClick={handleDeleteAllData} disabled={isDeleting} className="flex-1 py-3.5 bg-rose-500 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-rose-600 transition-all shadow-lg shadow-rose-100 flex items-center justify-center gap-2">
                {isDeleting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {isDeleting ? 'Menghapus...' : 'Hapus Semua'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL KONFIRMASI UNBLOCK ===== */}
      {showUnblockModal && !unblockSuccess && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4">
          <div className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl text-center">
            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <LockOpen className="w-10 h-10 text-rose-500" />
            </div>
            <h2 className="text-xl font-black text-gray-900">Buka Blokir Peserta?</h2>
            <p className="text-sm text-gray-500 font-medium mt-2">ID: <span className="font-black text-gray-800">{unblockTarget}</span></p>
            <p className="text-xs text-gray-400 mt-2 leading-relaxed">Pelanggaran akan direset ke 0. Peserta perlu <span className="font-black">F5</span> untuk melanjutkan.</p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowUnblockModal(false); setUnblockTarget(null); }} className="flex-1 py-3.5 bg-gray-100 text-gray-700 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-gray-200 transition-all">Batal</button>
              <button onClick={handleUnlockAccess} className="flex-1 py-3.5 bg-emerald-500 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100">Buka Akses</button>
            </div>
          </div>
        </div>
      )}
      {showUnblockModal && unblockSuccess && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4">
          <div className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl text-center">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <BadgeCheck className="w-10 h-10 text-emerald-500" />
            </div>
            <h2 className="text-xl font-black text-gray-900">Akses Dibuka! ✅</h2>
            <p className="text-sm text-gray-500 font-medium mt-2">Peserta <span className="font-black text-gray-800">{unblockTarget}</span> sudah bisa lanjut.</p>
            <p className="text-xs text-gray-400 mt-2">Arahkan peserta untuk menekan <span className="font-black">F5</span> di komputernya.</p>
            <button onClick={() => { setShowUnblockModal(false); setUnblockTarget(null); setUnblockSuccess(false); }} className="w-full mt-6 py-3.5 bg-gray-900 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-black transition-all">Tutup</button>
          </div>
        </div>
      )}

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
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={() => setShowDeleteModal(true)} title="Hapus semua data peserta" className="w-9 h-9 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white transition-all flex-shrink-0">
              <Trash2 className="w-4 h-4" />
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
                        {isBlocked ? (
                          // 🔥 TOMBOL UNBLOCK — hover gembok merah → gembok hijau terbuka
                          <button
                            onClick={() => { setUnblockTarget(p.user_id); setUnblockSuccess(false); setShowUnblockModal(true); }}
                            title="Klik untuk buka blokir peserta ini"
                            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-rose-500 text-white hover:bg-emerald-500 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-200 transition-all group"
                          >
                            <Lock className="w-4 h-4 group-hover:hidden" />
                            <LockOpen className="w-4 h-4 hidden group-hover:block" />
                          </button>
                        ) : (
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
                            <status.icon className="w-4 h-4" />
                          </div>
                        )}
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
