'use client';

/**
 * Navbar.tsx — Top navigation bar with floating glassmorphic container, dynamic breadcrumbs, and integrated dropdowns.
 */

import React, { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { Search, Sparkles, MessageSquare, AlertTriangle, X, Menu, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import SpotlightSearch from '../SpotlightSearch';
import { cn } from '@/lib/utils';
import { NotificationDropdown } from '../shared/notification-dropdown';
import { ProfileDropdown } from '../shared/profile-dropdown';



const PATH_MAP: Record<string, string> = {
  'dashboard': 'Dashboard',
  'threads': 'Research Feed',
  'researchers': 'Researchers',
  'opportunities': 'Opportunities',
  'workspace': 'Workspaces',
  'events': 'Events',
  'search': 'AI Search',
  'pipeline': 'AI Pipeline',
  'analytics': 'Analytics',
  'copilot': 'Ask Copilot',
  'profile': 'My Profile',
  'admin': 'Admin Panel',
  'create': 'New Proposal',
  'supervisor': 'Scholar Management',
};

export default function Navbar() {
  const pathname = usePathname();
  const { currentUser, showMobileSidebar, setMobileSidebar, dashboardRoute } = useStore();
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

  // Generate dynamic breadcrumbs
  const getBreadcrumbs = () => {
    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbs = [{ name: 'CuriousBees', href: dashboardRoute }];

    let currentHref = '';
    segments.forEach((segment, index) => {
      currentHref += `/${segment}`;
      
      // Attempt to map segment to display name
      let name = PATH_MAP[segment.toLowerCase()];
      
      if (!name) {
        // Fallback for UUID/dynamic parameters
        const prevSegment = segments[index - 1]?.toLowerCase();
        if (prevSegment === 'workspace') {
          name = 'Workspace Details';
        } else if (prevSegment === 'threads' || prevSegment === 'feed') {
          name = 'Publication';
        } else if (prevSegment === 'researchers') {
          name = 'Researcher Profile';
        } else if (prevSegment === 'profile') {
          name = 'Profile View';
        } else {
          name = segment.charAt(0).toUpperCase() + segment.slice(1);
        }
      }
      
      breadcrumbs.push({ name, href: currentHref });
    });

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <>
      {/* ─── MAIN NAVBAR ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 h-16 w-full bg-white/80 dark:bg-[#07111F]/85 backdrop-blur-md border-b border-borderStroke dark:border-white/[0.07] flex items-center justify-between px-4 md:px-8 gap-3 font-sans transition-colors">
        
        {/* Leading section: Mobile Menu & Breadcrumbs */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileSidebar(!showMobileSidebar)}
            className="md:hidden p-2 rounded-lg text-textSecondary dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#132238] transition-colors shrink-0 cursor-pointer"
            aria-label="Open navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Trailing actions */}
        <div className="flex items-center gap-2 md:gap-4 shrink-0 text-textSecondary dark:text-slate-300">
          
          {/* Global Search Clickable Zone */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-borderStroke/70 dark:border-white/[0.08] hover:border-borderStroke dark:hover:border-white/[0.16] bg-transparent dark:bg-[#0B1728] hover:bg-slate-50 dark:hover:bg-[#101D30] transition-all text-[12.5px] cursor-pointer text-left w-36 md:w-56"
          >
            <Search className="w-3.5 h-3.5 text-textSecondary dark:text-slate-400 shrink-0" />
            <span className="truncate text-textSecondary/60 dark:text-[#A7B3C5] flex-1 font-medium">Search...</span>
            <kbd className="hidden md:inline-flex h-4 select-none items-center gap-0.5 rounded border border-borderStroke/55 dark:border-white/[0.12] bg-white dark:bg-[#101D30] px-1.5 font-mono text-[9px] font-bold text-textSecondary/60 dark:text-[#A7B3C5] shadow-sm leading-none">
              ⌘K
            </kbd>
          </button>

          {/* Discussions feed shortcut */}
          <Link
            href="/feed"
            className="p-2 rounded-full hover:bg-slate-50 dark:hover:bg-[#132238] hover:text-primary dark:hover:text-[#3B82F6] text-slate-600 dark:text-[#A7B3C5] transition-colors flex items-center justify-center"
            title="Research Feed"
          >
            <MessageSquare className="w-4.5 h-4.5" />
          </Link>

          {/* Notifications Dropdown */}
          <NotificationDropdown />

          {/* User Profile Menu */}
          <ProfileDropdown />

        </div>
      </header>

      {/* Spotlight Search overlay */}
      <SpotlightSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}

