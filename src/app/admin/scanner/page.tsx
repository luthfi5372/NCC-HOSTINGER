"use client";
import { useEffect, useState, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { adminMarkAttendance } from "@/lib/supabase/service";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CheckCircle2, XCircle, Camera, RefreshCcw, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function AdminScanner() {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    // Inisialisasi scanner kamera
    const scanner = new Html5QrcodeScanner("reader", { 
      qrbox: { width: 250, height: 250 }, 
      fps: 10,
      aspectRatio: 1.0
    }, false);

    scannerRef.current = scanner;

    function onScanSuccess(decodedText: string) {
      if (loading) return;
      
      console.log("QR Scanned:", decodedText);
      scanner.pause();
      handleAttendance(decodedText);
    }

    scanner.render(onScanSuccess, (error) => {
      // Ignore routine scan errors
    });

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => console.error("Scanner shutdown fail:", err));
      }
    };
  }, []);

  const handleAttendance = async (idPeserta: string) => {
    setLoading(true);
    setMessage("Verifikasi Kehadiran...");
    setScanResult(idPeserta);

    try {
      const response = await adminMarkAttendance(idPeserta);

      if (response.success) {
        setStatus("success");
        setMessage(`Berhasil! ${response.data.full_name || "Peserta"} telah Check-in.`);
      } else {
        setStatus("error");
        setMessage(response.error || "Gagal: ID tidak valid atau sudah hadir.");
      }
    } catch (err) {
      setStatus("error");
      setMessage("Terjadi kesalahan sistem database.");
    } finally {
      setLoading(false);
      
      // Auto-restart scanner after 3 seconds
      setTimeout(() => {
        resetScanner();
      }, 3500);
    }
  };

  const resetScanner = () => {
    setStatus("idle");
    setMessage("");
    setScanResult(null);
    if (scannerRef.current) {
      scannerRef.current.resume();
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white flex flex-col font-inter selection:bg-indigo-500/30">
      
      {/* Header */}
      <header className="fixed top-0 w-full z-50 px-8 py-6 bg-black/40 backdrop-blur-xl border-b border-white/5 flex justify-between items-center">
        <Link href="/admin/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group">
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-bold">Back to Dashboard</span>
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Live Scanner Active</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-8 pt-24">
        
        <div className="w-full max-w-md text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-500/10 rounded-full border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-4">
            <ShieldCheck size={14} /> Auto-Gate V1.0
          </div>
          <h1 className="text-4xl font-black tracking-tight mb-2">NCC Attendance</h1>
          <p className="text-slate-500 font-medium">Pindai QR Code pada kartu ujian peserta untuk mencatat kehadiran secara otomatis.</p>
        </div>

        {/* Scanner Container */}
        <div className="relative group w-full max-w-sm">
           <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[2.5rem] blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
           
           <div className="relative bg-[#111113] border border-white/10 rounded-[2.2rem] overflow-hidden shadow-2xl">
              <div id="reader" className="w-full bg-black aspect-square overflow-hidden"></div>
              
              {/* Overlay for Scanning State */}
              <AnimatePresence>
                {status !== "idle" && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={`absolute inset-0 flex flex-col items-center justify-center p-8 text-center backdrop-blur-md ${
                      status === "success" ? "bg-emerald-950/80" : "bg-rose-950/80"
                    }`}
                  >
                    <motion.div
                      initial={{ scale: 0.5, rotate: -15 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="mb-4"
                    >
                      {status === "success" ? (
                        <CheckCircle2 className="w-20 h-20 text-emerald-400" />
                      ) : (
                        <XCircle className="w-20 h-20 text-rose-400" />
                      )}
                    </motion.div>
                    
                    <h3 className="text-2xl font-black mb-2 tracking-tight">
                      {status === "success" ? "Check-in Berhasil" : "Check-in Gagal"}
                    </h3>
                    <p className="text-white/80 font-medium text-sm leading-relaxed mb-6">
                      {message}
                    </p>
                    
                    <button 
                      onClick={resetScanner}
                      className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                    >
                      <RefreshCcw size={14} /> Tap to Continue
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
           </div>
        </div>

        {/* Legend / Status */}
        <div className="mt-12 flex gap-8">
           <div className="flex items-center gap-3">
              <div className="p-3 bg-white/5 rounded-2xl">
                <Camera className="text-indigo-400" size={20} />
              </div>
              <div className="text-left">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Camera</div>
                <div className="text-sm font-bold">Standard HD</div>
              </div>
           </div>
           <div className="flex items-center gap-3 border-l border-white/5 pl-8">
              <div className="p-3 bg-white/5 rounded-2xl">
                <RefreshCcw className="text-purple-400" size={20} />
              </div>
              <div className="text-left">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Status</div>
                <div className="text-sm font-bold">{loading ? "Processing..." : "Ready"}</div>
              </div>
           </div>
        </div>

      </main>

      {/* CSS overrides for html5-qrcode library to match aesthetic */}
      <style jsx global>{`
        #reader { border: none !important; }
        #reader__dashboard_section_csr button {
          background-color: #4F46E5 !important;
          color: white !important;
          border: none !important;
          padding: 8px 16px !important;
          border-radius: 8px !important;
          font-weight: bold !important;
          font-family: inherit !important;
          margin: 10px 0 !important;
          cursor: pointer !important;
        }
        #reader img { display: none; }
        #reader__scan_region { background: black !important; }
      `}</style>
    </div>
  );
}
