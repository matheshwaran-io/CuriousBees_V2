'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  UserCheck,
  Building,
  GraduationCap,
  BookOpen,
  Info,
  Loader2,
  Send,
  AlertCircle
} from 'lucide-react';
import { useStore } from '@/store/useStore';

interface RequestSupervisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  supervisor: {
    id: string;
    name?: string | null;
    department?: string | null;
    faculty?: string | null;
    supervisorProfile?: {
      researchArea?: string | null;
      institution?: string | null;
      campus?: string | null;
    } | null;
  };
  onSuccess?: () => void;
}

export function RequestSupervisorModal({
  isOpen,
  onClose,
  supervisor,
  onSuccess
}: RequestSupervisorModalProps) {
  const { currentUser, requestSupervisor } = useStore();
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await requestSupervisor(supervisor.id, message);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit supervisor request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const supervisorName = supervisor.name || 'Faculty Member';
  const supervisorDept = supervisor.department || 'SRMIST Department';
  const supervisorCampus = supervisor.supervisorProfile?.campus || supervisor.faculty || 'SRMIST Kattankulathur';
  const supervisorArea = supervisor.supervisorProfile?.researchArea || 'Research Supervision';

  const scholarName = currentUser?.name || currentUser?.email || 'Scholar';
  const scholarDept = currentUser?.department || 'Department of Research';
  const scholarArea = (currentUser as any)?.scholarProfile?.researchArea || (currentUser as any)?.bio || 'PhD Research';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10 max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0C4DA2] to-[#042654] p-6 text-white relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                  <UserCheck className="w-5 h-5 text-[#FFC828]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Request Supervisor</h3>
                  <p className="text-xs text-white/70">SRMIST Research Collaboration</p>
                </div>
              </div>
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
            {errorMessage && (
              <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-800">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <p>{errorMessage}</p>
              </div>
            )}

            {/* Target Supervisor Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#0C4DA2]">
                Target Supervisor
              </span>
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{supervisorName}</h4>
                  <div className="flex flex-wrap gap-y-1 gap-x-3 text-xs text-slate-600 mt-1">
                    <span className="flex items-center gap-1"><Building className="w-3.5 h-3.5 text-slate-400" /> {supervisorDept}</span>
                    <span className="flex items-center gap-1"><GraduationCap className="w-3.5 h-3.5 text-slate-400" /> {supervisorCampus}</span>
                  </div>
                  {supervisorArea && (
                    <div className="flex items-center gap-1 text-xs text-slate-600 mt-1">
                      <BookOpen className="w-3.5 h-3.5 text-[#0C4DA2]" />
                      <span className="font-medium text-slate-700">{supervisorArea}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Scholar Profile Summary */}
            <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4 space-y-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
                Your Scholar Profile
              </span>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">{scholarName}</span>
                <span className="text-[11px] text-slate-500 font-medium">{scholarDept}</span>
              </div>
              <p className="text-[11px] text-[#0C4DA2] font-semibold flex items-center gap-1">
                <BookOpen className="w-3 h-3" /> Area: {scholarArea}
              </p>
            </div>

            {/* Explanatory Notice */}
            <div className="flex items-start gap-2.5 p-3.5 bg-[#FFC828]/10 border border-[#FFC828]/25 rounded-2xl text-xs text-slate-700 leading-relaxed font-medium">
              <Info className="w-4 h-4 text-[#B88608] shrink-0 mt-0.5" />
              <p>
                You are requesting this faculty member to become your research supervisor. Your request will remain pending until the supervisor accepts it.
              </p>
            </div>

            {/* Optional Scholar Message */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Optional Message to Supervisor</span>
                <span className="text-[10px] text-slate-400 font-normal">Optional</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Briefly explain your research objectives or why you would like this faculty member to supervise your research..."
                rows={3}
                className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0C4DA2]/40"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-[#0C4DA2] hover:bg-[#003370] text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting Request...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Supervisor Request</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
