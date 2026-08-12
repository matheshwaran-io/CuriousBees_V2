'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Compass, 
  PlusCircle, 
  Bell, 
  User, 
  Search,
  Sparkles
} from 'lucide-react';
import Logo from '../Logo';
import { useStore } from '@/store/useStore';

interface MobileFeedNavProps {
  onOpenCreate?: () => void;
}

export default function MobileFeedNav({ onOpenCreate }: MobileFeedNavProps) {
  const pathname = usePathname();
  const { currentUser } = useStore();

  const isScholar = currentUser?.role === 'RESEARCH_SCHOLAR';

  return (
    <>
      {/* ─── MOBILE TOP HEADER ─── */}
      <header className="md:hidden sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-200 z-30 px-4 py-2.5 flex items-center justify-between">
        <Logo showText={true} size={28} />
        
        <div className="flex items-center gap-3">
          <Link href="/notifications" className="p-2 rounded-full text-slate-600 hover:bg-slate-100 relative">
            <Bell className="w-5 h-5 text-slate-700" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#0C4DA2]" />
          </Link>
        </div>
      </header>

      {/* ─── MOBILE BOTTOM BAR ─── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 z-40 px-6 py-2 flex items-center justify-between shadow-lg">
        <Link 
          href="/feed" 
          className={`flex flex-col items-center gap-1 ${pathname === '/feed' ? 'text-[#0C4DA2]' : 'text-slate-500'}`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-bold">Home</span>
        </Link>

        <Link 
          href="/researchers" 
          className={`flex flex-col items-center gap-1 ${pathname === '/researchers' ? 'text-[#0C4DA2]' : 'text-slate-500'}`}
        >
          <Compass className="w-5 h-5" />
          <span className="text-[10px] font-bold">Explore</span>
        </Link>

        <button 
          onClick={onOpenCreate}
          className="flex flex-col items-center gap-1 text-[#0C4DA2] active:scale-95 transition-transform"
        >
          <PlusCircle className="w-7 h-7 fill-[#0C4DA2] text-white" />
        </button>

        <Link 
          href="/notifications" 
          className={`flex flex-col items-center gap-1 ${pathname === '/notifications' ? 'text-[#0C4DA2]' : 'text-slate-500'}`}
        >
          <Bell className="w-5 h-5" />
          <span className="text-[10px] font-bold">Notifs</span>
        </Link>

        <Link 
          href={isScholar ? '/scholar/profile' : '/profile'} 
          className={`flex flex-col items-center gap-1 ${(pathname === '/profile' || pathname === '/scholar/profile') ? 'text-[#0C4DA2]' : 'text-slate-500'}`}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] font-bold">Profile</span>
        </Link>
      </nav>
    </>
  );
}
