'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function SignInRedirectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const redirectTo = searchParams?.get('redirectTo') || '/feed';
    router.replace(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#e6e6fa]">
      <div className="w-10 h-10 border-4 border-[#0C4DA2] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
