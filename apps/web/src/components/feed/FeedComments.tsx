'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { Send, Loader2, Pencil, Trash2, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FeedCommentsProps {
  threadId: string;
}

export default function FeedComments({ threadId }: FeedCommentsProps) {
  const { threads, addComment, updateComment, deleteComment, currentUser } = useStore();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit / Delete state
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);

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

  const handleEditClick = (comment: any) => {
    setEditingCommentId(comment.id);
    setEditingContent(comment.content);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingContent('');
  };

  const handleSaveEdit = async (commentId: string) => {
    if (!editingContent.trim()) return;
    setIsSavingEdit(true);
    try {
      await updateComment(commentId, threadId, editingContent.trim());
      setEditingCommentId(null);
      setEditingContent('');
    } catch (err) {
      console.error('Failed to update comment:', err);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    setDeletingCommentId(commentId);
    try {
      await deleteComment(commentId, threadId);
    } catch (err) {
      console.error('Failed to delete comment:', err);
    } finally {
      setDeletingCommentId(null);
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
            {comments.map((comment: any) => {
              const commentAuthorId = comment.authorId || comment.author?.id;
              const canModify = currentUser?.id && (currentUser.id === commentAuthorId || currentUser.role === 'INSTITUTE_ADMIN');
              const isEditing = editingCommentId === comment.id;
              const isDeleting = deletingCommentId === comment.id;

              return (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={comment.id}
                  className={`bg-slate-50 border border-slate-100 rounded-2xl p-3 flex items-start space-x-3 transition-all ${isDeleting ? 'opacity-50' : ''}`}
                >
                  <img 
                    src={comment.author?.image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
                    className="w-[28px] h-[28px] rounded-full object-cover border border-white shrink-0 shadow-sm" 
                    alt=""
                  />
                  <div className="flex-1 space-y-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-[11px] font-bold text-slate-800">{comment.author?.name || 'Scholar'}</span>
                        <span className={`inline-flex px-1.5 py-0.2 rounded-full text-[8px] font-bold uppercase border leading-none ${getRoleBadge(comment.author?.role)}`}>
                          {comment.author?.role === 'RESEARCH_SUPERVISOR' ? 'Faculty' : 'Scholar'}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-[9px] text-slate-400 font-bold uppercase">
                          {formatDate(comment.createdAt)}
                        </span>
                        
                        {canModify && !isEditing && (
                          <div className="flex items-center space-x-1 pl-1">
                            <button
                              onClick={() => handleEditClick(comment)}
                              className="text-slate-400 hover:text-[#0C4DA2] p-1 rounded-md hover:bg-white transition-colors cursor-pointer"
                              title="Edit comment"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              disabled={isDeleting}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-white transition-colors cursor-pointer disabled:opacity-50"
                              title="Delete comment"
                            >
                              {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {isEditing ? (
                      <div className="mt-1 flex items-center gap-1.5">
                        <input
                          type="text"
                          value={editingContent}
                          onChange={(e) => setEditingContent(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit(comment.id);
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                          className="flex-1 px-2.5 py-1 rounded-lg border border-[#0C4DA2]/40 bg-white text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#0C4DA2]"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveEdit(comment.id)}
                          disabled={isSavingEdit || !editingContent.trim()}
                          className="p-1.5 rounded-lg bg-[#0C4DA2] text-white hover:bg-[#042654] transition-colors cursor-pointer disabled:opacity-50"
                          title="Save edit"
                        >
                          {isSavingEdit ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="p-1.5 rounded-lg bg-slate-200 text-slate-600 hover:bg-slate-300 transition-colors cursor-pointer"
                          title="Cancel"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <p className="text-slate-600 text-xs leading-relaxed font-sans font-medium">
                        {comment.content}
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      <form onSubmit={handleCommentSubmit} className="flex gap-2">
        <img 
          src={currentUser?.image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
          className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-sm shrink-0" 
          alt=""
        />
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
