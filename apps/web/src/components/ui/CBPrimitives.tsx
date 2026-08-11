'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

// ─── CBBUTTON ────────────────────────────────────────────────────────────────

export interface CBButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function CBButton({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  ...props
}: CBButtonProps) {
  const baseStyles = "inline-flex items-center justify-center font-bold tracking-tight transition-all rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B4EA2]/50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none active:scale-[0.98]";

  const variantStyles = {
    primary: "bg-[#0B4EA2] text-white hover:bg-[#073B7A] shadow-sm border border-transparent",
    accent: "bg-[#F5B800] text-[#17233D] hover:bg-[#FFC928] shadow-sm border border-transparent",
    secondary: "bg-white text-[#0B4EA2] border border-[#E4E9F2] hover:bg-[#EEF4FF] hover:border-[#0B4EA2]/30 shadow-xs",
    ghost: "bg-transparent text-[#0B4EA2] hover:bg-[#EEF4FF]",
    danger: "bg-red-600 text-white hover:bg-red-700 shadow-sm border border-transparent",
  };

  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2.5 text-xs md:text-sm gap-2",
    lg: "px-6 py-3 text-sm md:text-base gap-2.5",
  };

  return (
    <button
      className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : (
        <>
          {leftIcon}
          <span>{children}</span>
          {rightIcon}
        </>
      )}
    </button>
  );
}

// ─── CBCARD ──────────────────────────────────────────────────────────────────

export interface CBCardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export function CBCard({ children, className, hoverable = false, ...props }: CBCardProps) {
  return (
    <div
      className={cn(
        "bg-white border border-[#E4E9F2] rounded-2xl p-5 md:p-6 shadow-[0_2px_10px_-4px_rgba(11,78,162,0.05)] transition-all",
        hoverable && "hover:shadow-[0_8px_20px_-6px_rgba(11,78,162,0.1)] hover:border-[#0B4EA2]/30",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// ─── CBBADGE ─────────────────────────────────────────────────────────────────

export interface CBBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'supervisor' | 'scholar' | 'admin' | 'topic' | 'accent' | 'neutral';
}

export function CBBadge({ children, className, variant = 'neutral', ...props }: CBBadgeProps) {
  const variantStyles = {
    supervisor: "bg-amber-50 text-amber-800 border-amber-200",
    scholar: "bg-[#EEF4FF] text-[#0B4EA2] border-[#0B4EA2]/20",
    admin: "bg-slate-100 text-slate-800 border-slate-200",
    topic: "bg-[#EEF4FF] text-[#0B4EA2] border-[#0B4EA2]/15 font-semibold",
    accent: "bg-[#FFF9E6] text-[#92400E] border-[#F5B800]/40 font-semibold",
    neutral: "bg-slate-50 text-[#4A5568] border-[#E4E9F2]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition-colors",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

// ─── CBEMPTYSTATE ────────────────────────────────────────────────────────────

export interface CBEmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function CBEmptyState({ icon, title, description, action, className }: CBEmptyStateProps) {
  return (
    <div className={cn("bg-white border border-[#E4E9F2] rounded-3xl p-10 md:p-14 text-center max-w-lg mx-auto shadow-xs space-y-4", className)}>
      {icon && (
        <div className="w-14 h-14 bg-[#EEF4FF] text-[#0B4EA2] rounded-2xl flex items-center justify-center mx-auto shadow-xs">
          {icon}
        </div>
      )}
      <div className="space-y-1.5">
        <h3 className="text-lg font-bold text-[#17233D]">{title}</h3>
        <p className="text-xs md:text-sm text-[#6B7890] leading-relaxed max-w-md mx-auto">{description}</p>
      </div>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}

// ─── CBSKELETON ──────────────────────────────────────────────────────────────

export function CBSkeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse bg-[#E4E9F2]/70 rounded-xl", className)}
      {...props}
    />
  );
}
