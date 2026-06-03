'use client';

import Sidebar from '@/components/dashboard/Sidebar';
import Navbar from '@/components/dashboard/Navbar';
import { useStore } from '@/store/useStore';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { currentUser, fetchData, setTheme } = useStore();

  // Sync local storage theme on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = (localStorage.getItem('curiousbees-theme') as 'dark' | 'light') || 'light';
      setTheme(savedTheme);
    }
  }, [setTheme]);

  // Client-side authentication guard:
  useEffect(() => {
    if (!currentUser) {
      router.push('/login');
    } else if (currentUser.role === 'RESEARCH_SCHOLAR' && !currentUser.approved) {
      router.push('/verification-pending');
    } else {
      fetchData(); // Trigger initial live API fetch
      
      // Register device for FCM Push Notifications (dynamically loaded to bypass SSR constraints)
      import('@/lib/fcm').then(async ({ requestFcmToken, sendTokenToBackend }) => {
        try {
          const token = await requestFcmToken();
          if (token) {
            await sendTokenToBackend(token);
          }
        } catch (err) {
          console.error('FCM Registration hook failed:', err);
        }
      });
    }
  }, [currentUser, router, fetchData]);

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#070a13] flex items-center justify-center text-slate-500 dark:text-slate-400 font-sans">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-xs font-semibold uppercase tracking-wider">Verifying Intranet Security Credentials...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background text-on-surface flex flex-col md:flex-row transition-colors duration-300">
        {/* Persistent Navigational Sidebar */}
        <Sidebar />

        {/* Main content body containing header and main child view */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <Navbar />
          
          {/* Scrollable contents zone */}
          <main className="flex-1 p-margin-mobile md:p-margin-desktop max-w-container-max mx-auto w-full transition-all duration-300">
            {children}
          </main>
        </div>
      </div>
    </QueryClientProvider>
  );
}
