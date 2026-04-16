"use client";

import { useState, useRef } from "react";
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  useMotionValueEvent,
  MotionValue,
} from "framer-motion";
import { Calendar, MapPin, Trophy, Users, Clock, ArrowRight } from "lucide-react";

const timeline = [
  {
    phase: "Pendaftaran",
    date: "1 Mei — 30 Juni 2026",
    icon: Users,
    description: "Pendaftaran tim dan individu dibuka untuk seluruh wilayah Indonesia.",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-100",
  },
  {
    phase: "Babak Penyisihan",
    date: "15 Juli — 30 Juli 2026",
    icon: Clock,
    description: "Seleksi awal melalui karya tulis, video, dan ujian online.",
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    border: "border-indigo-100",
  },
  {
    phase: "Semifinal",
    date: "15 Agustus — 20 Agustus 2026",
    icon: Trophy,
    description: "Presentasi dan penilaian langsung oleh panel juri nasional.",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
  },
  {
    phase: "Grand Final",
    date: "5 September 2026",
    icon: MapPin,
    description: "Final besar di Jakarta, dengan penampilan terbaik dari seluruh Indonesia.",
    color: "text-rose-600",
    bg: "bg-rose-50",
    border: "border-rose-100",
  },
];

export default function TimelineSection() {
  const containerRef = useRef<HTMLElement>(null);
  
  // Track scroll within this section
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 80%", "end 20%"]
  });

  // Spring physics for smooth drawing and particle movement
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 80, damping: 20 });

  return (
    <section ref={containerRef} id="jadwal" className="relative z-10 min-h-screen w-full py-24 px-6 sm:px-10 bg-transparent overflow-hidden flex flex-col items-center justify-center">
      <div className="text-center mb-10 md:mb-16 max-w-2xl mx-auto shrink-0">
        <h2
          className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-slate-900"
          style={{ fontFamily: "var(--font-display, var(--font-space-grotesk))" }}
        >
          Jadwal Kompetisi
        </h2>
        <p className="text-slate-600 text-lg">
          Ikuti setiap tahap perjalanan menuju panggung nasional melalui jalur yang terus bergerak.
        </p>
      </div>

      {/* DESKTOP SVG MOTION PATH TIMELINE */}
      <div className="max-w-4xl mx-auto relative h-[650px] hidden md:block scale-90 lg:scale-100 origin-center">
        
        {/* SVG Drawing Canvas */}
        <div className="absolute inset-0 flex justify-center pointer-events-none">
          <svg viewBox="0 0 800 1100" className="w-full h-full" preserveAspectRatio="none">
            {/* Background Dashed Track */}
            <path
              d="M 200 50 C 200 150, 600 150, 600 250 C 600 350, 200 350, 200 450 C 200 550, 600 550, 600 650"
              fill="transparent"
              stroke="#e2e8f0"
              strokeWidth="4"
              strokeDasharray="12 12"
            />
            
            {/* Inner Glow Path (Secondary) */}
            <motion.path
              d="M 200 50 C 200 150, 600 150, 600 250 C 600 350, 200 350, 200 450 C 200 550, 600 550, 600 650"
              fill="transparent"
              stroke="url(#gradient-path)"
              strokeWidth="15"
              strokeLinecap="round"
              style={{ pathLength: smoothProgress, opacity: 0.2, filter: "blur(8px)" }}
            />

            {/* Animated Solid Gradient Path tied to Scroll! */}
            <motion.path
              d="M 200 50 C 200 150, 600 150, 600 250 C 600 350, 200 350, 200 450 C 200 550, 600 550, 600 650"
              fill="transparent"
              stroke="url(#gradient-path)"
              strokeWidth="8"
              strokeLinecap="round"
              style={{ pathLength: smoothProgress }}
            />
            
            {/* Glowing Gradient Defs */}
            <defs>
               <linearGradient id="gradient-path" x1="0" y1="0" x2="1" y2="1">
                 <stop offset="0%" stopColor="#6366f1" /> {/* indigo-500 */}
                 <stop offset="50%" stopColor="#8b5cf6" /> {/* violet-500 */}
                 <stop offset="100%" stopColor="#ec4899" /> {/* pink-500 */}
               </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Timeline Events / Nodes positioned exactly over SVG coordinates */}
        {/* NODE 1: Left */}
        <TimelineNode index={0} top="9.09%" left="25%" align="left" progress={smoothProgress} trigger={0.15} />
        {/* NODE 2: Right */}
        <TimelineNode index={1} top="36.36%" left="75%" align="right" progress={smoothProgress} trigger={0.4} />
        {/* NODE 3: Left */}
        <TimelineNode index={2} top="63.63%" left="25%" align="left" progress={smoothProgress} trigger={0.7} />
        {/* NODE 4: Right */}
        <TimelineNode index={3} top="90.9%" left="75%" align="right" progress={smoothProgress} trigger={0.9} />
      </div>

      {/* MOBILE TIMELINE FALLBACK (Standard Vertical Line) */}
      <div className="md:hidden max-w-sm mx-auto relative">
        <div className="absolute left-8 top-0 bottom-0 w-1 bg-slate-200 rounded-full" />
        <motion.div 
          className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 via-purple-500 to-pink-500 rounded-full origin-top" 
          style={{ scaleY: smoothProgress }} 
        />
        
        <div className="space-y-12">
          {timeline.map((item, i) => (
            <MobileTimelineNode key={i} index={i} progress={smoothProgress} trigger={(i + 1) * 0.2} />
          ))}
        </div>
      </div>

      {/* Registration CTA (Reduced for slide fit) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mt-20"
      >
        <a
          href="#daftar"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-base text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 hover:scale-105 active:scale-95"
        >
          Daftar Sekarang
          <ArrowRight size={18} />
        </a>
      </motion.div>
    </section>
  );
}

/* ==============================================================
   Sub-components for Desktop (Alternating Nodes) and Mobile
============================================================== */

interface TimelineNodeProps {
  index: number;
  top: string;
  left: string;
  align: "left" | "right";
  progress: MotionValue<number>;
  trigger: number;
}

function TimelineNode({ index, top, left, align, progress, trigger }: TimelineNodeProps) {
  const item = timeline[index];
  const Icon = item.icon;
  const [active, setActive] = useState(false);
  
  // Pop the card when the scroll path reaches this trigger point
  const opacity = useTransform(progress, [trigger - 0.1, trigger], [0.3, 1]);
  const scale = useTransform(progress, [trigger - 0.1, trigger], [0.8, 1]);
  
  useMotionValueEvent(progress, "change", (latest: number) => {
    const isNowActive = latest >= trigger - 0.05;
    if (isNowActive !== active) setActive(isNowActive);
  });

  return (
    <motion.div 
      className="absolute w-full px-8 pointer-events-auto group"
      style={{ 
        top, 
        left, 
        opacity,
        scale,
        transform: "translate(-50%, -50%)" 
      }}
    >
      {/* Visual Alignment Container (Extends left or right) */}
      <div className={`relative flex items-center ${align === 'left' ? 'justify-end pr-14' : 'justify-start pl-14'}`}>
        
        {/* Glow Node / Particle on the path */}
        <motion.div 
          className={`absolute ${align === 'left' ? 'right-0 translate-x-1/2' : 'left-0 -translate-x-1/2'} w-12 h-12 rounded-full border-4 border-white flex items-center justify-center z-20 shadow-lg transition-colors duration-500`}
          style={{ background: active ? 'linear-gradient(to bottom right, #6366f1, #ec4899)' : '#f8fafc' }}
        >
          <Icon size={20} className={active ? 'text-white' : 'text-slate-400'} />
        </motion.div>

        {/* Card Component */}
        <div className={`glass-panel w-72 lg:w-80 p-6 bg-white border border-slate-100 rounded-3xl shadow-lg transition-transform hover:-translate-y-1 hover:shadow-xl ${align === 'left' ? 'text-right' : 'text-left'}`}>
          <div className={`flex items-center gap-3 mb-3 ${align === 'left' ? 'justify-end' : 'justify-start'} ${item.color}`}>
             {align !== 'left' && <Calendar size={14} />}
             <span className="text-xs font-bold uppercase tracking-wider">{item.date}</span>
             {align === 'left' && <Calendar size={14} />}
          </div>
          <h3 className="text-xl font-bold mb-2 text-slate-900" style={{ fontFamily: "var(--font-display)" }}>
            {item.phase}
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            {item.description}
          </p>
        </div>

      </div>
    </motion.div>
  );
}

interface MobileTimelineNodeProps {
  index: number;
  progress: MotionValue<number>;
  trigger: number;
}

function MobileTimelineNode({ index, progress, trigger }: MobileTimelineNodeProps) {
  const item = timeline[index];
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
      {/* Node Dot */}
      <motion.div 
        className="absolute left-8 -translate-x-1/2 w-10 h-10 rounded-full border-4 border-white flex items-center justify-center z-20 shadow-md transition-colors duration-500"
        style={{ background: active ? 'linear-gradient(to bottom right, #6366f1, #ec4899)' : '#f8fafc' }}
      >
         <Icon size={16} className={active ? 'text-white' : 'text-slate-400'} />
      </motion.div>

      {/* Card Content */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm w-full relative">
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
