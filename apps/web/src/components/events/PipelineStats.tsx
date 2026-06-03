'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { Bot, CheckCircle, Clock, ShieldAlert } from 'lucide-react';

const fetchStats = async () => {
  const res = await apiFetch('/api/events/stats');
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
};

export default function PipelineStats() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['event-pipeline-stats'],
    queryFn: fetchStats,
    refetchInterval: 5000, // Poll every 5s for live dashboard feel
  });

  if (isLoading || isError) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-white border border-borderStroke" />
        ))}
      </div>
    );
  }

  const stats = [
    {
      title: 'Total Ingested',
      value: data?.totalEvents || 0,
      icon: <Bot className="w-5 h-5 text-indigoElectric" />,
      color: 'bg-indigoElectric/10 border-indigoElectric/20',
      label: 'All-time AI parsed',
    },
    {
      title: 'Review Queue',
      value: data?.reviewQueue || 0,
      icon: <Clock className="w-5 h-5 text-amber-600" />,
      color: 'bg-amber-500/10 border-amber-500/20',
      label: 'Pending moderation',
    },
    {
      title: 'Extraction Confidence',
      value: `${data?.avgConfidence || 0}%`,
      icon: <CheckCircle className="w-5 h-5 text-tealGlow" />,
      color: 'bg-tealGlow/10 border-tealGlow/20',
      label: 'AI extraction precision',
    },
    {
      title: 'Spam Blocked',
      value: data?.duplicatesRejected || 0,
      icon: <ShieldAlert className="w-5 h-5 text-rose-600" />,
      color: 'bg-rose-500/10 border-rose-500/20',
      label: 'Duplicates filtered',
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {stats.map((stat, idx) => (
        <div key={idx} className="relative overflow-hidden group bg-white border border-borderStroke rounded-2xl p-5 hover:border-black transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold font-mono tracking-wider text-stone-500 uppercase">{stat.title}</h3>
            <div className={`p-2 rounded-lg ${stat.color} border`}>
              {stat.icon}
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-display font-extrabold text-black tracking-tight">{stat.value}</span>
          </div>
          <p className="text-[11px] text-stone-500 font-medium mt-2">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
