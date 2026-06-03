'use client';

import React from 'react';
import { CalendarDays } from 'lucide-react';

interface DeadlineItem {
  id: string;
  title: string;
  subtitle: string;
  isActive?: boolean;
}

interface UpcomingDeadlinesProps {
  deadlines?: DeadlineItem[];
}

export default function UpcomingDeadlines({
  deadlines = [
    {
      id: 'dl-1',
      title: 'Oct 15 - ICML Paper Submission',
      subtitle: 'Conference on Machine Learning',
      isActive: true
    },
    {
      id: 'dl-2',
      title: 'Nov 02 - DARPA Grant Pre-proposal',
      subtitle: 'Advanced Materials Division',
      isActive: false
    },
    {
      id: 'dl-3',
      title: 'Dec 10 - Ethics Committee Review',
      subtitle: "Project 'Neural Sync' phase 2",
      isActive: false
    }
  ]
}: UpcomingDeadlinesProps) {
  return (
    <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] select-none text-left">
      <h3 className="font-headline-md text-headline-md text-on-surface mb-4 flex items-center gap-2">
        <CalendarDays className="w-5 h-5 text-primary shrink-0" />
        <span>Upcoming Deadlines</span>
      </h3>

      <div className="relative border-l border-outline-variant ml-3 space-y-6">
        {deadlines.map((item) => {
          const dotColor = item.isActive
            ? 'bg-secondary-container'
            : 'bg-surface-variant';

          return (
            <div key={item.id} className="pl-6 relative text-left">
              {/* Absoluted Timeline Circle */}
              <div 
                className={`absolute w-3 h-3 ${dotColor} rounded-full -left-[6.5px] top-1 border-2 border-surface-container-lowest shrink-0`}
              />
              <h4 className="font-label-md text-label-md text-on-surface font-semibold leading-tight">
                {item.title}
              </h4>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                {item.subtitle}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
