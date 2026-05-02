"use client";
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend,
  CartesianGrid,
  LineChart,
  Line,
  BarChart,
  Bar
} from "recharts";
import { Activity, PieChart as PieIcon, TrendingUp, Zap, Loader2, Check, X } from "lucide-react";

interface RingkasanTabProps {
  participants: any[];
  categoryData: any[];
  dailyTrendData: any[];
  isLoading: boolean;
  updatePaymentStatus: (id: string, status: string, reason?: string) => void;
  isProcessing: string | null;
}

export default function RingkasanTab({ 
  participants, 
  categoryData, 
  dailyTrendData, 
  isLoading,
  updatePaymentStatus,
  isProcessing
}: RingkasanTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* TREND HARIAN (MAHA KARYA STYLE) */}
      <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col h-[420px]">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="font-bold text-slate-800">Tren Pendaftaran Harian</h3>
            <p className="text-xs text-slate-500 font-medium">Lonjakan pendaftar NCC 13th secara real-time</p>
          </div>
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <TrendingUp size={20} />
          </div>
        </div>
        <div className="flex-1 w-full -ml-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyTrendData}>
              <defs>
                <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fill: '#94A3B8', fontWeight: 500 }} 
                dy={12}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fill: '#94A3B8', fontWeight: 500 }} 
                dx={-8}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', background: 'white', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} 
                itemStyle={{ fontSize: '11px', fontWeight: 'bold', color: '#2563EB' }}
              />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke="#2563EB" 
                strokeWidth={3} 
                dot={{ r: 4, fill: '#2563EB', strokeWidth: 2, stroke: '#fff' }} 
                activeDot={{ r: 7 }}
                animationDuration={1500}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* KATEGORI BAR (MAHA KARYA STYLE) */}
      <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col h-[420px]">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="font-bold text-slate-800">Peminat Terbanyak</h3>
            <p className="text-xs text-slate-500 font-medium">Berdasarkan kategori lomba</p>
          </div>
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <PieIcon size={20} />
          </div>
        </div>
        <div className="flex-1 relative">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fill: '#94A3B8', fontWeight: 500 }} 
                dy={12}
              />
              <Tooltip 
                cursor={{ fill: '#F8FAFC' }} 
                contentStyle={{ borderRadius: '12px', border: 'none', background: 'white', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} 
              />
              <Bar 
                dataKey="value" 
                fill="#3B82F6" 
                radius={[8, 8, 0, 0]} 
                barSize={36}
                animationDuration={1500}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
           <div className="text-center flex-1 border-r border-slate-50">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Entry</p>
              <p className="text-lg font-black text-slate-800">{participants.length}</p>
           </div>
           <div className="text-center flex-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live Status</p>
              <p className="text-lg font-black text-emerald-500">ACTIVE</p>
           </div>
        </div>
      </div>

      {/* TABLE RECENT ENTRIES (MAHA KARYA STYLE - REAL DATA INTEGRATION) */}
      <div className="lg:col-span-3 bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-black text-slate-800 tracking-tight">Pendaftaran Terbaru</h3>
            <p className="text-xs text-slate-500 font-medium">Inilah jantung data real-time dari pangkalan data Supabase.</p>
          </div>
          <button className="text-xs font-black uppercase text-blue-600 tracking-widest hover:text-blue-700 group transition-all">
             Lihat Semua Peserta <span className="inline-block group-hover:translate-x-1 transition-transform">→</span>
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-[#F8FAFC] text-[10px] text-slate-400 font-black border-b border-slate-50 uppercase tracking-widest">
              <tr>
                <th className="py-5 px-8">ID Pesanan</th>
                <th className="py-5 px-8">Nama Peserta</th>
                <th className="py-5 px-8">Kategori</th>
                <th className="py-5 px-8">Biaya</th>
                <th className="py-5 px-8">Status</th>
                <th className="py-5 px-8 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {participants.slice(0, 5).map((entry: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="py-5 px-8 font-bold text-slate-800 text-xs text-nowrap">NCC-{String(entry.id).slice(0, 8).toUpperCase()}</td>
                  <td className="py-5 px-8 flex items-center gap-3 min-w-[200px]">
                     <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xs uppercase shadow-sm group-hover:scale-110 transition-transform flex-shrink-0">
                       {(entry.full_name || entry.email || "P").charAt(0)}
                     </div>
                     <div className="flex flex-col min-w-0">
                        <span className="font-bold text-slate-900 leading-none mb-1 truncate">{entry.full_name || "Peserta Anonim"}</span>
                        <span className="text-[10px] text-slate-400 font-medium truncate">{entry.email}</span>
                     </div>
                  </td>
                  <td className="py-5 px-8 font-medium italic text-slate-500 whitespace-nowrap">{entry.category || "Belum Pilih"}</td>
                  <td className="py-5 px-8 font-black text-slate-900 text-xs">Rp 150.000</td>
                  <td className="py-5 px-8">
                    <div className="flex flex-col gap-2">
                       <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black flex items-center w-max gap-1.5 uppercase tracking-wider
                        ${entry.payment_status === 'Verified' ? 'bg-emerald-50 text-emerald-600' : 
                          entry.payment_status === 'Pending' ? 'bg-amber-50 text-amber-600' : 
                          entry.payment_status === 'Rejected' ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-600'}
                      `}>
                        <div className={`w-1.5 h-1.5 rounded-full ${entry.payment_status === 'Verified' ? 'bg-emerald-500' : entry.payment_status === 'Pending' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : entry.payment_status === 'Rejected' ? 'bg-rose-500' : 'bg-slate-500'}`}></div>
                        {entry.payment_status || "Pending"}
                      </span>
                      
                      {entry.payment_proof_url && (
                        <a 
                          href={entry.payment_proof_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[9px] font-black text-blue-600 hover:text-indigo-700 flex items-center gap-1 uppercase tracking-widest border-b border-transparent hover:border-blue-600 w-max transition-all"
                        >
                          Lihat Bukti TF <TrendingUp size={10} />
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="py-5 px-8">
                    <div className="flex items-center justify-center gap-2">
                       {entry.payment_status === 'Pending' ? (
                          <>
                             <button 
                                onClick={() => updatePaymentStatus(entry.id, 'Verified')}
                                disabled={!!isProcessing}
                                className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all shadow-sm active:scale-90 disabled:opacity-50"
                                title="Terima Pembayaran"
                             >
                                {isProcessing === entry.id ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} strokeWidth={3} />}
                             </button>
                             <button 
                                onClick={() => {
                                   const reason = prompt("Masukkan alasan penolakan (misal: Bukti TF buram, dll):");
                                   if (reason) updatePaymentStatus(entry.id, 'Rejected', reason);
                                }}
                                disabled={!!isProcessing}
                                className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all shadow-sm active:scale-90 disabled:opacity-50"
                                title="Tolak Pembayaran"
                             >
                                {isProcessing === entry.id ? <Loader2 className="animate-spin" size={14} /> : <X size={14} strokeWidth={3} />}
                             </button>
                          </>
                       ) : (
                          <div className="w-8 h-8 rounded-lg bg-slate-50 text-slate-300 flex items-center justify-center">
                             <Check size={14} strokeWidth={3} />
                          </div>
                       )}
                    </div>
                  </td>
                </tr>
              ))}
              {participants.length === 0 && (
                <tr>
                   <td colSpan={5} className="py-20 text-center text-slate-400 font-bold italic">Belum ada jantung data yang berdenyut...</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
