'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  LayoutGrid, Users, BadgeCheck, Megaphone, 
  Calendar, Image as ImageIcon, Server, Settings,
  LogOut, UserCircle, ShieldCheck, BellRing, Database, Clock
} from 'lucide-react';

export default function SettingsDashboard() {
  // State untuk toggle switch fiktif
  const [strictMode, setStrictMode] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [maintenance, setMaintenance] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#f8fafc] font-sans text-gray-800">
      
      {/* 1. SIDEBAR (Konsisten) */}
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
          
          <Link href="/hq/participants" className="flex items-center justify-between px-4 py-3 text-gray-500 hover:bg-gray-50 rounded-xl transition-all font-semibold text-sm">
            <div className="flex items-center space-x-3">
               <Users className="w-5 h-5" />
               <span>Buku Peserta</span>
            </div>
            <span className="bg-gray-100 text-gray-500 text-[10px] font-black px-2 py-0.5 rounded-full">5</span>
          </Link>
          
          <Link href="/hq/verification" className="flex items-center justify-between px-4 py-3 text-gray-500 hover:bg-gray-50 rounded-xl transition-all font-semibold text-sm">
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
          
          <Link href="#" className="flex items-center space-x-3 px-4 py-3 text-gray-500 hover:bg-gray-50 rounded-xl transition-all font-semibold text-sm">
            <Calendar className="w-5 h-5" />
            <span>Kegiatan</span>
          </Link>

          <Link href="#" className="flex items-center space-x-3 px-4 py-3 text-gray-500 hover:bg-gray-50 rounded-xl transition-all font-semibold text-sm">
            <Clock className="w-5 h-5" />
            <span>Schedule Lomba</span>
          </Link>
          
          <Link href="#" className="flex items-center space-x-3 px-4 py-3 text-gray-500 hover:bg-gray-50 rounded-xl transition-all font-semibold text-sm">
            <ImageIcon className="w-5 h-5" />
            <span>Kelola Media</span>
          </Link>
          
          <Link href="/hq/llms" className="flex items-center justify-between px-4 py-3 text-gray-500 hover:bg-gray-50 rounded-xl transition-all font-semibold text-sm">
            <div className="flex items-center space-x-3">
              <Server className="w-5 h-5" />
              <span>Manajemen LLMS</span>
            </div>
          </Link>

          {/* ACTIVE MENU: Pengaturan */}
          <Link href="/hq/settings" className="flex items-center space-x-3 px-4 py-3 bg-slate-900 text-white rounded-xl shadow-md shadow-slate-200 transition-all font-semibold text-sm">
            <Settings className="w-5 h-5 text-indigo-400" />
            <span>Pengaturan</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-gray-100 mt-auto">
          <button className="w-full flex items-center justify-center space-x-3 px-4 py-3 text-rose-500 hover:bg-rose-50 rounded-xl transition-all font-bold text-sm">
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
            <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">Pengaturan Sistem</h2>
            <p className="text-[10px] md:text-xs text-gray-400 font-bold mt-0.5">Konfigurasi pusat infrastruktur NCC 13th.</p>
          </div>
          <div className="flex items-center space-x-4">
             <button className="px-5 py-2 bg-slate-900 text-white text-[11px] font-bold uppercase tracking-widest rounded-lg hover:bg-slate-800 transition-all shadow-sm">
               Simpan Perubahan
             </button>
          </div>
        </header>

        {/* CONTENT */}
        <div className="p-6 md:p-8 space-y-6 max-w-5xl flex-1">
          
          {/* Bagian Profil Institusi & Admin */}
          <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-8 flex flex-col md:flex-row gap-8 items-center md:items-start">
            <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center border-4 border-white shadow-md flex-shrink-0">
               <UserCircle className="w-12 h-12 text-indigo-400" />
            </div>
            <div className="flex-1 space-y-4 w-full text-center md:text-left">
              <div>
                <h3 className="text-xl font-black text-gray-900">Muhammad Luthfi Aziz</h3>
                <p className="text-sm font-bold text-indigo-600 mt-1">Super Admin NCC 13th</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-50 text-left">
                 <div>
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Institusi</p>
                   <p className="text-sm font-semibold text-gray-700 mt-0.5">SMA Darul Ulum 1 Jombang</p>
                 </div>
                 <div>
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Role Akses</p>
                   <p className="text-sm font-semibold text-gray-700 mt-0.5">Full System Override</p>
                 </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bagian Keamanan CBT */}
            <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-8 space-y-6">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-rose-50 rounded-lg text-rose-500"><ShieldCheck className="w-5 h-5" /></div>
                <h3 className="text-base font-black text-gray-800">Keamanan Ujian (CBT)</h3>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-800">Strict Fullscreen Mode</p>
                  <p className="text-[10px] text-gray-400 font-medium mt-1 w-4/5">Siswa otomatis log out jika menekan Alt+Tab atau keluar layar.</p>
                </div>
                <button 
                  onClick={() => setStrictMode(!strictMode)}
                  className={`w-12 h-6 rounded-full transition-colors relative flex items-center flex-shrink-0 ${strictMode ? 'bg-emerald-500' : 'bg-gray-200'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${strictMode ? 'translate-x-7' : 'translate-x-1'}`}></div>
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-800">Auto-Save Telemetry</p>
                  <p className="text-[10px] text-gray-400 font-medium mt-1 w-4/5">Simpan jawaban ke database setiap kali siswa memilih opsi.</p>
                </div>
                <button 
                  onClick={() => setAutoSave(!autoSave)}
                  className={`w-12 h-6 rounded-full transition-colors relative flex items-center flex-shrink-0 ${autoSave ? 'bg-emerald-500' : 'bg-gray-200'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${autoSave ? 'translate-x-7' : 'translate-x-1'}`}></div>
                </button>
              </div>
            </div>

            {/* Bagian Sistem Server */}
            <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-8 space-y-6">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-500"><Database className="w-5 h-5" /></div>
                <h3 className="text-base font-black text-gray-800">Status Server Infrastruktur</h3>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-800">Mode Pemeliharaan (Maintenance)</p>
                  <p className="text-[10px] text-gray-400 font-medium mt-1 w-4/5">Tutup akses login siswa sementara waktu.</p>
                </div>
                <button 
                  onClick={() => setMaintenance(!maintenance)}
                  className={`w-12 h-6 rounded-full transition-colors relative flex items-center flex-shrink-0 ${maintenance ? 'bg-rose-500' : 'bg-gray-200'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${maintenance ? 'translate-x-7' : 'translate-x-1'}`}></div>
                </button>
              </div>

              <div className="pt-4 border-t border-gray-50 space-y-4">
                 <div>
                   <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Zona Waktu Server</label>
                   <select className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm font-semibold text-gray-700 outline-none">
                     <option>Waktu Indonesia Barat (WIB)</option>
                     <option>Waktu Indonesia Tengah (WITA)</option>
                     <option>Waktu Indonesia Timur (WIT)</option>
                   </select>
                 </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
