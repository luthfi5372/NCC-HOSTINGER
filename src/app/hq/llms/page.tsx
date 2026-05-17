"use client";
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { 
  Server, Users, FileText, ShieldAlert, 
  Megaphone, Trophy, Play, Plus, 
  ChevronRight, Download, Loader2, X, Save,
  Activity, Clock, Search, Bell, History, RotateCcw,
  ArrowLeft, Key
} from "lucide-react";

export default function DashboardOverview() {
  const supabase = createClient();
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // 📊 Live KPIs
  const [stats, setStats] = useState({
    activeSessions: 0,
    totalQuestions: 0,
    liveParticipants: 0,
    totalViolations: 0
  });

  // 📝 New Session State
  const [newSession, setNewSession] = useState({
    title: "", token: "", duration_minutes: 90, scoring_system: "Fixed",
    correct_point: 4, penalty_point: 0, empty_point: 0
  });

  // 🕒 State untuk Rolling Token 10 Menit
  const [countdown, setCountdown] = useState(0);
  const [liveTokens, setLiveTokens] = useState<Record<string, string>>({});

  // --- 📡 DATA ENGINE ---
  const fetchData = async () => {
    setRefreshing(true);
    try {
      const { data: sessionData } = await supabase.from('cbt_exams').select('*').order('created_at', { ascending: false });
      const { count: qCount } = await supabase.from('cbt_questions').select('*', { count: 'exact', head: true });
      const { data: attempts } = await supabase.from('cbt_attempts').select('warnings_count, status');

      if (sessionData) {
        setSessions(sessionData);
        setStats({
          activeSessions: sessionData.filter(s => s.is_active).length,
          totalQuestions: qCount || 0,
          liveParticipants: attempts?.filter(a => a.status === 'ongoing').length || 0,
          totalViolations: attempts?.reduce((acc, curr) => acc + (curr.warnings_count || 0), 0) || 0
        });
      }
    } catch (err) { console.error(err); } finally { 
      setIsLoading(false); 
      setTimeout(() => setRefreshing(false), 500);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // MESIN PENGHITUNG WAKTU TOKEN (Setiap 10 Menit = 600 Detik)
  useEffect(() => {
    const updateTimerAndTokens = () => {
      const now = Math.floor(Date.now() / 1000);
      const interval10Min = 600; 
      const currentInterval = Math.floor(now / interval10Min);
      const secondsLeft = interval10Min - (now % interval10Min);
      
      setCountdown(secondsLeft);

      // Buat token acak deterministik berdasarkan ID sesi dan waktu saat ini
      const newTokens: Record<string, string> = {};
      sessions.forEach(s => {
        const charPool = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Tanpa O, 0, I, 1 agar tidak tertukar
        let token = "";
        let seed = (s.id.charCodeAt(0) + currentInterval) % 10000;
        for(let i=0; i<6; i++) {
           seed = (seed * 9301 + 49297) % 233280;
           token += charPool[Math.floor((seed / 233280) * charPool.length)];
        }
        newTokens[s.id] = token;
      });
      setLiveTokens(newTokens);
    };

    updateTimerAndTokens(); // Jalankan sekali saat render
    const timer = setInterval(updateTimerAndTokens, 1000);
    return () => clearInterval(timer);
  }, [sessions]);

  // Format detik ke MM:SS
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
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

  if (isLoading) return (
    <div className="min-h-screen bg-[#fafcff] flex items-center justify-center">
      <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fafcff] p-6 md:p-8 font-sans select-none text-left overflow-x-hidden text-gray-800">
      {/* 🧬 INJEKSI CUSTOM CSS UNTUK ANIMASI STAGGERED */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-stagger-1 { animation: fadeUp 0.5s ease-out 0.1s forwards; opacity: 0; }
        .animate-stagger-2 { animation: fadeUp 0.5s ease-out 0.2s forwards; opacity: 0; }
        .animate-stagger-3 { animation: fadeUp 0.5s ease-out 0.3s forwards; opacity: 0; }
        .animate-stagger-4 { animation: fadeUp 0.5s ease-out 0.4s forwards; opacity: 0; }
      `}} />

      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* 🧼 HEADER UTAMA DENGAN TOMBOL KEMBALI */}
        <div className="animate-stagger-1 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 transition-all duration-300 hover:shadow-md">
          <div className="flex items-center space-x-4 px-2">
            {/* Tombol Kembali */}
            <Link href="/hq" className="p-2.5 bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-700 rounded-xl transition-colors border border-transparent hover:border-gray-200">
              <ArrowLeft className="w-5 h-5" />
            </Link>

            <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 shadow-inner">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-gray-800 tracking-tight">Pusat Komando LLMS</h1>
              <p className="text-[10px] text-gray-400 font-medium mt-0.5">Administrasi Terpusat NCC 13th.</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <span className="flex items-center px-4 py-1.5 bg-emerald-50 border border-emerald-100/50 rounded-full text-[9px] font-bold text-emerald-600 uppercase tracking-widest shadow-sm">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse mr-2 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
              Infrastruktur Aktif
            </span>
          </div>
        </div>

        {/* 📊 METRIK KPI (Lebih Sederhana) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="animate-stagger-2 bg-white p-5 rounded-2xl border border-gray-100/50 shadow-sm flex items-center justify-between transition-all hover:shadow-md group">
            <div>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Peserta Online</p>
              <h3 className="text-3xl font-black mt-1 text-indigo-600 transition-transform duration-300 group-hover:scale-105 origin-left">
                {refreshing ? <Loader2 className="w-6 h-6 animate-spin text-gray-200" /> : stats.liveParticipants}
              </h3>
            </div>
            <Users className="w-8 h-8 text-indigo-100" />
          </div>

          <div className="animate-stagger-2 bg-white p-5 rounded-2xl border border-gray-100/50 shadow-sm flex items-center justify-between transition-all hover:shadow-md group">
            <div>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Sesi Aktif</p>
              <h3 className="text-3xl font-black mt-1 text-gray-800 transition-transform duration-300 group-hover:scale-105 origin-left">
                {refreshing ? <Loader2 className="w-6 h-6 animate-spin text-gray-200" /> : stats.activeSessions}
              </h3>
            </div>
            <Play className="w-8 h-8 text-gray-100" />
          </div>

          <div className="animate-stagger-2 bg-white p-5 rounded-2xl border border-gray-100/50 shadow-sm flex items-center justify-between transition-all hover:shadow-md group">
            <div>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Bank Soal</p>
              <h3 className="text-3xl font-black mt-1 text-gray-800 transition-transform duration-300 group-hover:scale-105 origin-left">
                {refreshing ? <Loader2 className="w-6 h-6 animate-spin text-gray-200" /> : stats.totalQuestions}
              </h3>
            </div>
            <FileText className="w-8 h-8 text-gray-100" />
          </div>

          <div className="animate-stagger-2 bg-white p-5 rounded-2xl border border-gray-100/50 shadow-sm flex items-center justify-between transition-all hover:shadow-md group relative overflow-hidden">
            <div className={`absolute right-0 top-0 w-1.5 h-full transition-all duration-500 ${stats.totalViolations > 0 ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.6)]' : 'bg-transparent'}`}></div>
            <div>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Radar Kecurangan</p>
              <h3 className={`text-3xl font-black mt-1 transition-all duration-300 group-hover:scale-105 origin-left ${stats.totalViolations > 0 ? 'text-rose-500' : 'text-gray-800'}`}>
                {refreshing ? <Loader2 className="w-6 h-6 animate-spin text-gray-200" /> : stats.totalViolations}
              </h3>
            </div>
            <ShieldAlert className={`w-8 h-8 ${stats.totalViolations > 0 ? 'text-rose-100' : 'text-gray-100'}`} />
          </div>
        </div>

        {/* 🏢 LAYOUT DASHBOARD */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 text-left">
          
          {/* KIRI: MONITORING SESI & TOKEN */}
          <div className="animate-stagger-3 lg:col-span-2 bg-white rounded-3xl border border-gray-100/50 shadow-sm overflow-hidden flex flex-col min-h-[400px] transition-all duration-300 hover:shadow-md">
            <div className="p-5 flex justify-between items-center border-b border-gray-50 bg-gray-50/30">
              <h2 className="text-sm font-bold text-gray-800">Monitor Sesi Aktif</h2>
              <button onClick={() => setShowAddModal(true)} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg flex items-center transition-all shadow-md shadow-indigo-100">
                <Plus className="w-3 h-3 mr-1" /> Buat Sesi
              </button>
            </div>
            
            <div className="p-2 flex-1 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-gray-400 text-[9px] font-semibold uppercase tracking-widest border-b border-gray-50">
                    <th className="py-3 px-4">Sesi Ujian</th>
                    <th className="py-3 px-4 text-center">Live Token</th>
                    <th className="py-3 px-4">Status Waktu</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {sessions.length === 0 && !loading && (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-gray-300 font-bold uppercase tracking-widest animate-pulse">Belum ada sesi aktif</td>
                    </tr>
                  )}
                  {sessions.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50/50 transition-colors duration-200 group">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${s.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300 group-hover:bg-indigo-400'}`}></div>
                          <div>
                            <p className="font-bold text-gray-800">{s.title || 'Ujian Nasional'}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">ID: {s.id.substring(0,8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col items-center">
                          {/* TAMPILAN TOKEN BERPUTAR */}
                          <div className="flex items-center px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-lg">
                            <Key className="w-3.5 h-3.5 text-indigo-500 mr-2" />
                            <span className="font-mono font-bold text-indigo-700 tracking-widest text-sm">
                              {liveTokens[s.id] || '------'}
                            </span>
                          </div>
                          <p className="text-[9px] font-medium text-gray-400 mt-1.5 flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            Refresh dlm <span className={`ml-1 font-mono font-bold ${countdown < 60 ? 'text-rose-500 animate-pulse' : 'text-gray-500'}`}>{formatTime(countdown)}</span>
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="w-24 bg-gray-100 rounded-full h-1.5 mb-1">
                          <div className="bg-indigo-500 h-1.5 rounded-full transition-all duration-1000 ease-out" style={{ width: '100%' }}></div>
                        </div>
                        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">{s.duration_minutes || 90} MNT</p>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <Link href={`/hq/llms/${s.id}/questions`} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all" title="Bank Soal">
                            <FileText className="w-4 h-4" />
                          </Link>
                          <Link href={`/hq/llms/${s.id}/leaderboard`} className="p-2 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded-xl transition-all" title="Peringkat">
                            <Trophy className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ⚡ KANAN: AKSI CEPAT & SECURITY LOG */}
          <div className="space-y-5">
            
            {/* AKSI CEPAT */}
            <div className="animate-stagger-4 bg-white p-5 rounded-3xl border border-gray-100/50 shadow-sm transition-all duration-300 hover:shadow-md">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Quick Commands</h2>
              <div className="space-y-2">
                <Link href="/hq/llms/broadcast" className="w-full flex items-center justify-between p-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white rounded-xl transition-all duration-200 shadow-sm shadow-indigo-100 group">
                  <span className="text-[10px] font-bold uppercase tracking-widest">Kirim Broadcast</span>
                  <ChevronRight className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" />
                </Link>

                <button onClick={fetchData} className="w-full flex items-center justify-center p-3.5 border border-gray-100 hover:bg-gray-50 active:scale-[0.98] text-gray-600 rounded-xl transition-all duration-200">
                  <RotateCcw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin text-indigo-500' : ''}`} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Refresh Stat</span>
                </button>
              </div>
            </div>

            {/* SECURITY FEED */}
            <div className="animate-stagger-4 bg-white p-5 rounded-3xl border border-gray-100/50 shadow-sm transition-all duration-300 hover:shadow-md flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Security Feed</h2>
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-start space-x-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 flex-shrink-0 shadow-[0_0_8px_rgba(244,63,94,0.4)]"></div>
                  <div>
                    <p className="text-[10px] text-gray-800 font-bold">Radar Deteksi Aktif</p>
                    <p className="text-[9px] text-gray-400 mt-0.5 leading-relaxed">{stats.totalViolations} insiden keluar layar tercatat.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
                  <div>
                    <p className="text-[10px] text-gray-800 font-bold">Integritas Sinkron</p>
                    <p className="text-[9px] text-gray-400 mt-0.5 leading-relaxed">Penyimpanan tersinkronisasi aman.</p>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>

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
