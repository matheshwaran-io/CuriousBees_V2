'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateOpportunitySchema, SRM_DEPARTMENTS } from '@curiousbees/shared-utils';
import { useStore } from '@/store/useStore';
import { 
  Briefcase, 
  Plus, 
  Search, 
  Check, 
  ShieldAlert, 
  X,
  GraduationCap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '@/components/GlassCard';
import TagPill from '@/components/TagPill';
import GlowButton from '@/components/GlowButton';
import OpportunityCard from '@/components/OpportunityCard';

export default function OpportunitiesFeedPage() {
  const { opportunities, createOpportunity, roleOverride } = useStore();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // Filtering states
  const [selectedDept, setSelectedDept] = useState('');
  const [searchDomain, setSearchDomain] = useState('');

  // Setup form validation
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(CreateOpportunitySchema),
    defaultValues: {
      title: '',
      description: '',
      department: '',
      researchDomain: ''
    }
  });

  const onSubmit = async (data: any) => {
    try {
      await createOpportunity(
        data.title,
        data.description,
        data.department,
        data.researchDomain
      );
      setIsDrawerOpen(false);
      reset(); // Clear form
    } catch (e: any) {
      alert(`Error publishing position: ${e.message}`);
    }
  };

  // Filter positions
  const filteredOpps = opportunities.filter((o) => {
    const matchesDept = !selectedDept || o.department === selectedDept;
    const matchesDomain = !searchDomain || o.researchDomain.toLowerCase().includes(searchDomain.toLowerCase());
    return matchesDept && matchesDomain;
  });

  const handleOpenDrawer = () => {
    if (roleOverride !== 'RESEARCH_SUPERVISOR') {
      alert('🔒 Access Restricted! Only verified Faculty Principal Investigators (PIs) are authorized to publish funded research opportunities. Toggle role in sandbox at sidebar bottom to test!');
      return;
    }
    setIsDrawerOpen(true);
  };

  return (
    <div className="space-y-8 relative select-none text-left">
      
      {/* 🚀 Upper Title Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 border-b border-borderStroke pb-5">
        <div>
          <span className="text-[10px] font-mono font-bold text-indigoElectric uppercase tracking-widest flex items-center gap-1.5">
            <Briefcase className="w-4 h-4 text-indigoElectric" />
            <span>Academic Portal Vacancies</span>
          </span>
          <h2 className="font-display font-extrabold text-2xl text-black mt-2">
            Faculty Research Openings
          </h2>
          <p className="text-textMuted text-xs mt-1 leading-relaxed">
            Explore funded PhD positions, research assistant slots, and interdisciplinary vacancies published by Principal Investigators.
          </p>
        </div>

        <button
          onClick={handleOpenDrawer}
          className="h-[40px] px-4 bg-black hover:bg-[#222222] text-white font-sans font-semibold text-[13px] rounded-lg transition-colors flex items-center gap-1.5 shrink-0 self-start sm:self-center cursor-pointer"
        >
          <Plus className="w-4.5 h-4.5" />
          <span>Publish Opportunity</span>
        </button>
      </div>

      {/* 🚀 Dynamic Filter Controls */}
      <GlassCard hoverable={false} className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5">
        
        {/* Department select filter */}
        <div className="space-y-2">
          <label className="block text-[9px] font-mono font-bold text-textMuted uppercase tracking-widest">Filter by Department</label>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full px-3 py-2 text-xs font-semibold rounded-lg bg-white border border-borderStroke text-black focus:border-black focus:outline-none transition-all cursor-pointer"
          >
            <option value="" className="bg-darkSurfaceMuted">All Departments</option>
            {SRM_DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept} className="bg-darkSurfaceMuted">{dept.split('(')[0]}</option>
            ))}
          </select>
        </div>

        {/* Domain text input filter */}
        <div className="space-y-2">
          <label className="block text-[9px] font-mono font-bold text-textMuted uppercase tracking-widest">Search Research Domain</label>
          <div className="relative">
            <input
              type="text"
              value={searchDomain}
              onChange={(e) => setSearchDomain(e.target.value)}
              placeholder="E.g. Reinforcement Learning, Nanomaterials..."
              className="w-full pl-9 pr-4 py-2 text-xs font-semibold rounded-lg bg-white border border-borderStroke text-black placeholder-textMuted focus:border-black focus:outline-none transition-all"
            />
            <Search className="w-3.5 h-3.5 text-textMuted absolute left-3 top-2.5" />
          </div>
        </div>

      </GlassCard>

      {/* 🚀 Main Feed Container */}
      <div className="space-y-6">
        <AnimatePresence mode="popLayout">
          {filteredOpps.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white border border-borderStroke rounded-2xl py-16 text-center"
            >
              <Briefcase className="w-12 h-12 text-textMuted mx-auto mb-4" />
              <h4 className="text-black font-bold text-base">No Vacancies Pinned</h4>
              <p className="text-textMuted text-xs max-w-xs mx-auto mt-2 leading-relaxed font-semibold">
                No funded research slots match your filters at this time. Faculty leads can post JRF listings dynamically.
              </p>
            </motion.div>
          ) : (
            filteredOpps.map((opp) => (
              <OpportunityCard key={opp.id} opportunity={opp} />
            ))
          )}
        </AnimatePresence>
      </div>

      {/* 🚀 SLIDE OUT DRAWER FORM (For Faculty Creation) */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 cursor-pointer"
            />
            
            {/* Drawer Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-full sm:max-w-lg bg-darkSurface border-l border-borderStroke z-50 p-6 shadow-2xl flex flex-col justify-between overflow-y-auto text-left"
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between border-b border-borderStroke pb-4 mb-6">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-lg bg-darkSurfaceMuted border border-borderStroke flex items-center justify-center text-black">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-display font-extrabold text-sm text-black leading-none">Publish Research Slot</h3>
                      <p className="text-[9px] text-textMuted font-mono font-bold uppercase tracking-wider mt-1.5">Exclusive Faculty Intranet Hub</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsDrawerOpen(false)} 
                    className="p-1 rounded-lg text-textMuted hover:text-white cursor-pointer transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Form fields */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  {/* 1. Title */}
                  <div className="space-y-2">
                    <label className="block text-[9px] font-mono font-bold text-textMuted uppercase tracking-widest">Position Title</label>
                    <input
                      type="text"
                      {...register('title')}
                      placeholder="E.g. PhD Slot: Silicon Photonics Biosensor Integration"
                      className="w-full px-3 py-2 text-xs font-semibold rounded-lg bg-white border border-borderStroke text-black placeholder-textMuted focus:border-black focus:outline-none transition-all"
                    />
                    {errors.title && <p className="text-[10px] text-dangerAlert mt-1 font-semibold">{errors.title.message as string}</p>}
                  </div>

                  {/* 2. Research Domain */}
                  <div className="space-y-2">
                    <label className="block text-[9px] font-mono font-bold text-textMuted uppercase tracking-widest">Research Domain Keyword</label>
                    <input
                      type="text"
                      {...register('researchDomain')}
                      placeholder="E.g. Silicon Photonics"
                      className="w-full px-3 py-2 text-xs font-semibold rounded-lg bg-white border border-borderStroke text-black placeholder-textMuted focus:border-black focus:outline-none transition-all"
                    />
                    {errors.researchDomain && <p className="text-[10px] text-dangerAlert mt-1 font-semibold">{errors.researchDomain.message as string}</p>}
                  </div>

                  {/* 3. Department */}
                  <div className="space-y-2">
                    <label className="block text-[9px] font-mono font-bold text-textMuted uppercase tracking-widest">Department Node</label>
                    <select
                      {...register('department')}
                      className="w-full px-3 py-2 text-xs font-semibold rounded-lg bg-white border border-borderStroke text-black focus:border-black focus:outline-none transition-all cursor-pointer"
                    >
                      <option value="" className="bg-darkSurfaceMuted">Select Department</option>
                      {SRM_DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept} className="bg-darkSurfaceMuted">{dept}</option>
                      ))}
                    </select>
                    {errors.department && <p className="text-[10px] text-dangerAlert mt-1 font-semibold">{errors.department.message as string}</p>}
                  </div>

                  {/* 4. Description */}
                  <div className="space-y-2">
                    <label className="block text-[9px] font-mono font-bold text-textMuted uppercase tracking-widest">Scope & Stipend Details</label>
                    <textarea
                      rows={5}
                      {...register('description')}
                      placeholder="Provide funding details (e.g. SERB rates), essential credentials required, and core lab requirements..."
                      className="w-full px-3 py-2 text-xs leading-relaxed font-sans font-semibold rounded-lg bg-white border border-borderStroke text-black placeholder-textMuted focus:border-black focus:outline-none transition-all"
                    />
                    {errors.description && <p className="text-[10px] text-dangerAlert mt-1 font-semibold">{errors.description.message as string}</p>}
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-3 pt-6 border-t border-borderStroke">
                    <button
                      type="button"
                      onClick={() => setIsDrawerOpen(false)}
                      className="px-4 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider text-textMuted hover:text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                    <GlowButton
                      type="submit"
                      disabled={isSubmitting}
                      variant="primary"
                    >
                      {isSubmitting ? (
                        <span className="w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full" />
                      ) : (
                        <>
                          <Check className="w-4 h-4 shrink-0" />
                          <span>Publish Slot</span>
                        </>
                      )}
                    </GlowButton>
                  </div>

                </form>
              </div>

              {/* Dev notice footer */}
              <div className="mt-8 bg-darkSurfaceMuted border border-borderStroke p-3.5 rounded-xl flex items-center space-x-2.5 text-[9px] text-textMuted uppercase font-mono font-bold">
                <ShieldAlert className="w-4 h-4 text-indigoElectric shrink-0 animate-pulse" />
                <span>Verified Faculty PIs authorized only.</span>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
