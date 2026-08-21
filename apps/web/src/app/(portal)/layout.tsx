'use client';

import Sidebar from '@/components/dashboard/Sidebar';
import Navbar from '@/components/dashboard/Navbar';
import { useStore } from '@/store/useStore';
import React, { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ToastContainer } from '@/components/Toast';
import { PushNotificationPrompt } from '@/components/shared/PushNotificationPrompt';
import { AlertTriangle } from 'lucide-react';
import { isRouteAllowedForRole } from '@/lib/auth/permissions';
import PortalLoading from './loading';

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser, setCurrentUser, fetchData, setTheme, syncUserSession } = useStore();
  const [authTimedOut, setAuthTimedOut] = useState(false);
  const [isAuthVerifying, setIsAuthVerifying] = useState(true);
  const hasInitialized = useRef(false);

  // Sync local storage theme on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = (localStorage.getItem('curiousbees-theme') as 'dark' | 'light') || 'light';
      setTheme(savedTheme);
    }
  }, [setTheme]);

  // Set timeout safety for auth loading screen
  useEffect(() => {
    if (isAuthVerifying) {
      const timer = setTimeout(() => {
        console.warn('[PortalLayout] Auth initialization is taking longer than 15 seconds.');
        setAuthTimedOut(true);
      }, 15000);
      return () => clearTimeout(timer);
    } else {
      setAuthTimedOut(false);
    }
  }, [isAuthVerifying]);

  // 1. Initial auth sync (only runs once on mount)
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const initAuth = async () => {
      console.info('[PortalLayout] Running initAuth (mount)...');
      let activeUser = useStore.getState().currentUser;
      if (!activeUser) {
        console.info('[PortalLayout] No active currentUser cached. Invoking syncUserSession()...');
        activeUser = await syncUserSession();
      } else {
        console.info('[PortalLayout] Using cached currentUser:', activeUser.email);
      }

      setIsAuthVerifying(false);
      if (activeUser) {
        console.info('[PortalLayout] Initial sync complete. Triggering data fetch.');
        const skipThreads = window.location.pathname.includes('/feed');
        fetchData(skipThreads);
      }
    };

    initAuth();
  }, [syncUserSession, fetchData]);

  // 2. Reactive user authorization & route checks
  useEffect(() => {
    if (isAuthVerifying) return;

    const activeUser = useStore.getState().currentUser;

    if (!activeUser) {
      if (useStore.getState().notProvisioned) {
        console.warn('[PortalLayout] Account not provisioned. Redirecting to /not-provisioned.');
        router.push('/not-provisioned');
        return;
      }
      if (useStore.getState().isSuspended) {
        console.warn('[PortalLayout] Account suspended. Redirecting to /account-suspended.');
        router.push('/account-suspended');
        return;
      }
      console.warn('[PortalLayout] Unauthenticated access detected. Redirecting to /login.');
      router.push('/login');
      return;
    }

    if (!activeUser.onboardingCompleted) {
      console.warn('[PortalLayout] User has not completed onboarding. Redirecting to /onboarding.');
      router.push('/onboarding');
      return;
    }

    if (activeUser.status === 'SUSPENDED' || activeUser.suspended) {
      console.warn('[PortalLayout] User account was suspended. Redirecting to /account-suspended.');
      router.push('/account-suspended');
      return;
    }

    if (activeUser.status === 'REJECTED') {
      console.warn('[PortalLayout] User account was rejected. Redirecting to /verification-pending.');
      router.push('/verification-pending');
      return;
    }

    if (
      activeUser.status === 'PENDING' ||
      activeUser.status === 'PENDING_SUPERVISOR_APPROVAL' ||
      activeUser.status === 'PENDING_ADMIN_APPROVAL'
    ) {
      console.warn('[PortalLayout] User is pending approval. Redirecting to /verification-pending.');
      router.push('/verification-pending');
      return;
    }

    if (activeUser.role === 'RESEARCH_SCHOLAR' && (!activeUser.approved || !activeUser.supervisorId)) {
      console.warn('[PortalLayout] Scholar is awaiting supervisor approval or assignment. Redirecting to /verification-pending.');
      router.push('/verification-pending');
      return;
    }

    if (activeUser.role === 'RESEARCH_SUPERVISOR' && !activeUser.approved) {
      console.warn('[PortalLayout] Supervisor is awaiting admin approval. Redirecting to /verification-pending.');
      router.push('/verification-pending');
      return;
    }

    // Role-based path authorization check
    if (!isRouteAllowedForRole(activeUser.role, pathname)) {
      console.warn(`[PortalLayout] Access unauthorized for role ${activeUser.role} on path ${pathname}`);
      router.push('/unauthorized');
      return;
    }
  }, [isAuthVerifying, currentUser, pathname, router]);

  if (isAuthVerifying || !currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#07111F] flex items-center justify-center text-slate-500 dark:text-slate-400 font-sans">
        <div className="flex flex-col items-center space-y-4 p-6 text-center max-w-sm">
          {authTimedOut ? (
            <div className="space-y-4 animate-fade-in">
              <div className="flex justify-center">
                <AlertTriangle className="w-10 h-10 text-amber-500 animate-pulse" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-800 dark:text-[#F5F7FA]">Connection Delay Detected</p>
                <p className="text-xs text-slate-500 dark:text-[#A7B3C5] leading-relaxed">
                  We are having trouble verifying your credentials. 
                  Please check your network connection and try again.
                </p>
              </div>
              <button
                onClick={() => {
                  setAuthTimedOut(false);
                  syncUserSession({ force: true });
                }}
                className="w-full mt-2 py-2 px-4 bg-[#0c4da2] dark:bg-[#2563EB] hover:bg-[#0c4da2]/90 dark:hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all shadow cursor-pointer border border-[#0c4da2] dark:border-blue-500"
              >
                Retry Authentication
              </button>
            </div>
          ) : (
            <>
              <div className="w-8 h-8 rounded-full border-3 border-[#0C4DA2] dark:border-[#3B82F6] border-t-transparent animate-spin" />
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-[#A7B3C5]">Preparing your research workspace...</p>
            </>
          )}
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col md:flex-row transition-colors duration-300 relative">
      {/* Persistent Navigational Sidebar */}
      <Sidebar />

      {/* Main content body containing header and main child view */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Navbar />
        
        {/* Scrollable contents zone */}
        <main className="flex-1 p-margin-mobile md:p-margin-desktop max-w-container-max mx-auto w-full transition-all duration-300">
          <Suspense fallback={<PortalLoading />}>
            {children}
          </Suspense>
        </main>
      </div>
      <PushNotificationPrompt />
      <ToastContainer />
    </div>
  );
}
