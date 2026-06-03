'use client';

import React from 'react';
import { Rocket, TrendingUp } from 'lucide-react';

interface ResearchVelocityCardProps {
  velocity?: number;
  trend?: string;
  chartHeights?: string[]; // e.g. ['25%', '50%', '33%', '75%', '66%', '100%']
}

export default function ResearchVelocityCard({
  velocity = 842,
  trend = '+14%',
  chartHeights = ['25%', '50%', '33%', '75%', '66%', '100%']
}: ResearchVelocityCardProps) {
  return (
    <div className="card-level-1 rounded-xl p-6 flex flex-col relative overflow-hidden group select-none text-left min-h-[180px]">
      {/* Decorative blurred background circle */}
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-secondary-container/10 rounded-full blur-xl group-hover:bg-secondary-container/20 transition-all duration-300 pointer-events-none" />
      
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="p-2 bg-surface-container text-primary rounded-lg shrink-0">
          <Rocket className="w-5 h-5" />
        </div>
        <span className="font-label-caps text-label-caps text-secondary-fixed-dim bg-secondary-container/10 px-2 py-0.5 rounded flex items-center gap-1 shrink-0">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>{trend}</span>
        </span>
      </div>
      
      <h3 className="font-label-md text-label-md text-on-surface-variant mb-1 relative z-10">
        Research Velocity
      </h3>
      <div className="font-headline-xl text-headline-xl text-on-surface relative z-10">
        {velocity}{' '}
        <span className="text-body-sm text-outline font-normal">pts/mo</span>
      </div>
      
      {/* Micro Sparkline Columns Chart */}
      <div className="mt-auto pt-4 relative z-10">
        <div className="h-8 w-full flex items-end gap-1 opacity-70">
          {chartHeights.map((height, idx) => {
            const isLast = idx === chartHeights.length - 1;
            const barBg = isLast ? 'bg-secondary-container' : 'bg-primary/40 group-hover:bg-primary/60 transition-colors';
            return (
              <div 
                key={idx} 
                className={`w-full rounded-t ${barBg}`} 
                style={{ height }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
