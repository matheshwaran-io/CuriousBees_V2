'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { getProfileImageUrl } from '@/lib/avatar';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookMarked,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronRight,
  User,
  Building,
  Calendar,
  Sparkles,
  Plus,
  Edit3,
  FileText,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  Check,
  X,
  Network,
  ListTodo,
  TrendingUp,
  Award,
  HelpCircle,
  FileCheck,
  FolderOpen
} from 'lucide-react';
import type { ResearchStage, ResearchStatus, MilestoneStatus, MilestonePriority } from '@curiousbees/types';

const STAGES: { key: ResearchStage; label: string; description: string }[] = [
  { key: 'PROPOSAL', label: 'Research Proposal', description: 'Thesis topic definition, objectives, and approval.' },
  { key: 'LITERATURE_REVIEW', label: 'Literature Review', description: 'Comprehensive survey of existing work and prior state of the art.' },
  { key: 'METHODOLOGY', label: 'Methodology', description: 'Architectural formulation, algorithms, and experimental design.' },
  { key: 'IMPLEMENTATION', label: 'Implementation', description: 'Development, data collection, and prototype execution.' },
  { key: 'EVALUATION', label: 'Evaluation', description: 'Empirical benchmarking, statistical analysis, and validation.' },
  { key: 'THESIS_PUBLICATION', label: 'Thesis / Publication', description: 'Final dissertation writing, peer-review submissions, and defense.' }
];

