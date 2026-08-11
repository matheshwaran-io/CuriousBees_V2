'use client';

import React, { useState } from 'react';
import { Mail, CalendarIcon, Shield } from 'lucide-react';
import PendingEmailQueue from '@/components/events/PendingEmailQueue';
import PipelineStats from '@/components/events/PipelineStats';
import EventCalendar from '@/components/events/EventCalendar';
import EventDetailModal from '@/components/events/EventDetailModal';
import { Event } from '@curiousbees/types';
import { DashboardShell } from '@/components/shared/dashboard-shell';

type PrismaEvent = Event & {
  status: 'DRAFT' | 'PUBLISHED' | 'REVIEW_REQUIRED' | 'FAILED';
  confidence: number;
  aiModel: string;
  aiProvider: string;
};

export default function AdminEventsPage() {
  const [selectedEvent, setSelectedEvent] = useState<PrismaEvent | null>(null);

  return (
    <DashboardShell>
      {/* 🚀 Admin Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#001E4C] via-[#002868] to-[#004495] cb-honeycomb-dark border border-[#004495]/15 p-6 md:p-8 shadow-xl text-left mb-6">
        <div className="absolute right-0 top-0 w-96 h-96 bg-[#FEC727]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 flex-1 min-w-0">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold uppercase tracking-wider">
              <Shield className="w-3 h-3" /> Institute Admin Portal
            </span>
            <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-white tracking-tight leading-tight">
              Inbound Email Events & Intake Moderation
            </h1>
            <p className="text-xs sm:text-sm text-white/80 font-medium max-w-xl leading-relaxed">
              Review staged email event submissions sent to <code className="text-amber-300 bg-white/10 px-1.5 py-0.5 rounded font-mono">events@send.akbattery.in</code>. Approve to publish to calendar and dispatch scholar notifications.
            </p>
          </div>
        </div>
      </div>

      {/* 📩 Staged Inbound Email Intake Queue */}
      <PendingEmailQueue />

      {/* 📊 Pipeline Statistics */}
      <PipelineStats />

      {/* 🗓️ Full Event Calendar */}
      <div className="cb-card p-6 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-sm text-left mt-6">
        <h2 className="text-base font-extrabold text-[#0C4DA2] mb-4 flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-[#0C4DA2]" /> Published Institutional Events Calendar
        </h2>
        <EventCalendar onEventClick={setSelectedEvent as any} />
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
