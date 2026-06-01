"use client";
export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useRef, memo, Suspense } from "react";
import * as htmlToImage from 'html-to-image';
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client"; 
import { generateTicketCode } from "@/lib/utils"; 
import { 
  getAdminCompetitionEntries, 
  getUnregisteredUsers, 
  getAdminBroadcasts, 
  getSchoolMessages, 
  getPortalSettings, 
  getTimelineConfig, 
  getActiveExams 
} from "@/app/actions/auth";

import { 
  LayoutDashboard, Users, FileCheck, Settings, 
  ArrowUpRight, ArrowDownRight, Download, Calendar, 
  Bell, MoreHorizontal, Sparkles, Search, Filter, Printer, X, IdCard, Megaphone, Send, ArrowRight, Save, MessageSquare,
  CheckCircle2, AlertCircle, LogOut, Trash2, MapPin, School, Target, XCircle, Power, Shield, Clock, CalendarDays, FolderOpen, ShieldCheck, CheckCircle, Eye, EyeOff, FileText, ImageIcon, Camera, Trophy, Medal, GraduationCap, Building2, ClipboardCheck, Pencil, History, MegaphoneOff, Forward, AlertTriangle
} from "lucide-react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from "recharts";
import katex from "katex";
import "katex/dist/katex.min.css";
import Papa from "papaparse";

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
  waveName?: string;
}

