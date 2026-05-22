"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Trophy, Search, TrendingUp, Clock, ShieldCheck,
  Medal, Activity, ArrowLeft, X, CheckCircle2,
  XCircle, Loader2, Ticket, School, User, MapPin
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { generateTicketCode } from "@/lib/utils";
import { fetchPublicLeaderboard } from "@/lib/supabase/service";

const CATEGORIES = [
  "SEMUA",
  "Olimpiade MIPA",
  "Speech Contest",
  "LKTI Nasional",
  "MTQ Nasional"
];

// ─── Tipe hasil pencarian ────────────────────────────────────
interface HasilCek {
  nama: string;
  sekolah: string;
  nisn: string;
  provinsi: string;
  kategori: string;
  idTiket: string;
  statusPassing: "PASSED" | "FAILED" | "PENDING" | null;
}

// ── Konfetti murni Canvas — tanpa package eksternal ─────────────────────
function ConfettiBlast() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const colors = ['#6366f1','#10b981','#f59e0b','#ec4899','#3b82f6','#a855f7','#14b8a6'];
    const particles = Array.from({ length: 200 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      w: Math.random() * 10 + 5, h: Math.random() * 6 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: Math.random() * 2 - 1, vy: Math.random() * 3 + 2,
      angle: Math.random() * Math.PI * 2, spin: (Math.random() - 0.5) * 0.15,
    }));
    let frame = 0; let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        ctx.save(); ctx.translate(p.x + p.w/2, p.y + p.h/2); ctx.rotate(p.angle);
        ctx.fillStyle = p.color; ctx.globalAlpha = Math.max(0, 1 - frame/220);
        ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h); ctx.restore();
        p.x += p.vx; p.y += p.vy; p.angle += p.spin;
      });
      frame++;
      if (frame < 260) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: 10000 }} />;
}

