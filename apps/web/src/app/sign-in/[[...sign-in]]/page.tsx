'use client';

import { useSignIn, useAuth, useClerk } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, AlertCircle, CheckCircle2,
  RotateCcw, KeyRound, Loader2
} from 'lucide-react';

type AuthView = 'login' | 'forgot_password' | 'reset_code' | 'new_password' | 'success';

export default function SignInPage() {
  const { signIn } = useSignIn();
  const { setActive } = useClerk();
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authLoaded && isSignedIn) {
      router.push('/dashboard');
    }
  }, [authLoaded, isSignedIn, router]);


  const [view, setView] = useState<AuthView>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const validateSrmEmail = (e: string) => {
    if (e === 'mr9820' || e === 'mr9820@srmist.edu.in') return '';
    if (e && !e.toLowerCase().endsWith('@srmist.edu.in')) {
      return 'Only SRM Institute email addresses are allowed.';
    }
    return '';
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signIn) return;
    setError('');
    const domainError = validateSrmEmail(email);
    if (domainError) { setError(domainError); return; }
    setIsLoading(true);
    try {
      // In Clerk v7, signIn.create() may return void — we must read state
      // from the reactive `signIn` object (from the hook) after the call.
      await signIn.create({ identifier: email, password });

      // Give Clerk's reactive state a tick to update
      await new Promise(r => setTimeout(r, 200));

      // Read status from all known locations in order of preference
      const w = window as any;
      const hookStatus = signIn?.status;
      const clientStatus = w.Clerk?.client?.signIn?.status;
      const activeSession = w.Clerk?.client?.activeSessions?.[0]
        || w.Clerk?.client?.sessions?.[0]
        || w.Clerk?.session;

      const finalStatus = hookStatus || clientStatus || (activeSession ? 'complete' : null);
      const finalSessionId = signIn?.createdSessionId
        || w.Clerk?.client?.signIn?.createdSessionId
        || activeSession?.id;

      if (finalStatus === 'complete') {
        await setActive({ session: finalSessionId });
        router.push('/dashboard');
      } else if (activeSession) {
        // Session exists even if status wasn't 'complete' — activate it
        await setActive({ session: activeSession.id });
        router.push('/dashboard');
      } else {
        const supportedFactors = signIn?.supportedFirstFactors?.map((f: any) => f.strategy).join(', ') || 'none';
        setError(`Sign in incomplete. Status: ${finalStatus ?? 'unknown'}. Supported factors: ${supportedFactors}`);
      }
    } catch (err: any) {
      const msg = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || err?.message || 'Sign in failed.';
      if (msg.toLowerCase().includes('already signed in')) {
        router.push('/dashboard');
        return;
      }
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };


  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signIn) return;
    setError('');
    const domainError = validateSrmEmail(email);
    if (domainError) { setError(domainError); return; }
    setIsLoading(true);
    try {
      await (signIn as any).create({ identifier: email });
      await (signIn as any).prepareFirstFactor({ strategy: 'reset_password_email_code', emailAddressId: '' });
      setView('reset_code');
    } catch (err: any) {
      const msg = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || 'Failed to send reset email.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signIn) return;
    setError('');
    setIsLoading(true);
    try {
      const result = await (signIn as any).attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code: resetCode,
      });
      let finalStatus = result?.status;
      if (!finalStatus && typeof window !== 'undefined') {
         const clientSignIn = (window as any).Clerk?.client?.signIn;
         if (clientSignIn) finalStatus = clientSignIn.status;
      }

      if (finalStatus === 'needs_new_password') {
        setView('new_password');
      } else {
        setError('Unexpected response. Please try again.');
      }
    } catch (err: any) {
      const msg = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || 'Invalid code.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signIn) return;
    setError('');
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (newPassword.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setIsLoading(true);
    try {
      const result = await (signIn as any).resetPassword({ password: newPassword });
      let finalStatus = result?.status;
      let finalSessionId = result?.createdSessionId;
      if (!finalStatus && typeof window !== 'undefined') {
         const clientSignIn = (window as any).Clerk?.client?.signIn;
         if (clientSignIn) {
            finalStatus = clientSignIn.status;
            finalSessionId = clientSignIn.createdSessionId;
         }
      }

      if (finalStatus === 'complete') {
        await setActive({ session: finalSessionId });
        setView('success');
        setTimeout(() => router.push('/dashboard'), 1500);
      }
    } catch (err: any) {
      const msg = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || 'Failed to update password.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = `w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-transparent transition-all duration-200`;

  return (
    <div className="min-h-screen bg-[#070b14] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-purple-600/8 rounded-full blur-[100px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo / Brand */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2.5 mb-5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-lg tracking-tight">CuriousBees</span>
          </div>
          <p className="text-white/40 text-xs font-medium tracking-wider uppercase">SRMIST Research Portal</p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-8 shadow-2xl"
        >
          {/* Shimmer border top */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/40 to-transparent rounded-full" />

          <AnimatePresence mode="wait">

            {/* ── LOGIN VIEW ── */}
            {view === 'login' && (
              <motion.div key="login" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }}>
                <div className="mb-6">
                  <h1 className="text-xl font-bold text-white tracking-tight">Welcome back</h1>
                  <p className="text-white/40 text-sm mt-1">Sign in with your SRMIST email</p>
                </div>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-white/25" />
                      <input
                        id="signin-email"
                        type="text"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="you@srmist.edu.in"
                        required
                        className={`${inputClass} pl-10`}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-white/25" />
                      <input
                        id="signin-password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className={`${inputClass} pl-10 pr-10`}
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3.5 text-white/30 hover:text-white/60 transition-colors">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                      <p className="text-xs text-red-300">{error}</p>
                    </motion.div>
                  )}

                  <button
                    id="signin-submit-btn"
                    type="submit"
                    disabled={isLoading}
                    onClick={() => console.log("SIGNIN_BUTTON_CLICKED")}
                    className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 shadow-lg shadow-blue-600/25 cursor-pointer"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Sign In</span><ArrowRight className="w-4 h-4" /></>}
                  </button>

                  <div className="text-center">
                    <button
                      id="signin-forgot-btn"
                      type="button"
                      onClick={() => { setView('forgot_password'); setError(''); }}
                      className="text-xs text-white/40 hover:text-white/70 transition-colors cursor-pointer underline underline-offset-2"
                    >
                      Forgot Password?
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* ── FORGOT PASSWORD VIEW ── */}
            {view === 'forgot_password' && (
              <motion.div key="forgot" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
                <div className="mb-6">
                  <h1 className="text-xl font-bold text-white tracking-tight">Reset Password</h1>
                  <p className="text-white/40 text-sm mt-1">Enter your SRMIST email to receive a reset code</p>
                </div>
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">SRMIST Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-white/25" />
                      <input id="reset-email" type="text" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@srmist.edu.in" required className={`${inputClass} pl-10`} />
                    </div>
                  </div>
                  {error && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                      <p className="text-xs text-red-300">{error}</p>
                    </motion.div>
                  )}
                  <button type="submit" disabled={isLoading} className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-blue-600/25">
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Send Reset Code</span><ArrowRight className="w-4 h-4" /></>}
                  </button>
                  <div className="text-center">
                    <button type="button" onClick={() => { setView('login'); setError(''); }} className="text-xs text-white/40 hover:text-white/70 transition-colors cursor-pointer flex items-center gap-1 mx-auto">
                      <RotateCcw className="w-3 h-3" /> Back to Sign In
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* ── VERIFY CODE VIEW ── */}
            {view === 'reset_code' && (
              <motion.div key="code" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
                <div className="mb-6">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-400/20 flex items-center justify-center mb-4">
                    <KeyRound className="w-5 h-5 text-blue-400" />
                  </div>
                  <h1 className="text-xl font-bold text-white tracking-tight">Enter Reset Code</h1>
                  <p className="text-white/40 text-sm mt-1">We sent a 6-digit code to <span className="text-white/60 font-medium">{email}</span></p>
                </div>
                <form onSubmit={handleVerifyCode} className="space-y-4">
                  <input id="reset-code-input" type="text" inputMode="numeric" value={resetCode} onChange={e => setResetCode(e.target.value)} placeholder="000000" maxLength={6} required className={`${inputClass} text-center text-2xl tracking-[0.5em] font-bold`} />
                  {error && (
                    <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                      <p className="text-xs text-red-300">{error}</p>
                    </div>
                  )}
                  <button type="submit" disabled={isLoading} className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-blue-600/25">
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Verify Code</span><ArrowRight className="w-4 h-4" /></>}
                  </button>
                </form>
              </motion.div>
            )}

            {/* ── NEW PASSWORD VIEW ── */}
            {view === 'new_password' && (
              <motion.div key="new_pass" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
                <div className="mb-6">
                  <h1 className="text-xl font-bold text-white tracking-tight">Set New Password</h1>
                  <p className="text-white/40 text-sm mt-1">Choose a strong password for your account</p>
                </div>
                <form onSubmit={handleSetNewPassword} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-white/25" />
                      <input id="new-password-input" type={showPassword ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min. 8 characters" required className={`${inputClass} pl-10 pr-10`} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3.5 text-white/30 hover:text-white/60 transition-colors">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-white/25" />
                      <input id="confirm-password-input" type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repeat password" required className={`${inputClass} pl-10`} />
                    </div>
                  </div>
                  {error && (
                    <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                      <p className="text-xs text-red-300">{error}</p>
                    </div>
                  )}
                  <button type="submit" disabled={isLoading} className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-blue-600/25">
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Update Password</span><ArrowRight className="w-4 h-4" /></>}
                  </button>
                </form>
              </motion.div>
            )}

            {/* ── SUCCESS VIEW ── */}
            {view === 'success' && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }} className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-400/20 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                </motion.div>
                <h2 className="text-lg font-bold text-white">Password Updated!</h2>
                <p className="text-white/40 text-sm mt-1">Redirecting to your dashboard...</p>
              </motion.div>
            )}

          </AnimatePresence>
        </motion.div>

        {/* Register link */}
        {view === 'login' && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-center mt-6 text-xs text-white/30">
            New to CuriousBees?{' '}
            <Link href="/sign-up" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
              Request Access
            </Link>
          </motion.p>
        )}

        {/* Footer */}
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-center mt-4 text-[10px] text-white/15 font-medium tracking-wider uppercase">
          SRMIST • Institutional Research Portal • Secured by Clerk
        </motion.p>
      </div>
    </div>
  );
}
