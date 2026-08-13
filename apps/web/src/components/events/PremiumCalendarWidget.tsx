'use client';

import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  MapPin, 
  Calendar as CalendarIcon, 
  ExternalLink
} from 'lucide-react';
import { Event } from '@curiousbees/types';
import { formatVenueDisplay } from '@/constants/srmVenues';

interface PremiumCalendarWidgetProps {
  events: Event[];
  onEventClick: (event: Event) => void;
  view: 'month' | 'week' | 'day' | 'agenda';
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

const HOURS = [
  { label: '6:00 AM', hour: 6 },
  { label: '7:00 AM', hour: 7 },
  { label: '8:00 AM', hour: 8 },
  { label: '9:00 AM', hour: 9 },
  { label: '10:00 AM', hour: 10 },
  { label: '11:00 AM', hour: 11 },
  { label: '12:00 PM', hour: 12 },
  { label: '1:00 PM', hour: 13 },
  { label: '2:00 PM', hour: 14 },
  { label: '3:00 PM', hour: 15 },
  { label: '4:00 PM', hour: 16 },
  { label: '5:00 PM', hour: 17 },
  { label: '6:00 PM', hour: 18 },
  { label: '7:00 PM', hour: 19 },
  { label: '8:00 PM', hour: 20 },
  { label: '9:00 PM', hour: 21 },
];

const HOUR_HEIGHT = 64; // px per hour slot

/**
 * Safely parses any date string (ISO '2026-08-15T00:00:00.000Z', '2026-08-15', or Date object)
 * into a consistent local YYYY-M-D key for calendar cell indexing.
 */
function getEventDateKey(dateInput: string | Date | null | undefined): string | null {
  if (!dateInput) return null;
  try {
    let d: Date;
    if (typeof dateInput === 'string') {
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
        const [y, m, day] = dateInput.split('-').map(Number);
        return `${y}-${m - 1}-${day}`;
      }
      d = new Date(dateInput);
    } else {
      d = dateInput;
    }
    if (isNaN(d.getTime())) return null;
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  } catch {
    return null;
  }
}

function parseEventTimeRange(timeStr: string | undefined) {
  if (!timeStr) return { startHour: 9, startMinute: 0, durationMinutes: 60, displayTime: '10:00 AM' };
  try {
    const parts = timeStr.split(' - ');
    const parseTime = (t: string) => {
      const match = t.trim().match(/(\d+)(?::(\d+))?\s*(AM|PM)?/i);
      if (!match) return { h: 9, m: 0 };
      let h = parseInt(match[1], 10);
      const m = match[2] ? parseInt(match[2], 10) : 0;
      const period = match[3]?.toUpperCase();
      if (period === 'PM' && h < 12) h += 12;
      if (period === 'AM' && h === 12) h = 0;
      return { h, m };
    };

    const start = parseTime(parts[0]);
    const clampedStartHour = Math.max(6, Math.min(21, start.h));

    if (parts.length > 1) {
      const end = parseTime(parts[1]);
      let duration = (end.h - start.h) * 60 + (end.m - start.m);
      if (duration <= 0) duration = 60;
      return { 
        startHour: clampedStartHour, 
        startMinute: start.m, 
        durationMinutes: Math.min(duration, 300),
        displayTime: timeStr
      };
    }
    return { startHour: clampedStartHour, startMinute: start.m, durationMinutes: 60, displayTime: timeStr };
  } catch (e) {
    return { startHour: 9, startMinute: 0, durationMinutes: 60, displayTime: timeStr || '10:00 AM' };
  }
}

