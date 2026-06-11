'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { 
  Briefcase, 
  Search, 
  MapPin,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardShell } from '@/components/shared/dashboard-shell';
import OpportunityCard from '@/components/OpportunityCard';
import { SRM_DEPARTMENTS } from '@curiousbees/shared-utils';

export default function ScholarOpportunitiesPage() {
  const { opportunities, fetchData, isLoading } = useStore();
  
  // Filtering states
  const [selectedDept, setSelectedDept] = useState('');
  const [searchDomain, setSearchDomain] = useState('');

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter positions
  const filteredOpps = opportunities.filter((o) => {
    const matchesDept = !selectedDept || o.department === selectedDept;
    const matchesDomain = !searchDomain || o.researchDomain.toLowerCase().includes(searchDomain.toLowerCase());
    return matchesDept && matchesDomain;
  });

  return (
    <DashboardShell>
      {/* 🚀 Notion-style Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#001E4C] via-[#002868] to-[#004495] cb-honeycomb-dark border border-[#004495]/15 p-6 md:p-8 shadow-xl text-left">
        <div className="absolute right-0 top-0 w-96 h-96 bg-[#FEC727]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-12 bottom-0 w-72 h-72 bg-[#004495]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 flex-1 min-w-0">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#FEC727]/25 text-[#FEC727] border border-[#FEC727]/30 text-[10px] font-bold uppercase tracking-wider">
              Scholar Opportunities Hub
            </span>
            <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-white tracking-tight leading-tight">
              Funded PhD Slots & Research Fellowships
            </h1>
            <p className="text-xs sm:text-sm text-white/80 font-medium max-w-xl leading-relaxed">
              Explore vacancies published directly by Faculty Principal Investigators (PIs). Apply interest to automatically dispatch your academic snapshot.
            </p>
          </div>
        </div>
      </div>

      {/* 🚀 Filter Controls Bar */}
      <div className="cb-card grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 bg-white/90 backdrop-blur-md text-left">
        {/* Department select filter */}
        <div className="space-y-2">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Filter by Department</label>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full px-3 h-[42px] text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/25 focus:outline-none transition-all cursor-pointer"
          >
            <option value="">All Departments</option>
            {SRM_DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>{dept.split('(')[0]}</option>
            ))}
          </select>
        </div>

        {/* Domain text input filter */}
        <div className="space-y-2">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Search Research Domain</label>
          <div className="relative">
            <input
              type="text"
              value={searchDomain}
              onChange={(e) => setSearchDomain(e.target.value)}
              placeholder="E.g. Reinforcement Learning, Silicon Photonics..."
              className="cb-input pl-9"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3.5" />
          </div>
        </div>
      </div>

      {/* 🚀 Opportunities Grid */}
      <div className="space-y-6">
        <AnimatePresence mode="popLayout">
          {filteredOpps.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="cb-card p-12 text-center bg-white/90 backdrop-blur-md text-left"
            >
              <Briefcase className="w-8 h-8 text-slate-350 mx-auto mb-4" />
              <h4 className="text-slate-900 font-bold text-sm text-center">No Vacancies Pinned</h4>
              <p className="text-slate-500 text-xs max-w-xs mx-auto mt-2 leading-relaxed font-semibold text-center">
                No funded research slots match your filters at this time. Faculty leads can post JRF listings dynamically.
              </p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {filteredOpps.map((opp) => (
                <OpportunityCard key={opp.id} opportunity={opp} />
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </DashboardShell>
  );
}
