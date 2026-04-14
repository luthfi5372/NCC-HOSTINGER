"use client";

import { useState, useEffect } from "react";
import { 
  Search, 
  Filter, 
  User, 
  Shield, 
  Clock, 
  Calendar,
  Mail,
  Phone,
  School,
  ChevronRight,
  ChevronLeft,
  X,
  CreditCard,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  getUsers, 
  adminGetFullUserDetail,
  LocalUser,
  CompetitionEntry 
} from "@/lib/localAuth";

export default function UserManagement() {
  const [users, setUsers] = useState<LocalUser[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("All");
  const [selectedUser, setSelectedUser] = useState<{ user: LocalUser; entries: CompetitionEntry[] } | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setUsers(getUsers());
  };

  const handleViewDetails = async (email: string) => {
    setIsLoadingDetails(true);
    // Simulate loading for better UX
    await new Promise(r => setTimeout(r, 600));
    const details = adminGetFullUserDetail(email);
    if (details.user) {
      setSelectedUser({ user: details.user, entries: details.entries });
    }
    setIsLoadingDetails(false);
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "All" || u.role === filterRole.toLowerCase();
    return matchesSearch && matchesRole;
  });

  if (!users) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-700 font-inter">
      {/* Vercel-style Breadcrumbs & Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-[13px] text-slate-500 font-medium">
          <span className="hover:text-white cursor-pointer transition-colors">national-creativity-competition</span>
          <span className="text-white/20">/</span>
          <span className="text-white px-2 py-0.5 bg-white/10 rounded-md">user-accounts-index</span>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Identity Management</h1>
            <p className="text-slate-500 text-[13px] font-medium mt-1">Directory of all accounts within the NCC production environment.</p>
          </div>
        </div>
      </div>

      {/* Stats Quick View (Vercel Style) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Total Accounts", value: users.length, icon: User, status: "Ready" },
          { label: "Security Privileged", value: users.filter(u => u.role === 'admin').length, icon: Shield, status: "Admin" },
          { label: "New Provisions", value: users.filter(u => new Date(u.createdAt).toDateString() === new Date().toDateString()).length, icon: Calendar, status: "Today" }
        ].map((stat, i) => (
          <div key={i} className="bg-[#000] p-6 rounded-xl border border-white/10 shadow-sm flex flex-col justify-between h-32">
             <div className="flex justify-between items-center">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${i === 1 ? "bg-indigo-500" : "bg-emerald-500"} shadow-[0_0_8px_rgba(16,185,129,0.3)] animate-pulse`} />
                  <span className="text-[10px] font-bold text-slate-400 capitalize">{stat.status}</span>
                </div>
             </div>
             <div className="text-3xl font-bold text-white tracking-tight">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Modern Filter Strip */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
          <input 
            type="text" 
            placeholder="Filter accounts by identity or email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-2.5 bg-[#000] border border-white/10 rounded-lg text-[13px] font-medium text-white focus:outline-none focus:border-white/30 transition-all placeholder:text-slate-600"
          />
        </div>
        <div className="flex items-center gap-2 bg-[#000] border border-white/10 rounded-lg px-4 py-2.5">
           <Filter size={14} className="text-slate-600" />
           <select 
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="bg-transparent text-[13px] font-bold text-slate-400 focus:outline-none cursor-pointer"
           >
              <option value="All">All Identities</option>
              <option value="Admin">Admin Only</option>
              <option value="User">Standard User</option>
           </select>
        </div>
      </div>

      {/* Vercel-style Table */}
      <div className="bg-[#000] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/10">
                <th className="px-8 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Account Identity</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Email Address</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Privilege Level</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Provisioned At</th>
                <th className="px-8 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">System Management</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <AnimatePresence mode="popLayout">
                {filteredUsers.map((u) => (
                  <motion.tr 
                    key={u.email}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="hover:bg-white/[0.02] transition-colors group"
                  >
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white font-bold text-[11px]">
                          {u.fullName.charAt(0)}
                        </div>
                        <div className="text-[13px] font-bold text-white">{u.fullName}</div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-[13px] text-slate-400 font-medium">{u.email}</div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-tight border ${
                        u.role === 'admin' 
                          ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20 shadow-[0_0_10px_rgba(99,102,241,0.1)]" 
                          : "bg-white/5 text-slate-500 border-white/10"
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-[12px] font-medium text-slate-500">
                        {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                       <button 
                        onClick={() => handleViewDetails(u.email)}
                        className="px-4 py-1.5 bg-white/5 border border-white/20 text-slate-300 rounded-lg text-[11px] font-bold hover:bg-white hover:text-black transition-all"
                       >
                          Inspect Profiling
                       </button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        
        {filteredUsers.length === 0 && (
          <div className="p-24 text-center">
             <AlertCircle className="text-slate-700 mx-auto mb-4" size={32} />
             <p className="text-sm font-bold text-slate-500 italic">No users matching search pattern in active environment.</p>
          </div>
        )}
      </div>

      {/* User Detail Modal (Vercel Style) */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-[#000]/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-[#000] border border-white/10 w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden flex flex-col md:flex-row"
            >
               {/* Left: Profile Information Overlay */}
               <div className="w-full md:w-80 bg-white/[0.02] p-12 border-b md:border-b-0 md:border-r border-white/10">
                  <div className="flex flex-col items-center text-center">
                     <div className="w-20 h-20 bg-gradient-to-tr from-indigo-500 to-purple-600 text-white rounded-full flex items-center justify-center text-2xl font-black shadow-2xl shadow-indigo-500/20 mb-6">
                        {selectedUser.user.fullName.charAt(0)}
                     </div>
                     <h3 className="text-xl font-bold text-white tracking-tight leading-tight">{selectedUser.user.fullName}</h3>
                     <p className="text-[11px] text-indigo-400 font-bold uppercase tracking-widest mt-2 px-2 py-0.5 bg-indigo-500/10 rounded border border-indigo-500/20">{selectedUser.user.role}</p>
                  </div>

                  <div className="mt-12 space-y-8">
                     <div className="space-y-1.5">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">System Email</p>
                        <p className="text-[13px] font-bold text-white truncate">{selectedUser.user.email}</p>
                     </div>
                     <div className="space-y-1.5">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Institution</p>
                        <p className="text-[13px] font-bold text-white leading-relaxed">{selectedUser.user.school}</p>
                     </div>
                     <div className="space-y-1.5">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Account Status</p>
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <p className="text-[12px] font-bold text-emerald-400">Authenticated</p>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Right: Activity Log & Participation */}
               <div className="flex-1 p-12 overflow-y-auto max-h-[85vh] bg-[#000]">
                  <div className="flex justify-between items-center mb-10">
                    <h4 className="text-lg font-bold text-white tracking-tight italic opacity-80">Security Profiling & Activity</h4>
                    <button onClick={() => setSelectedUser(null)} className="p-2 border border-white/10 hover:bg-white/5 rounded-lg transition-colors text-slate-500"><X size={18} /></button>
                  </div>

                  <div className="space-y-10">
                     {/* Competition Participation */}
                     <div>
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-6">Indexed Submissions</p>
                        
                        {selectedUser.entries.length === 0 ? (
                           <div className="p-12 bg-white/[0.01] rounded-xl border border-dashed border-white/10 text-center">
                             <CreditCard size={32} className="mx-auto text-slate-700 mb-3" />
                             <p className="text-[11px] text-slate-600 font-bold uppercase tracking-widest italic">User profile has no active competition entries recorded.</p>
                           </div>
                        ) : (
                          <div className="space-y-3">
                            {selectedUser.entries.map(entry => (
                              <div key={entry.id} className="p-5 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between group hover:border-white/20 transition-all">
                                 <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white/5 text-slate-500 rounded-lg flex items-center justify-center border border-white/10 group-hover:text-white transition-colors">
                                       <CreditCard size={18} />
                                    </div>
                                    <div>
                                       <div className="text-[13px] font-bold text-white">{entry.category}</div>
                                       <div className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">{new Date(entry.submittedAt).toLocaleDateString()}</div>
                                    </div>
                                 </div>
                                 <div className="text-right flex items-center gap-3">
                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-tight border ${
                                      entry.paymentStatus === 'Verified' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                                      entry.paymentStatus === 'Paid' ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" :
                                      "bg-white/5 text-slate-500 border-white/10"
                                    }`}>
                                       {entry.paymentStatus}
                                    </span>
                                 </div>
                              </div>
                            ))}
                          </div>
                        )}
                     </div>

                     {/* System Metadata Grid */}
                     <div className="grid grid-cols-2 gap-4">
                        <div className="p-6 bg-white/[0.02] border border-white/10 rounded-xl">
                           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Registration Epoch</p>
                           <p className="text-sm font-bold text-white">{new Date(selectedUser.user.createdAt).toLocaleString()}</p>
                        </div>
                        <div className="p-6 bg-white/[0.02] border border-white/10 rounded-xl">
                           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Security Salt Hash</p>
                           <p className="text-sm font-bold text-indigo-400 font-mono">MD5_NCC_PROD_{selectedUser.user.email.slice(0, 4).toUpperCase()}</p>
                        </div>
                     </div>
                  </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Loading Overlay */}
      {isLoadingDetails && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#000]/40 backdrop-blur-sm">
           <div className="flex flex-col items-center">
              <div className="w-8 h-8 border-2 border-white/10 border-t-white rounded-full animate-spin mb-4" />
              <p className="text-[11px] font-bold text-white uppercase tracking-widest italic opacity-50">Indexing Profiling Data...</p>
           </div>
        </div>
      )}
    </div>
  );
}
