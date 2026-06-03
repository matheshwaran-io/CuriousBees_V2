'use client';

import React from 'react';
import { Network } from 'lucide-react';

interface CollaborationsCardProps {
  count?: number;
}

export default function CollaborationsCard({
  count = 342
}: CollaborationsCardProps) {
  return (
    <div className="card-level-1 rounded-xl p-6 flex flex-col relative overflow-hidden group select-none text-left min-h-[180px]">
      {/* Decorative blurred background circle */}
      <div className="absolute -left-4 -bottom-4 w-32 h-32 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all duration-300 pointer-events-none" />
      
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="p-2 bg-surface-container text-primary rounded-lg shrink-0">
          <Network className="w-5 h-5" />
        </div>
      </div>
      
      <h3 className="font-label-md text-label-md text-on-surface-variant mb-1 relative z-10">
        Active Collaborations
      </h3>
      <div className="font-headline-xl text-headline-xl text-on-surface relative z-10">
        {count}
      </div>
      
      {/* Network Nodes Graphic */}
      <div className="mt-auto pt-4 relative h-10 w-full z-10 flex items-center">
        <div className="relative w-full h-full">
          {/* SVG connecting lines */}
          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
            <line stroke="#004495" strokeOpacity="0.3" strokeWidth="1.5" x1="10%" x2="50%" y1="50%" y2="20%"></line>
            <line stroke="#004495" strokeOpacity="0.3" strokeWidth="1.5" x1="10%" x2="50%" y1="50%" y2="80%"></line>
            <line stroke="#004495" strokeOpacity="0.3" strokeWidth="1.5" x1="50%" x2="90%" y1="20%" y2="50%"></line>
            <line stroke="#004495" strokeOpacity="0.3" strokeWidth="1.5" x1="50%" x2="90%" y1="80%" y2="50%"></line>
          </svg>
          {/* Node Circles */}
          <div className="absolute top-[50%] left-[10%] w-2 h-2 bg-primary rounded-full -translate-x-1/2 -translate-y-1/2 shadow-sm" />
          <div className="absolute top-[20%] left-[50%] w-3 h-3 bg-secondary-container rounded-full -translate-x-1/2 -translate-y-1/2 shadow-sm animate-pulse" />
          <div className="absolute top-[80%] left-[50%] w-2 h-2 bg-primary rounded-full -translate-x-1/2 -translate-y-1/2 shadow-sm" />
          <div className="absolute top-[50%] left-[90%] w-2 h-2 bg-primary rounded-full -translate-x-1/2 -translate-y-1/2 shadow-sm" />
        </div>
      </div>
    </div>
  );
}
