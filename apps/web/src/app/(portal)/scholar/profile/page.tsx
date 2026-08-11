'use client';

import React from 'react';
import { useStore } from '@/store/useStore';
import { PremiumProfileView } from '@/components/profile/PremiumProfileView';
import { DashboardShell } from '@/components/shared/dashboard-shell';

export default function ScholarProfilePage() {
  const { currentUser } = useStore();

  return (
    <DashboardShell>
      <PremiumProfileView 
        user={currentUser} 
        isOwnProfile={true} 
        onEditClick={() => alert('Profile editing is currently managed by your administrator.')} 
      />
    </DashboardShell>
  );
}
