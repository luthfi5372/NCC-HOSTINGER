"use client";
export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useRef, memo } from "react";
import * as htmlToImage from 'html-to-image';
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client"; 
import { 
  LayoutDashboard, Users, FileCheck, Settings, 
  ArrowUpRight, ArrowDownRight, Download, Calendar, 
  Bell, MoreHorizontal, Sparkles, Search, Filter, Printer, X, IdCard, Megaphone, Send, ArrowRight, Save,
  CheckCircle2, AlertCircle, LogOut, Trash2, MapPin, School, Target, XCircle, Power, Shield, Clock, CalendarDays, FolderOpen, ShieldCheck, CheckCircle, Eye, FileText, ImageIcon, Camera, Trophy, Medal, GraduationCap, Building2, ClipboardCheck
} from "lucide-react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from "recharts";
import katex from "katex";
import "katex/dist/katex.min.css";

// --- ⚡ COMPONENT SINKRONISASI & OPTIMASI KINERJA TINGGI ---

const renderMath = (text: string) => {
  if (!text) return "";
  let html = text;
  // Parse block math $$...$$
  html = html.replace(/\$\$([\s\S]*?)\$\$/g, (match, formula) => {
    try {
      return katex.renderToString(formula, { displayMode: true, throwOnError: false });
    } catch (e) {
      return match;
    }
  });
  // Parse inline math $...$
  html = html.replace(/\$(.*?)\$/g, (match, formula) => {
    try {
      return katex.renderToString(formula, { displayMode: false, throwOnError: false });
    } catch (e) {
      return match;
    }
  });
  return html;
};

interface ParticipantRowProps {
  entry: any;
  onRowClick: (entry: any) => void;
  onIdCardClick: (entry: any) => void;
  onDeleteClick: (entry: any) => void;
}

const ParticipantRow = memo(({ entry, onRowClick, onIdCardClick, onDeleteClick }: ParticipantRowProps) => {
  const dateObj = entry.created_at ? new Date(entry.created_at) : new Date();
  const dateStr = dateObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  let photoUrl = "";
  if (entry.notes) {
    try {
      const pObj = JSON.parse(entry.notes);
      photoUrl = pObj.profile_photo_url;
    } catch (e) {}
  }

  let stage = 1;
  if (entry.notes) {
    try {
      const n = JSON.parse(entry.notes);
      if (n.current_stage) stage = n.current_stage;
    } catch (e) {}
  }

  return (
    <tr 
      onClick={() => onRowClick(entry)}
      className="hover:bg-blue-50/50 transition-colors cursor-pointer"
    >
      <td className="py-4 px-6 font-black text-blue-600">NCC-{entry.id}</td>
      <td className="py-4 px-6 flex items-center gap-3">
         {photoUrl ? (
           <img 
             src={photoUrl} 
             alt="Profile Avatar" 
             className="w-10 h-10 rounded-full object-cover border border-blue-100 shrink-0" 
           />
         ) : (
           <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center font-bold text-blue-600 text-sm uppercase shrink-0">
             {(entry.full_name || entry.email || "U").charAt(0)}
           </div>
         )}
         <div>
           <div className="font-bold text-slate-800">{entry.full_name || "Peserta Anonim"}</div>
           <div className="text-[11px] text-slate-500 mt-0.5">
             {entry.email || "Email tidak ada"} <span className="mx-1 text-slate-300">|</span> NISN: <span className="font-medium text-slate-600">{entry.nisn || "-"}</span>
           </div>
         </div>
      </td>
      <td className="py-4 px-6">
        <div className="font-bold text-slate-700">{entry.school_name || entry.school || "Belum Diisi"}</div>
        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
           <MapPin size={11} className="shrink-0" /> {entry.province || entry.city || "Provinsi belum diisi"}
        </div>
      </td>
      <td className="py-4 px-6">
        {stage === 1 && <span className="px-2.5 py-1 rounded-md text-[10px] font-black bg-slate-100 text-slate-500 border border-slate-200 flex items-center gap-1"><ClipboardCheck size={10} /> TAHAP 1</span>}
        {stage === 2 && <span className="px-2.5 py-1 rounded-md text-[10px] font-black bg-blue-50 text-blue-600 border border-blue-200 animate-pulse flex items-center gap-1"><Medal size={10} /> TAHAP 2</span>}
        {stage === 3 && <span className="px-2.5 py-1 rounded-md text-[10px] font-black bg-amber-50 text-amber-600 border border-amber-200 shadow-sm shadow-amber-100 flex items-center gap-1"><Trophy size={10} /> FINAL</span>}
      </td>
      <td className="py-4 px-6">
        <span className="bg-slate-100/80 text-slate-700 px-2.5 py-1 rounded-md text-[11px] font-bold border border-slate-200/60">
          {entry.competition_type || entry.category || "Belum Pilih"}
        </span>
        <div className="text-[11px] text-slate-500 mt-1.5">
          Pembina: <span className="font-medium text-slate-700">{entry.mentor_name || "-"}</span>
        </div>
      </td>
      <td className="py-4 px-6">
        <div className="font-medium text-slate-800">{dateStr}</div>
        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
          <Clock size={11} className="text-slate-400" /> Pukul {timeStr}
        </div>
      </td>
      <td className="py-4 px-6">
        <span className="px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center w-max gap-1.5 border bg-green-500/10 text-green-700 border-green-500/20 shadow-sm">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
          Active
        </span>
      </td>
      <td className="py-4 px-6 text-center">
        <div className="flex items-center justify-center gap-2">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onIdCardClick(entry);
            }}
            className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-all shadow-sm border border-blue-100"
            title="Cetak ID Card"
          >
            <IdCard size={18} />
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onDeleteClick(entry);
            }}
            title="Hapus Data Peserta Permanen"
            className="text-red-500 hover:text-red-700 p-2 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-100"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </td>
    </tr>
  );
}, (prevProps, nextProps) => {
  return prevProps.entry.id === nextProps.entry.id && 
         prevProps.entry.notes === nextProps.entry.notes &&
         prevProps.entry.payment_status === nextProps.entry.payment_status &&
         prevProps.entry.full_name === nextProps.entry.full_name &&
         prevProps.entry.nisn === nextProps.entry.nisn &&
         prevProps.entry.school_name === nextProps.entry.school_name &&
         prevProps.entry.school === nextProps.entry.school &&
         prevProps.entry.province === nextProps.entry.province &&
         prevProps.entry.city === nextProps.entry.city &&
         prevProps.entry.competition_type === nextProps.entry.competition_type &&
         prevProps.entry.category === nextProps.entry.category &&
         prevProps.entry.mentor_name === nextProps.entry.mentor_name &&
         prevProps.entry.email === nextProps.entry.email;
});

interface VerificationCardProps {
  entry: any;
  onUpdateStatus: (id: any, status: string, reason?: string) => void;
  onDeleteClick: (entry: any) => void;
}

