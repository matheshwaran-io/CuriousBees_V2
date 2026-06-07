'use client';

import { useAuth, useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export default function PendingApprovalPage() {
  const { signOut } = useClerk();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center p-4 text-center">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-white mb-4">Pending Approval</h1>
        <p className="text-white/60 mb-8">
          Your account is currently under review by your supervisor or the institutional administrator.
          You will be notified once your access is approved.
        </p>
        <button
          onClick={() => {
            signOut(() => router.push('/sign-in'));
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
