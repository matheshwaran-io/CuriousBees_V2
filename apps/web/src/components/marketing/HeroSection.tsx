'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, FolderOpen, ShieldCheck, Activity, Users, Lock } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="py-12 sm:py-16 md:py-20 text-center flex flex-col items-center justify-center relative z-10">
      
      {/* 🚀 Floating Intro Capsule */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#004495]/5 border border-[#004495]/10 text-[10px] font-bold uppercase tracking-wider text-primary mb-6 shadow-sm select-none"
      >
        <Sparkles className="w-3.5 h-3.5 text-[#775a00] fill-[#fec727]/30 animate-pulse" />
        <span>CuriousBees v2.0 • SRMIST Secure Research Hub</span>
      </motion.div>

      {/* ⚡ Title with Gradient Text */}
      <motion.h1 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="font-display text-4xl sm:text-5xl md:text-6xl font-extrabold leading-[1.1] text-slate-900 mb-6 max-w-4xl mx-auto tracking-tight select-none"
      >
        Connecting Minds. <br />
        <span className="bg-gradient-to-r from-primary via-primary/80 to-[#775a00] bg-clip-text text-transparent">
          Redefining University Research.
        </span>
      </motion.h1>

      {/* 📄 Description */}
      <motion.p 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="text-slate-500 text-sm sm:text-base md:text-lg max-w-2xl mx-auto mb-8 leading-relaxed font-semibold"
      >
        Empower the SRMIST scientific community with an ultra-performance intranet sandbox. Bridge departments, share peer-reviewed drafts, and coordinate lab resources.
      </motion.p>

      {/* 🎛️ Action Button Group */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="flex flex-col sm:flex-row gap-3 justify-center w-full sm:w-auto mb-16"
      >
        <Link href="/login">
          <button className="w-full sm:w-auto bg-primary hover:bg-primary/95 text-white font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-lg shadow-sm hover:shadow transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer">
            <span>Access Scholar Node</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </Link>
        <Link href="/login">
          <button className="w-full sm:w-auto bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-lg shadow-sm hover:border-slate-350 transition-all active:scale-95 cursor-pointer">
            Explore Directories
          </button>
        </Link>
      </motion.div>
      
      {/* 💻 Next-Level Pure CSS Interactive Browser Mockup */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="w-full max-w-5xl mx-auto rounded-xl border border-slate-200 bg-slate-50/50 p-2 shadow-2xl relative overflow-hidden"
      >
        {/* Browser Top Chrome */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200/80 bg-white rounded-t-lg select-none">
          <div className="flex space-x-1.5 shrink-0">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
          </div>
          <div className="mx-4 bg-slate-100 border border-slate-200/60 rounded-md text-[10px] text-slate-400 font-mono py-0.5 px-12 truncate max-w-md w-full flex items-center justify-center gap-1">
            <Lock className="w-3 h-3 text-slate-400 shrink-0" />
            <span>curiousbees.srmist.edu.in/dashboard</span>
          </div>
          <div className="w-14" /> {/* Spacer */}
        </div>

        {/* Dashboard Mockup Body */}
        <div className="bg-slate-50/70 p-4 min-h-[260px] md:min-h-[380px] rounded-b-lg grid grid-cols-12 gap-3 text-left font-sans select-none">
          {/* Sidebar */}
          <div className="hidden sm:block col-span-3 border-r border-slate-200/50 pr-3 space-y-4">
            <div className="h-4 bg-slate-200 rounded w-16" />
            <div className="space-y-2 pt-2">
              {[FolderOpen, Users, Activity, ShieldCheck].map((Icon, idx) => (
                <div key={idx} className="flex items-center space-x-2 py-1.5 px-2 bg-white/40 border border-slate-200/30 rounded-lg">
                  <Icon className="w-4 h-4 text-primary/70 shrink-0" />
                  <div className="h-2 bg-slate-200 rounded w-20" />
                </div>
              ))}
            </div>
          </div>

          {/* Core Panel Content */}
          <div className="col-span-12 sm:col-span-9 space-y-4">
            {/* User Greeting bar */}
            <div className="flex justify-between items-center bg-white/60 border border-slate-200/50 p-3 rounded-xl">
              <div>
                <div className="h-3 bg-slate-300 rounded w-28" />
                <div className="h-2 bg-slate-200 rounded w-40 mt-1.5" />
              </div>
              <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/25 flex items-center justify-center font-bold text-xs text-primary">
                PI
              </div>
            </div>

            {/* Metrics cards grid */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Citations Index', val: '142', progress: '85%' },
                { label: 'Publications', val: '24', progress: '65%' },
                { label: 'Active Projects', val: '8', progress: '100%' }
              ].map((m, idx) => (
                <div key={idx} className="bg-white border border-slate-200/80 p-3 rounded-xl shadow-sm space-y-2">
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{m.label}</span>
                  <div className="text-sm md:text-xl font-bold text-slate-800 leading-none">{m.val}</div>
                  <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: m.progress }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Simulated Feed proposals */}
            <div className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="h-3 bg-slate-300 rounded w-36" />
                <div className="h-3 bg-slate-200 rounded w-16" />
              </div>
              <div className="space-y-2">
                {[
                  'Deep Learning Model optimization for Nanomaterial Thin Films',
                  'Synergy Proposal: 5G/6G Wireless Telemetry arrays in Computing Labs'
                ].map((title, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200/50 rounded-lg flex items-center justify-between gap-4">
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="text-[10px] font-bold text-slate-800 truncate">{title}</div>
                      <div className="h-2 bg-slate-200 rounded w-28" />
                    </div>
                    <div className="h-5 bg-primary/10 border border-primary/25 text-[8px] font-bold text-primary px-2 rounded-full uppercase tracking-wider shrink-0 flex items-center justify-center">
                      Review
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
      </motion.div>
    </section>
  );
}
