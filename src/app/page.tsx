"use client";

import dynamic from "next/dynamic";
import SmoothScroll from "@/components/SmoothScroll";

// ALL interactive components are loaded dynamically client-side only
// This prevents hydration mismatches on Next.js 16 App Router
const Navbar = dynamic(() => import("@/components/Navbar"), { ssr: false });
const HeroSection = dynamic(() => import("@/components/HeroSection"), { ssr: false });
const FeatureGrid = dynamic(() => import("@/components/FeatureGrid"), { ssr: false });
const CategoryCards = dynamic(() => import("@/components/CategoryCards"), { ssr: false });
const PricingSection = dynamic(() => import("@/components/PricingSection"), { ssr: false });
const FAQSection = dynamic(() => import("@/components/FAQSection"), { ssr: false });
const Footer = dynamic(() => import("@/components/Footer"), { ssr: false });
const ParallaxBackground = dynamic(() => import("@/components/ParallaxBackground"), { ssr: false });
const IndonesiaMap = dynamic(() => import("@/components/IndonesiaMap"), { ssr: false });
const GallerySection = dynamic(() => import("@/components/GallerySection"), { ssr: false });
const TimelineSection = dynamic(() => import("@/components/TimelineSection"), { ssr: false });
const SpeedMonitor = dynamic(() => import("@/components/SpeedMonitor"), { ssr: false });

export default function Home() {
  return (
    <SmoothScroll>
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
        <TimelineSection />

        {/* Section 8: FAQ */}
        <section id="faq" className="min-h-screen w-full py-24 flex items-center justify-center">
          <FAQSection />
        </section>

        {/* Section 9: Footer */}
        <section id="kontak" className="w-full">
          <Footer />
        </section>
      </main>
    </SmoothScroll>
  );
}
// Final verification commit: Wed Apr 15 01:16:23 WIB 2026
