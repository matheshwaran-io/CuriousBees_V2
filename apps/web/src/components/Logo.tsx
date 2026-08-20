'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export default function Logo({ 
  className, 
  size = 40,
  showText = false
}: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Image 
        src="/logo.png" 
        alt="CuriousBees Logo" 
        width={size * 1.5} 
        height={size * 1.5} 
        className="object-contain rounded-lg shrink-0"
        priority
      />
    </div>
  );
}
