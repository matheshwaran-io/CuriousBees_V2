'use client';

import React from 'react';
import { useStore } from '@/store/useStore';
import { AcademicProfileView } from '@/components/profile/AcademicProfileView';

export default function ScholarProfilePage() {
  const { currentUser } = useStore();

  return (
    <AcademicProfileView
      user={currentUser}
      isOwnProfile={true}
    />
  );
}
