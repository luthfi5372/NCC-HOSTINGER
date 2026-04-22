"use client";
import { 
  Users, 
  ShieldCheck, 
  Clock, 
  Megaphone, 
  LayoutDashboard, 
  Zap, 
  LogOut,
  ChevronRight,
  Headphones
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  onLogout: () => void;
}

export default function Sidebar({ activeTab, setActiveTab, onLogout }: SidebarProps) {
  const menuItems = [
    { id: "RINGKASAN", label: "Dashboard", icon: LayoutDashboard },
    { id: "VERIFIKASI", label: "Antrean Keluar", icon: Zap },
    { id: "USERS", label: "Data Peserta", icon: Users },
    { id: "PENILAIAN", label: "E-Scoring", icon: ShieldCheck },
  ];

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-slate-100 flex flex-col sticky top-0 hidden lg:flex">
      {/* LOGO */}
      <div className="p-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h1 className="font-black text-xl tracking-tight text-slate-800">NCC HQ</h1>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Command Center</p>
          </div>
        </div>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 px-4 space-y-1.5 mt-4">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold text-sm transition-all group ${
              activeTab === item.id 
              ? "bg-indigo-50 text-indigo-600" 
              : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
            }`}
          >
            <div className="flex items-center gap-3">
              <item.icon size={20} className={activeTab === item.id ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"} />
              {item.label}
            </div>
            {activeTab === item.id && <ChevronRight size={16} className="text-indigo-600" />}
          </button>
        ))}
      </nav>

      {/* SUPPORT CARD */}
      <div className="p-4 mx-4 mb-8 bg-slate-900 rounded-2xl text-white relative overflow-hidden group border-4 border-slate-800 shadow-xl shadow-slate-200">
         <div className="absolute top-[-20%] right-[-10%] w-20 h-20 bg-indigo-500 rounded-full blur-2xl opacity-20 group-hover:scale-150 transition-transform"></div>
         <div className="relative z-10">
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center mb-3">
               <Headphones size={16} className="text-indigo-300" />
            </div>
            <p className="text-xs font-black mb-1">Butuh Bantuan IT?</p>
            <p className="text-[10px] text-slate-400 mb-3 leading-relaxed">Hubungi Command Center jika ada kendala sistem.</p>
            <button className="w-full py-2 bg-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-indigo-600 transition-colors">
               Hubungi IT
            </button>
         </div>
      </div>

      {/* LOGOUT */}
      <div className="p-4 border-t border-slate-50">
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 font-bold text-sm hover:text-rose-500 transition-colors group"
        >
          <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
          Logout Sesi
        </button>
      </div>
    </aside>
  );
}
