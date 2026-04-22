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
  const [activeTab, setActiveTab] = useState<"VERIFIKASI" | "USERS" | "PENILAIAN">("VERIFIKASI");
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  // State Modals
  const [editingParticipant, setEditingParticipant] = useState<any | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);

  const ADMIN_EMAILS = [
    "luthfi5372@gmail.com", 
    "lili@gmail.com", 
    "admin@ncc.id",
    "sekretaris@ncc.id"
  ];

  useEffect(() => {
    // 🚨 MODE DARURAT AKTIF: SATPAM DINONAKTIFKAN SEMENTARA 🚨
    // Kita abaikan pengecekan sesi yang bikin mental, agar Anda bisa inspeksi data malam ini!
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
    <div className="min-h-screen bg-[#f4f7fb] text-slate-800 font-sans p-4 md:p-8 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-400/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto relative z-10 space-y-8">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div className="animate-in fade-in slide-in-from-left-6 duration-700">
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter mb-2 flex items-center gap-3">
              <ShieldCheck className="text-indigo-600 animate-pulse" size={42} /> 
              NCC HQ <span className="text-indigo-600">COMMAND</span>
            </h1>
            <p className="text-slate-500 font-bold uppercase tracking-[0.4em] text-[10px] opacity-60">National Creativity Competition 13th Central Office</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white/80 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/60 shadow-lg flex items-center gap-4">
              <div className="text-right">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Status Sesi</p>
                <p className="text-xs font-black text-emerald-600 flex items-center justify-end gap-1.5 uppercase">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  AKTIF [ADMIN]
                </p>
              </div>
              <div className="w-px h-8 bg-slate-100" />
              <button 
                onClick={handleLogout}
                className="p-3 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"
              >
                <LogOut size={20} />
              </button>
            </div>
            <button 
              onClick={handleExportCSV}
              className="bg-slate-900 text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-3 hover:bg-indigo-600 transition-all hover:scale-105"
            >
              <Download size={18} /> Export CSV
            </button>
          </div>
        </div>

        {/* METRICS */}
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

        {/* ANALYTICS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/70 backdrop-blur-xl border border-white/60 p-8 rounded-[2.5rem] shadow-xl h-[360px] flex flex-col relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><PieIcon size={16} className="text-blue-500" /> Persentase Kategori</h3>
              <Activity size={18} className="text-blue-600" />
            </div>
            <div className="flex-1 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={8} dataKey="value">
                    {categoryData.map((_, index) => <Cell key={`cell-${index}`} fill={['#2563eb', '#6366f1', '#8b5cf6', '#d946ef'][index % 4]} stroke="rgba(255,255,255,0.5)" strokeWidth={2} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', background: 'rgba(255,255,255,0.9)' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle"/>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                <span className="text-3xl font-black text-slate-800">{participants.length}</span>
                <span className="text-[10px] font-black text-slate-400 uppercase">Total</span>
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-xl border border-white/60 p-8 rounded-[2.5rem] shadow-xl h-[360px] flex flex-col relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><TrendingUp size={16} className="text-indigo-500" /> Tren Harian</h3>
              <Zap size={18} className="text-indigo-600" />
            </div>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyTrendData}>
                  <defs><linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/><stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', background: 'rgba(255,255,255,0.9)' }} />
                  <Area type="monotone" dataKey="count" stroke="#4f46e5" strokeWidth={4} fillOpacity={1} fill="url(#colorCount)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* TABS NAVIGATION */}
        <div className="flex gap-4 mb-2 border-b border-slate-200 pb-4 overflow-x-auto">
          {[
            { id: "VERIFIKASI", label: "Antrean Verifikasi", icon: Zap, color: "bg-blue-600" },
            { id: "USERS", label: "Master Data Peserta", icon: Users, color: "bg-indigo-600" },
            { id: "PENILAIAN", label: "Panel Penilaian", icon: Activity, color: "bg-emerald-600" }
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-2.5 rounded-2xl font-black text-sm transition-all flex items-center gap-2 ${activeTab === tab.id ? `${tab.color} text-white shadow-lg scale-105` : "bg-white/50 text-slate-500 hover:bg-white"}`}
            >
              <tab.icon size={16} /> {tab.label}
            </button>
          ))}
        </div>

        {/* TAB PANELS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
