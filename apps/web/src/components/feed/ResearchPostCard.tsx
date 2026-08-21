'use client';

import React, { useState } from 'react';
import { 
  Heart, 
  MessageSquare, 
  Share2, 
  Bookmark, 
  Sparkles, 
  MoreHorizontal, 
  FileText, 
  BookOpen, 
  ExternalLink,
  UserPlus,
  Check,
  Award,
  Megaphone,
  HelpCircle,
  Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/useStore';
import FeedComments from './FeedComments';
import { getProfileImageUrl } from '@/lib/avatar';

interface ResearchPostCardProps {
  post: any;
  onAuthorClick?: (author: any) => void;
  onShareClick?: (post: any) => void;
  onReportClick?: (post: any) => void;
  onDeleteClick?: (post: any) => void;
  onEditClick?: (post: any) => void;
  isFeedView?: boolean;
}

export default function ResearchPostCard({
  post,
  onAuthorClick,
  onShareClick,
  onReportClick,
  onDeleteClick,
  onEditClick,
  isFeedView = true
}: ResearchPostCardProps) {
  const { 
    currentUser, 
    toggleLikeThread, 
    toggleSaveThread, 
    addToast,
    followedUserIds,
    toggleFollowUser,
    followedTopics,
    toggleFollowTopic,
    collabStatuses,
    fetchCollabStatus,
    sendCollabRequest
  } = useStore();

  const isLiked = (post.likes && post.likes.length > 0) || false;
  const likesCount = post.likesCount ?? post._count?.likes ?? 0;
  const [isSaved, setIsSaved] = useState(
    (post.saves || []).some((s: any) => s.userId === currentUser?.id)
  );
  
  const authorId = post.authorId || post.author?.id;
  const isOwner = authorId === currentUser?.id;
  
  React.useEffect(() => {
    if (authorId && currentUser && !isOwner) {
      fetchCollabStatus(authorId, post.id);
    }
  }, [authorId, post.id, currentUser, isOwner, fetchCollabStatus]);

  const collabState = collabStatuses[authorId]?.status || 'NONE';
  const collabRequestId = collabStatuses[authorId]?.requestId;
  const collabId = collabStatuses[authorId]?.collaborationId;

  const [isCollaborating, setIsCollaborating] = useState(false);
  const isFollowingAuthor = authorId ? !!followedUserIds[authorId] : false;
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const isCompact = typeof window !== 'undefined' && localStorage.getItem('cb_pref_compact_cards') === 'true';
  const autoExpandPref = typeof window !== 'undefined' && localStorage.getItem('cb_pref_auto_abstracts') === 'true';
  const [isExpanded, setIsExpanded] = useState(autoExpandPref);

  const authorName = post.author?.name || 'Academic Researcher';
  const authorDept = post.author?.department || 'Research Division';
  const authorRole = post.author?.role || 'RESEARCH_SCHOLAR';
  const avatarUrl = getProfileImageUrl(post.author);

  const formatDate = (dateStr: string | Date) => {
    if (!dateStr) return 'Just now';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleLikeToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await toggleLikeThread(post.id);
    } catch (err: any) {
      addToast('Failed to update like status', 'error');
    }
  };

  const handleSaveToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextSaved = !isSaved;
    setIsSaved(nextSaved);
    try {
      if (currentUser?.id) {
        useStore.getState().toggleSaveThreadLocally(post.id, nextSaved, currentUser.id);
      }
      await toggleSaveThread(post.id);
      addToast(nextSaved ? 'Post saved to your bookmarks' : 'Post removed from bookmarks', 'info');
    } catch (err: any) {
      setIsSaved(!nextSaved);
      addToast('Failed to update bookmark status', 'error');
    }
  };

  const handleCollabRequest = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!authorId || isOwner) return;

    if (collabState === 'ACTIVE' && collabId) {
      window.location.href = `/nexus?collab=${collabId}`;
      return;
    }

    if (collabState === 'PENDING_SENT' || collabState === 'PENDING_RECEIVED') {
      window.location.href = `/nexus?view=requests`;
      return;
    }

    // Determine default message based on context
    let defaultMsg = `I would like to collaborate with you on your research.`;
    if (post.title) defaultMsg = `I am interested in collaborating on "${post.title}".`;
    else if (post.isPaper) defaultMsg = `I found your recent publication very insightful and would love to explore a collaboration.`;

    const customMessage = window.prompt(
      `Send a collaboration request to ${authorName}`, 
      defaultMsg
    );
    
    if (customMessage === null) return;

    setIsCollaborating(true);
    try {
      await sendCollabRequest(authorId, post.id, customMessage);
      addToast(`Collaboration request sent to ${authorName}`, 'success');
    } catch (err: any) {
      addToast(err.message || 'Collaboration request failed', 'error');
    } finally {
      setIsCollaborating(false);
    }
  };

  const getPostTypeBadge = (rawType?: string) => {
    switch (rawType) {
      case 'PUBLICATION':
        return { label: 'PUBLICATION', style: 'bg-indigo-50 dark:bg-indigo-950/35 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/40' };
      case 'QUESTION':
        return { label: 'QUESTION', style: 'bg-amber-50 dark:bg-amber-950/35 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/40' };
      case 'COLLABORATION_REQUEST':
        return { label: 'COLLAB REQUEST', style: 'bg-blue-50 dark:bg-blue-950/35 text-[#0C4DA2] dark:text-blue-300 border-blue-200 dark:border-blue-800/40' };
      case 'ACHIEVEMENT':
        return { label: 'ACHIEVEMENT', style: 'bg-yellow-50 dark:bg-yellow-950/35 text-yellow-800 dark:text-amber-300 border-yellow-200 dark:border-yellow-800/40' };
      case 'ANNOUNCEMENT':
        return { label: 'ANNOUNCEMENT', style: 'bg-rose-50 dark:bg-rose-950/35 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/40' };
      default:
        return { label: 'RESEARCH UPDATE', style: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700' };
    }
  };

  const badge = getPostTypeBadge(post.rawType);
  const textContent = post.content || '';
  const isLongContent = textContent.length > 280;

  return (
    <article className={`bg-white dark:bg-[#132238] border-b border-slate-200/80 dark:border-white/[0.08] ${isCompact ? 'p-3 sm:p-3.5' : 'p-4 sm:p-5'} transition-colors hover:bg-slate-50/40 dark:hover:bg-[#172942] text-left`}>
      <div className="flex items-start gap-3">
        {/* Author Avatar */}
        <button
          onClick={() => onAuthorClick?.(post.author || { name: authorName, department: authorDept })}
          className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0 bg-slate-100 dark:bg-slate-800 cursor-pointer hover:opacity-90 transition-opacity mt-0.5"
        >
          <img src={avatarUrl} alt={authorName} className="w-full h-full object-cover" />
        </button>

        <div className="flex-1 min-w-0">
          {/* Header Line */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap min-w-0">
              <button
                onClick={() => onAuthorClick?.(post.author || { name: authorName, department: authorDept })}
                className="text-[13px] font-bold text-slate-900 dark:text-[#F5F7FA] hover:underline transition-colors truncate cursor-pointer"
              >
                {authorName}
              </button>
              
              {post.author?.role && (
                <>
                  <span className="text-[11px] font-medium text-slate-400 dark:text-[#718096]">·</span>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-[#A7B3C5]">
                    {post.author.role.replace('_', ' ')}
                  </span>
                </>
              )}

              {authorDept && (
                <>
                  <span className="text-[11px] font-medium text-slate-400 dark:text-[#718096]">·</span>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-[#A7B3C5] truncate max-w-[140px] sm:max-w-none">
                    {authorDept}
                  </span>
                </>
              )}

              <span className="text-[11px] font-medium text-slate-400 dark:text-[#718096]">·</span>

              <span className="text-[11px] font-medium text-slate-400 dark:text-[#718096] hover:underline cursor-pointer">
                {formatDate(post.createdAt)}
              </span>

              {badge && badge.label && (
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wide uppercase border ${badge.style} ml-1`}>
                  {badge.label}
                </span>
              )}
            </div>

            {/* Post Menu Dropdown */}
            <div className="relative shrink-0">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 rounded-full text-slate-400 dark:text-[#718096] hover:text-slate-700 dark:hover:text-[#F5F7FA] hover:bg-slate-100 dark:hover:bg-[#101D30] transition-colors cursor-pointer"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              <AnimatePresence>
                {showMenu && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setShowMenu(false)} />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute right-0 top-7 w-44 bg-white dark:bg-[#101D30] rounded-2xl border border-slate-200 dark:border-white/[0.10] shadow-xl z-30 py-1 text-left text-xs font-bold text-slate-700 dark:text-[#F5F7FA]"
                    >
                      {!isOwner && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (post.authorId) toggleFollowUser(post.authorId);
                            setShowMenu(false);
                          }}
                          className="w-full px-4 py-2 hover:bg-slate-50 dark:hover:bg-[#132238] text-left flex items-center gap-2 cursor-pointer"
                        >
                          <UserPlus className="w-3.5 h-3.5 text-[#0C4DA2] dark:text-[#3B82F6]" />
                          <span>{isFollowingAuthor ? 'Unfollow Author' : 'Follow Author'}</span>
                        </button>
                      )}

                      {isOwner && onEditClick && (
                        <button
                          onClick={() => { onEditClick(post); setShowMenu(false); }}
                          className="w-full px-4 py-2 hover:bg-slate-50 dark:hover:bg-[#132238] text-left flex items-center gap-2"
                        >
                          <FileText className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                          <span>Edit Post</span>
                        </button>
                      )}

                      {isOwner && onDeleteClick && (
                        <button
                          onClick={() => { onDeleteClick(post); setShowMenu(false); }}
                          className="w-full px-4 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-left flex items-center gap-2"
                        >
                          <MoreHorizontal className="w-3.5 h-3.5" />
                          <span>Delete Post</span>
                        </button>
                      )}

                      {!isOwner && onReportClick && (
                        <button
                          onClick={() => { onReportClick(post); setShowMenu(false); }}
                          className="w-full px-4 py-2 hover:bg-slate-50 dark:hover:bg-[#132238] text-left flex items-center gap-2 text-rose-600 dark:text-rose-400"
                        >
                          <MoreHorizontal className="w-3.5 h-3.5" />
                          <span>Report Post</span>
                        </button>
                      )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Post Title */}
          {post.title && (
            <h3 className="text-sm font-bold text-slate-900 dark:text-[#F5F7FA] mt-1 mb-1 leading-tight">
              {post.title}
            </h3>
          )}

          {/* Post Content */}
          <div className="text-[13px] text-slate-800 dark:text-[#E2E8F0] font-medium whitespace-pre-wrap leading-relaxed mt-1">
            {isExpanded ? textContent : (textContent.length > 280 ? textContent.slice(0, 280) + '...' : textContent)}
            {textContent.length > 280 && (
              <button 
                onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                className="text-[#0C4DA2] dark:text-[#3B82F6] hover:underline font-bold ml-1 cursor-pointer"
              >
                {isExpanded ? 'Show less' : 'Read more'}
              </button>
            )}
          </div>

          {/* Journal Paper Box */}
          {(post.isPaper || post.paperInfo) && (
            <div className="mt-3 p-3.5 bg-indigo-50/60 dark:bg-[#0B1728] rounded-2xl border border-indigo-100 dark:border-white/[0.08] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-xl bg-indigo-600/10 dark:bg-indigo-600/20 flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4 text-indigo-700 dark:text-indigo-400" />
                </div>
                <div className="truncate">
                  <p className="text-[11px] font-black text-indigo-950 dark:text-[#F5F7FA] truncate">
                    {post.paperInfo?.journal || 'Peer-Reviewed Research Publication'}
                  </p>
                  <p className="text-[10px] font-bold text-indigo-600 dark:text-[#38BDF8] truncate mt-0.5">
                    {post.paperInfo?.publisher || 'Academic Index'}
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-indigo-600 text-white rounded-full text-[10px] font-extrabold uppercase tracking-wider shrink-0">
                PDF
              </span>
            </div>
          )}

          {/* Attachments Preview */}
          {post.attachments && post.attachments.length > 0 && (
            <div className="mt-3 space-y-2">
              {post.attachments.map((att: any, idx: number) => (
                <a
                  key={idx}
                  href={att.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-3 bg-slate-50 dark:bg-[#0B1728] hover:bg-blue-50/50 dark:hover:bg-[#101D30] rounded-2xl border border-slate-200/80 dark:border-white/[0.08] transition-all group"
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <FileText className="w-4 h-4 text-[#0C4DA2] dark:text-[#3B82F6] shrink-0" />
                    <span className="text-xs font-bold text-slate-800 dark:text-[#F5F7FA] truncate group-hover:text-[#0C4DA2] dark:group-hover:text-[#3B82F6]">
                      {att.name || 'Attachment'}
                    </span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 dark:text-[#718096] group-hover:text-[#0C4DA2] dark:group-hover:text-[#3B82F6] shrink-0" />
                </a>
              ))}
            </div>
          )}

          {/* Research Domain Hashtags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {post.tags.map((tag: string, i: number) => (
                <span
                  key={i}
                  className="text-[12px] font-medium text-[#0C4DA2] dark:text-[#38BDF8] hover:underline cursor-pointer"
                >
                  #{tag.replace(/^#/, '')}
                </span>
              ))}
            </div>
          )}

          {/* Action Row */}
          <div className="flex items-center justify-between mt-3 max-w-md">
            {/* Like */}
            <button
              onClick={handleLikeToggle}
              className={`flex items-center gap-1.5 p-1.5 rounded-full text-[12px] font-medium transition-all cursor-pointer group ${
                isLiked ? 'text-rose-500' : 'text-slate-500 dark:text-[#A7B3C5] hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30'
              }`}
            >
              <div className="flex items-center justify-center p-1 rounded-full group-hover:bg-rose-50 dark:group-hover:bg-rose-950/30 transition-colors">
                <Heart className={`w-4 h-4 transition-transform group-active:scale-75 ${isLiked ? 'fill-current' : ''}`} />
              </div>
              {likesCount > 0 && <span>{likesCount}</span>}
            </button>

            {/* Comment */}
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-1.5 p-1.5 rounded-full text-[12px] font-medium text-slate-500 dark:text-[#A7B3C5] hover:text-blue-500 dark:hover:text-[#3B82F6] hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-center p-1 rounded-full group-hover:bg-blue-50 dark:group-hover:bg-blue-950/30 transition-colors">
                <MessageSquare className="w-4 h-4 transition-transform group-active:scale-75" />
              </div>
              {(post.commentsCount ?? post._count?.comments ?? 0) > 0 && (
                <span>{post.commentsCount ?? post._count?.comments ?? 0}</span>
              )}
            </button>

            {/* Share */}
            <button
              onClick={(e) => { e.stopPropagation(); onShareClick?.(post); }}
              className="flex items-center gap-1.5 p-1.5 rounded-full text-[12px] font-medium text-slate-500 dark:text-[#A7B3C5] hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-center p-1 rounded-full group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/30 transition-colors">
                <Share2 className="w-4 h-4 transition-transform group-active:scale-75" />
              </div>
            </button>

            {/* Save */}
            <button
              onClick={handleSaveToggle}
              className={`flex items-center gap-1.5 p-1.5 rounded-full text-[12px] font-medium transition-all cursor-pointer group ${
                isSaved ? 'text-amber-500 dark:text-[#F4B740]' : 'text-slate-500 dark:text-[#A7B3C5] hover:text-amber-500 dark:hover:text-[#F4B740] hover:bg-amber-50 dark:hover:bg-amber-950/30'
              }`}
            >
              <div className="flex items-center justify-center p-1 rounded-full group-hover:bg-amber-50 dark:group-hover:bg-amber-950/30 transition-colors">
                <Bookmark className={`w-4 h-4 transition-transform group-active:scale-75 ${isSaved ? 'fill-current' : ''}`} />
              </div>
            </button>

            {/* Collaborate Action */}
            <button
              onClick={handleCollabRequest}
              disabled={isCollaborating || isOwner}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold transition-all cursor-pointer ${
                isOwner 
                  ? 'opacity-40 text-slate-500 dark:text-slate-600 cursor-not-allowed' 
                  : collabState === 'ACTIVE'
                  ? 'bg-[#0C4DA2] dark:bg-[#2563EB] text-white hover:bg-blue-800'
                  : collabState === 'PENDING_SENT'
                  ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-200'
                  : collabState === 'PENDING_RECEIVED'
                  ? 'bg-blue-100 dark:bg-blue-950/40 text-[#0C4DA2] dark:text-blue-300 hover:bg-blue-200'
                  : 'text-[#0C4DA2] dark:text-[#3B82F6] hover:bg-[#0C4DA2]/10 dark:hover:bg-blue-600/20 active:bg-[#0C4DA2]/20'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {collabState === 'ACTIVE' ? 'Open Collab' : 
                 collabState === 'PENDING_SENT' ? 'Request Sent' :
                 collabState === 'PENDING_RECEIVED' ? 'Review Request' :
                 'Collaborate'}
              </span>
            </button>
          </div>

          {/* Comments Component Expand */}
          {showComments && (
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/[0.08]">
              <FeedComments threadId={post.id} />
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
