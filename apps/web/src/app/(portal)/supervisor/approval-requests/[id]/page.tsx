'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function SupervisorApprovalRequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = params?.id as string;

  useEffect(() => {
    if (requestId) {
      router.replace(`/supervisor/requests/${requestId}`);
    }
  }, [requestId, router]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
      <Loader2 className="w-8 h-8 text-[#0C4DA2] animate-spin" />
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Redirecting to Supervision Request...</p>
    </div>
  );
}
