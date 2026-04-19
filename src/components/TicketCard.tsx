"use client";
import QRCode from "react-qr-code";
import { Printer, Download, X, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TicketCardProps {
  data: {
    id: string;
    fullName: string;
    school: string;
    category: string;
    city: string;
  };
  onClose?: () => void;
}

export default function TicketCard({ data, onClose }: TicketCardProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full flex flex-col items-center">
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-ticket, #printable-ticket * {
            visibility: visible;
          }
          #printable-ticket {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* ─── SCREEN VIEW (Liquid Glass) ─── */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="no-print relative w-full max-w-lg overflow-hidden rounded-[2.5rem] bg-white/10 backdrop-blur-2xl border border-white/20 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)]"
      >
        {/* Decorative Background Elements */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/20 blur-[80px] rounded-full" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500/20 blur-[80px] rounded-full" />
        
        {/* Header */}
        <div className="relative p-8 pb-4 flex justify-between items-start">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase text-indigo-300 tracking-widest mb-3 border border-white/5">
              <Trophy size={12}/> Official E-Ticket
            </div>
            <h3 className="text-3xl font-black text-white tracking-tighter">NCC 13th</h3>
          </div>
          {onClose && (
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white/40">
              <X size={20} />
            </button>
          )}
        </div>

        {/* QR Section */}
        <div className="relative px-8 pt-4 pb-8 flex flex-col items-center">
          <div className="bg-white p-6 rounded-[2rem] shadow-2xl mb-8 group transition-transform hover:scale-[1.02]">
            <QRCode 
              value={data.id} 
              size={180} 
              viewBox={`0 0 256 256`}
              style={{ height: "auto", maxWidth: "100%", width: "100%" }}
            />
          </div>

          {/* Info Grid */}
          <div className="w-full grid grid-cols-2 gap-6 text-white mb-8">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Nama Peserta</span>
              <p className="font-bold text-sm tracking-tight truncate">{data.fullName}</p>
            </div>
            <div className="space-y-1 text-right">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">ID Registrasi</span>
              <p className="font-mono text-sm font-bold tracking-tight text-indigo-300">NCC-{data.id.slice(0, 8).toUpperCase()}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Delegasi Lomba</span>
              <p className="font-bold text-sm tracking-tight truncate">{data.category}</p>
            </div>
            <div className="space-y-1 text-right">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Asal Sekolah</span>
              <p className="font-bold text-sm tracking-tight truncate">{data.school}</p>
            </div>
          </div>

          <button 
            onClick={handlePrint}
            className="w-full py-4 bg-indigo-600 hover:bg-slate-900 text-white rounded-2xl font-black text-sm transition-all shadow-xl shadow-indigo-500/20 active:scale-95 flex items-center justify-center gap-3"
          >
            <Printer size={18} /> Download / Cetak PDF
          </button>
          
          <p className="mt-6 text-[11px] text-white/30 font-medium text-center leading-relaxed">
            Scan QR ini di loket registrasi pada hari-H.<br />Tanda terima digital ini sah sebagai bukti pendaftaran resmi.
          </p>
        </div>
      </motion.div>

      {/* ─── PRINT VIEW (Minimalist) ─── */}
      <div id="printable-ticket" className="hidden print:block w-[180mm] h-[100mm] border-2 border-black p-8 rounded-lg mx-auto bg-white text-black font-sans">
        <div className="flex justify-between items-center border-b-[3px] border-black pb-6 mb-8">
          <div>
            <h1 className="text-4xl font-black tracking-tighter">KARTU UJIAN NCC 13</h1>
            <p className="text-lg font-bold uppercase tracking-widest text-gray-500 mt-1">National Creativity Competition</p>
          </div>
          <div className="text-right">
            <p className="font-black text-2xl">2026 / 2027</p>
            <p className="text-sm font-bold bg-black text-white px-3 py-1 mt-2">OFFICIAL DELEGATE</p>
          </div>
        </div>
        
        <div className="flex justify-between items-stretch gap-12">
          <div className="flex-1 space-y-6">
            <div>
               <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Nama Lengkap</span>
               <p className="text-2xl font-black">{data.fullName.toUpperCase()}</p>
            </div>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Asal Sekolah</span>
                <p className="text-lg font-bold">{data.school}</p>
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Bidang Lomba</span>
                <p className="text-lg font-bold">{data.category}</p>
              </div>
            </div>
            <div>
               <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Nomor Peserta</span>
               <p className="text-xl font-mono font-black">NCC-{data.id.toUpperCase()}</p>
            </div>
          </div>
          
          <div className="flex flex-col items-center justify-center border-4 border-black p-4 bg-white shrink-0">
            <QRCode value={data.id} size={160} level="H" />
            <p className="mt-4 font-black text-xs tracking-[0.3em]">AUTO-GATE QR</p>
          </div>
        </div>
        
        <div className="mt-10 border-t-2 border-dashed border-gray-300 pt-6 flex justify-between items-center">
          <p className="text-[10px] font-medium text-gray-400 max-w-sm">
            *Bawa kartu ini pada hari pelaksanaan (25 Juli 2026) dan pindai di gerbang masuk otomatis. Kartu ini hanya berlaku untuk 1 kali registrasi.
          </p>
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-widest">Panitia Pelaksana</p>
            <p className="text-sm font-bold">NCC Central Committee</p>
          </div>
        </div>
      </div>
    </div>
  );
}
