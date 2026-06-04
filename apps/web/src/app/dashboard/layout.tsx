'use client';

import React, { useEffect } from 'react';
import { Sidebar } from '@/components/dashboard/navigation/sidebar';
import { Topbar } from '@/components/dashboard/navigation/topbar';
import { useStore } from '@/store/useStore';
import { useRouter } from 'next/navigation';
import { getDashboardRoute } from '@/lib/auth/route-protection';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, isLoading } = useStore();
  const router = useRouter();

  useEffect(() => {
    // Only redirect after the auth state has settled (not during initial load)
    if (isLoading) return;
    if (!currentUser) {
      router.replace('/login');
      return;
    }
    // An unapproved scholar who somehow landed on /dashboard/* gets bounced
    if (currentUser.role === 'RESEARCH_SCHOLAR' && !currentUser.approved) {
      router.replace('/verification-pending');
    }
  }, [currentUser, isLoading, router]);

  // Show nothing while auth is being determined to avoid flash
  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-background flex w-full">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-64 shrink-0">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
