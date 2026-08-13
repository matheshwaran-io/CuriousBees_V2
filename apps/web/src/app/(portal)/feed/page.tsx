'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { 
  Search, 
  Plus, 
  RefreshCcw, 
  X, 
  Sparkles, 
  Bookmark, 
  TrendingUp, 
  Bell, 
  Filter,
  FileText, 
  BookOpen, 
  Hash, 
  Users,
  Award,
  ShieldAlert,
  Loader2,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase, getStoragePublicUrl } from '@/lib/supabase';

// Feed sub-components
import CompactComposer from '@/components/feed/CompactComposer';
import ResearchPostCard from '@/components/feed/ResearchPostCard';
import ResearchDiscoverySidebar from '@/components/feed/ResearchDiscoverySidebar';
import MobileFeedNav from '@/components/feed/MobileFeedNav';
import ResearcherProfileModal from '@/components/feed/ResearcherProfileModal';
import { FeedSkeleton } from '@/components/feed/FeedSkeleton';
import FeedComments from '@/components/feed/FeedComments';
import FeedFAB from '@/components/feed/FeedFAB';
import EditPostModal from '@/components/feed/EditPostModal';
import ReportPostModal from '@/components/feed/ReportPostModal';
import ConfirmDeleteModal from '@/components/feed/ConfirmDeleteModal';
import ShareModal from '@/components/feed/ShareModal';
import TimelinesModal from '@/components/feed/TimelinesModal';

// ─── TYPES ──────────────────────────────────────────────────────────────────

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

// ─── FILTER PILLS CONFIG ────────────────────────────────────────────────────

