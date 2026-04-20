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
  
  // State Data Real-Time
  const [broadcastText, setBroadcastText] = useState("");
  const [isRegOpen, setIsRegOpen] = useState(true);
  const [participants, setParticipants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [viewImage, setViewImage] = useState<string | null>(null);

  // Fungsi Menarik Data Saat Halaman Dimuat
  useEffect(() => {
    fetchHQData();
  }, []);

  const fetchHQData = async () => {
    setIsLoading(true);
    try {
      // 1. Ambil Pengaturan
      const { data: settings } = await supabase
        .from('site_settings')
        .select('*')
        .eq('id', 1)
        .single();

      if (settings) {
        setBroadcastText(settings.live_announcement || "");
        setIsRegOpen(settings.is_registration_open);
      }

      // 2. Ambil Data Peserta
      const { data: entries } = await supabase
        .from('competition_entries')
        .select('*')
        .order('created_at', { ascending: false });

      if (entries) setParticipants(entries);

    } catch (error) {
      console.error("Gagal menarik data HQ:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fungsi Menyimpan Pengaturan (Broadcast/Switch)
  const saveSettings = async (newRegStatus?: boolean) => {
    setIsSaving(true);
    const updatedRegStatus = newRegStatus !== undefined ? newRegStatus : isRegOpen;
    
    try {
      const { error } = await supabase
        .from('site_settings')
        .update({ 
          live_announcement: broadcastText,
          is_registration_open: updatedRegStatus
        })
        .eq('id', 1);

      if (error) throw error;
      if (newRegStatus !== undefined) setIsRegOpen(newRegStatus);
      alert("✅ Pengaturan berhasil diperbarui!");
    } catch (error) {
      alert("❌ Gagal menyimpan pengaturan.");
    } finally {
      setIsSaving(false);
    }
  };

  // Fungsi Verifikasi Pembayaran (Accept/Reject)
  const updatePaymentStatus = async (id: string, status: string) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('competition_entries')
        .update({ payment_status: status })
        .eq('id', id);

      if (error) throw error;
      
      // Update local state agar instan
      setParticipants(participants.map(p => p.id === id ? { ...p, payment_status: status } : p));
      
      // Jika diverifikasi, kirim notifikasi email (Phase 6 legacy trigger)
      if (status === 'Verified') {
        const p = participants.find(part => part.id === id);
        fetch("/api/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: p.email, fullName: p.full_name, type: 'VERIFIED' })
        }).catch(() => {});
      }

    } catch (error) {
      alert("❌ Gagal memperbarui status pembayaran.");
    } finally {
      setIsSaving(false);
    }
  };

  // Kalkulasi Metrik
  const stats = {
    total: participants.length,
    verified: participants.filter(p => p.payment_status === 'Verified').length,
    pending: participants.filter(p => p.payment_status === 'Paid').length
  };

  // Antrean Verifikasi (Filter status 'Paid')
  const queue = participants.filter(p => p.payment_status === 'Paid');

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-800 font-sans p-4 md:p-8 relative overflow-hidden">
      
      {/* Ornamen Latar */}
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
            <h1 className="text-3xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              NCC COMMAND CENTER
            </h1>
          </div>
          <div className="flex gap-4 mt-4 md:mt-0">
            <button 
              onClick={() => {
                document.cookie = "ncc_bypass=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                supabase.auth.signOut().then(() => router.push('/login'));
              }}
              className="px-5 py-2.5 bg-red-50 text-red-600 border border-red-100 rounded-xl font-semibold shadow-sm hover:bg-red-100 transition-all text-sm"
            >
              Keluar Sistem
            </button>
          </div>
        </div>

        {/* METRICS & MASTER SWITCH */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { title: "Total Pendaftar", value: stats.total, color: "text-blue-600", icon: "👥" },
            { title: "Terverifikasi", value: stats.verified, color: "text-green-600", icon: "✅" },
            { title: "Menunggu Review", value: stats.pending, color: "text-amber-500", icon: "⏳" },
          ].map((stat, idx) => (
            <div key={idx} className="bg-white/70 backdrop-blur-xl border border-white/60 shadow-sm p-6 rounded-3xl flex flex-col justify-between">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">{stat.title}</h3>
                <span className="text-2xl">{stat.icon}</span>
              </div>
              <p className={`text-4xl font-black ${stat.color}`}>
                {isLoading ? "..." : stat.value.toLocaleString()}
              </p>
            </div>
          ))}

          {/* Master Switch Panel */}
          <div className="bg-gradient-to-br from-indigo-500 to-blue-600 shadow-lg p-6 rounded-3xl flex flex-col justify-between text-white relative overflow-hidden">
            {isLoading && <div className="absolute inset-0 bg-black/10 backdrop-blur-sm z-10 flex items-center justify-center"><span className="animate-spin text-xl">🌀</span></div>}
            <h3 className="text-sm font-bold text-indigo-100 uppercase tracking-wider mb-4">Pendaftaran</h3>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black">{isRegOpen ? "OPEN" : "CLOSED"}</span>
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
          
          {/* TERMINAL SIARAN */}
          <div className="lg:col-span-1 bg-white/70 backdrop-blur-xl border border-white/60 shadow-sm p-6 rounded-3xl relative">
            {isLoading && <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 rounded-3xl"></div>}
            <h3 className="text-lg font-bold text-slate-800 mb-2">📢 Terminal Siaran</h3>
            <p className="text-sm text-slate-500 mb-6">Teks tayang di dashboard peserta.</p>
            
            <textarea 
              value={broadcastText}
              onChange={(e) => setBroadcastText(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-32 mb-4"
              placeholder="Ketik pengumuman..."
            ></textarea>
            <button 
              onClick={() => saveSettings()}
              disabled={isSaving}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md"
            >
              {isSaving ? "Sinkronisasi..." : "Kirim Siaran Global"}
            </button>
          </div>

          {/* TABEL VERIFIKASI PEMBAYARAN */}
          <div className="lg:col-span-2 bg-white/70 backdrop-blur-xl border border-white/60 shadow-sm p-6 rounded-3xl overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800">⚡ Antrean Verifikasi Pembayaran</h3>
              <span className="px-3 py-1 bg-amber-100 text-amber-600 rounded-full text-xs font-bold">
                {queue.length} Tertunda
              </span>
            </div>
            
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider">
                    <th className="pb-3 font-semibold">Nama Peserta</th>
                    <th className="pb-3 font-semibold">Kategori</th>
                    <th className="pb-3 font-semibold">Bukti TF</th>
                    <th className="pb-3 font-semibold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-slate-700">
                  {isLoading ? (
                    <tr><td colSpan={4} className="py-10 text-center text-slate-400">Memuat antrean...</td></tr>
                  ) : queue.length === 0 ? (
                    <tr><td colSpan={4} className="py-10 text-center text-slate-400 font-medium">✨ Antrean Bersih. Semua pembayaran sudah diverifikasi.</td></tr>
                  ) : (
                    queue.map((p) => (
                      <tr key={p.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                        <td className="py-4">
                          <div className="font-bold text-slate-800">{p.full_name}</div>
                          <div className="text-[10px] text-slate-400 uppercase tracking-widest">{p.email}</div>
                        </td>
                        <td className="py-4">
                          <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-md text-[10px] font-black uppercase">
                            {p.category}
                          </span>
                        </td>
                        <td className="py-4">
                          {p.payment_proof_url ? (
                            <button 
                              onClick={() => setViewImage(p.payment_proof_url)}
                              className="text-blue-500 hover:underline font-bold text-xs"
                            >
                              Lihat Gambar
                            </button>
                          ) : (
                            <span className="text-slate-300 italic text-xs">Tidak ada file</span>
                          )}
                        </td>
                        <td className="py-4 text-right">
                          <div className="flex justify-end gap-2">
                             <button 
                              onClick={() => updatePaymentStatus(p.id, 'Verified')}
                              disabled={isSaving}
                              className="p-2 bg-green-100 text-green-600 hover:bg-green-600 hover:text-white rounded-xl transition-all"
                              title="Terima"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                            </button>
                            <button 
                              onClick={() => updatePaymentStatus(p.id, 'Wait')}
                              disabled={isSaving}
                              className="p-2 bg-red-100 text-red-600 hover:bg-red-600 hover:text-white rounded-xl transition-all"
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

      {/* LIGHTBOX INSPECTOR */}
      {viewImage && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-8">
           <button 
            onClick={() => setViewImage(null)}
            className="absolute top-10 right-10 text-white/50 hover:text-white text-4xl"
          >
            &times;
          </button>
          <img src={viewImage} alt="Bukti Transfer" className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl border-4 border-white/10" />
        </div>
      )}

    </div>
  );
}
