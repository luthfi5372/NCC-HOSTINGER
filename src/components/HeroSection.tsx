"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Trophy, BookOpen, Mic, Microscope, GraduationCap } from "lucide-react";
import Link from "next/link";
import TextAnimate from "./ui/TextAnimate";
import LineDrawIcon from "./ui/LineDrawIcon";



import MagneticWrapper from "./ui/MagneticWrapper";

// Remove unused imports introduced previously
export default function HeroSection() {
    const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Audit: Sync with Supabase Session safely from browser
    const checkAuth = async () => {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data: { user: supabaseUser } } = await supabase.auth.getUser();
        
        if (supabaseUser) {
          setUser({
            email: supabaseUser.email,
            fullName: supabaseUser.user_metadata.full_name || supabaseUser.user_metadata.fullName || "Peserta NCC",
            username: supabaseUser.user_metadata.username || supabaseUser.email?.split('@')[0]
          });
        } else {
          setUser(null);
        }
      } catch (err) {
        setUser(null);
      }
    };
    checkAuth();
  }, []);

  return (
    <section
      id="beranda"
      className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 pt-28 pb-20 bg-transparent"
    >
      {/* Grid Layout fitting Competition Landing Page aesthetics */}
      <div className="grid md:grid-cols-2 gap-12 font-sans items-center w-full max-w-7xl mx-auto z-10 relative">
        
        {/* LEFT COLUMN: Typography & CTAs */}
        <motion.div className="text-left w-full z-20">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="inline-flex items-center gap-2 px-5 py-2 mb-8 rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm"
          >
            <Sparkles size={14} className="text-blue-600" />
            <span className="text-xs sm:text-sm font-medium tracking-wide">
              Kompetisi Kreativitas & Edukasi Nasional
            </span>
          </motion.div>

          <h1
            className="text-5xl sm:text-6xl md:text-7xl font-bold leading-[1.05] tracking-tight mb-6 text-slate-900"
            style={{ fontFamily: "var(--font-display, var(--font-space-grotesk))" }}
          >
            <span className="block animate-fade-in-up [animation-delay:100ms] opacity-0">Tumbuhkan</span>
            <span className="block text-indigo-600 animate-fade-in-up [animation-delay:300ms] opacity-0">Inovasi Nyata</span>
            <span className="block animate-fade-in-up [animation-delay:500ms] opacity-0">Di Sini.</span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.0 }}
            className="text-base sm:text-lg text-slate-600 max-w-lg mb-10 leading-relaxed"
          >
            Arsitektur yang dirancang untuk membantu anak bangsa menyalurkan
            <span className="font-semibold text-slate-900"> bakat</span>, mempresentasikan{" "}
            <span className="font-semibold text-slate-900">riset</span>, dan meraih relasi ke puncak tertinggi Indonesia.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.2 }}
            className="flex flex-col sm:flex-row items-center justify-start gap-4"
          >
            {/* Primary CTA */}
            <MagneticWrapper>
              <Link
                href={user ? "/dashboard" : "/daftar"}
                className="group flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
              >
                {user ? "Buka Dashboard" : "Daftar Tim Sekarang"}
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>
            </MagneticWrapper>

            {/* Secondary CTA */}
            <MagneticWrapper>
              <Link
                href="/leaderboard"
                className="group px-8 py-4 rounded-xl font-semibold text-sm text-indigo-700 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 transition-all shadow-sm flex items-center gap-2"
              >
                <Trophy size={16} className="text-amber-500 group-hover:scale-125 transition-transform" />
                Live Ranking
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </Link>
            </MagneticWrapper>

            {/* Third CTA */}
            <MagneticWrapper>
              <a
                href="#kategori"
                className="px-8 py-4 rounded-xl font-semibold text-sm text-slate-700 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors shadow-sm"
              >
                Kategori Lomba
              </a>
            </MagneticWrapper>
          </motion.div>
        </motion.div>

        {/* RIGHT COLUMN: Connected Chains/Network Visualization */}
        <div className="relative w-full aspect-square md:aspect-[4/5] flex items-center justify-center">
          
          {/* Main Central Element: Trophy / Logo Placeholder */}
          <motion.div 
            animate={{ y: [-10, 10, -10] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute z-20 w-32 h-32 md:w-40 md:h-40 bg-white/70 backdrop-blur-xl border border-white/60 shadow-2xl rounded-full flex flex-col items-center justify-center p-4 md:p-6"
          >
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-1 md:mb-2 shadow-lg shadow-indigo-200">
              <LineDrawIcon icon={Trophy} size={24} className="text-white md:hidden" delay={1.2} />
              <LineDrawIcon icon={Trophy} size={32} className="text-white hidden md:inline-flex" delay={1.2} />
            </div>
            <span className="font-bold text-slate-800 text-xs md:text-sm tracking-widest text-center">NCC 13TH</span>
          </motion.div>

          {/* Orbiting / Floating Nicco Mascot (Blue) */}
          <motion.div 
            animate={{ 
              y: [-15, 15, -15], 
              rotate: [4, -4, 4] 
            }}
            transition={{ 
              duration: 5, 
              repeat: Infinity, 
              ease: "easeInOut", 
              delay: 0.5 
            }}
            className="absolute top-0 right-0 md:top-6 md:right-0 lg:-right-8 scale-90 md:scale-110 origin-top-right z-10 w-28 md:w-36 aspect-[1275/1653] flex items-center justify-center pointer-events-none"
          >
            <img 
              src="/nicco.svg" 
              alt="Nicco Mascot" 
              className="w-full h-full object-contain filter drop-shadow-[0_15px_20px_rgba(99,102,241,0.15)]" 
            />
          </motion.div>

          <motion.div 
            animate={{ y: [15, -15, 15], rotate: [2, -2, 2] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-2 left-2 md:bottom-20 md:left-0 lg:-left-12 scale-75 md:scale-100 origin-bottom-left z-30 w-56 bg-white/90 backdrop-blur-md border border-slate-100 shadow-xl rounded-2xl p-4 flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex py-2 shrink-0 items-center justify-center text-emerald-600">
              <LineDrawIcon icon={Mic} size={20} delay={1.6} />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kategori</div>
              <div className="text-sm font-bold text-slate-800">Speech Contest</div>
            </div>
          </motion.div>

          {/* Orbiting / Floating Nicci Mascot (Pink) */}
          <motion.div 
            animate={{ 
              y: [-10, 10, -10], 
              x: [-6, 6, -6], 
              rotate: [-5, 5, -5] 
            }}
            transition={{ 
              duration: 4.5, 
              repeat: Infinity, 
              ease: "easeInOut", 
              delay: 1.5 
            }}
            className="absolute hidden md:flex top-1/2 -translate-y-1/2 -left-6 lg:-left-20 z-10 w-28 md:w-36 aspect-[1275/1699] items-center justify-center pointer-events-none"
          >
            <img 
              src="/nicci.svg" 
              alt="Nicci Mascot" 
              className="w-full h-full object-contain filter drop-shadow-[0_15px_20px_rgba(236,72,153,0.15)]" 
            />
          </motion.div>

          {/* Decorative Institution Badge */}
          <motion.div 
             animate={{ y: [10, -10, 10] }}
             transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
             className="absolute bottom-2 right-2 md:bottom-10 md:right-4 lg:-right-12 scale-75 md:scale-100 origin-bottom-right z-20 bg-indigo-600 text-white px-5 py-3 rounded-2xl shadow-lg shadow-indigo-600/30 flex items-center gap-3"
          >
             <GraduationCap size={24} className="text-indigo-200" />
             <div className="text-left">
               <div className="text-[10px] font-medium text-indigo-200 tracking-wide uppercase">Diselenggarakan oleh</div>
               <div className="text-sm font-bold whitespace-nowrap">SMA Darul Ulum 1</div>
             </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}


