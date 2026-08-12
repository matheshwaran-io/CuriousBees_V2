'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, MapPin, Building, Tag, Mail, Edit2, Trash2, Globe, Users, Clock } from 'lucide-react';
import { Event } from '@curiousbees/types';
import { useStore } from '@/store/useStore';

type PrismaEvent = Event & {
  status: 'DRAFT' | 'PUBLISHED' | 'REVIEW_REQUIRED' | 'FAILED';
  confidence: number;
  aiModel: string;
  aiProvider: string;
  rawEmail?: string;
  topic?: string;
  speaker?: string;
  organizerEmail?: string;
  eventType?: string;
  authorId?: string;
};

interface EventDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: PrismaEvent | null;
  onEdit?: (event: PrismaEvent) => void;
  onDelete?: (id: string) => void;
}

export default function EventDetailModal({ isOpen, onClose, event, onEdit, onDelete }: EventDetailModalProps) {
  const { currentUser } = useStore();
  
  if (!event) return null;

  const canEdit = 
    (currentUser?.role as string) === 'INSTITUTE_ADMIN' || 
    (currentUser?.role as string) === 'ADMIN' || 
    (currentUser?.role === 'RESEARCH_SUPERVISOR' && event.authorId === currentUser?.id);

  const formattedDate = new Date(event.date).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm cursor-pointer"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="w-full max-w-xl max-h-[85vh] bg-white rounded-3xl shadow-2xl flex flex-col pointer-events-auto overflow-hidden text-left border border-slate-200/80"
            >
              {/* Header */}
              <div className="flex items-start justify-between p-6 sm:p-8 border-b border-slate-100 bg-white">
                <div className="pr-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest bg-[#0C4DA2]/10 text-[#0C4DA2] px-2.5 py-0.5 rounded-full">
                      {event.eventType || 'Academic Event'}
                    </span>
                  </div>
                  <h2 className="text-xl font-extrabold text-slate-900 leading-snug">{event.title}</h2>
                </div>
                
                <div className="flex items-center gap-2 shrink-0">
                  {canEdit && (
                    <>
                      <button
                        onClick={() => onEdit?.(event)}
                        className="p-2 rounded-xl hover:bg-blue-50 text-slate-400 hover:text-[#0C4DA2] transition-colors cursor-pointer"
                        title="Edit Event"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete?.(event.id)}
                        className="p-2 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Delete Event"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Scrollable Content matching Reference Screenshot 4 */}
              <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
                
                {/* Field 1: COMPANY / ORGANIZER */}
                <div className="space-y-1">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">ORGANIZER / DEPARTMENT</h4>
                  <p className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Building className="w-4 h-4 text-[#0C4DA2]" />
                    {event.speaker || 'SRMIST Research Directorate'}
                  </p>
                </div>

                {/* Field 2: DATE & TIME */}
                <div className="space-y-1">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">DATE & TIME</h4>
                  <p className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-500" />
                    {formattedDate} • {event.time || '10:00 AM'}
                  </p>
                </div>

                {/* Field 3: LOCATION / TIMEZONE */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">VENUE / LOCATION</h4>
                    <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      {event.venue || 'Main Auditorium'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">TIMEZONE</h4>
                    <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-slate-500" />
                      Asia/Kolkata
                    </p>
                  </div>
                </div>

                {/* Field 4: ACCESS */}
                <div className="space-y-1">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">ACCESS / AUDIENCE</h4>
                  <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-500" />
                    Research Scholars + Research Supervisors
                  </p>
                </div>

                {/* Field 5: PROCESS / CATEGORY */}
                <div className="space-y-1">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">PROCESS / TYPE</h4>
                  <p className="text-xs font-bold text-[#0C4DA2] bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100 inline-block">
                    {event.eventType || 'Academic Seminar'}
                  </p>
                </div>

                {/* Field 6: DESCRIPTION */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">DESCRIPTION</h4>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs font-medium text-slate-700 leading-relaxed whitespace-pre-line">
                    {event.description || 'No additional event details provided. Please contact the department coordinator for further information.'}
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
