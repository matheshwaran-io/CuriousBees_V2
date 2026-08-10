import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, Clock, MapPin } from 'lucide-react';
import { Event } from '@curiousbees/types';

interface PremiumCalendarWidgetProps {
  events: Event[];
  onEventClick: (event: Event) => void;
  view: 'month' | 'week' | 'day';
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function PremiumCalendarWidget({ events, onEventClick, view, selectedDate, onDateChange }: PremiumCalendarWidgetProps) {
  // Group events by date string (YYYY-MM-DD)
  const eventsByDate = useMemo(() => {
    const map = new Map<string, Event[]>();
    events.forEach(e => {
      const d = new Date(e.date);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)?.push(e);
    });
    return map;
  }, [events]);

  const getPillStyle = (eventType: string = '') => {
    const t = eventType.toLowerCase();
    if (t.includes('conference')) {
      return {
        bg: 'bg-gradient-to-r from-blue-50/80 to-white hover:from-blue-100/50 hover:to-white',
        border: 'border-l-[4px] border-[#004495] border-y border-r border-slate-100',
        text: 'text-[#004495]',
      };
    }
    if (t.includes('workshop')) {
      return {
        bg: 'bg-gradient-to-r from-amber-50/80 to-white hover:from-amber-100/50 hover:to-white',
        border: 'border-l-[4px] border-[#FFC107] border-y border-r border-slate-100',
        text: 'text-amber-800',
      };
    }
    if (t.includes('competition')) {
      return {
        bg: 'bg-gradient-to-r from-indigo-50/80 to-white hover:from-indigo-100/50 hover:to-white',
        border: 'border-l-[4px] border-indigo-500 border-y border-r border-slate-100',
        text: 'text-indigo-900',
      };
    }
    return {
      bg: 'bg-gradient-to-r from-slate-50/80 to-white hover:from-slate-100/50 hover:to-white',
      border: 'border-l-[4px] border-slate-400 border-y border-r border-slate-100',
      text: 'text-slate-700',
    };
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // --- MONTH VIEW LOGIC ---
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

  // --- WEEK VIEW LOGIC ---
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

  // --- NAVIGATION ---
  const handlePrev = () => {
    if (view === 'month') {
      onDateChange(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1));
    } else if (view === 'week') {
      const nextD = new Date(selectedDate);
      nextD.setDate(selectedDate.getDate() - 7);
      onDateChange(nextD);
    } else {
      const nextD = new Date(selectedDate);
      nextD.setDate(selectedDate.getDate() - 1);
      onDateChange(nextD);
    }
  };

