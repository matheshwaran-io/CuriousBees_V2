'use client';

/**
 * components/shared/role-badge.tsx
 * Standalone role badge chip extracted from Navbar.
 * Used in profile cards, user tables, and the Navbar itself.
 */

import React from 'react';
import { cn } from '@/lib/utils';
import type { UserRole } from '@curiousbees/types';

const ROLE_LABELS: Record<UserRole, string> = {
  FACULTY:     'Supervisor',
  PHD_SCHOLAR: 'Scholar',
  ADMIN:       'Admin',
};

const ROLE_STYLES: Record<UserRole, string> = {
  ADMIN:       'bg-rose-50 text-rose-700 border-rose-200',
  FACULTY:     'bg-indigo-50 text-indigo-700 border-indigo-200',
  PHD_SCHOLAR: 'bg-emerald-50 text-emerald-700 border-emerald-200',
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
