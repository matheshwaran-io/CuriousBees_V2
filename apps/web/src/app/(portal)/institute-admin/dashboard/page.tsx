'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RedirectInstituteAdminDashboard() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/dashboard');
  }, [router]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center text-xs font-bold text-slate-400">
      Redirecting to Governance Command Center...
    </div>
  );
}

