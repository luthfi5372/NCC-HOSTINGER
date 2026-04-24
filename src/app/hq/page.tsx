"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client"; 
import { 
  LayoutDashboard, Users, FileCheck, Settings, 
  ArrowUpRight, ArrowDownRight, Download, Calendar, 
  Bell, MoreHorizontal, Sparkles, Search, Filter, Printer, X, IdCard, Megaphone
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
  const supabase = createClient();

  // --- MESIN EKSEKUTOR STATUS ---
  const handleUpdateStatus = async (id: string | number, newStatus: string) => {
    // 1. Konfirmasi manual agar tidak salah pencet
    const isConfirmed = window.confirm(`Apakah Anda yakin ingin mengubah status pendaftar ini menjadi ${newStatus}?`);
    if (!isConfirmed) return;

    try {
      // 2. Tembakkan perintah update ke Supabase
      const { error } = await supabase
        .from('competition_entries')
        .update({ payment_status: newStatus })
        .eq('id', id);

      if (error) throw error;

      // 3. Perbarui layar secara instan (tanpa perlu refresh web)
      setRealEntries(prevEntries => 
        prevEntries.map(entry => 
          entry.id === id ? { ...entry, payment_status: newStatus } : entry
        )
      );

      alert(`✅ Komando berhasil! Status telah menjadi ${newStatus}.`);
    } catch (error: any) {
      alert(`❌ Misi Gagal: ${error.message}`);
    }
  };

  // --- MESIN EKSEKUTOR SIARAN ---
  const handleSendBroadcast = async () => {
    if (!broadcastTitle || !broadcastMessage) {
      return alert("⚠️ Judul dan isi pesan tidak boleh kosong, Komandan!");
    }

    if (broadcastTarget === "specific" && selectedUserIds.length === 0) {
      return alert("⚠️ Pilih minimal satu peserta untuk pengumuman spesifik ini!");
    }

    const confirmSend = window.confirm(`Pesan "${broadcastTitle}" akan dikirim ke ${broadcastTarget === 'specific' ? `${selectedUserIds.length} peserta terpilih` : 'dashboard peserta'}. Lanjutkan?`);
    if (!confirmSend) return;

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

      alert("✅ MISI BERHASIL! Pengumuman spesifik sudah mengudara.");
      setBroadcastTitle("");
      setBroadcastMessage("");
      setSelectedUserIds([]);
    } catch (error: any) {
      alert(`❌ Misi Gagal: ${error.message}`);
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
      {/* Ornamen Latar Belakang untuk Efek Kaca */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-400/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl pointer-events-none"></div>
      
      {/* ================= SIDEBAR (LIQUID GLASS) ================= */}
      <aside className="w-64 bg-white/40 backdrop-blur-2xl backdrop-saturate-150 border-r border-white/60 flex flex-col justify-between p-6 relative z-10 shadow-[4px_0_24px_rgb(0,0,0,0.02)]">
        <div>
          <div className="flex items-center gap-3 mb-10 px-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-200">
              🏆
            </div>
            <span className="font-bold text-xl tracking-tight">NCC HQ.</span>
          </div>

          <nav className="space-y-2">
            <NavItem icon={<LayoutDashboard size={20} />} text="Dashboard" active={activeTab === "Dashboard"} onClick={() => setActiveTab("Dashboard")} />
            <NavItem icon={<Users size={20} />} text="Peserta" active={activeTab === "Peserta"} onClick={() => setActiveTab("Peserta")} />
            <NavItem icon={<FileCheck size={20} />} text="Verifikasi" badge={realEntries.filter(e => e.payment_status === 'Pending').length.toString()} active={activeTab === "Verifikasi"} onClick={() => setActiveTab("Verifikasi")} />
            <NavItem icon={<Megaphone size={20} />} text="Pengumuman" active={activeTab === "Pengumuman"} onClick={() => setActiveTab("Pengumuman")} />
            <NavItem icon={<Settings size={20} />} text="Pengaturan" active={activeTab === "Pengaturan"} onClick={() => setActiveTab("Pengaturan")} />
          </nav>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 text-white shadow-xl shadow-blue-200/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-20"><Sparkles size={40}/></div>
          <h4 className="font-bold mb-1 relative z-10">Fase Kompetisi</h4>
          <p className="text-blue-100 text-xs mb-4 relative z-10">Pendaftaran Gelombang 1 berlangsung.</p>
          <button className="w-full bg-white text-blue-700 text-sm font-bold py-2 rounded-xl hover:bg-blue-50 transition-colors relative z-10">
            Tutup Pendaftaran
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
          
          <div className="bg-white/50 backdrop-blur-xl border border-white/60 p-1.5 rounded-xl flex flex-wrap gap-1 shadow-[0_4px_20px_rgb(0,0,0,0.03)] text-xs font-bold w-full sm:w-auto">
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
          <div className="bg-white/50 backdrop-blur-xl backdrop-saturate-150 p-6 rounded-2xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] col-span-2">
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

          <div className="bg-white/50 backdrop-blur-xl backdrop-saturate-150 p-6 rounded-2xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
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
          <div className="bg-white/50 backdrop-blur-xl backdrop-saturate-150 rounded-2xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                    className="w-full pl-4 pr-10 py-2.5 bg-white/50 backdrop-blur-xl border border-white/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 appearance-none text-slate-700 font-medium shadow-sm"
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
                               📍 {entry.province || entry.city || "Provinsi belum diisi"}
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
                              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                              Active
                            </span>
                          </td>
                          {/* KOLOM AKSI BARU */}
                          <td className="py-4 px-6 text-center">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation(); // Mencegah Slide-out terbuka saat klik tombol ID Card
                                setSelectedIdCard(entry);
                              }}
                              className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-all shadow-sm border border-blue-100"
                              title="Cetak ID Card"
                            >
                              <IdCard size={18} />
                            </button>
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
          <div className="bg-white/50 backdrop-blur-xl backdrop-saturate-150 rounded-2xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <FileCheck size={20} className="text-blue-600" />
                Antrean Verifikasi Pembayaran
              </h3>
              <span className="text-xs font-bold px-3 py-1 bg-amber-100 text-amber-700 rounded-full animate-pulse">
                {realEntries.filter(e => e.payment_status === 'Pending').length} Menunggu
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-white text-slate-500 font-medium border-b border-slate-100">
                  <tr>
                    <th className="py-4 px-6">ID</th>
                    <th className="py-4 px-6">NAMA PESERTA</th>
                    <th className="py-4 px-6">KATEGORI</th>
                    <th className="py-4 px-6">STATUS & AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {realEntries.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-slate-400 flex flex-col items-center">
                        <Sparkles size={40} className="mb-2 opacity-20" />
                        Belum ada pendaftar di radar...
                      </td>
                    </tr>
                  ) : (
                    realEntries.map((entry: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50/30 transition-colors group">
                        <td className="py-4 px-6 font-medium text-slate-800">NCC-{entry.id}</td>
                        <td className="py-4 px-6 flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs uppercase border border-blue-100">
                             {(entry.full_name || entry.email || "U").charAt(0)}
                           </div>
                           <div className="flex flex-col">
                             <span className="font-bold text-slate-900 leading-tight">{entry.full_name || "Peserta Anonim"}</span>
                             <span className="text-[10px] text-slate-400">{entry.email}</span>
                           </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase tracking-wider">
                            {entry.category || "General"}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex flex-col gap-2">
                            {/* BAGIAN 1: TOMBOL AKSI */}
                            {(!entry.payment_status || entry.payment_status === 'Pending' || entry.payment_status === 'Wait') ? (
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => handleUpdateStatus(entry.id, 'Verified')}
                                  className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-[11px] font-bold rounded-lg transition-all shadow-sm flex items-center gap-1 active:scale-95"
                                >
                                  ✅ Terima
                                </button>
                                <button 
                                  onClick={() => handleUpdateStatus(entry.id, 'Rejected')}
                                  className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-[11px] font-bold rounded-lg transition-all shadow-sm flex items-center gap-1 active:scale-95"
                                >
                                  ❌ Tolak
                                </button>
                              </div>
                            ) : (
                              <span className={`px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center w-max gap-1.5 border
                                ${entry.payment_status === 'Verified' ? 'bg-green-50 text-green-600 border-green-200' : 
                                  entry.payment_status === 'Rejected' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-slate-50 text-slate-500 border-slate-200'}
                              `}>
                                <div className={`w-1.5 h-1.5 rounded-full ${entry.payment_status === 'Verified' ? 'bg-green-500' : entry.payment_status === 'Rejected' ? 'bg-red-500' : 'bg-slate-400'}`}></div>
                                {entry.payment_status}
                              </span>
                            )}

                            {/* BAGIAN 2: TOMBOL BUKTI TF */}
                            {entry.payment_proof_url && (
                              <a 
                                href={entry.payment_proof_url} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="flex items-center w-max gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 hover:shadow-sm rounded-lg text-[11px] font-bold transition-all"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                                  <circle cx="12" cy="12" r="3"/>
                                </svg>
                                Bukti TF
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 🎛️ KONTEN TAB: PENGUMUMAN (SIARAN KOMANDO) */}
        {activeTab === "Pengumuman" && (
          <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white/50 backdrop-blur-xl border border-white/60 rounded-3xl p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                  <Megaphone size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Siaran Komando</h2>
                  <p className="text-slate-500 text-sm">Kirim pengumuman real-time ke seluruh dashboard peserta NCC.</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Judul Pengumuman</label>
                    <input 
                      type="text" 
                      value={broadcastTitle}
                      onChange={(e) => setBroadcastTitle(e.target.value)}
                      placeholder="Contoh: Selamat Datang di NCC 13th!" 
                      className="w-full px-5 py-3.5 bg-white/60 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-slate-700 placeholder:text-slate-400 shadow-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Target Audiens</label>
                    <select 
                      value={broadcastTarget}
                      onChange={(e) => setBroadcastTarget(e.target.value)}
                      className="w-full px-5 py-3.5 bg-white/60 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-slate-700 appearance-none shadow-sm"
                    >
                      <option value="All">Seluruh Peserta</option>
                      <option value="Verified">Peserta Terverifikasi</option>
                      <option value="Pending">Menunggu Pembayaran</option>
                      <option value="specific">Peserta Tertentu (Pilih Manual)</option>
                    </select>
                  </div>
                </div>

                {/* --- SELEKSI PESERTA SPESIFIK (HANYA MUNCUL JIKA TARGET ADALAH SPECIFIC) --- */}
                {broadcastTarget === "specific" && (
                  <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl animate-in fade-in zoom-in-95 duration-300">
                    <div className="flex justify-between items-center mb-4">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Daftar Peserta NCC ({realEntries.length})</label>
                      <div className="flex gap-2">
                        <button 
                          type="button"
                          onClick={() => setSelectedUserIds(realEntries.map(e => e.user_id).filter(id => id))} 
                          className="text-[10px] font-bold text-blue-600 hover:underline"
                        >
                          Pilih Semua
                        </button>
                        <span className="text-slate-300">|</span>
                        <button 
                          type="button"
                          onClick={() => setSelectedUserIds([])} 
                          className="text-[10px] font-bold text-slate-400 hover:underline"
                        >
                          Kosongkan
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                      {realEntries.length === 0 ? (
                        <p className="text-xs text-slate-400 italic col-span-full py-4 text-center">Belum ada data peserta di radar.</p>
                      ) : (
                        realEntries.map((entry) => (
                          <label 
                            key={entry.id} 
                            className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer group ${
                              selectedUserIds.includes(entry.user_id) 
                              ? 'bg-blue-50 border-blue-200 shadow-sm' 
                              : 'bg-white border-slate-100 hover:border-slate-200'
                            }`}
                          >
                            <input 
                              type="checkbox" 
                              className="w-4 h-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer"
                              checked={selectedUserIds.includes(entry.user_id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedUserIds([...selectedUserIds, entry.user_id]);
                                } else {
                                  setSelectedUserIds(selectedUserIds.filter(id => id !== entry.user_id));
                                }
                              }}
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-700 truncate">{entry.full_name}</p>
                              <p className="text-[10px] text-slate-400 truncate">{entry.school_name || entry.school}</p>
                            </div>
                          </label>
                        ))
                      )}
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between">
                       <p className="text-[10px] font-medium text-slate-500 italic">
                         Terpilih: <span className="font-bold text-blue-600">{selectedUserIds.length}</span> orang
                       </p>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Isi Pesan Siaran</label>
                  <textarea 
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    rows={5}
                    placeholder="Tuliskan detail pengumuman Anda di sini..." 
                    className="w-full px-5 py-4 bg-white/60 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-slate-700 placeholder:text-slate-400 shadow-sm resize-none"
                  ></textarea>
                </div>

                <div className="pt-4">
                  <button 
                    onClick={handleSendBroadcast}
                    disabled={isSending}
                    className="w-full bg-slate-900 hover:bg-blue-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-slate-900/10 active:scale-[0.98] disabled:opacity-50"
                  >
                    {isSending ? (
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>SIARKAN PESAN SEKARANG <ArrowRight size={18} /></>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-8 p-6 bg-blue-50/50 border border-blue-100 rounded-2xl flex items-start gap-4">
               <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Sparkles size={20}/></div>
               <div>
                  <h4 className="text-sm font-bold text-blue-900 mb-1">Tips Komando</h4>
                  <p className="text-xs text-blue-700 leading-relaxed">Pesan yang Anda kirim akan langsung muncul di halaman Dashboard masing-masing peserta. Gunakan fitur ini untuk informasi mendesak atau ucapan selamat.</p>
               </div>
            </div>
          </div>
        )}

        {/* 🎛️ KONTEN TAB: PENGATURAN */}
        {activeTab === "Pengaturan" && (
          <div className="bg-white/50 backdrop-blur-xl backdrop-saturate-150 p-12 rounded-2xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-center flex flex-col items-center justify-center min-h-[400px] animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Settings size={64} className="text-slate-200 mb-4" />
            <h2 className="text-xl font-bold text-slate-800">Konfigurasi Sistem</h2>
            <p className="text-slate-500 mt-2">Atur periode pendaftaran, kategori lomba, dan akses admin.</p>
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
                  <p className="text-sm text-slate-600">📍 {selectedParticipant.province || selectedParticipant.city || "Provinsi tidak dicantumkan"}</p>
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
               
               {/* Kanvas ID Card */}
               <div className="print-area bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-2xl p-6 text-center shadow-inner relative overflow-hidden mt-4">
                  <div className="absolute top-[-20%] left-[-20%] w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                  
                  <div className="text-white/80 text-[10px] font-black uppercase tracking-[0.2em] mb-6">ID Card Peserta</div>
                  
                  <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full mx-auto mb-4 flex items-center justify-center text-3xl font-bold border border-white/40 shadow-lg text-white">
                     {(selectedIdCard.full_name || "U").charAt(0)}
                  </div>
                  <h3 className="text-xl font-bold mb-1 text-white">{selectedIdCard.full_name}</h3>
                  <p className="text-blue-200 text-xs mb-6 font-medium">{selectedIdCard.school_name || selectedIdCard.school}</p>
                  
                  <div className="bg-white/10 backdrop-blur-md rounded-xl py-3 border border-white/20 mb-3 shadow-sm">
                     <span className="text-[10px] text-blue-200 block uppercase font-bold tracking-widest mb-0.5">Kategori</span>
                     <span className="font-bold text-white text-sm">{selectedIdCard.competition_type || selectedIdCard.category}</span>
                  </div>
                  
                  <div className="inline-block px-4 py-1.5 bg-black/20 rounded-full border border-white/10 text-xs text-white font-mono mt-2">
                    ID: NCC-{selectedIdCard.id}
                  </div>
               </div>
               
               <button 
                 onClick={handlePrintCard}
                 className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-200"
               >
                  <Printer size={18} /> Cetak Kartu
               </button>
            </div>
          </div>
        )}
      </main>
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