  const handleNext = () => {
    if (view === 'month') {
      onDateChange(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1));
    } else if (view === 'week') {
      const nextD = new Date(selectedDate);
      nextD.setDate(selectedDate.getDate() + 7);
      onDateChange(nextD);
    } else {
      const nextD = new Date(selectedDate);
      nextD.setDate(selectedDate.getDate() + 1);
      onDateChange(nextD);
    }
  };

  const getHeaderTitle = () => {
    if (view === 'month') {
      return `${monthNames[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;
    }
    if (view === 'week') {
      const start = weekDays[0];
      const end = weekDays[6];
      if (start.getMonth() === end.getMonth()) {
        return `${monthNames[start.getMonth()]} ${start.getFullYear()}`;
      }
      return `${monthNames[start.getMonth()]} - ${monthNames[end.getMonth()]} ${start.getFullYear()}`;
    }
    return selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="bg-white rounded-[32px] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.04)] overflow-hidden w-full">
      
      {/* Calendar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-8 border-b border-slate-100 bg-gradient-to-b from-slate-50/40 to-white gap-6">
        <div className="flex items-center gap-5">
          <div className="p-3 bg-[#004495]/5 rounded-2xl">
            <Sparkles className="w-6 h-6 text-[#004495]" />
          </div>
          <div>
            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight font-display">
              {getHeaderTitle()}
            </h3>
            <p className="text-xs font-bold text-slate-400 mt-0.5 capitalize">{view} view active</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-100/80 backdrop-blur-md rounded-2xl p-1 shadow-inner">
          <button 
            onClick={handlePrev} 
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-white rounded-xl transition-all shadow-sm cursor-pointer active:scale-95"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button 
            onClick={handleNext} 
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-white rounded-xl transition-all shadow-sm cursor-pointer active:scale-95"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* --- MONTH VIEW --- */}
      {view === 'month' && (
        <>
          <div className="grid grid-cols-7 bg-slate-50/30 border-b border-slate-100">
            {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(day => (
              <div key={day} className="py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-100/50 last:border-r-0">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 bg-slate-100 gap-[1px] border-b border-slate-100">
            {monthDays.map((date, i) => {
              if (!date) {
                return <div key={`empty-${i}`} className="bg-[#FAFBFC]/60 min-h-[160px]" />;
              }

              const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
              const dayEvents = eventsByDate.get(key) || [];
              const isToday = new Date().toDateString() === date.toDateString();

              return (
                <div 
                  key={i} 
                  className={`bg-white min-h-[160px] p-3 hover:bg-slate-50/30 transition-all duration-300 flex flex-col justify-between group border border-transparent hover:border-slate-100 ${
                    isToday ? 'ring-2 ring-inset ring-[#004495]/20' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className={`w-8 h-8 flex items-center justify-center rounded-2xl text-xs font-bold transition-all ${
                      isToday 
                        ? 'bg-gradient-to-br from-[#004495] to-[#0c4da2] text-white shadow-md shadow-blue-500/20' 
                        : 'text-slate-500 group-hover:text-slate-800'
                    }`}>
                      {date.getDate()}
                    </div>
                  </div>
                  
                  {/* Event pills inside cells */}
                  <div className="space-y-1.5 mt-3 overflow-y-auto max-h-[110px] flex-1 flex flex-col justify-end pr-0.5 scrollbar-thin">
                    {dayEvents.map(event => {
                      const style = getPillStyle(event.eventType);
                      return (
                        <div 
                          key={event.id}
                          onClick={() => onEventClick(event)}
                          className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold leading-normal truncate cursor-pointer transition-all duration-300 hover:-translate-y-0.5 shadow-sm hover:shadow-md ${style.bg} ${style.border} ${style.text}`}
                          title={`${event.title} (${event.time})`}
                        >
                          <span className="opacity-75 font-semibold mr-1">{event.time.split(' ')[0]}</span>
                          {event.title}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* --- WEEK VIEW --- */}
      {view === 'week' && (
        <div className="grid grid-cols-7 bg-slate-100 gap-[1px]">
          {weekDays.map((date, i) => {
            const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
            const dayEvents = eventsByDate.get(key) || [];
            const isToday = new Date().toDateString() === date.toDateString();

            return (
              <div 
                key={i} 
                className={`bg-white min-h-[450px] p-4 flex flex-col justify-between border border-transparent hover:border-slate-100 transition-all duration-300 ${
                  isToday ? 'ring-2 ring-inset ring-[#004495]/20' : ''
                }`}
              >
                <div className="border-b border-slate-100 pb-3 flex flex-col items-center">
                  <span className="text-[9px] font-black text-slate-400 tracking-wider mb-1">
                    {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][date.getDay()]}
                  </span>
                  <div className={`w-8 h-8 flex items-center justify-center rounded-xl text-sm font-extrabold ${
                    isToday 
                      ? 'bg-gradient-to-br from-[#004495] to-[#0c4da2] text-white shadow-md shadow-blue-500/20' 
                      : 'text-slate-800'
                  }`}>
                    {date.getDate()}
                  </div>
                </div>

                <div className="space-y-3 mt-4 overflow-y-auto flex-1 flex flex-col justify-start pr-0.5 scrollbar-thin">
                  {dayEvents.length === 0 ? (
                    <div className="text-[10px] text-slate-300 text-center italic mt-10">No events</div>
                  ) : (
                    dayEvents.map(event => {
                      const style = getPillStyle(event.eventType);
                      return (
                        <div 
                          key={event.id}
                          onClick={() => onEventClick(event)}
                          className={`px-3 py-2.5 rounded-xl text-[10px] font-bold leading-relaxed cursor-pointer transition-all duration-300 hover:-translate-y-0.5 shadow-sm hover:shadow-md ${style.bg} ${style.border} ${style.text}`}
                        >
                          <p className="font-extrabold truncate">{event.title}</p>
                          <div className="flex items-center gap-1 mt-1 text-[9px] opacity-75 font-semibold">
                            <Clock className="w-3.5 h-3.5 shrink-0" />
                            <span>{event.time}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* --- DAY VIEW --- */}
      {view === 'day' && (
        <div className="p-6 md:p-8 bg-slate-50/50">
          {(() => {
            const key = `${selectedDate.getFullYear()}-${selectedDate.getMonth()}-${selectedDate.getDate()}`;
            const dayEvents = eventsByDate.get(key) || [];

            if (dayEvents.length === 0) {
              return (
                <div className="bg-white rounded-3xl border border-slate-100 p-16 text-center shadow-sm">
                  <p className="text-slate-400 font-bold text-sm">No events scheduled for this day.</p>
                  <p className="text-slate-300 text-[11px] mt-1 font-semibold">Select another day or switch views to explore schedule.</p>
                </div>
              );
            }

            return (
              <div className="space-y-4">
                {dayEvents.map(event => {
                  const style = getPillStyle(event.eventType);
                  return (
                    <div 
                      key={event.id}
                      onClick={() => onEventClick(event)}
                      className={`bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md cursor-pointer transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 border-l-[6px] ${
                        event.eventType?.toLowerCase().includes('conference') 
                          ? 'border-l-[#004495]' 
                          : event.eventType?.toLowerCase().includes('workshop') 
                            ? 'border-l-[#FFC107]' 
                            : 'border-l-indigo-500'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center shrink-0">
                          <Sparkles className="w-5 h-5 text-[#004495]" />
                        </div>
                        <div>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[9px] font-extrabold uppercase tracking-wider mb-2">
                            {event.eventType}
                          </span>
                          <h4 className="text-lg font-bold text-slate-900 leading-snug">{event.title}</h4>
                          <p className="text-xs font-semibold text-slate-500 mt-2 leading-relaxed max-w-2xl">{event.description || 'No description provided.'}</p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 text-xs font-bold text-slate-500 shrink-0">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-slate-400" />
                          {event.time}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-slate-400" />
                          {event.venue}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-6 p-6 border-t border-slate-100 bg-slate-50/20">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#004495]" />
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Conferences</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-400" />
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Workshops</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#FFC107]" />
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Competitions</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-400" />
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Seminars</span>
        </div>
      </div>
    </div>
  );
}