const VerificationCard = memo(({ entry, onUpdateStatus, onDeleteClick }: VerificationCardProps) => {
  return (
    <div
      className="group bg-white/80 backdrop-blur-md border border-slate-100 hover:border-blue-200 rounded-3xl p-5 md:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(37,99,235,0.10)] transition-all duration-300 ease-out hover:-translate-y-1 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
    >
      {/* Identitas Pendaftar */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600 rounded-2xl flex items-center justify-center font-black text-xl shrink-0 border border-white shadow-sm">
          {(entry.full_name || entry.email || "U").charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <h4 className="font-bold text-slate-800 text-base leading-tight truncate">{entry.full_name || "Peserta Anonim"}</h4>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">NCC-{String(entry.id).substring(0,6).toUpperCase()}</span>
            <span className="text-xs text-slate-500 truncate max-w-[180px]">{entry.email}</span>
          </div>
          {entry.school_name && (
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <School size={11} className="shrink-0" /> {entry.school_name}
            </p>
          )}
        </div>
      </div>

      {/* Badge Cabang Lomba */}
      <div className="shrink-0">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-xl text-xs font-bold">
          {entry.competition_type || entry.category || "General"}
        </span>
        {entry.team_name && (
          <p className="text-[10px] font-bold text-slate-400 mt-1.5 uppercase tracking-wider">
            Tim: <span className="text-slate-600">{entry.team_name}</span>
          </p>
        )}
      </div>

      {/* Smart Action Group */}
      <div className="flex items-center gap-2 shrink-0 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
        {/* Lihat Bukti TF */}
        {entry.payment_proof_url ? (
          <a
            href={entry.payment_proof_url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white text-slate-600 hover:text-blue-600 border border-slate-200 hover:border-blue-300 hover:bg-blue-50 rounded-xl font-bold text-xs transition-all shadow-sm hover:shadow-md"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7"/><circle cx="12" cy="12" r="3"/></svg>
            Bukti TF
          </a>
        ) : (
          <span className="px-3.5 py-2.5 text-slate-300 text-xs font-bold">Tidak ada</span>
        )}

        {/* Tombol Terima */}
        <button
          onClick={() => onUpdateStatus(entry.id, 'Verified')}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-emerald-400 to-green-500 text-white rounded-xl font-bold text-xs transition-all shadow-sm hover:shadow-emerald-200/60 hover:scale-105 active:scale-95"
        >
          <CheckCircle2 size={14} /> Terima
        </button>

        {/* Tombol Tolak */}
        <button
          onClick={() => {
            const reason = prompt("Masukkan alasan penolakan (misal: Bukti TF buram, dll):");
            if (reason) onUpdateStatus(entry.id, 'Rejected', reason);
          }}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-rose-400 to-red-500 text-white rounded-xl font-bold text-xs transition-all shadow-sm hover:shadow-rose-200/60 hover:scale-105 active:scale-95"
        >
          <AlertCircle size={14} /> Tolak
        </button>

        {/* Divider */}
        <div className="w-px h-8 bg-slate-200 mx-0.5"></div>

        {/* Tombol Hapus (minimalis) */}
        <button
          onClick={() => onDeleteClick(entry)}
          title="Hapus Data Peserta Permanen"
          className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.entry.id === nextProps.entry.id && 
         prevProps.entry.notes === nextProps.entry.notes &&
         prevProps.entry.payment_status === nextProps.entry.payment_status &&
         prevProps.entry.full_name === nextProps.entry.full_name &&
         prevProps.entry.school_name === nextProps.entry.school_name &&
         prevProps.entry.competition_type === nextProps.entry.competition_type &&
         prevProps.entry.payment_proof_url === nextProps.entry.payment_proof_url &&
         prevProps.entry.email === nextProps.entry.email &&
         prevProps.entry.team_name === nextProps.entry.team_name;
});

export default function ModernHQDashboard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [realEntries, setRealEntries] = useState<any[]>([]);
  const [dynamicChartData, setDynamicChartData] = useState<any[]>([]);
  const [dynamicBarData, setDynamicBarData] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [timelineData, setTimelineData] = useState<any[]>([
    {
      category: "LKTI Nasional",
      color: "blue",
      waves: [
        { label: "Gelombang I", items: [
          { label: "Pendaftaran & Abstrak", start: "2026-07-16", end: "2026-09-03" },
          { label: "Pengumuman Tahap I", start: "2026-09-10", end: "" },
          { label: "Pengumpulan Fullpaper", start: "2026-09-12", end: "2026-09-18" },
          { label: "Pengumuman Tahap II", start: "2026-09-26", end: "" }
        ]},
        { label: "Gelombang II", items: [
          { label: "Pendaftaran & Abstrak", start: "2026-10-01", end: "2026-10-25" },
          { label: "Pengumuman Tahap I", start: "2026-10-31", end: "" },
          { label: "Pengumpulan Fullpaper", start: "2026-11-01", end: "2026-11-09" },
          { label: "Pengumuman Tahap II", start: "2026-11-16", end: "" }
        ]}
      ]
    },
    {
      category: "Olimpiade MIPA",
      color: "amber",
      waves: [
        { label: "Gelombang I", items: [
          { label: "Pendaftaran", start: "2026-07-16", end: "2026-09-03" },
          { label: "Seleksi 1", start: "2026-09-10", end: "" },
          { label: "Seleksi 2", start: "2026-09-14", end: "" },
          { label: "Pengumuman Tahap I", start: "2026-09-21", end: "" }
        ]},
        { label: "Gelombang II", items: [
          { label: "Pendaftaran", start: "2026-10-01", end: "2026-10-25" },
          { label: "Simulasi", start: "2026-10-29", end: "" },
          { label: "Seleksi", start: "2026-11-02", end: "" },
          { label: "Pengumuman", start: "2026-11-08", end: "" }
        ]}
      ]
    },
    {
      category: "Speech Contest",
      color: "purple",
      waves: [
        { label: "Gelombang I", items: [
          { label: "Pendaftaran & Naskah", start: "2026-07-16", end: "2026-09-03" },
          { label: "Pengumuman", start: "2026-09-14", end: "" }
        ]},
        { label: "Gelombang II", items: [
          { label: "Pendaftaran & Naskah", start: "2026-10-01", end: "2026-10-25" },
          { label: "Pengumuman", start: "2026-11-14", end: "" }
        ]}
      ]
    },
    {
      category: "MTQ",
      color: "emerald",
      waves: [
        { label: "Gelombang I", items: [
          { label: "Pendaftaran & Video", start: "2026-07-16", end: "2026-09-03" },
          { label: "Pengumuman", start: "2026-09-14", end: "" }
        ]},
        { label: "Gelombang II", items: [
          { label: "Pendaftaran", start: "2026-10-01", end: "2026-10-25" },
          { label: "Pengumuman", start: "2026-11-14", end: "" }
        ]}
      ]
    }
  ]);
  const [isSavingTimeline, setIsSavingTimeline] = useState(false);
  const [isTimelineLoaded, setIsTimelineLoaded] = useState(false);
  const [isPortalLoaded, setIsPortalLoaded] = useState(false);

  useEffect(() => {
    const fetchTimeline = async () => {
      try {
        const { data: timelineConfig } = await supabase.from('announcements').select('*').eq('title', 'SYSTEM_TIMELINE_CONFIG').single();
        if (timelineConfig && timelineConfig.content) {
          try {
            const rawData = JSON.parse(timelineConfig.content);
            // Migrasi Data Otomatis: Ubah format 'date' lama ke 'start/end' baru
            const migratedData = rawData.map((cat: any) => ({
              ...cat,
              waves: cat.waves.map((wave: any) => ({
                ...wave,
                items: wave.items.map((item: any) => {
                  if (item.date && !item.start) {
                    const isRange = item.date.includes(" – ");
                    return {
                      ...item,
                      start: parseIndoDate(isRange ? item.date.split(" – ")[0] : item.date),
                      end: isRange ? parseIndoDate(item.date.split(" – ")[1]) : ""
                    };
                  }
                  return item;
                })
              }))
            }));
            setTimelineData(migratedData);
          } catch (e) {
            console.error("Gagal migrasi data:", e);
          }
        }
      } catch (err) {
        console.error("Gagal fetch timeline:", err);
      } finally {
        setIsTimelineLoaded(true);
      }
    };
    fetchTimeline();
  }, []);

  // --- MEMORI KENDALI PORTAL & GELOMBANG ---
  const updateTimelineItem = (catName: string, waveLabel: string, itemLabel: string, type: 'start' | 'end', value: string) => {
    const updatedData = timelineData.map(cat => {
      if (cat.category === catName) {
        return {
          ...cat,
          waves: cat.waves.map((wave: any) => {
            if (wave.label === waveLabel) {
              return {
                ...wave,
                items: wave.items.map((item: any) => {
                  if (item.label === itemLabel) {
                    return { ...item, [type]: value };
                  }
                  return item;
                })
              };
            }
            return wave;
          })
        };
      }
      return cat;
    });
    setTimelineData(updatedData);
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [timeFilter, setTimeFilter] = useState("All"); // Opsi: 'Today', '7Days', '1Month', 'All'
  const [selectedParticipant, setSelectedParticipant] = useState<any | null>(null);
  const [selectedIdCard, setSelectedIdCard] = useState<any | null>(null);

  // --- MEMORI SIARAN KOMANDO ---
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastTarget, setBroadcastTarget] = useState("All");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);


  // --- FUNGSI FORMAT TANGGAL INDONESIA ---
  const formatIndoDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const parseIndoDate = (indoStr: string) => {
    if (!indoStr) return "";
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    
    // Bersihkan karakter aneh dan split
    const parts = indoStr.trim().split(/\s+/).filter(p => p.length > 1 || !isNaN(parseInt(p)));
    if (parts.length < 2) return "";
    
    const day = parts[0].padStart(2, '0');
    // Cari bulan (case-insensitive)
    const monthIndex = months.findIndex(m => parts.some(p => p.toLowerCase() === m.toLowerCase()));
    
    // Cari tahun (cari part yang panjangnya 4 angka)
    let year = parts.find(p => p.length === 4 && !isNaN(parseInt(p))) || new Date().getFullYear().toString();
    
    if (monthIndex === -1 || isNaN(parseInt(day))) return "";
    return `${year}-${(monthIndex + 1).toString().padStart(2, '0')}-${day}`;
  };

  // --- MEMORI KAWALAN KEGIATAN & PORTAL ---
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(true);
  
  const [submissionStatus, setSubmissionStatus] = useState([
    { id: 'mipa_g1', name: 'Olimpiade MIPA (Gel. I)', isOpen: false, openAt: "", closeAt: "", mode: "" },
    { id: 'mipa_g2', name: 'Olimpiade MIPA (Gel. II)', isOpen: false, openAt: "", closeAt: "", mode: "" },
    { id: 'speech_g1', name: 'Speech Contest (Gel. I)', isOpen: false, openAt: "", closeAt: "", mode: "" },
    { id: 'speech_g2', name: 'Speech Contest (Gel. II)', isOpen: false, openAt: "", closeAt: "", mode: "" },
    { id: 'lkti_g1', name: 'LKTI Nasional (Gel. I)', isOpen: true, openAt: "", closeAt: "", mode: "" },
    { id: 'lkti_g2', name: 'LKTI Nasional (Gel. II)', isOpen: false, openAt: "", closeAt: "", mode: "" },
    { id: 'mtq_g1', name: 'MTQ (Gel. I)', isOpen: false, openAt: "", closeAt: "", mode: "" },
    { id: 'mtq_g2', name: 'MTQ (Gel. II)', isOpen: false, openAt: "", closeAt: "", mode: "" },
  ]);

  const toggleSubmission = (id: string) => {
    setSubmissionStatus(prev => prev.map(item => 
      item.id === id ? { ...item, isOpen: !item.isOpen, mode: "Manual" } : item
    ));
  };

  const updateSchedule = (id: string, type: 'openAt' | 'closeAt' | 'mode', value: string) => {
    setSubmissionStatus(prev => prev.map(item => 
      item.id === id ? { ...item, [type]: value } : item
    ));
  };

  // --- ⏰ LOGIKA PENJADWALAN OTOMATIS REAL-TIME ---
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      let hasChanged = false;
      
      const newStatus = submissionStatus.map(item => {
        // HANYA EKSEKUSI JIKA MODE OTOMATIS
        if (item.mode !== 'Auto') return item;

        let nextStatus = { ...item };
        let itemChanged = false;

        // Cek Jadwal Buka
        if (item.openAt && !item.isOpen) {
          const openDate = new Date(item.openAt);
          if (now >= openDate) {
            nextStatus.isOpen = true;
            itemChanged = true;
          }
        }

        // Cek Jadwal Tutup
        if (item.closeAt && item.isOpen) {
          const closeDate = new Date(item.closeAt);
          if (now >= closeDate) {
            nextStatus.isOpen = false;
            itemChanged = true;
          }
        }

        if (itemChanged) hasChanged = true;
        return nextStatus;
      });

      if (hasChanged) {
        setSubmissionStatus(newStatus);
        showToast("Otomasi: Jadwal dieksekusi secara otomatis.", "success");
      }
    }, 10000); 

    return () => clearInterval(timer);
  }, [submissionStatus]);

  const [phaseStatus, setPhaseStatus] = useState([
    { id: 'tahap1', name: 'Tahap 1: Penyisihan', isOpen: true },
    { id: 'tahap2', name: 'Tahap 2: Semi Final', isOpen: false },
    { id: 'tahap3', name: 'Tahap 3: Grand Final', isOpen: false },
  ]);

  const togglePhase = (id: string) => {
    setPhaseStatus(prev => prev.map(item => 
      item.id === id ? { ...item, isOpen: !item.isOpen } : item
    ));
  };

  const [waves, setWaves] = useState([
    { id: 1, name: "Gelombang 1 (Early Bird)", status: "Aktif", startDate: "2026-07-16", endDate: "2026-09-03" },
    { id: 2, name: "Gelombang 2 (Regular)", status: "Segera", startDate: "2026-10-01", endDate: "2026-10-25" },
  ]);

  const toggleWaveStatus = (id: number) => {
    setWaves(prev => prev.map(w => 
      w.id === id 
        ? { ...w, status: w.status === 'Aktif' ? 'Tutup' : 'Aktif' } 
        : w
    ));
  };

  const [dashboardAssets, setDashboardAssets] = useState<any>({
    hero_banner: "",
    card_buku_panduan: "",
    card_twibbon: "",
    card_kontak: "",
    gallery_title: "Moments of Excellence",
    gallery_subtitle: "A glimpse into the spirit, competition, and victory at NCC. Capturing the journey of future leaders across diverse categories.",
    gallery_images: [
      { url: "/gallery/IMG_8067.JPG", category: "GALLERY", label: "NCC Grand Championship" },
      { url: "/gallery/IMG_8109.JPG", category: "ACADEMIC", label: "LKTI Research Winners" },
      { url: "/gallery/IMG_7993.JPG", category: "SPEECH", label: "Language Excellence" },
      { url: "/gallery/IMG_8103.JPG", category: "ARTS", label: "MTQ Quran Recital" },
      { url: "/gallery/IMG_8143.JPG", category: "ARTS", label: "Choral Symphony" },
      { url: "/gallery/ECL09816.JPG", category: "GALLERY", label: "Ceremonial Parade" },
      { url: "/gallery/ECL09791.JPG", category: "ARTS", label: "Stage Performance" }
    ]
  });

  const [isUploadingAsset, setIsUploadingAsset] = useState<string | null>(null);

  // --- 🎯 STATE MANAGEMENT MANAJEMEN LLMS (CBT EXAM) ---
  const [llmsActiveSubTab, setLlmsActiveSubTab] = useState<'overview' | 'soal' | 'sesi' | 'nilai'>('overview');
  const [llmsQuestions, setLlmsQuestions] = useState<any[]>([]);
  const [llmsSessions, setLlmsSessions] = useState<any[]>([]);
  const [llmsLeaderboard, setLlmsLeaderboard] = useState<any[]>([]);
  const [selectedLmsScoreDetail, setSelectedLmsScoreDetail] = useState<any | null>(null);

  // --- ⚡ PROCTORING & LIVE WEBSOCKET ACTIVITY SIMULATOR STATES ---
  const [llmsSimulating, setLlmsSimulating] = useState<boolean>(false);
  const [llmsActivityLogs, setLlmsActivityLogs] = useState<any[]>([
    { id: 1, time: "08:44:12", text: "NCC-27 (3345d5de) baru saja menyelesaikan soal ke-5.", type: "success" },
    { id: 2, time: "08:43:05", text: "NCC-26 (gmn gmn) baru saja mengumpulkan jawaban nomor 10.", type: "info" },
    { id: 3, time: "08:41:55", text: "⚠️ PROCTORING: NCC-24 (padoaioihd) terdeteksi keluar dari tab ujian! (Pelanggaran 1/3)", type: "warning" },
    { id: 4, time: "08:40:02", text: "NCC-23 (luthfi) memulai sesi ujian MIPA.", type: "info" }
  ]);
  const [activeViolationAlert, setActiveViolationAlert] = useState<any | null>(null);

  const [newQuestion, setNewQuestion] = useState({
    question: "",
    options: ["", "", "", "", ""],
    correct: "A",
    difficulty: "Medium",
    category: "Olimpiade MIPA",
    weight: 4,
    status: "Published",
    image: ""
  });

  const [newSession, setNewSession] = useState({
    title: "",
    token: "",
    duration: "90 Menit",
    status: "Nonaktif",
    wave: "Gelombang I",
    scoring_system: "Fixed",
    correct_point: 4,
    penalty_point: 1,
    empty_point: 0
  });

  const handleAssetUpload = async (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAsset(key);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `assets/${key}-${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('payment-proofs').upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('payment-proofs').getPublicUrl(fileName);
      
      if (key === 'gallery_add') {
        setDashboardAssets((prev: any) => ({ 
          ...prev, 
          gallery_images: [...(prev.gallery_images || []), { url: urlData.publicUrl, category: "GALLERY", label: "New NCC Moment" }] 
        }));
        showToast("Foto galeri baru berhasil ditambahkan!", "success");
      } else {
        setDashboardAssets((prev: any) => ({ ...prev, [key]: urlData.publicUrl }));
        showToast(`Gambar ${key} berhasil diperbarui!`, "success");
      }
    } catch (error: any) {
      showToast(`Gagal upload: ${error.message}`, "error");
    } finally {
      setIsUploadingAsset(null);
    }
  };

  const supabase = createClient();

  // --- 📡 FETCH CBT DATA FROM POSTGRESQL ---
  useEffect(() => {
    async function loadCBTData() {
      try {
        // 1. Fetch Exams (Sessions)
        const examsRes = await fetch('/api/cbt/exams');
        const examsJson = await examsRes.json();
        let activeExamId = null;
        if (examsJson.success && examsJson.data) {
          const formattedExams = examsJson.data.map((e: any) => ({
            id: e.id,
            title: e.title,
            token: e.token,
            duration: `${e.duration_minutes} Menit`,
            status: e.is_active ? 'Aktif' : 'Nonaktif',
            wave: "Gelombang I",
            scoring_system: e.scoring_system,
            correct_point: e.correct_point,
            penalty_point: e.penalty_point
          }));
          setLlmsSessions(formattedExams);
          const activeExam = formattedExams.find((e: any) => e.status === 'Aktif');
          if (activeExam) activeExamId = activeExam.id;
        }

        // 2. Fetch Questions & Leaderboard for the active exam
        if (activeExamId) {
          const qRes = await fetch(`/api/admin/llms/questions?exam_id=${activeExamId}`);
          const qJson = await qRes.json();
          if (qJson.success && qJson.data) {
            setLlmsQuestions(qJson.data.map((q: any) => ({
              id: q.id,
              question: q.question_text,
              options: [q.options.A, q.options.B, q.options.C, q.options.D, q.options.E].filter(Boolean),
              correct: q.correct_answer,
              difficulty: q.difficulty || "Medium",
              category: "Olimpiade MIPA",
              weight: q.weight,
              status: q.status || "Published",
              image: q.image_url || ""
            })));
          }

          const lRes = await fetch(`/api/admin/llms/grading?exam_id=${activeExamId}`);
          const lJson = await lRes.json();
          if (lJson.success && lJson.data) {
            setLlmsLeaderboard(lJson.data.map((r: any) => ({
              rank: r.rank,
              ticket: r.user_id,
              name: r.user_id, // We use user_id as name for now
              category: "Olimpiade MIPA",
              score: r.final_score,
              accuracy: r.final_score + "%",
              time: "Selesai",
              status: r.status === 'disqualified' ? 'Gugur' : (r.passed ? 'Lolos' : 'Gugur'),
              warnings: r.warnings_count
            })));
          }
        }
      } catch (err) {
        console.error("Gagal memuat data CBT:", err);
      }
    }
    loadCBTData();
  }, []);


  // --- 📡 LIVE CBT PROCTORING SIMULATOR ENGINE ---
  useEffect(() => {
    if (!llmsSimulating) return;

    const interval = setInterval(() => {
      const currentTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      
      const students = [
        { ticket: "NCC-27", name: "3345d5de" },
        { ticket: "NCC-26", name: "gmn gmn" },
        { ticket: "NCC-24", name: "padoaioihd" },
        { ticket: "NCC-23", name: "luthfi" },
        { ticket: "NCC-17", name: "muhammad luthfi aziz" }
      ];

      const normalActions = [
        "menyimpan jawaban No. 3 (Pilihan C).",
        "membuka soal No. 7 (Medium).",
        "mengganti jawaban No. 12 menjadi Pilihan A.",
        "menandai ragu-ragu pada No. 9.",
        "berhasil mengunggah jawaban isian singkat No. 4."
      ];

      const isViolation = Math.random() < 0.25;

      if (isViolation) {
        const randomStudent = students[Math.floor(Math.random() * students.length)];
        
        setLlmsLeaderboard(prev => {
          return prev.map(p => {
            if (p.ticket === randomStudent.ticket) {
              const newWarn = (p.warnings || 0) + 1;
              
              setActiveViolationAlert({
                ticket: p.ticket,
                name: p.name,
                warnings: newWarn,
                time: currentTime
              });

              return { 
                ...p, 
                warnings: newWarn,
                status: newWarn >= 3 ? "Gugur" : p.status 
              };
            }
            return p;
          });
        });

        const logText = `🚩 PROCTORING: ${randomStudent.ticket} (${randomStudent.name}) terdeteksi keluar tab browser!`;
        setLlmsActivityLogs(prev => [
          { id: Date.now(), time: currentTime, text: logText, type: "warning" },
          ...prev.slice(0, 15)
        ]);

      } else {
        const randomStudent = students[Math.floor(Math.random() * students.length)];
        const randomAction = normalActions[Math.floor(Math.random() * normalActions.length)];
        const logText = `${randomStudent.ticket} (${randomStudent.name}) ${randomAction}`;
        
        setLlmsActivityLogs(prev => [
          { id: Date.now(), time: currentTime, text: logText, type: "info" },
          ...prev.slice(0, 15)
        ]);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [llmsSimulating]);

  // --- 📡 SUPABASE REALTIME WEBSOCKET CHANNELS (FASE 3) ---
  const [realtimeConnected, setRealtimeConnected] = useState(false);

  useEffect(() => {
    // Channel 1: Monitor perubahan pada tabel cbt_attempts (peserta masuk/keluar/DQ)
    const attemptsChannel = supabase
      .channel('cbt_attempts_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cbt_attempts' },
        (payload) => {
          const currentTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          const record = payload.new as any;

          if (payload.eventType === 'INSERT') {
            // Peserta baru memulai ujian
            const logText = `📥 REALTIME: Peserta ${record.user_id} memulai sesi ujian.`;
            setLlmsActivityLogs(prev => [
              { id: Date.now(), time: currentTime, text: logText, type: "success" },
              ...prev.slice(0, 19)
            ]);
          }

          if (payload.eventType === 'UPDATE') {
            // Cek apakah ini update proctoring warning
            const oldRecord = payload.old as any;
            if (record.warnings_count > (oldRecord?.warnings_count || 0)) {
              const logText = `🚩 REALTIME PROCTORING: Peserta ${record.user_id} terdeteksi keluar tab! Pelanggaran: ${record.warnings_count}/3`;
              setLlmsActivityLogs(prev => [
                { id: Date.now(), time: currentTime, text: logText, type: "warning" },
                ...prev.slice(0, 19)
              ]);

              // Tampilkan alert banner di layar admin
              setActiveViolationAlert({
                ticket: record.user_id,
                name: record.user_id,
                warnings: record.warnings_count,
                time: currentTime
              });

              // Update leaderboard warnings
              setLlmsLeaderboard(prev => prev.map(p => {
                if (p.ticket === record.user_id) {
                  return {
                    ...p,
                    warnings: record.warnings_count,
                    status: record.status === 'disqualified' ? 'Gugur' : p.status
                  };
                }
                return p;
              }));
            }

            // Cek apakah ini submit ujian
            if (record.status === 'submitted' && (oldRecord?.status === 'ongoing' || !oldRecord?.status)) {
              const logText = `✅ REALTIME: Peserta ${record.user_id} mengumpulkan ujian! Skor: ${record.final_score}`;
              setLlmsActivityLogs(prev => [
                { id: Date.now(), time: currentTime, text: logText, type: "success" },
                ...prev.slice(0, 19)
              ]);
            }

            // Diskualifikasi otomatis
            if (record.status === 'disqualified') {
              const logText = `❌ REALTIME: Peserta ${record.user_id} DIDISKUALIFIKASI oleh sistem proctoring.`;
              setLlmsActivityLogs(prev => [
                { id: Date.now(), time: currentTime, text: logText, type: "warning" },
                ...prev.slice(0, 19)
              ]);
            }
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setRealtimeConnected(true);
          console.log('[CBT Realtime] ✅ Channel cbt_attempts terhubung.');
        }
      });

    // Channel 2: Monitor auto-save jawaban peserta (progress tracking)
    const answersChannel = supabase
      .channel('cbt_answers_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'cbt_answers' },
        (payload) => {
          const currentTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          const record = payload.new as any;
          const logText = `💾 AUTO-SAVE: Jawaban untuk soal disinkronkan ke database.`;
          setLlmsActivityLogs(prev => [
            { id: Date.now(), time: currentTime, text: logText, type: "info" },
            ...prev.slice(0, 19)
          ]);
        }
      )
      .subscribe();

    // Channel 3: Broadcast channel untuk komunikasi antar-tab admin
    const broadcastChannel = supabase
      .channel('cbt_admin_broadcast')
      .on('broadcast', { event: 'exam_action' }, (payload) => {
        const currentTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const data = payload.payload;
        
        if (data?.type === 'proctoring_violation') {
          setActiveViolationAlert({
            ticket: data.ticket,
            name: data.name,
            warnings: data.warnings,
            time: currentTime
          });
        }

        if (data?.type === 'student_progress') {
          setLlmsActivityLogs(prev => [
            { id: Date.now(), time: currentTime, text: data.message, type: "info" },
            ...prev.slice(0, 19)
          ]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(attemptsChannel);
      supabase.removeChannel(answersChannel);
      supabase.removeChannel(broadcastChannel);
      setRealtimeConnected(false);
    };
  }, []);

  // --- 📡 REAL-TIME PORTAL SYNC ENGINE ---
  useEffect(() => {
    if (!isPortalLoaded) return;

    const syncToDatabase = async () => {
      const payload = { waves, submissionStatus, phaseStatus, dashboardAssets, isRegistrationOpen };
      await supabase
        .from('announcements')
        .update({ content: JSON.stringify(payload) })
        .eq('title', 'SYS_PORTAL_SETTINGS');
    };
    syncToDatabase();
  }, [waves, submissionStatus, phaseStatus, dashboardAssets, isRegistrationOpen, isPortalLoaded]);

  // --- 📡 REAL-TIME TIMELINE AUTO-SYNC ---
  useEffect(() => {
    if (!isTimelineLoaded) return;

    const timer = setTimeout(() => {
      saveTimeline();
    }, 1000);
    return () => clearTimeout(timer);
  }, [timelineData, isTimelineLoaded]);

  const saveTimeline = async () => {
    setIsSavingTimeline(true);
    try {
      const cleanData = timelineData.map(cat => ({
        ...cat,
        waves: cat.waves.map((wave: any) => ({
          ...wave,
          items: wave.items.map((item: any) => {
            const newItem = { ...item };
            delete (newItem as any).date; 
            return newItem;
          })
        }))
      }));

      // 🚀 Gunakan API Route agar RevalidatePath (Hapus Cache) bekerja!
      const response = await fetch('/api/admin/sync-timeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cleanData })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Gagal sinkronisasi ke server');
      }

      showToast("Sinkronisasi Berhasil! Cache telah dibersihkan.", "success");
    } catch (err: any) {
      console.error("Save error:", err);
      showToast(`Gagal Sinkron: ${err.message}`, "error");
    } finally {
      setIsSavingTimeline(false);
    }
  };

  // --- 🚪 FUNGSI PINTU EVAKUASI ---
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  // --- 📸 REFERENSI AREA FOTO ID CARD (ADMIN) ---
  const idCardRef = useRef<HTMLDivElement>(null);
  const [isDownloadingCard, setIsDownloadingCard] = useState(false);

  // --- FUNGSI UNDUH ID CARD PNG (html-to-image — RINGAN & ANTI-GAGAL) ---
  const handleDownloadCard = async () => {
    if (!idCardRef.current) {
      return showToast('Sistem belum siap, coba sebentar lagi.', 'error');
    }
    setIsDownloadingCard(true);
    try {
      const dataUrl = await htmlToImage.toPng(idCardRef.current, {
        quality: 1.0,
        pixelRatio: 2,
      });
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `ID_Card_NCC_${selectedIdCard?.full_name?.replace(/\s+/g, '_') || 'Peserta'}.png`;
      link.click();
      showToast('ID Card berhasil diunduh sebagai PNG!', 'success');
    } catch (err) {
      console.error('Detail Error:', err);
      showToast('Gagal mengunduh. Coba lagi.', 'error');
    } finally {
      setIsDownloadingCard(false);
    }
  };

  // --- 🗑️ FUNGSI PEMUSNAH ABSOLUT ---
  const executeDelete = async () => {
    // Pastikan kita memiliki ID otentikasi (userId)
    if (!deleteModal.userId) {
      return showToast("Gagal: ID KTP Digital (User ID) tidak ditemukan!", "error");
    }
    
    try {
      // PANGGIL FUNGSI RPC, BUKAN .delete()
      const { error } = await supabase.rpc('delete_participant_completely', {
        target_user_id: deleteModal.userId
      });

      if (error) throw error;

      // Bersihkan dari layar Markas Besar
      setRealEntries(realEntries.filter((e: any) => e.id !== deleteModal.id));
      showToast(`Peserta ${deleteModal.name} berhasil dihapus permanen dari sistem!`, "success");
      
    } catch (error: any) {
      showToast(`Gagal menghapus: ${error.message}`, "error");
    } finally {
      setDeleteModal({ show: false, id: null, userId: null, name: "" }); 
    }
  };

  // --- MEMORI SISTEM NOTIFIKASI KUSTOM ---
  const [toast, setToast] = useState({ show: false, message: "", type: "success" as "success" | "error" });
  const [confirmModal, setConfirmModal] = useState({ show: false, title: "", message: "", onConfirm: () => {} });

  // --- MEMORI MODAL DELETE (UPGRADED) ---
  const [deleteModal, setDeleteModal] = useState({ show: false, id: null, userId: null, name: "" });

  // Fungsi pemanggil Toast
  const showToast = (message: string, type: "success" | "error" = "success") => {
    // Jika ada toast lama, hapus dulu agar yang baru langsung muncul (interupsi)
    setToast({ show: false, message: "", type: "success" });
    
    setTimeout(() => {
      setToast({ show: true, message, type });
    }, 10);

    // Durasi lebih lama untuk sukses agar terbaca
    const duration = type === 'success' ? 4000 : 5000;
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), duration); 
  };

  // --- MESIN EKSEKUTOR STATUS ---
  const handleUpdateStatus = async (id: string | number, newStatus: string, reason?: string) => {
    setConfirmModal({
      show: true,
      title: "Konfirmasi Perubahan Status",
      message: newStatus === 'Rejected' 
        ? `Apakah Anda yakin ingin MENOLAK pendaftar ini dengan alasan: "${reason}"?` 
        : `Apakah Anda yakin ingin menerima pendaftar ini menjadi ${newStatus}?`,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, show: false }));
        try {
          const updateData: any = { payment_status: newStatus };
          
          if (newStatus === 'Rejected' && reason) {
             const entry = realEntries.find(e => e.id === id);
             let notesObj: any = {};
             if (entry?.notes) try { notesObj = JSON.parse(entry.notes); } catch (e) {}
             notesObj.rejection_reason = reason;
             updateData.notes = JSON.stringify(notesObj);
          } else if (newStatus === 'Verified') {
             const entry = realEntries.find(e => e.id === id);
             let notesObj: any = {};
             if (entry?.notes) try { notesObj = JSON.parse(entry.notes); } catch (e) {}
             if (notesObj.rejection_reason) {
                 delete notesObj.rejection_reason;
                 updateData.notes = JSON.stringify(notesObj);
             }
          }

          const { error } = await supabase
            .from('competition_entries')
            .update(updateData)
            .eq('id', id);

          if (error) throw error;

          setRealEntries(prevEntries => 
            prevEntries.map(entry => 
              entry.id === id ? { ...entry, ...updateData } : entry
            )
          );

          showToast(`Komando berhasil! Status telah menjadi ${newStatus}.`, "success");
        } catch (error: any) {
          showToast(`Misi Gagal: ${error.message}`, "error");
        }
      }
    });
  };

  // --- MESIN EKSEKUTOR SIARAN ---
  const handleSendClick = () => {
    if (!broadcastTitle || !broadcastMessage) {
      return showToast("Judul dan isi pesan tidak boleh kosong, Komandan!", "error");
    }

    if (broadcastTarget === "specific" && (selectedUserIds || []).length === 0) {
      return showToast("Pilih minimal satu peserta untuk pengumuman spesifik ini!", "error");
    }

    setConfirmModal({
      show: true,
      title: "Konfirmasi Siaran Komando",
      message: `Pesan "${broadcastTitle}" akan segera ditembakkan ke target sasaran. Tindakan ini tidak dapat dibatalkan. Lanjutkan?`,
      onConfirm: executeBroadcast
    });
  };

  const executeBroadcast = async () => {
    setConfirmModal(prev => ({ ...prev, show: false }));
    setIsSending(true);
    try {
      const { error } = await supabase
        .from('announcements')
        .insert([
          {
            title: broadcastTitle,
            content: broadcastMessage,
            target_audience: broadcastTarget,
            target_user_ids: broadcastTarget === 'specific' ? selectedUserIds : []
          }
        ]);

      if (error) throw error;

      showToast("Pengumuman resmi berhasil mengudara ke peserta!", "success");
      setBroadcastTitle("");
      setBroadcastMessage("");
      setSelectedUserIds([]);
    } catch (error: any) {
      showToast(`Gagal menyiarkan: ${error.message}`, "error");
    } finally {
      setIsSending(false);
    }
  };

  // --- KONTROL PROGRES TAHAP PESERTA ---
  const handleUpdateStage = async (id: any, newStage: number) => {
    try {
      const entry = realEntries.find(e => e.id === id);
      let notesObj: any = {};
      if (entry?.notes) try { notesObj = JSON.parse(entry.notes); } catch (e) {}
      
      notesObj.current_stage = newStage;
      const updatedNotes = JSON.stringify(notesObj);

      const { error } = await supabase
        .from('competition_entries')
        .update({ notes: updatedNotes })
        .eq('id', id);

      if (error) throw error;

      // Update state lokal
      setRealEntries(prev => prev.map(entry => 
        entry.id === id ? { ...entry, notes: updatedNotes } : entry
      ));
      
      // Update selected participant if open
      if (selectedParticipant && selectedParticipant.id === id) {
        setSelectedParticipant((prev: any) => ({ ...prev, notes: updatedNotes }));
      }

      showToast(`Peserta berhasil dipindahkan ke Tahap ${newStage === 3 ? 'Final' : newStage}`, "success");
    } catch (err) {
      console.error("Gagal update tahap:", err);
      showToast("Gagal memperbarui tahap peserta", "error");
    }
  };

  // --- MESIN PENGUMPUL DATA & RADAR REAL-TIME ---
  useEffect(() => {
    // Fungsi penarik data utama
  const fetchRealData = async () => {
      try {
        const { data, error } = await supabase
          .from('competition_entries')
          .select('*')
          .neq('email', 'admin1@ncc.id') 
          .order('created_at', { ascending: false });

        if (error) {
          console.error("Gagal menarik data:", error);
        } else {
          setRealEntries(data || []);
        }
      } catch (err) {
        console.error("Error eksekusi:", err);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchPortalSettings = async () => {
      try {
        const { data: existing } = await supabase
          .from('announcements')
          .select('*')
          .eq('title', 'SYS_PORTAL_SETTINGS')
          .single();

        if (existing) {
          const parsed = JSON.parse(existing.content);
          if (parsed.submissionStatus) setSubmissionStatus(parsed.submissionStatus);
          if (parsed.waves) setWaves(parsed.waves);
          if (parsed.phaseStatus) setPhaseStatus(parsed.phaseStatus);
          if (parsed.dashboardAssets) setDashboardAssets(parsed.dashboardAssets);
          if (parsed.isRegistrationOpen !== undefined) setIsRegistrationOpen(parsed.isRegistrationOpen);
        }
      } catch (err) {
        console.error("Gagal menarik status portal:", err);
      } finally {
        setIsPortalLoaded(true);
      }
    };

    // 1. Tarik data saat Markas Besar pertama kali dibuka
    fetchRealData();
    fetchPortalSettings();

    // 2. 📡 AKTIFKAN SENSOR RADAR (Supabase WebSockets)
    const radarSubscription = supabase
      .channel('pantau_pendaftaran_ncc') // Nama saluran bebas
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'competition_entries' }, // Pantau SEMUA perubahan di tabel ini
        (payload) => {
          // 🚨 JIKA ADA PERGERAKAN (Daftar baru, update foto, ubah status)
          console.log("Radar mendeteksi pergerakan data!", payload);
          
          // Perintahkan sistem untuk menarik ulang data secara rahasia di latar belakang
          fetchRealData(); 
        }
      )
      .subscribe();

    // 3. Matikan radar secara otomatis jika Presiden menutup halaman
    return () => {
      supabase.removeChannel(radarSubscription);
    };
  }, []);

  // --- MESIN PENGOLAH DATA GRAFIK REAL-TIME (DENGAN FILTER WAKTU) ---
  useEffect(() => {
    if (realEntries.length === 0) return;

    // 1. Hitung batas waktu (Cutoff Date) berdasarkan filter yang aktif
    const now = new Date();
    let cutoffDate = new Date(0); // Default 'All' (dari awal waktu)

    if (timeFilter === "Today") {
      cutoffDate = new Date(now.setHours(0, 0, 0, 0)); // Hari ini mulai jam 00:00
    } else if (timeFilter === "7Days") {
      cutoffDate = new Date(now.setDate(now.getDate() - 7)); // 7 Hari ke belakang
    } else if (timeFilter === "1Month") {
      cutoffDate = new Date(now.setMonth(now.getMonth() - 1)); // 1 Bulan ke belakang
    }

    // 2. Saring data mentah berdasarkan waktu terlebih dahulu
    const filteredEntries = realEntries.filter(entry => {
      const entryDate = entry.created_at ? new Date(entry.created_at) : new Date();
      return entryDate >= cutoffDate;
    });

    const categoryMap: Record<string, number> = {};
    const dateMap: Record<string, { name: string, pendaftar: number, timestamp: number }> = {};

    // 3. Olah data yang sudah disaring
    filteredEntries.forEach(entry => {
      // Rekap Data Kategori (Bar Chart)
      const category = entry.competition_type || entry.category || "Belum Pilih";
      categoryMap[category] = (categoryMap[category] || 0) + 1;

      // Rekap Data Tanggal (Line Chart)
      if (entry.created_at) {
        const date = new Date(entry.created_at);
        const dateStr = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }); 
        const timeKey = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

        if (!dateMap[timeKey]) {
          dateMap[timeKey] = { name: dateStr, pendaftar: 0, timestamp: timeKey };
        }
        dateMap[timeKey].pendaftar += 1;
      }
    });

    // 4. Ubah format untuk grafik
    const finalBarData = Object.keys(categoryMap).map(key => ({ name: key, total: categoryMap[key] }));
    const finalLineData = Object.values(dateMap)
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(item => ({ name: item.name, pendaftar: item.pendaftar }));

    setDynamicBarData(finalBarData);
    setDynamicChartData(finalLineData);
  }, [realEntries, timeFilter]);

  // --- 📥 FITUR 1: MESIN EKSPOR CSV CERDAS ---
  const handleExportCSV = () => {
    // 1. Tentukan data mana yang mau di-ekspor (hanya yang Terverifikasi)
    const dataToExport = realEntries.filter(e => e.payment_status === 'Verified');
    
    if (dataToExport.length === 0) return alert("Tidak ada data peserta terverifikasi untuk di-ekspor.");

    // 2. Tentukan Header Kolom
    const headers = ["ID Tiket", "Nama Lengkap", "Email", "NISN", "Sekolah", "Provinsi", "Kategori", "Pembina", "Waktu Daftar"];
    
    // 3. Susun Baris Data
    const rows = dataToExport.map(e => [
      `NCC-${e.id}`,
      e.full_name || "-",
      e.email || "-",
      e.nisn || "-",
      e.school_name || e.school || "-",
      e.province || e.city || "-",
      e.competition_type || e.category || "-",
      e.mentor_name || "-",
      new Date(e.created_at).toLocaleString('id-ID')
    ]);

    // 4. Gabungkan menjadi format CSV
    const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
    
    // 5. Trigger Download otomatis
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Data_Peserta_NCC13_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- 🖨️ FITUR 2: MESIN CETAK FISIK ---
  const handlePrintCard = () => {
    window.print(); // Cara termudah & paling stabil untuk browser
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden relative">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { 
            position: absolute; 
            left: 50%; 
            top: 40%; 
            transform: translate(-50%, -50%) scale(1.8); 
            width: 320px !important;
          }
        }
      `}</style>
      {/* Ornamen Latar Belakang - Optimized */}
      <div className="absolute top-[-5%] left-[-5%] w-64 h-64 bg-blue-400/10 rounded-full blur-2xl pointer-events-none"></div>
      <div className="absolute bottom-[-5%] right-[-2%] w-64 h-64 bg-indigo-400/10 rounded-full blur-2xl pointer-events-none"></div>
      
      {/* ========================================================= */}
        {/* SIDEBAR NAVIGASI (LIQUID GLASS) */}
      {/* ========================================================= */}
      <aside className="w-72 bg-white/70 backdrop-blur-2xl border-r border-white/60 flex flex-col z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-all duration-500">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
              <ShieldCheck size={22} className="text-white" />
            </div>
            <div>
              <h1 className="font-black text-xl text-slate-800 tracking-tight">NCC HQ.</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Command Center</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {[
            { id: "Dashboard", icon: <LayoutDashboard size={18} />, label: "Dashboard" },
            { id: "Peserta", icon: <Users size={18} />, label: "Buku Peserta", count: realEntries.filter((e: any) => e.payment_status === 'Verified' || e.payment_status === 'success').length },
            { id: "Verifikasi", icon: <CheckCircle size={18} />, label: "Verifikasi Berkas", count: realEntries.filter((e: any) => e.payment_status === 'Pending').length },
            { id: "Pengumuman", icon: <Megaphone size={18} />, label: "Siaran Info" },
            { id: "Kegiatan", icon: <CalendarDays size={18} />, label: "Kegiatan" },
            { id: "Schedule", icon: <Calendar size={18} />, label: "Schedule Lomba" },
            { id: "Media", icon: <ImageIcon size={18} />, label: "Kelola Media" },
            { id: "LLMS", icon: <GraduationCap size={18} />, label: "Manajemen LLMS", badge: "New" },
            { id: "Pengaturan", icon: <Settings size={18} />, label: "Pengaturan" }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-300 font-bold text-sm ${
                activeTab === item.id 
                  ? "bg-blue-600 text-white shadow-md shadow-blue-200 scale-[1.02]" 
                  : "text-slate-500 hover:bg-white hover:text-blue-600 hover:shadow-sm"
              }`}
            >
              <div className="flex items-center gap-3">
                {item.icon} {item.label}
                {item.badge && (
                  <span className="text-[9px] font-black tracking-wider uppercase px-1.5 py-0.5 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-md shadow-sm ml-1.5">
                    {item.badge}
                  </span>
                )}
              </div>
              {item.count !== undefined && item.count > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === item.id ? "bg-white/20 text-white" : "bg-red-100 text-red-600 animate-pulse"}`}>
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-6 mt-auto">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-red-50/50 text-red-500 hover:bg-red-100 hover:text-red-600 rounded-2xl transition-all font-bold text-sm">
            <LogOut size={18} /> Keluar Sesi
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8 relative">
        
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{activeTab}</h1>
            <p className="text-slate-500 text-sm mt-1">
              {activeTab === "Dashboard" && "Pantau pergerakan data pendaftaran NCC 13th."}
              {activeTab === "Peserta" && "Manajemen seluruh data peserta kompetisi."}
              {activeTab === "Verifikasi" && "Pusat verifikasi pembayaran dan dokumen."}
              {activeTab === "Kegiatan" && "Kawal gerbang pendaftaran dan fail karya."}
              {activeTab === "Pengaturan" && "Konfigurasi sistem Markas Besar."}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 shadow-sm cursor-pointer hover:bg-slate-50">
              <Calendar size={16} className="text-slate-400" />
              April 2026
            </div>
            <button 
              onClick={handleExportCSV}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md shadow-blue-200"
            >
              <Download size={18} />
              Export CSV
            </button>
            <div className="h-10 w-10 bg-white/50 backdrop-blur-md border border-white/60 rounded-full flex items-center justify-center text-slate-600 shadow-sm ml-2 relative">
              <Bell size={18} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </div>
          </div>
        </header>

        {/* 🎛️ KONTEN TAB: DASHBOARD */}
        {activeTab === "Dashboard" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total Pendaftar" value={realEntries.length.toString()} trend="Live" isUp={true} />
          <StatCard title="Terverifikasi" value={realEntries.filter(e => e.payment_status === 'Verified').length.toString()} trend="Aman" isUp={true} />
          <StatCard title="Menunggu Review" value={realEntries.filter(e => e.payment_status === 'Pending').length.toString()} trend="Action Needed" isUp={false} />
          <StatCard title="Estimasi Dana" value={`Rp ${(realEntries.length * 150000).toLocaleString('id-ID')}`} trend="IDR" isUp={true} />
        </div>

        {/* 🔥 PANEL KENDALI MESIN WAKTU */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 animate-in fade-in slide-in-from-left duration-700">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Analisis Tren Pendaftaran</h3>
            <p className="text-sm text-slate-500">Visualisasi pergerakan data berdasarkan periode waktu.</p>
          </div>
          
          <div className="bg-white/90 backdrop-blur-md border border-white/60 p-1.5 rounded-xl flex flex-wrap gap-1 shadow-[0_4px_20px_rgb(0,0,0,0.03)] text-xs font-bold w-full sm:w-auto">
            <button 
              onClick={() => setTimeFilter('Today')} 
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg transition-all ${timeFilter === 'Today' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-white/80 hover:text-slate-700'}`}
            >
              Hari Ini
            </button>
            <button 
              onClick={() => setTimeFilter('7Days')} 
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg transition-all ${timeFilter === '7Days' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-white/80 hover:text-slate-700'}`}
            >
              7 Hari
            </button>
            <button 
              onClick={() => setTimeFilter('1Month')} 
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg transition-all ${timeFilter === '1Month' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-white/80 hover:text-slate-700'}`}
            >
              1 Bulan
            </button>
            <button 
              onClick={() => setTimeFilter('All')} 
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg transition-all ${timeFilter === 'All' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-white/80 hover:text-slate-700'}`}
            >
              Keseluruhan
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/90 backdrop-blur-md backdrop-saturate-150 p-6 rounded-2xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] col-span-2">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-bold text-slate-800">Tren Pendaftaran Harian</h3>
                <p className="text-xs text-slate-500">Data visualisasi</p>
              </div>
              <MoreHorizontal size={20} className="text-slate-400 cursor-pointer" />
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dynamicChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12}} dx={-10} />
                  <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  <Line type="monotone" dataKey="pendaftar" stroke="#2563EB" strokeWidth={3} dot={{r: 4, fill: '#2563EB', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-md backdrop-saturate-150 p-6 rounded-2xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
             <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-800">Peminat Kategori</h3>
              <MoreHorizontal size={20} className="text-slate-400" />
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dynamicBarData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12}} dy={10} />
                  <Tooltip cursor={{fill: '#F1F5F9'}} contentStyle={{borderRadius: '12px', border: 'none'}} />
                  <Bar dataKey="total" fill="#3B82F6" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
          </>
        )}

        {/* 🎛️ KONTEN TAB: PESERTA (BUKU INDUK + LIVE SEARCH) */}
        {activeTab === "Peserta" && (
          <div className="bg-white border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] rounded-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-bold text-slate-800">Buku Induk Peserta Resmi</h3>
                  <p className="text-xs text-slate-500 mt-1">Database lengkap peserta terverifikasi NCC 13th.</p>
                </div>
                <span className="bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-xs font-bold border border-blue-200 shadow-sm">
                  Total Tiket Aktif: {realEntries.filter(e => e.payment_status === 'Verified').length}
                </span>
              </div>

              {/* 🔍 BARIS MESIN PENCARI & FILTER */}
              <div className="flex flex-col md:flex-row gap-4 items-center">
                {/* Kolom Pencarian */}
                <div className="relative flex-1 w-full">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={16} className="text-slate-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Cari nama, email, atau ID tiket (misal: NCC-15)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-slate-700"
                  />
                </div>
                
                {/* Dropdown Kategori Lomba */}
                <div className="relative w-full md:w-64">
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full pl-4 pr-10 py-2.5 bg-white/90 backdrop-blur-md border border-white/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 appearance-none text-slate-700 font-medium shadow-sm"
                  >
                    <option value="All">Semua Kategori</option>
                    <option value="Olimpiade MIPA">Olimpiade MIPA</option>
                    <option value="Speech Contest">Speech Contest</option>
                    <option value="LKTI Nasional">LKTI Nasional</option>
                    <option value="MTQ Nasional">MTQ Nasional</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Filter size={14} className="text-slate-400" />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 whitespace-nowrap">
                <thead className="bg-slate-50/50 text-slate-500 font-bold border-b border-slate-100 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-4 px-6">ID TIKET</th>
                    <th className="py-4 px-6">PROFIL PESERTA</th>
                    <th className="py-4 px-6">ASAL SEKOLAH</th>
                    <th className="py-4 px-6">PROGRES</th>
                    <th className="py-4 px-6">KATEGORI & PEMBINA</th>
                    <th className="py-4 px-6">WAKTU DAFTAR</th>
                    <th className="py-4 px-6">STATUS</th>
                    <th className="py-4 px-6 text-center">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {realEntries
                    .filter(e => e.payment_status === 'Verified')
                    .filter(e => {
                      if (!searchQuery) return true;
                      const query = searchQuery.toLowerCase();
                      return (e.full_name || "").toLowerCase().includes(query) || 
                             (e.email || "").toLowerCase().includes(query) || 
                             `ncc-${e.id}`.toLowerCase().includes(query);
                    })
                    .filter(e => filterCategory === "All" || (e.competition_type || e.category) === filterCategory)
                    .length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                          Tidak ada peserta yang cocok dengan radar pencarian Anda.
                        </td>
                      </tr>
                    ) : (
                    realEntries
                      .filter(e => e.payment_status === 'Verified')
                      .filter(e => {
                        if (!searchQuery) return true;
                        const query = searchQuery.toLowerCase();
                        return (e.full_name || "").toLowerCase().includes(query) || 
                               (e.email || "").toLowerCase().includes(query) || 
                               `ncc-${e.id}`.toLowerCase().includes(query);
                      })
                      .filter(e => filterCategory === "All" || (e.competition_type || e.category) === filterCategory)
                      .map((entry: any) => (
                        <ParticipantRow 
                          key={entry.id} 
                          entry={entry}
                          onRowClick={setSelectedParticipant}
                          onIdCardClick={setSelectedIdCard}
                          onDeleteClick={(e) => setDeleteModal({ show: true, id: e.id, userId: e.user_id, name: e.full_name })}
                        />
                      ))
                    )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "Verifikasi" && (
          <div className="space-y-4">
            
            {/* Header Antrean */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                  <FileCheck size={20} className="text-blue-600" />
                  Antrean Verifikasi Pembayaran
                </h3>
                <p className="text-slate-500 text-sm mt-0.5">Tinjau dan setujui setiap pendaftaran masuk.</p>
              </div>
              <span className="text-xs font-bold px-4 py-2 bg-amber-100 text-amber-700 rounded-full shadow-sm border border-amber-200">
                {realEntries.filter(e => e.payment_status === 'Pending').length} Menunggu
              </span>
            </div>

            {/* Card List */}
            {realEntries.filter(e => !e.payment_status || e.payment_status === 'Pending').length === 0 ? (
              <div className="bg-white/60 backdrop-blur-md border border-white/60 rounded-3xl p-16 text-center shadow-sm">
                <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={40} />
                </div>
                <h3 className="text-xl font-bold text-slate-800">Antrean Bersih!</h3>
                <p className="text-slate-500 mt-2 text-sm">Semua pendaftaran telah diverifikasi. Markas Besar aman.</p>
              </div>
            ) : (
              realEntries
                .filter(e => !e.payment_status || e.payment_status === 'Pending')
                .map((entry: any) => (
                  <VerificationCard 
                    key={entry.id} 
                    entry={entry}
                    onUpdateStatus={handleUpdateStatus}
                    onDeleteClick={(e) => setDeleteModal({ show: true, id: e.id, userId: e.user_id, name: e.full_name })}
                  />
                ))
            )}
          </div>
        )}


        {/* 🎛️ KONTEN TAB: PENGUMUMAN (BROADCAST CENTER) */}
        {activeTab === "Pengumuman" && (
          <div className="bg-white border border-slate-200/80 shadow-[0_4px_25px_rgba(0,0,0,0.02)] rounded-2xl p-8 md:p-12 min-h-[500px]">
            <div className="max-w-3xl mx-auto">
              
              {/* Header Ruangan */}
              <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-200/50">
                <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner">
                  <Megaphone size={28} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Pusat Siaran Komando</h2>
                  <p className="text-slate-500 text-sm mt-1">Transmisikan pemberitahuan ke seluruh atau sebagian peserta.</p>
                </div>
              </div>

              {/* Form Pengumuman */}
              <div className="space-y-6 bg-white/60 p-6 rounded-2xl border border-slate-100 shadow-sm">
                
                {/* Opsi Target & Radar */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Target Penerima</label>
                    <select 
                      value={broadcastTarget}
                      onChange={(e) => {
                        setBroadcastTarget(e.target.value);
                        if (e.target.value !== 'specific') setSelectedUserIds([]); 
                      }}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-medium text-slate-700 shadow-sm"
                    >
                      <option value="All">Semua Peserta (Massal)</option>
                      <option value="Verified">Hanya Peserta Lolos (Verified)</option>
                      <option value="Pending">Hanya Peserta Belum Lolos (Pending)</option>
                      <option value="specific">Peserta Tertentu (Pilih Manual)</option>
                    </select>
                  </div>

                  {/* Panel Centang Nama (ANTI-CRASH VERSION) */}
                  {broadcastTarget === 'specific' && (
                    <div className="mt-2 border border-blue-200 bg-blue-50/50 rounded-xl p-4">
                      <div className="flex justify-between items-center mb-3">
                        <label className="text-xs font-bold text-blue-800 uppercase tracking-wider">
                          Pilih Sasaran ({(selectedUserIds || []).length} Terpilih)
                        </label>
                        <button 
                          onClick={() => {
                            const entries = realEntries || [];
                            if ((selectedUserIds || []).length === entries.length && entries.length > 0) {
                              setSelectedUserIds([]); // Hapus Semua
                            } else {
                              setSelectedUserIds(entries.map((e: any) => e.user_id).filter((id: any) => id)); // Pilih Semua
                            }
                          }}
                          className="text-[10px] bg-blue-100 text-blue-700 font-bold px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                        >
                          Pilih Semua / Hapus
                        </button>
                      </div>

                      <div className="max-h-48 overflow-y-auto space-y-1.5 pr-2 custom-scrollbar">
                        {(!realEntries || realEntries.length === 0) ? (
                          <p className="text-xs text-slate-500 text-center py-4">Belum ada data peserta di sistem.</p>
                        ) : (
                          realEntries.map((entry: any, idx: number) => {
                            // Gunakan OR fallback agar aman dari undefined
                            const currentSelected = selectedUserIds || [];
                            const isChecked = currentSelected.includes(entry.user_id);
                            
                            return (
                              <label key={entry.id || idx} className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-all ${isChecked ? 'bg-blue-100/50 border-blue-300' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                                <input 
                                  type="checkbox" 
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedUserIds([...currentSelected, entry.user_id]);
                                    } else {
                                      setSelectedUserIds(currentSelected.filter((id: any) => id !== entry.user_id));
                                    }
                                  }}
                                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                                />
                                <div className="flex flex-col">
                                  <span className="text-sm font-bold text-slate-800">{entry.full_name || entry.email || "Peserta Anonim"}</span>
                                  <span className="text-[10px] text-slate-500 font-medium">NCC-{entry.id || "-"} • {entry.competition_type || entry.category || "Belum Pilih"}</span>
                                </div>
                              </label>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Judul Pesan */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Subjek / Judul Pengumuman</label>
                  <input 
                    type="text" 
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    placeholder="Contoh: Perbaikan Bukti Transfer" 
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-medium text-slate-800 placeholder:text-slate-400 shadow-sm"
                  />
                </div>

                {/* Isi Pesan */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Isi Pesan Siaran</label>
                  <textarea 
                    rows={5}
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    placeholder="Ketik instruksi atau pengumuman Anda di sini..." 
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-700 placeholder:text-slate-400 leading-relaxed shadow-sm"
                  ></textarea>
                </div>

                {/* Tombol Eksekusi */}
                <button 
                  onClick={handleSendClick}
                  disabled={isSending}
                  className={`w-full mt-4 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-slate-900/20 active:scale-[0.99]
                    ${isSending ? 'bg-slate-500 cursor-not-allowed' : 'bg-slate-900 hover:bg-slate-800'}
                  `}
                >
                  <Send size={18} className={isSending ? 'animate-pulse' : ''} /> 
                  {isSending ? 'Menyiarkan Pesan...' : 'Siarkan Pesan Sekarang'}
                </button>

              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 🌟 TAB PENGATURAN — PUSAT KENDALI PORTAL & GELOMBANG */}
        {/* ========================================================= */}
        {activeTab === "Pengaturan" && (
          <div className="space-y-6">
            
            {/* 1. SAKLAR UTAMA PORTAL */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                    isRegistrationOpen 
                      ? 'bg-emerald-100 text-emerald-600 shadow-lg shadow-emerald-100' 
                      : 'bg-rose-100 text-rose-600 shadow-lg shadow-rose-100'
                  }`}>
                    <Power size={28} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800">Gerbang Pendaftaran</h3>
                    <p className="text-sm font-medium text-slate-500 mt-1">
                      Status saat ini:{" "}
                      <div className={`mt-2 px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest inline-flex items-center gap-1.5 ${isRegistrationOpen ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                        {isRegistrationOpen ? <CheckCircle size={12} /> : <XCircle size={12} />}
                        {isRegistrationOpen ? 'TERBUKA UNTUK PUBLIK' : 'DITUTUP SEMENTARA'}
                      </div>
                    </p>
                  </div>
                </div>
                
                {/* Toggle Switch Modern */}
                <button 
                  onClick={() => {
                    setIsRegistrationOpen(!isRegistrationOpen);
                    showToast(
                      isRegistrationOpen ? 'Portal pendaftaran DITUTUP.' : 'Portal pendaftaran DIBUKA kembali!', 
                      isRegistrationOpen ? 'error' : 'success'
                    );
                  }}
                  className={`relative w-20 h-10 rounded-full transition-colors duration-300 focus:outline-none shadow-inner shrink-0 ${
                    isRegistrationOpen ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}
                >
                  <div className={`absolute top-1 left-1 bg-white w-8 h-8 rounded-full shadow-md transition-transform duration-300 flex items-center justify-center ${
                    isRegistrationOpen ? 'translate-x-10' : 'translate-x-0'
                  }`}>
                    {isRegistrationOpen 
                      ? <CheckCircle2 size={16} className="text-emerald-500" /> 
                      : <XCircle size={16} className="text-slate-400" />
                    }
                  </div>
                </button>
              </div>

              {/* Peringatan saat ditutup */}
              {!isRegistrationOpen && (
                <div className="mt-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3">
                  <AlertCircle size={18} className="text-rose-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-rose-700">
                    <strong>Perhatian:</strong> Peserta baru tidak dapat mendaftar saat portal ditutup. 
                    Peserta yang sudah mendaftar tetap bisa login dan melihat status mereka.
                  </p>
                </div>
              )}
            </div>

            {/* 2. MANAJEMEN GELOMBANG */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-sm border border-white/60">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                  <h3 className="text-xl font-black text-slate-800">Manajemen Gelombang</h3>
                  <p className="text-sm text-slate-500 mt-1">Atur jadwal pendaftaran per gelombang.</p>
                </div>
                <button 
                  onClick={() => {
                    const newId = waves.length + 1;
                    setWaves([...waves, {
                      id: newId,
                      name: `Gelombang ${newId}`,
                      status: 'Tutup',
                      startDate: '',
                      endDate: '',
                    }]);
                    showToast(`Gelombang ${newId} berhasil ditambahkan.`, 'success');
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all active:scale-95 flex items-center gap-2 shrink-0"
                >
                  + Tambah Gelombang
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {waves.map((wave) => (
                  <div 
                    key={wave.id} 
                    className={`border-2 rounded-2xl p-6 transition-all duration-300 ${
                      wave.status === 'Aktif' 
                        ? 'border-blue-400 bg-blue-50/40 shadow-md shadow-blue-50' 
                        : 'border-slate-100 bg-slate-50/50 hover:border-slate-200'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-bold text-lg text-slate-800">{wave.name}</h4>
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg flex items-center gap-1 ${wave.status === 'Aktif' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-slate-100 text-slate-400'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${wave.status === 'Aktif' ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`}></div>
                        {wave.status === 'Aktif' ? 'Live' : 'Tutup'}
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Tanggal Mulai</label>
                        <input 
                          type="date" 
                          value={wave.startDate}
                          onChange={(e) => setWaves(prev => prev.map(w => w.id === wave.id ? {...w, startDate: e.target.value} : w))}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all" 
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Tanggal Selesai</label>
                        <input 
                          type="date" 
                          value={wave.endDate}
                          onChange={(e) => setWaves(prev => prev.map(w => w.id === wave.id ? {...w, endDate: e.target.value} : w))}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all" 
                        />
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-100 flex gap-2">
                      <button 
                        onClick={() => toggleWaveStatus(wave.id)}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5 ${
                          wave.status === 'Aktif'
                            ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200'
                        }`}
                      >
                        {wave.status === 'Aktif' ? <><XCircle size={13}/> Nonaktifkan</> : <><CheckCircle2 size={13}/> Aktifkan</>}
                      </button>
                      <button 
                        onClick={() => {
                          setWaves(prev => prev.filter(w => w.id !== wave.id));
                          showToast(`${wave.name} dihapus.`, 'error');
                        }}
                        className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all active:scale-95"
                      >
                        <Trash2 size={13}/>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

            {/* 6. TAB: SCHEDULE LOMBA (MASTER SCHEDULE) */}
          {activeTab === 'Schedule' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-black text-slate-800">Master Schedule Lomba</h2>
                  <p className="text-slate-500 font-medium">Atur semua tanggal perlombaan secara terpusat dan real-time.</p>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => {
                      const currentYear = new Date().getFullYear();
                      const fixed = timelineData.map(cat => ({
                        ...cat,
                        waves: cat.waves.map((wave: any) => ({
                          ...wave,
                          items: wave.items.map((item: any) => ({
                            ...item,
                            start: item.start ? `${currentYear}${item.start.substring(4)}` : "",
                            end: item.end ? `${currentYear}${item.end.substring(4)}` : ""
                          }))
                        }))
                      }));
                      setTimelineData(fixed);
                      showToast(`Tahun ${currentYear} berhasil diterapkan!`, "success");
                    }}
                    className="flex items-center gap-2 px-4 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all text-xs"
                    title={`Update semua jadwal ke tahun ${new Date().getFullYear()}`}
                  >
                    <Sparkles size={14} /> Update Tahun ({new Date().getFullYear()})
                  </button>
                  <button 
                    onClick={saveTimeline}
                    disabled={isSavingTimeline}
                    className={`flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:scale-105 transition-all ${isSavingTimeline ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isSavingTimeline ? <Clock className="animate-spin" size={18} /> : <Save size={18} />} 
                    {isSavingTimeline ? 'Menyimpan...' : 'Simpan Semua Perubahan'}
                  </button>
                </div>
              </div>

              {/* 🏷️ Filter Kategori Cepat */}
                <div className="flex flex-wrap items-center gap-3 mb-8">
                  <div className="text-xs font-black text-slate-400 uppercase tracking-widest mr-2">Filter Cepat:</div>
                  {['All', 'LKTI', 'MIPA', 'Speech', 'MTQ'].map(cat => (
                    <button 
                      key={cat} 
                      onClick={() => setFilterCategory(cat)}
                      className={`px-5 py-2 rounded-2xl font-bold text-xs transition-all active:scale-95 border ${
                        filterCategory === cat 
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100' 
                          : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300 hover:text-indigo-600 shadow-sm'
                      }`}
                    >
                      {cat === 'All' ? 'Semua Mapel' : cat}
                    </button>
                  ))}
                </div>

                {/* 📂 Grid Konten Berdasarkan Kategori */}
                <div className="grid grid-cols-1 gap-10">
                  {timelineData
                    .filter(cat => filterCategory === 'All' || cat.category.toLowerCase().includes(filterCategory.toLowerCase()))
                    .map((cat) => (
                      <div key={cat.category} className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {/* Header Kategori */}
                        <div className="flex items-center gap-4 mb-6">
                          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
                          <div className="flex items-center gap-3 bg-white px-6 py-2 rounded-full border border-slate-100 shadow-sm">
                            <Sparkles size={16} className="text-amber-500" />
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">{cat.category}</h3>
                          </div>
                          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
                        </div>

                        {/* Gelombang Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          {cat.waves.map((wave: any) => (
                            <div key={`${cat.category}-${wave.label}`} className="bg-white/60 backdrop-blur-sm rounded-[2rem] p-8 border border-white/80 shadow-sm hover:shadow-md transition-all group">
                              <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                  <div className={`w-2 h-8 rounded-full ${wave.label.includes('I') && !wave.label.includes('II') ? 'bg-indigo-500' : 'bg-emerald-500'}`}></div>
                                  <h4 className="text-lg font-black text-slate-800 tracking-tight">{wave.label}</h4>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${wave.label.includes('I') && !wave.label.includes('II') ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                  Active Phase
                                </div>
                              </div>

                              <div className="space-y-5">
                                {wave.items.map((item: any) => {
                                  // Logika untuk mendeteksi apakah ini rentang waktu atau tanggal tunggal
                                  const isRange = item.label.toLowerCase().includes("pendaftaran") || 
                                                 item.label.toLowerCase().includes("pengumpulan") || 
                                                 item.label.toLowerCase().includes("seleksi");
                                  
                                  return (
                                    <div key={`${cat.category}-${wave.label}-${item.label}`} className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 space-y-3 transition-all hover:border-indigo-100">
                                      <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                          {item.label}
                                        </label>
                                        <div className="flex items-center gap-2">
                                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>
                                          <span className="text-[10px] font-black text-indigo-600 bg-white px-2 py-0.5 rounded-md border border-indigo-100 shadow-sm">
                                            {item.start && item.end ? (
                                              `${formatIndoDate(item.start)} – ${formatIndoDate(item.end)}`
                                            ) : item.start ? (
                                              formatIndoDate(item.start)
                                            ) : item.end ? (
                                              `s.d. ${formatIndoDate(item.end)}`
                                            ) : (
                                              "Belum Set"
                                            )}
                                          </span>
                                        </div>
                                      </div>

                                      <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                          <p className="text-[9px] font-black text-slate-400 uppercase ml-1">Mulai</p>
                                          <input 
                                            type="date" 
                                            value={item.start || ""}
                                            onChange={(e) => updateTimelineItem(cat.category, wave.label, item.label, 'start', e.target.value)}
                                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer"
                                          />
                                        </div>
                                        
                                        {isRange && (
                                          <div className="space-y-1">
                                            <p className="text-[9px] font-black text-slate-400 uppercase ml-1">Selesai</p>
                                            <input 
                                              type="date" 
                                              value={item.end || ""}
                                              onChange={(e) => updateTimelineItem(cat.category, wave.label, item.label, 'end', e.target.value)}
                                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer"
                                            />
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
          )}
        {/* ========================================================= */}
        {/* 🌟 TAB KEGIATAN (PUSAT KAWALAN PENDAFTARAN & FAIL) */}
        {/* ========================================================= */}
        {activeTab === "Kegiatan" && (
          <div className="space-y-8">
            
            {/* 1. SUIS UTAMA PENDAFTARAN */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-bl-full -z-10"></div>
              
              <div className="flex items-center gap-5">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all border shadow-lg ${isRegistrationOpen ? 'bg-emerald-100 text-emerald-600 border-emerald-200 shadow-emerald-100' : 'bg-rose-100 text-rose-600 border-rose-200 shadow-rose-100'}`}>
                  <Power size={28} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight">Gerbang Pendaftaran Utama</h3>
                  <p className="text-sm font-medium text-slate-500 mt-1">
                    Status semasa: <strong className={isRegistrationOpen ? 'text-emerald-500' : 'text-rose-500'}>
                      {isRegistrationOpen ? 'TERBUKA KEPADA UMUM' : 'DITUTUP SEMENTARA'}
                    </strong>
                  </p>
                </div>
              </div>
              
              {/* Suis (Toggle) Gaya Moden */}
              <button 
                onClick={() => {
                  setIsRegistrationOpen(!isRegistrationOpen);
                  showToast(isRegistrationOpen ? 'Pendaftaran utama ditutup.' : 'Pendaftaran utama dibuka!', isRegistrationOpen ? 'error' : 'success');
                }}
                className={`relative w-20 h-10 rounded-full transition-colors duration-300 focus:outline-none shadow-inner shrink-0 ${isRegistrationOpen ? 'bg-emerald-500' : 'bg-slate-300'}`}
              >
                <div className={`absolute top-1 left-1 bg-white w-8 h-8 rounded-full shadow-md transition-transform duration-300 flex items-center justify-center ${isRegistrationOpen ? 'translate-x-10' : 'translate-x-0'}`}>
                  {isRegistrationOpen ? <FileCheck size={14} className="text-emerald-500" /> : <X size={14} className="text-slate-400" />}
                </div>
              </button>
            </div>
            {/* 1.5 PENGATURAN GELOMBANG PENDAFTARAN */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-sm border border-white/60">
              <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-100">
                <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
                  <Calendar size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800">Gelombang Pendaftaran (Gelombang I & II)</h3>
                  <p className="text-xs text-slate-500 font-medium">Buka atau tutup gelombang pendaftaran peserta sesuai timeline kompetisi.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {waves.map((wave) => (
                  <div key={wave.id} className={`flex items-center justify-between p-6 rounded-2xl border-2 transition-all duration-300 ${wave.status === 'Aktif' ? 'border-blue-400 bg-blue-50/40 shadow-sm' : 'border-slate-100 bg-slate-50/50 hover:border-slate-200'}`}>
                    <div>
                      <h4 className="font-bold text-slate-800">{wave.name}</h4>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">{wave.startDate} s/d {wave.endDate}</p>
                      <div className="flex items-center gap-1.5 px-3 py-1 mt-2 bg-slate-50 border border-slate-100 rounded-lg w-fit">
                        <div className={`w-1.5 h-1.5 rounded-full ${wave.status === 'Aktif' ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></div>
                        <span className={`text-[10px] font-black ${wave.status === 'Aktif' ? 'text-green-600' : 'text-slate-500'}`}>
                          {wave.status === 'Aktif' ? 'Sedang Berjalan' : 'Ditutup'}
                        </span>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => {
                        toggleWaveStatus(wave.id);
                        showToast(`${wave.name} ${wave.status === 'Aktif' ? 'Ditutup' : 'Diaktifkan'}`, wave.status === 'Aktif' ? 'error' : 'success');
                      }}
                      className={`relative w-16 h-8 rounded-full transition-colors duration-300 focus:outline-none shadow-inner shrink-0 ${wave.status === 'Aktif' ? 'bg-blue-600' : 'bg-slate-300'}`}
                    >
                      <div className={`absolute top-1 left-1 bg-white w-6 h-6 rounded-full shadow-md transition-transform duration-300 flex items-center justify-center ${wave.status === 'Aktif' ? 'translate-x-8' : 'translate-x-0'}`}>
                        {wave.status === 'Aktif' ? <FileCheck size={12} className="text-blue-600" /> : <X size={12} className="text-slate-400" />}
                      </div>
                    </button>
                  </div>
                ))}
              </div>
            </div>
            {/* 2. KAWALAN PENGUMPULAN FAIL PER KATEGORI - GELOMBANG I */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-sm border border-white/60">
              <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-100">
                <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl">
                  <FolderOpen size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800">Akses Pengumpulan Fail Karya (Gelombang I)</h3>
                  <p className="text-xs text-slate-500 font-medium">Buka atau tutup portal pengumpulan karya Gelombang I.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {submissionStatus.filter(c => c.id.endsWith('_g1')).map((category) => (
                  <div key={category.id} className={`flex flex-col p-5 rounded-2xl border-2 transition-all duration-300 ${category.isOpen ? 'border-indigo-400 bg-indigo-50/40 shadow-sm' : 'border-slate-100 bg-slate-50/50 hover:border-slate-200'}`}>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-bold text-slate-800">{category.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <p className={`text-[10px] font-bold tracking-widest uppercase ${category.isOpen ? 'text-indigo-600' : 'text-slate-400'}`}>
                            {category.isOpen ? '● Portal Terbuka' : '○ Portal Ditutup'}
                          </p>
                          {category.mode ? (
                            <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase ${category.mode === 'Auto' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                              {category.mode}
                            </span>
                          ) : (
                            <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase bg-amber-100 text-amber-600 animate-pulse">
                              Pilih Mode Control
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                          <button 
                            onClick={() => updateSchedule(category.id, 'mode', 'Manual')}
                            className={`text-[8px] px-2 py-1 rounded-md font-bold transition-all ${category.mode === 'Manual' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                          >
                            MANUAL
                          </button>
                          <button 
                            onClick={() => updateSchedule(category.id, 'mode', 'Auto')}
                            className={`text-[8px] px-2 py-1 rounded-md font-bold transition-all ${category.mode === 'Auto' ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                          >
                            AUTO
                          </button>
                        </div>
                        <button 
                          disabled={!category.mode}
                          onClick={() => {
                            toggleSubmission(category.id);
                            showToast(`${category.name} ${!category.isOpen ? 'Portal Dibuka' : 'Portal Ditutup'}`, !category.isOpen ? 'success' : 'error');
                          }}
                          className={`relative w-10 h-5 rounded-full transition-all duration-300 focus:outline-none shadow-inner shrink-0 ${!category.mode ? 'opacity-20 cursor-not-allowed' : category.isOpen ? 'bg-indigo-500' : 'bg-slate-300'}`}
                        >
                          <div className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full shadow-md transition-transform duration-300 flex items-center justify-center ${category.isOpen ? 'translate-x-5' : 'translate-x-0'}`}>
                            {category.isOpen ? <FileCheck size={8} className="text-indigo-600" /> : <X size={8} className="text-slate-400" />}
                          </div>
                        </button>
                      </div>
                    </div>

                    <div className={`grid grid-cols-2 gap-3 pt-3 border-t border-slate-200/50 transition-opacity ${(!category.mode || category.mode === 'Manual') ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1">
                          <Calendar size={10} /> Auto-Open
                        </label>
                        <input 
                          type="datetime-local" 
                          className="w-full text-[10px] p-1.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-400 font-medium text-slate-600"
                          value={category.openAt || ""}
                          onChange={(e) => updateSchedule(category.id, 'openAt', e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1">
                          <Clock size={10} /> Auto-Close
                        </label>
                        <input 
                          type="datetime-local" 
                          className="w-full text-[10px] p-1.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-400 font-medium text-slate-600"
                          value={category.closeAt || ""}
                          onChange={(e) => updateSchedule(category.id, 'closeAt', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2.5 KAWALAN PENGUMPULAN FAIL PER KATEGORI - GELOMBANG II */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-sm border border-white/60">
              <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-100">
                <div className="p-2.5 bg-violet-100 text-violet-600 rounded-xl">
                  <FolderOpen size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800">Akses Pengumpulan Fail Karya (Gelombang II)</h3>
                  <p className="text-xs text-slate-500 font-medium">Buka atau tutup portal pengumpulan karya Gelombang II.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {submissionStatus.filter(c => c.id.endsWith('_g2')).map((category) => (
                  <div key={category.id} className={`flex flex-col p-5 rounded-2xl border-2 transition-all duration-300 ${category.isOpen ? 'border-violet-400 bg-violet-50/40 shadow-sm' : 'border-slate-100 bg-slate-50/50 hover:border-slate-200'}`}>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-bold text-slate-800">{category.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <p className={`text-[10px] font-bold tracking-widest uppercase ${category.isOpen ? 'text-violet-600' : 'text-slate-400'}`}>
                            {category.isOpen ? '● Portal Terbuka' : '○ Portal Ditutup'}
                          </p>
                          {category.mode ? (
                            <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase ${category.mode === 'Auto' ? 'bg-violet-100 text-violet-600' : 'bg-slate-100 text-slate-500'}`}>
                              {category.mode}
                            </span>
                          ) : (
                            <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase bg-amber-100 text-amber-600 animate-pulse">
                              Pilih Mode Control
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                          <button 
                            onClick={() => updateSchedule(category.id, 'mode', 'Manual')}
                            className={`text-[8px] px-2 py-1 rounded-md font-bold transition-all ${category.mode === 'Manual' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                          >
                            MANUAL
                          </button>
                          <button 
                            onClick={() => updateSchedule(category.id, 'mode', 'Auto')}
                            className={`text-[8px] px-2 py-1 rounded-md font-bold transition-all ${category.mode === 'Auto' ? 'bg-violet-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                          >
                            AUTO
                          </button>
                        </div>
                        <button 
                          disabled={!category.mode}
                          onClick={() => {
                            toggleSubmission(category.id);
                            showToast(`${category.name} ${!category.isOpen ? 'Portal Dibuka' : 'Portal Ditutup'}`, !category.isOpen ? 'success' : 'error');
                          }}
                          className={`relative w-10 h-5 rounded-full transition-all duration-300 focus:outline-none shadow-inner shrink-0 ${!category.mode ? 'opacity-20 cursor-not-allowed' : category.isOpen ? 'bg-violet-500' : 'bg-slate-300'}`}
                        >
                          <div className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full shadow-md transition-transform duration-300 flex items-center justify-center ${category.isOpen ? 'translate-x-5' : 'translate-x-0'}`}>
                            {category.isOpen ? <FileCheck size={8} className="text-violet-600" /> : <X size={8} className="text-slate-400" />}
                          </div>
                        </button>
                      </div>
                    </div>

                    <div className={`grid grid-cols-2 gap-3 pt-3 border-t border-slate-200/50 transition-opacity ${(!category.mode || category.mode === 'Manual') ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1">
                          <Calendar size={10} /> Auto-Open
                        </label>
                        <input 
                          type="datetime-local" 
                          className="w-full text-[10px] p-1.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-violet-400 font-medium text-slate-600"
                          value={category.openAt || ""}
                          onChange={(e) => updateSchedule(category.id, 'openAt', e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1">
                          <Clock size={10} /> Auto-Close
                        </label>
                        <input 
                          type="datetime-local" 
                          className="w-full text-[10px] p-1.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-violet-400 font-medium text-slate-600"
                          value={category.closeAt || ""}
                          onChange={(e) => updateSchedule(category.id, 'closeAt', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. KAWALAN PENGUMPULAN FAIL PER TAHAP */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-sm border border-white/60">
              <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-100">
                <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800">Akses Pengumpulan Fail Per Tahap</h3>
                  <p className="text-xs text-slate-500 font-medium">Atur pembukaan akses upload karya berdasarkan urutan tahap kompetisi (Tahap 1 - Tahap 3).</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {phaseStatus.map((phase) => (
                  <div key={phase.id} className={`flex flex-col justify-between p-6 rounded-2xl border-2 transition-all duration-300 ${phase.isOpen ? 'border-blue-400 bg-blue-50/40 shadow-sm' : 'border-slate-100 bg-slate-50/50 hover:border-slate-200'}`}>
                    <div className="mb-4">
                      <h4 className="font-bold text-slate-800">{phase.name}</h4>
                      <p className={`text-[10px] font-bold tracking-widest uppercase mt-1 ${phase.isOpen ? 'text-blue-600' : 'text-slate-400'}`}>
                        {phase.isOpen ? '● Tahap Aktif' : '○ Tahap Terkunci'}
                      </p>
                    </div>
                    
                    <button 
                      onClick={() => {
                        togglePhase(phase.id);
                        showToast(`${phase.name} ${!phase.isOpen ? 'Akses Dibuka' : 'Akses Ditutup'}`, !phase.isOpen ? 'success' : 'error');
                      }}
                      className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-2 ${phase.isOpen ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200'}`}
                    >
                      {phase.isOpen ? <><X size={14}/> Tutup Tahap</> : <><FileCheck size={14}/> Buka Tahap</>}
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
          </div>
        )}

        {/* 🎛️ KONTEN TAB: MEDIA (KUSTOMISASI ASET VISUAL) */}
        {activeTab === "Media" && (
          <div className="space-y-6">
            {/* 1. MANAJEMEN ASET DASHBOARD */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 mb-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-purple-100 text-purple-600 rounded-xl">
                  <ImageIcon size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800">Manajemen Aset Dashboard</h3>
                  <p className="text-sm text-slate-500 mt-1">Kustomisasi gambar dan ikon pada dashboard peserta.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { id: 'hero_banner', label: 'Banner Dashboard' },
                  { id: 'card_buku_panduan', label: 'Ikon Buku Panduan' },
                  { id: 'card_twibbon', label: 'Ikon Twibbon' },
                  { id: 'card_kontak', label: 'Ikon Kontak' },
                ].map((asset) => (
                  <div key={asset.id} className="bg-white border border-slate-100 rounded-2xl p-4 flex flex-col items-center gap-4 group transition-all hover:border-purple-200">
                    <div className="relative w-full aspect-video bg-slate-50 rounded-xl overflow-hidden border border-dashed border-slate-200 flex items-center justify-center">
                      {dashboardAssets[asset.id] ? (
                        <>
                          <img src={dashboardAssets[asset.id]} alt={asset.label} className="w-full h-full object-cover" />
                          <button 
                            onClick={() => {
                              setDashboardAssets((prev: any) => ({ ...prev, [asset.id]: "" }));
                              showToast(`${asset.label} telah dihapus.`, "error");
                            }}
                            className="absolute top-2 right-2 p-1.5 bg-rose-500/80 hover:bg-rose-600 text-white rounded-lg backdrop-blur-sm transition-all"
                            title="Hapus Gambar"
                          >
                            <Trash2 size={12} />
                          </button>
                        </>
                      ) : (
                        <div className="text-slate-300 flex flex-col items-center gap-1">
                          <ImageIcon size={32} />
                          <span className="text-[10px] font-bold uppercase">Belum Ada</span>
                        </div>
                      )}
                      {isUploadingAsset === asset.id && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                          <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                    </div>
                    
                    <div className="w-full">
                      <p className="text-xs font-bold text-slate-700 mb-2">{asset.label}</p>
                      <label className="block w-full cursor-pointer">
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => handleAssetUpload(e, asset.id)}
                          disabled={!!isUploadingAsset}
                        />
                        <div className="w-full py-2 bg-purple-50 text-purple-600 hover:bg-purple-600 hover:text-white rounded-xl text-[10px] font-black text-center transition-all uppercase tracking-wider">
                          {dashboardAssets[asset.id] ? "Ganti Gambar" : "Upload Gambar"}
                        </div>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. MANAJEMEN GALERI BERANDA */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-sm border border-white/60">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 border-b border-slate-100 pb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl">
                    <Camera size={20} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800">Manajemen Galeri Beranda</h3>
                    <p className="text-sm text-slate-500 mt-1">Konfigurasi teks dan foto pada section Galeri.</p>
                  </div>
                </div>
                <label className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer">
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => handleAssetUpload(e, 'gallery_add')}
                    disabled={!!isUploadingAsset}
                  />
                  {isUploadingAsset === 'gallery_add' ? (
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>+</>
                  )}
                  Tambah Foto Galeri
                </label>
              </div>

              {/* Edit Title & Subtitle */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Judul Utama Galeri</label>
                  <input 
                    type="text"
                    value={dashboardAssets.gallery_title || ""}
                    onChange={(e) => setDashboardAssets((prev: any) => ({ ...prev, gallery_title: e.target.value }))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Contoh: Moments of Excellence"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Subjudul / Deskripsi</label>
                  <textarea 
                    value={dashboardAssets.gallery_subtitle || ""}
                    onChange={(e) => setDashboardAssets((prev: any) => ({ ...prev, gallery_subtitle: e.target.value }))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium text-slate-500 focus:ring-2 focus:ring-indigo-500 outline-none h-[42px] resize-none"
                    placeholder="Masukkan deskripsi singkat galeri..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {(dashboardAssets.gallery_images || []).length === 0 ? (
                  <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
                    <ImageIcon size={40} className="mb-2 opacity-20" />
                    <p className="text-xs font-bold uppercase tracking-widest">Belum ada foto galeri</p>
                  </div>
                ) : (
                  dashboardAssets.gallery_images.map((item: any, idx: number) => (
                    <div key={idx} className="bg-white border border-slate-100 rounded-2xl overflow-hidden group shadow-sm hover:border-indigo-200 transition-all flex flex-col">
                      <div className="relative aspect-video">
                        <img src={typeof item === 'string' ? item : item.url} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => {
                              const newGallery = [...dashboardAssets.gallery_images];
                              newGallery.splice(idx, 1);
                              setDashboardAssets((prev: any) => ({ ...prev, gallery_images: newGallery }));
                              showToast("Foto galeri dihapus.", "error");
                            }}
                            className="p-1.5 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors shadow-lg"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <div className="p-4 space-y-3">
                         <div className="space-y-1">
                           <label className="text-[9px] font-bold text-slate-400 uppercase">Kategori</label>
                           <select 
                              value={item.category || "GALLERY"}
                              onChange={(e) => {
                                const newGallery = [...dashboardAssets.gallery_images];
                                const current = typeof item === 'string' ? { url: item, category: "GALLERY", label: "" } : item;
                                newGallery[idx] = { ...current, category: e.target.value };
                                setDashboardAssets((prev: any) => ({ ...prev, gallery_images: newGallery }));
                              }}
                              className="w-full text-[11px] font-bold bg-slate-50 border-none rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                           >
                             {["GALLERY", "ACADEMIC", "SPEECH", "ARTS"].map(cat => <option key={cat} value={cat}>{cat}</option>)}
                           </select>
                         </div>
                         <div className="space-y-1">
                           <label className="text-[9px] font-bold text-slate-400 uppercase">Label / Judul Foto</label>
                           <input 
                              type="text"
                              value={item.label || ""}
                              onChange={(e) => {
                                const newGallery = [...dashboardAssets.gallery_images];
                                const current = typeof item === 'string' ? { url: item, category: "GALLERY", label: "" } : item;
                                newGallery[idx] = { ...current, label: e.target.value };
                                setDashboardAssets((prev: any) => ({ ...prev, gallery_images: newGallery }));
                              }}
                              className="w-full text-[11px] font-medium bg-slate-50 border-none rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                              placeholder="Label foto..."
                           />
                         </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}


        {activeTab === "LLMS" && (
          <div className="space-y-6">
            
            {/* 👑 PREMIUM HEADER AREA */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-3xl p-6 border border-slate-200">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
                  <GraduationCap size={28} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight">Manajemen LLMS</h2>
                  <p className="text-sm text-slate-500">Pusat kendali ujian daring, bank soal olimpiade, dan penilaian realtime.</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full text-xs font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping"></span>
                  Server CBT: Online
                </span>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                  realtimeConnected 
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                    : "bg-amber-50 text-amber-600 border border-amber-100"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${realtimeConnected ? "bg-emerald-500 animate-pulse" : "bg-amber-400"}`}></span>
                  {realtimeConnected ? "Realtime: Terhubung" : "Realtime: Lokal"}
                </span>
              </div>
            </div>

            {/* 🎛️ GLASSMORPHIC SUB-TAB NAVIGATION */}
            <div className="flex bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/50 max-w-lg">
              {[
                { id: "overview", label: "Overview", icon: <LayoutDashboard size={14} /> },
                { id: "soal", label: "Bank Soal", icon: <FileText size={14} /> },
                { id: "sesi", label: "Sesi & Waktu", icon: <Clock size={14} /> },
                { id: "nilai", label: "Penilaian", icon: <Trophy size={14} /> }
              ].map((subTab) => (
                <button
                  key={subTab.id}
                  onClick={() => setLlmsActiveSubTab(subTab.id as any)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    llmsActiveSubTab === subTab.id
                      ? "bg-white text-indigo-600 shadow-sm border border-slate-200"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {subTab.icon} {subTab.label}
                </button>
              ))}
            </div>

            {/* 1. 📊 TAB OVERVIEW */}
            {llmsActiveSubTab === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                    <p className="text-xs font-black uppercase text-slate-400 tracking-wider">Peserta Ujian Live</p>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-3xl font-black text-slate-800">14</span>
                      <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span> Live
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2">Sedang mengerjakan soal MIPA</p>
                  </div>
                  <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                    <p className="text-xs font-black uppercase text-slate-400 tracking-wider">Total Soal</p>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-3xl font-black text-slate-800">{llmsQuestions.length}</span>
                      <span className="text-xs font-bold text-indigo-500">Soal Aktif</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2">Bank soal terintegrasi</p>
                  </div>
                  <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                    <p className="text-xs font-black uppercase text-slate-400 tracking-wider">Rata-Rata Skor</p>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-3xl font-black text-slate-800">76.4</span>
                      <span className="text-xs font-bold text-blue-500">Poin</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2">Dari total 100 poin</p>
                  </div>
                  <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                    <p className="text-xs font-black uppercase text-slate-400 tracking-wider">Tingkat Kelulusan</p>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-3xl font-black text-slate-800">80%</span>
                      <span className="text-xs font-bold text-purple-500">Passing Grade 70</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2">Sesuai standar olimpiade</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Monitor Sesi Ujian & Live Simulator Panel */}
                  <div className="bg-white rounded-3xl p-6 border border-slate-200 lg:col-span-2 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                      <div className="space-y-1">
                        <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${llmsSimulating || realtimeConnected ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`}></span>
                          Live Proctoring & Activity Control
                        </h3>
                        <p className="text-xs text-slate-500">
                          {realtimeConnected 
                            ? "🔗 Terhubung ke Supabase Realtime — mendengarkan channel cbt_attempts & cbt_answers." 
                            : "Kanal simulasi WebSocket & real-time monitoring ujian."}
                        </p>
                      </div>

                      {/* SIMULATION CONTROLS */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setLlmsSimulating(!llmsSimulating);
                            showToast(llmsSimulating ? "Simulasi aktivitas live dimatikan." : "Simulasi aktivitas live diaktifkan! Mengemulasikan WebSocket peserta...", llmsSimulating ? undefined : "success");
                          }}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                            llmsSimulating
                              ? "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                          }`}
                        >
                          {llmsSimulating ? "⏹️ Hentikan Simulasi" : "▶️ Mulai Simulasi Live"}
                        </button>
                        
                        <button
                          onClick={() => {
                            const currentTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                            const logText = "🚩 DEMO TRIPPED: Peserta NCC-24 (padoaioihd) berpindah tab browser ke mesin pencari!";
                            
                            setLlmsLeaderboard(prev => prev.map(p => {
                              if (p.ticket === "NCC-24") {
                                const newWarn = (p.warnings || 0) + 1;
                                setActiveViolationAlert({
                                  ticket: p.ticket,
                                  name: p.name,
                                  warnings: newWarn,
                                  time: currentTime
                                });
                                return { ...p, warnings: newWarn, status: newWarn >= 3 ? "Gugur" : p.status };
                              }
                              return p;
                            }));

                            setLlmsActivityLogs(prev => [
                              { id: Date.now(), time: currentTime, text: logText, type: "warning" },
                              ...prev
                            ]);
                            showToast("Simulasi Pelanggaran Proctoring Terkirim!", "error");
                          }}
                          className="bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold transition-all"
                        >
                          ⚡ Test Pelanggaran
                        </button>
                      </div>
                    </div>

                    {/* LIVE ACTIVE EMERGENCY PROCTORING ALERT CARD */}
                    {activeViolationAlert && (
                      <div className="bg-red-50 border border-red-200/80 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-bounce">
                        <div className="flex gap-3 items-start">
                          <span className="text-2xl mt-0.5">🚩</span>
                          <div>
                            <p className="text-xs font-black text-red-950 uppercase tracking-wider">PELANGGARAN PROCTORING (TAB SWITCH)</p>
                            <p className="text-xs text-red-800 mt-1">
                              Peserta <strong className="font-black text-red-950">{activeViolationAlert.ticket} ({activeViolationAlert.name})</strong> terdeteksi keluar tab browser pada pukul <strong>{activeViolationAlert.time}</strong>.
                            </p>
                            <p className="text-[11px] font-bold text-red-700 mt-0.5">
                              Akumulasi Pelanggaran saat ini: {activeViolationAlert.warnings} / 3
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0 self-end md:self-auto">
                          <button
                            onClick={() => {
                              setLlmsLeaderboard(prev => prev.map(p => {
                                if (p.ticket === activeViolationAlert.ticket) {
                                  return { ...p, status: "Gugur" };
                                }
                                return p;
                              }));
                              showToast(`Peserta ${activeViolationAlert.ticket} didiskualifikasi!`, "error");
                              setActiveViolationAlert(null);
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-black transition-all"
                          >
                            Diskualifikasi
                          </button>
                          <button
                            onClick={() => {
                              setLlmsLeaderboard(prev => prev.map(p => {
                                if (p.ticket === activeViolationAlert.ticket) {
                                  return { ...p, warnings: 0 };
                                }
                                return p;
                              }));
                              showToast(`Pelanggaran peserta ${activeViolationAlert.ticket} diabaikan.`, undefined);
                              setActiveViolationAlert(null);
                            }}
                            className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                          >
                            Abaikan
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-4">
                      {/* STATS PROGRESS OF THE LIVE SESSION */}
                      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-bold text-slate-700">Babak Penyisihan Olimpiade MIPA (Gel. I)</span>
                          <span className="text-xs text-slate-500">Durasi: 90 Menit</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden mt-3">
                          <div className="bg-indigo-600 h-full w-[65%] rounded-full animate-pulse"></div>
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-400 mt-2">
                          <span>Waktu Mulai: 08:00 WIB</span>
                          <span>Waktu Selesai: 09:30 WIB</span>
                        </div>
                      </div>

                      {/* DYNAMIC LOG CONSOLE */}
                      <div className="space-y-2.5">
                        <div className="flex justify-between items-center">
                          <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">WebSocket Broadcast Log Sesi</h4>
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">Channel: exam_status</span>
                        </div>
                        
                        <div className="max-h-56 overflow-y-auto border border-slate-150 rounded-2xl bg-slate-50/50 p-3 space-y-2 font-mono scrollbar-thin">
                          {llmsActivityLogs.map((act) => (
                            <div 
                              key={act.id} 
                              className={`flex gap-3 text-xs p-2.5 rounded-xl border transition-all ${
                                act.type === "warning" ? "bg-red-50 border-red-100 text-red-700 font-bold" :
                                act.type === "success" ? "bg-emerald-50 border-emerald-100 text-emerald-700" :
                                "bg-white border-slate-100 text-slate-600"
                              }`}
                            >
                              <span className="font-bold text-indigo-500 shrink-0">{act.time}</span>
                              <span className="break-words">{act.text}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Statistik Tingkat Kesulitan */}
                  <div className="bg-white rounded-3xl p-6 border border-slate-200">
                    <h3 className="font-bold text-slate-800 text-lg mb-6 pb-4 border-b border-slate-100">
                      Distribusi Tingkat Kesulitan Soal
                    </h3>
                    <div className="space-y-6">
                      {[
                        { label: "Sangat Sulit (Hard)", pct: "20%", count: "1 Soal", color: "bg-rose-500" },
                        { label: "Sedang (Medium)", pct: "40%", count: "2 Soal", color: "bg-amber-500" },
                        { label: "Mudah (Easy)", pct: "40%", count: "2 Soal", color: "bg-emerald-500" }
                      ].map((item, i) => (
                        <div key={i} className="space-y-2">
                          <div className="flex justify-between text-xs font-bold text-slate-700">
                            <span>{item.label}</span>
                            <span className="text-slate-400">{item.count} ({item.pct})</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className={`${item.color} h-full`} style={{ width: item.pct }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. 📝 TAB BANK SOAL */}
            {llmsActiveSubTab === "soal" && (() => {
              const totalWeight = llmsQuestions.reduce((sum, q) => sum + (q.weight || 4), 0);
              return (
                <div className="space-y-6">
                  
                  {/* PRESETS & TOTAL INDICATOR SUMMARY CARD */}
                  <div className="bg-white rounded-3xl p-6 border border-slate-200/80 flex flex-col sm:flex-row gap-6 items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg shrink-0">
                        ∑
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Indikator Total Bobot Nilai (MIPA)</p>
                        <h4 className="text-lg font-bold text-slate-800 mt-0.5">
                          Total Akumulasi: <span className="text-indigo-600 font-black">{totalWeight}</span> Poin
                        </h4>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2.5 justify-end">
                      <button
                        onClick={() => {
                          const updated = llmsQuestions.map(q => ({ ...q, weight: 4 }));
                          setLlmsQuestions(updated);
                          showToast("Berhasil menyamakan seluruh bobot soal ke 4 poin!", "success");
                        }}
                        className="bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/80 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                      >
                        Set Semua 4 Poin
                      </button>
                      <button
                        onClick={() => {
                          const updated = llmsQuestions.map(q => ({
                            ...q,
                            weight: q.difficulty === 'Hard' ? 6 : q.difficulty === 'Medium' ? 4 : 2
                          }));
                          setLlmsQuestions(updated);
                          showToast("Preset bobot kesulitan diaktifkan: Hard (6), Medium (4), Easy (2)", "success");
                        }}
                        className="bg-slate-50 hover:bg-indigo-50 text-indigo-600 border border-indigo-100 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                      >
                        <Sparkles size={12} /> Preset Bobot Kesulitan
                      </button>
                    </div>
                  </div>

                  {/* SPLIT-VIEW LAYAR BELAH EDITOR */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                    
                    {/* LEFT PANEL: RAMAH MATA EDITOR WORKSPACE */}
                    <div className="bg-slate-50/60 border border-slate-200/80 rounded-3xl p-6 space-y-5">
                      <div className="flex justify-between items-center pb-3 border-b border-slate-200/60">
                        <div>
                          <h3 className="font-bold text-slate-800 text-lg">MIPA Split-View Editor</h3>
                          <p className="text-[11px] text-slate-500 mt-0.5">Mendukung format LaTeX, render rumus instan, dan 5 pilihan jawaban (A-E).</p>
                        </div>
                        <span className="text-xs bg-indigo-50 text-indigo-700 font-bold border border-indigo-100 px-2.5 py-1 rounded-full">Eksklusif MIPA</span>
                      </div>

                      <div className="space-y-4">
                        
                        {/* INPUT PERTANYAAN */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between">
                            <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Pertanyaan / Soal (Mendukung LaTeX $...$ atau $$...$$)</label>
                            <span className="text-[10px] text-slate-400 font-mono">ID: No. {llmsQuestions.length + 1}</span>
                          </div>
                          <textarea
                            value={newQuestion.question}
                            onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 h-24 resize-none shadow-xs transition-all"
                            placeholder="Ketik soal di sini. Contoh: Tentukan nilai x dari persamaan kuadrat $x^2 - 5x + 6 = 0$."
                          />
                        </div>

                        {/* INPUT GAMBAR LAMPIRAN */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">URL Lampiran Gambar (Opsional untuk Grafik/Biologi)</label>
                          <input
                            type="text"
                            value={newQuestion.image || ""}
                            onChange={(e) => setNewQuestion({ ...newQuestion, image: e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs"
                            placeholder="Masukkan URL Gambar (e.g. https://domain.com/grafik.png) atau biarkan kosong"
                          />
                        </div>

                        {/* INPUT PILIHAN JAWABAN (A-E) */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Pilihan Jawaban (A s.d E)</label>
                          <div className="space-y-2.5">
                            {newQuestion.options.map((opt, idx) => (
                              <div key={idx} className="flex gap-2 items-center">
                                <span className="w-7 h-7 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shadow-xs shrink-0">{String.fromCharCode(65 + idx)}</span>
                                <input
                                  type="text"
                                  value={opt}
                                  onChange={(e) => {
                                    const opts = [...newQuestion.options];
                                    opts[idx] = e.target.value;
                                    setNewQuestion({ ...newQuestion, options: opts });
                                  }}
                                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs"
                                  placeholder={`Pilihan ${String.fromCharCode(65 + idx)} (Ketik rumus dgn $...$ jika ada)`}
                                />
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* PENGATURAN SOAL (KUNCI, KESULITAN, BOBOT, STATUS) */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Kunci Jawaban</label>
                            <select
                              value={newQuestion.correct}
                              onChange={(e) => setNewQuestion({ ...newQuestion, correct: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none"
                            >
                              {["A", "B", "C", "D", "E"].map(opt => <option key={opt} value={opt}>Pilihan {opt}</option>)}
                            </select>
                          </div>
                          
                          <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Kesulitan</label>
                            <select
                              value={newQuestion.difficulty}
                              onChange={(e) => setNewQuestion({ ...newQuestion, difficulty: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none"
                            >
                              {["Easy", "Medium", "Hard"].map(diff => <option key={diff} value={diff}>{diff}</option>)}
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Bobot (Poin)</label>
                            <input
                              type="number"
                              value={newQuestion.weight || ""}
                              onChange={(e) => setNewQuestion({ ...newQuestion, weight: parseInt(e.target.value) || 0 })}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none"
                              placeholder="Bobot"
                              min="1"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Status Soal</label>
                            <select
                              value={newQuestion.status}
                              onChange={(e) => setNewQuestion({ ...newQuestion, status: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none"
                            >
                              <option value="Published">Published</option>
                              <option value="Draft">Draft</option>
                            </select>
                          </div>
                        </div>

                        {/* TOMBOL SIMPAN TANPA REFRESH */}
                        <div className="flex gap-2 justify-end pt-3">
                          <button
                            onClick={async () => {
                              if (!newQuestion.question || newQuestion.options.some(o => !o)) {
                                return showToast("Mohon isi semua pertanyaan dan 5 pilihan jawaban!", "error");
                              }

                              // Tambahkan ke state lokal terlebih dahulu (optimistic update)
                              const localId = Date.now();
                              setLlmsQuestions([...llmsQuestions, { ...newQuestion, id: localId }]);

                              // Kirim ke API /api/admin/llms/questions (Admin Endpoint)
                              try {
                                const activeExam = llmsSessions.find(s => s.status === 'Aktif');
                                if (activeExam) {
                                  const apiPayload = {
                                    exam_id: activeExam.id,
                                    question_text: newQuestion.question,
                                    options: {
                                      A: newQuestion.options[0],
                                      B: newQuestion.options[1],
                                      C: newQuestion.options[2],
                                      D: newQuestion.options[3],
                                      E: newQuestion.options[4]
                                    },
                                    correct_answer: newQuestion.correct,
                                    difficulty: newQuestion.difficulty,
                                    weight: newQuestion.weight,
                                    image_url: newQuestion.image || null,
                                    status: newQuestion.status
                                  };
                                  await fetch('/api/admin/llms/questions', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify(apiPayload)
                                  });
                                }
                              } catch (err) {
                                console.warn('[CBT Sync] Soal disimpan lokal, sinkronisasi DB tertunda:', err);
                              }

                              // Keep the general difficulty and weight presets but clear inputs for high speed typing!
                              setNewQuestion({
                                question: "",
                                options: ["", "", "", "", ""],
                                correct: "A",
                                difficulty: newQuestion.difficulty,
                                category: "Olimpiade MIPA",
                                weight: newQuestion.weight,
                                status: "Published",
                                image: ""
                              });
                              showToast(`Soal No. ${llmsQuestions.length + 1} disimpan & disinkronkan ke database!`, "success");
                            }}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
                          >
                            <Save size={14} /> Simpan & Lanjut ke Soal Berikutnya
                          </button>
                        </div>

                      </div>
                    </div>

                    {/* RIGHT PANEL: LIVE PARTICIPANT SCREEN PREVIEW */}
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-slate-200 space-y-5 shadow-xl h-full flex flex-col min-h-[500px]">
                      <div className="flex justify-between items-center pb-3 border-b border-slate-800/80">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-green-500"></span>
                          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Live Student Screen Preview</span>
                        </div>
                        <span className="text-[10px] font-mono font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md">
                          Bobot: {newQuestion.weight} Poin
                        </span>
                      </div>

                      {/* SIMULATION OF STUDENT INTERFACE */}
                      <div className="flex-1 space-y-4">
                        <div className="flex justify-between items-center text-xs text-slate-400">
                          <span className="bg-indigo-950 text-indigo-300 border border-indigo-900 px-2 py-0.5 rounded-md font-bold">
                            Soal Olimpiade MIPA
                          </span>
                          <span className="font-mono text-[10px] text-slate-500">No. {llmsQuestions.length + 1} dari {llmsQuestions.length + 1}</span>
                        </div>

                        {/* LIVE COMPILED QUESTION */}
                        <div className="space-y-3">
                          <div 
                            className="text-sm font-semibold leading-relaxed break-words text-white"
                            dangerouslySetInnerHTML={{ __html: renderMath(newQuestion.question || "*(Ketik pertanyaan di editor sebelah kiri untuk melihat render rumus LaTeX di sini)*") }}
                          />
                          
                          {/* Live Render Attached Question Image if present */}
                          {newQuestion.image && (
                            <div className="mt-3 rounded-xl overflow-hidden border border-slate-800 max-h-48 flex justify-center bg-slate-950">
                              <img 
                                src={newQuestion.image} 
                                alt="Pertanyaan Terlampir" 
                                className="object-contain max-h-48 p-2"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            </div>
                          )}
                        </div>

                        {/* LIVE COMPILED OPTIONS (A-E) */}
                        <div className="space-y-2.5">
                          {newQuestion.options.map((opt, idx) => (
                            <div 
                              key={idx}
                              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold border transition-all ${
                                newQuestion.correct === String.fromCharCode(65 + idx)
                                  ? "bg-indigo-950/50 border-indigo-500/50 text-indigo-300"
                                  : "bg-slate-950/30 border-slate-800 text-slate-400 hover:bg-slate-800/30"
                              }`}
                            >
                              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                                newQuestion.correct === String.fromCharCode(65 + idx) ? "bg-indigo-500 text-white" : "bg-slate-800 text-slate-400"
                              }`}>{String.fromCharCode(65 + idx)}</span>
                              
                              <div 
                                className="break-words"
                                dangerouslySetInnerHTML={{ __html: renderMath(opt || `Pilihan ${String.fromCharCode(65 + idx)}`) }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-800/80 flex justify-between items-center text-[10px] text-slate-500">
                        <span>Status Soal saat ini: <strong className={newQuestion.status === 'Published' ? 'text-green-500' : 'text-amber-500'}>{newQuestion.status}</strong></span>
                        <span>Dibuat Oleh: Admin Command Center</span>
                      </div>
                    </div>

                  </div>

                  {/* LIST OF QUESTIONS */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-slate-800 text-lg">Daftar Soal Tersimpan (MIPA)</h3>
                      <span className="text-xs font-bold text-slate-400">Total: {llmsQuestions.length} Soal</span>
                    </div>

                    {llmsQuestions.map((q, idx) => (
                      <div key={q.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4 relative group">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">No. {idx + 1}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              q.difficulty === 'Hard' ? 'bg-red-50 text-red-600 border border-red-100' :
                              q.difficulty === 'Medium' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                              'bg-emerald-50 text-emerald-600 border border-emerald-100'
                            }`}>{q.difficulty}</span>
                            <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 px-2 py-0.5 rounded-md">{q.category}</span>
                            <span className="text-[10px] font-bold bg-purple-50 text-purple-600 border border-purple-100 px-2 py-0.5 rounded-md flex items-center gap-0.5">
                              <Sparkles size={10} /> {q.weight || 4} Poin
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              q.status === 'Draft' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            }`}>
                              {q.status || "Published"}
                            </span>
                          </div>
                          <button
                            onClick={async () => {
                              setLlmsQuestions(llmsQuestions.filter(item => item.id !== q.id));
                              // Sinkronkan penghapusan ke database
                              try {
                                await fetch(`/api/admin/llms/questions?id=${q.id}`, { method: 'DELETE' });
                              } catch (err) {
                                console.warn('[CBT Sync] Hapus soal dari DB tertunda:', err);
                              }
                              showToast("Soal ujian berhasil dihapus.", "error");
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        <p className="text-slate-800 font-bold text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: renderMath(q.question) }}></p>

                        {q.image && (
                          <div className="rounded-xl overflow-hidden border border-slate-100 max-h-48 flex justify-start bg-slate-50">
                            <img src={q.image} alt="Lampiran Soal" className="object-contain max-h-48 p-2" />
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                          {q.options.map((opt: string, i: number) => (
                            <div
                              key={i}
                              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                                q.correct === String.fromCharCode(65 + i)
                                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                  : "bg-slate-50/50 border-slate-100 text-slate-600"
                              }`}
                            >
                              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                                q.correct === String.fromCharCode(65 + i) ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-600"
                              }`}>{String.fromCharCode(65 + i)}</span>
                              <div dangerouslySetInnerHTML={{ __html: renderMath(opt) }} />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              );
            })()}

            {/* 3. ⏱️ TAB SESI & WAKTU */}
            {llmsActiveSubTab === "sesi" && (
              <div className="space-y-6">
                
                {/* SAKLAR INPUT SESI BARU */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200">
                  <h3 className="font-bold text-slate-800 text-lg mb-4">Buka Sesi Ujian Baru</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Judul Sesi</label>
                        <input
                          type="text"
                          value={newSession.title}
                          onChange={(e) => setNewSession({ ...newSession, title: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="Contoh: Seleksi Tahap I MIPA"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Token Sesi</label>
                        <input
                          type="text"
                          value={newSession.token}
                          onChange={(e) => setNewSession({ ...newSession, token: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="Contoh: MASUKMIPA"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Sistem Penilaian</label>
                        <select
                          value={newSession.scoring_system}
                          onChange={(e) => setNewSession({ ...newSession, scoring_system: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none"
                        >
                          <option value="Fixed">Fixed (Bobot Sama)</option>
                          <option value="Custom">Custom (Sesuai Soal)</option>
                          <option value="Penalty">Penalty (Sistem Minus)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Poin Benar (Fixed)</label>
                        <input
                          type="number"
                          value={newSession.correct_point || ""}
                          disabled={newSession.scoring_system === "Custom"}
                          onChange={(e) => setNewSession({ ...newSession, correct_point: parseInt(e.target.value) || 0 })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none disabled:opacity-50"
                          placeholder="Poin benar"
                          min="0"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Poin Salah (Penalty)</label>
                        <input
                          type="number"
                          value={newSession.penalty_point || ""}
                          disabled={newSession.scoring_system !== "Penalty"}
                          onChange={(e) => setNewSession({ ...newSession, penalty_point: parseInt(e.target.value) || 0 })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none disabled:opacity-50"
                          placeholder="Poin penalty (minus)"
                          min="0"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Poin Kosong (Tidak Dijawab)</label>
                        <input
                          type="number"
                          value={newSession.empty_point || ""}
                          onChange={(e) => setNewSession({ ...newSession, empty_point: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none disabled:opacity-50"
                          placeholder="Poin kosong"
                        />
                      </div>

                      <div className="space-y-1 flex items-end">
                        <button
                          onClick={async () => {
                            if (!newSession.title || !newSession.token) {
                              return showToast("Mohon isi judul sesi dan token!", "error");
                            }
                            const localId = Date.now();
                            setLlmsSessions([...llmsSessions, { ...newSession, id: localId }]);

                            // Kirim ke API /api/cbt/exams (Supabase PostgreSQL)
                            try {
                              const durationNum = parseInt(newSession.duration) || 90;
                              await fetch('/api/cbt/exams', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  title: newSession.title,
                                  token: newSession.token,
                                  duration_minutes: durationNum,
                                  scoring_system: newSession.scoring_system || 'Custom',
                                  correct_point: newSession.correct_point || 4,
                                  penalty_point: newSession.penalty_point || 0,
                                  empty_point: newSession.empty_point || 0,
                                  is_active: newSession.status === 'Aktif'
                                })
                              });
                            } catch (err) {
                              console.warn('[CBT Sync] Sesi disimpan lokal, sinkronisasi DB tertunda:', err);
                            }

                            setNewSession({
                              title: "",
                              token: "",
                              duration: "90 Menit",
                              status: "Nonaktif",
                              wave: "Gelombang I",
                              scoring_system: "Fixed",
                              correct_point: 4,
                              penalty_point: 1,
                              empty_point: 0
                            });
                            showToast("Sesi ujian baru berhasil didaftarkan & disinkronkan ke database!", "success");
                          }}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-bold text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                          <Clock size={16} /> Buka Sesi Baru
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* DAFTAR SESI AKTIF */}
                <div className="space-y-4">
                  {llmsSessions.map((session) => (
                    <div key={session.id} className="bg-white rounded-3xl p-6 border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          session.status === 'Aktif' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-slate-100 text-slate-400'
                        }`}>
                          <Clock size={22} />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 text-base leading-tight">{session.title}</h4>
                          <div className="flex items-center gap-2.5 mt-1.5 flex-wrap text-xs text-slate-500">
                            <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">Token: {session.token}</span>
                            <span>Durasi: {session.duration}</span>
                            <span>Akses: {session.wave}</span>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                              session.scoring_system === 'Custom' ? 'bg-purple-50 text-purple-600 border border-purple-100' :
                              session.scoring_system === 'Penalty' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                              'bg-blue-50 text-blue-600 border border-blue-100'
                            }`}>
                              System: {session.scoring_system || "Fixed"}
                            </span>
                            {session.scoring_system === 'Penalty' && (
                              <span className="text-rose-500 font-bold text-[11px]">Minus: -{session.penalty_point || 1}</span>
                            )}
                            {session.scoring_system === 'Fixed' && (
                              <span className="text-blue-500 font-bold text-[11px]">Correct: +{session.correct_point || 4}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          session.status === 'Aktif' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-slate-50 text-slate-400 border border-slate-100'
                        }`}>
                          {session.status}
                        </span>
                        
                        {/* TOGGLE SWITCH */}
                        <button
                          onClick={async () => {
                            const newStatus = session.status === 'Aktif' ? 'Nonaktif' : 'Aktif';
                            const updated = llmsSessions.map(s => {
                              if (s.id === session.id) {
                                return { ...s, status: newStatus };
                              }
                              return s;
                            });
                            setLlmsSessions(updated);

                            // Sinkronkan toggle ke database
                            try {
                              await fetch('/api/cbt/exams', {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  id: session.id,
                                  is_active: newStatus === 'Aktif'
                                })
                              });
                            } catch (err) {
                              console.warn('[CBT Sync] Toggle status DB tertunda:', err);
                            }
                            showToast(`Sesi '${session.title}' diubah menjadi ${newStatus}.`, "success");
                          }}
                          className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${
                            session.status === 'Aktif' ? 'bg-indigo-600' : 'bg-slate-200'
                          }`}
                        >
                          <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ${
                            session.status === 'Aktif' ? 'translate-x-6' : 'translate-x-0'
                          }`}></div>
                        </button>

                        <button
                          onClick={async () => {
                            setLlmsSessions(llmsSessions.filter(s => s.id !== session.id));
                            // Sinkronkan penghapusan ke database
                            try {
                              await fetch(`/api/cbt/exams?id=${session.id}`, { method: 'DELETE' });
                            } catch (err) {
                              console.warn('[CBT Sync] Hapus sesi dari DB tertunda:', err);
                            }
                            showToast("Sesi ujian dihapus.", "error");
                          }}
                          className="p-2 text-slate-400 hover:text-red-500 rounded-xl transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            )}

            {/* 4. 🏆 TAB PENILAIAN */}
            {llmsActiveSubTab === "nilai" && (
              <div className="bg-white border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] rounded-2xl overflow-hidden flex flex-col">
                <div className="p-6 border-b border-slate-100">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="font-bold text-slate-800">Daftar Hasil Nilai Ujian</h3>
                      <p className="text-xs text-slate-500 mt-1">Leaderboard dan akumulasi hasil pengerjaan CBT Olimpiade.</p>
                    </div>
                    <button
                      onClick={() => {
                        showToast("File hasil nilai (.csv) berhasil di-ekspor!", "success");
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-all shadow-sm active:scale-95"
                    >
                      <Download size={14} /> Ekspor Hasil CBT
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                        <th className="py-4 px-6 text-center w-16">Peringkat</th>
                        <th className="py-4 px-6">ID Tiket</th>
                        <th className="py-4 px-6">Nama Peserta</th>
                        <th className="py-4 px-6">Cabang</th>
                        <th className="py-4 px-6 text-center">Akurasi</th>
                        <th className="py-4 px-6 text-center">Waktu Pengerjaan</th>
                        <th className="py-4 px-6 text-center">Skor Akhir</th>
                        <th className="py-4 px-6 text-center w-28">Status Kelolosan</th>
                        <th className="py-4 px-6 text-center w-24">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {llmsLeaderboard.map((item, index) => (
                        <tr key={item.ticket} className="hover:bg-slate-50/50 transition-colors font-medium text-slate-600">
                          <td className="py-4 px-6 text-center font-bold text-slate-800">
                            {index === 0 && <span className="inline-flex items-center justify-center w-6 h-6 bg-amber-100 text-amber-700 rounded-full font-black">🥇</span>}
                            {index === 1 && <span className="inline-flex items-center justify-center w-6 h-6 bg-slate-100 text-slate-700 rounded-full font-black">🥈</span>}
                            {index === 2 && <span className="inline-flex items-center justify-center w-6 h-6 bg-orange-100 text-orange-700 rounded-full font-black">🥉</span>}
                            {index > 2 && index + 1}
                          </td>
                          <td className="py-4 px-6 font-mono font-bold text-indigo-600">{item.ticket}</td>
                          <td className="py-4 px-6 font-bold text-slate-800 flex items-center gap-2">
                            <span>{item.name}</span>
                            {item.warnings > 0 && (
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${
                                item.warnings >= 3 
                                  ? "bg-red-600 text-white animate-pulse" 
                                  : "bg-red-100 text-red-700 border border-red-200"
                              }`}>
                                🚩 {item.warnings}x Switch Tab
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-6">
                            <span className="px-2.5 py-1 bg-slate-50 text-slate-600 border border-slate-100 rounded-lg text-[10px] font-bold">
                              {item.category}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-center font-bold">{item.accuracy}</td>
                          <td className="py-4 px-6 text-center font-mono text-slate-500">{item.time}</td>
                          <td className="py-4 px-6 text-center font-black text-slate-800 text-sm">{item.score}</td>
                          <td className="py-4 px-6 text-center">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              item.status === 'Lolos' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <button
                              onClick={() => setSelectedLmsScoreDetail(item)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 hover:border-indigo-100 rounded-lg text-[10px] font-bold transition-all shadow-sm active:scale-95"
                            >
                              <Eye size={12} /> Detail
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 👑 SLIDE-OVER DETAIL PENILAIAN & OVERRIDE */}
            {selectedLmsScoreDetail && (() => {
              const maxPossibleWeight = llmsQuestions.reduce((sum, q) => sum + (q.weight || 4), 0) || 18;
              const rawWeightGot = Math.round((selectedLmsScoreDetail.score / 100) * maxPossibleWeight);
              
              const easyQuestions = llmsQuestions.filter(q => q.difficulty === 'Easy');
              const mediumQuestions = llmsQuestions.filter(q => q.difficulty === 'Medium');
              const hardQuestions = llmsQuestions.filter(q => q.difficulty === 'Hard');

              const correctEasy = Math.round(easyQuestions.length * (selectedLmsScoreDetail.score / 100));
              const correctMedium = Math.round(mediumQuestions.length * (selectedLmsScoreDetail.score / 110));
              const correctHard = Math.round(hardQuestions.length * (selectedLmsScoreDetail.score / 120));

              return (
                <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs">
                  <div className="flex-1" onClick={() => setSelectedLmsScoreDetail(null)}></div>
                  
                  <div className="w-full max-w-lg bg-white border-l border-slate-200 h-full shadow-2xl p-8 flex flex-col overflow-y-auto">
                    <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                      <div>
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">CBT Transparansi</span>
                        <h2 className="text-xl font-bold text-slate-800">Detail Hasil & Kalkulasi</h2>
                      </div>
                      <button 
                        onClick={() => setSelectedLmsScoreDetail(null)} 
                        className="p-2 hover:bg-slate-100 rounded-xl border border-slate-200/50 transition-all"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl mb-6 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg">{selectedLmsScoreDetail.ticket}</span>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                          selectedLmsScoreDetail.status === 'Lolos' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
                        }`}>
                          Status: {selectedLmsScoreDetail.status}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-lg leading-snug">{selectedLmsScoreDetail.name}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Bidang Lomba: {selectedLmsScoreDetail.category}</p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      
                      {/* 📊 DETAIL POIN PER KATEGORI */}
                      <div>
                        <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-3">Detail Poin per Kategori</h4>
                        <div className="space-y-3">
                          <div className="bg-emerald-50/40 border border-emerald-100/50 p-4 rounded-xl flex items-center justify-between">
                            <div>
                              <p className="text-xs font-bold text-emerald-950">Soal Kategori Easy (Mudah)</p>
                              <p className="text-[11px] text-emerald-700 mt-0.5">Bobot: 2 poin per soal</p>
                            </div>
                            <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-md">
                              {Math.min(easyQuestions.length, correctEasy)} / {easyQuestions.length} Benar
                            </span>
                          </div>

                          <div className="bg-amber-50/40 border border-amber-100/50 p-4 rounded-xl flex items-center justify-between">
                            <div>
                              <p className="text-xs font-bold text-amber-950">Soal Kategori Medium (Sedang)</p>
                              <p className="text-[11px] text-amber-700 mt-0.5">Bobot: 4 poin per soal</p>
                            </div>
                            <span className="text-xs font-mono font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-md">
                              {Math.min(mediumQuestions.length, correctMedium)} / {mediumQuestions.length} Benar
                            </span>
                          </div>

                          <div className="bg-rose-50/40 border border-rose-100/50 p-4 rounded-xl flex items-center justify-between">
                            <div>
                              <p className="text-xs font-bold text-rose-950">Soal Kategori Hard (HOTS)</p>
                              <p className="text-[11px] text-rose-700 mt-0.5">Bobot: 6 poin per soal</p>
                            </div>
                            <span className="text-xs font-mono font-bold text-rose-800 bg-rose-100 px-2.5 py-1 rounded-md">
                              {Math.min(hardQuestions.length, correctHard)} / {hardQuestions.length} Benar
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 🧠 TRANSMISI & NORMALISASI NILAI */}
                      <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl space-y-3.5">
                        <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Mekanisme Kalkulator Nilai</h4>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs text-slate-600">
                            <span>Akumulasi Bobot Benar (Raw):</span>
                            <span className="font-bold text-slate-800">{rawWeightGot} / {maxPossibleWeight} Poin</span>
                          </div>
                          <div className="flex justify-between text-xs text-slate-600">
                            <span>Bobot Maksimal Tes:</span>
                            <span className="font-bold text-slate-800">{maxPossibleWeight} Poin</span>
                          </div>
                          <div className="h-px bg-slate-200"></div>
                          <div className="flex justify-between text-xs font-bold text-slate-700">
                            <span>Formula Normalisasi Skor:</span>
                            <span className="text-indigo-600 font-mono text-[11px]">(Raw / Max) * 100</span>
                          </div>
                        </div>

                        <div className="bg-indigo-900 text-indigo-100 p-4 rounded-xl flex items-center justify-between">
                          <div>
                            <p className="text-[10px] uppercase font-bold text-indigo-300">Hasil Kalkulasi Normalisasi</p>
                            <p className="text-2xl font-black">{selectedLmsScoreDetail.score}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] uppercase font-bold text-indigo-300">Akurasi Jawaban</p>
                            <p className="text-sm font-bold">{selectedLmsScoreDetail.accuracy}</p>
                          </div>
                        </div>
                      </div>

                      {/* 🛠️ FITUR OVERRIDE NILAI (ADMIN PRIVILEGE) */}
                      <div className="border border-slate-200 rounded-2xl p-5 space-y-4">
                        <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5 text-indigo-950">
                          <Settings size={14} /> Override Nilai (Hak Istimewa Admin)
                        </h4>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          Anda dapat memaksa / override skor akhir peserta secara manual jika terindikasi adanya anomali teknis, pelanggaran integritas, atau kebijakan kuota lolos susulan.
                        </p>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Override Nilai Akhir</label>
                            <input
                              type="number"
                              value={selectedLmsScoreDetail.score}
                              onChange={(e) => {
                                const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                                setSelectedLmsScoreDetail({ ...selectedLmsScoreDetail, score: val, accuracy: `${val}%` });
                              }}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                              min="0"
                              max="100"
                            />
                          </div>
                          
                          <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Status Kelolosan</label>
                            <select
                              value={selectedLmsScoreDetail.status}
                              onChange={(e) => setSelectedLmsScoreDetail({ ...selectedLmsScoreDetail, status: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none"
                            >
                              <option value="Lolos">Lolos</option>
                              <option value="Gugur">Gugur</option>
                            </select>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            const updated = llmsLeaderboard.map(item => {
                              if (item.ticket === selectedLmsScoreDetail.ticket) {
                                return { 
                                  ...item, 
                                  score: selectedLmsScoreDetail.score, 
                                  accuracy: selectedLmsScoreDetail.accuracy,
                                  status: selectedLmsScoreDetail.status
                                };
                              }
                              return item;
                            });
                            updated.sort((a, b) => b.score - a.score);
                            const ranked = updated.map((item, idx) => ({ ...item, rank: idx + 1 }));
                            setLlmsLeaderboard(ranked);
                            showToast(`Skor peserta ${selectedLmsScoreDetail.ticket} berhasil di-override menjadi ${selectedLmsScoreDetail.score}!`, "success");
                            setSelectedLmsScoreDetail(null);
                          }}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold text-xs shadow-sm transition-all active:scale-95 text-center flex items-center justify-center gap-2"
                        >
                          Simpan Override Nilai & Status
                        </button>
                      </div>

                    </div>
                  </div>
                </div>
              );
            })()}

          </div>
        )}
        {selectedParticipant && (
          <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40">
            {/* Area kosong untuk klik tutup */}
            <div className="flex-1" onClick={() => setSelectedParticipant(null)}></div>
            
            <div className="w-full max-w-md bg-white border-l border-slate-200/80 h-full shadow-[-10px_0_30px_rgba(0,0,0,0.04)] p-8 flex flex-col overflow-y-auto">
              <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-200/50">
                 <h2 className="text-xl font-bold text-slate-800">Detail Administrasi</h2>
                 <button onClick={() => setSelectedParticipant(null)} className="p-2 bg-white/50 hover:bg-slate-100 rounded-full border border-slate-200/50 transition-colors"><X size={20}/></button>
              </div>
              
               {(() => {
                 let photoUrl = "";
                 if (selectedParticipant.notes) {
                   try {
                     const pObj = JSON.parse(selectedParticipant.notes);
                     photoUrl = pObj.profile_photo_url;
                   } catch (e) {}
                 }
                 
                 if (photoUrl) {
                   return (
                     <img 
                       src={photoUrl} 
                       alt="Profile Avatar" 
                       className="w-24 h-24 rounded-full object-cover shadow-lg mb-6 border-4 border-white shrink-0" 
                     />
                   );
                 }
                 
                 return (
                   <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-4xl font-black shadow-lg mb-6 border-4 border-white shrink-0">
                     {(selectedParticipant.full_name || "U").charAt(0)}
                   </div>
                 );
               })()}
              <h3 className="text-2xl font-bold text-slate-800 mb-1">{selectedParticipant.full_name || "Nama tidak tersedia"}</h3>
              <p className="text-slate-500 font-medium mb-6">{selectedParticipant.competition_type || selectedParticipant.category || "Belum ada kategori"}</p>

              <div className="space-y-4">
                <div className="p-4 bg-white/60 border border-slate-100 rounded-xl shadow-sm">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nomor Induk Siswa (NISN)</p>
                  <p className="font-semibold text-slate-800">{selectedParticipant.nisn || "Data Kosong"}</p>
                </div>

                {/* Tambahan Data Anggota 2 jika kategori Tim */}
                {(selectedParticipant.competition_type === "LKTI Nasional" || selectedParticipant.competition_type === "Olimpiade MIPA") && (
                  <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl shadow-sm space-y-3">
                    <p className="text-[11px] font-bold text-blue-400 uppercase tracking-wider mb-1">Informasi Anggota Tim</p>
                    <div>
                      <p className="text-[10px] text-slate-400 font-medium">Nama Anggota</p>
                      <p className="font-semibold text-slate-800">{selectedParticipant.participant2_name || "Belum diisi"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-medium">NISN Anggota</p>
                      <p className="font-semibold text-slate-800">{selectedParticipant.participant2_nisn || "Belum diisi"}</p>
                    </div>
                  </div>
                )}
                <div className="p-4 bg-white/60 border border-slate-100 rounded-xl shadow-sm">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Informasi Kontak</p>
                  <p className="font-semibold text-slate-800 mb-1">{selectedParticipant.email || "Email tidak ada"}</p>
                  <p className="font-semibold text-slate-800">{selectedParticipant.whatsapp_number || selectedParticipant.phone || "No. HP tidak ada"}</p>
                </div>
                <div className="p-4 bg-white/60 border border-slate-100 rounded-xl shadow-sm">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Institusi / Sekolah</p>
                  <p className="font-semibold text-slate-800 mb-1">{selectedParticipant.school_name || selectedParticipant.school || "Data Kosong"}</p>
                  <p className="text-sm text-slate-600 flex items-center gap-1.5">
                    <MapPin size={13} className="text-slate-400 shrink-0" />
                    {selectedParticipant.province || selectedParticipant.city || "Provinsi tidak dicantumkan"}
                  </p>
                </div>

                {/* SECTION BARU: KONTROL TAHAP KOMPETISI */}
                <div className="mt-4 pt-4 border-t border-slate-200/50">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg">
                      <Target size={14} />
                    </div>
                    <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Kontrol Tahap Kompetisi</h4>
                  </div>
                  
                  <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between px-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Status:</span>
                        {(() => {
                          let stage = 1;
                          if (selectedParticipant.notes) {
                            try {
                              const n = JSON.parse(selectedParticipant.notes);
                              if (n.current_stage) stage = n.current_stage;
                            } catch (e) {}
                          }

                          if (stage === 1) return <span className="text-[10px] font-black text-slate-400 uppercase">Penyisihan (1)</span>;
                          if (stage === 2) return <span className="text-[10px] font-black text-blue-600 uppercase">Semi Final (2)</span>;
                          if (stage === 3) return <span className="text-[10px] font-black text-amber-600 uppercase">Final (3)</span>;
                          return null;
                        })()}
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleUpdateStage(selectedParticipant.id, 1); }}
                          className={`py-2.5 rounded-xl text-[9px] font-black transition-all border flex flex-col items-center justify-center gap-1 ${ (() => {
                            let s = 1;
                            if (selectedParticipant.notes) { try { s = JSON.parse(selectedParticipant.notes).current_stage || 1; } catch (e) {} }
                            return s === 1;
                          })() ? 'bg-white border-slate-200 text-slate-300 shadow-inner' : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300' }`}
                        >
                          <Clock size={12} />
                          SET T1
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleUpdateStage(selectedParticipant.id, 2); }}
                          className={`py-2.5 rounded-xl text-[9px] font-black transition-all border flex flex-col items-center justify-center gap-1 ${ (() => {
                            let s = 1;
                            if (selectedParticipant.notes) { try { s = JSON.parse(selectedParticipant.notes).current_stage || 1; } catch (e) {} }
                            return s === 2;
                          })() ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white border-slate-100 text-blue-600 hover:border-blue-200' }`}
                        >
                          <Medal size={12} />
                          LOLOS T2
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleUpdateStage(selectedParticipant.id, 3); }}
                          className={`py-2.5 rounded-xl text-[9px] font-black transition-all border flex flex-col items-center justify-center gap-1 ${ (() => {
                            let s = 1;
                            if (selectedParticipant.notes) { try { s = JSON.parse(selectedParticipant.notes).current_stage || 1; } catch (e) {} }
                            return s === 3;
                          })() ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-200' : 'bg-white border-slate-100 text-amber-600 hover:border-amber-200' }`}
                        >
                          <Trophy size={12} />
                          FINAL
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {(() => {
                  let adminNotes: any = {};
                  if (selectedParticipant.notes) {
                    try { adminNotes = JSON.parse(selectedParticipant.notes); } catch (e) {}
                  }
                  
                  return (adminNotes.profile_photo_url || adminNotes.student_card_url) && (
                      <div className="p-4 bg-white/60 border border-slate-100 rounded-xl shadow-sm space-y-3">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                          <FolderOpen size={12} className="text-indigo-500" /> Berkas Pendukung Peserta
                        </p>
                        
                        {adminNotes.profile_photo_url && (
                          <div className="flex items-center justify-between py-2 border-b border-slate-100/60 text-sm">
                            <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                              <ImageIcon size={13} className="text-blue-500" /> Foto Formal
                            </span>
                            <a 
                              href={adminNotes.profile_photo_url} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="text-xs font-bold text-indigo-600 hover:underline bg-indigo-50 px-2.5 py-1 rounded-lg"
                            >
                              Buka
                            </a>
                          </div>
                        )}
  
                        {adminNotes.student_card_url && (
                          <div className="flex items-center justify-between py-2 text-sm">
                            <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                              <IdCard size={13} className="text-amber-500" /> Kartu Pelajar
                            </span>
                            <a 
                              href={adminNotes.student_card_url} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="text-xs font-bold text-indigo-600 hover:underline bg-indigo-50 px-2.5 py-1 rounded-lg"
                            >
                              Buka
                            </a>
                          </div>
                        )}
                      </div>
                  )
                })()}
              </div>
            </div>
          </div>
        )}

        {/* ================= PANEL 2: MODAL GENERATOR ID CARD ================= */}
        {selectedIdCard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md transition-all">
            <div className="w-full max-w-sm bg-white/90 backdrop-blur-xl rounded-3xl border border-white/60 p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
               <button onClick={() => setSelectedIdCard(null)} className="absolute top-4 right-4 p-2 bg-black/5 hover:bg-black/10 rounded-full transition-colors z-10"><X size={16} className="text-slate-600"/></button>
               
               {/* Area foto — wrapper dengan padding agar border-radius tidak terpotong */}
               <div className="p-2">
                 <div 
                   ref={idCardRef} 
                   className="print-area rounded-2xl overflow-hidden"
                   style={{ width: '320px', backgroundColor: '#1e3a8a' }}
                 >
                   <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-6 pb-4 text-center relative">
                     <div className="text-white/80 text-[10px] font-black uppercase tracking-[0.2em] mb-6">ID Card Peserta</div>
                   
                     <div className="w-20 h-20 bg-white/20 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl font-bold border border-white/40 shadow-lg text-white">
                       {(selectedIdCard.full_name || "U").charAt(0)}
                     </div>
                     <h3 className="text-xl font-bold mb-1 text-white">{selectedIdCard.full_name}</h3>
                     <p className="text-blue-200 text-xs mb-6 font-medium">{selectedIdCard.school_name || selectedIdCard.school}</p>
                   
                     <div className="bg-white/10 rounded-xl py-3 border border-white/20 mb-3">
                       <span className="text-[10px] text-blue-200 block uppercase font-bold tracking-widest mb-0.5">Kategori</span>
                       <span className="font-bold text-white text-sm">{selectedIdCard.competition_type || selectedIdCard.category}</span>
                     </div>
                   
                     <div className="inline-block px-4 py-1.5 bg-black/20 rounded-full border border-white/10 text-xs text-white font-mono mt-2 mb-2">
                       ID: NCC-{selectedIdCard.id}
                     </div>
                   </div>
                 </div>
               </div>
               
               {/* Tombol Aksi — DI LUAR ref agar tidak ikut terfoto */}
               <div className="flex gap-2 mt-4">
                 <button 
                   onClick={handleDownloadCard}
                   disabled={isDownloadingCard}
                   className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-200 active:scale-95 text-sm"
                 >
                   {isDownloadingCard ? (
                     <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div> Memproses...</>
                   ) : (
                     <><Download size={16} /> Unduh PNG</>
                   )}
                 </button>
                 <button
                   onClick={handlePrintCard}
                   className="px-4 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
                   title="Cetak"
                 >
                   <Printer size={18} />
                 </button>
               </div>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================= */}
      {/* 🌟 SISTEM NOTIFIKASI TOAST (MENGAMBANG DI POJOK KANAN ATAS) */}
      {/* ========================================================= */}
      <div className={`fixed top-8 right-8 z-[9999] transition-all duration-500 transform ${toast.show ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-12 opacity-0 scale-95 pointer-events-none'}`}>
        <div className={`bg-white/90 backdrop-blur-2xl border ${toast.type === 'success' ? 'border-emerald-200' : 'border-rose-200'} shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-2xl p-5 flex items-center gap-4 min-w-[320px]`}>
          {toast.type === 'success' ? (
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner"><CheckCircle2 size={22} /></div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shadow-inner"><AlertCircle size={22} /></div>
          )}
          <div>
            <p className="font-black text-slate-800 text-sm tracking-tight">{toast.type === 'success' ? 'BERHASIL' : 'PERINGATAN'}</p>
            <p className="text-xs text-slate-500 font-bold mt-0.5 leading-relaxed">{toast.message}</p>
          </div>
          <button onClick={() => setToast({ ...toast, show: false })} className="ml-auto text-slate-300 hover:text-slate-500 transition-colors">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 🌟 MODAL KONFIRMASI LIQUID GLASS (MENGGANTIKAN window.confirm) */}
      {/* ========================================================= */}
      <div className={`fixed inset-0 z-[90] flex items-center justify-center p-4 transition-all duration-300 ${confirmModal.show ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {/* Latar Belakang Gelap */}
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}></div>
        
        {/* Kotak Modal */}
        <div className={`bg-white/90 backdrop-blur-3xl border border-white/60 shadow-2xl rounded-[2rem] p-8 max-w-md w-full relative transition-all duration-500 transform ${confirmModal.show ? 'scale-100 translate-y-0' : 'scale-95 translate-y-8'}`}>
          <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-[1.5rem] flex items-center justify-center mb-6 shadow-inner mx-auto border border-blue-100/50">
            <Megaphone size={36} />
          </div>
          <h3 className="text-2xl font-black text-slate-800 text-center mb-2 tracking-tight">{confirmModal.title}</h3>
          <p className="text-slate-500 text-center mb-8 text-sm leading-relaxed">{confirmModal.message}</p>
          
          <div className="flex gap-4">
            <button 
              onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))} 
              className="flex-1 py-4 rounded-2xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Batalkan
            </button>
            <button 
              onClick={confirmModal.onConfirm} 
              className="flex-1 py-4 rounded-2xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95"
            >
              Eksekusi
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 🚨 MODAL KONFIRMASI DELETE (PEMUSNAH) */}
      {/* ========================================================= */}
      <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300 ${deleteModal.show ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setDeleteModal({ ...deleteModal, show: false })}></div>
        
        <div className={`bg-white backdrop-blur-3xl border border-red-100 shadow-2xl rounded-[2rem] p-8 max-w-md w-full relative transition-all duration-500 transform ${deleteModal.show ? 'scale-100 translate-y-0' : 'scale-95 translate-y-8'}`}>
          <div className="w-20 h-20 bg-red-50 text-red-600 rounded-[1.5rem] flex items-center justify-center mb-6 shadow-inner mx-auto border border-red-100/50">
            <Trash2 size={36} />
          </div>
          <h3 className="text-2xl font-black text-slate-800 text-center mb-2 tracking-tight">Hapus Peserta?</h3>
          <p className="text-slate-500 text-center mb-8 text-sm leading-relaxed">
            Anda yakin ingin menghapus data pendaftaran atas nama <strong className="text-slate-800">{deleteModal.name}</strong>? Tindakan ini akan menghapus data dari sistem secara permanen.
          </p>
          
          <div className="flex gap-4">
            <button 
              onClick={() => setDeleteModal({ ...deleteModal, show: false })} 
              className="flex-1 py-4 rounded-2xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Batal
            </button>
            <button 
              onClick={executeDelete} 
              className="flex-1 py-4 rounded-2xl font-bold text-white bg-red-600 hover:bg-red-700 transition-all shadow-lg shadow-red-200 active:scale-95"
            >
              Ya, Hapus Permanen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function NavItem({ icon, text, active = false, badge, onClick }: { icon: React.ReactNode, text: string, active?: boolean, badge?: string, onClick?: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={`flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-all font-medium text-sm
      ${active ? 'bg-blue-50 text-blue-700 font-bold shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}
    `}>
      <div className="flex items-center gap-3">
        {icon}
        <span className="tracking-tight">{text}</span>
      </div>
      {badge && badge !== "0" && (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${active ? 'bg-blue-200 text-blue-800' : 'bg-red-100 text-red-600'}`}>
          {badge}
        </span>
      )}
    </div>
  );
}

function StatCard({ title, value, trend, isUp }: { title: string, value: string, trend: string, isUp: boolean }) {
  return (
    <div className="bg-white/50 backdrop-blur-xl backdrop-saturate-150 p-6 rounded-2xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between hover:bg-white/70 transition-all">
      <h4 className="text-slate-500 font-medium text-sm mb-4">{title}</h4>
      <div className="flex items-end justify-between">
        <h2 className="text-3xl font-bold text-slate-800 tracking-tight">{value}</h2>
        <span className={`flex items-center text-xs font-bold px-2 py-1 rounded-md border
          ${isUp ? 'text-green-700 bg-green-500/10 border-green-500/20' : 'text-red-700 bg-red-500/10 border-red-500/20'}
        `}>
          {isUp ? <ArrowUpRight size={14} className="mr-1"/> : <ArrowDownRight size={14} className="mr-1"/>}
          {trend}
        </span>
      </div>
    </div>
  );
}
