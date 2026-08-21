'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function RedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      router.replace(`/admin/users?tab=${tab}`);
    } else {
      router.replace('/admin/users');
    }
  }, [router, searchParams]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center text-xs font-bold text-slate-400">
      Redirecting to User Management & Access Control Console...
    </div>
  );
}

export default function RedirectInstituteAdminUserManagement() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center text-xs font-bold text-slate-400">Loading...</div>}>
      <RedirectContent />
    </Suspense>
  );
}
