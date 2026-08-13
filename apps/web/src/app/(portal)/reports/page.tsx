'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RedirectToSupervisionReports() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/my-scholars?tab=reports');
  }, [router]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center text-xs font-bold text-slate-400">
      Loading Supervision Workspace...
    </div>
  );
}
