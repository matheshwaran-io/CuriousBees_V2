'use client';

import { useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { ShieldAlert, LogOut, ArrowRight, Mail } from 'lucide-react';
import Image from 'next/image';

export default function NotProvisionedPage() {
  const { signOut } = useClerk();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col items-center justify-center p-4 text-center">
      
      {/* Background Decorators */}
      <div className="fixed top-0 inset-x-0 h-96 bg-gradient-to-b from-[#0C4DA2]/5 to-transparent pointer-events-none -z-10" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-[#FEC727]/10 blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* Main Card */}
      <div className="bg-white border border-slate-200/80 rounded-[32px] p-8 md:p-12 max-w-lg w-full shadow-[0_8px_40px_rgb(12,77,162,0.06)] relative overflow-hidden">
        
        {/* Top Gradient Banner */}
        <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-[#0C4DA2] to-[#FEC727]" />

        {/* Icon */}
        <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-amber-100/50">
          <ShieldAlert className="w-10 h-10 text-amber-500" />
        </div>

        {/* Text Content */}
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">
          Account Not Provisioned
        </h1>
        <p className="text-sm text-slate-500 mb-8 font-medium leading-relaxed max-w-[90%] mx-auto">
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
          onClick={() => {
            signOut(() => router.push('/sign-in'));
          }}
          className="w-full bg-[#0C4DA2] hover:bg-[#003370] text-white font-extrabold text-sm py-4 px-6 rounded-2xl transition-all shadow-md shadow-blue-900/20 flex items-center justify-center gap-2 group cursor-pointer"
        >
          <LogOut className="w-4.5 h-4.5" />
          <span>Sign Out & Try Another Account</span>
          <ArrowRight className="w-4 h-4 ml-2 opacity-70 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Footer Branding */}
      <div className="mt-8 flex items-center gap-2 opacity-50">
        <Image src="/logo.svg" alt="CuriousBees" width={24} height={24} className="grayscale" />
        <span className="text-xs font-bold text-slate-500 tracking-widest uppercase">SRMIST Research Portal</span>
      </div>

    </div>
  );
}
