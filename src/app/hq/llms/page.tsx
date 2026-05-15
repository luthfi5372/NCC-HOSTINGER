"use client";
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { 
  GraduationCap, Clock, Plus, 
  Trash2, ExternalLink, ShieldCheck, 
  Activity, AlertTriangle, CheckCircle, Search,
  ChevronRight, Calendar, UserPlus, FileText,
  Power, Pencil, LayoutDashboard, Trophy, X,
  Save, Loader2
} from "lucide-react";

export default function ManajemenJadwalLLMS() {
  const supabase = createClient();
  const router = useRouter();
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'sesi' | 'nilai'>('sesi');
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    activeSessions: 0,
    totalQuestions: 0,
    liveParticipants: 0
  });

  // Form State
  const [newSession, setNewSession] = useState({
    title: "",
    token: "",
    duration_minutes: 90,
    scoring_system: "Fixed",
    correct_point: 4,
    penalty_point: 0,
    empty_point: 0
  });

  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [selectedExamForLeaderboard, setSelectedExamForLeaderboard] = useState<string | null>(null);

  // --- 📡 DATA FETCHING ENGINE ---
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: sessionData } = await supabase
        .from('cbt_exams')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (sessionData) {
        setSessions(sessionData);
        setStats(prev => ({
          ...prev,
          activeSessions: sessionData.filter(s => s.is_active).length
        }));
      }

      const { count: qCount } = await supabase.from('cbt_questions').select('*', { count: 'exact', head: true });
      setStats(prev => ({ ...prev, totalQuestions: qCount || 0 }));

    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLeaderboard = async (examId: string) => {
    try {
      const { data: attempts } = await supabase
        .from('cbt_attempts')
        .select('*')
        .eq('exam_id', examId)
        .order('final_score', { ascending: false });
      
      if (attempts) {
        // Link to competition_entries for names/schools
        const { data: participants } = await supabase
          .from('competition_entries')
          .select('id, full_name, school_name');

        const linked = attempts.map(a => {
          // Extract numeric ID from "NCC-27" or use as is
          const numericId = a.user_id.replace('NCC-', '');
          const p = participants?.find(p => String(p.id) === numericId);
          return { ...a, participant: p };
        });

        setLeaderboardData(linked);
      }
    } catch (err) { console.error("Leaderboard Error:", err); }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedExamForLeaderboard) {
      fetchLeaderboard(selectedExamForLeaderboard);

      // --- ⚡ REAL-TIME CHANNEL ---
      const channel = supabase
        .channel('realtime_leaderboard')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'cbt_attempts',
          filter: `exam_id=eq.${selectedExamForLeaderboard}`
        }, () => {
          fetchLeaderboard(selectedExamForLeaderboard);
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [selectedExamForLeaderboard]);

  const exportToCSV = () => {
    if (!leaderboardData.length) return;
    
    const headers = ["Rank", "Ticket ID", "Nama Peserta", "Sekolah", "Status", "Warnings", "Skor"];
    const rows = leaderboardData.map((row, idx) => [
      idx + 1,
      row.user_id,
      row.participant?.full_name || "-",
      row.participant?.school_name || "-",
      row.status,
      row.warnings_count || 0,
      row.final_score || 0
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `NCC_Leaderboard_${selectedExamForLeaderboard}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- 🛠️ ACTIONS ---
  const handleToggleAktif = async (id: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    const { error } = await supabase
      .from('cbt_exams')
      .update({ is_active: newStatus })
      .eq('id', id);

    if (!error) {
      setSessions(prev => prev.map(s => s.id === id ? { ...s, is_active: newStatus } : s));
    } else {
      alert("Gagal mengubah status jadwal.");
    }
  };

  const handleHapusJadwal = async (id: string, judul: string) => {
    const konfirmasi = window.confirm(`Yakin ingin menghapus jadwal "${judul}"? SEMUA BANK SOAL di dalamnya akan ikut terhapus permanen!`);
    if (!konfirmasi) return;

    const { error } = await supabase
      .from('cbt_exams')
      .delete()
      .eq('id', id);

    if (!error) {
      setSessions(prev => prev.filter(s => s.id !== id));
    } else {
      alert("Gagal menghapus jadwal.");
    }
  };

  const handleAddSession = async () => {
    if (!newSession.title || !newSession.token) {
      alert("Mohon isi judul dan token!");
      return;
    }

    setIsSaving(true);
    const { data, error } = await supabase
      .from('cbt_exams')
      .insert([{
        ...newSession,
        is_active: false
      }])
      .select();

    if (!error && data) {
      setSessions([data[0], ...sessions]);
      setShowAddModal(false);
      setNewSession({
        title: "",
        token: "",
        duration_minutes: 90,
        scoring_system: "Fixed",
        correct_point: 4,
        penalty_point: 0,
        empty_point: 0
      });
    } else {
      alert("Gagal menambah sesi: " + error?.message);
    }
    setIsSaving(false);
  };

  if (isLoading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Memuat Sistem LLMS...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-inter">
      {/* 👑 PREMIUM HEADER SECTION */}
      <div className="bg-white border-b border-slate-200 px-8 py-10 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <Link href="/hq" className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-500">
                  <ChevronRight size={20} className="rotate-180" />
                </Link>
                <div className="p-2.5 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-200">
                  <GraduationCap size={22} />
                </div>
                <span className="text-[10px] font-black uppercase text-indigo-600 tracking-widest bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">Pusat Komando CBT</span>
              </div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">Manajemen Sesi Ujian</h1>
              <p className="text-slate-500 font-medium mt-2">Arsitektur Exam-First: Bangun jadwalnya, kelola soalnya, amankan nilainya.</p>
            </div>
            
            <div className="flex items-center gap-3">
               <button 
                onClick={() => setShowAddModal(true)}
                className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-sm shadow-xl shadow-slate-200 flex items-center gap-2 hover:bg-slate-800 transition-all hover:scale-[1.02] active:scale-[0.98]"
               >
                  <Plus size={20} /> Buat Sesi Baru
               </button>
            </div>
          </div>

          {/* QUICK NAVIGATION TABS */}
          <div className="flex bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/50 max-w-lg mt-10">
            {[
              { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={16} /> },
              { id: 'sesi', label: 'Sesi & Waktu', icon: <Clock size={16} /> },
              { id: 'nilai', label: 'Penilaian', icon: <Trophy size={16} /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition-all ${
                  activeSubTab === tab.id
                    ? "bg-white text-indigo-600 shadow-md border border-slate-200"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 📦 CONTENT AREA */}
      <div className="max-w-7xl mx-auto p-8 pb-20">
        
        {activeSubTab === 'sesi' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
               <h3 className="text-xl font-black text-slate-800">Daftar Jadwal Aktif</h3>
               <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <Activity size={14} className="text-emerald-500" />
                  Real-time Database Sync
               </div>
            </div>

            <div className="grid grid-cols-1 gap-5">
              {sessions.map((session) => (
                <div key={session.id} className="bg-white rounded-[2.5rem] p-8 border border-slate-200 hover:border-indigo-300 transition-all group flex flex-col md:flex-row items-center justify-between gap-8 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5">
                   <div className="flex items-center gap-8 flex-1">
                      <div className={`w-20 h-20 rounded-3xl flex items-center justify-center text-3xl font-black transition-all duration-500 ${session.is_active ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-inner' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}>
                        {session.title.charAt(0)}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="font-black text-slate-900 text-xl leading-none">{session.title}</h3>
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border ${session.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-100 animate-pulse' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                            {session.is_active ? 'Online' : 'Offline'}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-400">
                           <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                             <ShieldCheck size={14} className="text-indigo-500" />
                             Token: <span className="text-slate-800">{session.token}</span>
                           </div>
                           <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                             <Clock size={14} className="text-blue-500" />
                             <span className="text-slate-800">{session.duration_minutes} Menit</span>
                           </div>
                           <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                             <Trophy size={14} className="text-amber-500" />
                             <span className="text-slate-800">Correct: +{session.correct_point || 4}</span>
                           </div>
                        </div>
                      </div>
                   </div>

                   <div className="flex items-center gap-4 shrink-0">
                      {/* ACTION 1: EDIT BANK SOAL (CENTRAL COMMAND) */}
                      <Link 
                        href={`/hq/llms/${session.id}/questions`}
                        className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-100 hover:scale-[1.05] active:scale-95"
                      >
                        <FileText size={18} /> Kelola Bank Soal
                      </Link>

                      {/* ACTION 2: TOGGLE POWER */}
                      <button 
                        onClick={() => handleToggleAktif(session.id, session.is_active)}
                        className={`p-4 rounded-2xl transition-all border ${session.is_active ? 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100'}`}
                        title={session.is_active ? "Nonaktifkan" : "Aktifkan"}
                      >
                        <Power size={20} />
                      </button>

                      {/* ACTION 3: DELETE */}
                      <button 
                        onClick={() => handleHapusJadwal(session.id, session.title)}
                        className="p-4 bg-slate-50 text-slate-400 rounded-2xl border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all"
                        title="Hapus Sesi"
                      >
                        <Trash2 size={20} />
                      </button>
                   </div>
                </div>
              ))}
              
              {sessions.length === 0 && (
                <div className="bg-white rounded-[3rem] border-4 border-dashed border-slate-100 py-32 text-center flex flex-col items-center justify-center">
                  <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                    <GraduationCap size={48} className="text-slate-200" />
                  </div>
                  <h3 className="font-black text-slate-800 text-2xl">Belum Ada Sesi Ujian</h3>
                  <p className="text-slate-400 font-medium mt-2 max-w-sm mx-auto">Klik tombol <strong>"Buat Sesi Baru"</strong> di atas untuk memulai pembangunan bank soal dan jadwal lomba.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeSubTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
             <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Activity size={14} className="text-indigo-500" /> Sesi Aktif
                </p>
                <h2 className="text-5xl font-black text-slate-800 tracking-tighter">{stats.activeSessions}</h2>
                <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full w-2/3"></div>
                </div>
             </div>
             <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <FileText size={14} className="text-blue-500" /> Bank Soal
                </p>
                <h2 className="text-5xl font-black text-slate-800 tracking-tighter">{stats.totalQuestions}</h2>
                <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full w-1/2"></div>
                </div>
             </div>
             <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Activity size={14} className="text-emerald-500" /> Peserta Live
                </p>
                <h2 className="text-5xl font-black text-emerald-600 tracking-tighter">{stats.liveParticipants}</h2>
                <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full w-1/4 animate-pulse"></div>
                </div>
             </div>
          </div>
        )}

        {activeSubTab === 'nilai' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <div>
                   <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                      <Trophy className="text-amber-500" size={24} />
                      Monitoring Hasil & Leaderboard
                   </h3>
                   <p className="text-sm text-slate-500 font-medium mt-1">Pantau skor dan progres pengerjaan peserta secara langsung.</p>
                </div>
                
                <div className="flex items-center gap-3 w-full md:w-auto">
                   <select 
                    value={selectedExamForLeaderboard || ""}
                    onChange={(e) => setSelectedExamForLeaderboard(e.target.value)}
                    className="flex-1 md:w-64 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-xs font-black text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                   >
                      <option value="">Pilih Sesi Ujian...</option>
                      {sessions.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                   </select>

                   <button 
                    onClick={exportToCSV}
                    disabled={!selectedExamForLeaderboard || leaderboardData.length === 0}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3.5 rounded-2xl font-black text-xs shadow-xl shadow-emerald-100 flex items-center gap-2 transition-all disabled:opacity-30"
                   >
                      <Download size={18} /> Export CSV
                   </button>
                </div>
             </div>

             {!selectedExamForLeaderboard ? (
                <div className="bg-white rounded-[3rem] border-2 border-dashed border-slate-100 py-32 text-center flex flex-col items-center justify-center">
                   <Search size={48} className="text-slate-100 mb-4" />
                   <p className="text-slate-400 font-bold">Pilih sesi ujian untuk melihat leaderboard.</p>
                </div>
             ) : leaderboardData.length === 0 ? (
                <div className="bg-white rounded-[3rem] border-2 border-dashed border-slate-100 py-32 text-center flex flex-col items-center justify-center">
                   <Activity size={48} className="text-slate-100 mb-4 animate-pulse" />
                   <p className="text-slate-400 font-bold">Belum ada aktivitas pengerjaan pada sesi ini.</p>
                </div>
             ) : (
                <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
                   <table className="w-full text-left border-collapse">
                      <thead>
                         <tr className="bg-slate-50/50 border-b border-slate-100">
                            <th className="py-5 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Peringkat</th>
                            <th className="py-5 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Peserta</th>
                            <th className="py-5 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Sekolah</th>
                            <th className="py-5 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                            <th className="py-5 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Pelanggaran</th>
                            <th className="py-5 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Skor Akhir</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                         {leaderboardData.sort((a,b) => (b.final_score || 0) - (a.final_score || 0)).map((entry, idx) => (
                           <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-5 px-8">
                                 <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${idx === 0 ? 'bg-amber-100 text-amber-600' : idx === 1 ? 'bg-slate-200 text-slate-600' : idx === 2 ? 'bg-orange-100 text-orange-600' : 'bg-slate-50 text-slate-400'}`}>
                                    {idx + 1}
                                 </div>
                              </td>
                              <td className="py-5 px-8">
                                 <div className="font-bold text-slate-800 text-sm">{entry.participant?.full_name || entry.user_id}</div>
                                 <div className="text-[10px] text-slate-400 font-medium">Ticket: {entry.user_id}</div>
                              </td>
                              <td className="py-5 px-8">
                                 <div className="font-medium text-slate-600 text-xs">{entry.participant?.school_name || "-"}</div>
                              </td>
                              <td className="py-5 px-8 text-center">
                                 <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter border ${
                                    entry.status === 'ongoing' ? 'bg-blue-50 text-blue-600 border-blue-100 animate-pulse' :
                                    entry.status === 'submitted' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                    'bg-rose-50 text-rose-600 border-rose-100'
                                 }`}>
                                    {entry.status}
                                 </span>
                              </td>
                              <td className="py-5 px-8 text-center">
                                 <div className={`text-xs font-black ${entry.warnings_count > 0 ? 'text-rose-500' : 'text-slate-300'}`}>
                                    {entry.warnings_count || 0}x
                                 </div>
                              </td>
                              <td className="py-5 px-8 text-right">
                                 <div className="text-xl font-black text-indigo-600">{entry.final_score || 0}</div>
                              </td>
                           </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             )}
          </div>
        )}
      </div>

      {/* 🛸 MODAL ADD SESSION */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowAddModal(false)}></div>
           <div className="bg-white w-full max-w-xl rounded-[3rem] p-10 shadow-2xl relative z-10 animate-in zoom-in-95 duration-300">
              <div className="flex justify-between items-center mb-8">
                 <div>
                    <h2 className="text-2xl font-black text-slate-800">Buka Sesi Ujian Baru</h2>
                    <p className="text-sm text-slate-400 font-medium">Langkah awal membangun kompetisi NCC 13th.</p>
                 </div>
                 <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-all">
                    <X size={24} />
                 </button>
              </div>

              <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Judul Sesi / Nama Lomba</label>
                    <input 
                      type="text" 
                      placeholder="Contoh: Seleksi Tahap I MIPA"
                      value={newSession.title}
                      onChange={(e) => setNewSession({...newSession, title: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                    />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Token Akses</label>
                        <input 
                          type="text" 
                          placeholder="MIPA2026"
                          value={newSession.token}
                          onChange={(e) => setNewSession({...newSession, token: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Durasi (Menit)</label>
                        <input 
                          type="number" 
                          placeholder="90"
                          value={newSession.duration_minutes}
                          onChange={(e) => setNewSession({...newSession, duration_minutes: parseInt(e.target.value) || 0})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                        />
                    </div>
                 </div>

                 <div className="bg-indigo-50 p-6 rounded-[2rem] border border-indigo-100 space-y-4">
                    <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                      <ShieldCheck size={16} /> Scoring Config
                    </h4>
                    <div className="grid grid-cols-3 gap-3">
                       <div className="space-y-1">
                          <p className="text-[9px] font-bold text-slate-400 uppercase">Correct</p>
                          <input 
                            type="number" 
                            step="any"
                            value={newSession.correct_point}
                            onChange={(e) => setNewSession({...newSession, correct_point: e.target.value === '' ? 0 : Number(e.target.value)})}
                            className="w-full bg-white border border-indigo-100 rounded-xl px-3 py-2 text-xs font-bold text-indigo-600 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                          />
                       </div>
                       <div className="space-y-1">
                          <p className="text-[9px] font-bold text-slate-400 uppercase">Penalty</p>
                          <input 
                            type="number" 
                            step="any"
                            value={newSession.penalty_point}
                            onChange={(e) => setNewSession({...newSession, penalty_point: e.target.value === '' ? 0 : Number(e.target.value)})}
                            className="w-full bg-white border border-indigo-100 rounded-xl px-3 py-2 text-xs font-bold text-rose-600 outline-none focus:ring-2 focus:ring-rose-500 transition-all"
                          />
                       </div>
                       <div className="space-y-1">
                          <p className="text-[9px] font-bold text-slate-400 uppercase">Empty</p>
                          <input 
                            type="number" 
                            step="any"
                            value={newSession.empty_point}
                            onChange={(e) => setNewSession({...newSession, empty_point: e.target.value === '' ? 0 : Number(e.target.value)})}
                            className="w-full bg-white border border-indigo-100 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-slate-500 transition-all"
                          />
                       </div>
                    </div>
                 </div>

                 <button 
                  onClick={handleAddSession}
                  disabled={isSaving}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-5 rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
                 >
                    {isSaving ? <Loader2 className="animate-spin" /> : <><Save size={20} /> Bangun Sesi Sekarang</>}
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
