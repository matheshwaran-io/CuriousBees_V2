'use client';

import React from 'react';
import { HeartPulse } from 'lucide-react';

interface SystemHealthCardProps {
  health?: number; // e.g. 99.9
  apiStatus?: 'OK' | 'DEGRADED' | 'DOWN';
  storageStatus?: 'OK' | 'DEGRADED' | 'DOWN';
}

export default function SystemHealthCard({
  health = 99.9,
  apiStatus = 'OK',
  storageStatus = 'OK'
}: SystemHealthCardProps) {
  const isHealthy = apiStatus === 'OK' && storageStatus === 'OK';

  return (
    <div className="card-level-1 rounded-xl p-6 flex flex-col glass-panel relative select-none text-left min-h-[180px]">
      {/* Pulse Green Glow */}
      {isHealthy && (
        <div className="absolute right-4 top-4 w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)] shrink-0" />
      )}
      
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-surface-container text-primary rounded-lg shrink-0">
          <HeartPulse className="w-5 h-5" />
        </div>
      </div>
      
      <h3 className="font-label-md text-label-md text-on-surface-variant mb-1">
        System Health
      </h3>
      <div className="font-headline-xl text-headline-xl text-on-surface">
        {health}
        <span className="text-headline-md text-outline font-normal">%</span>
      </div>
      
      <div className="mt-auto pt-4 flex gap-2">
        <span className="px-2 py-1 bg-surface-container-high rounded text-[11px] font-label-md text-on-surface-variant uppercase shrink-0">
          API: {apiStatus}
        </span>
        <span className="px-2 py-1 bg-surface-container-high rounded text-[11px] font-label-md text-on-surface-variant uppercase shrink-0">
          Storage: {storageStatus}
        </span>
      </div>
    </div>
  );
}
