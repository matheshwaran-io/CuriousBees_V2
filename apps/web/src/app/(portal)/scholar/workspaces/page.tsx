'use client';

import React from 'react';
import { CuriousNexusHub } from '@/components/nexus/CuriousNexusHub';

export default function ScholarWorkspacesPage() {
  return (
    <div className="w-full h-full">
      <CuriousNexusHub initialView="workspaces" />
    </div>
  );
}
