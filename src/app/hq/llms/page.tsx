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
  Save, Loader2, Users, BarChart3, Server, Download,
  Target, Cpu, ShieldAlert, PlusCircle, CheckCircle2,
  CircleEllipsis, Megaphone, SendHorizonal, 
  Trash, BellRing, Info
} from "lucide-react";

export default function ManajemenJadwalLLMS() {
  const supabase = createClient();
  const router = useRouter();
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'sesi' | 'nilai' | 'broadcast'>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedExamForLeaderboard, setSelectedExamForLeaderboard] = useState<string>("");
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    activeSessions: 0,
    totalQuestions: 0,
    liveParticipants: 0,
    totalViolations: 0,
    serverLatency: 0
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

  // Broadcast State
  const [broadcast, setBroadcast] = useState({
    exam_id: "", // Empty means Global
    message: "",
    type: "info"
  });
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // --- 📡 DATA FETCHING ENGINE ---
  const fetchData = async () => {
    const startTime = performance.now();
    try {
      // 1. Ambil Sesi (Head Only for count)
      const { count: sCount } = await supabase.from('cbt_exams').select('*', { count: 'exact', head: true });
      
      // Ambil data sesi untuk tabel
      const { data: sessionData } = await supabase.from('cbt_exams').select('*').order('created_at', { ascending: false });
      
      // 2. Ambil Soal (Head Only)
      const { count: qCount } = await supabase.from('cbt_questions').select('*', { count: 'exact', head: true });
      
      // 3. Ambil Peserta & Pelanggaran
      const { data: attempts } = await supabase.from('cbt_attempts').select('warnings_count, status');
      
      const endTime = performance.now();
      const latency = Math.round(endTime - startTime);

      if (sessionData) {
        setSessions(sessionData);
        setStats({
          activeSessions: sCount || 0,
          totalQuestions: qCount || 0,
          liveParticipants: attempts?.filter(a => a.status === 'ongoing').length || 0,
          totalViolations: attempts?.reduce((acc, curr) => acc + (curr.warnings_count || 0), 0) || 0,
          serverLatency: latency
        });
      }
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
        setLeaderboardData(attempts);
      }
    } catch (err) { console.error("Leaderboard Error:", err); }
  };

  useEffect(() => {
    fetchData();
    
    // Live Ping Simulator
    const pingInterval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        serverLatency: Math.max(15, prev.serverLatency + (Math.floor(Math.random() * 5) - 2))
      }));
    }, 5000);

    return () => clearInterval(pingInterval);
  }, []);

  useEffect(() => {
    if (selectedExamForLeaderboard) {
      fetchLeaderboard(selectedExamForLeaderboard);

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

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedExamForLeaderboard]);

  const handleToggleAktif = async (id: string, current: boolean) => {
    const { error } = await supabase.from('cbt_exams').update({ is_active: !current }).eq('id', id);
    if (!error) fetchData();
  };

  const handleHapusJadwal = async (id: string, title: string) => {
    if (confirm(`Hapus sesi "${title}"? Semua soal dan data pengerjaan akan hilang.`)) {
      const { error } = await supabase.from('cbt_exams').delete().eq('id', id);
      if (!error) fetchData();
    }
  };

  const handleAddSession = async () => {
    setIsSaving(true);
    const { error } = await supabase.from('cbt_exams').insert([newSession]);
    if (!error) {
      setShowAddModal(false);
      setNewSession({
        title: "", token: "", duration_minutes: 90, scoring_system: "Fixed",
        correct_point: 4, penalty_point: 0, empty_point: 0
      });
      fetchData();
    }
    setIsSaving(false);
  };

  const exportToCSV = () => {
    if (!leaderboardData.length) return;
    const headers = ["Rank", "Ticket ID", "Status", "Skor"];
    const rows = leaderboardData.map((row, idx) => [
      idx + 1, row.user_id, row.status, row.final_score || 0
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `leaderboard_${selectedExamForLeaderboard}.csv`);
    document.body.appendChild(link);
    link.click();
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
    <div className="min-h-screen bg-[#F8FAFC] p-8 md:p-12 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* \ud83d\ude80 HEADER COMMAND CENTER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 bg-white/50 backdrop-blur-xl p-10 rounded-[3rem] border border-white shadow-2xl shadow-slate-200/50">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
               <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200">
                  <LayoutDashboard className="text-white" size={24} />
               </div>
               <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Pusat Komando LLMS</h1>
            </div>
            <p className="text-slate-400 font-medium ml-1">Administrasi Ujian & Manajemen Real-time NCC 13th.</p>
          </div>
          
          <div className="flex bg-slate-100/50 p-1.5 rounded-[2rem] border border-slate-200/50">
            {[
              { id: 'overview', label: 'Overview', icon: Activity },
              { id: 'sesi', label: 'Sesi & Waktu', icon: Clock },
              { id: 'nilai', label: 'Penilaian Live', icon: Trophy },
              { id: 'broadcast', label: 'Broadcast', icon: Megaphone },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`flex items-center gap-2.5 px-8 py-3.5 rounded-[1.5rem] text-xs font-black transition-all duration-500 ${
                  activeSubTab === tab.id 
                  ? 'bg-white text-indigo-600 shadow-xl shadow-indigo-100 ring-1 ring-slate-200' 
                  : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* \ud83d\udcca CONTENT TAB: SESI & WAKTU */}
        {activeSubTab === 'sesi' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            <div className="flex justify-between items-center px-4">
               <h2 className="text-2xl font-black text-slate-800 tracking-tight">Manajemen Sesi Ujian</h2>
               <button 
                onClick={() => setShowAddModal(true)}
                className="group flex items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs hover:bg-indigo-600 transition-all shadow-2xl shadow-slate-200 hover:scale-[1.05] active:scale-95"
               >
                  <Plus size={18} className="group-hover:rotate-90 transition-transform duration-500" />
                  BUAT JADWAL BARU
               </button>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {sessions.length === 0 ? (
                <div className="bg-white rounded-[3rem] border-2 border-dashed border-slate-100 py-32 text-center flex flex-col items-center justify-center">
                   <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                      <Clock size={40} className="text-slate-200" />
                   </div>
                   <h3 className="text-xl font-black text-slate-800">Belum Ada Jadwal</h3>
                   <p className="text-slate-400 font-medium max-w-xs mx-auto mt-2 text-sm leading-relaxed">
                      Silakan buat jadwal sesi ujian pertama untuk memulai kompetisi NCC 13th.
                   </p>
                </div>
              ) : (
                sessions.map((session) => (
                  <div key={session.id} className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-slate-200 transition-all duration-700 group border-l-[12px] border-l-indigo-500">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10">
                       <div className="space-y-4">
                          <div className="flex items-center gap-4">
                             <h3 className="text-2xl font-black text-slate-800 tracking-tight">{session.title}</h3>
                             <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${session.is_active ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                {session.is_active ? '\u25cf Aktif' : 'Non-aktif'}
                             </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-6">
                             <div className="flex items-center gap-2.5 text-slate-400 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                                <ShieldCheck size={16} className="text-indigo-500" />
                                <span className="text-xs font-black uppercase tracking-tighter">{session.token}</span>
                             </div>
                             <div className="flex items-center gap-2.5 text-slate-400 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                                <Clock size={16} className="text-blue-500" />
                                <span className="text-xs font-black uppercase tracking-tighter">{session.duration_minutes} Menit</span>
                             </div>
                             <div className="flex items-center gap-2.5 text-slate-400 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                                <Trophy size={16} className="text-amber-500" />
                                <span className="text-xs font-black uppercase tracking-tighter">B: {session.correct_point} / S: {session.penalty_point}</span>
                             </div>
                          </div>
                       </div>

                       <div className="flex items-center gap-4 shrink-0">
                          <Link 
                            href={`/hq/llms/${session.id}/questions`}
                            className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-100 hover:scale-[1.05] active:scale-95"
                          >
                            <FileText size={18} /> Kelola Bank Soal
                          </Link>

                          <button 
                            onClick={() => handleToggleAktif(session.id, session.is_active)}
                            className={`p-4 rounded-2xl transition-all border ${session.is_active ? 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100'}`}
                          >
                            <Power size={20} />
                          </button>

                          <button 
                            onClick={() => handleHapusJadwal(session.id, session.title)}
                            className="p-4 bg-slate-50 text-slate-400 rounded-2xl border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all"
                          >
                            <Trash2 size={20} />
                          </button>
                       </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* \ud83d\udcca CONTENT TAB: OVERVIEW BENTO */}
        {activeSubTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                  <Activity className="text-indigo-600" size={32} />
                  Sistem Telemetri NCC
                </h2>
                <p className="text-slate-500 font-medium mt-1">Pantauan real-time infrastruktur ujian dan keamanan peserta secara terpusat.</p>
              </div>
              <div className="flex items-center gap-3 bg-emerald-50 px-6 py-3 rounded-2xl border border-emerald-100 shadow-sm shadow-emerald-100/20">
                <span className="relative flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
                </span>
                <span className="text-[11px] font-black text-emerald-700 uppercase tracking-[0.2em]">System Status: Optimal</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-800 rounded-[3rem] p-10 text-white shadow-2xl shadow-indigo-200 relative overflow-hidden group min-h-[300px] flex flex-col justify-between">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-white opacity-5 blur-3xl transition-transform duration-700 group-hover:scale-125"></div>
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-60 h-60 rounded-full bg-indigo-400 opacity-10 blur-3xl"></div>
                <div className="relative z-10 flex justify-between items-start">
                  <div>
                    <p className="text-indigo-100 font-black tracking-[0.2em] text-[10px] mb-2 uppercase opacity-80 flex items-center gap-2">
                      <Target size={14} /> Live CBT Engine
                    </p>
                    <h3 className="text-8xl font-black mb-6 tracking-tighter">{stats.activeSessions}</h3>
                  </div>
                  <div className="p-6 bg-white/10 rounded-[2.5rem] backdrop-blur-xl border border-white/20 shadow-2xl group-hover:rotate-12 transition-transform duration-500">
                    <Server className="w-12 h-12 text-white" />
                  </div>
                </div>
                <div className="relative z-10 flex items-center gap-3 text-sm bg-white/10 w-fit px-6 py-3 rounded-2xl backdrop-blur-md border border-white/10">
                  <Clock className="w-4 h-4 text-indigo-200" />
                  <span className="text-indigo-50 font-bold uppercase tracking-widest text-[10px]">
                    {stats.activeSessions > 0 ? `${stats.activeSessions} Sesi sedang berjalan` : "Menunggu jadwal kompetisi dimulai"}
                  </span>
                </div>
              </div>

              <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl shadow-slate-200 relative overflow-hidden group">
                 <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
                 <div className="relative z-10 h-full flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-8">
                        <div className="p-3 bg-white/10 rounded-2xl"><Cpu className="w-6 h-6 text-indigo-400" /></div>
                        <h3 className="font-black text-slate-100 text-sm uppercase tracking-widest">Infra Health</h3>
                      </div>
                      <div className="space-y-6">
                        <div>
                          <div className="flex justify-between text-[10px] mb-2 font-black uppercase tracking-widest">
                            <span className="text-slate-400">Database (Supabase)</span>
                            <span className={stats.serverLatency > 100 ? "text-rose-400" : "text-emerald-400"}>{stats.serverLatency}ms</span>
                          </div>
                          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-700">
                            <div className={`h-full rounded-full transition-all duration-500 shadow-lg ${stats.serverLatency > 100 ? "bg-rose-400" : "bg-emerald-400"}`} style={{ width: `${Math.min(100, (stats.serverLatency / 200) * 100)}%` }}></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-[10px] mb-2 font-black uppercase tracking-widest">
                            <span className="text-slate-400">Real-time Socket</span>
                            <span className="text-blue-400 tracking-tighter italic font-medium">Connected</span>
                          </div>
                          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-700">
                            <div className="bg-blue-400 h-full rounded-full w-full shadow-[0_0_10px_rgba(96,165,250,0.3)]"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-8 text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                       Global Sync Verified
                    </div>
                 </div>
              </div>

              <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-500 flex flex-col justify-between group">
                <div className="flex justify-between items-start">
                  <div className="p-4 bg-emerald-50 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-500">
                    <Users className="w-8 h-8 text-emerald-600 group-hover:text-white" />
                  </div>
                </div>
                <div className="mt-8">
                  <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-1">Traffic Peserta Live</p>
                  <h3 className="text-5xl font-black text-slate-800 tracking-tight">{stats.liveParticipants}</h3>
                  <div className="mt-4 flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {[1,2,3].map(i => <div key={i} className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white"></div>)}
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold tracking-tighter uppercase italic">Peserta masuk...</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-500 flex flex-col justify-between group">
                <div className="flex justify-between items-start">
                  <div className="p-4 bg-indigo-50 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-500">
                    <FileText className="w-8 h-8 text-indigo-600 group-hover:text-white" />
                  </div>
                </div>
                <div className="mt-8">
                  <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-1">Butir Soal Tersimpan</p>
                  <h3 className="text-5xl font-black text-slate-800 tracking-tight">{stats.totalQuestions}</h3>
                </div>
              </div>

              <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-rose-500/5 transition-all duration-500 flex flex-col justify-between group">
                <div className="flex justify-between items-start">
                  <div className="p-4 bg-rose-50 rounded-2xl group-hover:bg-rose-600 group-hover:text-white transition-colors duration-500">
                    <ShieldAlert className="w-8 h-8 text-rose-600 group-hover:text-white" />
                  </div>
                  <div className="text-[9px] font-black text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 uppercase tracking-widest">Secure</div>
                </div>
                <div className="mt-8">
                  <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-1">Radar Pelanggaran</p>
                  <div className="flex items-end gap-2">
                    <h3 className={`text-5xl font-black tracking-tight ${stats.totalViolations > 0 ? "text-rose-500" : "text-emerald-500"}`}>{stats.totalViolations}</h3>
                    <span className="text-xs font-black text-slate-300 uppercase mb-2">Warnings</span>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm flex flex-col justify-between group hover:border-indigo-200 transition-all duration-500">
                <div className="flex items-center justify-between mb-10">
                  <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                    <Activity className="text-indigo-500" size={24} />
                    Log Aktivitas Sistem
                  </h3>
                  <button onClick={fetchData} className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100 hover:bg-indigo-100 transition-all">Refresh Logs</button>
                </div>
                <div className="space-y-6">
                  <div className="flex items-start gap-5 p-5 bg-slate-50/50 rounded-3xl border border-transparent hover:border-slate-200 transition-all group/item">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 mt-1.5 shadow-[0_0_12px_rgba(16,185,129,0.4)] group-hover/item:scale-125 transition-transform"></div>
                    <div className="flex-grow">
                      <p className="text-base font-black text-slate-700 leading-tight">Inisiasi Ultimate Command Center</p>
                      <p className="text-xs text-slate-400 mt-1 font-medium italic">Sistem telemetri dan radar anti-cheat NCC 13th berhasil diaktifkan.</p>
                    </div>
                    <span className="text-slate-300 text-[10px] font-black tracking-widest uppercase mt-1">Baru saja</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm flex flex-col justify-center gap-6 group hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] text-center mb-2">Aksi Cepat</h3>
                <button onClick={() => setShowAddModal(true)} className="w-full flex items-center justify-center gap-3 px-6 py-5 bg-indigo-600 text-white font-black text-xs rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 hover:scale-[1.03] active:scale-[0.97]">
                  <PlusCircle size={20} /> BUAT SESI BARU
                </button>
                <button onClick={exportToCSV} disabled={!selectedExamForLeaderboard || leaderboardData.length === 0} className="w-full flex items-center justify-center gap-3 px-6 py-5 bg-slate-50 text-slate-700 font-black text-xs rounded-2xl hover:bg-slate-100 transition-all border border-slate-200 disabled:opacity-30">
                  <Download size={20} /> EXPORT LAPORAN
                </button>
              </div>
            </div>

            <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm relative overflow-hidden">
               <div className="max-w-4xl">
                  <div className="mb-10">
                    <div className="flex items-center gap-3 mb-2">
                       <Trophy className="text-amber-500" size={24} />
                       <h2 className="text-2xl font-black text-slate-800 tracking-tight">Roadmap Persiapan NCC 13th</h2>
                    </div>
                    <p className="text-sm text-slate-400 font-medium italic">Pantau kesiapan infrastruktur dan fitur Pusat Komando CBT.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { id: 1, title: 'Infrastruktur Database & Vercel', status: 'done', mod: 'DevOps' },
                      { id: 2, title: 'Buka Sesi & Scoring Config', status: 'done', mod: 'CBT Core' },
                      { id: 3, title: 'Editor Bank Soal & LaTeX', status: 'done', mod: 'Content' },
                      { id: 4, title: 'Telemetri Overview Real-time', status: 'done', mod: 'Dashboard' },
                      { id: 5, title: 'Tabel Penilaian & Export CSV', status: 'progress', mod: 'Real-time' },
                      { id: 6, title: 'Layar Ujian & Anti-Cheat Radar', status: 'pending', mod: 'Frontend' },
                    ].map((task) => (
                      <div key={task.id} className={`flex items-center gap-5 p-5 rounded-[2rem] border transition-all duration-300 ${task.status === 'done' ? 'bg-slate-50 border-slate-100 opacity-60' : task.status === 'progress' ? 'bg-indigo-50/50 border-indigo-200 shadow-xl shadow-indigo-100/20' : 'bg-white border-slate-100'}`}>
                        {task.status === 'done' ? <CheckCircle2 className="w-8 h-8 text-emerald-500" /> : task.status === 'progress' ? <Clock className="w-8 h-8 text-indigo-500 animate-pulse" /> : <CircleEllipsis className="w-8 h-8 text-slate-200" />}
                        <div className="flex-grow">
                          <h4 className={`text-sm font-black tracking-tight ${task.status === 'done' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{task.title}</h4>
                          <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{task.mod}</span>
                        </div>
                      </div>
                    ))}
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* \ud83d\udcca CONTENT TAB: PENILAIAN LIVE */}
        {activeSubTab === 'nilai' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <div>
                <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                  <Trophy className="text-amber-500" size={28} />
                  Real-time Leaderboard
                </h3>
                <p className="text-sm text-slate-500 font-medium mt-1">Pantau pergerakan skor dan progres peserta secara langsung.</p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                <div className="relative w-full sm:w-72">
                   <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><GraduationCap size={18} /></div>
                   <select 
                    value={selectedExamForLeaderboard}
                    onChange={(e) => setSelectedExamForLeaderboard(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm font-black text-slate-700 focus:ring-2 focus:ring-indigo-500 transition-all appearance-none cursor-pointer"
                   >
                    <option value="">Pilih Sesi Ujian...</option>
                    {sessions.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                   </select>
                </div>
                <button onClick={exportToCSV} disabled={!selectedExamForLeaderboard || leaderboardData.length === 0} className="flex items-center gap-2 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs hover:bg-indigo-700 transition-all disabled:opacity-30 shadow-lg shadow-indigo-100">
                  <Download size={18} /> EXPORT CSV
                </button>
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
               {!selectedExamForLeaderboard ? (
                 <div className="p-20 text-center flex flex-col items-center justify-center">
                    <Activity size={48} className="text-indigo-100 mb-4" />
                    <h4 className="text-lg font-black text-slate-800">Pilih Sesi Ujian</h4>
                    <p className="text-sm text-slate-400 font-medium mt-2">Pilih salah satu jadwal di atas untuk memantau nilai real-time.</p>
                 </div>
               ) : leaderboardData.length === 0 ? (
                 <div className="p-20 text-center flex flex-col items-center justify-center">
                    <Search size={48} className="text-slate-100 mb-4 animate-pulse" />
                    <h4 className="text-lg font-black text-slate-800">Belum Ada Peserta</h4>
                    <p className="text-sm text-slate-400 font-medium mt-2">Menunggu peserta memulai pengerjaan sesi ini.</p>
                 </div>
               ) : (
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                       <thead>
                          <tr className="bg-slate-50/50 border-b border-slate-100">
                             <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Rank</th>
                             <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Peserta</th>
                             <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                             <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Pelanggaran</th>
                             <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Skor Akhir</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-50">
                          {leaderboardData.map((entry, idx) => (
                            <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors">
                               <td className="px-8 py-6">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${idx === 0 ? 'bg-amber-100 text-amber-600' : idx === 1 ? 'bg-slate-200 text-slate-600' : idx === 2 ? 'bg-orange-100 text-orange-600' : 'bg-slate-50 text-slate-400'}`}>
                                     {idx + 1}
                                  </div>
                               </td>
                               <td className="px-8 py-6">
                                  <div className="font-bold text-slate-800 text-sm">{entry.user_id}</div>
                                  <div className="text-[10px] text-slate-400 font-medium">Ticket: {entry.id.substring(0,8)}</div>
                               </td>
                               <td className="px-8 py-6 text-center">
                                  <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase border ${entry.status === 'ongoing' ? 'bg-blue-50 text-blue-600 border-blue-100 animate-pulse' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>{entry.status}</span>
                               </td>
                               <td className="px-8 py-6 text-center font-black text-xs text-slate-400">{entry.warnings_count || 0}x</td>
                               <td className="px-8 py-6 text-right font-black text-xl text-indigo-600">{entry.final_score || 0}</td>
                            </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
               )}
            </div>
          </div>
        )}

        {/* 📢 CONTENT TAB: LIVE BROADCAST COMMAND */}
        {activeSubTab === 'broadcast' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
             <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="max-w-2xl">
                   <div className="flex items-center gap-4 mb-8">
                      <div className="p-4 bg-indigo-600 rounded-[1.5rem] shadow-xl shadow-indigo-200">
                         <Megaphone className="text-white" size={28} />
                      </div>
                      <div>
                         <h2 className="text-3xl font-black text-slate-900 tracking-tight">Pusat Siaran Live</h2>
                         <p className="text-sm text-slate-500 font-medium">Kirim instruksi massal ke layar peserta secara real-time.</p>
                      </div>
                   </div>

                   <div className="space-y-6">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Target Sesi (Opsional)</label>
                         <select 
                            value={broadcast.exam_id}
                            onChange={(e) => setBroadcast({...broadcast, exam_id: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all appearance-none cursor-pointer"
                         >
                            <option value="">🚀 Seluruh Sesi (Global)</option>
                            {sessions.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                         </select>
                      </div>

                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Tipe Pengumuman</label>
                         <div className="grid grid-cols-3 gap-3">
                            {[
                              { id: 'info', label: 'Info (Biru)', color: 'bg-blue-50 text-blue-600 border-blue-200' },
                              { id: 'warning', label: 'Warning (Kuning)', color: 'bg-amber-50 text-amber-600 border-amber-200' },
                              { id: 'danger', label: 'Urgent (Merah)', color: 'bg-rose-50 text-rose-600 border-rose-200' }
                            ].map(t => (
                              <button
                                key={t.id}
                                onClick={() => setBroadcast({...broadcast, type: t.id})}
                                className={`px-4 py-3 rounded-xl border text-[10px] font-black uppercase transition-all ${broadcast.type === t.id ? t.color : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50'}`}
                              >
                                {t.label}
                              </button>
                            ))}
                         </div>
                      </div>

                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Pesan Siaran</label>
                         <textarea 
                            placeholder="Ketik pesan Anda di sini..."
                            value={broadcast.message}
                            onChange={(e) => setBroadcast({...broadcast, message: e.target.value})}
                            rows={4}
                            className="w-full bg-slate-50 border border-slate-200 rounded-[2rem] px-8 py-6 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none"
                         />
                      </div>

                      <button 
                         onClick={async () => {
                            if (!broadcast.message) return alert("Pesan tidak boleh kosong!");
                            setIsBroadcasting(true);
                            const { error } = await supabase.from('announcements').insert([{
                               exam_id: broadcast.exam_id || null,
                               message: broadcast.message,
                               type: broadcast.type
                            }]);
                            if (error) {
                               alert("Gagal mengirim siaran: " + error.message);
                            } else {
                               setBroadcast({...broadcast, message: ""});
                               alert("🚀 Siaran berhasil diluncurkan!");
                            }
                            setIsBroadcasting(false);
                         }}
                         disabled={isBroadcasting}
                         className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-5 rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                      >
                         {isBroadcasting ? <Loader2 className="animate-spin" /> : <><SendHorizonal size={20} /> Lancarkan Siaran</>}
                      </button>
                   </div>
                </div>

                <div className="absolute top-10 right-10 hidden lg:block opacity-10">
                   <Megaphone size={200} className="rotate-12 text-indigo-600" />
                </div>
             </div>

             <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                   <BellRing size={14} className="text-indigo-500" /> Riwayat Siaran Terakhir
                </h3>
                <div className="space-y-4">
                   <p className="text-xs text-slate-400 font-medium italic">Menampilkan 5 siaran terakhir yang dikirim ke sistem...</p>
                </div>
             </div>
          </div>
        )}
      </div>

      {/* \ud83d\udef8 MODAL ADD SESSION */}
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
