'use client';

import { useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export default function AccessDeniedPage() {
  const { signOut } = useClerk();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center p-4 text-center">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
        <p className="text-white/60 mb-8 font-sans leading-relaxed">
          Your request to access this portal has been rejected or you do not have permission to access this resource.
        </p>
        <button
          onClick={() => {
            signOut(() => router.push('/sign-in'));
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors cursor-pointer"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
