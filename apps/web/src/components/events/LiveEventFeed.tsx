'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { Bot, CheckCircle, Zap } from 'lucide-react';
import { Event } from '@curiousbees/types';

type PrismaEvent = Event & {
  status: 'DRAFT' | 'PUBLISHED' | 'REVIEW_REQUIRED' | 'FAILED';
  confidence: number;
  aiModel: string;
  aiProvider: string;
};

const fetchFeed = async () => {
  // Fetch all recent events limit 10
  const res = await apiFetch('/api/events?limit=10');
  if (!res.ok) throw new Error('Failed to fetch events feed');

  const data = await res.json() as PrismaEvent[];
  // Sort descending by created date
  return data.sort((a, b) => new Date(b.createdAt || Date.now()).getTime() - new Date(a.createdAt || Date.now()).getTime());
};

export default function LiveEventFeed({ onEventClick }: { onEventClick: (event: PrismaEvent) => void }) {
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events-feed'],
    queryFn: fetchFeed,
    refetchInterval: 5000, 
  });

  if (isLoading) {
    return (
      <div className="bg-white border border-borderStroke rounded-2xl p-4 h-[650px] animate-pulse">
        <div className="h-6 w-32 bg-stone-100 rounded-md mb-6" />
        <div className="space-y-4">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="h-20 bg-stone-50 rounded-xl border border-stone-100" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-borderStroke rounded-2xl p-4 flex flex-col h-[650px]">
      <div className="flex items-center justify-between mb-4 px-2">
        <h3 className="font-display font-bold text-black flex items-center gap-2 text-[16px]">
          <Zap className="w-4 h-4 text-tealGlow fill-tealGlow" />
          Live Ingestion
        </h3>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tealGlow opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-tealGlow"></span>
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin scrollbar-thumb-stone-200 scrollbar-track-transparent">
        {events.length === 0 && (
          <div className="text-center text-stone-500 text-sm py-10">No recent events parsed.</div>
        )}
        
        {events.map((event, idx) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            onClick={() => onEventClick(event)}
            className="group relative bg-stone-50 hover:bg-white border border-stone-200/60 hover:border-black rounded-xl p-3.5 cursor-pointer transition-all duration-300"
          >
            <div className="flex justify-between items-start mb-2">
              <h4 className="text-sm font-bold text-black line-clamp-1 pr-2 group-hover:underline">{event.title}</h4>
              <span className="text-[10px] text-stone-500 font-mono shrink-0">
                {formatDistanceToNow(new Date(event.createdAt || Date.now()), { addSuffix: true })}
              </span>
            </div>
            
            <div className="flex items-center gap-3 text-[11px] mt-3">
              <div className="flex items-center gap-1 text-stone-500 font-mono font-bold">
                <Bot className="w-3 h-3 text-stone-500" />
                <span>{event.aiModel || 'manual'}</span>
              </div>
              
              {event.confidence !== undefined && event.confidence !== null && (
                <div className={`flex items-center gap-1 font-mono font-bold px-1.5 py-0.5 rounded border ${
                  event.confidence >= 0.9 
                    ? 'text-teal-600 bg-teal-50 border-teal-100' 
                    : event.confidence >= 0.7 
                      ? 'text-amber-700 bg-amber-50 border-amber-100' 
                      : 'text-rose-600 bg-rose-50 border-rose-100'
                }`}>
                  <CheckCircle className="w-3 h-3 shrink-0" />
                  <span>{Math.round(event.confidence * 100)}% Match</span>
                </div>
              )}
            </div>

            {/* Hover subtle line highlight */}
            <div className="absolute inset-0 border border-transparent group-hover:border-black rounded-xl pointer-events-none transition-colors duration-300"></div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
