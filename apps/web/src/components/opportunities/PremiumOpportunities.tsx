'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
  Building,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export function PremiumOpportunities() {
  const { opportunities, createOpportunity, currentUser, fetchData } = useStore();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // Filtering states
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepts, setSelectedDepts] = useState<string[]>([]);
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [selectedPIs, setSelectedPIs] = useState<string[]>([]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Load opportunities on mount & auto-select user department
  useEffect(() => {
    fetchData(true);
  }, [fetchData]);

  useEffect(() => {
    if (currentUser?.department && selectedDepts.length === 0) {
      setSelectedDepts([currentUser.department]);
    }
  }, [currentUser?.department]);

  // Derive unique departments, domains and PIs from data
  const uniqueDepartments = useMemo(() => {
    const depts = new Set<string>();
    if (currentUser?.department) depts.add(currentUser.department);
    opportunities.forEach(o => {
      if (o.department) depts.add(o.department);
    });
    return Array.from(depts).sort();
  }, [opportunities, currentUser?.department]);

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

  // Form setup with default user department
  const userDept = currentUser?.department || '';
  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(CreateOpportunitySchema),
    defaultValues: {
      title: '',
      description: '',
      department: userDept,
      researchDomain: ''
    }
  });

  useEffect(() => {
    if (userDept) {
      setValue('department', userDept);
    }
  }, [userDept, setValue]);

  const onSubmit = async (data: any) => {
    try {
      await createOpportunity(
        data.title,
        data.description,
        data.department || userDept,
        data.researchDomain
      );
      setIsDrawerOpen(false);
      reset({
        title: '',
        description: '',
        department: userDept,
        researchDomain: ''
      });
      fetchData(true);
    } catch (e: any) {
      alert(`Error publishing position: ${e.message}`);
    }
  };

  // Filter positions with flexible department matching
  const filteredOpps = useMemo(() => {
    return opportunities.filter((o) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || o.title.toLowerCase().includes(q) || o.description.toLowerCase().includes(q);
      
      const matchesDept = selectedDepts.length === 0 || selectedDepts.some(sd => {
        const sdBase = sd.split('(')[0].trim().toLowerCase();
        const oppBase = (o.department || '').split('(')[0].trim().toLowerCase();
        return sdBase === oppBase || sdBase.includes(oppBase) || oppBase.includes(sdBase);
      });

      const matchesDomain = selectedDomains.length === 0 || selectedDomains.includes(o.researchDomain);
      const matchesPI = selectedPIs.length === 0 || (o.author?.name && selectedPIs.includes(o.author.name));
      const matchesCategory = !selectedCategory || o.researchDomain?.toLowerCase().includes(selectedCategory.toLowerCase()) || o.title?.toLowerCase().includes(selectedCategory.toLowerCase());
      return matchesSearch && matchesDept && matchesDomain && matchesPI && matchesCategory;
    });
  }, [opportunities, searchQuery, selectedDepts, selectedDomains, selectedPIs, selectedCategory]);

  const handleOpenDrawer = () => {
    if (currentUser?.role !== 'RESEARCH_SUPERVISOR') {
      alert('🔒 Access Restricted! Only verified Research Supervisors are authorized to publish funded research opportunities.');
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
    <div className="min-h-screen bg-slate-50/50 pb-16 select-none text-left">
      <div className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-6">
        
        {/* ─── HEADER SECTION ────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 backdrop-blur-xl p-6 md:p-8 rounded-[32px] border border-slate-200/80 shadow-[0_8px_30px_rgb(12,77,162,0.04)]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase tracking-widest bg-[#0C4DA2]/10 text-[#0C4DA2] px-2.5 py-0.5 rounded-full">
                Research Directory
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Research Opportunities</h1>
            <p className="text-xs md:text-sm font-medium text-slate-500 mt-1">
              Discover funded PhD slots, active lab roles, grants, and department projects.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="lg:hidden flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold shadow-2xs hover:bg-slate-50"
            >
              <Filter className="w-4 h-4 text-slate-500" />
              <span>Filters</span>
            </button>
            {currentUser?.role === 'RESEARCH_SUPERVISOR' && (
              <button
                onClick={handleOpenDrawer}
                className="flex items-center gap-2 px-5 py-3 bg-[#0C4DA2] hover:bg-[#042654] text-white rounded-2xl text-xs font-extrabold uppercase tracking-wider shadow-md shadow-blue-900/20 transition-all cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Post Opportunity</span>
              </button>
            )}
          </div>
        </div>

        {/* ─── CATEGORY FILTER PILLS ────────────── */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {['All Opportunities', 'PhD Positions', 'Assistantships', 'Research Projects', 'Grants & Fellowships', 'CFPs & Conferences', 'Hackathons'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat === 'All Opportunities' ? '' : cat)}
              className={cn(
                "px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap border cursor-pointer select-none",
                (selectedCategory === cat || (!selectedCategory && cat === 'All Opportunities'))
                  ? "bg-[#0C4DA2] text-white border-[#0C4DA2] shadow-sm shadow-blue-900/20"
                  : "bg-white text-slate-700 border-slate-200/80 hover:bg-slate-50"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* ─── MAIN LAYOUT (2-COLUMN) ────────────── */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start mt-6 w-full">
          
          {/* LEFT SIDEBAR FILTERS (Fixed w-80 width) */}
          <aside className={`w-full lg:w-80 shrink-0 space-y-5 ${showMobileFilters ? 'block' : 'hidden lg:block'}`}>
            
            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search opportunities..."
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#0C4DA2] focus:ring-2 focus:ring-[#0C4DA2]/20 shadow-2xs transition-all placeholder:text-slate-400"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>

            {/* Department Filter Card */}
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-slate-200/80 p-5 shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Department</h3>
                {selectedDepts.length > 0 && (
                  <button 
                    onClick={() => setSelectedDepts([])}
                    className="text-[10px] font-bold text-[#0C4DA2] hover:underline cursor-pointer"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
              <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1 scrollbar-thin">
                {uniqueDepartments.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No active departments.</p>
                ) : (
                  uniqueDepartments.map((dept) => (
                    <div 
                      key={dept} 
                      onClick={() => toggleFilter(setSelectedDepts, selectedDepts, dept)} 
                      className="flex items-center gap-3 cursor-pointer group py-1"
                    >
                      <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                        selectedDepts.includes(dept) ? 'bg-[#0C4DA2] border-[#0C4DA2]' : 'border-slate-300 group-hover:border-[#0C4DA2]'
                      }`}>
                        {selectedDepts.includes(dept) && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className={`text-xs font-bold transition-colors truncate ${
                        selectedDepts.includes(dept) ? 'text-[#0C4DA2]' : 'text-slate-700 group-hover:text-[#0C4DA2]'
                      }`}>
                        {dept.split('(')[0].trim()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Research Area Filter Card */}
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-slate-200/80 p-5 shadow-2xs">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4">Research Area</h3>
              <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                {uniqueDomains.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No domain tags active.</p>
                ) : (
                  uniqueDomains.map((domain) => (
                    <div 
                      key={domain} 
                      onClick={() => toggleFilter(setSelectedDomains, selectedDomains, domain)} 
                      className="flex items-center gap-3 cursor-pointer group py-1"
                    >
                      <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                        selectedDomains.includes(domain) ? 'bg-[#FEC727] border-[#FEC727]' : 'border-slate-300 group-hover:border-[#FEC727]'
                      }`}>
                        {selectedDomains.includes(domain) && <Check className="w-3 h-3 text-slate-900 font-bold" />}
                      </div>
                      <span className="text-xs font-bold text-slate-700 group-hover:text-[#0C4DA2] transition-colors">{domain}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Research Supervisor Filter Card */}
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-slate-200/80 p-5 shadow-2xs">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4">Research Supervisor</h3>
              <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                {uniquePIs.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No supervisors active.</p>
                ) : (
                  uniquePIs.map((pi) => (
                    <div 
                      key={pi} 
                      onClick={() => toggleFilter(setSelectedPIs, selectedPIs, pi)} 
                      className="flex items-center gap-3 cursor-pointer group py-1"
                    >
                      <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                        selectedPIs.includes(pi) ? 'bg-[#0C4DA2] border-[#0C4DA2]' : 'border-slate-300 group-hover:border-[#0C4DA2]'
                      }`}>
                        {selectedPIs.includes(pi) && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="text-xs font-bold text-slate-700 group-hover:text-[#0C4DA2] transition-colors">{pi}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </aside>

          {/* RIGHT OPPORTUNITY CARDS LIST (Takes remaining width flex-1 min-w-0) */}
          <div className="flex-1 min-w-0 w-full">
            <AnimatePresence mode="popLayout">
              {filteredOpps.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-white/80 backdrop-blur-xl border border-slate-200/80 p-12 text-center rounded-[32px] shadow-sm flex flex-col items-center justify-center min-h-[320px] w-full"
                >
                  <div className="w-14 h-14 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0C4DA2] mb-4">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <h4 className="text-slate-900 font-extrabold text-base">No Opportunities Listed</h4>
                  <p className="text-slate-500 text-xs max-w-sm mx-auto mt-2 leading-relaxed font-medium">
                    Try adjusting your filters or search terms. Research Supervisors post department opportunities regularly.
                  </p>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 w-full">
                  {filteredOpps.map((opp) => {
                    const isExpanded = expandedCards.includes(opp.id);
                    const authorInitials = opp.author?.name
                      ? opp.author.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
                      : 'RS';

                    return (
                      <motion.div
                        layout
                        key={opp.id}
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.97 }}
                        className="bg-white/90 backdrop-blur-xl rounded-[28px] p-6 border border-slate-200/80 shadow-[0_8px_30px_rgb(12,77,162,0.04)] hover:shadow-[0_12px_40px_rgb(12,77,162,0.08)] transition-all flex flex-col justify-between group hover:-translate-y-0.5"
                      >
                        <div>
                          {/* Domain Pill & Bookmark */}
                          <div className="flex justify-between items-start mb-4">
                            <span className="inline-flex items-center px-3 py-1 bg-blue-50/80 text-[#0C4DA2] border border-blue-100 rounded-xl text-[10px] font-black uppercase tracking-wider">
                              <Sparkles className="w-3 h-3 text-amber-500 mr-1.5" />
                              {opp.researchDomain || 'Research Grant'}
                            </span>
                            <button className="text-slate-300 hover:text-amber-500 transition-colors cursor-pointer p-1">
                              <Bookmark className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Title */}
                          <h3 className="text-base font-extrabold text-slate-900 leading-snug mb-4 group-hover:text-[#0C4DA2] transition-colors">
                            {opp.title}
                          </h3>

                          {/* Supervisor Author Info */}
                          <div className="flex items-center gap-3 mb-4 bg-slate-50/60 p-2.5 rounded-2xl border border-slate-100">
                            {opp.author?.image ? (
                              <img src={opp.author.image} className="w-9 h-9 rounded-full object-cover border border-white shadow-2xs" alt="" />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-[#0C4DA2] text-white font-extrabold text-xs uppercase flex items-center justify-center border border-white shadow-2xs shrink-0">
                                {authorInitials}
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Research Supervisor</p>
                              <p className="text-xs font-bold text-slate-800 truncate leading-none">{opp.author?.name || 'Research Guide'}</p>
                            </div>
                          </div>

                          {/* Department & Date */}
                          <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 mb-4 pb-4 border-b border-slate-100">
                            <span className="flex items-center gap-1.5 truncate">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{opp.department?.split('(')[0].trim() || 'SRMIST Campus'}</span>
                            </span>
                            <span className="flex items-center gap-1.5 shrink-0">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>{formatDate(opp.createdAt)}</span>
                            </span>
                          </div>

                          {/* Description details */}
                          <AnimatePresence>
                            {isExpanded ? (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mb-5"
                              >
                                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-2xl border border-slate-100 font-medium">
                                  {opp.description}
                                </p>
                              </motion.div>
                            ) : (
                              <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 mb-5 font-medium">
                                {opp.description}
                              </p>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-3 mt-auto pt-2">
                          <button
                            onClick={() => toggleCard(opp.id)}
                            className="px-4 py-2.5 rounded-xl border border-slate-200 hover:border-[#0C4DA2] text-slate-700 hover:text-[#0C4DA2] text-xs font-extrabold uppercase tracking-wider transition-all bg-white hover:bg-blue-50/30 cursor-pointer"
                          >
                            {isExpanded ? 'Hide Details' : 'View Details'}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              alert(`Application submitted to ${opp.author?.name || 'Research Supervisor'}!`);
                            }}
                            className="px-4 py-2.5 rounded-xl bg-[#0C4DA2] hover:bg-[#042654] text-white text-xs font-extrabold uppercase tracking-wider shadow-sm shadow-blue-900/20 transition-all cursor-pointer active:scale-95"
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

      {/* ─── DRAWER FORM FOR RESEARCH SUPERVISOR POSTING ─── */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 cursor-pointer"
            />
            
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-full sm:max-w-lg bg-white border-l border-slate-200 z-50 p-6 sm:p-8 shadow-2xl flex flex-col justify-between overflow-y-auto text-left"
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#0C4DA2]/10 flex items-center justify-center shrink-0">
                      <GraduationCap className="w-5 h-5 text-[#0C4DA2]" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-slate-900 leading-none">Publish Opportunity</h3>
                      <p className="text-[10px] text-[#0C4DA2] font-black uppercase tracking-wider mt-1">Research Supervisor Portal</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsDrawerOpen(false)} 
                    className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Form fields */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Position Title</label>
                    <input
                      type="text"
                      {...register('title')}
                      placeholder="E.g. PhD Slot: Silicon Photonics & Quantum Devices"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#0C4DA2] focus:ring-2 focus:ring-[#0C4DA2]/20 transition-all placeholder:text-slate-400"
                    />
                    {errors.title && <p className="text-[10px] text-rose-500 mt-1 font-bold">{errors.title.message as string}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Research Domain / Field</label>
                    <input
                      type="text"
                      {...register('researchDomain')}
                      placeholder="E.g. Artificial Intelligence"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#0C4DA2] focus:ring-2 focus:ring-[#0C4DA2]/20 transition-all placeholder:text-slate-400"
                    />
                    {errors.researchDomain && <p className="text-[10px] text-rose-500 mt-1 font-bold">{errors.researchDomain.message as string}</p>}
                  </div>

                  {/* Standard Department Field (Read-only for Supervisors) */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Department</label>
                    <div className="w-full px-4 py-3 bg-slate-100/80 border border-slate-200 rounded-2xl text-xs font-bold text-slate-500 select-none cursor-not-allowed">
                      {currentUser?.department || 'Not Assigned'}
                    </div>
                    <input type="hidden" {...register('department')} />
                    <p className="text-[9px] text-[#0C4DA2] font-semibold mt-1">Assigned by Institute Administration</p>
                    {errors.department && <p className="text-[10px] text-rose-500 mt-1 font-bold">{errors.department.message as string}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Opportunity Description & Requirements</label>
                    <textarea
                      rows={6}
                      {...register('description')}
                      placeholder="Provide funding details, required credentials, lab responsibilities, and application guidelines..."
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#0C4DA2] focus:ring-2 focus:ring-[#0C4DA2]/20 transition-all placeholder:text-slate-400 resize-none"
                    />
                    {errors.description && <p className="text-[10px] text-rose-500 mt-1 font-bold">{errors.description.message as string}</p>}
                  </div>

                  {/* Submit buttons */}
                  <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 mt-6">
                    <button
                      type="button"
                      onClick={() => setIsDrawerOpen(false)}
                      className="px-5 py-3 border border-slate-200 rounded-2xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors text-xs font-extrabold uppercase tracking-wider cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-3 bg-[#0C4DA2] hover:bg-[#042654] text-white text-xs font-extrabold uppercase tracking-wider rounded-2xl shadow-md shadow-blue-900/20 transition-all active:scale-95 flex items-center space-x-2 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <span className="w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full" />
                      ) : (
                        <>
                          <Check className="w-4 h-4 shrink-0" />
                          <span>Publish Opportunity</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
