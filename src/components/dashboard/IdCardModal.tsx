import { useRef, useState } from "react";
import * as htmlToImage from 'html-to-image';
import { ImageIcon, Printer, X } from "lucide-react";

interface IdCardModalProps {
  userEntry: any;
  setShowIdCard: (val: boolean) => void;
  showToast: (msg: string, type: "success" | "error") => void;
}

export default function IdCardModal({ userEntry, setShowIdCard, showToast }: IdCardModalProps) {
  const idCardRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadCard = async () => {
    if (!idCardRef.current) {
      return showToast('Sistem belum siap, coba sebentar lagi.', 'error');
    }
    setIsDownloading(true);
    try {
      const dataUrl = await htmlToImage.toPng(idCardRef.current, {
        quality: 1.0,
        pixelRatio: 2,
      });
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `ID_Card_NCC_${userEntry?.full_name?.replace(/\s+/g, '_') || 'Peserta'}.png`;
      link.click();
      showToast('ID Card berhasil diunduh sebagai PNG!', 'success');
    } catch (err) {
      console.error('Detail Error:', err);
      showToast('Gagal mengunduh. Coba lagi.', 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 print:bg-white print:p-0">
      
      <div className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-sm w-full relative print:shadow-none print:w-[350px]">
        {/* ====== AREA FOTO — dimensi tetap, anti text-wrap ====== */}
        <div className="p-3 flex justify-center">
          <div 
            ref={idCardRef} 
            className="rounded-2xl overflow-hidden flex flex-col"
            style={{ width: '320px', height: '460px', backgroundColor: '#1e3a8a' }}
          >
            {/* Header biru */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-800 p-7 text-center text-white">
              <h2 className="font-black text-2xl tracking-tight whitespace-nowrap">NCC 13th</h2>
              <p className="text-blue-200 text-[10px] font-bold tracking-widest uppercase mt-1 whitespace-nowrap">Official Participant Card</p>
            </div>

            {/* Body putih */}
            <div className="flex-1 p-5 text-center bg-white flex flex-col items-center">
              <div className="w-16 h-16 bg-blue-50 rounded-full mx-auto -mt-12 border-4 border-white flex items-center justify-center text-2xl font-black text-blue-600 mb-2 shadow-lg shrink-0">
                {userEntry?.full_name?.charAt(0).toUpperCase() || "P"}
              </div>

              <h3 className="font-black text-lg text-slate-800 uppercase mb-1 whitespace-nowrap overflow-hidden text-ellipsis w-full px-2">{userEntry?.full_name}</h3>
              <div className="inline-block px-3 py-1 bg-blue-50 text-blue-600 font-bold text-[11px] rounded-full mb-4 border border-blue-100 whitespace-nowrap">
                {userEntry?.competition_type}
              </div>

              <div className="w-full bg-slate-50 p-3 rounded-xl mb-3 border border-slate-100 text-left space-y-2">
                <div>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider whitespace-nowrap">ID Tiket Resmi</p>
                  <p className="text-sm font-black text-slate-700 font-mono whitespace-nowrap">NCC-{userEntry?.id ? String(userEntry.id).substring(0,6).toUpperCase() : "XXXXXX"}</p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider whitespace-nowrap">Asal Instansi</p>
                  <p className="text-xs font-bold text-slate-700 truncate" title={userEntry?.school_name}>{userEntry?.school_name}</p>
                </div>
              </div>
            </div>

            {/* Pita Dekorasi */}
            <div className="h-2 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 shrink-0"></div>
          </div>
        </div>
        {/* ====== BATAS AREA FOTO ====== */}

        {/* Tombol Aksi — DI LUAR REF agar tidak ikut terfoto */}
        <div className="flex gap-2 p-4 print:hidden">
          <button
            onClick={handleDownloadCard}
            disabled={isDownloading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-200 active:scale-95 text-sm"
          >
            {isDownloading ? (
              <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div> Memproses...</>
            ) : (
              <><ImageIcon size={16} /> Unduh PNG</>
            )}
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
            title="Cetak"
          >
            <Printer size={18} />
          </button>
          <button
            onClick={() => setShowIdCard(false)}
            className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
            title="Tutup"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Latar Belakang Gelap Penutup Modal */}
      <div className="absolute inset-0 z-[-1] print:hidden" onClick={() => setShowIdCard(false)}></div>
    </div>
  );
}
