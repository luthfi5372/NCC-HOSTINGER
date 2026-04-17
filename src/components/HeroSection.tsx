"use client";


import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Trophy, BookOpen, Mic, Microscope, GraduationCap } from "lucide-react";
import TextAnimate from "./ui/TextAnimate";
import LineDrawIcon from "./ui/LineDrawIcon";



import MagneticWrapper from "./ui/MagneticWrapper";

// Remove unused imports introduced previously
export default function HeroSection() {
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
            <TextAnimate text="Tumbuhkan" type="word" delay={0.5} className="block" />
            <TextAnimate text="Inovasi Nyata" type="word" delay={0.7} className="block text-indigo-600" />
            <TextAnimate text="Di Sini." type="word" delay={0.9} className="block" />
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
                href="/daftar"
                className="group flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
              >
                Daftar Tim Sekarang
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>
            </MagneticWrapper>

            {/* Secondary CTA */}
            <MagneticWrapper>
              <a
                href="#kategori"
                className="px-8 py-4 rounded-xl font-semibold text-sm text-slate-700 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors shadow-sm"
              >
                Lihat Kategori Lomba
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
            className="absolute z-20 w-40 h-40 bg-white/70 backdrop-blur-xl border border-white/60 shadow-2xl rounded-full flex flex-col items-center justify-center p-6"
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-2 shadow-lg shadow-indigo-200">
              <LineDrawIcon icon={Trophy} size={32} className="text-white" delay={1.2} />
            </div>
            <span className="font-bold text-slate-800 text-sm tracking-widest text-center">NCC 13TH</span>
          </motion.div>

          {/* Orbiting / Floating Category Cards */}
          <motion.div 
            animate={{ y: [-15, 15, -15], rotate: [-2, 2, -2] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className="absolute top-10 right-4 lg:-right-4 z-10 w-52 bg-white/90 backdrop-blur-md border border-slate-100 shadow-xl rounded-2xl p-4 flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex py-2 shrink-0 items-center justify-center text-blue-600">
              <LineDrawIcon icon={BookOpen} size={20} delay={1.4} />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kategori</div>
              <div className="text-sm font-bold text-slate-800">Olimpiade MIPA</div>
            </div>
          </motion.div>

          <motion.div 
            animate={{ y: [15, -15, 15], rotate: [2, -2, 2] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-20 left-0 lg:-left-12 z-30 w-56 bg-white/90 backdrop-blur-md border border-slate-100 shadow-xl rounded-2xl p-4 flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex py-2 shrink-0 items-center justify-center text-emerald-600">
              <LineDrawIcon icon={Mic} size={20} delay={1.6} />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kategori</div>
              <div className="text-sm font-bold text-slate-800">Speech Contest</div>
            </div>
          </motion.div>

          <motion.div 
            animate={{ y: [-10, 10, -10], x: [-5, 5, -5] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
            className="absolute top-1/2 -translate-y-1/2 -left-4 lg:-left-16 z-10 w-48 bg-white/90 backdrop-blur-md border border-slate-100 shadow-xl rounded-2xl p-4 flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex shrink-0 items-center justify-center text-purple-600">
              <LineDrawIcon icon={Microscope} size={20} delay={1.8} />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kategori</div>
              <div className="text-sm font-bold text-slate-800">LKTI Nasional</div>
            </div>
          </motion.div>

          {/* Decorative Institution Badge */}
          <motion.div 
             animate={{ y: [10, -10, 10] }}
             transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
             className="absolute bottom-10 -right-4 lg:-right-12 z-20 bg-indigo-600 text-white px-5 py-3 rounded-2xl shadow-lg shadow-indigo-600/30 flex items-center gap-3"
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


