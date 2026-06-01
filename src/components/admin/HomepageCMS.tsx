"use client";

import React, { useState, useEffect } from "react";
import { 
  Trophy, Banknote, ScrollText, GraduationCap, Medal, Award, Users, BookOpen, Heart, Zap, Sparkles, Smartphone, Globe, CheckCircle2,
  Trash2, Pencil, Save, X, History, Plus, FileText, Loader2, AlertCircle, Clock, Brain, Star, Video, Upload, Calendar
} from "lucide-react";
import { 
  fetchHomepageDescriptions, 
  adminUpsertHomepageDescription, 
  adminDeleteHomepageDescription 
} from "@/lib/supabase/service";

// Icon mapper for dynamic Lucide rendering
const iconMap: Record<string, any> = {
  Trophy,
  Banknote,
  ScrollText,
  GraduationCap,
  Medal,
  Award,
  Users,
  BookOpen,
  Heart,
  Zap,
  Sparkles,
  Smartphone,
  Globe,
  CheckCircle2,
  Clock,
  Brain,
  Star,
  Video,
  Upload,
  Calendar
};

// Premium visual color schemes mapped by icons
const colorSchemes: Record<string, any> = {
  Trophy: { color: "text-amber-500", bg: "bg-amber-50", border: "border-amber-100", hoverBorder: "hover:border-amber-200" },
  Banknote: { color: "text-emerald-500", bg: "bg-emerald-50", border: "border-emerald-100", hoverBorder: "hover:border-emerald-200" },
  ScrollText: { color: "text-indigo-500", bg: "bg-indigo-50", border: "border-indigo-100", hoverBorder: "hover:border-indigo-200" },
  GraduationCap: { color: "text-blue-500", bg: "bg-blue-50", border: "border-blue-100", hoverBorder: "hover:border-blue-200" },
  Medal: { color: "text-rose-500", bg: "bg-rose-50", border: "border-rose-100", hoverBorder: "hover:border-rose-200" },
  Award: { color: "text-violet-500", bg: "bg-violet-50", border: "border-violet-100", hoverBorder: "hover:border-violet-200" },
  Users: { color: "text-teal-500", bg: "bg-teal-50", border: "border-teal-100", hoverBorder: "hover:border-teal-200" },
  Smartphone: { color: "text-cyan-500", bg: "bg-cyan-50", border: "border-cyan-100", hoverBorder: "hover:border-cyan-200" },
  Globe: { color: "text-pink-500", bg: "bg-pink-50", border: "border-pink-100", hoverBorder: "hover:border-pink-200" },
  BookOpen: { color: "text-indigo-500", bg: "bg-indigo-50", border: "border-indigo-100", hoverBorder: "hover:border-indigo-200" },
  Heart: { color: "text-red-500", bg: "bg-red-50", border: "border-red-100", hoverBorder: "hover:border-red-200" },
  Zap: { color: "text-yellow-500", bg: "bg-yellow-50", border: "border-yellow-100", hoverBorder: "hover:border-yellow-200" },
  Sparkles: { color: "text-purple-500", bg: "bg-purple-50", border: "border-purple-100", hoverBorder: "hover:border-purple-200" },
  CheckCircle2: { color: "text-slate-500", bg: "bg-slate-50", border: "border-slate-100", hoverBorder: "hover:border-slate-200" },
  
  // New curvy timeline specific icons
  Clock: { color: "text-blue-500", bg: "bg-blue-50", border: "border-blue-100", hoverBorder: "hover:border-blue-200" },
  Brain: { color: "text-amber-500", bg: "bg-amber-50", border: "border-amber-100", hoverBorder: "hover:border-amber-200" },
  Star: { color: "text-purple-500", bg: "bg-purple-50", border: "border-purple-100", hoverBorder: "hover:border-purple-200" },
  Video: { color: "text-emerald-500", bg: "bg-emerald-50", border: "border-emerald-100", hoverBorder: "hover:border-emerald-200" },
  Upload: { color: "text-indigo-500", bg: "bg-indigo-50", border: "border-indigo-100", hoverBorder: "hover:border-indigo-200" },
  Calendar: { color: "text-slate-500", bg: "bg-slate-50", border: "border-slate-100", hoverBorder: "hover:border-slate-200" },
  
  default: { color: "text-indigo-500", bg: "bg-indigo-50", border: "border-indigo-100", hoverBorder: "hover:border-indigo-200" }
};

