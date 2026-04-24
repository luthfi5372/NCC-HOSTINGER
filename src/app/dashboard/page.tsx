"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client"; 
import { Bell, Megaphone, User, Clock, CheckCircle2, AlertCircle, X, ArrowUpRight, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function UserDashboard() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  // --- MEMORI REGISTRASI PESERTA ---
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    school_name: "",
    nisn: "",
    province: "",
    competition_type: "Olimpiade MIPA",
    mentor_name: ""
  });

  // --- MESIN PENARIK PENGUMUMAN DARI MARKAS BESAR (PINTU CERDAS) ---
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        // 1. Dapatkan Identitas & Status User
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 2. Cek Status Pendaftaran User (untuk filter target_audience)
        const { data: entryData } = await supabase
          .from('competition_entries')
          .select('payment_status')
          .eq('user_id', user.id)
          .single();

        const userStatus = entryData?.payment_status || "Pending";

        // 3. Tarik data pengumuman dengan Filter Berlapis (Pintu Cerdas)
        // Logika: Ambil jika (Target=All) ATAU (Target=Status Anda) ATAU (ID Anda ada di daftar spesifik)
        const { data, error } = await supabase
          .from('announcements')
          .select('*')
          .or(`target_audience.eq.All, target_audience.eq.${userStatus}, target_user_ids.cs.{${user.id}}`)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setAnnouncements(data || []);
      } catch (error) {
        console.error("Gagal menarik pengumuman:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnnouncements();

    // Radar Real-time: Pantau pengumuman baru
    const channel = supabase
      .channel('public:announcements')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'announcements' }, (payload) => {
        setAnnouncements(prev => [payload.new, ...prev]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // --- MESIN TEMPUR: PENGIRIMAN BERKAS REGISTRASI ---
  const handleSubmitEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return alert("⚠️ Mohon unggah bukti transfer terlebih dahulu, Komandan!");

    setIsSubmitting(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;

      if (!user) throw new Error("Sesi berakhir, silakan login kembali.");

      // 1. Upload Foto ke Brankas Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Ambil URL Foto yang baru diupload
      const { data: urlData } = supabase.storage.from('payment-proofs').getPublicUrl(fileName);
      const photoUrl = urlData.publicUrl;

      // 2. Simpan Data ke Tabel competition_entries
      const { error: dbError } = await supabase
        .from('competition_entries')
        .insert([{
          user_id: user.id,
          full_name: user.user_metadata.full_name,
          email: user.email,
          ...formData,
          payment_proof_url: photoUrl,
          payment_status: 'Pending'
        }]);

      if (dbError) throw dbError;

      alert("✅ MISI BERHASIL! Berkas pendaftaran sudah meluncur ke Markas Besar. Mohon tunggu verifikasi admin.");
      setShowForm(false);
      
      // Reset form
      setFile(null);
      setFormData({
        school_name: "",
        nisn: "",
        province: "",
        competition_type: "Olimpiade MIPA",
        mentor_name: ""
      });

    } catch (error: any) {
      alert(`❌ Misi Gagal: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-6 md:p-12 relative overflow-hidden">
      {/* Ornamen Background Liquid Glass */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-400/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-5xl mx-auto relative z-10">
        
        {/* HEADER WELCOME */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4"
        >
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Halo, Peserta NCC! 👋</h1>
            <p className="text-slate-500 font-medium mt-1">Selamat datang di Dasbor Resmi National Creativity Competition 13th.</p>
          </div>
          <div className="flex items-center gap-3 bg-white/60 backdrop-blur-xl border border-white/80 px-4 py-2 rounded-2xl shadow-sm">
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
              P
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status Anda</p>
              <p className="text-sm font-bold text-slate-700 flex items-center gap-1">
                <Clock size={14} className="text-amber-500"/> Menunggu Verifikasi
              </p>
            </div>
          </div>
        </motion.header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* KOLOM KIRI: STATUS & AKSI (Makan 1 Kolom) */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            <div className="bg-white/60 backdrop-blur-xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-6">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <AlertCircle size={18} className="text-blue-500" />
                Langkah Selanjutnya
              </h3>
              <div className="space-y-3">
                <div className="p-3 bg-green-50 border border-green-100 rounded-xl flex items-center gap-3 text-sm">
                  <CheckCircle2 size={16} className="text-green-500" />
                  <span className="font-medium text-green-800">Lengkapi Profil Biodata</span>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-center gap-3 text-sm">
                  <Clock size={16} className="text-amber-500" />
                  <span className="font-medium text-amber-800">Unggah Bukti Transfer</span>
                </div>
              </div>
              <button 
                onClick={() => setShowForm(true)}
                className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-md shadow-blue-200 text-sm active:scale-[0.98]"
              >
                Lengkapi Berkas Sekarang
              </button>
            </div>
          </motion.div>

          {/* KOLOM KANAN: PAPAN PENGUMUMAN DARI MARKAS BESAR (Makan 2 Kolom) */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <div className="bg-white/60 backdrop-blur-xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-8 min-h-[400px]">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200/50">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Megaphone size={22} className="text-blue-600" />
                  Papan Pengumuman Resmi
                </h2>
                <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 animate-pulse">
                  <Bell size={12} /> Live
                </span>
              </div>

              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                  <p className="text-slate-400 font-medium text-sm">Menyinkronkan sinyal dengan Markas Besar...</p>
                </div>
              ) : announcements.length === 0 ? (
                <div className="text-center py-12">
                  <Megaphone size={48} className="mx-auto text-slate-200 mb-4" />
                  <h3 className="text-slate-500 font-bold">Belum Ada Pengumuman</h3>
                  <p className="text-slate-400 text-sm mt-1">Panitia belum menyiarkan informasi apapun saat ini.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {announcements.map((announcement) => {
                    const date = new Date(announcement.created_at);
                    const formattedDate = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
                    const formattedTime = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

                    return (
                      <div key={announcement.id} className="bg-white/80 border border-slate-100 p-5 rounded-2xl hover:shadow-md transition-shadow animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-slate-800 text-lg">{announcement.title}</h3>
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md whitespace-nowrap">
                            {formattedDate} • {formattedTime} WIB
                          </span>
                        </div>
                        <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                          {announcement.content}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>

        </div>
      </div>

      {/* --- MODAL FORM REGISTRASI (LIQUID GLASS) --- */}
      <AnimatePresence>
        {showForm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white/90 backdrop-blur-2xl w-full max-w-2xl rounded-[2.5rem] border border-white/60 p-8 md:p-10 shadow-2xl overflow-y-auto max-h-[90vh] relative"
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight">Finalisasi Pendaftaran</h2>
                  <p className="text-slate-500 text-xs font-medium">Lengkapi biodata dan unggah bukti transfer pendaftaran Anda.</p>
                </div>
                <button 
                  onClick={() => setShowForm(false)} 
                  className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmitEntry} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Asal Sekolah / Instansi</label>
                    <input 
                      required 
                      type="text" 
                      className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-sm" 
                      placeholder="Contoh: SMA Darul Ulum 1" 
                      value={formData.school_name}
                      onChange={(e) => setFormData({...formData, school_name: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">NISN (Nomor Induk Siswa)</label>
                    <input 
                      required 
                      type="number" 
                      className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-sm" 
                      placeholder="Masukkan 10 Digit NISN" 
                      value={formData.nisn}
                      onChange={(e) => setFormData({...formData, nisn: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Cabang Lomba</label>
                    <div className="relative">
                      <select 
                        className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none shadow-sm"
                        value={formData.competition_type}
                        onChange={(e) => setFormData({...formData, competition_type: e.target.value})}
                      >
                        <option>Olimpiade MIPA</option>
                        <option>Speech Contest</option>
                        <option>LKTI Nasional</option>
                        <option>MTQ</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <ArrowUpRight size={16} className="rotate-90" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Provinsi Asal</label>
                    <div className="relative">
                      <select 
                        required 
                        value={formData.province}
                        onChange={(e) => setFormData({...formData, province: e.target.value})}
                        className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none shadow-sm"
                      >
                        <option value="" disabled>Pilih Provinsi...</option>
                        {/* Sumatera */}
                        <option value="Aceh">Aceh</option>
                        <option value="Sumatera Utara">Sumatera Utara</option>
                        <option value="Sumatera Barat">Sumatera Barat</option>
                        <option value="Riau">Riau</option>
                        <option value="Kepulauan Riau">Kepulauan Riau</option>
                        <option value="Jambi">Jambi</option>
                        <option value="Bengkulu">Bengkulu</option>
                        <option value="Sumatera Selatan">Sumatera Selatan</option>
                        <option value="Kepulauan Bangka Belitung">Kepulauan Bangka Belitung</option>
                        <option value="Lampung">Lampung</option>
                        {/* Jawa */}
                        <option value="Banten">Banten</option>
                        <option value="DKI Jakarta">DKI Jakarta</option>
                        <option value="Jawa Barat">Jawa Barat</option>
                        <option value="Jawa Tengah">Jawa Tengah</option>
                        <option value="DI Yogyakarta">DI Yogyakarta</option>
                        <option value="Jawa Timur">Jawa Timur</option>
                        {/* Bali & Nusa Tenggara */}
                        <option value="Bali">Bali</option>
                        <option value="Nusa Tenggara Barat">Nusa Tenggara Barat</option>
                        <option value="Nusa Tenggara Timur">Nusa Tenggara Timur</option>
                        {/* Kalimantan */}
                        <option value="Kalimantan Barat">Kalimantan Barat</option>
                        <option value="Kalimantan Tengah">Kalimantan Tengah</option>
                        <option value="Kalimantan Selatan">Kalimantan Selatan</option>
                        <option value="Kalimantan Timur">Kalimantan Timur</option>
                        <option value="Kalimantan Utara">Kalimantan Utara</option>
                        {/* Sulawesi */}
                        <option value="Sulawesi Utara">Sulawesi Utara</option>
                        <option value="Gorontalo">Gorontalo</option>
                        <option value="Sulawesi Tengah">Sulawesi Tengah</option>
                        <option value="Sulawesi Barat">Sulawesi Barat</option>
                        <option value="Sulawesi Selatan">Sulawesi Selatan</option>
                        <option value="Sulawesi Tenggara">Sulawesi Tenggara</option>
                        {/* Maluku & Papua */}
                        <option value="Maluku Utara">Maluku Utara</option>
                        <option value="Maluku">Maluku</option>
                        <option value="Papua Barat">Papua Barat</option>
                        <option value="Papua Barat Daya">Papua Barat Daya</option>
                        <option value="Papua">Papua</option>
                        <option value="Papua Tengah">Papua Tengah</option>
                        <option value="Papua Pegunungan">Papua Pegunungan</option>
                        <option value="Papua Selatan">Papua Selatan</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <ArrowUpRight size={16} className="rotate-90" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nama Pembina (Opsional)</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-sm" 
                      placeholder="Nama Guru Pembimbing" 
                      value={formData.mentor_name}
                      onChange={(e) => setFormData({...formData, mentor_name: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Bukti Transfer (JPG/PNG)</label>
                    <div className="relative group overflow-hidden">
                      <div className={`border-2 border-dashed ${file ? 'border-emerald-200 bg-emerald-50/50' : 'border-blue-200 bg-blue-50/50'} rounded-xl p-5 text-center transition-all hover:border-blue-400`}>
                        <input 
                          required 
                          type="file" 
                          accept="image/*" 
                          className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                          onChange={(e) => setFile(e.target.files?.[0] || null)} 
                        />
                        <div className="flex flex-col items-center">
                          <Download size={20} className={`${file ? 'text-emerald-500' : 'text-blue-500'} mb-2`} />
                          <p className={`text-[11px] font-bold ${file ? 'text-emerald-600' : 'text-blue-600'} uppercase tracking-tight`}>
                            {file ? file.name : "Klik untuk Pilih Foto"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 pt-4">
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full bg-slate-900 hover:bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-slate-900/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>KIRIM PENDAFTARAN SEKARANG <CheckCircle2 size={18} /></>
                    )}
                  </button>
                  <p className="text-[10px] text-slate-400 text-center mt-4 font-medium uppercase tracking-widest">Data yang dikirim bersifat final dan akan diverifikasi oleh Panitia NCC.</p>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
