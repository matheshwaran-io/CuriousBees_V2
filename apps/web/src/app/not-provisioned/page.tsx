'use client';

import { useStore } from '@/store/useStore';
import { useRouter } from 'next/navigation';
import { ShieldAlert, LogOut, ArrowRight, Mail } from 'lucide-react';
import { motion } from 'framer-motion';

export default function NotProvisionedPage() {
  const { logout } = useStore();
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#e6e6fa] text-center">
      {/* Background gradients and mesh blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 honeycomb-bg opacity-[0.25] mix-blend-multiply" />
        <div className="absolute top-10 left-10 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-10 right-10 w-[450px] h-[450px] bg-[#0C4DA2]/5 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-lg relative z-10 flex flex-col items-center">
        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white/85 backdrop-blur-xl border border-white/50 rounded-[32px] p-8 md:p-12 w-full shadow-2xl relative overflow-hidden"
        >
          {/* Top Gradient Banner */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#0C4DA2] to-[#FFC828]" />

          {/* Icon */}
          <div className="relative w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <div className="absolute inset-0 bg-amber-500/10 rounded-full animate-ping opacity-75" style={{ animationDuration: '3s' }} />
            <div className="relative w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center border border-amber-100 shadow-md">
              <ShieldAlert className="w-8 h-8 text-amber-500" />
            </div>
          </div>

          {/* Text Content */}
          <h1 className="text-2xl md:text-3xl font-display font-extrabold text-slate-900 mb-3 tracking-tight">
            Account Not Provisioned
          </h1>
          <p className="text-sm text-slate-500 mb-8 font-sans font-medium leading-relaxed max-w-[90%] mx-auto">
            Your Google account has not been authorized for access to the CuriousBees portal. Please ensure you are using your official university email or contact the Research Directorate.
          </p>

          {/* Action Info Box */}
          <div className="bg-blue-50/50 border border-blue-100/80 rounded-2xl p-4 mb-8 flex items-start gap-4 text-left">
            <div className="w-10 h-10 rounded-full bg-[#0C4DA2]/10 flex items-center justify-center shrink-0 mt-1">
              <Mail className="w-4.5 h-4.5 text-[#0C4DA2]" />
            </div>
            <div>
              <h4 className="text-xs font-black text-[#0C4DA2] uppercase tracking-wider mb-1">How to gain access?</h4>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Reach out to your department coordinator or the administration office to pre-provision your email address in the system.
              </p>
            </div>
          </div>

          {/* Sign Out Button */}
          <button
            onClick={() => logout()}
            className="w-full bg-[#0C4DA2] hover:bg-[#003370] text-white font-extrabold text-xs py-4 px-6 rounded-2xl transition-all shadow-md shadow-blue-900/20 flex items-center justify-center gap-2 group cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out & Try Another Account</span>
            <ArrowRight className="w-4 h-4 ml-1 opacity-70 group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>

        {/* Footer Branding */}
        <div className="mt-8 flex items-center gap-2.5 opacity-60">
          <div className="w-6 h-6 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">SRMIST Research Portal</span>
        </div>
      </div>
    </div>
  );
}
