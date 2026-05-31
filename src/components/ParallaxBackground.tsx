"use client";

import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Mic,
  MessageCircle,
  Volume2,
  BookOpen,
  PenTool,
  Microscope,
  Atom,
  Star,
  Moon,
  Book,
  Rocket,
  Calculator,
  Telescope,
  Dna,
} from "lucide-react";

const categoryIcons = [
  { icons: [Mic, MessageCircle, Volume2], color: "text-red-400" },          // Speech
  { icons: [BookOpen, PenTool, Microscope, Atom], color: "text-emerald-400" }, // LKTI
  { icons: [Star, Moon, Book], color: "text-amber-400" },                   // MTQ
  { icons: [Rocket, Calculator, Telescope, Dna], color: "text-blue-400" }     // MIPA
];

// Flat array to pick randomly but know the color
const allIconsMapped = categoryIcons.flatMap(cat => 
  cat.icons.map(Icon => ({ Icon, color: cat.color }))
);

// Pre-generated positions to avoid hydration mismatch
const generateElements = () => {
  const elements = [];
  // Generate 150 elements to ensure the whole page is richly populated ("biar rame")
  for (let i = 0; i < 150; i++) {
    const itemConfig = allIconsMapped[i % allIconsMapped.length];
    
    // Spread vertically across 650vh (6.5 screen heights)
    const factorLevel = (i * 23) % 650; // 0 to 650 vh
    // Spread horizontally across 100vw
    const factorX = (i * 7) % 100;
    
    const size = 32 + ((i * 9) % 68); // 32px to 100px for robust visibility ("lebih dijelasin")
    const depth = 1 + ((i * 17) % 4); // 1 to 4 parallax speed
    // Opacity boosted to 18% - 40% for rich presence ("lebih dijelasin")
    const opacity = 0.18 + (((i * 13) % 23) / 100); 
    const blur = depth > 3 ? "blur(2px)" : depth > 2 ? "blur(1px)" : "blur(0px)";
    const animClass = `float-anim-${(i % 3) + 1}`;
    const animDelay = ((i * 1.4) % 12).toFixed(1);
    const animDuration = (18 + ((i * 4.3) % 20)).toFixed(1);

    elements.push({
      id: i,
      Icon: itemConfig.Icon,
      color: itemConfig.color,
      x: factorX,        // vw
      y: factorLevel,    // vh starting
      size,
      depth,             // parallax speed multiplier
      opacity,
      blur,
      animClass,
      animDelay,
      animDuration
    });
  }
  return elements;
};

const items = generateElements();

export default function ParallaxBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useGSAP(() => {
    if (!mounted || isMobile) return; // Completely skip heavy scroll triggers on mobile
    gsap.registerPlugin(ScrollTrigger);

    // Group-based animation by depth levels (1 to 4)
    for (let d = 1; d <= 4; d++) {
      gsap.to(`.parallax-depth-${d}`, {
        y: () => -1 * window.innerHeight * d * 0.8, // Smooth speed parallax offset
        ease: "none",
        scrollTrigger: {
          trigger: document.body,
          start: "top top",
          end: "bottom bottom",
          scrub: 1.5,
        }
      });
    }
    
  }, { scope: containerRef, dependencies: [mounted, isMobile] });

  // Hide before mounted to prevent hydration errors or flashes
  if (!mounted) return null;

  // Reduce background clutter on mobile but keep enough to feel rich ("biar rame")
  const displayedItems = isMobile ? items.slice(0, 45) : items;

  return (
    <div 
      ref={containerRef} 
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 0 }} // Put behind everything
    >
      <style>{`
        @keyframes floatDynamics1 {
          0% { transform: translateY(0px) translateX(0px) rotate(0deg); }
          33% { transform: translateY(-20px) translateX(12px) rotate(120deg); }
          66% { transform: translateY(15px) translateX(-8px) rotate(240deg); }
          100% { transform: translateY(0px) translateX(0px) rotate(360deg); }
        }
        @keyframes floatDynamics2 {
          0% { transform: translateY(0px) translateX(0px) rotate(360deg); }
          50% { transform: translateY(25px) translateX(-15px) rotate(180deg); }
          100% { transform: translateY(0px) translateX(0px) rotate(0deg); }
        }
        @keyframes floatDynamics3 {
          0% { transform: translateY(0px) scale(1) rotate(0deg); }
          50% { transform: translateY(-30px) scale(1.08) rotate(-90deg); }
          100% { transform: translateY(0px) scale(1) rotate(0deg); }
        }
        .float-anim-1 {
          animation: floatDynamics1 24s linear infinite;
          will-change: transform;
        }
        .float-anim-2 {
          animation: floatDynamics2 28s ease-in-out infinite;
          will-change: transform;
        }
        .float-anim-3 {
          animation: floatDynamics3 22s ease-in-out infinite;
          will-change: transform;
        }
      `}</style>

      <div className="absolute inset-0 bg-slate-50" /> {/* Solid background at the very back */}
      
      {displayedItems.map((item) => (
        <div
          key={item.id}
          className={`parallax-item parallax-depth-${item.depth} absolute ${item.color}`}
          data-depth={item.depth}
          style={{
            left: `${item.x}vw`,
            top: `${item.y}vh`,
            opacity: isMobile ? item.opacity * 0.6 : item.opacity, // Clear presence on both desktop & mobile
            filter: isMobile ? "blur(1.5px)" : item.blur, 
            willChange: "transform",
          }}
        >
          <div 
            className={item.animClass}
            style={{
              animationDelay: `${item.animDelay}s`,
              animationDuration: `${item.animDuration}s`,
              transformOrigin: "center center"
            }}
          >
            <item.Icon size={isMobile ? item.size * 0.6 : item.size} strokeWidth={1.5} />
          </div>
        </div>
      ))}
      
      {/* Subtle overlay to fade out overlapping icons at the very top and bottom */}
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-slate-50 to-transparent z-10" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-50 to-transparent z-10" />
    </div>
  );
}
