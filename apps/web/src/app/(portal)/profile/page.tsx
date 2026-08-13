'use client';

import React, { useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { AcademicProfileView } from '@/components/profile/AcademicProfileView';
import { Loader2 } from 'lucide-react';

export default function ProfilePage() {
  const { currentUser, fetchProfile } = useStore();

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center gap-2 text-slate-500">
        <Loader2 className="w-8 h-8 text-[#0C4DA2] animate-spin" />
        <span className="text-sm font-bold">Loading profile...</span>
      </div>
    );
  }

  return (
    <AcademicProfileView
      user={currentUser}
      isOwnProfile={true}
    />
  );
}