export default function HomepageCMS() {
  const [homepageDescriptions, setHomepageDescriptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  // Main CMS Section: 'general' (about/benefit) or 'timeline' (lkti/olimpiade/speech/mtq)
  const [activeSubTab, setActiveSubTab] = useState<"general" | "timeline">("general");
  // Subcategory for Curvy Timeline editing
  const [timelineCategory, setTimelineCategory] = useState<"lkti" | "olimpiade" | "speech" | "mtq">("lkti");

  // Calendar Picker specific states
  const [dateMode, setDateMode] = useState<"calendar" | "manual">("calendar");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
    show: false,
    message: "",
    type: "success"
  });

  const [form, setForm] = useState({
    id: undefined as any,
    category: "benefit", 
    title: "",
    content: "",
    icon: "Trophy",
    order_index: 1,
    date_range: "Segera Diumumkan"
  });

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 4000);
  };

  // Dynamic date ranges generator in Indonesian
  const formatIndoDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const generateDateRangeString = (start: string, end?: string) => {
    if (!start) return "Segera Diumumkan";
    const s = new Date(start);
    if (isNaN(s.getTime())) return start;
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

    if (end) {
      const e = new Date(end);
      if (!isNaN(e.getTime())) {
        if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
          return `${s.getDate()} — ${e.getDate()} ${months[s.getMonth()]} ${s.getFullYear()}`;
        } else if (s.getFullYear() === e.getFullYear()) {
          return `${s.getDate()} ${months[s.getMonth()]} — ${e.getDate()} ${months[e.getMonth()]} ${s.getFullYear()}`;
        } else {
          return `${s.getDate()} ${months[s.getMonth()]} ${s.getFullYear()} — ${e.getDate()} ${months[e.getMonth()]} ${e.getFullYear()}`;
        }
      }
    }
    return formatIndoDate(start);
  };

  // Sync manual input text whenever calendar dates change
  useEffect(() => {
    if (dateMode === "calendar" && (startDate || endDate)) {
      const combined = generateDateRangeString(startDate, endDate);
      setForm(prev => ({ ...prev, date_range: combined }));
    }
  }, [startDate, endDate, dateMode]);

  // Dynamic date ranges parser in Indonesian to pre-populate calendar pickers when editing
  const parseIndoDateRange = (dateStr: string) => {
    if (!dateStr) return { start: "", end: "" };
    
    const monthMap: Record<string, string> = {
      "januari": "01", "februari": "02", "maret": "03", "april": "04", "mei": "05", "juni": "06",
      "juli": "07", "agustus": "08", "september": "09", "oktober": "10", "november": "11", "desember": "12"
    };

    const cleanStr = dateStr.trim();
    // Split on em-dash (—), en-dash (–), or hyphen (-)
    const parts = cleanStr.split(/\s*[\u2014\u2013-]\s*/);
    
    const parseSingle = (str: string) => {
      // Matches e.g. "16 Juni 2026" or "16 Juni" or "16"
      const matchFull = str.match(/^(\d+)\s+([a-zA-Z]+)\s+(\d{4})$/);
      if (matchFull) {
        const day = matchFull[1].padStart(2, "0");
        const month = monthMap[matchFull[2].toLowerCase()] || "01";
        const year = matchFull[3];
        return { day, month, year };
      }
      
      const matchMonth = str.match(/^(\d+)\s+([a-zA-Z]+)$/);
      if (matchMonth) {
        const day = matchMonth[1].padStart(2, "0");
        const month = monthMap[matchMonth[2].toLowerCase()] || "01";
        return { day, month, year: null as string | null };
      }
      
      const matchDayOnly = str.match(/^(\d+)$/);
      if (matchDayOnly) {
        const day = matchDayOnly[1].padStart(2, "0");
        return { day, month: null as string | null, year: null as string | null };
      }
      
      return null;
    };

    if (parts.length === 1) {
      const parsed = parseSingle(parts[0]);
      if (parsed && parsed.year) {
        return { start: `${parsed.year}-${parsed.month}-${parsed.day}`, end: "" };
      }
    } else if (parts.length === 2) {
      const startParsed = parseSingle(parts[0]);
      const endParsed = parseSingle(parts[1]);
      
      if (endParsed && endParsed.year) {
        const endYear = endParsed.year;
        const endMonth = endParsed.month;
        const endDay = endParsed.day;
        
        const startYear = startParsed ? (startParsed.year || endYear) : endYear;
        const startMonth = startParsed ? (startParsed.month || endMonth) : endMonth;
        const startDay = startParsed ? startParsed.day : endDay;
        
        return {
          start: `${startYear}-${startMonth}-${startDay}`,
          end: `${endYear}-${endMonth}-${endDay}`
        };
      }
    }
    
    return { start: "", end: "" };
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await fetchHomepageDescriptions();
      if (error) {
        showToast(`Gagal memuat data: ${error}`, "error");
      } else {
        setHomepageDescriptions(data || []);
      }
    } catch (err: any) {
      showToast(`Gagal memuat data: ${err.message}`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.content) {
      showToast("Judul dan penjelasan tidak boleh kosong!", "error");
      return;
    }
    setIsSaving(true);
    try {
      const { success, error } = await adminUpsertHomepageDescription({
        id: form.id,
        category: form.category,
        title: form.title,
        content: form.content,
        icon: form.icon,
        order_index: Number(form.order_index) || 0,
        date_range: form.date_range
      });
      if (success) {
        showToast(form.id ? "Berhasil diperbarui!" : "Berhasil ditambahkan!", "success");
        setShowModal(false);
        loadData();
      } else {
        showToast(`Gagal menyimpan (Pastikan sudah menjalankan SQL migration): ${error}`, "error");
      }
    } catch (err: any) {
      showToast(`Gagal menyimpan: ${err.message}`, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: any) => {
    if (!confirm("Apakah Anda yakin ingin menghapus elemen ini? Konten akan langsung terhapus dari halaman utama.")) return;
    try {
      const { success, error } = await adminDeleteHomepageDescription(id);
      if (success) {
        showToast("Berhasil dihapus!", "success");
        loadData();
      } else {
        showToast(`Gagal menghapus: ${error}`, "error");
      }
    } catch (err: any) {
      showToast(`Gagal menghapus: ${err.message}`, "error");
    }
  };

  const openAddModal = (category: string) => {
    let defaultIcon = "Trophy";
    if (category === "about") defaultIcon = "CheckCircle2";
    else if (category === "lkti" || category === "olimpiade" || category === "speech" || category === "mtq") defaultIcon = "Users";

    const orderIndex = homepageDescriptions.filter(d => d.category === category).length + 1;
    
    // Reset calendar states
    setStartDate("");
    setEndDate("");
    setDateMode("calendar");

    setForm({
      id: undefined,
      category,
      title: "",
      content: "",
      icon: defaultIcon,
      order_index: orderIndex,
      date_range: "Segera Diumumkan"
    });
    setShowModal(true);
  };

  const openEditModal = (item: any) => {
    // Reset calendar states, parse existing date range if applicable
    let startVal = "";
    let endVal = "";
    let modeVal: "calendar" | "manual" = "manual";

    if (item.date_range && item.date_range !== "Segera Diumumkan" && !item.date_range.includes("Reward") && !item.date_range.includes("Aktif")) {
      const parsed = parseIndoDateRange(item.date_range);
      if (parsed.start) {
        startVal = parsed.start;
        endVal = parsed.end;
        modeVal = "calendar";
      }
    }

    setStartDate(startVal);
    setEndDate(endVal);
    setDateMode(modeVal);

    setForm({
      id: item.id,
      category: item.category,
      title: item.title,
      content: item.content || "",
      icon: item.icon || "Trophy",
      order_index: item.order_index || 1,
      date_range: item.date_range || "Segera Diumumkan"
    });
    setShowModal(true);
  };

  const abouts = homepageDescriptions.filter(d => d.category === 'about');
  const benefits = homepageDescriptions.filter(d => d.category === 'benefit');
  const timelineItems = homepageDescriptions.filter(d => d.category === timelineCategory)
                                            .sort((a,b) => (a.order_index || 0) - (b.order_index || 0));

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* LOCAL TOAST SYSTEM */}
      {toast.show && (
        <div className={`fixed bottom-6 right-6 z-50 px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 border animate-bounce ${
          toast.type === "success" ? "bg-emerald-500 text-white border-emerald-400" : "bg-rose-500 text-white border-rose-400"
        }`}>
          {toast.type === "success" ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span className="text-sm font-bold">{toast.message}</span>
        </div>
      )}

      {/* 1. HEADER & GLOBAL CONTROLS */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 text-white shadow-xl border border-indigo-950 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden text-left animate-in fade-in duration-500">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -z-10"></div>
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl -z-10"></div>
        
        <div className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-widest bg-indigo-500/30 text-indigo-200 px-3 py-1.5 rounded-full border border-indigo-500/20">
            Pusat Kontrol Landing Page
          </span>
          <h2 className="text-3xl font-black tracking-tight mt-2">Kelola Konten Halaman Depan</h2>
          <p className="text-indigo-200 text-sm max-w-xl font-medium">
            Sunting penjelasan, benefits card, dan curvy timeline interaktif langsung terintegrasi dengan database secara real-time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto shrink-0 justify-start md:justify-end">
          <button 
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-3 bg-white/10 text-white rounded-2xl font-bold hover:bg-white/20 border border-white/10 hover:border-white/20 transition-all text-xs"
          >
            <History size={14} className={isLoading ? "animate-spin" : ""} /> Segarkan Data
          </button>
          
          {activeSubTab === "general" ? (
            <button 
              onClick={() => openAddModal("benefit")}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 hover:scale-105 transition-all text-xs border border-indigo-400"
            >
              <Plus size={14} /> Tambah Benefit Baru
            </button>
          ) : (
            <button 
              onClick={() => openAddModal(timelineCategory)}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 hover:scale-105 transition-all text-xs border border-indigo-400"
            >
              <Plus size={14} /> Tambah Tahap ({timelineCategory.toUpperCase()})
            </button>
          )}
        </div>
      </div>

      {/* 2. SUB-TAB SWITCHER (GLASSMORPHIC PANEL) */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 max-w-md mr-auto text-left shadow-sm">
        <button
          onClick={() => setActiveSubTab("general")}
          className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs uppercase transition-all flex items-center justify-center gap-2 ${activeSubTab === 'general' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
        >
          <FileText size={14} /> Penjelasan & Keuntungan
        </button>
        <button
          onClick={() => setActiveSubTab("timeline")}
          className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs uppercase transition-all flex items-center justify-center gap-2 ${activeSubTab === 'timeline' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
        >
          <Calendar size={14} /> Curvy Timeline Lomba
        </button>
      </div>

      {/* ======================= TAB 1: GENERAL ABOUT & BENEFITS ======================= */}
      {activeSubTab === "general" && (
        <div className="space-y-8 animate-in fade-in duration-350">
          {/* STATISTICS CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex items-center justify-between text-left">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Total Entri Dinamis</p>
                <h3 className="text-2xl font-black text-slate-800 mt-1">{abouts.length + benefits.length} Elemen</h3>
              </div>
              <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-500"><FileText size={20} /></div>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex items-center justify-between text-left">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Bagian &quot;What is NCC?&quot;</p>
                <h3 className="text-2xl font-black text-indigo-600 mt-1">{abouts.length} Poin</h3>
              </div>
              <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-indigo-500"><CheckCircle2 size={20} /></div>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex items-center justify-between text-left">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Bagian &quot;Benefits Card&quot;</p>
                <h3 className="text-2xl font-black text-emerald-600 mt-1">{benefits.length} Kartu</h3>
              </div>
              <div className="w-10 h-10 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center text-emerald-500"><Trophy size={20} /></div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200 rounded-3xl gap-4 shadow-sm">
              <Loader2 size={40} className="text-indigo-600 animate-spin" />
              <p className="text-slate-500 font-bold text-sm animate-pulse">Menghubungkan ke pusat data Supabase...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* WHAT IS NCC */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col gap-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="text-left">
                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                      <CheckCircle2 className="text-indigo-600" size={20} />
                      1. Bagian &quot;What is NCC?&quot;
                    </h3>
                    <p className="text-slate-400 text-xs font-semibold">Poin ringkas penjelasan/pilar lomba yang muncul di Landing Page.</p>
                  </div>
                  <button 
                    onClick={() => openAddModal("about")}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-100 rounded-xl text-xs font-bold transition-all shrink-0"
                  >
                    <Plus size={12} /> Poin Baru
                  </button>
                </div>

                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                  {abouts.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                      <p className="text-slate-400 text-sm font-semibold">Poin penjelasan kosong. Klik &quot;Poin Baru&quot; untuk menambahkan.</p>
                    </div>
                  ) : (
                    abouts.map((item) => (
                      <div 
                        key={item.id} 
                        className="flex items-center justify-between gap-4 p-4 bg-slate-50 hover:bg-indigo-50/20 border border-slate-100 hover:border-indigo-150 rounded-2xl transition-all duration-300 group"
                      >
                        <div className="flex items-start gap-3 text-left">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100 mt-0.5">
                            <CheckCircle2 size={16} />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-800 leading-snug group-hover:text-indigo-950 transition-colors">
                              {item.title}
                            </h4>
                            {item.content && (
                              <p className="text-xs text-slate-400 font-medium mt-0.5 leading-relaxed">
                                {item.content}
                              </p>
                            )}
                            <span className="inline-block mt-1 text-[9px] font-bold text-slate-400 uppercase bg-slate-100 px-2 py-0.5 rounded-full">
                              Urutan: {item.order_index}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => openEditModal(item)}
                            className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 flex items-center justify-center transition-all shadow-sm"
                            title="Sunting"
                          >
                            <Pencil size={12} />
                          </button>
                          <button 
                            onClick={() => handleDelete(item.id)}
                            className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 flex items-center justify-center transition-all shadow-sm"
                            title="Hapus"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* BENEFITS CARD */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col gap-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="text-left">
                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                      <Trophy className="text-emerald-600" size={20} />
                      2. Bagian &quot;Benefits Card&quot;
                    </h3>
                    <p className="text-slate-400 text-xs font-semibold">Tampilan kartu keuntungan yang akan ditampilkan secara interaktif.</p>
                  </div>
                  <button 
                    onClick={() => openAddModal("benefit")}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-100 rounded-xl text-xs font-bold transition-all shrink-0"
                  >
                    <Plus size={12} /> Benefit Baru
                  </button>
                </div>

                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                  {benefits.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                      <p className="text-slate-400 text-sm font-semibold">Daftar benefit kosong. Klik &quot;Benefit Baru&quot; untuk menambahkan.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {benefits.map((feat) => {
                        const IconComponent = iconMap[feat.icon] || Trophy;
                        const scheme = colorSchemes[feat.icon] || colorSchemes.default;
                        return (
                          <div 
                            key={feat.id} 
                            className={`relative p-5 rounded-2xl flex items-center gap-4 bg-white border ${scheme.border} ${scheme.hoverBorder} hover:shadow-lg hover:shadow-slate-100/50 transition-all duration-300 group`}
                          >
                            <div className={`w-14 h-14 rounded-2xl ${scheme.bg} flex items-center justify-center shrink-0 ${scheme.color} group-hover:scale-105 transition-transform duration-300 shadow-inner`}>
                              <IconComponent size={24} strokeWidth={1.5} />
                            </div>
                            
                            <div className="flex flex-col gap-1 pr-16 text-left">
                              <h4 className="text-base font-bold text-slate-800 leading-snug">{feat.title}</h4>
                              {feat.content && (
                                <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                                  {feat.content}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-1">
                                <span className="inline-block text-[9px] font-bold text-slate-400 uppercase bg-slate-100 px-2 py-0.5 rounded-full">
                                  Urutan: {feat.order_index}
                                </span>
                                <span className="inline-block text-[9px] font-bold text-slate-400 uppercase bg-slate-100 px-2 py-0.5 rounded-full">
                                  Ikon: <span className="font-extrabold">{feat.icon}</span>
                                </span>
                              </div>
                            </div>

                            {/* Actions Overlay */}
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => openEditModal(feat)}
                                className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 flex items-center justify-center transition-all shadow-sm"
                                title="Sunting"
                              >
                                <Pencil size={12} />
                              </button>
                              <button 
                                onClick={() => handleDelete(feat.id)}
                                className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 flex items-center justify-center transition-all shadow-sm"
                                title="Hapus"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}
        </div>
      )}

      {/* ======================= TAB 2: CURVY TIMELINE LOMBA ======================= */}
      {activeSubTab === "timeline" && (
        <div className="space-y-8 animate-in fade-in duration-350">
          
          {/* Timeline category switcher */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col gap-6 text-left">
            <div>
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                <Calendar className="text-indigo-600" size={20} />
                Pilih Cabang Lomba Untuk Diedit
              </h3>
              <p className="text-slate-400 text-xs font-semibold">Tentukan cabang lomba yang ingin dimanage kotak penjelasan dan tanggal timelinenya.</p>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {(["lkti", "olimpiade", "speech", "mtq"] as const).map((cat) => {
                const labels = { lkti: "LKTI", olimpiade: "Olimpiade MIPA", speech: "Speech Contest", mtq: "MTQ" };
                const colorStyles = {
                  lkti: "bg-blue-50 text-blue-600 border-blue-100 hover:border-blue-300",
                  olimpiade: "bg-amber-50 text-amber-600 border-amber-100 hover:border-amber-300",
                  speech: "bg-purple-50 text-purple-600 border-purple-100 hover:border-purple-300",
                  mtq: "bg-emerald-50 text-emerald-600 border-emerald-100 hover:border-emerald-300"
                };
                const activeColorStyles = {
                  lkti: "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100",
                  olimpiade: "bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-100",
                  speech: "bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-100",
                  mtq: "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-100"
                };

                const isSelected = timelineCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setTimelineCategory(cat)}
                    className={`px-5 py-3 rounded-2xl font-bold text-xs uppercase transition-all border active:scale-95 ${isSelected ? activeColorStyles[cat] : `bg-white ${colorStyles[cat]}`}`}
                  >
                    {labels[cat]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Timeline Steps CMS Card view */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200 rounded-3xl gap-4 shadow-sm">
              <Loader2 size={40} className="text-indigo-600 animate-spin" />
              <p className="text-slate-500 font-bold text-sm animate-pulse">Menghubungkan ke pusat data Supabase...</p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col gap-6">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="text-left">
                  <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                    <Sparkles className="text-indigo-600" size={18} />
                    Kotak Penjelasan & Tanggal Timeline ({timelineCategory.toUpperCase()})
                  </h3>
                  <p className="text-slate-400 text-xs font-semibold">
                    Daftar tahapan visual pada curvy line landing page.
                  </p>
                </div>
                <button 
                  onClick={() => openAddModal(timelineCategory)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-100 rounded-xl text-xs font-bold transition-all shrink-0"
                >
                  <Plus size={12} /> Tambah Tahap Lomba
                </button>
              </div>

              <div className="space-y-4">
                {timelineItems.length === 0 ? (
                  <div className="text-center py-14 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
                    <p className="text-slate-400 text-sm font-semibold">Timeline kosong di database. Sebaiknya jalankan migrasi SQL atau klik &quot;Tambah Tahap Lomba&quot;.</p>
                  </div>
                ) : (
                  <div className="relative pl-6 border-l-2 border-dashed border-slate-200 space-y-6 ml-3 text-left">
                    {timelineItems.map((item, iIndex) => {
                      const IconComponent = iconMap[item.icon] || Trophy;
                      const scheme = colorSchemes[item.icon] || colorSchemes.default;
                      return (
                        <div key={item.id} className="relative group">
                          {/* Timeline Dot Indicator */}
                          <div className={`absolute -left-[32px] top-1.5 w-4 h-4 rounded-full bg-white border-4 ${scheme.color.replace('text-', 'border-')} shadow-sm group-hover:scale-110 transition-transform`} />
                          
                          <div className={`p-5 rounded-2xl bg-white border ${scheme.border} ${scheme.hoverBorder} hover:shadow-md transition-all duration-300 flex items-center gap-4 relative`}>
                            {/* Visual Icon */}
                            <div className={`w-12 h-12 rounded-xl ${scheme.bg} ${scheme.color} flex items-center justify-center shrink-0`}>
                              <IconComponent size={22} strokeWidth={1.5} />
                            </div>

                            {/* Core Details */}
                            <div className="flex-1 min-w-0 pr-16">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-[10px] font-black uppercase ${scheme.color} ${scheme.bg} px-2 py-0.5 rounded-md border ${scheme.border}`}>
                                  {item.title}
                                </span>
                                <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200 flex items-center gap-1">
                                  <Clock size={10} /> {item.date_range || 'Segera Diumumkan'}
                                </span>
                              </div>
                              
                              <p className="text-sm font-bold text-slate-700 mt-2 leading-relaxed">
                                {item.content}
                              </p>
                              
                              <span className="inline-block mt-2 text-[9px] font-bold text-slate-400 uppercase bg-slate-50 px-2 py-0.5 rounded-full border border-slate-150">
                                Tahap Urutan Ke: {item.order_index}
                              </span>
                            </div>

                            {/* Controls Overlay */}
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => openEditModal(item)}
                                className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 flex items-center justify-center transition-all shadow-sm"
                                title="Sunting Tahapan Lomba"
                              >
                                <Pencil size={12} />
                              </button>
                              <button 
                                onClick={() => handleDelete(item.id)}
                                className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 flex items-center justify-center transition-all shadow-sm"
                                title="Hapus Tahapan Lomba"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>

                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          )}

        </div>
      )}

      {/* 3. GLASSMORPHIC EDITOR DIALOG MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            onClick={() => setShowModal(false)}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
          />
          
          {/* Modal Box */}
          <div className="relative bg-white/90 backdrop-blur-md rounded-3xl border border-slate-250/70 w-full max-w-lg shadow-2xl p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto animate-fade-in-up">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="text-left">
                <h3 className="text-xl font-black text-slate-800">
                  {form.id ? "Sunting Konten Halaman" : "Tambah Konten Halaman"}
                </h3>
                <p className="text-xs text-slate-400 font-semibold">
                  Konten ini akan langsung diperbarui di Landing Page utama.
                </p>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 hover:text-slate-800 text-slate-400 flex items-center justify-center transition-all font-bold"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-left">
              
              {/* Category / Lomba Selector (ReadOnly) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Kategori / Cabang</label>
                <input
                  type="text"
                  readOnly
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-500 text-xs font-extrabold transition-all uppercase cursor-not-allowed outline-none"
                  value={form.category === 'about' ? 'What is NCC (Poin)' : form.category === 'benefit' ? 'Keuntungan (Card)' : `Timeline Lomba: ${form.category.toUpperCase()}`}
                />
              </div>

              {/* Title / Phase */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {form.category === 'about' || form.category === 'benefit' ? "Judul Konten" : "Judul Tahapan (Phase)"}
                </label>
                <input
                  type="text"
                  required
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-700 outline-none focus:border-indigo-400 text-sm font-medium transition-all"
                  placeholder={
                    form.category === 'about' ? "Contoh: Piala Bergilir Bergengsi" : 
                    form.category === 'benefit' ? "Contoh: Trophies Of Award" : 
                    "Contoh: Gel I: Abstrak / Seleksi Babak 1"
                  }
                  value={form.title}
                  onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              {/* Date Selection Mode (ONLY for timeline steps) */}
              {!(form.category === 'about' || form.category === 'benefit') && (
                <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div className="flex items-center justify-between border-b border-slate-200/50 pb-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Tanggal Pelaksanaan</label>
                    
                    {/* Mode Toggle Selector */}
                    <div className="flex bg-slate-200 p-0.5 rounded-lg border border-slate-300">
                      <button
                        type="button"
                        onClick={() => setDateMode("calendar")}
                        className={`py-1 px-2.5 rounded-md font-bold text-[10px] transition-all uppercase ${dateMode === 'calendar' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        Kalender
                      </button>
                      <button
                        type="button"
                        onClick={() => setDateMode("manual")}
                        className={`py-1 px-2.5 rounded-md font-bold text-[10px] transition-all uppercase ${dateMode === 'manual' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        Teks Manual
                      </button>
                    </div>
                  </div>

                  {dateMode === "calendar" ? (
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Mulai</label>
                        <input
                          type="date"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 outline-none focus:border-indigo-400 text-xs font-semibold transition-all cursor-pointer"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Selesai (Opsional)</label>
                        <input
                          type="date"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 outline-none focus:border-indigo-400 text-xs font-semibold transition-all cursor-pointer"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1 pt-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Tulis Tanggal Bebas</label>
                      <input
                        type="text"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 outline-none focus:border-indigo-400 text-xs font-medium transition-all"
                        placeholder="Contoh: Segera Diumumkan / TBD / Selalu Aktif"
                        value={form.date_range}
                        onChange={(e) => setForm(prev => ({ ...prev, date_range: e.target.value }))}
                      />
                    </div>
                  )}

                  {/* Real-time formatted preview of computed date */}
                  {dateMode === "calendar" && (
                    <div className="mt-2 text-[10px] font-black text-indigo-600 bg-indigo-50/50 border border-indigo-100 p-2.5 rounded-xl flex items-center gap-1.5 justify-center">
                      <Clock size={12} /> Hasil Format: &quot;{form.date_range}&quot;
                    </div>
                  )}
                </div>
              )}

              {/* Content / Detail Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {form.category === 'about' ? 'Detail Poin (Opsional)' : 'Detail Deskripsi / Penjelasan (Wajib)'}
                </label>
                <textarea
                  rows={3}
                  required={form.category !== 'about'}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-700 outline-none focus:border-indigo-400 text-sm font-medium transition-all resize-none"
                  placeholder="Tulis penjelasan deskripsi secara singkat, padat, dan ringkas agar muat rapi di layout visual..."
                  value={form.content}
                  onChange={(e) => setForm(prev => ({ ...prev, content: e.target.value }))}
                />
              </div>

              {/* Index & Icon Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Index Urutan</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-700 outline-none focus:border-indigo-400 text-sm font-medium transition-all"
                    value={form.order_index}
                    onChange={(e) => setForm(prev => ({ ...prev, order_index: Number(e.target.value) || 1 }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ikon Terpilih</label>
                  <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 h-[46px]">
                    {(() => {
                      const IconComponent = iconMap[form.icon] || Trophy;
                      const scheme = colorSchemes[form.icon] || colorSchemes.default;
                      return (
                        <>
                          <div className={`${scheme.color} shrink-0`}><IconComponent size={18} /></div>
                          <span className="text-xs font-bold text-slate-700 uppercase">{form.icon}</span>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Icon Visual Grid Selector */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pilih Ikon Visual</label>
                <div className="grid grid-cols-5 gap-2 max-h-[140px] overflow-y-auto p-1 bg-slate-50 border border-slate-200 rounded-2xl">
                  {Object.keys(iconMap)
                    .map((key) => {
                      const IconComponent = iconMap[key];
                      const scheme = colorSchemes[key] || colorSchemes.default;
                      const isSelected = form.icon === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setForm(prev => ({ ...prev, icon: key }))}
                          className={`w-full aspect-square rounded-xl flex items-center justify-center transition-all ${scheme.bg} ${scheme.color} border-2 ${isSelected ? 'border-indigo-600 scale-105 shadow-md shadow-indigo-600/10' : 'border-transparent hover:scale-105'}`}
                          title={key}
                        >
                          <IconComponent size={20} strokeWidth={2} />
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Submit & Cancel Actions */}
              <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 rounded-2xl font-bold text-xs transition-all text-center"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className={`flex-1 py-3 px-4 bg-indigo-600 text-white rounded-2xl font-bold text-xs shadow-lg shadow-indigo-100 hover:scale-[1.02] hover:bg-indigo-700 transition-all text-center flex items-center justify-center gap-2 ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save size={14} /> Simpan Perubahan
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
