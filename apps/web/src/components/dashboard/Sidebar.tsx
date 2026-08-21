'use client';

/**
 * Sidebar.tsx — Premium role-aware navigation with dynamic layouts.
 */

import React, { useState } from 'react';
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
  FolderOpen,
  Building,
  Shield,
  UserCog,
  X,
  ChevronRight,
  ChevronDown,
  BookOpen,
  BarChart3,
  Clock,
  GraduationCap,
  Crown,
  Network,
  BookMarked,
  Layers,
  Settings as SettingsIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getProfileImageUrl } from '@/lib/avatar';
import Logo from '@/components/Logo';
import SRMLogo from '@/components/SRMLogo';
import { RoleBadge } from '../shared/role-badge';
import type { UserRole } from '@curiousbees/types';

// ─── Sidebar Dynamic Navigation Config ────────────────────────────────────────

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

const getSidebarItems = (role: UserRole): SidebarItem[] => {
  if (role === 'INSTITUTE_ADMIN') {
    return [
      { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
      { name: 'User Management', href: '/institute-admin/user-management', icon: Users },
      { name: 'Faculties & Departments', href: '/admin/faculties-departments', icon: Building },
      { name: 'Platform Analytics', href: '/admin/analytics', icon: BarChart3 },
      { name: 'Announcements', href: '/admin/announcements', icon: MessageSquare },
      { name: 'Portal Settings', href: '/settings', icon: SettingsIcon },
      { name: 'System Settings', href: '/admin/settings', icon: Shield },
    ];
  }

  if (role === 'RESEARCH_SUPERVISOR') {
    return [
      { name: 'Research Feed', href: '/feed', icon: MessageSquare },
      { name: 'Publications', href: '/publications', icon: BookOpen },
      { name: 'Opportunities', href: '/opportunities', icon: Briefcase },
      { name: 'Curious Nexus', href: '/nexus', icon: Network },
      { name: 'Events', href: '/events', icon: CalendarIcon },
      { name: 'Researchers', href: '/researchers', icon: Users },
      { name: 'Settings', href: '/settings', icon: SettingsIcon },
    ];
  }

  // Default: Research Scholar
  return [
    { name: 'Research Feed', href: '/feed', icon: MessageSquare },
    { name: 'Publications', href: '/publications', icon: BookOpen },
    { name: 'Opportunities', href: '/opportunities', icon: Briefcase },
    { name: 'My Research', href: '/my-research', icon: BookMarked },
    { name: 'Curious Nexus', href: '/nexus', icon: Network },
    { name: 'Events', href: '/events', icon: CalendarIcon },
    { name: 'Researchers', href: '/researchers', icon: Users },
    { name: 'Settings', href: '/settings', icon: SettingsIcon },
  ];
};

// ─── Nav Item Component ────────────────────────────────────────────────────────

function NavItem({
  name,
  href,
  icon: Icon,
  active,
  onClick,
  hoveredItem,
  setHoveredItem,
}: {
  name: string;
  href: string;
  icon: React.ElementType;
  active: boolean;
  onClick?: () => void;
  hoveredItem: string | null;
  setHoveredItem: (name: string | null) => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      onMouseEnter={() => setHoveredItem(name)}
      onMouseLeave={() => setHoveredItem(null)}
      className={cn(
        "relative flex items-center gap-3.5 px-4 py-3 rounded-full text-sm font-bold transition-all duration-150 select-none group",
        active 
          ? "bg-[#0C4DA2]/10 dark:bg-blue-600/15 text-[#0C4DA2] dark:text-[#F5F7FA] font-black" 
          : "text-slate-700 dark:text-[#A7B3C5] hover:bg-slate-100/80 dark:hover:bg-[#132238] hover:text-slate-900 dark:hover:text-[#F5F7FA]"
      )}
    >
      {/* Active Blue Left Pillar */}
      {active && (
        <motion.span
          layoutId="sidebar-active-indicator"
          className="absolute left-1 top-2.5 bottom-2.5 w-[4px] bg-[#0C4DA2] dark:bg-[#3B82F6] rounded-full z-10"
          transition={{ type: 'spring', stiffness: 350, damping: 28 }}
        />
      )}

      <Icon
        className={cn(
          'w-5 h-5 shrink-0 transition-transform duration-150 relative z-10 group-hover:scale-105',
          active ? 'text-[#0C4DA2] dark:text-[#3B82F6]' : 'text-slate-500 dark:text-[#718096] group-hover:text-slate-900 dark:group-hover:text-[#F5F7FA]'
        )}
      />
      <span
        className={cn(
          'truncate leading-none relative z-10 text-[14px]',
          active ? 'text-[#0C4DA2] dark:text-[#F5F7FA] font-extrabold tracking-tight' : 'text-slate-700 dark:text-[#A7B3C5] group-hover:text-slate-900 dark:group-hover:text-[#F5F7FA]'
        )}
      >
        {name}
      </span>
    </Link>
  );
}

// ─── Sidebar Content ──────────────────────────────────────────────────────────

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { currentUser, logout } = useStore();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  
  const role = currentUser?.role || 'RESEARCH_SCHOLAR';
  const items = getSidebarItems(role);

  const isActive = (href: string) => {
    if (href === '/dashboard' || href === '/admin') {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <div className="flex flex-col h-full py-4 bg-white dark:bg-[#091525] border-r border-slate-200/80 dark:border-white/[0.08]">
      {/* Brand + Close (mobile) */}
      <div className="flex items-center justify-between px-5 mb-4">
        <Logo showText={true} size={32} />
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-[#132238] transition-colors cursor-pointer md:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 flex flex-col gap-1.5 scrollbar-thin mt-2">
        <div className="flex flex-col gap-0.5">
          {items.map((item) => (
            <NavItem
              key={item.href + item.name}
              {...item}
              active={isActive(item.href)}
              onClick={onClose}
              hoveredItem={hoveredItem}
              setHoveredItem={setHoveredItem}
            />
          ))}
        </div>
      </nav>

      {/* User mini-profile pill */}
      <div className="px-3 pt-3 mt-auto border-t border-slate-100 dark:border-white/[0.08]">
        {currentUser && (
          <Link
            href={role === 'RESEARCH_SCHOLAR' ? '/scholar/profile' : '/profile'}
            onClick={onClose}
            className="p-2.5 rounded-full hover:bg-slate-100/90 dark:hover:bg-[#132238] transition-all flex items-center gap-3 border border-slate-200/60 dark:border-white/[0.08] dark:bg-[#0B1728] mb-2 group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0 bg-slate-100 dark:bg-slate-800">
              <img
                src={getProfileImageUrl(currentUser)}
                alt={currentUser.name || 'User'}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-slate-900 dark:text-[#F5F7FA] truncate leading-tight group-hover:text-[#0C4DA2] dark:group-hover:text-[#3B82F6]">{currentUser.name || 'Researcher'}</p>
              <p className="text-[10px] font-bold text-slate-400 dark:text-[#718096] truncate mt-0.5">
                {currentUser.department || (role === 'INSTITUTE_ADMIN' ? 'Institute Admin' : role === 'RESEARCH_SUPERVISOR' ? 'Research Supervisor' : 'Research Scholar')}
              </p>
            </div>
          </Link>
        )}

        {role === 'RESEARCH_SUPERVISOR' && (
          <Link
            href="/my-scholars"
            onClick={onClose}
            className={cn(
              "p-2.5 rounded-full transition-all flex items-center gap-3 border mb-2 cursor-pointer",
              isActive('/my-scholars')
                ? "bg-[#0C4DA2] dark:bg-[#2563EB] text-white border-[#0C4DA2] dark:border-transparent shadow-sm shadow-[#0C4DA2]/25"
                : "bg-[#0C4DA2]/10 dark:bg-blue-600/15 hover:bg-[#0C4DA2]/15 text-[#0C4DA2] dark:text-[#3B82F6] border-[#0C4DA2]/25 dark:border-blue-500/30"
            )}
          >
            <div className={cn(
              "w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm transition-colors",
              isActive('/my-scholars') ? "bg-white text-[#0C4DA2]" : "bg-[#0C4DA2] dark:bg-[#2563EB] text-white"
            )}>
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className={cn("text-xs font-black leading-tight", isActive('/my-scholars') ? "text-white" : "text-[#0C4DA2] dark:text-[#F5F7FA]")}>Supervision Panel</p>
              <p className={cn("text-[10px] font-bold mt-0.5", isActive('/my-scholars') ? "text-blue-100" : "text-slate-400 dark:text-[#718096]")}>Manage Scholars & Advisory</p>
            </div>
          </Link>
        )}

        <button
          onClick={() => { logout(); onClose?.(); }}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-xs font-extrabold text-slate-500 dark:text-[#718096] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50/60 dark:hover:bg-rose-950/30 transition-all cursor-pointer text-left"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Exit Portal</span>
        </button>

        {/* SRM Institutional Branding */}
        <div className="mt-3 pt-3 border-t border-slate-100/80 dark:border-white/[0.08] flex items-center justify-center opacity-90 hover:opacity-100 transition-opacity">
          <SRMLogo variant="full" theme="dark" size={32} />
        </div>
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
      <aside className="hidden md:flex flex-col w-[260px] bg-white dark:bg-[#091525] border-r border-borderStroke dark:border-white/[0.08] h-screen sticky top-0 z-40 shrink-0 font-sans">
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
              className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px]"
              onClick={() => setMobileSidebar(false)}
            />

            {/* Drawer */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              className="md:hidden fixed left-0 top-0 bottom-0 z-[51] w-[280px] bg-white dark:bg-[#091525] border-r border-borderStroke dark:border-white/[0.08] shadow-2xl font-sans"
            >
              <SidebarContent onClose={() => setMobileSidebar(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
