'use client';

import { useRouter } from 'next/navigation';

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center p-4 text-center">
      <div className="bg-white/5 border border-red-500/30 rounded-2xl p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-white mb-4">Unauthorized Access</h1>
        <p className="text-white/60 mb-8">
          You do not have permission to view this page. If you believe this is a mistake, please contact support.
        </p>
        <button
          onClick={() => {
            router.back();
          }}
          className="bg-red-600/80 hover:bg-red-600 text-white font-medium py-2 px-6 rounded-lg transition-colors"
        >
          Go Back
        </button>
      </div>
    </div>
  );
}
