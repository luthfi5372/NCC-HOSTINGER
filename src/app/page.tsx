"use client";

import dynamic from "next/dynamic";
import SmoothScroll from "@/components/SmoothScroll";

// Heavy components with browser APIs loaded dynamically
const ParallaxBackground = dynamic(() => import("@/components/ParallaxBackground"), { ssr: false });
const IndonesiaMap = dynamic(() => import("@/components/IndonesiaMap"), { ssr: false });
const GallerySection = dynamic(() => import("@/components/GallerySection"), { ssr: false });
const SpeedMonitor = dynamic(() => import("@/components/SpeedMonitor"), { ssr: false });

// Standard interactive components
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeatureGrid from "@/components/FeatureGrid";
import CategoryCards from "@/components/CategoryCards";
import PricingSection from "@/components/PricingSection";
import FAQSection from "@/components/FAQSection";
import Footer from "@/components/Footer";
import TimelineSection from "@/components/TimelineSection";

export default function Home() {
  return (
    <SmoothScroll>
      <div className="relative scroll-smooth selection:bg-indigo-500/30 bg-slate-50">
        <ParallaxBackground />
        <Navbar />
        <div className="fixed bottom-6 right-6 z-[60]">
          <SpeedMonitor />
        </div>

        <main className="w-full">
          <section id="beranda" className="min-h-screen w-full flex items-center justify-center">
            <HeroSection />
          </section>

          <section className="min-h-screen w-full py-24 flex items-center justify-center">
            <FeatureGrid />
          </section>

          <section className="min-h-screen w-full py-24 flex items-center justify-center">
            <GallerySection />
          </section>

          <section id="kategori" className="min-h-screen w-full py-24 flex items-center justify-center">
            <CategoryCards />
          </section>

          <section className="min-h-screen w-full py-24 flex items-center justify-center">
            <PricingSection />
          </section>

          <section className="min-h-screen w-full py-24 flex items-center justify-center">
            <IndonesiaMap />
          </section>

          <TimelineSection />

          <section id="faq" className="min-h-screen w-full py-24 flex items-center justify-center">
            <FAQSection />
          </section>

          <section id="kontak" className="w-full">
            <Footer />
          </section>
        </main>
      </div>
    </SmoothScroll>
  );
}
