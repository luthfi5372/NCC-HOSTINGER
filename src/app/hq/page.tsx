"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client"; 
import { 
  LayoutDashboard, Users, FileCheck, Settings, 
  ArrowUpRight, ArrowDownRight, Download, Calendar, 
  Bell, MoreHorizontal, Sparkles
} from "lucide-react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from "recharts";

const chartData = [
  { name: "15 Apr", pendaftar: 4000 },
  { name: "16 Apr", pendaftar: 3000 },
  { name: "17 Apr", pendaftar: 5000 },
  { name: "18 Apr", pendaftar: 4500 },
  { name: "19 Apr", pendaftar: 6000 },
  { name: "20 Apr", pendaftar: 8000 },
  { name: "21 Apr", pendaftar: 10000 },
];

const barData = [
  { name: "Olimpiade", total: 8162 },
  { name: "Speech", total: 4000 },
  { name: "LKTI", total: 3200 },
];

export default function ModernHQDashboard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [realEntries, setRealEntries] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    const fetchRealData = async () => {
      try {
        const { data, error } = await supabase
          .from('competition_entries')
          .select('*')
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

    fetchRealData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-800 font-sans overflow-hidden">
      
      <aside className="w-64 bg-white border-r border-slate-100 flex flex-col justify-between p-6">
        <div>
          <div className="flex items-center gap-3 mb-10 px-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-200">
              🏆
            </div>
            <span className="font-bold text-xl tracking-tight">NCC HQ.</span>
          </div>

          <nav className="space-y-2">
            <NavItem icon={<LayoutDashboard size={20} />} text="Dashboard" active />
            <NavItem icon={<Users size={20} />} text="Peserta" />
            <NavItem icon={<FileCheck size={20} />} text="Verifikasi" badge={realEntries.filter(e => e.payment_status === 'Pending').length.toString()} />
            <NavItem icon={<Settings size={20} />} text="Pengaturan" />
          </nav>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 text-white shadow-xl shadow-blue-200/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-20"><Sparkles size={40}/></div>
          <h4 className="font-bold mb-1 relative z-10">Fase Kompetisi</h4>
          <p className="text-blue-100 text-xs mb-4 relative z-10">Pendaftaran Gelombang 1 berlangsung.</p>
          <button className="w-full bg-white text-blue-700 text-sm font-bold py-2 rounded-xl hover:bg-blue-50 transition-colors relative z-10">
            Tutup Pendaftaran
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8 relative">
        
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-500 text-sm mt-1">Pantau pergerakan data pendaftaran NCC 13th.</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 shadow-sm cursor-pointer hover:bg-slate-50">
              <Calendar size={16} className="text-slate-400" />
              April 2026
            </div>
            <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md shadow-blue-200">
              <Download size={16} />
              Export CSV
            </button>
            <div className="h-10 w-10 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-600 shadow-sm ml-2 relative">
              <Bell size={18} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total Pendaftar" value={realEntries.length.toString()} trend="Live" isUp={true} />
          <StatCard title="Terverifikasi" value={realEntries.filter(e => e.payment_status === 'Verified').length.toString()} trend="Aman" isUp={true} />
          <StatCard title="Menunggu Review" value={realEntries.filter(e => e.payment_status === 'Pending').length.toString()} trend="Action Needed" isUp={false} />
          <StatCard title="Estimasi Dana" value={`Rp ${(realEntries.length * 150000).toLocaleString('id-ID')}`} trend="IDR" isUp={true} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm col-span-2">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-bold text-slate-800">Tren Pendaftaran Harian</h3>
                <p className="text-xs text-slate-500">Data visualisasi</p>
              </div>
              <MoreHorizontal size={20} className="text-slate-400 cursor-pointer" />
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12}} dx={-10} />
                  <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  <Line type="monotone" dataKey="pendaftar" stroke="#2563EB" strokeWidth={3} dot={{r: 4, fill: '#2563EB', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
             <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-800">Peminat Kategori</h3>
              <MoreHorizontal size={20} className="text-slate-400" />
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12}} dy={10} />
                  <Tooltip cursor={{fill: '#F1F5F9'}} contentStyle={{borderRadius: '12px', border: 'none'}} />
                  <Bar dataKey="total" fill="#3B82F6" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-800">Antrean Pendaftaran Asli</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/50 text-slate-500 font-medium border-b border-slate-100">
                <tr>
                  <th className="py-4 px-6">ID</th>
                  <th className="py-4 px-6">NAMA PESERTA</th>
                  <th className="py-4 px-6">KATEGORI</th>
                  <th className="py-4 px-6">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {realEntries.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">Belum ada pendaftar di radar...</td>
                  </tr>
                ) : (
                  realEntries.map((entry: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6 font-medium text-slate-800">NCC-{entry.id}</td>
                      <td className="py-4 px-6 flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500 text-xs uppercase">
                           {(entry.full_name || entry.email || "U").charAt(0)}
                         </div>
                         {entry.full_name || entry.email || "Peserta Anonim"}
                      </td>
                      <td className="py-4 px-6">{entry.category || "Belum Pilih"}</td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center w-max gap-1
                          ${entry.payment_status === 'Verified' ? 'bg-green-50 text-green-600' : 
                            entry.payment_status === 'Pending' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-600'}
                        `}>
                          <div className={`w-1.5 h-1.5 rounded-full ${entry.payment_status === 'Verified' ? 'bg-green-500' : entry.payment_status === 'Pending' ? 'bg-amber-500' : 'bg-slate-500'}`}></div>
                          {entry.payment_status || "Belum Bayar"}
                        </span>
                        
                        {entry.payment_proof_url && (
                          <a href={entry.payment_proof_url} target="_blank" rel="noreferrer" className="mt-2 text-[10px] text-blue-600 hover:underline block font-bold">
                            🔍 LIHAT BUKTI TF
                          </a>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}

function NavItem({ icon, text, active = false, badge }: { icon: React.ReactNode, text: string, active?: boolean, badge?: string }) {
  return (
    <div className={`flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-all font-medium text-sm
      ${active ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}
    `}>
      <div className="flex items-center gap-3">
        {icon}
        <span>{text}</span>
      </div>
      {badge && badge !== "0" && (
        <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </div>
  );
}

function StatCard({ title, value, trend, isUp }: { title: string, value: string, trend: string, isUp: boolean }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
      <h4 className="text-slate-500 font-medium text-sm mb-4">{title}</h4>
      <div className="flex items-end justify-between">
        <h2 className="text-3xl font-bold text-slate-800 tracking-tight">{value}</h2>
        <span className={`flex items-center text-xs font-bold px-2 py-1 rounded-md
          ${isUp ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}
        `}>
          {isUp ? <ArrowUpRight size={14} className="mr-1"/> : <ArrowDownRight size={14} className="mr-1"/>}
          {trend}
        </span>
      </div>
    </div>
  );
}
