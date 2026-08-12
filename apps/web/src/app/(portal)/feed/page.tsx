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
  Hash,
  Filter,
  ShieldAlert,
  Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardShell } from '@/components/shared/dashboard-shell';
import { supabase, getStoragePublicUrl } from '@/lib/supabase';
import FeedComments from '@/components/feed/FeedComments';
import FeedFAB from '@/components/feed/FeedFAB';
import EditPostModal from '@/components/feed/EditPostModal';
import ReportPostModal from '@/components/feed/ReportPostModal';
import ConfirmDeleteModal from '@/components/feed/ConfirmDeleteModal';
import ShareModal from '@/components/feed/ShareModal';

// ─── TYPES & INTERFACES ──────────────────────────────────────────────────────

interface Thread {
  id: string;
  title: string;
  content: string;
  createdAt: string | Date;
  authorId?: string;
  author?: {
    id?: string;
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
  saves?: Array<{ userId: string; threadId: string; id: string; createdAt: any }>;
  comments?: any[];
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
  const currentSort = (searchParams.get('sort') as 'latest' | 'top') || 'latest';

  const { 
    threads, feedCounts, feedError, searchQuery, setSearchQuery, activeTag, setActiveTag, 
    isLoading, fetchFeedThreads, fetchFeedCounts, currentUser, createThread,
    toggleLikeThread, requestThreadCollaboration, shareThread, reportThread, connectWithPeer,
    toggleSaveThread, deleteThread, toggleSaveThreadLocally, addToast, fetchSuggestedPeers, fetchTrendingResearch
  } = useStore();

  const [newPostContent, setNewPostContent] = useState('');
  const [postType, setPostType] = useState('RESEARCH_UPDATE');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<{name: string, size: string, url: string, type: string, rawSize: number, isPaper?: boolean} | null>(null);

  const [likes, setLikes] = useState<Record<string, { count: number; liked: boolean }>>({});
  const [collaborating, setCollaborating] = useState<Record<string, boolean>>({});
  const [peers, setPeers] = useState<Peer[]>([]);
  const [trendingTags, setTrendingTags] = useState<Array<{tag: string, count: number}>>([]);
  const [activeFilter, setActiveFilter] = useState('Posts');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [openCommentsId, setOpenCommentsId] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<any | null>(null);
  const [reportingPost, setReportingPost] = useState<any | null>(null);
  const [deletingPost, setDeletingPost] = useState<any | null>(null);
  const [sharingPost, setSharingPost] = useState<any | null>(null);
  // track optimistic share counts
  const [shareCounts, setShareCounts] = useState<Record<string, number>>({});

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
        title: u.role ? u.role.replace('_', ' ') : (u.department || 'Department'),
        department: u.department || '',
        avatarColor: 'bg-[#0C4DA2]',
        connected: 'connect',
      })));
    });
    fetchTrendingResearch().then(tags => setTrendingTags(tags));
  }, [fetchSuggestedPeers, fetchTrendingResearch]);

  // Fetch threads and counts when URL params change
  useEffect(() => {
    fetchFeedThreads(urlSearch, currentType, currentSort);
    fetchFeedCounts(urlSearch);
  }, [urlSearch, currentType, currentSort, fetchFeedThreads, fetchFeedCounts]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (searchQuery) {
      params.set('q', searchQuery);
    } else {
      params.delete('q');
    }
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const handleTypeFilter = (type: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (type === 'ALL') {
      params.delete('type');
    } else {
      params.set('type', type);
    }
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const handleSortChange = (sort: 'latest' | 'top') => {
    const params = new URLSearchParams(searchParams.toString());
    if (sort === 'latest') {
      params.delete('sort');
    } else {
      params.set('sort', sort);
    }
    router.push(`?${params.toString()}`, { scroll: false });
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
        attachments: (t as any).attachments,
        saves: (t as any).saves
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
  const handleConnect = async (peerId: string) => {
    // Optimistic update
    setPeers(prev => prev.map(p => {
      if (p.id === peerId) {
        let newStatus: 'connect' | 'pending' | 'connected' = 'pending';
        if (p.connected === 'pending') newStatus = 'connect'; // Toggle off if already pending
        return { ...p, connected: newStatus };
      }
      return p;
    }));

    // Server update
    const newStatus = await connectWithPeer(peerId);
    if (newStatus !== null) {
      setPeers(prev => prev.map(p => {
        if (p.id === peerId) return { ...p, connected: newStatus };
        return p;
      }));
    } else {
      // Revert on failure
      fetchSuggestedPeers().then(setPeers);
    }
  };

  // Handle File Upload to Supabase Storage with size/type validation
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isPaper = e.target.id === 'paper-upload';
    const isPhoto = e.target.id === 'photo-upload';
    const isPdf = e.target.id === 'pdf-upload';

    // File type validation
    if (isPhoto && !file.type.startsWith('image/')) {
      addToast('Please select a valid image file (JPEG, PNG, WebP).', 'error');
      e.target.value = '';
      return;
    }
    if ((isPdf || isPaper) && file.type !== 'application/pdf' && !file.name.endsWith('.pdf') && !file.name.endsWith('.doc') && !file.name.endsWith('.docx')) {
      addToast('Please select a valid PDF or Word document.', 'error');
      e.target.value = '';
      return;
    }

    // Size validation: 10MB limit for documents, 5MB for photos
    const maxSizeMB = isPhoto ? 5 : 10;
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      addToast(`File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds maximum allowed limit of ${maxSizeMB} MB.`, 'error');
      e.target.value = '';
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const bucket = 'curiousbees-storage';
      
      const { data, error } = await supabase.storage.from(bucket).upload(fileName, file, { upsert: true });
      if (error) {
        console.error('Upload failed, using local attachment fallback:', error);
        setSelectedAttachment({
          name: file.name,
          size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
          url: `https://dummy.url/${fileName}`,
          type: file.type.startsWith('image/') ? 'IMAGE' : file.type.startsWith('video/') ? 'VIDEO' : file.type === 'application/pdf' ? 'PDF' : 'DOCUMENT',
          rawSize: file.size,
          isPaper
        });
        addToast('File attached locally.', 'info');
        return;
      }
      
      const url = getStoragePublicUrl(bucket, fileName);
      setSelectedAttachment({
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        url: url,
        type: file.type.startsWith('image/') ? 'IMAGE' : file.type.startsWith('video/') ? 'VIDEO' : file.type === 'application/pdf' ? 'PDF' : 'DOCUMENT',
        rawSize: file.size,
        isPaper
      });
      addToast('File attached successfully.', 'success');
    } catch(err) {
      console.error(err);
      addToast('File upload failed. Please try again.', 'error');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleAddTag = () => {
    setNewPostContent(prev => prev + (prev.endsWith(' ') || prev.length === 0 ? '#' : ' #'));
  };

  const handlePostUpdate = async () => {
    if (isSubmitting) return; // Prevent double submission
    if (!newPostContent.trim()) return;
    
    const contentText = newPostContent.trim();
    if (contentText.length < 10) {
      addToast('Your update must be at least 10 characters long.', 'error');
      return;
    }
    if (contentText.length > 2500) {
      addToast('Your update exceeds the 2500 character limit.', 'error');
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
      addToast('Research update posted successfully!', 'success');
    } catch (e: any) {
      console.error(e);
      addToast(e.message || 'Failed to post update. Please try again.', 'error');
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
    const threadId = typeof thread === 'string' ? thread : thread.id;
    try {
      const { saved } = await toggleSaveThread(threadId);
      if (currentUser) {
        toggleSaveThreadLocally(threadId, saved, currentUser.id);
      }
      addToast(saved ? 'Post saved successfully' : 'Post unsaved', 'success');
    } catch (err) {
      addToast('Failed to save post', 'error');
    }
    setOpenMenuId(null);
  };

  const handleShare = (thread: Thread) => {
    setSharingPost(thread);
    setOpenMenuId(null);
  };

  const handleShareSuccess = (platform: string) => {
    if (!sharingPost) return;
    setShareCounts(prev => ({
      ...prev,
      [sharingPost.id]: (prev[sharingPost.id] ?? (sharingPost._count?.shares || 0)) + 1
    }));
  };

  const getAvatarBg = (initials: string) => {
    const code = initials.charCodeAt(0) + (initials.charCodeAt(1) || 0);
    const colors = [
      'bg-[#0C4DA2]',
      'bg-blue-600',
      'bg-amber-500',
      'bg-blue-700',
      'bg-yellow-600',
      'bg-[#001E4C]'
    ];
    return colors[code % colors.length];
  };

  return (
    <DashboardShell className="min-h-screen bg-slate-50/30 select-none pb-12">
      
      {/* ─── TOP SEARCH BAR ────────────────────── */}
      <div className="w-full bg-white/70 backdrop-blur-xl border border-white/80 p-4 rounded-3xl shadow-[0_8px_30px_rgb(12,77,162,0.06)] text-left flex items-center justify-between gap-6 mb-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 via-transparent to-indigo-50/50 pointer-events-none" />
        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-xl z-10">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search publications, researchers, or grants..."
            className="w-full bg-white/80 border border-slate-200/60 focus:bg-white hover:bg-white focus:ring-2 focus:ring-[#0C4DA2]/20 focus:border-[#0C4DA2]/30 text-slate-800 text-sm font-semibold placeholder-slate-400 pl-11 pr-9 py-3 rounded-2xl focus:outline-none transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
          />
          <button type="submit" className="absolute left-4 top-3.5 cursor-pointer group">
            <Search className="w-4 h-4 text-slate-400 group-hover:text-[#0C4DA2] transition-colors" />
          </button>
          {searchQuery && (
            <button 
              type="button"
              onClick={() => {
                setSearchQuery('');
                router.push(`?type=${currentType}`);
              }}
              className="absolute right-4 top-3.5 text-slate-400 hover:text-rose-500 cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </form>

        <div className="flex items-center gap-2 sm:gap-4 text-slate-500 shrink-0 z-10">
          <select
            value={currentSort}
            onChange={(e) => handleSortChange(e.target.value as any)}
            className="px-3 py-2.5 rounded-xl bg-white/80 border border-slate-200/60 text-xs font-bold text-slate-600 focus:outline-none focus:border-[#0C4DA2]/50 hover:border-slate-300/80 cursor-pointer shadow-sm"
          >
            <option value="latest">Latest</option>
            <option value="top">Top Posts</option>
          </select>
          <button 
            onClick={() => {
              fetchFeedThreads(urlSearch, currentType, currentSort);
              fetchFeedCounts(urlSearch);
            }}
            className="p-2.5 rounded-xl bg-white/80 border border-slate-200/60 hover:bg-[#0C4DA2] text-slate-550 hover:text-white hover:shadow-lg hover:shadow-[#0C4DA2]/20 transition-all duration-300 flex items-center justify-center shrink-0 cursor-pointer group"
            title="Sync Feed"
          >
            <RefreshCcw className={`w-4 h-4 group-hover:rotate-180 transition-transform duration-500 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Pill Filters Bar */}
      <div className="w-full flex items-center gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none select-none">
        {[
          { label: 'All', value: 'ALL', icon: Sparkles },
          { label: 'Saved Posts', value: 'SAVED', icon: Bookmark },
          { label: 'Research Updates', value: 'RESEARCH_UPDATE', icon: FileText },
          { label: 'Publications', value: 'PUBLICATION', icon: BookOpen },
          { label: 'Questions', value: 'QUESTION', icon: Hash },
          { label: 'Collaboration Requests', value: 'COLLABORATION_REQUEST', icon: Users },
          { label: 'Achievements', value: 'ACHIEVEMENT', icon: Award },
          { label: 'Announcements', value: 'ANNOUNCEMENT', icon: Bell }
        ].map(filter => {
          const IconComp = filter.icon;
          const isActive = currentType === filter.value;
          const count = feedCounts[filter.value] || 0;

          return (
            <button
              key={filter.value}
              onClick={() => handleTypeFilter(filter.value)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all duration-300 cursor-pointer flex items-center gap-2 shrink-0 border ${
                isActive 
                  ? 'bg-[#0C4DA2] text-white shadow-lg shadow-[#0C4DA2]/20 border-[#0C4DA2] -translate-y-0.5' 
                  : 'bg-white/90 backdrop-blur-md border-slate-200/80 text-slate-600 hover:bg-white hover:border-slate-300 hover:text-slate-900 shadow-2xs'
              }`}
            >
              <IconComp className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{filter.label}</span>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full transition-colors ${
                isActive 
                  ? 'bg-white/20 text-white' 
                  : 'bg-slate-100 text-slate-500'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ─── TWO-COLUMN MAIN GRID ────────────────────────────────────────────── */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start relative">
        
        {/* LEFT/CENTER COLUMN: FEED & COMPOSE */}
        <div className="flex flex-col gap-8">
          
          {/* Compose update box */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/90 backdrop-blur-2xl border border-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(12,77,162,0.06)] hover:shadow-[0_12px_40px_rgb(12,77,162,0.1)] ring-1 ring-slate-100/80 transition-all text-left flex flex-col gap-4 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#0C4DA2]/[0.015] to-transparent pointer-events-none" />
            
            <div className="flex items-start gap-4 relative z-10">
              {currentUser?.image ? (
                <img src={currentUser.image} className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-md ring-2 ring-slate-100 shrink-0" alt="" />
              ) : (
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#0C4DA2] to-blue-700 flex items-center justify-center font-display font-extrabold text-white text-sm shrink-0 shadow-md border-2 border-white ring-2 ring-blue-100">
                  {getInitials(currentUser?.name)}
                </div>
              )}
              
              <div className="flex-1 bg-slate-50/80 hover:bg-slate-50 transition-colors rounded-2xl p-3 border border-slate-200/80 flex flex-col focus-within:ring-2 focus-within:ring-[#0C4DA2]/20 focus-within:border-[#0C4DA2]/40 focus-within:bg-white transition-all shadow-inner">
                <textarea
                  rows={2}
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="Share a research update, publication, or collaboration opportunity..."
                  className="w-full bg-transparent resize-none border-0 focus:ring-0 text-slate-800 text-sm font-medium placeholder-slate-400 p-1 focus:outline-none min-h-[52px] leading-relaxed"
                />
                
                <div className="flex items-center justify-between px-1 pt-2.5 mt-1 border-t border-slate-200/60">
                  {/* Category selector badge */}
                  <div className="relative flex items-center gap-1.5">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Category:</span>
                    <select
                      value={postType}
                      onChange={(e) => setPostType(e.target.value)}
                      className="bg-white border border-slate-200/90 text-slate-700 hover:text-[#0C4DA2] text-[11px] font-bold px-2.5 py-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C4DA2]/20 cursor-pointer transition-colors shadow-2xs"
                    >
                      <option value="RESEARCH_UPDATE">Research Update</option>
                      <option value="PUBLICATION">Publication</option>
                      {currentUser?.role !== 'RESEARCH_SUPERVISOR' && <option value="QUESTION">Question</option>}
                      <option value="COLLABORATION_REQUEST">Collaboration Request</option>
                      <option value="ACHIEVEMENT">Achievement</option>
                      {(currentUser?.role === 'RESEARCH_SUPERVISOR' || currentUser?.role === 'INSTITUTE_ADMIN') && (
                        <option value="ANNOUNCEMENT">Announcement</option>
                      )}
                    </select>
                  </div>

                  <span className={`text-[10px] font-extrabold tracking-wider ${newPostContent.length > 2500 ? 'text-rose-500' : 'text-slate-400'}`}>
                    {newPostContent.length} / 2500
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 relative z-10">
              <div className="flex items-center gap-1.5 md:gap-2">
                <input 
                  type="file" 
                  id="pdf-upload" 
                  className="hidden" 
                  accept=".pdf"
                  onChange={handleFileUpload} 
                />
                <label 
                  htmlFor="pdf-upload"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-blue-50 hover:border-blue-200/80 transition-all cursor-pointer border border-slate-200/60 text-slate-600 hover:text-[#0C4DA2] text-[11px] font-bold shadow-2xs ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <FileText className="w-3.5 h-3.5 text-[#0C4DA2]" />
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
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-amber-50 hover:border-amber-200/80 transition-all cursor-pointer border border-slate-200/60 text-slate-600 hover:text-amber-700 text-[11px] font-bold shadow-2xs ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <ImageIcon className="w-3.5 h-3.5 text-amber-500" />
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
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-blue-50 hover:border-blue-200/80 transition-all cursor-pointer border border-slate-200/60 text-slate-600 hover:text-[#0C4DA2] text-[11px] font-bold shadow-2xs ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <BookOpen className="w-3.5 h-3.5 text-[#0C4DA2]" />
                  <span>Paper</span>
                </label>

                <button 
                  onClick={handleAddTag}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-amber-50 hover:border-amber-200/80 transition-all cursor-pointer border border-slate-200/60 text-slate-600 hover:text-amber-700 text-[11px] font-bold shadow-2xs"
                >
                  <Hash className="w-3.5 h-3.5 text-amber-500" />
                  <span>Tag</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handlePostUpdate}
                disabled={isSubmitting || !newPostContent.trim() || newPostContent.length > 2500}
                className="px-6 py-2.5 bg-[#0C4DA2] hover:bg-[#042654] shadow-md hover:shadow-lg hover:-translate-y-0.5 text-white text-xs font-black tracking-wider rounded-full flex items-center gap-2 transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Posting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Post Update</span>
                  </>
                )}
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
              {/* A. Initial Loading Skeleton State */}
              {isLoading && filteredThreads.length === 0 && !feedError ? (
                <div className="flex flex-col gap-6">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="bg-white/80 backdrop-blur-2xl border border-white p-6 md:p-8 rounded-3xl shadow-sm animate-pulse flex flex-col gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-slate-200" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-slate-200 rounded w-1/3" />
                          <div className="h-3 bg-slate-200 rounded w-1/4" />
                        </div>
                      </div>
                      <div className="space-y-2 my-2">
                        <div className="h-4 bg-slate-200 rounded w-full" />
                        <div className="h-4 bg-slate-200 rounded w-4/5" />
                        <div className="h-4 bg-slate-200 rounded w-2/3" />
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                        <div className="h-4 bg-slate-200 rounded w-16" />
                        <div className="h-4 bg-slate-200 rounded w-16" />
                        <div className="h-4 bg-slate-200 rounded w-16" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : feedError && filteredThreads.length === 0 ? (
                /* F. API / Server Error State */
                <div className="bg-white/70 backdrop-blur-xl border border-rose-100 p-12 text-center rounded-[32px] shadow-sm text-left flex flex-col items-center justify-center min-h-[300px]">
                  <div className="w-16 h-16 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center mb-5 text-rose-500 shadow-inner">
                    <ShieldAlert className="w-8 h-8" />
                  </div>
                  <h4 className="text-slate-900 font-extrabold text-lg text-center tracking-tight">Unable to load the research feed</h4>
                  <p className="text-slate-500 text-xs max-w-sm mx-auto mt-2 leading-relaxed font-semibold text-center">
                    {feedError}
                  </p>
                  <button 
                    type="button"
                    onClick={() => {
                      fetchFeedThreads(urlSearch, currentType, currentSort);
                      fetchFeedCounts(urlSearch);
                    }}
                    className="mt-6 px-6 py-2.5 bg-[#0C4DA2] hover:bg-[#0A3D82] text-white font-bold rounded-full text-xs transition-all shadow-md cursor-pointer flex items-center gap-2"
                  >
                    <RefreshCcw className="w-3.5 h-3.5" />
                    <span>Try again</span>
                  </button>
                </div>
              ) : filteredThreads.length === 0 ? (
                /* C, D, E. Empty Feed States */
                <div className="bg-white/90 backdrop-blur-xl border border-white p-12 text-center rounded-[32px] shadow-[0_8px_30px_rgb(12,77,162,0.04)] flex flex-col items-center justify-center min-h-[320px]">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl flex items-center justify-center mb-5 shadow-sm text-[#0C4DA2]">
                    {urlSearch ? <Search className="w-7 h-7" /> : currentType !== 'ALL' ? <Filter className="w-7 h-7" /> : <Sparkles className="w-7 h-7" />}
                  </div>
                  
                  {urlSearch ? (
                    /* E. Search Returns Nothing */
                    <>
                      <h4 className="text-slate-900 font-extrabold text-lg text-center tracking-tight">No results found</h4>
                      <p className="text-slate-500 text-xs max-w-sm mx-auto mt-2 leading-relaxed font-medium text-center">
                        No research results for &ldquo;{urlSearch}&rdquo;
                      </p>
                      <button 
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          handleTypeFilter(currentType);
                        }}
                        className="mt-6 px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-full text-xs transition-all cursor-pointer shadow-2xs"
                      >
                        Clear search
                      </button>
                    </>
                  ) : currentType !== 'ALL' ? (
                    /* D. Filtered Result Returns Nothing */
                    <>
                      <h4 className="text-slate-900 font-extrabold text-lg text-center tracking-tight">
                        {currentType === 'SAVED' ? 'No saved posts found' :
                         currentType === 'COLLABORATION_REQUEST' ? 'No collaboration requests found' :
                         currentType === 'PUBLICATION' ? 'No publications found' :
                         currentType === 'QUESTION' ? 'No research questions found' :
                         currentType === 'ACHIEVEMENT' ? 'No research achievements found' :
                         currentType === 'ANNOUNCEMENT' ? 'No announcements found' : 'No matching research updates'}
                      </h4>
                      <p className="text-slate-500 text-xs max-w-sm mx-auto mt-2 leading-relaxed font-medium text-center">
                        {currentType === 'SAVED' ? "You haven't saved any research posts yet." :
                         currentType === 'COLLABORATION_REQUEST' ? "There are no open collaboration requests at the moment." :
                         currentType === 'PUBLICATION' ? "No research papers or publications have been shared yet." :
                         currentType === 'QUESTION' ? "No research questions have been posted yet." :
                         currentType === 'ACHIEVEMENT' ? "No research achievements have been posted yet." :
                         currentType === 'ANNOUNCEMENT' ? "No institutional announcements have been posted yet." :
                         "No research updates matching your selected category."}
                      </p>
                      <button 
                        type="button"
                        onClick={() => handleTypeFilter('ALL')}
                        className="mt-6 px-6 py-2.5 bg-[#0C4DA2] hover:bg-[#042654] text-white font-extrabold rounded-full text-xs transition-all cursor-pointer shadow-md hover:shadow-lg active:scale-95"
                      >
                        Clear Filter
                      </button>
                    </>
                  ) : (
                    /* C. Total DB Empty Feed */
                    <>
                      <h4 className="text-slate-900 font-extrabold text-lg text-center tracking-tight">No research activity yet</h4>
                      <p className="text-slate-500 text-xs max-w-sm mx-auto mt-2 leading-relaxed font-semibold text-center">
                        Your research network is just getting started. Share your first research update, publication, question, or collaboration opportunity.
                      </p>
                      <button 
                        type="button"
                        onClick={() => {
                          const textarea = document.querySelector('textarea');
                          if (textarea) textarea.focus();
                        }}
                        className="mt-6 px-6 py-2.5 bg-[#0C4DA2] text-white font-bold rounded-full text-xs hover:bg-[#0A3D82] transition-all cursor-pointer shadow-md flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Create Research Update</span>
                      </button>
                    </>
                  )}
                </div>
              ) : (
                filteredThreads.map((thread) => {
                  const likeState = likes[thread.id] || { count: thread.likesCount, liked: false };
                  const isCollab = collaborating[thread.id];
                  const initials = getInitials(thread.author?.name);
                  
                  const getBadgeConfig = (type?: string) => {
                    switch(type) {
                      case 'RESEARCH_UPDATE': return { text: 'RESEARCH UPDATE', colors: 'from-blue-500/10 to-indigo-500/10 border-blue-500/20 text-[#0C4DA2]' };
                      case 'PUBLICATION': return { text: 'PUBLICATION', colors: 'from-[#0C4DA2]/10 to-blue-600/10 border-blue-600/20 text-[#0C4DA2]' };
                      case 'QUESTION': return { text: 'QUESTION', colors: 'from-amber-500/10 to-yellow-500/10 border-amber-500/20 text-amber-700' };
                      case 'COLLABORATION_REQUEST': return { text: 'COLLAB REQUEST', colors: 'from-blue-600/10 to-amber-500/10 border-blue-500/20 text-[#0C4DA2]' };
                      case 'ACHIEVEMENT': return { text: 'ACHIEVEMENT', colors: 'from-amber-400/10 to-yellow-500/10 border-amber-500/30 text-amber-800' };
                      case 'ANNOUNCEMENT': return { text: 'ANNOUNCEMENT', colors: 'from-[#0C4DA2]/15 to-amber-400/15 border-[#0C4DA2]/30 text-[#0C4DA2]' };
                      default: return { text: 'RESEARCH UPDATE', colors: 'from-blue-500/10 to-indigo-500/10 border-blue-500/20 text-[#0C4DA2]' };
                    }
                  };
                  const badge = getBadgeConfig(thread.rawType);

                  return (
                      <motion.div
                        key={thread.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white/80 backdrop-blur-2xl border border-white p-6 md:p-8 rounded-3xl shadow-[0_8px_30px_rgb(12,77,162,0.05)] hover:shadow-[0_12px_40px_rgb(12,77,162,0.08)] ring-1 ring-white/50 transition-all duration-500 text-left relative overflow-hidden group hover:-translate-y-0.5"
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
                              <span className="text-xs font-extrabold text-slate-900 leading-none flex items-center gap-1">
                                {thread.author?.name || 'Academic Scholar'}
                                {(thread.author?.role === 'RESEARCH_SUPERVISOR' || thread.author?.role === 'INSTITUTE_ADMIN') && (
                                  <span title="Verified Faculty" className="text-blue-500 bg-blue-50 rounded-full p-0.5">
                                    <Check className="w-3 h-3" />
                                  </span>
                                )}
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
                                  <span>{(thread.saves?.length ?? 0) > 0 ? 'Saved' : 'Save Post'}</span>
                                  {(thread.saves?.length ?? 0) > 0 && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                                </button>
                                <button 
                                  onClick={() => {
                                    navigator.clipboard.writeText(`${window.location.origin}/feed/post/${thread.id}`);
                                    addToast('Link copied to clipboard!', 'success');
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors"
                                >
                                  Copy Link
                                </button>
                                <button 
                                  onClick={() => {
                                    reportThread(thread.id, 'Inappropriate content');
                                    addToast('Post reported. Thank you.', 'info');
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors"
                                >
                                  Report Post
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
                              className="text-[#0C4DA2] bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border border-blue-200/50 hover:border-blue-300 text-[11px] font-black tracking-wider transition-all px-3 py-1.5 rounded-lg shadow-sm"
                            >
                              #{tag}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Bottom Action buttons */}
                      <div className="flex flex-wrap items-center justify-between border-t border-slate-100/80 pt-5 mt-2 gap-4 relative z-10">
                        <div className="flex items-center gap-2 sm:gap-4">
                          <button 
                            onClick={() => toggleLike(thread.id, thread.likesCount)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer hover:bg-blue-50 ${
                              likeState.liked ? 'text-[#0C4DA2] bg-blue-50' : 'text-slate-500 hover:text-[#0C4DA2]'
                            }`}
                          >
                            <Heart className={`w-4 h-4 transition-transform group-active:scale-75 ${likeState.liked ? 'fill-[#0C4DA2] text-[#0C4DA2]' : ''}`} />
                            <span>Like ({likeState.count})</span>
                          </button>

                          <button 
                            onClick={() => setOpenCommentsId(openCommentsId === thread.id ? null : thread.id)}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-blue-50 hover:text-[#0C4DA2] transition-all cursor-pointer group"
                          >
                            <MessageSquare className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            <span>Comment ({thread.commentsCount})</span>
                          </button>

                          <button 
                            onClick={() => handleShare(thread)}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 transition-all cursor-pointer group"
                          >
                            <Share2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            <span>Share ({shareCounts[thread.id] ?? thread.collaboratorsCount})</span>
                          </button>

                          <button 
                            onClick={() => toggleSave(thread)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer group ${
                              (thread.saves || []).some((s: any) => s.userId === currentUser?.id)
                                ? 'bg-amber-50 text-amber-600'
                                : 'text-slate-500 hover:bg-amber-50 hover:text-amber-600'
                            }`}
                          >
                            <Bookmark className={`w-4 h-4 group-hover:scale-110 transition-transform ${
                              (thread.saves || []).some((s: any) => s.userId === currentUser?.id)
                                ? 'fill-amber-600'
                                : ''
                            }`} />
                            <span>{(thread.saves || []).some((s: any) => s.userId === currentUser?.id) ? 'Saved' : 'Save'}</span>
                          </button>

                          <button 
                            onClick={() => toggleCollaborate(thread.id)}
                            className={`flex items-center gap-2 text-xs font-bold transition-all cursor-pointer px-4 py-1.5 rounded-full shadow-sm hover:shadow-md ${
                              isCollab ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-[#0C4DA2] border border-blue-200/50' : 'bg-white text-slate-600 hover:text-[#0C4DA2] border border-slate-200/80 hover:border-blue-300/50'
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
                              <div className="inline-block h-5.5 w-5.5 rounded-full ring-2 ring-white bg-[#0C4DA2] overflow-hidden">
                                <div className="w-full h-full text-white font-extrabold text-[8px] flex items-center justify-center">SR</div>
                              </div>
                              <div className="inline-block h-5.5 w-5.5 rounded-full ring-2 ring-white bg-[#FEC727] overflow-hidden">
                                <div className="w-full h-full text-[#17233D] font-extrabold text-[8px] flex items-center justify-center">MJ</div>
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
          
          {/* PEOPLE WITH SIMILAR INTERESTS */}
          <div className="bg-white/70 backdrop-blur-3xl border border-white p-6 md:p-8 rounded-[32px] shadow-[0_8px_30px_rgb(12,77,162,0.04)] hover:shadow-[0_12px_40px_rgb(12,77,162,0.08)] ring-1 ring-white/60 transition-all duration-500 flex flex-col gap-6 group hover:-translate-y-0.5 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#0C4DA2]/[0.015] to-transparent pointer-events-none" />
            <div className="flex items-center justify-between pb-4 border-b border-slate-100/80 gap-2">
              <span className="text-[11px] font-black text-slate-500 uppercase tracking-wide leading-tight">
                People With Similar Interests
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
                  <Link href={`/researchers/${peer.id}`} className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer">
                    <div className={`w-10 h-10 rounded-full ${getAvatarBg(getInitials(peer.name))} flex items-center justify-center font-display font-extrabold text-white text-xs shrink-0 shadow-sm border-2 border-white ring-2 ring-transparent group-hover/peer:ring-[#0C4DA2]/20 transition-all`}>
                      {getInitials(peer.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-900 truncate leading-tight group-hover/peer:text-[#0C4DA2] transition-colors">{peer.name}</p>
                      <p className="text-[10px] text-slate-450 font-bold uppercase mt-1 truncate" title={peer.title}>{peer.title}</p>
                    </div>
                  </Link>

                  <Link 
                    href={`/chat?user=${peer.id}`}
                    className="w-[76px] h-7 flex items-center justify-center gap-1.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all duration-300 shrink-0 cursor-pointer active:scale-95 shadow-sm hover:shadow-md relative z-10 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 hover:border-blue-300/80 text-[#0C4DA2] hover:-translate-y-0.5"
                  >
                    <MessageSquare className="w-3 h-3 shrink-0" />
                    <span>Message</span>
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Trending Research */}
          <div className="bg-white/70 backdrop-blur-3xl border border-white p-6 md:p-8 rounded-[32px] shadow-[0_8px_30px_rgb(12,77,162,0.04)] hover:shadow-[0_12px_40px_rgb(12,77,162,0.08)] ring-1 ring-white/60 transition-all duration-500 flex flex-col gap-6 group hover:-translate-y-0.5 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.015] to-transparent pointer-events-none" />
            <span className="text-sm font-black text-slate-500 uppercase tracking-widest pb-4 border-b border-slate-100/80">
              Trending Research
            </span>

            <div className="flex flex-col gap-6">
              {trendingTags.length > 0 ? trendingTags.slice(0, 5).map((t, idx) => (
                <div key={idx} className="group/trending cursor-pointer">
                  <button 
                    type="button"
                    onClick={() => {
                      setSearchQuery(t.tag);
                      handleSearchSubmit();
                    }}
                    className="text-lg font-black text-slate-800 group-hover/trending:text-[#0C4DA2] transition-colors leading-tight block tracking-tight text-left"
                  >
                    <span className="text-[#0C4DA2]/50 font-bold mr-1">#</span>{t.tag.toUpperCase()}
                  </button>
                  <div className="flex items-center gap-2 mt-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-blue-400 group-hover/trending:text-[#0C4DA2] transition-colors" />
                    <p className="text-xs text-slate-450 font-semibold group-hover/trending:text-slate-600 transition-colors">
                      {t.count} interactions this week
                    </p>
                  </div>
                </div>
              )) : (
                <div className="py-6 text-center flex flex-col items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-slate-800">No trending topics yet</p>
                  <p className="text-[11px] font-semibold text-slate-400 max-w-[200px] mt-1">
                    Trending research topics will appear as researchers interact.
                  </p>
                </div>
              )}
            </div>

            <button 
              type="button"
              onClick={() => {
                setSearchQuery('');
                handleSearchSubmit();
              }}
              className="w-full mt-2 py-3.5 bg-slate-50/50 hover:bg-[#0C4DA2]/5 border border-slate-100 hover:border-[#0C4DA2]/20 text-slate-700 hover:text-[#0C4DA2] text-xs font-black uppercase tracking-widest rounded-full transition-all cursor-pointer active:scale-95 shadow-sm"
            >
              Explore All Topics
            </button>
          </div>

          {/* Recent Publications */}
          {recentPublications.length > 0 && (
            <div className="bg-white/70 backdrop-blur-3xl border border-white p-6 md:p-8 rounded-[32px] shadow-[0_8px_30px_rgb(12,77,162,0.04)] hover:shadow-[0_12px_40px_rgb(12,77,162,0.08)] ring-1 ring-white/60 transition-all duration-500 flex flex-col gap-6 group hover:-translate-y-0.5 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-500/[0.015] to-transparent pointer-events-none" />
              <div className="flex items-center justify-between pb-4 border-b border-slate-100/80">
                <span className="text-sm font-black text-slate-500 uppercase tracking-widest">
                  Recent Publications
                </span>
              </div>
              <div className="flex flex-col gap-4">
                {recentPublications.map((pub) => (
                  <Link href={`/feed/${pub.id}`} key={pub.id} className="group/pub flex gap-3 items-start cursor-pointer">
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
      {sharingPost && (
        <ShareModal
          isOpen={!!sharingPost}
          onClose={() => setSharingPost(null)}
          thread={sharingPost}
          onShareSuccess={handleShareSuccess}
        />
      )}
    </DashboardShell>
  );
}
