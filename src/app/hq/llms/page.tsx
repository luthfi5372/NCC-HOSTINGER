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
  Activity, Clock, Search, Bell, History
} from "lucide-react";

export default function DashboardOverview() {
  const supabase = createClient();
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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

  // --- 📡 DATA ENGINE ---
  const fetchData = async () => {
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
    } catch (err) { console.error(err); } finally { setIsLoading(false); }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

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
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
      <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 md:p-8 font-sans select-none text-left">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* 🧼 HEADER UTAMA */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-4 px-2">
            <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 shadow-inner text-left">
              <Server className="w-6 h-6" />
            </div>
            <div className="text-left">
              <h1 className="text-xl font-bold text-gray-800 tracking-tight">Pusat Komando LLMS</h1>
              <p className="text-xs text-gray-500 font-medium mt-0.5">Sistem Administrasi CBT Terpusat NCC 13th.</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <span className="flex items-center px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-xl text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse mr-2"></span>
              Infrastruktur Aktif
            </span>
          </div>
        </div>

        {/* 📊 METRIK KPI DYNAMIS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between hover:shadow-md transition-all group">
            <div className="text-left">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Peserta Online</p>
              <h3 className="text-4xl font-black text-gray-800 mt-1">{stats.liveParticipants}</h3>
            </div>
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between hover:shadow-md transition-all group text-left">
            <div className="text-left">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Sesi Aktif</p>
              <h3 className="text-4xl font-black text-gray-800 mt-1">{stats.activeSessions}</h3>
            </div>
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Play className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between hover:shadow-md transition-all group text-left">
            <div className="text-left">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Bank Soal</p>
              <h3 className="text-4xl font-black text-gray-800 mt-1">{stats.totalQuestions}</h3>
            </div>
            <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-rose-100 shadow-sm flex items-center justify-between hover:shadow-md transition-all relative overflow-hidden group text-left">
            <div className="absolute right-0 top-0 w-1.5 h-full bg-rose-500"></div>
            <div className="text-left">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Radar Kecurangan</p>
              <h3 className="text-4xl font-black text-rose-600 mt-1">{stats.totalViolations}</h3>
            </div>
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <ShieldAlert className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* 🏢 LAYOUT DASHBOARD */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* KIRI: MONITORING SESI AKTIF */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col min-h-[500px] text-left">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
              <div className="text-left">
                <h2 className="text-base font-black text-gray-800">Monitor Sesi Aktif</h2>
                <p className="text-xs text-gray-500 mt-1">Status real-time setiap modul ujian nasional.</p>
              </div>
              <button onClick={() => setShowAddModal(true)} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center shadow-lg shadow-indigo-100">
                <Plus className="w-4 h-4 mr-2" /> Buka Sesi Baru
              </button>
            </div>
            
            <div className="flex-1 overflow-x-auto text-left">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-gray-50">
                    <th className="py-5 px-6">Mata Pelajaran</th>
                    <th className="py-5 px-6 text-center">Integritas</th>
                    <th className="py-5 px-6">Status Waktu</th>
                    <th className="py-5 px-6 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-left">
                  {sessions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-20 text-center text-gray-300 font-bold uppercase tracking-widest">Belum ada sesi ujian</td>
                    </tr>
                  ) : (
                    sessions.map((s) => (
                      <tr key={s.id} className="hover:bg-indigo-50/30 transition-colors group">
                        <td className="py-5 px-6 text-left">
                          <div className="flex items-center gap-3 text-left">
                            <div className={`w-2 h-2 rounded-full ${s.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`}></div>
                            <div>
                              <p className="font-bold text-gray-800">{s.title}</p>
                              <p className="text-[10px] font-mono text-gray-400 uppercase">TOKEN: {s.token}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-5 px-6 text-center">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${s.is_active ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-gray-50 text-gray-400 border-gray-100'}`}>
                            {s.is_active ? 'STABLE' : 'OFFLINE'}
                          </span>
                        </td>
                        <td className="py-5 px-6 text-left">
                          <div className="w-32 bg-gray-100 rounded-full h-1.5 mb-1.5">
                            <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: '100%' }}></div>
                          </div>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">{s.duration_minutes} Menit</p>
                        </td>
                        <td className="py-5 px-6 text-right">
                          <div className="flex items-center justify-end space-x-1">
                            <Link href={`/hq/llms/${s.id}/questions`} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all" title="Bank Soal">
                              <FileText className="w-5 h-5" />
                            </Link>
                            <Link href={`/hq/llms/${s.id}/leaderboard`} className="p-2 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded-xl transition-all" title="Peringkat">
                              <Trophy className="w-5 h-5" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ⚡ KANAN: AKSI CEPAT & SECURITY LOG */}
          <div className="space-y-6 text-left">
            
            {/* AKSI CEPAT */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm text-left">
              <h2 className="text-sm font-black text-gray-800 mb-5 text-left">Quick Commands</h2>
              <div className="space-y-3">
                <Link href="/hq/llms/broadcast" className="w-full flex items-center justify-between p-4 bg-indigo-600 text-white rounded-2xl transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-indigo-100 group">
                  <div className="flex items-center space-x-3 text-left">
                    <div className="bg-white/20 p-2 rounded-xl"><Megaphone className="w-4 h-4" /></div>
                    <span className="text-xs font-black uppercase tracking-widest text-left">Kirim Broadcast</span>
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </Link>

                <button onClick={fetchData} className="w-full flex items-center justify-between p-4 border border-gray-100 hover:bg-gray-50 text-gray-700 rounded-2xl transition-all group">
                  <div className="flex items-center space-x-3 text-left">
                    <div className="bg-gray-50 p-2 rounded-xl border border-gray-100"><Activity className="w-4 h-4 text-gray-400" /></div>
                    <span className="text-xs font-bold text-left">Refresh Statistik</span>
                  </div>
                </button>
              </div>
            </div>

            {/* SECURITY FEED */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm text-left">
              <h2 className="text-sm font-black text-gray-800 flex items-center justify-between mb-5 text-left">
                <span>Security Feed</span>
                <span className="px-2 py-1 bg-rose-50 text-rose-600 text-[8px] font-black rounded-md uppercase tracking-widest animate-pulse">Live</span>
              </h2>
              
              <div className="space-y-5 text-left">
                <div className="flex items-start space-x-3 text-left">
                  <div className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 flex-shrink-0 animate-ping"></div>
                  <div className="text-left">
                    <p className="text-[11px] text-gray-800 font-bold text-left">Radar Deteksi Aktif</p>
                    <p className="text-[10px] text-gray-400 mt-0.5 leading-relaxed text-left">Sistem memantau {stats.totalViolations} insiden keluar layar secara global.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 text-left">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0"></div>
                  <div className="text-left">
                    <p className="text-[11px] text-gray-800 font-bold text-left">Integritas Sinkron</p>
                    <p className="text-[10px] text-gray-400 mt-0.5 leading-relaxed text-left">Seluruh jawaban peserta terenkripsi dan aman di cloud.</p>
                  </div>
                </div>
              </div>

              <button className="w-full mt-6 py-3 text-[10px] font-black text-indigo-600 hover:bg-indigo-50/50 rounded-xl transition-all border border-transparent hover:border-indigo-100 uppercase tracking-widest">
                Detail Keamanan
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* --- MODAL TAMBAH SESI --- */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-xl rounded-[3rem] p-10 shadow-2xl relative animate-in zoom-in-95 duration-300 text-left">
              <div className="flex justify-between items-center mb-8">
                 <h2 className="text-xl font-black text-gray-800">Buka Sesi Ujian Baru</h2>
                 <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-all"><X size={24} /></button>
              </div>

              <div className="space-y-6 text-left">
                 <div className="space-y-2 text-left">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1 text-left">Judul Sesi</label>
                    <input type="text" value={newSession.title} onChange={(e) => setNewSession({...newSession, title: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-6 py-4 text-sm font-bold text-gray-700 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all" />
                 </div>
                 <div className="grid grid-cols-2 gap-4 text-left">
                    <div className="space-y-2 text-left">
                       <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1 text-left">Token Akses</label>
                       <input type="text" value={newSession.token} onChange={(e) => setNewSession({...newSession, token: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-6 py-4 text-sm font-bold text-gray-700 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all" />
                    </div>
                    <div className="space-y-2 text-left">
                       <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1 text-left">Durasi (Menit)</label>
                       <input type="number" value={newSession.duration_minutes} onChange={(e) => setNewSession({...newSession, duration_minutes: parseInt(e.target.value) || 0})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-6 py-4 text-sm font-bold text-gray-700 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all" />
                    </div>
                 </div>
                 <button onClick={handleAddSession} disabled={isSaving} className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3">
                    {isSaving ? <Loader2 className="animate-spin" /> : <><Save size={20} /> Bangun Sesi Sekarang</>}
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
