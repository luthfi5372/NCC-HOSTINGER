"use client";

import { useState, useEffect } from "react";
import { 
  Send, 
  Trash2, 
  MessageSquare, 
  Users, 
  User, 
  Clock,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  X,
  Zap,
  Info,
  AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  sendAdminMessage, 
  getAdminMessages, 
  deleteAdminMessage,
  getUsers,
  AdminMessage,
  addAdminLog,
  LocalUser
} from "@/lib/localAuth";

export default function AdminMessages() {
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [users, setUsers] = useState<LocalUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [target, setTarget] = useState<"all" | string>("all");
  const [priority, setPriority] = useState<"info" | "warning" | "urgent">("info");
  const [mediaUrl, setMediaUrl] = useState<string>("");

  useEffect(() => {
    refreshData();
    setUsers(getUsers());
  }, []);

  const refreshData = () => {
    setMessages(getAdminMessages().sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1.5 * 1024 * 1024) {
        alert("File too large. Please use images under 1.5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate slight delay for UX
    await new Promise(r => setTimeout(r, 800));

    const result = sendAdminMessage({
      title,
      content,
      target,
      sender: "System Admin",
      type: priority,
      mediaUrl: mediaUrl || undefined
    });

    if (result.success) {
      addAdminLog(`Dispatched ${priority} announcement: "${title}" to ${target}`);
      setSuccess(true);
      setTitle("");
      setContent("");
      setTarget("all");
      setPriority("info");
      setMediaUrl("");
      refreshData();
      setTimeout(() => setSuccess(false), 3000);
    }
    setLoading(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("Permanently delete this announcement from logs?")) {
      deleteAdminMessage(id);
      addAdminLog(`Deleted broadcast message ID: ${id}`);
      refreshData();
    }
  };

  if (!messages) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-700 font-inter text-white">
      {/* Vercel-style Breadcrumbs & Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-[13px] text-slate-500 font-medium">
          <span className="hover:text-white cursor-pointer transition-colors">national-creativity-competition</span>
          <span className="text-white/20">/</span>
          <span className="text-white px-2 py-0.5 bg-white/10 rounded-md">broadcast-command-center</span>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">System Communications</h1>
            <p className="text-slate-500 text-[13px] font-medium mt-1">Global broadcast engine for multimedia announcements and security alerts.</p>
          </div>
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-4 py-2">
            <Users size={14} className="text-slate-500" />
            <span className="text-[12px] font-bold text-slate-300">{users.length} Active Node Targets</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-1 gap-8">
        
        {/* Vercel-style Compose Form */}
        <div className="bg-[#000] border border-white/10 rounded-xl p-8 lg:p-10 shadow-2xl relative overflow-hidden">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white">
              <Send size={18} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight italic">Provision New Broadcast</h3>
              <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Multimedia Protocol v1.0</p>
            </div>
          </div>

          <form onSubmit={handleSendMessage} className="grid grid-cols-1 md:grid-cols-2 gap-10">
             <div className="space-y-6">
                {/* Target & Priority */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Routing Target</label>
                    <select 
                        value={target}
                        onChange={(e) => setTarget(e.target.value)}
                        className="w-full py-2.5 px-4 bg-white/5 border border-white/10 rounded-lg text-[13px] font-medium text-white focus:outline-none focus:border-white/30 transition-all appearance-none cursor-pointer"
                    >
                        <option value="all">Global Broadcast (*)</option>
                        <optgroup label="Registry Nodes">
                          {users.filter(u => u.role === "user").map(u => (
                              <option key={u.email} value={u.email}>{u.fullName}</option>
                          ))}
                        </optgroup>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Priority Class</label>
                    <select 
                        value={priority}
                        onChange={(e) => setPriority(e.target.value as any)}
                        className={`w-full py-2.5 px-4 bg-white/5 border rounded-lg text-[13px] font-bold focus:outline-none transition-all appearance-none cursor-pointer ${
                          priority === 'urgent' ? 'border-rose-500/30 text-rose-400' :
                          priority === 'warning' ? 'border-amber-500/30 text-amber-400' :
                          'border-white/10 text-indigo-400'
                        }`}
                    >
                        <option value="info">Standard Info</option>
                        <option value="warning">System Warning</option>
                        <option value="urgent">Critical Alert</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Message Header</label>
                  <input 
                      required
                      type="text" 
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. INFRASTRUCTURE_UPDATE_ALPHA"
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-[13px] font-medium text-white focus:outline-none focus:border-white/30 transition-all placeholder:text-slate-700"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Payload Content</label>
                  <textarea 
                      required
                      rows={5}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Input communication payload..."
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-[13px] font-medium text-white focus:outline-none focus:border-white/30 transition-all resize-none placeholder:text-slate-700 min-h-[120px]"
                  />
                </div>
             </div>

             <div className="space-y-6 flex flex-col">
                <div className="space-y-1.5 flex-1 flex flex-col">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Multimedia Attachment</label>
                  {!mediaUrl ? (
                    <label className="flex-1 flex flex-col items-center justify-center w-full bg-white/[0.02] border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:bg-white/5 hover:border-indigo-500/50 transition-all group">
                      <ImageIcon size={24} className="text-slate-700 mb-2 group-hover:text-indigo-400 transition-colors" />
                      <p className="text-[11px] text-slate-500 font-bold uppercase tracking-tight">Ingest Visual Data</p>
                      <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                    </label>
                  ) : (
                    <div className="relative flex-1 w-full rounded-xl overflow-hidden border border-white/10 group shadow-2xl">
                      <img src={mediaUrl} alt="Preview" className="w-full h-full object-cover opacity-80" />
                      <div className="absolute top-2 right-2">
                         <button 
                          type="button"
                          onClick={() => setMediaUrl("")}
                          className="p-1.5 bg-black/60 text-white rounded-md hover:bg-rose-600 transition-all"
                        >
                          <X size={14}/>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <button 
                    disabled={loading}
                    className="w-full py-3 bg-white text-black font-bold rounded-lg text-[12px] uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center gap-3 disabled:opacity-30"
                  >
                    {loading ? "Initializing..." : <><Send size={16} /> Dispatch Broadcast</>}
                  </button>

                  {success && (
                    <motion.div 
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 text-emerald-400 justify-center text-[10px] font-bold bg-emerald-500/10 py-2.5 rounded-lg border border-emerald-500/20"
                    >
                        <CheckCircle2 size={14} /> Propagation Successful
                    </motion.div>
                  )}
                </div>
             </div>
          </form>
        </div>

        {/* Dispatch Log Grid */}
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white tracking-tight italic opacity-80">Execution History</h3>
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                  {messages.length} DISPATCH_RECORDS
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                    {messages.map((msg) => (
                        <motion.div
                            key={msg.id}
                            layout
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="bg-[#000] border border-white/10 rounded-xl relative group overflow-hidden hover:border-white/20 transition-all"
                        >
                            <button 
                                onClick={() => handleDelete(msg.id)}
                                className="absolute top-4 right-4 z-20 p-1.5 bg-black/50 backdrop-blur-md text-slate-600 hover:text-rose-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all border border-white/10"
                            >
                                <Trash2 size={14} />
                            </button>

                            {msg.mediaUrl ? (
                              <div className="h-28 w-full overflow-hidden bg-white/5 border-b border-white/10">
                                <img src={msg.mediaUrl} className="w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity" alt="Payload" />
                              </div>
                            ) : (
                              <div className="h-2 bg-white/5 w-full" />
                            )}

                            <div className="p-6">
                              <div className="flex items-center gap-2 mb-4">
                                  {msg.target === "all" ? (
                                      <span className="flex items-center gap-1.5 px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded-md text-[9px] font-bold uppercase tracking-widest border border-indigo-500/20">
                                          <Users size={10} /> Broadcast
                                      </span>
                                  ) : (
                                      <span className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-md text-[9px] font-bold uppercase tracking-widest border border-emerald-500/20">
                                          <User size={10} /> Point-to-Point
                                      </span>
                                  )}
                                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest border ${
                                    msg.type === 'urgent' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                                    msg.type === 'warning' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                    'bg-white/5 text-slate-500 border-white/10'
                                  }`}>
                                    {msg.type || 'info'}
                                  </span>
                              </div>

                              <h4 className="text-[13px] font-bold text-white mb-1.5 truncate">{msg.title}</h4>
                              <p className="text-[12px] text-slate-500 leading-relaxed line-clamp-2 mb-4">{msg.content}</p>
                              
                              <div className="pt-3 border-t border-white/5 flex justify-between items-center">
                                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600">
                                      <Clock size={11} /> {new Date(msg.sentAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                  <div className="text-[10px] font-bold text-slate-700 uppercase tracking-widest italic">
                                    MSG_{msg.id.slice(-4)}
                                  </div>
                              </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {messages.length === 0 && (
                    <div className="col-span-full py-24 bg-[#000] border-2 border-dashed border-white/10 rounded-xl text-center">
                        <MessageSquare className="text-slate-800 mx-auto mb-4" size={32} />
                        <h4 className="text-sm font-bold text-slate-600 italic">No communication history indexed.</h4>
                    </div>
                )}
            </div>
        </div>

      </div>
  );
}
