'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  Loader2,
  Award,
  Zap,
  Network,
  Mail,
  ArrowRight,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Building
} from 'lucide-react';
import Logo from '@/components/Logo';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams?.get('redirectTo') || '/feed';
  const queryError = searchParams?.get('error');

  const { syncUserSession, signInWithGoogle, signInWithMagicLink } = useStore();
  
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(
    queryError === 'auth_callback_failed'
      ? 'Authentication callback failed. Please request a new magic link.'
      : ''
  );
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    // Check if session is already active
    syncUserSession({ throwOnError: false }).then((user) => {
      if (user) {
        router.push(redirectTo);
      }
    });
  }, [router, redirectTo, syncUserSession]);

  const handleMagicLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid institutional email address.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setResendSuccess(false);

    try {
      await signInWithMagicLink(email, redirectTo);
      setIsSubmitted(true);
    } catch (err: any) {
      console.error('[LOGIN] Magic Link Error:', err);
      setErrorMessage(err?.message || 'Unable to send magic link. Please check your email and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendMagicLink = async () => {
    if (isLoading || !email) return;
    setIsLoading(true);
    setErrorMessage('');
    setResendSuccess(false);

    try {
      await signInWithMagicLink(email, redirectTo);
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 4000);
    } catch (err: any) {
      console.error('[LOGIN] Resend Magic Link Error:', err);
      setErrorMessage(err?.message || 'Failed to resend magic link. Please try again in a moment.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setErrorMessage('');
    try {
      await signInWithGoogle(redirectTo);
    } catch (err: any) {
      console.error('[LOGIN] Google Sign-In Error:', err);
      setErrorMessage(err?.message || 'Google authentication could not be initiated.');
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#e6e6fa] selection:bg-yellow-400 selection:text-blue-950">
      {/* Background gradients and mesh blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 honeycomb-bg opacity-[0.25] mix-blend-multiply" />

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
      </div>

      <div className="w-full max-w-4xl relative z-10 px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full rounded-3xl overflow-hidden bg-white/80 backdrop-blur-xl border border-white/50 shadow-2xl flex flex-col md:flex-row min-h-[600px]"
        >
          {/* Left branding panel */}
          <div className="w-full md:w-1/2 bg-gradient-to-br from-[#0C4DA2] to-[#042654] p-10 flex flex-col justify-between relative overflow-hidden text-white">
            <div className="absolute inset-0 bg-honeycomb-stroke opacity-15" />
            <div className="absolute -top-1/4 -right-1/4 w-80 h-80 bg-[#FFC828]/15 rounded-full blur-[60px] pointer-events-none" />
            <div className="absolute -bottom-1/4 -left-1/4 w-80 h-80 bg-[#B88608]/15 rounded-full blur-[60px] pointer-events-none" />

            {/* Top header */}
            <div className="relative z-10 flex">
              <div className="inline-flex items-center gap-3 bg-white p-3 rounded-2xl shadow-xl border border-white/15">
                <Logo size={32} />
              </div>
            </div>

            {/* Middle visual showcase */}
            <div className="relative z-10 my-8 flex items-center justify-center h-48">
              <div className="relative w-40 h-40">
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-0 m-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FFC828] to-[#B88608] flex items-center justify-center shadow-lg shadow-[#B88608]/30 z-20 border border-white/20"
                >
                  <span className="text-2xl font-black text-[#042654]">C</span>
                </motion.div>

                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -top-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 z-10"
                >
                  <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md border border-white/25 flex items-center justify-center shadow-md">
                    <Network className="w-5 h-5 text-[#FFC828]" />
                  </div>
                  <span className="text-[9px] font-bold text-white/60 tracking-wider uppercase">Collab</span>
                </motion.div>

                <motion.div
                  animate={{ y: [0, 8, 0], x: [0, -4, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  className="absolute bottom-0 left-0 flex flex-col items-center gap-1 z-10"
                >
                  <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md border border-white/25 flex items-center justify-center shadow-md">
                    <Award className="w-5 h-5 text-[#FFC828]" />
                  </div>
                  <span className="text-[9px] font-bold text-white/60 tracking-wider uppercase">Tracking</span>
                </motion.div>

                <motion.div
                  animate={{ y: [0, 6, 0], x: [4, 0, 4] }}
                  transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className="absolute bottom-0 right-0 flex flex-col items-center gap-1 z-10"
                >
                  <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md border border-white/25 flex items-center justify-center shadow-md">
                    <Zap className="w-5 h-5 text-[#FFC828]" />
                  </div>
                  <span className="text-[9px] font-bold text-white/60 tracking-wider uppercase font-semibold">Innovate</span>
                </motion.div>
              </div>
            </div>

            {/* Bottom info */}
            <div className="relative z-10">
              <h3 className="font-display font-medium text-lg text-white leading-snug">
                Elevating academic excellence through collaborative innovation.
              </h3>
              <p className="text-xs text-white/50 mt-2">
                A unified research environment for scholars, supervisors, and institutions.
              </p>
            </div>
          </div>

          {/* Right authentication panel */}
          <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-between bg-white/60 backdrop-blur-xl relative border-l border-white/30">
            <div className="my-auto flex flex-col justify-center w-full max-w-sm mx-auto space-y-6">
              
              {/* Header Badge */}
              <div>
                <span className="text-[10px] font-extrabold text-[#0C4DA2] tracking-widest uppercase bg-[#0C4DA2]/10 px-2.5 py-1 rounded-full border border-[#0C4DA2]/20">
                  SRMIST RESEARCH PORTAL
                </span>
                <h2 className="text-2xl font-display font-extrabold text-slate-900 tracking-tight mt-2.5">
                  {isSubmitted ? 'Check your email' : 'Welcome to CuriousBees'}
                </h2>
                <p className="text-slate-500 text-xs sm:text-sm mt-1.5 leading-relaxed font-sans">
                  {isSubmitted 
                    ? 'We sent a secure sign-in link to your institutional email address.'
                    : 'Sign in with your institutional email address.'}
                </p>
              </div>

              {/* Error Callout */}
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2.5 bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-left text-xs font-semibold text-rose-800"
                >
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <p>{errorMessage}</p>
                </motion.div>
              )}

              {/* Resend Success Banner */}
              {resendSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-left text-xs font-bold text-emerald-800"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <p>A new magic link has been dispatched to your email.</p>
                </motion.div>
              )}

              {/* VIEW A: Initial State (Enter Email & Send Magic Link) */}
              {!isSubmitted ? (
                <form onSubmit={handleMagicLinkSubmit} className="space-y-4 text-left">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider block">
                      Institutional Email Address
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#0C4DA2] transition-colors">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your institutional email"
                        disabled={isLoading}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0C4DA2]/40 focus:border-[#0C4DA2] transition-all shadow-2xs"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 font-medium pt-0.5">
                      We'll send you a secure sign-in link to your institutional email.
                    </p>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="submit"
                    disabled={isLoading || !email}
                    className="w-full h-12 rounded-xl bg-[#0C4DA2] hover:bg-[#042654] text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sending Magic Link...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Magic Link</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </motion.button>

                  <div className="relative my-4 flex items-center justify-center">
                    <div className="border-t border-slate-200 w-full" />
                    <span className="bg-white/80 px-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 absolute">
                      Or
                    </span>
                  </div>

                  {/* Google OAuth Alternative */}
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isGoogleLoading}
                    className="w-full h-12 px-4 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 text-xs font-bold flex items-center justify-center gap-3 transition-all duration-200 shadow-2xs cursor-pointer disabled:opacity-50"
                  >
                    {isGoogleLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-[#0C4DA2]" />
                    ) : (
                      <>
                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
                        <span>Continue with Google</span>
                      </>
                    )}
                  </motion.button>
                </form>
              ) : (
                /* VIEW B: Magic Link Dispatched (Check Email Screen) */
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-5 text-left"
                >
                  <div className="p-4 bg-blue-50/70 border border-blue-100 rounded-2xl space-y-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block">
                      Target Email Address
                    </span>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-[#0C4DA2] shrink-0" />
                      <span className="font-extrabold text-xs text-slate-900 truncate">
                        {email}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1 text-xs text-slate-600">
                    <p className="font-bold text-slate-800">
                      Open your email client and click <span className="text-[#0C4DA2]">"Sign in to CuriousBees"</span>.
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium">
                      The link will securely authenticate your session and automatically direct you to your portal.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2.5 pt-2">
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      type="button"
                      onClick={handleResendMagicLink}
                      disabled={isLoading}
                      className="w-full h-11 rounded-xl bg-[#0C4DA2] hover:bg-[#042654] text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Resending...</span>
                        </>
                      ) : (
                        <>
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Resend Magic Link</span>
                        </>
                      )}
                    </motion.button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsSubmitted(false);
                        setErrorMessage('');
                      }}
                      className="w-full py-2.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors text-center cursor-pointer"
                    >
                      Change Email Address
                    </button>
                  </div>
                </motion.div>
              )}

            </div>

            {/* Footer */}
            <div className="text-center pt-6 text-[10px] text-slate-400 font-bold tracking-wider uppercase flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Passwordless Security • Supabase Magic Link</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#e6e6fa]">
        <div className="w-10 h-10 border-4 border-[#0C4DA2] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
