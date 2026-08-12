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
    requestThreadCollaboration, 
    addToast 
  } = useStore();

  const [isLiked, setIsLiked] = useState(
    (post.likes && post.likes.length > 0) || false
  );
  const [likesCount, setLikesCount] = useState(
    post.likesCount ?? post._count?.likes ?? 0
  );
  const [isSaved, setIsSaved] = useState(
    (post.saves || []).some((s: any) => s.userId === currentUser?.id)
  );
  const [isCollaborating, setIsCollaborating] = useState(false);
  const [isFollowingAuthor, setIsFollowingAuthor] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const authorName = post.author?.name || 'Academic Researcher';
  const authorDept = post.author?.department || 'Research Division';
  const authorRole = post.author?.role || 'RESEARCH_SCHOLAR';
  const avatarUrl = post.author?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=0C4DA2&color=fff&size=64`;

  const isOwner = post.authorId === currentUser?.id || post.author?.id === currentUser?.id;

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
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setLikesCount((prev: number) => newLikedState ? prev + 1 : Math.max(0, prev - 1));

    try {
      await toggleLikeThread(post.id);
    } catch (err: any) {
      // rollback
      setIsLiked(!newLikedState);
      setLikesCount((prev: number) => !newLikedState ? prev + 1 : Math.max(0, prev - 1));
      addToast('Failed to update like status', 'error');
    }
  };

  const handleSaveToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newSavedState = !isSaved;
    setIsSaved(newSavedState);

    try {
      await toggleSaveThread(post.id);
      addToast(newSavedState ? 'Post saved to your bookmarks' : 'Post removed from bookmarks', 'info');
    } catch (err: any) {
      setIsSaved(!newSavedState);
      addToast('Failed to update saved status', 'error');
    }
  };

  const handleCollabRequest = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOwner) {
      addToast('This is your own research post', 'info');
      return;
    }

    setIsCollaborating(true);
    try {
      await requestThreadCollaboration(post.id);
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
        return { label: 'PUBLICATION', style: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'QUESTION':
        return { label: 'QUESTION', style: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'COLLABORATION_REQUEST':
        return { label: 'COLLAB REQUEST', style: 'bg-blue-50 text-[#0C4DA2] border-blue-200' };
      case 'ACHIEVEMENT':
        return { label: 'ACHIEVEMENT', style: 'bg-yellow-50 text-yellow-800 border-yellow-200' };
      case 'ANNOUNCEMENT':
        return { label: 'ANNOUNCEMENT', style: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'OPPORTUNITY':
        return { label: 'OPPORTUNITY', style: 'bg-teal-50 text-teal-700 border-teal-200' };
      default:
        return { label: 'RESEARCH UPDATE', style: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  const badge = getPostTypeBadge(post.rawType);
  const textContent = post.content || '';
  const isLongContent = textContent.length > 280;

  return (
    <article className="bg-white border-b border-slate-200/80 p-4 sm:p-5 transition-colors hover:bg-slate-50/40 text-left">
      <div className="flex items-start gap-3">
        {/* Author Avatar */}
        <button
          onClick={() => onAuthorClick?.(post.author || { name: authorName, department: authorDept })}
          className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 shrink-0 bg-slate-100 cursor-pointer hover:opacity-90 transition-opacity mt-0.5"
        >
          <img src={avatarUrl} alt={authorName} className="w-full h-full object-cover" />
        </button>

        <div className="flex-1 min-w-0">
          {/* Header Line */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap min-w-0">
              <button
                onClick={() => onAuthorClick?.(post.author || { name: authorName, department: authorDept })}
                className="text-xs font-black text-slate-900 hover:text-[#0C4DA2] transition-colors truncate cursor-pointer"
              >
                {authorName}
              </button>

              <span className="text-[10px] font-bold text-slate-400">·</span>

              <span className="text-[10px] font-bold text-slate-500 truncate max-w-[140px] sm:max-w-none">
                {authorDept}
              </span>

              <span className="text-[10px] font-bold text-slate-400">·</span>

              <span className="text-[10px] font-bold text-slate-400 hover:underline cursor-pointer">
                {formatDate(post.createdAt)}
              </span>

              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase border ${badge.style} ml-1`}>
                {badge.label}
              </span>
            </div>

            {/* Post Menu Dropdown */}
            <div className="relative shrink-0">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
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
                      className="absolute right-0 top-7 w-44 bg-white rounded-2xl border border-slate-200 shadow-xl z-30 py-1 text-left text-xs font-bold text-slate-700"
                    >
                      {!isOwner && (
                        <button
                          onClick={() => { setIsFollowingAuthor(!isFollowingAuthor); setShowMenu(false); }}
                          className="w-full px-4 py-2 hover:bg-slate-50 text-left flex items-center gap-2"
                        >
                          <UserPlus className="w-3.5 h-3.5 text-[#0C4DA2]" />
                          <span>{isFollowingAuthor ? 'Unfollow Author' : 'Follow Author'}</span>
                        </button>
                      )}

                      {isOwner && onEditClick && (
                        <button
                          onClick={() => { onEditClick(post); setShowMenu(false); }}
                          className="w-full px-4 py-2 hover:bg-slate-50 text-left flex items-center gap-2"
                        >
                          <FileText className="w-3.5 h-3.5 text-slate-500" />
                          <span>Edit Post</span>
                        </button>
                      )}

                      {isOwner && onDeleteClick && (
                        <button
                          onClick={() => { onDeleteClick(post); setShowMenu(false); }}
                          className="w-full px-4 py-2 hover:bg-rose-50 text-rose-600 text-left flex items-center gap-2"
                        >
                          <MoreHorizontal className="w-3.5 h-3.5" />
                          <span>Delete Post</span>
                        </button>
                      )}

                      {!isOwner && onReportClick && (
                        <button
                          onClick={() => { onReportClick(post); setShowMenu(false); }}
                          className="w-full px-4 py-2 hover:bg-slate-50 text-left flex items-center gap-2 text-rose-600"
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

          {/* Title (if present) */}
          {post.title && post.title !== textContent.substring(0, 60) && (
            <h4 className="text-xs font-black text-slate-900 mt-1 mb-1 leading-snug">
              {post.title}
            </h4>
          )}

          {/* Post Text Body */}
          <div className="mt-1 text-xs text-slate-800 leading-relaxed font-medium whitespace-pre-line">
            {isLongContent && !isExpanded ? (
              <>
                {textContent.substring(0, 280)}...
                <button
                  onClick={() => setIsExpanded(true)}
                  className="text-[#0C4DA2] font-bold text-xs hover:underline ml-1 cursor-pointer"
                >
                  Show more
                </button>
              </>
            ) : (
              textContent
            )}
          </div>

          {/* Journal Paper Box */}
          {(post.isPaper || post.paperInfo) && (
            <div className="mt-3 p-3.5 bg-indigo-50/60 rounded-2xl border border-indigo-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-xl bg-indigo-600/10 flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4 text-indigo-700" />
                </div>
                <div className="truncate">
                  <p className="text-[11px] font-black text-indigo-950 truncate">
                    {post.paperInfo?.journal || 'Peer-Reviewed Research Publication'}
                  </p>
                  <p className="text-[10px] font-bold text-indigo-600 truncate mt-0.5">
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
                  className="flex items-center justify-between p-3 bg-slate-50 hover:bg-blue-50/50 rounded-2xl border border-slate-200/80 transition-all group"
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <FileText className="w-4 h-4 text-[#0C4DA2] shrink-0" />
                    <span className="text-xs font-bold text-slate-800 truncate group-hover:text-[#0C4DA2]">
                      {att.name || 'Attachment'}
                    </span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0C4DA2] shrink-0" />
                </a>
              ))}
            </div>
          )}

          {/* Research Domain Hashtags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {post.tags.map((tag: string, i: number) => (
                <span
                  key={i}
                  className="text-[11px] font-bold text-[#0C4DA2] hover:underline cursor-pointer"
                >
                  #{tag.replace(/^#/, '')}
                </span>
              ))}
            </div>
          )}

          {/* Action Row */}
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100/80 max-w-md">
            {/* Like */}
            <button
              onClick={handleLikeToggle}
              className={`flex items-center gap-1.5 py-1 px-2.5 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
                isLiked ? 'text-[#0C4DA2] bg-blue-50' : 'text-slate-500 hover:text-[#0C4DA2] hover:bg-slate-100'
              }`}
            >
              <Heart className={`w-4 h-4 transition-transform active:scale-75 ${isLiked ? 'fill-[#0C4DA2] text-[#0C4DA2]' : ''}`} />
              <span>{likesCount}</span>
            </button>

            {/* Comment */}
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-1.5 py-1 px-2.5 rounded-full text-xs font-extrabold text-slate-500 hover:text-[#0C4DA2] hover:bg-slate-100 transition-all cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>{post.commentsCount ?? post._count?.comments ?? 0}</span>
            </button>

            {/* Repost / Share */}
            <button
              onClick={(e) => { e.stopPropagation(); onShareClick?.(post); }}
              className="flex items-center gap-1.5 py-1 px-2.5 rounded-full text-xs font-extrabold text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-all cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Share</span>
            </button>

            {/* Save */}
            <button
              onClick={handleSaveToggle}
              className={`flex items-center gap-1.5 py-1 px-2.5 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
                isSaved ? 'text-amber-600 bg-amber-50' : 'text-slate-500 hover:text-amber-600 hover:bg-amber-50'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-amber-600' : ''}`} />
            </button>

            {/* Collaborate Action */}
            <button
              onClick={handleCollabRequest}
              disabled={isCollaborating || isOwner}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-2xs ${
                isOwner 
                  ? 'opacity-40 bg-slate-100 text-slate-500 cursor-not-allowed' 
                  : 'bg-[#0C4DA2] text-white hover:bg-[#042654] active:scale-95'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>Collab</span>
            </button>
          </div>

          {/* Comments Component Expand */}
          {showComments && (
            <div className="mt-4 pt-3 border-t border-slate-100">
              <FeedComments threadId={post.id} />
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
