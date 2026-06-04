'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Search, Network, Activity, Sparkles, BookOpen, Fingerprint } from 'lucide-react';

export default function FeatureCards() {
  return (
    <section className="py-12 md:py-16 z-10 text-left">
      <div className="max-w-4xl mb-12">
        <span className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-1.5 mb-2">
          <Fingerprint className="w-4 h-4 text-primary" />
          <span>Core Capabilities</span>
        </span>
        <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Platform Infrastructure Tailored for Scholars
        </h2>
        <p className="text-slate-500 text-xs sm:text-sm font-semibold uppercase mt-1">
          Everything faculty guides, supervisors, and doctoral scholars need to advance academic research.
        </p>
      </div>

      {/* Asymmetric Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Bento 1: Research Discovery (Col span 2) */}
        <motion.div 
          whileHover={{ y: -3 }}
          transition={{ duration: 0.2 }}
          className="cb-card p-6 bg-white hover:border-primary/30 md:col-span-2 relative overflow-hidden flex flex-col justify-between min-h-[220px]"
        >
          {/* Subtle mesh glow */}
          <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="space-y-4 relative z-10">
            <div className="w-10 h-10 rounded-lg bg-primary/5 text-primary border border-primary/10 flex items-center justify-center shrink-0">
              <Search className="w-5 h-5" />
            </div>
            <div className="space-y-2">
              <h3 className="font-display text-lg font-bold text-slate-950 flex items-center gap-1.5">
                <span>Semantic Research Discovery</span>
                <span className="px-2 py-0.5 rounded bg-primary/5 text-primary border border-primary/10 text-[8px] font-mono font-bold uppercase tracking-wider">AI Powered</span>
              </h3>
              <p className="text-slate-500 text-xs leading-relaxed font-semibold">
                Instantly map SRMIST’s scientific knowledge base. Connect with interdisciplinary co-authors using semantic interest queries and index keywords to bypass standard search constraints.
              </p>
            </div>
          </div>
          
          <div className="pt-4 border-t border-slate-100 flex items-center gap-3 text-[10px] font-bold text-primary uppercase tracking-widest relative z-10 select-none">
            <span>Query Scholar Nodes</span>
            <span>•</span>
            <span>Map Scientific Citations</span>
          </div>
        </motion.div>

        {/* Bento 2: Workspaces */}
        <motion.div 
          whileHover={{ y: -3 }}
          transition={{ duration: 0.2 }}
          className="cb-card p-6 bg-white hover:border-primary/30 relative overflow-hidden flex flex-col justify-between min-h-[220px]"
        >
          <div className="absolute -right-12 -top-12 w-36 h-36 bg-[#775a00]/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="space-y-4 relative z-10">
            <div className="w-10 h-10 rounded-lg bg-primary/5 text-[#775a00] border border-[#775a00]/15 flex items-center justify-center shrink-0">
              <Network className="w-5 h-5" />
            </div>
            <div className="space-y-2">
              <h3 className="font-display text-lg font-bold text-slate-950">Active Lab Workspaces</h3>
              <p className="text-slate-500 text-xs leading-relaxed font-semibold">
                Host protected project sandboxes. Share database artifacts, maintain active check-offs, and co-author templates within SRMIST networks.
              </p>
            </div>
          </div>
          
          <div className="pt-4 border-t border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest relative z-10 select-none">
            Secure Synergy Hubs
          </div>
        </motion.div>

        {/* Bento 3: Telemetry */}
        <motion.div 
          whileHover={{ y: -3 }}
          transition={{ duration: 0.2 }}
          className="cb-card p-6 bg-white hover:border-primary/30 relative overflow-hidden flex flex-col justify-between min-h-[220px]"
        >
          <div className="space-y-4 relative z-10">
            <div className="w-10 h-10 rounded-lg bg-primary/5 text-primary border border-primary/10 flex items-center justify-center shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div className="space-y-2">
              <h3 className="font-display text-lg font-bold text-slate-950">Citation Analytics</h3>
              <p className="text-slate-500 text-xs leading-relaxed font-semibold">
                Monitor h-index timelines, verify citation metrics, and export lab output metrics for guidance review.
              </p>
            </div>
          </div>
          
          <div className="pt-4 border-t border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest relative z-10 select-none">
            h-Index Progress Charts
          </div>
        </motion.div>

        {/* Bento 4: Peer Reviewed Discussions (Col span 2) */}
        <motion.div 
          whileHover={{ y: -3 }}
          transition={{ duration: 0.2 }}
          className="cb-card p-6 bg-white hover:border-primary/30 md:col-span-2 relative overflow-hidden flex flex-col justify-between min-h-[220px]"
        >
          <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-[#775a00]/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="space-y-4 relative z-10">
            <div className="w-10 h-10 rounded-lg bg-primary/5 text-[#775a00] border border-[#775a00]/15 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="space-y-2">
              <h3 className="font-display text-lg font-bold text-slate-950">Collaborative Proposals Feed</h3>
              <p className="text-slate-500 text-xs leading-relaxed font-semibold">
                Share open research drafts, announce vacancy calls for PhD candidates, and exchange templates with SRMIST researchers. Filter topics instantly by tagging focus areas.
              </p>
            </div>
          </div>
          
          <div className="pt-4 border-t border-slate-100 flex items-center gap-3 text-[10px] font-bold text-primary uppercase tracking-widest relative z-10 select-none">
            <span>Interdepartmental Forums</span>
            <span>•</span>
            <span>Synergy Calls</span>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
