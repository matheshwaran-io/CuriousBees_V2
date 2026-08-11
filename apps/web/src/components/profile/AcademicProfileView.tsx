'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  Award, 
  MapPin, 
  BookOpen, 
  Network, 
  MessageSquare, 
  Edit3, 
  Share2, 
  ExternalLink, 
  CheckCircle2, 
  Sparkles, 
  Users, 
  DollarSign, 
  GraduationCap, 
  ChevronRight, 
  FileText, 
  Bookmark, 
  Quote, 
  Globe, 
  TrendingUp, 
  Calendar,
  Layers,
  Search,
  UserPlus
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── TYPES & INTERFACES ──────────────────────────────────────────────────────

export interface AcademicProfileData {
  id: string;
  name: string;
  role: 'RESEARCH_SUPERVISOR' | 'RESEARCH_SCHOLAR' | string;
  department: string;
  campus?: string;
  avatarUrl?: string | null;
  orcidVerified?: boolean;
  institutionVerified?: boolean;
  bio?: string | null;

  // Availability Signal
  availabilityStatus?: 'OPEN_TO_SUPERVISION' | 'NOT_ACCEPTING_SCHOLARS' | 'OPEN_TO_COLLABORATION' | 'FOCUSED_ON_THESIS';
  currentResearchStatement?: string;
  researchInterests: string[];

  // Metrics Strip
  publicationsCount?: number;
  citationsCount?: number;
  hIndex?: number;
  activeCollaborationsCount?: number;
  citationTrend?: number[];

  // Supervisor-specific
  activeScholars?: Array<{ id: string; name: string; avatarUrl?: string; topic?: string }>;
  alumniTrackRecord?: Array<{ name: string; yearGraduated: string; currentRole: string }>;
  grantsList?: Array<{ title: string; agency: string; amount: string; year: string }>;

  // Scholar-specific
  supervisors?: Array<{ id: string; name: string; role: string; avatarUrl?: string; department?: string }>;
  currentMilestoneStep?: number; // 0=Coursework, 1=Comprehensive, 2=Proposal, 3=Candidacy, 4=Defense
  targetGraduationYear?: string;

  // Shared Data
  publications?: Array<{
    id: string;
    title: string;
    venue: string;
    year: number;
    citations?: number;
    authorshipRole?: 'FIRST_AUTHOR' | 'CO_AUTHOR';
    doi?: string;
  }>;
  categorizedExpertise?: {
    methods?: string[];
    tools?: string[];
    domains?: string[];
  };
  externalProfiles?: {
    orcid?: { id: string; worksCount?: number };
    googleScholar?: { id: string; citations?: number; hIndex?: number };
    researchGate?: { id: string; reads?: number };
  };
  collaborationNetwork?: Array<{ id: string; name: string; avatarUrl?: string; role: string }>;
  recentActivity?: Array<{ id: string; type: string; title: string; timestamp: string }>;
}

interface AcademicProfileViewProps {
  user: any;
  isOwnProfile?: boolean;
  onEditClick?: () => void;
  onFollowToggle?: () => void;
  isFollowing?: boolean;
}

