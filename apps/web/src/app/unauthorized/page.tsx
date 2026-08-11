'use client';

import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { getDashboardRoute } from '@/lib/auth/route-protection';

export default function UnauthorizedPage() {
  const router = useRouter();
  const currentUser = useStore((s) => s.currentUser);

  const handleReturn = () => {
    if (currentUser) {
      router.push(getDashboardRoute(currentUser));
    } else {
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center p-4 text-center">
      <div className="bg-white/5 border border-red-500/30 rounded-2xl p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-white mb-4">Unauthorized Access</h1>
        <p className="text-white/60 mb-8">
          You do not have permission to view this page. If you believe this is a mistake, please contact support.
        </p>
        <button
          onClick={handleReturn}
          className="bg-red-600/80 hover:bg-red-600 text-white font-medium py-2 px-6 rounded-lg transition-colors cursor-pointer"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );
}
