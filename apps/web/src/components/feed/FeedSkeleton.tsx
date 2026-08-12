'use client';

import React from 'react';

function SkeletonPulse({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-200/80 rounded-full ${className || ''}`} />;
}

export function PostSkeleton() {
  return (
    <div className="bg-white border-b border-slate-200/80 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <SkeletonPulse className="w-10 h-10 rounded-full shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <SkeletonPulse className="h-3 w-28" />
            <SkeletonPulse className="h-3 w-16" />
            <SkeletonPulse className="h-3 w-10" />
          </div>
          <SkeletonPulse className="h-3 w-full rounded-lg" />
          <SkeletonPulse className="h-3 w-4/5 rounded-lg" />
          <SkeletonPulse className="h-3 w-3/5 rounded-lg" />
          <div className="flex items-center gap-4 pt-2">
            <SkeletonPulse className="h-6 w-14" />
            <SkeletonPulse className="h-6 w-14" />
            <SkeletonPulse className="h-6 w-14" />
            <SkeletonPulse className="h-6 w-14" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SidebarSkeleton() {
  return (
    <div className="space-y-4">
      {/* Search skeleton */}
      <SkeletonPulse className="h-10 w-full rounded-full" />

      {/* People section */}
      <div className="bg-slate-50/70 rounded-3xl border border-slate-200/70 p-4 space-y-4">
        <SkeletonPulse className="h-3 w-36" />
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-2.5">
            <SkeletonPulse className="w-9 h-9 rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5">
              <SkeletonPulse className="h-3 w-24" />
              <SkeletonPulse className="h-2 w-16" />
            </div>
            <SkeletonPulse className="h-7 w-16 rounded-full" />
          </div>
        ))}
      </div>

      {/* Trending section */}
      <div className="bg-slate-50/70 rounded-3xl border border-slate-200/70 p-4 space-y-3">
        <SkeletonPulse className="h-3 w-32" />
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="space-y-1.5 p-2">
            <SkeletonPulse className="h-3 w-28" />
            <SkeletonPulse className="h-2 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function FeedSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div>
      {Array.from({ length: count }).map((_, i) => (
        <PostSkeleton key={i} />
      ))}
    </div>
  );
}

export default FeedSkeleton;
