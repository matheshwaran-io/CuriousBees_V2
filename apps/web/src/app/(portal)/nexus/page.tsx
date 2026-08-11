'use client';

import React from 'react';
import { CuriousNexusHub } from '@/components/nexus/CuriousNexusHub';
import { useSearchParams } from 'next/navigation';

export default function NexusPage() {
  const searchParams = useSearchParams();
  const viewParam = searchParams.get('view');
  const initialView = viewParam === 'workspaces' ? 'workspaces' : 'messages';

  return (
    <div className="w-full h-full">
      <CuriousNexusHub initialView={initialView} />
    </div>
  );
}
