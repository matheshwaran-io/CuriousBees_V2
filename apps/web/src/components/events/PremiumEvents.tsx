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
  const [calendarView, setCalendarView] = useState<'month' | 'week' | 'day' | 'list'>('list');
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

  // Categories list based on screenshot
  const categoriesList = ['All', 'Conferences', 'Workshops', 'Research Seminars', 'Thesis Presentations', 'Competitions'];

  // Filtered Events for grid & list
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || e.title.toLowerCase().includes(q) || e.venue.toLowerCase().includes(q);
      
      const matchesCategory = activeCategory === 'All' || 
        (e.eventType && e.eventType.toLowerCase().includes(activeCategory.toLowerCase().split(' ')[0]));
      
      return matchesSearch && matchesCategory;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [events, searchQuery, activeCategory]);

  // Announcements List (Sidebar Notices)
  const announcementsList = useMemo(() => {
    return events
      .filter(e => e.eventType?.toLowerCase().includes('notice') || e.eventType?.toLowerCase().includes('announcement') || e.priority === 'HIGH')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [events]);

  // Event Reminders (Sidebar)
  const remindersList = useMemo(() => {
    const now = new Date().getTime();
    return events
      .filter(e => new Date(e.date).getTime() > now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 4);
  }, [events]);

  const toggleRsvp = (id: string) => {
    if (rsvpList.includes(id)) {
      setRsvpList(rsvpList.filter(eid => eid !== id));
    } else {
      setRsvpList([...rsvpList, id]);
    }
  };

  const formatMonth = (dateStr: string | Date) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  };

  const formatDay = (dateStr: string | Date) => {
    const d = new Date(dateStr);
    return d.getDate().toString().padStart(2, '0');
  };

  const getUrgencyBadge = (dateStr: string | Date) => {
    const daysLeft = Math.ceil((new Date(dateStr).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 0) return { text: 'Now', style: 'bg-red-50 text-red-600 border border-red-200' };
    if (daysLeft === 1) return { text: 'in 1 day', style: 'bg-red-50 text-red-600 border border-red-200 animate-pulse' };
    return { text: `${daysLeft} days left`, style: 'bg-amber-50 text-amber-700 border border-amber-200' };
  };

  return (
    <div className="min-h-screen bg-[#FAFBFC] pb-12 select-none text-left">
      <div className="max-w-[1600px] mx-auto p-4 md:p-8 space-y-6">
        
        {/* 🚀 TOP HEADER BAR */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight font-display">Event Calendar</h1>
            <p className="text-sm text-slate-500 mt-1">
              Conferences, workshops, seminars, thesis presentations and competitions.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search events..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#004495] focus:ring-1 focus:ring-[#004495] shadow-sm transition-all placeholder:text-slate-400"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>

            {/* View Switchers */}
            <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
              <button 
                onClick={() => setCalendarView('list')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  calendarView === 'list' ? 'bg-[#004495] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                List
              </button>
              <button 
                onClick={() => setCalendarView('month')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  calendarView === 'month' ? 'bg-[#004495] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Month
              </button>
              <button 
                onClick={() => setCalendarView('week')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  calendarView === 'week' ? 'bg-[#004495] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Week
              </button>
              <button 
                onClick={() => setCalendarView('day')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  calendarView === 'day' ? 'bg-[#004495] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Day
              </button>
            </div>

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
                className="flex items-center gap-2 px-6 py-2.5 bg-[#004495] hover:bg-[#003370] text-white rounded-full text-xs font-bold uppercase tracking-wider shadow-md shadow-blue-900/20 transition-all duration-300 active:scale-95 cursor-pointer"
              >
                <Plus className="w-4.5 h-4.5 shrink-0" />
                <span>Host event</span>
              </button>
            )}
          </div>
        </div>

        {/* 🚀 CATEGORY FILTER BAR */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_15px_-5px_rgba(0,0,0,0.05)] p-4 flex flex-wrap items-center gap-2.5">
          {categoriesList.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all border cursor-pointer ${
                activeCategory === cat 
                  ? 'bg-[#004495] text-white border-[#004495] shadow-sm shadow-blue-500/10 scale-102 font-extrabold' 
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-100/50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* 🚀 MAIN CONTENT GRID (2-COLUMN) */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* LEFT: CALENDAR VIEW OR EVENT LIST FEED */}
          <div className="flex-1 min-w-0 w-full">
            {calendarView === 'list' ? (
              <div className="space-y-4">
                {filteredEvents.length === 0 ? (
                  <div className="bg-white border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] p-12 text-center rounded-2xl">
                    <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-4" />
                    <h4 className="text-slate-900 font-bold text-base">No Scheduled Events</h4>
                    <p className="text-slate-500 text-sm max-w-sm mx-auto mt-2 leading-relaxed">
                      Try selecting another filter category or adjusting your search queries.
                    </p>
                  </div>
                ) : (
                  filteredEvents.map(event => {
                    const isRsvpd = rsvpList.includes(event.id);
                    return (
                      <div 
                        key={event.id}
                        onClick={() => setSelectedEvent(event as PrismaEvent)}
                        className="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_4px_20px_-8px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_-5px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-6 cursor-pointer group"
                      >
                        <div className="flex items-center gap-5">
                          {/* Date circle */}
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#004495] to-[#0c4da2] text-white flex flex-col items-center justify-center shrink-0 shadow-md">
                            <span className="text-[9px] font-black uppercase tracking-widest opacity-90 leading-tight">
                              {formatMonth(event.date)}
                            </span>
                            <span className="text-xl font-black leading-none mt-0.5">
                              {formatDay(event.date)}
                            </span>
                          </div>

                          {/* Detail block */}
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-base font-extrabold text-slate-800 group-hover:text-[#004495] transition-colors leading-snug">
                                {event.title}
                              </h3>
                              <span className="inline-flex items-center px-2.5 py-0.5 bg-blue-50 text-[#004495] rounded-lg text-[9px] font-black uppercase tracking-wider">
                                {event.eventType || 'Event'}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-bold text-slate-400">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-slate-300" />
                                {event.time}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-slate-300" />
                                {event.venue}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* RSVP button */}
                        <div className="shrink-0 sm:self-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => toggleRsvp(event.id)}
                            className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all w-full sm:w-auto ${
                              isRsvpd 
                               ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
                               : 'bg-white border border-[#004495] text-[#004495] hover:bg-blue-50'
                            }`}
                          >
                            {isRsvpd ? '✓ RSVP\'d' : 'RSVP'}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              <PremiumCalendarWidget 
                events={filteredEvents} 
                onEventClick={(evt) => setSelectedEvent(evt as PrismaEvent)} 
                view={calendarView}
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
              />
            )}
          </div>

          {/* RIGHT SIDEBAR: UPCOMING NOTICES & REMINDERS */}
          <aside className="w-full lg:w-[350px] shrink-0 space-y-6">
            
            {/* Announcements Section */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_12px_40px_rgba(0,0,0,0.03)] p-5">
              <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-slate-50">
                <Megaphone className="w-4.5 h-4.5 text-[#FFC107]" />
                <h3 className="text-sm font-extrabold text-slate-800 tracking-tight uppercase">Announcements</h3>
              </div>
              
              <div className="space-y-4">
                {announcementsList.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No recent notices.</p>
                ) : (
                  announcementsList.map(ann => {
                    const daysLeft = Math.ceil((new Date(ann.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                    let badgeText = 'University Notice';
                    if (ann.eventType?.toLowerCase().includes('competition')) badgeText = 'Competition';
                    if (ann.eventType?.toLowerCase().includes('seminar')) badgeText = 'Department';

                    return (
                      <div key={ann.id} className="pb-4 border-b border-slate-50 last:border-0 last:pb-0 flex flex-col gap-1 text-left">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[9px] font-black uppercase tracking-wider text-[#004495] bg-blue-50 px-2 py-0.5 rounded">
                            {badgeText}
                          </span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase">
                            {daysLeft <= 0 ? 'Today' : `${daysLeft}d ago`}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-700 leading-normal hover:text-[#004495] transition-colors cursor-pointer" onClick={() => setSelectedEvent(ann as PrismaEvent)}>
                          {ann.title}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Event Reminders Section */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_12px_40px_rgba(0,0,0,0.03)] p-5">
              <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-slate-50">
                <Bell className="w-4.5 h-4.5 text-[#004495]" />
                <h3 className="text-sm font-extrabold text-slate-800 tracking-tight uppercase">Event Reminders</h3>
              </div>
              
              <div className="space-y-3.5">
                {remindersList.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No upcoming reminders.</p>
                ) : (
                  remindersList.map(rem => {
                    const badge = getUrgencyBadge(rem.date);
                    return (
                      <div 
                        key={rem.id} 
                        onClick={() => setSelectedEvent(rem as PrismaEvent)}
                        className="flex gap-3 bg-slate-50/50 p-3 rounded-2xl border border-slate-100 hover:border-[#004495]/20 hover:bg-slate-50 transition-all duration-300 cursor-pointer"
                      >
                        <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                          <Bell className="w-4.5 h-4.5 text-[#004495]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-extrabold text-slate-800 line-clamp-1 uppercase tracking-wide">{rem.title}</p>
                          <p className="text-[10px] text-slate-500 mt-1 font-semibold">
                            Tomorrow • {rem.time}
                          </p>
                          <span className={`inline-block mt-2 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${badge.style}`}>
                            {badge.text}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </aside>

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
