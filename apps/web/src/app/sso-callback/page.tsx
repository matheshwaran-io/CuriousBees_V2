'use client';

import { AuthenticateWithRedirectCallback } from '@clerk/nextjs';

export default function SsoCallbackPage() {
  return (
    <div className="min-h-screen bg-[#070b14] flex items-center justify-center text-white font-sans">
      <div className="text-center space-y-4">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-sm text-white/60">Completing secure authentication...</p>
        <AuthenticateWithRedirectCallback />
      </div>
    </div>
  );
}
