'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
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
  MoreHorizontal,
  BookOpen,
  Hash
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardShell } from '@/components/shared/dashboard-shell';
import { supabase, getStoragePublicUrl } from '@/lib/supabase';
import FeedComments from '@/components/feed/FeedComments';
import FeedFAB from '@/components/feed/FeedFAB';
import EditPostModal from '@/components/feed/EditPostModal';
import ReportPostModal from '@/components/feed/ReportPostModal';
import ConfirmDeleteModal from '@/components/feed/ConfirmDeleteModal';

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
    faculty?: string | null;
  };
  tags: string[];
  commentsCount: number;
  likesCount: number;
  collaboratorsCount: number;
  badge?: string;
  rawType?: string;
  isPaper?: boolean;
  paperInfo?: {
    journal: string;
    publisher?: string;
  };
  interestedCount?: number;
  attachments?: any[];
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

export default function ScholarFeedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentType = searchParams.get('type') || 'ALL';
  const urlSearch = searchParams.get('q') || '';

  const { 
    threads, feedCounts, searchQuery, setSearchQuery, activeTag, setActiveTag, 
    isLoading, fetchFeedThreads, fetchFeedCounts, currentUser, createThread,
    toggleLikeThread, requestThreadCollaboration, shareThread, reportThread, fetchSuggestedPeers, fetchTrendingResearch,
    toggleSaveThread, deleteThread, toggleSaveThreadLocally
  } = useStore();

  const [newPostContent, setNewPostContent] = useState('');
  const [postType, setPostType] = useState('RESEARCH_UPDATE');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<{name: string, size: string, url: string, type: string, rawSize: number, isPaper?: boolean} | null>(null);

  const [likes, setLikes] = useState<Record<string, { count: number; liked: boolean }>>({});
  const [collaborating, setCollaborating] = useState<Record<string, boolean>>({});
  const [peers, setPeers] = useState<Peer[]>([]);
  const [trendingTags, setTrendingTags] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState('Posts');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [openCommentsId, setOpenCommentsId] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<any | null>(null);
  const [reportingPost, setReportingPost] = useState<any | null>(null);
  const [deletingPost, setDeletingPost] = useState<any | null>(null);

  useEffect(() => {
    const savedDraft = localStorage.getItem('curiousbees_post_draft');
    if (savedDraft) setNewPostContent(savedDraft);
  }, []);

  useEffect(() => {
    localStorage.setItem('curiousbees_post_draft', newPostContent);
  }, [newPostContent]);

  useEffect(() => {
    // Initial fetch of other dependencies
    fetchSuggestedPeers().then(data => {
      setPeers(data.map(u => ({
        id: u.id,
        name: u.name || 'Scholar',
        title: u.department || 'Department',
        department: u.department || '',
        avatarColor: 'bg-[#0C4DA2]',
        connected: 'connect',
      })));
    });
    fetchTrendingResearch().then(tags => setTrendingTags(tags));
  }, [fetchSuggestedPeers, fetchTrendingResearch]);

  // Fetch threads and counts when URL params change
  useEffect(() => {
    fetchFeedThreads(urlSearch, currentType);
    fetchFeedCounts(urlSearch);
  }, [urlSearch, currentType, fetchFeedThreads, fetchFeedCounts]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (searchQuery) {
      params.set('q', searchQuery);
    } else {
      params.delete('q');
    }
    router.push(`?${params.toString()}`);
  };

  const handleTypeFilter = (type: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (type === 'ALL') {
      params.delete('type');
    } else {
      params.set('type', type);
    }
    router.push(`?${params.toString()}`);
  };

  // Combine database threads with screenshot mock threads
  const getCombinedThreads = (): Thread[] => {
    return threads.map(t => {
      return {
        id: t.id,
        title: t.title,
        content: t.content,
        createdAt: t.createdAt,
        author: t.author ? {
          name: t.author.name,
          image: t.author.image,
          role: t.author.role,
          department: t.author.department,
          faculty: (t.author as any).faculty
        } : undefined,
        authorId: (t as any).authorId,
        tags: t.tags,
        commentsCount: t.comments?.length || (t as any)._count?.comments || 0,
        likesCount: (t as any)._count?.likes || 0,
        collaboratorsCount: (t as any)._count?.shares || 0, // Fallback
        badge: (t as any).type ? (t as any).type.replace('_', ' ') : undefined,
        rawType: (t as any).type,
        isPaper: t.isPaper,
        paperInfo: t.isPaper ? { journal: t.paperJournal || 'NATURE QUANTUM' } : undefined,
        interestedCount: 0,
        attachments: (t as any).attachments
      };
    });
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

  const recentPublications = getCombinedThreads().filter(t => t.isPaper).slice(0, 3);

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

  // Handle File Upload to Supabase Storage
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const bucket = 'curiousbees-storage'; // Will fallback to public if not created
      
      const { data, error } = await supabase.storage.from(bucket).upload(fileName, file, { upsert: true });
      if (error) {
        console.error('Upload failed, ensure bucket exists and has correct RLS:', error);
        // Fallback for demo if bucket doesn't exist
        setSelectedAttachment({
          name: file.name,
          size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
          url: `https://dummy.url/${fileName}`,
          type: file.type.startsWith('image/') ? 'IMAGE' : file.type.startsWith('video/') ? 'VIDEO' : file.type === 'application/pdf' ? 'PDF' : 'DOCUMENT',
          rawSize: file.size
        });
        return;
      }
      
      const isPaper = e.target.id === 'paper-upload';
      const url = getStoragePublicUrl(bucket, fileName);
      setSelectedAttachment({
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        url: url,
        type: file.type.startsWith('image/') ? 'IMAGE' : file.type.startsWith('video/') ? 'VIDEO' : file.type === 'application/pdf' ? 'PDF' : 'DOCUMENT',
        rawSize: file.size,
        isPaper
      });
    } catch(err) {
      console.error(err);
    } finally {
      setIsUploading(false);
      e.target.value = ''; // Reset input
    }
  };

  const handleAddTag = () => {
    setNewPostContent(prev => prev + (prev.endsWith(' ') || prev.length === 0 ? '#' : ' #'));
  };

  const handlePostUpdate = async () => {
    if (!newPostContent.trim()) return;
    
    const contentText = newPostContent.trim();
    if (contentText.length < 10) {
      alert('Your update must be at least 10 characters long.');
      return;
    }

    setIsSubmitting(true);
    
    const hashTags = contentText.match(/#\w+/g)?.map(t => t.replace('#', '')) || ['Research'];
    const textWithoutTags = contentText.replace(/#\w+/g, '').trim();
    const firstLine = textWithoutTags.split('\n')[0];
    const title = firstLine.length > 55 ? firstLine.substring(0, 55) + '...' : (firstLine.length >= 5 ? firstLine : 'Research Update');

    try {
      await createThread(title, contentText, hashTags, {
        type: postType,
        isPaper: selectedAttachment?.isPaper || false,
        attachments: selectedAttachment ? [{
          name: selectedAttachment.name,
          url: selectedAttachment.url,
          size: selectedAttachment.rawSize,
          type: selectedAttachment.type
        }] : undefined
      });
      setNewPostContent('');
      localStorage.removeItem('curiousbees_post_draft');
      setSelectedAttachment(null);
    } catch (e: any) {
      console.error(e);
      alert(e.message || 'Failed to post update. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleLike = async (threadId: string, initialLikes: number) => {
    const currentState = likes[threadId] || { count: initialLikes, liked: false };
    // Optimistic UI update
    setLikes(prev => ({
      ...prev,
      [threadId]: { count: currentState.liked ? currentState.count - 1 : currentState.count + 1, liked: !currentState.liked }
    }));
    try {
      const res = await toggleLikeThread(threadId);
      // Sync with server state
      setLikes(prev => ({
        ...prev,
        [threadId]: { count: res.liked ? initialLikes + 1 : initialLikes, liked: res.liked }
      }));
    } catch (e) {
      // Revert on error
      setLikes(prev => ({ ...prev, [threadId]: currentState }));
    }
  };

  const toggleCollaborate = async (threadId: string) => {
    const currentState = collaborating[threadId];
    // Optimistic update
    setCollaborating(prev => ({ ...prev, [threadId]: !currentState }));
    try {
      if (!currentState) {
        await requestThreadCollaboration(threadId, 'I would like to collaborate on this research.');
      }
    } catch (e) {
      setCollaborating(prev => ({ ...prev, [threadId]: currentState }));
    }
  };

  const toggleSave = async (thread: any) => {
    try {
      const { saved } = await toggleSaveThread(thread.id);
      if (currentUser) {
        toggleSaveThreadLocally(thread.id, saved, currentUser.id);
      }
    } catch (e) { console.error(e); }
    setOpenMenuId(null);
  };

  const handleShare = async (threadId: string) => {
    try {
      const url = `${window.location.origin}/scholar/feed/${threadId}`;
      await navigator.clipboard.writeText(url);
      alert("Link copied to clipboard!");
      await shareThread(threadId); // track analytics
    } catch (e) {
      console.error(e);
    }
    setOpenMenuId(null);
  };

  const getAvatarBg = (initials: string) => {
    const code = initials.charCodeAt(0) + (initials.charCodeAt(1) || 0);
    const colors = [
      'bg-blue-600',
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
      
      {/* ─── TOP SEARCH BAR ────────────────────── */}
      <div className="w-full bg-white border border-[#e2e8f0] p-4 rounded-2xl shadow-sm text-left flex items-center justify-between gap-6 mb-2">
        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-xl">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search publications, researchers, or grants..."
            className="w-full bg-slate-100/90 border-0 focus:bg-slate-100 hover:bg-slate-200/50 focus:ring-1 focus:ring-slate-300 text-slate-800 text-xs font-semibold placeholder-slate-450 pl-10 pr-9 py-2.5 rounded-full focus:outline-none transition-all"
          />
          <button type="submit" className="absolute left-3.5 top-3 cursor-pointer group">
            <Search className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
          </button>
          {searchQuery && (
            <button 
              type="button"
              onClick={() => {
                setSearchQuery('');
                router.push(`?type=${currentType}`);
              }}
              className="absolute right-3.5 top-3 text-slate-450 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </form>

        <div className="flex items-center gap-4 text-slate-500 shrink-0">
          <button 
            onClick={() => {
              fetchFeedThreads(urlSearch, currentType);
              fetchFeedCounts(urlSearch);
            }}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-550 hover:text-slate-800 transition-all flex items-center justify-center shrink-0 cursor-pointer"
            title="Sync Feed"
          >
            <RefreshCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Pill Filters */}
      <div className="w-full flex flex-wrap items-center gap-2 mb-6">
        {[
          { label: 'All', value: 'ALL' },
          { label: 'Research Updates', value: 'RESEARCH_UPDATE' },
          { label: 'Publications', value: 'PUBLICATION' },
          { label: 'Questions', value: 'QUESTION' },
          { label: 'Collaboration Requests', value: 'COLLABORATION_REQUEST' },
          { label: 'Achievements', value: 'ACHIEVEMENT' },
          { label: 'Announcements', value: 'ANNOUNCEMENT' }
        ].map(filter => (
          <button
            key={filter.value}
            onClick={() => handleTypeFilter(filter.value)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              currentType === filter.value 
                ? 'bg-[#0C4DA2] text-white' 
                : 'bg-white border border-slate-200/90 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {filter.label} 
            <span className={`opacity-80 text-[10px] ${currentType === filter.value ? 'text-white' : 'text-slate-400'}`}>
              ({feedCounts[filter.value] || 0})
            </span>
          </button>
        ))}
      </div>

      {/* ─── TWO-COLUMN MAIN GRID ────────────────────────────────────────────── */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start relative">
        
        {/* LEFT/CENTER COLUMN: FEED & COMPOSE */}
        <div className="flex flex-col gap-8">
          
          {/* Compose update box */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/90 backdrop-blur-xl border border-white/60 p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow text-left flex flex-col gap-4 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#0C4DA2]/[0.02] to-transparent pointer-events-none" />
            
            <div className="flex items-start gap-4 relative z-10">
              {currentUser?.image ? (
                <img src={currentUser.image} className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-sm ring-2 ring-slate-50" alt="" />
              ) : (
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#0C4DA2] to-blue-600 flex items-center justify-center font-display font-extrabold text-white text-sm shrink-0 shadow-md border-2 border-white">
                  {getInitials(currentUser?.name)}
                </div>
              )}
              
              <div className="flex-1 bg-slate-50/50 hover:bg-slate-50/80 transition-colors rounded-2xl p-2 border border-slate-100 flex flex-col">
                <textarea
                  rows={2}
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="Share a research update, finding, or question..."
                  className="w-full bg-transparent resize-none border-0 focus:ring-0 text-slate-800 text-sm font-semibold placeholder-slate-400 p-2 focus:outline-none min-h-[48px] leading-relaxed"
                />
                <div className="flex justify-between items-center px-2 pb-1 pt-2 border-t border-slate-100/50">
                  <select
                    value={postType}
                    onChange={(e) => setPostType(e.target.value)}
                    className="bg-transparent text-xs font-bold text-slate-500 focus:outline-none focus:ring-0 cursor-pointer uppercase tracking-wider"
                  >
                    <option value="RESEARCH_UPDATE">Research Update</option>
                    <option value="PUBLICATION">Publication</option>
                    <option value="QUESTION">Question</option>
                    <option value="COLLABORATION_REQUEST">Collaboration Request</option>
                    <option value="ACHIEVEMENT">Achievement</option>
                    <option value="ANNOUNCEMENT">Announcement</option>
                  </select>
                  <span className={`text-[10px] font-bold ${newPostContent.length > 2500 ? 'text-rose-500' : 'text-slate-400'}`}>
                    {newPostContent.length} / 2500
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100/80 relative z-10 mt-2">
              <div className="flex items-center gap-1.5 md:gap-3">
                <input 
                  type="file" 
                  id="pdf-upload" 
                  className="hidden" 
                  accept=".pdf"
                  onChange={handleFileUpload} 
                />
                <label 
                  htmlFor="pdf-upload"
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-[#0C4DA2]/5 transition-all cursor-pointer border border-transparent hover:border-[#0C4DA2]/10 ${isUploading ? 'opacity-50 cursor-not-allowed' : 'text-slate-500 hover:text-[#0C4DA2] text-[11px] font-bold uppercase tracking-widest'}`}
                >
                  <FileText className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0C4DA2] transition-colors" />
                  <span>PDF</span>
                </label>

                <input 
                  type="file" 
                  id="photo-upload" 
                  className="hidden" 
                  accept="image/jpeg, image/png, image/webp"
                  onChange={handleFileUpload} 
                />
                <label 
                  htmlFor="photo-upload"
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-[#0C4DA2]/5 transition-all cursor-pointer border border-transparent hover:border-[#0C4DA2]/10 ${isUploading ? 'opacity-50 cursor-not-allowed' : 'text-slate-500 hover:text-[#0C4DA2] text-[11px] font-bold uppercase tracking-widest'}`}
                >
                  <ImageIcon className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0C4DA2] transition-colors" />
                  <span>Photo</span>
                </label>

                <input 
                  type="file" 
                  id="paper-upload" 
                  className="hidden" 
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileUpload} 
                />
                <label 
                  htmlFor="paper-upload"
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-[#0C4DA2]/5 transition-all cursor-pointer border border-transparent hover:border-[#0C4DA2]/10 ${isUploading ? 'opacity-50 cursor-not-allowed' : 'text-slate-500 hover:text-[#0C4DA2] text-[11px] font-bold uppercase tracking-widest'}`}
                >
                  <BookOpen className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0C4DA2] transition-colors" />
                  <span>Paper</span>
                </label>

                <button 
                  onClick={handleAddTag}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-[#0C4DA2]/5 transition-all cursor-pointer border border-transparent hover:border-[#0C4DA2]/10 text-slate-500 hover:text-[#0C4DA2] text-[11px] font-bold uppercase tracking-widest"
                >
                  <Hash className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0C4DA2] transition-colors" />
                  <span>Tag</span>
                </button>
              </div>

              <button
                onClick={handlePostUpdate}
                disabled={isSubmitting || !newPostContent.trim()}
                className="px-6 py-2.5 bg-gradient-to-r from-[#0C4DA2] to-blue-600 hover:from-[#042654] hover:to-blue-700 shadow-md hover:shadow-lg shadow-[#0C4DA2]/20 text-white text-xs font-black tracking-wide rounded-full flex items-center gap-2 transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : <Send className="w-3.5 h-3.5" />}
                <span>Post Update</span>
              </button>
            </div>

            {selectedAttachment && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-[#0C4DA2]/5 to-transparent border border-[#0C4DA2]/20 rounded-xl px-4 py-2 text-xs text-[#0C4DA2] font-bold self-start mt-2 relative z-10"
              >
                <Paperclip className="w-3.5 h-3.5" />
                <span>{selectedAttachment.name} ({selectedAttachment.size})</span>
                <button onClick={() => setSelectedAttachment(null)} className="text-[#0C4DA2]/50 hover:text-red-500 transition-colors ml-2 cursor-pointer p-1 hover:bg-red-50 rounded-full">
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )}
          </motion.div>

          {/* MAIN POSTS VIEW */}
          <div className="flex flex-col gap-6">
            <AnimatePresence mode="wait">
              {isLoading && filteredThreads.length === 0 ? (
                <div className="py-16 flex justify-center items-center text-slate-500">
                  <span className="w-6 h-6 border-2 border-primary border-t-transparent animate-spin rounded-full block" />
                </div>
              ) : filteredThreads.length === 0 ? (
                <div className="bg-white/50 backdrop-blur-md border border-white/60 p-16 text-center rounded-[32px] shadow-sm text-left flex flex-col items-center justify-center min-h-[300px]">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-6 shadow-inner text-slate-300">
                    <MessageSquare className="w-8 h-8" />
                  </div>
                  <h4 className="text-slate-800 font-black text-lg text-center tracking-tight">No Research Updates Found</h4>
                  <p className="text-slate-500 text-sm max-w-sm mx-auto mt-3 leading-relaxed font-semibold text-center">
                    We couldn't find any threads matching your parameters. Try exploring different tags or be the first to start a collaborative discussion!
                  </p>
                  <button 
                    onClick={() => {
                      setSearchQuery('');
                      setActiveTag('');
                    }}
                    className="mt-6 px-6 py-2 bg-[#0C4DA2]/10 text-[#0C4DA2] font-bold rounded-full text-xs hover:bg-[#0C4DA2]/20 transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              ) : (
                filteredThreads.map((thread) => {
                  const likeState = likes[thread.id] || { count: thread.likesCount, liked: false };
                  const isCollab = collaborating[thread.id];
                  const initials = getInitials(thread.author?.name);
                  
                  const getBadgeConfig = (type?: string) => {
                    switch(type) {
                      case 'RESEARCH_UPDATE': return { text: 'RESEARCH UPDATE', colors: 'from-blue-500/10 to-cyan-500/10 border-blue-500/20 text-blue-600' };
                      case 'PUBLICATION': return { text: 'PUBLICATION', colors: 'from-purple-500/10 to-fuchsia-500/10 border-purple-500/20 text-purple-600' };
                      case 'QUESTION': return { text: 'QUESTION', colors: 'from-amber-500/10 to-orange-500/10 border-amber-500/20 text-amber-600' };
                      case 'COLLABORATION_REQUEST': return { text: 'COLLAB REQUEST', colors: 'from-emerald-500/10 to-teal-500/10 border-emerald-500/20 text-emerald-600' };
                      case 'ACHIEVEMENT': return { text: 'ACHIEVEMENT', colors: 'from-yellow-500/10 to-amber-500/10 border-yellow-500/20 text-yellow-600' };
                      case 'ANNOUNCEMENT': return { text: 'ANNOUNCEMENT', colors: 'from-rose-500/10 to-pink-500/10 border-rose-500/20 text-rose-600' };
                      default: return { text: 'RESEARCH UPDATE', colors: 'from-blue-500/10 to-cyan-500/10 border-blue-500/20 text-blue-600' };
                    }
                  };
                  const badge = getBadgeConfig(thread.rawType);

                  return (
                    <motion.div
                        key={thread.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white/90 backdrop-blur-xl border border-white/60 p-6 md:p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.06)] transition-all duration-300 text-left relative overflow-hidden group"
                      >
                      {/* Header: Author info, Affiliate, Time & Badge */}
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                          {thread.author?.image ? (
                            <img src={thread.author.image} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm ring-1 ring-slate-100" alt="" />
                          ) : (
                            <div className={`w-12 h-12 rounded-full ${getAvatarBg(initials)} flex items-center justify-center font-display font-extrabold text-white text-base shrink-0 shadow-inner ring-2 ring-white/50`}>
                              {initials}
                            </div>
                          )}
                          
                          <div className="font-sans">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                              <span className="text-xs font-extrabold text-slate-900 leading-none">
                                {thread.author?.name || 'Academic Scholar'}
                              </span>
                              {thread.rawType && (
                                <span className={`bg-gradient-to-r ${badge.colors} border text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full leading-none shrink-0 flex items-center gap-1.5 shadow-sm`}>
                                  {badge.text}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-450 font-bold mt-1.5 leading-none">
                              {thread.author?.role?.replace('_', ' ') || 'Researcher'} • {thread.author?.faculty || thread.author?.department || 'SRMIST'} • {typeof thread.createdAt === 'string' ? 'Active' : thread.createdAt.toLocaleDateString(undefined, {month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'})}
                            </p>
                          </div>
                        </div>

                        <div className="relative">
                          <button 
                            onClick={() => setOpenMenuId(openMenuId === thread.id ? null : thread.id)}
                            className="flex items-center text-slate-400 hover:text-[#0C4DA2] transition-colors p-2 rounded-full hover:bg-slate-50 cursor-pointer"
                          >
                            <MoreHorizontal className="w-5 h-5" />
                          </button>
                          
                          {/* 3 dots dropdown */}
                          <AnimatePresence>
                            {openMenuId === thread.id && (
                              <motion.div 
                                initial={{ opacity: 0, scale: 0.95, transformOrigin: 'top right' }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="absolute right-0 mt-2 w-40 bg-white/90 backdrop-blur-md rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white py-1 z-20"
                              >
                                <button 
                                  onClick={() => toggleSave(thread)}
                                  className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors flex items-center justify-between"
                                >
                                  <span>{thread.saves?.length > 0 ? 'Saved' : 'Save Post'}</span>
                                  {thread.saves?.length > 0 && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                                </button>
                                <button 
                                  onClick={() => handleShare(thread.id)}
                                  className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors"
                                >
                                  Copy Link
                                </button>
                                {(currentUser?.id === (thread as any).authorId || currentUser?.role === 'INSTITUTE_ADMIN') && (
                                  <>
                                    <button 
                                      onClick={() => {
                                        setEditingPost(thread);
                                        setOpenMenuId(null);
                                      }}
                                      className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors"
                                    >
                                      Edit Post
                                    </button>
                                    <button 
                                      onClick={() => {
                                        setDeletingPost(thread);
                                        setOpenMenuId(null);
                                      }}
                                      className="w-full text-left px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
                                    >
                                      Delete Post
                                    </button>
                                  </>
                                )}
                                <div className="border-t border-slate-100 my-1"></div>
                                <button 
                                  onClick={() => {
                                    setReportingPost(thread);
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full text-left px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
                                >
                                  Report Post
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                      {/* Content Card Body */}
                      <div className="mb-5 font-sans font-medium text-sm leading-relaxed text-slate-700">
                        {thread.isPaper ? (
                          // Nested Document Card View matching Marcus Jensen's Post
                          <div className="space-y-3">
                            <p className="text-slate-500 font-bold">
                              {thread.author?.name} published a new paper <span className="font-medium text-slate-400 text-[10px] ml-1.5">{typeof thread.createdAt === 'string' ? 'Active' : thread.createdAt.toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</span>
                            </p>
                            
                            <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-200/60 rounded-2xl p-5 flex items-start gap-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer group/doc">
                              <div className="w-12 h-12 rounded-xl bg-white border border-slate-200/70 shadow-sm flex items-center justify-center text-slate-400 shrink-0 group-hover/doc:text-[#0C4DA2] group-hover/doc:border-[#0C4DA2]/30 transition-colors">
                                <FileText className="w-6 h-6" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-4 mb-2">
                                  <span className="bg-gradient-to-r from-slate-200/60 to-slate-100 border border-slate-200/80 text-slate-600 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md leading-none shadow-sm">
                                    {thread.paperInfo?.journal || 'NATURE QUANTUM'}
                                  </span>
                                </div>
                                <h4 className="text-sm font-bold text-slate-900 leading-snug group-hover/doc:text-[#0C4DA2] transition-colors">
                                  {thread.title}
                                </h4>
                              </div>
                            </div>
                          </div>
                        ) : (
                          // Standard Text Post View matching Dr. Sara Rowe's Post
                          <>
                            <p className="whitespace-pre-wrap">{thread.content}</p>
                            {thread.attachments && thread.attachments.length > 0 && (
                              <div className="mt-4 flex flex-col gap-3">
                                {thread.attachments.map((att: any, idx: number) => (
                                  <a key={idx} href={att.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 bg-gradient-to-r from-slate-50 to-white border border-slate-200/80 rounded-xl px-4 py-3 text-xs text-[#0C4DA2] hover:border-[#0C4DA2]/30 hover:shadow-sm transition-all font-bold self-start max-w-full group/att">
                                    {att.type === 'IMAGE' || att.type === 'VIDEO' ? <ImageIcon className="w-5 h-5 shrink-0 text-blue-400 group-hover/att:text-[#0C4DA2]" /> : <FileText className="w-5 h-5 shrink-0 text-blue-400 group-hover/att:text-[#0C4DA2]" />}
                                    <span className="truncate">{att.name}</span>
                                    <ExternalLink className="w-4 h-4 text-slate-400 ml-2 shrink-0 group-hover/att:text-[#0C4DA2]" />
                                  </a>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {/* Hashtags */}
                      {thread.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-6">
                          {thread.tags.map((tag) => (
                            <button
                              key={tag}
                              onClick={() => {
                                setSearchQuery(tag);
                              }}
                              className="text-[#0C4DA2] bg-[#0C4DA2]/5 hover:bg-[#0C4DA2]/10 border border-[#0C4DA2]/20 text-[11px] font-black tracking-wider transition-all px-2.5 py-1 rounded-md"
                            >
                              #{tag}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Bottom Action buttons */}
                      <div className="flex flex-wrap items-center justify-between border-t border-slate-100/80 pt-5 mt-2 gap-4">
                        <div className="flex items-center gap-5">
                          <button 
                            onClick={() => toggleLike(thread.id, thread.likesCount)}
                            className={`flex items-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                              likeState.liked ? 'text-rose-600' : 'text-slate-500 hover:text-rose-500'
                            }`}
                          >
                            <Heart className={`w-4 h-4 transition-transform active:scale-75 ${likeState.liked ? 'fill-rose-600 text-rose-600' : ''}`} />
                            <span>Like ({likeState.count})</span>
                          </button>

                          <button 
                            onClick={() => setOpenCommentsId(openCommentsId === thread.id ? null : thread.id)}
                            className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 transition-all cursor-pointer"
                          >
                            <MessageSquare className="w-4 h-4" />
                            <span>Comment ({thread.commentsCount})</span>
                          </button>

                          <button 
                            onClick={() => handleShare(thread.id)}
                            className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 transition-all cursor-pointer"
                          >
                            <Share2 className="w-4 h-4" />
                            <span>Share</span>
                          </button>

                          <button 
                            onClick={() => toggleSave(thread.id)}
                            className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 transition-all cursor-pointer"
                          >
                            <Bookmark className="w-4 h-4" />
                            <span>Save</span>
                          </button>

                          <button 
                            onClick={() => toggleCollaborate(thread.id)}
                            className={`flex items-center gap-2 text-xs font-bold transition-all cursor-pointer px-3 py-1.5 rounded-full ${
                              isCollab ? 'bg-[#0C4DA2]/10 text-[#0C4DA2] border border-[#0C4DA2]/20' : 'bg-slate-50 text-slate-600 hover:bg-[#0C4DA2]/5 hover:text-[#0C4DA2] border border-slate-200'
                            }`}
                          >
                            <Users className="w-4 h-4" />
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
                                <div className="w-full h-full bg-blue-500 text-white font-extrabold text-[8px] flex items-center justify-center">MJ</div>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                              {thread.interestedCount} interested
                            </span>
                          </div>
                        ) : null}
                      </div>

                      <AnimatePresence>
                        {openCommentsId === thread.id && (
                          <FeedComments threadId={thread.id} />
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>

        </div>

        {/* RIGHT COLUMN SIDEBAR */}
        <div className="hidden lg:flex flex-col gap-6 w-full shrink-0 select-none text-left sticky top-6">
          
          {/* SCHOLARS YOU MAY KNOW */}
          <div className="bg-white/90 backdrop-blur-xl border border-white/60 p-6 md:p-8 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow flex flex-col gap-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100/80 gap-2">
              <span className="text-[11px] font-black text-slate-500 uppercase tracking-wide leading-tight">
                Scholars You May Know
              </span>
              <Link
                href="/scholar/connections"
                className="text-[9px] font-black uppercase text-[#0C4DA2] hover:text-[#042654] transition-colors bg-[#0C4DA2]/10 px-2 py-1.5 rounded-full shrink-0 text-center"
              >
                View All
              </Link>
            </div>

            <div className="flex flex-col gap-5">
              {peers.map((peer) => (
                <div key={peer.id} className="flex items-center justify-between gap-3 group/peer">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`w-10 h-10 rounded-full ${peer.avatarColor} flex items-center justify-center font-display font-extrabold text-white text-xs shrink-0 shadow-sm border-2 border-white ring-2 ring-transparent group-hover/peer:ring-[#0C4DA2]/20 transition-all`}>
                      {peer.initials || getInitials(peer.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-900 truncate leading-tight group-hover/peer:text-[#0C4DA2] transition-colors">{peer.name}</p>
                      <p className="text-[10px] text-slate-450 font-bold uppercase mt-1 truncate" title={peer.title}>{peer.title}</p>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleConnect(peer.id)}
                    className={`w-[76px] h-7 flex items-center justify-center rounded-full text-[9px] font-black uppercase tracking-wider transition-all duration-300 shrink-0 cursor-pointer active:scale-95 ${
                      peer.connected === 'connected'
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                        : peer.connected === 'pending'
                        ? 'bg-amber-50 border border-amber-200 text-amber-700 animate-pulse'
                        : 'bg-white border border-[#0C4DA2]/20 hover:border-[#0C4DA2]/50 text-[#0C4DA2] hover:bg-[#0C4DA2]/5 shadow-sm hover:shadow-md'
                    }`}
                  >
                    {peer.connected === 'connected' ? 'Connected' : peer.connected === 'pending' ? 'Pending' : 'Connect'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Trending Research */}
          <div className="bg-white/90 backdrop-blur-xl border border-white/60 p-8 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow flex flex-col gap-6">
            <span className="text-sm font-black text-slate-500 uppercase tracking-widest pb-4 border-b border-slate-100/80">
              Trending Research
            </span>

            <div className="flex flex-col gap-6">
              {trendingTags.length > 0 ? trendingTags.slice(0, 5).map((tag, idx) => (
                <div key={idx} className="group/trending cursor-pointer">
                  <button 
                    onClick={() => setSearchQuery(tag)}
                    className="text-lg font-black text-slate-800 group-hover/trending:text-[#0C4DA2] transition-colors leading-tight block tracking-tight"
                  >
                    <span className="text-[#0C4DA2]/50 font-bold mr-1">#</span>{tag.toUpperCase()}
                  </button>
                  <div className="flex items-center gap-2 mt-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-blue-400 group-hover/trending:text-[#0C4DA2] transition-colors" />
                    <p className="text-xs text-slate-450 font-semibold group-hover/trending:text-slate-600 transition-colors">
                      {Math.floor(Math.random() * 50 + 10) / 10}k papers this week
                    </p>
                  </div>
                </div>
              )) : (
                <div className="py-8 text-center">
                  <p className="text-sm font-bold text-slate-400 italic">No trending topics yet.</p>
                </div>
              )}
            </div>

            <button 
              onClick={() => setSearchQuery('')}
              className="w-full mt-2 py-3.5 bg-slate-50/50 hover:bg-[#0C4DA2]/5 border border-slate-100 hover:border-[#0C4DA2]/20 text-slate-700 hover:text-[#0C4DA2] text-xs font-black uppercase tracking-widest rounded-full transition-all cursor-pointer active:scale-95 shadow-sm"
            >
              Explore All Topics
            </button>
          </div>

          {/* Recent Publications */}
          {recentPublications.length > 0 && (
            <div className="bg-white/90 backdrop-blur-xl border border-white/60 p-8 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow flex flex-col gap-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100/80">
                <span className="text-sm font-black text-slate-500 uppercase tracking-widest">
                  Recent Publications
                </span>
              </div>
              <div className="flex flex-col gap-4">
                {recentPublications.map((pub) => (
                  <Link href={`/scholar/feed/${pub.id}`} key={pub.id} className="group/pub flex gap-3 items-start cursor-pointer">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200/70 shadow-sm flex items-center justify-center text-[#0C4DA2]/70 shrink-0 group-hover/pub:bg-[#0C4DA2]/5 group-hover/pub:border-[#0C4DA2]/30 transition-all">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-slate-900 leading-snug group-hover/pub:text-[#0C4DA2] transition-colors line-clamp-2">
                        {pub.title}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                        {pub.author?.name}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Floating Action Button (FAB) at Bottom Right */}
      <FeedFAB />

      {/* Modals */}
      {editingPost && (
        <EditPostModal 
          isOpen={!!editingPost} 
          onClose={() => setEditingPost(null)} 
          thread={editingPost} 
        />
      )}
      {reportingPost && (
        <ReportPostModal 
          isOpen={!!reportingPost} 
          onClose={() => setReportingPost(null)} 
          thread={reportingPost} 
        />
      )}
      {deletingPost && (
        <ConfirmDeleteModal 
          isOpen={!!deletingPost} 
          onClose={() => setDeletingPost(null)} 
          thread={deletingPost} 
        />
      )}
    </DashboardShell>
  );
}
