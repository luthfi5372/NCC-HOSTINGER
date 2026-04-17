"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutGrid,
  Trophy, 
  User, 
  LogOut, 
  Bell, 
  Search,
  BookOpen,
  Calendar,
  ChevronRight,
  TrendingUp,
  Settings,
  HelpCircle,
  Menu,
  X,
  CreditCard,
  CheckCircle2,
  Clock,
  ExternalLink,
  MapPin,
  Phone,
  Mail,
  AlertCircle,
  Info,
  CalendarDays,
  Printer,
  Download,
  Trash2,
  Building2,

  Medal,
  Megaphone,
  Wallet,
  ShieldCheck,
  Zap,
  Target,
  Mic,
  Microscope,
  Book,
  Sparkles
} from "lucide-react";
import { 
  getGlobalStats, 
  getSession, 
  getCompetitionEntries, 
  logout, 
  CompetitionEntry, 
  LocalSession, 
  getAnnouncements, 
  getUserData,
  LocalUser,
  updateUserProfile,
  deleteCompetitionEntry,
  getCategoryPrice
} from "@/lib/localAuth";
import { Announcement } from "@/types/announcement";
import Link from "next/link";
import { useLiveStats } from "@/hooks/useLiveStats";
import { submitCompetitionEntryToSupabase } from "@/lib/supabase/service";

const PROVINCES = [
  "DI. ACEH", "SUMATERA UTARA", "SUMATERA BARAT", "RIAU", "JAMBI", "SUMATERA SELATAN", "BENGKULU", "LAMPUNG", 
  "BANGKA BELITUNG", "KEPULAUAN RIAU", "DKI JAKARTA", "JAWA BARAT", "JAWA TENGAH", "DAERAH ISTIMEWA YOGYAKARTA", 
  "JAWA TIMUR", "PROBANTEN", "BALI", "NUSATENGGARA BARAT", "NUSA TENGGARA TIMUR", "KALIMANTAN BARAT", 
  "KALIMANTAN TENGAH", "KALIMANTAN SELATAN", "KALIMANTAN TIMUR", "KALIMANTAN UTARA", "SULAWESI UTARA", 
  "SULAWESI TENGAH", "SULAWESI SELATAN", "SULAWESI TENGGARA", "GORONTALO", "SULAWESI BARAT", "MALUKU", 
  "MALUKU UTARA", "IRIAN JAYA BARAT", "IRIAN JAYA TENGAH", "IRIAN JAYA TIMUR"
].sort();

const CATEGORIES = [
  { id: "Olimpiade MIPA", icon: Microscope, desc: "Matematika, Biologi, Kimia, Fisika" },
  { id: "Speech Contest", icon: Mic, desc: "Bhs. Inggris & Indonesia" },
  { id: "LKTI Nasional", icon: BookText, desc: "Karya Tulis Ilmiah" },
  { id: "MTQ Nasional", icon: Book, desc: "Tilawatil Qur'an" },
];

import { BookText } from "lucide-react";

type TabType = "Dashboard" | "Kompetisi Saya" | "Pengumuman" | "Pembayaran" | "Profil";

