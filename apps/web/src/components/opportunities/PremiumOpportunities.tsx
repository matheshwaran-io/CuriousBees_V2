'use client';

import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateOpportunitySchema, SRM_DEPARTMENTS } from '@curiousbees/shared-utils';
import { useStore } from '@/store/useStore';
import { 
  Briefcase, 
  Plus, 
  Search, 
  Check, 
  X,
  GraduationCap,
  Bookmark,
  MapPin,
  Clock,
  Filter,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function PremiumOpportunities() {
  const { opportunities, createOpportunity, currentUser } = useStore();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // Filtering states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepts, setSelectedDepts] = useState<string[]>([]);
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [selectedPIs, setSelectedPIs] = useState<string[]>([]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Derive unique departments, domains and PIs from real data
  const uniqueDepartments = useMemo(() => {
    const depts = new Set<string>();
    opportunities.forEach(o => {
      if (o.department) depts.add(o.department);
    });
    return Array.from(depts).sort();
  }, [opportunities]);

  const uniqueDomains = useMemo(() => {
    const domains = new Set<string>();
    opportunities.forEach(o => {
      if (o.researchDomain) domains.add(o.researchDomain);
    });
    return Array.from(domains).sort();
  }, [opportunities]);

  const uniquePIs = useMemo(() => {
    const pis = new Set<string>();
    opportunities.forEach(o => {
      if (o.author?.name) pis.add(o.author.name);
    });
    return Array.from(pis).sort();
  }, [opportunities]);

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
  const filteredOpps = useMemo(() => {
    return opportunities.filter((o) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || o.title.toLowerCase().includes(q) || o.description.toLowerCase().includes(q);
      const matchesDept = selectedDepts.length === 0 || selectedDepts.includes(o.department);
      const matchesDomain = selectedDomains.length === 0 || selectedDomains.includes(o.researchDomain);
      const matchesPI = selectedPIs.length === 0 || (o.author?.name && selectedPIs.includes(o.author.name));
      return matchesSearch && matchesDept && matchesDomain && matchesPI;
    });
  }, [opportunities, searchQuery, selectedDepts, selectedDomains, selectedPIs]);

  const handleOpenDrawer = () => {
    if (currentUser?.role !== 'RESEARCH_SUPERVISOR') {
      alert('🔒 Access Restricted! Only verified Faculty Principal Investigators (PIs) are authorized to publish funded research opportunities.');
      return;
    }
    setIsDrawerOpen(true);
  };

  const toggleFilter = (set: React.Dispatch<React.SetStateAction<string[]>>, list: string[], value: string) => {
    if (list.includes(value)) {
      set(list.filter(item => item !== value));
    } else {
      set([...list, value]);
    }
  };

  const formatDate = (dateStr: string | Date) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const [expandedCards, setExpandedCards] = useState<string[]>([]);
  const toggleCard = (id: string) => {
    if (expandedCards.includes(id)) {
      setExpandedCards(expandedCards.filter(cid => cid !== id));
    } else {
      setExpandedCards([...expandedCards, id]);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFBFC] pb-12 select-none text-left">
      <div className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-6">
        
        {/* 🚀 HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Opportunity Listings</h1>
            <p className="text-sm text-slate-500 mt-1">
              Discover funded PhD positions, active lab roles, and collaborative projects.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="lg:hidden flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-semibold shadow-sm hover:bg-slate-50 transition-colors"
            >
              <Filter className="w-4 h-4 text-slate-400" />
              <span>Filters</span>
            </button>
            {currentUser?.role === 'RESEARCH_SUPERVISOR' && (
              <button
                onClick={handleOpenDrawer}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#004495] hover:bg-[#003370] text-white rounded-full text-sm font-bold shadow-md shadow-blue-900/20 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Post Opportunity</span>
              </button>
            )}
          </div>
        </div>

        {/* 🚀 MAIN LAYOUT (2-COLUMN) */}
        <div className="flex flex-col lg:flex-row gap-8 items-start mt-8">
          
          {/* LEFT SIDEBAR (FILTERS) */}
          <aside className={`w-full lg:w-72 shrink-0 space-y-6 ${showMobileFilters ? 'block' : 'hidden lg:block'}`}>
            
            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search opportunities..."
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#004495] focus:ring-1 focus:ring-[#004495] shadow-sm transition-all placeholder:text-slate-400"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>

            {/* Department Filter */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Department</h3>
              <div className="space-y-3">
                {uniqueDepartments.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No departments active.</p>
                ) : (
                  uniqueDepartments.map((dept) => (
                    <div key={dept} onClick={() => toggleFilter(setSelectedDepts, selectedDepts, dept)} className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${selectedDepts.includes(dept) ? 'bg-[#004495] border-[#004495]' : 'border-slate-300 group-hover:border-[#004495]'}`}>
                        {selectedDepts.includes(dept) && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="text-sm font-semibold text-slate-700">{dept.split('(')[0].trim()}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Research Area Filter */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Research Area</h3>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {uniqueDomains.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No domains active.</p>
                ) : (
                  uniqueDomains.map((domain) => (
                    <div key={domain} onClick={() => toggleFilter(setSelectedDomains, selectedDomains, domain)} className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${selectedDomains.includes(domain) ? 'bg-[#FFC107] border-[#FFC107]' : 'border-slate-300 group-hover:border-[#FFC107]'}`}>
                        {selectedDomains.includes(domain) && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="text-sm font-semibold text-slate-700">{domain}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Faculty Member Filter */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Faculty Member</h3>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {uniquePIs.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No faculty active.</p>
                ) : (
                  uniquePIs.map((pi) => (
                    <div key={pi} onClick={() => toggleFilter(setSelectedPIs, selectedPIs, pi)} className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${selectedPIs.includes(pi) ? 'bg-[#004495] border-[#004495]' : 'border-slate-300 group-hover:border-[#004495]'}`}>
                        {selectedPIs.includes(pi) && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="text-sm font-semibold text-slate-700">{pi}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </aside>

          {/* RIGHT GRID (CARDS) */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="popLayout">
              {filteredOpps.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-white border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] p-12 text-center rounded-2xl"
                >
                  <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-4" />
                  <h4 className="text-slate-900 font-bold text-base">No Listings Found</h4>
                  <p className="text-slate-500 text-sm max-w-sm mx-auto mt-2 leading-relaxed font-medium">
                    Try adjusting your filters or search terms. New opportunities are posted regularly by faculty supervisors.
                  </p>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {filteredOpps.map((opp) => {
                    const isExpanded = expandedCards.includes(opp.id);
                    return (
                      <motion.div
                        layout
                        key={opp.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_2px_15px_-5px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-5px_rgba(0,0,0,0.08)] transition-all flex flex-col justify-between"
                      >
                        <div>
                          {/* Tags & Bookmark */}
                          <div className="flex justify-between items-start mb-4">
                            <span className="inline-flex items-center px-3 py-1 bg-blue-50 text-[#004495] rounded-md text-[10px] font-bold uppercase tracking-wider">
                              <span className="mr-1.5 text-lg leading-none mt-[-2px]">🚀</span>
                              {opp.researchDomain}
                            </span>
                            <button className="text-slate-300 hover:text-[#FFC107] transition-colors">
                              <Bookmark className="w-5 h-5" />
                            </button>
                          </div>

                          {/* Title */}
                          <h3 className="text-lg font-bold text-slate-900 leading-snug mb-4">
                            {opp.title}
                          </h3>

                          {/* Supervisor Info */}
                          <div className="flex items-center gap-3 mb-5">
                            {opp.author?.image ? (
                              <img src={opp.author.image} className="w-10 h-10 rounded-full object-cover border border-slate-100 shadow-sm" alt="" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-display font-bold text-slate-600 text-sm">
                                {opp.author?.name ? opp.author.name[0].toUpperCase() : 'PI'}
                              </div>
                            )}
                            <div>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Faculty Supervisor</p>
                              <p className="text-sm font-semibold text-slate-800 leading-none">{opp.author?.name || 'Faculty Lead'}</p>
                            </div>
                          </div>

                          {/* Meta info */}
                          <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 mb-5 pb-5 border-b border-slate-100">
                            <span className="flex items-center gap-1.5">
                              <MapPin className="w-4 h-4 text-slate-400" />
                              {opp.department?.split('(')[0].trim() || 'Campus'}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-4 h-4 text-slate-400" />
                              Posted {formatDate(opp.createdAt)}
                            </span>
                          </div>

                          {/* Description snippet */}
                          <AnimatePresence>
                            {isExpanded ? (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mb-6"
                              >
                                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-xl border border-slate-100">
                                  {opp.description}
                                </p>
                              </motion.div>
                            ) : (
                              <p className="text-sm text-slate-600 leading-relaxed line-clamp-2 mb-6">
                                {opp.description}
                              </p>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-3 mt-auto">
                          <button
                            onClick={() => toggleCard(opp.id)}
                            className="px-4 py-2.5 rounded-xl border border-slate-200 hover:border-[#004495] text-slate-600 hover:text-[#004495] text-xs font-bold uppercase tracking-wider transition-colors bg-white hover:bg-blue-50/30"
                          >
                            {isExpanded ? 'Hide Details' : 'Details'}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              alert(`Interest Sent to ${opp.author?.name || 'the faculty lead'}!`);
                            }}
                            className="px-4 py-2.5 rounded-xl bg-[#004495] hover:bg-[#003370] text-white text-xs font-bold uppercase tracking-wider shadow-sm shadow-blue-900/20 transition-colors"
                          >
                            Apply Now
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </AnimatePresence>
          </div>

        </div>

      </div>

      {/* 🚀 SLIDE OUT DRAWER FORM (For Faculty Creation) */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 cursor-pointer"
            />
            
            {/* Drawer Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-full sm:max-w-lg bg-white border-l border-slate-200 z-50 p-6 shadow-2xl flex flex-col justify-between overflow-y-auto text-left"
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-[#004495]/10 flex items-center justify-center shrink-0">
                      <GraduationCap className="w-5 h-5 text-[#004495]" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-base text-slate-900 leading-none">Publish Research Slot</h3>
                      <p className="text-[10px] text-[#004495] font-bold uppercase tracking-wider mt-1.5">Exclusive Faculty Intranet Hub</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsDrawerOpen(false)} 
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Form fields */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Position Title</label>
                    <input
                      type="text"
                      {...register('title')}
                      placeholder="E.g. PhD Slot: Silicon Photonics"
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#004495] focus:ring-1 focus:ring-[#004495] transition-all placeholder:text-slate-400"
                    />
                    {errors.title && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.title.message as string}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Research Domain Keyword</label>
                    <input
                      type="text"
                      {...register('researchDomain')}
                      placeholder="E.g. Genomics"
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#004495] focus:ring-1 focus:ring-[#004495] transition-all placeholder:text-slate-400"
                    />
                    {errors.researchDomain && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.researchDomain.message as string}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Department</label>
                    <select
                      {...register('department')}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#004495] focus:ring-1 focus:ring-[#004495] transition-all cursor-pointer"
                    >
                      <option value="">Select Department</option>
                      {SRM_DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                    {errors.department && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.department.message as string}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Scope & Details</label>
                    <textarea
                      rows={6}
                      {...register('description')}
                      placeholder="Provide funding details, credentials required, and lab responsibilities..."
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#004495] focus:ring-1 focus:ring-[#004495] transition-all placeholder:text-slate-400 resize-none"
                    />
                    {errors.description && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.description.message as string}</p>}
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 mt-6">
                    <button
                      type="button"
                      onClick={() => setIsDrawerOpen(false)}
                      className="px-5 py-3 border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors text-xs font-bold uppercase tracking-wider cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-3 bg-[#004495] hover:bg-[#003370] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md shadow-blue-900/20 transition-all duration-200 active:scale-95 flex items-center space-x-2 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <span className="w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full" />
                      ) : (
                        <>
                          <Check className="w-4 h-4 shrink-0" />
                          <span>Publish Slot</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              <div className="mt-8 bg-[#FFC107]/10 border border-[#FFC107]/20 p-4 rounded-xl flex items-center space-x-3 text-[10px] text-amber-700 uppercase font-bold">
                <ShieldAlert className="w-5 h-5 shrink-0" />
                <span>Verified Faculty PIs authorized only. Ensure alignment with university funding guidelines before publishing.</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
