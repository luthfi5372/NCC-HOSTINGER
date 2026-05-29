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
  Loader2, X, Save, Pencil, ToggleLeft, ToggleRight, Trash2,
  Zap, Activity, Radio, Lock
} from "lucide-react";

export default function IntegratedLLMSDashboard() {
  const supabase = createClient();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ onlineParticipants: 0, activeSessions: 0, totalQuestions: 0, totalViolations: 0 });
  const [sessions, setSessions] = useState<any[]>([]);
  const [securityLogs, setSecurityLogs] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [liveTokens, setLiveTokens] = useState<Record<string, string>>({});
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newSession, setNewSession] = useState({
    title: "", token: "", duration_minutes: 90, scoring_system: "Fixed",
    correct_point: 4, penalty_point: 0, empty_point: 0
  });

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSession, setEditingSession] = useState<any>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingSession, setDeletingSession] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
  };

  const openEditModal = (session: any) => {
    setEditingSession({ ...session });
    setShowEditModal(true);
  };

  const handleUpdateSession = async () => {
    if (!editingSession) return;
    setIsSavingEdit(true);
    const { error } = await supabase.from('cbt_exams').update({
      title: editingSession.title,
      duration_minutes: editingSession.duration_minutes,
      correct_point: editingSession.correct_point,
      penalty_point: editingSession.penalty_point,
      empty_point: editingSession.empty_point,
      is_active: editingSession.is_active,
    }).eq('id', editingSession.id);
    if (!error) {
      setShowEditModal(false);
      fetchTelemetryData();
      showToast('Sesi berhasil diperbarui!', 'success');
    } else {
      showToast('Gagal memperbarui sesi.', 'error');
    }
    setIsSavingEdit(false);
  };

  const openDeleteModal = (session: any) => {
    setDeletingSession(session);
    setShowDeleteModal(true);
  };

  const handleDeleteSession = async () => {
    if (!deletingSession) return;
    setIsDeleting(true);
    try {
      await supabase.from('cbt_attempts').delete().eq('exam_id', deletingSession.id);
      await supabase.from('cbt_questions').delete().eq('exam_id', deletingSession.id);
      const { error } = await supabase.from('cbt_exams').delete().eq('id', deletingSession.id);
      if (error) throw error;
      setShowDeleteModal(false);
      setDeletingSession(null);
      fetchTelemetryData();
      showToast('Sesi berhasil dihapus permanen.', 'success');
    } catch (err: any) {
      showToast('Gagal menghapus sesi: ' + (err.message || ''), 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleActive = async (sessionId: string, currentStatus: boolean) => {
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, is_active: !currentStatus } : s));
    const { error } = await supabase.from('cbt_exams')
      .update({ is_active: !currentStatus })
      .eq('id', sessionId);
    if (error) {
      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, is_active: currentStatus } : s));
      showToast('Gagal mengubah status sesi.', 'error');
    } else {
      showToast(`Sesi ${!currentStatus ? 'diaktifkan' : 'dinonaktifkan'}.`, 'success');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const lastFetchTimeRef = React.useRef<number>(0);
  const fetchTimeoutRef = React.useRef<any>(null);

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

  const fetchTelemetryThrottled = () => {
    const now = Date.now();
    const throttleDelay = 5000;
    if (fetchTimeoutRef.current) return;
    const timeSinceLastFetch = now - lastFetchTimeRef.current;
    if (timeSinceLastFetch >= throttleDelay) {
      lastFetchTimeRef.current = now;
      fetchTelemetryData();
    } else {
      const delayRemaining = throttleDelay - timeSinceLastFetch;
      fetchTimeoutRef.current = setTimeout(() => {
        lastFetchTimeRef.current = Date.now();
        fetchTelemetryData();
        fetchTimeoutRef.current = null;
      }, delayRemaining);
    }
  };

  useEffect(() => {
    fetchTelemetryData();
    const channel = supabase.channel('dashboard-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cbt_attempts' }, fetchTelemetryThrottled)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cbt_questions' }, fetchTelemetryThrottled)
      .subscribe();
    return () => { 
      supabase.removeChannel(channel); 
      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
    };
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
        let idSum = 0;
        for (let i = 0; i < s.id.length; i++) { idSum += s.id.charCodeAt(i); }
        let seed = (idSum + currentInterval) % 10000;
        for(let i=0; i<6; i++) { 
          seed = (seed * 9301 + 49297) % 233280; 
          token += charPool[Math.floor((seed / 233280) * charPool.length)]; 
        }
        newTokens[s.id] = token;
      });
      setLiveTokens(newTokens);
    };
    updateTimerAndTokens(); 
    const timer = setInterval(updateTimerAndTokens, 1000);
    return () => clearInterval(timer);
  }, [sessions]);

  const handleAddSession = async () => {
    if (!newSession.title || newSession.title.trim() === '') return showToast('Judul sesi tidak boleh kosong!', 'error');
    if (!newSession.duration_minutes || newSession.duration_minutes <= 0) return showToast('Durasi ujian harus lebih dari 0 menit!', 'error');
    const finalToken = newSession.token && newSession.token.trim() !== ''
      ? newSession.token.trim().toUpperCase()
      : Math.random().toString(36).substring(2, 8).toUpperCase();
    setIsSaving(true);
    try {
      const { error } = await supabase.from('cbt_exams').insert([{
        title: newSession.title.trim(),
        token: finalToken,
        duration_minutes: newSession.duration_minutes,
        scoring_system: newSession.scoring_system,
        correct_point: newSession.correct_point,
        penalty_point: newSession.penalty_point,
        empty_point: newSession.empty_point,
        is_active: false,
      }]);
      if (error) throw error;
      setShowAddModal(false);
      setNewSession({ title: '', token: '', duration_minutes: 90, scoring_system: 'Fixed', correct_point: 4, penalty_point: 0, empty_point: 0 });
      fetchTelemetryData();
      showToast('Sesi ujian baru berhasil dibuat!', 'success');
    } catch (err: any) {
      showToast('Gagal membuat sesi: ' + (err?.message || 'Unknown error'), 'error');
    } finally {
      setIsSaving(false);
    }
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
      <div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
          </div>
          <p className="text-slate-400 text-sm font-semibold tracking-wider uppercase">Memuat Pusat Komando...</p>
        </div>
      </div>
    );
  }

  const navItems = [
    { href: "/hq", icon: LayoutGrid, label: "Dashboard" },
    { href: "/hq?tab=Peserta", icon: Users, label: "Buku Peserta", badge: "11" },
    { href: "/hq?tab=Verifikasi", icon: BadgeCheck, label: "Verifikasi Berkas", badge: "0" },
    { href: "/hq/llms/broadcast", icon: Megaphone, label: "Siaran Info" },
    { href: "/hq?tab=Kegiatan", icon: Calendar, label: "Kegiatan" },
    { href: "/hq?tab=Schedule", icon: Clock, label: "Schedule Lomba" },
    { href: "/hq?tab=Media", icon: ImageIcon, label: "Kelola Media" },
    { href: "/hq/settings", icon: Settings, label: "Pengaturan" },
  ];

  return (
    <div className="flex min-h-screen bg-[#0f1117] font-sans">

      {/* ─── SIDEBAR (Dark Premium) ─── */}
      <aside className="hidden lg:flex w-64 bg-[#13151f] border-r border-white/5 flex-col fixed h-full z-20">
        {/* Logo */}
        <div className="p-6 mt-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-black text-white leading-none tracking-tight">NCC HQ.</h1>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Command Center</p>
            </div>
          </div>
        </div>

        {/* Status pill */}
        <div className="px-6 mb-4">
          <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Sistem Online</span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto pb-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center justify-between px-3 py-2.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all group text-sm font-medium"
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-4 h-4 group-hover:text-indigo-400 transition-colors" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[9px] font-black bg-white/10 text-slate-400 px-1.5 py-0.5 rounded-md">{item.badge}</span>
              )}
            </Link>
          ))}

          {/* Active: Manajemen LLMS */}
          <div className="relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-indigo-500 rounded-full"></div>
            <Link
              href="/hq/llms"
              className="flex items-center justify-between pl-5 pr-3 py-2.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-xl font-semibold text-sm"
            >
              <div className="flex items-center gap-3">
                <Server className="w-4 h-4 text-indigo-400" />
                <span>Manajemen LLMS</span>
              </div>
              <span className="text-[8px] font-black bg-indigo-500 text-white px-1.5 py-0.5 rounded-md uppercase tracking-wider">NEW</span>
            </Link>
          </div>
        </nav>

        <div className="p-4 border-t border-white/5">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Sesi</span>
          </button>
        </div>
      </aside>

      {/* ─── MAIN CONTENT ─── */}
      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen">

        {/* TOP HEADER */}
        <header className="sticky top-0 z-10 bg-[#0f1117]/80 backdrop-blur-xl border-b border-white/5 px-6 md:px-8 py-4 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Live Dashboard</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">Pusat Komando LLMS</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Administrasi CBT Terpusat · NCC 13th</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchTelemetryData}
              className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-slate-400 hover:text-white"
              title="Sinkron Data"
            >
              <RotateCcw className={`w-4 h-4 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-indigo-500/25"
            >
              <Plus className="w-4 h-4" />
              Sesi Baru
            </button>
          </div>
        </header>

        <div className="p-6 md:p-8 space-y-6 flex-1">

          {/* ─── STAT CARDS ─── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Peserta Online */}
            <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/10 border border-blue-500/20 rounded-2xl p-5 relative overflow-hidden group hover:border-blue-500/40 transition-all">
              <div className="absolute top-3 right-3 w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center group-hover:bg-blue-500/20 transition-all">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              <p className="text-[10px] font-bold text-blue-400/70 uppercase tracking-widest mb-2">Peserta Online</p>
              <p className="text-4xl font-black text-blue-300">{stats.onlineParticipants}</p>
              <div className="flex items-center gap-1 mt-2">
                <Activity className="w-3 h-3 text-blue-500" />
                <span className="text-[10px] text-blue-500/70 font-medium">Real-time</span>
              </div>
            </div>

            {/* Sesi Aktif */}
            <div className="bg-gradient-to-br from-violet-600/20 to-violet-800/10 border border-violet-500/20 rounded-2xl p-5 relative overflow-hidden group hover:border-violet-500/40 transition-all">
              <div className="absolute top-3 right-3 w-10 h-10 bg-violet-500/10 rounded-xl flex items-center justify-center group-hover:bg-violet-500/20 transition-all">
                <Radio className="w-5 h-5 text-violet-400" />
              </div>
              <p className="text-[10px] font-bold text-violet-400/70 uppercase tracking-widest mb-2">Sesi Aktif</p>
              <p className="text-4xl font-black text-violet-300">{stats.activeSessions}</p>
              <div className="flex items-center gap-1 mt-2">
                <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-pulse"></span>
                <span className="text-[10px] text-violet-500/70 font-medium">Running</span>
              </div>
            </div>

            {/* Bank Soal */}
            <div className="bg-gradient-to-br from-teal-600/20 to-teal-800/10 border border-teal-500/20 rounded-2xl p-5 relative overflow-hidden group hover:border-teal-500/40 transition-all">
              <div className="absolute top-3 right-3 w-10 h-10 bg-teal-500/10 rounded-xl flex items-center justify-center group-hover:bg-teal-500/20 transition-all">
                <FileText className="w-5 h-5 text-teal-400" />
              </div>
              <p className="text-[10px] font-bold text-teal-400/70 uppercase tracking-widest mb-2">Bank Soal</p>
              <p className="text-4xl font-black text-teal-300">{stats.totalQuestions}</p>
              <div className="flex items-center gap-1 mt-2">
                <Zap className="w-3 h-3 text-teal-500" />
                <span className="text-[10px] text-teal-500/70 font-medium">Total soal</span>
              </div>
            </div>

            {/* Kecurangan */}
            <div className={`bg-gradient-to-br rounded-2xl p-5 relative overflow-hidden group transition-all ${
              stats.totalViolations > 0
                ? 'from-rose-600/25 to-rose-800/15 border border-rose-500/30 hover:border-rose-500/50'
                : 'from-slate-600/10 to-slate-800/5 border border-slate-700/30 hover:border-slate-600/40'
            }`}>
              <div className={`absolute top-3 right-3 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                stats.totalViolations > 0 ? 'bg-rose-500/20 group-hover:bg-rose-500/30' : 'bg-slate-700/30'
              }`}>
                <ShieldAlert className={`w-5 h-5 ${stats.totalViolations > 0 ? 'text-rose-400' : 'text-slate-500'}`} />
              </div>
              <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${stats.totalViolations > 0 ? 'text-rose-400/70' : 'text-slate-500'}`}>Kecurangan</p>
              <p className={`text-4xl font-black ${stats.totalViolations > 0 ? 'text-rose-300' : 'text-slate-400'}`}>{stats.totalViolations}</p>
              <div className="flex items-center gap-1 mt-2">
                {stats.totalViolations > 0
                  ? <><span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse"></span><span className="text-[10px] text-rose-500/70 font-medium">Terdeteksi</span></>
                  : <><ShieldCheck className="w-3 h-3 text-slate-500" /><span className="text-[10px] text-slate-500 font-medium">Aman</span></>
                }
              </div>
            </div>
          </div>

          {/* ─── MAIN GRID ─── */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

            {/* SESSION TABLE */}
            <div className="xl:col-span-2 bg-[#13151f] border border-white/5 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">Daftar Sesi & Monitoring</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{sessions.length} sesi terdaftar</p>
                </div>
              </div>

              {sessions.length === 0 ? (
                <div className="py-16 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4">
                    <Server className="w-8 h-8 text-slate-600" />
                  </div>
                  <p className="text-slate-400 font-semibold">Belum ada sesi ujian</p>
                  <p className="text-slate-600 text-sm mt-1">Klik &quot;Sesi Baru&quot; untuk memulai</p>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="mt-4 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all"
                  >
                    <Plus className="w-3.5 h-3.5 inline mr-1.5" />Buat Sesi Pertama
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {sessions.map((session) => (
                    <div key={session.id} className="px-6 py-5 hover:bg-white/[0.02] transition-all group">
                      <div className="flex items-center justify-between gap-4">

                        {/* Session info */}
                        <div className="flex items-center gap-4 min-w-0">
                          {/* Status indicator */}
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            session.is_active
                              ? 'bg-emerald-500/15 border border-emerald-500/30'
                              : 'bg-white/5 border border-white/10'
                          }`}>
                            <span className={`w-2.5 h-2.5 rounded-full ${session.is_active ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`}></span>
                          </div>

                          <div className="min-w-0">
                            <p className="font-bold text-white text-sm truncate">{session.title || 'Ujian Tanpa Judul'}</p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="text-[10px] font-mono bg-white/5 text-slate-500 px-2 py-0.5 rounded-md">{session.id.substring(0,8)}</span>
                              <span className="text-[10px] font-semibold text-slate-500">{session.duration_minutes || 90} mnt</span>
                              {/* Toggle */}
                              <button
                                onClick={() => handleToggleActive(session.id, session.is_active)}
                                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ${
                                  session.is_active ? 'bg-emerald-500' : 'bg-white/10'
                                }`}
                              >
                                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition duration-200 ${session.is_active ? 'translate-x-4' : 'translate-x-0.5'}`} />
                              </button>
                              <span className={`text-[9px] font-black uppercase tracking-wider ${session.is_active ? 'text-emerald-400' : 'text-slate-600'}`}>
                                {session.is_active ? 'ON' : 'OFF'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Live Token */}
                        <div className="hidden sm:flex flex-col items-center bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-4 py-2.5 shrink-0">
                          <div className="flex items-center gap-1.5 text-indigo-300">
                            <Key className="w-3 h-3" />
                            <span className="font-mono font-black text-sm tracking-[0.25em]">{liveTokens[session.id] || '------'}</span>
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <Clock className="w-2.5 h-2.5 text-indigo-500" />
                            <span className="text-[9px] text-indigo-500 font-bold">{Math.floor(countdown/60)}:{(countdown%60).toString().padStart(2,'0')}</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => openEditModal(session)}
                            className="p-2 bg-white/5 hover:bg-indigo-500/20 hover:text-indigo-300 text-slate-500 rounded-lg transition-all"
                            title="Edit"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <Link
                            href={`/hq/llms/${session.id}/questions`}
                            className="p-2 bg-white/5 hover:bg-slate-500/20 hover:text-slate-300 text-slate-500 rounded-lg transition-all"
                            title="Soal"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </Link>
                          <Link
                            href={`/hq/llms/${session.id}/monitor`}
                            className="p-2 bg-white/5 hover:bg-blue-500/20 hover:text-blue-300 text-slate-500 rounded-lg transition-all relative"
                            title="Pantau"
                          >
                            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
                            <Monitor className="w-3.5 h-3.5" />
                          </Link>
                          <Link
                            href={`/hq/llms/${session.id}/leaderboard`}
                            className="p-2 bg-white/5 hover:bg-amber-500/20 hover:text-amber-300 text-slate-500 rounded-lg transition-all"
                            title="Skor"
                          >
                            <Trophy className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => openDeleteModal(session)}
                            className="p-2 bg-white/5 hover:bg-rose-500/20 hover:text-rose-300 text-slate-500 rounded-lg transition-all"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Action labels (small text below icons) */}
                      <div className="hidden sm:flex items-center justify-end gap-1.5 mt-1.5 pr-0.5">
                        {['Edit', 'Soal', 'Pantau', 'Skor', 'Hapus'].map(label => (
                          <span key={label} className="text-[8px] text-slate-700 font-bold uppercase tracking-wider w-[34px] text-center">{label}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SIDEBAR TOOLS */}
            <div className="space-y-5">

              {/* Quick Actions */}
              <div className="bg-[#13151f] border border-white/5 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest">Aksi Cepat</h3>
                </div>
                <div className="space-y-2.5">
                  <Link
                    href="/hq/llms/broadcast"
                    className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl hover:from-indigo-500 hover:to-violet-500 transition-all group shadow-lg shadow-indigo-500/20"
                  >
                    <div className="flex items-center gap-2">
                      <Radio className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">Kirim Siaran</span>
                    </div>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                  <button
                    onClick={fetchTelemetryData}
                    className="w-full flex items-center justify-center gap-2 p-3.5 bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all text-xs font-bold uppercase tracking-wider"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
                    Sinkron Data
                  </button>
                </div>
              </div>

              {/* Security Log */}
              <div className="bg-[#13151f] border border-white/5 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest">Security Log</h3>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-rose-500/15 border border-rose-500/20 rounded-lg">
                    <span className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-pulse"></span>
                    <span className="text-[9px] text-rose-400 font-bold uppercase">Live</span>
                  </div>
                </div>

                {securityLogs.length === 0 ? (
                  <div className="py-8 flex flex-col items-center justify-center text-center bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mb-3">
                      <ShieldCheck className="w-6 h-6 text-emerald-400" />
                    </div>
                    <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Aman Terkendali</p>
                    <p className="text-[10px] text-emerald-600 mt-1">100% Integritas Terjaga</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {securityLogs.map(log => (
                      <div key={log.id} className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          <div>
                            <p className="text-[10px] font-bold text-white truncate max-w-[100px]">{log.userId.substring(0,8)}...</p>
                            <p className="text-[9px] text-rose-400 font-medium">{log.count}x pelanggaran</p>
                          </div>
                        </div>
                        <span className="text-[9px] font-mono text-slate-500">{log.time}</span>
                      </div>
                    ))}
                    <button
                      onClick={downloadSecurityReport}
                      className="w-full mt-2 py-3 bg-white/5 border border-white/10 hover:bg-rose-500/10 hover:border-rose-500/20 text-slate-500 hover:text-rose-400 text-[9px] font-bold uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5"
                    >
                      <FileDown className="w-3.5 h-3.5" />Laporan .CSV
                    </button>
                  </div>
                )}
              </div>

              {/* Token Info Card */}
              <div className="bg-gradient-to-br from-indigo-600/10 to-violet-600/10 border border-indigo-500/20 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Lock className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest">Info Token</h3>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Token berubah otomatis setiap <span className="font-bold text-indigo-300">10 menit</span>. Bagikan ke peserta sebelum ujian dimulai.
                </p>
                <div className="mt-3 flex items-center gap-2 p-2.5 bg-indigo-500/10 rounded-lg">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-xs font-mono text-indigo-300 font-bold">
                    Rotasi dalam: {Math.floor(countdown/60)}:{(countdown%60).toString().padStart(2,'0')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ─── MODAL EDIT ─── */}
      {showEditModal && editingSession && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
          <div className="bg-[#13151f] border border-white/10 w-full max-w-xl rounded-3xl p-8 shadow-2xl relative">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-black text-white">Edit Sesi Ujian</h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">ID: {editingSession.id?.substring(0,8)}...</p>
              </div>
              <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-white/10 rounded-xl text-slate-500 hover:text-white transition-all">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Judul Sesi</label>
                <input type="text" value={editingSession.title || ''} onChange={e => setEditingSession({...editingSession, title: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 focus:border-indigo-500/50 rounded-xl px-4 py-3 text-sm font-medium text-white outline-none transition-all placeholder-slate-600" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Durasi (Menit)</label>
                  <input type="number" value={editingSession.duration_minutes || 90} onChange={e => setEditingSession({...editingSession, duration_minutes: parseInt(e.target.value)||90})}
                    className="w-full bg-white/5 border border-white/10 focus:border-indigo-500/50 rounded-xl px-4 py-3 text-sm font-medium text-white outline-none transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Status Sesi</label>
                  <button onClick={() => setEditingSession({...editingSession, is_active: !editingSession.is_active})}
                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all border ${
                      editingSession.is_active ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-white/5 border-white/10 text-slate-500'
                    }`}>
                    {editingSession.is_active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                    {editingSession.is_active ? 'Aktif' : 'Nonaktif'}
                  </button>
                </div>
              </div>
              <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest mb-3">⚙️ Konfigurasi Poin</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: '✓ Benar', key: 'correct_point', color: 'emerald' },
                    { label: '✗ Salah', key: 'penalty_point', color: 'rose' },
                    { label: '— Kosong', key: 'empty_point', color: 'slate' },
                  ].map(({ label, key, color }) => (
                    <div key={key} className="space-y-1.5">
                      <label className={`text-[9px] font-black uppercase tracking-widest text-${color}-400`}>{label}</label>
                      <input type="number" value={editingSession[key] ?? 0} onChange={e => setEditingSession({...editingSession, [key]: parseInt(e.target.value)||0})}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm font-black text-white outline-none text-center" />
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={handleUpdateSession} disabled={isSavingEdit}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                {isSavingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save size={16} /> Simpan Perubahan</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL DELETE ─── */}
      {showDeleteModal && deletingSession && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/70 backdrop-blur-md">
          <div className="bg-[#13151f] border border-rose-500/20 w-full max-w-md rounded-3xl p-8 shadow-2xl relative">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-rose-500/15 border border-rose-500/30 text-rose-400 rounded-2xl flex items-center justify-center mb-5">
                <Trash2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-black text-white">Hapus Sesi Permanen</h2>
              <p className="text-sm text-slate-400 font-medium mt-2 leading-relaxed">
                Sesi <span className="font-black text-white">&ldquo;{deletingSession.title}&rdquo;</span> beserta{' '}
                <span className="text-rose-400 font-bold">semua soal & data peserta</span> akan dihapus selamanya.
              </p>
              <div className="w-full mt-5 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-left">
                <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-2">⚠️ Tidak dapat dibatalkan!</p>
                <ul className="text-xs text-rose-400/80 font-medium space-y-1 list-disc list-inside">
                  <li>Semua soal (cbt_questions)</li>
                  <li>Semua data & skor peserta (cbt_attempts)</li>
                  <li>Sesi ujian itu sendiri (cbt_exams)</li>
                </ul>
              </div>
              <div className="flex gap-3 w-full mt-5">
                <button onClick={() => { setShowDeleteModal(false); setDeletingSession(null); }} disabled={isDeleting}
                  className="flex-1 py-3 bg-white/5 border border-white/10 text-slate-400 hover:text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-white/10 transition-all">
                  Batal
                </button>
                <button onClick={handleDeleteSession} disabled={isDeleting}
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                  {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  {isDeleting ? 'Menghapus...' : 'Hapus Permanen'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL ADD ─── */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
          <div className="bg-[#13151f] border border-white/10 w-full max-w-xl rounded-3xl p-8 shadow-2xl relative">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-black text-white">Buat Sesi Ujian Baru</h2>
                <p className="text-xs text-slate-500 mt-0.5">Isi detail sesi ujian yang akan dibuka</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white/10 rounded-xl text-slate-500 hover:text-white transition-all">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Judul Sesi</label>
                <input type="text" value={newSession.title} onChange={(e) => setNewSession({...newSession, title: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 focus:border-indigo-500/50 rounded-xl px-4 py-3 text-sm font-medium text-white outline-none transition-all placeholder-slate-600"
                  placeholder="Contoh: Matematika Dasar – Sesi 1" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Token Akses (opsional)</label>
                  <input type="text" value={newSession.token} onChange={(e) => setNewSession({...newSession, token: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 focus:border-indigo-500/50 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none transition-all placeholder-slate-600 uppercase"
                    placeholder="AUTO" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Durasi (Menit)</label>
                  <input type="number" value={newSession.duration_minutes} onChange={(e) => setNewSession({...newSession, duration_minutes: parseInt(e.target.value) || 0})}
                    className="w-full bg-white/5 border border-white/10 focus:border-indigo-500/50 rounded-xl px-4 py-3 text-sm font-medium text-white outline-none transition-all" />
                </div>
              </div>
              <button onClick={handleAddSession} disabled={isSaving}
                className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white py-4 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus size={16} /> Buat Sesi Sekarang</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── TOAST ─── */}
      <div className={`fixed bottom-6 right-6 z-[99999] transition-all duration-500 transform ${toast.visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0 pointer-events-none'}`}>
        <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border backdrop-blur-md ${
          toast.type === 'success' ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-300' : 'bg-rose-950/90 border-rose-500/30 text-rose-300'
        }`}>
          <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-white text-xs font-black ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
            {toast.type === 'success' ? '✓' : '✕'}
          </div>
          <p className="text-sm font-semibold">{toast.message}</p>
        </div>
      </div>
    </div>
  );
}
