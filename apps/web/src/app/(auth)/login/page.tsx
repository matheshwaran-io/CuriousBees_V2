'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { signInWithGoogle, auth } from '@/lib/firebase';
import { requestFcmToken, sendTokenToBackend } from '@/lib/fcm';
import { signOut } from 'firebase/auth';
import Link from 'next/link';
import { 
  ArrowLeft, 
  AlertTriangle,
  GraduationCap,
  Lock,
  Terminal,
  Activity,
  User,
  Shield,
  Loader2
} from 'lucide-react';
import Logo from '@/components/Logo';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const router = useRouter();
  const { syncUserSession, currentUser, dashboardRoute } = useStore();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [bypassRole, setBypassRole] = useState<'faculty' | 'scholar'>('faculty');

  // Show access denied if redirected with error param
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const err = params.get('error');
      if (err === 'access_denied') {
        setErrorMsg('Your account could not be synced with CuriousBees. Please try again or use the developer sandbox bypass if Firebase is not configured locally.');
      }
    }
  }, []);

  // Detect if Firebase has placeholder/unconfigured environment keys
  const isFirebasePlaceholder = 
    !process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY === 'your-firebase-api-key' ||
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY.startsWith('mock-');

  // Sync session on mount
  useEffect(() => {
    syncUserSession();
  }, [syncUserSession]);

  // Redirect if already logged in
  useEffect(() => {
    if (currentUser) {
      router.push(dashboardRoute || '/dashboard');
    }
  }, [currentUser, dashboardRoute, router]);

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    setAuthLoading(true);

    try {
      const { user, token } = await signInWithGoogle();
      console.info('[Login] Google sign-in completed, starting backend sync:', {
        uid: user.uid,
        email: user.email,
        tokenLength: token.length,
      });

      const syncedUser = await syncUserSession({ throwOnError: true });
      if (syncedUser) {
        // Initialize FCM after successful login and backend sync
        try {
          const fcmToken = await requestFcmToken();
          if (fcmToken) {
            await sendTokenToBackend(fcmToken);
          }
        } catch (fcmError) {
          console.warn('[Login] Non-fatal FCM registration error:', fcmError);
        }

        // Role-based redirect determined by the backend user profile.
        const route = syncedUser.role === 'INSTITUTION_ADMIN' ? '/admin' : '/dashboard';
        router.push(route);
      } else {
        await signOut(auth);
        setErrorMsg('CuriousBees could not sync your Google session with the backend.');
      }
    } catch (e: any) {
      console.error(e);
      await signOut(auth).catch(() => {});
      if (e.message?.includes('auth/api-key-not-valid') || e.code?.includes('api-key-not-valid')) {
        setErrorMsg('Security Alert: The Firebase API key configured is invalid. Use the local sandbox bypass below.');
      } else {
        setErrorMsg(e.message || 'Authentication aborted or failed.');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleDeveloperBypass = async () => {
    setErrorMsg(null);
    setAuthLoading(true);
    try {
      const mockToken = `mock-bypass-token-${bypassRole}`;
      if (typeof window !== 'undefined') {
        localStorage.setItem('curiousbees-mock-token', mockToken);
      }
      
      const syncedUser = await syncUserSession();
      if (syncedUser) {
        const route = syncedUser.role === 'INSTITUTION_ADMIN' ? '/admin' : '/dashboard';
        router.push(route);
      } else {
        setErrorMsg('Local developer bypass failed to synchronize with backend database.');
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Developer bypass authentication failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Honeycomb SVG background matching Stitch spec
  const honeycombStyle = {
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='104' viewBox='0 0 60 104' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l30 17.32v34.64L30 69.28 0 51.96V17.32L30 0z' fill='%23004495' fill-opacity='0.03' fill-rule='evenodd'/%3E%3C/svg%3E")`
  };

  return (
    <div 
      className="bg-background min-h-screen flex items-center justify-center p-margin-mobile md:p-margin-desktop relative overflow-hidden select-none"
      style={honeycombStyle}
    >
      {/* Decorative Blur Orbs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary-fixed-dim/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse-slow"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-tertiary-fixed-dim/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse-slow animation-delay-2000"></div>

      {/* Back to Home Link */}
      <Link 
        href="/" 
        className="absolute top-8 left-8 flex items-center space-x-2 text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors z-20"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Home</span>
      </Link>

      {/* Centered Main Login Container */}
      <div className="w-full max-w-md relative z-10">
        
        {/* Main Glass Panel */}
        <div className="glass-panel rounded-xl p-stack-lg md:p-stack-xl flex flex-col items-center text-center">
          
          {/* Logo container box */}
          <div className="w-24 h-24 mb-stack-lg relative rounded-md overflow-hidden bg-surface-container-highest border border-outline-variant/30 flex items-center justify-center">
            <Logo showText={false} size={64} />
          </div>

          {/* Heading Headers */}
          <h1 className="font-display font-bold text-headline-xl-mobile md:text-headline-xl text-on-surface mb-stack-xs tracking-tight">
            Welcome Back
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mb-stack-xl max-w-[280px]">
            Sign in to continue to your academic research workspace.
          </p>

          {/* Error Banner */}
          <AnimatePresence mode="wait">
            {errorMsg && (
              <motion.div 
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                className="overflow-hidden mb-6 w-full text-left"
              >
                <div className="bg-error-container border border-error/30 text-error rounded-lg p-4 flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p className="text-[13px] leading-relaxed font-semibold">{errorMsg}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Area */}
          <div className="w-full space-y-stack-md">
            
            {/* Google SSO Button */}
            <button 
              onClick={handleGoogleLogin}
              disabled={authLoading}
              className="w-full group relative flex items-center justify-center gap-3 bg-surface-container-lowest border border-outline-variant hover:border-primary hover:bg-primary-fixed transition-all duration-300 py-4 px-6 rounded-lg text-on-surface font-label-md text-label-md overflow-hidden disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              <span className="absolute inset-0 w-full h-full -mt-1 rounded-lg opacity-30 bg-gradient-to-b from-transparent via-transparent to-primary/10"></span>
              {authLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-primary shrink-0 relative z-10" />
              ) : (
                <svg className="w-5 h-5 relative z-10" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                </svg>
              )}
              <span className="relative z-10 font-bold">
                {authLoading ? 'Signing In...' : 'Login with Google Account'}
              </span>
            </button>

            {/* Divider */}
            <div className="relative py-stack-md flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-outline-variant/50"></div>
              </div>
              <div className="relative bg-surface-container-lowest px-4 text-xs font-label-caps text-label-caps text-outline uppercase tracking-wider rounded-full py-1 border border-outline-variant/30 font-semibold select-none">
                Institutional Access
              </div>
            </div>

            {/* Secondary Action: Link to SignUp */}
            <div className="text-center">
              <Link 
                className="inline-flex items-center justify-center font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors group" 
                href="/signup"
              >
                <span>New to the platform?</span>
                <span className="font-semibold text-primary ml-1 border-b border-transparent group-hover:border-primary transition-colors">
                  Create an account
                </span>
              </Link>
            </div>

            {/* Sandbox Developer Bypass */}
            {(isFirebasePlaceholder || errorMsg?.includes('API key')) && (
              <div className="mt-8 pt-6 border-t border-outline-variant/40 w-full text-left">
                
                <div className="flex items-center space-x-2 text-[11px] font-bold uppercase tracking-wider text-secondary mb-4 select-none">
                  <Activity className="w-3.5 h-3.5 animate-pulse text-secondary" />
                  <span>Developer Sandbox Bypass</span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <button
                    onClick={() => setBypassRole('faculty')}
                    className={cn(
                      "py-2 px-3 rounded-lg border text-left transition flex items-center space-x-2.5 cursor-pointer font-label-md text-label-md",
                      bypassRole === 'faculty'
                        ? 'border-primary bg-primary/5 text-primary font-semibold'
                        : 'border-outline-variant/50 bg-transparent text-on-surface-variant hover:bg-surface-container'
                    )}
                  >
                    <GraduationCap className="w-4 h-4 shrink-0" />
                    <span>Faculty Guide</span>
                  </button>

                  <button
                    onClick={() => setBypassRole('scholar')}
                    className={cn(
                      "py-2 px-3 rounded-lg border text-left transition flex items-center space-x-2.5 cursor-pointer font-label-md text-label-md",
                      bypassRole === 'scholar'
                        ? 'border-primary bg-primary/5 text-primary font-semibold'
                        : 'border-outline-variant/50 bg-transparent text-on-surface-variant hover:bg-surface-container'
                    )}
                  >
                    <User className="w-4 h-4 shrink-0" />
                    <span>PhD Scholar</span>
                  </button>
                </div>

                <button
                  onClick={handleDeveloperBypass}
                  disabled={authLoading}
                  className="w-full py-3 rounded-lg text-xs font-semibold text-primary bg-white hover:bg-surface-container border border-outline-variant transition flex items-center justify-center space-x-2 active:scale-[0.98] cursor-pointer"
                >
                  <Terminal className="w-4 h-4 text-primary" />
                  <span>Launch Simulation</span>
                </button>
              </div>
            )}

          </div>

          {/* Footer Note */}
          <div className="mt-stack-xl pt-stack-md border-t border-outline-variant/20 w-full text-center select-none">
            <p className="font-body-sm text-[12px] text-outline flex items-center justify-center gap-2 font-medium">
              <Shield className="w-4 h-4 text-outline shrink-0" />
              <span>Secure Institutional Login</span>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
