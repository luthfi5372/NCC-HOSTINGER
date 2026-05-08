"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  IconLayoutDashboard,
  IconUsers,
  IconShield,
  IconPhoto,
  IconMap,
  IconMessage2,
  IconQrcode,
  IconLogout,
  IconSun,
  IconMoon,
  IconMenu2,
  IconX,
  IconChevronRight,
  IconSparkles
} from "@tabler/icons-react";
import { logout } from "@/lib/localAuth";
import { cn } from "@/lib/utils";

const menuItems = [
  { icon: IconLayoutDashboard, label: "Overview", href: "/admin" },
  { icon: IconUsers, label: "Participants", href: "/admin/participants" },
  { icon: IconShield, label: "User Accounts", href: "/admin/users" },
  { icon: IconPhoto, label: "Media Manager", href: "/admin/media" },
  { icon: IconMap, label: "Regional Insights", href: "/admin/insights" },
  { icon: IconMessage2, label: "Communications", href: "/admin/messages" },
  { icon: IconQrcode, label: "Scan Presence", href: "/admin/scanner" },
];

interface AdminSidebarProps {
  theme?: "dark" | "light";
  toggleTheme?: () => void;
}

export default function AdminSidebar({ theme = "dark", toggleTheme }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const isDark = theme === "dark";

  return (
    <>
      {/* Mobile Hamburger Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl shadow-lg border transition-all duration-300",
          isDark 
            ? "bg-zinc-950/80 backdrop-blur-md border-white/10 text-white hover:bg-zinc-900" 
            : "bg-white/80 backdrop-blur-md border-slate-200 text-slate-900 hover:bg-slate-50"
        )}
      >
        {isOpen ? <IconX size={20} className="animate-spin-once" /> : <IconMenu2 size={20} />}
      </button>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar Navigation Panel */}
      <aside className={cn(
        "fixed top-12 left-0 bottom-0 w-64 border-r z-40 flex flex-col transition-all duration-300 ease-out font-inter",
        isDark 
          ? "bg-[#09090b] border-white/[0.08] text-slate-300" 
          : "bg-white border-slate-200 text-slate-700",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex flex-col h-full justify-between">
          
          {/* Header Area with Context Switcher */}
          <div className="p-4">
            <div className={cn(
              "flex items-center gap-3 px-3 py-2.5 border rounded-xl group cursor-pointer transition-all duration-300",
              isDark 
                ? "bg-white/[0.02] border-white/[0.08] hover:bg-white/[0.06] hover:border-white/20" 
                : "bg-slate-50 border-slate-200/80 hover:bg-slate-100 hover:border-slate-300"
            )}>
              {/* Spinning / Glowing Logo Container */}
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-300">
                <IconSparkles size={16} className="text-white animate-pulse" />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className={cn(
                  "text-[12px] font-black tracking-tight truncate",
                  isDark ? "text-white" : "text-slate-900"
                )}>
                  NCC Command Center
                </p>
                <p className="text-[10px] text-indigo-500 font-bold truncate">HQ Level Authority</p>
              </div>
            </div>
          </div>

          {/* Navigation Links Area */}
          <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
            {menuItems.map((item, idx) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className={cn(
                    "relative flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-300 group z-10",
                    isActive 
                      ? (isDark ? "text-white font-bold" : "text-indigo-600 font-bold") 
                      : (isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900")
                  )}
                >
                  {/* Sliding Hover Background Animation (Aceternity UI) */}
                  <AnimatePresence>
                    {hoveredIndex === idx && (
                      <motion.div
                        layoutId="sidebar-hover-indicator"
                        className={cn(
                          "absolute inset-0 rounded-xl -z-10",
                          isDark ? "bg-white/[0.06]" : "bg-indigo-500/[0.06]"
                        )}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18, ease: "easeOut" }}
                      />
                    )}
                  </AnimatePresence>

                  {/* Icon with Active Highlight and Hover Animation */}
                  <div className={cn(
                    "transition-all duration-300 group-hover:scale-110 shrink-0",
                    isActive 
                      ? "text-indigo-500" 
                      : (isDark ? "text-slate-500 group-hover:text-white" : "text-slate-400 group-hover:text-indigo-600")
                  )}>
                    <Icon size={18} stroke={1.5} />
                  </div>

                  {/* Label Text */}
                  <span className="text-[13px] font-semibold tracking-tight relative z-20 flex-1">
                    {item.label}
                  </span>

                  {/* Active Right Caret Indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="active-indicator"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                      <IconChevronRight 
                        size={14} 
                        className={isDark ? "text-white/40" : "text-indigo-500/50"} 
                      />
                    </motion.div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Theme Switcher, Profile, and Logout Area */}
          <div className={cn(
            "p-4 border-t mt-auto space-y-4",
            isDark ? "border-white/[0.08] bg-black/20" : "border-slate-100 bg-slate-50/50"
          )}>
            
            {/* Elegant Sun / Moon Dynamic Toggle Button */}
            <button
              onClick={toggleTheme}
              className={cn(
                "relative flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl transition-all duration-300 border font-semibold text-[12px] group overflow-hidden",
                isDark 
                  ? "text-slate-300 bg-white/[0.02] border-white/[0.08] hover:border-white/20 hover:bg-white/[0.06] hover:text-white" 
                  : "text-slate-600 bg-white border-slate-200/80 shadow-sm hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <div className="flex items-center gap-2.5 relative z-10">
                <div className={cn(
                  "p-1 rounded-md transition-colors",
                  isDark ? "bg-amber-500/10 text-amber-500" : "bg-indigo-500/10 text-indigo-600"
                )}>
                  {isDark ? (
                    <IconSun size={14} className="animate-spin-slow" />
                  ) : (
                    <IconMoon size={14} />
                  )}
                </div>
                <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
              </div>
              <IconChevronRight size={12} className="opacity-40 group-hover:translate-x-0.5 transition-transform relative z-10" />
            </button>

            {/* Profile Avatar & Info Row */}
            <div className="flex items-center gap-3 px-1.5 py-1">
              <div className="relative group cursor-pointer shrink-0">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-600 to-pink-500 border border-white/20 flex items-center justify-center font-black text-[11px] text-white shadow-md shadow-indigo-500/10 group-hover:scale-105 transition-transform duration-300">
                  AD
                </div>
                {/* Active Indicator Pulse */}
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-zinc-950" />
              </div>
              <div className="overflow-hidden">
                <p className={cn(
                  "text-[12px] font-bold truncate leading-none",
                  isDark ? "text-white" : "text-slate-900"
                )}>
                  System Admin
                </p>
                <p className="text-[10px] text-slate-500 font-bold mt-1.5 hover:text-indigo-500 cursor-pointer transition-colors">
                  View Profile
                </p>
              </div>
            </div>
            
            {/* Logout Sesi Button */}
            <button
              onClick={handleLogout}
              className={cn(
                "flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl transition-all duration-300 border font-bold text-[12px] group",
                isDark 
                  ? "text-slate-400 hover:text-rose-400 bg-transparent border-transparent hover:border-rose-500/10 hover:bg-rose-500/[0.04]" 
                  : "text-slate-500 hover:text-rose-600 bg-transparent border-transparent hover:border-rose-200/50 hover:bg-rose-50"
              )}
            >
              <IconLogout size={16} stroke={1.5} className="group-hover:-translate-x-0.5 transition-transform text-rose-500" />
              <span>Log Out</span>
            </button>

          </div>
        </div>
      </aside>
    </>
  );
}
