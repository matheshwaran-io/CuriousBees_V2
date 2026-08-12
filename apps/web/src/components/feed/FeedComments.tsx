'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { Send, GraduationCap, UserSquare, Loader2, MoreHorizontal, Edit2, Trash2, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FeedCommentsProps {
  threadId: string;
}

export default function FeedComments({ threadId }: FeedCommentsProps) {
  const { threads, addComment, updateComment, deleteComment, toggleCommentLike, currentUser } = useStore();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const thread = threads.find((t) => t.id === threadId);
  const comments = thread?.comments || [];

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    
    setIsSubmitting(true);
    try {
      await addComment(threadId, content);
      setContent('');
    } catch (e: any) {
      console.error('Error adding comment:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateStr: string | Date) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const getRoleBadge = (role?: string) => {
    return role === 'RESEARCH_SUPERVISOR' 
      ? 'bg-[#ba1a1a]/5 text-[#ba1a1a] border-[#ba1a1a]/15'
      : 'bg-[#0c4da2]/5 text-[#0c4da2] border-[#0c4da2]/15';
  };

  const handleEditSubmit = async (commentId: string) => {
    if (!editingContent.trim()) return;
    try {
      await updateComment(commentId, editingContent);
      setEditingId(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    try {
      await deleteComment(commentId);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLike = async (commentId: string) => {
    try {
      await toggleCommentLike(commentId);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="mt-4 pt-4 border-t border-slate-100"
    >
      <div className="space-y-3 mb-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
        {comments.length === 0 ? (
          <p className="text-xs italic text-slate-400 font-semibold text-center py-2">
            No comments yet. Be the first to share your thoughts.
          </p>
        ) : (
          <AnimatePresence>
            {comments.map((comment: any) => (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                key={comment.id}
                className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex items-start space-x-3"
              >
                {comment.author?.image ? (
                  <img 
                    src={comment.author.image} 
                    className="w-[28px] h-[28px] rounded-full object-cover border border-white shrink-0 shadow-sm" 
                    alt={comment.author?.name || 'Author'}
                  />
                ) : (
                  <div className="w-[28px] h-[28px] rounded-full bg-[#0C4DA2] text-white font-extrabold text-[10px] uppercase flex items-center justify-center border border-white shrink-0 shadow-sm select-none">
                    {(comment.author?.name || 'R').charAt(0)}
                  </div>
                )}
                <div className="flex-1 space-y-1 min-w-0">
                  <div className="flex items-center justify-between relative">
                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] font-bold text-slate-800">{comment.author?.name || 'Scholar'}</span>
                      <span className={`inline-flex px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase border leading-none ${getRoleBadge(comment.author?.role)}`}>
                        {comment.author?.role === 'RESEARCH_SUPERVISOR' || comment.author?.role === 'SUPERVISOR' ? 'Research Supervisor' : 'Research Scholar'}
                      </span>
                      <span className="text-[9px] text-slate-400 font-bold uppercase ml-2">
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => handleLike(comment.id)}
                        className={`flex items-center gap-1 px-1.5 py-1 rounded-md transition-colors ${comment.likes?.length ? 'text-rose-500 bg-rose-50' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${comment.likes?.length ? 'fill-current' : ''}`} />
                        {comment._count?.likes > 0 && <span className="text-[10px] font-bold">{comment._count.likes}</span>}
                      </button>

                      {currentUser?.id === comment.authorId && (
                        <div className="relative">
                          <button 
                            onClick={() => setActiveDropdown(activeDropdown === comment.id ? null : comment.id)}
                            className="p-1 rounded-md text-slate-400 hover:bg-slate-200 transition-colors"
                          >
                            <MoreHorizontal className="w-3.5 h-3.5" />
                          </button>
                          
                          {activeDropdown === comment.id && (
                            <div className="absolute right-0 top-full mt-1 w-28 bg-white border border-slate-100 shadow-lg rounded-xl py-1 z-10">
                              <button 
                                onClick={() => { setEditingId(comment.id); setEditingContent(comment.content); setActiveDropdown(null); }}
                                className="w-full text-left px-3 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                              >
                                <Edit2 className="w-3 h-3" /> Edit
                              </button>
                              <button 
                                onClick={() => { handleDelete(comment.id); setActiveDropdown(null); }}
                                className="w-full text-left px-3 py-1.5 text-[11px] font-bold text-red-600 hover:bg-red-50 flex items-center gap-2"
                              >
                                <Trash2 className="w-3 h-3" /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {editingId === comment.id ? (
                    <div className="mt-2 flex flex-col gap-2">
                      <input 
                        type="text" 
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        autoFocus
                      />
                      <div className="flex items-center gap-2 justify-end">
                        <button 
                          onClick={() => setEditingId(null)}
                          className="text-[10px] font-bold text-slate-500 hover:text-slate-700"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={() => handleEditSubmit(comment.id)}
                          className="text-[10px] font-bold text-white bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded-md"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-600 text-xs leading-relaxed font-sans font-medium mt-1">
                      {comment.content}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      <form onSubmit={handleCommentSubmit} className="flex gap-2">
        {currentUser?.image ? (
          <img 
            src={currentUser.image} 
            className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-sm shrink-0" 
            alt={currentUser?.name || 'User'}
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-[#0C4DA2] text-white font-extrabold text-xs uppercase flex items-center justify-center border border-slate-200 shadow-sm shrink-0 select-none">
            {(currentUser?.name || 'U').charAt(0)}
          </div>
        )}
        <div className="flex-1 relative">
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write a comment..."
            className="w-full pl-3 pr-10 py-1.5 rounded-full border border-slate-200 focus:border-[#0C4DA2] focus:ring-1 focus:ring-[#0C4DA2]/20 outline-none text-xs font-semibold transition-all bg-slate-50"
          />
          <button
            type="submit"
            disabled={isSubmitting || !content.trim()}
            className="absolute right-1 top-1 bottom-1 p-1.5 rounded-full bg-[#0C4DA2] hover:bg-[#042654] disabled:opacity-50 text-white transition-all shadow-sm cursor-pointer"
          >
            {isSubmitting ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Send className="w-3 h-3" />
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
