"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, PlaySquare, Image as ImageIcon, Users, BookOpen, Search, Trophy } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const filters = ["ALL", "ACADEMIC", "SPEECH", "ARTS", "GALLERY"];

const portfolioItems = [
  { 
    id: 1, 
    category: "GALLERY", 
    label: "NCC Grand Championship", 
    src: "/gallery/IMG_8067.JPG", 
    span: "col-span-1 md:col-span-2 row-span-2", 
    bg: "from-indigo-600/80 to-blue-700/80" 
  },
  { 
    id: 2, 
    category: "ACADEMIC", 
    label: "LKTI Research Winners", 
    src: "/gallery/IMG_8109.JPG", 
    span: "col-span-1 md:col-span-2 row-span-1", 
    bg: "from-sky-500/80 to-blue-600/80" 
  },
  { 
    id: 3, 
    category: "SPEECH", 
    label: "Language Excellence", 
    src: "/gallery/IMG_7993.JPG", 
    span: "col-span-1 row-span-1", 
    bg: "from-orange-500/80 to-red-600/80" 
  },
  { 
    id: 4, 
    category: "ARTS", 
    label: "MTQ Quran Recital", 
    src: "/gallery/IMG_8103.JPG", 
    span: "col-span-1 row-span-2", 
    bg: "from-amber-500/80 to-orange-600/80" 
  },
  { 
    id: 5, 
    category: "ARTS", 
    label: "Choral Symphony", 
    src: "/gallery/IMG_8143.JPG", 
    span: "col-span-1 row-span-1", 
    bg: "from-purple-500/80 to-indigo-600/80" 
  },
  { 
    id: 6, 
    category: "GALLERY", 
    label: "Ceremonial Parade", 
    src: "/gallery/ECL09816.JPG", 
    span: "col-span-1 row-span-1", 
    bg: "from-slate-700/80 to-slate-900/80" 
  },
  { 
    id: 7, 
    category: "ARTS", 
    label: "Stage Performance", 
    src: "/gallery/ECL09791.JPG", 
    span: "col-span-1 md:col-span-2 row-span-1", 
    bg: "from-fuchsia-500/80 to-rose-600/80" 
  },
];

export default function GallerySection() {
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [adminMedia, setAdminMedia] = useState<string[]>([]);
  const [hovered, setHovered] = useState<number | string | null>(null);
  const containerRef = useRef<HTMLElement>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const { data } = await supabase
          .from('announcements')
          .select('*')
          .eq('title', 'SYS_PORTAL_SETTINGS')
          .single();
        
        if (data) {
          const parsed = JSON.parse(data.content);
          if (parsed.dashboardAssets?.gallery_images) {
            setAdminMedia(parsed.dashboardAssets.gallery_images);
          }
        }
      } catch (err) {
        console.error("Failed to fetch gallery:", err);
      }
    };
    fetchGallery();
  }, []);

  const dynamicItems = adminMedia.map((url, index) => ({
    id: `admin-${index}`,
    category: "GALLERY",
    label: `Event Moment ${index + 1}`,
    src: url,
    span: index % 3 === 0 ? "col-span-1 md:col-span-2 row-span-1" : "col-span-1 row-span-1",
    bg: "from-indigo-500/80 to-purple-600/80"
  }));

  const allGalleryItems = [...portfolioItems, ...dynamicItems];

  const filteredItems = activeFilter === "ALL" 
    ? allGalleryItems 
    : allGalleryItems.filter(item => 
        item.category === activeFilter
      );

  useGSAP(() => {
    gsap.registerPlugin(ScrollTrigger);

    gsap.from(".gsap-gallery-header", {
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top 80%",
        toggleActions: "play none none reverse"
      },
      y: 30,
      opacity: 0,
      duration: 0.6,
      stagger: 0.1
    });

  }, { scope: containerRef });

  return (
    <section ref={containerRef} className="relative z-10 py-24 px-6 sm:px-10 bg-transparent flex flex-col items-center">
      <div className="gsap-gallery-header mb-4">
        <span className="px-5 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-sm font-bold text-blue-600 tracking-widest uppercase inline-block shadow-sm">
          National Creativity Competition
        </span>
      </div>
      
      <h3 className="gsap-gallery-header text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 leading-tight mb-4 uppercase text-center" style={{ fontFamily: "var(--font-display)" }}>
        Moments of Excellence
      </h3>
      <p className="gsap-gallery-header text-slate-500 text-center max-w-2xl mb-12">
        A glimpse into the spirit, competition, and victory at NCC. Capturing the journey of future leaders across diverse categories.
      </p>

      {/* Filter Tabs */}
      <div className="gsap-gallery-header flex flex-wrap justify-center gap-2 md:gap-4 mb-12">
        {filters.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={cn(
               "px-6 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-300 border",
               activeFilter === filter 
                ? "bg-slate-900 text-white border-slate-900 shadow-xl shadow-slate-200 scale-105" 
                : "bg-white text-slate-500 border-slate-200 hover:border-slate-900 hover:text-slate-900 hover:bg-slate-50"
            )}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Masonry / Grid Gallery */}
      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 auto-rows-[240px] gap-4">
        <AnimatePresence mode="popLayout">
          {filteredItems.map((item) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4, type: "spring", bounce: 0.2 }}
              key={item.id}
              onMouseEnter={() => setHovered(item.id)}
              onMouseLeave={() => setHovered(null)}
              className={cn(
                "relative rounded-[2rem] overflow-hidden group cursor-pointer shadow-lg transition-all duration-500 ease-out",
                item.span,
                hovered !== null && hovered !== item.id && "blur-sm scale-[0.98] opacity-60"
              )}
            >
              {/* Image Rendering */}
              <img 
                src={item.src} 
                alt={item.label} 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />

              {/* Focus Overlay */}
              <div className={cn(
                "absolute inset-0 bg-black/40 flex flex-col items-center justify-end p-8 transition-opacity duration-500",
                hovered === item.id ? "opacity-100" : "opacity-0"
              )}>
                <div className="absolute top-6 right-6">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 transform -translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                    <Trophy size={18} className="text-white" />
                  </div>
                </div>

                <div className="w-full transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                  <span className="inline-block px-3 py-1 rounded-lg bg-white/20 backdrop-blur-md text-[10px] font-bold tracking-[0.2em] text-white uppercase mb-3 border border-white/20">
                    {item.category}
                  </span>
                  <h4 className="text-xl md:text-2xl font-bold text-white leading-tight drop-shadow-md">
                    {item.label}
                  </h4>
                </div>
              </div>

              {/* Subtle Gradient Shadow (Bottom) */}
              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent opacity-60 pointer-events-none" />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

    </section>
  );
}
