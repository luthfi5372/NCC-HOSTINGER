"use client";

import React from "react";
import { Sparkles } from "lucide-react";

const row1Sponsors = [
  { name: "B", src: "/sponsors/B.jpeg" },
  { name: "BSI", src: "/sponsors/BSI.png" },
  { name: "Bank Jatim", src: "/sponsors/Bank Jatim.png" },
  { name: "Event Gratis", src: "/sponsors/EventGratis.jpeg" },
  { name: "Event Lomba", src: "/sponsors/EventLomba.jpeg" },
  { name: "Gratisan", src: "/sponsors/Gratisan.jpeg" },
  { name: "Info Event", src: "/sponsors/InfoEvent.jpeg" },
  { name: "Info Lomba", src: "/sponsors/InfoLomba.jpeg" },
  { name: "L", src: "/sponsors/L.JPEG.jpeg" },
  { name: "LBB", src: "/sponsors/LBB.png" },
  { name: "Lomba Gratis", src: "/sponsors/LombaGratis.jpeg" },
  { name: "Lomba Nasional", src: "/sponsors/LombaNasional.jpeg" },
  { name: "ML", src: "/sponsors/ML.jpeg" },
];

const row2Sponsors = [
  { name: "N", src: "/sponsors/N.jpeg" },
  { name: "TS", src: "/sponsors/TS.png" },
  { name: "Terbaru", src: "/sponsors/Terbaru.jpeg" },
  { name: "Erlangga", src: "/sponsors/erlangga.png" },
  { name: "Platinum", src: "/sponsors/platinum.png" },
  { name: "Partner 1", src: "/sponsors/client-1.png" },
  { name: "Partner 2", src: "/sponsors/client-2.png" },
  { name: "Partner 3", src: "/sponsors/client-3.png" },
  { name: "Partner 4", src: "/sponsors/client-4.png" },
  { name: "Partner 5", src: "/sponsors/client-5.png" },
  { name: "Partner 6", src: "/sponsors/client-6.png" },
  { name: "Partner 7", src: "/sponsors/client-7.png" },
  { name: "Partner 8", src: "/sponsors/client-8.png" },
];

export default function SponsorsSection() {
  return (
    <section className="relative z-10 py-16 px-6 sm:px-10 bg-transparent flex flex-col items-center overflow-hidden">
      {/* Decorative glass container background */}
      <div className="absolute inset-0 bg-white/70 border-y border-slate-200/40 -z-10 pointer-events-none" />

      {/* Header */}
      <div className="max-w-3xl text-center mb-10 flex flex-col items-center">
        <span className="flex items-center gap-1.5 px-4 py-1 rounded-full bg-blue-50 border border-blue-100/65 text-xs font-bold text-blue-600 tracking-wider uppercase inline-block shadow-sm mb-3">
          <Sparkles size={12} className="text-blue-500 animate-pulse" />
          Mitra Pendukung
        </span>
        <h3 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight mb-2 uppercase">
          Sponsor & Media Partner
        </h3>
        <p className="text-slate-400 text-xs sm:text-sm max-w-xl">
          National Creativity Competition didukung oleh berbagai instansi, perusahaan, dan media partner terpercaya untuk menyukseskan acara.
        </p>
      </div>

      {/* Marquee Track 1 (Left to Right) */}
      <div className="w-full max-w-7xl mx-auto overflow-hidden py-3 relative">
        {/* Left/Right fading edge overlays */}
        <div className="absolute left-0 inset-y-0 w-20 bg-gradient-to-r from-slate-50 via-slate-50/50 to-transparent z-20 pointer-events-none" />
        <div className="absolute right-0 inset-y-0 w-20 bg-gradient-to-l from-slate-50 via-slate-50/50 to-transparent z-20 pointer-events-none" />

        <div className="animate-marquee gap-6 will-change-transform">
          {/* First track copy */}
          {row1Sponsors.map((sponsor, index) => (
            <div
              key={`row1-${index}`}
              className="flex items-center justify-center min-w-[140px] h-20 px-6 rounded-2xl bg-white border border-slate-100/90 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-slate-300 hover:scale-105 transition-all duration-300 group cursor-pointer"
            >
              <img
                src={sponsor.src}
                alt={sponsor.name}
                loading="eager"
                decoding="async"
                className="h-10 max-w-[120px] object-contain opacity-65 grayscale group-hover:opacity-100 group-hover:grayscale-0 transition-all duration-300"
              />
            </div>
          ))}
          {/* Repeated track copy for seamless loop */}
          {row1Sponsors.map((sponsor, index) => (
            <div
              key={`row1-dup-${index}`}
              className="flex items-center justify-center min-w-[140px] h-20 px-6 rounded-2xl bg-white border border-slate-100/90 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-slate-300 hover:scale-105 transition-all duration-300 group cursor-pointer"
            >
              <img
                src={sponsor.src}
                alt={sponsor.name}
                loading="eager"
                decoding="async"
                className="h-10 max-w-[120px] object-contain opacity-65 grayscale group-hover:opacity-100 group-hover:grayscale-0 transition-all duration-300"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Marquee Track 2 (Right to Left - Reverse) */}
      <div className="w-full max-w-7xl mx-auto overflow-hidden py-3 mt-4 relative">
        {/* Left/Right fading edge overlays */}
        <div className="absolute left-0 inset-y-0 w-20 bg-gradient-to-r from-slate-50 via-slate-50/50 to-transparent z-20 pointer-events-none" />
        <div className="absolute right-0 inset-y-0 w-20 bg-gradient-to-l from-slate-50 via-slate-50/50 to-transparent z-20 pointer-events-none" />

        <div className="animate-marquee-reverse gap-6 will-change-transform">
          {/* First track copy */}
          {row2Sponsors.map((sponsor, index) => (
            <div
              key={`row2-${index}`}
              className="flex items-center justify-center min-w-[140px] h-20 px-6 rounded-2xl bg-white border border-slate-100/90 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-slate-300 hover:scale-105 transition-all duration-300 group cursor-pointer"
            >
              <img
                src={sponsor.src}
                alt={sponsor.name}
                loading="eager"
                decoding="async"
                className="h-10 max-w-[120px] object-contain opacity-65 grayscale group-hover:opacity-100 group-hover:grayscale-0 transition-all duration-300"
              />
            </div>
          ))}
          {/* Repeated track copy for seamless loop */}
          {row2Sponsors.map((sponsor, index) => (
            <div
              key={`row2-dup-${index}`}
              className="flex items-center justify-center min-w-[140px] h-20 px-6 rounded-2xl bg-white border border-slate-100/90 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-slate-300 hover:scale-105 transition-all duration-300 group cursor-pointer"
            >
              <img
                src={sponsor.src}
                alt={sponsor.name}
                loading="eager"
                decoding="async"
                className="h-10 max-w-[120px] object-contain opacity-65 grayscale group-hover:opacity-100 group-hover:grayscale-0 transition-all duration-300"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
