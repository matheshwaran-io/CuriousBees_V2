'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, AlertTriangle } from 'lucide-react';
import { Thread } from '@curiousbees/types';
import { useStore } from '@/store/useStore';

interface ReportPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  thread: Thread;
}

const REPORT_REASONS = [
  'Spam',
  'Harassment',
  'False Information',
  'Copyright Violation',
  'Inappropriate Content',
  'Other'
];

export default function ReportPostModal({ isOpen, onClose, thread }: ReportPostModalProps) {
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const reportThread = useStore((state) => state.reportThread);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await reportThread(thread.id, reason, description);
      
      onClose();
      // Reset form
      setReason(REPORT_REASONS[0]);
      setDescription('');
      // You would typically show a success toast here
    } catch (error) {
      console.error('Failed to report post:', error);
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
            className="fixed inset-0 bg-black/65 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-white dark:bg-[#101D30] border border-slate-200 dark:border-white/[0.10] rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] z-50 overflow-hidden flex flex-col text-left"
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-white/[0.08] bg-rose-50/50 dark:bg-rose-950/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-[#F5F7FA]">Report Post</h2>
                  <p className="text-xs font-bold text-slate-500 dark:text-[#A7B3C5]">Help us keep the community safe.</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white dark:hover:bg-[#172942] text-slate-500 dark:text-[#A7B3C5] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-5">
              <div className="flex flex-col gap-3">
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-[#718096]">Select a reason</label>
                <div className="flex flex-col gap-2">
                  {REPORT_REASONS.map(r => (
                    <label key={r} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-white/[0.08] hover:border-rose-200 dark:hover:border-rose-500/30 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 cursor-pointer transition-colors group">
                      <input 
                        type="radio" 
                        name="report_reason" 
                        value={r} 
                        checked={reason === r}
                        onChange={(e) => setReason(e.target.value)}
                        className="w-4 h-4 text-rose-600 focus:ring-rose-500 border-slate-300 dark:border-slate-600"
                      />
                      <span className="text-sm font-bold text-slate-700 dark:text-[#F5F7FA] group-hover:text-rose-700 dark:group-hover:text-rose-400">{r}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-[#718096]">Additional Details (Optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide more context..."
                  className="w-full min-h-[100px] p-4 bg-slate-50 dark:bg-[#0B1728] border border-slate-200 dark:border-white/[0.10] rounded-2xl text-slate-800 dark:text-[#F5F7FA] text-sm outline-none resize-none focus:bg-white dark:focus:bg-[#0B1728] focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all placeholder:text-slate-400 dark:placeholder:text-[#718096]"
                />
              </div>
            </div>

            <div className="p-6 pt-0 flex justify-end gap-3 bg-slate-50/50 dark:bg-[#0B1728] mt-auto border-t border-slate-100 dark:border-white/[0.08] py-4">
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-full text-sm font-bold text-slate-600 dark:text-[#A7B3C5] hover:bg-slate-200 dark:hover:bg-[#172942] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-black rounded-full flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Submit Report
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
