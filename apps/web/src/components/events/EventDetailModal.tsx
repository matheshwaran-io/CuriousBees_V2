'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Calendar, 
  MapPin, 
  Globe, 
  Users, 
  Clock, 
  User, 
  Edit2, 
  Trash2, 
  Share2, 
  ExternalLink,
  Building2
} from 'lucide-react';
import { Event } from '@curiousbees/types';
import { useStore } from '@/store/useStore';
import { formatVenueDisplay } from '@/constants/srmVenues';

type PrismaEvent = Event & {
  status: 'DRAFT' | 'PUBLISHED' | 'REVIEW_REQUIRED' | 'FAILED';
  confidence?: number;
  aiModel?: string;
  aiProvider?: string;
  rawEmail?: string;
  topic?: string;
  speaker?: string;
  organizerEmail?: string;
  eventType?: string;
  registrationLink?: string;
  authorId?: string;
  author?: {
    id: string;
    name: string;
    role: string;
    department?: string;
    image?: string;
  };
  createdAt?: string | Date;
  updatedAt?: string | Date;
};

interface EventDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: PrismaEvent | null;
  onEdit?: (event: PrismaEvent) => void;
  onDelete?: (id: string) => void;
}

export default function EventDetailModal({ 
  isOpen, 
  onClose, 
  event, 
  onEdit, 
  onDelete 
}: EventDetailModalProps) {
  const { currentUser, addToast } = useStore();
  
  if (!event) return null;

  const canEdit = 
    (currentUser?.role as string) === 'INSTITUTE_ADMIN' || 
    (currentUser?.role as string) === 'ADMIN' || 
    (currentUser?.role === 'RESEARCH_SUPERVISOR' && event.authorId === currentUser?.id);

  const parseSafeDate = (d: any) => {
    if (!d) return null;
    const parsed = new Date(d);
    return isNaN(parsed.getTime()) ? null : parsed;
  };

  const eventDateObj = parseSafeDate(event.date);
  const formattedEventDate = eventDateObj 
    ? eventDateObj.toLocaleDateString('en-US', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    : 'Date TBD';

  const postedDateObj = parseSafeDate(event.createdAt);
  const formattedPostedDate = postedDateObj 
    ? postedDateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : null;

  // Author details
  const authorName = event.author?.name || event.speaker || 'SRMIST Directorate';
  const authorRole = event.author?.role 
    ? (event.author.role === 'RESEARCH_SUPERVISOR' ? 'Research Supervisor' : 'Research Scholar')
    : 'Faculty Lead';
  const authorDept = event.author?.department || event.department || 'SRMIST Research Directorate';
  const authorAvatar = event.author?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=0C4DA2&color=fff&size=64`;

  const registrationUrl = event.registrationLink 
    ? (event.registrationLink.startsWith('http://') || event.registrationLink.startsWith('https://') 
        ? event.registrationLink 
        : `https://${event.registrationLink}`)
    : null;

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      addToast('Event link copied to clipboard!', 'success');
    }
  };

  const handleOpenRegistration = () => {
    if (registrationUrl) {
      window.open(registrationUrl, '_blank', 'noopener,noreferrer');
      addToast('Opening official registration link...', 'info');
    }
  };

  const venueInfo = formatVenueDisplay(event.venue);

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
            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs cursor-pointer"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-none text-left">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ type: 'spring', damping: 26, stiffness: 350 }}
              className="w-full max-w-xl max-h-[90vh] bg-white rounded-2xl shadow-xl flex flex-col pointer-events-auto overflow-hidden border border-slate-200"
            >
              {/* ─── 1. MODAL HEADER ─── */}
              <div className="p-5 sm:p-6 border-b border-slate-100 bg-white shrink-0">
                <div className="flex items-center justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-[#0C4DA2] border border-blue-100 px-2.5 py-0.5 rounded-md">
                      {event.eventType || 'Research Event'}
                    </span>
                    {registrationUrl && (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-100 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                        <ExternalLink className="w-3 h-3 text-emerald-600" />
                        Registration Link
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {canEdit && (
                      <>
                        <button
                          type="button"
                          onClick={() => onEdit?.(event)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Edit Event"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete?.(event.id)}
                          className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete Event"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={onClose}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug tracking-tight">
                  {event.title}
                </h2>
              </div>

              {/* ─── 2. MODAL BODY ─── */}
              <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 bg-white">
                
                {/* Posted By Author Bar */}
                <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <img 
                      src={authorAvatar} 
                      alt={authorName} 
                      className="w-9 h-9 rounded-full border border-slate-200 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{authorName}</span>
                        <span className="text-[9px] font-bold text-[#0C4DA2] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                          {authorRole}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium">{authorDept}</p>
                    </div>
                  </div>
                  {formattedPostedDate && (
                    <div className="text-right shrink-0">
                      <span className="block text-[9px] font-bold text-slate-400 uppercase">POSTED ON</span>
                      <span className="text-[11px] font-semibold text-slate-600">{formattedPostedDate}</span>
                    </div>
                  )}
                </div>

                {/* External Registration Link Card */}
                {registrationUrl && (
                  <div className="p-3.5 bg-blue-50/60 border border-blue-100 rounded-xl flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <span className="block text-[9px] font-bold text-[#0C4DA2] uppercase tracking-wider">OFFICIAL REGISTRATION LINK</span>
                      <p className="text-xs font-medium text-slate-700 truncate mt-0.5">{registrationUrl}</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleOpenRegistration}
                      className="px-3.5 py-1.5 bg-[#0C4DA2] hover:bg-[#042654] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      <span>Open Form</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Event Metadata Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  {/* DATE & TIME */}
                  <div className="p-3.5 bg-slate-50/80 border border-slate-100 rounded-xl space-y-1">
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">DATE & TIME</span>
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#0C4DA2] shrink-0" />
                      <span>{formattedEventDate}</span>
                    </div>
                    <div className="text-[11px] font-medium text-slate-600 flex items-center gap-1.5 pl-5">
                      <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{event.time || '10:00 AM - 11:30 AM'}</span>
                    </div>
                  </div>

                  {/* VENUE / LOCATION */}
                  <div className="p-3.5 bg-slate-50/80 border border-slate-100 rounded-xl space-y-1">
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">VENUE / LOCATION</span>
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#0C4DA2] shrink-0" />
                      <span className="truncate">{venueInfo.title}</span>
                    </div>
                    {venueInfo.subtitle && (
                      <p className="text-[11px] font-medium text-slate-600 pl-5 truncate">{venueInfo.subtitle}</p>
                    )}
                    {venueInfo.details && (
                      <p className="text-[10px] font-semibold text-slate-400 pl-5">{venueInfo.details}</p>
                    )}
                  </div>

                  {/* ORGANIZER / DEPARTMENT */}
                  <div className="p-3.5 bg-slate-50/80 border border-slate-100 rounded-xl space-y-1">
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">ORGANIZER / DEPARTMENT</span>
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-[#0C4DA2] shrink-0" />
                      <span className="truncate">{authorDept}</span>
                    </div>
                  </div>

                  {/* TIMEZONE */}
                  <div className="p-3.5 bg-slate-50/80 border border-slate-100 rounded-xl space-y-1">
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">TIMEZONE</span>
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-[#0C4DA2] shrink-0" />
                      <span>Asia/Kolkata (IST)</span>
                    </div>
                  </div>

                </div>

                {/* DESCRIPTION & AGENDA */}
                <div className="space-y-1.5">
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">EVENT DESCRIPTION & AGENDA</span>
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-xs font-normal text-slate-700 leading-relaxed whitespace-pre-line">
                    {event.description || 'Academic research seminar detailing upcoming methodologies, technical sessions, and interdisciplinary collaboration opportunities.'}
                  </div>
                </div>

              </div>

              {/* ─── 3. MODAL FOOTER ─── */}
              <div className="p-4 sm:p-5 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
                <button
                  type="button"
                  onClick={handleShare}
                  className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Share Event</span>
                </button>

                {registrationUrl && (
                  <button
                    type="button"
                    onClick={handleOpenRegistration}
                    className="px-5 py-2 bg-[#0C4DA2] hover:bg-[#042654] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <span>Register / Official Registration</span>
                    <ExternalLink className="w-3.5 h-3.5 text-amber-300" />
                  </button>
                )}
              </div>

            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
