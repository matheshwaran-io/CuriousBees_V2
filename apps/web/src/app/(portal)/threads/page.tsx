'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useStore } from '@/store/useStore';
import { 
  Search, 
  Plus, 
  MessageSquare, 
  Tag, 
  RefreshCcw, 
  X, 
  Heart, 
  Share2, 
  UserPlus, 
  Check, 
  Sparkles, 
  Paperclip, 
  Image as ImageIcon, 
  FileText, 
  Bookmark, 
  TrendingUp, 
  User, 
  Bell, 
  Settings, 
  ExternalLink,
  ChevronRight,
  Send,
  Loader2,
  Users,
  Grid,
  Calendar,
  MoreHorizontal
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardShell } from '@/components/shared/dashboard-shell';

// ─── TYPES & INTERFACES ──────────────────────────────────────────────────────

interface Thread {
  id: string;
  title: string;
  content: string;
  createdAt: string | Date;
  author?: {
    name: string | null;
    image: string | null;
    role: string;
    department: string | null;
  };
  tags: string[];
  commentsCount: number;
  likesCount: number;
  collaboratorsCount: number;
  badge?: string;
  isPaper?: boolean;
  paperInfo?: {
    journal: string;
    publisher?: string;
  };
  interestedCount?: number;
}

interface Peer {
  id: string;
  name: string;
  title: string;
  department: string;
  avatarColor: string;
  connected: 'connect' | 'pending' | 'connected';
  initials?: string;
}

// ─── INITIAL DATA SPECIFIED BY THE FIRST SCREENSHOT ──────────────────────────

const MOCK_PEERS: Peer[] = [
  { id: 'p1', name: 'Dr. Wei Chen', title: 'Bio-Engineering, ETH', department: 'Bio-Engineering', avatarColor: 'bg-emerald-600', connected: 'connect' },
];

const SCREENSHOT_THREADS: Thread[] = [
  {
    id: 't-sara',
    title: 'Multi-center study on Neural Plasticity in adult cognitive recovery',
    content: "Seeking collaborators for a multi-center study on 'Neural Plasticity' in adult cognitive recovery. We are specifically looking for researchers with experience in longitudinal fMRI data analysis and bayesian modeling.",
    createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 mins ago
    author: {
      name: 'Dr. Sara Rowe',
      image: null,
      role: 'RESEARCH_SUPERVISOR',
      department: 'Neuroscience @ Stanford University'
    },
    tags: ['Neuroscience', 'fMRI'],
    badge: 'COLLABORATION REQUEST',
    likesCount: 24,
    commentsCount: 8,
    collaboratorsCount: 3,
    interestedCount: 12
  },
  {
    id: 't-marcus',
    title: 'Lattice-Based Error Correction Protocols for Scalable Quantum Computation',
    content: 'Lattice-Based Error Correction Protocols for Scalable Quantum Computation',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    author: {
      name: 'Marcus Jensen',
      image: null,
      role: 'RESEARCH_SCHOLAR',
      department: 'MIT Lab'
    },
    tags: ['QuantumComputing', 'ErrorCorrection'],
    isPaper: true,
    paperInfo: {
      journal: 'NATURE QUANTUM'
    },
    likesCount: 142,
    commentsCount: 19,
    collaboratorsCount: 5,
    interestedCount: 0
  }
];

