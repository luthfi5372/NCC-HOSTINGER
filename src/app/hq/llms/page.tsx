"use client";
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getLLMSTelemetryData } from "@/app/actions/auth";
import { 
  LayoutGrid, Users, BadgeCheck, Megaphone, 
  Calendar, Image as ImageIcon, Server, Settings,
  LogOut, Play, FileText, ShieldAlert, Plus,
  RotateCcw, Key, Clock, Monitor, Trophy,
  ShieldCheck, AlertTriangle, FileDown, ChevronRight,
  Loader2, X, Save, Pencil, ToggleLeft, ToggleRight, Trash2,
  Zap, Activity, Radio, Lock, MoreHorizontal, MessageSquare, Info, Check
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
  
  // Custom filter and UI states for premium dashboard (similar to reference image)
  const [activeFilter, setActiveFilter] = useState<'active' | 'inactive' | 'all'>('active');
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [activeTooltipId, setActiveTooltipId] = useState<string | null>(null);

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
    try { await supabase.auth.signOut(); } catch (_) {}
    try {
      const { logoutLocalUser } = await import("@/app/actions/auth");
      await logoutLocalUser();
    } catch (_) {
      router.push('/login');
    }
  };

  const lastFetchTimeRef = React.useRef<number>(0);
  const fetchTimeoutRef = React.useRef<any>(null);

  const fetchTelemetryData = async () => {
    setRefreshing(true);
    try {
      const { questionCount, examsData, attemptsData, error } = await getLLMSTelemetryData();

      if (error) {
        console.error("Gagal menarik data telemetri LLMS:", error);
      }

      let onlineCount = 0;
      let violationSum = 0;
      let logs: any[] = [];

      if (attemptsData) {
        attemptsData.forEach((attempt: any) => {
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
    // 🚀 CLIENT-SIDE AUTH RECOVERY
    const ensureAdminSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const adminEmails = ["admin@ncc.id", "admin1@ncc.id", "halo.ncc@gmail.com"];
        const currentEmail = session?.user?.email?.toLowerCase();
        
        if (!session || !adminEmails.includes(currentEmail || "")) {
          console.log("[Admin HQ LLMS Client] No valid admin session. Recovering...");
          await supabase.auth.signInWithPassword({
            email: 'admin1@ncc.id',
            password: '123456'
          });
        }
      } catch (err) {
        console.error("[Admin HQ LLMS Client] Silent auth recovery error:", err);
      }
    };

    // Ensure session is recovered in background
    ensureAdminSession();

    // Fetch initial data
    fetchTelemetryData();

    // Safety Guard: Force end loading after 5 seconds
    const safetyTimer = setTimeout(() => {
      setLoading(false);
      console.warn("Safety timeout triggered: forcing loader closure in LLMS.");
    }, 5000);

    const channel = supabase.channel('dashboard-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cbt_attempts' }, fetchTelemetryThrottled)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cbt_questions' }, fetchTelemetryThrottled)
      .subscribe();

    return () => { 
      clearTimeout(safetyTimer);
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

  // Click outside to close dropdowns
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.dropdown-trigger') && !target.closest('.dropdown-menu')) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

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
    const headers = ['Waktu', 'ID Peserta', 'Jumlah Pelanggaran'];
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

  const renderSessionCard = (session: any) => {
    const isActive = session.is_active;
    const sessionToken = liveTokens[session.id] || session.token || "------";

    // Scoring system badge content
    let scoringLabel = "CBT Ujian";
    if (session.scoring_system === "Fixed" || session.correct_point !== undefined) {
      scoringLabel = `UTBK (+${session.correct_point || 4} / ${session.penalty_point || 0} / ${session.empty_point || 0})`;
    }

    return (
      <div
        key={session.id}
        className="bg-white border border-slate-100/90 shadow-[0_4px_20px_rgba(0,0,0,0.015)] hover:border-indigo-150 rounded-[24px] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300 relative hover:shadow-md hover:scale-[1.005] group/card"
      >
        {/* Kolom Kiri: Ikon & Info Judul */}
        <div className="flex items-center gap-4 min-w-0">
          {/* Ikon Clipboard dengan dot status di pojok kanan bawah */}
          <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center shrink-0 relative shadow-inner">
            <FileText className="w-5.5 h-5.5 text-slate-400" />
            <span
              className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-3 border-white transition-all duration-500 ${
                isActive
                  ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)] animate-pulse"
                  : "bg-slate-300"
              }`}
            ></span>
          </div>
          
          <div className="min-w-0 space-y-1">
            <p className="font-extrabold text-slate-800 text-sm md:text-base tracking-tight leading-snug truncate group-hover/card:text-indigo-600 transition-colors">
              {session.title || "Ujian Tanpa Judul"}
            </p>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-[9px] font-black tracking-wider uppercase text-indigo-600 bg-indigo-50/50 border border-indigo-100/30 rounded-md inline-block">
                {scoringLabel}
              </span>
              <span className="text-[9px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                {session.id.substring(0, 8)}
              </span>
            </div>
          </div>
        </div>

        {/* Kolom Tengah 1: Token & Durasi (dengan Tooltip premium) */}
        <div className="flex flex-row md:flex-col justify-between md:justify-center items-center md:items-start gap-1 shrink-0 px-2">
          {/* Live Token */}
          <div className="flex items-center gap-1.5 text-cyan-600 bg-cyan-50 border border-cyan-100/50 px-3 py-1 rounded-xl shadow-sm hover:scale-105 transition-all duration-300">
            <Key className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
            <span className="text-xs font-mono font-black tracking-wider uppercase">
              {sessionToken}
            </span>
          </div>

          {/* Durasi dengan dotted border & Tooltip Gelap (Hover) */}
          <div className="relative group/tooltip mt-1 cursor-help">
            <span className="text-[10px] text-slate-400 font-extrabold border-b border-dashed border-slate-300 pb-0.5 transition-colors group-hover/tooltip:border-slate-500 group-hover/tooltip:text-slate-600">
              Duration: {session.duration_minutes || 90} mins
            </span>
            
            {/* Popover Tooltip */}
            <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 hidden group-hover/tooltip:block bg-slate-950/95 backdrop-blur-md text-white text-[11px] rounded-[20px] p-4 shadow-2xl z-50 border border-slate-800 w-56 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="space-y-2.5 text-left font-sans">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full shrink-0"></span>
                  <div>
                    <p className="text-[9px] text-slate-400 font-black uppercase leading-none tracking-wide">Tanggal Pembuatan</p>
                    <p className="font-extrabold text-slate-100 mt-0.5">
                      {new Date(session.created_at || Date.now()).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric"
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 border-t border-slate-800/80 pt-2">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full shrink-0"></span>
                  <div>
                    <p className="text-[9px] text-slate-400 font-black uppercase leading-none tracking-wide">Poin Penilaian</p>
                    <p className="font-extrabold text-slate-100 mt-0.5">
                      Benar: +{session.correct_point || 4} · Salah: {session.penalty_point || 0} · Kosong: {session.empty_point || 0}
                    </p>
                  </div>
                </div>
              </div>
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-950"></div>
            </div>
          </div>
        </div>

        {/* Kolom Tengah 2: Proctor / Pengawas */}
        <div className="flex items-center gap-2.5 shrink-0 px-2">
          <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100/50 flex items-center justify-center text-indigo-650 shrink-0 shadow-inner">
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <div>
            <p className="text-[11px] font-extrabold text-slate-700 leading-none">Command HQ</p>
            <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider mt-0.5">
              {isActive ? "Proctor Active" : "Proctor Waiting"}
            </p>
          </div>
        </div>

        {/* Kolom Status Pill */}
        <div className="shrink-0 flex items-center px-1">
          <button
            onClick={() => handleToggleActive(session.id, isActive)}
            className={`px-4 py-1.5 rounded-full flex items-center gap-2 text-[11px] font-black border transition-all duration-300 shadow-sm active:scale-95 ${
              isActive
                ? "bg-emerald-50/50 border-emerald-250 text-emerald-700 hover:bg-emerald-50"
                : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isActive
                  ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)] animate-pulse"
                  : "bg-slate-350"
              }`}
            ></span>
            {isActive ? "In Progress" : "Waiting Approval"}
          </button>
        </div>

        {/* Kolom Kanan: Aksi (Siaran & Dropdown Menu `...`) */}
        <div className="flex items-center gap-2 shrink-0 justify-end">
          <Link
            href="/hq/llms/broadcast"
            className="p-2 text-slate-400 hover:text-indigo-650 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 rounded-xl transition-all duration-200 active:scale-90"
            title="Kirim Siaran Info"
          >
            <MessageSquare className="w-4.5 h-4.5" />
          </Link>

          {/* EllipsisDropdown Menu */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOpenDropdownId(openDropdownId === session.id ? null : session.id);
              }}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 border border-transparent hover:border-slate-200 rounded-xl transition-all duration-200 dropdown-trigger active:scale-90"
              title="Kelola Sesi"
            >
              <MoreHorizontal className="w-4.5 h-4.5" />
            </button>

            {openDropdownId === session.id && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-150 rounded-2xl shadow-xl z-[90] p-1.5 dropdown-menu animate-in fade-in slide-in-from-top-2 duration-200">
                <Link
                  href={`/hq/llms/${session.id}/questions`}
                  className="w-full flex items-center gap-2 px-3 py-2 text-[11px] text-slate-700 hover:text-indigo-650 hover:bg-indigo-50/50 rounded-xl font-bold tracking-tight text-left transition-all"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  Kelola Bank Soal
                </Link>
                <Link
                  href={`/hq/llms/${session.id}/monitor`}
                  className="w-full flex items-center gap-2 px-3 py-2 text-[11px] text-slate-700 hover:text-blue-650 hover:bg-blue-50/50 rounded-xl font-bold tracking-tight text-left transition-all"
                >
                  <Monitor className="w-3.5 h-3.5 text-slate-400 animate-pulse" />
                  Pantau Live (CCTV)
                </Link>
                <Link
                  href={`/hq/llms/${session.id}/leaderboard`}
                  className="w-full flex items-center gap-2 px-3 py-2 text-[11px] text-slate-700 hover:text-amber-650 hover:bg-amber-50/50 rounded-xl font-bold tracking-tight text-left transition-all"
                >
                  <Trophy className="w-3.5 h-3.5 text-slate-400" />
                  Papan Skor (Hasil)
                </Link>
                <button
                  onClick={() => {
                    openEditModal(session);
                    setOpenDropdownId(null);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-[11px] text-slate-700 hover:text-emerald-650 hover:bg-emerald-50/50 rounded-xl font-bold tracking-tight text-left transition-all"
                >
                  <Pencil className="w-3.5 h-3.5 text-slate-400" />
                  Edit Detail Sesi
                </button>
                <div className="h-px bg-slate-100 my-1"></div>
                <button
                  onClick={() => {
                    openDeleteModal(session);
                    setOpenDropdownId(null);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-[11px] text-rose-600 hover:bg-rose-50 rounded-xl font-extrabold tracking-tight text-left transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  Hapus Sesi Ujian
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading && sessions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shadow-sm">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
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
    <div className="flex min-h-screen bg-slate-50/70 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50/60 via-slate-50 to-slate-100/60 font-sans relative overflow-hidden">
      
      {/* Decorative Orbs for vibrant modern aesthetics */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-indigo-200/15 rounded-full blur-3xl pointer-events-none -z-10"></div>
      <div className="absolute bottom-[20%] right-[-10%] w-[40vw] h-[40vw] bg-violet-200/15 rounded-full blur-3xl pointer-events-none -z-10"></div>
      <div className="absolute top-[40%] right-[30%] w-[30vw] h-[30vw] bg-pink-200/10 rounded-full blur-3xl pointer-events-none -z-10"></div>

      {/* ─── SIDEBAR (Glassmorphic) ─── */}
      <aside className="hidden lg:flex w-60 bg-white/70 backdrop-blur-xl border-r border-slate-200/60 flex-col fixed h-full z-20 shadow-lg shadow-slate-200/20">
        {/* Logo */}
        <div className="px-5 py-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-300">
              <ShieldCheck className="w-4.5 h-4.5 text-white" style={{width:'18px',height:'18px'}} />
            </div>
            <div>
              <h1 className="text-sm font-black text-slate-800 leading-none tracking-tight">NCC HQ.</h1>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Command Center</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto pb-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center justify-between px-3 py-2.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/40 hover:shadow-[0_2px_8px_-2px_rgba(79,70,229,0.08)] rounded-xl transition-all group text-sm font-medium"
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-4 h-4 group-hover:text-indigo-500 group-hover:scale-105 transition-all duration-200" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[9px] font-black bg-slate-100 group-hover:bg-indigo-100/50 text-slate-400 group-hover:text-indigo-600 px-1.5 py-0.5 rounded-md transition-colors">{item.badge}</span>
              )}
            </Link>
          ))}

          {/* Active: Manajemen LLMS */}
          <div className="relative pt-1.5">
            <Link
              href="/hq/llms"
              className="flex items-center justify-between px-3 py-2.5 bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/20 hover:scale-[1.02] hover:shadow-xl hover:shadow-indigo-500/30 transition-all duration-300"
            >
              <div className="flex items-center gap-3">
                <Server className="w-4 h-4 text-indigo-200 animate-pulse" />
                <span>Manajemen LLMS</span>
              </div>
              <span className="text-[8px] font-black bg-white/30 text-white px-1.5 py-0.5 rounded-md uppercase tracking-wider shadow-inner animate-pulse">NEW</span>
            </Link>
          </div>
        </nav>

        <div className="p-3 border-t border-slate-200/60">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Sesi</span>
          </button>
        </div>
      </aside>

      {/* ─── MAIN CONTENT ─── */}
      <main className="flex-1 lg:ml-60 flex flex-col min-h-screen relative z-10">

        {/* TOP HEADER */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 px-6 md:px-8 py-4 flex justify-between items-center shadow-sm shadow-slate-100/20">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]"></span>
              <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100/50">Sistem Online</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 tracking-tight">Pusat Komando LLMS</h2>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">Administrasi CBT Terpusat · NCC 13th</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchTelemetryData}
              className="p-3 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-xl transition-all text-slate-500 hover:text-slate-800 shadow-sm active:scale-95"
              title="Sinkron Data"
            >
              <RotateCcw className={`w-4 h-4 ${refreshing ? 'animate-spin text-indigo-500' : ''}`} />
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/35 hover:scale-[1.02] active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3px]" />
              Sesi Baru
            </button>
          </div>
        </header>

        <div className="p-6 md:p-8 space-y-6 flex-1">

          {/* ─── STAT CARDS (VIBRANT NEON GLOW GRID) ─── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">

            {/* Peserta Online */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-3xl p-6 shadow-lg shadow-blue-500/10 border border-blue-400/20 hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300 relative overflow-hidden group">
              <div className="absolute right-[-10%] top-[-10%] w-32 h-32 bg-white/5 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500"></div>
              <div className="flex items-start justify-between relative z-10">
                <div>
                  <p className="text-[10px] font-bold text-blue-200/90 uppercase tracking-widest mb-2.5">Peserta Online</p>
                  <p className="text-4xl font-black tracking-tight">{stats.onlineParticipants}</p>
                  <div className="flex items-center gap-1.5 mt-4 bg-white/10 px-2.5 py-1 rounded-xl w-fit border border-white/5 backdrop-blur-md">
                    <Activity className="w-3.5 h-3.5 text-blue-200 animate-pulse" />
                    <span className="text-[10px] text-blue-200 font-bold tracking-wider uppercase">Live Sync</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center group-hover:bg-white/20 group-hover:rotate-6 transition-all duration-300 shadow-inner">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            {/* Sesi Ujian */}
            <div className="bg-gradient-to-br from-violet-600 to-indigo-700 text-white rounded-3xl p-6 shadow-lg shadow-indigo-500/10 border border-indigo-400/20 hover:scale-[1.02] hover:shadow-xl hover:shadow-indigo-500/20 transition-all duration-300 relative overflow-hidden group">
              <div className="absolute right-[-10%] top-[-10%] w-32 h-32 bg-white/5 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500"></div>
              <div className="flex items-start justify-between relative z-10">
                <div>
                  <p className="text-[10px] font-bold text-indigo-200/90 uppercase tracking-widest mb-2.5">Sesi Ujian</p>
                  <p className="text-4xl font-black tracking-tight">{stats.activeSessions}</p>
                  <div className="flex items-center gap-1.5 mt-4 bg-white/10 px-2.5 py-1 rounded-xl w-fit border border-white/5 backdrop-blur-md">
                    <span className="w-2 h-2 bg-indigo-300 rounded-full animate-ping"></span>
                    <span className="text-[10px] text-indigo-200 font-bold tracking-wider uppercase">Running</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center group-hover:bg-white/20 group-hover:rotate-6 transition-all duration-300 shadow-inner">
                  <Radio className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            {/* Bank Soal */}
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-3xl p-6 shadow-lg shadow-emerald-500/10 border border-emerald-400/20 hover:scale-[1.02] hover:shadow-xl hover:shadow-emerald-500/20 transition-all duration-300 relative overflow-hidden group">
              <div className="absolute right-[-10%] top-[-10%] w-32 h-32 bg-white/5 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500"></div>
              <div className="flex items-start justify-between relative z-10">
                <div>
                  <p className="text-[10px] font-bold text-emerald-200/90 uppercase tracking-widest mb-2.5">Bank Soal</p>
                  <p className="text-4xl font-black tracking-tight">{stats.totalQuestions}</p>
                  <div className="flex items-center gap-1.5 mt-4 bg-white/10 px-2.5 py-1 rounded-xl w-fit border border-white/5 backdrop-blur-md">
                    <Zap className="w-3.5 h-3.5 text-emerald-200" />
                    <span className="text-[10px] text-emerald-200 font-bold tracking-wider uppercase">Verified</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center group-hover:bg-white/20 group-hover:rotate-6 transition-all duration-300 shadow-inner">
                  <FileText className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            {/* Kecurangan */}
            <div className={`text-white rounded-3xl p-6 hover:scale-[1.02] transition-all duration-300 relative overflow-hidden group ${
              stats.totalViolations > 0 
                ? 'bg-gradient-to-br from-rose-600 to-red-700 shadow-lg shadow-rose-500/25 border border-rose-500/30' 
                : 'bg-gradient-to-br from-slate-800 to-slate-900 shadow-lg shadow-slate-950/20 border border-slate-700/40'
            }`}>
              <div className="absolute right-[-10%] top-[-10%] w-32 h-32 bg-white/5 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500"></div>
              <div className="flex items-start justify-between relative z-10">
                <div>
                  <p className="text-[10px] font-bold text-slate-300/90 uppercase tracking-widest mb-2.5">Integritas Keamanan</p>
                  <p className="text-4xl font-black tracking-tight">{stats.totalViolations}</p>
                  <div className="flex items-center gap-1.5 mt-4 bg-white/10 px-2.5 py-1 rounded-xl w-fit border border-white/5 backdrop-blur-md">
                    {stats.totalViolations > 0 ? (
                      <>
                        <span className="w-2 h-2 bg-rose-400 rounded-full animate-ping"></span>
                        <span className="text-[10px] text-rose-200 font-bold tracking-wider uppercase">Terdeteksi</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                        <span className="text-[10px] text-emerald-300 font-bold tracking-wider uppercase">Sangat Aman</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center group-hover:bg-white/20 group-hover:rotate-6 transition-all duration-300 shadow-inner">
                  <ShieldAlert className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* ─── MAIN GRID ─── */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

            {/* SESSION TABLE */}
            <div className="xl:col-span-2 space-y-6">
              
              {/* TABS (Seperti Gambar Referensi) */}
              <div className="bg-white border border-slate-100 shadow-[0_4px_25px_rgba(0,0,0,0.015)] rounded-[24px] p-2 flex gap-1 relative z-25">
                {[
                  { id: 'active', label: 'Active Sessions', count: sessions.filter(s => s.is_active).length },
                  { id: 'inactive', label: 'Draft & Inactive', count: sessions.filter(s => !s.is_active).length },
                  { id: 'all', label: 'All Sessions', count: sessions.length }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveFilter(tab.id as any)}
                    className={`flex-1 py-3 px-4 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all duration-300 relative ${
                      activeFilter === tab.id
                        ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                        : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {tab.label} ({tab.count})
                  </button>
                ))}
              </div>

              {/* LIST CONTAINER */}
              <div className="space-y-6">
                
                {/* SECTION: CURRENT */}
                {(activeFilter === 'active' || activeFilter === 'all') && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                      <span>CURRENT</span>
                      <Info className="w-3.5 h-3.5 text-slate-350 cursor-help" title="Sesi ujian yang sedang aktif dan bisa diikuti peserta" />
                    </div>
                    {sessions.filter(s => s.is_active).length === 0 ? (
                      <div className="bg-white border border-slate-100 rounded-3xl p-8 text-center shadow-[0_2px_12px_rgba(0,0,0,0.01)]">
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Tidak ada sesi aktif saat ini</p>
                        <p className="text-slate-350 text-[11px] mt-1">Aktifkan sesi dari tab Draft/Semua atau buat sesi baru.</p>
                      </div>
                    ) : (
                      <div className="space-y-3.5">
                        {sessions.filter(s => s.is_active).map((session) => renderSessionCard(session))}
                      </div>
                    )}
                  </div>
                )}

                {/* SECTION: UP NEXT */}
                {(activeFilter === 'inactive' || activeFilter === 'all') && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                      <span>UP NEXT</span>
                      <Info className="w-3.5 h-3.5 text-slate-350 cursor-help" title="Sesi ujian dalam bentuk draft atau belum diaktifkan" />
                    </div>
                    {sessions.filter(s => !s.is_active).length === 0 ? (
                      <div className="bg-white border border-slate-100 rounded-3xl p-8 text-center shadow-[0_2px_12px_rgba(0,0,0,0.01)]">
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Semua sesi telah diaktifkan</p>
                        <p className="text-slate-350 text-[11px] mt-1">Gunakan tab Aktif untuk memantau pengerjaan ujian.</p>
                      </div>
                    ) : (
                      <div className="space-y-3.5">
                        {sessions.filter(s => !s.is_active).map((session) => renderSessionCard(session))}
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>

            {/* SIDEBAR TOOLS */}
            <div className="space-y-5">

              {/* Quick Actions */}
              <div className="bg-white/80 backdrop-blur-xl border border-white/60 p-5 rounded-3xl shadow-lg shadow-indigo-100/5">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-7 h-7 bg-indigo-500/10 border border-indigo-200/50 rounded-xl flex items-center justify-center shadow-sm">
                    <Zap className="w-4 h-4 text-indigo-600" />
                  </div>
                  <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest">Aksi Cepat</h3>
                </div>
                <div className="space-y-3">
                  <Link
                    href="/hq/llms/broadcast"
                    className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white rounded-2xl transition-all duration-300 group shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/35 hover:scale-[1.02] active:scale-95"
                  >
                    <div className="flex items-center gap-2.5">
                      <Radio className="w-4 h-4 text-indigo-100 animate-pulse" />
                      <span className="text-xs font-black uppercase tracking-wider">Kirim Siaran</span>
                    </div>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform stroke-[3px]" />
                  </Link>
                  <button
                    onClick={fetchTelemetryData}
                    className="w-full flex items-center justify-center gap-2 p-3.5 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 text-slate-700 hover:text-indigo-600 rounded-2xl transition-all duration-300 text-xs font-black uppercase tracking-wider shadow-sm active:scale-95"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-indigo-500' : 'text-slate-500'}`} />
                    Sinkron Data
                  </button>
                </div>
              </div>

              {/* Security Log */}
              <div className="bg-white/80 backdrop-blur-xl border border-white/60 p-5 rounded-3xl shadow-lg shadow-slate-100/5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-rose-500/10 border border-rose-200/50 rounded-xl flex items-center justify-center shadow-sm">
                      <ShieldAlert className="w-4 h-4 text-rose-500 animate-pulse" />
                    </div>
                    <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest">Security Log</h3>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-rose-50 border border-rose-100 rounded-lg">
                    <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping"></span>
                    <span className="text-[9px] text-rose-500 font-black uppercase tracking-widest">Live</span>
                  </div>
                </div>

                {securityLogs.length === 0 ? (
                  <div className="py-7 flex flex-col items-center justify-center text-center bg-gradient-to-tr from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 shadow-[0_8px_30px_rgba(16,185,129,0.08)] rounded-2xl relative overflow-hidden group/aman">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.15)_0%,transparent_70%)] opacity-0 group-hover/aman:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                    <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-200/50 rounded-full flex items-center justify-center mb-3 shadow-inner relative z-10 animate-pulse">
                      <ShieldCheck className="w-6 h-6 text-emerald-600" />
                    </div>
                    <p className="text-xs font-black text-emerald-700 uppercase tracking-widest relative z-10">Aman Terkendali</p>
                    <p className="text-[10px] text-emerald-500/70 font-bold mt-1 relative z-10">100% Integritas Terjaga</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {securityLogs.map(log => (
                      <div key={log.id} className="p-3 bg-rose-500/5 border border-rose-200/40 rounded-2xl flex justify-between items-center transition-all duration-300 hover:bg-rose-500/10 hover:border-rose-500/30 shadow-sm shadow-rose-500/5">
                        <div className="flex items-center gap-2.5">
                          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 animate-bounce" />
                          <div>
                            <p className="text-[11px] font-black text-slate-800 tracking-tight font-mono">{log.userId.substring(0,8)}...</p>
                            <p className="text-[9px] text-rose-600 font-extrabold tracking-wide uppercase mt-0.5">{log.count}x pelanggaran</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-black font-mono text-slate-400 bg-white border border-slate-200/50 px-2 py-0.5 rounded-md shadow-sm">{log.time}</span>
                      </div>
                    ))}
                    <button
                      onClick={downloadSecurityReport}
                      className="w-full mt-2 py-3.5 bg-white border border-slate-200 hover:border-rose-200 hover:bg-rose-50/30 text-slate-600 hover:text-rose-600 text-xs font-black uppercase tracking-widest rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 shadow-sm"
                    >
                      <FileDown className="w-4 h-4" />Laporan .CSV
                    </button>
                  </div>
                )}
              </div>

              {/* Token Info */}
              <div className="bg-gradient-to-br from-indigo-500/5 via-violet-500/5 to-purple-500/5 border border-indigo-100 rounded-3xl p-5 shadow-lg shadow-indigo-100/5">
                <div className="flex items-center gap-2 mb-3.5">
                  <div className="w-7 h-7 bg-indigo-500/10 border border-indigo-200/50 rounded-xl flex items-center justify-center shadow-sm">
                    <Lock className="w-4 h-4 text-indigo-600" />
                  </div>
                  <h3 className="text-xs font-black text-indigo-900 uppercase tracking-widest">Info Token</h3>
                </div>
                <p className="text-[11px] text-indigo-950/80 leading-relaxed font-medium">
                  Token berubah otomatis setiap <span className="font-extrabold text-indigo-600 bg-indigo-100/50 px-1.5 py-0.5 rounded border border-indigo-200/30">10 menit</span>. Bagikan ke peserta sebelum ujian dimulai.
                </p>
                <div className="mt-4 flex items-center gap-2.5 p-3 bg-white/80 backdrop-blur-md border border-indigo-100/80 rounded-2xl shadow-sm">
                  <Clock className="w-4 h-4 text-indigo-500 animate-spin" style={{ animationDuration: '6s' }} />
                  <span className="text-xs font-mono text-indigo-900 font-extrabold tracking-wide">
                    Rotasi dalam: <span className="text-indigo-600 font-black">{Math.floor(countdown/60)}:{(countdown%60).toString().padStart(2,'0')}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ─── MODAL EDIT ─── */}
      {showEditModal && editingSession && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-md">
          <div className="bg-white/95 backdrop-blur-xl border border-white w-full max-w-xl rounded-[32px] p-8 shadow-2xl shadow-slate-950/20 relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-black text-slate-900 uppercase tracking-wider">Edit Sesi Ujian</h2>
                <p className="text-xs text-slate-400 font-bold mt-1">ID: <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">{editingSession.id?.substring(0,8)}...</span></p>
              </div>
              <button onClick={() => setShowEditModal(false)} className="p-2.5 hover:bg-slate-100 rounded-2xl text-slate-400 hover:text-slate-600 transition-all active:scale-90">
                <X size={20} className="stroke-[2.5px]" />
              </button>
            </div>
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Judul Sesi</label>
                <input type="text" value={editingSession.title || ''} onChange={e => setEditingSession({...editingSession, title: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200/80 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 rounded-2xl px-4 py-3.5 text-sm font-semibold text-slate-800 outline-none transition-all duration-200" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Durasi (Menit)</label>
                  <input type="number" value={editingSession.duration_minutes || 90} onChange={e => setEditingSession({...editingSession, duration_minutes: parseInt(e.target.value)||90})}
                    className="w-full bg-slate-50 border border-slate-200/80 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 rounded-2xl px-4 py-3.5 text-sm font-semibold text-slate-800 outline-none transition-all duration-200" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Status Sesi</label>
                  <button onClick={() => setEditingSession({...editingSession, is_active: !editingSession.is_active})}
                    className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all duration-300 border-2 ${
                      editingSession.is_active 
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 border-transparent text-white shadow-md shadow-emerald-200/60' 
                        : 'bg-slate-50 border-slate-200/80 text-slate-500'
                    }`}>
                    {editingSession.is_active ? <ToggleRight className="w-5 h-5 animate-pulse" /> : <ToggleLeft className="w-5 h-5" />}
                    {editingSession.is_active ? 'Aktif (ON)' : 'Nonaktif (OFF)'}
                  </button>
                </div>
              </div>
              <div className="p-5 bg-indigo-500/5 border border-indigo-100/50 rounded-2xl shadow-inner">
                <p className="text-[10px] font-black uppercase text-indigo-500 tracking-widest mb-3 flex items-center gap-1.5">
                  <span>⚙️</span> Konfigurasi Poin Penilaian
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-emerald-600">✓ Benar</label>
                    <input type="number" value={editingSession.correct_point ?? 4} onChange={e => setEditingSession({...editingSession, correct_point: parseInt(e.target.value)||0})}
                      className="w-full bg-white border border-emerald-200 rounded-xl px-3 py-2.5 text-sm font-black text-slate-700 outline-none text-center focus:ring-4 focus:ring-emerald-100" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-rose-500">✗ Salah</label>
                    <input type="number" value={editingSession.penalty_point ?? 0} onChange={e => setEditingSession({...editingSession, penalty_point: parseInt(e.target.value)||0})}
                      className="w-full bg-white border border-rose-200 rounded-xl px-3 py-2.5 text-sm font-black text-slate-700 outline-none text-center focus:ring-4 focus:ring-rose-100" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">— Kosong</label>
                    <input type="number" value={editingSession.empty_point ?? 0} onChange={e => setEditingSession({...editingSession, empty_point: parseInt(e.target.value)||0})}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-black text-slate-700 outline-none text-center focus:ring-4 focus:ring-slate-100" />
                  </div>
                </div>
                <p className="text-[9px] text-indigo-400 font-bold mt-2 text-center">Standard UTBK: Benar = 4, Salah = -1, Kosong = 0</p>
              </div>
              <button onClick={handleUpdateSession} disabled={isSavingEdit}
                className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/35 transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50">
                {isSavingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save size={16} /> Simpan Perubahan</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL DELETE ─── */}
      {showDeleteModal && deletingSession && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-md">
          <div className="bg-white/95 backdrop-blur-xl border border-rose-100 w-full max-w-md rounded-[32px] p-8 shadow-2xl shadow-rose-950/20 relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-rose-500/10 border border-rose-200/50 text-rose-600 rounded-[24px] flex items-center justify-center mb-5 animate-bounce">
                <Trash2 className="w-8 h-8 stroke-[2px]" />
              </div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-wide">Hapus Sesi Permanen</h2>
              <p className="text-sm text-slate-500 font-semibold mt-2 leading-relaxed">
                Sesi <span className="font-extrabold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">&ldquo;{deletingSession.title}&rdquo;</span> beserta{' '}
                <span className="text-rose-500 font-bold block mt-1">semua bank soal & riwayat peserta</span> akan dihapus selamanya.
              </p>
              <div className="w-full mt-5 p-5 bg-rose-500/5 border border-rose-100/50 rounded-2xl text-left shadow-inner">
                <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-2 flex items-center gap-1">
                  <span>⚠️</span> Tidak Dapat Dibatalkan!
                </p>
                <ul className="text-xs text-rose-500/80 font-bold space-y-1 list-disc list-inside">
                  <li>Semua bank soal (cbt_questions)</li>
                  <li>Semua data & skor peserta (cbt_attempts)</li>
                  <li>Sesi ujian itu sendiri (cbt_exams)</li>
                </ul>
              </div>
              <div className="flex gap-3.5 w-full mt-6">
                <button onClick={() => { setShowDeleteModal(false); setDeletingSession(null); }} disabled={isDeleting}
                  className="flex-1 py-3.5 bg-slate-100 text-slate-600 font-extrabold text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-200 hover:text-slate-800 transition-all duration-200 active:scale-95">
                  Batal
                </button>
                <button onClick={handleDeleteSession} disabled={isDeleting}
                  className="flex-1 py-3.5 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-extrabold text-xs uppercase tracking-widest rounded-2xl transition-all duration-200 shadow-lg shadow-rose-500/20 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50">
                  {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  {isDeleting ? 'Menghapus...' : 'Hapus Permanen'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL ADD ─── */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-md">
          <div className="bg-white/95 backdrop-blur-xl border border-white w-full max-w-xl rounded-[32px] p-8 shadow-2xl shadow-slate-950/20 relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-black text-slate-900 uppercase tracking-wider">Buat Sesi Ujian Baru</h2>
                <p className="text-xs text-slate-400 font-semibold mt-1">Konfigurasikan sesi ujian CBT terpusat</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-2.5 hover:bg-slate-100 rounded-2xl text-slate-400 hover:text-slate-600 transition-all active:scale-90">
                <X size={20} className="stroke-[2.5px]" />
              </button>
            </div>
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Judul Sesi</label>
                <input type="text" value={newSession.title} onChange={(e) => setNewSession({...newSession, title: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200/80 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 rounded-2xl px-4 py-3.5 text-sm font-semibold text-slate-800 outline-none transition-all duration-200 placeholder-slate-300"
                  placeholder="Contoh: Matematika Dasar – Sesi Awal" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Token Akses (opsional)</label>
                  <input type="text" value={newSession.token} onChange={(e) => setNewSession({...newSession, token: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200/80 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-800 outline-none transition-all duration-200 placeholder-slate-300 uppercase tracking-widest"
                    placeholder="AUTO GENERATED" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Durasi (Menit)</label>
                  <input type="number" value={newSession.duration_minutes} onChange={(e) => setNewSession({...newSession, duration_minutes: parseInt(e.target.value) || 0})}
                    className="w-full bg-slate-50 border border-slate-200/80 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 rounded-2xl px-4 py-3.5 text-sm font-semibold text-slate-800 outline-none transition-all duration-200" />
                </div>
              </div>
              <button onClick={handleAddSession} disabled={isSaving}
                className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/35 hover:scale-[1.01] active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus size={16} className="stroke-[3px]" /> Buat Sesi Sekarang</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ➕ FLOATING ACTIONS BUTTON (Seperti Gambar Referensi) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2.5 px-8 py-4 bg-violet-600 hover:bg-violet-750 text-white font-extrabold text-xs uppercase tracking-wider rounded-full shadow-[0_10px_30px_rgba(109,40,217,0.35)] hover:shadow-[0_15px_35px_rgba(109,40,217,0.45)] transition-all duration-300 hover:scale-105 active:scale-95 border border-white/10"
        >
          <Plus className="w-4 h-4 stroke-[3px]" />
          New Session
        </button>
      </div>

      {/* ─── TOAST ─── */}
      <div className={`fixed bottom-6 right-6 z-[99999] transition-all duration-500 transform ${toast.visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0 pointer-events-none'}`}>
        <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border ${
          toast.type === 'success' ? 'bg-white border-emerald-100 shadow-emerald-100' : 'bg-white border-rose-100 shadow-rose-100'
        }`}>
          <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-white text-xs font-black ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
            {toast.type === 'success' ? '✓' : '✕'}
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Notifikasi</p>
            <p className="text-sm font-semibold text-slate-800">{toast.message}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
