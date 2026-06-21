'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { Thread } from '@curiousbees/types';
import { useStore } from '@/store/useStore';

interface EditPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  thread: Thread;
}

export default function EditPostModal({ isOpen, onClose, thread }: EditPostModalProps) {
  const [content, setContent] = useState(thread.content);
  const [type, setType] = useState(thread.type || 'RESEARCH_UPDATE');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const updateThread = useStore((state) => state.updateThread);

  useEffect(() => {
    if (isOpen) {
      setContent(thread.content);
      setType(thread.type || 'RESEARCH_UPDATE');
    }
  }, [isOpen, thread]);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    
    setIsSubmitting(true);
    try {
      await updateThread(thread.id, { content, type });
      onClose();
    } catch (error) {
      console.error('Failed to update post:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-lg bg-white rounded-3xl shadow-2xl z-50 overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-xl font-black text-slate-900">Edit Post</h2>
              <button 
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4">
              <select 
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-[#0C4DA2]/20 focus:border-[#0C4DA2] transition-all"
              >
                <option value="RESEARCH_UPDATE">Research Update</option>
                <option value="PUBLICATION">Publication</option>
                <option value="QUESTION">Question</option>
                <option value="COLLABORATION_REQUEST">Collaboration Request</option>
                <option value="ACHIEVEMENT">Achievement</option>
                <option value="ANNOUNCEMENT">Announcement</option>
              </select>

              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What do you want to share?"
                className="w-full min-h-[150px] p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 text-sm outline-none resize-none focus:bg-white focus:ring-2 focus:ring-[#0C4DA2]/20 focus:border-[#0C4DA2] transition-all"
              />
            </div>

            <div className="p-6 pt-0 flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-full text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !content.trim()}
                className="px-6 py-2.5 bg-[#0C4DA2] hover:bg-[#042654] text-white text-sm font-black rounded-full flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Save Changes
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
