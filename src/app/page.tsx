"use client";

import HeroSection from "@/components/home/HeroSection";
import HowItWorksSection from "@/components/home/HowItWorksSection";
import WhyWeUseItPremium from "@/components/home/WhyWeUseItPremium";
import HowToUseItPaint from "@/components/home/HowToUseItPaint";
import StoriesSection from "@/components/home/StoriesSection";
import PricingCards from "@/components/pricing/PricingCards";
import Footer from "@/components/Footer";

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-visible">
      <HeroSection />
      <HowItWorksSection />
      <WhyWeUseItPremium />
      <HowToUseItPaint />
      <StoriesSection />
      {/* Pricing — 3D ring + cards (already self-contained) */}
      <PricingCards />
      <Footer />
    </main>
  );
}
