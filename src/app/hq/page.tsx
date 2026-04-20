"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from '@supabase/ssr';

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

  // Logic Radar (Filtering)
  const filteredQueue = participants.filter(p => {
    const isPaid = p.payment_status === 'Paid';
    const matchesSearch = 
      p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.school?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "ALL" || p.category === categoryFilter;
    
    return isPaid && matchesSearch && matchesCategory;
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
              📥 Export CSV
            </button>
            <button 
              onClick={() => {
                document.cookie = "ncc_bypass=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                supabase.auth.signOut().then(() => router.push('/login'));
              }}
              className="px-5 py-2.5 bg-red-50 text-red-600 border border-red-100 rounded-xl font-bold shadow-sm hover:bg-red-100 transition-all text-sm"
            >
              Log Out
            </button>
          </div>
        </div>

        {/* METRICS & SWITCH */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { title: "Total Pendaftar", value: stats.total, color: "text-blue-600", icon: "👥" },
            { title: "Terverifikasi", value: stats.verified, color: "text-green-600", icon: "✅" },
            { title: "Menunggu Review", value: stats.pending, color: "text-amber-500", icon: "⏳" },
          ].map((stat, idx) => (
            <div key={idx} className="bg-white/70 backdrop-blur-xl border border-white/60 shadow-sm p-6 rounded-3xl flex flex-col justify-between hover:scale-[1.02] transition-transform">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.title}</h3>
                <span className="text-2xl">{stat.icon}</span>
              </div>
              <p className={`text-4xl font-black ${stat.color}`}>{isLoading ? "..." : stat.value.toLocaleString()}</p>
            </div>
          ))}

          <div className="bg-gradient-to-br from-indigo-500 to-blue-600 shadow-lg p-6 rounded-3xl flex flex-col justify-between text-white relative overflow-hidden group">
            {isLoading && <div className="absolute inset-0 bg-black/10 backdrop-blur-sm z-10 flex items-center justify-center"><span className="animate-spin">🌀</span></div>}
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

        {/* ACTION PANELS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* BROADCAST CENTER */}
          <div className="lg:col-span-1 bg-white/70 backdrop-blur-xl border border-white/60 shadow-sm p-6 rounded-3xl relative">
            {isLoading && <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 rounded-3xl"></div>}
            <h3 className="text-lg font-bold text-slate-800 mb-2">📢 Terminal Siaran</h3>
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

          {/* VERIFICATION RADAR */}
          <div className="lg:col-span-2 bg-white/70 backdrop-blur-xl border border-white/60 shadow-sm p-6 rounded-3xl overflow-hidden flex flex-col">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <div>
                <h3 className="text-lg font-bold text-slate-800">⚡ Antrean Verifikasi</h3>
                <p className="text-xs text-slate-500 font-medium">Radar peninjauan bukti transfer pendaftar.</p>
              </div>
              
              {/* Management HUD: Search & Filter */}
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Nama / Sekolah..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full sm:w-48 bg-white/50 border border-slate-200 rounded-xl px-4 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
                <select 
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-white/50 border border-slate-200 rounded-xl px-4 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer"
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
                  <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="pb-4">Nama Peserta</th>
                    <th className="pb-4">Kategori</th>
                    <th className="pb-4">Bukti TF</th>
                    <th className="pb-4 text-right">Perintah</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {isLoading ? (
                    <tr><td colSpan={4} className="py-12 text-center text-slate-400 animate-pulse">Scanning database...</td></tr>
                  ) : filteredQueue.length === 0 ? (
                    <tr><td colSpan={4} className="py-12 text-center text-slate-400 font-bold italic">Radar bersih. Tidak ada data yang sesuai.</td></tr>
                  ) : (
                    filteredQueue.map((p) => (
                      <tr key={p.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-100/30 transition-all group">
                        <td className="py-5">
                          <div className="font-bold text-slate-800">{p.full_name}</div>
                          <div className="text-[10px] text-slate-400 font-bold">{p.school}</div>
                        </td>
                        <td className="py-5">
                          <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg text-[9px] font-black uppercase tracking-tighter">
                            {p.category}
                          </span>
                        </td>
                        <td className="py-5">
                          {p.payment_proof_url ? (
                            <button 
                              onClick={() => setViewImage(p.payment_proof_url)}
                              className="text-blue-500 hover:text-blue-700 font-black text-[10px] uppercase underline decoration-2 underline-offset-4"
                            >
                              Buka Dokumen
                            </button>
                          ) : (
                            <span className="text-slate-300 italic text-[10px]">No File</span>
                          )}
                        </td>
                        <td className="py-5 text-right">
                          <div className="flex justify-end gap-2">
                             <button 
                              onClick={() => updatePaymentStatus(p.id, 'Verified')}
                              disabled={isSaving}
                              className="p-2.5 bg-emerald-100 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-2xl transition-all shadow-sm"
                              title="Setujui"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                            </button>
                            <button 
                              onClick={() => updatePaymentStatus(p.id, 'Wait')}
                              disabled={isSaving}
                              className="p-2.5 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-2xl transition-all shadow-sm"
                              title="Tolak"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
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
            &times;
          </button>
          <img 
            src={viewImage} 
            alt="Payment Receipt" 
            className="max-w-full max-h-full object-contain rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] border-4 border-white/5" 
          />
        </div>
      )}

    </div>
  );
}