export default function ThreadsFeedPage() {
  const { threads, searchQuery, setSearchQuery, activeTag, setActiveTag, isLoading, fetchData, currentUser, createThread } = useStore();

  // State controls for input and local state overrides
  const [newPostContent, setNewPostContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<{name: string, size: string} | null>(null);

  // Local state overrides for interactive items
  const [likes, setLikes] = useState<Record<string, { count: number; liked: boolean }>>({});
  const [collaborating, setCollaborating] = useState<Record<string, boolean>>({});
  const [peers, setPeers] = useState<Peer[]>(MOCK_PEERS);

  // Sync data on mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Combine database threads with screenshot mock threads
  const getCombinedThreads = (): Thread[] => {
    const dbThreadsMapped: Thread[] = threads.map(t => {
      const isPaperType = t.title.toLowerCase().includes('paper') || t.content.toLowerCase().includes('publication');
      return {
        id: t.id,
        title: t.title,
        content: t.content,
        createdAt: t.createdAt,
        author: t.author ? {
          name: t.author.name,
          image: t.author.image,
          role: t.author.role,
          department: t.author.department
        } : {
          name: 'SRMIST Scholar',
          image: null,
          role: 'RESEARCH_SCHOLAR',
          department: 'Engineering'
        },
        tags: t.tags,
        commentsCount: t.comments?.length || t._count?.comments || 0,
        likesCount: 12,
        collaboratorsCount: 2,
        badge: t.author?.role === 'RESEARCH_SUPERVISOR' ? 'FACULTY ANNOUNCEMENT' : 'COLLABORATION REQUEST',
        isPaper: isPaperType,
        paperInfo: isPaperType ? { journal: 'SRMIST INTRANET' } : undefined,
        interestedCount: 4
      };
    });

    return [...SCREENSHOT_THREADS, ...dbThreadsMapped];
  };

  // Filter threads based on search query or activeTag
  const filteredThreads = getCombinedThreads().filter(t => {
    const matchesSearch = 
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      t.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.author?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTag = activeTag === '' || t.tags.includes(activeTag);
    return matchesSearch && matchesTag;
  });

  const getInitials = (name?: string | null) => {
    if (!name) return 'CB';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  // Trigger peer connection state changes
  const handleConnect = (peerId: string) => {
    setPeers(prev => prev.map(p => {
      if (p.id === peerId) {
        let newStatus: 'connect' | 'pending' | 'connected' = 'pending';
        if (p.connected === 'pending') newStatus = 'connected';
        else if (p.connected === 'connected') newStatus = 'connect';
        return { ...p, connected: newStatus };
      }
      return p;
    }));
  };

  // Handle compose update posting
  const handlePostUpdate = async () => {
    if (!newPostContent.trim()) return;
    setIsSubmitting(true);
    
    const contentText = newPostContent.trim();
    // Parse hashtags like #Neuroscience from the text input
    const hashTags = contentText.match(/#\w+/g)?.map(t => t.replace('#', '')) || ['Research'];
    const textWithoutTags = contentText.replace(/#\w+/g, '').trim();
    
    // Auto generate title
    const firstLine = textWithoutTags.split('\n')[0];
    const title = firstLine.length > 55 ? firstLine.substring(0, 55) + '...' : firstLine || 'Research Update';

    try {
      await createThread(title, contentText, hashTags);
      setNewPostContent('');
      setSelectedAttachment(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Like Action locally
  const toggleLike = (threadId: string, initialLikes: number) => {
    setLikes(prev => {
      const current = prev[threadId] || { count: initialLikes, liked: false };
      return {
        ...prev,
        [threadId]: {
          count: current.liked ? current.count - 1 : current.count + 1,
          liked: !current.liked
        }
      };
    });
  };

  // Toggle Collaborate Action locally
  const toggleCollaborate = (threadId: string) => {
    setCollaborating(prev => ({
      ...prev,
      [threadId]: !prev[threadId]
    }));
  };

  const getAvatarBg = (initials: string) => {
    const code = initials.charCodeAt(0) + (initials.charCodeAt(1) || 0);
    const colors = [
      'bg-indigo-600',
      'bg-emerald-600',
      'bg-rose-500',
      'bg-purple-600',
      'bg-amber-500',
      'bg-blue-600',
      'bg-teal-600',
      'bg-cyan-600'
    ];
    return colors[code % colors.length];
  };

  return (
    <DashboardShell className="min-h-screen bg-slate-50/30 select-none pb-12">
      
      {/* ─── TOP SEARCH BAR (FIRST SCREENSHOT SPECIFICATION) ────────────────────── */}
      <div className="w-full bg-white border border-[#e2e8f0] p-4 rounded-2xl shadow-sm text-left flex items-center justify-between gap-6 mb-2">
        <div className="relative w-full max-w-xl">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search publications, researchers, or grants..."
            className="w-full bg-slate-100/90 border-0 focus:bg-slate-100 hover:bg-slate-200/50 focus:ring-1 focus:ring-slate-300 text-slate-800 text-xs font-semibold placeholder-slate-450 pl-10 pr-9 py-2.5 rounded-full focus:outline-none transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-3 text-slate-455 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-4 text-slate-500 shrink-0">
          <button 
            onClick={() => fetchData()}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-550 hover:text-slate-800 transition-all flex items-center justify-center shrink-0 cursor-pointer"
            title="Sync Feed"
          >
            <RefreshCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button className="p-1.5 rounded-full hover:bg-slate-100 transition-all cursor-pointer relative">
            <Bell className="w-4 h-4 text-slate-500" />
          </button>
          <button className="p-1.5 rounded-full hover:bg-slate-100 transition-all cursor-pointer">
            <MessageSquare className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </div>

      {/* ─── TWO-COLUMN MAIN GRID ────────────────────────────────────────────── */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start relative">
        
        {/* LEFT/CENTER COLUMN: FEED & COMPOSE */}
        <div className="flex flex-col gap-6">
          
          {/* Compose update box */}
          <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-sm text-left flex flex-col gap-4">
            <div className="flex items-start gap-4">
              {currentUser?.image ? (
                <img src={currentUser.image} className="w-9 h-9 rounded-full object-cover border border-slate-200" alt="" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-[#004495]/5 border border-[#004495]/10 flex items-center justify-center font-display font-extrabold text-[#004495] text-xs shrink-0">
                  {getInitials(currentUser?.name)}
                </div>
              )}
              
              <div className="flex-1">
                <textarea
                  rows={2}
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="Share a research update, finding, or question..."
                  className="w-full resize-none border-0 focus:ring-0 text-slate-800 text-xs font-semibold placeholder-slate-400 p-1 focus:outline-none min-h-[42px] leading-relaxed"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3.5 border-t border-slate-100">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setSelectedAttachment({name: 'research_proposal.pdf', size: '1.4 MB'})}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-slate-100/80 text-slate-500 hover:text-[#004495] text-xs font-bold transition-all cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>PDF</span>
                </button>
                <button 
                  onClick={() => setSelectedAttachment({name: 'lab_results.png', size: '3.1 MB'})}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-slate-100/80 text-slate-500 hover:text-[#004495] text-xs font-bold transition-all cursor-pointer"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span>Media</span>
                </button>
              </div>

              <button
                onClick={handlePostUpdate}
                disabled={isSubmitting || !newPostContent.trim()}
                className="px-5 py-2 bg-[#004495] hover:bg-[#003370] text-white text-xs font-bold tracking-wide rounded-full flex items-center gap-1.5 transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : null}
                <span>Post</span>
              </button>
            </div>

            {selectedAttachment && (
              <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-655 font-bold self-start mt-1">
                <Paperclip className="w-3.5 h-3.5 text-slate-450" />
                <span>{selectedAttachment.name} ({selectedAttachment.size})</span>
                <button onClick={() => setSelectedAttachment(null)} className="text-slate-400 hover:text-red-500 transition-colors ml-1 cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* MAIN POSTS VIEW */}
          <div className="flex flex-col gap-6">
            <AnimatePresence mode="wait">
              {isLoading && filteredThreads.length === 0 ? (
                <div className="py-16 flex justify-center items-center text-slate-505">
                  <span className="w-6 h-6 border-2 border-primary border-t-transparent animate-spin rounded-full block" />
                </div>
              ) : filteredThreads.length === 0 ? (
                <div className="bg-white border border-slate-200 p-12 text-center rounded-2xl shadow-sm text-left">
                  <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-4" />
                  <h4 className="text-slate-900 font-bold text-sm text-center">No Matching Research Updates</h4>
                  <p className="text-slate-505 text-xs max-w-xs mx-auto mt-2 leading-relaxed font-semibold text-center">
                    We couldn't find any threads matching your parameters. Be the first to start a collaborative discussion!
                  </p>
                </div>
              ) : (
                filteredThreads.map((thread) => {
                  const likeState = likes[thread.id] || { count: thread.likesCount, liked: false };
                  const isCollab = collaborating[thread.id];
                  const initials = getInitials(thread.author?.name);
                  
                  return (
                    <motion.div
                      key={thread.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      className="bg-white border border-slate-200/90 p-5 md:p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 text-left relative overflow-hidden"
                    >
                      {/* Header: Author info, Affiliate, Time & Badge */}
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                          {thread.author?.image ? (
                            <img src={thread.author.image} className="w-10 h-10 rounded-full object-cover border border-slate-200" alt="" />
                          ) : (
                            <div className={`w-10 h-10 rounded-full ${getAvatarBg(initials)} flex items-center justify-center font-display font-extrabold text-white text-sm shrink-0 border border-slate-100`}>
                              {initials}
                            </div>
                          )}
                          
                          <div className="font-sans">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                              <span className="text-xs font-extrabold text-slate-900 leading-none">
                                {thread.author?.name || 'Academic Scholar'}
                              </span>
                              {thread.badge && (
                                <span className="bg-sky-50 border border-sky-100 text-[#004495] text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full leading-none shrink-0 flex items-center gap-1 select-none">
                                  <Sparkles className="w-2.5 h-2.5 text-[#004495]" />
                                  {thread.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 font-extrabold uppercase mt-1 leading-none">
                              {thread.author?.department || 'SRMIST'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center text-slate-450 hover:text-slate-650 transition-colors p-1 cursor-pointer">
                          <MoreHorizontal className="w-4 h-4" />
                        </div>
                      </div>

                      {/* Content Card Body */}
                      <div className="mb-4 font-sans font-medium text-xs leading-relaxed text-slate-700">
                        {thread.isPaper ? (
                          // Nested Document Card View matching Marcus Jensen's Post
                          <div className="space-y-3">
                            <p className="text-slate-505 font-bold">
                              {thread.author?.name} published a new paper <span className="font-medium text-slate-400 text-[10px] ml-1.5">{typeof thread.createdAt === 'string' ? 'Active' : thread.createdAt.toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</span>
                            </p>
                            
                            <div className="bg-[#f8fafc] border border-slate-100 rounded-xl p-4 flex items-start gap-4">
                              <div className="w-10 h-10 rounded-lg bg-white border border-slate-200/70 flex items-center justify-center text-slate-400 shrink-0">
                                <FileText className="w-5.5 h-5.5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-4 mb-1">
                                  <span className="bg-slate-200/60 border border-slate-250 text-slate-655 text-[8.5px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded leading-none">
                                    {thread.paperInfo?.journal || 'NATURE QUANTUM'}
                                  </span>
                                </div>
                                <h4 className="text-xs font-bold text-slate-900 leading-snug">
                                  {thread.title}
                                </h4>
                              </div>
                            </div>
                          </div>
                        ) : (
                          // Standard Text Post View matching Dr. Sara Rowe's Post
                          <p className="whitespace-pre-wrap">{thread.content}</p>
                        )}
                      </div>

                      {/* Hashtags */}
                      {thread.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-5">
                          {thread.tags.map((tag) => (
                            <button
                              key={tag}
                              onClick={() => {
                                setSearchQuery(tag);
                              }}
                              className="text-[#004495]/90 hover:text-[#004495] text-[10px] font-extrabold tracking-wider transition-colors mr-2.5"
                            >
                              #{tag}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Bottom Action buttons */}
                      <div className="flex flex-wrap items-center justify-between border-t border-slate-100 pt-4 mt-2 gap-3">
                        <div className="flex items-center gap-4">
                          <button 
                            onClick={() => toggleLike(thread.id, thread.likesCount)}
                            className={`flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                              likeState.liked ? 'text-rose-600' : 'text-slate-450 hover:text-slate-700'
                            }`}
                          >
                            <Heart className={`w-3.5 h-3.5 ${likeState.liked ? 'fill-rose-600 text-rose-600' : ''}`} />
                            <span>Like ({likeState.count})</span>
                          </button>

                          <Link 
                            href={`/threads/${thread.id}`}
                            className="flex items-center gap-1.5 text-xs font-bold text-slate-450 hover:text-slate-700 transition-all cursor-pointer"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Comment</span>
                          </Link>

                          <button 
                            onClick={() => toggleCollaborate(thread.id)}
                            className={`flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                              isCollab ? 'text-[#004495]' : 'text-slate-450 hover:text-[#004495]'
                            }`}
                          >
                            <Users className="w-3.5 h-3.5" />
                            <span>Collaborate</span>
                          </button>
                        </div>

                        {/* Overlapping Interested Avatar Bubbles & count */}
                        {thread.interestedCount && thread.interestedCount > 0 ? (
                          <div className="flex items-center gap-2">
                            <div className="flex -space-x-1.5 overflow-hidden">
                              <div className="inline-block h-5.5 w-5.5 rounded-full ring-2 ring-white bg-slate-200 overflow-hidden">
                                <div className="w-full h-full bg-pink-500 text-white font-extrabold text-[8px] flex items-center justify-center">SR</div>
                              </div>
                              <div className="inline-block h-5.5 w-5.5 rounded-full ring-2 ring-white bg-slate-200 overflow-hidden">
                                <div className="w-full h-full bg-indigo-500 text-white font-extrabold text-[8px] flex items-center justify-center">MJ</div>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                              {thread.interestedCount} interested
                            </span>
                          </div>
                        ) : null}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>

        </div>

        {/* RIGHT COLUMN SIDEBAR - SPECIFIED BY THE FIRST SCREENSHOT */}
        <div className="hidden lg:flex flex-col gap-6 w-full shrink-0 select-none text-left sticky top-6">
          
          {/* SUGGESTED PEERS */}
          <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100/80">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                SUGGESTED PEERS
              </span>
              <Link
                href="/researchers"
                className="text-[9px] font-extrabold uppercase text-[#004495] hover:text-[#003370] transition-colors"
              >
                View All
              </Link>
            </div>

            <div className="flex flex-col gap-3.5">
              {peers.map((peer) => (
                <div key={peer.id} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full ${peer.avatarColor} flex items-center justify-center font-display font-extrabold text-white text-[10px] shrink-0 border border-slate-200/20`}>
                      {peer.initials || getInitials(peer.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate leading-tight">{peer.name}</p>
                      <p className="text-[9px] text-slate-455 font-bold uppercase mt-0.5 truncate">{peer.title}</p>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleConnect(peer.id)}
                    className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all duration-200 shrink-0 cursor-pointer ${
                      peer.connected === 'connected'
                        ? 'bg-emerald-50 border border-emerald-250 text-emerald-700 hover:bg-emerald-100/50'
                        : peer.connected === 'pending'
                        ? 'bg-amber-50 border border-amber-250 text-amber-700 animate-pulse'
                        : 'bg-white border border-[#004495]/20 hover:border-[#004495]/40 text-[#004495] hover:bg-[#004495]/5'
                    }`}
                  >
                    {peer.connected === 'connected' ? 'Connected' : peer.connected === 'pending' ? 'Pending' : 'Connect'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Domains / Trending Research */}
          <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-sm flex flex-col gap-4">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-100/80">
              Trending Research
            </span>

            <div className="flex flex-col gap-4">
              <div>
                <button 
                  onClick={() => setSearchQuery('AIINMEDICINE')}
                  className="text-xs font-bold text-slate-800 hover:text-[#004495] transition-colors leading-none block"
                >
                  #AIINMEDICINE
                </button>
                <p className="text-[10px] text-slate-455 font-semibold mt-1">Diagnostic Transformers</p>
                <p className="text-[9px] text-slate-400 font-semibold mt-0.5">2.4k papers this week</p>
              </div>

              <div>
                <button 
                  onClick={() => setSearchQuery('CLIMATETECH')}
                  className="text-xs font-bold text-slate-800 hover:text-[#004495] transition-colors leading-none block"
                >
                  #CLIMATETECH
                </button>
                <p className="text-[10px] text-slate-455 font-semibold mt-1">Direct Air Capture Models</p>
              </div>
            </div>

            <button 
              onClick={() => setSearchQuery('Research')}
              className="w-full mt-2 py-2 border border-slate-200/80 hover:border-slate-355 bg-white hover:bg-slate-50 text-slate-700 text-[10px] font-bold uppercase tracking-wider rounded-full transition-all cursor-pointer active:scale-98"
            >
              Explore All Topics
            </button>
          </div>

          {/* Upcoming Events */}
          <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-sm flex flex-col gap-4">
            <span className="text-[10px] font-extrabold text-slate-405 uppercase tracking-wider pb-2 border-b border-slate-100/80">
              Upcoming Events
            </span>

            <div className="flex items-start gap-3 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 p-2.5 rounded-xl transition-all cursor-pointer">
              <div className="w-10 bg-white border border-slate-200 rounded-lg py-1.5 flex flex-col items-center justify-center shrink-0">
                <span className="text-[8px] font-extrabold text-slate-400 uppercase leading-none tracking-wide">AUG</span>
                <span className="text-xs font-extrabold text-slate-800 leading-none mt-1">15</span>
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-slate-900 leading-snug truncate">Global AI Safety Summit</h4>
                <p className="text-[10px] text-slate-455 font-semibold mt-0.5 truncate">Virtual · 2.1k attending</p>
              </div>
            </div>
          </div>

          {/* Footer links */}
          <div className="px-2 pt-2 text-[10px] font-bold text-slate-400 uppercase tracking-wide space-y-1.5">
            <div className="flex items-center gap-3">
              <Link href="/about" className="hover:text-slate-600 transition-colors">About</Link>
              <Link href="/help" className="hover:text-slate-600 transition-colors">Help Center</Link>
              <Link href="/privacy-policy" className="hover:text-slate-600 transition-colors">Privacy</Link>
            </div>
            <p className="text-[9px] font-semibold text-slate-400 leading-none mt-1 lowercase select-none">
              © 2025 CuriousBees Academic Inc.
            </p>
          </div>

        </div>

      </div>

      {/* Floating Action Button (FAB) at Bottom Right */}
      <Link 
        href="/threads/create"
        className="fixed bottom-6 right-6 w-12 h-12 bg-[#004495] hover:bg-[#003370] text-white flex items-center justify-center rounded-full shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 group cursor-pointer z-50 border border-[#004495]/20"
        title="New Proposal"
      >
        <Plus className="w-5 h-5 text-white group-hover:scale-105 transition-transform" />
      </Link>

    </DashboardShell>
  );
}