const ParticipantRow = memo(({ entry, onRowClick, onIdCardClick, onDeleteClick, waveName }: ParticipantRowProps) => {
  const dateObj = entry.created_at ? new Date(entry.created_at) : new Date();
  const dateStr = dateObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  let photoUrl = "";
  let hasSubmissionUrl = false;
  if (entry.notes) {
    try {
      const pObj = JSON.parse(entry.notes);
      photoUrl = pObj.profile_photo_url;
      hasSubmissionUrl = !!pObj.submission_url;
    } catch (e) {}
  }

  let stage = 1;
  let isFailed = false;
  if (entry.notes) {
    try {
      const n = JSON.parse(entry.notes);
      if (n.current_stage) stage = n.current_stage;
      if (n.is_failed) isFailed = n.is_failed;
    } catch (e) {}
  }

  return (
    <tr 
      onClick={() => onRowClick(entry)}
      className="hover:bg-blue-50/50 transition-colors cursor-pointer"
    >
      <td className="py-4 px-6 font-black text-blue-600">NCC-{generateTicketCode(entry.id)}</td>
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
           {hasSubmissionUrl && (
             <div className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded border border-emerald-100 w-max mt-1.5 flex items-center gap-1">
               <FolderOpen size={10} /> Link Karya Tersedia
             </div>
           )}
         </div>
      </td>
      <td className="py-4 px-6">
        <div className="font-bold text-slate-700">{entry.school_name || entry.school || "Belum Diisi"}</div>
        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
           <MapPin size={11} className="shrink-0" /> {entry.province || entry.city || "Provinsi belum diisi"}
        </div>
      </td>
      <td className="py-4 px-6">
        <span className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-colors ${
          (waveName || "").toLowerCase().includes("gelombang 2") ||
          (waveName || "").toLowerCase().includes("regular")
            ? 'bg-amber-50 text-amber-700 border-amber-100/80 hover:bg-amber-100/50'
            : 'bg-sky-50 text-sky-700 border-sky-100/80 hover:bg-sky-100/50'
        }`}>
          {(waveName || "Gelombang 1").split(" (")[0]}
        </span>
      </td>
      <td className="py-4 px-6">
        {stage === 1 && (
          isFailed ? (
            <span className="px-2.5 py-1 rounded-md text-[10px] font-black bg-rose-50 text-rose-600 border border-rose-200 flex items-center gap-1"><XCircle size={10} /> GAGAL T1</span>
          ) : (
            <span className="px-2.5 py-1 rounded-md text-[10px] font-black bg-slate-100 text-slate-500 border border-slate-200 flex items-center gap-1"><ClipboardCheck size={10} /> TAHAP 1</span>
          )
        )}
        {stage === 2 && (
          isFailed ? (
            <span className="px-2.5 py-1 rounded-md text-[10px] font-black bg-rose-50 text-rose-600 border border-rose-200 flex items-center gap-1"><XCircle size={10} /> GAGAL T2</span>
          ) : (
            <span className="px-2.5 py-1 rounded-md text-[10px] font-black bg-blue-50 text-blue-600 border border-blue-200 animate-pulse flex items-center gap-1"><Medal size={10} /> TAHAP 2</span>
          )
        )}
        {stage === 3 && <span className="px-2.5 py-1 rounded-md text-[10px] font-black bg-amber-50 text-amber-600 border border-amber-200 shadow-sm shadow-amber-100 flex items-center gap-1"><Trophy size={10} /> FINAL</span>}
      </td>
      <td className="py-4 px-6">
        <span className="bg-slate-100/80 text-slate-700 px-2.5 py-1 rounded-md text-[11px] font-bold border border-slate-200/60">
          {entry.competition_type || entry.category || "Belum Pilih"}
        </span>
        <div className="text-[11px] text-slate-500 mt-1.5 flex flex-col gap-0.5">
          {(() => {
            const rawMentor = entry.mentor_name || "";
            if (rawMentor.includes(" | ")) {
              const [name, email, phone] = rawMentor.split(" | ");
              return (
                <>
                  <div>Pembina: <span className="font-bold text-slate-700">{name || "-"}</span></div>
                  {email && <div className="text-[10px] text-slate-400 font-mono select-all">Email: {email}</div>}
                  {phone && <div className="text-[10px] text-slate-400 font-mono select-all">Telp: {phone}</div>}
                </>
              );
            }
            return <div>Pembina: <span className="font-medium text-slate-700">{rawMentor || "-"}</span></div>;
          })()}
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

const ParticipantSkeletonRow = () => (
  <tr className="animate-pulse border-b border-slate-100">
    <td className="py-4 px-6">
      <div className="h-4 w-16 bg-slate-200/80 rounded animate-pulse"></div>
    </td>
    <td className="py-4 px-6 flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-slate-200/80 shrink-0 animate-pulse"></div>
      <div className="space-y-1.5 flex-1 min-w-0">
        <div className="h-4 w-32 bg-slate-200/80 rounded animate-pulse"></div>
        <div className="h-3 w-24 bg-slate-200/50 rounded animate-pulse"></div>
      </div>
    </td>
    <td className="py-4 px-6">
      <div className="h-4 w-36 bg-slate-200/80 rounded animate-pulse"></div>
    </td>
    <td className="py-4 px-6">
      <div className="h-6 w-20 bg-slate-200/60 rounded-full animate-pulse"></div>
    </td>
    <td className="py-4 px-6">
      <div className="w-24 space-y-1">
        <div className="h-1.5 bg-slate-200/80 rounded-full w-full animate-pulse"></div>
        <div className="h-2.5 w-8 bg-slate-200/50 rounded animate-pulse"></div>
      </div>
    </td>
    <td className="py-4 px-6">
      <div className="space-y-1">
        <div className="h-4 w-28 bg-slate-200/80 rounded animate-pulse"></div>
        <div className="h-3 w-16 bg-slate-200/50 rounded animate-pulse"></div>
      </div>
    </td>
    <td className="py-4 px-6">
      <div className="space-y-1">
        <div className="h-4 w-20 bg-slate-200/80 rounded animate-pulse"></div>
        <div className="h-3 w-12 bg-slate-200/50 rounded animate-pulse"></div>
      </div>
    </td>
    <td className="py-4 px-6">
      <div className="h-6 w-16 bg-slate-200/60 rounded-full animate-pulse"></div>
    </td>
    <td className="py-4 px-6 text-center">
      <div className="flex gap-1.5 justify-center">
        <div className="w-8 h-8 bg-slate-200/60 rounded-xl animate-pulse"></div>
        <div className="w-8 h-8 bg-slate-200/60 rounded-xl animate-pulse"></div>
      </div>
    </td>
  </tr>
);

const KaryaSkeletonRow = () => (
  <tr className="animate-pulse border-b border-slate-100">
    <td className="py-4 px-6">
      <div className="h-4 w-16 bg-slate-200/80 rounded animate-pulse"></div>
    </td>
    <td className="py-4 px-6">
      <div className="space-y-1.5">
        <div className="h-4 w-32 bg-slate-200/80 rounded animate-pulse"></div>
        <div className="h-3 w-24 bg-slate-200/50 rounded animate-pulse"></div>
      </div>
    </td>
    <td className="py-4 px-6">
      <div className="space-y-1.5">
        <div className="h-4 w-36 bg-slate-200/80 rounded animate-pulse"></div>
        <div className="h-3 w-20 bg-slate-200/50 rounded animate-pulse"></div>
      </div>
    </td>
    <td className="py-4 px-6">
      <div className="h-6 w-20 bg-slate-200/60 rounded-full animate-pulse"></div>
    </td>
    <td className="py-4 px-6">
      <div className="h-6 w-24 bg-slate-200/60 rounded-xl animate-pulse"></div>
    </td>
    <td className="py-4 px-6">
      <div className="h-7 w-28 bg-slate-200/70 rounded-lg animate-pulse"></div>
    </td>
    <td className="py-4 px-6 text-center">
      <div className="w-10 h-7 bg-slate-200/60 rounded-lg mx-auto animate-pulse"></div>
    </td>
  </tr>
);

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
            <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">NCC-{generateTicketCode(entry.id)}</span>
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

function ModernHQDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [realEntries, setRealEntries] = useState<any[]>([]);
  const [unregisteredUsers, setUnregisteredUsers] = useState<any[]>([]);
  const [isLoadingUnregistered, setIsLoadingUnregistered] = useState(false);
  const [searchUnregisteredQuery, setSearchUnregisteredQuery] = useState("");
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [dynamicChartData, setDynamicChartData] = useState<any[]>([]);
  const [dynamicBarData, setDynamicBarData] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [selectedSchoolGroup, setSelectedSchoolGroup] = useState<any>(null);
  const [groupMessages, setGroupMessages] = useState<any[]>([]);
  const [isLoadingGroupMessages, setIsLoadingGroupMessages] = useState(false);
  const [groupMsgText, setGroupMsgText] = useState("");
  const [isSendingGroupMsg, setIsSendingGroupMsg] = useState(false);
  const [searchSchoolQuery, setSearchSchoolQuery] = useState("");
  
  // WA-like features for Forum Sekolah in HQ Admin panel
  const [hqEditingMsg, setHqEditingMsg] = useState<any | null>(null);
  const [hqEditInput, setHqEditInput] = useState("");
  const [isUpdatingHqMsg, setIsUpdatingHqMsg] = useState(false);
  const [hqForwardingMsg, setHqForwardingMsg] = useState<any | null>(null);
  const [searchForwardSchool, setSearchForwardSchool] = useState("");

  // Efek memuat obrolan untuk Forum Sekolah terpilih
  useEffect(() => {
    if (activeTab !== "ForumSekolah" || !selectedSchoolGroup) return;

    const fetchGroupMessages = async () => {
      setIsLoadingGroupMessages(true);
      const safetyTimer = setTimeout(() => {
        setIsLoadingGroupMessages(false);
      }, 5000);

      try {
        const { data, error } = await getSchoolMessages(selectedSchoolGroup.schoolName, selectedSchoolGroup.npsn);
        if (!error) {
          setGroupMessages(data || []);
        }
      } catch (err) {
        console.error("Gagal memuat pesan obrolan kelompok:", err);
      } finally {
        clearTimeout(safetyTimer);
        setIsLoadingGroupMessages(false);
      }
    };

    fetchGroupMessages();

    // Subscribe real-time
    const channelKey = selectedSchoolGroup.npsn 
      ? `npsn_${selectedSchoolGroup.npsn}` 
      : selectedSchoolGroup.schoolName.replace(/\s+/g, "_");

    const channel = supabase
      .channel(`hq_school_chat_${channelKey}`)
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to all events!
          schema: "public",
          table: "school_messages",
        },
        (payload) => {
          if (payload.eventType === "DELETE") {
            if (payload.old && payload.old.id) {
              setGroupMessages((prev) => prev.filter(msg => msg.id !== payload.old.id));
            }
            return;
          }

          const newOrOld = payload.new || payload.old;
          if (!newOrOld) return;

          const matchesNpsn = selectedSchoolGroup.npsn && newOrOld.npsn === selectedSchoolGroup.npsn;
          const matchesSchool = selectedSchoolGroup.schoolName && newOrOld.school_name?.toLowerCase() === selectedSchoolGroup.schoolName.toLowerCase();

          if (matchesNpsn || matchesSchool) {
            if (payload.eventType === "INSERT") {
              setGroupMessages((prev) => {
                if (prev.some(m => m.id === payload.new.id)) return prev;
                return [...prev, payload.new];
              });
            } else if (payload.eventType === "UPDATE") {
              setGroupMessages((prev) => prev.map(msg => msg.id === payload.new.id ? payload.new : msg));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeTab, selectedSchoolGroup, supabase]);

  const handleSendGroupMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupMsgText.trim() || isSendingGroupMsg || !selectedSchoolGroup) return;

    setIsSendingGroupMsg(true);
    const textToSend = groupMsgText.trim();
    setGroupMsgText("");

    try {
      const { error } = await supabase
        .from("school_messages")
        .insert([
          {
            school_name: selectedSchoolGroup.schoolName,
            npsn: selectedSchoolGroup.npsn || null,
            sender_id: "hq-admin",
            sender_name: "Markas Besar (Admin)",
            message: textToSend,
          }
        ]);
      if (error) throw error;
    } catch (err) {
      console.error("Gagal mengirim pesan ke forum:", err);
      alert("Gagal mengirim pesan: " + (err as Error).message);
    } finally {
      setIsSendingGroupMsg(false);
    }
  };
  const handleDeleteHqMessage = async (msgId: string) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus pesan ini?")) return;
    try {
      const { error } = await supabase
        .from("school_messages")
        .delete()
        .eq("id", msgId);
      if (error) throw error;
      setGroupMessages(prev => prev.filter(m => m.id !== msgId));
    } catch (err: any) {
      alert("Gagal menghapus pesan: " + err.message);
    }
  };

  const handleUpdateHqMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hqEditInput.trim() || !hqEditingMsg || isUpdatingHqMsg) return;
    setIsUpdatingHqMsg(true);
    try {
      const { error } = await supabase
        .from("school_messages")
        .update({ message: hqEditInput.trim() })
        .eq("id", hqEditingMsg.id);
      if (error) throw error;
      
      setGroupMessages(prev => prev.map(m => m.id === hqEditingMsg.id ? { ...m, message: hqEditInput.trim() } : m));
      setHqEditingMsg(null);
      setHqEditInput("");
    } catch (err: any) {
      alert("Gagal memperbarui pesan: " + err.message);
    } finally {
      setIsUpdatingHqMsg(false);
    }
  };

  const handleForwardHqMessage = async (targetGroup: any) => {
    if (!hqForwardingMsg) return;
    const cleanText = hqForwardingMsg.message.replace(/^↪ Diteruskan:\n/, "");
    const forwardedText = `↪ Diteruskan:\n${cleanText}`;
    
    try {
      const { error } = await supabase
        .from("school_messages")
        .insert([
          {
            school_name: targetGroup.schoolName,
            npsn: targetGroup.npsn || null,
            sender_id: "hq-admin",
            sender_name: "Markas Besar (Admin)",
            message: forwardedText,
          }
        ]);
      if (error) throw error;
      alert(`Pesan berhasil diteruskan ke ${targetGroup.schoolName}!`);
      setHqForwardingMsg(null);
    } catch (err: any) {
      alert("Gagal meneruskan pesan: " + err.message);
    }
  };

  const [activeToken, setActiveToken] = useState("------");
  const [showToken, setShowToken] = useState(false);

  useEffect(() => {
    const fetchActiveToken = async () => {
      try {
        const { data: exams } = await getActiveExams();
          
        if (exams && exams.length > 0) {
          const updateToken = () => {
            const now = Math.floor(Date.now() / 1000);
            const interval10Min = 600;
            const currentInterval = Math.floor(now / interval10Min);
            const charPool = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
            
            const exam = exams[0];
            let expectedToken = "";
            let idSum = 0;
            for (let i = 0; i < exam.id.length; i++) {
              idSum += exam.id.charCodeAt(i);
            }
            let seed = (idSum + currentInterval) % 10000;
            for (let i = 0; i < 6; i++) {
              seed = (seed * 9301 + 49297) % 233280;
              expectedToken += charPool[Math.floor((seed / 233280) * charPool.length)];
            }
            setActiveToken(expectedToken);
          };
          updateToken();
          const timer = setInterval(updateToken, 10000);
          return () => clearInterval(timer);
        }
      } catch (err) {
        console.error("Gagal memuat token ujian:", err);
      }
    };
    fetchActiveToken();
  }, []);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);
  
  // Fitur Tambah Peserta & Import CSV
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showSchoolMembers, setShowSchoolMembers] = useState(false);
  const [newParticipant, setNewParticipant] = useState({
    full_name: "", email: "", nisn: "", school_name: "", province: "", city: "",
    category: "", mentor_name: "", mentor_email: "", mentor_phone: "", phone_number: ""
  });
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [activeCsvTab, setActiveCsvTab] = useState<'upload' | 'guide'>('upload');
  
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
  // ⚡ Ref untuk selalu baca timelineData TERBARU (hindari stale closure di saveTimeline)
  const timelineDataRef = React.useRef<any[]>(timelineData);
  React.useEffect(() => { timelineDataRef.current = timelineData; }, [timelineData]);

  useEffect(() => {
    const fetchTimeline = async () => {
      try {
        const { data: timelineConfig } = await getTimelineConfig();
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
  const [filterWave, setFilterWave] = useState("All");
  const [filterProgress, setFilterProgress] = useState("All");
  const [timeFilter, setTimeFilter] = useState("All"); // Opsi: 'Today', '7Days', '1Month', 'All'
  const [selectedParticipant, setSelectedParticipant] = useState<any | null>(null);
  const [selectedIdCard, setSelectedIdCard] = useState<any | null>(null);
  // Calendar picker state
  const [openCalendar, setOpenCalendar] = useState<string | null>(null); // key: `${cat}-${wave}-${item}-${type}`
  const [calViewDate, setCalViewDate] = useState<{ [key: string]: { year: number; month: number } }>({});

  // --- MEMORI SIARAN KOMANDO ---
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastTarget, setBroadcastTarget] = useState("All");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [isFetchingBroadcasts, setIsFetchingBroadcasts] = useState(true);

  const fetchBroadcasts = async () => {
    setIsFetchingBroadcasts(true);
    const safetyTimer = setTimeout(() => {
      setIsFetchingBroadcasts(false);
    }, 5000);

    try {
      const { data, error } = await getAdminBroadcasts();

      if (error) throw new Error(error);
      setBroadcasts(data || []);
    } catch (err: any) {
      console.error("Gagal menarik data siaran:", err);
      showToast(`Gagal memuat riwayat siaran: ${err.message}`, "error");
    } finally {
      clearTimeout(safetyTimer);
      setIsFetchingBroadcasts(false);
    }
  };

  const handleDeleteBroadcast = async (id: any) => {
    setConfirmModal({
      show: true,
      title: "Hapus Siaran Komando",
      message: "Apakah Anda yakin ingin menghapus pengumuman ini secara permanen dari database? Tindakan ini tidak dapat dibatalkan.",
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, show: false }));
        try {
          const { error } = await supabase
            .from('announcements')
            .delete()
            .eq('id', id);

          if (error) throw error;

          showToast("Pengumuman berhasil dihapus!", "success");
          fetchBroadcasts();
        } catch (error: any) {
          showToast(`Gagal menghapus pengumuman: ${error.message}`, "error");
        }
      }
    });
  };

  const formatBroadcastDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()} • ${hours}:${minutes}`;
  };

  const getAudienceLabelAndStyle = (target: string) => {
    switch (target) {
      case "All":
        return { label: "Massal", style: "bg-blue-50 text-blue-700 border-blue-200" };
      case "Verified":
        return { label: "Lolos (Verified)", style: "bg-emerald-50 text-emerald-700 border-emerald-200" };
      case "Pending":
        return { label: "Belum Lolos (Pending)", style: "bg-amber-50 text-amber-700 border-amber-200" };
      case "specific":
        return { label: "Spesifik (Manual)", style: "bg-purple-50 text-purple-700 border-purple-200" };
      default:
        return { label: target, style: "bg-slate-50 text-slate-700 border-slate-200" };
    }
  };


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
    gallery_title: "Moments of Excellence",
    gallery_subtitle: "A glimpse into the spirit, competition, and victory at NCC. Capturing the journey of future leaders across diverse categories.",
    gallery_images: []
  });

  const [isUploadingAsset, setIsUploadingAsset] = useState<string | null>(null);

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
      console.error("Upload error:", error);
      let errMsg = error.message || "Kesalahan tidak dikenal";
      if (errMsg.toLowerCase().includes("bucket") || errMsg.toLowerCase().includes("not_found") || errMsg.toLowerCase().includes("not found")) {
        errMsg = "Bucket 'payment-proofs' tidak ditemukan. Jalankan SQL di supabase/migrations/add_payment_proofs_bucket.sql pada SQL editor Supabase Anda.";
      } else if (errMsg.toLowerCase().includes("policy") || errMsg.toLowerCase().includes("row-level security") || errMsg.toLowerCase().includes("permission")) {
        errMsg = "Akses ditolak kebijakan RLS. Pastikan kebijakan storage pada supabase/migrations/add_payment_proofs_bucket.sql telah terpasang.";
      }
      showToast(`Gagal upload: ${errMsg}`, "error");
    } finally {
      setIsUploadingAsset(null);
    }
  };

  // --- 📡 PORTAL SYNC WRITER ---
  const performSyncToDatabase = async (currentWaves = waves, currentSub = submissionStatus, currentPhase = phaseStatus, currentAssets = dashboardAssets, currentReg = isRegistrationOpen) => {
    try {
      const { data: existing, error: fetchError } = await supabase
        .from('announcements')
        .select('id, content')
        .eq('title', 'SYS_PORTAL_SETTINGS')
        .maybeSingle();

      if (fetchError) {
        console.error("Gagal mengambil data portal untuk sync:", fetchError);
        return;
      }

      let parsed = { 
        waves: currentWaves, 
        submissionStatus: currentSub, 
        phaseStatus: currentPhase, 
        dashboardAssets: currentAssets, 
        isRegistrationOpen: currentReg 
      };

      if (existing && existing.content) {
        try {
          const dbParsed = JSON.parse(existing.content);
          if (dbParsed.paymentRequirementStage) {
            (parsed as any).paymentRequirementStage = dbParsed.paymentRequirementStage;
          }
        } catch (e) {
          console.error("Gagal parse existing content:", e);
        }
      }

      if (existing) {
        await supabase
          .from('announcements')
          .update({ content: JSON.stringify(parsed) })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('announcements')
          .insert([{
            title: 'SYS_PORTAL_SETTINGS',
            message: 'SYS_PORTAL_SETTINGS',
            content: JSON.stringify(parsed),
            target_audience: 'All',
            type: 'info'
          }]);
      }
    } catch (err) {
      console.error("Exception saat sinkronisasi portal:", err);
    }
  };

  // --- 📡 REAL-TIME PORTAL SYNC ENGINE (DEBOUNCED TO PREVENT RACE CONDITIONS) ---
  useEffect(() => {
    if (!isPortalLoaded) return;

    const timer = setTimeout(() => {
      performSyncToDatabase();
    }, 1000);

    return () => clearTimeout(timer);
  }, [waves, submissionStatus, phaseStatus, dashboardAssets, isRegistrationOpen, isPortalLoaded]);

  // --- 📡 REAL-TIME TIMELINE AUTO-SYNC ---
  useEffect(() => {
    if (!isTimelineLoaded) return;

    const timer = setTimeout(() => {
      saveTimeline();
    }, 1000);
    return () => clearTimeout(timer);
  }, [timelineData, isTimelineLoaded]);

  // --- 📅 CLOSE CALENDAR ON OUTSIDE CLICK ---
  useEffect(() => {
    if (!openCalendar) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;
      
      // Jika element sudah di-unmount dari DOM (karena re-render cepat), jangan close
      if (!document.body.contains(target)) return;
      
      // Jika diklik di dalam popover atau tombol pemicu, jangan close
      if (target.closest('.cal-picker-popover') || target.closest('.cal-picker-trigger')) {
        return;
      }
      
      setOpenCalendar(null);
    };
    
    // Gunakan capture phase agar berjalan lebih dulu dan konsisten
    document.addEventListener('click', handler, true);
    return () => document.removeEventListener('click', handler, true);
  }, [openCalendar]);


  const saveTimeline = async () => {
    setIsSavingTimeline(true);
    try {
      // ⚡ Selalu gunakan timelineDataRef.current agar tidak terkena stale closure
      const latestData = timelineDataRef.current;
      const cleanData = latestData.map(cat => ({
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
    setIsLoggingOut(true);
    try {
      // Jalankan sinkronisasi di latar belakang tanpa memblokir/menghambat proses keluar
      performSyncToDatabase();
    } catch (_) {}

    // Jeda singkat 250ms untuk memberikan efek transisi visual yang halus sebelum redirect
    await new Promise((resolve) => setTimeout(resolve, 250));

    try { await supabase.auth.signOut(); } catch (_) {}
    try {
      const { logoutLocalUser } = await import("@/app/actions/auth");
      await logoutLocalUser();
    } catch (_) {
      router.push('/login');
    }
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

  // --- 🛠️ HELPER RENDERERS (CLEANER JSX) ---
  const renderParticipantAvatar = (p: any) => {
    let photoUrl = "";
    if (p.notes) {
      try { photoUrl = JSON.parse(p.notes).profile_photo_url; } catch (e) {}
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
        {(p.full_name || "U").charAt(0)}
      </div>
    );
  };

  const getParticipantStage = (p: any) => {
    let stage = 1;
    if (p.notes) {
      try { stage = JSON.parse(p.notes).current_stage || 1; } catch (e) {}
    }
    return stage;
  };

  const getParticipantFailed = (p: any) => {
    let failed = false;
    if (p.notes) {
      try { failed = JSON.parse(p.notes).is_failed || false; } catch (e) {}
    }
    return failed;
  };

  const renderParticipantFiles = (p: any) => {
    let adminNotes: any = {};
    if (p.notes) {
      try { adminNotes = JSON.parse(p.notes); } catch (e) {}
    }
    
    const hasFiles = adminNotes.profile_photo_url || adminNotes.student_card_url || adminNotes.submission_url;
    if (!hasFiles) return null;

    return (
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
          <div className={`flex items-center justify-between py-2 text-sm ${adminNotes.submission_url ? 'border-b border-slate-100/60' : ''}`}>
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

        {adminNotes.submission_url && (
          <div className="flex items-center justify-between py-2 text-sm">
            <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
              <FolderOpen size={13} className="text-emerald-500" /> Link Karya / Submission
            </span>
            <a 
              href={adminNotes.submission_url} 
              target="_blank" 
              rel="noreferrer" 
              className="text-xs font-bold text-emerald-700 hover:underline bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-lg flex items-center gap-1"
            >
              Buka Karya
            </a>
          </div>
        )}
      </div>
    );
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

    // Pencadangan input (Backup) untuk penanganan error & rollback
    const titleBackup = broadcastTitle;
    const messageBackup = broadcastMessage;
    const targetBackup = broadcastTarget;
    const selectedBackup = selectedUserIds;

    // 1. Optimistic UI update: Buat objek broadcast tiruan dan masukkan ke list paling atas secara instan
    const tempId = 'temp-' + Date.now();
    const optimisticBroadcast = {
      id: tempId,
      title: broadcastTitle,
      message: broadcastMessage,
      target_audience: broadcastTarget,
      created_at: new Date().toISOString()
    };
    
    setBroadcasts(prev => [optimisticBroadcast, ...prev]);

    // 2. Bersihkan form secara instan agar admin bisa langsung mengetik pesan lain tanpa ter-freeze!
    setBroadcastTitle("");
    setBroadcastMessage("");
    setSelectedUserIds([]);
    setIsSending(false); // Kembalikan ke false agar tombol kirim bisa langsung digunakan
    showToast("Pesan sedang diproses dan diantarkan ke seluruh peserta di latar belakang...", "success");

    // 3. Eksekusi pengiriman ke database Supabase di latar belakang (Non-Blocking)
    try {
      const contentPayload = JSON.stringify({
        message: messageBackup,
        target_user_ids: targetBackup === 'specific' ? selectedBackup : []
      });

      const { data, error } = await supabase
        .from('announcements')
        .insert([
          {
            title: titleBackup,
            message: messageBackup,
            content: contentPayload,
            target_audience: targetBackup
          }
        ])
        .select()
        .single();

      if (error) throw error;

      // Ganti ID tiruan dengan data asli dari database
      if (data) {
        setBroadcasts(prev => prev.map(b => b.id === tempId ? data : b));
      }
    } catch (error: any) {
      console.error("Gagal menyiarkan di latar belakang:", error);
      showToast(`Gagal menyiarkan ke database: ${error.message}`, "error");
      
      // Rollback: Hapus item tiruan dari layar
      setBroadcasts(prev => prev.filter(b => b.id !== tempId));
      
      // Kembalikan tulisan yang diketik sebelumnya ke form agar kerja keras admin tidak hilang
      setBroadcastTitle(titleBackup);
      setBroadcastMessage(messageBackup);
      setBroadcastTarget(targetBackup);
      setSelectedUserIds(selectedBackup);
    }
  };

  // --- KONTROL PROGRES TAHAP PESERTA ---
  const handleUpdateStage = async (id: any, newStage: number, isFailed: boolean = false) => {
    try {
      const entry = realEntries.find(e => e.id === id);
      let notesObj: any = {};
      if (entry?.notes) try { notesObj = JSON.parse(entry.notes); } catch (e) {}
      
      notesObj.current_stage = newStage;
      notesObj.is_failed = isFailed;
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

      if (isFailed) {
        showToast(`Peserta ditandai TIDAK LOLOS Tahap ${newStage}`, "error");
      } else {
        showToast(`Peserta berhasil dipindahkan ke Tahap ${newStage === 3 ? 'Final' : newStage}`, "success");
      }
    } catch (err) {
      console.error("Gagal update tahap:", err);
      showToast("Gagal memperbarui tahap peserta", "error");
    }
  };

  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    try {
      const entryId = crypto.randomUUID();
      const combinedMentor = [
        newParticipant.mentor_name?.trim(),
        newParticipant.mentor_email?.trim(),
        newParticipant.mentor_phone?.trim()
      ].filter(Boolean).join(" | ");

      const insertData = {
        id: entryId,
        user_id: crypto.randomUUID(), // fake user_id for manual entry
        full_name: newParticipant.full_name,
        email: newParticipant.email,
        nisn: newParticipant.nisn,
        school_name: newParticipant.school_name,
        province: newParticipant.province,
        city: newParticipant.city,
        competition_type: newParticipant.category,
        mentor_name: combinedMentor,
        phone_number: newParticipant.phone_number,
        payment_status: 'Verified'
      };
      
      const { error } = await supabase.from('competition_entries').insert([insertData]);
      if (error) throw error;
      
      showToast("Peserta berhasil ditambahkan ke Buku Induk!", "success");
      setShowAddModal(false);
      setNewParticipant({full_name: "", email: "", nisn: "", school_name: "", province: "", city: "", category: "", mentor_name: "", mentor_email: "", mentor_phone: "", phone_number: ""});
      
      // Refresh Data
      const { data } = await getAdminCompetitionEntries();
      if (data) setRealEntries(data);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Gagal menambahkan peserta", "error");
    } finally {
      setIsAdding(false);
    }
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      ["nama_lengkap", "email", "nisn", "asal_sekolah", "provinsi", "kota", "kategori_lomba", "nama_pembina", "no_wa"],
      ["Budi Santoso", "budi@gmail.com", "12345678", "SMA Negeri 1 Jakarta", "DKI Jakarta", "Jakarta Selatan", "LKTI Nasional", "Pak Guru", "08123456789"]
    ];
    const csv = Papa.unparse(templateData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "template_data_peserta_ncc.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = () => {
    if (!csvFile) return showToast("Silakan pilih file CSV terlebih dahulu", "error");
    setIsImporting(true);
    
    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const rows = results.data as any[];
          if (!rows || rows.length === 0) {
            throw new Error("File CSV kosong atau tidak valid");
          }
          
          const insertArray = rows.map((row) => ({
            id: crypto.randomUUID(),
            user_id: crypto.randomUUID(),
            full_name: row.nama_lengkap || "-",
            email: row.email || "no-email@ncc.id",
            nisn: row.nisn || "-",
            npsn: row.npsn || "-",
            school_name: row.asal_sekolah || "-",
            province: row.provinsi || "-",
            city: row.kota || "-",
            competition_type: row.kategori_lomba || "-",
            mentor_name: row.nama_pembina || "-",
            phone_number: row.no_wa || "-",
            payment_status: 'Verified'
          }));
          
          const { error } = await supabase.from('competition_entries').insert(insertArray);
          if (error) throw error;
          
          showToast(`Berhasil mengimpor ${insertArray.length} peserta!`, "success");
          setShowImportModal(false);
          setCsvFile(null);
          
          // Refresh Data
          const { data } = await getAdminCompetitionEntries();
          if (data) setRealEntries(data);
        } catch (err: any) {
          console.error(err);
          showToast(err.message || "Gagal impor CSV", "error");
        } finally {
          setIsImporting(false);
        }
      },
      error: (error: any) => {
        setIsImporting(false);
        showToast(`Gagal membaca CSV: ${error.message}`, "error");
      }
    });
  };

  // --- MESIN PENGUMPUL DATA & RADAR REAL-TIME ---
  useEffect(() => {
    // 🚀 CLIENT-SIDE AUTH RECOVERY
    const ensureAdminSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const adminEmails = ["admin@ncc.id", "admin1@ncc.id", "halo.ncc@gmail.com"];
        const currentEmail = session?.user?.email?.toLowerCase();
        
        if (!session || !adminEmails.includes(currentEmail || "")) {
          console.log("[Admin HQ Client] No valid admin session. Recovering...");
          
          // Coba login langsung
          const { error: loginError } = await supabase.auth.signInWithPassword({
            email: 'admin1@ncc.id',
            password: '123456'
          });
          
          if (loginError) {
            console.warn("[Admin HQ Client] Silent login failed. Attempting on-the-fly registration...");
            // Jika akun belum terdaftar di Supabase Auth (misal reset DB), lakukan signUp langsung dari klien!
            const { error: signUpError } = await supabase.auth.signUp({
              email: 'admin1@ncc.id',
              password: '123456',
              options: {
                data: {
                  full_name: "NCC Admin Command",
                  username: "admin1"
                }
              }
            });
            
            if (!signUpError) {
              console.log("[Admin HQ Client] On-the-fly registration succeeded. Retrying silent login...");
              const { error: retryError } = await supabase.auth.signInWithPassword({
                email: 'admin1@ncc.id',
                password: '123456'
              });
              if (retryError) {
                console.error("[Admin HQ Client] Silent retry login failed:", retryError);
              } else {
                console.log("[Admin HQ Client] Silent recovery succeeded after on-the-fly registration!");
              }
            } else {
              console.error("[Admin HQ Client] On-the-fly registration failed:", signUpError);
            }
          } else {
            console.log("[Admin HQ Client] Silent auth recovery succeeded!");
          }
        }
      } catch (err) {
        console.error("[Admin HQ Client] Silent auth recovery error:", err);
      }
    };


    // Fungsi penarik data utama — selalu pastikan sesi valid dulu
    const fetchRealData = async (isRetry = false) => {
      try {
        // Jalankan pemulihan sesi di background agar tidak memblokir render data utama!
        ensureAdminSession();

        const { data, error } = await getAdminCompetitionEntries() as any;


        if (error) {
          console.error("Gagal menarik data:", error);
          // Jika belum retry, coba sekali lagi setelah 1.5 detik
          if (!isRetry) {
            console.log("[Admin HQ] Retrying fetchRealData after error...");
            setTimeout(() => fetchRealData(true), 1500);
          }
        } else if (!data || data.length === 0) {
          // Data kosong tapi tidak ada error — bisa jadi sesi baru saja dipulihkan
          // Jika belum retry, tunggu 1 detik lalu coba lagi
          if (!isRetry) {
            console.log("[Admin HQ] Data empty, retrying once...");
            setTimeout(() => fetchRealData(true), 1000);
          } else {
            setRealEntries([]);
          }
        } else {
          setRealEntries(data);
        }
      } catch (err) {
        console.error("Error eksekusi:", err);
        if (!isRetry) {
          setTimeout(() => fetchRealData(true), 1500);
        }
      } finally {
        setIsLoading(false);
      }
    };

    const fetchUnregisteredData = async () => {
      try {
        setIsLoadingUnregistered(true);
        const { data, error } = await getUnregisteredUsers();
        if (!error && data) {
          setUnregisteredUsers(data);
        } else {
          console.error("Gagal menarik data user belum daftar:", error);
        }
      } catch (err) {
        console.error("Error mengambil user belum daftar:", err);
      } finally {
        setIsLoadingUnregistered(false);
      }
    };

    const fetchPortalSettings = async () => {
      try {
        const { data: existing } = await getPortalSettings();

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

    // Orchestrate session assurance before fetching data
    const initializeData = async () => {
      await fetchRealData();
      fetchPortalSettings();
      fetchBroadcasts();
      fetchUnregisteredData();
    };

    initializeData();

    // Safety Guard: Force end loading after 5 seconds
    const safetyTimer = setTimeout(() => {
      setIsLoading(false);
      setIsPortalLoaded(true);
      setIsTimelineLoaded(true);
      console.warn("Safety timeout triggered: forcing loader closure.");
    }, 5000);

    // 🔄 POLLING BERKALA: Re-fetch data setiap 30 detik sebagai safety net
    // Ini memastikan data peserta TIDAK PERNAH hilang meskipun WebSocket terputus
    const pollingInterval = setInterval(async () => {
      console.log("[Admin HQ] Polling: refreshing participant data...");
      await fetchRealData(true); // isRetry=true agar tidak loop retry
      fetchUnregisteredData();
    }, 30000);

    // 2. 📡 AKTIFKAN SENSOR RADAR (Supabase WebSockets)
    const radarSubscription = supabase
      .channel('pantau_pendaftaran_ncc')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'competition_entries' },
        async (payload) => {
          console.log("Radar mendeteksi pergerakan data!", payload);
          // Pastikan sesi valid sebelum re-fetch dari radar (jalankan di background)
          ensureAdminSession();
          await fetchRealData();
          fetchUnregisteredData();
        }
      )
      .subscribe();

    // 3. Matikan radar secara otomatis jika Presiden menutup halaman
    return () => {
      clearTimeout(safetyTimer);
      clearInterval(pollingInterval);
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
    const headers = [
      "ID Tiket", "Nama Lengkap", "Email", "NISN", "Sekolah", "Provinsi", "Kategori", 
      "Nama Pembina", "Email Pembina", "No. HP Pembina", 
      "Waktu Daftar", "Username Login", "Password Login"
    ];
    
    // 3. Susun Baris Data
    const rows = dataToExport.map(e => {
      let mName = e.mentor_name || "-";
      let mEmail = "-";
      let mPhone = "-";
      if (mName.includes(" | ")) {
        const parts = mName.split(" | ");
        mName = parts[0] || "-";
        mEmail = parts[1] || "-";
        mPhone = parts[2] || "-";
      }

      return [
        `NCC-${generateTicketCode(e.id)}`,
        e.full_name || "-",
        e.email || "-",
        e.nisn || "-",
        e.school_name || e.school || "-",
        e.province || e.city || "-",
        e.competition_type || e.category || "-",
        mName,
        mEmail,
        mPhone,
        new Date(e.created_at).toLocaleString('id-ID'),
        e.email || "-",
        e.nisn || "-"
      ];
    });

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

  // --- 🌊 DYNAMIC WAVE DETECTION HELPER ---
  const getParticipantWave = (createdAtStr: string) => {
    if (!createdAtStr) return "Gelombang 1 (Early Bird)";
    const date = new Date(createdAtStr);
    
    // Sort waves chronologically by start date
    const sortedWaves = [...waves].sort((a, b) => {
      const aTime = a.startDate ? new Date(a.startDate).getTime() : 0;
      const bTime = b.startDate ? new Date(b.startDate).getTime() : 0;
      return aTime - bTime;
    });
    
    // Exact range matching
    for (const wave of sortedWaves) {
      if (!wave.startDate || !wave.endDate) continue;
      const start = new Date(wave.startDate + "T00:00:00");
      const end = new Date(wave.endDate + "T23:59:59");
      if (date >= start && date <= end) {
        return wave.name;
      }
    }
    
    // Fallback: compare boundaries
    if (sortedWaves.length > 0) {
      const firstWaveEnd = sortedWaves[0].endDate ? new Date(sortedWaves[0].endDate + "T23:59:59") : new Date();
      if (date <= firstWaveEnd) {
        return sortedWaves[0].name;
      } else if (sortedWaves.length > 1) {
        return sortedWaves[1].name;
      }
      return sortedWaves[0].name;
    }
    
    return "Gelombang 1 (Early Bird)";
  };

  // --- 🌊 EXPORT SUBMISSIONS CSV ---
  const handleExportKaryaCSV = () => {
    const submissions = realEntries.filter(e => {
      if (!e.notes) return false;
      try {
        return !!JSON.parse(e.notes).submission_url;
      } catch (err) { return false; }
    });

    if (submissions.length === 0) {
      alert("Tidak ada karya untuk di-ekspor.");
      return;
    }

    const headers = [
      "ID Tiket", "Nama Lengkap", "Email", "Sekolah", "Provinsi", "Kategori Lomba", 
      "Gelombang", "Tautan Karya", "Tanggal Pendaftaran"
    ];

    const rows = submissions.map(e => {
      let submissionUrl = "";
      try {
        submissionUrl = JSON.parse(e.notes).submission_url || "";
      } catch (err) {}

      return [
        `NCC-${generateTicketCode(e.id)}`,
        e.full_name || "-",
        e.email || "-",
        e.school_name || e.school || "-",
        e.province || e.city || "-",
        e.competition_type || e.category || "-",
        getParticipantWave(e.created_at),
        submissionUrl,
        new Date(e.created_at).toLocaleString('id-ID')
      ];
    });

    const csvContent = [headers, ...rows].map(row => 
      row.map(cell => `"${(cell || "").toString().replace(/"/g, '""')}"`).join(",")
    ).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Daftar_Karya_NCC13_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- 🏫 KELOMPOK SEKOLAH BERDASARKAN NPSN ---
  const schoolGroups = React.useMemo(() => {
    const groups: Record<string, { schoolName: string; npsn: string; students: any[] }> = {};
    
    realEntries.forEach((entry: any) => {
      const schoolName = entry.school_name || entry.school || "Sekolah Tanpa Nama";
      const key = entry.npsn || schoolName;
      
      if (!groups[key]) {
        groups[key] = {
          schoolName,
          npsn: entry.npsn || "",
          students: []
        };
      }
      groups[key].students.push(entry);
    });
    
    return Object.values(groups);
  }, [realEntries]);

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
            { id: "BelumDaftar", icon: <AlertTriangle size={18} />, label: "Belum Pilih Lomba", count: unregisteredUsers.length },
            { id: "Verifikasi", icon: <CheckCircle size={18} />, label: "Verifikasi Berkas", count: realEntries.filter((e: any) => e.payment_status === 'Pending').length },
            { id: "Karya", icon: <FolderOpen size={18} />, label: "Pengumpulan Karya", count: realEntries.filter((e: any) => {
              if (!e.notes) return false;
              try {
                return !!JSON.parse(e.notes).submission_url;
              } catch (err) {
                return false;
              }
            }).length },
            { id: "Pengumuman", icon: <Megaphone size={18} />, label: "Siaran Info" },
            { id: "ForumSekolah", icon: <MessageSquare size={18} />, label: "Forum Sekolah" },
            { id: "Kegiatan", icon: <CalendarDays size={18} />, label: "Kegiatan" },
            { id: "Schedule", icon: <Calendar size={18} />, label: "Schedule Lomba" },
            { id: "Media", icon: <ImageIcon size={18} />, label: "Kelola Media" },
            { id: "LLMS", icon: <GraduationCap size={18} />, label: "Manajemen LLMS", badge: "New" },
            { id: "Pengaturan", icon: <Settings size={18} />, label: "Pengaturan" }
          ].map((item) => (
            item.id === "LLMS" || item.id === "Pengaturan" ? (
              <Link
                key={item.id}
                href={item.id === "LLMS" ? "/hq/llms" : "/hq/settings"}
                className="w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 font-bold text-sm bg-white text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 border border-transparent hover:border-indigo-100"
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  {item.label}
                </div>
                {item.badge && (
                  <span className="px-2 py-0.5 bg-indigo-600 text-white text-[8px] font-black rounded-lg animate-pulse">
                    {item.badge}
                  </span>
                )}
              </Link>
            ) : (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 font-bold text-sm ${
                  activeTab === item.id 
                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-200 translate-x-1' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  {item.label}
                </div>
                {item.count !== undefined && (
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${activeTab === item.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {item.count}
                  </span>
                )}
              </button>
            )
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
            <h1 className="text-2xl font-bold text-slate-900">
              {activeTab === "BelumDaftar" ? "Belum Pilih Bidang Lomba" : activeTab === "ForumSekolah" ? "Forum Sekolah (NPSN)" : activeTab}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {activeTab === "Dashboard" && "Pantau pergerakan data pendaftaran NCC 13th."}
              {activeTab === "Peserta" && "Manajemen seluruh data peserta kompetisi."}
              {activeTab === "BelumDaftar" && "Daftar pengguna terdaftar yang belum memilih bidang lomba/kompetisi."}
              {activeTab === "Verifikasi" && "Pusat verifikasi pembayaran dan dokumen."}
              {activeTab === "Karya" && "Manajemen dan direktori pengumpulan karya tulis, video, dan naskah peserta."}
              {activeTab === "ForumSekolah" && "Pantau dan interaksi langsung pada obrolan forum Ruang Sekolah secara real-time."}
              {activeTab === "Kegiatan" && "Kawal gerbang pendaftaran dan fail karya."}
              {activeTab === "Pengaturan" && "Konfigurasi sistem Markas Besar."}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 shadow-sm cursor-pointer hover:bg-slate-50">
              <Calendar size={16} className="text-slate-400" />
              {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
            </div>
            
            {activeTab === "Peserta" && (
              <>
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md shadow-emerald-200 active:scale-95 shrink-0"
                >
                  <Users size={16} />
                  + Tambah Manual
                </button>
                <button 
                  onClick={() => setShowImportModal(true)}
                  className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md active:scale-95 shrink-0"
                >
                  <FileText size={16} />
                  Import CSV
                </button>
              </>
            )}

            {activeTab !== "BelumDaftar" && (
              <button 
                onClick={handleExportCSV}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md shadow-blue-200"
              >
                <Download size={18} />
                Export CSV
              </button>
            )}
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
          <StatCard title="Total Pendaftar" value={realEntries.length.toString()} trend="Live" isUp={true} isLoading={isLoading} />
          <StatCard title="Terverifikasi" value={realEntries.filter(e => e.payment_status === 'Verified').length.toString()} trend="Aman" isUp={true} isLoading={isLoading} />
          <StatCard title="Menunggu Review" value={realEntries.filter(e => e.payment_status === 'Pending').length.toString()} trend="Action Needed" isUp={false} isLoading={isLoading} />
          <StatCard title="Estimasi Dana" value={`Rp ${(realEntries.length * 150000).toLocaleString('id-ID')}`} trend="IDR" isUp={true} isLoading={isLoading} />
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
              {isLoading ? (
                <div className="w-full h-full bg-slate-50 border border-slate-100 rounded-2xl animate-pulse flex flex-col items-center justify-center text-slate-400 font-bold text-xs gap-2">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent animate-spin rounded-full"></div>
                  Memuat tren pendaftaran...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dynamicChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12}} dx={-10} />
                    <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                    <Line type="monotone" dataKey="pendaftar" stroke="#2563EB" strokeWidth={3} dot={{r: 4, fill: '#2563EB', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-md backdrop-saturate-150 p-6 rounded-2xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
             <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-800">Peminat Kategori</h3>
              <MoreHorizontal size={20} className="text-slate-400" />
            </div>
            <div className="h-64 w-full">
              {isLoading ? (
                <div className="w-full h-full bg-slate-50 border border-slate-100 rounded-2xl animate-pulse flex flex-col items-center justify-center text-slate-400 font-bold text-xs gap-2">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent animate-spin rounded-full"></div>
                  Memuat data peminat...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dynamicBarData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12}} dy={10} />
                    <Tooltip cursor={{fill: '#F1F5F9'}} contentStyle={{borderRadius: '12px', border: 'none'}} />
                    <Bar dataKey="total" fill="#3B82F6" radius={[6, 6, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
          </>
        )}

        {/* 🎛️ KONTEN TAB: PESERTA (BUKU INDUK + LIVE SEARCH) */}
        {activeTab === "Peserta" && (
          <div className="bg-white border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] rounded-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
                <div>
                  <h3 className="font-bold text-slate-800">Buku Induk Peserta Resmi</h3>
                  <p className="text-xs text-slate-500 mt-1">Database lengkap peserta terverifikasi NCC 13th.</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-start lg:justify-end">
                  <span className="bg-blue-50 text-blue-700 px-3.5 py-1.5 rounded-xl text-xs font-black border border-blue-100 shadow-sm shrink-0 flex items-center gap-1.5 min-w-[130px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    {isLoading ? (
                      <span className="inline-block w-8 h-3 bg-blue-200/50 rounded animate-pulse"></span>
                    ) : (
                      `Total Tiket Aktif: ${realEntries.filter(e => e.payment_status === 'Verified').length}`
                    )}
                  </span>
                  <span className="bg-sky-50 text-sky-700 px-3.5 py-1.5 rounded-xl text-xs font-black border border-sky-100 shadow-sm shrink-0 flex items-center gap-1.5 min-w-[120px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                    {waves[0]?.name?.split(" (")[0] || "Gelombang 1"}: {isLoading ? (
                      <span className="inline-block w-6 h-3 bg-sky-200/50 rounded animate-pulse"></span>
                    ) : (
                      realEntries.filter(e => {
                        const wName = getParticipantWave(e.created_at);
                        return wName.toLowerCase().includes("gelombang 1") || wName.toLowerCase().includes("early bird");
                      }).length
                    )}
                  </span>
                  <span className="bg-amber-50 text-amber-700 px-3.5 py-1.5 rounded-xl text-xs font-black border border-amber-100 shadow-sm shrink-0 flex items-center gap-1.5 min-w-[120px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    {waves[1]?.name?.split(" (")[0] || "Gelombang 2"}: {isLoading ? (
                      <span className="inline-block w-6 h-3 bg-amber-200/50 rounded animate-pulse"></span>
                    ) : (
                      realEntries.filter(e => {
                        const wName = getParticipantWave(e.created_at);
                        return wName.toLowerCase().includes("gelombang 2") || wName.toLowerCase().includes("regular");
                      }).length
                    )}
                  </span>
                  <span className="bg-slate-50 text-slate-600 px-3.5 py-1.5 rounded-xl text-xs font-black border border-slate-200 shadow-sm shrink-0 flex items-center gap-1.5 min-w-[100px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                    Total Semua: {isLoading ? (
                      <span className="inline-block w-6 h-3 bg-slate-200/50 rounded animate-pulse"></span>
                    ) : (
                      realEntries.length
                    )}
                  </span>
                </div>
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
                    placeholder="Cari nama, email, atau ID tiket (misal: NCC-9232)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-slate-700"
                  />
                </div>
                
                {/* Dropdown Kategori Lomba */}
                <div className="relative w-full md:w-44">
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

                {/* Dropdown Status Pembayaran */}
                <div className="relative w-full md:w-44">
                  <select
                    value={filterProgress}
                    onChange={(e) => setFilterProgress(e.target.value)}
                    className="w-full pl-4 pr-10 py-2.5 bg-white/90 backdrop-blur-md border border-white/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 appearance-none text-slate-700 font-medium shadow-sm"
                  >
                    <option value="All">Semua Status</option>
                    <option value="Verified">✅ Verified</option>
                    <option value="Pending">⏳ Pending</option>
                    <option value="Unpaid">❌ Belum Bayar</option>
                    <option value="Rejected">🚫 Ditolak</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Filter size={14} className="text-slate-400" />
                  </div>
                </div>

                {/* Dropdown Gelombang */}
                <div className="relative w-full md:w-44">
                  <select
                    value={filterWave}
                    onChange={(e) => setFilterWave(e.target.value)}
                    className="w-full pl-4 pr-10 py-2.5 bg-white/90 backdrop-blur-md border border-white/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 appearance-none text-slate-700 font-medium shadow-sm transition-all"
                  >
                    <option value="All">Semua Gelombang</option>
                    <option value="Gelombang 1">Gelombang 1</option>
                    <option value="Gelombang 2">Gelombang 2</option>
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
                    <th className="py-4 px-6">GELOMBANG</th>
                    <th className="py-4 px-6">PROGRES</th>
                    <th className="py-4 px-6">KATEGORI & PEMBINA</th>
                    <th className="py-4 px-6">WAKTU DAFTAR</th>
                    <th className="py-4 px-6">STATUS</th>
                    <th className="py-4 px-6 text-center">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => <ParticipantSkeletonRow key={i} />)
                ) : realEntries
                    .filter(e => {
                      // Filter status: All shows everyone, or filter by specific payment_status
                      if (filterProgress === "All") return true;
                      return e.payment_status === filterProgress;
                    })
                    .filter(e => {
                      if (filterWave === "All") return true;
                      const wName = getParticipantWave(e.created_at);
                      if (filterWave === "Gelombang 1") {
                        return wName.toLowerCase().includes("gelombang 1") || wName.toLowerCase().includes("early bird");
                      }
                      if (filterWave === "Gelombang 2") {
                        return wName.toLowerCase().includes("gelombang 2") || wName.toLowerCase().includes("regular");
                      }
                      return true;
                    })
                    .filter(e => {
                      if (!searchQuery) return true;
                      const query = searchQuery.toLowerCase();
                      return (e.full_name || "").toLowerCase().includes(query) || 
                             (e.email || "").toLowerCase().includes(query) || 
                             `ncc-${generateTicketCode(e.id)}`.toLowerCase().includes(query);
                    })
                    .filter(e => filterCategory === "All" || (e.competition_type || e.category) === filterCategory)
                    .length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-16 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                              <Users size={28} className="text-slate-300" />
                            </div>
                            <p className="text-slate-500 font-semibold text-sm">
                              {realEntries.length === 0 
                                ? "Belum ada peserta yang mendaftar."
                                : "Tidak ada peserta yang cocok dengan filter Anda."
                              }
                            </p>
                            {realEntries.length === 0 && (
                              <p className="text-slate-400 text-xs max-w-xs text-center">
                                Data akan muncul setelah peserta mengisi formulir pendaftaran kompetisi di halaman dashboard mereka.
                              </p>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                    realEntries
                      .filter(e => {
                        if (filterProgress === "All") return true;
                        return e.payment_status === filterProgress;
                      })
                      .filter(e => {
                        if (filterWave === "All") return true;
                        const wName = getParticipantWave(e.created_at);
                        if (filterWave === "Gelombang 1") {
                          return wName.toLowerCase().includes("gelombang 1") || wName.toLowerCase().includes("early bird");
                        }
                        if (filterWave === "Gelombang 2") {
                          return wName.toLowerCase().includes("gelombang 2") || wName.toLowerCase().includes("regular");
                        }
                        return true;
                      })
                      .filter(e => {
                        if (!searchQuery) return true;
                        const query = searchQuery.toLowerCase();
                        return (e.full_name || "").toLowerCase().includes(query) || 
                               (e.email || "").toLowerCase().includes(query) || 
                               `ncc-${generateTicketCode(e.id)}`.toLowerCase().includes(query);
                      })
                      .filter(e => filterCategory === "All" || (e.competition_type || e.category) === filterCategory)
                      .map((entry: any) => (
                        <ParticipantRow 
                          key={entry.id} 
                          entry={entry}
                          waveName={getParticipantWave(entry.created_at)}
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

        {/* 🎛️ KONTEN TAB: BELUM PILIH LOMBA */}
        {activeTab === "BelumDaftar" && (
          <div className="bg-white border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] rounded-2xl overflow-hidden flex flex-col animate-in fade-in duration-500">
            <div className="p-6 border-b border-slate-100">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
                <div>
                  <h3 className="font-bold text-slate-800">Daftar Pengguna Belum Pilih Lomba</h3>
                  <p className="text-xs text-slate-500 mt-1">Daftar peserta terdaftar yang belum melakukan pengisian formulir bidang lomba.</p>
                </div>
                
                <div className="flex items-center gap-2.5 shrink-0">
                  <span className="bg-amber-50 text-amber-700 px-3.5 py-1.5 rounded-xl text-xs font-black border border-amber-100 shadow-sm flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                    Belum Pilih Bidang: {isLoadingUnregistered ? (
                      <span className="inline-block w-6 h-3 bg-amber-200/50 rounded animate-pulse"></span>
                    ) : (
                      unregisteredUsers.length
                    )}
                  </span>
                </div>
              </div>

              {/* 🔍 BARIS PENCARI */}
              <div className="flex gap-4 items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    value={searchUnregisteredQuery}
                    onChange={(e) => setSearchUnregisteredQuery(e.target.value)}
                    placeholder="Cari berdasarkan nama lengkap, username, email, atau sekolah..."
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white transition-all font-medium placeholder-slate-400 text-slate-700 shadow-inner"
                  />
                  {searchUnregisteredQuery && (
                    <button
                      onClick={() => setSearchUnregisteredQuery("")}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 whitespace-nowrap">
                <thead className="bg-slate-50/50 text-slate-500 font-bold border-b border-slate-100 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-4 px-6 text-center">NO</th>
                    <th className="py-4 px-6">PROFIL PENGGUNA</th>
                    <th className="py-4 px-6">EMAIL</th>
                    <th className="py-4 px-6">PASSWORD / AKSES</th>
                    <th className="py-4 px-6">NOMOR TELEPON (WA)</th>
                    <th className="py-4 px-6">ASAL SEKOLAH</th>
                    <th className="py-4 px-6">TANGGAL REGISTRASI</th>
                    <th className="py-4 px-6">STATUS</th>
                    <th className="py-4 px-6 text-center">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                {isLoadingUnregistered ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-5 px-6 text-center"><div className="h-4 w-4 bg-slate-200 rounded mx-auto"></div></td>
                      <td className="py-5 px-6">
                        <div className="flex flex-col gap-2">
                          <div className="h-4 w-32 bg-slate-200 rounded"></div>
                          <div className="h-3 w-20 bg-slate-200 rounded"></div>
                        </div>
                      </td>
                      <td className="py-5 px-6"><div className="h-4 w-40 bg-slate-200 rounded"></div></td>
                      <td className="py-5 px-6"><div className="h-4 w-20 bg-slate-200 rounded"></div></td>
                      <td className="py-5 px-6"><div className="h-4 w-28 bg-slate-200 rounded"></div></td>
                      <td className="py-5 px-6"><div className="h-4 w-36 bg-slate-200 rounded"></div></td>
                      <td className="py-5 px-6"><div className="h-4 w-24 bg-slate-200 rounded"></div></td>
                      <td className="py-5 px-6"><div className="h-6 w-28 bg-slate-200 rounded"></div></td>
                      <td className="py-5 px-6 text-center"><div className="h-8 w-16 bg-slate-200 rounded mx-auto"></div></td>
                    </tr>
                  ))
                ) : unregisteredUsers
                    .filter(u => {
                      if (!searchUnregisteredQuery) return true;
                      const q = searchUnregisteredQuery.toLowerCase();
                      return (u.fullName || "").toLowerCase().includes(q) ||
                             (u.email || "").toLowerCase().includes(q) ||
                             (u.username || "").toLowerCase().includes(q) ||
                             (u.school || "").toLowerCase().includes(q);
                    })
                    .length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-16 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                              <Users size={28} className="text-slate-300" />
                            </div>
                            <p className="text-slate-500 font-semibold text-sm">
                              {unregisteredUsers.length === 0 
                                ? "Semua pengguna terdaftar sudah memilih bidang lomba!"
                                : "Tidak ada pengguna yang cocok dengan pencarian Anda."
                              }
                            </p>
                            {unregisteredUsers.length === 0 && (
                              <p className="text-slate-400 text-xs max-w-xs text-center">
                                Kerja bagus! Seluruh pendaftar di database Anda telah sukses melakukan pendaftaran kategori lomba secara lengkap.
                              </p>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      unregisteredUsers
                        .filter(u => {
                          if (!searchUnregisteredQuery) return true;
                          const q = searchUnregisteredQuery.toLowerCase();
                          return (u.fullName || "").toLowerCase().includes(q) ||
                                 (u.email || "").toLowerCase().includes(q) ||
                                 (u.username || "").toLowerCase().includes(q) ||
                                 (u.school || "").toLowerCase().includes(q);
                        })
                        .map((user: any, index: number) => {
                          const formattedDate = new Date(user.createdAt).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          });

                          return (
                            <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                              <td className="py-4 px-6 text-center font-bold text-slate-400 text-xs">{index + 1}</td>
                              <td className="py-4 px-6">
                                <div className="flex flex-col">
                                  <span className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors text-sm">{user.fullName}</span>
                                  <span className="text-xs text-slate-400 font-mono mt-0.5">@{user.username}</span>
                                </div>
                              </td>
                              <td className="py-4 px-6 font-medium text-slate-600">{user.email}</td>
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs text-slate-600 font-bold tracking-wider">
                                    {revealedPasswords[user.id] ? user.password : "••••••••"}
                                  </span>
                                  <button
                                    onClick={() => setRevealedPasswords(prev => ({ ...prev, [user.id]: !prev[user.id] }))}
                                    className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded hover:bg-slate-100"
                                    title={revealedPasswords[user.id] ? "Sembunyikan Password" : "Tampilkan Password"}
                                  >
                                    {revealedPasswords[user.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                                  </button>
                                </div>
                              </td>
                              <td className="py-4 px-6 text-slate-600 font-mono text-xs">{user.phone || "-"}</td>
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-1.5">
                                  <School size={14} className="text-slate-400" />
                                  <span className="font-semibold text-slate-600 text-xs">{user.school || "-"}</span>
                                </div>
                              </td>
                              <td className="py-4 px-6 text-slate-400 text-xs font-medium">{formattedDate}</td>
                              <td className="py-4 px-6">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-100 shadow-sm animate-pulse">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                  Belum Pilih Lomba
                                </span>
                              </td>
                              <td className="py-4 px-6 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => {
                                      if (user.email) {
                                        navigator.clipboard.writeText(user.email);
                                        showToast("Email berhasil disalin!", "success");
                                      }
                                    }}
                                    title="Salin Email"
                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all active:scale-95 border border-transparent hover:border-blue-100 shadow-sm"
                                  >
                                    <Send size={14} />
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (!user.phone || user.phone === "-") {
                                        showToast("Nomor HP tidak dicantumkan oleh pengguna.", "error");
                                        return;
                                      }
                                      let formattedPhone = user.phone.replace(/[^0-9]/g, "");
                                      if (formattedPhone.startsWith("0")) {
                                        formattedPhone = "62" + formattedPhone.slice(1);
                                      } else if (formattedPhone.startsWith("8")) {
                                        formattedPhone = "62" + formattedPhone;
                                      }
                                      const text = `Halo ${user.fullName}, kami dari panitia NCC 13th melihat Anda telah mendaftarkan akun di portal tetapi belum memilih kategori bidang lomba Anda.\n\nBerikut adalah data akun Anda untuk masuk:\n📧 Email: ${user.email}\n🔑 Password: ${user.password}\n\nSilakan login ke https://national-creativity-competition.vercel.app/login untuk memilih bidang lomba dan melengkapi pendaftaran Anda.\n\nApakah ada kendala yang bisa kami bantu?`;
                                      window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`, "_blank");
                                    }}
                                    title="Hubungi via WhatsApp"
                                    className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all active:scale-95 border border-transparent hover:border-emerald-100 shadow-sm"
                                  >
                                    <MessageSquare size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                    )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 🎛️ KONTEN TAB: PENGUMPULAN KARYAN */}

        {/* 🎛️ KONTEN TAB: PENGUMPULAN KARYA */}
        {activeTab === "Karya" && (
          <div className="bg-white border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] rounded-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
                <div>
                  <h3 className="font-bold text-slate-800">Direktori Pengumpulan Karya Peserta</h3>
                  <p className="text-xs text-slate-500 mt-1">Daftar karya/submission yang telah diunggah oleh peserta resmi NCC 13th.</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-start lg:justify-end">
                  {/* Total Karya */}
                  <span className="bg-emerald-50 text-emerald-700 px-3.5 py-1.5 rounded-xl text-xs font-black border border-emerald-100 shadow-sm shrink-0 flex items-center gap-1.5 min-w-[110px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Total Karya: {isLoading ? (
                      <span className="inline-block w-6 h-3 bg-emerald-200/50 rounded animate-pulse"></span>
                    ) : (
                      realEntries.filter(e => {
                        if (!e.notes) return false;
                        try { return !!JSON.parse(e.notes).submission_url; } catch (err) { return false; }
                      }).length
                    )}
                  </span>
                  {/* Gelombang 1 */}
                  <span className="bg-sky-50 text-sky-700 px-3.5 py-1.5 rounded-xl text-xs font-black border border-sky-100 shadow-sm shrink-0 flex items-center gap-1.5 min-w-[120px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                    {waves[0]?.name?.split(" (")[0] || "Gelombang 1"}: {isLoading ? (
                      <span className="inline-block w-6 h-3 bg-sky-200/50 rounded animate-pulse"></span>
                    ) : (
                      realEntries.filter(e => {
                        if (!e.notes) return false;
                        try {
                          if (!JSON.parse(e.notes).submission_url) return false;
                          const wName = getParticipantWave(e.created_at);
                          return wName.toLowerCase().includes("gelombang 1") || wName.toLowerCase().includes("early bird");
                        } catch (err) { return false; }
                      }).length
                    )}
                  </span>
                  {/* Gelombang 2 */}
                  <span className="bg-amber-50 text-amber-700 px-3.5 py-1.5 rounded-xl text-xs font-black border border-amber-100 shadow-sm shrink-0 flex items-center gap-1.5 min-w-[120px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    {waves[1]?.name?.split(" (")[0] || "Gelombang 2"}: {isLoading ? (
                      <span className="inline-block w-6 h-3 bg-amber-200/50 rounded animate-pulse"></span>
                    ) : (
                      realEntries.filter(e => {
                        if (!e.notes) return false;
                        try {
                          if (!JSON.parse(e.notes).submission_url) return false;
                          const wName = getParticipantWave(e.created_at);
                          return wName.toLowerCase().includes("gelombang 2") || wName.toLowerCase().includes("regular");
                        } catch (err) { return false; }
                      }).length
                    )}
                  </span>
                  {/* Ekspor CSV Karya Button */}
                  <button
                    onClick={handleExportKaryaCSV}
                    className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-black transition-all shadow-md active:scale-95 shrink-0"
                  >
                    <Download size={13} />
                    Ekspor CSV Karya
                  </button>
                </div>
              </div>

              {/* 🔍 BARIS PENCARIAN & FILTER KELOMPOK LOMBA */}
              <div className="flex flex-col md:flex-row gap-4 items-center">
                {/* Kolom Pencarian */}
                <div className="relative flex-1 w-full">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={16} className="text-slate-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Cari nama peserta, email, atau asal sekolah..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-slate-700"
                  />
                </div>
                
                {/* Selector Pembagian Kategori (LKTI, MIPA, SPEECH, MTQ) dan Filter Gelombang */}
                <div className="flex flex-wrap gap-2.5 w-full md:w-auto items-center">
                  {/* Kategori Lomba */}
                  <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/60 shadow-inner">
                    {[
                      { value: "All", label: "Semua Lomba" },
                      { value: "LKTI Nasional", label: "LKTI" },
                      { value: "Olimpiade MIPA", label: "MIPA" },
                      { value: "Speech Contest", label: "Speech" },
                      { value: "MTQ Nasional", label: "MTQ" }
                    ].map((tab) => (
                      <button
                        key={tab.value}
                        onClick={() => setFilterCategory(tab.value)}
                        className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${
                          filterCategory === tab.value
                            ? 'bg-white text-slate-800 shadow-sm border border-slate-200/40'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Filter Gelombang */}
                  <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/60 shadow-inner">
                    {[
                      { value: "All", label: "Semua Gelombang" },
                      { value: "Gelombang 1", label: "Gelombang 1" },
                      { value: "Gelombang 2", label: "Gelombang 2" }
                    ].map((wTab) => (
                      <button
                        key={wTab.value}
                        onClick={() => setFilterWave(wTab.value)}
                        className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${
                          filterWave === wTab.value
                            ? 'bg-white text-slate-800 shadow-sm border border-slate-200/40'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {wTab.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 whitespace-nowrap">
                <thead className="bg-slate-50/50 text-slate-500 font-bold border-b border-slate-100 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-4 px-6">ID TIKET</th>
                    <th className="py-4 px-6">PESERTA</th>
                    <th className="py-4 px-6">ASAL SEKOLAH</th>
                    <th className="py-4 px-6">GELOMBANG</th>
                    <th className="py-4 px-6">BIDANG LOMBA</th>
                    <th className="py-4 px-6">TAUTAN KARYA</th>
                    <th className="py-4 px-6 text-center">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => <KaryaSkeletonRow key={i} />)
                  ) : (() => {
                    const filtered = realEntries
                      .filter(e => {
                        // Hanya tampilkan yang sudah memiliki submission_url di notes
                        if (!e.notes) return false;
                        try {
                          return !!JSON.parse(e.notes).submission_url;
                        } catch (err) { return false; }
                      })
                      .filter(e => {
                        if (filterCategory === "All") return true;
                        // Cocokkan kategori
                        const cat = e.competition_type || e.category || "";
                        if (filterCategory === "MTQ Nasional") {
                          return cat === "MTQ" || cat === "MTQ Nasional";
                        }
                        return cat === filterCategory;
                      })
                      .filter(e => {
                        if (filterWave === "All") return true;
                        const wName = getParticipantWave(e.created_at);
                        if (filterWave === "Gelombang 1") {
                          return wName.toLowerCase().includes("gelombang 1") || wName.toLowerCase().includes("early bird");
                        }
                        if (filterWave === "Gelombang 2") {
                          return wName.toLowerCase().includes("gelombang 2") || wName.toLowerCase().includes("regular");
                        }
                        return true;
                      })
                      .filter(e => {
                        if (!searchQuery) return true;
                        const query = searchQuery.toLowerCase();
                        return (e.full_name || "").toLowerCase().includes(query) || 
                               (e.email || "").toLowerCase().includes(query) || 
                               (e.school_name || e.school || "").toLowerCase().includes(query) ||
                               `ncc-${generateTicketCode(e.id)}`.toLowerCase().includes(query);
                      });

                    if (filtered.length === 0) {
                      return (
                        <tr>
                          <td colSpan={7} className="py-16 text-center">
                            <div className="flex flex-col items-center gap-3">
                              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                                <FolderOpen size={28} className="text-slate-300" />
                              </div>
                              <p className="text-slate-500 font-semibold text-sm">
                                Belum ada karya yang diunggah untuk kategori/gelombang ini.
                              </p>
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    return filtered.map((entry: any) => {
                      let submissionUrl = "";
                      try {
                        submissionUrl = JSON.parse(entry.notes).submission_url || "";
                      } catch (err) {}

                      return (
                        <tr 
                          key={entry.id} 
                          className="hover:bg-slate-50/50 transition-colors"
                        >
                          <td className="py-4 px-6 font-black text-blue-600">
                            NCC-{generateTicketCode(entry.id)}
                          </td>
                          <td className="py-4 px-6">
                            <div className="font-bold text-slate-800">{entry.full_name || "Peserta Anonim"}</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">{entry.email}</div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="font-bold text-slate-700">{entry.school_name || entry.school || "-"}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{entry.province || "-"}</div>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-colors ${
                              getParticipantWave(entry.created_at).toLowerCase().includes("gelombang 2") ||
                              getParticipantWave(entry.created_at).toLowerCase().includes("regular")
                                ? 'bg-amber-50 text-amber-700 border-amber-100/80 hover:bg-amber-100/50'
                                : 'bg-sky-50 text-sky-700 border-sky-100/80 hover:bg-sky-100/50'
                            }`}>
                              {getParticipantWave(entry.created_at).split(" (")[0]}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-xl text-xs font-bold border border-indigo-100">
                              {entry.competition_type || entry.category}
                            </span>
                          </td>
                          <td className="py-4 px-6 max-w-xs">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                              <a 
                                href={submissionUrl} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="text-xs text-blue-600 font-bold hover:underline truncate max-w-[200px]"
                                title={submissionUrl}
                              >
                                {submissionUrl}
                              </a>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <a 
                                href={submissionUrl} 
                                target="_blank" 
                                rel="noreferrer"
                                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl font-bold text-xs transition-all shadow-sm active:scale-95"
                              >
                                <FolderOpen size={13} />
                                Buka Karya
                              </a>
                              <button 
                                onClick={() => setSelectedParticipant(entry)}
                                className="p-2 bg-slate-50 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
                                title="Lihat Detail Administrasi"
                              >
                                <Eye size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    });
                  })()}
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
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Kolom Kiri: Form Siaran Baru */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Header Ruangan */}
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-200/50">
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
                                    <span className="text-[10px] text-slate-500 font-medium">NCC-{entry.id ? generateTicketCode(entry.id) : "-"} • {entry.competition_type || entry.category || "Belum Pilih"}</span>
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

              {/* Kolom Kanan: Riwayat Siaran */}
              <div className="lg:col-span-5 space-y-6 lg:border-l lg:border-slate-100 lg:pl-8">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
                    <History size={20} className="text-slate-500" />
                    Riwayat Siaran Komando
                    {broadcasts.length > 0 && (
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                        {broadcasts.length}
                      </span>
                    )}
                  </h3>
                  <p className="text-slate-400 text-xs mt-1">Daftar pesan resmi yang telah disiarkan sebelumnya.</p>
                </div>

                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {isFetchingBroadcasts ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-3">
                      <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin"></div>
                      <span className="text-xs font-medium">Memuat riwayat siaran...</span>
                    </div>
                  ) : broadcasts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                      <MegaphoneOff size={36} className="text-slate-300 mb-3" />
                      <span className="text-xs font-semibold text-slate-600">Belum Ada Riwayat</span>
                      <span className="text-[10px] text-slate-400 mt-1">Semua siaran baru akan tercatat di sini.</span>
                    </div>
                  ) : (
                    broadcasts.map((broadcast) => {
                      const { label, style } = getAudienceLabelAndStyle(broadcast.target_audience);
                      return (
                        <div 
                          key={broadcast.id} 
                          className="bg-white/80 backdrop-blur-md border border-slate-200/60 p-4 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:shadow-md hover:border-slate-300/80 transition-all duration-300 relative group"
                        >
                          <div className="flex justify-between items-center gap-4 mb-2 pr-12">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${style}`}>
                              {label}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {formatBroadcastDate(broadcast.created_at)}
                            </span>
                          </div>
                          
                          <h4 className="text-sm font-bold text-slate-800 leading-snug pr-12 group-hover:text-blue-600 transition-colors">
                            {broadcast.title}
                          </h4>
                          
                          <p className="text-slate-600 text-xs mt-1.5 leading-relaxed whitespace-pre-wrap line-clamp-4">
                            {broadcast.message}
                          </p>

                          {/* Tombol Hapus - Selalu Terlihat Jelas */}
                          <button
                            onClick={() => handleDeleteBroadcast(broadcast.id)}
                            className="absolute right-3 top-3 p-2 text-rose-500 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-100 hover:border-rose-600 rounded-xl transition-all duration-200 cursor-pointer shadow-sm"
                            title="Hapus Siaran"
                          >
                            <Trash2 size={13} strokeWidth={2.5} />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
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

                        {/* 6. TAB: DYNAMIC HOMEPAGE CMS */}
          {activeTab === 'Schedule' && (
            <HomepageCMS />
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
            {/* 1. MANAJEMEN GALERI BERANDA */}
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
                <div className="flex items-center gap-3">
                  {dashboardAssets.gallery_images && dashboardAssets.gallery_images.length > 0 && (
                    <button
                      onClick={() => {
                        if (confirm("Apakah Anda yakin ingin menghapus semua foto di galeri ini? Tindakan ini tidak dapat dibatalkan.")) {
                          setDashboardAssets((prev: any) => ({ ...prev, gallery_images: [] }));
                          showToast("Seluruh foto galeri berhasil dibersihkan.", "success");
                        }
                      }}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all active:scale-95 flex items-center gap-2"
                    >
                      <Trash2 size={16} />
                      Bersihkan Galeri
                    </button>
                  )}
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



        {/* 💬 KONTEN TAB: FORUM SEKOLAH (NPSN CHAT HUB) */}
        {activeTab === "ForumSekolah" && (
          <div className="flex gap-6 h-[calc(100vh-210px)] overflow-hidden">
            
            {/* PANEL KIRI: Daftar Sekolah (NPSN) */}
            <div className="w-80 bg-white border border-slate-100 shadow-sm rounded-3xl p-5 flex flex-col h-full overflow-hidden">
              <div className="relative mb-4 shrink-0">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={14} className="text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="Cari sekolah atau NPSN..."
                  value={searchSchoolQuery}
                  onChange={(e) => setSearchSchoolQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700 placeholder:text-slate-400 shadow-inner"
                />
              </div>

              {/* Scrollable School List */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {schoolGroups
                  .filter(group => 
                    group.schoolName.toLowerCase().includes(searchSchoolQuery.toLowerCase()) ||
                    group.npsn.includes(searchSchoolQuery)
                  )
                  .map((group, idx) => {
                    const isSelected = selectedSchoolGroup && (
                      (selectedSchoolGroup.npsn && selectedSchoolGroup.npsn === group.npsn) ||
                      (!selectedSchoolGroup.npsn && selectedSchoolGroup.schoolName === group.schoolName)
                    );

                    return (
                      <button
                        key={group.npsn || group.schoolName || idx}
                        onClick={() => setSelectedSchoolGroup(group)}
                        className={`w-full text-left p-3.5 border rounded-2xl transition-all flex items-center gap-3 active:scale-[0.98] ${
                          isSelected
                            ? "bg-indigo-600 text-white border-indigo-700 shadow-md shadow-indigo-100"
                            : "bg-white border-slate-100 hover:bg-slate-50 text-slate-700 hover:shadow-sm"
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-xl font-extrabold text-xs flex items-center justify-center shrink-0 border uppercase tracking-wider ${
                          isSelected
                            ? "bg-white/20 text-white border-white/20"
                            : "bg-indigo-50 text-indigo-600 border-indigo-100 shadow-sm"
                        }`}>
                          {group.schoolName.charAt(0)}
                        </div>
                        <div className="overflow-hidden min-w-0">
                          <h4 className={`font-bold text-xs truncate uppercase tracking-tight ${isSelected ? "text-white" : "text-slate-800"}`}>
                            {group.schoolName}
                          </h4>
                          <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                            {group.npsn ? (
                              <span className={`font-mono text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                isSelected ? "bg-white/10 text-white border border-white/10" : "bg-slate-100 text-slate-400 border border-slate-200"
                              }`}>
                                NPSN: {group.npsn}
                              </span>
                            ) : (
                              <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded border ${
                                isSelected ? "bg-white/10 text-white border-white/10" : "bg-amber-50 text-amber-600 border-amber-100 animate-pulse"
                              }`}>
                                Tanpa NPSN
                              </span>
                            )}
                            <span className={`text-[9px] font-bold ${isSelected ? "text-white/80" : "text-slate-400"}`}>
                              • {group.students.length} Siswa
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* PANEL KANAN: Chat Space */}
            <div className="flex-1 bg-white border border-slate-100 shadow-sm rounded-3xl overflow-hidden flex flex-col h-full relative">
              
              {!selectedSchoolGroup ? (
                /* EMPTY STATE */
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-gradient-to-br from-indigo-50/10 via-transparent to-transparent">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500 mb-4 shadow-sm animate-bounce">
                    <MessageSquare size={28} />
                  </div>
                  <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">Pilih Forum Sekolah</h3>
                  <p className="text-xs text-slate-400 mt-1.5 max-w-[280px] leading-relaxed mx-auto">
                    Silakan pilih salah satu sekolah di panel kiri untuk membuka obrolan kelompok peserta, memantau forum, dan mengirim pesan moderasi.
                  </p>
                </div>
              ) : (
                /* CHAT BOX */
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                  
                  {/* Chat Header */}
                  <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between gap-4 shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 shadow-sm">
                        <School size={20} />
                      </div>
                      <div>
                        <h3 className="font-black text-slate-800 text-sm tracking-tight uppercase">{selectedSchoolGroup.schoolName}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          {selectedSchoolGroup.npsn && (
                            <span className="bg-indigo-100 text-indigo-700 font-mono text-[9px] font-extrabold px-1.5 py-0.5 rounded border border-indigo-200/50">
                              NPSN: {selectedSchoolGroup.npsn}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            {selectedSchoolGroup.students.length} Peserta Resmi Terdaftar
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setShowSchoolMembers(true)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100/80 hover:border-indigo-200/80 rounded-2xl text-xs font-bold transition-all shadow-sm hover:shadow active:scale-95"
                    >
                      <Users size={14} />
                      Daftar Anggota
                    </button>
                  </div>

                  {/* Message Thread Scroll Area */}
                  <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar bg-slate-50/20 flex flex-col">
                    {isLoadingGroupMessages ? (
                      <div className="h-full flex flex-col items-center justify-center">
                        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Memuat percakapan...</p>
                      </div>
                    ) : groupMessages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center py-10 opacity-60">
                        <MessageSquare size={36} className="text-slate-200 mb-3" />
                        <h4 className="font-bold text-slate-600 text-xs">Belum Ada Percakapan</h4>
                        <p className="text-[11px] text-slate-400 mt-1 max-w-[240px]">
                          Belum ada peserta yang memulai diskusi di forum sekolah ini.
                        </p>
                      </div>
                    ) : (
                      groupMessages.map((msg, index) => {
                        const isAdmin = msg.sender_id === "hq-admin" || msg.sender_id === "admin1";
                        const isMsgByAdmin = msg.sender_id === "hq-admin" || msg.sender_id === "admin1";
                        const dateObj = new Date(msg.created_at);
                        const timeStr = dateObj.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

                        return (
                          <div
                            key={msg.id || index}
                            className={`flex flex-col max-w-[80%] relative group/bubble ${isAdmin ? "self-end items-end" : "self-start items-start"}`}
                          >
                            <span className="text-[10px] text-slate-400 font-bold mb-1 ml-1.5 uppercase tracking-wider flex items-center gap-1.5">
                              {msg.sender_name}
                              {isAdmin && (
                                <span className="bg-amber-100 text-amber-700 border border-amber-200/50 font-black text-[8px] uppercase px-1.5 rounded-md shadow-sm">
                                  HQ STAFF
                                </span>
                              )}
                            </span>
                            
                            {/* Hover Options Menu (WhatsApp style) */}
                            <div className={`absolute top-1/2 -translate-y-1/2 flex items-center gap-1 bg-white border border-slate-100 shadow-md rounded-full px-2 py-1 z-10 opacity-0 group-hover/bubble:opacity-100 transition-all duration-200 ${isAdmin ? "-left-24" : "-right-24"}`}>
                              {(isMsgByAdmin) && (
                                <button 
                                  onClick={() => { setHqEditingMsg(msg); setHqEditInput(msg.message.replace(/^↪ Diteruskan:\n/, "")); }}
                                  className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-indigo-600 transition-colors"
                                  title="Edit"
                                >
                                  <Pencil size={11} />
                                </button>
                              )}
                              {(isMsgByAdmin || !isAdmin) && (
                                <button 
                                  onClick={() => handleDeleteHqMessage(msg.id)}
                                  className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-rose-600 transition-colors"
                                  title={isMsgByAdmin ? "Hapus" : "Hapus (Moderasi)"}
                                >
                                  <Trash2 size={11} />
                                </button>
                              )}
                              <button 
                                onClick={() => setHqForwardingMsg(msg)}
                                className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-blue-600 transition-colors"
                                title="Teruskan"
                              >
                                <Forward size={11} />
                              </button>
                            </div>

                            <div
                              className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-sm border ${
                                isAdmin
                                  ? "bg-slate-900 text-white border-slate-950 rounded-tr-none shadow-slate-200"
                                  : "bg-white text-slate-700 border-slate-100 rounded-tl-none"
                              }`}
                            >
                              {msg.message.startsWith("↪ Diteruskan:\n") && (
                                <div className={`text-[9px] font-bold flex items-center gap-1 mb-1 pb-1 border-b ${isAdmin ? "text-slate-400 border-slate-800" : "text-slate-400 border-slate-200"}`}>
                                  <Forward size={10} className="italic" />
                                  Diteruskan
                                </div>
                              )}
                              {msg.message.replace(/^↪ Diteruskan:\n/, "")}
                            </div>
                            <span className="text-[9px] text-slate-400 font-medium mt-1 mx-1.5">
                              {timeStr} WIB
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Input form */}
                  <form onSubmit={handleSendGroupMessage} className="p-4 border-t border-slate-100 bg-slate-50/50 flex gap-3 items-center shrink-0">
                    <input
                      type="text"
                      required
                      placeholder={`Ketik pengumuman atau balasan resmi untuk forum ${selectedSchoolGroup.schoolName}...`}
                      value={groupMsgText}
                      onChange={(e) => setGroupMsgText(e.target.value)}
                      disabled={isSendingGroupMsg || isLoadingGroupMessages}
                      className="flex-1 pl-4 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700 placeholder:text-slate-400 shadow-sm disabled:opacity-50"
                    />
                    <button
                      type="submit"
                      disabled={!groupMsgText.trim() || isSendingGroupMsg}
                      className="px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold text-xs flex items-center gap-1.5 shrink-0"
                    >
                      {isSendingGroupMsg ? (
                        <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <><Send size={12} /> KIRIM</>
                      )}
                    </button>
                  </form>

                </div>
              )}

            </div>

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
              
               {renderParticipantAvatar(selectedParticipant)}
              <h3 className="text-2xl font-bold text-slate-800 mb-1">{selectedParticipant.full_name || "Nama tidak tersedia"}</h3>
              <p className="text-slate-500 font-medium mb-6">{selectedParticipant.competition_type || selectedParticipant.category || "Belum ada kategori"}</p>

              <div className="space-y-4">
                <div className="p-4 bg-white/60 border border-slate-100 rounded-xl shadow-sm">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nomor Induk Siswa (NISN)</p>
                  <p className="font-semibold text-slate-800">{selectedParticipant.nisn || "Data Kosong"}</p>
                </div>

                {/* Informasi Login Akun Portal Peserta */}
                <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl shadow-sm space-y-3">
                  <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider mb-1 flex items-center gap-1.5 font-black">
                    <ShieldCheck size={13} className="shrink-0 text-indigo-500" fill="currentColor" />
                    Informasi Login Akun Peserta
                  </p>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Username / Email</p>
                    <p className="font-mono text-xs font-bold text-indigo-700 select-all bg-indigo-100/30 px-2.5 py-1 rounded border border-indigo-100/40 w-max tracking-wide mt-1">
                      {selectedParticipant.email || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Password / Kata Sandi (Akses Akun)</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="font-mono text-xs font-black text-slate-800 tracking-wider bg-slate-100/60 px-2.5 py-1 rounded border border-slate-200/40 select-all">
                        {showToken ? (
                          (() => {
                            let pass = "";
                            if (selectedParticipant.notes) {
                              try {
                                const parsed = JSON.parse(selectedParticipant.notes);
                                pass = parsed.custom_password;
                              } catch (e) {}
                            }
                            return pass || selectedParticipant.nisn || "—";
                          })()
                        ) : "•••••"}
                      </p>
                      <button 
                        type="button"
                        onClick={() => setShowToken(!showToken)}
                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors border border-transparent hover:border-slate-200 flex items-center justify-center shrink-0"
                        title={showToken ? "Sembunyikan Kata Sandi" : "Tampilkan Kata Sandi"}
                      >
                        {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
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

                {/* Informasi Pembina */}
                {selectedParticipant.mentor_name && (
                  <div className="p-4 bg-emerald-50/40 border border-emerald-100/70 rounded-xl shadow-sm space-y-2">
                    <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <GraduationCap size={13} className="shrink-0" />
                      Informasi Pembina / Guru Pendamping
                    </p>
                    {(() => {
                      const rawMentor = selectedParticipant.mentor_name || "";
                      if (rawMentor.includes(" | ")) {
                        const [name, email, phone] = rawMentor.split(" | ");
                        return (
                          <div className="space-y-2">
                            <div>
                              <p className="text-[10px] text-slate-400 font-medium">Nama Pembina</p>
                              <p className="font-semibold text-slate-800">{name || "-"}</p>
                            </div>
                            {email && (
                              <div>
                                <p className="text-[10px] text-slate-400 font-medium">Email Pembina</p>
                                <p className="font-mono text-xs text-slate-700 select-all bg-emerald-100/30 px-1.5 py-0.5 rounded border border-emerald-100/40 w-max">{email}</p>
                              </div>
                            )}
                            {phone && (
                              <div>
                                <p className="text-[10px] text-slate-400 font-medium">No. HP Pembina</p>
                                <p className="font-mono text-xs text-slate-700 select-all bg-emerald-100/30 px-1.5 py-0.5 rounded border border-emerald-100/40 w-max">{phone}</p>
                              </div>
                            )}
                          </div>
                        );
                      }
                      return (
                        <div>
                          <p className="text-[10px] text-slate-400 font-medium">Nama Pembina</p>
                          <p className="font-semibold text-slate-800">{rawMentor || "-"}</p>
                        </div>
                      );
                    })()}
                  </div>
                )}

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
                        {getParticipantStage(selectedParticipant) === 1 ? (
                          getParticipantFailed(selectedParticipant) ? (
                            <span className="text-[10px] font-black text-rose-500 uppercase flex items-center gap-1"><XCircle size={10} className="shrink-0" /> Gagal Penyisihan (1)</span>
                          ) : (
                            <span className="text-[10px] font-black text-slate-400 uppercase">Penyisihan (1)</span>
                          )
                        ) :
                        getParticipantStage(selectedParticipant) === 2 ? (
                          getParticipantFailed(selectedParticipant) ? (
                            <span className="text-[10px] font-black text-rose-500 uppercase flex items-center gap-1"><XCircle size={10} className="shrink-0" /> Gagal Semi Final (2)</span>
                          ) : (
                            <span className="text-[10px] font-black text-blue-600 uppercase">Semi Final (2)</span>
                          )
                        ) :
                        getParticipantStage(selectedParticipant) === 3 ? (
                          <span className="text-[10px] font-black text-amber-600 uppercase">Final (3)</span>
                        ) : null}
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        {/* Baris 1: Kemajuan/Kelulusan */}
                        <div className="grid grid-cols-3 gap-2">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleUpdateStage(selectedParticipant.id, 1, false); }}
                            className={`py-2.5 rounded-xl text-[9px] font-black transition-all border flex flex-col items-center justify-center gap-1 ${ (getParticipantStage(selectedParticipant) === 1 && !getParticipantFailed(selectedParticipant)) ? 'bg-slate-900 border-slate-900 text-white shadow-md shadow-slate-200' : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300' }`}
                          >
                            <Clock size={12} />
                            SET T1
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleUpdateStage(selectedParticipant.id, 2, false); }}
                            className={`py-2.5 rounded-xl text-[9px] font-black transition-all border flex flex-col items-center justify-center gap-1 ${ (getParticipantStage(selectedParticipant) === 2 && !getParticipantFailed(selectedParticipant)) ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white border-slate-100 text-blue-600 hover:border-blue-200' }`}
                          >
                            <Medal size={12} />
                            LOLOS T2
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleUpdateStage(selectedParticipant.id, 3, false); }}
                            className={`py-2.5 rounded-xl text-[9px] font-black transition-all border flex flex-col items-center justify-center gap-1 ${ getParticipantStage(selectedParticipant) === 3 ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-200' : 'bg-white border-slate-100 text-amber-600 hover:border-amber-200' }`}
                          >
                            <Trophy size={12} />
                            FINAL (3)
                          </button>
                        </div>

                        {/* Baris 2: Gagal / Tidak Lolos */}
                        <div className="grid grid-cols-2 gap-2">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleUpdateStage(selectedParticipant.id, 1, true); }}
                            className={`py-2 rounded-xl text-[9px] font-black transition-all border flex flex-row items-center justify-center gap-1.5 ${ (getParticipantStage(selectedParticipant) === 1 && getParticipantFailed(selectedParticipant)) ? 'bg-rose-600 border-rose-600 text-white shadow-md shadow-rose-100' : 'bg-rose-50 border-rose-100 text-rose-600 hover:bg-rose-100' }`}
                          >
                            <XCircle size={11} />
                            GAGAL TAHAP 1
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleUpdateStage(selectedParticipant.id, 2, true); }}
                            className={`py-2 rounded-xl text-[9px] font-black transition-all border flex flex-row items-center justify-center gap-1.5 ${ (getParticipantStage(selectedParticipant) === 2 && getParticipantFailed(selectedParticipant)) ? 'bg-rose-600 border-rose-600 text-white shadow-md shadow-rose-100' : 'bg-rose-50 border-rose-100 text-rose-600 hover:bg-rose-100' }`}
                          >
                            <XCircle size={11} />
                            GAGAL TAHAP 2
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {renderParticipantFiles(selectedParticipant)}
              </div>
            </div>
          </div>
        )}

        {/* ================= PANEL 2: MODAL GENERATOR ID CARD ================= */}
        {selectedIdCard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 transition-all">
            <div className="w-full max-w-sm bg-white rounded-3xl border border-slate-100 p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
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
                       ID: NCC-{generateTicketCode(selectedIdCard.id)}
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
      <div className={`fixed inset-0 z-[150] flex items-center justify-center p-4 transition-all duration-200 ${confirmModal.show ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {/* Latar Belakang Gelap */}
        <div className="absolute inset-0 bg-slate-900/45" onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}></div>
        
        {/* Kotak Modal */}
        <div className={`bg-white border border-slate-100 shadow-2xl rounded-[2rem] p-8 max-w-md w-full relative transition-all duration-200 transform ${confirmModal.show ? 'scale-100 translate-y-0' : 'scale-[0.98] translate-y-2'}`}>
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
      <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-200 ${deleteModal.show ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-slate-900/50" onClick={() => setDeleteModal({ ...deleteModal, show: false })}></div>
        
        <div className={`bg-white border border-red-100 shadow-2xl rounded-[2rem] p-8 max-w-md w-full relative transition-all duration-200 transform ${deleteModal.show ? 'scale-100 translate-y-0' : 'scale-[0.98] translate-y-2'}`}>
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

      {/* MODAL TAMBAH MANUAL */}
      <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-200 ${showAddModal ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-slate-900/50" onClick={() => !isAdding && setShowAddModal(false)}></div>
        <div className={`bg-white rounded-3xl p-6 md:p-8 w-full max-w-2xl relative transition-all duration-200 transform overflow-y-auto max-h-[90vh] ${showAddModal ? 'scale-100 translate-y-0' : 'scale-[0.98] translate-y-2'}`}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Users className="text-blue-600" size={20} /> Tambah Peserta Manual
            </h3>
            <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:bg-slate-100 p-2 rounded-full transition-colors"><X size={20} /></button>
          </div>
          
          <form onSubmit={handleAddParticipant} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block">Nama Lengkap</label>
                <input required type="text" value={newParticipant.full_name} onChange={e => setNewParticipant({...newParticipant, full_name: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm bg-slate-50" placeholder="Masukkan nama" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block">Email</label>
                <input required type="email" value={newParticipant.email} onChange={e => setNewParticipant({...newParticipant, email: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm bg-slate-50" placeholder="Email aktif" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block">NISN</label>
                <input required type="text" value={newParticipant.nisn} onChange={e => setNewParticipant({...newParticipant, nisn: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm bg-slate-50" placeholder="NISN" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block">Asal Sekolah</label>
                <input required type="text" value={newParticipant.school_name} onChange={e => setNewParticipant({...newParticipant, school_name: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm bg-slate-50" placeholder="Nama sekolah" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block">Provinsi</label>
                <input required type="text" value={newParticipant.province} onChange={e => setNewParticipant({...newParticipant, province: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm bg-slate-50" placeholder="Provinsi" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block">Kabupaten/Kota</label>
                <input required type="text" value={newParticipant.city} onChange={e => setNewParticipant({...newParticipant, city: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm bg-slate-50" placeholder="Kota/Kabupaten" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block">Kategori Lomba</label>
                <select required value={newParticipant.category} onChange={e => setNewParticipant({...newParticipant, category: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm bg-slate-50">
                  <option value="">Pilih Kategori</option>
                  <option value="Olimpiade MIPA">Olimpiade MIPA</option>
                  <option value="Speech Contest">Speech Contest</option>
                  <option value="LKTI Nasional">LKTI Nasional</option>
                  <option value="MTQ Nasional">MTQ Nasional</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block">Nama Pembina (Opsional)</label>
                <input type="text" value={newParticipant.mentor_name} onChange={e => setNewParticipant({...newParticipant, mentor_name: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm bg-slate-50" placeholder="Nama Pembina" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block">Email Pembina (Opsional)</label>
                <input type="email" value={newParticipant.mentor_email} onChange={e => setNewParticipant({...newParticipant, mentor_email: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm bg-slate-50" placeholder="pembina@sekolah.sch.id" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block">No. HP Pembina (Opsional)</label>
                <input type="text" value={newParticipant.mentor_phone} onChange={e => setNewParticipant({...newParticipant, mentor_phone: e.target.value.replace(/\D/g, "")})} className="w-full p-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm bg-slate-50" placeholder="Contoh: 08123456789" />
              </div>
            </div>
            
            <div className="pt-4">
              <button disabled={isAdding} type="submit" className={`w-full py-4 rounded-xl font-bold text-white transition-all shadow-md ${isAdding ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 active:scale-95 shadow-blue-200'}`}>
                {isAdding ? "Menyimpan Data..." : "Tambahkan ke Buku Induk"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* MODAL IMPORT CSV */}
      <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-200 ${showImportModal ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-slate-900/50" onClick={() => !isImporting && setShowImportModal(false)}></div>
        <div className={`bg-white rounded-3xl p-6 md:p-8 w-full max-w-2xl relative transition-all duration-200 transform overflow-y-auto max-h-[90vh] ${showImportModal ? 'scale-100 translate-y-0' : 'scale-[0.98] translate-y-2'}`}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <FolderOpen className="text-blue-600" size={20} /> Import Data CSV
            </h3>
            <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:bg-slate-100 p-2 rounded-full transition-colors"><X size={20} /></button>
          </div>

          {/* Custom Modern Tabs */}
          <div className="flex border-b border-slate-100 mb-6">
            <button
              onClick={() => setActiveCsvTab('upload')}
              className={`flex-1 pb-3 text-sm font-bold text-center border-b-2 transition-all flex items-center justify-center gap-2 ${
                activeCsvTab === 'upload'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <FileText size={16} /> Unggah Berkas CSV
            </button>
            <button
              onClick={() => setActiveCsvTab('guide')}
              className={`flex-1 pb-3 text-sm font-bold text-center border-b-2 transition-all flex items-center justify-center gap-2 ${
                activeCsvTab === 'guide'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <AlertCircle size={16} /> Panduan Format & Kolom
            </button>
          </div>
          
          <div className="space-y-6">
            {activeCsvTab === 'upload' ? (
              <div className="space-y-6">
                <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5 flex items-start gap-4">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-xl shrink-0 mt-0.5">
                    <AlertCircle size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-blue-800 text-sm">Siap untuk Mengunggah?</h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Pastikan format kolom berkas CSV Anda sudah sesuai dengan panduan. Jika belum yakin, Anda dapat melihat panduan kolom lengkap di tab sebelah atau mengunduh template resmi di bawah ini.
                    </p>
                    <button onClick={handleDownloadTemplate} className="mt-3 flex items-center gap-2 bg-white text-blue-600 hover:bg-blue-50 px-3.5 py-1.5 rounded-xl text-xs font-bold border border-blue-200 transition-colors shadow-sm">
                      <Download size={13} /> Download Template CSV
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-bold text-slate-700 mb-2 block">Unggah File CSV</label>
                  <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center hover:bg-slate-50 transition-colors relative overflow-hidden">
                    <input 
                      type="file" 
                      accept=".csv" 
                      onChange={(e) => setCsvFile(e.target.files ? e.target.files[0] : null)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                      id="csv-upload"
                    />
                    <div className="pointer-events-none flex flex-col items-center justify-center">
                      <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-3">
                        <FileText size={24} />
                      </div>
                      <span className="font-bold text-slate-700 mb-1">{csvFile ? csvFile.name : "Pilih atau Seret file CSV ke sini"}</span>
                      <span className="text-xs text-slate-500">Maksimal 1000 baris direkomendasikan per upload</span>
                    </div>
                  </div>
                </div>

                <button disabled={isImporting || !csvFile} onClick={handleImportCSV} className={`w-full py-4 rounded-xl font-bold text-white transition-all shadow-md ${isImporting || !csvFile ? 'bg-slate-400 cursor-not-allowed' : 'bg-slate-900 hover:bg-slate-800 active:scale-95 shadow-slate-900/20'}`}>
                  {isImporting ? "Memproses Import Data..." : "Jalankan Import CSV Sekarang"}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl p-5 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-base flex items-center gap-2">
                      <Sparkles size={18} className="text-yellow-300 shrink-0" />
                      Format Database NCC 13th
                    </h4>
                    <p className="text-xs text-blue-100 mt-1 leading-relaxed">
                      Silakan gunakan tata letak kolom di bawah ini. Unduh template resmi kami untuk kemudahan pengisian data.
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadTemplate}
                    className="shrink-0 flex items-center justify-center gap-2 bg-white text-blue-600 hover:bg-blue-50 px-4 py-2.5 rounded-xl text-xs font-black border border-transparent shadow-sm transition-all duration-200 active:scale-95"
                  >
                    <Download size={14} /> Download Template
                  </button>
                </div>

                {/* Table Guideline */}
                <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto max-h-[350px]">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 sticky top-0 z-10">
                          <th className="py-3 px-4 text-xs font-black text-slate-500 uppercase tracking-wider bg-slate-50">Kolom (Header)</th>
                          <th className="py-3 px-4 text-xs font-black text-slate-500 uppercase tracking-wider bg-slate-50">Status</th>
                          <th className="py-3 px-4 text-xs font-black text-slate-500 uppercase tracking-wider bg-slate-50">Aturan & Contoh</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        <tr>
                          <td className="py-3 px-4 font-mono font-bold text-blue-600">nama_lengkap</td>
                          <td className="py-3 px-4"><span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-50 text-rose-600 border border-rose-100">Wajib</span></td>
                          <td className="py-3 px-4 text-slate-600">Nama lengkap peserta (Contoh: <code className="bg-slate-100 px-1 py-0.5 rounded">Budi Santoso</code>)</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 font-mono font-bold text-blue-600">email</td>
                          <td className="py-3 px-4"><span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-50 text-rose-600 border border-rose-100">Wajib</span></td>
                          <td className="py-3 px-4 text-slate-600">Email unik aktif (Contoh: <code className="bg-slate-100 px-1 py-0.5 rounded">budi@gmail.com</code>)</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 font-mono font-bold text-blue-600">nisn</td>
                          <td className="py-3 px-4"><span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-50 text-rose-600 border border-rose-100">Wajib</span></td>
                          <td className="py-3 px-4 text-slate-600">10 digit Nomor Induk Siswa Nasional</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 font-mono font-bold text-blue-600">asal_sekolah</td>
                          <td className="py-3 px-4"><span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-50 text-rose-600 border border-rose-100">Wajib</span></td>
                          <td className="py-3 px-4 text-slate-600">Nama sekolah asal peserta</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 font-mono font-bold text-blue-600">provinsi</td>
                          <td className="py-3 px-4"><span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-50 text-rose-600 border border-rose-100">Wajib</span></td>
                          <td className="py-3 px-4 text-slate-600">Nama Provinsi di Indonesia (Contoh: <code className="bg-slate-100 px-1 py-0.5 rounded">Jawa Timur</code>)</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 font-mono font-bold text-blue-600">kota</td>
                          <td className="py-3 px-4"><span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-50 text-rose-600 border border-rose-100">Wajib</span></td>
                          <td className="py-3 px-4 text-slate-600">Kota/Kabupaten domisili (Contoh: <code className="bg-slate-100 px-1 py-0.5 rounded">Surabaya</code>)</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 font-mono font-bold text-blue-600">kategori_lomba</td>
                          <td className="py-3 px-4"><span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-50 text-rose-600 border border-rose-100">Wajib</span></td>
                          <td className="py-3 px-4 text-slate-600">Pilihan: <code className="bg-blue-50 text-blue-600 px-1 py-0.5 rounded">Olimpiade MIPA</code>, <code className="bg-blue-50 text-blue-600 px-1 py-0.5 rounded">Speech Contest</code>, <code className="bg-blue-50 text-blue-600 px-1 py-0.5 rounded">LKTI Nasional</code>, <code className="bg-blue-50 text-blue-600 px-1 py-0.5 rounded">MTQ Nasional</code></td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 font-mono font-bold text-blue-600">nama_pembina</td>
                          <td className="py-3 px-4"><span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-500 border border-slate-200">Opsional</span></td>
                          <td className="py-3 px-4 text-slate-600">Nama guru pembimbing / mentor pendamping</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 font-mono font-bold text-blue-600">no_wa</td>
                          <td className="py-3 px-4"><span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-50 text-rose-600 border border-rose-100">Wajib</span></td>
                          <td className="py-3 px-4 text-slate-600">Nomor WhatsApp aktif peserta</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ✏️ HQ EDIT MESSAGE MODAL */}
      {hqEditingMsg && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="font-bold text-slate-800 text-sm mb-3">Edit Pesan Resmi</h3>
            <form onSubmit={handleUpdateHqMessage} className="space-y-4">
              <textarea
                value={hqEditInput}
                onChange={(e) => setHqEditInput(e.target.value)}
                required
                className="w-full p-3 bg-slate-50 border border-slate-200 focus:bg-white rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700 placeholder:text-slate-400 shadow-inner resize-none h-24"
                placeholder="Edit balasan resmi..."
              />
              <div className="flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => { setHqEditingMsg(null); setHqEditInput(""); }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-slate-600 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingHqMsg || !hqEditInput.trim()}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md transition-colors disabled:opacity-50"
                >
                  {isUpdatingHqMsg ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ↪️ HQ FORWARD MESSAGE MODAL */}
      {hqForwardingMsg && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200 p-4">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200 max-h-[80vh] flex flex-col overflow-hidden">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4 shrink-0">
              <h3 className="font-bold text-slate-800 text-sm">Teruskan Pesan</h3>
              <button 
                onClick={() => setHqForwardingMsg(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-xs"
              >
                Tutup
              </button>
            </div>
            
            {/* Search Bar */}
            <div className="mb-4 shrink-0">
              <input
                type="text"
                placeholder="Cari sekolah tujuan..."
                value={searchForwardSchool}
                onChange={(e) => setSearchForwardSchool(e.target.value)}
                className="w-full pl-3 pr-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700 placeholder:text-slate-400 shadow-inner"
              />
            </div>

            {/* School List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar min-h-[200px]">
              {schoolGroups
                .filter(group => 
                  group.schoolName.toLowerCase().includes(searchForwardSchool.toLowerCase()) ||
                  group.npsn.includes(searchForwardSchool)
                )
                .map((group, idx) => (
                  <button
                    key={group.npsn || group.schoolName || idx}
                    type="button"
                    onClick={() => handleForwardHqMessage(group)}
                    className="w-full text-left p-3 border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/20 rounded-xl transition-all flex items-center justify-between"
                  >
                    <div>
                      <h4 className="font-bold text-xs text-slate-800 uppercase tracking-tight truncate max-w-[250px]">
                        {group.schoolName}
                      </h4>
                      <span className="text-[9px] text-slate-400 font-mono mt-0.5 block">NPSN: {group.npsn || "Tanpa NPSN"}</span>
                    </div>
                    <Forward size={14} className="text-slate-400" />
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* 🏫 MODAL LIHAT ANGGOTA GRUP (FORUM SEKOLAH) */}
      <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300 ${showSchoolMembers ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={() => setShowSchoolMembers(false)}></div>
        <div className={`bg-white rounded-3xl p-6 md:p-8 w-full max-w-3xl relative transition-all duration-300 transform overflow-hidden max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 ${showSchoolMembers ? 'scale-100 translate-y-0' : 'scale-[0.98] translate-y-2'}`}>
          
          {/* Header */}
          <div className="flex justify-between items-center pb-4 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
                <Users size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-800 tracking-tight uppercase">
                  {selectedSchoolGroup?.schoolName}
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                  NPSN: {selectedSchoolGroup?.npsn || "Tanpa NPSN"} • {selectedSchoolGroup?.students?.length || 0} Anggota Grup Terdaftar
                </p>
              </div>
            </div>
            <button 
              onClick={() => setShowSchoolMembers(false)} 
              className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 p-2.5 rounded-full transition-all"
            >
              <X size={18} />
            </button>
          </div>

          {/* Members List (Scrollable) */}
          <div className="flex-1 overflow-y-auto py-5 pr-1 space-y-4 custom-scrollbar">
            {(!selectedSchoolGroup?.students || selectedSchoolGroup.students.length === 0) ? (
              <div className="text-center py-8 text-slate-400">
                <Users size={32} className="mx-auto text-slate-200 mb-2" />
                <p className="text-xs font-bold uppercase tracking-wider">Tidak Ada Anggota</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedSchoolGroup.students.map((student: any) => {
                  let ticketCode = generateTicketCode(student.id);
                  let paymentStatus = student.payment_status || "Unpaid";
                  
                  return (
                    <div 
                      key={student.id}
                      className="bg-slate-50/50 border border-slate-100 hover:border-indigo-100 rounded-2xl p-4 transition-all flex flex-col justify-between hover:shadow-sm"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                              {student.full_name?.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-bold text-xs text-slate-800 truncate uppercase tracking-tight">{student.full_name || "Peserta"}</h4>
                              <p className="text-[9px] font-mono font-bold text-slate-400 mt-0.5">NCC-{ticketCode}</p>
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider shrink-0 shadow-sm border ${
                            paymentStatus === 'Verified' || paymentStatus === 'success'
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                              : paymentStatus === 'Pending'
                                ? 'bg-amber-50 text-amber-600 border-amber-100'
                                : paymentStatus === 'Rejected'
                                  ? 'bg-rose-50 text-rose-600 border-rose-100'
                                  : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}>
                            {paymentStatus}
                          </span>
                        </div>

                        <div className="space-y-1.5 text-[10px] text-slate-500 font-medium">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400 w-12 shrink-0">Email:</span>
                            <span className="text-slate-700 truncate font-mono select-all">{student.email || "-"}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400 w-12 shrink-0">NISN:</span>
                            <span className="text-slate-700 font-mono select-all">{student.nisn || "-"}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400 w-12 shrink-0">Lomba:</span>
                            <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded font-bold text-[9px]">
                              {student.competition_type || student.category || "-"}
                            </span>
                          </div>
                          {student.team_name && (
                            <div className="flex items-center gap-2">
                              <span className="text-slate-400 w-12 shrink-0">Tim:</span>
                              <span className="text-slate-700 font-bold uppercase tracking-wider">{student.team_name}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Sync Indicator / Info */}
                      <div className="mt-3.5 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2 shrink-0">
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping"></span>
                          DATABASE PUSAT SYNCED
                        </span>
                        <button
                          onClick={() => {
                            setShowSchoolMembers(false);
                            setActiveTab("Peserta");
                            setSearchQuery(student.email || "");
                          }}
                          className="text-[9px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-widest hover:underline transition-all"
                        >
                          Buka Profil
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* Footer Action */}
          <div className="pt-4 border-t border-slate-100 shrink-0 flex items-center justify-between text-slate-400 text-[10px] font-medium">
            <span>
              Menampilkan data langsung dari buku induk pendaftaran NCC yang terhubung ke server utama.
            </span>
            <button 
              onClick={() => setShowSchoolMembers(false)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition-all active:scale-95 shadow-sm"
            >
              Tutup Panel
            </button>
          </div>
        </div>
      </div>
      {/* 🌟 PREMIUM SOLID DARK OVERLAY FOR HQ LOGOUT & SYNC (LOCKDOWN MODE - LIGHTWEIGHT & LAG-FREE) */}
      {isLoggingOut && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950 animate-in fade-in duration-200">
          <div className="relative flex flex-col items-center p-8 rounded-[2rem] bg-white/5 border border-white/10 shadow-2xl max-w-sm w-full text-center">
            {/* Spinning glowing gradient ring */}
            <div className="relative w-20 h-20 mb-6 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-white/5"></div>
              <div className="absolute inset-0 rounded-full border-4 border-t-indigo-500 border-r-violet-500 animate-spin"></div>
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-lg animate-pulse">
                <Shield size={24} className="text-white" />
              </div>
            </div>

            <h3 className="text-xl font-black text-white mb-2 tracking-tight">Locking Down Command Center...</h3>
            <p className="text-xs text-indigo-200/80 font-semibold leading-relaxed">
              Membersihkan sesi administrasi secara aman. Sampai jumpa kembali, Komandan!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ModernHQDashboard() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-screen items-center justify-center bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Memuat Command Center...</p>
        </div>
      </div>
    }>
      <ModernHQDashboardContent />
    </Suspense>
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

function StatCard({ title, value, trend, isUp, isLoading = false }: { title: string, value: string, trend: string, isUp: boolean, isLoading?: boolean }) {
  return (
    <div className="bg-white/50 backdrop-blur-xl backdrop-saturate-150 p-6 rounded-2xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between hover:bg-white/70 transition-all duration-300">
      <h4 className="text-slate-500 font-medium text-sm mb-4">{title}</h4>
      <div className="flex items-end justify-between">
        {isLoading ? (
          <div className="h-9 w-24 bg-slate-200/80 rounded-lg animate-pulse"></div>
        ) : (
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">{value}</h2>
        )}
        {isLoading ? (
          <div className="h-6 w-16 bg-slate-200/60 rounded-md animate-pulse"></div>
        ) : (
          <span className={`flex items-center text-xs font-bold px-2 py-1 rounded-md border
            ${isUp ? 'text-green-700 bg-green-500/10 border-green-500/20' : 'text-red-700 bg-red-500/10 border-red-500/20'}
          `}>
            {isUp ? <ArrowUpRight size={14} className="mr-1"/> : <ArrowDownRight size={14} className="mr-1"/>}
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}
