"use client";

import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const Nicci = ({ size }: { size: number }) => (
  <svg viewBox="0 0 1500 1925" width={size} height={size * 1.283} style={{ overflow: "visible" }}>
    <image href="/NICCI_NICCO_DEPAN/NICCI NICCO.png" x="0" y="0" width="3000" height="1925" />
  </svg>
);

const Nicco = ({ size }: { size: number }) => (
  <svg viewBox="0 0 1500 1925" width={size} height={size * 1.283} style={{ overflow: "visible" }}>
    <image href="/NICCI_NICCO_DEPAN/NICCI NICCO.png" x="-1500" y="0" width="3000" height="1925" />
  </svg>
);

// Pre-generated positions to avoid hydration mismatch
const generateElements = () => {
  const elements = [];
  // Generate 80 elements to ensure the whole long page is populated (plenty for 600vh)
  for (let i = 0; i < 80; i++) {
    const isNicci = i % 2 === 0;
    
    // Spread vertically across 600vh (6 screen heights)
    const factorLevel = (i * 29) % 650; // 0 to 650 vh
    // Spread horizontally across 100vw
    const factorX = (i * 13) % 100;
    
    const size = 48 + ((i * 7) % 52); // 48px to 100px for a visible but clean background size
    const depth = 1 + ((i * 19) % 4); // 1 to 4 parallax speed
    const opacity = 0.08 + (((i * 11) % 12) / 100); // 8% to 20% opacity for perfect background blending
    const rotate = (i * 15) % 40 - 20; // Slight rotation (-20 to 20 deg)
    const blur = depth > 3 ? "blur(3px)" : depth > 2 ? "blur(1px)" : "blur(0px)";
    const floatAnim = i % 2 === 0 ? "mascot-float-normal" : "mascot-float-reverse";

    elements.push({
      id: i,
      type: isNicci ? "nicci" : "nicco",
      x: factorX,        // vw
      y: factorLevel,    // vh starting
      size,
      depth,             // parallax speed multiplier
      opacity,
      rotate,
      blur,
      floatAnim
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
        y: () => -1 * window.innerHeight * d,
        rotation: "+=15", // Subtle secondary rotation on scroll
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

  // Reduce background clutter and nodes on mobile to keep scrolling silky-smooth
  const displayedItems = isMobile ? items.slice(0, 20) : items;

  return (
    <div 
      ref={containerRef} 
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 0 }} // Put behind everything
    >
      <style>{`
        @keyframes mascotFloatNormal {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(3deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        @keyframes mascotFloatReverse {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(12px) rotate(-3deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        .mascot-float-normal {
          animation: mascotFloatNormal 8s ease-in-out infinite;
          will-change: transform;
        }
        .mascot-float-reverse {
          animation: mascotFloatReverse 10s ease-in-out infinite;
          will-change: transform;
        }
      `}</style>

      <div className="absolute inset-0 bg-slate-50" /> {/* Solid background at the very back */}
      
      {displayedItems.map((item) => (
        <div
          key={item.id}
          className={`parallax-item parallax-depth-${item.depth} absolute`}
          data-depth={item.depth}
          style={{
            left: `${item.x}vw`,
            top: `${item.y}vh`,
            opacity: isMobile ? item.opacity * 0.5 : item.opacity, // Fader on mobile for high readability
            filter: isMobile ? "blur(3px)" : item.blur, // Soft blur on mobile to avoid clashing with text
            willChange: "transform",
          }}
        >
          <div 
            className={item.floatAnim}
            style={{ 
              transform: `rotate(${item.rotate}deg)`,
              transformOrigin: "center center"
            }}
          >
            {item.type === "nicci" ? (
              <Nicci size={isMobile ? item.size * 0.6 : item.size} />
            ) : (
              <Nicco size={isMobile ? item.size * 0.6 : item.size} />
            )}
          </div>
        </div>
      ))}
      
      {/* Subtle overlay to fade out overlapping icons at the very top and bottom */}
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-slate-50 to-transparent z-10" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-50 to-transparent z-10" />
    </div>
  );
}
