'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Check, X, Calendar, MapPin, User, Building2, Loader2, FileText } from 'lucide-react';

interface PendingEmailEvent {
  id: string;
  senderEmail: string;
  title: string;
  speaker?: string | null;
  date: string;
  time: string;
  venue: string;
  department?: string | null;
  description?: string | null;
  createdAt: string;
}

const fetchPendingEmails = async () => {
  const res = await apiFetch('/api/events/pending-emails');
  if (!res.ok) throw new Error('Failed to fetch pending email events');
  return res.json() as Promise<PendingEmailEvent[]>;
};

const approvePendingEmail = async (id: string) => {
  const res = await apiFetch(`/api/events/pending-emails/${id}/approve`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to approve email event');
  return res.json();
};

const rejectPendingEmail = async (id: string) => {
  const res = await apiFetch(`/api/events/pending-emails/${id}/reject`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to reject email event');
  return res.json();
};

export default function PendingEmailQueue() {
  const queryClient = useQueryClient();

  const { data: pendingList = [], isLoading } = useQuery({
    queryKey: ['pending-email-events'],
    queryFn: fetchPendingEmails,
    refetchInterval: 10000,
  });

  const approveMutation = useMutation({
    mutationFn: approvePendingEmail,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-email-events'] });
      queryClient.invalidateQueries({ queryKey: ['events-calendar'] });
      queryClient.invalidateQueries({ queryKey: ['events-feed'] });
      queryClient.invalidateQueries({ queryKey: ['event-pipeline-stats'] });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: rejectPendingEmail,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-email-events'] });
    }
  });

  if (isLoading) {
    return (
      <div className="cb-card p-6 min-h-[160px] flex items-center justify-center bg-white/90 backdrop-blur-md">
        <Loader2 className="w-5 h-5 text-[#0C4DA2] animate-spin" />
      </div>
    );
  }

  return (
    <div className="cb-card p-6 overflow-hidden bg-white/90 backdrop-blur-md mb-6 border border-slate-200/80 shadow-sm rounded-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
        <div>
          <h3 className="text-sm font-extrabold text-[#0C4DA2] flex items-center gap-2 font-display">
            <Mail className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Inbound Email Event Intake Queue</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Events sent to <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px] font-bold text-slate-700">events@send.akbattery.in</code> staged in temporary table pending admin authorization.
          </p>
        </div>
        <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider self-start sm:self-auto">
          {pendingList.length} Staged Email{pendingList.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="space-y-3.5 max-h-[450px] overflow-y-auto pr-1">
        <AnimatePresence>
          {pendingList.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="text-center py-8 text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl bg-slate-50/50 font-semibold"
            >
              <Mail className="w-7 h-7 mx-auto mb-2 text-slate-300" />
              <span className="font-bold text-slate-700 text-sm">No Pending Inbound Emails</span>
              <p className="text-[11px] text-slate-400 mt-0.5">All received event emails have been reviewed and processed.</p>
            </motion.div>
          ) : (
            pendingList.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white border border-slate-200 hover:border-[#0C4DA2]/30 rounded-xl p-4 transition-all duration-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Email details */}
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-[#0C4DA2]/10 text-[#0C4DA2] px-2 py-0.5 rounded-full">
                      Staged Email
                    </span>
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {item.title}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600 font-medium">
                    <div className="flex items-center gap-1.5 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">From: <strong className="text-slate-800">{item.senderEmail}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{new Date(item.date).toLocaleDateString()} at {item.time}</span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{item.venue}</span>
                    </div>
                    {item.speaker && (
                      <div className="flex items-center gap-1.5 truncate">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Speaker: {item.speaker}</span>
                      </div>
                    )}
                    {item.department && (
                      <div className="flex items-center gap-1.5 truncate">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Dept: {item.department}</span>
                      </div>
                    )}
                  </div>

                  {item.description && (
                    <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-lg text-xs text-slate-600 font-normal leading-relaxed line-clamp-2">
                      {item.description}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <button
                    disabled={approveMutation.isPending || rejectMutation.isPending}
                    onClick={() => approveMutation.mutate(item.id)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all text-xs font-extrabold shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    <Check className="w-4 h-4" /> Allow & Publish
                  </button>

                  <button
                    disabled={approveMutation.isPending || rejectMutation.isPending}
                    onClick={() => rejectMutation.mutate(item.id)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 transition-all text-xs font-bold active:scale-95 disabled:opacity-50 cursor-pointer border border-slate-200"
                  >
                    <X className="w-4 h-4" /> Reject
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