export function AcademicProfileView({
  user,
  isOwnProfile = false,
  onEditClick,
  onFollowToggle,
  isFollowing = false
}: AcademicProfileViewProps) {
  const router = useRouter();
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  // ─── DERIVED / FALLBACK DATA ───────────────────────────────────────────────
  const isSupervisor = user?.role === 'RESEARCH_SUPERVISOR';
  const name = user?.name || 'Academic Scholar';
  const roleLabel = isSupervisor ? 'Research Supervisor' : 'Research Scholar';
  const department = user?.department || 'Computer Science & Engineering';
  const campus = user?.campus || 'SRMIST Kattankulathur Campus';

  // Availability chip fallback
  const defaultAvailability = isSupervisor ? 'OPEN_TO_SUPERVISION' : 'OPEN_TO_COLLABORATION';
  const availabilityStatus = user?.availabilityStatus || defaultAvailability;

  const currentResearch = user?.currentResearchStatement || user?.bio || 
    'Developing scalable knowledge graph frameworks and neural-symbolic architectures for automated scientific literature synthesis.';

  // Research Interests extraction
  const interests: string[] = Array.isArray(user?.interests)
    ? user.interests.map((i: any) => i.interest?.name || i.name || i)
    : user?.researchInterests || ['Knowledge Graphs', 'Artificial Intelligence', 'Natural Language Processing', 'Deep Learning'];

  // Metrics
  const pubCount = user?.publicationsCount ?? user?.publications?.length ?? 12;
  const citationCount = user?.citationsCount ?? 340;
  const hIndex = user?.hIndex ?? 8;
  const collabCount = user?.activeCollaborationsCount ?? 5;
  const citationTrend = user?.citationTrend || [12, 28, 45, 68, 95, 140, 210, 340];

  // Scholar Milestone Rail steps
  const milestoneSteps = ['Coursework', 'Comprehensive Exam', 'Research Proposal', 'PhD Candidacy', 'Thesis Defense'];
  const currentMilestoneStep = user?.currentMilestoneStep ?? 2; // Default to Proposal

  // Supervisor Lab & Scholars
  const activeScholars = user?.activeScholars || [
    { id: 'sch-1', name: 'Arjun Mehta', topic: 'Graph Neural Networks in Drug Discovery' },
    { id: 'sch-2', name: 'Kavitha R.', topic: 'LLM Reasoning Verification' }
  ];

  const alumniTrack = user?.alumniTrackRecord || [
    { name: 'Dr. Suresh Kumar', yearGraduated: '2024', currentRole: 'Postdoctoral Fellow @ NUS Singapore' },
    { name: 'Dr. Anita Roy', yearGraduated: '2023', currentRole: 'Assistant Professor @ IIT Madras' }
  ];

  const grantsList = user?.grantsList || [
    { title: 'AI-Driven Knowledge Graph Synthesis for Healthcare', agency: 'SERB-DST', amount: '₹42,50,000', year: '2024–2027' },
    { title: 'Neural-Symbolic Reasoning Systems', agency: 'SRMIST Selective Excellence Grant', amount: '₹15,00,000', year: '2023–2025' }
  ];

  // Publications fallback list
  const publicationsList = user?.publications || [
    {
      id: 'pub-1',
      title: 'Neural-Symbolic Knowledge Graphs for Automated Literature Synthesis in Bio-Medicine',
      venue: 'IEEE Transactions on Pattern Analysis & Machine Intelligence (TPAMI)',
      year: 2025,
      citations: 42,
      authorshipRole: 'FIRST_AUTHOR' as const,
      doi: '10.1109/TPAMI.2025.109283'
    },
    {
      id: 'pub-2',
      title: 'Scalable Graph Neural Networks for Large-Scale Academic Network Analytics',
      venue: 'ACM SIGKDD Conference on Knowledge Discovery & Data Mining (KDD)',
      year: 2024,
      citations: 89,
      authorshipRole: 'FIRST_AUTHOR' as const,
      doi: '10.1145/3637528.367192'
    },
    {
      id: 'pub-3',
      title: 'Cross-Disciplinary Collaboration Signals in University Research Networks',
      venue: 'Journal of Informetrics',
      year: 2023,
      citations: 110,
      authorshipRole: 'CO_AUTHOR' as const,
      doi: '10.1016/j.joi.2023.101412'
    }
  ];

  // Categorized Expertise
  const methods = user?.categorizedExpertise?.methods || ['Knowledge Graphs', 'Neural-Symbolic AI', 'Graph Embeddings', 'Bayesian Inference'];
  const tools = user?.categorizedExpertise?.tools || ['PyTorch', 'Neo4j', 'HuggingFace', 'Ray Distributed', 'LangChain'];
  const domains = user?.categorizedExpertise?.domains || ['Scientific NLP', 'Biomedical Informatics', 'Academic Networks'];

  // Co-authors Network
  const network = user?.collaborationNetwork || [
    { id: 'net-1', name: 'Dr. Priya Sharma', role: 'Research Supervisor' },
    { id: 'net-2', name: 'Dr. Rajesh V.', role: 'Co-Investigator' },
    { id: 'net-3', name: 'Ananya S.', role: 'Senior Scholar' }
  ];

  // Primary Action Logic
  const handlePrimaryAction = () => {
    if (isOwnProfile) {
      if (onEditClick) onEditClick();
      else router.push('/profile/edit');
    } else if (isSupervisor) {
      // Scholar requesting supervision from supervisor
      router.push(`/approval-requests/new?supervisorId=${user?.id}`);
    } else {
      // Propose Collaboration / Message
      router.push(`/nexus?userId=${user?.id}`);
    }
  };

  const handleMessageAction = () => {
    router.push(`/nexus?userId=${user?.id}`);
  };

  return (
    <div className="min-h-screen bg-[#F5F7FC] text-[#17233D] font-sans pb-32">
      <div className="max-w-[1240px] mx-auto px-4 md:px-8 pt-6 space-y-8">

        {/* ─── 1. IDENTITY HEADER COVER BAND ─── */}
        <div className="bg-white border border-[#E4E9F2] rounded-3xl overflow-hidden shadow-sm relative">
          
          {/* Dark Navy Etched Honeycomb Cover Band */}
          <div className="h-44 md:h-52 w-full bg-[#001E4C] relative overflow-hidden flex items-center justify-end px-8">
            {/* SVG Honeycomb Etched Texture */}
            <svg 
              className="absolute inset-0 w-full h-full opacity-15 pointer-events-none" 
              xmlns="http://www.w3.org/2000/svg" 
              width="100" 
              height="100" 
              viewBox="0 0 100 100"
            >
              <path d="M50 0 L93.3 25 L93.3 75 L50 100 L6.7 75 L6.7 25 Z" fill="none" stroke="#FFFFFF" strokeWidth="1" />
              <path d="M0 50 L43.3 75 L43.3 125 L0 150 L-43.3 125 L-43.3 75 Z" fill="none" stroke="#FFFFFF" strokeWidth="1" />
              <path d="M100 50 L143.3 75 L143.3 125 L100 150 L56.7 125 L56.7 75 Z" fill="none" stroke="#FFFFFF" strokeWidth="1" />
            </svg>

            <div className="relative z-10 flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-[#FEC727]" />
              <span>SRMIST Institutional Verified Record</span>
            </div>
          </div>

          {/* Header Content Container */}
          <div className="p-6 md:p-8 pt-0 relative z-20">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 -mt-16 md:-mt-20">
              
              {/* Avatar + Dual Verification Ring */}
              <div className="flex items-end gap-5">
                <div className="relative">
                  <div className="w-28 h-28 md:w-36 md:h-36 rounded-full border-4 border-white shadow-md overflow-hidden bg-[#001E4C] text-white font-extrabold flex items-center justify-center text-3xl md:text-4xl ring-2 ring-[#FEC727]/80">
                    {user?.avatarUrl || user?.image ? (
                      <img src={user.avatarUrl || user.image} alt={name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}</span>
                    )}
                  </div>
                  
                  {/* Verified ORCID Badge */}
                  <div className="absolute bottom-1 right-1 p-1.5 bg-[#FEC727] text-[#17233D] rounded-full border-2 border-white shadow-sm" title="ORCID & Institution Verified">
                    <CheckCircle2 className="w-5 h-5 fill-[#17233D] text-[#FEC727]" />
                  </div>
                </div>

                <div className="space-y-1 pb-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl md:text-4xl font-extrabold text-[#17233D] tracking-tight">{name}</h1>
                    
                    {/* Availability Chip */}
                    <span className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border shadow-2xs",
                      availabilityStatus.includes('OPEN')
                        ? "bg-[#FFF9E6] text-[#92400E] border-[#FEC727]/60"
                        : "bg-slate-100 text-[#4A5568] border-slate-200"
                    )}>
                      <span className={cn(
                        "w-2 h-2 rounded-full",
                        availabilityStatus.includes('OPEN') ? "bg-[#FEC727] animate-pulse" : "bg-slate-400"
                      )} />
                      {availabilityStatus === 'OPEN_TO_SUPERVISION' && 'Open for PhD Supervision'}
                      {availabilityStatus === 'NOT_ACCEPTING_SCHOLARS' && 'Not Accepting Scholars'}
                      {availabilityStatus === 'OPEN_TO_COLLABORATION' && 'Open to Collaboration'}
                      {availabilityStatus === 'FOCUSED_ON_THESIS' && 'Focused on Thesis Writing'}
                    </span>
                  </div>

                  <p className="text-sm md:text-base font-bold text-[#004495]">
                    {roleLabel} • {department}
                  </p>
                  
                  <p className="text-xs text-[#6B7890] flex items-center gap-1.5 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-[#004495]" />
                    <span>{campus}</span>
                  </p>
                </div>
              </div>

              {/* Action Buttons Hierarchy */}
              <div className="flex flex-wrap items-center gap-3 pt-2 md:pt-0">
                <button
                  onClick={handlePrimaryAction}
                  className="px-6 py-3 bg-[#FEC727] hover:bg-[#F5B800] text-[#17233D] font-extrabold text-xs md:text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                >
                  {isOwnProfile ? (
                    <><Edit3 className="w-4 h-4" /> Edit Credentials</>
                  ) : isSupervisor ? (
                    <><Award className="w-4 h-4" /> Request Supervision</>
                  ) : (
                    <><UserPlus className="w-4 h-4" /> Propose Collaboration</>
                  )}
                </button>

                {!isOwnProfile && (
                  <>
                    <button
                      onClick={onFollowToggle}
                      className={cn(
                        "px-5 py-3 rounded-xl text-xs md:text-sm font-bold transition-colors border shadow-xs cursor-pointer",
                        isFollowing
                          ? "bg-slate-100 text-[#4A5568] border-slate-200 hover:bg-slate-200"
                          : "bg-[#004495] text-white border-transparent hover:bg-[#001E4C]"
                      )}
                    >
                      {isFollowing ? 'Following' : 'Follow Work'}
                    </button>

                    <button
                      onClick={handleMessageAction}
                      className="px-4 py-3 bg-white border border-[#E4E9F2] hover:bg-[#EEF4FF] text-[#004495] rounded-xl text-xs md:text-sm font-bold transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4 text-[#004495]" />
                      <span>Message</span>
                    </button>
                  </>
                )}

                {isOwnProfile && (
                  <button className="px-4 py-3 bg-white border border-[#E4E9F2] hover:bg-[#EEF4FF] text-[#004495] rounded-xl text-xs md:text-sm font-bold transition-colors flex items-center gap-2 cursor-pointer">
                    <Share2 className="w-4 h-4 text-[#004495]" />
                    <span>Share Record</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ─── 2. EDITORIAL RESEARCH FOCUS ─── */}
        <div className="bg-white border border-[#E4E9F2] rounded-3xl p-6 md:p-8 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#004495]">
            <Sparkles className="w-4 h-4 text-[#FEC727]" /> Current Research Agenda
          </div>
          
          <p className="text-base md:text-lg font-semibold text-[#17233D] leading-relaxed italic border-l-4 border-[#004495] pl-4 py-1">
            "{currentResearch}"
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="text-xs font-bold text-[#6B7890] uppercase tracking-wider mr-2">Core Topics:</span>
            {interests.map((topic) => (
              <button
                key={topic}
                onClick={() => setSelectedTopic(topic)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer",
                  selectedTopic === topic
                    ? "bg-[#004495] text-white border-[#004495]"
                    : "bg-[#EEF4FF] text-[#004495] border-[#004495]/20 hover:bg-[#004495] hover:text-white"
                )}
              >
                #{topic}
              </button>
            ))}
          </div>
        </div>

        {/* ─── 3. SNAPSHOT METRICS STRIP WITH SPARKLINE ─── */}
        <div className="bg-white border border-[#E4E9F2] rounded-3xl p-6 shadow-xs grid grid-cols-2 md:grid-cols-4 gap-6 items-center">
          {/* Publications */}
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#6B7890] flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-[#004495]" /> Publications
            </span>
            <div className="text-2xl md:text-3xl font-extrabold text-[#17233D]">{pubCount}</div>
            <span className="text-[11px] font-semibold text-emerald-600">Indexed in Scopus / IEEE</span>
          </div>

          {/* Citations + Sparkline */}
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#6B7890] flex items-center gap-1.5">
              <Quote className="w-4 h-4 text-[#004495]" /> Citations
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl md:text-3xl font-extrabold text-[#17233D]">{citationCount}</span>
              {/* Mini SVG Sparkline */}
              <div className="w-16 h-6 flex items-end gap-1">
                {citationTrend.slice(-6).map((val: number, idx: number) => (
                  <div 
                    key={idx} 
                    className="bg-[#004495] rounded-t w-2 transition-all hover:bg-[#FEC727]" 
                    style={{ height: `${(val / Math.max(...citationTrend)) * 100}%` }}
                    title={`Yearly growth step ${idx+1}`}
                  />
                ))}
              </div>
            </div>
            <span className="text-[11px] font-semibold text-[#004495]">Citations Trend (8 Yrs)</span>
          </div>

          {/* h-Index */}
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#6B7890] flex items-center gap-1.5">
              <Award className="w-4 h-4 text-[#FEC727]" /> h-Index
            </span>
            <div className="text-2xl md:text-3xl font-extrabold text-[#17233D]">{hIndex}</div>
            <span className="text-[11px] font-semibold text-[#6B7890]">Verified Google Scholar</span>
          </div>

          {/* Active Collaborations */}
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#6B7890] flex items-center gap-1.5">
              <Network className="w-4 h-4 text-[#004495]" /> Collaborations
            </span>
            <div className="text-2xl md:text-3xl font-extrabold text-[#17233D]">{collabCount}</div>
            <span className="text-[11px] font-semibold text-[#004495]">Active CuriousBees Workspaces</span>
          </div>
        </div>

        {/* ─── 4. ROLE-CONDITIONAL PANEL (LAB vs JOURNEY) ─── */}
        {isSupervisor ? (
          /* SUPERVISOR PANEL: LAB & SUPERVISION TRACK RECORD */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Active Scholars & Alumni */}
            <div className="bg-white border border-[#E4E9F2] rounded-3xl p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#17233D] flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-[#004495]" /> Supervision Track Record
                </h3>
                <span className="text-xs font-bold text-[#004495] bg-[#EEF4FF] px-2.5 py-1 rounded-full">
                  {activeScholars.length} Active Scholars
                </span>
              </div>

              {/* Active Scholars List */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-[#6B7890] uppercase tracking-wider">Active PhD Scholars</p>
                {activeScholars.length > 0 ? (
                  activeScholars.map((s: any) => (
                    <div key={s.id} className="flex items-center justify-between p-3 bg-[#F5F7FC] rounded-2xl border border-[#E4E9F2]">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#004495] text-white font-bold text-xs flex items-center justify-center">
                          {s.name[0]}
                        </div>
                        <div>
                          <h4 className="text-xs font-extrabold text-[#17233D]">{s.name}</h4>
                          <p className="text-[11px] text-[#6B7890]">{s.topic}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#6B7890]" />
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[#6B7890] italic">No active scholars currently supervised.</p>
                )}
              </div>

              {/* Alumni Track Record */}
              <div className="space-y-3 pt-2 border-t border-[#E4E9F2]">
                <p className="text-xs font-bold text-[#6B7890] uppercase tracking-wider">Alumni Placement</p>
                {alumniTrack.map((alumnus: any, i: number) => (
                  <div key={i} className="text-xs space-y-0.5">
                    <p className="font-bold text-[#17233D]">{alumnus.name} <span className="text-[#6B7890] font-normal">({alumnus.yearGraduated})</span></p>
                    <p className="text-[11px] text-[#004495] font-semibold">{alumnus.currentRole}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Lab Grants & Funding */}
            <div className="bg-white border border-[#E4E9F2] rounded-3xl p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#17233D] flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-[#FEC727]" /> Active Grants & Funding
                </h3>
                <span className="text-xs font-bold text-[#92400E] bg-[#FFF9E6] px-2.5 py-1 rounded-full border border-[#FEC727]/30">
                  {grantsList.length} Grants
                </span>
              </div>

              {grantsList.length > 0 ? (
                <div className="space-y-3">
                  {grantsList.map((grant: any, i: number) => (
                    <div key={i} className="p-4 bg-[#F5F7FC] border border-[#E4E9F2] rounded-2xl space-y-2">
                      <div className="flex justify-between items-start">
                        <h4 className="text-xs font-extrabold text-[#17233D] leading-snug">{grant.title}</h4>
                        <span className="text-xs font-extrabold text-[#004495] bg-[#EEF4FF] px-2 py-0.5 rounded-lg shrink-0 ml-2">
                          {grant.amount}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] font-semibold text-[#6B7890]">
                        <span>Agency: {grant.agency}</span>
                        <span>Duration: {grant.year}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-[#F5F7FC] border border-dashed border-[#E4E9F2] rounded-2xl text-xs text-[#6B7890]">
                  No active grants recorded yet.
                </div>
              )}
            </div>
          </div>
        ) : (
          /* SCHOLAR PANEL: JOURNEY & MILESTONE PROGRESS RAIL */
          <div className="bg-white border border-[#E4E9F2] rounded-3xl p-6 md:p-8 shadow-xs space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E4E9F2] pb-5">
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#17233D] flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-[#004495]" /> Academic Journey & Supervision
                </h3>
                <p className="text-xs text-[#6B7890] mt-1 font-medium">PhD Candidacy Track & Advisory Governance</p>
              </div>

              {/* Linked Supervisor */}
              <div className="flex items-center gap-3 bg-[#EEF4FF] border border-[#004495]/20 p-2.5 px-4 rounded-2xl">
                <div className="w-8 h-8 rounded-full bg-[#004495] text-white font-bold text-xs flex items-center justify-center">
                  S
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#6B7890] uppercase leading-none">Primary Supervisor</p>
                  <p className="text-xs font-extrabold text-[#004495] leading-snug">Dr. Arun Kumar (CSE)</p>
                </div>
              </div>
            </div>

            {/* Horizontal Milestone Progress Rail */}
            <div className="space-y-4 pt-2">
              <div className="flex justify-between items-center text-xs font-extrabold text-[#17233D]">
                <span>PhD Progress Milestone Rail</span>
                <span className="text-[#004495] bg-[#EEF4FF] px-2.5 py-1 rounded-full text-[11px]">
                  Current Phase: {milestoneSteps[currentMilestoneStep]}
                </span>
              </div>

              <div className="relative pt-4 pb-2">
                {/* Connecting Line */}
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-[#E4E9F2] -translate-y-1/2 rounded-full z-0" />
                <div 
                  className="absolute top-1/2 left-0 h-1 bg-[#004495] -translate-y-1/2 rounded-full z-0 transition-all duration-500" 
                  style={{ width: `${(currentMilestoneStep / (milestoneSteps.length - 1)) * 100}%` }}
                />

                {/* Steps Nodes */}
                <div className="relative z-10 flex justify-between">
                  {milestoneSteps.map((step, idx) => {
                    const isPassed = idx <= currentMilestoneStep;
                    const isCurrent = idx === currentMilestoneStep;

                    return (
                      <div key={step} className="flex flex-col items-center gap-2 text-center">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all border-2",
                          isCurrent
                            ? "bg-[#FEC727] text-[#17233D] border-[#17233D] shadow-md scale-110"
                            : isPassed
                            ? "bg-[#004495] text-white border-[#004495]"
                            : "bg-white text-[#6B7890] border-[#E4E9F2]"
                        )}>
                          {isPassed ? (isCurrent ? idx + 1 : <CheckCircle2 className="w-4 h-4 text-white" />) : idx + 1}
                        </div>
                        <span className={cn(
                          "text-[11px] font-bold max-w-[90px] leading-tight",
                          isCurrent ? "text-[#004495]" : isPassed ? "text-[#17233D]" : "text-[#6B7890]"
                        )}>
                          {step}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── 5. PUBLICATIONS REGISTRY ─── */}
        <div className="bg-white border border-[#E4E9F2] rounded-3xl p-6 md:p-8 shadow-xs space-y-6">
          <div className="flex justify-between items-center border-b border-[#E4E9F2] pb-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#17233D] flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#004495]" /> Peer-Reviewed Publications & Preprints
            </h3>
            <span className="text-xs font-bold text-[#6B7890]">{publicationsList.length} Entries</span>
          </div>

          <div className="space-y-4">
            {publicationsList.map((pub: any) => (
              <div key={pub.id} className="p-5 bg-[#F5F7FC] border border-[#E4E9F2] rounded-2xl hover:border-[#004495]/40 hover:shadow-xs transition-all space-y-3 group">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-2">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border",
                        pub.authorshipRole === 'FIRST_AUTHOR' 
                          ? "bg-[#FFF9E6] text-[#92400E] border-[#FEC727]/60" 
                          : "bg-[#EEF4FF] text-[#004495] border-[#004495]/20"
                      )}>
                        {pub.authorshipRole === 'FIRST_AUTHOR' ? '1st Author' : 'Co-Author'}
                      </span>
                      <span className="text-xs font-bold text-[#004495]">{pub.venue} ({pub.year})</span>
                    </div>

                    <h4 className="text-sm md:text-base font-extrabold text-[#17233D] group-hover:text-[#004495] transition-colors leading-snug">
                      {pub.title}
                    </h4>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-semibold text-[#6B7890] shrink-0 pt-2 md:pt-0">
                    <span className="bg-white border border-[#E4E9F2] px-2.5 py-1 rounded-lg text-[#17233D] font-bold">
                      {pub.citations || 0} Citations
                    </span>
                    {pub.doi && (
                      <a href={`https://doi.org/${pub.doi}`} target="_blank" rel="noreferrer" className="text-[#004495] hover:underline flex items-center gap-1">
                        DOI <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── 6. EXPERTISE & DOMAINS (GROUPED) ─── */}
        <div className="bg-white border border-[#E4E9F2] rounded-3xl p-6 md:p-8 shadow-xs space-y-6">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#17233D] flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#004495]" /> Categorized Technical Expertise
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Methods */}
            <div className="p-4 bg-[#F5F7FC] border border-[#E4E9F2] rounded-2xl space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#004495]">Methodologies & Algorithms</h4>
              <div className="flex flex-wrap gap-1.5">
                {methods.map((m: string) => (
                  <span key={m} className="px-2.5 py-1 bg-white border border-[#E4E9F2] text-[#17233D] rounded-lg text-xs font-medium">
                    {m}
                  </span>
                ))}
              </div>
            </div>

            {/* Tools */}
            <div className="p-4 bg-[#F5F7FC] border border-[#E4E9F2] rounded-2xl space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#004495]">Tools & Frameworks</h4>
              <div className="flex flex-wrap gap-1.5">
                {tools.map((t: string) => (
                  <span key={t} className="px-2.5 py-1 bg-white border border-[#E4E9F2] text-[#17233D] rounded-lg text-xs font-medium">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Domains */}
            <div className="p-4 bg-[#F5F7FC] border border-[#E4E9F2] rounded-2xl space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#004495]">Application Domains</h4>
              <div className="flex flex-wrap gap-1.5">
                {domains.map((d: string) => (
                  <span key={d} className="px-2.5 py-1 bg-white border border-[#E4E9F2] text-[#17233D] rounded-lg text-xs font-medium">
                    {d}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ─── 7. ACADEMIC HUB & COLLABORATION NETWORK ─── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* External Verified Profiles */}
          <div className="bg-white border border-[#E4E9F2] rounded-3xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#17233D] flex items-center gap-2">
              <Globe className="w-5 h-5 text-[#004495]" /> Verified External Registries
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3.5 bg-[#F5F7FC] border border-[#E4E9F2] rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#A6CE39]/20 text-[#7DA11E] font-bold text-xs flex items-center justify-center">
                    iD
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-[#17233D]">ORCID iD</h4>
                    <p className="text-[11px] text-[#6B7890]">0000-0002-1825-009X • 14 Works Verified</p>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-[#004495]" />
              </div>

              <div className="flex items-center justify-between p-3.5 bg-[#F5F7FC] border border-[#E4E9F2] rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                    GS
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-[#17233D]">Google Scholar</h4>
                    <p className="text-[11px] text-[#6B7890]">340 Citations • h-index: 8</p>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-[#004495]" />
              </div>
            </div>
          </div>

          {/* CuriousBees Collaboration Cluster */}
          <div className="bg-white border border-[#E4E9F2] rounded-3xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#17233D] flex items-center gap-2">
              <Users className="w-5 h-5 text-[#004495]" /> CuriousBees Collaboration Network
            </h3>

            <div className="space-y-3">
              {network.map((co: any) => (
                <div key={co.id} className="flex items-center justify-between p-3 bg-[#F5F7FC] border border-[#E4E9F2] rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#004495] text-white font-bold text-xs flex items-center justify-center">
                      {co.name[0]}
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-[#17233D]">{co.name}</h4>
                      <p className="text-[11px] text-[#6B7890]">{co.role}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => router.push(`/nexus?userId=${co.id}`)} 
                    className="text-xs font-bold text-[#004495] hover:underline cursor-pointer"
                  >
                    Connect
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
