import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Clock, MapPin, Calendar as CalendarIcon, Sparkles } from 'lucide-react';
import { Event } from '@curiousbees/types';

interface PremiumCalendarWidgetProps {
  events: Event[];
  onEventClick: (event: Event) => void;
  view: 'month' | 'week' | 'day' | 'agenda';
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

const HOURS = [
  '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
  '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM'
];

export function PremiumCalendarWidget({ events, onEventClick, view, selectedDate, onDateChange }: PremiumCalendarWidgetProps) {
  
  // Group events by date string (YYYY-M-D)
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

  // Mini Calendar State for Agenda View
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
    <div className="bg-white rounded-[32px] border border-slate-200/80 shadow-[0_8px_30px_rgb(12,77,162,0.04)] overflow-hidden w-full text-left">
      
      {/* ─── 1. DAY VIEW (Reference Screenshot 1) ─── */}
      {view === 'day' && (
        <div className="w-full">
          {/* Day Header Row */}
          <div className="border-b border-slate-100 py-3.5 text-center bg-blue-50/50 font-extrabold text-xs text-[#0C4DA2] uppercase tracking-wider">
            {selectedDate.getDate()} {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][selectedDate.getDay()]}
          </div>

          {/* Timetable Grid */}
          <div className="divide-y divide-slate-100">
            {HOURS.map(hour => {
              const key = `${selectedDate.getFullYear()}-${selectedDate.getMonth()}-${selectedDate.getDate()}`;
              const dayEvents = eventsByDate.get(key) || [];
              const matchingEvents = dayEvents.filter(e => e.time?.toLowerCase().includes(hour.split(':')[0]));

              return (
                <div key={hour} className="flex min-h-[60px] group hover:bg-slate-50/60 transition-colors">
                  <div className="w-24 shrink-0 p-3.5 text-[11px] font-bold text-slate-400 border-r border-slate-100 flex items-center justify-end pr-4">
                    {hour}
                  </div>
                  <div className="flex-1 p-2 space-y-1.5 min-h-[60px]">
                    {matchingEvents.map(event => (
                      <div
                        key={event.id}
                        onClick={() => onEventClick(event)}
                        className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-2xl text-xs font-extrabold cursor-pointer hover:shadow-2xs transition-all flex items-center justify-between"
                      >
                        <span className="truncate">{event.title}</span>
                        <span className="text-[10px] text-emerald-600 font-bold shrink-0 ml-2">{event.venue}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── 2. WEEK VIEW (Reference Screenshot 2) ─── */}
      {view === 'week' && (
        <div className="w-full overflow-x-auto">
          <div className="min-w-[950px]">
            {/* Week Days Header Bar */}
            <div className="grid grid-cols-8 border-b border-slate-100 bg-slate-50/50">
              <div className="p-3.5 border-r border-slate-100" />
              {weekDays.map(date => {
                const isSelected = selectedDate.toDateString() === date.toDateString();
                const dayLabel = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'][(date.getDay() + 6) % 7];
                const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;

                return (
                  <div 
                    key={date.toISOString()}
                    onClick={() => onDateChange(date)}
                    className={`py-3.5 text-center border-r border-slate-100 last:border-r-0 cursor-pointer font-extrabold text-xs transition-colors ${
                      isSelected ? 'text-[#0C4DA2] bg-blue-50/60' : 'text-slate-500 hover:bg-slate-100/50'
                    }`}
                  >
                    {dayLabel} {dateStr}
                  </div>
                );
              })}
            </div>

            {/* Timetable Hourly Rows */}
            <div className="divide-y divide-slate-100">
              {HOURS.map(hour => (
                <div key={hour} className="grid grid-cols-8 min-h-[58px]">
                  <div className="p-2.5 text-[10px] font-bold text-slate-400 border-r border-slate-100 flex items-center justify-end pr-3">
                    {hour}
                  </div>
                  {weekDays.map(date => {
                    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
                    const dayEvents = eventsByDate.get(key) || [];
                    const matchingEvents = dayEvents.filter(e => e.time?.toLowerCase().includes(hour.split(':')[0]));

                    return (
                      <div key={date.toISOString()} className="p-1 border-r border-slate-100 last:border-r-0 min-h-[58px] hover:bg-slate-50/50 transition-colors">
                        {matchingEvents.map(event => (
                          <div
                            key={event.id}
                            onClick={() => onEventClick(event)}
                            className="bg-blue-50 border border-blue-200/80 text-[#0C4DA2] p-2 rounded-xl text-[10px] font-extrabold truncate cursor-pointer hover:shadow-2xs"
                            title={event.title}
                          >
                            {event.title}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── 3. MONTH VIEW (Reference Screenshot 3) ─── */}
      {view === 'month' && (
        <div className="w-full">
          {/* Day of Week Labels */}
          <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50">
            {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(day => (
              <div key={day} className="py-3.5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-100/60 last:border-r-0">
                {day}
              </div>
            ))}
          </div>

          {/* Month Calendar Grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 bg-white">
            {monthDays.map((date, i) => {
              if (!date) {
                return <div key={`empty-${i}`} className="bg-slate-50/40 min-h-[130px]" />;
              }

              const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
              const dayEvents = eventsByDate.get(key) || [];
              const isToday = new Date().toDateString() === date.toDateString();

              return (
                <div
                  key={i}
                  onClick={() => onDateChange(date)}
                  className="min-h-[130px] p-3 hover:bg-slate-50/50 transition-all flex flex-col justify-between cursor-pointer group"
                >
                  <span className={`text-xs font-extrabold w-7 h-7 flex items-center justify-center rounded-full transition-all ${
                    isToday ? 'bg-[#0C4DA2] text-white shadow-2xs' : 'text-slate-700 group-hover:text-[#0C4DA2]'
                  }`}>
                    {date.getDate()}
                  </span>

                  {/* Event pill chips inside date cell */}
                  <div className="space-y-1 mt-2">
                    {dayEvents.map(event => (
                      <div
                        key={event.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick(event);
                        }}
                        className="bg-emerald-50 border border-emerald-200/80 text-emerald-800 px-2.5 py-1 rounded-xl text-[10px] font-extrabold leading-tight truncate hover:bg-emerald-100 transition-colors shadow-2xs"
                      >
                        {event.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── 4. AGENDA VIEW (Reference Screenshot 5) ─── */}
      {view === 'agenda' && (
        <div className="p-6 md:p-8 flex flex-col lg:flex-row gap-8 items-start bg-slate-50/30">
          
          {/* Left Mini Calendar Picker */}
          <div className="w-full lg:w-80 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-2xs shrink-0">
            <div className="flex items-center justify-between mb-4">
              <button 
                onClick={() => setMiniCalDate(new Date(miniCalDate.getFullYear(), miniCalDate.getMonth() - 1, 1))}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                {monthNames[miniCalDate.getMonth()]} {miniCalDate.getFullYear()}
              </h4>
              <button 
                onClick={() => setMiniCalDate(new Date(miniCalDate.getFullYear(), miniCalDate.getMonth() + 1, 1))}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Mini Days Header */}
            <div className="grid grid-cols-7 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
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
                    onClick={() => {
                      setAgendaSelectedDate(d);
                      onDateChange(d);
                    }}
                    className={`h-8 w-8 mx-auto flex items-center justify-center rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-emerald-600 text-white shadow-2xs' 
                        : isToday 
                          ? 'text-[#0C4DA2] bg-blue-50 font-black' 
                          : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {d.getDate()}
                  </button>
                );
              })}
            </div>

            {/* Clear / Apply Actions */}
            <div className="grid grid-cols-2 gap-3 mt-6 pt-5 border-t border-slate-100">
              <button
                onClick={() => setAgendaSelectedDate(null)}
                className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-black uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
              >
                Clear
              </button>
              <button
                onClick={() => {
                  if (agendaSelectedDate) onDateChange(agendaSelectedDate);
                }}
                className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-2xs transition-colors cursor-pointer"
              >
                Apply
              </button>
            </div>
          </div>

          {/* Right Agenda List Area */}
          <div className="flex-1 min-w-0 w-full bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-2xs min-h-[440px] flex flex-col">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-4 mb-6">
              <CalendarIcon className="w-4 h-4 text-slate-400" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                {agendaSelectedDate 
                  ? `Events for ${agendaSelectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                  : 'Select date range'
                }
              </h3>
            </div>

            {(() => {
              const filteredList = events.filter(e => {
                if (!agendaSelectedDate) return true;
                return new Date(e.date).toDateString() === agendaSelectedDate.toDateString();
              });

              if (filteredList.length === 0) {
                return (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-xs font-bold py-16">
                    Select a date range to view tasks
                  </div>
                );
              }

              return (
                <div className="space-y-4">
                  {filteredList.map(event => (
                    <div
                      key={event.id}
                      onClick={() => onEventClick(event)}
                      className="bg-white rounded-2xl p-5 border border-slate-200/80 hover:border-[#0C4DA2] shadow-2xs hover:shadow-xs transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                    >
                      <div>
                        <span className="inline-block px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-[10px] font-black uppercase tracking-wider mb-2">
                          {event.eventType || 'Academic Event'}
                        </span>
                        <h4 className="text-sm font-extrabold text-slate-900 group-hover:text-[#0C4DA2] transition-colors">
                          {event.title}
                        </h4>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-1 font-medium">{event.description}</p>
                      </div>

                      <div className="flex items-center gap-4 text-xs font-bold text-slate-500 shrink-0">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {event.time || '10:00 AM'}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {event.venue || 'Campus'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

        </div>
      )}

    </div>
  );
}
