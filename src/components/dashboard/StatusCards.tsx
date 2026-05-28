import { useState, useEffect } from "react";
import { AlertCircle, CheckCircle2, Clock, User, IdCard, ImageIcon, FolderOpen, BookOpen, MessageCircle, Target, Sparkles, ChevronRight, Ticket, Copy, Check, Loader2, Upload } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { generateTicketCode } from "@/lib/utils";

interface StatusCardsProps {
  userEntry: any;
  setUserEntry: React.Dispatch<React.SetStateAction<any>>;
  currentUser: any;
  isSubmissionOpen: boolean;
  setShowForm: (val: boolean) => void;
  setShowIdCard: (val: boolean) => void;
  showToast: (msg: string, type: "success" | "error") => void;
  progress: number;
  paymentRequirementStage?: string;
  isRegistrationOpen?: boolean;
}

export default function StatusCards({
  userEntry,
  setUserEntry,
  currentUser,
  isSubmissionOpen,
  setShowForm,
  setShowIdCard,
  showToast,
  progress,
  paymentRequirementStage = 'registration',
  isRegistrationOpen = true
}: StatusCardsProps) {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [isSavingUrl, setIsSavingUrl] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isEditingSubmission, setIsEditingSubmission] = useState(false);
  
  // Ambil submission_url yang sudah tersimpan di database
  const savedSubmissionUrl = (() => {
    let parsedNotes: any = {};
    if (userEntry?.notes) {
      try { parsedNotes = JSON.parse(userEntry?.notes); } catch (e) {}
    }
    return parsedNotes.submission_url || "";
  })();
  
  const [submissionUrl, setSubmissionUrl] = useState(() => {
    let parsedNotes: any = {};
    if (userEntry?.notes) {
      try { parsedNotes = JSON.parse(userEntry?.notes); } catch (e) {}
    }
    return parsedNotes.submission_url || "";
  });
  
  const [profileForm, setProfileForm] = useState({
    full_name: userEntry?.full_name || "",
    school_name: userEntry?.school_name || userEntry?.school || "",
    phone: userEntry?.phone || "",
    nisn: userEntry?.nisn || "",
    province: userEntry?.province || "",
    team_name: userEntry?.team_name || "",
    participant2_name: userEntry?.participant2_name || "",
    participant2_nisn: userEntry?.participant2_nisn || ""
  });

  // 🔄 Sync form state when userEntry changes (important for real-time updates)
  useEffect(() => {
    if (userEntry) {
      setProfileForm({
        full_name: userEntry.full_name || "",
        school_name: userEntry.school_name || userEntry.school || "",
        phone: userEntry.phone || "",
        nisn: userEntry.nisn || "",
        province: userEntry.province || "",
        team_name: userEntry.team_name || "",
        participant2_name: userEntry.participant2_name || "",
        participant2_nisn: userEntry.participant2_nisn || ""
      });
    }
  }, [userEntry]);

  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [studentCard, setStudentCard] = useState<File | null>(null);

  const handleUploadProfileFiles = async () => {
    if (!profilePhoto && !studentCard) {
      return showToast("Pilih file foto formal atau kartu pelajar terlebih dahulu!", "error");
    }

    setIsUploadingFiles(true);
    try {
      let notesObj: any = {};
      if (userEntry?.notes) {
        try { notesObj = JSON.parse(userEntry.notes); } catch (e) {}
      }

      if (profilePhoto) {
        const fileExt = profilePhoto.name.split('.').pop();
        const fileName = `${userEntry?.id}-formal-${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('payment-proofs').upload(fileName, profilePhoto);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('payment-proofs').getPublicUrl(fileName);
        notesObj.profile_photo_url = urlData.publicUrl;
      }

      if (studentCard) {
        const fileExt = studentCard.name.split('.').pop();
        const fileName = `${userEntry?.id}-card-${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('payment-proofs').upload(fileName, studentCard);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('payment-proofs').getPublicUrl(fileName);
        notesObj.student_card_url = urlData.publicUrl;
      }

      const updatedNotes = JSON.stringify(notesObj);
      const { error: dbError } = await supabase.from('competition_entries').update({ notes: updatedNotes }).eq('id', userEntry?.id);
      if (dbError) throw dbError;

      showToast("Berkas foto profil berhasil diperbarui!", "success");
      setUserEntry((prev: any) => ({ ...prev, notes: updatedNotes }));
      setProfilePhoto(null);
      setStudentCard(null);
    } catch (err: any) {
      console.error("Upload files error:", err);
      let errMsg = err.message || "Kesalahan tidak dikenal";
      if (errMsg.toLowerCase().includes("bucket") || errMsg.toLowerCase().includes("not_found") || errMsg.toLowerCase().includes("not found")) {
        errMsg = "Bucket 'payment-proofs' tidak ditemukan di database Supabase. Silakan hubungi admin untuk menjalankan migrasi database/storage.";
      }
      showToast(`Gagal mengunggah berkas: ${errMsg}`, "error");
    } finally {
      setIsUploadingFiles(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('competition_entries')
        .update({
          full_name: profileForm.full_name,
          school_name: profileForm.school_name,
          school: profileForm.school_name, // Sinkronisasi kolom 'school' lama demi integritas modul lain
          phone: profileForm.phone,
          nisn: profileForm.nisn,
          province: profileForm.province,
          team_name: profileForm.team_name,
          participant2_name: profileForm.participant2_name,
          participant2_nisn: profileForm.participant2_nisn
        })
        .eq('id', userEntry?.id)
        .select();

      if (error) throw error;
      
      if (!data || data.length === 0) {
        throw new Error("Izin update ditolak. Pastikan skrip SQL RLS sudah dijalankan di Supabase SQL Editor.");
      }
      
      showToast("Profil berhasil diperbarui!", "success");
      setUserEntry((prev: any) => ({
        ...prev,
        ...profileForm,
        school: profileForm.school_name // Sync state lokal juga!
      }));
      setIsEditingProfile(false);
    } catch (err: any) {
      console.error("DEBUG FAIL UPDATE PROFILE:", err);
      showToast(`Gagal: ${err.message || "Akses RLS ditolak (Pastikan SQL sudah dijalankan)"}`, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveSubmissionUrl = async () => {
    if (!submissionUrl) return showToast("Masukkan link Google Drive Anda terlebih dahulu!", "error");
    setIsSavingUrl(true);
    try {
      let notesObj: any = {};
      if (userEntry?.notes) {
        try { notesObj = JSON.parse(userEntry.notes); } catch (e) {}
      }
      notesObj.submission_url = submissionUrl;
      const updatedNotes = JSON.stringify(notesObj);

      const { error } = await supabase.from('competition_entries').update({ notes: updatedNotes }).eq('id', userEntry?.id);
      if (error) throw error;
      
      showToast("Link karya berhasil disimpan!", "success");
      setUserEntry((prev: any) => ({ ...prev, notes: updatedNotes }));
    } catch (err: any) {
      showToast(`Gagal menyimpan: ${err.message}`, "error");
    } finally {
      setIsSavingUrl(false);
    }
  };

  const handleResubmit = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('competition_entries')
        .update({ payment_status: 'Pending' })
        .eq('id', userEntry?.id);
      if (error) throw error;
      showToast("Berkas berhasil diajukan ulang ke antrean verifikasi!", "success");
      setUserEntry((prev: any) => ({ ...prev, payment_status: 'Pending' }));
    } catch (err: any) {
      showToast(`Gagal mengajukan ulang: ${err.message}`, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const [isUploadingPayment, setIsUploadingPayment] = useState(false);
  const [paymentFile, setPaymentFile] = useState<File | null>(null);

  const handleUploadPaymentProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentFile) return showToast("Mohon pilih file bukti transfer terlebih dahulu!", "error");
    if (paymentFile.size > 2 * 1024 * 1024) { 
      return showToast("Ukuran foto maksimal 2MB!", "error");
    }

    setIsUploadingPayment(true);
    try {
      const fileExt = paymentFile.name.split('.').pop();
      const fileName = `${userEntry?.id}-payment-${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('payment-proofs').upload(fileName, paymentFile);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('payment-proofs').getPublicUrl(fileName);
      const photoUrl = urlData.publicUrl;

      const { error: dbError } = await supabase
        .from('competition_entries')
        .update({
          payment_proof_url: photoUrl,
          payment_status: 'Pending'
        })
        .eq('id', userEntry?.id);

      if (dbError) throw dbError;

      showToast("Bukti transfer berhasil diunggah! Menunggu verifikasi admin.", "success");
      setUserEntry((prev: any) => ({
        ...prev,
        payment_proof_url: photoUrl,
        payment_status: 'Pending'
      }));
      setPaymentFile(null);
    } catch (err: any) {
      console.error("Upload payment error:", err);
      let errMsg = err.message || "Kesalahan tidak dikenal";
      if (errMsg.toLowerCase().includes("bucket") || errMsg.toLowerCase().includes("not_found") || errMsg.toLowerCase().includes("not found")) {
        errMsg = "Bucket 'payment-proofs' tidak ditemukan di database Supabase. Silakan hubungi admin untuk menjalankan migrasi database/storage.";
      }
      showToast(`Gagal mengunggah bukti: ${errMsg}`, "error");
    } finally {
      setIsUploadingPayment(false);
    }
  };

  // Deteksi stage dan status kelulusan dari notes
  let currentStage = 1;
  let isFailed = false;
  if (userEntry?.notes) {
    try {
      const notesObj = JSON.parse(userEntry.notes);
      if (notesObj.current_stage) currentStage = Number(notesObj.current_stage);
      if (notesObj.is_failed) isFailed = Boolean(notesObj.is_failed);
    } catch (e) {}
  }

  // Cek apakah wajib bayar di tahap ini
  let isPaymentRequired = true;
  if (paymentRequirementStage === 'registration') {
    isPaymentRequired = true;
  } else if (paymentRequirementStage === 'tahap1') {
    isPaymentRequired = currentStage >= 2 && !isFailed;
  } else if (paymentRequirementStage === 'tahap2') {
    isPaymentRequired = currentStage >= 3 && !isFailed;
  } else if (paymentRequirementStage === 'free') {
    isPaymentRequired = false;
  }

  return (
    <div className="space-y-6">
      
      {!userEntry && (
        <div className="bg-white border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-6">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <AlertCircle size={18} className="text-blue-500" />
            Langkah Selanjutnya
          </h3>
          <div className="space-y-3 text-sm">
            <div className="p-3 bg-green-50 border border-green-100 rounded-xl flex items-center gap-3">
              <CheckCircle2 size={16} className="text-green-500" />
              <span className="font-medium text-green-800">Lengkapi Profil Biodata</span>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-center gap-3">
              <Clock size={16} className="text-amber-500" />
              <span className="font-medium text-amber-800">Unggah Bukti Transfer</span>
            </div>
          </div>
          <button 
            onClick={() => {
              if (isRegistrationOpen) {
                setShowForm(true);
              } else {
                showToast("Pendaftaran ditutup sementara oleh Admin.", "error");
              }
            }}
            disabled={!isRegistrationOpen}
            className={`w-full mt-6 font-bold py-3 rounded-xl transition-all shadow-md text-sm ${
              isRegistrationOpen 
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
            }`}
          >
            {isRegistrationOpen ? "Lengkapi Berkas Sekarang" : "Pendaftaran Ditutup Sementara"}
          </button>
        </div>
      )}

      {userEntry?.payment_status === 'Pending' && (
        <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl p-6 text-white shadow-lg shadow-amber-200 relative overflow-hidden">
          <div className="absolute top-[-10%] right-[-10%] w-32 h-32 bg-white/20 rounded-full blur-2xl pointer-events-none"></div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white/20 rounded-xl"><Clock size={24} className="text-white" /></div>
            <h3 className="font-bold text-lg">Proses Verifikasi</h3>
          </div>
          <p className="text-sm text-amber-50 font-medium leading-relaxed mb-4">
            Berkas pendaftaran <strong className="text-white underline">{userEntry?.competition_type || "Kompetisi"}</strong> Anda sedang diperiksa oleh Markas Besar. 
          </p>
          <div className="bg-black/10 rounded-xl p-3 text-xs font-bold uppercase tracking-wider text-center border border-white/20">
            Mohon Tunggu 1x24 Jam
          </div>
        </div>
      )}

      {userEntry?.payment_status === 'Rejected' && (
        <div className="bg-gradient-to-br from-rose-500 to-red-600 rounded-3xl p-6 text-white shadow-lg shadow-red-200">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle size={24} />
            <h3 className="font-bold text-lg">Pendaftaran Ditolak</h3>
          </div>
          <p className="text-sm text-rose-50 font-medium leading-relaxed mb-4">
            Mohon maaf, berkas Anda ditolak. Silakan periksa kembali data dan bukti pembayaran Anda.
          </p>
          <button onClick={handleResubmit} disabled={isSubmitting} className="w-full bg-white text-rose-600 font-bold py-2.5 rounded-xl text-sm">
            {isSubmitting ? "Memproses..." : "Ajukan Ulang Berkas"}
          </button>
        </div>
      )}

      {userEntry && userEntry.payment_status !== 'Verified' && userEntry.payment_status !== 'Pending' && userEntry.payment_status !== 'Rejected' && (
        isPaymentRequired ? (
          <div className="bg-white border border-slate-200 shadow-xl shadow-slate-100 rounded-3xl p-6 relative overflow-hidden group">
            {/* Elegant Background Accent */}
            <div className="absolute top-0 right-0 w-28 h-28 bg-indigo-50 rounded-full blur-2xl pointer-events-none group-hover:scale-110 transition-transform duration-700"></div>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                </svg>
              </div>
              <div>
                <h3 className="font-black text-slate-800 text-sm leading-tight">Pembayaran Lomba</h3>
                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[8px] font-black uppercase tracking-widest rounded">Administrasi Wajib</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 font-medium leading-relaxed mb-4">
              Untuk mengaktifkan kepesertaan Anda di cabang <strong className="text-indigo-600">{userEntry.competition_type}</strong>, silakan lakukan transfer administrasi pendaftaran:
            </p>

            {/* Bank Card Info */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3 mb-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">Bank Tujuan</span>
                <span className="font-extrabold text-slate-700 flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 bg-blue-600 text-white font-black text-[9px] rounded">MANDIRI</span>
                  Bank Mandiri
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">Nomor Rekening</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-black text-slate-800 tracking-wider">123-456-789-0123</span>
                  <button 
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText("1234567890123");
                      showToast("Nomor rekening berhasil disalin!", "success");
                    }}
                    className="p-1 hover:bg-slate-200 rounded-md text-slate-400 hover:text-slate-600 transition-colors"
                    title="Salin Nomor Rekening"
                  >
                    <Copy size={12} />
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">Atas Nama (A.N.)</span>
                <span className="font-bold text-slate-800">Panitia National Creativity Competition</span>
              </div>
              <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-200/50">
                <span className="text-slate-400 font-medium">Biaya Pendaftaran</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-indigo-600 text-sm">Rp 150.000</span>
                  <button 
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText("150000");
                      showToast("Biaya pendaftaran disalin!", "success");
                    }}
                    className="p-1 hover:bg-slate-200 rounded-md text-slate-400 hover:text-slate-600 transition-colors"
                    title="Salin Nominal"
                  >
                    <Copy size={12} />
                  </button>
                </div>
              </div>
            </div>

            {/* Drag and Drop Uploader */}
            <form onSubmit={handleUploadPaymentProof} className="space-y-4">
              <div className="relative">
                <div className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all cursor-pointer relative ${
                  paymentFile 
                    ? 'border-emerald-300 bg-emerald-50/20' 
                    : 'border-slate-200 hover:border-indigo-300 bg-slate-50/50'
                }`}>
                  <input 
                    required 
                    type="file" 
                    accept="image/*" 
                    className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                    onChange={(e) => setPaymentFile(e.target.files?.[0] || null)}
                  />
                  <div className="flex flex-col items-center gap-2">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-sm ${
                      paymentFile 
                        ? 'bg-emerald-100 text-emerald-600' 
                        : 'bg-white text-slate-400 border border-slate-100'
                    }`}>
                      {paymentFile ? <CheckCircle2 size={16} /> : <Upload size={16} />}
                    </div>
                    <div>
                      <p className={`text-[11px] font-bold ${paymentFile ? 'text-emerald-700' : 'text-slate-600'}`}>
                        {paymentFile ? paymentFile.name : "Unggah Bukti Transfer"}
                      </p>
                      <p className="text-[9px] text-slate-400 font-medium mt-0.5">
                        Format gambar (JPG, PNG). Maksimal 2MB.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isUploadingPayment} 
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-3 rounded-xl transition-all shadow-md text-xs tracking-wider uppercase disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isUploadingPayment ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Memproses Bukti...
                  </>
                ) : (
                  "Kirim Bukti Pembayaran"
                )}
              </button>
            </form>
          </div>
        ) : (
          /* Deferred Payment Note */
          <div className="bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9] border border-slate-200/60 rounded-3xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full blur-2xl pointer-events-none"></div>

            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <h3 className="font-black text-slate-800 text-sm">Status Pembayaran</h3>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[8px] font-black uppercase tracking-widest rounded">Bebas Administrasi</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Ditangguhkan (Belum Wajib). Tahap kompetisi aktif saat ini dibebaskan dari biaya pendaftaran. Silakan lanjutkan pengerjaan berkas atau persiapan ujian Anda secara penuh!
            </p>
          </div>
        )
      )}

      {userEntry && (
        <div id="profile-preview-card" className="bg-white border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-6 transition-all duration-500">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <User size={18} className="text-indigo-500" />
              Pratinjau Profil
            </h3>
            <button onClick={() => setIsEditingProfile(!isEditingProfile)} className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition-all">
              {isEditingProfile ? "Batal" : "Ubah Profil"}
            </button>
          </div>

          {!isEditingProfile ? (
            <div className="space-y-3 text-xs">

              {/* ── ID TIKET CBT ─────────────────────────────── */}
              {userEntry.id && (() => {
                const ticketCode = `NCC-${generateTicketCode(userEntry.id)}`;
                const handleCopy = () => {
                  navigator.clipboard.writeText(ticketCode).then(() => {
                    setIsCopied(true);
                    setTimeout(() => setIsCopied(false), 2000);
                  });
                };
                return (
                  <div className="mb-4 rounded-2xl border border-indigo-100 bg-indigo-50 overflow-hidden">
                    {/* Label baris atas */}
                    <div className="flex items-center gap-1.5 px-3 pt-2.5 pb-1">
                      <Ticket size={11} className="text-indigo-400 shrink-0" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400">ID Tiket Login CBT</span>
                    </div>
                    {/* Kode + tombol salin */}
                    <div className="flex items-center justify-between gap-2 px-3 pb-2.5">
                      <span className="font-mono font-black text-lg tracking-[0.15em] text-indigo-700 whitespace-nowrap select-all">
                        {ticketCode}
                      </span>
                      <button
                        onClick={handleCopy}
                        title="Salin ID Tiket"
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black transition-all shrink-0 ${
                          isCopied
                            ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-200'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95'
                        }`}
                      >
                        {isCopied
                          ? <><Check size={12} /> Tersalin!</>
                          : <><Copy size={12} /> Salin</>}
                      </button>
                    </div>
                  </div>
                );
              })()}

              {[
                { label: "Nama Lengkap", value: userEntry.full_name },
                { label: "Asal Sekolah", value: userEntry.school_name || userEntry.school },
                { label: "WhatsApp", value: userEntry.phone },
                { label: "NISN", value: userEntry.nisn },
                { label: "Provinsi", value: userEntry.province },
                // Tambahkan data Anggota 2 jika kategori Tim
                ...((userEntry.competition_type === "LKTI Nasional" || userEntry.competition_type === "Olimpiade MIPA") ? [
                  { label: "Nama Anggota Tim", value: userEntry.participant2_name },
                  { label: "NISN Anggota Tim", value: userEntry.participant2_nisn }
                ] : [])
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                  <span className="text-slate-400 font-medium">{item.label}</span>
                  <span className="text-slate-800 font-bold">{item.value || "-"}</span>
                </div>
              ))}

              <div className="pt-4 mt-2 border-t-2 border-dashed border-slate-100 space-y-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <ImageIcon size={12} className="text-indigo-500" /> Foto Formal Sekolah
                  </label>
                  <div className="flex items-center gap-2">
                    <input type="file" accept="image/*" onChange={(e) => setProfilePhoto(e.target.files?.[0] || null)} className="block w-full text-[10px] text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:bg-indigo-50 file:text-indigo-600" />
                    {(() => {
                      let n: any = {}; if (userEntry.notes) try { n = JSON.parse(userEntry.notes); } catch(e) {}
                      return n.profile_photo_url && <a href={n.profile_photo_url} target="_blank" className="shrink-0 text-indigo-600 font-bold text-[10px] bg-indigo-50 px-2 py-1 rounded-lg">Lihat</a>
                    })()}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <IdCard size={12} className="text-indigo-500" /> Scan Kartu Pelajar
                  </label>
                  <div className="flex items-center gap-2">
                    <input type="file" accept="image/*" onChange={(e) => setStudentCard(e.target.files?.[0] || null)} className="block w-full text-[10px] text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:bg-indigo-50 file:text-indigo-600" />
                    {(() => {
                      let n: any = {}; if (userEntry.notes) try { n = JSON.parse(userEntry.notes); } catch(e) {}
                      return n.student_card_url && <a href={n.student_card_url} target="_blank" className="shrink-0 text-indigo-600 font-bold text-[10px] bg-indigo-50 px-2 py-1 rounded-lg">Lihat</a>
                    })()}
                  </div>
                </div>
                {(profilePhoto || studentCard) && (
                  <button onClick={handleUploadProfileFiles} disabled={isUploadingFiles} className="w-full bg-indigo-600 text-white text-xs font-bold py-2.5 rounded-xl shadow-md">
                    {isUploadingFiles ? "Mengunggah..." : "Simpan Berkas Baru"}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleUpdateProfile} className="space-y-3 text-xs">
              <input type="text" placeholder="Nama Lengkap (Anggota 1)" className="w-full p-2.5 bg-slate-50 border rounded-xl" value={profileForm.full_name} onChange={(e) => setProfileForm({...profileForm, full_name: e.target.value})} />
              <input type="text" placeholder="Sekolah" className="w-full p-2.5 bg-slate-50 border rounded-xl" value={profileForm.school_name} onChange={(e) => setProfileForm({...profileForm, school_name: e.target.value})} />
              <input type="text" placeholder="WhatsApp" className="w-full p-2.5 bg-slate-50 border rounded-xl" value={profileForm.phone} onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})} />
              <div className="grid grid-cols-2 gap-2">
                <input type="text" placeholder="NISN 1" className="w-full p-2.5 bg-slate-50 border rounded-xl" value={profileForm.nisn} onChange={(e) => setProfileForm({...profileForm, nisn: e.target.value})} />
                <input type="text" placeholder="Provinsi" className="w-full p-2.5 bg-slate-50 border rounded-xl" value={profileForm.province} onChange={(e) => setProfileForm({...profileForm, province: e.target.value})} />
              </div>
              
              {/* Form Tambahan Anggota 2 jika kategori Tim */}
              {(userEntry.competition_type === "LKTI Nasional" || userEntry.competition_type === "Olimpiade MIPA") && (
                <div className="pt-2 space-y-2 border-t border-dashed border-slate-200 mt-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Data Anggota 2</p>
                  <input type="text" placeholder="Nama Anggota 2" className="w-full p-2.5 bg-slate-50 border rounded-xl" value={profileForm.participant2_name} onChange={(e) => setProfileForm({...profileForm, participant2_name: e.target.value})} />
                  <input type="text" placeholder="NISN Anggota 2" className="w-full p-2.5 bg-slate-50 border rounded-xl" value={profileForm.participant2_nisn} onChange={(e) => setProfileForm({...profileForm, participant2_nisn: e.target.value})} />
                </div>
              )}
              <button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 text-white font-bold py-2.5 rounded-xl">Simpan</button>
            </form>
          )}
        </div>
      )}

      {userEntry?.payment_status === 'Verified' && isSubmissionOpen && (
        <div className="bg-white border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-6">
          <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
            <FolderOpen size={18} className={savedSubmissionUrl && !isEditingSubmission ? "text-emerald-500" : "text-blue-500"} />
            Pengumpulan Karya
          </h3>

          {/* ✅ SUDAH SUBMIT STATE */}
          {savedSubmissionUrl && !isEditingSubmission ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                <p className="text-xs font-bold text-emerald-700">Karya Berhasil Dikumpulkan!</p>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Link yang Dikumpulkan</p>
                <a 
                  href={savedSubmissionUrl} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="text-xs text-blue-600 font-semibold break-all hover:underline line-clamp-2"
                >
                  {savedSubmissionUrl}
                </a>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => setIsEditingSubmission(true)} 
                  className="w-full border border-slate-200 text-slate-600 font-bold py-2.5 rounded-xl text-xs hover:bg-slate-50 transition-colors"
                >
                  Ubah Link
                </button>
                <button 
                  disabled 
                  className="w-full bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-default"
                >
                  <CheckCircle2 size={13} /> Sudah Submit
                </button>
              </div>
            </div>
          ) : (
            /* 📝 FORM INPUT STATE */
            <div className="space-y-3">
              {!savedSubmissionUrl && (
                <p className="text-[11px] text-slate-500 font-medium">Kumpulkan link Google Drive karya Anda di sini.</p>
              )}
              {isEditingSubmission && (
                <div className="flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl">
                  <AlertCircle size={13} className="text-amber-500 shrink-0" />
                  <p className="text-[10px] font-bold text-amber-700">Mengubah link akan mengganti karya sebelumnya.</p>
                </div>
              )}
              <input 
                type="url" 
                placeholder="https://drive.google.com/..." 
                className="w-full p-3 bg-slate-50 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all" 
                value={submissionUrl} 
                onChange={(e) => setSubmissionUrl(e.target.value)} 
              />
              <div className="grid grid-cols-2 gap-2">
                {isEditingSubmission && (
                  <button 
                    onClick={() => { setIsEditingSubmission(false); setSubmissionUrl(savedSubmissionUrl); }} 
                    className="w-full border border-slate-200 text-slate-600 font-bold py-2.5 rounded-xl text-xs hover:bg-slate-50 transition-colors"
                  >
                    Batal
                  </button>
                )}
                <button 
                  onClick={async () => { await handleSaveSubmissionUrl(); setIsEditingSubmission(false); }} 
                  disabled={isSavingUrl || !submissionUrl} 
                  className={`w-full bg-blue-600 text-white font-bold py-3 rounded-xl text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors ${
                    isEditingSubmission ? '' : 'col-span-2'
                  }`}
                >
                  {isSavingUrl ? "Menyimpan..." : isEditingSubmission ? "Simpan Perubahan" : "Simpan Link Karya"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}


      <div className="grid grid-cols-1 gap-4">
        {[
          { label: "Buku Panduan", sub: "Syarat & Ketentuan Lomba (PDF)", icon: BookOpen, color: "blue" },
          { label: "Twibbon Resmi", sub: "Unduh aset kampanye IG", icon: ImageIcon, color: "purple" },
          { label: "Hubungi Panitia", sub: "Bantuan via WhatsApp", icon: MessageCircle, color: "green" },
        ].map((item, i) => (
          <a key={i} href="#" className="flex items-center gap-4 p-5 bg-white border border-slate-200 hover:border-indigo-300 rounded-2xl transition-all shadow-sm group relative overflow-hidden">
            {item.label === "Buku Panduan" && (
              <div className="absolute top-0 left-0 w-full h-1 bg-slate-50 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2, delay: 1 }}
                  className="h-full bg-gradient-to-r from-blue-400 to-indigo-600"
                />
              </div>
            )}
            <div className={`w-12 h-12 bg-${item.color}-100 text-${item.color}-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all`}>
              <item.icon size={24} />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm">{item.label}</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">{item.sub}</p>
            </div>
          </a>
        ))}

        {/* ── DYNAMIC REGISTRATION CARD INTEGRATED WITH ADMIN GATE ── */}
        {!userEntry ? (
          isRegistrationOpen ? (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center text-left gap-4 p-5 bg-gradient-to-r from-[#5145cd] to-[#372b9c] border border-transparent hover:from-[#4338ca] hover:to-[#2e2285] text-white rounded-2xl transition-all shadow-lg hover:shadow-indigo-200/50 shadow-indigo-100 group relative overflow-hidden w-full"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-xl transform translate-x-5 -translate-y-5"></div>
              <div className="w-12 h-12 bg-white/15 text-white rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all shrink-0">
                <Target size={24} className="animate-pulse" />
              </div>
              <div className="flex-1">
                <h4 className="font-extrabold text-sm flex items-center gap-1.5">
                  Pendaftaran Kompetisi <Sparkles size={14} className="text-amber-300" />
                </h4>
                <p className="text-[11px] text-indigo-100 mt-0.5 font-medium">Pilih bidang lomba & lengkapi berkas sekarang</p>
              </div>
              <ChevronRight size={18} className="text-white/80 group-hover:translate-x-1 transition-transform shrink-0" />
            </button>
          ) : (
            <div
              className="flex items-center text-left gap-4 p-5 bg-slate-100 border border-slate-200 text-slate-500 rounded-2xl cursor-not-allowed select-none opacity-80 w-full"
              title="Pendaftaran ditutup sementara oleh admin"
            >
              <div className="w-12 h-12 bg-slate-200 text-slate-400 rounded-2xl flex items-center justify-center shrink-0">
                <AlertCircle size={24} />
              </div>
              <div className="flex-1">
                <h4 className="font-extrabold text-sm text-slate-700">Pendaftaran Ditutup</h4>
                <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Gerbang pendaftaran dinonaktifkan sementara</p>
              </div>
            </div>
          )
        ) : (
          <button
            onClick={() => {
              setIsEditingProfile(true);
              const element = document.getElementById("profile-preview-card");
              if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
                // Flash highlight effect
                element.classList.add("ring-4", "ring-indigo-500/50");
                setTimeout(() => element.classList.remove("ring-4", "ring-indigo-500/50"), 2000);
              }
            }}
            className="flex items-center text-left gap-4 p-5 bg-white border border-emerald-200 hover:border-emerald-300 rounded-2xl transition-all shadow-sm group relative overflow-hidden w-full"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-green-500"></div>
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all shrink-0">
              <CheckCircle2 size={24} />
            </div>
            <div className="flex-1">
              <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                Status: Terdaftar <span className="inline-block px-1.5 py-0.5 rounded text-[8px] font-black tracking-wider bg-emerald-100 text-emerald-700 uppercase">{userEntry.payment_status}</span>
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Terdaftar di bidang: <span className="font-bold text-slate-600">{userEntry.competition_type}</span></p>
            </div>
            <ChevronRight size={18} className="text-slate-400 group-hover:translate-x-1 transition-transform shrink-0" />
          </button>
        )}
      {/* 🌟 PREMIUM GLASSMORPHIC OVERLAY FOR SUBMITTING & SAVING KARYA / BUKTI TF */}
      {(isSavingUrl || isUploadingPayment || isSubmitting) && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative flex flex-col items-center p-8 rounded-[2rem] bg-white/15 border border-white/20 shadow-2xl max-w-sm w-full text-center">
            {/* Spinning glowing gradient ring */}
            <div className="relative w-20 h-20 mb-6 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-white/10"></div>
              <div className="absolute inset-0 rounded-full border-4 border-t-emerald-400 border-r-teal-500 animate-spin"></div>
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white shadow-lg animate-pulse">
                {isSavingUrl ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6 animate-bounce">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15M9 12l3-3m0 0l3 3m-3-3v12" />
                  </svg>
                ) : isUploadingPayment ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6 animate-bounce">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6 animate-spin">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                  </svg>
                )}
              </div>
            </div>

            <h3 className="text-xl font-black text-white mb-2 tracking-tight">
              {isSavingUrl ? "Menyimpan Karya..." : isUploadingPayment ? "Mengunggah Bukti Pembayaran..." : "Mengupdate Profil..."}
            </h3>
            <p className="text-xs text-indigo-200 font-medium leading-relaxed">
              {isSavingUrl 
                ? "Sedang menautkan link karya pendaftaran Anda ke database utama." 
                : isUploadingPayment
                ? "Sedang mengunggah file bukti pembayaran Anda ke server penyimpanan aman."
                : "Mohon tunggu sebentar, sedang menyimpan pembaruan profil Anda."
              }
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