export function PremiumCalendarWidget({ 
  events = [], 
  onEventClick, 
  view, 
  selectedDate, 
  onDateChange 
}: PremiumCalendarWidgetProps) {
  
  // Group events by date string (YYYY-M-D)
  const eventsByDate = useMemo(() => {
    const map = new Map<string, Event[]>();
    (events || []).forEach(e => {
      if (!e || !e.date) return;
      const key = getEventDateKey(e.date);
      if (!key) return;
      if (!map.has(key)) map.set(key, []);
      map.get(key)?.push(e);
    });
    return map;
  }, [events]);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // --- MONTH VIEW DATA ---
  const daysInMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1).getDay();
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const monthDays = useMemo(() => {
    const arr = [];
    for (let i = 0; i < startOffset; i++) {
      arr.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      arr.push(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), i));
    }
    const remainingCells = (7 - (arr.length % 7)) % 7;
    for (let i = 0; i < remainingCells; i++) {
      arr.push(null);
    }
    return arr;
  }, [selectedDate, daysInMonth, startOffset]);

  // --- WEEK VIEW DATA ---
  const weekDays = useMemo(() => {
    const arr = [];
    const dayOfWeek = selectedDate.getDay();
    const startOfWeek = new Date(selectedDate);
    const distanceToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startOfWeek.setDate(selectedDate.getDate() - distanceToMonday);

    for (let i = 0; i < 7; i++) {
      arr.push(new Date(startOfWeek));
      startOfWeek.setDate(startOfWeek.getDate() + 1);
    }
    return arr;
  }, [selectedDate]);

  // Agenda Filter State
  const [agendaFilter, setAgendaFilter] = useState<'all' | 'today' | 'upcoming' | 'this_week'>('upcoming');
  const [miniCalDate, setMiniCalDate] = useState<Date>(selectedDate);
  const [agendaSelectedDate, setAgendaSelectedDate] = useState<Date | null>(selectedDate);

  const miniDaysInMonth = new Date(miniCalDate.getFullYear(), miniCalDate.getMonth() + 1, 0).getDate();
  const miniFirstDay = new Date(miniCalDate.getFullYear(), miniCalDate.getMonth(), 1).getDay();
  const miniStartOffset = miniFirstDay === 0 ? 6 : miniFirstDay - 1;

  const miniMonthDays = useMemo(() => {
    const arr = [];
    for (let i = 0; i < miniStartOffset; i++) arr.push(null);
    for (let i = 1; i <= miniDaysInMonth; i++) {
      arr.push(new Date(miniCalDate.getFullYear(), miniCalDate.getMonth(), i));
    }
    return arr;
  }, [miniCalDate, miniDaysInMonth, miniStartOffset]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden w-full text-left select-none">
      
      {/* ─── 1. DAY VIEW (Google Calendar Standard Positioned Grid) ─── */}
      {view === 'day' && (
        <div className="w-full">
          {/* Day Header Bar */}
          <div className="border-b border-slate-200 py-3 text-center bg-slate-50 font-bold text-xs text-[#0C4DA2] uppercase tracking-wider">
            {selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
          </div>

          {/* Timetable Vertical Grid Container */}
          <div className="flex relative overflow-y-auto max-h-[700px]">
            {/* Time Column */}
            <div className="w-20 shrink-0 border-r border-slate-100 bg-slate-50/50">
              {HOURS.map(hObj => (
                <div key={hObj.label} style={{ height: `${HOUR_HEIGHT}px` }} className="text-[10px] font-semibold text-slate-400 p-2 text-right border-b border-slate-100 flex items-start justify-end">
                  {hObj.label}
                </div>
              ))}
            </div>

            {/* Event Canvas Grid Area */}
            <div className="flex-1 relative" style={{ height: `${HOURS.length * HOUR_HEIGHT}px` }}>
              {/* Background Grid Lines */}
              {HOURS.map(hObj => (
                <div 
                  key={hObj.label} 
                  style={{ height: `${HOUR_HEIGHT}px` }} 
                  className="border-b border-slate-100 w-full"
                />
              ))}

              {/* Render Positioned Event Cards */}
              {(() => {
                const key = getEventDateKey(selectedDate);
                const dayEvents = key ? (eventsByDate.get(key) || []) : [];

                if (dayEvents.length === 0) {
                  return (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-300 text-xs font-semibold">
                      No scheduled events for this day
                    </div>
                  );
                }

                return dayEvents.map(event => {
                  const { startHour, startMinute, durationMinutes, displayTime } = parseEventTimeRange(event.time);
                  const topOffset = (startHour - 6 + startMinute / 60) * HOUR_HEIGHT;
                  const cardHeight = Math.max((durationMinutes / 60) * HOUR_HEIGHT, 48);
                  const venueInfo = formatVenueDisplay(event.venue);

                  return (
                    <div
                      key={event.id}
                      onClick={() => onEventClick(event)}
                      style={{
                        top: `${Math.max(0, topOffset)}px`,
                        height: `${cardHeight}px`,
                        left: '12px',
                        right: '12px'
                      }}
                      className="absolute bg-blue-50 border-l-4 border-l-[#0C4DA2] border border-blue-200/80 rounded-lg p-2.5 shadow-2xs hover:bg-blue-100/80 hover:shadow-xs transition-all cursor-pointer overflow-hidden z-10"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-bold uppercase tracking-wider bg-white px-1.5 py-0.5 rounded border border-blue-200 text-[#0C4DA2]">
                            {event.eventType || 'Event'}
                          </span>
                          <span className="text-xs font-bold text-slate-900 truncate">{event.title}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-medium text-slate-600 shrink-0">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[#0C4DA2]" />
                            {displayTime}
                          </span>
                          {venueInfo.title && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-rose-500" />
                              {venueInfo.title}
                            </span>
                          )}
                        </div>
                      </div>
                      {event.description && cardHeight > 60 && (
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-1 font-normal">{event.description}</p>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ─── 2. WEEK VIEW (Positioned 7-Day Vertical Columns) ─── */}
      {view === 'week' && (
        <div className="w-full overflow-x-auto">
          <div className="min-w-[900px]">
            {/* Week Days Header Bar */}
            <div className="grid grid-cols-8 border-b border-slate-200 bg-slate-50">
              <div className="p-3 border-r border-slate-200 w-16" />
              {weekDays.map(date => {
                const isSelected = selectedDate.toDateString() === date.toDateString();
                const isToday = new Date().toDateString() === date.toDateString();
                const dayLabel = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'][(date.getDay() + 6) % 7];
                const dateNum = date.getDate();

                return (
                  <div 
                    key={date.toISOString()}
                    onClick={() => onDateChange(date)}
                    className={`py-2.5 text-center border-r border-slate-200 last:border-r-0 cursor-pointer font-bold text-xs transition-colors ${
                      isSelected ? 'bg-blue-50/60' : 'hover:bg-slate-100/50'
                    }`}
                  >
                    <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">{dayLabel}</div>
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                      isToday ? 'bg-[#0C4DA2] text-white shadow-2xs' : isSelected ? 'text-[#0C4DA2] font-black' : 'text-slate-800'
                    }`}>
                      {dateNum}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Timetable Grid Canvas */}
            <div className="flex relative overflow-y-auto max-h-[700px]">
              {/* Time Column */}
              <div className="w-16 shrink-0 border-r border-slate-200 bg-slate-50/50">
                {HOURS.map(hObj => (
                  <div key={hObj.label} style={{ height: `${HOUR_HEIGHT}px` }} className="text-[10px] font-semibold text-slate-400 p-1.5 text-right border-b border-slate-100 flex items-start justify-end">
                    {hObj.label}
                  </div>
                ))}
              </div>

              {/* 7 Columns for Days */}
              <div className="grid grid-cols-7 flex-1 relative" style={{ height: `${HOURS.length * HOUR_HEIGHT}px` }}>
                {/* Vertical Grid Dividers */}
                {weekDays.map((date, dayIdx) => {
                  const key = getEventDateKey(date);
                  const dayEvents = key ? (eventsByDate.get(key) || []) : [];

                  return (
                    <div key={date.toISOString()} className="relative border-r border-slate-100 last:border-r-0 h-full">
                      {/* Hour lines */}
                      {HOURS.map(hObj => (
                        <div key={hObj.label} style={{ height: `${HOUR_HEIGHT}px` }} className="border-b border-slate-100 w-full" />
                      ))}

                      {/* Positioned Events for Day */}
                      {dayEvents.map(event => {
                        const { startHour, startMinute, durationMinutes, displayTime } = parseEventTimeRange(event.time);
                        const topOffset = (startHour - 6 + startMinute / 60) * HOUR_HEIGHT;
                        const cardHeight = Math.max((durationMinutes / 60) * HOUR_HEIGHT, 40);

                        return (
                          <div
                            key={event.id}
                            onClick={() => onEventClick(event)}
                            style={{
                              top: `${Math.max(0, topOffset)}px`,
                              height: `${cardHeight}px`,
                              left: '4px',
                              right: '4px'
                            }}
                            className="absolute bg-blue-50 border-l-3 border-l-[#0C4DA2] border border-blue-200/80 rounded-md p-1.5 shadow-2xs hover:bg-blue-100 transition-all cursor-pointer overflow-hidden z-10"
                            title={`${event.title} (${displayTime})`}
                          >
                            <div className="text-[10px] font-bold text-slate-900 truncate leading-tight">{event.title}</div>
                            <div className="text-[9px] font-semibold text-[#0C4DA2] truncate mt-0.5">{displayTime}</div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── 3. MONTH VIEW ─── */}
      {view === 'month' && (
        <div className="w-full">
          {/* Day of Week Labels */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
            {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(day => (
              <div key={day} className="py-2.5 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider border-r border-slate-100 last:border-r-0">
                {day}
              </div>
            ))}
          </div>

          {/* Month Calendar Grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 bg-white">
            {monthDays.map((date, i) => {
              if (!date) {
                return <div key={`empty-${i}`} className="bg-slate-50/30 min-h-[110px]" />;
              }

              const key = getEventDateKey(date);
              const dayEvents = key ? (eventsByDate.get(key) || []) : [];
              const isToday = new Date().toDateString() === date.toDateString();
              const isSelected = selectedDate.toDateString() === date.toDateString();

              const maxVisible = 2;
              const visibleEvents = dayEvents.slice(0, maxVisible);
              const extraCount = dayEvents.length - maxVisible;

              return (
                <div
                  key={i}
                  onClick={() => onDateChange(date)}
                  className={`min-h-[110px] p-2 hover:bg-slate-50/60 transition-all flex flex-col justify-between cursor-pointer group ${
                    isSelected ? 'bg-blue-50/30' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full transition-all ${
                      isToday 
                        ? 'bg-[#0C4DA2] text-white shadow-2xs' 
                        : isSelected 
                          ? 'text-[#0C4DA2] font-black bg-blue-100/60' 
                          : 'text-slate-700 group-hover:text-[#0C4DA2]'
                    }`}>
                      {date.getDate()}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0C4DA2]" />
                    )}
                  </div>

                  {/* Event chips inside date cell */}
                  <div className="space-y-1 mt-1 flex-1">
                    {visibleEvents.map(event => (
                      <div
                        key={event.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick(event);
                        }}
                        className="bg-slate-100 border border-slate-200/70 text-slate-800 px-1.5 py-0.5 rounded text-[10px] font-medium leading-tight truncate hover:bg-blue-50 hover:text-[#0C4DA2] hover:border-blue-200 transition-colors"
                        title={event.title}
                      >
                        {event.title}
                      </div>
                    ))}
                    {extraCount > 0 && (
                      <span className="inline-block text-[9px] font-bold text-[#0C4DA2] px-1">
                        +{extraCount} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── 4. AGENDA VIEW ─── */}
      {view === 'agenda' && (
        <div className="p-4 md:p-6 flex flex-col lg:flex-row gap-6 items-start bg-slate-50/40">
          
          {/* Left Mini Calendar Picker */}
          <div className="w-full lg:w-72 bg-white rounded-xl border border-slate-200 p-5 shadow-2xs shrink-0">
            <div className="flex items-center justify-between mb-3">
              <button 
                type="button"
                onClick={() => setMiniCalDate(new Date(miniCalDate.getFullYear(), miniCalDate.getMonth() - 1, 1))}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                {monthNames[miniCalDate.getMonth()]} {miniCalDate.getFullYear()}
              </h4>
              <button 
                type="button"
                onClick={() => setMiniCalDate(new Date(miniCalDate.getFullYear(), miniCalDate.getMonth() + 1, 1))}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Mini Days Header */}
            <div className="grid grid-cols-7 text-center text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              {['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'].map(d => <span key={d}>{d}</span>)}
            </div>

            {/* Mini Grid */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {miniMonthDays.map((d, idx) => {
                if (!d) return <div key={idx} />;
                const isSelected = agendaSelectedDate?.toDateString() === d.toDateString();
                const isToday = new Date().toDateString() === d.toDateString();

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setAgendaSelectedDate(d);
                      onDateChange(d);
                    }}
                    className={`h-7 w-7 mx-auto flex items-center justify-center rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-[#0C4DA2] text-white shadow-2xs font-bold' 
                        : isToday 
                          ? 'text-[#0C4DA2] bg-blue-50 font-bold' 
                          : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {d.getDate()}
                  </button>
                );
              })}
            </div>

            {/* Agenda Quick Filter Pills */}
            <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
              <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Quick Filter</span>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'upcoming', label: 'Upcoming' },
                  { id: 'today', label: 'Today' },
                  { id: 'this_week', label: 'This Week' },
                  { id: 'all', label: 'All Events' }
                ].map(f => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      setAgendaFilter(f.id as any);
                      if (f.id === 'today') {
                        setAgendaSelectedDate(new Date());
                        onDateChange(new Date());
                      } else {
                        setAgendaSelectedDate(null);
                      }
                    }}
                    className={`py-1.5 px-2 text-[10px] font-bold rounded-lg border transition-colors cursor-pointer text-center ${
                      agendaFilter === f.id
                        ? 'bg-blue-50 border-blue-200 text-[#0C4DA2]'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Agenda List Area */}
          <div className="flex-1 min-w-0 w-full bg-white rounded-xl border border-slate-200 p-5 md:p-6 shadow-2xs min-h-[420px] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-slate-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  {agendaSelectedDate 
                    ? `Events for ${agendaSelectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                    : `Upcoming Research Events`
                  }
                </h3>
              </div>
              <span className="text-[10px] font-semibold text-slate-400">
                {events.length} Total Events
              </span>
            </div>

            {(() => {
              const now = new Date();
              now.setHours(0, 0, 0, 0);

              const filteredList = (events || []).filter(e => {
                if (!e || !e.date) return false;

                if (agendaSelectedDate) {
                  return getEventDateKey(e.date) === getEventDateKey(agendaSelectedDate);
                }

                const eDate = new Date(e.date);
                if (isNaN(eDate.getTime())) return false;
                eDate.setHours(0, 0, 0, 0);

                if (agendaFilter === 'today') {
                  return getEventDateKey(e.date) === getEventDateKey(now);
                }

                if (agendaFilter === 'upcoming') {
                  return eDate.getTime() >= now.getTime();
                }

                if (agendaFilter === 'this_week') {
                  const weekEnd = new Date(now);
                  weekEnd.setDate(now.getDate() + 7);
                  return eDate.getTime() >= now.getTime() && eDate.getTime() <= weekEnd.getTime();
                }

                return true;
              }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

              if (filteredList.length === 0) {
                return (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-xs font-semibold py-16">
                    No research events found for the selected filter.
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  {filteredList.map(event => {
                    const venueInfo = formatVenueDisplay(event.venue);
                    const formattedDate = new Date(event.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    });

                    return (
                      <div
                        key={event.id}
                        onClick={() => onEventClick(event)}
                        className="bg-white rounded-xl p-4 border border-slate-200 hover:border-[#0C4DA2] shadow-2xs hover:shadow-xs transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="inline-block px-2.5 py-0.5 rounded-md bg-blue-50 text-[#0C4DA2] border border-blue-100 text-[10px] font-bold uppercase tracking-wider">
                              {event.eventType || 'Academic Event'}
                            </span>
                            {(event as any).registrationLink && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-[10px] font-semibold">
                                <ExternalLink className="w-3 h-3" />
                                Form Registration
                              </span>
                            )}
                          </div>
                          <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#0C4DA2] transition-colors leading-snug">
                            {event.title}
                          </h4>
                          {event.description && (
                            <p className="text-[11px] text-slate-500 mt-1 line-clamp-1 font-normal">{event.description}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-[11px] font-medium text-slate-500 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                          <span className="flex items-center gap-1 font-semibold text-slate-700">
                            <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                            {formattedDate}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {event.time || '10:00 AM'}
                          </span>
                          {venueInfo.title && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              {venueInfo.title}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

        </div>
      )}

    </div>
  );
}
