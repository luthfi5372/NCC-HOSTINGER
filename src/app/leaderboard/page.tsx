"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Trophy, Search, TrendingUp, Clock, ShieldCheck,
  Medal, Activity, ArrowLeft, X, CheckCircle2,
  XCircle, Loader2, Ticket, School, User, MapPin,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { generateTicketCode } from "@/lib/utils";
import { fetchPublicLeaderboard } from "@/lib/supabase/service";

const CATEGORIES = ["SEMUA", "Olimpiade MIPA", "Speech Contest", "LKTI Nasional", "MTQ Nasional"];

interface HasilCek {
  nama: string;
  sekolah: string;
  nisn: string;
  provinsi: string;
  kategori: string;
  idTiket: string;
  statusPassing: "PASSED" | "FAILED" | "PENDING" | null;
}

// ── Konfetti Canvas native ────────────────────────────────────────────────────
function ConfettiBlast() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const colors = ["#6366f1","#10b981","#f59e0b","#ec4899","#3b82f6","#a855f7","#14b8a6"];
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
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("SEMUA");
  const [searchTerm, setSearchTerm] = useState("");
  const [nisnInput, setNisnInput] = useState("");
  const [isCekLoading, setIsCekLoading] = useState(false);
  const [hasilCek, setHasilCek] = useState<HasilCek | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [cekError, setCekError] = useState("");

  useEffect(() => {
    loadLeaderboard();
    const interval = setInterval(loadLeaderboard, 30000);
    return () => clearInterval(interval);
  }, []);

  async function loadLeaderboard() {
    const { data: d } = await fetchPublicLeaderboard();
    if (d) setData(d);
    setIsLoading(false);
  }

  const handleCekKelulusan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nisnInput.trim()) return;
    setIsCekLoading(true); setCekError(""); setHasilCek(null);
    try {
      const { data: entry, error } = await supabase
        .from("competition_entries").select("*")
        .eq("nisn", nisnInput.trim()).eq("payment_status", "Verified").single();
      if (error || !entry) {
        setCekError("NISN tidak ditemukan atau belum terverifikasi.");
        setIsCekLoading(false); return;
      }
      const ticketCode = `NCC-${generateTicketCode(entry.id)}`;
      const { data: attempt } = await supabase
        .from("cbt_attempts").select("status_passing").eq("user_id", ticketCode).maybeSingle();
      let statusPassing: "PASSED" | "FAILED" | "PENDING" | null = null;
      if (attempt?.status_passing) {
        statusPassing = attempt.status_passing as any;
      } else {
        const { data: a2 } = await supabase
          .from("cbt_attempts").select("status_passing").eq("user_id", entry.nisn).maybeSingle();
        if (a2?.status_passing) statusPassing = a2.status_passing as any;
      }
      setHasilCek({ nama: entry.full_name || "—", sekolah: entry.school_name || entry.school || "—",
        nisn: entry.nisn || "—", provinsi: entry.province || "—",
        kategori: entry.competition_type || "—", idTiket: ticketCode, statusPassing });
      setShowPopup(true);
    } catch { setCekError("Terjadi kesalahan. Coba lagi."); }
    finally { setIsCekLoading(false); }
  };

  const filteredData = data
    .filter(i => selectedCategory === "SEMUA" || i.category === selectedCategory)
    .filter(i => i.name?.toLowerCase().includes(searchTerm.toLowerCase()) || i.school?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="min-h-screen bg-white text-slate-800 overflow-x-hidden font-sans">

      {/* Konfetti */}
      {showPopup && hasilCek?.statusPassing === "PASSED" && <ConfettiBlast />}

      {/* ── POP-UP HASIL ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showPopup && hasilCek && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowPopup(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 24 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl shadow-slate-200 max-w-sm w-full relative overflow-hidden border border-slate-100"
            >
              {/* Stripe warna status */}
              <div className={`h-1.5 w-full ${
                hasilCek.statusPassing === "PASSED" ? "bg-gradient-to-r from-emerald-400 to-teal-400" :
                hasilCek.statusPassing === "FAILED" ? "bg-gradient-to-r from-rose-400 to-red-400" :
                "bg-gradient-to-r from-amber-400 to-yellow-400"}`}
              />

              <div className="p-6">
                {/* Tutup */}
                <button onClick={() => setShowPopup(false)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all">
                  <X size={15} />
                </button>

                {/* Ikon + status */}
                <div className="flex flex-col items-center text-center mb-5">
                  {hasilCek.statusPassing === "PASSED" ? (
                    <>
                      <div className="w-16 h-16 bg-emerald-50 border-2 border-emerald-200 rounded-2xl flex items-center justify-center mb-3">
                        <CheckCircle2 size={32} className="text-emerald-500" />
                      </div>
                      <h2 className="text-xl font-black text-slate-900">Selamat, Kamu LOLOS!</h2>
                      <p className="text-xs text-slate-400 mt-1">Berhak melanjutkan ke babak berikutnya</p>
                    </>
                  ) : hasilCek.statusPassing === "FAILED" ? (
                    <>
                      <div className="w-16 h-16 bg-rose-50 border-2 border-rose-200 rounded-2xl flex items-center justify-center mb-3">
                        <XCircle size={32} className="text-rose-500" />
                      </div>
                      <h2 className="text-xl font-black text-slate-900">Belum Lolos</h2>
                      <p className="text-xs text-slate-400 mt-1">Jangan menyerah, tetap semangat berkarya!</p>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 bg-amber-50 border-2 border-amber-200 rounded-2xl flex items-center justify-center mb-3">
                        <Clock size={32} className="text-amber-500" />
                      </div>
                      <h2 className="text-xl font-black text-slate-900">Hasil Belum Keluar</h2>
                      <p className="text-xs text-slate-400 mt-1">Panitia masih dalam proses penilaian</p>
                    </>
                  )}
                </div>

                {/* Data peserta */}
                <div className="bg-slate-50 rounded-2xl p-4 space-y-2.5 text-sm border border-slate-100">
                  {[
                    { icon: User, label: "Nama", value: hasilCek.nama },
                    { icon: School, label: "Sekolah", value: hasilCek.sekolah },
                    { icon: MapPin, label: "Provinsi", value: hasilCek.provinsi },
                    { icon: Trophy, label: "Kategori", value: hasilCek.kategori },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-center gap-2.5">
                      <Icon size={13} className="text-indigo-400 shrink-0" />
                      <span className="text-slate-400 font-medium w-20 shrink-0">{label}</span>
                      <span className="font-bold text-slate-800 text-right flex-1 truncate">{value}</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-slate-200 flex items-center gap-2.5">
                    <Ticket size={13} className="text-indigo-400 shrink-0" />
                    <span className="text-slate-400 font-medium w-20 shrink-0">ID Tiket</span>
                    <span className="font-mono font-black text-indigo-600 tracking-widest">{hasilCek.idTiket}</span>
                  </div>
                </div>

                {/* Badge status */}
                <div className={`mt-4 py-2.5 rounded-xl text-center font-black text-xs uppercase tracking-widest flex items-center justify-center gap-1.5 ${
                  hasilCek.statusPassing === "PASSED" ? "bg-emerald-50 text-emerald-600 border border-emerald-200" :
                  hasilCek.statusPassing === "FAILED" ? "bg-rose-50 text-rose-600 border border-rose-200" :
                  "bg-amber-50 text-amber-600 border border-amber-200"}`}>
                  {hasilCek.statusPassing === "PASSED" ? <><CheckCircle2 size={14}/> Dinyatakan LOLOS</> :
                   hasilCek.statusPassing === "FAILED" ? <><XCircle size={14}/> Belum Lolos</> :
                   <><Clock size={14}/> Menunggu Pengumuman</>}
                </div>

                <button onClick={() => setShowPopup(false)}
                  className="w-full mt-3 py-2.5 text-xs text-slate-400 hover:text-slate-600 font-semibold transition-all">
                  Tutup
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── NAVBAR ──────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-indigo-600 flex items-center justify-center transition-all duration-300 group-hover:text-white text-slate-500">
              <ArrowLeft size={18} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">NCC 13th</p>
              <h1 className="text-sm font-black text-slate-800">Live Ranking <span className="text-indigo-600">& Kelulusan</span></h1>
            </div>
          </Link>
          <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase tracking-widest">
            <Activity size={14} className="animate-pulse" />
            <span className="hidden sm:block">System Online</span>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-12 space-y-16">

        {/* ══════════════════════════════════════════════════════════════════════
            SECTION 1 — CEK STATUS KELULUSAN
        ══════════════════════════════════════════════════════════════════════ */}
        <section>
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-[10px] font-black uppercase tracking-widest mb-4">
              <ShieldCheck size={12} /> Cek Status Kelulusan
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-3 tracking-tight">
              Apakah Kamu <span className="text-indigo-600">Lolos?</span>
            </h2>
            <p className="text-slate-400 text-sm max-w-md mx-auto leading-relaxed">
              Masukkan NISN untuk melihat data & status kelulusan resmi dari panitia NCC 13th.
            </p>
          </div>

          {/* Form */}
          <div className="max-w-xl mx-auto">
            <form onSubmit={handleCekKelulusan} className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                <input
                  type="text"
                  value={nisnInput}
                  onChange={e => { setNisnInput(e.target.value); setCekError(""); }}
                  placeholder="Masukkan NISN kamu..."
                  className="w-full bg-slate-50 border border-slate-200 hover:border-indigo-300 focus:border-indigo-500 outline-none rounded-2xl py-4 pl-11 pr-4 text-sm font-medium text-slate-800 transition-all placeholder:text-slate-300"
                />
              </div>
              <button
                type="submit"
                disabled={isCekLoading || !nisnInput.trim()}
                className="px-6 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap shadow-md shadow-indigo-200"
              >
                {isCekLoading ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
                {isCekLoading ? "Mencari..." : "Cek"}
              </button>
            </form>

            {/* Error */}
            <AnimatePresence>
              {cekError && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="mt-3 flex items-center gap-2 text-rose-500 text-xs font-semibold bg-rose-50 border border-rose-100 rounded-xl px-4 py-2.5">
                  <AlertCircle size={14} className="shrink-0" /> {cekError}
                </motion.div>
              )}
            </AnimatePresence>

            {/* 3 status cards */}
            <div className="grid grid-cols-3 gap-3 mt-5">
              {[
                { icon: CheckCircle2, label: "PASSED", desc: "Lanjut babak berikutnya", color: "emerald", iconColor: "text-emerald-500" },
                { icon: Clock, label: "PENDING", desc: "Masih proses penilaian", color: "amber", iconColor: "text-amber-500" },
                { icon: XCircle, label: "FAILED", desc: "Tetap semangat berkarya", color: "rose", iconColor: "text-rose-500" },
              ].map(({ icon: Icon, label, desc, color, iconColor }) => (
                <div key={label} className={`bg-${color}-50 border border-${color}-100 rounded-2xl p-4 text-center`}>
                  <Icon size={22} className={`${iconColor} mx-auto mb-2`} />
                  <div className={`text-[10px] font-black text-${color}-600 uppercase tracking-widest`}>{label}</div>
                  <div className="text-[9px] text-slate-400 mt-0.5 leading-tight">{desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-slate-100" />
          <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <Trophy size={12} className="text-amber-400" /> Papan Skor Live
          </div>
          <div className="flex-1 h-px bg-slate-100" />
        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            SECTION 2 — LEADERBOARD
        ══════════════════════════════════════════════════════════════════════ */}
        <section>
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-2">
              Papan <span className="text-indigo-600">Skor</span>
            </h2>
            <p className="text-slate-400 text-sm">Diperbarui otomatis setiap 30 detik</p>
          </div>

          {/* Filter & Search */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8 items-center justify-between">
            <div className="flex flex-wrap gap-2 justify-center">
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    selectedCategory === cat
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}>
                  {cat}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={15} />
              <input
                type="text" placeholder="Cari nama / sekolah..."
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                className="bg-slate-50 border border-slate-200 focus:border-indigo-400 outline-none rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium w-60 transition-all placeholder:text-slate-300 text-slate-700"
              />
            </div>
          </div>

          {/* List */}
          <div className="space-y-3">
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-slate-50 rounded-2xl animate-pulse border border-slate-100" />
              ))
            ) : filteredData.length > 0 ? (
              <AnimatePresence mode="popLayout">
                {filteredData.map((item, idx) => (
                  <motion.div key={item.id} layout
                    initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }} transition={{ duration: 0.3, delay: idx * 0.04 }}
                    className="flex items-center justify-between bg-white border border-slate-100 hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-50 rounded-2xl px-6 py-5 transition-all group"
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-10 text-center">
                        {idx < 3 && selectedCategory !== "SEMUA" ? (
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center mx-auto ${
                            idx === 0 ? "bg-amber-100 text-amber-600" :
                            idx === 1 ? "bg-slate-100 text-slate-600" :
                            "bg-orange-100 text-orange-600"}`}>
                            <Medal size={18} />
                          </div>
                        ) : (
                          <span className="text-xl font-black text-slate-300 tabular-nums">#{idx + 1}</span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors uppercase text-sm">{item.name}</h3>
                          <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-[9px] font-black text-indigo-500 uppercase tracking-wide">{item.category}</span>
                        </div>
                        <p className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
                          <ShieldCheck size={11} className="text-indigo-400" /> {item.school}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Total Skor</p>
                      <p className="text-3xl font-black text-slate-900 tabular-nums leading-none">{item.score}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            ) : (
              <div className="py-24 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                <Clock className="text-slate-200 mx-auto mb-4" size={40} />
                <h4 className="font-black text-slate-400 uppercase tracking-widest text-sm">Belum Ada Data Skor</h4>
                <p className="text-slate-300 text-xs mt-1">Hasil akan muncul setelah juri memberikan penilaian.</p>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="py-12 border-t border-slate-100 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <TrendingUp size={14} className="text-indigo-500" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">NCC 13th Live Ranking</p>
        </div>
        <p className="text-slate-300 text-[9px] uppercase tracking-widest">Nilai yang ditampilkan telah diverifikasi tim juri resmi.</p>
      </footer>
    </div>
  );
}
