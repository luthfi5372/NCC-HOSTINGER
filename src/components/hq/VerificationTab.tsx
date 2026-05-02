"use client";
import { Zap, Megaphone, Loader2, ShieldCheck } from "lucide-react";

interface VerificationTabProps {
  broadcastText: string;
  setBroadcastText: (text: string) => void;
  isSaving: boolean;
  saveSettings: () => void;
  isLoading: boolean;
  participants: any[];
  categoryFilter: string;
  setCategoryFilter: (filter: string) => void;
  isProcessing: string | null;
  setViewImage: (url: string) => void;
  updatePaymentStatus: (id: string, status: string, reason?: string) => void;
}

export default function VerificationTab({
  broadcastText,
  setBroadcastText,
  isSaving,
  saveSettings,
  isLoading,
  participants,
  categoryFilter,
  setCategoryFilter,
  isProcessing,
  setViewImage,
  updatePaymentStatus
}: VerificationTabProps) {
  return (
    <>
      {/* TERMINAL SIARAN (Kolom Kiri) */}
      <div className="lg:col-span-1 bg-white/70 backdrop-blur-xl border border-white/60 shadow-lg p-8 rounded-3xl h-fit animate-in fade-in slide-in-from-left-4 duration-500">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-blue-100 rounded-xl text-blue-600">
            <Megaphone size={20} />
          </div>
          <h3 className="text-xl font-black text-slate-800 tracking-tight">Terminal Siaran</h3>
        </div>
        <p className="text-xs text-slate-500 mb-6 font-bold uppercase tracking-widest opacity-60">Broadcast Pusat Perintah</p>
        
        <textarea 
          value={broadcastText}
          onChange={(e) => setBroadcastText(e.target.value)}
          className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl p-4 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-44 mb-4 transition-all text-sm font-medium"
          placeholder="Ketik pengumuman global..."
        ></textarea>
        <button 
          onClick={() => saveSettings()}
          disabled={isSaving}
          className="w-full py-4 bg-slate-900 hover:bg-blue-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2"
        >
          {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
          {isSaving ? "Sinkronisasi..." : "Kirim Siaran Global"}
        </button>
      </div>

      {/* TABEL ANTREAN VERIFIKASI (Kolom Kanan) */}
      <div className="lg:col-span-2 bg-white/70 backdrop-blur-xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 rounded-3xl overflow-hidden flex flex-col animate-in fade-in slide-in-from-right-4 duration-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <span className="animate-pulse">⚡</span> Antrean Verifikasi
            </h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Radar Peninjauan Aktif</p>
          </div>
          
          {/* Radar Filter Mini */}
          <div className="flex items-center gap-2">
            <select 
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-black uppercase focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer"
            >
              <option value="ALL">Semua Kategori</option>
              <option value="Olimpiade MIPA">MIPA</option>
              <option value="Speech Contest">Speech</option>
              <option value="LKTI Nasional">LKTI</option>
              <option value="MTQ Nasional">MTQ</option>
            </select>
          </div>
        </div>
        
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] text-slate-400 uppercase tracking-[0.2em] font-black">
                <th className="pb-6">Peserta</th>
                <th className="pb-6">Kategori</th>
                <th className="pb-6 text-center">Bukti TF</th>
                <th className="pb-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {isLoading ? (
                <tr><td colSpan={4} className="py-12 text-center text-slate-400 animate-pulse font-black uppercase tracking-widest text-[10px]">Scanning radar data...</td></tr>
              ) : participants.filter(e => e.payment_status === 'Pending').length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3 opacity-30">
                      <ShieldCheck size={48} className="text-slate-400" />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic">Radar bersih. Tidak ada antrean.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                participants
                  .filter(e => e.payment_status === 'Pending')
                  .filter(e => categoryFilter === 'ALL' || e.category === categoryFilter)
                  .map((row) => (
                  <tr key={row.id} className="border-b border-slate-50 group hover:bg-slate-50/50 transition-all">
                    <td className="py-6">
                      <p className="font-black text-slate-800 uppercase text-xs tracking-wide">{row.full_name}</p>
                      <p className="text-[10px] font-bold text-slate-400">{row.school}</p>
                    </td>
                    <td className="py-6">
                      <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-lg border border-indigo-100 uppercase">{row.category}</span>
                    </td>
                    <td className="py-6 text-center">
                      {row.payment_proof_url || row.paymentProofUrl ? (
                        <button 
                          onClick={() => setViewImage(row.payment_proof_url || row.paymentProofUrl)}
                          className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl text-[10px] font-black transition-all border border-blue-100"
                        >
                          LIHAT BUKTI
                        </button>
                      ) : (
                        <span className="text-[10px] text-rose-400 font-bold italic uppercase tracking-tighter">No Upload</span>
                      )}
                    </td>
                    <td className="py-6 text-right">
                      <div className="flex justify-end gap-2 text-white">
                        <button 
                          onClick={() => updatePaymentStatus(row.id, 'Verified')}
                          disabled={isProcessing === row.id}
                          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-lg shadow-emerald-100 transition-all active:scale-95 disabled:opacity-50"
                        >
                          {isProcessing === row.id ? "..." : "Terima"}
                        </button>
                        <button 
                          onClick={() => {
                            const reason = prompt("Masukkan alasan penolakan (misal: Bukti TF buram, dll):");
                            if (reason) updatePaymentStatus(row.id, 'Rejected', reason);
                          }}
                          disabled={isProcessing === row.id}
                          className="px-4 py-2 bg-rose-500 hover:bg-rose-600 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-lg shadow-rose-100 transition-all active:scale-95 disabled:opacity-50"
                        >
                          Tolak
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
           </table>
        </div>
      </div>
    </>
  );
}
