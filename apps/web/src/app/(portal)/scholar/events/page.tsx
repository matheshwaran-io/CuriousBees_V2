'use client';

import React, { useState } from 'react';
import { Bot, Sparkles } from 'lucide-react';
import PipelineStats from '@/components/events/PipelineStats';
import EventCalendar from '@/components/events/EventCalendar';
import LiveEventFeed from '@/components/events/LiveEventFeed';
import EventDetailModal from '@/components/events/EventDetailModal';
import { Event } from '@curiousbees/types';
import { DashboardShell } from '@/components/shared/dashboard-shell';

type PrismaEvent = Event & {
  status: 'DRAFT' | 'PUBLISHED' | 'REVIEW_REQUIRED' | 'FAILED';
  confidence: number;
  aiModel: string;
  aiProvider: string;
};

export default function ScholarEventsPage() {
  const [selectedEvent, setSelectedEvent] = useState<PrismaEvent | null>(null);

  return (
    <DashboardShell>
      {/* 🚀 Notion-style Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#001E4C] via-[#002868] to-[#004495] cb-honeycomb-dark border border-[#004495]/15 p-6 md:p-8 shadow-xl text-left">
        <div className="absolute right-0 top-0 w-96 h-96 bg-[#FEC727]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-12 bottom-0 w-72 h-72 bg-[#004495]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 flex-1 min-w-0">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#FEC727]/25 text-[#FEC727] border border-[#FEC727]/30 text-[10px] font-bold uppercase tracking-wider">
              Academic SLM Calendar
            </span>
            <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-white tracking-tight leading-tight">
              Institutional Events Feed
            </h1>
            <p className="text-xs sm:text-sm text-white/80 font-medium max-w-xl leading-relaxed">
              Real-time schedule of doctoral defenses, institutional seminars, and research workshops ingested and structured automatically.
            </p>
          </div>
        </div>
      </div>

      {/* 📊 Pipeline Statistics */}
      <PipelineStats />

      {/* 🗓️ Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
        {/* Left Column: FullCalendar (Span 2) */}
        <div className="lg:col-span-2">
          <EventCalendar onEventClick={setSelectedEvent as any} />
        </div>

        {/* Right Column: Live Event Feed (Span 1) */}
        <div className="lg:col-span-1">
          <LiveEventFeed onEventClick={setSelectedEvent as any} />
        </div>
      </div>

      {/* 🔎 Event Detail Modal */}
      <EventDetailModal 
        isOpen={!!selectedEvent} 
        onClose={() => setSelectedEvent(null)} 
        event={selectedEvent} 
      />
    </DashboardShell>
  );
}
