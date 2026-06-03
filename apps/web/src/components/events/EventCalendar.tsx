'use client';

import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { Event } from '@curiousbees/types';

type PrismaEvent = Event & {
  status: 'DRAFT' | 'PUBLISHED' | 'REVIEW_REQUIRED' | 'FAILED';
};

const fetchEvents = async () => {
  // Fetch only published and review required events for the main calendar
  const res = await apiFetch('/api/events');
  if (!res.ok) throw new Error('Failed to fetch events');
  return res.json() as Promise<PrismaEvent[]>;
};

export default function EventCalendar({ onEventClick }: { onEventClick: (event: PrismaEvent) => void }) {
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events-calendar'],
    queryFn: fetchEvents,
    refetchInterval: 10000, 
  });

  // Map backend events to FullCalendar event objects
  const calendarEvents = events.map(e => {
    let backgroundColor = '#f3f4f6'; // DRAFT (gray-100)
    let borderColor = '#e5e7eb';
    let textColor = '#374151';
    
    if (e.status === 'PUBLISHED') {
      backgroundColor = '#e0fbf9'; // Teal background
      borderColor = '#b2f2ed';
      textColor = '#007A70'; // High contrast teal text
    } else if (e.status === 'REVIEW_REQUIRED') {
      backgroundColor = '#fffbeb'; // Amber background
      borderColor = '#fde68a';
      textColor = '#b45309'; // High contrast amber text
    } else if (e.status === 'FAILED') {
      backgroundColor = '#fef2f2'; // Red background
      borderColor = '#fecaca';
      textColor = '#b91c1c'; // High contrast red text
    }

    let startDateTime = e.date;
    if (e.time && e.date) {
      try {
        const d = new Date(e.date);
        startDateTime = d.toISOString();
      } catch (err) {}
    }

    return {
      id: e.id,
      title: e.title,
      start: startDateTime,
      extendedProps: { ...e },
      backgroundColor,
      borderColor,
      textColor
    };
  });

  if (isLoading) {
    return (
      <div className="h-[650px] bg-white border border-borderStroke rounded-2xl animate-pulse flex flex-col p-6">
        <div className="h-10 w-1/3 bg-stone-100 rounded-lg mb-6"></div>
        <div className="flex-1 bg-stone-50 rounded-xl border border-stone-100"></div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-borderStroke rounded-2xl p-4 lg:p-6 overflow-hidden">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,listWeek'
        }}
        events={calendarEvents}
        eventClick={(info) => {
          onEventClick(info.event.extendedProps as PrismaEvent);
        }}
        height={600}
        dayMaxEvents={3}
        nowIndicator={true}
      />
    </div>
  );
}
