'use client';

import { useState } from 'react';
import { Plus, PenTool, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FeedFAB() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="flex flex-col gap-2 mb-2"
          >
            <button
              onClick={() => {
                setIsOpen(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
                // We can also trigger focus on the composer if needed
              }}
              className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-full shadow-lg border border-slate-100 hover:bg-slate-50 transition-colors group cursor-pointer"
            >
              <span className="text-xs font-bold text-slate-700">Write Post</span>
              <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-blue-600 group-hover:bg-indigo-100 transition-colors">
                <PenTool className="w-4 h-4" />
              </div>
            </button>
            
            <button
              onClick={() => {
                setIsOpen(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
                document.getElementById('paper-upload')?.click();
              }}
              className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-full shadow-lg border border-slate-100 hover:bg-slate-50 transition-colors group cursor-pointer"
            >
              <span className="text-xs font-bold text-slate-700">Upload Paper</span>
              <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-100 transition-colors">
                <FileText className="w-4 h-4" />
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-gradient-to-tr from-[#0C4DA2] to-blue-600 text-white flex items-center justify-center rounded-full shadow-[0_8px_30px_rgb(109,40,217,0.4)] hover:shadow-[0_12px_40px_rgb(109,40,217,0.6)] transition-all duration-300 active:scale-90 group cursor-pointer border-2 border-white"
        title="Actions"
      >
        <Plus className={`w-6 h-6 text-white transition-transform duration-300 ${isOpen ? 'rotate-45' : 'group-hover:rotate-90'}`} />
      </button>
    </div>
  );
}
