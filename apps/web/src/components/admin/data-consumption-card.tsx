'use client';

import React from 'react';
import { Database } from 'lucide-react';

interface DataConsumptionCardProps {
  used?: number; // e.g. 1.2
  total?: number; // e.g. 1.5
  unit?: string; // e.g. PB
}

export default function DataConsumptionCard({
  used = 1.2,
  total = 1.5,
  unit = 'PB'
}: DataConsumptionCardProps) {
  const percentage = Math.round((used / total) * 100);

  return (
    <div className="card-level-1 rounded-xl p-6 flex flex-col relative select-none text-left min-h-[180px]">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-surface-container text-primary rounded-lg shrink-0">
          <Database className="w-5 h-5" />
        </div>
      </div>
      
      <h3 className="font-label-md text-label-md text-on-surface-variant mb-1">
        Data Consumption
      </h3>
      <div className="font-headline-xl text-headline-xl text-on-surface">
        {used}{' '}
        <span className="text-headline-md text-outline font-normal">{unit}</span>
      </div>
      
      {/* Capacity Progress Slider Bar */}
      <div className="mt-auto pt-6">
        <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
          <div 
            className="bg-primary h-full rounded-full transition-all duration-300" 
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <span className="font-label-caps text-[10px] text-outline tracking-wider">
            {percentage}% CAPACITY
          </span>
          <span className="font-label-caps text-[10px] text-outline tracking-wider">
            {total} {unit} MAX
          </span>
        </div>
      </div>
    </div>
  );
}
