'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  MapPin, 
  Clock, 
  Search,
  Plus,
  Filter,
  Check,
  CalendarDays,
  Sparkles,
  X,
  ShieldAlert,
  Bell,
  Megaphone,
  Calendar
} from 'lucide-react';
import { Event } from '@curiousbees/types';
import { PremiumCalendarWidget } from './PremiumCalendarWidget';
import EventDetailModal from '@/components/events/EventDetailModal';
import { SRMVenueSelector } from '@/components/events/SRMVenueSelector';
import { motion, AnimatePresence } from 'framer-motion';

type PrismaEvent = Event & {
  status: 'DRAFT' | 'PUBLISHED' | 'REVIEW_REQUIRED' | 'FAILED';
  confidence: number;
  aiModel: string;
  aiProvider: string;
};

const EventFormSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  date: z.string().min(1, 'Date is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  venue: z.string().min(1, 'Venue/Location is required'),
  description: z.string().optional(),
  eventType: z.string().min(1, 'Category/Type is required'),
  registrationLink: z.string().optional()
}).refine((data) => {
  const start = new Date(`1970-01-01T${data.startTime}`);
  const end = new Date(`1970-01-01T${data.endTime}`);
  return end > start;
}, {
  message: "End time must be after the start time.",
  path: ["endTime"],
});

type EventFormValues = z.infer<typeof EventFormSchema>;

