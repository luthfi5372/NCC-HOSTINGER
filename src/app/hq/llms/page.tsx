"use client";
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { 
  LayoutGrid, Users, BadgeCheck, Megaphone, 
  Calendar, Image as ImageIcon, Server, Settings,
  LogOut, Play, FileText, ShieldAlert, Plus,
  RotateCcw, Key, Clock, Monitor, Trophy,
  ShieldCheck, AlertTriangle, FileDown, ChevronRight,
  Loader2, X, Save
} from "lucide-react";

export default function IntegratedLLMSDashboard() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ onlineParticipants: 0, activeSessions: 0, totalQuestions: 0, totalViolations: 0 });
  const [sessions, setSessions] = useState<any[]>([]);
  const [securityLogs, setSecurityLogs] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [liveTokens, setLiveTokens] = useState<Record<string, string>>({});
  
  // State for Add Session Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newSession, setNewSession] = useState({
    title: "", token: "", duration_minutes: 90, scoring_system: "Fixed",
    correct_point: 4, penalty_point: 0, empty_point: 0
  });

  const fetchTelemetryData = async () => {
    setRefreshing(true);
    try {
      const { count: questionCount } = await supabase.from('cbt_questions').select('*', { count: 'exact', head: true });
      const { data: examsData } = await supabase.from('cbt_exams').select('*').order('created_at', { ascending: false });
      const { data: attemptsData } = await supabase.from('cbt_attempts').select('warnings_count, submitted_at, user_id, updated_at').order('updated_at', { ascending: false });

      let onlineCount = 0;
      let violationSum = 0;
      let logs: any[] = [];

      if (attemptsData) {
        attemptsData.forEach((attempt) => {
          if (!attempt.submitted_at) onlineCount++;
          violationSum += attempt.warnings_count || 0;
          if (attempt.warnings_count > 0) {
            logs.push({
              id: attempt.user_id + attempt.updated_at,
              userId: attempt.user_id,
              count: attempt.warnings_count,
              time: new Date(attempt.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });
          }
        });
      }
      setSecurityLogs(logs.slice(0, 3));
      setStats({ onlineParticipants: onlineCount, activeSessions: examsData?.length || 0, totalQuestions: questionCount || 0, totalViolations: violationSum });
      if (examsData) setSessions(examsData);
    } catch (err) { console.error(err); } finally { setLoading(false); setTimeout(() => setRefreshing(false), 500); }
  };

  useEffect(() => {
    fetchTelemetryData();
    const channel = supabase.channel('dashboard-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cbt_attempts' }, fetchTelemetryData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cbt_questions' }, fetchTelemetryData)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    const updateTimerAndTokens = () => {
      const now = Math.floor(Date.now() / 1000);
      const interval10Min = 600; 
      const currentInterval = Math.floor(now / interval10Min);
      const secondsLeft = interval10Min - (now % interval10Min);
      
      setCountdown(secondsLeft);

      const newTokens: Record<string, string> = {};
      sessions.forEach(s => {
        const charPool = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        let token = "";
        let seed = (s.id.charCodeAt(0) + currentInterval) % 10000;
        for(let i=0; i<6; i++) { seed = (seed * 9301 + 49297) % 233280; token += charPool[Math.floor((seed / 233280) * charPool.length)]; }
        newTokens[s.id] = token;
      });
      setLiveTokens(newTokens);
    };

    updateTimerAndTokens(); 
    const timer = setInterval(updateTimerAndTokens, 1000);
    return () => clearInterval(timer);
  }, [sessions]);

  const handleAddSession = async () => {
    setIsSaving(true);
    const { error } = await supabase.from('cbt_exams').insert([newSession]);
    if (!error) {
      setShowAddModal(false);
      setNewSession({
        title: "", token: "", duration_minutes: 90, scoring_system: "Fixed",
        correct_point: 4, penalty_point: 0, empty_point: 0
      });
      fetchTelemetryData();
    }
    setIsSaving(false);
  };

  const downloadSecurityReport = () => {
    const headers = ['Waktu', 'ID Peserta', 'Jumlah Pelanggaran Keluar Layar'];
    const csvRows = securityLogs.map(log => `${log.time},${log.userId},${log.count}`);
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(',') + "\n" + csvRows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_Kecurangan_NCC13_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading && sessions.length === 0) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f8fafc] font-sans text-gray-800">
      
      {/* 1. SIDEBAR (Disesuaikan dengan Screenshot Light Theme) */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-gray-100 flex-col fixed h-full z-20">
        <div className="p-6 flex items-center space-x-3 mt-2">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-200/50">
            <ShieldCheck className="w-6 h-6 text-white" fill="currentColor" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-gray-900 leading-none">NCC HQ.</h1>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Command Center</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
          <Link href="/hq" className="flex items-center space-x-3 px-4 py-3 text-gray-500 hover:bg-gray-50 rounded-xl transition-all font-semibold text-sm">
            <LayoutGrid className="w-5 h-5" />
            <span>Dashboard</span>
          </Link>
          
          <Link href="/hq/participants" className="flex items-center justify-between px-4 py-3 text-gray-500 hover:bg-gray-50 rounded-xl transition-all font-semibold text-sm">
            <div className="flex items-center space-x-3">
               <Users className="w-5 h-5" />
               <span>Buku Peserta</span>
            </div>
            <span className="bg-gray-100 text-gray-500 text-[10px] font-black px-2 py-0.5 rounded-full">5</span>
          </Link>
          
          <Link href="/hq/verification" className="flex items-center justify-between px-4 py-3 text-gray-500 hover:bg-gray-50 rounded-xl transition-all font-semibold text-sm">
            <div className="flex items-center space-x-3">
               <BadgeCheck className="w-5 h-5" />
               <span>Verifikasi Berkas</span>
            </div>
            <span className="bg-gray-100 text-gray-400 text-[10px] font-black px-2 py-0.5 rounded-full">0</span>
          </Link>
          
          <Link href="/hq/llms/broadcast" className="flex items-center space-x-3 px-4 py-3 text-gray-500 hover:bg-gray-50 rounded-xl transition-all font-semibold text-sm">
            <Megaphone className="w-5 h-5" />
            <span>Siaran Info</span>
          </Link>
          
          <Link href="#" className="flex items-center space-x-3 px-4 py-3 text-gray-500 hover:bg-gray-50 rounded-xl transition-all font-semibold text-sm">
            <Calendar className="w-5 h-5" />
            <span>Kegiatan</span>
          </Link>
          
          <Link href="#" className="flex items-center space-x-3 px-4 py-3 text-gray-500 hover:bg-gray-50 rounded-xl transition-all font-semibold text-sm">
            <Clock className="w-5 h-5" />
            <span>Schedule Lomba</span>
          </Link>
          
          <Link href="#" className="flex items-center space-x-3 px-4 py-3 text-gray-500 hover:bg-gray-50 rounded-xl transition-all font-semibold text-sm">
            <ImageIcon className="w-5 h-5" />
            <span>Kelola Media</span>
          </Link>
          
          {/* ACTIVE MENU: Manajemen LLMS */}
          <Link href="/hq/llms" className="flex items-center justify-between px-4 py-3 bg-slate-900 text-white rounded-xl shadow-md shadow-slate-200 transition-all font-semibold text-sm">
            <div className="flex items-center space-x-3">
              <Server className="w-5 h-5 text-indigo-400" />
              <span>Manajemen LLMS</span>
            </div>
            <span className="bg-indigo-500 text-white text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">New</span>
          </Link>

          <Link href="/hq/settings" className="flex items-center space-x-3 px-4 py-3 text-gray-500 hover:bg-gray-50 rounded-xl transition-all font-semibold text-sm">
            <Settings className="w-5 h-5" />
            <span>Pengaturan</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button className="w-full flex items-center justify-center space-x-3 px-4 py-3 text-rose-500 hover:bg-rose-50 rounded-xl transition-all font-bold text-sm">
            <LogOut className="w-5 h-5" />
            <span>Keluar Sesi</span>
          </button>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        
        {/* HEADER TOP BAR */}
        <header className="bg-white/80 backdrop-blur-md sticky top-0 z-10 px-8 py-5 flex justify-between items-center border-b border-gray-100">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">Pusat Komando LLMS</h2>
            <p className="text-[10px] md:text-xs text-gray-400 font-bold mt-0.5">Administrasi CBT Terpusat NCC 13th.</p>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="hidden md:flex px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full items-center text-[10px] font-black uppercase tracking-widest border border-emerald-100">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse mr-2"></span>
              Sistem Online
            </div>
          </div>
        </header>

        {/* CONTENT (The "Bento" Grid) */}
        <div className="p-6 md:p-8 space-y-8 flex-1">
          
          {/* STATS CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition-all relative overflow-hidden">
              <div className="absolute left-0 top-0 w-1.5 h-full bg-blue-500"></div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Peserta Online</p>
                <h3 className="text-3xl font-black mt-1 text-blue-600">{stats.onlineParticipants}</h3>
              </div>
              <Users className="w-10 h-10 text-blue-100 group-hover:text-blue-500 transition-colors" />
            </div>
            <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition-all relative overflow-hidden">
              <div className="absolute left-0 top-0 w-1.5 h-full bg-[#5145cd]"></div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sesi Aktif</p>
                <h3 className="text-3xl font-black mt-1 text-[#5145cd]">{stats.activeSessions}</h3>
              </div>
              <Play className="w-10 h-10 text-indigo-100 group-hover:text-[#5145cd] transition-colors" />
            </div>
            <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition-all relative overflow-hidden">
              <div className="absolute left-0 top-0 w-1.5 h-full bg-teal-500"></div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Bank Soal</p>
                <h3 className="text-3xl font-black mt-1 text-teal-600">{stats.totalQuestions}</h3>
              </div>
              <FileText className="w-10 h-10 text-teal-100 group-hover:text-teal-500 transition-colors" />
            </div>
            <div className="bg-white p-6 rounded-[24px] shadow-sm border border-rose-100 flex items-center justify-between group hover:shadow-md transition-all relative overflow-hidden bg-rose-50/30">
              <div className={`absolute left-0 top-0 w-1.5 h-full ${stats.totalViolations > 0 ? 'bg-rose-500 animate-pulse' : 'bg-rose-300'}`}></div>
              <div>
                <p className="text-[10px] font-black text-rose-800 uppercase tracking-widest">Kecurangan</p>
                <h3 className="text-3xl font-black mt-1 text-rose-600">{stats.totalViolations}</h3>
              </div>
              <ShieldAlert className="w-10 h-10 text-rose-200 group-hover:text-rose-500 transition-colors" />
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            
            {/* MONITORING SESI */}
            <div className="xl:col-span-2 bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden flex flex-col">
              <div className="p-6 flex justify-between items-center border-b border-gray-50 bg-gray-50/50">
                <h2 className="text-base font-black text-gray-800 tracking-tight">Daftar Sesi & Live Monitoring</h2>
                <button onClick={() => setShowAddModal(true)} className="px-5 py-2.5 bg-[#5145cd] text-white text-[10px] font-black uppercase rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 flex items-center">
                  <Plus className="w-4 h-4 mr-1" /> Buat Sesi Baru
                </button>
              </div>
              <div className="p-4 overflow-x-auto">
                <table className="w-full text-left min-w-[600px]">
                  <thead>
                    <tr className="text-gray-400 text-[10px] uppercase tracking-widest border-b border-gray-50">
                      <th className="py-4 px-4">Informasi Sesi</th>
                      <th className="py-4 px-4 text-center">Live Token (10 Menit)</th>
                      <th className="py-4 px-4 text-right">Aksi Terpadu Panitia</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {sessions.map((session) => (
                      <tr key={session.id} className="hover:bg-indigo-50/30 transition-all border-b border-gray-50 last:border-0">
                        <td className="py-5 px-4">
                          <p className="font-black text-gray-900 flex items-center">
                            <span className={`w-2 h-2 rounded-full mr-2 ${session.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`}></span>
                            {session.title || 'Ujian MIPA'}
                          </p>
                          <div className="flex space-x-2 mt-1.5 pl-4">
                            <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-mono font-bold">ID: {session.id.substring(0,8)}</span>
                            <span className="text-[9px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">{session.duration_minutes || 90} MNT</span>
                          </div>
                        </td>
                        <td className="py-5 px-4">
                          <div className="flex flex-col items-center bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-100/50">
                             <div className="flex items-center text-[#5145cd]">
                               <Key className="w-4 h-4 mr-2" />
                               <span className="font-mono font-black text-lg tracking-[0.2em]">{liveTokens[session.id] || '------'}</span>
                             </div>
                             <div className="text-[9px] font-bold text-indigo-400 mt-1 uppercase flex items-center">
                               <Clock className="w-3 h-3 mr-1" /> Update: {Math.floor(countdown/60)}:{(countdown%60).toString().padStart(2,'0')}
                             </div>
                          </div>
                        </td>
                        <td className="py-5 px-4 text-right">
                          <div className="flex items-center justify-end space-x-3">
                             <Link href={`/hq/llms/${session.id}/questions`} className="flex flex-col items-center group">
                                <div className="p-2.5 bg-gray-100 text-gray-500 rounded-lg group-hover:bg-[#5145cd] group-hover:text-white transition-all shadow-sm">
                                   <FileText className="w-5 h-5" />
                                </div>
                                <span className="text-[9px] font-bold text-gray-500 mt-1 group-hover:text-[#5145cd]">SOAL</span>
                             </Link>
                             <Link href={`/hq/llms/${session.id}/monitor`} className="flex flex-col items-center group">
                                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm relative">
                                   <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full animate-pulse"></span>
                                   <Monitor className="w-5 h-5" />
                                </div>
                                <span className="text-[9px] font-bold text-blue-600 mt-1">PANTAU</span>
                             </Link>
                             <Link href={`/hq/llms/${session.id}/leaderboard`} className="flex flex-col items-center group">
                                <div className="p-2.5 bg-amber-50 text-amber-500 rounded-lg group-hover:bg-amber-500 group-hover:text-white transition-all shadow-sm">
                                   <Trophy className="w-5 h-5" />
                                </div>
                                <span className="text-[9px] font-bold text-amber-500 mt-1">SKOR</span>
                             </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SIDEBAR TOOLS */}
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100">
                <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-4">Aksi Cepat</h3>
                <div className="space-y-3">
                  <Link href="/hq/llms/broadcast" className="w-full flex items-center justify-between p-4 bg-[#5145cd] text-white rounded-2xl shadow-md hover:scale-[1.02] transition-all group">
                    <span className="text-[10px] font-black uppercase tracking-widest">Kirim Siaran</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <button onClick={fetchTelemetryData} className="w-full flex items-center justify-center p-4 bg-white border border-gray-200 text-gray-600 rounded-2xl hover:bg-gray-50 transition-all text-[10px] font-black uppercase tracking-widest">
                    <RotateCcw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} /> Sinkron Data
                  </button>
                </div>
              </div>

              <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Security Log</h3>
                  <div className="px-2 py-0.5 bg-rose-500 text-[8px] text-white font-black rounded uppercase">Live Feed</div>
                </div>
                {securityLogs.length === 0 ? (
                  <div className="py-6 flex flex-col items-center justify-center text-center bg-emerald-50/50 rounded-2xl border border-emerald-100/50">
                    <ShieldCheck className="w-12 h-12 text-emerald-400 mb-2 drop-shadow-sm" />
                    <p className="text-[10px] font-black text-emerald-600 uppercase">Aman Terkendali</p>
                    <p className="text-[9px] font-bold text-emerald-500/70 mt-0.5">100% Integritas Terjaga</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {securityLogs.map(log => (
                      <div key={log.id} className="p-3 bg-rose-50/80 rounded-xl border border-rose-100 flex justify-between items-center relative overflow-hidden">
                        <div className="absolute left-0 top-0 w-1 h-full bg-rose-500"></div>
                        <div className="flex items-center pl-1">
                          <AlertTriangle className="w-4 h-4 text-rose-500 mr-2" />
                          <div>
                            <p className="text-[10px] font-black text-gray-800">{log.userId}</p>
                            <p className="text-[9px] font-bold text-rose-600">{log.count}x Pelanggaran</p>
                          </div>
                        </div>
                        <span className="text-[9px] font-mono text-gray-400 font-bold">{log.time}</span>
                      </div>
                    ))}
                    
                    <button onClick={downloadSecurityReport} className="w-full mt-4 py-3 bg-white border border-rose-200 hover:bg-rose-50 text-rose-700 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all shadow-sm flex items-center justify-center group">
                      <FileDown className="w-4 h-4 mr-1.5 group-hover:-translate-y-0.5 transition-transform" /> Laporan (.CSV)
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* --- MODAL TAMBAH SESI (PRESERVED) --- */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-xl rounded-[3rem] p-10 shadow-2xl relative animate-in zoom-in-95 duration-300 text-left">
              <div className="flex justify-between items-center mb-8">
                 <h2 className="text-xl font-black text-gray-800">Buka Sesi Ujian Baru</h2>
                 <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-all active:scale-90"><X size={24} /></button>
              </div>

              <div className="space-y-6 text-left">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Judul Sesi</label>
                    <input type="text" value={newSession.title} onChange={(e) => setNewSession({...newSession, title: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-6 py-4 text-sm font-bold text-gray-700 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all" placeholder="Contoh: Matematika Dasar" />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Token Akses Master</label>
                       <input type="text" value={newSession.token} onChange={(e) => setNewSession({...newSession, token: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-6 py-4 text-sm font-bold text-gray-700 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all" placeholder="TOKEN123" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Durasi (Menit)</label>
                       <input type="number" value={newSession.duration_minutes} onChange={(e) => setNewSession({...newSession, duration_minutes: parseInt(e.target.value) || 0})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-6 py-4 text-sm font-bold text-gray-700 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all" />
                    </div>
                 </div>
                 <button onClick={handleAddSession} disabled={isSaving} className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-3">
                    {isSaving ? <Loader2 className="animate-spin" /> : <><Save size={20} /> Bangun Sesi Sekarang</>}
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
