"use client";

import React, { useState, useEffect, useRef } from "react";
import * as htmlToImage from 'html-to-image';
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client"; 
import { 
  LayoutDashboard, Users, FileCheck, Settings, 
  ArrowUpRight, ArrowDownRight, Download, Calendar, 
  Bell, MoreHorizontal, Sparkles, Search, Filter, Printer, X, IdCard, Megaphone, Send, ArrowRight,
  CheckCircle2, AlertCircle, LogOut, Trash2, MapPin, School, Target, XCircle, Power, Shield, Clock, CalendarDays, FolderOpen, ShieldCheck, CheckCircle, Eye, FileText, ImageIcon, Camera, Trophy, Medal, GraduationCap, Building2, ClipboardCheck
} from "lucide-react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from "recharts";

export default function ModernHQDashboard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [realEntries, setRealEntries] = useState<any[]>([]);
  const [dynamicChartData, setDynamicChartData] = useState<any[]>([]);
  const [dynamicBarData, setDynamicBarData] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [timelineData, setTimelineData] = useState<any[]>([
    {
      category: "LKTI Nasional",
      waves: [
        { label: "Gelombang I", items: [
          { label: "Pendaftaran & Abstrak", date: "16 Juli – 3 September" },
          { label: "Pengumuman Tahap I", date: "10 September" },
          { label: "Pengumpulan Fullpaper", date: "12 – 18 September" },
          { label: "Pengumuman Tahap II", date: "26 September" }
        ]},
        { label: "Gelombang II", items: [
          { label: "Pendaftaran & Abstrak", date: "1 – 25 Oktober" },
          { label: "Pengumuman Tahap I", date: "31 Oktober" },
          { label: "Pengumpulan Fullpaper", date: "1 – 9 November" },
          { label: "Pengumuman Tahap II", date: "16 November" }
        ]}
      ]
    },
    {
      category: "Olimpiade MIPA",
      waves: [
        { label: "Gelombang I", items: [
          { label: "Pendaftaran", date: "16 Juli – 3 September" },
          { label: "Seleksi 1", date: "10 September" },
          { label: "Seleksi 2", date: "14 September" },
          { label: "Pengumuman Tahap I", date: "21 September" }
        ]},
        { label: "Gelombang II", items: [
          { label: "Pendaftaran", date: "1 – 25 Oktober" },
          { label: "Simulasi", date: "29 Oktober" },
          { label: "Seleksi", date: "2 November" },
          { label: "Pengumuman", date: "8 November" }
        ]}
      ]
    },
    {
      category: "Speech Contest",
      waves: [
        { label: "Gelombang I", items: [{ label: "Pendaftaran & Naskah", date: "16 Juli – 3 September" }, { label: "Pengumuman", date: "14 September" }] },
        { label: "Gelombang II", items: [{ label: "Pendaftaran & Naskah", date: "1 – 25 Oktober" }, { label: "Pengumuman", date: "14 November" }] }
      ]
    },
    {
      category: "MTQ",
      waves: [
        { label: "Gelombang I", items: [{ label: "Pendaftaran & Video", date: "16 Juli – 3 September" }, { label: "Pengumuman", date: "14 September" }] },
        { label: "Gelombang II", items: [{ label: "Pendaftaran", date: "1 – 25 Oktober" }, { label: "Pengumuman", date: "14 November" }] }
      ]
    }
  ]);
  const [isSavingTimeline, setIsSavingTimeline] = useState(false);
  const [filterCategory, setFilterCategory] = useState("LKTI Nasional");

  useEffect(() => {
    const fetchTimeline = async () => {
      const { data } = await supabase.from('announcements').select('*').eq('type', 'SYSTEM_TIMELINE').single();
      if (data) setTimelineData(JSON.parse(data.content));
    };
    fetchTimeline();
  }, []);

  const saveTimeline = async () => {
    setIsSavingTimeline(true);
    const { error } = await supabase.from('announcements').upsert({ 
      type: 'SYSTEM_TIMELINE', 
      content: JSON.stringify(timelineData),
      title: 'Master Schedule Config',
      updated_at: new Date()
    }, { onConflict: 'type' });
    if (!error) showToast('Jadwal berhasil diperbarui secara global!', 'success');
    setIsSavingTimeline(false);
  };

  const updateTimelineItem = (catName: string, waveLabel: string, itemLabel: string, newDate: string) => {
    const updatedData = timelineData.map(cat => {
      if (cat.category === catName) {
        return {
          ...cat,
          waves: cat.waves.map((wave: any) => {
            if (wave.label === waveLabel) {
              return {
                ...wave,
                items: wave.items.map((item: any) => {
                  if (item.label === itemLabel) return { ...item, date: newDate };
                  return item;
                })
              };
            }
            return wave;
          })
        };
      }
      return cat;
    });
    setTimelineData(updatedData);
  };
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [timeFilter, setTimeFilter] = useState("All"); // Opsi: 'Today', '7Days', '1Month', 'All'
  const [selectedParticipant, setSelectedParticipant] = useState<any | null>(null);
  const [selectedIdCard, setSelectedIdCard] = useState<any | null>(null);

  // --- MEMORI SIARAN KOMANDO ---
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastTarget, setBroadcastTarget] = useState("All");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);

  // --- MEMORI KENDALI PORTAL & GELOMBANG ---
  const updateTimelineItem = (catName: string, waveLabel: string, itemLabel: string, newDate: string) => {
    const updatedData = timelineData.map(cat => {
      if (cat.category === catName || cat.category.startsWith(catName)) {
        return {
          ...cat,
          waves: cat.waves.map((wave: any) => {
            if (wave.label === waveLabel) {
              return {
                ...wave,
                items: wave.items.map((item: any) => {
                  if (item.label === itemLabel) {
                    return { ...item, date: newDate };
                  }
                  return item;
                })
              };
            }
            return wave;
          })
  const [isPortalOpen, setIsPortalOpen] = useState(true);
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(true);
  
  const [submissionStatus, setSubmissionStatus] = useState([
    { id: 'mipa_g1', name: 'Olimpiade MIPA (Gel. I)', isOpen: false, openAt: "", closeAt: "", mode: "" },
    { id: 'mipa_g2', name: 'Olimpiade MIPA (Gel. II)', isOpen: false, openAt: "", closeAt: "", mode: "" },
    { id: 'speech_g1', name: 'Speech Contest (Gel. I)', isOpen: false, openAt: "", closeAt: "", mode: "" },
    { id: 'speech_g2', name: 'Speech Contest (Gel. II)', isOpen: false, openAt: "", closeAt: "", mode: "" },
    { id: 'lkti_g1', name: 'LKTI Nasional (Gel. I)', isOpen: true, openAt: "", closeAt: "", mode: "" },
    { id: 'lkti_g2', name: 'LKTI Nasional (Gel. II)', isOpen: false, openAt: "", closeAt: "", mode: "" },
    { id: 'mtq_g1', name: 'MTQ (Gel. I)', isOpen: false, openAt: "", closeAt: "", mode: "" },
    { id: 'mtq_g2', name: 'MTQ (Gel. II)', isOpen: false, openAt: "", closeAt: "", mode: "" },
  ]);

  const toggleSubmission = (id: string) => {
    setSubmissionStatus(prev => prev.map(item => 
      item.id === id ? { ...item, isOpen: !item.isOpen, mode: "Manual" } : item
    ));
  };

  const updateSchedule = (id: string, type: 'openAt' | 'closeAt' | 'mode', value: string) => {
    setSubmissionStatus(prev => prev.map(item => 
      item.id === id ? { ...item, [type]: value } : item
    ));
  };

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      let hasChanged = false;
      
      const newStatus = submissionStatus.map(item => {
        if (item.mode !== 'Auto') return item;
        let nextStatus = { ...item };
        let itemChanged = false;
        if (item.openAt && !item.isOpen) {
          const openDate = new Date(item.openAt);
          if (now >= openDate) {
            nextStatus.isOpen = true;
            itemChanged = true;
          }
        }
        if (item.closeAt && item.isOpen) {
          const closeDate = new Date(item.closeAt);
          if (now >= closeDate) {
            nextStatus.isOpen = false;
            itemChanged = true;
          }
        }
        if (itemChanged) hasChanged = true;
        return nextStatus;
      });

      if (hasChanged) {
        setSubmissionStatus(newStatus);
        showToast("Otomasi: Jadwal dieksekusi secara otomatis.", "success");
      }
    }, 10000); 

    return () => clearInterval(timer);
  }, [submissionStatus]);

  const [phaseStatus, setPhaseStatus] = useState([
    { id: 'tahap1', name: 'Tahap 1: Penyisihan', isOpen: true },
    { id: 'tahap2', name: 'Tahap 2: Semi Final', isOpen: false },
    { id: 'tahap3', name: 'Tahap 3: Grand Final', isOpen: false },
  ]);

  const [waves, setWaves] = useState([
    { id: 1, name: "Gelombang 1 (Early Bird)", status: "Aktif", startDate: "2026-07-16", endDate: "2026-09-03" },
    { id: 2, name: "Gelombang 2 (Regular)", status: "Segera", startDate: "2026-10-01", endDate: "2026-10-25" },
  ]);

  const toggleWaveStatus = (id: number) => {
    setWaves(prev => prev.map(w => 
      w.id === id 
        ? { ...w, status: w.status === 'Aktif' ? 'Tutup' : 'Aktif' } 
        : w
    ));
  };

  const [dashboardAssets, setDashboardAssets] = useState<any>({
    hero_banner: "",
    card_buku_panduan: "",
    card_twibbon: "",
    card_kontak: "",
    gallery_title: "Moments of Excellence",
    gallery_subtitle: "A glimpse into the spirit, competition, and victory at NCC.",
    gallery_images: []
  });

  const [isUploadingAsset, setIsUploadingAsset] = useState<string | null>(null);

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const syncToDatabase = async () => {
      const payload = { waves, submissionStatus, phaseStatus, dashboardAssets };
      await supabase
        .from('announcements')
        .update({ content: JSON.stringify(payload) })
        .eq('title', 'SYS_PORTAL_SETTINGS');
    };
    syncToDatabase();
  }, [waves, submissionStatus, phaseStatus, dashboardAssets]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const idCardRef = useRef<HTMLDivElement>(null);
  const [isDownloadingCard, setIsDownloadingCard] = useState(false);

  const handleDownloadCard = async () => {
    if (!idCardRef.current) return showToast('Sistem belum siap.', 'error');
    setIsDownloadingCard(true);
    try {
      const dataUrl = await htmlToImage.toPng(idCardRef.current, { quality: 1.0, pixelRatio: 2 });
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `ID_Card_NCC.png`;
      link.click();
    } catch (err) {
      showToast('Gagal mengunduh.', 'error');
    } finally {
      setIsDownloadingCard(false);
    }
  };

  const [deleteModal, setDeleteModal] = useState({ show: false, id: null, userId: null, name: "" });

  const [toast, setToast] = useState({ show: false, message: "", type: "success" as "success" | "error" });
  const [confirmModal, setConfirmModal] = useState({ show: false, title: "", message: "", onConfirm: () => {} });

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000); 
  };

  const handleUpdateStatus = async (id: string | number, newStatus: string, reason?: string) => {
    setConfirmModal({
      show: true,
      title: "Konfirmasi Perubahan Status",
      message: `Ubah status ke ${newStatus}?`,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, show: false }));
        const { error } = await supabase.from('competition_entries').update({ payment_status: newStatus }).eq('id', id);
        if (!error) {
            setRealEntries(prev => prev.map(e => e.id === id ? { ...e, payment_status: newStatus } : e));
            showToast("Status diperbarui", "success");
        }
      }
    });
  };

  const handleSendClick = () => {
    if (!broadcastTitle || !broadcastMessage) return showToast("Judul/Pesan kosong", "error");
    setConfirmModal({
      show: true,
      title: "Siaran Komando",
      message: "Lanjutkan pengumuman?",
      onConfirm: executeBroadcast
    });
  };

  const executeBroadcast = async () => {
    setConfirmModal(prev => ({ ...prev, show: false }));
    setIsSending(true);
    try {
      await supabase.from('announcements').insert([{ title: broadcastTitle, content: broadcastMessage, target_audience: broadcastTarget }]);
      showToast("Terkirim", "success");
      setBroadcastTitle("");
      setBroadcastMessage("");
    } catch (e) {
      showToast("Gagal kirim", "error");
    } finally {
      setIsSending(false);
    }
  };

  const handleUpdateStage = async (id: any, newStage: number) => {
    try {
      await supabase.from('competition_entries').update({ notes: JSON.stringify({ current_stage: newStage }) }).eq('id', id);
      setRealEntries(prev => prev.map(e => e.id === id ? { ...e, notes: JSON.stringify({ current_stage: newStage }) } : e));
      showToast("Tahap diperbarui", "success");
    } catch (e) {
      showToast("Gagal update", "error");
    }
  };

  useEffect(() => {
    const fetchRealData = async () => {
      const { data } = await supabase.from('competition_entries').select('*').order('created_at', { ascending: false });
      if (data) setRealEntries(data);
      setIsLoading(false);
    };
    fetchRealData();
    const channel = supabase.channel('realtime').on('postgres_changes', { event: '*', schema: 'public', table: 'competition_entries' }, fetchRealData).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (realEntries.length === 0) return;
    const now = new Date();
    let cutoff = new Date(0);
    if (timeFilter === "Today") cutoff = new Date(now.setHours(0, 0, 0, 0));
    else if (timeFilter === "7Days") cutoff = new Date(now.setDate(now.getDate() - 7));
    else if (timeFilter === "1Month") cutoff = new Date(now.setMonth(now.getMonth() - 1));

    const filtered = realEntries.filter(e => new Date(e.created_at) >= cutoff);
    const catMap: any = {};
    const dateMap: any = {};
    filtered.forEach(e => {
        const cat = e.competition_type || "Belum Pilih";
        catMap[cat] = (catMap[cat] || 0) + 1;
        const d = new Date(e.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
        dateMap[d] = (dateMap[d] || 0) + 1;
    });
    setDynamicBarData(Object.keys(catMap).map(n => ({ name: n, total: catMap[n] })));
    setDynamicChartData(Object.keys(dateMap).map(n => ({ name: n, pendaftar: dateMap[n] })));
  }, [realEntries, timeFilter]);

  const handleExportCSV = () => {
    const data = realEntries.filter(e => e.payment_status === 'Verified');
    const csv = ["ID,Nama,Email", ...data.map(e => `${e.id},${e.full_name},${e.email}`)].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "data.csv";
    a.click();
  };

  const StatCard = ({ title, value, trend, isUp }: any) => (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <p className="text-slate-400 text-xs font-bold uppercase">{title}</p>
        <h4 className="text-2xl font-black mt-2 text-slate-800">{value}</h4>
        <p className={`text-[10px] font-bold mt-1 ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>{trend}</p>
    </div>
  );

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">
      <aside className="w-72 bg-white/70 backdrop-blur-2xl border-r p-6 flex flex-col z-20">
        <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <ShieldCheck className="text-white" />
            </div>
            <h1 className="font-black text-xl">NCC HQ.</h1>
        </div>
        <nav className="flex-1 space-y-2">
          {["Dashboard", "Peserta", "Verifikasi", "Pengumuman", "Kegiatan", "Schedule", "Pengaturan"].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm ${activeTab === tab ? "bg-blue-600 text-white" : "text-slate-500"}`}>
              {tab}
            </button>
          ))}
        </nav>
        <button onClick={handleLogout} className="mt-auto flex items-center gap-2 text-red-500 font-bold p-4">
            <LogOut size={18} /> Keluar
        </button>
      </aside>

      <main className="flex-1 overflow-y-auto p-8">
        <header className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">{activeTab}</h2>
          <button onClick={handleExportCSV} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm">Export CSV</button>
        </header>

        {activeTab === "Dashboard" && (
           <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <StatCard title="Total Pendaftar" value={realEntries.length} trend="Live" isUp={true} />
              <StatCard title="Terverifikasi" value={realEntries.filter(e => e.payment_status === 'Verified').length} trend="Aman" isUp={true} />
              <StatCard title="Review" value={realEntries.filter(e => e.payment_status === 'Pending').length} trend="Action" isUp={false} />
              <StatCard title="Estimasi" value={`Rp ${(realEntries.length * 150000).toLocaleString()}`} trend="IDR" isUp={true} />
           </div>
        )}

        {activeTab === "Pengaturan" && (
                   </div>
                 </div>
                 <div className="w-full md:w-64">
                   <input 
                    type="text" 
                    defaultValue="18 November"
                    className="w-full bg-white/20 border border-white/30 rounded-2xl px-6 py-4 text-center font-black text-white placeholder:text-white/50 outline-none focus:bg-white/30 transition-all"
                   />
                 </div>
               </div>
            </div>
          </div>
        )}
        {/* ========================================================= */}
        {/* 🌟 TAB KEGIATAN (PUSAT KAWALAN PENDAFTARAN & FAIL) */}
        {/* ========================================================= */}
        {activeTab === "Kegiatan" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* 1. SUIS UTAMA PENDAFTARAN */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-sm border border-white/60 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-bl-full -z-10"></div>
              
              <div className="flex items-center gap-5">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all border shadow-lg ${isRegistrationOpen ? 'bg-emerald-100 text-emerald-600 border-emerald-200 shadow-emerald-100' : 'bg-rose-100 text-rose-600 border-rose-200 shadow-rose-100'}`}>
                  <Power size={28} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight">Gerbang Pendaftaran Utama</h3>
                  <p className="text-sm font-medium text-slate-500 mt-1">
                    Status semasa: <strong className={isRegistrationOpen ? 'text-emerald-500' : 'text-rose-500'}>
                      {isRegistrationOpen ? 'TERBUKA KEPADA UMUM' : 'DITUTUP SEMENTARA'}
                    </strong>
                  </p>
                </div>
              </div>
              
              {/* Suis (Toggle) Gaya Moden */}
              <button 
                onClick={() => {
                  setIsRegistrationOpen(!isRegistrationOpen);
                  showToast(isRegistrationOpen ? 'Pendaftaran utama ditutup.' : 'Pendaftaran utama dibuka!', isRegistrationOpen ? 'error' : 'success');
                }}
                className={`relative w-20 h-10 rounded-full transition-colors duration-300 focus:outline-none shadow-inner shrink-0 ${isRegistrationOpen ? 'bg-emerald-500' : 'bg-slate-300'}`}
              >
                <div className={`absolute top-1 left-1 bg-white w-8 h-8 rounded-full shadow-md transition-transform duration-300 flex items-center justify-center ${isRegistrationOpen ? 'translate-x-10' : 'translate-x-0'}`}>
                  {isRegistrationOpen ? <FileCheck size={14} className="text-emerald-500" /> : <X size={14} className="text-slate-400" />}
                </div>
              </button>
            </div>
            {/* 1.5 PENGATURAN GELOMBANG PENDAFTARAN */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-sm border border-white/60">
              <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-100">
                <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
                  <Calendar size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800">Gelombang Pendaftaran (Gelombang I & II)</h3>
                  <p className="text-xs text-slate-500 font-medium">Buka atau tutup gelombang pendaftaran peserta sesuai timeline kompetisi.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {waves.map((wave) => (
                  <div key={wave.id} className={`flex items-center justify-between p-6 rounded-2xl border-2 transition-all duration-300 ${wave.status === 'Aktif' ? 'border-blue-400 bg-blue-50/40 shadow-sm' : 'border-slate-100 bg-slate-50/50 hover:border-slate-200'}`}>
                    <div>
                      <h4 className="font-bold text-slate-800">{wave.name}</h4>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">{wave.startDate} s/d {wave.endDate}</p>
                      <div className="flex items-center gap-1.5 px-3 py-1 mt-2 bg-slate-50 border border-slate-100 rounded-lg w-fit">
                        <div className={`w-1.5 h-1.5 rounded-full ${wave.status === 'Aktif' ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></div>
                        <span className={`text-[10px] font-black ${wave.status === 'Aktif' ? 'text-green-600' : 'text-slate-500'}`}>
                          {wave.status === 'Aktif' ? 'Sedang Berjalan' : 'Ditutup'}
                        </span>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => {
                        toggleWaveStatus(wave.id);
                        showToast(`${wave.name} ${wave.status === 'Aktif' ? 'Ditutup' : 'Diaktifkan'}`, wave.status === 'Aktif' ? 'error' : 'success');
                      }}
                      className={`relative w-16 h-8 rounded-full transition-colors duration-300 focus:outline-none shadow-inner shrink-0 ${wave.status === 'Aktif' ? 'bg-blue-600' : 'bg-slate-300'}`}
                    >
                      <div className={`absolute top-1 left-1 bg-white w-6 h-6 rounded-full shadow-md transition-transform duration-300 flex items-center justify-center ${wave.status === 'Aktif' ? 'translate-x-8' : 'translate-x-0'}`}>
                        {wave.status === 'Aktif' ? <FileCheck size={12} className="text-blue-600" /> : <X size={12} className="text-slate-400" />}
                      </div>
                    </button>
                  </div>
                ))}
              </div>
            </div>
            {/* 2. KAWALAN PENGUMPULAN FAIL PER KATEGORI - GELOMBANG I */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-sm border border-white/60">
              <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-100">
                <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl">
                  <FolderOpen size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800">Akses Pengumpulan Fail Karya (Gelombang I)</h3>
                  <p className="text-xs text-slate-500 font-medium">Buka atau tutup portal pengumpulan karya Gelombang I.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {submissionStatus.filter(c => c.id.endsWith('_g1')).map((category) => (
                  <div key={category.id} className={`flex flex-col p-5 rounded-2xl border-2 transition-all duration-300 ${category.isOpen ? 'border-indigo-400 bg-indigo-50/40 shadow-sm' : 'border-slate-100 bg-slate-50/50 hover:border-slate-200'}`}>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-bold text-slate-800">{category.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <p className={`text-[10px] font-bold tracking-widest uppercase ${category.isOpen ? 'text-indigo-600' : 'text-slate-400'}`}>
                            {category.isOpen ? '● Portal Terbuka' : '○ Portal Ditutup'}
                          </p>
                          {category.mode ? (
                            <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase ${category.mode === 'Auto' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                              {category.mode}
                            </span>
                          ) : (
                            <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase bg-amber-100 text-amber-600 animate-pulse">
                              Pilih Mode Control
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                          <button 
                            onClick={() => updateSchedule(category.id, 'mode', 'Manual')}
                            className={`text-[8px] px-2 py-1 rounded-md font-bold transition-all ${category.mode === 'Manual' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                          >
                            MANUAL
                          </button>
                          <button 
                            onClick={() => updateSchedule(category.id, 'mode', 'Auto')}
                            className={`text-[8px] px-2 py-1 rounded-md font-bold transition-all ${category.mode === 'Auto' ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                          >
                            AUTO
                          </button>
                        </div>
                        <button 
                          disabled={!category.mode}
                          onClick={() => {
                            toggleSubmission(category.id);
                            showToast(`${category.name} ${!category.isOpen ? 'Portal Dibuka' : 'Portal Ditutup'}`, !category.isOpen ? 'success' : 'error');
                          }}
                          className={`relative w-10 h-5 rounded-full transition-all duration-300 focus:outline-none shadow-inner shrink-0 ${!category.mode ? 'opacity-20 cursor-not-allowed' : category.isOpen ? 'bg-indigo-500' : 'bg-slate-300'}`}
                        >
                          <div className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full shadow-md transition-transform duration-300 flex items-center justify-center ${category.isOpen ? 'translate-x-5' : 'translate-x-0'}`}>
                            {category.isOpen ? <FileCheck size={8} className="text-indigo-600" /> : <X size={8} className="text-slate-400" />}
                          </div>
                        </button>
                      </div>
                    </div>

                    <div className={`grid grid-cols-2 gap-3 pt-3 border-t border-slate-200/50 transition-opacity ${(!category.mode || category.mode === 'Manual') ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1">
                          <Calendar size={10} /> Auto-Open
                        </label>
                        <input 
                          type="datetime-local" 
                          className="w-full text-[10px] p-1.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-400 font-medium text-slate-600"
                          value={category.openAt || ""}
                          onChange={(e) => updateSchedule(category.id, 'openAt', e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1">
                          <Clock size={10} /> Auto-Close
                        </label>
                        <input 
                          type="datetime-local" 
                          className="w-full text-[10px] p-1.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-400 font-medium text-slate-600"
                          value={category.closeAt || ""}
                          onChange={(e) => updateSchedule(category.id, 'closeAt', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2.5 KAWALAN PENGUMPULAN FAIL PER KATEGORI - GELOMBANG II */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-sm border border-white/60">
              <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-100">
                <div className="p-2.5 bg-violet-100 text-violet-600 rounded-xl">
                  <FolderOpen size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800">Akses Pengumpulan Fail Karya (Gelombang II)</h3>
                  <p className="text-xs text-slate-500 font-medium">Buka atau tutup portal pengumpulan karya Gelombang II.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {submissionStatus.filter(c => c.id.endsWith('_g2')).map((category) => (
                  <div key={category.id} className={`flex flex-col p-5 rounded-2xl border-2 transition-all duration-300 ${category.isOpen ? 'border-violet-400 bg-violet-50/40 shadow-sm' : 'border-slate-100 bg-slate-50/50 hover:border-slate-200'}`}>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-bold text-slate-800">{category.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <p className={`text-[10px] font-bold tracking-widest uppercase ${category.isOpen ? 'text-violet-600' : 'text-slate-400'}`}>
                            {category.isOpen ? '● Portal Terbuka' : '○ Portal Ditutup'}
                          </p>
                          {category.mode ? (
                            <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase ${category.mode === 'Auto' ? 'bg-violet-100 text-violet-600' : 'bg-slate-100 text-slate-500'}`}>
                              {category.mode}
                            </span>
                          ) : (
                            <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase bg-amber-100 text-amber-600 animate-pulse">
                              Pilih Mode Control
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                          <button 
                            onClick={() => updateSchedule(category.id, 'mode', 'Manual')}
                            className={`text-[8px] px-2 py-1 rounded-md font-bold transition-all ${category.mode === 'Manual' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                          >
                            MANUAL
                          </button>
                          <button 
                            onClick={() => updateSchedule(category.id, 'mode', 'Auto')}
                            className={`text-[8px] px-2 py-1 rounded-md font-bold transition-all ${category.mode === 'Auto' ? 'bg-violet-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                          >
                            AUTO
                          </button>
                        </div>
                        <button 
                          disabled={!category.mode}
                          onClick={() => {
                            toggleSubmission(category.id);
                            showToast(`${category.name} ${!category.isOpen ? 'Portal Dibuka' : 'Portal Ditutup'}`, !category.isOpen ? 'success' : 'error');
                          }}
                          className={`relative w-10 h-5 rounded-full transition-all duration-300 focus:outline-none shadow-inner shrink-0 ${!category.mode ? 'opacity-20 cursor-not-allowed' : category.isOpen ? 'bg-violet-500' : 'bg-slate-300'}`}
                        >
                          <div className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full shadow-md transition-transform duration-300 flex items-center justify-center ${category.isOpen ? 'translate-x-5' : 'translate-x-0'}`}>
                            {category.isOpen ? <FileCheck size={8} className="text-violet-600" /> : <X size={8} className="text-slate-400" />}
                          </div>
                        </button>
                      </div>
                    </div>

                    <div className={`grid grid-cols-2 gap-3 pt-3 border-t border-slate-200/50 transition-opacity ${(!category.mode || category.mode === 'Manual') ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1">
                          <Calendar size={10} /> Auto-Open
                        </label>
                        <input 
                          type="datetime-local" 
                          className="w-full text-[10px] p-1.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-violet-400 font-medium text-slate-600"
                          value={category.openAt || ""}
                          onChange={(e) => updateSchedule(category.id, 'openAt', e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1">
                          <Clock size={10} /> Auto-Close
                        </label>
                        <input 
                          type="datetime-local" 
                          className="w-full text-[10px] p-1.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-violet-400 font-medium text-slate-600"
                          value={category.closeAt || ""}
                          onChange={(e) => updateSchedule(category.id, 'closeAt', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. KAWALAN PENGUMPULAN FAIL PER TAHAP */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-sm border border-white/60">
              <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-100">
                <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800">Akses Pengumpulan Fail Per Tahap</h3>
                  <p className="text-xs text-slate-500 font-medium">Atur pembukaan akses upload karya berdasarkan urutan tahap kompetisi (Tahap 1 - Tahap 3).</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {phaseStatus.map((phase) => (
                  <div key={phase.id} className={`flex flex-col justify-between p-6 rounded-2xl border-2 transition-all duration-300 ${phase.isOpen ? 'border-blue-400 bg-blue-50/40 shadow-sm' : 'border-slate-100 bg-slate-50/50 hover:border-slate-200'}`}>
                    <div className="mb-4">
                      <h4 className="font-bold text-slate-800">{phase.name}</h4>
                      <p className={`text-[10px] font-bold tracking-widest uppercase mt-1 ${phase.isOpen ? 'text-blue-600' : 'text-slate-400'}`}>
                        {phase.isOpen ? '● Tahap Aktif' : '○ Tahap Terkunci'}
                      </p>
                    </div>
                    
                    <button 
                      onClick={() => {
                        togglePhase(phase.id);
                        showToast(`${phase.name} ${!phase.isOpen ? 'Akses Dibuka' : 'Akses Ditutup'}`, !phase.isOpen ? 'success' : 'error');
                      }}
                      className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-2 ${phase.isOpen ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200'}`}
                    >
                      {phase.isOpen ? <><X size={14}/> Tutup Tahap</> : <><FileCheck size={14}/> Buka Tahap</>}
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
          </div>
        )}

        {/* 🎛️ KONTEN TAB: MEDIA (KUSTOMISASI ASET VISUAL) */}
        {activeTab === "Media" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* 1. MANAJEMEN ASET DASHBOARD */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-sm border border-white/60 mb-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-purple-100 text-purple-600 rounded-xl">
                  <ImageIcon size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800">Manajemen Aset Dashboard</h3>
                  <p className="text-sm text-slate-500 mt-1">Kustomisasi gambar dan ikon pada dashboard peserta.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { id: 'hero_banner', label: 'Banner Dashboard' },
                  { id: 'card_buku_panduan', label: 'Ikon Buku Panduan' },
                  { id: 'card_twibbon', label: 'Ikon Twibbon' },
                  { id: 'card_kontak', label: 'Ikon Kontak' },
                ].map((asset) => (
                  <div key={asset.id} className="bg-white border border-slate-100 rounded-2xl p-4 flex flex-col items-center gap-4 group transition-all hover:border-purple-200">
                    <div className="relative w-full aspect-video bg-slate-50 rounded-xl overflow-hidden border border-dashed border-slate-200 flex items-center justify-center">
                      {dashboardAssets[asset.id] ? (
                        <>
                          <img src={dashboardAssets[asset.id]} alt={asset.label} className="w-full h-full object-cover" />
                          <button 
                            onClick={() => {
                              setDashboardAssets((prev: any) => ({ ...prev, [asset.id]: "" }));
                              showToast(`${asset.label} telah dihapus.`, "error");
                            }}
                            className="absolute top-2 right-2 p-1.5 bg-rose-500/80 hover:bg-rose-600 text-white rounded-lg backdrop-blur-sm transition-all"
                            title="Hapus Gambar"
                          >
                            <Trash2 size={12} />
                          </button>
                        </>
                      ) : (
                        <div className="text-slate-300 flex flex-col items-center gap-1">
                          <ImageIcon size={32} />
                          <span className="text-[10px] font-bold uppercase">Belum Ada</span>
                        </div>
                      )}
                      {isUploadingAsset === asset.id && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                          <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                    </div>
                    
                    <div className="w-full">
                      <p className="text-xs font-bold text-slate-700 mb-2">{asset.label}</p>
                      <label className="block w-full cursor-pointer">
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => handleAssetUpload(e, asset.id)}
                          disabled={!!isUploadingAsset}
                        />
                        <div className="w-full py-2 bg-purple-50 text-purple-600 hover:bg-purple-600 hover:text-white rounded-xl text-[10px] font-black text-center transition-all uppercase tracking-wider">
                          {dashboardAssets[asset.id] ? "Ganti Gambar" : "Upload Gambar"}
                        </div>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. MANAJEMEN GALERI BERANDA */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-sm border border-white/60">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 border-b border-slate-100 pb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl">
                    <Camera size={20} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800">Manajemen Galeri Beranda</h3>
                    <p className="text-sm text-slate-500 mt-1">Konfigurasi teks dan foto pada section Galeri.</p>
                  </div>
                </div>
                <label className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer">
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => handleAssetUpload(e, 'gallery_add')}
                    disabled={!!isUploadingAsset}
                  />
                  {isUploadingAsset === 'gallery_add' ? (
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>+</>
                  )}
                  Tambah Foto Galeri
                </label>
              </div>

              {/* Edit Title & Subtitle */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Judul Utama Galeri</label>
                  <input 
                    type="text"
                    value={dashboardAssets.gallery_title || ""}
                    onChange={(e) => setDashboardAssets((prev: any) => ({ ...prev, gallery_title: e.target.value }))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Contoh: Moments of Excellence"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Subjudul / Deskripsi</label>
                  <textarea 
                    value={dashboardAssets.gallery_subtitle || ""}
                    onChange={(e) => setDashboardAssets((prev: any) => ({ ...prev, gallery_subtitle: e.target.value }))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium text-slate-500 focus:ring-2 focus:ring-indigo-500 outline-none h-[42px] resize-none"
                    placeholder="Masukkan deskripsi singkat galeri..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {(dashboardAssets.gallery_images || []).length === 0 ? (
                  <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
                    <ImageIcon size={40} className="mb-2 opacity-20" />
                    <p className="text-xs font-bold uppercase tracking-widest">Belum ada foto galeri</p>
                  </div>
                ) : (
                  dashboardAssets.gallery_images.map((item: any, idx: number) => (
                    <div key={idx} className="bg-white border border-slate-100 rounded-2xl overflow-hidden group shadow-sm hover:border-indigo-200 transition-all flex flex-col">
                      <div className="relative aspect-video">
                        <img src={typeof item === 'string' ? item : item.url} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => {
                              const newGallery = [...dashboardAssets.gallery_images];
                              newGallery.splice(idx, 1);
                              setDashboardAssets((prev: any) => ({ ...prev, gallery_images: newGallery }));
                              showToast("Foto galeri dihapus.", "error");
                            }}
                            className="p-1.5 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors shadow-lg"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <div className="p-4 space-y-3">
                         <div className="space-y-1">
                           <label className="text-[9px] font-bold text-slate-400 uppercase">Kategori</label>
                           <select 
                              value={item.category || "GALLERY"}
                              onChange={(e) => {
                                const newGallery = [...dashboardAssets.gallery_images];
                                const current = typeof item === 'string' ? { url: item, category: "GALLERY", label: "" } : item;
                                newGallery[idx] = { ...current, category: e.target.value };
                                setDashboardAssets((prev: any) => ({ ...prev, gallery_images: newGallery }));
                              }}
                              className="w-full text-[11px] font-bold bg-slate-50 border-none rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                           >
                             {["GALLERY", "ACADEMIC", "SPEECH", "ARTS"].map(cat => <option key={cat} value={cat}>{cat}</option>)}
                           </select>
                         </div>
                         <div className="space-y-1">
                           <label className="text-[9px] font-bold text-slate-400 uppercase">Label / Judul Foto</label>
                           <input 
                              type="text"
                              value={item.label || ""}
                              onChange={(e) => {
                                const newGallery = [...dashboardAssets.gallery_images];
                                const current = typeof item === 'string' ? { url: item, category: "GALLERY", label: "" } : item;
                                newGallery[idx] = { ...current, label: e.target.value };
                                setDashboardAssets((prev: any) => ({ ...prev, gallery_images: newGallery }));
                              }}
                              className="w-full text-[11px] font-medium bg-slate-50 border-none rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                              placeholder="Label foto..."
                           />
                         </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}


        {/* ================= PANEL 1: SLIDE-OUT DETAIL PESERTA ================= */}
        {selectedParticipant && (
          <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/20 backdrop-blur-sm transition-all duration-300">
            {/* Area kosong untuk klik tutup */}
            <div className="flex-1" onClick={() => setSelectedParticipant(null)}></div>
            
            <div className="w-full max-w-md bg-white/80 backdrop-blur-2xl h-full shadow-2xl border-l border-white/60 p-8 flex flex-col overflow-y-auto animate-in slide-in-from-right duration-300">
              <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-200/50">
                 <h2 className="text-xl font-bold text-slate-800">Detail Administrasi</h2>
                 <button onClick={() => setSelectedParticipant(null)} className="p-2 bg-white/50 hover:bg-slate-100 rounded-full border border-slate-200/50 transition-colors"><X size={20}/></button>
              </div>
              
               {(() => {
                 let photoUrl = "";
                 if (selectedParticipant.notes) {
                   try {
                     const pObj = JSON.parse(selectedParticipant.notes);
                     photoUrl = pObj.profile_photo_url;
                   } catch (e) {}
                 }
                 
                 if (photoUrl) {
                   return (
                     <img 
                       src={photoUrl} 
                       alt="Profile Avatar" 
                       className="w-24 h-24 rounded-full object-cover shadow-lg mb-6 border-4 border-white shrink-0" 
                     />
                   );
                 }
                 
                 return (
                   <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-4xl font-black shadow-lg mb-6 border-4 border-white shrink-0">
                     {(selectedParticipant.full_name || "U").charAt(0)}
                   </div>
                 );
               })()}
              <h3 className="text-2xl font-bold text-slate-800 mb-1">{selectedParticipant.full_name || "Nama tidak tersedia"}</h3>
              <p className="text-slate-500 font-medium mb-6">{selectedParticipant.competition_type || selectedParticipant.category || "Belum ada kategori"}</p>

              <div className="space-y-4">
                <div className="p-4 bg-white/60 border border-slate-100 rounded-xl shadow-sm">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nomor Induk Siswa (NISN)</p>
                  <p className="font-semibold text-slate-800">{selectedParticipant.nisn || "Data Kosong"}</p>
                </div>

                {/* Tambahan Data Anggota 2 jika kategori Tim */}
                {(selectedParticipant.competition_type === "LKTI Nasional" || selectedParticipant.competition_type === "Olimpiade MIPA") && (
                  <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl shadow-sm space-y-3">
                    <p className="text-[11px] font-bold text-blue-400 uppercase tracking-wider mb-1">Informasi Anggota Tim</p>
                    <div>
                      <p className="text-[10px] text-slate-400 font-medium">Nama Anggota</p>
                      <p className="font-semibold text-slate-800">{selectedParticipant.participant2_name || "Belum diisi"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-medium">NISN Anggota</p>
                      <p className="font-semibold text-slate-800">{selectedParticipant.participant2_nisn || "Belum diisi"}</p>
                    </div>
                  </div>
                )}
                <div className="p-4 bg-white/60 border border-slate-100 rounded-xl shadow-sm">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Informasi Kontak</p>
                  <p className="font-semibold text-slate-800 mb-1">{selectedParticipant.email || "Email tidak ada"}</p>
                  <p className="font-semibold text-slate-800">{selectedParticipant.whatsapp_number || selectedParticipant.phone || "No. HP tidak ada"}</p>
                </div>
                <div className="p-4 bg-white/60 border border-slate-100 rounded-xl shadow-sm">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Institusi / Sekolah</p>
                  <p className="font-semibold text-slate-800 mb-1">{selectedParticipant.school_name || selectedParticipant.school || "Data Kosong"}</p>
                  <p className="text-sm text-slate-600 flex items-center gap-1.5">
                    <MapPin size={13} className="text-slate-400 shrink-0" />
                    {selectedParticipant.province || selectedParticipant.city || "Provinsi tidak dicantumkan"}
                  </p>
                </div>

                {/* SECTION BARU: KONTROL TAHAP KOMPETISI */}
                <div className="mt-4 pt-4 border-t border-slate-200/50">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg">
                      <Target size={14} />
                    </div>
                    <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Kontrol Tahap Kompetisi</h4>
                  </div>
                  
                  <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between px-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Status:</span>
                        {(() => {
                          let stage = 1;
                          if (selectedParticipant.notes) {
                            try {
                              const n = JSON.parse(selectedParticipant.notes);
                              if (n.current_stage) stage = n.current_stage;
                            } catch (e) {}
                          }

                          if (stage === 1) return <span className="text-[10px] font-black text-slate-400 uppercase">Penyisihan (1)</span>;
                          if (stage === 2) return <span className="text-[10px] font-black text-blue-600 uppercase">Semi Final (2)</span>;
                          if (stage === 3) return <span className="text-[10px] font-black text-amber-600 uppercase">Final (3)</span>;
                          return null;
                        })()}
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleUpdateStage(selectedParticipant.id, 1); }}
                          className={`py-2.5 rounded-xl text-[9px] font-black transition-all border flex flex-col items-center justify-center gap-1 ${ (() => {
                            let s = 1;
                            if (selectedParticipant.notes) { try { s = JSON.parse(selectedParticipant.notes).current_stage || 1; } catch (e) {} }
                            return s === 1;
                          })() ? 'bg-white border-slate-200 text-slate-300 shadow-inner' : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300' }`}
                        >
                          <Clock size={12} />
                          SET T1
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleUpdateStage(selectedParticipant.id, 2); }}
                          className={`py-2.5 rounded-xl text-[9px] font-black transition-all border flex flex-col items-center justify-center gap-1 ${ (() => {
                            let s = 1;
                            if (selectedParticipant.notes) { try { s = JSON.parse(selectedParticipant.notes).current_stage || 1; } catch (e) {} }
                            return s === 2;
                          })() ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white border-slate-100 text-blue-600 hover:border-blue-200' }`}
                        >
                          <Medal size={12} />
                          LOLOS T2
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleUpdateStage(selectedParticipant.id, 3); }}
                          className={`py-2.5 rounded-xl text-[9px] font-black transition-all border flex flex-col items-center justify-center gap-1 ${ (() => {
                            let s = 1;
                            if (selectedParticipant.notes) { try { s = JSON.parse(selectedParticipant.notes).current_stage || 1; } catch (e) {} }
                            return s === 3;
                          })() ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-200' : 'bg-white border-slate-100 text-amber-600 hover:border-amber-200' }`}
                        >
                          <Trophy size={12} />
                          FINAL
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {(() => {
                  let adminNotes: any = {};
                  if (selectedParticipant.notes) {
                    try { adminNotes = JSON.parse(selectedParticipant.notes); } catch (e) {}
                  }
                  
                  return (adminNotes.profile_photo_url || adminNotes.student_card_url) && (
                      <div className="p-4 bg-white/60 border border-slate-100 rounded-xl shadow-sm space-y-3">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                          <FolderOpen size={12} className="text-indigo-500" /> Berkas Pendukung Peserta
                        </p>
                        
                        {adminNotes.profile_photo_url && (
                          <div className="flex items-center justify-between py-2 border-b border-slate-100/60 text-sm">
                            <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                              <ImageIcon size={13} className="text-blue-500" /> Foto Formal
                            </span>
                            <a 
                              href={adminNotes.profile_photo_url} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="text-xs font-bold text-indigo-600 hover:underline bg-indigo-50 px-2.5 py-1 rounded-lg"
                            >
                              Buka
                            </a>
                          </div>
                        )}
  
                        {adminNotes.student_card_url && (
                          <div className="flex items-center justify-between py-2 text-sm">
                            <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                              <IdCard size={13} className="text-amber-500" /> Kartu Pelajar
                            </span>
                            <a 
                              href={adminNotes.student_card_url} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="text-xs font-bold text-indigo-600 hover:underline bg-indigo-50 px-2.5 py-1 rounded-lg"
                            >
                              Buka
                            </a>
                          </div>
                        )}
                      </div>
                  )
                })()}
              </div>
            </div>
          </div>
        )}

        {/* ================= PANEL 2: MODAL GENERATOR ID CARD ================= */}
        {selectedIdCard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md transition-all">
            <div className="w-full max-w-sm bg-white/90 backdrop-blur-xl rounded-3xl border border-white/60 p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
               <button onClick={() => setSelectedIdCard(null)} className="absolute top-4 right-4 p-2 bg-black/5 hover:bg-black/10 rounded-full transition-colors z-10"><X size={16} className="text-slate-600"/></button>
               
               {/* Area foto — wrapper dengan padding agar border-radius tidak terpotong */}
               <div className="p-2">
                 <div 
                   ref={idCardRef} 
                   className="print-area rounded-2xl overflow-hidden"
                   style={{ width: '320px', backgroundColor: '#1e3a8a' }}
                 >
                   <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-6 pb-4 text-center relative">
                     <div className="text-white/80 text-[10px] font-black uppercase tracking-[0.2em] mb-6">ID Card Peserta</div>
                   
                     <div className="w-20 h-20 bg-white/20 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl font-bold border border-white/40 shadow-lg text-white">
                       {(selectedIdCard.full_name || "U").charAt(0)}
                     </div>
                     <h3 className="text-xl font-bold mb-1 text-white">{selectedIdCard.full_name}</h3>
                     <p className="text-blue-200 text-xs mb-6 font-medium">{selectedIdCard.school_name || selectedIdCard.school}</p>
                   
                     <div className="bg-white/10 rounded-xl py-3 border border-white/20 mb-3">
                       <span className="text-[10px] text-blue-200 block uppercase font-bold tracking-widest mb-0.5">Kategori</span>
                       <span className="font-bold text-white text-sm">{selectedIdCard.competition_type || selectedIdCard.category}</span>
                     </div>
                   
                     <div className="inline-block px-4 py-1.5 bg-black/20 rounded-full border border-white/10 text-xs text-white font-mono mt-2 mb-2">
                       ID: NCC-{selectedIdCard.id}
                     </div>
                   </div>
                 </div>
               </div>
               
               {/* Tombol Aksi — DI LUAR ref agar tidak ikut terfoto */}
               <div className="flex gap-2 mt-4">
                 <button 
                   onClick={handleDownloadCard}
                   disabled={isDownloadingCard}
                   className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-200 active:scale-95 text-sm"
                 >
                   {isDownloadingCard ? (
                     <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div> Memproses...</>
                   ) : (
                     <><Download size={16} /> Unduh PNG</>
                   )}
                 </button>
                 <button
                   onClick={handlePrintCard}
                   className="px-4 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
                   title="Cetak"
                 >
                   <Printer size={18} />
                 </button>
               </div>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================= */}
      {/* 🌟 SISTEM NOTIFIKASI TOAST (MENGAMBANG DI POJOK KANAN ATAS) */}
      {/* ========================================================= */}
      <div className={`fixed top-8 right-8 z-[100] transition-all duration-500 transform ${toast.show ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0 pointer-events-none'}`}>
        <div className="bg-white/80 backdrop-blur-2xl border border-white/60 shadow-2xl rounded-2xl p-4 flex items-center gap-3">
          {toast.type === 'success' ? (
            <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center"><CheckCircle2 size={18} /></div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center"><AlertCircle size={18} /></div>
          )}
          <div>
            <p className="font-bold text-slate-800 text-sm">{toast.type === 'success' ? 'Berhasil' : 'Peringatan'}</p>
            <p className="text-xs text-slate-500 font-medium">{toast.message}</p>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 🌟 MODAL KONFIRMASI LIQUID GLASS (MENGGANTIKAN window.confirm) */}
      {/* ========================================================= */}
      <div className={`fixed inset-0 z-[90] flex items-center justify-center p-4 transition-all duration-300 ${confirmModal.show ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {/* Latar Belakang Gelap */}
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}></div>
        
        {/* Kotak Modal */}
        <div className={`bg-white/90 backdrop-blur-3xl border border-white/60 shadow-2xl rounded-[2rem] p-8 max-w-md w-full relative transition-all duration-500 transform ${confirmModal.show ? 'scale-100 translate-y-0' : 'scale-95 translate-y-8'}`}>
          <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-[1.5rem] flex items-center justify-center mb-6 shadow-inner mx-auto border border-blue-100/50">
            <Megaphone size={36} />
          </div>
          <h3 className="text-2xl font-black text-slate-800 text-center mb-2 tracking-tight">{confirmModal.title}</h3>
          <p className="text-slate-500 text-center mb-8 text-sm leading-relaxed">{confirmModal.message}</p>
          
          <div className="flex gap-4">
            <button 
              onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))} 
              className="flex-1 py-4 rounded-2xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Batalkan
            </button>
            <button 
              onClick={confirmModal.onConfirm} 
              className="flex-1 py-4 rounded-2xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95"
            >
              Eksekusi
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 🚨 MODAL KONFIRMASI DELETE (PEMUSNAH) */}
      {/* ========================================================= */}
      <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300 ${deleteModal.show ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setDeleteModal({ ...deleteModal, show: false })}></div>
        
        <div className={`bg-white backdrop-blur-3xl border border-red-100 shadow-2xl rounded-[2rem] p-8 max-w-md w-full relative transition-all duration-500 transform ${deleteModal.show ? 'scale-100 translate-y-0' : 'scale-95 translate-y-8'}`}>
          <div className="w-20 h-20 bg-red-50 text-red-600 rounded-[1.5rem] flex items-center justify-center mb-6 shadow-inner mx-auto border border-red-100/50">
            <Trash2 size={36} />
          </div>
          <h3 className="text-2xl font-black text-slate-800 text-center mb-2 tracking-tight">Hapus Peserta?</h3>
          <p className="text-slate-500 text-center mb-8 text-sm leading-relaxed">
            Anda yakin ingin menghapus data pendaftaran atas nama <strong className="text-slate-800">{deleteModal.name}</strong>? Tindakan ini akan menghapus data dari sistem secara permanen.
          </p>
          
          <div className="flex gap-4">
            <button 
              onClick={() => setDeleteModal({ ...deleteModal, show: false })} 
              className="flex-1 py-4 rounded-2xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Batal
            </button>
            <button 
              onClick={executeDelete} 
              className="flex-1 py-4 rounded-2xl font-bold text-white bg-red-600 hover:bg-red-700 transition-all shadow-lg shadow-red-200 active:scale-95"
            >
              Ya, Hapus Permanen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function NavItem({ icon, text, active = false, badge, onClick }: { icon: React.ReactNode, text: string, active?: boolean, badge?: string, onClick?: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={`flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-all font-medium text-sm
      ${active ? 'bg-blue-50 text-blue-700 font-bold shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}
    `}>
      <div className="flex items-center gap-3">
        {icon}
        <span className="tracking-tight">{text}</span>
      </div>
      {badge && badge !== "0" && (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${active ? 'bg-blue-200 text-blue-800' : 'bg-red-100 text-red-600'}`}>
          {badge}
        </span>
      )}
    </div>
  );
}

function StatCard({ title, value, trend, isUp }: { title: string, value: string, trend: string, isUp: boolean }) {
  return (
    <div className="bg-white/50 backdrop-blur-xl backdrop-saturate-150 p-6 rounded-2xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between hover:bg-white/70 transition-all">
      <h4 className="text-slate-500 font-medium text-sm mb-4">{title}</h4>
      <div className="flex items-end justify-between">
        <h2 className="text-3xl font-bold text-slate-800 tracking-tight">{value}</h2>
        <span className={`flex items-center text-xs font-bold px-2 py-1 rounded-md border
          ${isUp ? 'text-green-700 bg-green-500/10 border-green-500/20' : 'text-red-700 bg-red-500/10 border-red-500/20'}
        `}>
          {isUp ? <ArrowUpRight size={14} className="mr-1"/> : <ArrowDownRight size={14} className="mr-1"/>}
          {trend}
        </span>
      </div>
    </div>
  );
}
