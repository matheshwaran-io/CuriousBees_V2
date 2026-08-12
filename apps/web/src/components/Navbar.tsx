'use client';

/**
 * Navbar.tsx — Top navigation bar with mobile hamburger, role badge, and dev banner.
 */

import React, { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { Search, Bell, Sparkles, MessageSquare, Settings, AlertTriangle, X, Menu } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import SpotlightSearch from './SpotlightSearch';
import { cn } from '@/lib/utils';
import { ROLE_LABELS } from '@/lib/auth/role-mapping';
import { RoleBadge } from './shared/role-badge';
import type { UserRole } from '@curiousbees/types';



// Role badge accent colors for the Navbar inline badge
const ROLE_BADGE_STYLES: Record<UserRole, string> = {
  INSTITUTE_ADMIN:       'bg-rose-50 text-rose-700 border-rose-200',
  RESEARCH_SUPERVISOR:   'bg-indigo-50 text-indigo-700 border-indigo-200',
  RESEARCH_SCHOLAR:      'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export default function Navbar() {
  const pathname = usePathname();
  const { currentUser, showMobileSidebar, setMobileSidebar } = useStore();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Listen for global keyboard shortcut (CMD+K or CTRL+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const role = currentUser?.role;

  return (
    <>
      {/* ─── MAIN NAVBAR ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 h-16 w-full bg-white/90 backdrop-blur-md border-b border-[#E4E9F2] flex items-center justify-between px-4 md:px-8 gap-3 shadow-xs">

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileSidebar(!showMobileSidebar)}
          className="md:hidden p-2 rounded-xl text-[#4A5568] hover:bg-[#EEF4FF] transition-colors shrink-0 cursor-pointer"
          aria-label="Open navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Search Bar */}
        <div className="flex-1 max-w-xl">
          <div
            onClick={() => setIsSearchOpen(true)}
            className="relative flex items-center bg-[#F5F7FC] border border-[#E4E9F2] hover:border-[#0B4EA2]/50 rounded-xl px-3.5 py-2 transition-all cursor-pointer group shadow-2xs"
          >
            <Search className="w-4 h-4 text-[#6B7890] group-hover:text-[#0B4EA2] transition-colors shrink-0 mr-2.5" />
            <div className="flex-1 text-xs md:text-sm font-medium text-[#6B7890] select-none text-left">
              <span className="hidden sm:inline">Search research, publications, or researchers... (⌘K)</span>
              <span className="sm:hidden">Search...</span>
            </div>
            <Sparkles className="w-4 h-4 text-[#F5B800] shrink-0" />
          </div>
        </div>

        {/* Trailing actions */}
        <div className="flex items-center gap-1 md:gap-3 text-[#4A5568] shrink-0">

          {/* Role Badge — visible on all sizes */}
          {role && (
            <RoleBadge role={role} size="sm" className="hidden sm:inline-flex" />
          )}

          {/* Discussions */}
          <Link
            href="/feed"
            className="p-2.5 rounded-xl hover:bg-[#EEF4FF] hover:text-[#0B4EA2] transition-colors flex items-center justify-center text-[#4A5568]"
            title="Research Feed"
          >
            <MessageSquare className="w-5 h-5" />
          </Link>

          {/* Notifications */}
          <button className="relative p-2.5 rounded-xl hover:bg-[#EEF4FF] hover:text-[#0B4EA2] transition-colors flex items-center justify-center text-[#4A5568] cursor-pointer">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-[#F5B800] rounded-full ring-2 ring-white" />
          </button>

          {/* Settings */}
          <Link
            href={
              role === 'INSTITUTE_ADMIN' ? '/admin/settings' :
              role === 'RESEARCH_SUPERVISOR' ? '/supervisor/settings' :
              '/scholar/settings'
            }
            className="p-2.5 rounded-xl hover:bg-[#EEF4FF] hover:text-[#0B4EA2] transition-colors flex items-center justify-center text-[#4A5568]"
          >
            <Settings className="w-5 h-5" />
          </Link>

          {/* Avatar */}
          <div className="ml-1 h-8 w-8 rounded-full bg-[#0B4EA2] text-white font-bold border border-[#E4E9F2] overflow-hidden shadow-xs shrink-0 flex items-center justify-center text-xs">
            <img
              alt="Profile"
              className="w-full h-full object-cover"
              src={
                currentUser?.image ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.name || 'U')}&background=0B4EA2&color=fff&size=64`
              }
            />
          </div>
        </div>
      </header>

      {/* Spotlight Search overlay */}
      <SpotlightSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
