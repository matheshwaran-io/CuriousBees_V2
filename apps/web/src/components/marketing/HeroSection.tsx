'use client';

import React from 'react';
import Link from 'next/link';

export default function HeroSection() {
  return (
    <section className="py-stack-xl text-center flex flex-col items-center justify-center min-h-[60vh] relative z-10 mt-8">
      <h1 className="font-display-lg text-display-lg md:text-[64px] md:leading-[72px] text-primary mb-stack-md max-w-4xl mx-auto tracking-tight select-none">
        Connecting Researchers.<br/>Accelerating Innovation.
      </h1>
      <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto mb-stack-lg leading-relaxed">
        Empowering the SRMIST research community with a unified platform for cross-departmental collaboration, real-time insight sharing, and global research visibility.
      </p>
      <div className="flex flex-col sm:flex-row gap-stack-md justify-center w-full sm:w-auto">
        <Link href="/login">
          <button className="w-full sm:w-auto bg-primary text-on-primary font-label-md text-label-md px-6 py-3 rounded-lg shadow-sm hover:bg-primary-container transition-colors active:scale-95 duration-150">
            Login with SRM Account
          </button>
        </Link>
        <Link href="/login">
          <button className="w-full sm:w-auto bg-white text-primary border border-outline-variant font-label-md text-label-md px-6 py-3 rounded-lg shadow-sm hover:bg-surface-container transition-colors active:scale-95 duration-150">
            Explore Research
          </button>
        </Link>
      </div>
      
      <div className="mt-stack-xl w-full max-w-5xl mx-auto relative h-64 md:h-96 rounded-xl overflow-hidden glass-panel flex items-center justify-center">
        <img 
          alt="Research Environment" 
          className="w-full h-full object-cover opacity-80 mix-blend-multiply" 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuB63logjmEBE81I7Zw25FZzG2n-PfV7jd9gzFV53KnPvPpFn6lpfD6AvG08hZ2m5cvj_x7Y-V2mbbtx5seeB2olPgyIEAE3Rq1XSRQWPlMMM8v8dtpDP0JMlJGULSDAD2KWSrfAJACFzbZ7j8NxMFvUQFlEPHC8SLG8tMtQoChytWdzCL8WvzMtaUMS26yI96mdQfsSBHCHzI2d5tqs3i-isHz5mmMPGbnZff79XmMs0X2KQ08GdaOHQeCfxlgDH0SN6f6PT2fCp3Ix"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface-container-high/90 to-transparent"></div>
      </div>
    </section>
  );
}
