'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SignUpRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#e6e6fa]">
      <div className="w-10 h-10 border-4 border-[#0C4DA2] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
