'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { Send, GraduationCap, UserSquare, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FeedCommentsProps {
  threadId: string;
}

export default function FeedComments({ threadId }: FeedCommentsProps) {
  const { threads, addComment, currentUser } = useStore();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
                    <span className="text-[9px] text-slate-400 font-bold uppercase">
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-slate-600 text-xs leading-relaxed font-sans font-medium">
                    {comment.content}
                  </p>
                </div>
              </motion.div>
            ))}
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
