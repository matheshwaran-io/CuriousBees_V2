'use client';

/**
 * components/shared/metric-card.tsx
 * Universal metric display card used across ALL three dashboards.
 *
 * Features: animated counter, trend delta, icon, multiple accent variants.
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { AnimatedCounter } from './animated-counter';
import { GlassCard } from './glass-card';

type MetricVariant = 'default' | 'primary' | 'success' | 'warning' | 'info';

interface MetricCardProps {
  title: string;
  value: number | string;
  delta?: string;
  deltaType?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
  variant?: MetricVariant;
  prefix?: string;
  suffix?: string;
  description?: string;
  animate?: boolean;
  className?: string;
}

const accentStyles: Record<MetricVariant, { icon: string; badge: string }> = {
  default:  { icon: 'bg-surface-container text-on-surface-variant',    badge: 'text-on-surface-variant bg-surface-container-low' },
  primary:  { icon: 'bg-primary/10 text-primary',                      badge: 'text-primary bg-primary/5' },
  success:  { icon: 'bg-success-container text-on-success-container',  badge: 'text-on-success-container bg-success-container' },
  warning:  { icon: 'bg-warning-container text-on-warning-container',  badge: 'text-on-warning-container bg-warning-container' },
  info:     { icon: 'bg-info-container text-on-info-container',        badge: 'text-on-info-container bg-info-container' },
};

const deltaIcons = {
  up:      <TrendingUp className="w-3 h-3" />,
  down:    <TrendingDown className="w-3 h-3" />,
  neutral: <Minus className="w-3 h-3" />,
};

const deltaColors = {
  up:      'text-success bg-success-container',
  down:    'text-error bg-error-container',
  neutral: 'text-on-surface-variant bg-surface-container',
};

export function MetricCard({
  title,
  value,
  delta,
  deltaType = 'neutral',
  icon,
  variant = 'default',
  prefix = '',
  suffix = '',
  description,
  animate = true,
  className,
}: MetricCardProps) {
  const accent = accentStyles[variant];

  return (
    <GlassCard className={cn('flex flex-col justify-between gap-3', className)}>
      <div className="flex items-start justify-between">
        <p className="cb-metric-label">{title}</p>
        {icon && (
          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', accent.icon)}>
            {icon}
          </div>
        )}
      </div>

      <div className="space-y-1">
        <div className="cb-metric-value">
          {animate && typeof value === 'number' ? (
            <AnimatedCounter value={value} prefix={prefix} suffix={suffix} />
          ) : (
            <span>{prefix}{typeof value === 'string' ? value : value.toLocaleString()}{suffix}</span>
          )}
        </div>
        {description && (
          <p className="text-[11px] text-on-surface-variant">{description}</p>
        )}
      </div>

      {delta && (
        <div className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold self-start', deltaColors[deltaType])}>
          {deltaIcons[deltaType]}
          <span>{delta}</span>
        </div>
      )}
    </GlassCard>
  );
}
