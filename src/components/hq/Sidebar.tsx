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
  Headphones,
  Sparkles
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
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-200">
            🏆
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-800">NCC HQ.</span>
        </div>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 px-4 space-y-2 mt-4">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-medium text-sm transition-all group ${
              activeTab === item.id 
              ? "bg-blue-50 text-blue-700" 
              : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            }`}
          >
            <div className="flex items-center gap-3">
              <item.icon size={20} className={activeTab === item.id ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"} />
              {item.label}
            </div>
            {activeTab === item.id && <ChevronRight size={16} className="text-blue-600" />}
          </button>
        ))}
      </nav>

      {/* PROMO / INFO CARD (MAHA KARYA STYLE) */}
      <div className="mx-4 mb-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 text-white shadow-xl shadow-blue-200/50 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:scale-125 transition-transform">
          <Sparkles size={40}/>
        </div>
        <h4 className="font-bold mb-1 relative z-10">Fase Kompetisi</h4>
        <p className="text-blue-100 text-[10px] mb-4 relative z-10 leading-relaxed">Pendaftaran Gelombang 1 sedang berlangsung aktif.</p>
        <button className="w-full bg-white text-blue-700 text-[10px] font-black uppercase tracking-widest py-2.5 rounded-xl hover:bg-blue-50 transition-colors shadow-lg">
          Laporan Operasional
        </button>
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
