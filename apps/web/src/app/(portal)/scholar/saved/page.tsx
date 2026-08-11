'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useStore } from '@/store/useStore';
import { 
  Bookmark, 
  Search, 
  MessageSquare, 
  Heart, 
  Share2, 
  RefreshCcw, 
  ExternalLink,
  FileText,
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import FeedComments from '@/components/feed/FeedComments';

export default function ScholarSavedPostsPage() {
  const { 
    getSavedThreads, currentUser, toggleLikeThread, toggleSaveThread, 
    toggleSaveThreadLocally, addToast, shareThread 
  } = useStore();

  const [savedThreads, setSavedThreads] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [likes, setLikes] = useState<Record<string, { count: number; liked: boolean }>>({});
  const [openCommentsId, setOpenCommentsId] = useState<string | null>(null);

  const loadSavedPosts = async () => {
    setIsLoading(true);
    try {
      const data = await getSavedThreads();
      setSavedThreads(data || []);
    } catch (e) {
      console.error('Failed to load saved posts:', e);
      addToast('Failed to load saved posts', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSavedPosts();
  }, []);

  const handleUnsave = async (threadId: string) => {
    try {
      const { saved } = await toggleSaveThread(threadId);
      if (!saved) {
        setSavedThreads(prev => prev.filter(t => t.id !== threadId));
        if (currentUser) toggleSaveThreadLocally(threadId, false, currentUser.id);
        addToast('Post removed from saved collection', 'info');
      }
    } catch (err) {
      addToast('Failed to unsave post', 'error');
    }
  };

  const toggleLike = async (threadId: string, initialLikes: number, initialLiked: boolean) => {
    const currentState = likes[threadId] || { count: initialLikes, liked: initialLiked };
    setLikes(prev => ({
      ...prev,
      [threadId]: { count: currentState.liked ? Math.max(0, currentState.count - 1) : currentState.count + 1, liked: !currentState.liked }
    }));
    try {
      const res = await toggleLikeThread(threadId);
      setLikes(prev => ({
        ...prev,
        [threadId]: { 
          count: typeof res.likesCount === 'number' ? res.likesCount : (res.liked ? currentState.count + 1 : Math.max(0, currentState.count - 1)), 
          liked: res.liked 
        }
      }));
    } catch (e) {
      setLikes(prev => ({ ...prev, [threadId]: currentState }));
    }
  };

  const handleShare = async (thread: any) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/feed/post/${thread.id}`);
      addToast('Post link copied to clipboard!', 'success');
    } catch (e) {
      addToast('Failed to copy link', 'error');
    }
  };

  const filteredThreads = savedThreads.filter(t => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.title?.toLowerCase().includes(q) ||
      t.content?.toLowerCase().includes(q) ||
      t.author?.name?.toLowerCase().includes(q) ||
      (t.tags && t.tags.some((tag: string) => tag.toLowerCase().includes(q)))
    );
  });

  const getInitials = (name?: string | null) => {
    if (!name) return 'CB';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 space-y-6 max-w-6xl mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-200/60 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 shrink-0 shadow-inner">
            <Bookmark className="w-6 h-6 fill-amber-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">Saved Research Posts</h1>
              <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                {savedThreads.length} Saved
              </span>
            </div>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              Your personal collection of bookmarked publications, updates, and discussions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <Link
            href="/scholar/feed"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Explore Feed</span>
          </Link>
          <button
            onClick={loadSavedPosts}
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-[#0C4DA2] hover:border-[#0C4DA2]/30 transition-all cursor-pointer"
            title="Refresh Saved Posts"
          >
            <RefreshCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      {savedThreads.length > 0 && (
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search within saved posts..."
            className="w-full bg-white border border-slate-200 text-xs font-semibold pl-11 pr-4 py-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/40 shadow-sm transition-all"
          />
        </div>
      )}

      {/* Posts List */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
            <span className="w-7 h-7 border-2 border-amber-500 border-t-transparent animate-spin rounded-full block" />
            <span className="text-xs font-bold">Loading your saved collection...</span>
          </div>
        ) : filteredThreads.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-16 text-center shadow-sm flex flex-col items-center justify-center min-h-[350px]">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-4 text-amber-500 shadow-inner">
              <Bookmark className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-slate-900">
              {searchQuery ? 'No Saved Posts Matching Search' : 'No Saved Posts Yet'}
            </h3>
            <p className="text-slate-500 text-xs font-semibold max-w-sm mx-auto mt-2 leading-relaxed">
              {searchQuery 
                ? 'Try tweaking your search term to find saved publications or updates.'
                : 'Bookmark interesting publications, research updates, or discussions from the research feed to access them here anytime.'
              }
            </p>
            <Link
              href="/scholar/feed"
              className="mt-6 px-6 py-2.5 bg-[#0C4DA2] text-white font-bold text-xs rounded-full hover:bg-[#042654] transition-all shadow-md hover:shadow-lg flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Browse Research Feed</span>
            </Link>
          </div>
        ) : (
          filteredThreads.map((thread) => {
            const isInitiallyLiked = Array.isArray(thread.likes) && thread.likes.length > 0;
            const likesCount = thread._count?.likes ?? 0;
            const likeState = likes[thread.id] || { count: likesCount, liked: isInitiallyLiked };
            const initials = getInitials(thread.author?.name);

            return (
              <motion.div
                key={thread.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white border border-slate-200/80 p-6 md:p-8 rounded-3xl shadow-sm hover:shadow-md transition-all relative overflow-hidden"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    {thread.author?.image ? (
                      <img src={thread.author.image} className="w-11 h-11 rounded-full object-cover border border-slate-200" alt="" />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-[#0C4DA2] text-white flex items-center justify-center font-bold text-xs">
                        {initials}
                      </div>
                    )}
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900">{thread.author?.name || 'Scholar'}</h4>
                      <p className="text-[11px] text-slate-400 font-bold mt-0.5">
                        {thread.author?.role?.replace('_', ' ') || 'Researcher'} • {thread.author?.department || 'SRMIST'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleUnsave(thread.id)}
                    className="flex items-center gap-1.5 text-xs font-bold text-amber-600 hover:text-rose-600 bg-amber-50 hover:bg-rose-50 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                    title="Remove from Saved"
                  >
                    <Bookmark className="w-3.5 h-3.5 fill-amber-600" />
                    <span>Saved</span>
                  </button>
                </div>

                {/* Content */}
                <div className="mb-5 font-sans font-medium text-sm leading-relaxed text-slate-700">
                  {thread.isPaper ? (
                    <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl space-y-2">
                      <span className="text-[10px] font-black uppercase text-[#0C4DA2] tracking-wider">Publication</span>
                      <h3 className="text-sm font-bold text-slate-900 leading-snug">{thread.title}</h3>
                      <p className="text-xs text-slate-600">{thread.content}</p>
                    </div>
                  ) : (
                    <>
                      <h3 className="font-extrabold text-slate-900 text-sm mb-2">{thread.title}</h3>
                      <p className="whitespace-pre-wrap">{thread.content}</p>
                    </>
                  )}

                  {/* Attachments */}
                  {thread.attachments && thread.attachments.length > 0 && (
                    <div className="mt-4 flex flex-col gap-2">
                      {thread.attachments.map((att: any, idx: number) => (
                        <a key={idx} href={att.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-xs font-bold text-[#0C4DA2] hover:underline">
                          <FileText className="w-4 h-4" />
                          <span>{att.name}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                {/* Tags */}
                {thread.tags && thread.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {thread.tags.map((tag: string) => (
                      <span key={tag} className="text-[#0C4DA2] bg-blue-50 text-[10px] font-bold px-2.5 py-1 rounded-lg">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-2 gap-4">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => toggleLike(thread.id, likesCount, isInitiallyLiked)}
                      className={`flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                        likeState.liked ? 'text-rose-600' : 'text-slate-500 hover:text-rose-600'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${likeState.liked ? 'fill-rose-600 text-rose-600' : ''}`} />
                      <span>Like ({likeState.count})</span>
                    </button>

                    <button 
                      onClick={() => setOpenCommentsId(openCommentsId === thread.id ? null : thread.id)}
                      className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#0C4DA2] transition-all cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Comment ({thread._count?.comments || 0})</span>
                    </button>

                    <button 
                      onClick={() => handleShare(thread)}
                      className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-emerald-600 transition-all cursor-pointer"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>Share</span>
                    </button>
                  </div>
                </div>

                {/* Comments Section */}
                <AnimatePresence>
                  {openCommentsId === thread.id && (
                    <FeedComments threadId={thread.id} />
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
