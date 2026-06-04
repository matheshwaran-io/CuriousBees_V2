'use client';

import React, { useState } from 'react';
import { Bot, Sparkles } from 'lucide-react';
import PipelineStats from '@/components/events/PipelineStats';
import EventCalendar from '@/components/events/EventCalendar';
import LiveEventFeed from '@/components/events/LiveEventFeed';
import ReviewQueue from '@/components/events/ReviewQueue';
import EventDetailModal from '@/components/events/EventDetailModal';
import { Event } from '@curiousbees/types';

// Extend local type
type PrismaEvent = Event & {
  status: 'DRAFT' | 'PUBLISHED' | 'REVIEW_REQUIRED' | 'FAILED';
  confidence: number;
  aiModel: string;
  aiProvider: string;
};

export default function EventsPage() {
  const [selectedEvent, setSelectedEvent] = useState<PrismaEvent | null>(null);

  return (
    <div className="space-y-6 relative select-none text-left flex flex-col pb-12">

      {/* 🚀 Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 border-b border-slate-100 pb-5">
        <div>
          <span className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-1.5">
            <Bot className="w-4 h-4 text-primary" />
            <span>AI Automation Engine</span>
          </span>
          <h2 className="cb-page-title mt-2 flex items-center gap-3">
            <span>Events Feed</span>
            <span className="text-[9px] font-bold bg-[#775a00]/5 text-[#775a00] border border-[#775a00]/15 px-2.5 py-1 rounded-md uppercase tracking-wider animate-pulse">Auto-Pilot Active</span>
          </h2>
          <p className="cb-page-subtitle">
            Real-time visualization of academic events ingested, structured, and published entirely by our local Small Language Model (SLM) pipeline.
          </p>
        </div>
      </div>

      {/* 📊 Pipeline Statistics */}
      <PipelineStats />

      {/* 🗓️ Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: FullCalendar (Span 2) */}
        <div className="lg:col-span-2">
          <EventCalendar onEventClick={setSelectedEvent as any} />
        </div>

        {/* Right Column: Live Event Feed (Span 1) */}
        <div className="lg:col-span-1">
          <LiveEventFeed onEventClick={setSelectedEvent as any} />
        </div>
      </div>

      {/* 🔍 Human-in-the-loop Moderation Queue */}
      <div className="mt-6">
        <ReviewQueue onEventClick={setSelectedEvent as any} />
      </div>

      {/* 🔎 Event Detail Modal */}
      <EventDetailModal 
        isOpen={!!selectedEvent} 
        onClose={() => setSelectedEvent(null)} 
        event={selectedEvent} 
      />

    </div>
  );
}
