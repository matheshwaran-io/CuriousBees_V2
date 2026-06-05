'use client';

import Sidebar from '@/components/dashboard/Sidebar';
import Navbar from '@/components/dashboard/Navbar';
import { useStore } from '@/store/useStore';
import { useEffect, useState } from 'react';
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
  const { currentUser, setCurrentUser, fetchData, setTheme, syncUserSession, isLoading } = useStore();
  const [authTimedOut, setAuthTimedOut] = useState(false);

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

  // Set timeout safety for loading screen
  useEffect(() => {
    if (!currentUser || isLoading) {
      const timer = setTimeout(() => {
        console.warn('[PortalLayout] Auth initialization is taking longer than 5 seconds.');
        setAuthTimedOut(true);
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      setAuthTimedOut(false);
    }
  }, [currentUser, isLoading]);

  useEffect(() => {
    let active = true;
    const isDevMode = process.env.NEXT_PUBLIC_DEVELOPMENT_MODE === 'true';

    const initAuth = async () => {
      console.info('[PortalLayout] Running initAuth...');

      let activeUser = currentUser;
      
      if (isDevMode) {
        console.warn('[PortalLayout] DEVELOPMENT_MODE active. Bypassing auth checks.');
        const devRole = typeof window !== 'undefined' ? (localStorage.getItem('dev_role') || 'RESEARCH_SCHOLAR') : 'RESEARCH_SCHOLAR';
        const mockDevUser = {
          id: 'dev-user',
          name: 'Developer',
          email: 'developer@local.dev',
          role: devRole,
          approved: true,
          status: 'APPROVED',
          department: 'Development'
        } as any;
        
        if (!currentUser || currentUser.id !== 'dev-user' || currentUser.role !== devRole) {
           setCurrentUser(mockDevUser);
           activeUser = mockDevUser;
        }
      } else {
        if (!activeUser) {
          console.info('[PortalLayout] No active currentUser cached. Invoking syncUserSession()...');
          activeUser = await syncUserSession();
        } else {
          console.info('[PortalLayout] Using cached currentUser:', activeUser.email);
        }
      }

      if (!active) return;

      if (!isDevMode) {
        if (!activeUser) {
          console.warn('[PortalLayout] Unauthenticated access detected. Redirecting to /login.');
          router.push('/login');
          return;
        }

        if (activeUser.status === 'ONBOARDING') {
          console.warn('[PortalLayout] User has not completed onboarding. Redirecting to /onboarding.');
          router.push('/onboarding');
          return;
        }

        if (activeUser.role !== 'INSTITUTION_ADMIN' && (!activeUser.approved || activeUser.status !== 'APPROVED')) {
          console.warn('[PortalLayout] User is pending approval. Redirecting to /verification-pending.');
          router.push('/verification-pending');
          return;
        }
      }

      console.info('[PortalLayout] Authentication checks passed. Initializing data fetch...');
      fetchData(); // Trigger initial live API fetch

      if (!isDevMode) {
        // Register device for FCM Push Notifications (dynamically loaded to bypass SSR constraints)
        import('@/lib/fcm').then(async ({ requestFcmToken, sendTokenToBackend }) => {
          try {
            const token = await requestFcmToken();
            if (token && active) {
              console.info('[PortalLayout] Registering FCM token...');
              await sendTokenToBackend(token);
            }
          } catch (err) {
            console.error('[PortalLayout] FCM Registration hook failed:', err);
          }
        });
      }
    };

    initAuth();
    return () => {
      active = false;
    };
  }, [currentUser, router, fetchData, syncUserSession]);

  if ((isLoading || !currentUser) && process.env.NEXT_PUBLIC_DEVELOPMENT_MODE !== 'true') {
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
                className="w-full mt-2 py-2 px-4 bg-[#0d3c61] hover:bg-[#004495] text-white rounded-lg text-xs font-bold transition-all shadow cursor-pointer border border-[#0d3c61]"
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

  const isDevMode = process.env.NEXT_PUBLIC_DEVELOPMENT_MODE === 'true';

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
        
        {/* Development Mode Switcher */}
        {isDevMode && (
          <div className="fixed bottom-4 right-4 bg-slate-900 text-white p-4 rounded-xl shadow-2xl z-50 flex flex-col gap-2 border border-slate-700">
            <div className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">Dev Override Active</div>
            <select 
              className="bg-slate-800 text-white text-sm rounded p-2 border border-slate-600 outline-none"
              value={currentUser?.role || 'RESEARCH_SCHOLAR'}
              onChange={(e) => {
                const role = e.target.value;
                localStorage.setItem('dev_role', role);
                localStorage.setItem('curiousbees-mock-token', `mock-bypass-token-${role === 'INSTITUTION_ADMIN' ? 'admin' : role === 'RESEARCH_SUPERVISOR' ? 'faculty' : 'scholar'}`);
                window.location.href = role === 'INSTITUTION_ADMIN' ? '/admin/dashboard' : '/dashboard';
              }}
            >
              <option value="RESEARCH_SCHOLAR">Scholar</option>
              <option value="RESEARCH_SUPERVISOR">Supervisor</option>
              <option value="INSTITUTION_ADMIN">Admin</option>
            </select>
          </div>
        )}
      </div>
      <ToastContainer />
    </QueryClientProvider>
  );
}
