"use client";

import { useState, useRef, useEffect } from "react";
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  useMotionValueEvent,
  MotionValue,
} from "framer-motion";
import { Calendar, MapPin, Trophy, Users, Clock, ArrowRight } from "lucide-react";

const categoryTimelines = {
  all: [
    {
      phase: "Pendaftaran Berkas",
      date: "16 Juli — 25 Oktober 2026",
      icon: Users,
      description: "Gelombang I dibuka 16 Juli - 3 September. Gelombang II dibuka 1 - 25 Oktober untuk semua cabang lomba.",
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-100",
    },
    {
      phase: "Seleksi & Ujian Awal",
      date: "10 September — 2 November",
      icon: Clock,
      description: "Seleksi berkas administrasi, ujian CBT Olimpiade MIPA, dan pengiriman naskah tahap awal.",
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      border: "border-indigo-100",
    },
    {
      phase: "Pengumpulan Karya Utama",
      date: "12 September — 9 November",
      icon: Trophy,
      description: "Periode upload fullpaper LKTI Nasional dan pengiriman video performa MTQ orisinal.",
      color: "text-purple-600",
      bg: "bg-purple-50",
      border: "border-purple-100",
    },
    {
      phase: "Pengumuman Kelulusan",
      date: "26 September — 16 November",
      icon: Trophy,
      description: "Pelepasan daftar pemenang resmi babak kualifikasi Gelombang I & II menuju podium juara.",
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-100",
    },
  ],
  lkti: [
    { phase: "Gel I: Abstrak", date: "16 Juli — 3 Sep 2026", icon: Users, description: "Pengumpulan abstrak karya tulis ilmiah inovatif Gelombang I.", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
    { phase: "Gel I: Fullpaper", date: "12 — 18 Sep 2026", icon: Clock, description: "Unggah naskah karya tulis lengkap bagi yang lolos seleksi abstrak.", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
    { phase: "Gel II: Abstrak", date: "1 — 25 Oktober 2026", icon: Users, description: "Pengumpulan abstrak karya tulis ilmiah Gelombang II.", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
    { phase: "Gel II: Fullpaper", date: "1 — 9 Nov 2026", icon: Clock, description: "Unggah naskah karya tulis lengkap jalur Gelombang II.", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
  ],
  olimpiade: [
    { phase: "Gel I: Seleksi 1", date: "10 September 2026", icon: Users, description: "Penyaringan awal uji kompetensi Matematika & IPA.", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
    { phase: "Gel I: Seleksi 2", date: "14 September 2026", icon: Clock, description: "Babak lanjutan pemecahan studi kasus MIPA komprehensif.", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
    { phase: "Gel II: Simulasi", date: "29 Oktober 2026", icon: Users, description: "Uji coba akses portal Computer Based Test (CBT) Gelombang II.", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
    { phase: "Gel II: Seleksi Utama", date: "2 November 2026", icon: Trophy, description: "Puncak pertarungan talenta matematika sains Gelombang II.", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
  ],
  speech: [
    { phase: "Gel I: Naskah", date: "16 Juli — 3 Sep 2026", icon: Users, description: "Unggah materi naskah orasi bahasa Inggris Gelombang I.", color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100" },
    { phase: "Gel I: Pengumuman", date: "14 September 2026", icon: Trophy, description: "Rilis daftar nama delegasi terbaik lolos kurasi naskah Gel I.", color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100" },
    { phase: "Gel II: Naskah", date: "1 — 25 Okt 2026", icon: Users, description: "Pengumpulan materi naskah orasi bahasa Inggris Gelombang II.", color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100" },
    { phase: "Gel II: Pengumuman", date: "14 November 2026", icon: Trophy, description: "Pelepasan daftar finalis Speech Contest resmi.", color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100" },
  ],
  mtq: [
    { phase: "Gel I: Video Tilawah", date: "16 Juli — 3 Sep 2026", icon: Users, description: "Pengunggahan klip rekaman lantunan ayat Al-Qur'an Gelombang I.", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
    { phase: "Gel I: Pengumuman", date: "14 September 2026", icon: Trophy, description: "Pengumuman hasil kurasi qari/qariah berprestasi Gel I.", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
    { phase: "Gel II: Video Tilawah", date: "1 — 25 Okt 2026", icon: Users, description: "Pengumpulan klip rekaman lantunan ayat Al-Qur'an Gelombang II.", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
    { phase: "Gel II: Pengumuman", date: "14 November 2026", icon: Trophy, description: "Hasil akhir penyeleksian MTQ tingkat nasional.", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
  ]
};

export default function TimelineSection() {
  const containerRef = useRef<HTMLElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const [activeCategory, setActiveCategory] = useState<"all" | "lkti" | "olimpiade" | "speech" | "mtq">("all");
  
  // Track scroll within this section
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 80%", "end 20%"]
  });

  // Spring physics for smooth drawing and particle movement
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 80, damping: 20 });
  
  // State for the traveling object
  const [point, setPoint] = useState({ x: 200, y: 50, angle: 0 });
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Update traveler position based on smoothProgress
  useMotionValueEvent(smoothProgress, "change", (latest) => {
    if (isMounted && pathRef.current) {
      const path = pathRef.current;
      try {
        const length = path.getTotalLength();
        if (length === 0) return;
        
        const currentPoint = path.getPointAtLength(latest * length);
        
        // Calculate angle for rotation (lookahead point)
        const lookAhead = 1; 
        const nextPoint = path.getPointAtLength(Math.min(length, latest * length + lookAhead));
        const angle = Math.atan2(nextPoint.y - currentPoint.y, nextPoint.x - currentPoint.x) * (180 / Math.PI);
        
        setPoint({ x: currentPoint.x, y: currentPoint.y, angle });
      } catch (e) {
        // Silently fail if path methods aren't ready
      }
    }
  });

  const currentTimeline = categoryTimelines[activeCategory];

  return (
    <section ref={containerRef} id="jadwal" className="relative z-10 min-h-screen w-full py-24 px-6 sm:px-10 bg-transparent overflow-hidden flex flex-col items-center justify-center">
      {/* Header Section */}
      <div className="text-center mb-6 max-w-2xl mx-auto shrink-0">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-slate-900">
          Jadwal <span className="text-indigo-600">Kompetisi</span>
        </h2>
        <p className="text-slate-500 text-sm md:text-base leading-relaxed">
          Ikuti setiap tahap perjalanan menuju panggung nasional melalui jalur yang terus bergerak.
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-12 bg-slate-100/80 backdrop-blur-sm p-1.5 rounded-2xl border border-slate-200/50 max-w-xl mx-auto z-30 pointer-events-auto">
        {(["all", "lkti", "olimpiade", "speech", "mtq"] as const).map((cat) => {
          const labels = { all: "Umum", lkti: "LKTI", olimpiade: "MIPA", speech: "Speech", mtq: "MTQ" };
          const activeStyles = {
            all: "bg-blue-600 text-white shadow-md shadow-blue-100",
            lkti: "bg-blue-600 text-white shadow-md shadow-blue-100",
            olimpiade: "bg-amber-500 text-white shadow-md shadow-amber-100",
            speech: "bg-purple-600 text-white shadow-md shadow-purple-100",
            mtq: "bg-emerald-600 text-white shadow-md shadow-emerald-100",
          };
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${activeCategory === cat ? activeStyles[cat] : "text-slate-600 hover:bg-white hover:text-slate-900"}`}
            >
              {labels[cat]}
            </button>
          );
        })}
      </div>

      {/* DESKTOP TIMELINE (SVG MOTION PATH) */}
      <div className="relative w-full max-w-5xl h-[700px] shrink-0 hidden md:block">
        <div className="absolute inset-0 flex justify-center pointer-events-none">
          <svg viewBox="0 0 800 700" className="w-full h-full overflow-visible" fill="none">
            {/* Background Track */}
            <path
              d="M 200 50 C 200 150, 600 150, 600 250 C 600 350, 200 350, 200 450 C 200 550, 600 550, 600 650"
              stroke="#e2e8f0"
              strokeWidth="15"
              strokeLinecap="round"
              style={{ opacity: 0.3 }}
            />
            
            {/* Glowing Secondary Path */}
            <motion.path
              d="M 200 50 C 200 150, 600 150, 600 250 C 600 350, 200 350, 200 450 C 200 550, 600 550, 600 650"
              stroke="url(#gradient-path)"
              strokeWidth="15"
              strokeLinecap="round"
              style={{ pathLength: smoothProgress, opacity: 0.2, filter: "blur(8px)" }}
            />

            {/* Main Animated Path */}
            <motion.path
              ref={pathRef}
              d="M 200 50 C 200 150, 600 150, 600 250 C 600 350, 200 350, 200 450 C 200 550, 600 550, 600 650"
              stroke="url(#gradient-path)"
              strokeWidth="8"
              strokeLinecap="round"
              style={{ pathLength: smoothProgress }}
            />

            {/* THE TRAVELER (Pulsating Glow Object) */}
            <motion.g
              style={{ x: point.x, y: point.y, rotate: point.angle }}
              initial={false}
            >
              <circle r="18" fill="#4f46e5" className="opacity-20 animate-pulse" />
              <circle r="8" fill="white" className="filter drop-shadow-[0_0_10px_rgba(79,70,229,1)]" />
              <circle r="4" fill="#4f46e5" />
              <path d="M -10 -4 L 0 0 L -10 4 Z" fill="#4f46e5" className="opacity-60" />
            </motion.g>
            
            <defs>
               <linearGradient id="gradient-path" x1="0" y1="0" x2="1" y2="1">
                 <stop offset="0%" stopColor="#6366f1" />
                 <stop offset="50%" stopColor="#8b5cf6" />
                 <stop offset="100%" stopColor="#ec4899" />
               </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Nodes */}
        <TimelineNode index={0} top="9.09%" left="25%" align="left" progress={smoothProgress} trigger={0.15} activeCategory={activeCategory} />
        <TimelineNode index={1} top="36.36%" left="75%" align="right" progress={smoothProgress} trigger={0.4} activeCategory={activeCategory} />
        <TimelineNode index={2} top="63.63%" left="25%" align="left" progress={smoothProgress} trigger={0.7} activeCategory={activeCategory} />
        <TimelineNode index={3} top="90.9%" left="75%" align="right" progress={smoothProgress} trigger={0.9} activeCategory={activeCategory} />
      </div>

      {/* MOBILE TIMELINE FALLBACK */}
      <div className="md:hidden w-full max-w-sm mx-auto relative px-4">
        <div className="absolute left-8 top-0 bottom-0 w-1 bg-slate-200 rounded-full" />
        <motion.div 
          className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 via-purple-500 to-pink-500 rounded-full origin-top" 
          style={{ scaleY: smoothProgress }} 
        />
        
        <div className="space-y-12">
          {currentTimeline.map((item, i) => (
            <MobileTimelineNode key={`${activeCategory}-${i}`} index={i} progress={smoothProgress} trigger={(i + 1) * 0.2} activeCategory={activeCategory} />
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mt-20"
      >
        <button className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-base text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 hover:scale-105 active:scale-95 z-30 pointer-events-auto">
          Daftar Sekarang
          <ArrowRight size={18} />
        </button>
      </motion.div>
    </section>
  );
}

/* ==============================================================
   Sub-components
 ============================================================== */

interface TimelineNodeProps {
  index: number;
  top: string;
  left: string;
  align: "left" | "right";
  progress: MotionValue<number>;
  trigger: number;
  activeCategory: keyof typeof categoryTimelines;
}

function TimelineNode({ index, top, left, align, progress, trigger, activeCategory }: TimelineNodeProps) {
  const item = categoryTimelines[activeCategory][index];
  const Icon = item.icon;
  const [active, setActive] = useState(false);
  
  const opacity = useTransform(progress, [trigger - 0.1, trigger], [0.3, 1]);
  const scale = useTransform(progress, [trigger - 0.1, trigger], [0.8, 1]);
  
  useMotionValueEvent(progress, "change", (latest: number) => {
    const isNowActive = latest >= trigger - 0.05;
    if (isNowActive !== active) setActive(isNowActive);
  });

  return (
    <motion.div 
      className="absolute w-full px-8 pointer-events-auto group"
      style={{ top, left, opacity, scale, transform: "translate(-50%, -50%)" }}
    >
      <div className={`relative flex items-center ${align === 'left' ? 'justify-end pr-14' : 'justify-start pl-14'}`}>
        <motion.div 
          className={`absolute ${align === 'left' ? 'right-0 translate-x-1/2' : 'left-0 -translate-x-1/2'} w-12 h-12 rounded-full border-4 border-white flex items-center justify-center z-20 shadow-lg transition-colors duration-500`}
          style={{ background: active ? 'linear-gradient(to bottom right, #6366f1, #ec4899)' : '#f8fafc' }}
        >
          <Icon size={20} className={active ? 'text-white' : 'text-slate-400'} />
        </motion.div>

        <div className={`glass-panel w-72 lg:w-80 p-6 bg-white border border-slate-100 rounded-3xl shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl ${align === 'left' ? 'text-right' : 'text-left'}`}>
          <div className={`flex items-center gap-3 mb-3 ${align === 'left' ? 'justify-end' : 'justify-start'} ${item.color}`}>
             {align !== 'left' && <Calendar size={14} />}
             <span className="text-xs font-bold uppercase tracking-wider">{item.date}</span>
             {align === 'left' && <Calendar size={14} />}
          </div>
          <h3 className="text-xl font-bold mb-2 text-slate-900">{item.phase}</h3>
          <p className="text-sm text-slate-600 leading-relaxed">{item.description}</p>
        </div>
      </div>
    </motion.div>
  );
}

interface MobileTimelineNodeProps {
  index: number;
  progress: MotionValue<number>;
  trigger: number;
  activeCategory: keyof typeof categoryTimelines;
}

function MobileTimelineNode({ index, progress, trigger, activeCategory }: MobileTimelineNodeProps) {
  const item = categoryTimelines[activeCategory][index];
  const Icon = item.icon;
  const [active, setActive] = useState(false);
  
  const opacity = useTransform(progress, [trigger - 0.1, trigger], [0.3, 1]);
  const scale = useTransform(progress, [trigger - 0.1, trigger], [0.8, 1]);
  
  useMotionValueEvent(progress, "change", (latest: number) => {
    const isNowActive = latest >= trigger - 0.05;
    if (isNowActive !== active) setActive(isNowActive);
  });

  return (
    <motion.div style={{ opacity, scale }} className="relative flex gap-6 pl-12 items-start py-2">
      <motion.div 
        className="absolute left-8 -translate-x-1/2 w-10 h-10 rounded-full border-4 border-white flex items-center justify-center z-20 shadow-md transition-colors duration-500"
        style={{ background: active ? 'linear-gradient(to bottom right, #6366f1, #ec4899)' : '#f8fafc' }}
      >
         <Icon size={16} className={active ? 'text-white' : 'text-slate-400'} />
      </motion.div>

      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm w-full">
        <div className={`flex items-center gap-2 mb-2 ${item.color}`}>
          <Calendar size={12} />
          <span className="text-xs font-bold uppercase">{item.date}</span>
        </div>
        <h3 className="text-lg font-bold mb-2 text-slate-900">{item.phase}</h3>
        <p className="text-sm text-slate-600 leading-relaxed">{item.description}</p>
      </div>
    </motion.div>
  );
}
