'use client';

import Sidebar from '@/components/dashboard/Sidebar';
import Navbar from '@/components/dashboard/Navbar';
import { useStore } from '@/store/useStore';
import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer } from '@/components/Toast';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

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

  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  }));

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

  useEffect(() => {
    // Only run once per mount — prevents re-triggering on every currentUser state change
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    let active = true;

    const initAuth = async () => {
      console.info('[PortalLayout] Running initAuth...');

      // Always read fresh from store, not from closure
      let activeUser = useStore.getState().currentUser;

      if (!activeUser) {
        console.info('[PortalLayout] No active currentUser cached. Invoking syncUserSession()...');
        activeUser = await syncUserSession();
      } else {
        console.info('[PortalLayout] Using cached currentUser:', activeUser.email);
      }

      if (!active) return;

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
        console.warn('[PortalLayout] Unauthenticated access detected. Redirecting to /sign-in.');
        router.push('/sign-in');
        return;
      }

      if (!activeUser.onboardingCompleted) {
        console.warn('[PortalLayout] User has not completed onboarding. Redirecting to /onboarding.');
        router.push('/onboarding');
        return;
      }

      if (activeUser.status === 'REJECTED') {
        console.warn('[PortalLayout] User account was rejected. Redirecting to /access-denied.');
        router.push('/access-denied');
        return;
      }

      if (activeUser.status === 'SUSPENDED') {
        console.warn('[PortalLayout] User account was suspended. Redirecting to /account-suspended.');
        router.push('/account-suspended');
        return;
      }

      if (
        activeUser.status === 'PENDING' ||
        activeUser.status === 'PENDING_SUPERVISOR_APPROVAL' ||
        activeUser.status === 'PENDING_ADMIN_APPROVAL'
      ) {
        console.warn('[PortalLayout] User is pending approval. Redirecting to /approval-pending.');
        router.push('/approval-pending');
        return;
      }

      if (pathname.startsWith('/admin') && activeUser.role !== 'INSTITUTE_ADMIN') {
        router.push('/unauthorized');
        return;
      }
      if (pathname.startsWith('/institute-admin') && activeUser.role !== 'INSTITUTE_ADMIN') {
        router.push('/unauthorized');
        return;
      }
      if (pathname.startsWith('/supervisor') && activeUser.role !== 'RESEARCH_SUPERVISOR') {
        router.push('/unauthorized');
        return;
      }
      if (pathname.startsWith('/scholar') && activeUser.role !== 'RESEARCH_SCHOLAR') {
        router.push('/unauthorized');
        return;
      }

      console.info('[PortalLayout] Authentication checks passed. Initializing data fetch...');
      setIsAuthVerifying(false);
      fetchData();
    };

    initAuth();
    return () => {
      active = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isAuthVerifying || !currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 font-sans">
        <div className="flex flex-col items-center space-y-4 p-6 text-center max-w-sm">
          {authTimedOut ? (
            <div className="space-y-4 animate-fade-in">
              <div className="flex justify-center">
                <AlertTriangle className="w-10 h-10 text-amber-500 animate-pulse" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-800">Connection Delay Detected</p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  We are having trouble verifying your credentials. 
                  Please check your network connection and try again.
                </p>
              </div>
              <button
                onClick={() => {
                  setAuthTimedOut(false);
                  window.location.reload();
                }}
                className="w-full mt-2 py-2 px-4 bg-[#0c4da2] hover:bg-[#0c4da2] text-white rounded-lg text-xs font-bold transition-all shadow cursor-pointer border border-[#0c4da2]"
              >
                Retry Authentication
              </button>
            </div>
          ) : (
            <>
              <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Verifying Intranet Security Credentials...</p>
            </>
          )}
        </div>
      </div>
    );
  }
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background text-on-surface flex flex-col md:flex-row transition-colors duration-300 relative">
        {/* Persistent Navigational Sidebar */}
        <Sidebar />

        {/* Main content body containing header and main child view */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <Navbar />
          
          {/* Scrollable contents zone */}
          <main className="flex-1 p-margin-mobile md:p-margin-desktop max-w-container-max mx-auto w-full transition-all duration-300">
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="w-full h-full"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
      <ToastContainer />
    </QueryClientProvider>
  );
}
