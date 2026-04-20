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
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fungsi Menarik Data Saat Halaman Dimuat
  useEffect(() => {
    fetchHQData();
  }, []);

  const fetchHQData = async () => {
    setIsLoading(true);
    try {
      // Menarik data pengaturan website dari database
      const { data: settings, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('id', 1)
        .single();

      if (settings) {
        setBroadcastText(settings.live_announcement || "");
        setIsRegOpen(settings.is_registration_open);
      }
      if (error) throw error;
    } catch (error) {
      console.error("Gagal menarik data HQ:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fungsi Menyimpan Pengaturan (God Mode Action)
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
      
      // Update UI langsung jika sukses
      if (newRegStatus !== undefined) setIsRegOpen(newRegStatus);
      alert("✅ Perintah berhasil dieksekusi di database!");
    } catch (error) {
      console.error("Gagal menyimpan:", error);
      alert("❌ Gagal menyimpan data ke server.");
    } finally {
      setIsSaving(false);
    }
  };

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
          {/* Skeleton loading untuk metrik (Nanti kita sambungkan ke tabel competition_entries) */}
          {[
            { title: "Total Pendaftar", value: "---", color: "text-blue-600", icon: "👥" },
            { title: "Terverifikasi", value: "---", color: "text-green-600", icon: "✅" },
            { title: "Menunggu Review", value: "---", color: "text-amber-500", icon: "⏳" },
          ].map((stat, idx) => (
            <div key={idx} className="bg-white/70 backdrop-blur-xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 rounded-3xl flex flex-col justify-between">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">{stat.title}</h3>
                <span className="text-2xl">{stat.icon}</span>
              </div>
              <p className={`text-4xl font-black ${stat.color}`}>{stat.value}</p>
            </div>
          ))}

          {/* Master Switch Panel - TERHUBUNG KE DATABASE */}
          <div className="bg-gradient-to-br from-indigo-500 to-blue-600 shadow-lg p-6 rounded-3xl flex flex-col justify-between text-white relative overflow-hidden">
            {isLoading && <div className="absolute inset-0 bg-black/20 flex items-center justify-center backdrop-blur-sm z-10"><span className="animate-spin text-2xl">⏳</span></div>}
            <h3 className="text-sm font-bold text-indigo-100 uppercase tracking-wider mb-4">Pendaftaran</h3>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black">{isRegOpen ? "OPEN" : "CLOSED"}</span>
              <button 
                onClick={() => saveSettings(!isRegOpen)}
                disabled={isSaving}
                className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 ${isRegOpen ? 'bg-green-400' : 'bg-slate-400/50'}`}
              >
                <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${isRegOpen ? 'translate-x-6' : 'translate-x-0'}`}></div>
              </button>
            </div>
          </div>
        </div>

        {/* ACTION PANELS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* TERMINAL SIARAN - TERHUBUNG KE DATABASE */}
          <div className="lg:col-span-1 bg-white/70 backdrop-blur-xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 rounded-3xl relative">
            {isLoading && <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 rounded-3xl"></div>}
            <h3 className="text-lg font-bold text-slate-800 mb-2">📢 Terminal Siaran</h3>
            <p className="text-sm text-slate-500 mb-6">Teks ini akan tayang di dashboard peserta.</p>
            
            <textarea 
              value={broadcastText}
              onChange={(e) => setBroadcastText(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-32 mb-4"
              placeholder="Ketik pengumuman..."
            ></textarea>
            <button 
              onClick={() => saveSettings()}
              disabled={isSaving}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md flex justify-center items-center gap-2"
            >
              {isSaving ? "Mengirim..." : "Kirim Siaran Global"}
            </button>
          </div>

          {/* TABEL VERIFIKASI (Segera Di-wiring) */}
          <div className="lg:col-span-2 bg-white/70 backdrop-blur-xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 rounded-3xl flex items-center justify-center text-slate-400">
            <div className="text-center">
              <p className="text-4xl mb-2">🚧</p>
              <h3 className="font-bold text-lg text-slate-600">Tabel Verifikasi Peserta</h3>
              <p className="text-sm">Menunggu sinkronisasi data dari tabel competition_entries...</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