export default function LeaderboardPage() {
  const supabase = createClient();

  // ── Leaderboard state ──────────────────────────────────────
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("SEMUA");
  const [searchTerm, setSearchTerm] = useState("");

  // ── Cek Kelulusan state ────────────────────────────────────
  const [nisnInput, setNisnInput] = useState("");
  const [isCekLoading, setIsCekLoading] = useState(false);
  const [hasilCek, setHasilCek] = useState<HasilCek | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [cekError, setCekError] = useState("");

  useEffect(() => {
    loadLeaderboard();
    const interval = setInterval(loadLeaderboard, 30000);
    const onResize = () => {};
    window.addEventListener("resize", onResize);
    return () => { clearInterval(interval); window.removeEventListener("resize", onResize); };
  }, []);

  async function loadLeaderboard() {
    const { data: leaderboardData } = await fetchPublicLeaderboard();
    if (leaderboardData) setData(leaderboardData);
    setIsLoading(false);
  }

  // ── Fungsi Cek Kelulusan ───────────────────────────────────
  const handleCekKelulusan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nisnInput.trim()) return;
    setIsCekLoading(true);
    setCekError("");
    setHasilCek(null);

    try {
      // 1. Cari peserta di competition_entries berdasarkan NISN
      const { data: entry, error } = await supabase
        .from("competition_entries")
        .select("*")
        .eq("nisn", nisnInput.trim())
        .eq("payment_status", "Verified")
        .single();

      if (error || !entry) {
        setCekError("NISN tidak ditemukan atau belum terverifikasi. Pastikan NISN benar dan status pendaftaran sudah Verified.");
        setIsCekLoading(false);
        return;
      }

      // 2. Ambil status kelulusan dari cbt_attempts
      const ticketCode = `NCC-${generateTicketCode(entry.id)}`;
      const { data: attempt } = await supabase
        .from("cbt_attempts")
        .select("status_passing")
        .eq("user_id", ticketCode)
        .maybeSingle();

      // Juga coba dengan NISN sebagai fallback (data lama)
      let statusPassing: "PASSED" | "FAILED" | "PENDING" | null = null;
      if (attempt?.status_passing) {
        statusPassing = attempt.status_passing as any;
      } else {
        const { data: attemptByNisn } = await supabase
          .from("cbt_attempts")
          .select("status_passing")
          .eq("user_id", entry.nisn)
          .maybeSingle();
        if (attemptByNisn?.status_passing) {
          statusPassing = attemptByNisn.status_passing as any;
        }
      }

      setHasilCek({
        nama: entry.full_name || "—",
        sekolah: entry.school_name || entry.school || "—",
        nisn: entry.nisn || "—",
        provinsi: entry.province || "—",
        kategori: entry.competition_type || "—",
        idTiket: ticketCode,
        statusPassing
      });
      setShowPopup(true);

    } catch (err) {
      setCekError("Terjadi kesalahan server. Coba lagi.");
    } finally {
      setIsCekLoading(false);
    }
  };

  const filteredData = data
    .filter(item => selectedCategory === "SEMUA" || item.category === selectedCategory)
    .filter(item =>
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.school?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 selection:bg-indigo-500/30 overflow-x-hidden">

      {/* ── Konfetti saat PASSED ───────────────── */}
      {showPopup && hasilCek?.statusPassing === "PASSED" && <ConfettiBlast />}

      {/* ── POP-UP HASIL CEK ──────────────────────────────── */}
      <AnimatePresence>
        {showPopup && hasilCek && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setShowPopup(false)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#0f172a] border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
            >
              {/* Dekorasi latar */}
              <div className={`absolute top-0 left-0 w-full h-1.5 ${
                hasilCek.statusPassing === "PASSED" 
                  ? "bg-gradient-to-r from-emerald-400 to-teal-400"
                  : hasilCek.statusPassing === "FAILED"
                  ? "bg-gradient-to-r from-rose-500 to-red-500"
                  : "bg-gradient-to-r from-amber-400 to-yellow-400"
              }`} />
              <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />

              {/* Tombol tutup */}
              <button
                onClick={() => setShowPopup(false)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all text-white/40 hover:text-white"
              >
                <X size={16} />
              </button>

              {/* Icon status */}
              <div className="flex flex-col items-center text-center mb-6">
                {hasilCek.statusPassing === "PASSED" ? (
                  <>
                    <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/10">
                      <span className="text-4xl">🏆</span>
                    </div>
                    <h2 className="text-2xl font-black text-emerald-400 tracking-tight">SELAMAT! KAMU LOLOS!</h2>
                    <p className="text-sm text-white/40 mt-1 font-medium">Kamu berhak melanjutkan ke babak berikutnya</p>
                  </>
                ) : hasilCek.statusPassing === "FAILED" ? (
                  <>
                    <div className="w-20 h-20 bg-rose-500/10 border border-rose-500/30 rounded-full flex items-center justify-center mb-4">
                      <span className="text-4xl">😔</span>
                    </div>
                    <h2 className="text-2xl font-black text-rose-400 tracking-tight">BELUM LOLOS</h2>
                    <p className="text-sm text-white/40 mt-1 font-medium">Jangan menyerah! Tetap semangat dan berkarya</p>
                  </>
                ) : (
                  <>
                    <div className="w-20 h-20 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center mb-4">
                      <Clock className="text-amber-400" size={36} />
                    </div>
                    <h2 className="text-2xl font-black text-amber-400 tracking-tight">HASIL BELUM KELUAR</h2>
                    <p className="text-sm text-white/40 mt-1 font-medium">Panitia masih dalam proses penilaian</p>
                  </>
                )}
              </div>

              {/* Data peserta */}
              <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <User size={14} className="text-indigo-400 shrink-0" />
                  <div className="flex-1 flex justify-between">
                    <span className="text-white/40 font-medium">Nama</span>
                    <span className="font-bold text-white text-right ml-2">{hasilCek.nama}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <School size={14} className="text-indigo-400 shrink-0" />
                  <div className="flex-1 flex justify-between">
                    <span className="text-white/40 font-medium">Sekolah</span>
                    <span className="font-bold text-white text-right ml-2 max-w-[60%]">{hasilCek.sekolah}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin size={14} className="text-indigo-400 shrink-0" />
                  <div className="flex-1 flex justify-between">
                    <span className="text-white/40 font-medium">Provinsi</span>
                    <span className="font-bold text-white">{hasilCek.provinsi}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Trophy size={14} className="text-amber-400 shrink-0" />
                  <div className="flex-1 flex justify-between">
                    <span className="text-white/40 font-medium">Kategori</span>
                    <span className="font-bold text-indigo-400 text-right ml-2">{hasilCek.kategori}</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-white/5 flex items-center gap-3">
                  <Ticket size={14} className="text-indigo-400 shrink-0" />
                  <div className="flex-1 flex justify-between items-center">
                    <span className="text-white/40 font-medium">ID Tiket</span>
                    <span className="font-mono font-black text-indigo-300 tracking-widest">{hasilCek.idTiket}</span>
                  </div>
                </div>
              </div>

              {/* Badge status besar */}
              <div className={`mt-4 py-3 rounded-2xl text-center font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 ${
                hasilCek.statusPassing === "PASSED"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : hasilCek.statusPassing === "FAILED"
                  ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                  : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
              }`}>
                {hasilCek.statusPassing === "PASSED" ? <><CheckCircle2 size={16} /> Dinyatakan LOLOS</> :
                 hasilCek.statusPassing === "FAILED" ? <><XCircle size={16} /> Belum Lolos</> :
                 <><Clock size={16} /> Menunggu Pengumuman</>}
              </div>

              <button
                onClick={() => setShowPopup(false)}
                className="w-full mt-4 py-3 text-xs text-white/20 hover:text-white/50 font-bold transition-all"
              >
                Tutup
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Background dekorasi ────────────────────────────── */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-cyan-600/10 blur-[150px] rounded-full" />
        <div className="absolute top-[30%] left-[40%] w-[20%] h-[20%] bg-violet-600/5 blur-[100px] rounded-full" />
      </div>

      {/* ── Navbar ─────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-slate-950/40 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-4 group">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-indigo-600 group-hover:border-indigo-500 transition-all duration-500 shadow-xl">
              <ArrowLeft className="text-white/60 group-hover:text-white" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter leading-none">NCC <span className="text-indigo-400">LIVE</span> RANKING</h1>
              <p className="text-[10px] text-white/30 uppercase tracking-[0.3em] font-bold mt-1.5">Official Scoring System 13th</p>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <div className="hidden lg:flex flex-col items-end mr-4">
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> System Online
              </span>
              <span className="text-[9px] text-white/20 uppercase font-black tracking-[0.2em]">Real-time Sync Active</span>
            </div>
            <div className="w-px h-8 bg-white/10 hidden lg:block mr-4" />
            <div className="w-10 h-10 rounded-full border-2 border-indigo-500/30 p-0.5">
              <div className="w-full h-full rounded-full bg-indigo-500/20 flex items-center justify-center">
                <Activity size={18} className="text-indigo-400 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-16 relative z-10 space-y-20">

        {/* ════════════════════════════════════════════════════
            SECTION 1: CEK STATUS KELULUSAN
        ════════════════════════════════════════════════════ */}
        <section>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-[0.3em] mb-6">
              <ShieldCheck size={14} /> Cek Status Kelulusan
            </div>
            <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tighter">
              APAKAH KAMU <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 italic">LOLOS?</span>
            </h2>
            <p className="text-white/40 max-w-xl mx-auto font-medium leading-relaxed">
              Masukkan NISN kamu untuk melihat data pendaftaran dan status kelulusan resmi dari panitia NCC 13th.
            </p>
          </motion.div>

          {/* Form Cek NISN */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="max-w-2xl mx-auto"
          >
            <form onSubmit={handleCekKelulusan} className="relative">
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20" size={20} />
                  <input
                    type="text"
                    value={nisnInput}
                    onChange={e => { setNisnInput(e.target.value); setCekError(""); }}
                    placeholder="Masukkan NISN kamu..."
                    className="w-full bg-white/[0.03] border border-white/10 hover:border-indigo-500/40 focus:border-indigo-500/60 outline-none rounded-2xl py-5 pl-14 pr-5 text-base font-bold transition-all placeholder:text-white/20 text-white"
                    autoComplete="off"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isCekLoading || !nisnInput.trim()}
                  className="px-8 py-5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-white/5 disabled:text-white/20 text-white font-black text-sm uppercase tracking-widest rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap shadow-lg shadow-indigo-600/30"
                >
                  {isCekLoading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                  {isCekLoading ? "Mencari..." : "Cek Sekarang"}
                </button>
              </div>

              {/* Error message */}
              <AnimatePresence>
                {cekError && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-3 flex items-start gap-2 text-rose-400 text-xs font-semibold"
                  >
                    <XCircle size={14} className="shrink-0 mt-0.5" />
                    {cekError}
                  </motion.div>
                )}
              </AnimatePresence>
            </form>

            {/* Info cards */}
            <div className="grid grid-cols-3 gap-3 mt-6">
              {[
                { icon: "🏆", label: "PASSED", desc: "Lanjut babak berikutnya", color: "emerald" },
                { icon: "⏳", label: "PENDING", desc: "Masih proses penilaian", color: "amber" },
                { icon: "💪", label: "FAILED", desc: "Tetap semangat berkarya", color: "rose" },
              ].map(item => (
                <div key={item.label} className={`bg-${item.color}-500/5 border border-${item.color}-500/10 rounded-2xl p-4 text-center`}>
                  <div className="text-2xl mb-1">{item.icon}</div>
                  <div className={`text-[10px] font-black text-${item.color}-400 uppercase tracking-widest`}>{item.label}</div>
                  <div className="text-[9px] text-white/20 mt-0.5">{item.desc}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ════════════════════════════════════════════════════
            SECTION 2: LEADERBOARD SKOR
        ════════════════════════════════════════════════════ */}
        <section>
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em] mb-8"
            >
              <Trophy size={14} className="text-amber-400" /> Papan Skor Live
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-7xl font-black mb-6 tracking-tighter leading-[0.85]"
            >
              PAPAN <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400 italic">SKOR.</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-white/40 max-w-2xl mx-auto font-medium text-lg leading-relaxed"
            >
              Pantau pergerakan nilai secara langsung dari meja juri nasional NCC 13th.
            </motion.p>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-6 mb-12 items-center justify-between">
            <div className="flex flex-wrap items-center justify-center gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                    selectedCategory === cat
                      ? "bg-indigo-600 text-white shadow-[0_10px_30px_rgba(79,70,229,0.4)] scale-105"
                      : "bg-white/5 text-white/30 hover:bg-white/10 hover:text-white border border-white/5"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="relative group w-full md:w-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-indigo-400 transition-colors" size={18} />
              <input
                type="text"
                placeholder="Cari Nama / Sekolah..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="bg-white/5 border border-white/5 hover:border-white/10 focus:border-indigo-500/50 outline-none rounded-[1.5rem] py-4 pl-12 pr-6 text-sm font-medium w-full md:w-80 transition-all placeholder:text-white/10"
              />
            </div>
          </div>

          {/* Ranking List */}
          <div className="space-y-4">
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="h-24 bg-white/5 rounded-3xl animate-pulse border border-white/5" />
              ))
            ) : filteredData.length > 0 ? (
              <AnimatePresence mode="popLayout">
                {filteredData.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.5, delay: idx * 0.05 }}
                    className="group relative overflow-hidden bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-indigo-500/30 rounded-3xl p-6 transition-all duration-500 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-8">
                      <div className="flex flex-col items-center justify-center w-12">
                        {idx < 3 && selectedCategory !== "SEMUA" ? (
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${
                            idx === 0 ? "bg-amber-400/20 text-amber-400 border border-amber-400/30" :
                            idx === 1 ? "bg-slate-300/20 text-slate-300 border border-slate-300/30" :
                            "bg-orange-400/20 text-orange-400 border border-orange-400/30"
                          }`}>
                            <Medal size={20} />
                          </div>
                        ) : (
                          <span className="text-2xl font-black text-white/20 tabular-nums">#{idx + 1}</span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-xl font-bold tracking-tight uppercase group-hover:text-indigo-400 transition-colors">
                            {item.name}
                          </h3>
                          <div className="px-2 py-0.5 rounded bg-indigo-500/10 text-[8px] font-black text-indigo-400 uppercase tracking-widest border border-indigo-500/10">
                            {item.category}
                          </div>
                        </div>
                        <p className="text-xs font-bold text-white/30 uppercase tracking-widest flex items-center gap-2">
                          <ShieldCheck size={14} className="text-indigo-500" /> {item.school}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-1">Total Skor</p>
                      <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-white/40 tabular-nums leading-none">
                        {item.score}
                      </div>
                    </div>
                    <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
                  </motion.div>
                ))}
              </AnimatePresence>
            ) : (
              <div className="py-32 text-center bg-white/[0.01] rounded-[3rem] border border-dashed border-white/10">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Clock className="text-white/20" size={32} />
                </div>
                <h4 className="text-lg font-black text-white/20 uppercase tracking-widest">Belum Ada Data Skor</h4>
                <p className="text-white/10 text-xs mt-2 uppercase tracking-widest">Hasil akan muncul setelah juri memberikan penilaian.</p>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="py-20 border-t border-white/5 text-center mt-12 relative z-10">
        <div className="flex items-center justify-center gap-3 mb-4">
          <TrendingUp size={16} className="text-indigo-500" />
          <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.5em]">NCC 13th Live Ranking Protocol</p>
        </div>
        <p className="text-white/10 text-[9px] uppercase tracking-[0.2em]">Semua nilai yang ditampilkan adalah hasil verifikasi tim juri resmi.</p>
      </footer>
    </div>
  );
}
