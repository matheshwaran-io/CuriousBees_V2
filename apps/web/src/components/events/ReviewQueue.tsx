'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Check, CheckCircle, X, Calendar, MapPin, Loader2 } from 'lucide-react';
import { Event } from '@curiousbees/types';

type PrismaEvent = Event & {
  status: 'DRAFT' | 'PUBLISHED' | 'REVIEW_REQUIRED' | 'FAILED';
  confidence: number;
  aiModel: string;
};

const fetchReviewQueue = async () => {
  const res = await apiFetch('/api/events/review');
  if (!res.ok) throw new Error('Failed to fetch review queue');
  return res.json() as Promise<PrismaEvent[]>;
};

const updateStatus = async ({ id, status }: { id: string, status: string }) => {
  const res = await apiFetch(`/api/events/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Failed to update status');
  return res.json();
};

export default function ReviewQueue({ onEventClick }: { onEventClick: (event: PrismaEvent) => void }) {
  const queryClient = useQueryClient();

  const { data: queue = [], isLoading } = useQuery({
    queryKey: ['events-review-queue'],
    queryFn: fetchReviewQueue,
    refetchInterval: 10000,
  });

  const mutation = useMutation({
    mutationFn: updateStatus,
    onSuccess: () => {
      // Refresh all related queries
      queryClient.invalidateQueries({ queryKey: ['events-review-queue'] });
      queryClient.invalidateQueries({ queryKey: ['events-calendar'] });
      queryClient.invalidateQueries({ queryKey: ['events-feed'] });
      queryClient.invalidateQueries({ queryKey: ['event-pipeline-stats'] });
    }
  });

  if (isLoading) {
    return (
      <div className="bg-white border border-borderStroke rounded-2xl p-6 min-h-[300px] flex items-center justify-center animate-pulse">
        <Loader2 className="w-6 h-6 text-stone-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white border border-borderStroke rounded-2xl p-6 overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h3 className="font-display font-bold text-lg text-black flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            AI Moderation Queue
          </h3>
          <p className="text-xs text-stone-500 mt-1 font-medium">Events with confidence score between 70% - 89% require campus approval.</p>
        </div>
        <div className="bg-amber-500/10 text-amber-800 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-bold font-mono uppercase tracking-wider">
          {queue.length} Pending Approval
        </div>
      </div>

      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-stone-200">
        <AnimatePresence>
          {queue.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="text-center py-12 text-stone-500 text-sm border border-dashed border-stone-200 rounded-xl bg-stone-50/50"
            >
              <CheckCircle className="w-8 h-8 mx-auto mb-3 text-emerald-600/30" />
              <span className="font-bold text-stone-700">Moderation Queue Clear!</span>
              <p className="text-[12px] text-stone-500 mt-1">All processed events are approved and published.</p>
            </motion.div>
          ) : (
            queue.map((event) => (
              <motion.div
                key={event.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="group relative bg-stone-50 border border-stone-200/60 hover:border-black rounded-xl p-4 transition-all duration-300 flex flex-col md:flex-row md:items-center gap-4"
              >
                {/* Event Info */}
                <div 
                  className="flex-1 cursor-pointer"
                  onClick={() => onEventClick(event)}
                >
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h4 className="text-sm font-bold text-black group-hover:underline">{event.title}</h4>
                    <span className="text-[10px] font-bold font-mono bg-stone-200/60 text-stone-700 px-2 py-0.5 rounded border border-stone-300/30">{Math.round(event.confidence * 100)}% Confidence</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-stone-500 font-medium mt-2">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-stone-400" />
                      {new Date(event.date).toLocaleDateString()} at {event.time}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-stone-400" />
                      {event.venue}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center">
                  <button 
                    disabled={mutation.isPending}
                    onClick={() => mutation.mutate({ id: event.id, status: 'PUBLISHED' })}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-all text-xs font-bold shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button 
                    disabled={mutation.isPending}
                    onClick={() => mutation.mutate({ id: event.id, status: 'FAILED' })}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 hover:border-stone-400 transition-all text-xs font-bold disabled:opacity-50 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
