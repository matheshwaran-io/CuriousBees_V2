'use client';

import React from 'react';
import { Trophy, UserPlus, Clock } from 'lucide-react';

interface Achievement {
  id: string;
  title: string;
  description: string;
  timeAgo: string;
  type: 'project' | 'collab' | 'system';
}

interface AchievementsFeedProps {
  achievements?: Achievement[];
}

export default function AchievementsFeed({
  achievements = [
    {
      id: 'ac-1',
      title: 'Quantum Mapping Project Completed',
      description: 'EU Campus node successfully processed final dataset.',
      timeAgo: '2 HOURS AGO',
      type: 'project'
    },
    {
      id: 'ac-2',
      title: 'New Cross-Institutional Collaboration',
      description: "Stanford AI Lab joined the 'Bio-Mimicry' network.",
      timeAgo: 'YESTERDAY',
      type: 'collab'
    },
    {
      id: 'ac-3',
      title: 'System Architecture Upgraded',
      description: 'Core processing units updated to v4.2.',
      timeAgo: '3 DAYS AGO',
      type: 'system'
    }
  ]
}: AchievementsFeedProps) {
  return (
    <div className="card-level-1 rounded-xl md:col-span-2 lg:col-span-2 p-0 flex flex-col select-none text-left">
      <div className="p-5 border-b border-outline-variant/30 bg-surface-container-lowest">
        <h3 className="font-headline-md text-headline-md text-on-surface">Recent Achievements</h3>
      </div>
      
      <div className="flex-1 p-5 space-y-4">
        {achievements.map((item, idx) => {
          const isLast = idx === achievements.length - 1;
          
          let icon = <Trophy className="w-3.5 h-3.5 text-secondary" />;
          let iconBg = 'bg-secondary-container/20';
          
          if (item.type === 'collab') {
            icon = <UserPlus className="w-3.5 h-3.5 text-primary" />;
            iconBg = 'bg-primary/10';
          } else if (item.type === 'system') {
            icon = <Clock className="w-3.5 h-3.5 text-outline" />;
            iconBg = 'bg-surface-container-high';
          }

          return (
            <div key={item.id} className="flex gap-4 relative text-left">
              {/* Timeline Line */}
              {!isLast && (
                <div 
                  className="absolute left-[11px] top-6 bottom-[-16px] w-0.5 bg-outline-variant/30 pointer-events-none" 
                />
              )}
              
              {/* Timeline Node */}
              <div className={`w-6 h-6 rounded-full ${iconBg} flex flex-shrink-0 items-center justify-center relative z-10 ring-4 ring-surface-container-lowest`}>
                {icon}
              </div>
              
              <div>
                <p className="font-label-md text-label-md text-on-surface font-semibold">
                  {item.title}
                </p>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                  {item.description}
                </p>
                <span className="font-label-caps text-label-caps text-outline text-[10px] mt-2 block tracking-wider">
                  {item.timeAgo}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
