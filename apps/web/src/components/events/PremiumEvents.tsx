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
  time: z.string().min(1, 'Time is required'),
  venue: z.string().min(1, 'Venue/Location is required'),
  description: z.string().optional(),
  eventType: z.string().min(1, 'Category/Type is required')
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
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<EventFormValues>({
    resolver: zodResolver(EventFormSchema),
    defaultValues: {
      title: '',
      date: '',
      time: '',
      venue: '',
      description: '',
      eventType: 'Conferences'
    }
  });

  const onSubmit = async (data: EventFormValues) => {
    try {
      if (editingEventId) {
        await updateEvent(editingEventId, data.title, data.date, data.time, data.venue, data.description, data.eventType);
      } else {
        await createEvent(data.title, data.date, data.time, data.venue, data.description, data.eventType);
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 backdrop-blur-xl p-6 md:p-8 rounded-[32px] border border-slate-200/80 shadow-[0_8px_30px_rgb(12,77,162,0.04)]">
          {/* Month & Year Title */}
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
            </h1>
            <p className="text-xs md:text-sm font-medium text-slate-500 mt-1">
              SRMIST Academic Conferences, Seminars, Competitions & Defense Timelines
            </p>
          </div>
          
          {/* Controls: View Switcher & Date Prev/Next */}
          <div className="flex flex-wrap items-center gap-3">
            
            {/* View Mode Switcher Pills */}
            <div className="flex items-center bg-slate-100/80 backdrop-blur-md border border-slate-200/60 rounded-2xl p-1 shadow-inner">
              {(['day', 'week', 'month', 'agenda'] as const).map((mode) => (
                <button 
                  key={mode}
                  onClick={() => setCalendarView(mode)}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold capitalize transition-all cursor-pointer ${
                    calendarView === mode 
                      ? 'bg-[#0C4DA2] text-white shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            {/* Date Nav Buttons < > */}
            <div className="flex items-center gap-1 bg-white border border-slate-200/80 rounded-2xl p-1 shadow-2xs">
              <button
                onClick={handlePrevDate}
                className="w-8 h-8 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-extrabold text-xs flex items-center justify-center transition-colors cursor-pointer"
                title="Previous"
              >
                &lt;
              </button>
              <button
                onClick={handleNextDate}
                className="w-8 h-8 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-extrabold text-xs flex items-center justify-center transition-colors cursor-pointer"
                title="Next"
              >
                &gt;
              </button>
            </div>

            {/* Host Event Action */}
            {(currentUser?.role === 'RESEARCH_SUPERVISOR' || (currentUser?.role as string) === 'INSTITUTE_ADMIN' || (currentUser?.role as string) === 'ADMIN') && (
              <button 
                onClick={() => {
                  setEditingEventId(null);
                  reset({
                    title: '',
                    date: '',
                    time: '',
                    venue: '',
                    description: '',
                    eventType: 'Conferences'
                  });
                  setIsDrawerOpen(true);
                }}
                className="flex items-center gap-2 px-5 py-3 bg-[#0C4DA2] hover:bg-[#042654] text-white rounded-2xl text-xs font-extrabold uppercase tracking-wider shadow-md shadow-blue-900/20 transition-all cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Post Event</span>
              </button>
            )}
          </div>
        </div>

        {/* ─── 2. CATEGORY FILTER BAR ─── */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/80 p-3.5 flex flex-wrap items-center gap-2">
          {['All', 'Conferences', 'Workshops', 'Research Seminars', 'Thesis Presentations', 'Competitions'].map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                activeCategory === cat 
                  ? 'bg-[#0C4DA2] text-white border-[#0C4DA2] shadow-2xs font-extrabold' 
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
          reset({
            title: event.title,
            date: new Date(event.date).toISOString().split('T')[0],
            time: event.time,
            venue: event.venue,
            description: event.description || '',
            eventType: event.eventType || 'Conferences'
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
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-[#004495]/10 flex items-center justify-center shrink-0">
                      <Sparkles className="w-5 h-5 text-[#004495]" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-base text-slate-900 leading-none">
                        {editingEventId ? 'Edit Academic Event' : 'Schedule Academic Event'}
                      </h3>
                      <p className="text-[10px] text-[#004495] font-bold uppercase tracking-wider mt-1.5">
                        {editingEventId ? 'Update Event Details' : 'Verified Principal Investigator Panel'}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsDrawerOpen(false)} 
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Form fields */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Event Title</label>
                    <input
                      type="text"
                      {...register('title')}
                      placeholder="E.g. PhD Thesis Defense: Neural Fields"
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#004495] focus:ring-1 focus:ring-[#004495] transition-all placeholder:text-slate-400"
                    />
                    {errors.title && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.title.message}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Date</label>
                      <input
                        type="date"
                        {...register('date')}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#004495] focus:ring-1 focus:ring-[#004495] transition-all cursor-pointer"
                      />
                      {errors.date && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.date.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Time</label>
                      <input
                        type="text"
                        {...register('time')}
                        placeholder="E.g. 10:00 AM - 11:30 AM"
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#004495] focus:ring-1 focus:ring-[#004495] transition-all placeholder:text-slate-400"
                      />
                      {errors.time && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.time.message}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Venue / Location</label>
                    <input
                      type="text"
                      {...register('venue')}
                      placeholder="E.g. Seminar Hall, Biotech Department"
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#004495] focus:ring-1 focus:ring-[#004495] transition-all placeholder:text-slate-400"
                    />
                    {errors.venue && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.venue.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Category / Type</label>
                    <select
                      {...register('eventType')}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#004495] focus:ring-1 focus:ring-[#004495] transition-all cursor-pointer"
                    >
                      <option value="Conferences">Conferences</option>
                      <option value="Workshops">Workshops</option>
                      <option value="Research Seminars">Research Seminars</option>
                      <option value="Thesis Presentations">Thesis Presentations</option>
                      <option value="Competitions">Competitions</option>
                    </select>
                    {errors.eventType && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.eventType.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Brief Details</label>
                    <textarea
                      rows={5}
                      {...register('description')}
                      placeholder="Provide speakers, agenda, or key deadlines info..."
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#004495] focus:ring-1 focus:ring-[#004495] transition-all placeholder:text-slate-400 resize-none"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 mt-6">
                    <button
                      type="button"
                      onClick={() => setIsDrawerOpen(false)}
                      className="px-5 py-3 border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors text-xs font-bold uppercase tracking-wider cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 bg-[#004495] hover:bg-[#003370] text-white py-3 px-4 rounded-xl font-extrabold text-xs uppercase tracking-wider shadow-md shadow-[#004495]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {isSubmitting ? (editingEventId ? 'Updating...' : 'Publishing...') : (editingEventId ? 'Update Event' : 'Publish Event')}
                    </button>
                  </div>
                </form>
              </div>

              <div className="mt-8 bg-[#FFC107]/10 border border-[#FFC107]/20 p-4 rounded-xl flex items-center space-x-3 text-[10px] text-amber-700 uppercase font-bold">
                <ShieldAlert className="w-5 h-5 shrink-0" />
                <span>Verified Faculty Lead Only. Ensure appropriate department clearance before scheduling milestones.</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
