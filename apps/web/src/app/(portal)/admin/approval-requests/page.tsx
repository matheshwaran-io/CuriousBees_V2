'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AdminApprovalRequestsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/dashboard');
  }, [router]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
      <Loader2 className="w-8 h-8 text-[#0C4DA2] animate-spin" />
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Redirecting to Admin Dashboard...</p>
    </div>
  );
}
