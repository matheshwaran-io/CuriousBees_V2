'use client';

import React, { Suspense } from 'react';
import { CuriousNexusHub } from '@/components/nexus/CuriousNexusHub';
import { useSearchParams } from 'next/navigation';

function NexusContent() {
  const searchParams = useSearchParams();
  const viewParam = searchParams?.get('view');
  const userId = searchParams?.get('userId');
  
  const initialView = viewParam === 'workspaces' ? 'workspaces' : 'messages';

  return (
    <div className="w-full h-full">
      <CuriousNexusHub initialView={initialView} initialUserId={userId} />
    </div>
  );
}

export default function NexusPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center text-xs font-bold text-slate-400 animate-pulse">Loading Nexus Workspace...</div>}>
      <NexusContent />
    </Suspense>
  );
}

