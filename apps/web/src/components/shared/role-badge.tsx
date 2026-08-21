'use client';

/**
 * components/shared/role-badge.tsx
 * Standalone role badge chip extracted from Navbar.
 * Used in profile cards, user tables, and the Navbar itself.
 */

import React from 'react';
import { cn } from '@/lib/utils';
import type { UserRole } from '@curiousbees/types';

const ROLE_LABELS: Record<string, string> = {
  ADMIN:                 'Admin',
  INSTITUTE_ADMIN:       'Institute Admin',
  RESEARCH_SUPERVISOR:   'Research Supervisor',
  RESEARCH_SCHOLAR:      'Research Scholar',
};

const ROLE_STYLES: Record<string, string> = {
  ADMIN:                 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700',
  INSTITUTE_ADMIN:       'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700',
  RESEARCH_SUPERVISOR:   'bg-[#FFF9E6] dark:bg-amber-950/35 text-[#92400E] dark:text-[#F4B740] border-[#F5B800]/40 dark:border-amber-500/30',
  RESEARCH_SCHOLAR:      'bg-[#EEF4FF] dark:bg-blue-950/35 text-[#0B4EA2] dark:text-[#38BDF8] border-[#0B4EA2]/20 dark:border-blue-500/30',
};

interface RoleBadgeProps {
  role: UserRole;
  className?: string;
  size?: 'sm' | 'md';
}

export function RoleBadge({ role, className, size = 'md' }: RoleBadgeProps) {
  const sizeClass = size === 'sm'
    ? 'px-1.5 py-0.5 text-[9px]'
    : 'px-2.5 py-0.5 text-[10px]';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-black uppercase tracking-wider border',
        sizeClass,
        ROLE_STYLES[role],
        className
      )}
    >
      {ROLE_LABELS[role]}
    </span>
  );
}
