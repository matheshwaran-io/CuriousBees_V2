'use client';

import React from 'react';
import { Activity, CheckCircle2, FileText, Network, Edit3 } from 'lucide-react';

interface ActivityItem {
  id: string;
  type: string;
  description: string;
  createdAt: string | Date;
}

interface ResearchActivityTimelineProps {
  activities?: ActivityItem[];
}

export function ResearchActivityTimeline({ activities = [] }: ResearchActivityTimelineProps) {
  if (!activities || activities.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border border-[#E4E9F2] rounded-2xl p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#0C4DA2]">
          <Activity className="w-4 h-4 text-[#0C4DA2]" />
          <span>Recent Research Activity</span>
        </div>
      </div>

      <div className="space-y-3 pt-1 relative before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
        {activities.map((act) => (
          <div key={act.id} className="flex items-start gap-3 relative pl-7">
            <div className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full bg-[#0C4DA2] ring-4 ring-blue-50" />
            <div className="space-y-0.5 flex-1 min-w-0">
              <p className="text-xs font-bold text-[#17233D]">{act.description}</p>
              <span className="text-[10px] font-semibold text-slate-400">
                {new Date(act.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
