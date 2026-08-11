'use client';

import React from 'react';
import { CuriousNexusHub } from '@/components/nexus/CuriousNexusHub';

export default function ScholarChatPage() {
  return (
    <div className="w-full h-full">
      <CuriousNexusHub initialView="messages" />
    </div>
  );
}
