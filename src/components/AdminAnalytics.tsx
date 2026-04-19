"use client";

import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";
import { motion } from "framer-motion";
import { CompetitionEntry } from "@/lib/localAuth";

export default function AdminAnalytics({ entries }: { entries: CompetitionEntry[] }) {
  const stats = useMemo(() => {
    // Categories count
    const cats = entries.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const categoryData = Object.keys(cats).map(key => ({
      name: key.replace(" Nasional", ""),
      Pelamar: cats[key]
    }));

    // Status count
    const waitCnt = entries.filter(e => e.paymentStatus === "Wait" || e.paymentStatus === "None").length;
    const paidCnt = entries.filter(e => e.paymentStatus === "Paid").length;
    const verfCnt = entries.filter(e => e.paymentStatus === "Verified").length;

    const statusData = [
      { name: "Selesai", value: verfCnt, color: "#10b981" }, // Emerald 500
      { name: "Menunggu Acc", value: paidCnt, color: "#6366f1" }, // Indigo 500
      { name: "Belum Bayar", value: waitCnt, color: "#f59e0b" }, // Amber 500
    ];

    // Submission Timeline (last items)
    const timelineData = entries
      .slice()
      .sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime())
      .map(e => ({
        waktu: new Date(e.submittedAt).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' }),
        jumlah: 1
      }))
      .reduce((acc, curr) => {
        const existing = acc.find((x: any) => x.waktu === curr.waktu);
        if (existing) existing.jumlah += 1;
        else acc.push(curr);
        return acc;
      }, [] as any[])
      .slice(-10); // Last 10 days

    return { categoryData, statusData, timelineData };
  }, [entries]);

  if (!entries || entries.length === 0) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 font-inter">
      {/* Kategori Lomba Analytics */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
      >
        <h3 className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-6">Pendaftar Per Kategori</h3>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.categoryData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip 
                 cursor={{ fill: "rgba(255,255,255,0.05)" }}
                 contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", fontSize: "12px", color: "white" }} 
                 itemStyle={{ fontSize: "12px", fontWeight: "bold" }}
              />
              <Bar dataKey="Pelamar" radius={[4, 4, 0, 0]}>
                {stats.categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={["#818cf8", "#34d399", "#fbbf24", "#f472b6"][index % 4]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Status Keuangan Analytics */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
      >
        <h3 className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-6">Status Pembayaran</h3>
        <div className="flex flex-col gap-5">
          {stats.statusData.map((s, i) => (
            <div key={i} className="flex flex-col gap-2">
               <div className="flex justify-between items-center text-[12px] font-bold text-white">
                 <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                    {s.name}
                 </span>
                 <span>{s.value} orang</span>
               </div>
               <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                 <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: `${entries.length > 0 ? (s.value / entries.length) * 100 : 0}%` }}
                   transition={{ duration: 1, delay: 0.5 }}
                   className="h-full rounded-full"
                   style={{ backgroundColor: s.color }}
                 />
               </div>
            </div>
          ))}
          <div className="mt-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
            Total Dana Masuk: Rp {((stats.statusData[0].value) * 150000).toLocaleString('id-ID')}
          </div>
        </div>
      </motion.div>

      {/* Traffic Analytics */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
      >
        <h3 className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-6">Arus Pendaftaran Live</h3>
        <div className="h-48 w-full -ml-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.timelineData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#818cf8" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="waktu" tick={{ fill: "#94a3b8", fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip 
                 contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", fontSize: "12px", color: "white" }} 
                 itemStyle={{ fontSize: "12px", fontWeight: "bold" }}
              />
              <Area type="monotone" dataKey="jumlah" stroke="#818cf8" strokeWidth={3} fillOpacity={1} fill="url(#colorPv)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
}
