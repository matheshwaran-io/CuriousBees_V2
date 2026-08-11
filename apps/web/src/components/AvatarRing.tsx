'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface AvatarRingProps {
  src?: string | null;
  name?: string;
  role?: 'SUPERVISOR' | 'SCHOLAR' | string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function AvatarRing({
  src,
  name = 'Scholar',
  role = 'SCHOLAR',
  size = 'md',
  className,
}: AvatarRingProps) {
  const isFaculty = role === 'SUPERVISOR';
  
  const sizeClasses = {
    sm: 'w-7 h-7 text-[10px]',
    md: 'w-10 h-10 text-xs',
    lg: 'w-16 h-16 text-lg',
  };

  const ringColor = isFaculty
    ? 'border-[#0B4EA2] shadow-sm'
    : 'border-[#F5B800] shadow-sm';

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className={cn('relative shrink-0 select-none group', className)}>
      <div
        className={cn(
          'rounded-full border-2 p-[2px] transition-all duration-300 group-hover:scale-105',
          ringColor
        )}
      >
        {src ? (
          <img
            src={src}
            alt={name}
            className="w-full h-full rounded-full object-cover bg-[#EEF4FF]"
          />
        ) : (
          <div className={cn(
            "w-full h-full rounded-full flex items-center justify-center font-bold text-[#17233D]",
            isFaculty ? "bg-[#EEF4FF] text-[#0B4EA2]" : "bg-[#FFF9E6] text-[#92400E]"
          )}>
            {initials}
          </div>
        )}
      </div>
      {/* Presence indicator */}
      <span className={cn(
        "absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white",
        isFaculty ? "bg-[#0B4EA2]" : "bg-[#F5B800]"
      )} />
    </div>
  );
}