export function PremiumEvents() {
  const { events, fetchEvents, createEvent, updateEvent, deleteEvent, currentUser } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<PrismaEvent | null>(null);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  
  // Views & Filter states
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [calendarView, setCalendarView] = useState<'day' | 'week' | 'month' | 'agenda'>('month');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [rsvpList, setRsvpList] = useState<string[]>([]);

  // Fetch events if empty
  useEffect(() => {
    if (events.length === 0) {
      fetchEvents();
    }
  }, [events.length, fetchEvents]);

  // Form handling
  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<EventFormValues>({
    resolver: zodResolver(EventFormSchema),
    defaultValues: {
      title: '',
      date: '',
      startTime: '',
      endTime: '',
      venue: '',
      description: '',
      eventType: 'Conferences',
      registrationLink: ''
    }
  });

  const onSubmit = async (data: EventFormValues) => {
    try {
      const formatTime = (timeStr: string) => {
        if (!timeStr) return '';
        const [h, m] = timeStr.split(':');
        const d = new Date();
        d.setHours(parseInt(h, 10), parseInt(m, 10));
        return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      };
      const timeStr = `${formatTime(data.startTime)} - ${formatTime(data.endTime)}`;

      if (editingEventId) {
        await updateEvent(editingEventId, data.title, data.date, timeStr, data.venue, data.description, data.eventType, data.registrationLink);
      } else {
        await createEvent(data.title, data.date, timeStr, data.venue, data.description, data.eventType, data.registrationLink);
      }
      setIsDrawerOpen(false);
      setEditingEventId(null);
      reset();
      fetchEvents(); // Refresh items
    } catch (e: any) {
      alert(`Error publishing event: ${e.message}`);
    }
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  // Filtered Events for calendar view
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || e.title.toLowerCase().includes(q) || e.venue.toLowerCase().includes(q);
      const matchesCategory = activeCategory === 'All' || 
        (e.eventType && e.eventType.toLowerCase().includes(activeCategory.toLowerCase().split(' ')[0]));
      return matchesSearch && matchesCategory;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [events, searchQuery, activeCategory]);

  const handlePrevDate = () => {
    const nextD = new Date(selectedDate);
    if (calendarView === 'month' || calendarView === 'agenda') {
      nextD.setMonth(nextD.getMonth() - 1);
    } else if (calendarView === 'week') {
      nextD.setDate(nextD.getDate() - 7);
    } else {
      nextD.setDate(nextD.getDate() - 1);
    }
    setSelectedDate(nextD);
  };

  const handleNextDate = () => {
    const nextD = new Date(selectedDate);
    if (calendarView === 'month' || calendarView === 'agenda') {
      nextD.setMonth(nextD.getMonth() + 1);
    } else if (calendarView === 'week') {
      nextD.setDate(nextD.getDate() + 7);
    } else {
      nextD.setDate(nextD.getDate() + 1);
    }
    setSelectedDate(nextD);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-16 select-none text-left">
      <div className="max-w-[1500px] mx-auto p-4 md:p-8 space-y-6">
        
        {/* ─── 1. HEADER BAR ─── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 md:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          {/* Month & Year Title */}
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
              {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
            </h1>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              SRMIST Academic Conferences, Seminars, Competitions & Defense Timelines
            </p>
          </div>
          
          {/* Controls: View Switcher & Date Prev/Next */}
          <div className="flex flex-wrap items-center gap-2.5">
            
            {/* View Mode Switcher Pills */}
            <div className="flex items-center bg-slate-100/90 border border-slate-200/60 rounded-xl p-1">
              {(['day', 'week', 'month', 'agenda'] as const).map((mode) => (
                <button 
                  key={mode}
                  type="button"
                  onClick={() => setCalendarView(mode)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                    calendarView === mode 
                      ? 'bg-[#0C4DA2] text-white shadow-2xs' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            {/* Date Nav Buttons < > */}
            <div className="flex items-center gap-1 bg-white border border-slate-200/80 rounded-xl p-1">
              <button
                type="button"
                onClick={handlePrevDate}
                className="w-7 h-7 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-bold text-xs flex items-center justify-center transition-colors cursor-pointer"
                title="Previous"
              >
                &lt;
              </button>
              <button
                type="button"
                onClick={handleNextDate}
                className="w-7 h-7 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-bold text-xs flex items-center justify-center transition-colors cursor-pointer"
                title="Next"
              >
                &gt;
              </button>
            </div>

            {/* Host Event Action */}
            {(currentUser?.role === 'RESEARCH_SUPERVISOR' || (currentUser?.role as string) === 'INSTITUTE_ADMIN' || (currentUser?.role as string) === 'ADMIN') && (
              <button 
                type="button"
                onClick={() => {
                  setEditingEventId(null);
                  reset({
                    title: '',
                    date: '',
                    startTime: '',
                    endTime: '',
                    venue: '',
                    description: '',
                    eventType: 'Conferences',
                    registrationLink: ''
                  });
                  setIsDrawerOpen(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#0C4DA2] hover:bg-[#042654] text-white rounded-xl text-xs font-bold tracking-wide shadow-2xs transition-all cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Post Event</span>
              </button>
            )}
          </div>
        </div>

        {/* ─── 2. CATEGORY FILTER BAR ─── */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {['All', 'Conferences', 'Workshops', 'Research Seminars', 'Thesis Presentations', 'Competitions'].map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all border whitespace-nowrap cursor-pointer ${
                activeCategory === cat 
                  ? 'bg-[#0C4DA2] text-white border-[#0C4DA2] shadow-2xs' 
                  : 'bg-white text-slate-700 border-slate-200/80 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* ─── 3. FULL-WIDTH CALENDAR CONTENT ─── */}
        <div className="w-full">
          <PremiumCalendarWidget 
            events={filteredEvents} 
            onEventClick={(evt) => setSelectedEvent(evt as PrismaEvent)} 
            view={calendarView}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />
        </div>

      </div>

      {/* 🔎 Event Detail Modal */}
      <EventDetailModal 
        isOpen={!!selectedEvent} 
        onClose={() => setSelectedEvent(null)} 
        event={selectedEvent} 
        onEdit={(event) => {
          setSelectedEvent(null);
          setEditingEventId(event.id);
          
          let st = '';
          let et = '';
          try {
            const parts = (event.time || '').split(' - ');
            const to24h = (t: string) => {
              const match = t.trim().match(/(\d+):(\d+)\s*(AM|PM)/i);
              if (!match) return '';
              let hr = parseInt(match[1], 10);
              const m = match[2];
              const period = match[3].toUpperCase();
              if (period === 'PM' && hr < 12) hr += 12;
              if (period === 'AM' && hr === 12) hr = 0;
              return `${hr.toString().padStart(2, '0')}:${m}`;
            };
            if (parts.length === 2) {
              st = to24h(parts[0]);
              et = to24h(parts[1]);
            }
          } catch (e) {}

          reset({
            title: event.title,
            date: new Date(event.date).toISOString().split('T')[0],
            startTime: st,
            endTime: et,
            venue: event.venue,
            description: event.description || '',
            eventType: event.eventType || 'Conferences',
            registrationLink: event.registrationLink || ''
          });
          setIsDrawerOpen(true);
        }}
        onDelete={async (id) => {
          if (confirm('Are you sure you want to delete this event?')) {
            await deleteEvent(id);
            setSelectedEvent(null);
            fetchEvents();
          }
        }}
      />

      {/* 🚀 SLIDE OUT DRAWER FORM (For Faculty Event Creation) */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 cursor-pointer"
            />
            
            {/* Drawer Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-full sm:max-w-lg bg-white border-l border-slate-200 z-50 p-6 shadow-2xl flex flex-col justify-between overflow-y-auto text-left"
            >
              <div>
                {/* Header */}
                <div className="flex flex-col border-b border-slate-100 pb-5 mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl border border-slate-200/60 bg-slate-50 flex items-center justify-center shrink-0">
                        <Calendar className="w-5 h-5 text-slate-700" />
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-base text-slate-900 leading-none">
                          {editingEventId ? 'Edit Academic Event' : 'Schedule Academic Event'}
                        </h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1.5">
                          RESEARCH EVENT MANAGEMENT
                        </p>
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setIsDrawerOpen(false)} 
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Only authorized research users can publish events.
                  </p>
                </div>

                {/* Form fields */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  
                  {/* SECTION: EVENT INFORMATION */}
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Event Title</label>
                      <input
                        type="text"
                        {...register('title')}
                        placeholder="E.g. PhD Thesis Defense: Neural Fields"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-[#0C4DA2] focus:ring-1 focus:ring-[#0C4DA2] transition-all placeholder:text-slate-400"
                      />
                      {errors.title && <p className="text-[10px] text-red-500 font-semibold">{errors.title.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Category / Type</label>
                      <select
                        {...register('eventType')}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-[#0C4DA2] focus:ring-1 focus:ring-[#0C4DA2] transition-all cursor-pointer"
                      >
                        <option value="Conferences">Conferences</option>
                        <option value="Seminars">Seminars</option>
                        <option value="Workshops">Workshops</option>
                        <option value="Webinars">Webinars</option>
                        <option value="Research Talks">Research Talks</option>
                        <option value="Faculty Development">Faculty Development</option>
                        <option value="PhD / Research Scholar Events">PhD / Research Scholar Events</option>
                        <option value="Other">Other</option>
                      </select>
                      {errors.eventType && <p className="text-[10px] text-red-500 font-semibold">{errors.eventType.message}</p>}
                    </div>
                  </div>

                  {/* SECTION: SCHEDULE */}
                  <div className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Date</label>
                      <input
                        type="date"
                        {...register('date')}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-[#0C4DA2] focus:ring-1 focus:ring-[#0C4DA2] transition-all cursor-pointer"
                      />
                      {errors.date && <p className="text-[10px] text-red-500 font-semibold">{errors.date.message}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Start Time</label>
                        <input
                          type="time"
                          {...register('startTime')}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-[#0C4DA2] focus:ring-1 focus:ring-[#0C4DA2] transition-all cursor-pointer"
                        />
                        {errors.startTime && <p className="text-[10px] text-red-500 font-semibold">{errors.startTime.message}</p>}
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">End Time</label>
                        <input
                          type="time"
                          {...register('endTime')}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-[#0C4DA2] focus:ring-1 focus:ring-[#0C4DA2] transition-all cursor-pointer"
                        />
                        {errors.endTime && <p className="text-[10px] text-red-500 font-semibold">{errors.endTime.message}</p>}
                      </div>
                    </div>
                  </div>

                  {/* SECTION: LOCATION */}
                  <div className="space-y-4 pt-2">
                    <SRMVenueSelector
                      value={watch('venue')}
                      onChange={(val) => setValue('venue', val, { shouldValidate: true })}
                      error={errors.venue?.message}
                    />
                  </div>

                  {/* SECTION: REGISTRATION */}
                  <div className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        Registration Link / Google Form URL (Optional)
                      </label>
                      <input
                        type="url"
                        {...register('registrationLink')}
                        placeholder="https://forms.gle/..."
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-[#0C4DA2] focus:ring-1 focus:ring-[#0C4DA2] transition-all placeholder:text-slate-400"
                      />
                      <p className="text-[11px] text-slate-500 font-medium">Use a Google Form or external registration link for participant registration.</p>
                    </div>
                  </div>

                  {/* SECTION: DESCRIPTION */}
                  <div className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Brief Details</label>
                      <textarea
                        rows={4}
                        {...register('description')}
                        placeholder="Provide speakers, agenda, or key deadlines info..."
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-[#0C4DA2] focus:ring-1 focus:ring-[#0C4DA2] transition-all placeholder:text-slate-400 resize-none"
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 mt-6 pb-4">
                    <button
                      type="button"
                      onClick={() => setIsDrawerOpen(false)}
                      className="px-5 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors text-xs font-bold tracking-wide cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-2.5 bg-[#0C4DA2] hover:bg-[#042654] text-white rounded-xl font-bold text-xs tracking-wide shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {isSubmitting ? 'Publishing...' : (editingEventId ? 'Update Event' : 'Publish Event')}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
