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
import { 
  Calendar, MapPin, Trophy, Users, Clock, ArrowRight,
  Banknote, ScrollText, GraduationCap, Medal, Award, BookOpen, Heart, Zap, Sparkles, Smartphone, Globe, CheckCircle2, Brain, Star, Video, Upload 
} from "lucide-react";

const iconMap: Record<string, any> = {
  Trophy, Banknote, ScrollText, GraduationCap, Medal, Award, Users, BookOpen, Heart, Zap, Sparkles, Smartphone, Globe, CheckCircle2, Clock, Brain, Star, Video, Upload, Calendar
};

const getIconComponent = (iconName?: string) => {
  if (!iconName) return Users;
  const match = Object.keys(iconMap).find(k => k.toLowerCase() === iconName.toLowerCase());
  return match ? iconMap[match] : Users;
};

const categoryTimelines = {
  all: [
    {
      phase: "Pendaftaran Berkas",
      date: "Segera Diumumkan",
      icon: Users,
      description: "Gelombang I dibuka 16 Juli - 3 September. Gelombang II dibuka 1 - 25 Oktober untuk semua cabang lomba.",
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-100",
    },
    {
      phase: "Seleksi & Ujian Awal",
      date: "Segera Diumumkan",
      icon: Clock,
      description: "Seleksi berkas administrasi, ujian CBT Olimpiade MIPA, dan pengiriman naskah tahap awal.",
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      border: "border-indigo-100",
    },
    {
      phase: "Pengumpulan Karya Utama",
      date: "Segera Diumumkan",
      icon: Trophy,
      description: "Periode upload fullpaper LKTI Nasional dan pengiriman video performa MTQ orisinal.",
      color: "text-purple-600",
      bg: "bg-purple-50",
      border: "border-purple-100",
    },
    {
      phase: "Pengumuman Kelulusan",
      date: "Segera Diumumkan",
      icon: Trophy,
      description: "Pelepasan daftar pemenang resmi babak kualifikasi Gelombang I & II menuju podium juara.",
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-100",
    },
  ],
  lkti: [
    { phase: "Gel I: Abstrak", date: "Segera Diumumkan", icon: Users, description: "Pengumpulan abstrak karya tulis ilmiah inovatif Gelombang I.", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
    { phase: "Gel I: Fullpaper", date: "Segera Diumumkan", icon: Clock, description: "Unggah naskah karya tulis lengkap bagi yang lolos seleksi abstrak.", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
    { phase: "Gel II: Abstrak", date: "Segera Diumumkan", icon: Users, description: "Pengumpulan abstrak karya tulis ilmiah Gelombang II.", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
    { phase: "Gel II: Fullpaper", date: "Segera Diumumkan", icon: Clock, description: "Unggah naskah karya tulis lengkap jalur Gelombang II.", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
  ],
  olimpiade: [
    { phase: "Gel I: Seleksi 1", date: "Segera Diumumkan", icon: Users, description: "Penyaringan awal uji kompetensi Matematika & IPA.", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
    { phase: "Gel I: Seleksi 2", date: "Segera Diumumkan", icon: Clock, description: "Babak lanjutan pemecahan studi kasus MIPA komprehensif.", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
    { phase: "Gel II: Simulasi", date: "Segera Diumumkan", icon: Users, description: "Uji coba akses portal Computer Based Test (CBT) Gelombang II.", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
    { phase: "Gel II: Seleksi Utama", date: "Segera Diumumkan", icon: Trophy, description: "Puncak pertarungan talenta matematika sains Gelombang II.", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
  ],
  speech: [
    { phase: "Gel I: Naskah", date: "Segera Diumumkan", icon: Users, description: "Unggah materi naskah orasi bahasa Inggris Gelombang I.", color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100" },
    { phase: "Gel I: Pengumuman", date: "Segera Diumumkan", icon: Trophy, description: "Rilis daftar nama delegasi terbaik lolos kurasi naskah Gel I.", color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100" },
    { phase: "Gel II: Naskah", date: "Segera Diumumkan", icon: Users, description: "Pengumpulan materi naskah orasi bahasa Inggris Gelombang II.", color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100" },
    { phase: "Gel II: Pengumuman", date: "Segera Diumumkan", icon: Trophy, description: "Pelepasan daftar finalis Speech Contest resmi.", color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100" },
  ],
  mtq: [
    { phase: "Gel I: Video Tilawah", date: "Segera Diumumkan", icon: Users, description: "Pengunggahan klip rekaman lantunan ayat Al-Qur'an Gelombang I.", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
    { phase: "Gel I: Pengumuman", date: "Segera Diumumkan", icon: Trophy, description: "Pengumuman hasil kurasi qari/qariah berprestasi Gel I.", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
    { phase: "Gel II: Video Tilawah", date: "Segera Diumumkan", icon: Users, description: "Pengumpulan klip rekaman lantunan ayat Al-Qur'an Gelombang II.", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
    { phase: "Gel II: Pengumuman", date: "Segera Diumumkan", icon: Trophy, description: "Hasil akhir penyeleksian MTQ tingkat nasional.", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
  ]
};

const generateSvgPath = (numItems: number) => {
  if (numItems <= 1) {
    return "M 280 50 C 280 150, 520 150, 520 250";
  }
  
  let path = "M 280 50";
  for (let i = 0; i < numItems - 1; i++) {
    const yStart = 50 + i * 200;
    const yEnd = yStart + 200;
    const isGoingRight = i % 2 === 0;
    if (isGoingRight) {
      path += ` C 280 ${yStart + 100}, 520 ${yStart + 100}, 520 ${yEnd}`;
    } else {
      path += ` C 520 ${yStart + 100}, 280 ${yStart + 100}, 280 ${yEnd}`;
    }
  }
  return path;
};

export default function TimelineSection() {
  const containerRef = useRef<HTMLElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const [activeCategory, setActiveCategory] = useState<"lkti" | "olimpiade" | "speech" | "mtq">("lkti");
  const [timelineDates, setTimelineDates] = useState<Record<string, string>>({});
  const [dynamicTimelines, setDynamicTimelines] = useState<any>(categoryTimelines);
  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Track scroll within this section
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 80%", "center 50%"]
  });

  // Spring physics for smooth drawing and particle movement
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 80, damping: 20 });
  
  // State for the traveling object
  const [point, setPoint] = useState({ x: 200, y: 50, angle: 0 });

  useEffect(() => {
    setIsMounted(true);
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    
    // 📡 DYNAMIC REAL-TIME SINKRONISASI DARI DATABASE SUPABASE
    const fetchTimeline = async () => {
      try {
        // Gunakan supabase-js langsung dengan URL & anon key
        // agar bisa baca dari halaman publik tanpa sesi/cookie
        const { createClient: createRawClient } = await import('@supabase/supabase-js');
        const supabase = createRawClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        );

        // Fetch dynamic curvy timeline steps from homepage_descriptions
        const { data: dbItems } = await supabase
          .from('homepage_descriptions')
          .select('*')
          .in('category', ['lkti', 'olimpiade', 'speech', 'mtq'])
          .order('order_index', { ascending: true });

        if (dbItems && dbItems.length > 0) {
          const lktiSteps = dbItems.filter((item: any) => item.category === 'lkti').map(item => ({
            phase: item.title,
            date: item.date_range || 'Segera Diumumkan',
            icon: getIconComponent(item.icon),
            description: item.content,
            color: "text-blue-600",
            bg: "bg-blue-50",
            border: "border-blue-100"
          }));

          const mipaSteps = dbItems.filter((item: any) => item.category === 'olimpiade').map(item => ({
            phase: item.title,
            date: item.date_range || 'Segera Diumumkan',
            icon: getIconComponent(item.icon),
            description: item.content,
            color: "text-amber-600",
            bg: "bg-amber-50",
            border: "border-amber-100"
          }));

          const speechSteps = dbItems.filter((item: any) => item.category === 'speech').map(item => ({
            phase: item.title,
            date: item.date_range || 'Segera Diumumkan',
            icon: getIconComponent(item.icon),
            description: item.content,
            color: "text-purple-600",
            bg: "bg-purple-50",
            border: "border-purple-100"
          }));

          const mtqSteps = dbItems.filter((item: any) => item.category === 'mtq').map(item => ({
            phase: item.title,
            date: item.date_range || 'Segera Diumumkan',
            icon: getIconComponent(item.icon),
            description: item.content,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
            border: "border-emerald-100"
          }));

          setDynamicTimelines({
            all: categoryTimelines.all,
            lkti: lktiSteps.length > 0 ? lktiSteps : categoryTimelines.lkti,
            olimpiade: mipaSteps.length > 0 ? mipaSteps : categoryTimelines.olimpiade,
            speech: speechSteps.length > 0 ? speechSteps : categoryTimelines.speech,
            mtq: mtqSteps.length > 0 ? mtqSteps : categoryTimelines.mtq
          });
        }

        // Fetch dates override for backward compatibility
        const { data, error } = await supabase
          .from('announcements')
          .select('content')
          .eq('title', 'SYSTEM_TIMELINE_CONFIG')
          .single();

        if (!error && data && data.content) {
          const config = JSON.parse(data.content);
          if (Array.isArray(config)) {
            const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
            const formatDate = (dateStr: string) => {
              if (!dateStr) return "";
              const d = new Date(dateStr);
              if (isNaN(d.getTime())) return dateStr;
              return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
            };
            
            const formatRange = (start?: string, end?: string, fallback?: string) => {
              if (start && end) {
                const s = new Date(start);
                const e = new Date(end);
                if (!isNaN(s.getTime()) && !isNaN(e.getTime())) {
                  if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
                    return `${s.getDate()} — ${e.getDate()} ${months[s.getMonth()]} ${s.getFullYear()}`;
                  } else if (s.getFullYear() === e.getFullYear()) {
                    return `${s.getDate()} ${months[s.getMonth()]} — ${e.getDate()} ${months[e.getMonth()]} ${s.getFullYear()}`;
                  } else {
                    return `${s.getDate()} ${months[s.getMonth()]} ${s.getFullYear()} — ${e.getDate()} ${months[e.getMonth()]} ${e.getFullYear()}`;
                  }
                }
              }
              if (start) return formatDate(start);
              if (end) return `s.d. ${formatDate(end)}`;
              return fallback || "Belum Ditentukan";
            };

            const lktiCat = config.find((c: any) => c.category && c.category.includes("LKTI"));
            const mipaCat = config.find((c: any) => c.category && (c.category.includes("Olimpiade") || c.category.includes("MIPA")));
            const speechCat = config.find((c: any) => c.category && c.category.includes("Speech"));
            const mtqCat = config.find((c: any) => c.category && c.category.includes("MTQ"));

            const getItemDate = (catObj: any, waveLabel: string, itemLabel: string, fallback: string) => {
              if (!catObj || !Array.isArray(catObj.waves)) return fallback;
              const wave = catObj.waves.find((w: any) => w.label === waveLabel);
              if (!wave || !Array.isArray(wave.items)) return fallback;
              const item = wave.items.find((i: any) => i.label && i.label.toLowerCase().includes(itemLabel.toLowerCase()));
              if (!item) return fallback;
              return formatRange(item.start, item.end, fallback);
            };

            const dates: Record<string, string> = {};
            
            if (lktiCat) {
              dates["lkti-0"] = getItemDate(lktiCat, "Gelombang I", "Pendaftaran", "Segera Diumumkan");
              dates["lkti-1"] = getItemDate(lktiCat, "Gelombang I", "Fullpaper", "Segera Diumumkan");
              dates["lkti-2"] = getItemDate(lktiCat, "Gelombang II", "Pendaftaran", "Segera Diumumkan");
              dates["lkti-3"] = getItemDate(lktiCat, "Gelombang II", "Fullpaper", "Segera Diumumkan");
            }
            if (mipaCat) {
              dates["olimpiade-0"] = getItemDate(mipaCat, "Gelombang I", "Seleksi 1", "Segera Diumumkan");
              dates["olimpiade-1"] = getItemDate(mipaCat, "Gelombang I", "Seleksi 2", "Segera Diumumkan");
              dates["olimpiade-2"] = getItemDate(mipaCat, "Gelombang II", "Simulasi", "Segera Diumumkan");
              dates["olimpiade-3"] = getItemDate(mipaCat, "Gelombang II", "Seleksi", "Segera Diumumkan");
            }
            if (speechCat) {
              dates["speech-0"] = getItemDate(speechCat, "Gelombang I", "Pendaftaran", "Segera Diumumkan");
              dates["speech-1"] = getItemDate(speechCat, "Gelombang I", "Pengumuman", "Segera Diumumkan");
              dates["speech-2"] = getItemDate(speechCat, "Gelombang II", "Pendaftaran", "Segera Diumumkan");
              dates["speech-3"] = getItemDate(speechCat, "Gelombang II", "Pengumuman", "Segera Diumumkan");
            }
            if (mtqCat) {
              dates["mtq-0"] = getItemDate(mtqCat, "Gelombang I", "Pendaftaran", "Segera Diumumkan");
              dates["mtq-1"] = getItemDate(mtqCat, "Gelombang I", "Pengumuman", "Segera Diumumkan");
              dates["mtq-2"] = getItemDate(mtqCat, "Gelombang II", "Pendaftaran", "Segera Diumumkan");
              dates["mtq-3"] = getItemDate(mtqCat, "Gelombang II", "Pengumuman", "Segera Diumumkan");
            }

            dates["all-0"] = formatRange(
              lktiCat?.waves?.find((w: any) => w.label === "Gelombang I")?.items?.find((i: any) => i.label && i.label.toLowerCase().includes("pendaftaran"))?.start,
              lktiCat?.waves?.find((w: any) => w.label === "Gelombang II")?.items?.find((i: any) => i.label && i.label.toLowerCase().includes("pendaftaran"))?.end,
              "Segera Diumumkan"
            );
            dates["all-1"] = formatRange(
              mipaCat?.waves?.find((w: any) => w.label === "Gelombang I")?.items?.find((i: any) => i.label && i.label.toLowerCase().includes("seleksi 1"))?.start,
              mipaCat?.waves?.find((w: any) => w.label === "Gelombang II")?.items?.find((i: any) => i.label && i.label.toLowerCase().includes("seleksi"))?.end,
              "Segera Diumumkan"
            );
            dates["all-2"] = formatRange(
              lktiCat?.waves?.find((w: any) => w.label === "Gelombang I")?.items?.find((i: any) => i.label && i.label.toLowerCase().includes("fullpaper"))?.start,
              lktiCat?.waves?.find((w: any) => w.label === "Gelombang II")?.items?.find((i: any) => i.label && i.label.toLowerCase().includes("fullpaper"))?.end,
              "Segera Diumumkan"
            );
            dates["all-3"] = formatRange(
              lktiCat?.waves?.find((w: any) => w.label === "Gelombang I")?.items?.find((i: any) => i.label && i.label.toLowerCase().includes("pengumuman"))?.start,
              lktiCat?.waves?.find((w: any) => w.label === "Gelombang II")?.items?.find((i: any) => i.label && i.label.toLowerCase().includes("pengumuman"))?.end,
              "Segera Diumumkan"
            );

            setTimelineDates(dates);
          }
        }
      } catch (err) {
        console.error("Gagal load timeline config di landing page:", err);
      }
    };

    fetchTimeline();

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Update traveler position based on smoothProgress
  useMotionValueEvent(smoothProgress, "change", (latest) => {
    if (isMobile) return;
    if (isMounted && pathRef.current) {
      const path = pathRef.current;
      try {
        const length = path.getTotalLength();
        if (length === 0) return;
        
        const currentPoint = path.getPointAtLength(latest * length);
        
        const lookAhead = 1; 
        const nextPoint = path.getPointAtLength(Math.min(length, latest * length + lookAhead));
        const angle = Math.atan2(nextPoint.y - currentPoint.y, nextPoint.x - currentPoint.x) * (180 / Math.PI);
        
        setPoint({ x: currentPoint.x, y: currentPoint.y, angle });
      } catch (e) {
        // Silently fail if path methods aren't ready
      }
    }
  });

  const currentTimeline = dynamicTimelines[activeCategory];
  const numItems = currentTimeline ? currentTimeline.length : 0;
  const totalHeight = numItems > 0 ? 100 + (numItems - 1) * 200 : 700;
  const svgPath = generateSvgPath(numItems);

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
        {(["lkti", "olimpiade", "speech", "mtq"] as const).map((cat) => {
          const labels = { lkti: "LKTI", olimpiade: "MIPA", speech: "Speech", mtq: "MTQ" };
          const activeStyles = {
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
      {!isMobile && (
        <div 
          className="relative w-full max-w-5xl shrink-0 hidden md:block"
          style={{ height: `${totalHeight}px` }}
        >
          <div className="absolute inset-0 flex justify-center pointer-events-none">
            <svg viewBox={`0 0 800 ${totalHeight}`} className="w-full h-full overflow-visible" fill="none">
              {/* Background Track */}
              <path
                d={svgPath}
                stroke="#e2e8f0"
                strokeWidth="15"
                strokeLinecap="round"
                style={{ opacity: 0.3 }}
              />
              
              {/* Glowing Secondary Path */}
              <motion.path
                d={svgPath}
                stroke="url(#gradient-path)"
                strokeWidth="15"
                strokeLinecap="round"
                style={{ pathLength: smoothProgress, opacity: 0.2, filter: "blur(8px)" }}
              />

              {/* Main Animated Path */}
              <motion.path
                ref={pathRef}
                d={svgPath}
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
          {currentTimeline.map((item: any, i: number) => {
            const trigger = numItems > 1 ? 0.1 + (i / (numItems - 1)) * 0.8 : 0.5;
            return (
              <TimelineNode 
                key={`${activeCategory}-${i}`}
                item={item} 
                top={`${50 + i * 200}px`}
                left={i % 2 === 0 ? "35%" : "65%"}
                align={i % 2 === 0 ? "left" : "right"}
                progress={smoothProgress} 
                trigger={trigger} 
              />
            );
          })}
        </div>
      )}

      {/* MOBILE TIMELINE FALLBACK */}
      <div className="md:hidden w-full max-w-sm mx-auto relative px-4">
        <div className="absolute left-8 top-0 bottom-0 w-1 bg-slate-200 rounded-full" />
        <motion.div 
          className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 via-purple-500 to-pink-500 rounded-full origin-top" 
          style={{ scaleY: smoothProgress }} 
        />
        
        <div className="space-y-12">
          {currentTimeline.map((item, i) => (
            <MobileTimelineNode 
              key={`${activeCategory}-${i}`} 
              item={item} 
            />
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
  item: any;
  top: string;
  left: string;
  align: "left" | "right";
  progress: MotionValue<number>;
  trigger: number;
}

function TimelineNode({ item, top, left, align, progress, trigger }: TimelineNodeProps) {
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
      className="absolute pointer-events-none group z-20"
      style={{ 
        top, 
        left, 
        opacity, 
        scale, 
        width: 0, 
        height: 0,
      }}
    >
      <div className="relative w-0 h-0 flex items-center justify-center">
        {/* Node Circle */}
        <motion.div 
          className="absolute w-12 h-12 rounded-full border-4 border-white flex items-center justify-center z-20 shadow-lg transition-colors duration-500 pointer-events-auto cursor-pointer"
          style={{ background: active ? 'linear-gradient(to bottom right, #6366f1, #ec4899)' : '#f8fafc' }}
        >
          <Icon size={20} className={active ? 'text-white' : 'text-slate-400'} />
        </motion.div>

        {/* Card */}
        <div 
          className={`absolute pointer-events-auto ${
            align === 'left' 
              ? 'right-8 text-right' 
              : 'left-8 text-left'
          }`}
          style={{
            transform: 'translateY(-50%)',
            top: 0
          }}
        >
          <div className="glass-panel w-[260px] sm:w-72 lg:w-80 p-6 bg-white border border-slate-100 rounded-3xl shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl">
            <div className={`flex items-center gap-3 mb-3 ${align === 'left' ? 'justify-end' : 'justify-start'} ${item.color}`}>
               {align !== 'left' && <Icon size={14} className="shrink-0" />}
               <span className="text-xs font-bold uppercase tracking-wider">{item.date}</span>
               {align === 'left' && <Icon size={14} className="shrink-0" />}
            </div>
            <h3 className="text-xl font-bold mb-2 text-slate-900">{item.phase}</h3>
            <p className="text-sm text-slate-600 leading-relaxed">{item.description}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

interface MobileTimelineNodeProps {
  item: any;
}

function MobileTimelineNode({ item }: MobileTimelineNodeProps) {
  const Icon = item.icon;
  const [active, setActive] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0.5, scale: 0.95, y: 15 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: false, margin: "-50px" }}
      onViewportEnter={() => setActive(true)}
      onViewportLeave={() => setActive(false)}
      transition={{ type: "spring", stiffness: 100, damping: 15 }}
      className="relative flex gap-6 pl-12 items-start py-2"
    >
      <div 
        className="absolute left-8 -translate-x-1/2 w-10 h-10 rounded-full border-4 border-white flex items-center justify-center z-20 shadow-md transition-colors duration-500"
        style={{ background: active ? 'linear-gradient(to bottom right, #6366f1, #ec4899)' : '#f8fafc' }}
      >
         <Icon size={16} className={active ? 'text-white' : 'text-slate-400'} />
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm w-full transition-all duration-300 hover:shadow-md">
        <div className={`flex items-center gap-2 mb-2 ${item.color}`}>
          <Icon size={12} className="shrink-0" />
          <span className="text-xs font-bold uppercase">{item.date}</span>
        </div>
        <h3 className="text-lg font-bold mb-2 text-slate-900">{item.phase}</h3>
        <p className="text-sm text-slate-600 leading-relaxed">{item.description}</p>
      </div>
    </motion.div>
  );
}
