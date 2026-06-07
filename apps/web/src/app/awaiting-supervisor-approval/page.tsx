'use client';

import { useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Clock, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AwaitingSupervisorApprovalPage() {
  const { signOut } = useClerk();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-indigo-600/8 rounded-full blur-[100px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-8 shadow-2xl text-center"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/40 to-transparent rounded-full" />
        
        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-6">
          <Clock className="w-8 h-8 text-blue-400" />
        </div>

        <h1 className="text-2xl font-bold text-white mb-3 tracking-tight">Awaiting Supervisor Approval</h1>
        
        <p className="text-white/60 text-sm leading-relaxed mb-8">
          Your registration has been successfully submitted. We have sent an approval request to your selected research supervisor. You will be able to access the portal once they approve your application.
        </p>

        <button
          onClick={() => signOut(() => router.push('/sign-in'))}
          className="w-full py-3 rounded-xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </motion.div>

      <p className="text-center mt-8 text-[10px] text-white/15 font-medium tracking-wider uppercase relative z-10">
        SRMIST • Institutional Research Portal
      </p>
    </div>
  );
}
