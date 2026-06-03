'use client';

/**
 * Sidebar.tsx — Role-aware navigation with mobile slide-in drawer.
 *
 * Desktop: 280px fixed left panel (unchanged)
 * Mobile:  Slide-in drawer triggered by Navbar hamburger via Zustand showMobileSidebar
 * Sections: Common nav + role-specific items + user mini-profile at bottom
 */

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  MessageSquare,
  Briefcase,
  User,
  LogOut,
  Calendar as CalendarIcon,
  Users,
  Cpu,
  Search,
  BarChart3,
  Sparkles,
  FolderOpen,
  Shield,
  UserCog,
  X,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Logo from './Logo';
import { RoleBadge } from '../shared/role-badge';
import type { UserRole } from '@curiousbees/types';

// ─── Navigation Config ────────────────────────────────────────────────────────

const COMMON_NAV = [
  { name: 'Dashboard',      href: '/dashboard',    icon: LayoutDashboard },
  { name: 'Research Feed',  href: '/threads',      icon: MessageSquare },
  { name: 'Researchers',    href: '/researchers',  icon: Users },
  { name: 'Opportunities',  href: '/opportunities', icon: Briefcase },
  { name: 'Workspaces',     href: '/workspace',    icon: FolderOpen },
  { name: 'Events',         href: '/events',       icon: CalendarIcon },
];

const TOOLS_NAV = [
  { name: 'AI Search',      href: '/search',       icon: Search },
  { name: 'AI Pipeline',    href: '/pipeline',     icon: Cpu },
  { name: 'Analytics',      href: '/analytics',    icon: BarChart3 },
  { name: 'Ask Copilot',    href: '/copilot',      icon: Sparkles },
];

const ROLE_NAV: Partial<Record<UserRole, { name: string; href: string; icon: React.ElementType }[]>> = {
  RESEARCH_SUPERVISOR: [
    { name: 'Scholar Management', href: '/dashboard/supervisor', icon: UserCog },
  ],
  INSTITUTION_ADMIN: [
    { name: 'Admin Panel', href: '/dashboard/admin', icon: Shield },
  ],
};

// ─── Nav Item ─────────────────────────────────────────────────────────────────

function NavItem({
  name,
  href,
  icon: Icon,
  active,
  onClick,
}: {
  name: string;
  href: string;
  icon: React.ElementType;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 select-none group',
        active
          ? 'bg-primary/8 text-primary font-semibold'
          : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
      )}
    >
      <Icon
        className={cn(
          'w-[18px] h-[18px] shrink-0 transition-colors',
          active ? 'text-primary' : 'text-on-surface-variant group-hover:text-on-surface'
        )}
      />
      <span className="truncate leading-none">{name}</span>
      {active && <ChevronRight className="w-3.5 h-3.5 ml-auto text-primary opacity-60" />}
    </Link>
  );
}

// ─── Nav Section Label ────────────────────────────────────────────────────────

function NavSection({ label }: { label: string }) {
  return (
    <p className="px-3 pt-4 pb-1 text-[9px] font-black uppercase tracking-[0.1em] text-on-surface-variant/50 select-none">
      {label}
    </p>
  );
}

// ─── Sidebar Content ──────────────────────────────────────────────────────────

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { currentUser, logout } = useStore();
  const role = currentUser?.role;
  const roleSpecificNav = role ? ROLE_NAV[role] ?? [] : [];

  const isActive = (href: string) =>
    pathname === href || (href !== '/dashboard' && pathname.startsWith(href));

  return (
    <div className="flex flex-col h-full py-5">
      {/* Brand + Close (mobile) */}
      <div className="flex items-center justify-between px-5 mb-5">
        <Logo showText={true} size={32} />
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer md:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 flex flex-col">

        {/* Common */}
        <NavSection label="Navigation" />
        <div className="flex flex-col gap-0.5">
          {COMMON_NAV.map((item) => (
            <NavItem
              key={item.href}
              {...item}
              active={isActive(item.href)}
              onClick={onClose}
            />
          ))}
        </div>

        {/* Tools */}
        <NavSection label="Tools" />
        <div className="flex flex-col gap-0.5">
          {TOOLS_NAV.map((item) => (
            <NavItem
              key={item.href}
              {...item}
              active={isActive(item.href)}
              onClick={onClose}
            />
          ))}
        </div>

        {/* Role-specific */}
        {roleSpecificNav.length > 0 && (
          <>
            <NavSection label="Management" />
            <div className="flex flex-col gap-0.5">
              {roleSpecificNav.map((item) => (
                <NavItem
                  key={item.href + item.name}
                  {...item}
                  active={isActive(item.href)}
                  onClick={onClose}
                />
              ))}
            </div>
          </>
        )}
      </nav>

      {/* User mini-profile */}
      <div className="px-3 pt-3 mt-auto border-t border-outline-variant/20">
        {currentUser && (
          <div className="px-3 py-3 rounded-xl bg-surface-container-low/60 mb-2 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-outline-variant/40 shrink-0">
              <img
                src={currentUser.image || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(currentUser.name || 'User') + '&background=004495&color=fff&size=64'}
                alt={currentUser.name || 'User'}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-on-surface truncate leading-tight">{currentUser.name || 'Researcher'}</p>
              {role && <RoleBadge role={role} size="sm" className="mt-0.5" />}
            </div>
          </div>
        )}

        <Link
          href="/profile"
          onClick={onClose}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all mb-0.5',
            pathname === '/profile'
              ? 'bg-primary/8 text-primary font-semibold'
              : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
          )}
        >
          <User className="w-[18px] h-[18px] shrink-0" />
          <span>My Profile</span>
        </Link>

        <button
          onClick={() => { logout(); onClose?.(); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium text-on-surface-variant hover:bg-surface-container hover:text-error transition-all cursor-pointer text-left"
        >
          <LogOut className="w-[18px] h-[18px] shrink-0" />
          <span>Exit Portal</span>
        </button>
      </div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function Sidebar() {
  const { showMobileSidebar, setMobileSidebar } = useStore();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-[280px] bg-surface-container-low border-r border-outline-variant/25 h-screen sticky top-0 z-40 shrink-0 font-sans">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {showMobileSidebar && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]"
              onClick={() => setMobileSidebar(false)}
            />

            {/* Drawer */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              className="md:hidden fixed left-0 top-0 bottom-0 z-[51] w-[300px] bg-surface-container-low border-r border-outline-variant/25 shadow-2xl font-sans"
            >
              <SidebarContent onClose={() => setMobileSidebar(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
