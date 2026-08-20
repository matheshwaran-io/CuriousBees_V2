'use client';

import React from 'react';
import { useStore } from '@/store/useStore';
import { ShieldX, LogOut, ArrowRight } from 'lucide-react';
import Image from 'next/image';

export default function AccessDeniedPage() {
  const { logout } = useStore();

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col items-center justify-center p-4 text-center">
      {/* Background Decorators */}
      <div className="fixed top-0 inset-x-0 h-96 bg-gradient-to-b from-[#0C4DA2]/5 to-transparent pointer-events-none -z-10" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-red-500/5 blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* Main Card */}
      <div className="bg-white border border-slate-200/80 rounded-[32px] p-8 md:p-12 max-w-lg w-full shadow-[0_8px_40px_rgb(12,77,162,0.06)] relative overflow-hidden">
        {/* Top Gradient Banner */}
        <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-red-500 to-[#0C4DA2]" />

        {/* Icon */}
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-red-100/50">
          <ShieldX className="w-10 h-10 text-red-500" />
        </div>

        {/* Text Content */}
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">
          Access Denied
        </h1>
        <p className="text-sm text-slate-600 mb-8 font-medium leading-relaxed max-w-[90%] mx-auto">
          CuriousBees is restricted to SRM Institute of Science and Technology researchers and authorized members. Please sign in using your official <strong className="text-[#0C4DA2]">@srmist.edu.in</strong> Google account.
        </p>

        {/* Sign Out Button */}
        <button
          onClick={() => {
            logout();
          }}
          className="w-full bg-[#0C4DA2] hover:bg-[#003370] text-white font-extrabold text-sm py-4 px-6 rounded-2xl transition-all shadow-md shadow-blue-900/20 flex items-center justify-center gap-2 group cursor-pointer"
        >
          <LogOut className="w-4.5 h-4.5" />
          <span>Sign Out & Try SRM Account</span>
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
