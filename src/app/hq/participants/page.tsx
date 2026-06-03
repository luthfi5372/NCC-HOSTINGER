'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { 
  LayoutGrid, Users, BadgeCheck, Megaphone, 
  Calendar, Image as ImageIcon, Server, Settings,
  LogOut, ShieldCheck, Clock, Search, Loader2, MoreVertical, FileText
} from 'lucide-react';

export default function ParticipantsBook() {
  const router = useRouter();
  const supabase = createClient();
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [entryCount, setEntryCount] = useState<number | null>(null);

  useEffect(() => {
    const fetchParticipants = async () => {
      const { data } = await supabase.from('cbt_participants').select('*').order('full_name', { ascending: true });
      if (data) setParticipants(data);
      setLoading(false);
    };
    const fetchEntryCount = async () => {
      const { count } = await supabase
        .from('competition_entries')
        .select('*', { count: 'exact', head: true });
      if (count !== null) setEntryCount(count);
    };
    fetchParticipants();
    fetchEntryCount();
  }, []);

  const handleLogout = async () => {
    try { await supabase.auth.signOut(); } catch (_) {}
    try {
      const { logoutLocalUser } = await import("@/app/actions/auth");
      await logoutLocalUser();
    } catch (_) {
      router.push('/login');
    }
  };

  const filteredParticipants = participants.filter(p => 
    p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.school_origin?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.branch?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-[#f8fafc] font-sans text-gray-800">
      
      {/* 1. SIDEBAR */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-gray-100 flex-col fixed h-full z-20">
        <div className="p-6 flex items-center space-x-3 mt-2">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-200/50">
            <ShieldCheck className="w-6 h-6 text-white" fill="currentColor" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-gray-900 leading-none">NCC HQ.</h1>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Command Center</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
          <Link href="/hq" className="flex items-center space-x-3 px-4 py-3 text-gray-500 hover:bg-gray-50 rounded-xl transition-all font-semibold text-sm">
            <LayoutGrid className="w-5 h-5" />
            <span>Dashboard</span>
          </Link>
          
          {/* ACTIVE MENU: Buku Peserta */}
          <Link href="/hq?tab=Peserta" className="flex items-center justify-between px-4 py-3 bg-slate-900 text-white rounded-xl shadow-md shadow-slate-200 transition-all font-semibold text-sm">
            <div className="flex items-center space-x-3">
               <Users className="w-5 h-5 text-indigo-400" />
               <span>Buku Peserta</span>
            </div>
            <span className="bg-indigo-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{entryCount ?? '...'}</span>
          </Link>
          
          <Link href="/hq?tab=Verifikasi" className="flex items-center justify-between px-4 py-3 text-gray-500 hover:bg-gray-50 rounded-xl transition-all font-semibold text-sm">
            <div className="flex items-center space-x-3">
               <BadgeCheck className="w-5 h-5" />
               <span>Verifikasi Berkas</span>
            </div>
            <span className="bg-gray-100 text-gray-400 text-[10px] font-black px-2 py-0.5 rounded-full">0</span>
          </Link>
          
          <Link href="/hq/llms/broadcast" className="flex items-center space-x-3 px-4 py-3 text-gray-500 hover:bg-gray-50 rounded-xl transition-all font-semibold text-sm">
            <Megaphone className="w-5 h-5" />
            <span>Siaran Info</span>
          </Link>
          
          <Link href="/hq?tab=Kegiatan" className="flex items-center space-x-3 px-4 py-3 text-gray-500 hover:bg-gray-50 rounded-xl transition-all font-semibold text-sm">
            <Calendar className="w-5 h-5" />
            <span>Kegiatan</span>
          </Link>

          <Link href="/hq?tab=Timeline" className="flex items-center space-x-3 px-4 py-3 text-gray-500 hover:bg-gray-50 rounded-xl transition-all font-semibold text-sm">
            <Calendar className="w-5 h-5" />
            <span>Kelola Timeline Lomba</span>
          </Link>

          <Link href="/hq?tab=Schedule" className="flex items-center space-x-3 px-4 py-3 text-gray-500 hover:bg-gray-50 rounded-xl transition-all font-semibold text-sm">
            <FileText className="w-5 h-5" />
            <span>Kelola Halaman Depan</span>
          </Link>
          
          <Link href="/hq?tab=Media" className="flex items-center space-x-3 px-4 py-3 text-gray-500 hover:bg-gray-50 rounded-xl transition-all font-semibold text-sm">
            <ImageIcon className="w-5 h-5" />
            <span>Kelola Media</span>
          </Link>
          
          <Link href="/hq/llms" className="flex items-center justify-between px-4 py-3 text-gray-500 hover:bg-gray-50 rounded-xl transition-all font-semibold text-sm">
            <div className="flex items-center space-x-3">
              <Server className="w-5 h-5" />
              <span>Manajemen LLMS</span>
            </div>
          </Link>

          <Link href="/hq/settings" className="flex items-center space-x-3 px-4 py-3 text-gray-500 hover:bg-gray-50 rounded-xl transition-all font-semibold text-sm">
            <Settings className="w-5 h-5" />
            <span>Pengaturan</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-gray-100 mt-auto">
          <button onClick={handleLogout} className="w-full flex items-center justify-center space-x-3 px-4 py-3 text-rose-500 hover:bg-rose-50 rounded-xl transition-all font-bold text-sm">
            <LogOut className="w-5 h-5" />
            <span>Keluar Sesi</span>
          </button>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        
        {/* HEADER TOP BAR */}
        <header className="bg-white/80 backdrop-blur-md sticky top-0 z-10 px-6 md:px-8 py-5 flex justify-between items-center border-b border-gray-100">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">Buku Peserta Utama</h2>
            <p className="text-[10px] md:text-xs text-gray-400 font-bold mt-0.5">Database pendaftar & finalis NCC 13th.</p>
          </div>
        </header>

        {/* CONTENT */}
        <div className="p-6 md:p-8 space-y-6 flex-1">
          
          {/* SEARCH & FILTER BAR */}
          <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:w-96">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-11 pr-4 py-3 bg-gray-50 border-transparent rounded-[16px] text-sm font-semibold text-gray-800 placeholder-gray-400 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
                placeholder="Cari nama, username, sekolah, cabang..."
              />
            </div>
            
            <div className="flex space-x-3 w-full sm:w-auto">
               <button className="flex-1 sm:flex-none px-6 py-3 bg-indigo-50 text-indigo-600 font-bold text-xs uppercase tracking-widest rounded-[16px] hover:bg-indigo-100 transition-all flex items-center justify-center">
                 <Users className="w-4 h-4 mr-2" /> Import CSV
               </button>
               <button className="flex-1 sm:flex-none px-6 py-3 bg-slate-900 text-white font-bold text-xs uppercase tracking-widest rounded-[16px] shadow-md shadow-slate-200 hover:bg-slate-800 transition-all flex items-center justify-center">
                 Tambah Manual
               </button>
            </div>
          </div>

          {/* DATA TABLE */}
          <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center">
                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
                <p className="text-sm font-bold text-gray-500 animate-pulse">Menarik data arsip peserta...</p>
              </div>
            ) : filteredParticipants.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-center px-4">
                <Users className="w-16 h-16 text-gray-200 mb-4" />
                <h3 className="text-lg font-black text-gray-700">Tidak ada data ditemukan</h3>
                <p className="text-sm font-medium text-gray-400 mt-1 max-w-sm">Data peserta kosong atau tidak ada hasil yang cocok dengan pencarian "{searchTerm}".</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50/50 text-gray-400 text-[10px] uppercase tracking-widest border-b border-gray-100">
                      <th className="py-5 px-6 font-black">Informasi Peserta</th>
                      <th className="py-5 px-6 font-black">Asal Sekolah</th>
                      <th className="py-5 px-6 font-black">Cabang / Jalur</th>
                      <th className="py-5 px-6 font-black text-center">Status</th>
                      <th className="py-5 px-6 font-black text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm divide-y divide-gray-50">
                    {filteredParticipants.map((p) => (
                      <tr key={p.id} className="hover:bg-indigo-50/30 transition-colors group">
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-600 font-black text-xs uppercase border border-indigo-200/50">
                              {p.full_name?.substring(0, 2)}
                            </div>
                            <div>
                              <p className="font-black text-gray-900 group-hover:text-indigo-600 transition-colors">{p.full_name}</p>
                              <p className="text-[10px] font-mono text-gray-400 mt-0.5">@{p.username}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <p className="font-semibold text-gray-700">{p.school_origin || '-'}</p>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${
                            p.branch?.toUpperCase() === 'MIPA' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                            p.branch?.toUpperCase() === 'TIK' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                            'bg-gray-100 text-gray-600 border border-gray-200'
                          }`}>
                            {p.branch || 'UMUM'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className={`inline-block w-2.5 h-2.5 rounded-full ${p.is_active ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-rose-500'}`}></span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button className="p-2 text-gray-400 hover:bg-white hover:text-indigo-600 rounded-lg transition-all shadow-sm opacity-0 group-hover:opacity-100">
                            <MoreVertical className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
