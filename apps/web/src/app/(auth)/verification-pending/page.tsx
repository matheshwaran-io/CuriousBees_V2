'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { 
  LogOut, 
  Hourglass,
  Shield,
  AlertCircle
} from 'lucide-react';
import Logo from '@/components/Logo';

export default function VerificationPendingPage() {
  const router = useRouter();
  const { 
    currentUser, 
    syncUserSession, 
    logout 
  } = useStore();

  // Poll periodically for approval status changes
  useEffect(() => {
    const checkStatus = async () => {
      const user = await syncUserSession({ force: true });
      if (user && user.status === 'APPROVED') {
        const route = user.role === 'INSTITUTION_ADMIN' ? '/admin/dashboard' : '/dashboard';
        router.replace(route);
      }
    };
    
    checkStatus();
    const interval = setInterval(checkStatus, 6000); // Check every 6s for approval
    return () => clearInterval(interval);
  }, [syncUserSession, router]);

  const isSupervisorPending = currentUser?.role === 'RESEARCH_SUPERVISOR';

  return (
    <div className="bg-slate-50 min-h-screen flex items-center justify-center p-6 relative overflow-hidden font-sans w-full">
      {/* Decorative background grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />

      {/* Floating Sign Out Trigger */}
      <button 
        onClick={() => { logout(); router.push('/sign-in'); }}
        className="absolute top-6 right-6 flex items-center space-x-1.5 px-3 py-1.5 border border-borderStroke rounded-lg text-xs font-bold text-textSecondary hover:text-primary hover:bg-slate-50 transition-all cursor-pointer z-20"
      >
        <LogOut className="w-3.5 h-3.5" />
        <span>Sign Out</span>
      </button>

      {/* Centered Glass Container Card */}
      <main className="w-full max-w-md relative z-10">
        <div className="bg-white border border-borderStroke rounded-xl p-8 shadow-xl flex flex-col items-center text-center space-y-6">
          
          {/* Logo container box */}
          <div className="w-16 h-16 rounded-xl overflow-hidden border border-borderStroke shadow-sm bg-slate-50 flex items-center justify-center">
            <Logo showText={false} size={42} />
          </div>

          <div className="flex flex-col items-center w-full space-y-6">
            
            {/* Status Indicator */}
            <div className="relative w-14 h-14 flex items-center justify-center">
              <span className="absolute inset-0 rounded-full border-4 border-amber-500/20 pulse-ring" />
              <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center z-10 border border-amber-500/30">
                <Hourglass className="w-4.5 h-4.5 text-amber-600 animate-spin-slow" />
              </div>
            </div>

            {/* Typography & Content */}
            <div className="space-y-2">
              <h1 className="font-display font-extrabold text-2xl text-black tracking-tight leading-tight">
                Verification Pending
              </h1>
              
              {/* Status Badge */}
              <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200/50 px-3 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                  {isSupervisorPending ? 'Awaiting Admin Approval' : 'Awaiting Guide Approval'}
                </span>
              </div>
            </div>

            <p className="text-xs text-textSecondary leading-relaxed font-semibold max-w-sm">
              {isSupervisorPending 
                ? 'Your request to join as a Research Supervisor is being reviewed by the Institutional Administrator. This page will refresh automatically once approved.'
                : 'Your profile was submitted to your Faculty Supervisor. Once they approve your request, this page will automatically refresh to load your scholar portal.'
              }
            </p>

            {!isSupervisorPending && currentUser?.supervisorEmail && (
              <div className="p-3.5 rounded-lg bg-slate-50 border border-borderStroke/50 flex items-center space-x-3 text-left w-full">
                <div className="w-9 h-9 rounded-full bg-[#0d3c61]/10 text-[#0d3c61] flex items-center justify-center font-bold text-sm shrink-0 border border-[#0d3c61]/25">
                  {currentUser.supervisorEmail.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-black truncate leading-tight">Assigned Supervisor</p>
                  <p className="text-[10px] text-textSecondary truncate mt-1">{currentUser.supervisorEmail}</p>
                </div>
              </div>
            )}

            {/* Progress Loading bar */}
            <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 w-1/3 rounded-full animate-indeterminate" />
            </div>
          </div>

          {/* Intranet notice */}
          <div className="pt-6 border-t border-borderStroke flex items-center justify-center gap-1.5 text-textSecondary/40 select-none">
            <Shield className="w-3.5 h-3.5 shrink-0" />
            <p className="text-[10px] font-bold uppercase tracking-wider">
              SRMIST Institutional Security Standard
            </p>
          </div>

        </div>
      </main>
    </div>
  );
}
