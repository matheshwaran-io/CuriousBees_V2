'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, FolderGit2, Share2, Building2 } from 'lucide-react';

export default function ResearchStats() {
  const [stats, setStats] = useState({ departments: 0, researchers: 0, collaborations: 0, projects: 0 });

  useEffect(() => {
    const duration = 1200;
    const steps = 25;
    const stepTime = duration / steps;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      setStats({
        departments: Math.min(Math.floor((42 / steps) * currentStep), 42),
        researchers: Math.min(Math.floor((5000 / steps) * currentStep), 5000),
        collaborations: Math.min(Math.floor((850 / steps) * currentStep), 850),
        projects: Math.min(Math.floor((12400 / steps) * currentStep), 12400),
      });

      if (currentStep >= steps) clearInterval(interval);
    }, stepTime);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-12 md:py-16 border-y border-slate-200/60 my-8 relative z-10 select-none">
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
        
        {/* Stat Card 1: Researchers */}
        <div className="cb-card p-5 bg-white flex flex-col justify-between h-36 relative overflow-hidden group hover:border-primary/20 transition-all duration-200">
          <div className="absolute bottom-0 inset-x-0 h-10 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
            <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
              <path d="M0 35 Q 25 15, 50 30 T 100 10" fill="none" stroke="#004495" strokeWidth="3" />
            </svg>
          </div>
          <div className="flex justify-between items-center relative z-10">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Researchers</span>
            <div className="w-7 h-7 bg-primary/5 border border-primary/10 rounded-lg flex items-center justify-center text-primary shrink-0">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1 relative z-10">
            <div className="font-display text-3xl sm:text-4xl font-light text-slate-900 leading-none">
              {stats.researchers.toLocaleString()}+
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Across SRMIST Campuses</p>
          </div>
        </div>

        {/* Stat Card 2: Projects */}
        <div className="cb-card p-5 bg-white flex flex-col justify-between h-36 relative overflow-hidden group hover:border-[#775a00]/30 transition-all duration-200">
          <div className="absolute bottom-0 inset-x-0 h-10 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
            <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
              <path d="M0 25 Q 30 5, 60 20 T 100 15" fill="none" stroke="#775a00" strokeWidth="3" />
            </svg>
          </div>
          <div className="flex justify-between items-center relative z-10">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Research Projects</span>
            <div className="w-7 h-7 bg-[#775a00]/5 border border-[#775a00]/10 rounded-lg flex items-center justify-center text-[#775a00] shrink-0">
              <FolderGit2 className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1 relative z-10">
            <div className="font-display text-3xl sm:text-4xl font-light text-slate-900 leading-none">
              {stats.projects.toLocaleString()}+
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active Workspace Nodes</p>
          </div>
        </div>

        {/* Stat Card 3: Collaborations */}
        <div className="cb-card p-5 bg-white flex flex-col justify-between h-36 relative overflow-hidden group hover:border-primary/20 transition-all duration-200">
          <div className="absolute bottom-0 inset-x-0 h-10 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
            <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
              <path d="M0 30 Q 20 20, 50 10 T 100 25" fill="none" stroke="#004495" strokeWidth="3" />
            </svg>
          </div>
          <div className="flex justify-between items-center relative z-10">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Collaborations</span>
            <div className="w-7 h-7 bg-primary/5 border border-primary/10 rounded-lg flex items-center justify-center text-primary shrink-0">
              <Share2 className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1 relative z-10">
            <div className="font-display text-3xl sm:text-4xl font-light text-slate-900 leading-none">
              {stats.collaborations.toLocaleString()}+
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Interdepartmental Matches</p>
          </div>
        </div>

        {/* Stat Card 4: Departments */}
        <div className="cb-card p-5 bg-white flex flex-col justify-between h-36 relative overflow-hidden group hover:border-[#775a00]/30 transition-all duration-200">
          <div className="absolute bottom-0 inset-x-0 h-10 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
            <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
              <path d="M0 15 Q 40 35, 70 10 T 100 30" fill="none" stroke="#775a00" strokeWidth="3" />
            </svg>
          </div>
          <div className="flex justify-between items-center relative z-10">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Departments</span>
            <div className="w-7 h-7 bg-[#775a00]/5 border border-[#775a00]/10 rounded-lg flex items-center justify-center text-[#775a00] shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1 relative z-10">
            <div className="font-display text-3xl sm:text-4xl font-light text-slate-900 leading-none">
              {stats.departments}
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Academic Faculties</p>
          </div>
        </div>

      </div>
    </section>
  );
}
