'use client';

import { useSignIn } from '@clerk/nextjs/legacy';
import { useAuth, useClerk, SignIn } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ShieldCheck, AlertCircle, Info, Loader2, Award, Zap, Network
} from 'lucide-react';

export default function SignInPage() {
  const { signIn } = useSignIn();
  const { setActive } = useClerk();
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const router = useRouter();

  const isGoogleAdminManaged = process.env.NEXT_PUBLIC_AUTH_MODE === 'GOOGLE_ADMIN_MANAGED';
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoaded && isSignedIn) {
      router.push('/dashboard');
    }
  }, [authLoaded, isSignedIn, router]);

  const handleGoogleSignIn = async () => {
    if (!signIn) return;
    setIsLoading(true);
    setError('');
    try {
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/dashboard',
      });
    } catch (err: any) {
      setError(err?.message || 'Google authentication failed.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#e6e6fa]">
      {/* Background gradients and mesh blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Honeycomb overlay */}
        <div className="absolute inset-0 honeycomb-bg opacity-[0.25] mix-blend-multiply" />

        {/* Floating gradient blobs */}
        <motion.div
          animate={{
            x: [0, 80, -40, 0],
            y: [0, -60, 50, 0],
            scale: [1, 1.15, 0.9, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -top-20 -left-20 w-[450px] h-[450px] bg-[#0C4DA2]/8 rounded-full blur-[100px]"
        />
        <motion.div
          animate={{
            x: [0, -60, 80, 0],
            y: [0, 80, -40, 0],
            scale: [1, 0.9, 1.2, 1],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -bottom-20 -right-20 w-[500px] h-[500px] bg-[#FFC828]/6 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{
            x: [0, 40, -40, 0],
            y: [0, 50, -60, 0],
            scale: [1, 1.1, 0.95, 1],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[350px] h-[350px] bg-[#B88608]/5 rounded-full blur-[90px]"
        />
      </div>

      <div className="w-full max-w-4xl relative z-10 px-4">
        {/* Double-column premium card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full rounded-3xl overflow-hidden bg-white/75 backdrop-blur-xl border border-white/40 shadow-2xl flex flex-col md:flex-row min-h-[600px]"
        >
          {/* Clerk Smart CAPTCHA anchor — must be mounted before useSignIn triggers */}
          <div id="clerk-captcha" />

          {/* Left branding panel */}
          <div className="w-full md:w-1/2 bg-gradient-to-br from-[#0C4DA2] to-[#042654] p-10 flex flex-col justify-between relative overflow-hidden text-white">
            {/* Mesh overlay inside the panel */}
            <div className="absolute inset-0 bg-honeycomb-stroke opacity-15" />
            
            {/* Glow spots inside left panel */}
            <div className="absolute -top-1/4 -right-1/4 w-80 h-80 bg-[#FFC828]/15 rounded-full blur-[60px] pointer-events-none" />
            <div className="absolute -bottom-1/4 -left-1/4 w-80 h-80 bg-[#B88608]/15 rounded-full blur-[60px] pointer-events-none" />

            {/* Top header */}
            <div className="relative z-10">
              <div className="inline-flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-md">
                  <ShieldCheck className="w-5 h-5 text-[#FFC828]" />
                </div>
                <div>
                  <span className="font-display font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent">CuriousBees</span>
                  <p className="text-[10px] text-white/50 tracking-wider uppercase font-semibold">SRMIST Research Portal</p>
                </div>
              </div>
            </div>

            {/* Middle visual showcase (floating premium nodes) */}
            <div className="relative z-10 my-8 flex items-center justify-center h-48">
              <div className="relative w-40 h-40">
                {/* Center Node (CuriousBees Brand Icon) */}
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-0 m-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FFC828] to-[#B88608] flex items-center justify-center shadow-lg shadow-[#B88608]/30 z-20 border border-white/20"
                >
                  <span className="text-2xl font-black text-[#042654]">C</span>
                </motion.div>

                {/* Node 1: Collaboration */}
                <motion.div
                  animate={{
                    y: [0, -8, 0],
                  }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute -top-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 z-10"
                >
                  <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md border border-white/25 flex items-center justify-center shadow-md">
                    <Network className="w-5 h-5 text-[#FFC828]" />
                  </div>
                  <span className="text-[9px] font-bold text-white/60 tracking-wider uppercase">Collab</span>
                </motion.div>

                {/* Node 2: Tracking */}
                <motion.div
                  animate={{
                    y: [0, 8, 0],
                    x: [0, -4, 0],
                  }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.5
                  }}
                  className="absolute bottom-0 left-0 flex flex-col items-center gap-1 z-10"
                >
                  <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md border border-white/25 flex items-center justify-center shadow-md">
                    <Award className="w-5 h-5 text-[#FFC828]" />
                  </div>
                  <span className="text-[9px] font-bold text-white/60 tracking-wider uppercase">Tracking</span>
                </motion.div>

                {/* Node 3: Innovation */}
                <motion.div
                  animate={{
                    y: [0, 6, 0],
                    x: [0, 4, 0],
                  }}
                  transition={{
                    duration: 5.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1
                  }}
                  className="absolute bottom-0 right-0 flex flex-col items-center gap-1 z-10"
                >
                  <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md border border-white/25 flex items-center justify-center shadow-md">
                    <Zap className="w-5 h-5 text-[#FFC828]" />
                  </div>
                  <span className="text-[9px] font-bold text-white/60 tracking-wider uppercase font-semibold">Innovate</span>
                </motion.div>
              </div>
            </div>

            {/* Bottom info / quote */}
            <div className="relative z-10">
              <h3 className="font-display font-medium text-lg text-white leading-snug">
                Elevating academic excellence through collaborative innovation.
              </h3>
              <p className="text-xs text-white/40 mt-2">
                A unified environment for research scholars, supervisors, and institutional administrators.
              </p>
            </div>
          </div>

          {/* Right authentication panel */}
          <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-between bg-white/40 backdrop-blur-xl relative border-l border-white/20">
            <div className="my-auto flex flex-col justify-center w-full max-w-sm mx-auto">
              
              {/* GOOGLE ADMIN MANAGED MODE */}
              {isGoogleAdminManaged ? (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-display font-extrabold text-[#0C4DA2] tracking-tight">Welcome back</h2>
                    <p className="text-slate-500 text-sm mt-1.5 leading-relaxed font-sans">
                      Sign in with your pre-provisioned institutional email address using Google Sign-In.
                    </p>
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl p-3.5 text-left text-xs font-semibold text-red-800"
                    >
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <p>{error}</p>
                    </motion.div>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    className="w-full h-12 px-4 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50/50 hover:border-slate-300 disabled:opacity-60 disabled:cursor-not-allowed text-sm font-semibold flex items-center justify-center gap-3 transition-all duration-200 shadow-sm cursor-pointer"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin text-[#0C4DA2]" />
                    ) : (
                      <>
                        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                          />
                        </svg>
                        <span>Sign In with Google</span>
                      </>
                    )}
                  </motion.button>

                  <div className="flex items-start gap-2.5 bg-[#FFC828]/5 border border-[#FFC828]/20 rounded-xl p-4 text-left text-[11px] text-slate-600 leading-relaxed font-medium">
                    <Info className="w-4.5 h-4.5 text-[#B88608] shrink-0 mt-0.5" />
                    <p>
                      Access is permitted only for pre-provisioned university accounts. If your account is not provisioned, please contact your administrator. Allowed domains: <span className="text-[#0C4DA2] font-semibold">@{process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS || 'srmist.edu.in'}</span>
                    </p>
                  </div>
                </div>
              ) : (
                /* STANDARD CLERK SIGN IN COMPONENT */
                <SignIn
                  routing="path"
                  path="/sign-in"
                  signUpUrl="/sign-up"
                  appearance={{
                    layout: {
                      socialButtonsPlacement: 'top',
                      showOptionalFields: false,
                    },
                    variables: {
                      colorPrimary: '#0C4DA2',
                      colorBackground: '#ffffff',
                      colorText: '#191b29',
                      colorTextSecondary: '#6e6e6e',
                      borderRadius: '12px',
                      fontFamily: 'var(--font-sans)',
                    },
                    elements: {
                      rootBox: 'w-full',
                      card: 'shadow-none border-0 bg-transparent p-0 w-full max-w-none',
                      headerTitle: 'text-2xl font-display font-extrabold text-[#0C4DA2] tracking-tight',
                      headerSubtitle: 'text-sm text-slate-500 font-sans mt-1.5 leading-relaxed',
                      socialButtonsBlockButton: 'border border-slate-200 hover:bg-slate-50/50 text-slate-700 font-semibold h-11 transition-all rounded-xl shadow-none',
                      socialButtonsBlockButtonText: 'font-semibold text-slate-600',
                      formButtonPrimary: 'bg-[#0C4DA2] hover:bg-[#0C4DA2]/90 active:scale-[0.98] text-white font-semibold h-11 transition-all rounded-xl shadow-md shadow-[#0C4DA2]/10',
                      formFieldLabel: 'text-xs font-semibold text-slate-500 uppercase tracking-wider',
                      formFieldInput: 'h-11 rounded-xl border border-slate-200 focus:border-[#0C4DA2] focus:ring-2 focus:ring-[#0C4DA2]/10 bg-white transition-all text-sm',
                      footerActionLink: 'text-[#0C4DA2] hover:text-[#0c4da2]/80 font-semibold',
                      dividerLine: 'bg-slate-100',
                      dividerText: 'text-slate-400 text-xs font-medium uppercase tracking-wider',
                    }
                  }}
                />
              )}
            </div>

            {/* Footer */}
            <div className="text-center pt-8 text-[10px] text-slate-400 font-medium tracking-wider uppercase">
              SRMIST • Secured by Clerk
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