const TYPE_FILTERS = [
  { label: 'All', value: 'ALL', icon: Sparkles },
  { label: 'Saved', value: 'SAVED', icon: Bookmark },
  { label: 'Updates', value: 'RESEARCH_UPDATE', icon: FileText },
  { label: 'Papers', value: 'PUBLICATION', icon: BookOpen },
  { label: 'Questions', value: 'QUESTION', icon: Hash },
  { label: 'Collabs', value: 'COLLABORATION_REQUEST', icon: Users },
  { label: 'Achievements', value: 'ACHIEVEMENT', icon: Award },
  { label: 'Notices', value: 'ANNOUNCEMENT', icon: Bell }
];

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
    toggleSaveThread, deleteThread, toggleSaveThreadLocally, addToast, fetchSuggestedPeers, fetchTrendingResearch,
    followedUserIds, followedDomains, followedTopics
  } = useStore();

  // ─── LOCAL STATE ──────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'foryou' | 'following' | 'discover'>('foryou');
  const [editingPost, setEditingPost] = useState<any | null>(null);
  const [reportingPost, setReportingPost] = useState<any | null>(null);
  const [deletingPost, setDeletingPost] = useState<any | null>(null);
  const [sharingPost, setSharingPost] = useState<any | null>(null);
  const [shareCounts, setShareCounts] = useState<Record<string, number>>({});
  const [selectedResearcher, setSelectedResearcher] = useState<any | null>(null);
  const [mobileComposerOpen, setMobileComposerOpen] = useState(false);
  
  // Fetch threads and counts when URL params change
  useEffect(() => {
    fetchFeedThreads(urlSearch, currentType, currentSort);
    fetchFeedCounts(urlSearch);
  }, [urlSearch, currentType, currentSort, fetchFeedThreads, fetchFeedCounts]);

  // ─── URL HELPERS ──────────────────────────────────────────────────────────

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

  // ─── THREAD TRANSFORM ────────────────────────────────────────────────────

  const getCombinedThreads = (): Thread[] => {
    return threads.map(t => {
      return {
        id: t.id,
        title: t.title,
        content: t.content,
        createdAt: t.createdAt,
        author: t.author ? {
          id: (t.author as any).id,
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
        collaboratorsCount: (t as any)._count?.shares || 0,
        badge: (t as any).type ? (t as any).type.replace('_', ' ') : undefined,
        rawType: (t as any).type,
        isPaper: t.isPaper,
        paperInfo: t.isPaper ? { journal: t.paperJournal || 'NATURE QUANTUM' } : undefined,
        interestedCount: 0,
        attachments: (t as any).attachments,
        saves: (t as any).saves,
        likes: (t as any).likes,
        comments: t.comments
      };
    });
  };

  const filteredThreads = useMemo(() => {
    const combined = getCombinedThreads();
    const q = searchQuery.toLowerCase().trim();

    // 1. Base Search & Tag Matching
    const matched = combined.filter(t => {
      const matchesSearch = !q || 
        t.title.toLowerCase().includes(q) || 
        t.content.toLowerCase().includes(q) ||
        t.tags.some(tag => tag.toLowerCase().includes(q)) ||
        (t.author?.name || '').toLowerCase().includes(q);
      
      const matchesTag = activeTag === '' || t.tags.includes(activeTag);
      return matchesSearch && matchesTag;
    });

    // 2. Tab Specific Filtering & Personalization
    if (activeTab === 'following') {
      const followedAuthorCount = Object.keys(followedUserIds).filter(k => followedUserIds[k]).length;
      const followedDomainCount = Object.keys(followedDomains).filter(k => followedDomains[k]).length;
      const followedTopicCount = Object.keys(followedTopics).filter(k => followedTopics[k]).length;
      const hasAnyFollows = followedAuthorCount > 0 || followedDomainCount > 0 || followedTopicCount > 0;

      if (!hasAnyFollows) {
        // Fallback: If user hasn't followed anyone yet, show matched threads so feed isn't empty
        return matched;
      }

      return matched.filter(t => {
        const isAuthorFollowed = t.authorId ? !!followedUserIds[t.authorId] : false;
        const isDomainFollowed = t.tags.some(tag => !!followedDomains[tag.toLowerCase()]);
        const isTopicFollowed = t.tags.some(tag => !!followedTopics[tag.toLowerCase().replace(/^#/, '')]);
        return isAuthorFollowed || isDomainFollowed || isTopicFollowed;
      });
    }

    if (activeTab === 'foryou') {
      const userInterests = (currentUser?.interests || []).map((i: any) => (i.interest?.name || i.name || '').toLowerCase()).filter(Boolean);

      return [...matched].sort((a, b) => {
        const aScore = (
          (a.authorId && followedUserIds[a.authorId] ? 10 : 0) +
          (a.tags.some(t => followedDomains[t.toLowerCase()] || followedTopics[t.toLowerCase().replace(/^#/, '')]) ? 8 : 0) +
          (a.tags.some(t => userInterests.includes(t.toLowerCase())) ? 5 : 0) +
          (a.author?.department && currentUser?.department && a.author.department === currentUser.department ? 3 : 0)
        );

        const bScore = (
          (b.authorId && followedUserIds[b.authorId] ? 10 : 0) +
          (b.tags.some(t => followedDomains[t.toLowerCase()] || followedTopics[t.toLowerCase().replace(/^#/, '')]) ? 8 : 0) +
          (b.tags.some(t => userInterests.includes(t.toLowerCase())) ? 5 : 0) +
          (b.author?.department && currentUser?.department && b.author.department === currentUser.department ? 3 : 0)
        );

        if (bScore !== aScore) return bScore - aScore;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    }

    // DISCOVER: Return all matched threads chronologically
    return matched;
  }, [threads, searchQuery, activeTag, activeTab, currentUser, followedUserIds, followedDomains, followedTopics]);

  // ─── ACTIONS ──────────────────────────────────────────────────────────────

  const handleShare = (thread: Thread) => {
    setSharingPost(thread);
  };

  const handleShareSuccess = (platform: string) => {
    if (!sharingPost) return;
    setShareCounts(prev => ({
      ...prev,
      [sharingPost.id]: (prev[sharingPost.id] ?? (sharingPost._count?.shares || 0)) + 1
    }));
  };

  const handlePostCreated = () => {
    fetchFeedThreads(urlSearch, currentType, currentSort);
    fetchFeedCounts(urlSearch);
  };

  const handleTagClick = (tag: string) => {
    setSearchQuery(tag);
    handleSearchSubmit();
  };

  const handleRefresh = () => {
    fetchFeedThreads(urlSearch, currentType, currentSort);
    fetchFeedCounts(urlSearch);
  };

  // ─── RENDER ───────────────────────────────────────────────────────────────

  return (
    <div className="w-full min-h-screen -mt-4 md:-mt-6 -mx-4 md:-mx-8 select-none">
      {/* Mobile Navigation */}
      <MobileFeedNav onOpenCreate={() => setMobileComposerOpen(true)} />

      {/* ─── MAIN 3-COLUMN LAYOUT ─── */}
      <div className="w-full max-w-[1200px] mx-auto flex gap-0">

        {/* ─── CENTER COLUMN (FEED TIMELINE) ─── */}
        <main className="flex-1 min-w-0 border-x border-slate-200/80 bg-white min-h-screen">

          {/* ─── STICKY HEADER ─── */}
          <div className="sticky top-0 bg-white/95 backdrop-blur-md z-20">
            {/* Search Box */}
            <form onSubmit={handleSearchSubmit} className="px-4 pb-2 pt-3">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search research, researchers, publications..."
                  className="w-full bg-slate-100/60 border border-slate-200/50 rounded-full pl-9 pr-8 py-1.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#0C4DA2]/40 focus:ring-2 focus:ring-[#0C4DA2]/10 transition-all"
                />
                <button type="submit" className="absolute left-3 top-2 text-slate-400 cursor-pointer">
                  <Search className="w-3.5 h-3.5" />
                </button>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      router.push(`?type=${currentType}`);
                    }}
                    className="absolute right-3 top-2 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </form>

            {/* Tabs */}
            <div className="flex items-center border-b border-slate-200/80 bg-white">
              {['foryou', 'following', 'discover'].map((tab) => {
                const labels = { foryou: 'For You', following: 'Following', discover: 'Discover' };
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`flex-1 flex items-center justify-center transition-colors cursor-pointer hover:bg-slate-50/80 ${
                      isActive ? 'text-slate-900 font-black' : 'text-slate-500 font-bold hover:text-slate-700'
                    }`}
                  >
                    <div className="relative py-3 px-1 text-[13px] flex items-center justify-center">
                      <span>{labels[tab as keyof typeof labels]}</span>
                      {isActive && (
                        <motion.div
                          layoutId="feed-tab-indicator"
                          className="absolute bottom-0 inset-x-0 h-[4px] bg-[#0C4DA2] rounded-full"
                          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                        />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            
            {/* Horizontal Filter Chips */}
            <div className="overflow-x-auto custom-scrollbar border-b border-slate-200/60 bg-slate-50/50">
              <div className="flex items-center gap-1.5 p-2.5 min-w-max">
                {TYPE_FILTERS.map((filter) => {
                  const Icon = filter.icon;
                  const isActive = currentType === filter.value;
                  return (
                    <button
                      key={filter.value}
                      onClick={() => handleTypeFilter(filter.value)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                        isActive
                          ? 'bg-[#0C4DA2] text-white border-[#0C4DA2] shadow-sm'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {Icon && <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white/80' : 'text-slate-400'}`} />}
                      {filter.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ─── COMPACT COMPOSER ─── */}
          <CompactComposer onPostCreated={handlePostCreated} />

          {/* ─── FEED STREAM ─── */}
          <div className="divide-y-0">
            {/* Loading State */}
            {isLoading && filteredThreads.length === 0 && !feedError ? (
              <FeedSkeleton count={4} />
            ) : feedError && filteredThreads.length === 0 ? (
              /* Error State */
              <div className="px-6 py-16 text-center flex flex-col items-center">
                <div className="w-14 h-14 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center mb-4 text-rose-500">
                  <ShieldAlert className="w-7 h-7" />
                </div>
                <h4 className="text-sm font-extrabold text-slate-900 tracking-tight">Unable to load the research feed</h4>
                <p className="text-xs text-slate-500 max-w-xs mt-2 leading-relaxed font-medium">
                  {feedError}
                </p>
                <button 
                  onClick={handleRefresh}
                  className="mt-5 px-5 py-2 bg-[#0C4DA2] text-white font-bold rounded-full text-xs transition-all shadow-sm cursor-pointer flex items-center gap-2"
                >
                  <RefreshCcw className="w-3.5 h-3.5" />
                  <span>Try again</span>
                </button>
              </div>
            ) : filteredThreads.length === 0 ? (
              /* Empty State */
              <div className="px-6 py-16 text-center flex flex-col items-center">
                <div className="w-14 h-14 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center mb-4 text-[#0C4DA2]">
                  {urlSearch ? <Search className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
                </div>

                {urlSearch ? (
                  <>
                    <h4 className="text-sm font-extrabold text-slate-900">No results for &ldquo;{urlSearch}&rdquo;</h4>
                    <p className="text-xs text-slate-500 mt-1 font-medium">Try a different search term or browse all posts.</p>
                    <button
                      onClick={() => { setSearchQuery(''); router.push('/feed'); }}
                      className="mt-4 px-5 py-2 bg-slate-100 text-slate-700 font-bold rounded-full text-xs cursor-pointer"
                    >
                      Clear search
                    </button>
                  </>
                ) : (
                  <>
                    <h4 className="text-sm font-extrabold text-slate-900">No research updates yet</h4>
                    <p className="text-xs text-slate-500 mt-1 font-medium max-w-xs leading-relaxed">
                      Your research network is getting started. Follow researchers and research domains to personalize your feed.
                    </p>
                    <div className="flex gap-2 mt-5">
                      <Link
                        href="/researchers"
                        className="px-4 py-2 bg-[#0C4DA2] text-white font-bold rounded-full text-xs cursor-pointer"
                      >
                        Explore Researchers
                      </Link>
                      <Link
                        href="/researchers"
                        className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-full text-xs cursor-pointer"
                      >
                        Browse Domains
                      </Link>
                    </div>
                  </>
                )}
              </div>
            ) : (
              /* Posts Stream */
              filteredThreads.map((thread) => (
                <ResearchPostCard
                  key={thread.id}
                  post={thread}
                  onAuthorClick={(author) => setSelectedResearcher(author)}
                  onShareClick={(post) => handleShare(post)}
                  onReportClick={(post) => setReportingPost(post)}
                  onDeleteClick={(post) => setDeletingPost(post)}
                  onEditClick={(post) => setEditingPost(post)}
                />
              ))
            )}

            {/* Loading more indicator */}
            {isLoading && filteredThreads.length > 0 && (
              <div className="flex items-center justify-center py-6 text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            )}
          </div>
        </main>

        {/* ─── RIGHT COLUMN (DISCOVERY SIDEBAR) ─── */}
        <aside className="hidden lg:block w-[340px] shrink-0 sticky top-0 h-screen overflow-y-auto p-4 scrollbar-thin">
          <ResearchDiscoverySidebar
            onSearchChange={(q) => {
              setSearchQuery(q);
            }}
            onTagClick={handleTagClick}
          />
        </aside>
      </div>

      {/* ─── FLOATING ACTION BUTTON ─── */}
      <FeedFAB />

      {/* ─── MODALS ─── */}
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
      <ResearcherProfileModal
        isOpen={!!selectedResearcher}
        onClose={() => setSelectedResearcher(null)}
        researcher={selectedResearcher}
      />

      {/* Bottom padding for mobile nav */}
      <div className="h-20 md:hidden" />
    </div>
  );
}
