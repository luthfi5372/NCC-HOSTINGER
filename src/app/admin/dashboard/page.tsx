"use client";

import { useEffect, useState } from "react";
import { 
  Search, 
  Filter, 
  Trash2, 
  Edit, 
  Download, 
  Plus,
  CheckCircle,
  Clock,
  AlertCircle,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  CheckCircle2,
  QrCode
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  getAllCompetitionEntries, 
  addAdminLog,
  deleteCompetitionEntry,
  submitCompetitionEntry,
  CompetitionEntry
} from "@/lib/localAuth";
import { fetchAllEntriesHybrid, adminUpdatePaymentStatusToSupabase } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/client";
import AdminAnalytics from "@/components/AdminAnalytics";

export default function AdminDashboard() {
  const [entries, setEntries] = useState<CompetitionEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPassModal, setShowPassModal] = useState<string | null>(null); // email of user
  const [newPass, setNewPass] = useState("");
  const [viewProof, setViewProof] = useState<CompetitionEntry | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Add Form State
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    school: "",
    category: "Olimpiade MIPA",
    city: "Jakarta",
    teamSize: "1",
    notes: ""
  });

  useEffect(() => {
    refreshData();

    // Tahap 4: Listen to pure Real-Time PostgreSQL changes over websockets
    const supabase = createClient();
    const channel = supabase
      .channel('realtime_admin_pendaftaran')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'competition_entries' }, 
        (payload) => {
          console.log('Peserta baru masuk secara Real-Time!', payload.new);
          
          // Hydrate and map Supabase payload to local state
          const newEntry = {
            ...payload.new,
            id: payload.new.id,
            fullName: payload.new.full_name || "Peserta Baru",
            email: payload.new.email,
            phone: payload.new.phone,
            school: payload.new.school,
            city: payload.new.city,
            category: payload.new.category,
            teamSize: payload.new.team_size?.toString() || "1",
            notes: payload.new.notes,
            paymentStatus: payload.new.payment_status || "Wait",
            submittedAt: payload.new.created_at || new Date().toISOString(),
            submissionUrl: payload.new.submission_url,
            submissionStatus: payload.new.submission_status || "Belum Mengumpulkan"
          };
          
          setEntries((prev) => [newEntry as any, ...prev]); 
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const refreshData = async () => {
    try {
      const allEntries = await fetchAllEntriesHybrid();
      setEntries(allEntries);
    } catch (err) {
      console.error("Admin refresh error:", err);
      // Fallback if service fails
      setEntries(getAllCompetitionEntries());
    }
  };


  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = submitCompetitionEntry({
      ...formData,
      paymentStatus: "Verified"
    });
    if (res.success) {
      addAdminLog(`Manually registered participant: ${formData.email} (${formData.category})`);
      setShowAddModal(false);
      refreshData();
    } else {
      alert(res.error);
    }
  };

  const handlePassReset = () => {
    if (showPassModal) {
      const res = adminUpdateUserPassword(showPassModal, newPass);
      if (res.success) {
        addAdminLog(`Reset password for user: ${showPassModal}`);
        alert("Password updated successfully.");
        setShowPassModal(null);
        setNewPass("");
      }
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this participant? This action is permanent.")) {
      deleteCompetitionEntry(id);
      addAdminLog(`Deleted competition entry: ID ${id}`);
      refreshData();
    }
  };

  const handleUpdateStatus = async (id: string, status: any) => {
    const res = await adminUpdatePaymentStatusToSupabase(id, status);
    if (!res.success) alert(res.error);
    addAdminLog(`Updated payment status for Entry ID ${id} to ${status}`);
    refreshData();
  };

  const handleVerifyPayment = async (id: string) => {
    setIsVerifying(true);
    // Tiny delay for feedback
    await new Promise(r => setTimeout(r, 500));
    
    const res = await adminUpdatePaymentStatusToSupabase(id, "Verified");
    if (res.success) {
      if (viewProof) {
        // Fire and forget email notification
        fetch("/api/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: viewProof.email,
            fullName: viewProof.fullName,
            id: viewProof.id,
            category: viewProof.category
          })
        }).catch(err => console.error("Email notification failed silently:", err));
      }

      setViewProof(null);
      refreshData();
    } else {
      alert(res.error);
    }
    setIsVerifying(false);
  };

  const handleRejectPayment = async (id: string) => {
    if (confirm("Reject this payment proof? Status will return to Pending.")) {
      const res = await adminUpdatePaymentStatusToSupabase(id, "Wait");
      if (!res.success) alert(res.error);
      addAdminLog(`Rejected payment proof for Entry ID ${id}`);
      setViewProof(null);
      refreshData();
    }
  };

  const handleExportCSV = () => {
    if (entries.length === 0) return;
    
    // Add BOM for Excel UTF-8 support
    const BOM = "\uFEFF";
    const headers = ["ID Pendaftaran", "Nama Lengkap", "Email", "Nomor WhatsApp", "Asal Sekolah", "Provinsi", "Kategori Lomba", "Tipe", "Waktu Daftar", "Status Pembayaran"];
    const csvRows = [
      headers.join(","),
      ...entries.map(e => [
        `"NCC-${String(e.id).slice(0, 10).toUpperCase()}"`, 
        `"${e.fullName}"`, 
        `"${e.email}"`, 
        `"=""${e.phone}"""`, // Escaped for Excel to prevent scientific notation
        `"${e.school}"`,
        `"${e.city}"`,
        `"${e.category}"`,
        `"${e.teamSize}"`,
        `"${new Date(e.submittedAt).toLocaleString()}"`,
        `"${e.paymentStatus}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([BOM + csvRows], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `NCC_Data_Pendaftar_${new Date().toLocaleDateString('id-ID').replace(/\//g, '-')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    addAdminLog(`Exported ${entries.length} rows to CSV`);
  };

  const filteredEntries = entries.filter(e => {
    const matchesSearch = e.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          e.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          e.school.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "All" || e.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  if (!entries) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Verified": return <span className="flex items-center gap-2 text-emerald-400 text-[11px] font-bold"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" /> Ready</span>;
      case "Wait": return <span className="flex items-center gap-2 text-amber-400 text-[11px] font-bold"><div className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Pending</span>;
      case "Paid": return <span className="flex items-center gap-2 text-indigo-400 text-[11px] font-bold"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> Paid</span>;
      default: return <span className="text-slate-500 text-[11px] font-bold">None</span>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 font-inter">
      {/* Vercel-style Breadcrumbs & Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-[13px] text-slate-500 font-medium">
          <span className="hover:text-white cursor-pointer transition-colors">national-creativity-competition</span>
          <span className="text-white/20">/</span>
          <span className="text-white px-2 py-0.5 bg-white/10 rounded-md">participants-control</span>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Participants Control</h1>
            <p className="text-slate-500 text-[13px] font-medium mt-1">Direct oversight of all registered competition entries.</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleExportCSV}
              className="px-4 py-2 bg-white/5 border border-white/10 text-slate-300 font-bold rounded-lg text-[12px] hover:bg-white/10 transition-all flex items-center gap-2"
            >
              <Download size={14} /> Export Data
            </button>
            <Link 
              href="/admin/scanner"
              className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg text-[12px] hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20"
            >
              <QrCode size={14} /> Scan Presence
            </Link>
            <button 
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-white text-black font-bold rounded-lg text-[12px] hover:bg-slate-200 transition-all flex items-center gap-2"
            >
              <Plus size={14} /> Manual Entry
            </button>
          </div>
        </div>
      </div>

      {/* Recharts Analytics Panel */}
      <AdminAnalytics entries={entries} />

      {/* Modals (Vercel Style) */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#000]/80 backdrop-blur-sm">
            <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               className="bg-[#000] border border-white/10 w-full max-w-lg rounded-xl p-8 shadow-2xl relative"
            >
               <h3 className="text-lg font-bold text-white mb-6">Create New Entry</h3>
               <form onSubmit={handleAddSubmit} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Full Name</label>
                        <input required className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-[13px] font-medium text-white focus:outline-none focus:border-indigo-500/50 transition-colors" onChange={e => setFormData({...formData, fullName: e.target.value})} />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Email</label>
                        <input required type="email" className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-[13px] font-medium text-white focus:outline-none focus:border-indigo-500/50 transition-colors" onChange={e => setFormData({...formData, email: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Category</label>
                    <select className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-[13px] font-medium text-white focus:outline-none focus:border-indigo-500/50 transition-colors" onChange={e => setFormData({...formData, category: e.target.value})}>
                        <option value="Olimpiade MIPA">Olimpiade MIPA</option>
                        <option value="Speech Contest">Speech Contest</option>
                        <option value="LKTI Nasional">LKTI Nasional</option>
                        <option value="MTQ Nasional">MTQ Nasional</option>
                    </select>
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 text-[12px] font-bold text-slate-400 hover:text-white transition-colors">Cancel</button>
                    <button className="flex-1 py-2.5 bg-white text-black rounded-lg text-[12px] font-bold hover:bg-slate-200 transition-all">Submit Entry</button>
                  </div>
               </form>
            </motion.div>
          </div>
        )}

        {viewProof && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center p-6 bg-[#000]/90 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-[#000] border border-white/10 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row"
            >
              <div className="flex-1 bg-white/5 flex items-center justify-center p-8 border-b md:border-b-0 md:border-r border-white/10 min-h-[400px]">
                {viewProof.paymentProofUrl ? (
                  <img src={viewProof.paymentProofUrl} alt="Payment Proof" className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl border border-white/10" />
                ) : (
                  <div className="text-center opacity-40">
                    <FileText size={64} className="text-white mx-auto mb-4" />
                    <p className="text-white font-bold uppercase tracking-widest text-[10px]">Reference Document Missing</p>
                  </div>
                )}
              </div>
              <div className="w-full md:w-96 p-10 flex flex-col justify-between bg-[#0a0a0a]">
                <div className="space-y-8">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">{viewProof.fullName}</h3>
                    <p className="text-sm text-slate-500 font-medium">{viewProof.email}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Category</p>
                      <p className="text-[13px] font-bold text-white">{viewProof.category}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Status</p>
                      <p className="text-[13px] font-bold text-white">{viewProof.paymentStatus}</p>
                    </div>
                  </div>

                  <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Internal Note</p>
                    <p className="text-[12px] text-slate-400 font-medium leading-relaxed">{viewProof.notes || "No additional metadata provided by user."}</p>
                  </div>
                </div>

                <div className="pt-10 space-y-3">
                  {viewProof.paymentStatus === "Paid" && (
                    <>
                      <button 
                        onClick={() => handleVerifyPayment(viewProof.id)}
                        disabled={isVerifying}
                        className="w-full py-3 bg-white text-black rounded-lg text-[12px] font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                      >
                        {isVerifying ? "Processing..." : "Verify & Approve"}
                      </button>
                      <button 
                        onClick={() => handleRejectPayment(viewProof.id)}
                        className="w-full py-3 bg-white/5 text-rose-500 rounded-lg text-[12px] font-bold hover:bg-rose-500/10 transition-all border border-rose-500/20"
                      >
                        Reject Submission
                      </button>
                    </>
                  )}
                  <button onClick={() => setViewProof(null)} className="w-full py-3 text-[12px] font-bold text-slate-500 hover:text-white transition-colors">Close Preview</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modern Filter Strip */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
          <input 
            type="text" 
            placeholder="Search registrations..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-2.5 bg-[#000] border border-white/10 rounded-lg text-[13px] font-medium text-white focus:outline-none focus:border-white/30 transition-all placeholder:text-slate-600"
          />
        </div>
        <div className="flex items-center gap-2 bg-[#000] border border-white/10 rounded-lg px-4 py-2.5">
           <Filter size={14} className="text-slate-600" />
           <select 
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-transparent text-[13px] font-bold text-slate-400 focus:outline-none cursor-pointer"
           >
              <option value="All">All Categories</option>
              {["Olimpiade MIPA", "Speech Contest", "LKTI Nasional", "MTQ Nasional"].map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
           </select>
        </div>
      </div>

      {/* Vercel-style Clean Table */}
      <div className="bg-[#000] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/10">
                <th className="px-8 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Identity</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Competition</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center">Docs</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center">Submission</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Date</th>
                <th className="px-8 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">Settings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <AnimatePresence mode="popLayout">
                {filteredEntries.map((entry) => (
                  <motion.tr 
                    key={entry.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="hover:bg-white/[0.02] transition-colors group"
                  >
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white font-bold text-[11px]">
                          {entry.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="text-[13px] font-bold text-white">{entry.fullName}</div>
                          <div className="text-[12px] text-slate-500">{entry.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-[13px] font-bold text-slate-300">{entry.category}</div>
                      <div className="text-[11px] text-slate-500 font-medium truncate max-w-[150px]">{entry.school}</div>
                    </td>
                    <td className="px-6 py-5">
                      {getStatusBadge(entry.paymentStatus)}
                    </td>
                    <td className="px-6 py-5 text-center">
                      {entry.paymentProofUrl ? (
                        <button 
                          onClick={() => setViewProof(entry)} 
                          className="p-2 bg-white/5 text-slate-400 rounded-lg hover:bg-white/10 hover:text-white transition-all border border-white/10"
                        >
                          <Eye size={14} />
                        </button>
                      ) : (
                        <span className="text-slate-700"><FileText size={14} className="mx-auto opacity-20" /></span>
                      )}
                    </td>
                    <td className="px-6 py-5 text-center">
                      {(entry.submission_url || entry.submissionUrl) ? (
                        <a 
                          href={entry.submission_url || entry.submissionUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="inline-flex p-2 bg-indigo-500/10 text-indigo-400 rounded-lg hover:bg-indigo-500/20 hover:text-indigo-300 transition-all border border-indigo-500/20"
                          title="Download Karya"
                        >
                          <Download size={14} />
                        </a>
                      ) : (
                        <span className="text-slate-700 font-bold text-[10px] uppercase tracking-tighter opacity-30">None</span>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-[12px] font-medium text-slate-500">
                        {new Date(entry.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button title="Reset Auth" className="p-2 text-slate-500 hover:text-white transition-colors" onClick={() => setShowPassModal(entry.email)}><Edit size={14} /></button>
                        <button title="Quick Delete" className="p-2 text-slate-500 hover:text-rose-500 transition-colors" onClick={() => handleDelete(entry.id)}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        
        {filteredEntries.length === 0 && (
          <div className="p-24 text-center">
            <AlertCircle className="text-slate-700 mx-auto mb-4" size={32} />
            <h3 className="text-sm font-bold text-slate-500 italic">No indexed records matching current filter.</h3>
          </div>
        )}

        {/* Vercel-style Footer Pagination */}
        <div className="px-8 py-4 bg-white/[0.02] border-t border-white/10 flex items-center justify-between">
           <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Active Entries Index: {filteredEntries.length}</span>
           <div className="flex items-center gap-1">
             <button className="p-2 text-slate-600 hover:text-white transition-colors"><ChevronLeft size={16}/></button>
             <button className="p-2 text-slate-600 hover:text-white transition-colors"><ChevronRight size={16}/></button>
           </div>
        </div>
      </div>
    </div>
  );
}
