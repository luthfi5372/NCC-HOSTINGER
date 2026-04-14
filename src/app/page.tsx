"use client";

import dynamic from "next/dynamic";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeatureGrid from "@/components/FeatureGrid";
import GallerySection from "@/components/GallerySection";
import CategoryCards from "@/components/CategoryCards";
import PricingSection from "@/components/PricingSection";
import IndonesiaMap from "@/components/IndonesiaMap";
import TimelineSection from "@/components/TimelineSection";
import FAQSection from "@/components/FAQSection";
import Footer from "@/components/Footer";
import SpeedMonitor from "@/components/SpeedMonitor";

// Load dynamically without SSR so GSAP doesn't break
const ParallaxBackground = dynamic(() => import("@/components/ParallaxBackground"), { ssr: false });

export default function Home() {
  return (
    <div className="relative scroll-smooth selection:bg-indigo-500/30 bg-slate-50">
      <ParallaxBackground />
      <Navbar />
      <div className="fixed bottom-6 right-6 z-[60]">
        <SpeedMonitor />
      </div>

      <main className="w-full">
        {/* Section 1: Hero */}
        <section id="beranda" className="min-h-screen w-full flex items-center justify-center">
          <HeroSection />
        </section>

        {/* Section 2: Features */}
        <section className="min-h-screen w-full py-24 flex items-center justify-center">
          <FeatureGrid />
        </section>

        {/* Section 3: Gallery */}
        <section className="min-h-screen w-full py-24 flex items-center justify-center">
          <GallerySection />
        </section>

        {/* Section 4: Categories */}
        <section id="kategori" className="min-h-screen w-full py-24 flex items-center justify-center">
          <CategoryCards />
        </section>

        {/* Section 5: Pricing */}
        <section className="min-h-screen w-full py-24 flex items-center justify-center">
          <PricingSection />
        </section>

        {/* Section 6: Indonesia Map */}
        <section className="min-h-screen w-full py-24 flex items-center justify-center">
          <IndonesiaMap />
        </section>

        {/* Section 7: Timeline */}
        <section id="jadwal" className="min-h-screen w-full py-24 flex items-center justify-center">
          <TimelineSection />
        </section>

        {/* Section 8: FAQ */}
        <section id="faq" className="min-h-screen w-full py-24 flex items-center justify-center">
          <FAQSection />
        </section>

        {/* Section 9: Footer */}
        <section id="kontak" className="w-full">
          <Footer />
        </section>
      </main>
    </div>
  );
}
// Final verification commit: Wed Apr 15 01:16:23 WIB 2026
