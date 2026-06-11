'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useStore } from '@/store/useStore';
import { 
  BookOpen, 
  MapPin, 
  FileText, 
  Check, 
  Edit3, 
  Tag, 
  Plus, 
  Sparkles,
  GraduationCap,
  Award,
  Layers,
  Network,
  Share2,
  ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { DashboardShell } from '@/components/shared/dashboard-shell';

export default function ScholarProfilePage() {
  const { currentUser, interestsList, threads, collaborators, fetchCollaborators } = useStore();

  useEffect(() => {
    fetchCollaborators();
  }, [fetchCollaborators]);

  const selectedInterests = currentUser?.interests?.map((i) => i.interest?.name || '') || [];
  const userThreads = threads.filter(t => t.authorId === currentUser?.id);

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'CB';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  const graphCollaborators = collaborators
    .filter((c: any) => c.id !== currentUser?.id)
    .slice(0, 3);

  const defaultNetwork = [
    { initials: 'JD', name: 'Dr. Jane Du' },
    { initials: 'AM', name: 'Dr. Alan M.' },
    { initials: 'KL', name: 'Dr. Kevin Lin' }
  ];

  const networkNodes = graphCollaborators.length >= 3 
    ? graphCollaborators.map((c: any) => ({ initials: getInitials(c.name), name: c.name || '' }))
    : defaultNetwork;

  const citationsVal = 24;
  const publicationsVal = userThreads.length > 0 ? userThreads.length : 3;

  return (
    <DashboardShell>
      {/* 🚀 Profile Header Banner */}
      <div className="cb-card p-6 relative overflow-hidden bg-white/90 backdrop-blur-md text-left flex flex-col md:flex-row items-start md:items-center gap-6">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-secondary/5 rounded-full blur-3xl pointer-events-none" />
        
        {/* Avatar Area */}
        <div className="relative shrink-0 z-10 self-center">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-4 border-white shadow-md bg-[#004495]/5 flex items-center justify-center relative group">
            {currentUser?.image ? (
              <img 
                src={currentUser.image} 
                alt={currentUser.name || 'User Profile'}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-3xl sm:text-4xl font-display font-bold text-primary">
                {getInitials(currentUser?.name)}
              </span>
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-primary shadow-sm">
            <Sparkles className="w-4 h-4 text-[#775a00] fill-[#fec727]/30" />
          </div>
        </div>

        {/* User Bio and Basic Information */}
        <div className="flex-1 min-w-0 z-10 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900 leading-tight tracking-tight">
              {currentUser?.name || 'Academic Scholar'}
            </h2>
            <span className="px-2.5 py-0.5 bg-primary/5 text-primary border border-primary/10 rounded-full text-[10px] font-bold uppercase tracking-wider">
              Research Scholar
            </span>
            {currentUser?.approved && (
              <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                <Check className="w-3 h-3 stroke-[3px]" />
                Verified Node
              </span>
            )}
          </div>
          
          <p className="text-slate-500 text-xs sm:text-sm font-semibold uppercase tracking-wider">
            {currentUser?.department || 'Department of Computing Technologies'} • SRMIST
          </p>

          <div className="flex flex-wrap gap-1.5">
            {selectedInterests.slice(0, 3).map((interest) => (
              <span 
                key={interest}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-50 border border-slate-200/60 text-slate-650 rounded-lg text-[10px] font-bold uppercase tracking-wider"
              >
                <Tag className="w-3 h-3 text-slate-400" />
                {interest}
              </span>
            ))}
            {selectedInterests.length === 0 && (
              <span className="text-xs text-slate-405 italic font-semibold">
                No focus areas defined. Configure in settings to index your node.
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <Link href="/scholar/settings">
              <button className="px-4 py-2 bg-primary text-white rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-primary/95 transition-all shadow flex items-center gap-1.5 cursor-pointer">
                <Edit3 className="w-3.5 h-3.5" />
                <span>Configure Profile Settings</span>
              </button>
            </Link>
            <button 
              onClick={() => alert(`Intranet link generated: ${window.location.origin}/scholar/profile`)}
              className="px-4 py-2 bg-white text-slate-705 border border-slate-200 hover:border-slate-350 hover:bg-slate-550 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Share Profile Link</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Widget Panel */}
        <div className="flex md:flex-row lg:flex-col gap-4 w-full md:w-auto lg:w-48 bg-slate-50/50 border border-slate-200/50 p-4 rounded-xl text-center md:text-left justify-around shrink-0 z-10 self-stretch">
          <div className="flex-1 md:flex-initial">
            <div className="text-xl sm:text-2xl font-bold text-slate-800 leading-none">{citationsVal}</div>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Citations</div>
          </div>
          <div className="hidden md:block w-[1px] lg:h-[1px] lg:w-full bg-slate-200" />
          <div className="flex-1 md:flex-initial">
            <div className="text-xl sm:text-2xl font-bold text-slate-800 leading-none">{publicationsVal}</div>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Logged Publications</div>
          </div>
          <div className="hidden md:block w-[1px] lg:h-[1px] lg:w-full bg-slate-200" />
          <div className="flex-1 md:flex-initial">
            <div className="text-xl sm:text-2xl font-bold text-slate-800 leading-none">94%</div>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Synergy Compatibility</div>
          </div>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
        {/* Biography & Skills */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="cb-card p-5 bg-white flex flex-col justify-between min-h-[220px]">
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2.5">
                <FileText className="w-4.5 h-4.5 text-primary" />
                <span>Scholar Biography</span>
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed whitespace-pre-line font-medium">
                {currentUser?.bio || 
                  'Define your scientific research interests, co-authored grants details, and lab milestones to configure this block.'}
              </p>
            </div>
            
            <div className="mt-6 pt-3 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              <span className="flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                <span>Verified Scholar</span>
              </span>
              <span className="font-mono text-slate-500 font-medium lowercase select-text">{currentUser?.email}</span>
            </div>
          </div>

          <div className="cb-card p-5 bg-white">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2.5 mb-4">
              <Award className="w-4.5 h-4.5 text-primary" />
              <span>Skills & Proficiency Matrix</span>
            </h3>
            <div className="space-y-4">
              {selectedInterests.length > 0 ? (
                selectedInterests.map((interest, idx) => {
                  const proficiencies = ['90%', '85%', '75%', '60%', '50%'];
                  const labels = ['Advanced', 'Advanced', 'Proficient', 'Proficient', 'Intermediate'];
                  const profVal = proficiencies[idx] || '45%';
                  const labelVal = labels[idx] || 'Competent';
                  
                  return (
                    <div key={interest} className="space-y-1.5">
                      <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider">
                        <span className="text-slate-700">{interest}</span>
                        <span className="text-primary">{labelVal}</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                        <div 
                          className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-500" 
                          style={{ width: profVal }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 text-xs text-slate-400 italic font-semibold">
                  No research skills defined. Configure interests inside Settings.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Co-Authors Network & Scholarly Outputs */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="cb-card p-5 bg-white min-h-[320px] flex flex-col justify-between">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Network className="w-4.5 h-4.5 text-primary" />
                <span>Academic Collaboration Graph</span>
              </h3>
              <Link 
                href="/scholar/connections"
                className="text-primary text-[10px] font-bold uppercase tracking-wider hover:underline"
              >
                Find Peers
              </Link>
            </div>
            
            <div className="flex-grow min-h-[200px] bg-slate-50/50 rounded-xl border border-slate-200/60 relative overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#004495 1.5px, transparent 1.5px)', backgroundSize: '16px 16px' }}></div>
              
              {/* Center Node (Self) */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12.5 h-12.5 bg-primary text-white rounded-full flex flex-col items-center justify-center shadow-md z-10 border border-primary/20">
                <span className="font-display font-bold text-[10px] leading-none">{getInitials(currentUser?.name)}</span>
                <span className="text-[6px] font-bold uppercase tracking-wider mt-0.5 opacity-80">Self</span>
              </div>

              {/* SVG Connection Lines */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
                <line stroke="#c3c6d6" strokeWidth="1" strokeDasharray="3 3" x1="50%" y1="50%" x2="30%" y2="25%" />
                <line stroke="#c3c6d6" strokeWidth="1" strokeDasharray="3 3" x1="50%" y1="50%" x2="72%" y2="35%" />
                <line stroke="#c3c6d6" strokeWidth="1" strokeDasharray="3 3" x1="50%" y1="50%" x2="42%" y2="80%" />
              </svg>

              {/* Node 1 */}
              <div className="absolute top-[18%] left-[24%] w-10 h-10 bg-white text-slate-800 rounded-full flex flex-col items-center justify-center shadow border border-slate-200 z-10 hover:scale-105 transition-transform" title={networkNodes[0].name}>
                <span className="font-display font-bold text-[9px] text-primary">{networkNodes[0].initials}</span>
                <span className="text-[6px] text-slate-400 font-bold uppercase tracking-wider leading-none mt-0.5 truncate max-w-[32px]">{networkNodes[0].name.split(' ')[0]}</span>
              </div>

              {/* Node 2 */}
              <div className="absolute top-[28%] right-[20%] w-11 h-11 bg-white text-slate-800 rounded-full flex flex-col items-center justify-center shadow border border-slate-200 z-10 hover:scale-105 transition-transform" title={networkNodes[1].name}>
                <span className="font-display font-bold text-[9px] text-primary">{networkNodes[1].initials}</span>
                <span className="text-[6px] text-slate-400 font-bold uppercase tracking-wider leading-none mt-0.5 truncate max-w-[36px]">{networkNodes[1].name.split(' ')[0]}</span>
              </div>

              {/* Node 3 */}
              <div className="absolute bottom-[16%] left-[38%] w-10 h-10 bg-white text-slate-800 rounded-full flex flex-col items-center justify-center shadow border border-slate-200 z-10 hover:scale-105 transition-transform" title={networkNodes[2].name}>
                <span className="font-display font-bold text-[9px] text-primary">{networkNodes[2].initials}</span>
                <span className="text-[6px] text-slate-400 font-bold uppercase tracking-wider leading-none mt-0.5 truncate max-w-[32px]">{networkNodes[2].name.split(' ')[0]}</span>
              </div>
            </div>
          </div>

          <div className="cb-card p-5 bg-white text-left">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5 mb-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="w-4.5 h-4.5 text-primary" />
                <span>Scholarly Outputs & Proposals</span>
              </h3>
              <Link 
                href="/scholar/feed" 
                className="text-primary text-[10px] font-bold uppercase tracking-wider flex items-center gap-0.5"
              >
                <span>View Feed</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            
            <div className="space-y-3">
              {userThreads.length > 0 ? (
                userThreads.slice(0, 2).map((thread) => (
                  <div 
                    key={thread.id} 
                    className="p-3.5 rounded-lg border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors group cursor-pointer"
                  >
                    <div className="flex gap-3 items-start">
                      <div className="w-7 h-7 rounded-lg bg-primary/5 text-primary flex items-center justify-center shrink-0 mt-0.5">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <Link href={`/scholar/feed/${thread.id}`}>
                          <h4 className="text-xs font-bold text-slate-950 group-hover:text-primary transition-colors leading-snug truncate">
                            {thread.title}
                          </h4>
                        </Link>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          Published {new Date(thread.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <>
                  <div className="p-3.5 rounded-lg border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors group cursor-pointer">
                    <div className="flex gap-3 items-start">
                      <div className="w-7 h-7 rounded-lg bg-primary/5 text-primary flex items-center justify-center shrink-0 mt-0.5 border border-primary/10">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-slate-950 group-hover:text-primary transition-colors leading-snug">
                          Quantum Error Correction in Synthetic DNA Sequencing
                        </h4>
                        <p className="text-[10px] text-slate-404 font-bold uppercase tracking-wider">
                          Nature Computational Science • Published Oct 2025
                        </p>
                        <div className="flex gap-2 pt-1">
                          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider px-2 py-0.5 bg-slate-200/50 rounded-md">
                            Peer Reviewed
                          </span>
                          <span className="text-[9px] text-primary font-bold uppercase tracking-wider px-2 py-0.5 bg-primary/5 rounded-md">
                            42 Citations
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-lg border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors group cursor-pointer">
                    <div className="flex gap-3 items-start">
                      <div className="w-7 h-7 rounded-lg bg-primary/5 text-primary flex items-center justify-center shrink-0 mt-0.5 border border-primary/10">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-slate-950 group-hover:text-primary transition-colors leading-snug">
                          Algorithmic Approaches to Protein Folding via Qubits
                        </h4>
                        <p className="text-[10px] text-slate-404 font-bold uppercase tracking-wider">
                          Journal of Bioinformatics • Published May 2025
                        </p>
                        <div className="flex gap-2 pt-1">
                          <span className="text-[9px] text-slate-505 font-bold uppercase tracking-wider px-2 py-0.5 bg-slate-200/50 rounded-md">
                            Open Access
                          </span>
                          <span className="text-[9px] text-primary font-bold uppercase tracking-wider px-2 py-0.5 bg-primary/5 rounded-md">
                            18 Citations
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
