"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from '@supabase/ssr';
import { 
  Users, 
  ShieldCheck, 
  Clock, 
  Megaphone, 
  Download, 
  Zap, 
  LogOut,
  Loader2,
  Search,
  Filter,
  Pencil,
  Key,
  Trash2,
  X,
  CheckCircle2,
  TrendingUp,
  PieChart as PieIcon,
  Activity
} from "lucide-react";
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend,
  CartesianGrid
} from "recharts";
import QRCode from "react-qr-code";
import html2canvas from "html2canvas";

export default function HQDashboardLight() {
  const router = useRouter();
  
  // Inisialisasi Klien Supabase langsung di Browser
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  // State Data & Admin State
  const [broadcastText, setBroadcastText] = useState("");
  const [isRegOpen, setIsRegOpen] = useState(true);
  const [participants, setParticipants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [viewImage, setViewImage] = useState<string | null>(null);

  // State Radar (Search & Filter)
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [activeTab, setActiveTab] = useState<"VERIFIKASI" | "USERS" | "PENILAIAN">("VERIFIKASI");

  // State Modal Edit
  const [editingParticipant, setEditingParticipant] = useState<any | null>(null);

  // State untuk menyimpan data peserta yang tiketnya sedang dilihat
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);

  // Fungsi Menarik Data Saat Halaman Dimuat
  useEffect(() => {
    fetchHQData();
  }, []);

  const fetchHQData = async () => {
    setIsLoading(true);
    try {
      const { data: settings } = await supabase.from('site_settings').select('*').eq('id', 1).single();
      if (settings) {
        setBroadcastText(settings.live_announcement || "");
        setIsRegOpen(settings.is_registration_open);
      }

      const { data: entries } = await supabase.from('competition_entries').select('*').order('created_at', { ascending: false });
      if (entries) setParticipants(entries);
    } catch (error) {
      console.error("Gagal menarik data HQ:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fungsi Ekstraksi Data (Export CSV)
  const handleExportCSV = () => {
    if (participants.length === 0) return alert("Tidak ada data untuk diekspor.");

    const BOM = "\uFEFF";
    const headers = ["ID", "Nama", "Email", "WhatsApp", "Sekolah", "Kota", "Kategori", "Status", "Waktu Daftar"];
    
    const csvRows = [
      headers.join(","),
      ...participants.map(p => [
        `"NCC-${String(p.id).slice(0, 8).toUpperCase()}"`,
        `"${p.full_name}"`,
        `"${p.email}"`,
        `"=""${p.phone}"""`, // Force Excel string format
        `"${p.school}"`,
        `"${p.city}"`,
        `"${p.category}"`,
        `"${p.payment_status}"`,
        `"${new Date(p.created_at).toLocaleString('id-ID')}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([BOM + csvRows], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `NCC_Master_Data_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  // Fungsi Update Status (Accept/Reject)
  const updatePaymentStatus = async (id: string, status: string) => {
    setIsSaving(true);
    try {
      const { error } = await supabase.from('competition_entries').update({ payment_status: status }).eq('id', id);
      if (error) throw error;
      setParticipants(participants.map(p => p.id === id ? { ...p, payment_status: status } : p));
      
      // 🚀 PELATUK EMAIL OTOMATIS (Resend)
      if (status === 'Verified') {
        const p = participants.find(part => part.id === id);
        if (p) {
          fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email_peserta: p.email,
              nama_peserta: p.full_name,
              kategori_lomba: p.category,
              id_pendaftaran: String(p.id)
            })
          }).then(() => {
            console.log("Email notifikasi berhasil ditembakkan!");
          }).catch(err => {
            console.error("Gagal mengirim email:", err);
          });
        }
      }
    } catch (error) {
      alert("❌ Gagal memperbarui status.");
    } finally {
      setIsSaving(false);
    }
  };

  // God Mode Actions
  const resetPassword = async (email: string) => {
    if (!window.confirm(`Kirim email reset password ke ${email}?`)) return;
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      alert("✅ Link reset berhasil dikirim ke email peserta!");
    } catch (err: any) {
      alert(`❌ Gagal: ${err.message}`);
    }
  };

  const deleteEntry = async (id: string, name: string) => {
    if (!window.confirm(`⚠️ PERINGATAN: Hapus pendaftaran ${name}? Tindakan ini permanen.`)) return;
    setIsSaving(true);
    try {
      const { error } = await supabase.from('competition_entries').delete().eq('id', id);
      if (error) throw error;
      setParticipants(participants.filter(p => p.id !== id));
      alert("🗑️ Data berhasil dihapus.");
    } catch (err: any) {
      alert(`❌ Gagal menghapus: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingParticipant) return;
    setIsSaving(true);
    try {
      const { error } = await supabase.from('competition_entries').update({
        full_name: editingParticipant.full_name,
        school: editingParticipant.school,
        phone: editingParticipant.phone,
        category: editingParticipant.category
      }).eq('id', editingParticipant.id);
      
      if (error) throw error;
      setParticipants(participants.map(p => p.id === editingParticipant.id ? editingParticipant : p));
      setEditingParticipant(null);
      alert("✅ Data peserta diperbarui!");
    } catch (err: any) {
      alert(`❌ Gagal update: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const saveSettings = async (newRegStatus?: boolean) => {
    setIsSaving(true);
    const updatedStatus = newRegStatus !== undefined ? newRegStatus : isRegOpen;
    try {
      const { error } = await supabase.from('site_settings').update({ live_announcement: broadcastText, is_registration_open: updatedStatus }).eq('id', 1);
      if (error) throw error;
      if (newRegStatus !== undefined) setIsRegOpen(newRegStatus);
      alert("✅ Pengaturan diperbarui!");
    } catch (error) {
      alert("❌ Gagal menyimpan.");
    } finally {
      setIsSaving(false);
    }
  };

  const downloadTicket = async () => {
    const ticketElement = document.getElementById("ncc-ticket");
    if (!ticketElement) return;
    
    try {
      const canvas = await html2canvas(ticketElement, { scale: 3, backgroundColor: null });
      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = `ID_CARD_${selectedTicket?.full_name}_NCC13.png`;
      link.click();
    } catch (err) {
      console.error("Gagal mengunduh tiket", err);
    }
  };

  // --- JURI SCORING LOGIC ---
  const [isScoring, setIsScoring] = useState(false);

  const handleSubmitScore = async (id_peserta: string, scoreValue: number) => {
    if (scoreValue < 0 || scoreValue > 100) {
      return alert("Skor harus berada di antara 0 hingga 100!");
    }
    
    setIsScoring(true);
    try {
      const { error } = await supabase
        .from('competition_entries') 
        .update({ score: scoreValue })
        .eq('id', id_peserta);

      if (error) throw error;
      
      // Refresh data agar skor terbaru langsung muncul di layar
      fetchHQData(); 
      alert("✅ Skor berhasil dikunci ke dalam sistem!");
    } catch (error) {
      console.error("Gagal menyimpan skor:", error);
      alert("❌ Terjadi kesalahan saat menyimpan skor.");
    } finally {
      setIsScoring(false);
    }
  };

  // --- TELEMETRI DATA PROCESSING ---
  const categoryData = useMemo(() => {
    const rawData = [
      { name: 'MIPA', value: participants.filter(p => p.category === 'Olimpiade MIPA').length },
      { name: 'LKTI', value: participants.filter(p => p.category === 'LKTI Nasional').length },
      { name: 'SPEECH', value: participants.filter(p => p.category === 'Speech Contest').length },
      { name: 'MTQ', value: participants.filter(p => p.category === 'MTQ Nasional').length },
    ].filter(item => item.value > 0);
    return rawData;
  }, [participants]);

  const dailyTrendData = useMemo(() => {
    const last14Days = Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toLocaleDateString('en-CA'); // YYYY-MM-DD
    }).reverse();

    const counts: Record<string, number> = {};
    participants.forEach(p => {
      const date = new Date(p.created_at).toLocaleDateString('en-CA');
      counts[date] = (counts[date] || 0) + 1;
    });

    return last14Days.map(date => ({
      date: date.split('-').slice(1).join('/'), // MM/DD
      count: counts[date] || 0
    }));
  }, [participants]);

  const CHART_COLORS = ['#2563eb', '#6366f1', '#8b5cf6', '#d946ef'];

  // Logic Radar (Filtering)
  const filteredParticipants = participants.filter(p => {
    const matchesSearch = 
      p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.school?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "ALL" || p.category === categoryFilter;
    
    if (activeTab === "VERIFIKASI") {
      return p.payment_status === 'Paid' && matchesSearch && matchesCategory;
    }
    return matchesSearch && matchesCategory;
  });

  const stats = {
    total: participants.length,
    verified: participants.filter(p => p.payment_status === 'Verified').length,
    pending: participants.filter(p => p.payment_status === 'Paid').length
  };

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-800 font-sans p-4 md:p-8 relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-400/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto relative z-10 space-y-8">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-white/60 backdrop-blur-xl border border-white/50 shadow-sm p-6 rounded-3xl">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">System Online</p>
            </div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent uppercase">
              NCC Command Center
            </h1>
          </div>
          <div className="flex gap-4 mt-4 md:mt-0">
            <button 
              onClick={handleExportCSV}
              className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold shadow-sm hover:bg-slate-50 transition-all text-sm flex items-center gap-2"
            >
              <Download size={16} className="text-blue-600" /> Export CSV
            </button>
            <button 
              onClick={() => {
                document.cookie = "ncc_bypass=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                supabase.auth.signOut().then(() => router.push('/login'));
              }}
              className="px-5 py-2.5 bg-red-50 text-red-600 border border-red-100 rounded-xl font-bold shadow-sm hover:bg-red-100 transition-all text-sm flex items-center gap-2"
            >
              <LogOut size={16} /> Log Out
            </button>
          </div>
        </div>

        {/* METRICS & SWITCH */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { title: "Total Pendaftar", value: stats.total, color: "text-blue-600", icon: Users },
            { title: "Terverifikasi", value: stats.verified, color: "text-green-600", icon: ShieldCheck },
            { title: "Menunggu Review", value: stats.pending, color: "text-amber-500", icon: Clock },
          ].map((stat, idx) => (
            <div key={idx} className="bg-white/70 backdrop-blur-xl border border-white/60 shadow-sm p-6 rounded-3xl flex flex-col justify-between hover:scale-[1.02] transition-transform">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.title}</h3>
                <stat.icon size={24} className={stat.color} />
              </div>
              <p className={`text-4xl font-black ${stat.color}`}>{isLoading ? "..." : stat.value.toLocaleString()}</p>
            </div>
          ))}

          <div className="bg-gradient-to-br from-indigo-500 to-blue-600 shadow-lg p-6 rounded-3xl flex flex-col justify-between text-white relative overflow-hidden group">
            {isLoading && <div className="absolute inset-0 bg-black/10 backdrop-blur-sm z-10 flex items-center justify-center"><Loader2 size={24} className="animate-spin" /></div>}
            <h3 className="text-[10px] font-black text-indigo-100 uppercase tracking-widest mb-4">Pendaftaran</h3>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black group-hover:scale-110 transition-transform">{isRegOpen ? "OPEN" : "CLOSED"}</span>
              <button 
                onClick={() => saveSettings(!isRegOpen)}
                disabled={isSaving}
                className={`w-14 h-8 rounded-full p-1 transition-all duration-300 ${isRegOpen ? 'bg-green-400' : 'bg-slate-400/50'}`}
              >
                <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${isRegOpen ? 'translate-x-6' : 'translate-x-0'}`}></div>
              </button>
            </div>
          </div>
        </div>

        {/* RADAR ANALITIK (NEW) - Executive Telemetry */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-150">
          {/* Pie Chart: Distribusi Kategori */}
          <div className="bg-white/70 backdrop-blur-xl border border-white/60 p-8 rounded-[2.5rem] shadow-xl h-[360px] flex flex-col relative overflow-hidden group">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <PieIcon size={16} className="text-blue-500" />
                  Persentase Kategori Lomba
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Sifat Peminat NCC</p>
              </div>
              <div className="bg-blue-50 p-2 rounded-xl">
                <Activity size={18} className="text-blue-600" />
              </div>
            </div>
            
            <div className="flex-1 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={8}
                    dataKey="value"
                    animationBegin={200}
                    animationDuration={1500}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} stroke="rgba(255,255,255,0.5)" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)' }}
                    itemStyle={{ fontWeight: '800', fontSize: '12px' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle"/>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                <span className="text-3xl font-black text-slate-800 leading-none">{participants.length}</span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Total Entry</span>
              </div>
            </div>
          </div>

          {/* Area Chart: Tren Pendaftaran 14 Hari Terakhir */}
          <div className="bg-white/70 backdrop-blur-xl border border-white/60 p-8 rounded-[2.5rem] shadow-xl h-[360px] flex flex-col relative group">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <TrendingUp size={16} className="text-indigo-500" />
                  Tren Pendaftaran Harian
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Aktivitas 14 Hari Terakhir</p>
              </div>
              <div className="bg-indigo-50 p-2 rounded-xl">
                <Zap size={18} className="text-indigo-600" />
              </div>
            </div>

            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyTrendData}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} 
                    tickMargin={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} 
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)' }}
                    itemStyle={{ fontWeight: '800', fontSize: '12px', color: '#4f46e5' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#4f46e5" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorCount)" 
                    animationBegin={500}
                    animationDuration={2000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* AREA TAB KONTROL - Navigasi Ruang Kerja */}
        <div className="flex gap-4 mb-2 border-b border-slate-200 pb-4 overflow-x-auto">
          <button 
            onClick={() => setActiveTab("VERIFIKASI")}
            className={`px-6 py-2.5 rounded-2xl font-black text-sm transition-all flex items-center gap-2 ${activeTab === "VERIFIKASI" ? "bg-blue-600 text-white shadow-lg shadow-blue-200 scale-105" : "bg-white/50 text-slate-500 hover:bg-white hover:text-blue-600 border border-transparent hover:border-blue-100"}`}
          >
            <Zap size={16} /> Antrean Verifikasi
          </button>
          <button 
            onClick={() => setActiveTab("USERS")}
            className={`px-6 py-2.5 rounded-2xl font-black text-sm transition-all flex items-center gap-2 ${activeTab === "USERS" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-105" : "bg-white/50 text-slate-500 hover:bg-white hover:text-indigo-600 border border-transparent hover:border-indigo-100"}`}
          >
            <Users size={16} /> Master Data Peserta
          </button>
          <button 
            onClick={() => setActiveTab("PENILAIAN")}
            className={`px-6 py-2.5 rounded-2xl font-black text-sm transition-all flex items-center gap-2 ${activeTab === "PENILAIAN" ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200 scale-105" : "bg-white/50 text-slate-500 hover:bg-white hover:text-emerald-600 border border-transparent hover:border-emerald-100"}`}
          >
            <span>⚖️</span> Panel Penilaian
          </button>
        </div>

        {/* MAIN DATA PANELS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* TAB 1: VERIFIKASI PEMBAYARAN */}
          {activeTab === "VERIFIKASI" && (
            <div className="lg:col-span-1 bg-white/70 backdrop-blur-xl border border-white/60 shadow-sm p-6 rounded-3xl relative animate-in fade-in slide-in-from-bottom-4 duration-500">
              {isLoading && <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 rounded-3xl"></div>}
              <div className="flex items-center gap-2 mb-2">
                <Megaphone size={20} className="text-blue-500" />
                <h3 className="text-lg font-bold text-slate-800">Terminal Siaran</h3>
              </div>
              <p className="text-xs text-slate-500 mb-6 font-medium">Broadcast pesan ke seluruh dashboard peserta.</p>
              
              <textarea 
                value={broadcastText}
                onChange={(e) => setBroadcastText(e.target.value)}
                className="w-full bg-white/50 border border-slate-200 rounded-2xl p-4 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-32 mb-4 transition-all"
                placeholder="Ketik pengumuman..."
              ></textarea>
              <button 
                onClick={() => saveSettings()}
                disabled={isSaving}
                className="w-full py-4 bg-indigo-600 hover:bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-lg active:scale-95"
              >
                {isSaving ? "Sinkronisasi..." : "Kirim Siaran Global"}
              </button>
            </div>
          )}

          {/* MAIN RADAR TABLE */}
          <div className={`${activeTab === 'USERS' ? 'lg:col-span-3' : 'lg:col-span-2'} bg-white/70 backdrop-blur-xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 rounded-3xl overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500`}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <div>
                <h3 className="text-xl font-black text-slate-800">
                  {activeTab === "VERIFIKASI" ? "⚡ Antrean Verifikasi" : "🗄️ Master Registry Pengguna"}
                </h3>
                <p className="text-sm text-slate-500">
                  {activeTab === "VERIFIKASI" ? "Radar peninjauan bukti transfer pendaftar." : "Manajemen seluruh akun terdaftar di sistem NCC 13th."}
                </p>
              </div>
              
              {/* Management HUD: Search & Filter */}
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Cari email atau nama..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full md:w-80 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                  />
                </div>
                <select 
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-white/50 border border-slate-200 rounded-xl px-4 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer font-bold"
                >
                  <option value="ALL">Semua Kategori</option>
                  <option value="Olimpiade MIPA">Olimpiade MIPA</option>
                  <option value="Speech Contest">Speech Contest</option>
                  <option value="LKTI Nasional">LKTI Nasional</option>
                  <option value="MTQ Nasional">MTQ Nasional</option>
                </select>
              </div>
            </div>
            
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-xs text-slate-400 uppercase tracking-widest font-black">
                    <th className="pb-4">Profil Peserta</th>
                    <th className="pb-4">Kontak & Kategori</th>
                    {activeTab === "VERIFIKASI" ? <th className="pb-4">Bukti TF</th> : <th className="pb-4">Status Pembayaran</th>}
                    <th className="pb-4 text-right">Otoritas Admin</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {isLoading ? (
                    <tr><td colSpan={4} className="py-12 text-center text-slate-400 animate-pulse font-bold uppercase tracking-tighter">Scanning database...</td></tr>
                  ) : filteredParticipants.length === 0 ? (
                    <tr><td colSpan={4} className="py-12 text-center text-slate-400 font-black italic">Radar bersih. Tidak ada data yang sesuai.</td></tr>
                  ) : (
                    filteredParticipants.map((p) => (
                      <tr key={p.id} className="border-b border-slate-100 group hover:bg-slate-50/50 transition-colors">
                        {/* Build Trigger: NCC-13-SYNC-FORCE-001 */}
                        <td className="py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-600 shadow-sm border border-indigo-200">
                              {p.full_name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-black text-slate-800 uppercase text-xs tracking-wide">{p.full_name}</p>
                              <p className="text-[10px] text-slate-400 font-mono">UID: {String(p.id).slice(0, 8).toUpperCase()}-...</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-5">
                          <p className="text-xs font-bold tracking-tight text-slate-600">{p.email}</p>
                          <p className="text-[10px] text-slate-400">{p.category} - {p.school}</p>
                        </td>
                          <td className="py-5">
                            <span className={`px-3 py-1 text-[10px] font-black rounded-full border ${
                              p.payment_status === 'Verified' ? 'bg-green-50 text-green-600 border-green-100' :
                              p.payment_status === 'Paid' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                              'bg-slate-50 text-slate-500 border-slate-100'
                            }`}>
                              {p.payment_status === 'Verified' ? 'TERVERIFIKASI' : p.payment_status === 'Paid' ? 'MENUNGGU REVIEW' : 'BELUM BAYAR'}
                            </span>
                          </td>
                        <td className="py-5 text-right">
                          <div className="flex justify-end gap-2">
                            {activeTab === "VERIFIKASI" ? (
                              <>
                                <button 
                                  onClick={() => updatePaymentStatus(p.id, 'Verified')}
                                  disabled={isSaving}
                                  className="p-2.5 bg-emerald-100 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-2xl transition-all shadow-sm"
                                  title="Verifikasi"
                                >
                                  <CheckCircle2 size={18} />
                                </button>
                                  <button 
                                    onClick={() => updatePaymentStatus(p.id, 'Wait')}
                                    disabled={isSaving}
                                    className="p-2.5 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-2xl transition-all shadow-sm"
                                    title="Tolak"
                                  >
                                    <X size={18} />
                                  </button>
                                  <button 
                                    onClick={() => setSelectedTicket(p)}
                                    className="px-3 py-1 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl text-[10px] font-black hover:bg-blue-600 hover:text-white shadow-sm transition-all flex items-center gap-1"
                                    title="Lihat Tiket"
                                  >
                                    🎫 TIKET
                                  </button>
                              </>
                            ) : (
                              <>
                                  <button 
                                    onClick={() => setEditingParticipant(p)}
                                    className="p-2.5 bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white rounded-xl transition-all"
                                    title="Edit Data"
                                  >
                                    <Pencil size={16} />
                                  </button>
                                  <button 
                                    onClick={() => setSelectedTicket(p)}
                                    className="px-3 py-1 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl text-[10px] font-black hover:bg-blue-600 hover:text-white shadow-sm transition-all"
                                    title="Lihat Tiket"
                                  >
                                    🎫 TIKET
                                  </button>
                                <button 
                                  onClick={() => resetPassword(p.email)}
                                  className="p-2.5 bg-slate-100 text-slate-600 hover:bg-slate-600 hover:text-white rounded-xl transition-all"
                                  title="Reset Password"
                                >
                                  <Key size={16} />
                                </button>
                                <button 
                                  onClick={() => deleteEntry(p.id, p.full_name)}
                                  disabled={isSaving}
                                  className="p-2.5 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all"
                                  title="Hapus Peserta"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </>
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

        </div>
      </div>

      {/* INSPECTOR LIGHTBOX */}
      {viewImage && (
        <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-2xl flex items-center justify-center p-4 md:p-12 animate-in fade-in duration-300">
           <button 
            onClick={() => setViewImage(null)}
            className="absolute top-8 right-8 w-12 h-12 bg-white/10 hover:bg-rose-500 text-white rounded-full flex items-center justify-center transition-all shadow-2xl"
          >
            <X size={24} />
          </button>
          <img 
            src={viewImage} 
            alt="Payment Receipt" 
            className="max-w-full max-h-full object-contain rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] border-4 border-white/5" 
          />
        </div>
      )}

      {/* EDIT MODAL */}
      {editingParticipant && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
          <div className="bg-white/90 backdrop-blur-2xl border border-white/60 shadow-2xl rounded-[2.5rem] w-full max-w-md p-8 relative">
            <button onClick={() => setEditingParticipant(null)} className="absolute top-6 right-6 text-slate-400 hover:text-red-500 transition-colors">
              <X size={24} />
            </button>
            
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600">
                 <Pencil size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800">Edit Profil Peserta</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Intervensi God Mode</p>
              </div>
            </div>

            <form onSubmit={handleUpdateEntry} className="space-y-5">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Nama Lengkap</label>
                <input 
                  type="text" 
                  value={editingParticipant.full_name} 
                  onChange={(e) => setEditingParticipant({...editingParticipant, full_name: e.target.value})}
                  className="w-full bg-slate-100 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Asal Sekolah</label>
                <input 
                  type="text" 
                  value={editingParticipant.school} 
                  onChange={(e) => setEditingParticipant({...editingParticipant, school: e.target.value})}
                  className="w-full bg-slate-100 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Nomor WhatsApp</label>
                <input 
                  type="text" 
                  value={editingParticipant.phone} 
                  onChange={(e) => setEditingParticipant({...editingParticipant, phone: e.target.value})}
                  className="w-full bg-slate-100 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none font-bold"
                />
              </div>
              
              <button 
                type="submit" 
                disabled={isSaving}
                className="w-full py-4 bg-amber-600 hover:bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
              >
                {isSaving ? <Loader2 className="animate-spin" size={16} /> : "Simpan Perubahan"}
              </button>
            </form>
          </div>
        </div>
      )}
      {/* ========================================= */}
      {/* 🎫 MODAL E-TICKET (LIQUID GLASS ID) */}
      {/* ========================================= */}
      {selectedTicket && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-2xl max-w-sm w-full relative border border-white/60">
            
            {/* Tombol Tutup */}
            <button 
              onClick={() => setSelectedTicket(null)}
              className="absolute -top-4 -right-4 w-10 h-10 bg-rose-500 hover:bg-rose-600 text-white rounded-full font-bold shadow-lg transition-transform hover:scale-110 flex items-center justify-center border-4 border-white"
            >
              <X size={20} />
            </button>

            {/* Area yang akan diubah jadi PNG (The Ticket) */}
            <div id="ncc-ticket" className="relative bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 text-white overflow-hidden shadow-inner aspect-[2/3] flex flex-col justify-between">
              {/* Ornamen Tiket */}
              <div className="absolute top-[-20%] right-[-20%] w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-[-10%] left-[-10%] w-40 h-40 bg-indigo-400/30 rounded-full blur-2xl"></div>
              
              <div>
                {/* Header Tiket */}
                <div className="flex justify-between items-center border-b border-white/20 pb-5 mb-6 relative z-10">
                  <div>
                    <p className="text-[10px] font-black tracking-[0.2em] text-blue-200 uppercase">Official Ticket</p>
                    <h2 className="text-2xl font-black tracking-tighter">NCC 13th</h2>
                  </div>
                  <div className="bg-white/20 px-3 py-1 rounded-full backdrop-blur-md border border-white/20">
                    <p className="text-[9px] font-black uppercase tracking-tight">{selectedTicket.category}</p>
                  </div>
                </div>

                {/* Info Peserta */}
                <div className="space-y-5 relative z-10">
                  <div>
                    <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-1 shadow-sm">Nama Peserta</p>
                    <p className="text-xl font-black leading-tight uppercase">{selectedTicket.full_name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-1">Asal Instansi</p>
                    <p className="text-sm font-bold opacity-90">{selectedTicket.school}</p>
                  </div>
                </div>
              </div>

              {/* QR Code Section */}
              <div className="mt-8 bg-white p-5 rounded-3xl flex items-center justify-between relative z-10 gap-4 shadow-2xl border border-white">
                <div className="w-20 h-20 bg-white shrink-0">
                  {/* Mesin QR Code Generate Otomatis */}
                  <QRCode 
                    value={`NCC13-VERIFIED-${selectedTicket.id}`} 
                    size={100} 
                    style={{ height: "auto", maxWidth: "100%", width: "100%" }} 
                  />
                </div>
                <div className="text-right text-slate-800">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Registration ID</p>
                  <p className="text-xs font-black font-mono break-all leading-tight text-blue-600">NCC-{String(selectedTicket.id).slice(0, 8).toUpperCase()}</p>
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-green-50 text-green-600 rounded-full border border-green-100 mt-2">
                    <CheckCircle2 size={10} />
                    <p className="text-[9px] font-black">VERIFIED</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tombol Aksi */}
            <div className="mt-8">
              <button 
                onClick={downloadTicket}
                className="w-full py-4 bg-indigo-600 hover:bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3"
              >
                <Download size={16} /> Unduh ID Card (PNG)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PORTAL PENILAIAN */}
      {activeTab === "PENILAIAN" && (
        <div className="max-w-7xl mx-auto px-4 pb-20">
          <div className="bg-white/70 backdrop-blur-xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 rounded-[2.5rem] animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">⚖️ Panel Penilaian & Leaderboard</h3>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Sistem Scoring NCC ke-13</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-xs text-slate-400 uppercase tracking-[0.2em] font-black">
                    <th className="pb-6">Peringkat & Peserta</th>
                    <th className="pb-6">Kategori</th>
                    <th className="pb-6 text-center">Skor Akhir (0-100)</th>
                    <th className="pb-6 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-slate-700">
                  {participants
                    .filter(p => categoryFilter === "ALL" || p.category === categoryFilter)
                    .sort((a, b) => (b.score || 0) - (a.score || 0))
                    .map((row, index) => (
                    <tr key={row.id} className="border-b border-slate-50 group hover:bg-slate-50/50 transition-all">
                      <td className="py-6">
                        <div className="flex items-center gap-5">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black shadow-sm ${
                            index === 0 ? "bg-amber-100 text-amber-600 border border-amber-200" : 
                            index === 1 ? "bg-slate-100 text-slate-500 border border-slate-200" : 
                            index === 2 ? "bg-orange-50 text-orange-600 border border-orange-100" : 
                            "bg-slate-50 text-slate-400"
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-black text-slate-800 text-base">{row.full_name}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{row.school}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-6">
                        <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-lg border border-indigo-100 uppercase">{row.category}</span>
                      </td>
                      <td className="py-6">
                        <div className="flex justify-center">
                          <input 
                            type="number" 
                            defaultValue={row.score || ""}
                            id={`score-input-${row.id}`}
                            className="w-24 px-4 py-3 text-center bg-slate-100 border-none rounded-2xl font-black text-emerald-600 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-lg"
                            placeholder="0"
                            min="0"
                            max="100"
                          />
                        </div>
                      </td>
                      <td className="py-6 text-right">
                        <button 
                          disabled={isScoring}
                          onClick={() => {
                            const inputElement = document.getElementById(`score-input-${row.id}`) as HTMLInputElement;
                            if (inputElement) handleSubmitScore(row.id, Number(inputElement.value));
                          }}
                          className="px-6 py-3 bg-emerald-600 hover:bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-200 hover:shadow-none transition-all active:scale-95 disabled:opacity-50"
                        >
                          {isScoring ? "..." : "Kunci Nilai"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
