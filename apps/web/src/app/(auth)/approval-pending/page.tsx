'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { LogOut, Hourglass, ShieldCheck, CheckCircle2, Users, GraduationCap, RefreshCw, Loader2 } from 'lucide-react';
import { useStore } from '@/store/useStore';

export default function ApprovalPendingPage() {
  const router = useRouter();
  const { currentUser, syncUserSession, logout } = useStore();
  const [polling, setPolling] = useState(false);
  const [approvedRedirecting, setApprovedRedirecting] = useState(false);

  const isSupervisor = currentUser?.role === 'RESEARCH_SUPERVISOR';
  const supervisorName = currentUser?.supervisorEmail
    ? currentUser.supervisorEmail.split('@')[0].replace('.', ' ').replace(/(^\w|\s\w)/g, c => c.toUpperCase())
    : null;

  // Poll every 6 seconds for status change
  useEffect(() => {
    let active = true;

    const checkStatus = async () => {
      setPolling(true);
      try {
        const user = await syncUserSession({ force: true });
        if (!active) return;
        if (user?.status === 'APPROVED' && user.approved) {
          setApprovedRedirecting(true);
          const target = user.role === 'INSTITUTION_ADMIN' ? '/admin/dashboard' : '/dashboard';
          setTimeout(() => router.replace(target), 1200);
        } else if (user?.status === 'REJECTED') {
          router.replace('/account-rejected');
        }
      } finally {
        if (active) setPolling(false);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 6000);
    return () => { active = false; clearInterval(interval); };
  }, [syncUserSession, router]);

  return (
    <div className="min-h-screen bg-[#070b14] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-amber-500/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-blue-500/6 rounded-full blur-[100px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px]" />
      </div>

      {/* Sign out button */}
      <button
        onClick={() => { logout(); router.push('/sign-in'); }}
        className="absolute top-6 right-6 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.07] text-white/40 hover:text-white/70 text-xs font-semibold transition-all cursor-pointer z-20"
      >
        <LogOut className="w-3.5 h-3.5" />
        <span>Sign Out</span>
      </button>

      <div className="w-full max-w-md relative z-10">
        {/* Brand */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-lg tracking-tight">CuriousBees</span>
          </div>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-8 shadow-2xl text-center"
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent rounded-full" />

          {approvedRedirecting ? (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="py-4">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }} className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-400/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-7 h-7 text-emerald-400" />
              </motion.div>
              <h2 className="text-lg font-bold text-white">Access Approved!</h2>
              <p className="text-white/40 text-sm mt-1">Redirecting to your dashboard...</p>
            </motion.div>
          ) : (
            <>
              {/* Animated hourglass */}
              <div className="relative w-16 h-16 mx-auto mb-6">
                <motion.div
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                  className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-400/20 flex items-center justify-center"
                >
                  <Hourglass className="w-7 h-7 text-amber-400" />
                </motion.div>
                {/* Pulse ring */}
                <motion.div
                  animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0, 0.4] }}
                  transition={{ repeat: Infinity, duration: 2.5, ease: 'easeOut' }}
                  className="absolute inset-0 rounded-2xl border border-amber-400/30"
                />
              </div>

              {/* Role icon */}
              <div className="inline-flex items-center gap-2 bg-white/[0.04] border border-white/10 rounded-full px-3 py-1.5 mb-5">
                {isSupervisor
                  ? <Users className="w-3.5 h-3.5 text-purple-400" />
                  : <GraduationCap className="w-3.5 h-3.5 text-blue-400" />}
                <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">
                  {isSupervisor ? 'Research Supervisor' : 'Research Scholar'}
                </span>
              </div>

              <h1 className="text-xl font-bold text-white tracking-tight mb-2">Registration Submitted</h1>

              {/* Status badge */}
              <div className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-400/20 px-3 py-1 rounded-full mb-5">
                <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">
                  {isSupervisor ? 'Awaiting Admin Approval' : 'Awaiting Supervisor Approval'}
                </span>
              </div>

              <p className="text-sm text-white/40 leading-relaxed max-w-xs mx-auto">
                {isSupervisor
                  ? 'Your request to join as a Research Supervisor is being reviewed by the Institutional Administrator.'
                  : 'Your account has been submitted to your selected Research Supervisor for review.'}
              </p>

              {/* Supervisor info for scholars */}
              {!isSupervisor && currentUser?.supervisorEmail && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-5 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center gap-3 text-left"
                >
                  <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-400 font-bold text-sm flex items-center justify-center border border-blue-400/20 shrink-0">
                    {currentUser.supervisorEmail.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-white/30 font-bold uppercase tracking-wider">Sent to</p>
                    <p className="text-sm font-semibold text-white truncate">{supervisorName || currentUser.supervisorEmail}</p>
                    <p className="text-[10px] text-white/30 truncate">{currentUser.supervisorEmail}</p>
                  </div>
                </motion.div>
              )}

              {/* Progress bar */}
              <div className="mt-6 h-1 bg-white/[0.05] rounded-full overflow-hidden">
                <motion.div
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                  className="h-full w-1/3 bg-gradient-to-r from-transparent via-amber-400 to-transparent rounded-full"
                />
              </div>

              {/* Polling indicator */}
              <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-white/20">
                {polling
                  ? <Loader2 className="w-3 h-3 animate-spin" />
                  : <RefreshCw className="w-3 h-3" />}
                <span>Checking status automatically...</span>
              </div>
            </>
          )}
        </motion.div>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-center mt-5 text-[10px] text-white/15 font-medium tracking-wider uppercase">
          SRMIST • Institutional Research Portal
        </motion.p>
      </div>
    </div>
  );
}
