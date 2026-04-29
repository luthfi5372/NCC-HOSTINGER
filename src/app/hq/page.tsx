"use client";

import React, { useState, useEffect, useRef } from "react";
import * as htmlToImage from 'html-to-image';
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client"; 
import { 
  LayoutDashboard, Users, FileCheck, Settings, 
  ArrowUpRight, ArrowDownRight, Download, Calendar, 
  Bell, MoreHorizontal, Sparkles, Search, Filter, Printer, X, IdCard, Megaphone, Send, ArrowRight,
  CheckCircle2, AlertCircle, LogOut, Trash2, MapPin, School, Target, XCircle, Power, Shield, Clock, CalendarDays, FolderOpen, ShieldCheck, CheckCircle, Eye, FileText
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
  const [activeTab, setActiveTab] = useState("Dashboard");
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
  const [isPortalOpen, setIsPortalOpen] = useState(true);
  // --- MEMORI KAWALAN KEGIATAN & PORTAL ---
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(true);
  
  const [submissionStatus, setSubmissionStatus] = useState([
    { id: 'mipa', name: 'Olimpiade MIPA', isOpen: false },
    { id: 'speech', name: 'Speech Contest', isOpen: false },
    { id: 'lkti', name: 'LKTI Nasional', isOpen: true },
    { id: 'mtq', name: 'MTQ', isOpen: false },
  ]);

  const toggleSubmission = (id: string) => {
    setSubmissionStatus(prev => prev.map(item => 
      item.id === id ? { ...item, isOpen: !item.isOpen } : item
    ));
  };

  const [phaseStatus, setPhaseStatus] = useState([
    { id: 'tahap1', name: 'Tahap 1: Penyisihan', isOpen: true },
    { id: 'tahap2', name: 'Tahap 2: Semi Final', isOpen: false },
    { id: 'tahap3', name: 'Tahap 3: Grand Final', isOpen: false },
  ]);

  const togglePhase = (id: string) => {
    setPhaseStatus(prev => prev.map(item => 
      item.id === id ? { ...item, isOpen: !item.isOpen } : item
    ));
  };

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

  const supabase = createClient();

  // --- 🚪 FUNGSI PINTU EVAKUASI ---
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  // --- 📸 REFERENSI AREA FOTO ID CARD (ADMIN) ---
  const idCardRef = useRef<HTMLDivElement>(null);
  const [isDownloadingCard, setIsDownloadingCard] = useState(false);

  // --- FUNGSI UNDUH ID CARD PNG (html-to-image — RINGAN & ANTI-GAGAL) ---
  const handleDownloadCard = async () => {
    if (!idCardRef.current) {
      return showToast('Sistem belum siap, coba sebentar lagi.', 'error');
    }
    setIsDownloadingCard(true);
    try {
      const dataUrl = await htmlToImage.toPng(idCardRef.current, {
        quality: 1.0,
        pixelRatio: 2,
      });
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `ID_Card_NCC_${selectedIdCard?.full_name?.replace(/\s+/g, '_') || 'Peserta'}.png`;
      link.click();
      showToast('ID Card berhasil diunduh sebagai PNG!', 'success');
    } catch (err) {
      console.error('Detail Error:', err);
      showToast('Gagal mengunduh. Coba lagi.', 'error');
    } finally {
      setIsDownloadingCard(false);
    }
  };

  // --- 🗑️ FUNGSI PEMUSNAH ABSOLUT ---
  const executeDelete = async () => {
    // Pastikan kita memiliki ID otentikasi (userId)
    if (!deleteModal.userId) {
      return showToast("⚠️ Gagal: ID KTP Digital (User ID) tidak ditemukan!", "error");
    }
    
    try {
      // PANGGIL FUNGSI RPC, BUKAN .delete()
      const { error } = await supabase.rpc('delete_participant_completely', {
        target_user_id: deleteModal.userId
      });

      if (error) throw error;

      // Bersihkan dari layar Markas Besar
      setRealEntries(realEntries.filter((e: any) => e.id !== deleteModal.id));
      showToast(`Peserta ${deleteModal.name} berhasil dihapus permanen dari sistem!`, "success");
      
    } catch (error: any) {
      showToast(`Gagal menghapus: ${error.message}`, "error");
    } finally {
      setDeleteModal({ show: false, id: null, userId: null, name: "" }); 
    }
  };

  // --- MEMORI SISTEM NOTIFIKASI KUSTOM ---
  const [toast, setToast] = useState({ show: false, message: "", type: "success" as "success" | "error" });
  const [confirmModal, setConfirmModal] = useState({ show: false, title: "", message: "", onConfirm: () => {} });

  // --- MEMORI MODAL DELETE (UPGRADED) ---
  const [deleteModal, setDeleteModal] = useState({ show: false, id: null, userId: null, name: "" });

  // Fungsi pemanggil Toast
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000); 
  };

  // --- MESIN EKSEKUTOR STATUS ---
  const handleUpdateStatus = async (id: string | number, newStatus: string) => {
    setConfirmModal({
      show: true,
      title: "Konfirmasi Perubahan Status",
      message: `Apakah Anda yakin ingin mengubah status pendaftar ini menjadi ${newStatus}?`,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, show: false }));
        try {
          const { error } = await supabase
            .from('competition_entries')
            .update({ payment_status: newStatus })
            .eq('id', id);

          if (error) throw error;

          setRealEntries(prevEntries => 
            prevEntries.map(entry => 
              entry.id === id ? { ...entry, payment_status: newStatus } : entry
            )
          );

          showToast(`Komando berhasil! Status telah menjadi ${newStatus}.`, "success");
        } catch (error: any) {
          showToast(`Misi Gagal: ${error.message}`, "error");
        }
      }
    });
  };

  // --- MESIN EKSEKUTOR SIARAN ---
  const handleSendClick = () => {
    if (!broadcastTitle || !broadcastMessage) {
      return showToast("Judul dan isi pesan tidak boleh kosong, Komandan!", "error");
    }

    if (broadcastTarget === "specific" && (selectedUserIds || []).length === 0) {
      return showToast("Pilih minimal satu peserta untuk pengumuman spesifik ini!", "error");
    }

    setConfirmModal({
      show: true,
      title: "Konfirmasi Siaran Komando",
      message: `Pesan "${broadcastTitle}" akan segera ditembakkan ke target sasaran. Tindakan ini tidak dapat dibatalkan. Lanjutkan?`,
      onConfirm: executeBroadcast
    });
  };

  const executeBroadcast = async () => {
    setConfirmModal(prev => ({ ...prev, show: false }));
    setIsSending(true);
    try {
      const { error } = await supabase
        .from('announcements')
        .insert([
          {
            title: broadcastTitle,
            content: broadcastMessage,
            target_audience: broadcastTarget,
            target_user_ids: broadcastTarget === 'specific' ? selectedUserIds : []
          }
        ]);

      if (error) throw error;

      showToast("Pengumuman resmi berhasil mengudara ke peserta!", "success");
      setBroadcastTitle("");
      setBroadcastMessage("");
      setSelectedUserIds([]);
    } catch (error: any) {
      showToast(`Gagal menyiarkan: ${error.message}`, "error");
    } finally {
      setIsSending(false);
    }
  };

  // --- MESIN PENGUMPUL DATA & RADAR REAL-TIME ---
  useEffect(() => {
    // Fungsi penarik data utama
    const fetchRealData = async () => {
      try {
        const { data, error } = await supabase
          .from('competition_entries')
          .select('*')
          .neq('email', 'admin1@ncc.id') 
          .order('created_at', { ascending: false });

        if (error) {
          console.error("Gagal menarik data:", error);
        } else {
          setRealEntries(data || []);
        }
      } catch (err) {
        console.error("Error eksekusi:", err);
      } finally {
        setIsLoading(false);
      }
    };

    // 1. Tarik data saat Markas Besar pertama kali dibuka
    fetchRealData();

    // 2. 📡 AKTIFKAN SENSOR RADAR (Supabase WebSockets)
    const radarSubscription = supabase
      .channel('pantau_pendaftaran_ncc') // Nama saluran bebas
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'competition_entries' }, // Pantau SEMUA perubahan di tabel ini
        (payload) => {
          // 🚨 JIKA ADA PERGERAKAN (Daftar baru, update foto, ubah status)
          console.log("Radar mendeteksi pergerakan data!", payload);
          
          // Perintahkan sistem untuk menarik ulang data secara rahasia di latar belakang
          fetchRealData(); 
        }
      )
      .subscribe();

    // 3. Matikan radar secara otomatis jika Presiden menutup halaman
    return () => {
      supabase.removeChannel(radarSubscription);
    };
  }, []);

  // --- MESIN PENGOLAH DATA GRAFIK REAL-TIME (DENGAN FILTER WAKTU) ---
  useEffect(() => {
    if (realEntries.length === 0) return;

    // 1. Hitung batas waktu (Cutoff Date) berdasarkan filter yang aktif
    const now = new Date();
    let cutoffDate = new Date(0); // Default 'All' (dari awal waktu)

    if (timeFilter === "Today") {
      cutoffDate = new Date(now.setHours(0, 0, 0, 0)); // Hari ini mulai jam 00:00
    } else if (timeFilter === "7Days") {
      cutoffDate = new Date(now.setDate(now.getDate() - 7)); // 7 Hari ke belakang
    } else if (timeFilter === "1Month") {
      cutoffDate = new Date(now.setMonth(now.getMonth() - 1)); // 1 Bulan ke belakang
    }

    // 2. Saring data mentah berdasarkan waktu terlebih dahulu
    const filteredEntries = realEntries.filter(entry => {
      const entryDate = entry.created_at ? new Date(entry.created_at) : new Date();
      return entryDate >= cutoffDate;
    });

    const categoryMap: Record<string, number> = {};
    const dateMap: Record<string, { name: string, pendaftar: number, timestamp: number }> = {};

    // 3. Olah data yang sudah disaring
    filteredEntries.forEach(entry => {
      // Rekap Data Kategori (Bar Chart)
      const category = entry.competition_type || entry.category || "Belum Pilih";
      categoryMap[category] = (categoryMap[category] || 0) + 1;

      // Rekap Data Tanggal (Line Chart)
      if (entry.created_at) {
        const date = new Date(entry.created_at);
        const dateStr = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }); 
        const timeKey = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

        if (!dateMap[timeKey]) {
          dateMap[timeKey] = { name: dateStr, pendaftar: 0, timestamp: timeKey };
        }
        dateMap[timeKey].pendaftar += 1;
      }
    });

    // 4. Ubah format untuk grafik
    const finalBarData = Object.keys(categoryMap).map(key => ({ name: key, total: categoryMap[key] }));
    const finalLineData = Object.values(dateMap)
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(item => ({ name: item.name, pendaftar: item.pendaftar }));

    setDynamicBarData(finalBarData);
    setDynamicChartData(finalLineData);
  }, [realEntries, timeFilter]);

  // --- 📥 FITUR 1: MESIN EKSPOR CSV CERDAS ---
  const handleExportCSV = () => {
    // 1. Tentukan data mana yang mau di-ekspor (hanya yang Terverifikasi)
    const dataToExport = realEntries.filter(e => e.payment_status === 'Verified');
    
    if (dataToExport.length === 0) return alert("Tidak ada data peserta terverifikasi untuk di-ekspor.");

    // 2. Tentukan Header Kolom
    const headers = ["ID Tiket", "Nama Lengkap", "Email", "NISN", "Sekolah", "Provinsi", "Kategori", "Pembina", "Waktu Daftar"];
    
    // 3. Susun Baris Data
    const rows = dataToExport.map(e => [
      `NCC-${e.id}`,
      e.full_name || "-",
      e.email || "-",
      e.nisn || "-",
      e.school_name || e.school || "-",
      e.province || e.city || "-",
      e.competition_type || e.category || "-",
      e.mentor_name || "-",
      new Date(e.created_at).toLocaleString('id-ID')
    ]);

    // 4. Gabungkan menjadi format CSV
    const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
    
    // 5. Trigger Download otomatis
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Data_Peserta_NCC13_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- 🖨️ FITUR 2: MESIN CETAK FISIK ---
  const handlePrintCard = () => {
    window.print(); // Cara termudah & paling stabil untuk browser
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden relative">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { 
            position: absolute; 
            left: 50%; 
            top: 40%; 
            transform: translate(-50%, -50%) scale(1.8); 
            width: 320px !important;
          }
        }
      `}</style>
      {/* Ornamen Latar Belakang - Optimized */}
      <div className="absolute top-[-5%] left-[-5%] w-64 h-64 bg-blue-400/10 rounded-full blur-2xl pointer-events-none"></div>
      <div className="absolute bottom-[-5%] right-[-2%] w-64 h-64 bg-indigo-400/10 rounded-full blur-2xl pointer-events-none"></div>
      
      {/* ========================================================= */}
      {/* 🌟 SIDEBAR NAVIGASI (LIQUID GLASS) */}
      {/* ========================================================= */}
      <aside className="w-72 bg-white/70 backdrop-blur-2xl border-r border-white/60 flex flex-col z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-all duration-500">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
              <ShieldCheck size={22} className="text-white" />
            </div>
            <div>
              <h1 className="font-black text-xl text-slate-800 tracking-tight">NCC HQ.</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Command Center</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {[
            { id: "Dashboard", icon: <LayoutDashboard size={18} />, label: "Dashboard" },
            { id: "Peserta", icon: <Users size={18} />, label: "Buku Peserta", count: realEntries.filter((e: any) => e.payment_status === 'Verified' || e.payment_status === 'success').length },
            { id: "Verifikasi", icon: <CheckCircle size={18} />, label: "Verifikasi Berkas", count: realEntries.filter((e: any) => e.payment_status === 'Pending').length },
            { id: "Pengumuman", icon: <Megaphone size={18} />, label: "Siaran Info" },
            { id: "Kegiatan", icon: <CalendarDays size={18} />, label: "Kegiatan" },
            { id: "Pengaturan", icon: <Settings size={18} />, label: "Pengaturan" }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-300 font-bold text-sm ${
                activeTab === item.id 
                  ? "bg-blue-600 text-white shadow-md shadow-blue-200 scale-[1.02]" 
                  : "text-slate-500 hover:bg-white hover:text-blue-600 hover:shadow-sm"
              }`}
            >
              <div className="flex items-center gap-3">
                {item.icon} {item.label}
              </div>
              {item.count !== undefined && item.count > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === item.id ? "bg-white/20 text-white" : "bg-red-100 text-red-600 animate-pulse"}`}>
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-6 mt-auto">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-red-50/50 text-red-500 hover:bg-red-100 hover:text-red-600 rounded-2xl transition-all font-bold text-sm">
            <LogOut size={18} /> Keluar Sesi
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8 relative">
        
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{activeTab}</h1>
            <p className="text-slate-500 text-sm mt-1">
              {activeTab === "Dashboard" && "Pantau pergerakan data pendaftaran NCC 13th."}
              {activeTab === "Peserta" && "Manajemen seluruh data peserta kompetisi."}
              {activeTab === "Verifikasi" && "Pusat verifikasi pembayaran dan dokumen."}
              {activeTab === "Kegiatan" && "Kawal gerbang pendaftaran dan fail karya."}
              {activeTab === "Pengaturan" && "Konfigurasi sistem Markas Besar."}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 shadow-sm cursor-pointer hover:bg-slate-50">
              <Calendar size={16} className="text-slate-400" />
              April 2026
            </div>
            <button 
              onClick={handleExportCSV}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md shadow-blue-200"
            >
              <Download size={18} />
              Export CSV
            </button>
            <div className="h-10 w-10 bg-white/50 backdrop-blur-md border border-white/60 rounded-full flex items-center justify-center text-slate-600 shadow-sm ml-2 relative">
              <Bell size={18} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </div>
          </div>
        </header>

        {/* 🎛️ KONTEN TAB: DASHBOARD */}
        {activeTab === "Dashboard" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total Pendaftar" value={realEntries.length.toString()} trend="Live" isUp={true} />
          <StatCard title="Terverifikasi" value={realEntries.filter(e => e.payment_status === 'Verified').length.toString()} trend="Aman" isUp={true} />
          <StatCard title="Menunggu Review" value={realEntries.filter(e => e.payment_status === 'Pending').length.toString()} trend="Action Needed" isUp={false} />
          <StatCard title="Estimasi Dana" value={`Rp ${(realEntries.length * 150000).toLocaleString('id-ID')}`} trend="IDR" isUp={true} />
        </div>

        {/* 🔥 PANEL KENDALI MESIN WAKTU */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 animate-in fade-in slide-in-from-left duration-700">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Analisis Tren Pendaftaran</h3>
            <p className="text-sm text-slate-500">Visualisasi pergerakan data berdasarkan periode waktu.</p>
          </div>
          
          <div className="bg-white/90 backdrop-blur-md border border-white/60 p-1.5 rounded-xl flex flex-wrap gap-1 shadow-[0_4px_20px_rgb(0,0,0,0.03)] text-xs font-bold w-full sm:w-auto">
            <button 
              onClick={() => setTimeFilter('Today')} 
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg transition-all ${timeFilter === 'Today' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-white/80 hover:text-slate-700'}`}
            >
              Hari Ini
            </button>
            <button 
              onClick={() => setTimeFilter('7Days')} 
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg transition-all ${timeFilter === '7Days' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-white/80 hover:text-slate-700'}`}
            >
              7 Hari
            </button>
            <button 
              onClick={() => setTimeFilter('1Month')} 
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg transition-all ${timeFilter === '1Month' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-white/80 hover:text-slate-700'}`}
            >
              1 Bulan
            </button>
            <button 
              onClick={() => setTimeFilter('All')} 
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg transition-all ${timeFilter === 'All' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-white/80 hover:text-slate-700'}`}
            >
              Keseluruhan
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/90 backdrop-blur-md backdrop-saturate-150 p-6 rounded-2xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] col-span-2">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-bold text-slate-800">Tren Pendaftaran Harian</h3>
                <p className="text-xs text-slate-500">Data visualisasi</p>
              </div>
              <MoreHorizontal size={20} className="text-slate-400 cursor-pointer" />
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dynamicChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12}} dx={-10} />
                  <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  <Line type="monotone" dataKey="pendaftar" stroke="#2563EB" strokeWidth={3} dot={{r: 4, fill: '#2563EB', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-md backdrop-saturate-150 p-6 rounded-2xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
             <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-800">Peminat Kategori</h3>
              <MoreHorizontal size={20} className="text-slate-400" />
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dynamicBarData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12}} dy={10} />
                  <Tooltip cursor={{fill: '#F1F5F9'}} contentStyle={{borderRadius: '12px', border: 'none'}} />
                  <Bar dataKey="total" fill="#3B82F6" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
          </>
        )}

        {/* 🎛️ KONTEN TAB: PESERTA (BUKU INDUK + LIVE SEARCH) */}
        {activeTab === "Peserta" && (
          <div className="bg-white/90 backdrop-blur-md backdrop-saturate-150 rounded-2xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-6 border-b border-slate-100">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-bold text-slate-800">Buku Induk Peserta Resmi</h3>
                  <p className="text-xs text-slate-500 mt-1">Database lengkap peserta terverifikasi NCC 13th.</p>
                </div>
                <span className="bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-xs font-bold border border-blue-200 shadow-sm">
                  Total Tiket Aktif: {realEntries.filter(e => e.payment_status === 'Verified').length}
                </span>
              </div>

              {/* 🔍 BARIS MESIN PENCARI & FILTER */}
              <div className="flex flex-col md:flex-row gap-4 items-center">
                {/* Kolom Pencarian */}
                <div className="relative flex-1 w-full">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={16} className="text-slate-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Cari nama, email, atau ID tiket (misal: NCC-15)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-slate-700"
                  />
                </div>
                
                {/* Dropdown Kategori Lomba */}
                <div className="relative w-full md:w-64">
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full pl-4 pr-10 py-2.5 bg-white/90 backdrop-blur-md border border-white/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 appearance-none text-slate-700 font-medium shadow-sm"
                  >
                    <option value="All">Semua Kategori</option>
                    <option value="Olimpiade MIPA">Olimpiade MIPA</option>
                    <option value="Speech Contest">Speech Contest</option>
                    <option value="LKTI Nasional">LKTI Nasional</option>
                    <option value="MTQ Nasional">MTQ Nasional</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Filter size={14} className="text-slate-400" />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 whitespace-nowrap">
                <thead className="bg-slate-50/50 text-slate-500 font-bold border-b border-slate-100 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-4 px-6">ID TIKET</th>
                    <th className="py-4 px-6">PROFIL PESERTA</th>
                    <th className="py-4 px-6">ASAL SEKOLAH</th>
                    <th className="py-4 px-6">KATEGORI & PEMBINA</th>
                    <th className="py-4 px-6">WAKTU DAFTAR</th>
                    <th className="py-4 px-6">STATUS</th>
                    <th className="py-4 px-6 text-center">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {realEntries
                    .filter(e => e.payment_status === 'Verified')
                    .filter(e => {
                      if (!searchQuery) return true;
                      const query = searchQuery.toLowerCase();
                      return (e.full_name || "").toLowerCase().includes(query) || 
                             (e.email || "").toLowerCase().includes(query) || 
                             `ncc-${e.id}`.toLowerCase().includes(query);
                    })
                    .filter(e => filterCategory === "All" || (e.competition_type || e.category) === filterCategory)
                    .length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                          Tidak ada peserta yang cocok dengan radar pencarian Anda.
                        </td>
                      </tr>
                    ) : (
                    realEntries
                      .filter(e => e.payment_status === 'Verified')
                      .filter(e => {
                        if (!searchQuery) return true;
                        const query = searchQuery.toLowerCase();
                        return (e.full_name || "").toLowerCase().includes(query) || 
                               (e.email || "").toLowerCase().includes(query) || 
                               `ncc-${e.id}`.toLowerCase().includes(query);
                      })
                      .filter(e => filterCategory === "All" || (e.competition_type || e.category) === filterCategory)
                      .map((entry: any, idx: number) => {
                      
                      const dateObj = entry.created_at ? new Date(entry.created_at) : new Date();
                      const dateStr = dateObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
                      const timeStr = dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

                      return (
                        <tr 
                          key={idx} 
                          onClick={() => setSelectedParticipant(entry)}
                          className="hover:bg-blue-50/50 transition-colors cursor-pointer"
                        >
                          <td className="py-4 px-6 font-black text-blue-600">NCC-{entry.id}</td>
                          <td className="py-4 px-6 flex items-center gap-3">
                             <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center font-bold text-blue-600 text-sm uppercase shrink-0">
                               {(entry.full_name || entry.email || "U").charAt(0)}
                             </div>
                             <div>
                               <div className="font-bold text-slate-800">{entry.full_name || "Peserta Anonim"}</div>
                               <div className="text-[11px] text-slate-500 mt-0.5">
                                 {entry.email || "Email tidak ada"} <span className="mx-1 text-slate-300">|</span> NISN: <span className="font-medium text-slate-600">{entry.nisn || "-"}</span>
                               </div>
                             </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="font-bold text-slate-700">{entry.school_name || entry.school || "Belum Diisi"}</div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                               <MapPin size={11} className="shrink-0" /> {entry.province || entry.city || "Provinsi belum diisi"}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className="bg-slate-100/80 text-slate-700 px-2.5 py-1 rounded-md text-[11px] font-bold border border-slate-200/60">
                              {entry.competition_type || entry.category || "Belum Pilih"}
                            </span>
                            <div className="text-[11px] text-slate-500 mt-1.5">
                              Pembina: <span className="font-medium text-slate-700">{entry.mentor_name || "-"}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="font-medium text-slate-800">{dateStr}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5">⏰ Pukul {timeStr}</div>
                          </td>
                          <td className="py-4 px-6">
                            <span className="px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center w-max gap-1.5 border bg-green-500/10 text-green-700 border-green-500/20 shadow-sm">
                              <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                              Active
                            </span>
                          </td>
                          {/* KOLOM AKSI BARU */}
                          <td className="py-4 px-6 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedIdCard(entry);
                                }}
                                className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-all shadow-sm border border-blue-100"
                                title="Cetak ID Card"
                              >
                                <IdCard size={18} />
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteModal({ show: true, id: entry.id, userId: entry.user_id, name: entry.full_name });
                                }}
                                title="Hapus Data Peserta Permanen"
                                className="text-red-500 hover:text-red-700 p-2 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-100"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "Verifikasi" && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Header Antrean */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                  <FileCheck size={20} className="text-blue-600" />
                  Antrean Verifikasi Pembayaran
                </h3>
                <p className="text-slate-500 text-sm mt-0.5">Tinjau dan setujui setiap pendaftaran masuk.</p>
              </div>
              <span className="text-xs font-bold px-4 py-2 bg-amber-100 text-amber-700 rounded-full shadow-sm border border-amber-200">
                {realEntries.filter(e => e.payment_status === 'Pending').length} Menunggu
              </span>
            </div>

            {/* Card List */}
            {realEntries.filter(e => !e.payment_status || e.payment_status === 'Pending').length === 0 ? (
              <div className="bg-white/60 backdrop-blur-md border border-white/60 rounded-3xl p-16 text-center shadow-sm">
                <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={40} />
                </div>
                <h3 className="text-xl font-bold text-slate-800">Antrean Bersih!</h3>
                <p className="text-slate-500 mt-2 text-sm">Semua pendaftaran telah diverifikasi. Markas Besar aman.</p>
              </div>
            ) : (
              realEntries
                .filter(e => !e.payment_status || e.payment_status === 'Pending')
                .map((entry: any) => (
                <div
                  key={entry.id}
                  className="group bg-white/80 backdrop-blur-md border border-slate-100 hover:border-blue-200 rounded-3xl p-5 md:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(37,99,235,0.10)] transition-all duration-300 ease-out hover:-translate-y-1 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
                >
                  {/* Identitas Pendaftar */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600 rounded-2xl flex items-center justify-center font-black text-xl shrink-0 border border-white shadow-sm">
                      {(entry.full_name || entry.email || "U").charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-800 text-base leading-tight truncate">{entry.full_name || "Peserta Anonim"}</h4>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">NCC-{String(entry.id).substring(0,6).toUpperCase()}</span>
                        <span className="text-xs text-slate-500 truncate max-w-[180px]">{entry.email}</span>
                      </div>
                      {entry.school_name && (
                        <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                          <School size={11} className="shrink-0" /> {entry.school_name}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Badge Cabang Lomba */}
                  <div className="shrink-0">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-xl text-xs font-bold">
                      {entry.competition_type || entry.category || "General"}
                    </span>
                    {entry.team_name && (
                      <p className="text-[10px] font-bold text-slate-400 mt-1.5 uppercase tracking-wider">
                        Tim: <span className="text-slate-600">{entry.team_name}</span>
                      </p>
                    )}
                  </div>

                  {/* Smart Action Group */}
                  <div className="flex items-center gap-2 shrink-0 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                    {/* Lihat Bukti TF */}
                    {entry.payment_proof_url ? (
                      <a
                        href={entry.payment_proof_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white text-slate-600 hover:text-blue-600 border border-slate-200 hover:border-blue-300 hover:bg-blue-50 rounded-xl font-bold text-xs transition-all shadow-sm hover:shadow-md"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                        Bukti TF
                      </a>
                    ) : (
                      <span className="px-3.5 py-2.5 text-slate-300 text-xs font-bold">Tidak ada</span>
                    )}

                    {/* Tombol Terima */}
                    <button
                      onClick={() => handleUpdateStatus(entry.id, 'Verified')}
                      className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-emerald-400 to-green-500 text-white rounded-xl font-bold text-xs transition-all shadow-sm hover:shadow-emerald-200/60 hover:scale-105 active:scale-95"
                    >
                      <CheckCircle2 size={14} /> Terima
                    </button>

                    {/* Tombol Tolak */}
                    <button
                      onClick={() => handleUpdateStatus(entry.id, 'Rejected')}
                      className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-rose-400 to-red-500 text-white rounded-xl font-bold text-xs transition-all shadow-sm hover:shadow-rose-200/60 hover:scale-105 active:scale-95"
                    >
                      <AlertCircle size={14} /> Tolak
                    </button>

                    {/* Divider */}
                    <div className="w-px h-8 bg-slate-200 mx-0.5"></div>

                    {/* Tombol Hapus (minimalis) */}
                    <button
                      onClick={() => setDeleteModal({ show: true, id: entry.id, userId: entry.user_id, name: entry.full_name })}
                      title="Hapus Data Peserta Permanen"
                      className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}


        {/* 🎛️ KONTEN TAB: PENGUMUMAN (BROADCAST CENTER) */}
        {activeTab === "Pengumuman" && (
          <div className="bg-white/90 backdrop-blur-md border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl p-8 md:p-12 min-h-[500px]">
            <div className="max-w-3xl mx-auto">
              
              {/* Header Ruangan */}
              <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-200/50">
                <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner">
                  <Megaphone size={28} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Pusat Siaran Komando</h2>
                  <p className="text-slate-500 text-sm mt-1">Transmisikan pemberitahuan ke seluruh atau sebagian peserta.</p>
                </div>
              </div>

              {/* Form Pengumuman */}
              <div className="space-y-6 bg-white/60 p-6 rounded-2xl border border-slate-100 shadow-sm">
                
                {/* Opsi Target & Radar */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Target Penerima</label>
                    <select 
                      value={broadcastTarget}
                      onChange={(e) => {
                        setBroadcastTarget(e.target.value);
                        if (e.target.value !== 'specific') setSelectedUserIds([]); 
                      }}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-medium text-slate-700 shadow-sm"
                    >
                      <option value="All">Semua Peserta (Massal)</option>
                      <option value="Verified">Hanya Peserta Lolos (Verified)</option>
                      <option value="Pending">Hanya Peserta Belum Lolos (Pending)</option>
                      <option value="specific">Peserta Tertentu (Pilih Manual)</option>
                    </select>
                  </div>

                  {/* Panel Centang Nama (ANTI-CRASH VERSION) */}
                  {broadcastTarget === 'specific' && (
                    <div className="mt-2 border border-blue-200 bg-blue-50/50 rounded-xl p-4">
                      <div className="flex justify-between items-center mb-3">
                        <label className="text-xs font-bold text-blue-800 uppercase tracking-wider">
                          Pilih Sasaran ({(selectedUserIds || []).length} Terpilih)
                        </label>
                        <button 
                          onClick={() => {
                            const entries = realEntries || [];
                            if ((selectedUserIds || []).length === entries.length && entries.length > 0) {
                              setSelectedUserIds([]); // Hapus Semua
                            } else {
                              setSelectedUserIds(entries.map((e: any) => e.user_id).filter((id: any) => id)); // Pilih Semua
                            }
                          }}
                          className="text-[10px] bg-blue-100 text-blue-700 font-bold px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                        >
                          Pilih Semua / Hapus
                        </button>
                      </div>

                      <div className="max-h-48 overflow-y-auto space-y-1.5 pr-2 custom-scrollbar">
                        {(!realEntries || realEntries.length === 0) ? (
                          <p className="text-xs text-slate-500 text-center py-4">Belum ada data peserta di sistem.</p>
                        ) : (
                          realEntries.map((entry: any, idx: number) => {
                            // Gunakan OR fallback agar aman dari undefined
                            const currentSelected = selectedUserIds || [];
                            const isChecked = currentSelected.includes(entry.user_id);
                            
                            return (
                              <label key={entry.id || idx} className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-all ${isChecked ? 'bg-blue-100/50 border-blue-300' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                                <input 
                                  type="checkbox" 
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedUserIds([...currentSelected, entry.user_id]);
                                    } else {
                                      setSelectedUserIds(currentSelected.filter((id: any) => id !== entry.user_id));
                                    }
                                  }}
                                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                                />
                                <div className="flex flex-col">
                                  <span className="text-sm font-bold text-slate-800">{entry.full_name || entry.email || "Peserta Anonim"}</span>
                                  <span className="text-[10px] text-slate-500 font-medium">NCC-{entry.id || "-"} • {entry.competition_type || entry.category || "Belum Pilih"}</span>
                                </div>
                              </label>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Judul Pesan */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Subjek / Judul Pengumuman</label>
                  <input 
                    type="text" 
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    placeholder="Contoh: Perbaikan Bukti Transfer" 
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-medium text-slate-800 placeholder:text-slate-400 shadow-sm"
                  />
                </div>

                {/* Isi Pesan */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Isi Pesan Siaran</label>
                  <textarea 
                    rows={5}
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    placeholder="Ketik instruksi atau pengumuman Anda di sini..." 
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-700 placeholder:text-slate-400 leading-relaxed shadow-sm"
                  ></textarea>
                </div>

                {/* Tombol Eksekusi */}
                <button 
                  onClick={handleSendClick}
                  disabled={isSending}
                  className={`w-full mt-4 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-slate-900/20 active:scale-[0.99]
                    ${isSending ? 'bg-slate-500 cursor-not-allowed' : 'bg-slate-900 hover:bg-slate-800'}
                  `}
                >
                  <Send size={18} className={isSending ? 'animate-pulse' : ''} /> 
                  {isSending ? 'Menyiarkan Pesan...' : 'Siarkan Pesan Sekarang'}
                </button>

              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 🌟 TAB PENGATURAN — PUSAT KENDALI PORTAL & GELOMBANG */}
        {/* ========================================================= */}
        {activeTab === "Pengaturan" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* 1. SAKLAR UTAMA PORTAL */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-sm border border-white/60">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                    isPortalOpen 
                      ? 'bg-emerald-100 text-emerald-600 shadow-lg shadow-emerald-100' 
                      : 'bg-rose-100 text-rose-600 shadow-lg shadow-rose-100'
                  }`}>
                    <Power size={28} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800">Gerbang Pendaftaran</h3>
                    <p className="text-sm font-medium text-slate-500 mt-1">
                      Status saat ini:{" "}
                      <strong className={`${
                        isPortalOpen ? 'text-emerald-500' : 'text-rose-500'
                      }`}>
                        {isPortalOpen ? '✔ TERBUKA UNTUK PUBLIK' : '✖ DITUTUP SEMENTARA'}
                      </strong>
                    </p>
                  </div>
                </div>
                
                {/* Toggle Switch Modern */}
                <button 
                  onClick={() => {
                    setIsPortalOpen(!isPortalOpen);
                    showToast(
                      isPortalOpen ? 'Portal pendaftaran DITUTUP.' : 'Portal pendaftaran DIBUKA kembali!', 
                      isPortalOpen ? 'error' : 'success'
                    );
                  }}
                  className={`relative w-20 h-10 rounded-full transition-colors duration-300 focus:outline-none shadow-inner shrink-0 ${
                    isPortalOpen ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}
                >
                  <div className={`absolute top-1 left-1 bg-white w-8 h-8 rounded-full shadow-md transition-transform duration-300 flex items-center justify-center ${
                    isPortalOpen ? 'translate-x-10' : 'translate-x-0'
                  }`}>
                    {isPortalOpen 
                      ? <CheckCircle2 size={16} className="text-emerald-500" /> 
                      : <XCircle size={16} className="text-slate-400" />
                    }
                  </div>
                </button>
              </div>

              {/* Peringatan saat ditutup */}
              {!isPortalOpen && (
                <div className="mt-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3">
                  <AlertCircle size={18} className="text-rose-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-rose-700">
                    <strong>Perhatian:</strong> Peserta baru tidak dapat mendaftar saat portal ditutup. 
                    Peserta yang sudah mendaftar tetap bisa login dan melihat status mereka.
                  </p>
                </div>
              )}
            </div>

            {/* 2. MANAJEMEN GELOMBANG */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-sm border border-white/60">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                  <h3 className="text-xl font-black text-slate-800">Manajemen Gelombang</h3>
                  <p className="text-sm text-slate-500 mt-1">Atur jadwal pendaftaran per gelombang.</p>
                </div>
                <button 
                  onClick={() => {
                    const newId = waves.length + 1;
                    setWaves([...waves, {
                      id: newId,
                      name: `Gelombang ${newId}`,
                      status: 'Tutup',
                      startDate: '',
                      endDate: '',
                    }]);
                    showToast(`Gelombang ${newId} berhasil ditambahkan.`, 'success');
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all active:scale-95 flex items-center gap-2 shrink-0"
                >
                  + Tambah Gelombang
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {waves.map((wave) => (
                  <div 
                    key={wave.id} 
                    className={`border-2 rounded-2xl p-6 transition-all duration-300 ${
                      wave.status === 'Aktif' 
                        ? 'border-blue-400 bg-blue-50/40 shadow-md shadow-blue-50' 
                        : 'border-slate-100 bg-slate-50/50 hover:border-slate-200'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-bold text-lg text-slate-800">{wave.name}</h4>
                      <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${
                        wave.status === 'Aktif' 
                          ? 'bg-emerald-100 text-emerald-600' 
                          : 'bg-slate-200 text-slate-500'
                      }`}>
                        {wave.status === 'Aktif' ? '● Live' : '○ Tutup'}
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Tanggal Mulai</label>
                        <input 
                          type="date" 
                          value={wave.startDate}
                          onChange={(e) => setWaves(prev => prev.map(w => w.id === wave.id ? {...w, startDate: e.target.value} : w))}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all" 
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Tanggal Selesai</label>
                        <input 
                          type="date" 
                          value={wave.endDate}
                          onChange={(e) => setWaves(prev => prev.map(w => w.id === wave.id ? {...w, endDate: e.target.value} : w))}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all" 
                        />
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-100 flex gap-2">
                      <button 
                        onClick={() => toggleWaveStatus(wave.id)}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5 ${
                          wave.status === 'Aktif'
                            ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200'
                        }`}
                      >
                        {wave.status === 'Aktif' ? <><XCircle size={13}/> Nonaktifkan</> : <><CheckCircle2 size={13}/> Aktifkan</>}
                      </button>
                      <button 
                        onClick={() => {
                          setWaves(prev => prev.filter(w => w.id !== wave.id));
                          showToast(`${wave.name} dihapus.`, 'error');
                        }}
                        className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all active:scale-95"
                      >
                        <Trash2 size={13}/>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. AKSI CEPAT ADMIN */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/60 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                    <Shield size={18} className="text-blue-600" />
                  </div>
                  <h4 className="font-bold text-slate-800">Keamanan</h4>
                </div>
                <p className="text-xs text-slate-500 mb-4">Ubah kata sandi akun admin HQ.</p>
                <button className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-600 transition-colors">Ubah Password</button>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/60 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                    <Download size={18} className="text-emerald-600" />
                  </div>
                  <h4 className="font-bold text-slate-800">Ekspor Data</h4>
                </div>
                <p className="text-xs text-slate-500 mb-4">Unduh seluruh data peserta sebagai CSV.</p>
                <button 
                  onClick={() => {
                    const csv = realEntries.map((e: any) => 
                      `${e.full_name},${e.email},${e.competition_type},${e.school_name},${e.status}`
                    ).join('\n');
                    const blob = new Blob([`Nama,Email,Lomba,Sekolah,Status\n${csv}`], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'Data_Peserta_NCC13.csv';
                    a.click();
                    showToast('Data berhasil diekspor sebagai CSV!', 'success');
                  }}
                  className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 rounded-xl text-xs font-bold text-emerald-600 transition-colors"
                >
                  Unduh CSV
                </button>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/60 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                    <Clock size={18} className="text-amber-600" />
                  </div>
                  <h4 className="font-bold text-slate-800">Zona Waktu</h4>
                </div>
                <p className="text-xs text-slate-500 mb-4">Sistem menggunakan zona waktu WIB (GMT+7).</p>
                <div className="w-full py-2.5 bg-amber-50 rounded-xl text-xs font-bold text-amber-600 text-center">WIB (UTC+7)</div>
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

            {/* 2. KAWALAN PENGUMPULAN FAIL PER KATEGORI */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-sm border border-white/60">
              <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-100">
                <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl">
                  <FolderOpen size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800">Akses Pengumpulan Fail Karya</h3>
                  <p className="text-xs text-slate-500 font-medium">Buka atau tutup portal penghantaran karya untuk setiap bidang lomba.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {submissionStatus.map((category) => (
                  <div key={category.id} className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all duration-300 ${category.isOpen ? 'border-indigo-400 bg-indigo-50/40 shadow-sm' : 'border-slate-100 bg-slate-50/50 hover:border-slate-200'}`}>
                    <div>
                      <h4 className="font-bold text-slate-800">{category.name}</h4>
                      <p className={`text-[10px] font-bold tracking-widest uppercase mt-1 ${category.isOpen ? 'text-indigo-600' : 'text-slate-400'}`}>
                        {category.isOpen ? '● Portal Terbuka' : '○ Portal Ditutup'}
                      </p>
                    </div>
                    
                    <button 
                      onClick={() => {
                        toggleSubmission(category.id);
                        showToast(`${category.name} ${!category.isOpen ? 'Portal Dibuka' : 'Portal Ditutup'}`, !category.isOpen ? 'success' : 'error');
                      }}
                      className={`relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none shadow-inner shrink-0 ${category.isOpen ? 'bg-indigo-500' : 'bg-slate-300'}`}
                    >
                      <div className={`absolute top-0.5 left-0.5 bg-white w-6 h-6 rounded-full shadow-md transition-transform duration-300 flex items-center justify-center ${category.isOpen ? 'translate-x-7' : 'translate-x-0'}`}>
                        {category.isOpen ? <FileCheck size={10} className="text-indigo-600" /> : <X size={10} className="text-slate-400" />}
                      </div>
                    </button>
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
              
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-4xl font-black shadow-lg mb-6 border-4 border-white">
                {(selectedParticipant.full_name || "U").charAt(0)}
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-1">{selectedParticipant.full_name || "Nama tidak tersedia"}</h3>
              <p className="text-slate-500 font-medium mb-6">{selectedParticipant.competition_type || selectedParticipant.category || "Belum ada kategori"}</p>

              <div className="space-y-4">
                <div className="p-4 bg-white/60 border border-slate-100 rounded-xl shadow-sm">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nomor Induk Siswa (NISN)</p>
                  <p className="font-semibold text-slate-800">{selectedParticipant.nisn || "Data Kosong"}</p>
                </div>
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
