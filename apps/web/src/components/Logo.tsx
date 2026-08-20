'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  variant?: 'light' | 'dark' | 'auto';
}

export default function Logo({ 
  className, 
  size = 36,
  showText = false,
  variant = 'auto'
}: LogoProps) {
  return (
    <div className={cn("inline-flex items-center gap-3 shrink-0 select-none", className)}>
      <div 
        className="relative shrink-0 flex items-center justify-center transition-transform hover:scale-105 duration-200"
        style={{ width: size, height: size }}
      >
        <Image 
          src="/logo_icon.png" 
          alt="CuriousBees Logo Icon" 
          width={size * 2} 
          height={size * 2} 
          className="w-full h-full object-contain drop-shadow-sm"
          priority
        />
      </div>
      
      {showText && (
        <div className="flex flex-col leading-none text-left">
          <span className={cn(
            "font-display font-black text-lg tracking-tight",
            variant === 'light' ? "text-white" : variant === 'dark' ? "text-slate-900" : "text-slate-900 dark:text-white"
          )}>
            Curious<span className="text-[#FFC828]">Bees</span>
          </span>
          <span className={cn(
            "text-[9px] font-extrabold tracking-[0.18em] uppercase mt-1",
            variant === 'light' ? "text-amber-400/90" : "text-slate-400"
          )}>
            SRMIST RESEARCH PORTAL
          </span>
        </div>
      )}
    </div>
  );
}
