'use client';

/**
 * components/shared/dashboard-shell.tsx
 * Wraps the main content area of each dashboard page with consistent
 * vertical rhythm, spacing, and optional honeycomb background layer.
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface DashboardShellProps {
  children: React.ReactNode;
  className?: string;
  withBackground?: boolean;
}

export function DashboardShell({
  children,
  className,
  withBackground = false,
}: DashboardShellProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-6 text-left font-sans select-none w-full',
        withBackground && 'honeycomb-bg',
        className
      )}
    >
      {children}
    </div>
  );
}
