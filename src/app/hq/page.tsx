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

// Import Modular Components
import VerificationTab from "@/components/hq/VerificationTab";
import UserRegistryTab from "@/components/hq/UserRegistryTab";
import ScoringTab from "@/components/hq/ScoringTab";
import Sidebar from "@/components/hq/Sidebar";
import StatCard from "@/components/hq/StatCard";
import RingkasanTab from "@/components/hq/RingkasanTab";

export default function HQDashboardLight() {
  const router = useRouter();
  
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
  const [activeTab, setActiveTab] = useState<"RINGKASAN" | "VERIFIKASI" | "USERS" | "PENILAIAN">("RINGKASAN");
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  // State Modals
  const [editingParticipant, setEditingParticipant] = useState<any | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  
  // ... (Keeping all existing functions: ADMIN_EMAILS, fetchHQData, updatePaymentStatus, resetPassword, deleteEntry, etc.)
  const ADMIN_EMAILS = [
    "luthfi5372@gmail.com", 
    "lili@gmail.com", 
    "admin@ncc.id",
    "sekretaris@ncc.id"
  ];

  useEffect(() => {
    const initHQ = async () => {
      setIsLoading(true);
      await fetchHQData();
      setIsLoading(false);
    };
    initHQ();
  }, []);

  const fetchHQData = async () => {
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
    }
  };

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
        `"=""${p.phone}"""`,
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

  const updatePaymentStatus = async (id: string, status: string) => {
    setIsProcessing(id);
    setIsSaving(true);
    try {
      const { error } = await supabase.from('competition_entries').update({ payment_status: status }).eq('id', id);
      if (error) throw error;
      setParticipants(participants.map(p => p.id === id ? { ...p, payment_status: status } : p));
      
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
          }).catch(err => console.error("Gagal mengirim email:", err));
        }
      }
      alert(status === 'Verified' ? "✅ Terverifikasi!" : "❌ Ditolak.");
    } catch (error) {
      alert("❌ Gagal memperbarui status.");
    } finally {
      setIsSaving(false);
      setIsProcessing(null);
    }
  };

  const resetPassword = async (email: string) => {
    if (!window.confirm(`Kirim email reset password ke ${email}?`)) return;
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      alert("✅ Link reset berhasil dikirim!");
    } catch (err: any) {
      alert(`❌ Gagal: ${err.message}`);
    }
  };

  const deleteEntry = async (id: string, name: string) => {
    if (!window.confirm(`⚠️ PERINGATAN: Hapus pendaftaran ${name}?`)) return;
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
      alert("✅ Data diperbarui!");
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

  const [isScoring, setIsScoring] = useState(false);
  const handleSubmitScore = async (id_peserta: string, scoreValue: number) => {
    if (scoreValue < 0 || scoreValue > 100) return alert("Skor 0-100!");
    setIsScoring(true);
    try {
      const { error } = await supabase.from('competition_entries').update({ score: scoreValue }).eq('id', id_peserta);
      if (error) throw error;
      fetchHQData(); 
      alert("✅ Skor dikunci!");
    } catch (error) {
      alert("❌ Gagal menyimpan skor.");
    } finally {
      setIsScoring(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.replace('/login');
    } catch (err) {
      router.replace('/login');
    }
  };

  const categoryData = useMemo(() => {
    return [
      { name: 'MIPA', value: participants.filter(p => p.category === 'Olimpiade MIPA').length },
      { name: 'LKTI', value: participants.filter(p => p.category === 'LKTI Nasional').length },
      { name: 'SPEECH', value: participants.filter(p => p.category === 'Speech Contest').length },
      { name: 'MTQ', value: participants.filter(p => p.category === 'MTQ Nasional').length },
    ].filter(item => item.value > 0);
  }, [participants]);

  const dailyTrendData = useMemo(() => {
    const last14Days = Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toLocaleDateString('en-CA');
    }).reverse();
    const counts: Record<string, number> = {};
    participants.forEach(p => {
      const date = new Date(p.created_at).toLocaleDateString('en-CA');
      counts[date] = (counts[date] || 0) + 1;
    });
    return last14Days.map(date => ({
      date: date.split('-').slice(1).join('/'),
      count: counts[date] || 0
    }));
  }, [participants]);

  const filteredParticipants = useMemo(() => {
    return participants.filter(p => {
      const matchesSearch = 
        p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.school?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === "ALL" || p.category === categoryFilter;
      if (activeTab === "VERIFIKASI") return p.payment_status === 'Pending' && matchesSearch && matchesCategory;
      return matchesSearch && matchesCategory;
    });
  }, [participants, searchQuery, categoryFilter, activeTab]);

  const stats = {
    total: participants.length,
    verified: participants.filter(p => p.payment_status === 'Verified').length,
    pending: participants.filter(p => p.payment_status === 'Pending').length
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans text-slate-800">
      {/* SIDEBAR NAVIGATION */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* TOPBAR / HEADER (MAHA KARYA STYLE) */}
        <header className="h-44 md:h-24 bg-[#F8FAFC]/80 backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between px-8 sticky top-0 z-30 gap-4 py-4 md:py-0 border-b border-white/40">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              {activeTab === "RINGKASAN" ? "Dashboard" : 
               activeTab === "VERIFIKASI" ? "Antrean Verifikasi" : 
               activeTab === "USERS" ? "Data Peserta" : "Panel Penilaian"}
            </h2>
            <p className="text-slate-500 text-xs mt-1 font-medium italic">
               Pantau pergerakan data pendaftaran NCC 13th secara real-time.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* MESIN PENCARI (LIVE SEARCH) */}
            <div className="relative group flex-1 md:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Cari Peserta / ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-100 rounded-xl pl-12 pr-4 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
              />
            </div>

            {/* RADAR FILTER (CATEGORY) */}
            <select 
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-white border border-slate-100 rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm cursor-pointer"
            >
              <option value="ALL">Semua Lomba</option>
              <option value="Olimpiade MIPA">MIPA</option>
              <option value="LKTI Nasional">LKTI</option>
              <option value="Speech Contest">Speech</option>
              <option value="MTQ Nasional">MTQ</option>
            </select>

            <div className="w-px h-8 bg-slate-200 hidden md:block mx-1" />

            {/* Filter Tanggal (Masterpiece Detail) */}
            <div className="hidden lg:flex items-center gap-3 bg-white px-4 py-3 rounded-xl border border-slate-100 text-xs font-black text-slate-600 shadow-sm">
              <Calendar size={16} className="text-slate-400" />
              {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}
            </div>

            {/* Tombol Export */}
            <button 
              onClick={handleExportCSV}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-200 active:scale-95"
            >
              <Download size={16} />
              Export CSV
            </button>

            {/* Notifikasi & Profil (Masterpiece Detail) */}
            <div className="h-12 w-12 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 shadow-sm relative hover:text-blue-600 transition-colors cursor-pointer group">
              <Bell size={20} className="group-hover:rotate-12 transition-transform" />
              <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-bounce"></span>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <div className="p-8 space-y-8 animate-in fade-in duration-700">
          {/* STATS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard title="Total Pendaftar" value={stats.total} icon={Users} color="text-blue-600" isLoading={isLoading} trend={{ value: "+15.5%", isUp: true }} />
            <StatCard title="Terverifikasi" value={stats.verified} icon={ShieldCheck} color="text-green-600" isLoading={isLoading} trend={{ value: "+8.4%", isUp: true }} />
            <StatCard title="Menunggu Review" value={stats.pending} icon={Clock} color="text-amber-500" isLoading={isLoading} trend={{ value: "-10.5%", isUp: false }} />
            
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-2xl shadow-xl shadow-blue-200/50 flex flex-col justify-between text-white relative overflow-hidden group">
               <div className="absolute top-[-20%] right-[-20%] w-20 h-20 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform"></div>
               <div className="flex items-center justify-between mb-2 relative z-10">
                <span className="text-[10px] font-black text-blue-100 uppercase tracking-widest leading-none">Registrasi</span>
                <div className={`px-2 py-0.5 rounded-full text-[9px] font-black ${isRegOpen ? 'bg-emerald-400/20 text-emerald-100' : 'bg-red-400/20 text-red-100'}`}>
                   {isRegOpen ? 'OPEN' : 'CLOSED'}
                </div>
              </div>
              <button 
                onClick={() => saveSettings(!isRegOpen)}
                disabled={isSaving}
                className={`w-full py-2.5 relative z-10 flex items-center justify-center gap-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all bg-white text-blue-700 hover:bg-blue-50 shadow-lg active:scale-95`}
              >
                {isRegOpen ? "Tutup Pendaftaran" : "Buka Pendaftaran"}
              </button>
            </div>
          </div>

          {/* DYNAMIC TAB CONTENT */}
          {activeTab === "RINGKASAN" && (
            <RingkasanTab 
              participants={filteredParticipants}
              categoryData={categoryData}
              dailyTrendData={dailyTrendData}
              isLoading={isLoading}
              updatePaymentStatus={updatePaymentStatus}
              isProcessing={isProcessing}
            />
          )}

          <div className="space-y-6">
            {activeTab === "VERIFIKASI" && (
              <VerificationTab 
                broadcastText={broadcastText}
                setBroadcastText={setBroadcastText}
                isSaving={isSaving}
                saveSettings={saveSettings}
                isLoading={isLoading}
                participants={participants}
                categoryFilter={categoryFilter}
                setCategoryFilter={setCategoryFilter}
                isProcessing={isProcessing}
                setViewImage={setViewImage}
                updatePaymentStatus={updatePaymentStatus}
              />
            )}
            {activeTab === "USERS" && (
              <UserRegistryTab 
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                categoryFilter={categoryFilter}
                setCategoryFilter={setCategoryFilter}
                isLoading={isLoading}
                filteredParticipants={filteredParticipants}
                activeTab={activeTab}
                updatePaymentStatus={updatePaymentStatus}
                setSelectedTicket={setSelectedTicket}
                setEditingParticipant={setEditingParticipant}
                resetPassword={resetPassword}
                deleteEntry={deleteEntry}
                isSaving={isSaving}
              />
            )}
            {activeTab === "PENILAIAN" && (
              <ScoringTab 
                participants={participants}
                categoryFilter={categoryFilter}
                isScoring={isScoring}
                handleSubmitScore={handleSubmitScore}
              />
            )}
          </div>
        </div>
      </main>

      {/* RE-USE MODALS (KEEPING THEM AT TOP LEVEL) */}
      {viewImage && (
        <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-2xl flex items-center justify-center p-4 animate-in fade-in">
           <button onClick={() => setViewImage(null)} className="absolute top-8 right-8 w-12 h-12 bg-white/10 hover:bg-rose-500 text-white rounded-full flex items-center justify-center transition-all"><X size={24} /></button>
           <img src={viewImage} alt="Bukti Transfer" className="max-w-full max-h-full object-contain rounded-[2rem] shadow-2xl border-4 border-white/5" />
        </div>
      )}

      {editingParticipant && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white/90 backdrop-blur-2xl border border-white/60 shadow-2xl rounded-[2.5rem] w-full max-w-md p-8 relative">
            <button onClick={() => setEditingParticipant(null)} className="absolute top-6 right-6 text-slate-400 hover:text-red-500"><X size={24} /></button>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600"><Pencil size={24} /></div>
              <div><h3 className="text-xl font-black text-slate-800">Edit Profil</h3><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">ADMIN OVERRIDE</p></div>
            </div>
            <form onSubmit={handleUpdateEntry} className="space-y-5">
              {['full_name', 'school', 'phone'].map((field) => (
                <div key={field}>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">{field.replace('_', ' ')}</label>
                  <input type="text" value={editingParticipant[field]} onChange={(e) => setEditingParticipant({...editingParticipant, [field]: e.target.value})} className="w-full bg-slate-100 border-none rounded-xl px-4 py-3 text-sm font-bold outline-none" />
                </div>
              ))}
              <button type="submit" disabled={isSaving} className="w-full py-4 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg active:scale-95 flex items-center justify-center gap-2">
                {isSaving ? <Loader2 className="animate-spin" size={16} /> : "Simpan Perubahan"}
              </button>
            </form>
          </div>
        </div>
      )}

      {selectedTicket && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in">
          <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl max-w-sm w-full relative border border-white/60">
            <button onClick={() => setSelectedTicket(null)} className="absolute -top-4 -right-4 w-10 h-10 bg-rose-500 text-white rounded-full font-bold shadow-lg flex items-center justify-center border-4 border-white"><X size={20} /></button>
            <div id="ncc-ticket" className="relative bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 text-white overflow-hidden aspect-[2/3] flex flex-col justify-between">
              <div className="absolute top-[-20%] right-[-20%] w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
              <div>
                <div className="flex justify-between items-center border-b border-white/20 pb-5 mb-6">
                  <div><p className="text-[10px] font-black tracking-widest text-blue-200">Official Ticket</p><h2 className="text-2xl font-black">NCC 13th</h2></div>
                  <div className="bg-white/20 px-3 py-1 rounded-full"><p className="text-[9px] font-black uppercase">{selectedTicket.category}</p></div>
                </div>
                <div className="space-y-4">
                  <div><p className="text-[10px] font-black text-blue-200 uppercase mb-1">Nama</p><p className="text-xl font-black uppercase">{selectedTicket.full_name}</p></div>
                  <div><p className="text-[10px] font-black text-blue-200 uppercase mb-1">Instansi</p><p className="text-sm font-bold">{selectedTicket.school}</p></div>
                </div>
              </div>
              <div className="bg-white p-5 rounded-3xl flex items-center justify-between gap-4 shadow-2xl">
                <div className="w-20 h-20 bg-white"><QRCode value={`NCC13-VERIFIED-${selectedTicket.id}`} size={100} style={{ width: "100%" }} /></div>
                <div className="text-right text-slate-800">
                  <p className="text-[9px] font-black text-slate-400">REG ID</p>
                  <p className="text-xs font-black font-mono text-blue-600">NCC-{String(selectedTicket.id).slice(0, 8).toUpperCase()}</p>
                </div>
              </div>
            </div>
            <button onClick={downloadTicket} className="mt-8 w-full py-4 bg-indigo-600 hover:bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl active:scale-95 flex items-center justify-center gap-3"><Download size={16} /> Unduh PNG</button>
          </div>
        </div>
      )}
    </div>
  );
}

      {/* MODALS */}
      {viewImage && (
        <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-2xl flex items-center justify-center p-4 animate-in fade-in">
           <button onClick={() => setViewImage(null)} className="absolute top-8 right-8 w-12 h-12 bg-white/10 hover:bg-rose-500 text-white rounded-full flex items-center justify-center transition-all"><X size={24} /></button>
           <img src={viewImage} alt="Bukti Transfer" className="max-w-full max-h-full object-contain rounded-[2rem] shadow-2xl border-4 border-white/5" />
        </div>
      )}

      {editingParticipant && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white/90 backdrop-blur-2xl border border-white/60 shadow-2xl rounded-[2.5rem] w-full max-w-md p-8 relative">
            <button onClick={() => setEditingParticipant(null)} className="absolute top-6 right-6 text-slate-400 hover:text-red-500"><X size={24} /></button>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600"><Pencil size={24} /></div>
              <div><h3 className="text-xl font-black text-slate-800">Edit Profil</h3><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">ADMIN OVERRIDE</p></div>
            </div>
            <form onSubmit={handleUpdateEntry} className="space-y-5">
              {['full_name', 'school', 'phone'].map((field) => (
                <div key={field}>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">{field.replace('_', ' ')}</label>
                  <input type="text" value={editingParticipant[field]} onChange={(e) => setEditingParticipant({...editingParticipant, [field]: e.target.value})} className="w-full bg-slate-100 border-none rounded-xl px-4 py-3 text-sm font-bold outline-none" />
                </div>
              ))}
              <button type="submit" disabled={isSaving} className="w-full py-4 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg active:scale-95 flex items-center justify-center gap-2">
                {isSaving ? <Loader2 className="animate-spin" size={16} /> : "Simpan Perubahan"}
              </button>
            </form>
          </div>
        </div>
      )}

      {selectedTicket && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in">
          <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl max-w-sm w-full relative border border-white/60">
            <button onClick={() => setSelectedTicket(null)} className="absolute -top-4 -right-4 w-10 h-10 bg-rose-500 text-white rounded-full font-bold shadow-lg flex items-center justify-center border-4 border-white"><X size={20} /></button>
            <div id="ncc-ticket" className="relative bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 text-white overflow-hidden aspect-[2/3] flex flex-col justify-between">
              <div className="absolute top-[-20%] right-[-20%] w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
              <div>
                <div className="flex justify-between items-center border-b border-white/20 pb-5 mb-6">
                  <div><p className="text-[10px] font-black tracking-widest text-blue-200">Official Ticket</p><h2 className="text-2xl font-black">NCC 13th</h2></div>
                  <div className="bg-white/20 px-3 py-1 rounded-full"><p className="text-[9px] font-black uppercase">{selectedTicket.category}</p></div>
                </div>
                <div className="space-y-4">
                  <div><p className="text-[10px] font-black text-blue-200 uppercase mb-1">Nama</p><p className="text-xl font-black uppercase">{selectedTicket.full_name}</p></div>
                  <div><p className="text-[10px] font-black text-blue-200 uppercase mb-1">Instansi</p><p className="text-sm font-bold">{selectedTicket.school}</p></div>
                </div>
              </div>
              <div className="bg-white p-5 rounded-3xl flex items-center justify-between gap-4 shadow-2xl">
                <div className="w-20 h-20 bg-white"><QRCode value={`NCC13-VERIFIED-${selectedTicket.id}`} size={100} style={{ width: "100%" }} /></div>
                <div className="text-right text-slate-800">
                  <p className="text-[9px] font-black text-slate-400">REG ID</p>
                  <p className="text-xs font-black font-mono text-blue-600">NCC-{String(selectedTicket.id).slice(0, 8).toUpperCase()}</p>
                </div>
              </div>
            </div>
            <button onClick={downloadTicket} className="mt-8 w-full py-4 bg-indigo-600 hover:bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl active:scale-95 flex items-center justify-center gap-3"><Download size={16} /> Unduh PNG</button>
          </div>
        </div>
      )}
    </div>
  );
}
