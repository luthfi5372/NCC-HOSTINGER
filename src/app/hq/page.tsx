"use client";

import { useState, useEffect } from "react";
import { 
  Shield, 
  Lock, 
  Settings, 
  Users, 
  Activity, 
  Bell, 
  Power, 
  Send, 
  AlertCircle,
  TrendingUp,
  CreditCard,
  UserCheck,
  Search,
  Filter,
  RefreshCcw,
  Edit2,
  Save,
  X as CloseIcon,
  Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  fetchSiteSettings, 
  updateSiteSettings, 
  fetchAllEntriesHybrid, 
  adminUpdateCompetitionEntry,
  adminUpdatePaymentStatusToSupabase
} from "@/lib/supabase/service";

// --- THEME CONSTANTS ---
const COLORS = {
  cyan: "#06b6d4",
  purple: "#6366f1",
  rose: "#f43f5e",
  emerald: "#10b981",
  amber: "#f59e0b",
  glass: "rgba(255, 255, 255, 0.03)",
  border: "rgba(255, 255, 255, 0.1)"
};

export default function HQPage() {
  const [isLocked, setIsLocked] = useState(true);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<any>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"dashboard" | "participants" | "settings">("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>(null);

  // Load Initial Data
  useEffect(() => {
    if (!isLocked) {
      loadData();
    }
  }, [isLocked]);

  async function loadData() {
    setIsLoading(true);
    const [settRes, entriesData] = await Promise.all([
      fetchSiteSettings(),
      fetchAllEntriesHybrid()
    ]);
    if (settRes.data) setSettings(settRes.data);
    if (entriesData) setEntries(entriesData);
    setIsLoading(false);
  }

  const handleUnlock = () => {
    if (pin === "123456") {
      setIsLocked(false);
      setError("");
    } else {
      setError("PIN SALAH. AKSES DITOLAK.");
      setPin("");
    }
  };

  const handleToggleRegistration = async () => {
    const newVal = !settings.is_registration_open;
    const { error } = await updateSiteSettings({ is_registration_open: newVal });
    if (!error) {
       setSettings({ ...settings, is_registration_open: newVal });
    }
  };

  const handleUpdateAnnouncement = async (text: string) => {
    const { error } = await updateSiteSettings({ live_announcement: text });
    if (!error) {
      setSettings({ ...settings, live_announcement: text });
      alert("Pengumuman berhasil disuntikkan secara LIVE!");
    }
  };

  const handleInlineEdit = (entry: any) => {
    setEditingId(entry.id);
    setEditForm({ ...entry });
  };

  const saveInlineEdit = async () => {
    if (!editingId || !editForm) return;
    const { success } = await adminUpdateCompetitionEntry(editingId, editForm);
    if (success) {
      setEntries(entries.map(e => e.id === editingId ? editForm : e));
      setEditingId(null);
    }
  };

  // --- RENDER PIN LOCK ---
  if (isLocked) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 font-sans">
        <motion.div 
           initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
           className="w-full max-w-md bg-white/5 border border-white/10 backdrop-blur-2xl rounded-[2.5rem] p-10 relative overflow-hidden"
        >
          {/* Decorative Glow */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-cyan-500/20 blur-[100px] rounded-full" />
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500/20 blur-[100px] rounded-full" />

          <div className="text-center relative z-10">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/20">
              <Shield className="text-cyan-400" size={32} />
            </div>
            <h1 className="text-2xl font-black text-white tracking-widest uppercase mb-2">Command Center</h1>
            <p className="text-white/40 text-xs font-bold tracking-widest uppercase">NCC 13th Restricted Access</p>
          </div>

          <div className="mt-10 space-y-4 relative z-10">
            <div className="relative">
              <input 
                type="password" 
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                placeholder="MASUKKAN PIN"
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-center text-white font-black tracking-[1rem] placeholder:tracking-widest placeholder:text-white/20 focus:border-cyan-500/50 outline-none transition-all"
              />
              <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20" size={18} />
            </div>
            {error && <p className="text-rose-500 text-[10px] font-black text-center uppercase tracking-widest animate-pulse">{error}</p>}
            <button 
              onClick={handleUnlock}
              className="w-full py-4 bg-gradient-to-r from-cyan-600 to-indigo-600 text-white rounded-2xl font-black tracking-widest uppercase text-sm shadow-xl shadow-cyan-900/20 active:scale-95 transition-all"
            >
              AUTHENTICATE
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // --- ANALYTICS DATA PREP ---
  const pieData = [
    { name: 'Olimpiade MIPA', value: entries.filter(e => e.category === 'Olimpiade MIPA').length || 0 },
    { name: 'Speech Contest', value: entries.filter(e => e.category === 'Speech Contest').length || 0 },
    { name: 'LKTI Nasional', value: entries.filter(e => e.category === 'LKTI Nasional').length || 0 },
    { name: 'MTQ Nasional', value: entries.filter(e => e.category === 'MTQ Nasional').length || 0 },
  ];

  // --- RENDER MAIN HQ ---
  return (
    <div className="min-h-screen bg-[#020617] text-white flex font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-24 bg-[#020617] border-r border-white/5 flex flex-col items-center py-10 gap-10">
        <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-cyan-400">
          <Activity size={24} />
        </div>
        
        <div className="flex-1 flex flex-col gap-6">
          <NavIcon icon={TrophyIcon} active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <NavIcon icon={Users} active={activeTab === 'participants'} onClick={() => setActiveTab('participants')} />
          <NavIcon icon={Settings} active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </div>

        <button onClick={() => setIsLocked(true)} className="p-3 text-white/40 hover:text-rose-500 transition-colors">
          <Power size={24} />
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-12">
        <header className="flex justify-between items-end mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
              <p className="text-[10px] font-black text-cyan-400 uppercase tracking-[4px]">System Status: Online</p>
            </div>
            <h2 className="text-4xl font-black tracking-tight">
              NCC <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500">COMMAND CENTER</span>
            </h2>
          </div>
          
          <div className="flex gap-4">
             <button onClick={loadData} className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-2 hover:bg-white/10 transition-all">
                <RefreshCcw size={16} className={isLoading ? "animate-spin" : ""} />
                <span className="text-xs font-bold uppercase tracking-widest">Update Data</span>
             </button>
          </div>
        </header>

        {/* Dashboard View */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-12 gap-8">
            {/* Quick Stats */}
            <div className="col-span-12 grid grid-cols-4 gap-6">
               <StatCard label="Pendaftar" value={entries.length} icon={Users} color="cyan" />
               <StatCard label="Terverifikasi" value={entries.filter(e => e.payment_status === 'Verified').length} icon={UserCheck} color="emerald" />
               <StatCard label="Menunggu" value={entries.filter(e => e.payment_status === 'Paid').length} icon={CreditCard} color="amber" />
               <StatCard label="Pendaftaran" value={settings?.is_registration_open ? "OPEN" : "CLOSED"} icon={Power} color={settings?.is_registration_open ? "emerald" : "rose"} />
            </div>

            {/* Graphs Grid */}
            <div className="col-span-8 bg-white/[0.02] border border-white/5 rounded-[2rem] p-8">
               <h3 className="text-sm font-black uppercase tracking-[3px] text-white/40 mb-8 flex items-center gap-3">
                  <TrendingUp size={16} /> Registrasi Metrics
               </h3>
               <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={entries.map((_, i) => ({ val: i + 1 }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem' }}
                        itemStyle={{ color: COLORS.cyan, fontWeight: 'bold' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="val" 
                        stroke={COLORS.cyan} 
                        strokeWidth={4} 
                        dot={false}
                        animationDuration={2000}
                      />
                    </LineChart>
                  </ResponsiveContainer>
               </div>
            </div>

            <div className="col-span-4 bg-white/[0.02] border border-white/5 rounded-[2rem] p-8">
               <h3 className="text-sm font-black uppercase tracking-[3px] text-white/40 mb-8">Category Split</h3>
               <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        innerRadius={80}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index % 4]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
               </div>
            </div>
          </div>
        )}

        {/* Settings View */}
        {activeTab === 'settings' && (
          <div className="max-w-4xl grid grid-cols-2 gap-8">
            {/* Kill Switch Card */}
            <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-10 flex flex-col items-center text-center">
               <div className={`w-20 h-20 rounded-3xl mb-6 flex items-center justify-center transition-all ${settings?.is_registration_open ? 'bg-emerald-500/20 text-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.2)]' : 'bg-rose-500/20 text-rose-500'}`}>
                  <Power size={40} />
               </div>
               <h3 className="text-xl font-black mb-2">Status Pendaftaran</h3>
               <p className="text-white/40 text-sm mb-8">Mengunci pendaftaran untuk publik secara instan.</p>
               <button 
                onClick={handleToggleRegistration}
                className={`px-10 py-4 rounded-2xl font-black text-sm transition-all active:scale-95 ${settings?.is_registration_open ? 'bg-rose-500 text-white shadow-lg shadow-rose-900/20' : 'bg-emerald-500 text-white shadow-lg shadow-emerald-900/20'}`}
               >
                 {settings?.is_registration_open ? "TUTUP SEKARANG" : "BUKA SEKARANG"}
               </button>
            </div>

            {/* Live Announcement Card */}
            <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-10 flex flex-col">
               <div className="w-14 h-14 bg-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mb-6">
                  <Bell size={28} />
               </div>
               <h3 className="text-xl font-black mb-2">Live Announcement</h3>
               <p className="text-white/40 text-sm mb-6">Suntikkan pesan langsung ke dashboard semua peserta.</p>
               <textarea 
                defaultValue={settings?.live_announcement}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleUpdateAnnouncement((e.target as HTMLTextAreaElement).value);
                  }
                }}
                className="flex-1 bg-black/40 border border-white/10 rounded-2xl p-4 text-sm font-medium outline-none focus:border-cyan-500/50 transition-all mb-4"
                placeholder="Tulis pesan..."
               />
               <button className="py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white/10">
                  <Send size={14} /> Update Pesan
               </button>
            </div>
          </div>
        )}

        {/* Participant View */}
        {activeTab === 'participants' && (
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <input 
                  type="text" 
                  placeholder="CARI DATA PESERTA..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-12 py-4 text-sm font-bold placeholder:text-white/10 focus:border-cyan-500/50 outline-none transition-all"
                />
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
              </div>
              <button className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-2">
                <Filter size={18} />
              </button>
            </div>

            <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] overflow-hidden">
               <table className="w-full text-left">
                  <thead className="bg-white/[0.02] border-b border-white/5">
                    <tr>
                      <th className="px-8 py-6 text-[10px] font-black text-white/30 uppercase tracking-[2px]">Nama / Email</th>
                      <th className="px-8 py-6 text-[10px] font-black text-white/30 uppercase tracking-[2px]">Kategori / Sekolah</th>
                      <th className="px-8 py-6 text-[10px] font-black text-white/30 uppercase tracking-[2px]">Status Bayar</th>
                      <th className="px-8 py-6 text-[10px] font-black text-white/30 uppercase tracking-[2px]">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.03]">
                    {entries.filter(e => 
                      e.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                      e.email?.toLowerCase().includes(searchTerm.toLowerCase())
                    ).map(entry => (
                      <tr key={entry.id} className="hover:bg-white/[0.01] transition-all group">
                        <td className="px-8 py-6">
                          {editingId === entry.id ? (
                            <input 
                              className="bg-black/40 border border-cyan-500/30 rounded p-1 text-sm w-full"
                              value={editForm.fullName}
                              onChange={e => setEditForm({...editForm, fullName: e.target.value})}
                            />
                          ) : (
                            <div>
                               <div className="font-black text-white">{entry.fullName}</div>
                               <div className="text-xs text-white/40 font-medium">{entry.email}</div>
                            </div>
                          )}
                        </td>
                        <td className="px-8 py-6">
                           <div className="text-xs font-black text-cyan-400">{entry.category}</div>
                           <div className="text-xs text-white/40 font-bold">{entry.school}</div>
                        </td>
                        <td className="px-8 py-6">
                           <StatusBadge status={entry.payment_status} entry={entry} onUpdate={() => loadData()} />
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                              {editingId === entry.id ? (
                                <>
                                  <button onClick={saveInlineEdit} className="p-2 bg-emerald-500/20 text-emerald-500 rounded-lg hover:bg-emerald-500/30">
                                    <Save size={16} />
                                  </button>
                                  <button onClick={() => setEditingId(null)} className="p-2 bg-white/5 text-white/40 rounded-lg">
                                    <CloseIcon size={16} />
                                  </button>
                                </>
                              ) : (
                                <button onClick={() => handleInlineEdit(entry)} className="p-2 bg-cyan-500/10 text-cyan-400 rounded-lg hover:bg-cyan-500/20">
                                  <Edit2 size={16} />
                                </button>
                              )}
                              <button className="p-2 bg-rose-500/10 text-rose-500 rounded-lg hover:bg-rose-500/20">
                                <Trash2 size={16} />
                              </button>
                           </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// --- SUB COMPONENTS ---

function TrophyIcon(props: any) {
  return <TrendingUp {...props} />;
}

function NavIcon({ icon: Icon, active, onClick }: { icon: any, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${active ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-900/30' : 'text-white/30 hover:bg-white/5 hover:text-white'}`}
    >
      <Icon size={24} />
    </button>
  );
}

function StatCard({ label, value, icon: Icon, color }: any) {
  const colorMap: any = {
    cyan: "text-cyan-400 bg-cyan-400/5 border-cyan-400/10",
    emerald: "text-emerald-400 bg-emerald-400/5 border-emerald-400/10",
    amber: "text-amber-400 bg-amber-400/5 border-amber-400/10",
    rose: "text-rose-400 bg-rose-400/5 border-rose-400/10"
  };

  return (
    <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6">
       <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 border ${colorMap[color]}`}>
          <Icon size={20} />
       </div>
       <div className="text-sm font-black text-white/40 uppercase tracking-widest mb-1">{label}</div>
       <div className="text-2xl font-black">{value}</div>
    </div>
  );
}

function StatusBadge({ status, entry, onUpdate }: { status: string, entry: any, onUpdate: () => void }) {
  const getStyle = () => {
    switch(status) {
      case 'Verified': return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case 'Paid': return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      default: return "bg-white/5 text-white/40 border-white/10";
    }
  };

  const handleVerify = async () => {
    if (status === 'Paid') {
       if (confirm(`Verifikasi pembayaran untuk ${entry.fullName}?`)) {
          const { success } = await adminUpdatePaymentStatusToSupabase(entry.id, 'Verified');
          if (success) onUpdate();
       }
    }
  };

  return (
    <button 
      onClick={handleVerify}
      className={`px-4 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest transition-all ${getStyle()} ${status === 'Paid' ? 'hover:scale-105 active:scale-95 cursor-pointer shadow-lg shadow-amber-900/10' : 'cursor-default'}`}
    >
      {status || "None"}
    </button>
  );
}
