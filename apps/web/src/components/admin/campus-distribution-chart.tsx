'use client';

import React from 'react';
import { MoreVertical } from 'lucide-react';

interface NodeData {
  id: string;
  name: string;
  code: string;
  load: number; // percentage value, e.g. 40, 85, 60, 30
  type: 'standard' | 'high' | 'warning';
}

interface CampusDistributionChartProps {
  nodes?: NodeData[];
}

export default function CampusDistributionChart({
  nodes = [
    { id: 'n1', name: 'Node A', code: 'NA', load: 40, type: 'standard' },
    { id: 'n2', name: 'Node B', code: 'EU', load: 85, type: 'high' },
    { id: 'n3', name: 'Node C', code: 'AP', load: 60, type: 'standard' },
    { id: 'n4', name: 'Warning', code: 'SA', load: 30, type: 'warning' }
  ]
}: CampusDistributionChartProps) {
  return (
    <div className="card-level-1 rounded-xl p-0 flex flex-col md:col-span-2 lg:col-span-2 overflow-hidden relative select-none text-left">
      <div className="p-6 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-lowest relative z-10">
        <div>
          <h3 className="font-headline-md text-headline-md text-on-surface">Campus Distribution</h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant">Compute load across global research nodes</p>
        </div>
        <button className="p-1.5 text-outline hover:text-primary transition-colors cursor-pointer rounded-full hover:bg-surface-container">
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>

      {/* Heatmap/Bar Chart Area */}
      <div className="flex-1 bg-surface-container-low p-6 relative min-h-[220px] flex items-end">
        {/* Grid Lines */}
        <div 
          className="absolute inset-0 pointer-events-none" 
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(195, 198, 214, 0.1) 1px, transparent 1px), 
              linear-gradient(to bottom, rgba(195, 198, 214, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }}
        />

        {/* Abstraction container */}
        <div className="relative h-40 w-full flex items-end justify-around z-10 px-4">
          {nodes.map((node) => {
            let barColor = 'bg-primary/20 hover:bg-primary/40';
            let labelClass = 'text-outline';
            let extraShadow = '';

            if (node.type === 'high') {
              barColor = 'bg-primary hover:bg-primary-container';
              labelClass = 'text-on-surface font-bold';
              extraShadow = 'shadow-[0_0_15px_rgba(0,68,149,0.3)]';
            } else if (node.type === 'warning') {
              barColor = 'bg-secondary-container hover:bg-secondary-fixed-dim';
              labelClass = 'text-secondary';
            }

            return (
              <div 
                key={node.id} 
                className="flex flex-col items-center gap-2 group w-full max-w-[40px]"
              >
                <div 
                  className={`w-full rounded-t-sm transition-all duration-300 relative ${barColor} ${extraShadow}`} 
                  style={{ height: `${node.load}%` }}
                >
                  {/* Tooltip on hover */}
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-inverse-surface text-inverse-on-surface text-[10px] font-medium py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-20 shadow-md border border-outline-variant/20">
                    {node.name}: {node.load}% Load
                  </div>
                </div>
                <span className={`font-label-caps text-label-caps text-[10px] truncate max-w-[36px] ${labelClass}`}>
                  {node.code}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