export default function DashboardPage() {
  const [session, setSession] = useState<LocalSession | null>(null);
  const [userData, setUserData] = useState<LocalUser | null>(null);
  const [entries, setEntries] = useState<CompetitionEntry[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("Dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [hasUnreadAnnouncements, setHasUnreadAnnouncements] = useState(false);
  
  // Modals & Selection
  const [selectedEntry, setSelectedEntry] = useState<CompetitionEntry | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentPreview, setPaymentPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Profile Form States
  const [updateMsg, setUpdateMsg] = useState({ type: "", text: "" });

  // Competition Registration State (Inside Dashboard)
  const [regForm, setRegForm] = useState({
    category: "",
    city: "",
    teamSize: "Individu",
    notes: "",
    phone: "",
    school: ""
  });
  const [isSubmittingReg, setIsSubmittingReg] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);

  const router = useRouter();
  const invoiceRef = useRef<HTMLDivElement>(null);
  const { stats } = useLiveStats();

  const refreshData = useCallback(() => {
    const currentSession = getSession();
    if (!currentSession) {
      router.push("/login?from=dashboard");
      return;
    }
    setSession(currentSession);
    
    const userEntries = getCompetitionEntries(currentSession.email);
    const userDetail = getUserData(currentSession.email);
    const mockAnnouncements = getAnnouncements() as unknown as Announcement[];
    
    setEntries(userEntries);
    setUserData(userDetail);
    setAnnouncements(mockAnnouncements);
    
    // Notification Badge Logic
    if (mockAnnouncements.length > 0) {
      const lastReadId = localStorage.getItem("ncc_last_read_announcement");
      const latestId = mockAnnouncements[0].id;
      if (lastReadId !== latestId) {
        setHasUnreadAnnouncements(true);
      }
    }
    
    if (userDetail) {
      setProfileForm({ 
        fullName: userDetail.fullName, 
        school: userDetail.school, 
        phone: userDetail.phone || "" 
      });
    }
    
    setLoading(false);
  }, [router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshData();
  }, [refreshData]);

  const getCategoryIcon = (category: string) => {
    const c = category.toLowerCase();
    if (c.includes("mipa")) return BookOpen;
    if (c.includes("speech")) return Mic;
    if (c.includes("lkti")) return Microscope;
    if (c.includes("mtq")) return Book;
    return Sparkles;
  };

  const handleLogout = () => {
    logout();
    document.cookie = "ncc_hint=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    router.push("/login");
  };

  const [editMode, setEditMode] = useState(false);
  const [profileForm, setProfileForm] = useState({ fullName: "", school: "", phone: "" });

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    
    const res = updateUserProfile(session.email, profileForm);
    if (res.success) {
      setUpdateMsg({ type: "success", text: "Profil berhasil diperbarui!" });
      setEditMode(false);
      const updated = getUserData(session.email);
      if (updated) {
        setUserData(updated);
        setSession({ ...session, fullName: updated.fullName });
      }
      setTimeout(() => setUpdateMsg({ type: "", text: "" }), 3000);
    } else {
      setUpdateMsg({ type: "error", text: res.error || "Gagal memperbarui profil." });
    }
  };
  const handleCompetitionRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !userData) return;
    if (!regForm.category || !regForm.city) {
      setRegError("Harap pilih kategori dan provinsi.");
      return;
    }

    setIsSubmittingReg(true);
    setRegError(null);

    try {
      const { error } = await submitCompetitionEntryToSupabase({
        fullName: userData.fullName,
        email: userData.email,
        phone: regForm.phone || "-",
        school: regForm.school || userData.school || "-",
        city: regForm.city,
        category: regForm.category,
        teamSize: regForm.teamSize,
        notes: regForm.notes
      });

      if (!error) {
        // Success: Refresh entries and set tab
        refreshData();
        setActiveTab("Dashboard");
      } else {
        setRegError(error.message || "Gagal mendaftar lomba.");
      }
    } catch (err) {
      setRegError("Terjadi kesalahan koneksi.");
    } finally {
      setIsSubmittingReg(false);
    }
  };

  const handleDeleteEntry = (id: string) => {
    const res = deleteCompetitionEntry(id);
    if (res.success) {
      setIsDeleteConfirmOpen(false);
      setIsDetailOpen(false);
      setSelectedEntry(null);
      refreshData();
    }
  };

  const handlePaymentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const submitPaymentProof = async () => {
    if (!selectedEntry || !paymentPreview) return;
    setIsUploading(true);
    
    // Minimal delay for UX flow
    await new Promise(r => setTimeout(r, 800));
    
    const { userUploadPaymentProof } = await import("@/lib/localAuth");
    const res = userUploadPaymentProof(selectedEntry.id, paymentPreview);
    
    if (res.success) {
      setIsPaymentModalOpen(false);
      setPaymentPreview(null);
      refreshData();
    } else {
      alert(res.error);
    }
    setIsUploading(false);
  };

  const handlePrint = () => {
    const printContent = invoiceRef.current;
    if (!printContent) return;
    

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Invoice NCC 13th - ${selectedEntry?.id}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              @media print {
                body { padding: 40px; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            ${printContent.innerHTML}
            <script>
              setTimeout(() => {
                window.print();
                window.close();
              }, 500);
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const navItems = useMemo(() => [
    { label: "Dashboard", icon: LayoutGrid },
    { label: "Kompetisi Saya", icon: Medal },
    { label: "Pengumuman", icon: Megaphone },
    { label: "Pembayaran", icon: Wallet },
    { label: "Profil", icon: User },
  ], []);

  if (loading || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  /* ─── MODAL RENDERERS ─── */
  const renderDetailModal = () => (
    <AnimatePresence>
      {isDetailOpen && selectedEntry && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setIsDetailOpen(false)}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="bg-slate-50 px-8 py-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Detail Pendaftaran</h3>
                <p className="text-xs text-slate-500 font-medium">Informasi lengkap kategori lomba yang diikuti.</p>
              </div>
              <button onClick={() => setIsDetailOpen(false)} className="p-2 hover:bg-slate-200/50 rounded-xl text-slate-400 transition-colors"><X size={20}/></button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="flex items-center gap-4 p-4 bg-indigo-50 rounded-2xl border border-indigo-100/50">
                <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white shrink-0">
                  {(() => {
                    const Icon = getCategoryIcon(selectedEntry.category);
                    return <Icon size={24} />;
                  })()}
                </div>
                <div>
                  <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest leading-none mb-1">Kategori Lomba</div>
                  <div className="font-black text-indigo-900 text-lg leading-tight">{selectedEntry.category}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                   <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Institusi</div>
                   <div className="text-sm font-semibold text-slate-700">{selectedEntry.school}</div>
                </div>
                <div className="space-y-1">
                   <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kota/Kabupaten</div>
                   <div className="text-sm font-semibold text-slate-700">{selectedEntry.city}</div>
                </div>
                <div className="space-y-1">
                   <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tipe Peserta</div>
                   <div className="text-sm font-semibold text-slate-700">{selectedEntry.teamSize}</div>
                </div>
                <div className="space-y-1">
                   <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">WhatsApp</div>
                   <div className="text-sm font-semibold text-slate-700">{selectedEntry.phone}</div>
                </div>
              </div>

              {selectedEntry.notes && (
                <div className="space-y-1">
                   <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Catatan Tambahan</div>
                   <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">{selectedEntry.notes}</div>
                </div>
              )}

              <div className="pt-6 border-t border-slate-50 flex gap-3">
                <button 
                  onClick={() => setIsInvoiceOpen(true)}
                  className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
                >
                  <CreditCard size={16}/> Lihat Invoice
                </button>
                <button 
                  onClick={() => setIsDeleteConfirmOpen(true)}
                  className="px-6 py-3 bg-rose-50 text-rose-500 rounded-2xl text-sm font-bold border border-rose-100 flex items-center justify-center gap-2 hover:bg-rose-100 transition-colors"
                >
                  <Trash2 size={16}/> Hapus
                </button>
              </div>
            </div>
          </motion.div>

          {/* Delete Confirmation Overly */}
          <AnimatePresence>
            {isDeleteConfirmOpen && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="absolute inset-0 z-[110] flex items-center justify-center p-6"
              >
                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" />
                <div className="relative bg-white p-8 rounded-[2.5rem] shadow-2xl max-w-xs text-center border border-white">
                  <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm"><X size={32}/></div>
                  <h4 className="text-lg font-bold text-slate-900 mb-2">Hapus Pendaftaran?</h4>
                  <p className="text-sm text-slate-500 mb-6">Tindakan ini tidak dapat dibatalkan. Konfirmasi penghapusan data?</p>
                  <div className="flex gap-3">
                    <button onClick={() => handleDeleteEntry(selectedEntry.id)} className="flex-1 py-3 bg-rose-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-rose-100">Hapus</button>
                    <button onClick={() => setIsDeleteConfirmOpen(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-2xl text-sm font-bold">Batal</button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </AnimatePresence>
  );

  /* ─── MODAL: INVOICE / NOTA ─── */
  const renderInvoiceModal = () => (
    <AnimatePresence>
      {isInvoiceOpen && selectedEntry && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setIsInvoiceOpen(false)}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
          />
          <motion.div 
             initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
             className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col"
          >
             <div className="flex-1 overflow-y-auto p-12" ref={invoiceRef}>
                {/* Invoice Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-8 mb-12">
                   <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-yellow-300 shadow-xl shadow-indigo-200">
                         {(() => {
                            const Icon = getCategoryIcon(selectedEntry.category);
                            return <Icon size={32} />;
                         })()}
                      </div>
                      <div>
                         <div className="text-2xl font-black text-slate-900 tracking-tight leading-none">NCC 13th</div>
                         <div className="text-[10px] text-slate-400 font-bold uppercase tracking-[3px] mt-1">Official Invoice</div>
                      </div>
                   </div>
                   <div className="text-right sm:text-right w-full sm:w-auto">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Invoice Number</div>
                      <div className="text-xl font-mono font-bold text-slate-900">NCC-{selectedEntry.id.slice(0, 10).toUpperCase()}</div>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-12 mb-12">
                   <div>
                      <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-3">Bill To:</div>
                      <div className="space-y-1">
                         <div className="font-bold text-slate-900 text-lg leading-tight">{selectedEntry.fullName}</div>
                         <div className="text-sm text-slate-500 font-medium">{selectedEntry.email}</div>
                         <div className="text-sm text-slate-500 font-medium">{selectedEntry.school}</div>
                      </div>
                   </div>
                   <div>
                      <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-3">Invoice Info:</div>
                      <div className="space-y-1">
                         <div className="flex justify-between text-sm">
                            <span className="text-slate-400 font-medium">Issue Date:</span>
                            <span className="text-slate-900 font-bold">{new Date(selectedEntry.submittedAt).toLocaleDateString("id-ID")}</span>
                         </div>
                         <div className="flex justify-between text-sm">
                            <span className="text-slate-400 font-medium">Payment Status:</span>
                            <span className="text-emerald-600 font-black uppercase tracking-wider">LUNAS / PAID</span>
                         </div>
                      </div>
                   </div>
                </div>

                {/* Table */}
                <div className="border border-slate-100 rounded-3xl overflow-hidden mb-8">
                   <table className="w-full">
                      <thead className="bg-slate-50">
                         <tr>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase">Item Description</th>
                            <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase">Amount</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                         <tr>
                            <td className="px-6 py-8">
                               <div className="font-black text-slate-900 text-lg">Biaya Pendaftaran {selectedEntry.category}</div>
                               <div className="text-sm text-slate-400 font-medium uppercase mt-1 tracking-widest">National Creativity Competition 2026</div>
                            </td>
                            <td className="px-6 py-8 text-right font-black text-slate-900 text-xl">
                               Rp {getCategoryPrice(selectedEntry.category).toLocaleString("id-ID")}
                            </td>
                         </tr>
                      </tbody>
                      <tfoot>
                         <tr className="bg-indigo-600 text-white">
                            <td className="px-6 py-6 font-bold uppercase tracking-widest text-sm">Total Terbayar</td>
                            <td className="px-6 py-6 text-right font-black text-2xl tracking-tight">Rp {getCategoryPrice(selectedEntry.category).toLocaleString("id-ID")}</td>
                         </tr>
                      </tfoot>
                   </table>
                </div>

                <div className="text-center">
                   <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100 mb-6">
                      <CheckCircle2 size={12}/> Terverifikasi Keuangan Panitia
                   </div>
                   <p className="text-[10px] text-slate-300 font-medium italic">Ini adalah bukti pendaftaran sah yang diproses secara digital melalui platform NCC Participant Portal.</p>
                </div>
             </div>

             {/* Footer Control */}
             <div className="px-12 py-8 bg-slate-50 border-t border-slate-100 flex gap-4 no-print">
                <button 
                  onClick={handlePrint}
                  className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm shadow-xl shadow-slate-200 flex items-center justify-center gap-3 hover:bg-slate-800 transition-all active:scale-95"
                >
                   <Printer size={18}/> Cetak Invoice / Download PDF
                </button>
                <button 
                  onClick={() => setIsInvoiceOpen(false)}
                  className="px-10 py-4 bg-white text-slate-500 rounded-2xl font-bold text-sm border border-slate-200 hover:bg-white/50 transition-all active:scale-95"
                >
                   Tutup
                </button>
             </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  const renderPaymentModal = () => (
    <AnimatePresence>
      {isPaymentModalOpen && selectedEntry && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setIsPaymentModalOpen(false)}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 30 }}
            className="relative bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden"
          >
            <div className="p-10 space-y-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-indigo-100 shadow-sm">
                  <Wallet size={32} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Konfirmasi Pembayaran</h3>
                <p className="text-sm text-slate-500 font-medium mt-1">Selesaikan pendaftaran untuk {selectedEntry.category}</p>
              </div>

              <div className="bg-slate-50 p-6 rounded-[2rem] border border-dashed border-slate-200 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Biaya</span>
                  <span className="text-xl font-black text-indigo-600">Rp {getCategoryPrice(selectedEntry.category).toLocaleString("id-ID")}</span>
                </div>
                <div className="pt-4 border-t border-slate-100">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Transfer Ke:</div>
                  <div className="flex justify-between items-center text-sm font-black text-slate-700">
                    <span>MANDIRI NCC Central</span>
                    <span className="font-mono text-indigo-600">1410-00-1234-567</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-wider opacity-60">A/N National Creativity Competition</div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] ml-1">Unggah Bukti Transfer (JPG/PNG)</label>
                {!paymentPreview ? (
                  <label className="flex flex-col items-center justify-center w-full h-32 bg-slate-50 border-2 border-dashed border-slate-100 rounded-[2rem] cursor-pointer hover:bg-slate-100 hover:border-indigo-200 transition-all group overflow-hidden">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Download size={24} className="text-slate-300 group-hover:text-indigo-400 transition-colors mb-2" />
                      <p className="text-xs text-slate-400 font-bold group-hover:text-indigo-600 transition-colors uppercase tracking-widest">Pilih File...</p>
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={handlePaymentUpload} />
                  </label>
                ) : (
                  <div className="relative h-48 w-full rounded-[2rem] overflow-hidden border-2 border-indigo-100 group shadow-lg">
                    <img src={paymentPreview} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                       <button 
                        onClick={() => setPaymentPreview(null)}
                        className="px-6 py-2 bg-white text-rose-500 rounded-xl text-xs font-black shadow-xl hover:scale-105 transition-all flex items-center gap-2"
                      >
                        <X size={14}/> Ganti File
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={submitPaymentProof}
                  disabled={!paymentPreview || isUploading}
                  className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl text-sm font-black shadow-xl shadow-indigo-100 disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-slate-900 transition-all active:scale-95"
                >
                  {isUploading ? <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> : "Konfirmasi Sekarang"}
                </button>
                <button onClick={() => setIsPaymentModalOpen(false)} className="px-8 py-4 bg-slate-50 text-slate-400 rounded-2xl text-sm font-bold hover:bg-slate-100 transition-all">Batal</button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  /* ─── RENDER HELPER: OVERVIEW ─── */
  const renderOverview = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
              <Target size={24} />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-1">{entries.length}</div>
          <div className="text-sm text-slate-500 font-medium tracking-tight">Kompetisi Diikuti</div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
              <ShieldCheck size={24} />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-1">{entries.length > 0 ? "Verified" : "-"}</div>
          <div className="text-sm text-slate-500 font-medium tracking-tight">Status Pembayaran</div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-amber-50 rounded-2xl text-amber-600">
              <Zap size={24} />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-1">20</div>
          <div className="text-sm text-slate-500 font-medium tracking-tight">Hari Menuju Pendaftaran</div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-purple-50 rounded-2xl text-purple-600">
              <Sparkles size={24} />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-1">{stats.totalParticipants}+</div>
          <div className="text-sm text-slate-500 font-medium tracking-tight">Partisipan Nasional</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Pendaftaran Aktif</h2>
            <Link href="/daftar" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">Daftar Kompetisi Baru +</Link>
          </div>
          {entries.length === 0 ? (
             <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 lg:p-10 shadow-sm overflow-hidden relative group">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 blur-[80px] rounded-full -mr-32 -mt-32 pointer-events-none" />
                
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                      <Trophy size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight">Daftar Kompetisi Baru</h3>
                      <p className="text-xs text-slate-500 font-medium tracking-tight">Pilih bidang yang akan kamu kuasai di NCC 13th.</p>
                    </div>
                  </div>

                  <form onSubmit={handleCompetitionRegister} className="space-y-8">
                    {/* Category Selection */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setRegForm({ ...regForm, category: cat.id })}
                          className={`p-6 rounded-[2rem] border-2 text-left transition-all relative overflow-hidden group/btn ${
                            regForm.category === cat.id 
                            ? "border-indigo-600 bg-indigo-50 shadow-xl shadow-indigo-100" 
                            : "border-slate-100 bg-slate-50 hover:bg-white hover:border-slate-300"
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover/btn:scale-110 ${
                            regForm.category === cat.id ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" : "bg-white text-slate-400 border border-slate-100"
                          }`}>
                            <cat.icon size={20} />
                          </div>
                          <div className={`text-sm font-black mb-1 ${regForm.category === cat.id ? "text-indigo-900" : "text-slate-900"}`}>{cat.id}</div>
                          <div className="text-[10px] text-slate-500 font-medium leading-relaxed max-w-[150px]">{cat.desc}</div>
                          
                          {regForm.category === cat.id && (
                            <motion.div layoutId="active-check" className="absolute top-4 right-4 text-indigo-600">
                              <CheckCircle2 size={18} />
                            </motion.div>
                          )}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <Building2 size={12} className="text-indigo-400" /> Asal Sekolah / Instansi
                        </label>
                        <input
                          type="text"
                          required
                          value={regForm.school}
                          onChange={(e) => setRegForm({ ...regForm, school: e.target.value })}
                          className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                          placeholder="SMA Negeri 1 ..."
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <Phone size={12} className="text-indigo-400" /> No. WhatsApp
                        </label>
                        <input
                          type="tel"
                          required
                          value={regForm.phone}
                          onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                          className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                          placeholder="08xxxxxxxxxx"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <MapPin size={10} className="text-indigo-400"/> Domisili / Provinsi
                        </label>
                        <div className="relative">
                          <select
                            value={regForm.city}
                            required
                            onChange={(e) => setRegForm({ ...regForm, city: e.target.value })}
                            className="w-full pl-4 pr-10 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none transition-all"
                          >
                            <option value="">Pilih Provinsi...</option>
                            {PROVINCES.map(p => (
                              <option key={p} value={p}>{p}</option>
                            ))}
                          </select>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                            <ChevronRight size={16} className="rotate-90" />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <User size={10} className="text-indigo-400"/> Tipe Partisipasi
                        </label>
                        <div className="flex gap-3">
                          {["Individu", "Tim"].map((type) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => setRegForm({ ...regForm, teamSize: type })}
                              className={`flex-1 py-4 px-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${
                                regForm.teamSize === type ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100" : "bg-slate-50 text-slate-400 border-slate-100 hover:border-slate-200"
                              }`}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {regError && (
                      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="p-4 bg-rose-50 text-rose-600 rounded-2xl text-[11px] font-bold border border-rose-100 flex items-center gap-3">
                        <AlertCircle size={14} /> {regError}
                      </motion.div>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmittingReg}
                      className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-[3px] shadow-2xl shadow-slate-200 flex items-center justify-center gap-3 hover:bg-indigo-600 transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50"
                    >
                      {isSubmittingReg ? (
                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>Konfirmasi Pendaftaran <Sparkles size={16}/></>
                      )}
                    </button>
                  </form>
                </div>
             </div>
          ) : (
            <div className="space-y-4">
              {entries.slice(0, 2).map((entry) => (
                <div key={entry.id} className="bg-white border border-slate-200 rounded-3xl p-5 flex items-center gap-5 hover:border-indigo-200 transition-all hover:shadow-lg hover:shadow-indigo-50/50">
                  <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center shrink-0 text-indigo-600 transition-transform group-hover:scale-110">
                    {(() => {
                      const Icon = getCategoryIcon(entry.category);
                      return <Icon size={28} />;
                    })()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-900 truncate">{entry.category}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-3">
                       <span className="flex items-center gap-1"><User size={10}/> {entry.teamSize}</span> • <span className="flex items-center gap-1"><Calendar size={10}/> {new Date(entry.submittedAt).toLocaleDateString("id-ID")}</span>
                    </div>
                  </div>
                  <button onClick={() => { setSelectedEntry(entry); setIsDetailOpen(true); }} className="text-xs font-black text-indigo-600 px-5 py-2.5 bg-indigo-50 rounded-xl hover:bg-indigo-600 hover:text-white transition-all">Lihat Detail</button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="space-y-8">
           <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
             <div className="relative z-10">
               <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><User size={20}/> Profil Institusi</h2>
               <div className="text-[10px] text-indigo-200 uppercase font-bold tracking-widest mb-1">Sekolah / Instansi</div>
               <div className="text-sm font-semibold mb-4 leading-tight">{userData?.school || entries[0]?.school || "Belum Terdaftar"}</div>
               <div className="text-[10px] text-indigo-200 uppercase font-bold tracking-widest mb-1">ID Peserta</div>
               <div className="text-sm font-mono opacity-80 mb-5">{session.id.toUpperCase()}</div>
               <button onClick={() => setActiveTab("Profil")} className="w-full py-3 bg-white/20 hover:bg-white/30 rounded-2xl text-xs font-bold transition-all border border-white/20 flex items-center justify-center gap-2">Lengkapi Profil <ChevronRight size={14}/></button>
             </div>
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl -mr-16 -mt-16 rounded-full" />
           </div>
        </div>
      </div>
    </motion.div>
  );

  /* ─── RENDER HELPER: COMPETITIONS ─── */
  const renderCompetitions = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
      {entries.length === 0 ? (
        <div className="bg-white p-20 rounded-[3rem] border border-slate-200 text-center shadow-sm">
          <Trophy size={48} className="text-slate-200 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Belum Mengikuti Kompetisi</h2>
          <p className="text-slate-500 mb-8 max-w-sm mx-auto">Anda belum terdaftar dalam kategori apapun untuk NCC 13th.</p>
          <Link href="/daftar" className="bg-indigo-600 text-white px-8 py-3.5 rounded-2xl font-bold inline-block hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">Daftar Sekarang</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {entries.map((entry) => (
            <div key={entry.id} className="bg-white rounded-[2.5rem] border border-slate-200 p-8 flex flex-col hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-50/40 transition-all group">
              <div className="flex justify-between items-start mb-6">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-indigo-600 transition-transform group-hover:scale-105">
                  {(() => {
                    const Icon = getCategoryIcon(entry.category);
                    return <Icon size={30} />;
                  })()}
                </div>
                <div className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-lg border border-emerald-100 flex items-center gap-1 shadow-sm">
                  <CheckCircle2 size={12} /> Terverifikasi
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-1 tracking-tight">{entry.category}</h3>
              <p className="text-sm text-slate-500 mb-8 font-medium">{entry.teamSize} • {entry.school}</p>
              <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Didaftar Pada</span>
                  <span className="text-xs text-slate-500 font-bold">{new Date(entry.submittedAt).toLocaleDateString("id-ID")}</span>
                </div>
                <button 
                  onClick={() => { setSelectedEntry(entry); setIsDetailOpen(true); }}
                  className="text-white bg-indigo-600 px-6 py-2.5 rounded-xl text-xs font-black shadow-lg shadow-indigo-100 hover:bg-slate-900 transition-all flex items-center gap-2"
                >
                  Lihat Detail <ChevronRight size={14}/>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );

  /* ─── RENDER HELPER: ANNOUNCEMENTS ─── */
  const renderAnnouncements = () => (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
      {announcements.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] p-24 text-center border-2 border-dashed border-slate-100">
           <Megaphone className="mx-auto text-slate-100 mb-6" size={64} />
           <h3 className="text-xl font-black text-slate-900 mb-2">Belum ada pengumuman</h3>
           <p className="text-slate-400 font-medium">Semua berita dan update penting dari panitia akan muncul di sini.</p>
        </div>
      ) : (
        announcements.map((item: Announcement) => (
          <div key={item.id} className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden hover:shadow-2xl hover:shadow-slate-50 transition-all group relative">
            <div className="flex flex-col md:flex-row items-stretch">
              {/* Media Section: Professional Implementation */}
              {item.mediaUrl && (
                <div className="w-full md:w-64 lg:w-80 shrink-0 bg-slate-50 border-r border-slate-100 overflow-hidden relative">
                   <img 
                    src={item.mediaUrl} 
                    alt={item.title || "Announcement"} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                   />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>
              )}
              
              <div className="flex-1 p-8 lg:p-10">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                    item.type === "URGENT" ? "bg-rose-50 text-rose-600 border-rose-100" : 
                    item.type === "WARNING" ? "bg-amber-50 text-amber-600 border-amber-100" : "bg-indigo-50 text-indigo-600 border-indigo-100"
                  }`}>
                    {item.type || "INFO"}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(item.date).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>

                <h3 className="font-black text-slate-900 text-xl lg:text-2xl mb-4 tracking-tight leading-tight">{item.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed font-medium mb-6">{item.content}</p>
                
                <div className="flex items-center justify-between mt-auto pt-6 border-t border-slate-50">
                  <div className="flex items-center gap-2 text-slate-400">
                     <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                        <ShieldCheck size={14} className="text-indigo-600" />
                     </div>
                     <span className="text-[10px] font-black uppercase tracking-widest">Panitia NCC 2026</span>
                  </div>
                  <button className="text-xs font-black text-indigo-600 flex items-center gap-1.5 hover:translate-x-1 transition-transform">
                     Lihat Detail <ChevronRight size={14}/>
                  </button>
                </div>
              </div>
            </div>
            {item.type === "URGENT" && (
              <div className="absolute top-0 right-0 w-2 h-full bg-rose-500" />
            )}
          </div>
        ))
      )}
    </motion.div>
  );

  /* ─── RENDER HELPER: PAYMENTS ─── */
  const renderPayments = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[2px]">Lomba & Kategori</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[2px]">ID Pesanan</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[2px] text-center">Status Pembayaran</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[2px] text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center text-slate-400 text-sm font-medium">Belum ada riwayat pembayaran yang ditemukan.</td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50/30 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{entry.category}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{new Date(entry.submittedAt).toLocaleTimeString()} • {new Date(entry.submittedAt).toLocaleDateString()}</div>
                    </td>
                    <td className="px-8 py-6 font-mono text-xs text-slate-400 font-bold uppercase tracking-widest">NCC-{entry.id.slice(0, 10)}</td>
                    <td className="px-8 py-6">
                      <div className="flex justify-center">
                        {entry.paymentStatus === "Verified" ? (
                          <span className="px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm flex items-center gap-1.5 flex-nowrap whitespace-nowrap">
                             <CheckCircle2 size={12}/> PAID / LUNAS
                          </span>
                        ) : entry.paymentStatus === "Paid" ? (
                          <span className="px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-sm flex items-center gap-1.5 flex-nowrap whitespace-nowrap animate-pulse">
                             <Clock size={12}/> VERIFIKASI PANITIA
                          </span>
                        ) : (
                          <span className="px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-amber-50 text-amber-600 border border-amber-100 shadow-sm flex items-center gap-1.5 flex-nowrap whitespace-nowrap">
                             <AlertCircle size={12}/> BELUM BAYAR
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      {(entry.paymentStatus === "Wait" || entry.paymentStatus === "None") ? (
                        <button 
                          onClick={() => { setSelectedEntry(entry); setIsPaymentModalOpen(true); }}
                          className="text-white bg-indigo-600 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 hover:scale-105 active:scale-95 transition-all"
                        >
                           Konfirmasi
                        </button>
                      ) : (
                        <button 
                          onClick={() => { setSelectedEntry(entry); setIsInvoiceOpen(true); }}
                          className="text-indigo-600 text-[10px] font-black uppercase tracking-widest px-6 py-2.5 bg-indigo-50 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                        >
                           Invoice
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="bg-indigo-600 rounded-[3rem] p-10 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl shadow-indigo-100 text-center md:text-left relative overflow-hidden group">
        <div className="relative z-10">
          <h3 className="text-2xl font-black mb-1 tracking-tight">Butuh bantuan Pembayaran?</h3>
          <p className="text-indigo-100 text-sm font-medium opacity-90 max-w-md">Tim keuangan kami siap membantu melalui WhatsApp jika Anda memiliki kendala konformasi atau ingin pembayaran manual.</p>
        </div>
        <button className="relative z-10 bg-white text-indigo-600 px-10 py-4 rounded-[1.5rem] font-black text-sm whitespace-nowrap shadow-xl hover:bg-slate-50 transition-all hover:scale-105 active:scale-95 flex items-center gap-2">
           <Phone size={18}/> Chat WhatsApp Panitia
        </button>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-white/10 transition-all" />
      </div>
    </motion.div>
  );

  /* ─── RENDER HELPER: PROFILE ─── */
  const renderProfile = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl">
      <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
        <div className="bg-slate-50/50 px-10 py-8 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-center sm:text-left">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Pengaturan Profil</h2>
            <p className="text-sm font-medium text-slate-500">Sesuaikan identitas digital Anda untuk NCC 2026.</p>
          </div>
          {!editMode && (
            <button onClick={() => setEditMode(true)} className="px-6 py-2.5 bg-indigo-600 text-white rounded-2xl text-xs font-black shadow-lg shadow-indigo-100 hover:bg-slate-900 transition-all">Edit Profil</button>
          )}
        </div>
        
        <div className="p-10">
          <form onSubmit={handleProfileUpdate} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[2px]">Nama Lengkap</label>
                <div className="relative group">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 transition-colors group-focus-within:text-indigo-500" />
                  <input 
                    type="text" 
                    value={profileForm.fullName}
                    onChange={(e) => setProfileForm({...profileForm, fullName: e.target.value})}
                    disabled={!editMode}
                    className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-[1.5rem] text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white focus:outline-none disabled:opacity-60 transition-all font-black" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[2px]">Email Akun</label>
                <div className="relative opacity-60">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                  <input type="text" value={session.email} disabled className="w-full pl-12 pr-6 py-4 bg-slate-100/50 border-2 border-slate-100 rounded-[1.5rem] text-sm font-mono text-slate-500" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[2px]">Asal Sekolah / Instansi</label>
                <div className="relative group">
                  <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 transition-colors group-focus-within:text-indigo-500" />
                  <input 
                    type="text"
                    value={profileForm.school}
                    onChange={(e) => setProfileForm({...profileForm, school: e.target.value})}
                    disabled={!editMode}
                    className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-[1.5rem] text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white focus:outline-none disabled:opacity-60 transition-all font-black" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[2px]">No. WhatsApp</label>
                <div className="relative group">
                  <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 transition-colors group-focus-within:text-indigo-500" />
                  <input 
                    type="text"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                    placeholder="Contoh: 0812..."
                    disabled={!editMode}
                    className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-[1.5rem] text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white focus:outline-none disabled:opacity-60 transition-all font-black" 
                  />
                </div>
              </div>
            </div>

            {updateMsg.text && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className={`p-5 rounded-2xl text-xs font-black flex items-center gap-3 shadow-sm ${updateMsg.type === "success" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-rose-50 text-rose-600 border border-rose-100"}`}>
                {updateMsg.type === "success" ? <CheckCircle2 size={18}/> : <AlertCircle size={18}/>} 
                <span className="uppercase tracking-widest">{updateMsg.text}</span>
              </motion.div>
            )}

            {editMode && (
              <div className="flex gap-4 pt-6">
                <button type="submit" className="px-10 py-4 bg-indigo-600 text-white rounded-[1.5rem] font-black text-sm shadow-xl shadow-indigo-100 hover:bg-slate-900 transition-all active:scale-95">Simpan Perubahan</button>
                <button type="button" onClick={() => setEditMode(false)} className="px-10 py-4 bg-slate-100 text-slate-500 rounded-[1.5rem] font-bold text-sm hover:bg-slate-200 transition-all active:scale-95">Batalkan</button>
              </div>
            )}
          </form>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans antialiased text-slate-900 overflow-x-hidden selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* ─── MODALS ─── */}
      {renderDetailModal()}
      {renderInvoiceModal()}
      {renderPaymentModal()}

      {/* ─── SIDEBAR ─── */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-80 bg-white border-r border-slate-100 transition-transform duration-500 ease-in-out lg:translate-x-0 lg:static
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
       shadow-[-20px_0_60px_rgba(0,0,0,0.05)] lg:shadow-none`}>
        <div className="h-full flex flex-col p-10">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-4 mb-16 group">
            <div className="w-14 h-14 bg-indigo-600 rounded-[1.25rem] flex items-center justify-center shadow-2xl shadow-indigo-200 transition-transform group-hover:rotate-6">
              <Trophy size={30} className="text-yellow-300" />
            </div>
            <div>
              <div className="font-black text-slate-900 text-2xl leading-none tracking-tight">NCC 13th</div>
              <div className="text-[10px] text-indigo-400 font-extrabold uppercase tracking-[4px] mt-1.5 opacity-80">Dashboard</div>
            </div>
          </Link>

          {/* Nav */}
          <nav className="flex-1 space-y-3">
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={() => { 
                  setActiveTab(item.label as TabType); 
                  setIsSidebarOpen(false); 
                  if (item.label === "Pengumuman" && announcements.length > 0) {
                    setHasUnreadAnnouncements(false);
                    localStorage.setItem("ncc_last_read_announcement", announcements[0].id);
                  }
                }}
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-[1.5rem] text-sm font-black transition-all group ${
                  activeTab === item.label 
                    ? "bg-indigo-600 text-white shadow-2xl shadow-indigo-200 translate-x-1" 
                    : "text-slate-400 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <item.icon size={22} className={`transition-transform ${activeTab === item.label ? "scale-110" : "group-hover:scale-110"}`} />
                <span className="tracking-tight">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Bottom Info */}
          <div className="pt-10 border-t border-slate-50 space-y-3">
            <button className="w-full flex items-center gap-4 px-6 py-4 rounded-[1.5rem] text-sm font-bold text-slate-400 hover:bg-slate-50 transition-all">
              <Settings size={20} /> Pengaturan
            </button>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-4 px-6 py-4 rounded-[1.5rem] text-sm font-black text-rose-500 hover:bg-rose-50 transition-all"
            >
              <LogOut size={20} /> Keluar
            </button>
          </div>
        </div>
      </aside>

      {/* ─── MAIN CONTENT ─── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header */}
        <header className="h-28 bg-white/80 backdrop-blur-xl sticky top-0 z-40 border-b border-slate-100 flex items-center justify-between px-10 lg:px-16 shrink-0">
          <div className="flex items-center gap-8">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="lg:hidden p-4 bg-slate-50 rounded-2xl text-slate-500 hover:bg-indigo-50 transition-colors">
              {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div className="hidden sm:block">
               <div className="flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-[4px] mb-1">
                  NCC Portal <ChevronRight size={10} className="text-slate-200" /> {activeTab}
               </div>
               <h2 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">{activeTab}</h2>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden xl:flex relative items-center group">
              <Search size={18} className="absolute left-5 text-slate-300 transition-colors group-focus-within:text-indigo-500" />
              <input type="text" placeholder="Cari apapun..." className="pl-14 pr-8 py-4 bg-slate-50 border-2 border-slate-50 rounded-[1.5rem] text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white w-72 transition-all font-medium" />
            </div>
            <button className="p-4 text-slate-400 hover:bg-slate-50 hover:text-indigo-500 rounded-2xl relative transition-all group active:scale-95">
             <div className="relative">
               <Bell size={24}/>
               {hasUnreadAnnouncements && (
                 <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full animate-bounce" />
               )}
             </div>
               <span className="absolute top-4 right-4 w-2.5 h-2.5 bg-rose-500 border-[3px] border-white rounded-full group-hover:scale-125 transition-transform"/>
            </button>
            <div className="flex items-center gap-5 pl-6 border-l border-slate-100 ml-2">
               <div className="text-right hidden sm:block">
                  <div className="text-sm font-black text-slate-900 leading-none mb-0.5 tracking-tight">{session.fullName}</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest opacity-80">{session.email}</div>
               </div>
               <div className="w-14 h-14 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-[1.25rem] flex items-center justify-center text-indigo-600 font-black border border-indigo-100 shadow-sm text-xl transition-transform hover:scale-105 cursor-pointer">
                  {session.fullName.charAt(0)}
               </div>
            </div>
          </div>
        </header>

        {/* Dynamic Body Content */}
        <div className="flex-1 overflow-y-auto p-10 lg:p-16 scroll-smooth bg-[#F8FAFC]">
           <AnimatePresence mode="wait">
             <motion.div 
               key={activeTab}
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -20 }}
               transition={{ duration: 0.4, ease: "easeOut" }}
             >
                {activeTab === "Dashboard" && (
                   <>
                    <div className="mb-14 text-center lg:text-left">
                      <div className="inline-flex items-center gap-2 px-4 py-1 bg-white border border-slate-200 rounded-full text-[10px] font-black uppercase text-indigo-600 tracking-widest mb-4 shadow-sm">
                         <TrendingUp size={12}/> Live Dashboard Updates
                      </div>
                      <h1 className="text-5xl font-black text-slate-900 mb-3 tracking-tighter leading-tight">Selamat Datang kembali, {session.fullName.split(' ')[0]} 👋</h1>
                      <p className="text-slate-400 font-medium text-lg leading-relaxed max-w-2xl">Periksa status pendaftaran terbaru dan jadwal penting kompetisi Anda di sini.</p>
                    </div>
                    {renderOverview()}
                   </>
                )}
                {activeTab === "Kompetisi Saya" && renderCompetitions()}
                {activeTab === "Pengumuman" && renderAnnouncements()}
                {activeTab === "Pembayaran" && renderPayments()}
                {activeTab === "Profil" && renderProfile()}
             </motion.div>
           </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