export default function MyResearchCommandCenterPage() {
  const router = useRouter();
  const {
    currentUser,
    myResearchProfile,
    myResearchMilestones,
    myResearchActivities,
    myResearchMaterials,
    fetchMyResearch,
    updateResearchProfile,
    createResearchMilestone,
    completeMilestone,
    fetchMyResearchMaterials,
    addToast
  } = useStore();

  const [loading, setLoading] = useState(true);
  const [activeMilestoneTab, setActiveMilestoneTab] = useState<'ALL' | 'UPCOMING' | 'IN_PROGRESS' | 'OVERDUE' | 'COMPLETED'>('ALL');
  
  // Modals
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isAddMilestoneOpen, setIsAddMilestoneOpen] = useState(false);

  // Edit Profile Form
  const [editTitle, setEditTitle] = useState('');
  const [editArea, setEditArea] = useState('');
  const [editAbstract, setEditAbstract] = useState('');
  const [editStage, setEditStage] = useState<ResearchStage>('PROPOSAL');
  const [editStatus, setEditStatus] = useState<ResearchStatus>('ACTIVE');
  const [editStartDate, setEditStartDate] = useState('');
  const [editCompletionDate, setEditCompletionDate] = useState('');

  // Add Milestone Form
  const [mTitle, setMTitle] = useState('');
  const [mDesc, setMDesc] = useState('');
  const [mStage, setMStage] = useState<ResearchStage>('PROPOSAL');
  const [mPriority, setMPriority] = useState<MilestonePriority>('MEDIUM');
  const [mDueDate, setMDueDate] = useState('');

  useEffect(() => {
    if (currentUser) {
      setLoading(true);
      Promise.all([fetchMyResearch(), fetchMyResearchMaterials()]).finally(() => {
        setLoading(false);
      });
    }
  }, [currentUser]);

  // Populate Edit Profile Form when profile loads or drawer opens
  useEffect(() => {
    if (myResearchProfile) {
      setEditTitle(myResearchProfile.title || '');
      setEditArea(myResearchProfile.researchArea || '');
      setEditAbstract(myResearchProfile.abstract || '');
      setEditStage(myResearchProfile.currentStage || 'PROPOSAL');
      setEditStatus(myResearchProfile.status || 'ACTIVE');
      setEditStartDate(myResearchProfile.startDate ? new Date(myResearchProfile.startDate).toISOString().slice(0, 10) : '');
      setEditCompletionDate(myResearchProfile.expectedCompletionDate ? new Date(myResearchProfile.expectedCompletionDate).toISOString().slice(0, 10) : '');
      setMStage(myResearchProfile.currentStage || 'PROPOSAL');
    }
  }, [myResearchProfile, isEditProfileOpen]);

  // Access Guard
  const isScholar = currentUser?.role === 'RESEARCH_SCHOLAR';

  // Calculate current stage index
  const currentStageIndex = useMemo(() => {
    if (!myResearchProfile?.currentStage) return 0;
    const idx = STAGES.findIndex((s) => s.key === myResearchProfile.currentStage);
    return idx >= 0 ? idx : 0;
  }, [myResearchProfile?.currentStage]);

  // Data-Driven Attention Required Calculation
  const attentionItems = useMemo(() => {
    const items: { id: string; title: string; reason: string; priority: 'HIGH' | 'MEDIUM'; date?: string; actionText: string; onClick: () => void }[] = [];
    const now = new Date();

    if (!myResearchProfile?.supervisor) {
      items.push({
        id: 'no-supervisor',
        title: 'Supervision Connection Missing',
        reason: 'Your account is not currently assigned to an approved Research Supervisor.',
        priority: 'HIGH',
        actionText: 'Find Supervisor',
        onClick: () => router.push('/researchers')
      });
    }

    if (myResearchProfile?.title === 'Scholar Thesis Research Project' || !myResearchProfile?.abstract) {
      items.push({
        id: 'unconfigured-topic',
        title: 'Configure Thesis Topic',
        reason: 'Your research topic and abstract are currently set to default placeholder values.',
        priority: 'MEDIUM',
        actionText: 'Update Topic',
        onClick: () => setIsEditProfileOpen(true)
      });
    }

    (myResearchMilestones || []).forEach((m) => {
      if (m.status !== 'COMPLETED' && m.dueDate) {
        const dueDate = new Date(m.dueDate);
        if (dueDate < now) {
          items.push({
            id: `overdue-${m.id}`,
            title: `Overdue Milestone: "${m.title}"`,
            reason: `Milestone due date passed on ${dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}.`,
            priority: 'HIGH',
            date: dueDate.toLocaleDateString(),
            actionText: 'Complete Milestone',
            onClick: () => completeMilestone(m.id)
          });
        } else {
          const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays <= 7) {
            items.push({
              id: `due-soon-${m.id}`,
              title: `Milestone Due Soon: "${m.title}"`,
              reason: `Due in ${diffDays} day${diffDays === 1 ? '' : 's'} (${dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}).`,
              priority: 'MEDIUM',
              date: dueDate.toLocaleDateString(),
              actionText: 'View Milestone',
              onClick: () => setActiveMilestoneTab('UPCOMING')
            });
          }
        }
      }
    });

    return items;
  }, [myResearchProfile, myResearchMilestones, router, completeMilestone]);

  // Filtered Milestones
  const filteredMilestones = useMemo(() => {
    if (!myResearchMilestones) return [];
    if (activeMilestoneTab === 'ALL') return myResearchMilestones;
    const now = new Date();
    return myResearchMilestones.filter((m) => {
      if (activeMilestoneTab === 'COMPLETED') return m.status === 'COMPLETED';
      if (activeMilestoneTab === 'IN_PROGRESS') return m.status === 'IN_PROGRESS';
      if (activeMilestoneTab === 'OVERDUE') return m.status !== 'COMPLETED' && m.dueDate && new Date(m.dueDate) < now;
      if (activeMilestoneTab === 'UPCOMING') return m.status === 'UPCOMING' && (!m.dueDate || new Date(m.dueDate) >= now);
      return true;
    });
  }, [myResearchMilestones, activeMilestoneTab]);

  // Handle Edit Profile Submission
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateResearchProfile({
        title: editTitle,
        researchArea: editArea,
        abstract: editAbstract,
        currentStage: editStage,
        status: editStatus,
        startDate: editStartDate || null,
        expectedCompletionDate: editCompletionDate || null
      });
      setIsEditProfileOpen(false);
    } catch (err) {
      // Error handled in store
    }
  };

  // Handle Add Milestone Submission
  const handleCreateMilestoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mTitle.trim()) {
      addToast('Please enter a milestone title', 'error');
      return;
    }
    try {
      await createResearchMilestone({
        title: mTitle,
        description: mDesc,
        stage: mStage,
        priority: mPriority,
        dueDate: mDueDate || null
      });
      setMTitle('');
      setMDesc('');
      setIsAddMilestoneOpen(false);
    } catch (err) {
      // Error handled in store
    }
  };

  if (!currentUser) return null;

  // Strict Role Guard Page Rendering
  if (!isScholar) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center font-sans select-none">
        <div className="max-w-md bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-black text-slate-900">Access Restricted</h2>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            The "My Research" command center is exclusively available for Research Scholars. Research Supervisors can monitor scholar progress in the Supervision Panel.
          </p>
          <div className="pt-2">
            <button
              onClick={() => router.push('/feed')}
              className="px-6 py-2.5 bg-[#0C4DA2] text-white text-xs font-bold rounded-full hover:bg-blue-800 transition-all cursor-pointer"
            >
              Return to Research Feed
            </button>
          </div>
        </div>
      </div>
    );
  }

  const supervisor = myResearchProfile?.supervisor;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16 font-sans text-slate-900 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">

        {/* ─── HEADER & STATUS BADGE ─── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-3xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-blue-50 text-[#0C4DA2] border border-blue-100/60">
                <BookMarked className="w-5 h-5" />
              </span>
              <div>
                <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">My Research</h1>
                <p className="text-xs font-medium text-slate-500 mt-0.5">
                  Your research journey, progress, supervision, and upcoming milestones.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Status Pill */}
            <div className={`px-3.5 py-1.5 rounded-full border text-xs font-black uppercase tracking-wider flex items-center gap-2 ${
              myResearchProfile?.status === 'ACTIVE'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : myResearchProfile?.status === 'COMPLETED'
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                : myResearchProfile?.status === 'ON_HOLD'
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                myResearchProfile?.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
              }`} />
              {myResearchProfile?.status ? myResearchProfile.status.replace('_', ' ') : 'ACTIVE RESEARCH'}
            </div>

            <button
              onClick={() => setIsEditProfileOpen(true)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-250 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-slate-600" />
              <span>Edit Topic</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl">
            <div className="w-8 h-8 border-3 border-[#0C4DA2] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-bold text-slate-500">Loading your research command center...</p>
          </div>
        ) : (
          <>
            {/* ─── RESEARCH OVERVIEW HERO CARD ─── */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-3xs space-y-6">
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                <div className="space-y-3 flex-1 min-w-0">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-blue-50/80 border border-blue-100 text-[#0C4DA2] text-[11px] font-bold">
                    <Building className="w-3.5 h-3.5" />
                    <span>{myResearchProfile?.researchArea || 'Computer Applications'}</span>
                  </div>

                  <h2 className="text-lg sm:text-xl font-black text-slate-900 leading-snug">
                    {myResearchProfile?.title || 'Scholar Thesis Research Project'}
                  </h2>

                  {myResearchProfile?.abstract && (
                    <p className="text-xs text-slate-600 leading-relaxed font-medium bg-slate-50/70 p-3.5 rounded-xl border border-slate-150">
                      {myResearchProfile.abstract}
                    </p>
                  )}
                </div>

                {/* Dates & Quick Context Meta */}
                <div className="lg:w-72 bg-slate-50/80 border border-slate-200/80 rounded-xl p-4 space-y-3 text-xs shrink-0">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Current Stage</span>
                    <span className="font-extrabold text-[#0C4DA2] uppercase tracking-wide">
                      {myResearchProfile?.currentStage?.replace('_', ' ') || 'PROPOSAL'}
                    </span>
                  </div>
                  <div className="h-px bg-slate-200/60" />
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Start Date</span>
                    <span className="font-bold text-slate-800">
                      {myResearchProfile?.startDate
                        ? new Date(myResearchProfile.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                        : new Date(currentUser.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Target Defense</span>
                    <span className="font-bold text-slate-800">
                      {myResearchProfile?.expectedCompletionDate
                        ? new Date(myResearchProfile.expectedCompletionDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                        : 'Unspecified'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ─── RESEARCH PROGRESS TRACKER ─── */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-3xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#0C4DA2]" />
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Research Lifecycle Stage</h3>
                </div>
                <span className="text-xs font-bold text-slate-500">
                  Stage {currentStageIndex + 1} of {STAGES.length}
                </span>
              </div>

              {/* Step Flow Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {STAGES.map((stg, idx) => {
                  const isCompleted = idx < currentStageIndex;
                  const isCurrent = idx === currentStageIndex;

                  return (
                    <button
                      key={stg.key}
                      onClick={async () => {
                        if (idx !== currentStageIndex) {
                          await updateResearchProfile({ currentStage: stg.key });
                        }
                      }}
                      className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between min-h-[110px] cursor-pointer ${
                        isCurrent
                          ? 'bg-blue-50/80 border-[#0C4DA2] shadow-xs'
                          : isCompleted
                          ? 'bg-emerald-50/40 border-emerald-200 hover:bg-emerald-50/70'
                          : 'bg-slate-50/50 border-slate-200/70 hover:bg-slate-100/60 opacity-70'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center ${
                            isCurrent
                              ? 'bg-[#0C4DA2] text-white'
                              : isCompleted
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-200 text-slate-600'
                          }`}>
                            {isCompleted ? <Check className="w-3 h-3" /> : idx + 1}
                          </span>
                          <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                            isCurrent
                              ? 'bg-blue-100 text-[#0C4DA2]'
                              : isCompleted
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'text-slate-400'
                          }`}>
                            {isCurrent ? 'ACTIVE' : isCompleted ? 'DONE' : 'NEXT'}
                          </span>
                        </div>

                        <h4 className={`text-xs font-bold leading-tight ${isCurrent ? 'text-[#0C4DA2]' : 'text-slate-800'}`}>
                          {stg.label}
                        </h4>
                      </div>

                      <p className="text-[10px] text-slate-500 line-clamp-2 mt-2 leading-tight">
                        {stg.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ─── TWO COLUMN MAIN SECTION ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* LEFT COLUMN: Milestones & Attention Items (Spans 8 cols) */}
              <div className="lg:col-span-8 space-y-6">

                {/* ATTENTION REQUIRED CARD */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-3xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Attention Required</h3>
                    </div>
                    {attentionItems.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black">
                        {attentionItems.length} ACTION{attentionItems.length > 1 ? 'S' : ''}
                      </span>
                    )}
                  </div>

                  {attentionItems.length === 0 ? (
                    <div className="p-6 bg-emerald-50/50 border border-emerald-100 rounded-xl flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-emerald-950">All caught up</h4>
                        <p className="text-[11px] font-medium text-emerald-700 mt-0.5">No research actions require your attention.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {attentionItems.map((item) => (
                        <div
                          key={item.id}
                          className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left transition-all ${
                            item.priority === 'HIGH'
                              ? 'bg-rose-50/30 border-rose-200/70'
                              : 'bg-amber-50/30 border-amber-200/70'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                                item.priority === 'HIGH' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {item.priority} PRIORITY
                              </span>
                              <h4 className="text-xs font-extrabold text-slate-900">{item.title}</h4>
                            </div>
                            <p className="text-[11px] text-slate-600 font-medium">{item.reason}</p>
                          </div>

                          <button
                            onClick={item.onClick}
                            className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-lg transition-colors shrink-0 cursor-pointer self-start sm:self-auto"
                          >
                            {item.actionText}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* RESEARCH MILESTONES CARD */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-3xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <ListTodo className="w-4 h-4 text-[#0C4DA2]" />
                      <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Research Milestones</h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsAddMilestoneOpen(true)}
                        className="px-3 py-1.5 bg-[#0C4DA2] hover:bg-blue-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Milestone</span>
                      </button>
                    </div>
                  </div>

                  {/* Filter Tabs */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold text-slate-600 select-none">
                    {(['ALL', 'UPCOMING', 'IN_PROGRESS', 'OVERDUE', 'COMPLETED'] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveMilestoneTab(tab)}
                        className={`px-3 py-1.5 rounded-lg border transition-all shrink-0 cursor-pointer ${
                          activeMilestoneTab === tab
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {tab.replace('_', ' ')}
                      </button>
                    ))}
                  </div>

                  {/* Milestone Items */}
                  {filteredMilestones.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50/60 border border-slate-200/60 rounded-xl space-y-2">
                      <Clock className="w-6 h-6 text-slate-400 mx-auto" />
                      <h4 className="text-xs font-bold text-slate-800">No research milestones found</h4>
                      <p className="text-[11px] text-slate-500">
                        {activeMilestoneTab === 'ALL'
                          ? 'No milestones have been added to your research profile yet.'
                          : `No ${activeMilestoneTab.toLowerCase().replace('_', ' ')} milestones found.`}
                      </p>
                      <button
                        onClick={() => setIsAddMilestoneOpen(true)}
                        className="mt-2 text-xs font-bold text-[#0C4DA2] hover:underline cursor-pointer"
                      >
                        + Create a new milestone
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredMilestones.map((m) => {
                        const isOverdue = m.status !== 'COMPLETED' && m.dueDate && new Date(m.dueDate) < new Date();

                        return (
                          <div
                            key={m.id}
                            className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left transition-all ${
                              m.status === 'COMPLETED'
                                ? 'bg-emerald-50/20 border-emerald-200/60 opacity-80'
                                : isOverdue
                                ? 'bg-rose-50/30 border-rose-200'
                                : 'bg-slate-50/40 border-slate-200/80 hover:bg-slate-50'
                            }`}
                          >
                            <div className="space-y-1 flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${
                                  m.priority === 'HIGH'
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : m.priority === 'MEDIUM'
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : 'bg-blue-50 text-blue-700 border-blue-200'
                                }`}>
                                  {m.priority}
                                </span>

                                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 text-[9px] font-bold uppercase tracking-wider">
                                  {m.stage.replace('_', ' ')}
                                </span>

                                {isOverdue && (
                                  <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white text-[9px] font-black uppercase tracking-wider">
                                    OVERDUE
                                  </span>
                                )}
                              </div>

                              <h4 className={`text-xs font-extrabold ${m.status === 'COMPLETED' ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                                {m.title}
                              </h4>

                              {m.description && (
                                <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                                  {m.description}
                                </p>
                              )}

                              {m.dueDate && (
                                <p className="text-[10px] font-bold text-slate-500 flex items-center gap-1 pt-0.5">
                                  <Calendar className="w-3 h-3 text-slate-400" />
                                  <span>Due: {new Date(m.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                </p>
                              )}
                            </div>

                            <div className="shrink-0 flex items-center gap-2">
                              {m.status !== 'COMPLETED' && (
                                <button
                                  onClick={() => completeMilestone(m.id)}
                                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Complete</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* RECENT RESEARCH ACTIVITY TIMELINE */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-3xs space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Clock className="w-4 h-4 text-[#0C4DA2]" />
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Recent Research Activity</h3>
                  </div>

                  {!myResearchActivities || myResearchActivities.length === 0 ? (
                    <p className="text-xs text-slate-500 py-4 text-center italic font-medium">
                      Your research activity will appear here as your work progresses.
                    </p>
                  ) : (
                    <div className="space-y-4 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                      {myResearchActivities.map((act) => (
                        <div key={act.id} className="flex items-start gap-3 relative z-10 text-left">
                          <div className="w-7 h-7 rounded-full bg-white border-2 border-[#0C4DA2] text-[#0C4DA2] flex items-center justify-center shrink-0 shadow-3xs mt-0.5">
                            <Sparkles className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0 bg-slate-50/70 p-3 rounded-xl border border-slate-150">
                            <p className="text-xs font-bold text-slate-900 leading-snug">{act.description}</p>
                            <span className="text-[10px] font-bold text-slate-400 mt-1 block">
                              {new Date(act.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* RIGHT COLUMN: Supervisor Connection, Materials & Quick Actions (Spans 4 cols) */}
              <div className="lg:col-span-4 space-y-6">

                {/* SUPERVISOR CONNECTION CARD */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-3xs space-y-4">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-2">
                    Research Supervisor
                  </h3>

                  {!supervisor ? (
                    <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl space-y-2 text-left">
                      <h4 className="text-xs font-bold text-amber-900">Your research supervision is not connected yet</h4>
                      <p className="text-[11px] font-medium text-amber-700 leading-relaxed">
                        Find a supervisor from your department to map your thesis supervision.
                      </p>
                      <button
                        onClick={() => router.push('/researchers')}
                        className="mt-2 w-full py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        Find a Supervisor
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4 text-left">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
                          <img
                            src={getProfileImageUrl(supervisor)}
                            alt={supervisor.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-extrabold text-slate-900 truncate">{supervisor.name}</h4>
                          <p className="text-xs font-semibold text-[#0C4DA2]">
                            {supervisor.supervisorProfile?.designation || 'Research Supervisor'}
                          </p>
                          <p className="text-[10px] font-bold text-slate-500 truncate">
                            {supervisor.department || 'Computer Applications'}
                          </p>
                        </div>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-150 flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-500">Supervision Status</span>
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                          ACTIVE
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <Link
                          href={`/researchers/${supervisor.id}`}
                          className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-250 transition-colors text-center cursor-pointer"
                        >
                          View Profile
                        </Link>

                        <button
                          onClick={() => {
                            if (myResearchProfile?.activeCollabId) {
                              router.push(`/nexus?collab=${myResearchProfile.activeCollabId}`);
                            } else {
                              router.push('/nexus');
                            }
                          }}
                          className="py-2.5 px-3 bg-[#0C4DA2] hover:bg-blue-800 text-white text-xs font-bold rounded-xl transition-colors text-center cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Network className="w-3.5 h-3.5" />
                          <span>Open Nexus</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* RESEARCH MATERIALS CARD */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-3xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">
                      Research Materials
                    </h3>
                    <Link
                      href="/nexus"
                      className="text-[11px] font-bold text-[#0C4DA2] hover:underline"
                    >
                      View All
                    </Link>
                  </div>

                  {!myResearchMaterials || myResearchMaterials.length === 0 ? (
                    <p className="text-xs text-slate-500 py-3 text-center italic font-medium">
                      No research documents or submissions attached yet.
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {myResearchMaterials.slice(0, 5).map((mat) => (
                        <a
                          key={mat.id}
                          href={mat.url || '#'}
                          target="_blank"
                          rel="noreferrer"
                          className="p-3 rounded-xl bg-slate-50 hover:bg-blue-50/40 border border-slate-200/80 transition-all flex items-center justify-between gap-2 group text-left"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <FileText className="w-4 h-4 text-[#0C4DA2] shrink-0" />
                            <div className="truncate">
                              <p className="text-xs font-bold text-slate-900 truncate group-hover:text-[#0C4DA2]">
                                {mat.name}
                              </p>
                              <p className="text-[10px] font-medium text-slate-500 truncate">
                                {mat.source} • {mat.size}
                              </p>
                            </div>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0C4DA2] shrink-0" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                {/* QUICK ACTIONS TOOLBAR */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-3xs space-y-3 text-left">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-2">
                    Quick Actions
                  </h3>

                  <div className="space-y-2">
                    <button
                      onClick={() => setIsEditProfileOpen(true)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <TrendingUp className="w-3.5 h-3.5 text-[#0C4DA2]" />
                        <span>Update Research Progress</span>
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>

                    <button
                      onClick={() => setIsAddMilestoneOpen(true)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Plus className="w-3.5 h-3.5 text-[#0C4DA2]" />
                        <span>Add Milestone</span>
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>

                    {supervisor && (
                      <Link
                        href={`/researchers/${supervisor.id}`}
                        className="w-full p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 transition-colors flex items-center justify-between cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-[#0C4DA2]" />
                          <span>Open Supervisor Profile</span>
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </Link>
                    )}

                    <button
                      onClick={() => router.push(myResearchProfile?.activeCollabId ? `/nexus?collab=${myResearchProfile.activeCollabId}` : '/nexus')}
                      className="w-full p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Network className="w-3.5 h-3.5 text-[#0C4DA2]" />
                        <span>Open Nexus Workspace</span>
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </>
        )}
      </div>

      {/* ─── EDIT PROFILE MODAL DRAWER ─── */}
      <AnimatePresence>
        {isEditProfileOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditProfileOpen(false)}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs cursor-pointer"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-xl z-10 overflow-hidden text-left p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Edit Research Profile & Topic
                </h3>
                <button onClick={() => setIsEditProfileOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4 text-xs font-bold text-slate-700">
                <div>
                  <label className="block mb-1 font-extrabold text-slate-900">Thesis Topic / Title</label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0C4DA2]"
                  />
                </div>

                <div>
                  <label className="block mb-1 font-extrabold text-slate-900">Research Domain / Area</label>
                  <input
                    type="text"
                    required
                    value={editArea}
                    onChange={(e) => setEditArea(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0C4DA2]"
                  />
                </div>

                <div>
                  <label className="block mb-1 font-extrabold text-slate-900">Abstract Summary</label>
                  <textarea
                    rows={3}
                    value={editAbstract}
                    onChange={(e) => setEditAbstract(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0C4DA2] leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1 font-extrabold text-slate-900">Research Stage</label>
                    <select
                      value={editStage}
                      onChange={(e) => setEditStage(e.target.value as ResearchStage)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0C4DA2]"
                    >
                      {STAGES.map((s) => (
                        <option key={s.key} value={s.key}>{s.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1 font-extrabold text-slate-900">Overall Status</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as ResearchStatus)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0C4DA2]"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="ON_HOLD">ON HOLD</option>
                      <option value="COMPLETED">COMPLETED</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1 font-extrabold text-slate-900">Start Date</label>
                    <input
                      type="date"
                      value={editStartDate}
                      onChange={(e) => setEditStartDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0C4DA2]"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 font-extrabold text-slate-900">Target Completion</label>
                    <input
                      type="date"
                      value={editCompletionDate}
                      onChange={(e) => setEditCompletionDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0C4DA2]"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsEditProfileOpen(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-[#0C4DA2] hover:bg-blue-800 text-white rounded-xl font-bold cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── ADD MILESTONE MODAL DRAWER ─── */}
      <AnimatePresence>
        {isAddMilestoneOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddMilestoneOpen(false)}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs cursor-pointer"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-xl z-10 overflow-hidden text-left p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Add Research Milestone
                </h3>
                <button onClick={() => setIsAddMilestoneOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateMilestoneSubmit} className="space-y-4 text-xs font-bold text-slate-700">
                <div>
                  <label className="block mb-1 font-extrabold text-slate-900">Milestone Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Literature Survey Chapter 2 Draft Submission"
                    value={mTitle}
                    onChange={(e) => setMTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0C4DA2]"
                  />
                </div>

                <div>
                  <label className="block mb-1 font-extrabold text-slate-900">Description / Key Deliverables</label>
                  <textarea
                    rows={2}
                    placeholder="Provide details on target outcomes or requirements..."
                    value={mDesc}
                    onChange={(e) => setMDesc(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0C4DA2]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1 font-extrabold text-slate-900">Target Stage</label>
                    <select
                      value={mStage}
                      onChange={(e) => setMStage(e.target.value as ResearchStage)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0C4DA2]"
                    >
                      {STAGES.map((s) => (
                        <option key={s.key} value={s.key}>{s.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1 font-extrabold text-slate-900">Priority</label>
                    <select
                      value={mPriority}
                      onChange={(e) => setMPriority(e.target.value as MilestonePriority)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0C4DA2]"
                    >
                      <option value="LOW">LOW</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HIGH">HIGH</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block mb-1 font-extrabold text-slate-900">Due Date</label>
                  <input
                    type="date"
                    value={mDueDate}
                    onChange={(e) => setMDueDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0C4DA2]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddMilestoneOpen(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-[#0C4DA2] hover:bg-blue-800 text-white rounded-xl font-bold cursor-pointer"
                  >
                    Create Milestone
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
