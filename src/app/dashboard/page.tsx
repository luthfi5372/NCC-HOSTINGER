"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase"; 
import { Bell, Megaphone, User, Clock, CheckCircle2, AlertCircle, LogOut, IdCard, Printer, Calendar, BookOpen, Image as ImageIcon, MessageCircle } from "lucide-react";

export default function UserDashboard() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userEntry, setUserEntry] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const router = useRouter();

  // --- 🚪 FUNGSI PINTU EVAKUASI ---
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [showIdCard, setShowIdCard] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    school_name: "",
    nisn: "",
    province: "",
    competition_type: "Olimpiade MIPA",
    mentor_name: "",
    team_name: "",
    participant2_name: "",
    participant2_nisn: ""
  });

  // Notifikasi Toast
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3500);
  };

  // MESIN PENARIK DATA UTAMA
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: authData } = await supabase.auth.getUser();
        const user = authData?.user;
        
        if (!user) {
          setIsLoading(false);
          return;
        }
        
        setCurrentUser(user);

        // Tarik data peserta dengan aman
        const { data: entryData } = await supabase
          .from('competition_entries')
          .select('*')
          .eq('user_id', user.id)
          .single();
          
        if (entryData) {
          setUserEntry(entryData);
        }
        
        const userStatus = entryData?.payment_status === 'Verified' ? 'Verified' : 'Pending';

        // Tarik pengumuman dengan aman
        const { data: announcementsData } = await supabase
          .from('announcements')
          .select('*')
          .or(`target_audience.eq.All,target_audience.eq.${userStatus},target_user_ids.cs.{${user.id}}`)
          .order('created_at', { ascending: false });

        setAnnouncements(announcementsData || []);
        
      } catch (error) {
        console.error("Gagal menarik data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // MESIN PENGIRIM FORM
  const handleSubmitEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return showToast("Mohon unggah bukti transfer terlebih dahulu!", "error");
    
    // --- 🛡️ KATUP KEAMANAN: UKURAN FILE ---
    if (file.size > 2 * 1024 * 1024) { // Batas maksimal 2 MB
      return showToast("⚠️ Ukuran foto maksimal 2MB agar sistem tidak melambat!", "error");
    }

    setIsSubmitting(true);
    try {
      if (!currentUser) throw new Error("Sesi berakhir, silakan login kembali.");

      const fileExt = file.name.split('.').pop();
      const fileName = `${currentUser.id}-${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('payment-proofs').getPublicUrl(fileName);
      const photoUrl = urlData.publicUrl;

      const isTeam = formData?.competition_type === "Olimpiade MIPA" || formData?.competition_type === "LKTI Nasional";

      const { error: dbError } = await supabase
        .from('competition_entries')
        .insert([{
          user_id: currentUser.id,
          full_name: currentUser?.user_metadata?.full_name || "Peserta",
          email: currentUser.email,
          school_name: formData.school_name,
          nisn: formData.nisn,
          province: formData.province,
          competition_type: formData.competition_type,
          mentor_name: formData.mentor_name,
          team_name: isTeam ? formData.team_name : null,
          participant2_name: isTeam ? formData.participant2_name : null,
          participant2_nisn: isTeam ? formData.participant2_nisn : null,
          payment_proof_url: photoUrl,
          payment_status: 'Pending'
        }]);

      if (dbError) throw dbError;

      showToast("Pendaftaran Berhasil! Menunggu verifikasi admin.", "success");
      
      // Update UI langsung tanpa refresh
      setUserEntry({ ...formData, payment_status: 'Pending', id: 'new-entry-temp' });
      setTimeout(() => setShowForm(false), 1500); 

    } catch (error: any) {
      showToast(`Gagal Mengirim: ${error.message}`, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isTeamEvent = formData?.competition_type === "Olimpiade MIPA" || formData?.competition_type === "LKTI Nasional";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-6 md:p-12 relative overflow-hidden">
      {/* Ornamen Background - Optimized for performance */}
      <div className="absolute top-[-5%] left-[-5%] w-64 h-64 bg-blue-400/10 rounded-full blur-2xl pointer-events-none"></div>
      <div className="absolute bottom-[-5%] right-[-2%] w-64 h-64 bg-indigo-400/10 rounded-full blur-2xl pointer-events-none"></div>

      <div className="max-w-5xl mx-auto relative z-10">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Halo, Peserta NCC! 👋</h1>
            <p className="text-slate-500 font-medium mt-1">Selamat datang di Dasbor Resmi National Creativity Competition 13th.</p>
          </div>
          
          {/* Bagian Kanan Header (Status + Logout) */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 bg-white/90 backdrop-blur-md border border-white/80 px-4 py-2 rounded-2xl shadow-sm">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                {currentUser?.user_metadata?.full_name?.charAt(0)?.toUpperCase() || "P"}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status Anda</p>
                <div className="text-sm font-bold text-slate-700 flex items-center gap-1">
                  {userEntry?.payment_status === 'Verified' ? (
                    <><CheckCircle2 size={14} className="text-blue-600"/> Terverifikasi</>
                  ) : userEntry?.payment_status === 'Pending' ? (
                    <><Clock size={14} className="text-amber-500"/> Menunggu Verifikasi</>
                  ) : (
                    <><AlertCircle size={14} className="text-slate-500"/> Belum Daftar Lomba</>
                  )}
                </div>
              </div>
            </div>

            {/* Tombol Logout Kaca */}
            <button 
              onClick={handleLogout}
              title="Keluar dari Akun"
              className="p-3 bg-white/90 backdrop-blur-md border border-white/80 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-2xl shadow-sm transition-all flex items-center justify-center active:scale-95"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* KOLOM KIRI: STATUS & AKSI */}
          <div className="space-y-6">
            
            {!userEntry && (
              <div className="bg-white/90 backdrop-blur-md border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-6">
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
                <button onClick={() => setShowForm(true)} className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-md shadow-blue-200 text-sm">
                  Lengkapi Berkas Sekarang
                </button>
              </div>
            )}

            {userEntry?.payment_status === 'Pending' && (
              <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl p-6 text-white shadow-lg shadow-amber-200 relative overflow-hidden">
                <div className="absolute top-[-10%] right-[-10%] w-32 h-32 bg-white/20 rounded-full blur-2xl pointer-events-none"></div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md"><Clock size={24} className="text-white" /></div>
                  <h3 className="font-bold text-lg">Proses Verifikasi</h3>
                </div>
                <p className="text-sm text-amber-50 font-medium leading-relaxed mb-4">
                  Berkas pendaftaran <strong className="text-white bg-white/20 px-1 rounded">{userEntry?.competition_type || "Kompetisi"}</strong> Anda sedang diperiksa oleh Markas Besar. 
                </p>
                <div className="bg-black/10 rounded-xl p-3 text-xs font-bold uppercase tracking-wider text-center border border-white/20">
                  Mohon Tunggu 1x24 Jam
                </div>
              </div>
            )}

            {userEntry?.payment_status === 'Verified' && (
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-lg shadow-blue-200 relative overflow-hidden">
                <div className="absolute top-[-10%] right-[-10%] w-32 h-32 bg-white/20 rounded-full blur-2xl pointer-events-none"></div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md"><CheckCircle2 size={24} className="text-white" /></div>
                  <h3 className="font-bold text-lg">Resmi Terdaftar!</h3>
                </div>
                <p className="text-sm text-blue-100 font-medium leading-relaxed mb-4">
                  Selamat! Anda telah resmi menjadi peserta NCC 13th cabang <strong className="text-white">{userEntry?.competition_type || "Kompetisi"}</strong>.
                </p>
                <div className="bg-black/20 rounded-xl p-3 text-xs font-bold tracking-wide text-center border border-white/20 font-mono">
                  ID: NCC-{userEntry?.id ? String(userEntry.id).substring(0,6).toUpperCase() : "XXXXXX"}
                </div>
                
                {/* 👇 TOMBOL ID CARD BARU 👇 */}
                <button 
                  onClick={() => setShowIdCard(true)}
                  className="mt-4 w-full bg-white/20 hover:bg-white/30 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm border border-white/30"
                >
                  <IdCard size={18} /> Lihat & Cetak ID Card
                </button>
              </div>
            )}

            {/* --- WIDGET BARU: PUSAT UNDUHAN & HELPDESK --- */}
            <div className="grid grid-cols-1 gap-4 mt-6">
              <a href="#" target="_blank" className="flex items-center gap-4 p-4 bg-white/60 backdrop-blur-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 rounded-2xl transition-all group shadow-sm">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <BookOpen size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Buku Panduan</h4>
                  <p className="text-[11px] font-medium text-slate-500 mt-0.5">Syarat & Ketentuan Lomba (PDF)</p>
                </div>
              </a>

              <a href="#" target="_blank" className="flex items-center gap-4 p-4 bg-white/60 backdrop-blur-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50/50 rounded-2xl transition-all group shadow-sm">
                <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ImageIcon size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Twibbon Resmi</h4>
                  <p className="text-[11px] font-medium text-slate-500 mt-0.5">Unduh aset untuk kampanye IG</p>
                </div>
              </a>

              <a href="https://wa.me/6281234567890" target="_blank" className="flex items-center gap-4 p-4 bg-white/60 backdrop-blur-xl border border-slate-200 hover:border-green-300 hover:bg-green-50/50 rounded-2xl transition-all group shadow-sm">
                <div className="w-10 h-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <MessageCircle size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Hubungi Panitia</h4>
                  <p className="text-[11px] font-medium text-slate-500 mt-0.5">Bantuan kendala pendaftaran (WA)</p>
                </div>
              </a>
            </div>
          </div>

          {/* KOLOM KANAN: PAPAN PENGUMUMAN */}
          <div className="lg:col-span-2">
            <div className="bg-white/90 backdrop-blur-md border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-8 min-h-[400px]">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200/50">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Megaphone size={22} className="text-blue-600" /> Papan Pengumuman Resmi
                </h2>
                <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm">
                  <Bell size={12} /> Live
                </span>
              </div>

              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                  <p className="text-slate-400 font-medium text-sm">Menyinkronkan sinyal...</p>
                </div>
              ) : (!announcements || announcements.length === 0) ? (
                <div className="text-center py-12">
                  <Megaphone size={48} className="mx-auto text-slate-200 mb-4" />
                  <h3 className="text-slate-500 font-bold">Belum Ada Pengumuman</h3>
                  <p className="text-slate-400 text-sm mt-1">Panitia belum menyiarkan informasi apapun saat ini.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {announcements.map((announcement: any, idx: number) => {
                    // Proteksi pembaca tanggal yang aman
                    const dateObj = announcement?.created_at ? new Date(announcement.created_at) : new Date();
                    const isValidDate = !isNaN(dateObj.getTime());
                    const formattedDate = isValidDate ? dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : "-";
                    const formattedTime = isValidDate ? dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : "-";

                    return (
                      <div key={announcement?.id || idx} className="bg-white/80 border border-slate-100 p-5 rounded-2xl hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-slate-800 text-lg">{announcement?.title || "Tanpa Judul"}</h3>
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md whitespace-nowrap">
                            {formattedDate} • {formattedTime} WIB
                          </span>
                        </div>
                        <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                          {announcement?.content || "-"}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* --- WIDGET JADWAL PENTING (TIMELINE RESMI NCC 13TH) --- */}
            <div className="bg-white/60 backdrop-blur-xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-8 mt-8">
              <div className="flex items-center gap-3 mb-8 pb-5 border-b border-slate-200/50">
                <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                  <Calendar size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Jadwal Perlombaan NCC 13th</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Seluruh cabang lomba • Gelombang I & II</p>
                </div>
              </div>

              <div className="space-y-8">

                {/* ── 1. LKTI ── */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0"></span>
                    <h3 className="font-black text-slate-800 text-sm uppercase tracking-wide">LKTI – Lomba Karya Tulis Ilmiah</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Gel I */}
                    <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4 space-y-2.5">
                      <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-3">Gelombang I</p>
                      <div><p className="text-xs font-bold text-slate-700">Pendaftaran & Abstrak</p><p className="text-[11px] text-blue-500 font-semibold">16 Juli – 3 September</p></div>
                      <div><p className="text-xs font-bold text-slate-700">Pengumuman Tahap I</p><p className="text-[11px] text-blue-500 font-semibold">10 September</p></div>
                      <div><p className="text-xs font-bold text-slate-700">Pengumpulan Fullpaper</p><p className="text-[11px] text-blue-500 font-semibold">12 – 18 September</p></div>
                      <div><p className="text-xs font-bold text-slate-700">Pengumuman Tahap II</p><p className="text-[11px] text-blue-500 font-semibold">26 September</p></div>
                    </div>
                    {/* Gel II */}
                    <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-4 space-y-2.5">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Gelombang II</p>
                      <div><p className="text-xs font-bold text-slate-600">Pendaftaran & Abstrak</p><p className="text-[11px] text-slate-400 font-semibold">1 – 25 Oktober</p></div>
                      <div><p className="text-xs font-bold text-slate-600">Pengumuman Tahap I</p><p className="text-[11px] text-slate-400 font-semibold">31 Oktober</p></div>
                      <div><p className="text-xs font-bold text-slate-600">Pengumpulan Fullpaper</p><p className="text-[11px] text-slate-400 font-semibold">1 – 9 November</p></div>
                      <div><p className="text-xs font-bold text-slate-600">Pengumuman Tahap II</p><p className="text-[11px] text-slate-400 font-semibold">16 November</p></div>
                    </div>
                  </div>
                </div>

                <hr className="border-slate-100" />

                {/* ── 2. OLIMPIADE ── */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></span>
                    <h3 className="font-black text-slate-800 text-sm uppercase tracking-wide">Olimpiade MIPA</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Gel I */}
                    <div className="bg-amber-50/60 border border-amber-100 rounded-2xl p-4 space-y-2.5">
                      <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-3">Gelombang I</p>
                      <div><p className="text-xs font-bold text-slate-700">Pendaftaran</p><p className="text-[11px] text-amber-500 font-semibold">16 Juli – 3 September</p></div>
                      <div><p className="text-xs font-bold text-slate-700">Seleksi 1</p><p className="text-[11px] text-amber-500 font-semibold">10 September</p></div>
                      <div><p className="text-xs font-bold text-slate-700">Seleksi 2</p><p className="text-[11px] text-amber-500 font-semibold">14 September</p></div>
                      <div><p className="text-xs font-bold text-slate-700">Pengumuman Tahap I</p><p className="text-[11px] text-amber-500 font-semibold">21 September</p></div>
                    </div>
                    {/* Gel II */}
                    <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-4 space-y-2.5">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Gelombang II</p>
                      <div><p className="text-xs font-bold text-slate-600">Pendaftaran</p><p className="text-[11px] text-slate-400 font-semibold">1 – 25 Oktober</p></div>
                      <div><p className="text-xs font-bold text-slate-600">Simulasi</p><p className="text-[11px] text-slate-400 font-semibold">29 Oktober</p></div>
                      <div><p className="text-xs font-bold text-slate-600">Seleksi</p><p className="text-[11px] text-slate-400 font-semibold">2 November</p></div>
                      <div><p className="text-xs font-bold text-slate-600">Pengumuman</p><p className="text-[11px] text-slate-400 font-semibold">8 November</p></div>
                    </div>
                  </div>
                </div>

                <hr className="border-slate-100" />

                {/* ── 3. SPEECH ── */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0"></span>
                    <h3 className="font-black text-slate-800 text-sm uppercase tracking-wide">Speech Contest</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Gel I */}
                    <div className="bg-purple-50/60 border border-purple-100 rounded-2xl p-4 space-y-2.5">
                      <p className="text-[10px] font-black text-purple-500 uppercase tracking-widest mb-3">Gelombang I</p>
                      <div><p className="text-xs font-bold text-slate-700">Pendaftaran & Naskah</p><p className="text-[11px] text-purple-500 font-semibold">16 Juli – 3 September</p></div>
                      <div><p className="text-xs font-bold text-slate-700">Pengumuman</p><p className="text-[11px] text-purple-500 font-semibold">14 September</p></div>
                    </div>
                    {/* Gel II */}
                    <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-4 space-y-2.5">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Gelombang II</p>
                      <div><p className="text-xs font-bold text-slate-600">Pendaftaran & Naskah</p><p className="text-[11px] text-slate-400 font-semibold">1 – 25 Oktober</p></div>
                      <div><p className="text-xs font-bold text-slate-600">Pengumuman</p><p className="text-[11px] text-slate-400 font-semibold">14 November</p></div>
                    </div>
                  </div>
                </div>

                <hr className="border-slate-100" />

                {/* ── 4. MTQ ── */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0"></span>
                    <h3 className="font-black text-slate-800 text-sm uppercase tracking-wide">MTQ</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Gel I */}
                    <div className="bg-green-50/60 border border-green-100 rounded-2xl p-4 space-y-2.5">
                      <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-3">Gelombang I</p>
                      <div><p className="text-xs font-bold text-slate-700">Pendaftaran & Video</p><p className="text-[11px] text-green-600 font-semibold">16 Juli – 3 September</p></div>
                      <div><p className="text-xs font-bold text-slate-700">Pengumuman</p><p className="text-[11px] text-green-600 font-semibold">14 September</p></div>
                    </div>
                    {/* Gel II */}
                    <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-4 space-y-2.5">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Gelombang II</p>
                      <div><p className="text-xs font-bold text-slate-600">Pendaftaran</p><p className="text-[11px] text-slate-400 font-semibold">1 – 25 Oktober</p></div>
                      <div><p className="text-xs font-bold text-slate-600">Pengumuman</p><p className="text-[11px] text-slate-400 font-semibold">14 November</p></div>
                    </div>
                  </div>
                </div>

                <hr className="border-slate-100" />

                {/* ── 📌 TM SEMUA LOMBA ── */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-5 flex items-center gap-4">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0 text-lg">📌</div>
                  <div>
                    <p className="font-black text-white text-sm">Technical Meeting – Semua Lomba</p>
                    <p className="text-indigo-200 text-xs font-semibold mt-0.5">18 November • Semua Cabang Lomba</p>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TOAST NOTIFICATION */}
      <div className={`fixed top-8 right-8 z-[100] transition-all duration-500 transform ${toast.show ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0 pointer-events-none'}`}>
        <div className="bg-white/95 backdrop-blur-md border border-white/60 shadow-2xl rounded-2xl p-4 flex items-center gap-3">
          {toast.type === 'success' ? (
            <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center"><CheckCircle2 size={18} /></div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center"><AlertCircle size={18} /></div>
          )}
          <div>
            <p className="font-bold text-slate-800 text-sm">{toast.type === 'success' ? 'Berhasil' : 'Peringatan'}</p>
            <p className="text-xs text-slate-500 font-medium max-w-[250px]">{toast.message}</p>
          </div>
        </div>
      </div>

      {/* MODAL FORM REGISTRASI */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
          <div className="bg-white/95 backdrop-blur-md w-full max-w-2xl rounded-3xl border border-white/60 p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-slate-800">Finalisasi Pendaftaran</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSubmitEntry} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Asal Sekolah</label>
                  <input required type="text" className="w-full p-3 bg-white border rounded-xl text-sm" placeholder="Contoh: SMA Darul Ulum 1" 
                    onChange={(e) => setFormData({...formData, school_name: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    {isTeamEvent ? "NISN (Ketua Tim)" : "NISN"}
                  </label>
                  <input required type="number" className="w-full p-3 bg-white border rounded-xl text-sm" placeholder="Nomor Induk Siswa" 
                    onChange={(e) => setFormData({...formData, nisn: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Cabang Lomba</label>
                  <select className="w-full p-3 bg-white border rounded-xl text-sm font-medium"
                    onChange={(e) => setFormData({...formData, competition_type: e.target.value})}>
                    <option value="Olimpiade MIPA">Olimpiade MIPA</option>
                    <option value="Speech Contest">Speech Contest</option>
                    <option value="LKTI Nasional">LKTI Nasional</option>
                    <option value="MTQ">MTQ</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Provinsi Asal</label>
                  <select required value={formData.province} onChange={(e) => setFormData({...formData, province: e.target.value})}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 appearance-none">
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
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Unggah Bukti Transfer</label>
                  <div className="border-2 border-dashed border-blue-200 rounded-xl p-4 text-center hover:bg-blue-50 transition-colors cursor-pointer relative">
                    <input required type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" 
                      onChange={(e) => setFile(e.target.files?.[0] || null)} />
                    <p className="text-xs text-blue-600 font-bold">{file ? file.name : "Klik untuk pilih foto/screenshot"}</p>
                  </div>
                </div>
              </div>

              {/* BLOK DINAMIS TIM - Optimized Animation */}
              <div className={`md:col-span-2 overflow-hidden transition-all duration-300 ease-out ${isTeamEvent ? "max-h-[300px] opacity-100 mt-2" : "max-h-0 opacity-0 m-0 border-none"}`}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 bg-blue-50/50 rounded-2xl border border-blue-100">
                  <div className="md:col-span-1">
                    <label className="text-[10px] font-bold text-blue-500 uppercase tracking-wider block mb-1">Nama Tim</label>
                    <input type="text" className="w-full p-3 bg-white border border-blue-200 rounded-xl text-sm" placeholder="Tim Einstein" 
                      onChange={(e) => setFormData({...formData, team_name: e.target.value})} required={isTeamEvent} />
                  </div>
                  <div className="md:col-span-1">
                    <label className="text-[10px] font-bold text-blue-500 uppercase tracking-wider block mb-1">Nama Anggota 2</label>
                    <input type="text" className="w-full p-3 bg-white border border-blue-200 rounded-xl text-sm" placeholder="Nama Lengkap" 
                      onChange={(e) => setFormData({...formData, participant2_name: e.target.value})} required={isTeamEvent} />
                  </div>
                  <div className="md:col-span-1">
                    <label className="text-[10px] font-bold text-blue-500 uppercase tracking-wider block mb-1">NISN Anggota 2</label>
                    <input type="number" className="w-full p-3 bg-white border border-blue-200 rounded-xl text-sm" placeholder="NISN" 
                      onChange={(e) => setFormData({...formData, participant2_nisn: e.target.value})} required={isTeamEvent} />
                  </div>
                </div>
              </div>

              <button type="submit" disabled={isSubmitting} className="md:col-span-2 mt-4 bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all">
                {isSubmitting ? "Sedang Mengirim..." : "KIRIM PENDAFTARAN SEKARANG"}
              </button>
            </form>
          </div>
        </div>
      )}
      {/* ========================================================= */}
      {/* 💳 MODAL EKSKLUSIF ID CARD PESERTA */}
      {/* ========================================================= */}
      {showIdCard && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm print:bg-white print:p-0">
          
          <div className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-sm w-full relative print:shadow-none print:w-[350px]">
            {/* Bagian Atas Card */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-800 p-8 text-center text-white relative">
              <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-white rounded-full blur-2xl"></div>
              </div>
              <h2 className="font-black text-3xl tracking-tight relative z-10">NCC 13th</h2>
              <p className="text-blue-200 text-[10px] font-bold tracking-widest uppercase mt-1 relative z-10">Official Participant Card</p>
            </div>
            
            {/* Bagian Bawah Card */}
            <div className="p-6 text-center bg-white relative">
              {/* Foto Profil Inisial */}
              <div className="w-20 h-20 bg-slate-100 rounded-full mx-auto -mt-16 border-4 border-white flex items-center justify-center text-3xl font-black text-blue-600 mb-3 shadow-lg relative z-20">
                {userEntry?.full_name?.charAt(0).toUpperCase() || "P"}
              </div>
              
              <h3 className="font-black text-xl text-slate-800 uppercase mb-1">{userEntry?.full_name}</h3>
              <div className="inline-block px-3 py-1 bg-blue-50 text-blue-600 font-bold text-xs rounded-full mb-6 border border-blue-100">
                {userEntry?.competition_type}
              </div>

              {/* Grid Data Validasi */}
              <div className="grid grid-cols-2 gap-3 text-left bg-slate-50 p-4 rounded-2xl mb-6 border border-slate-100">
                <div>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">ID Tiket Resmi</p>
                  <p className="text-sm font-black text-slate-700 font-mono">NCC-{userEntry?.id ? String(userEntry.id).substring(0,6).toUpperCase() : "XXXXXX"}</p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Asal Instansi</p>
                  <p className="text-sm font-bold text-slate-700 truncate" title={userEntry?.school_name}>{userEntry?.school_name}</p>
                </div>
              </div>

              {/* Tombol Aksi (Otomatis Hilang Saat Dicetak) */}
              <div className="flex gap-3 print:hidden">
                <button 
                  onClick={() => window.print()} 
                  className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors shadow-md"
                >
                  <Printer size={18} /> Cetak
                </button>
                <button 
                  onClick={() => setShowIdCard(false)} 
                  className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
            
            {/* Pita Dekorasi */}
            <div className="h-2 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
          </div>

          {/* Latar Belakang Gelap Penutup Modal */}
          <div className="absolute inset-0 z-[-1] print:hidden" onClick={() => setShowIdCard(false)}></div>
        </div>
      )}
    </div>
  );
}
