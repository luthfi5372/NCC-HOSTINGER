import { useState, useEffect } from "react";
import { AlertCircle, CheckCircle2, Clock, User, IdCard, ImageIcon, FolderOpen, BookOpen, MessageCircle, Target, Sparkles, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";

interface StatusCardsProps {
  userEntry: any;
  setUserEntry: React.Dispatch<React.SetStateAction<any>>;
  currentUser: any;
  isSubmissionOpen: boolean;
  setShowForm: (val: boolean) => void;
  setShowIdCard: (val: boolean) => void;
  showToast: (msg: string, type: "success" | "error") => void;
  progress: number;
  portalSettings: any;
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
  portalSettings
}: StatusCardsProps) {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [isSavingUrl, setIsSavingUrl] = useState(false);
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
      showToast(`Gagal mengunggah berkas: ${err.message}`, "error");
    } finally {
      setIsUploadingFiles(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('competition_entries')
        .update({
          full_name: profileForm.full_name,
          school_name: profileForm.school_name,
          phone: profileForm.phone,
          nisn: profileForm.nisn,
          province: profileForm.province,
          team_name: profileForm.team_name,
          participant2_name: profileForm.participant2_name,
          participant2_nisn: profileForm.participant2_nisn
        })
        .eq('id', userEntry?.id);

      if (error) throw error;
      
      showToast("Profil berhasil diperbarui!", "success");
      setUserEntry((prev: any) => ({
        ...prev,
        ...profileForm
      }));
      setIsEditingProfile(false);
    } catch (err: any) {
      showToast(`Gagal memperbarui profil: ${err.message}`, "error");
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
          <button onClick={() => setShowForm(true)} className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-md shadow-blue-200 text-sm">
            Lengkapi Berkas Sekarang
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

      {userEntry && (
        <div className="bg-white border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-6">
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
              {[
                { label: "Nama Lengkap", value: userEntry.full_name },
                { label: "Asal Sekolah", value: userEntry.school_name || userEntry.school },
                { label: "WhatsApp", value: userEntry.phone },
                { label: "NISN", value: userEntry.nisn },
                { label: "Provinsi", value: userEntry.province },
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-slate-100">
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
              <input type="text" placeholder="Nama Lengkap" className="w-full p-2.5 bg-slate-50 border rounded-xl" value={profileForm.full_name} onChange={(e) => setProfileForm({...profileForm, full_name: e.target.value})} />
              <input type="text" placeholder="Sekolah" className="w-full p-2.5 bg-slate-50 border rounded-xl" value={profileForm.school_name} onChange={(e) => setProfileForm({...profileForm, school_name: e.target.value})} />
              <input type="text" placeholder="WhatsApp" className="w-full p-2.5 bg-slate-50 border rounded-xl" value={profileForm.phone} onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})} />
              <input type="text" placeholder="NISN" className="w-full p-2.5 bg-slate-50 border rounded-xl" value={profileForm.nisn} onChange={(e) => setProfileForm({...profileForm, nisn: e.target.value})} />
              <input type="text" placeholder="Provinsi" className="w-full p-2.5 bg-slate-50 border rounded-xl" value={profileForm.province} onChange={(e) => setProfileForm({...profileForm, province: e.target.value})} />
              <button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 text-white font-bold py-2.5 rounded-xl">Simpan</button>
            </form>
          )}
        </div>
      )}

      {userEntry?.payment_status === 'Verified' && isSubmissionOpen && (
        <div className="bg-white border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-6">
          <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
            <FolderOpen size={18} className="text-blue-500" />
            Pengumpulan Karya
          </h3>
          <p className="text-[11px] text-slate-500 font-medium mb-4">Kumpulkan link Google Drive karya Anda di sini.</p>
          <div className="space-y-3">
            <input type="url" placeholder="https://drive.google.com/..." className="w-full p-3 bg-slate-50 border rounded-xl text-xs" value={submissionUrl} onChange={(e) => setSubmissionUrl(e.target.value)} />
            <button onClick={handleSaveSubmissionUrl} disabled={isSavingUrl} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl text-xs">
              {isSavingUrl ? "Menyimpan..." : "Simpan Link Karya"}
            </button>
          </div>
        </div>
      )}


      <div className="grid grid-cols-1 gap-4">
        {[
          { 
            label: "Buku Panduan", 
            sub: "Syarat & Ketentuan Lomba (PDF)", 
            icon: BookOpen, 
            color: "blue",
            assetKey: "card_buku_panduan"
          },
          { 
            label: "Twibbon Resmi", 
            sub: "Unduh aset kampanye IG", 
            icon: ImageIcon, 
            color: "purple",
            assetKey: "card_twibbon"
          },
          { 
            label: "Hubungi Panitia", 
            sub: "Bantuan via WhatsApp", 
            icon: MessageCircle, 
            color: "green",
            assetKey: "card_kontak"
          },
        ].map((item, i) => {
          const customImg = portalSettings?.dashboardAssets?.[item.assetKey];
          return (
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
            <div className={`w-12 h-12 ${customImg ? 'p-0 overflow-hidden' : `bg-${item.color}-100 text-${item.color}-600`} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all border border-slate-100`}>
              {customImg ? (
                <img src={customImg} alt={item.label} className="w-full h-full object-cover" />
              ) : (
                <item.icon size={24} />
              )}
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm">{item.label}</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">{item.sub}</p>
            </div>
          </a>
          );
        })}
      </div>
    </div>
  );
}
