'use client';

import React from 'react';
import MarketingNavbar from '@/components/marketing/MarketingNavbar';
import HeroSection from '@/components/marketing/HeroSection';
import FeatureCards from '@/components/marketing/FeatureCards';
import ResearchStats from '@/components/marketing/ResearchStats';
import CTASection from '@/components/marketing/CTASection';
import MarketingFooter from '@/components/marketing/MarketingFooter';

export default function MarketingPage() {
  return (
    <div className="bg-surface-container-high text-on-surface font-body-md antialiased honeycomb-bg min-h-screen flex flex-col font-sans">
      
      {/* Reusable Navbar */}
      <MarketingNavbar />

      {/* Main Content Area */}
      <main className="flex-grow pt-stack-xl mt-stack-xl max-w-container-max mx-auto w-full px-margin-mobile md:px-margin-desktop flex flex-col gap-stack-xl">
        
        {/* Reusable Hero Section */}
        <HeroSection />

        {/* Reusable Feature Cards (Bento) */}
        <FeatureCards />

        {/* Reusable Social Proof Statistics */}
        <ResearchStats />

        {/* Reusable Bottom CTA */}
        <CTASection />

      </main>

      {/* Reusable Footer */}
      <MarketingFooter />

    </div>
  );
}
