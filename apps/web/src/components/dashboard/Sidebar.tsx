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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getProfileImageUrl } from '@/lib/avatar';
import Logo from '../Logo';
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
      { name: 'Notification Logs', href: '/notifications', icon: MessageSquare },
      { name: 'System Settings', href: '/admin/settings', icon: Shield },
      { name: 'Researchers', href: '/researchers', icon: Users },
      { name: 'Curious Nexus', href: '/nexus', icon: Network },
      { name: 'Integrations', href: '/settings/integrations', icon: Layers },
    ];
  }

  if (role === 'RESEARCH_SUPERVISOR') {
    return [
      { name: 'Research Feed', href: '/feed', icon: MessageSquare },
      { name: 'Opportunities', href: '/opportunities', icon: Briefcase },
      { name: 'Events', href: '/events', icon: CalendarIcon },
      { name: 'Researchers', href: '/researchers', icon: Users },
      { name: 'Curious Nexus', href: '/nexus', icon: Network },
      { name: 'Publications', href: '/publications', icon: BookOpen },
      { name: 'Integrations', href: '/settings/integrations', icon: Layers },
    ];
  }

  // Default: Research Scholar
  return [
    { name: 'Research Feed', href: '/feed', icon: MessageSquare },
    { name: 'Opportunities', href: '/opportunities', icon: Briefcase },
    { name: 'Events', href: '/events', icon: CalendarIcon },
    { name: 'Researchers', href: '/researchers', icon: Users },
    { name: 'Curious Nexus', href: '/nexus', icon: Network },
    { name: 'My Research', href: '/my-research', icon: BookMarked },
    { name: 'Publications', href: '/publications', icon: BookOpen },
    { name: 'Integrations', href: '/settings/integrations', icon: Layers },
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
          ? "bg-[#0C4DA2]/10 text-[#0C4DA2] font-black" 
          : "text-slate-700 hover:bg-slate-100/80 hover:text-slate-900"
      )}
    >
      {/* Active Blue Left Pillar */}
      {active && (
        <motion.span
          layoutId="sidebar-active-indicator"
          className="absolute left-1 top-2.5 bottom-2.5 w-[4px] bg-[#0C4DA2] rounded-full z-10"
          transition={{ type: 'spring', stiffness: 350, damping: 28 }}
        />
      )}

      <Icon
        className={cn(
          'w-5 h-5 shrink-0 transition-transform duration-150 relative z-10 group-hover:scale-105',
          active ? 'text-[#0C4DA2]' : 'text-slate-500 group-hover:text-slate-900'
        )}
      />
      <span
        className={cn(
          'truncate leading-none relative z-10 text-[14px]',
          active ? 'text-[#0C4DA2] font-extrabold tracking-tight' : 'text-slate-700 group-hover:text-slate-900'
        )}
      >
        {name}
      </span>
    </Link>
  );
}

// ─── Collapsible Nav Section ─────────────────────────────────────────────────

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
    <div className="flex flex-col h-full py-4 bg-white border-r border-slate-200/80">
      {/* Brand + Close (mobile) */}
      <div className="flex items-center justify-between px-5 mb-4">
        <Logo showText={true} size={32} />
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100 transition-colors cursor-pointer md:hidden"
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
      <div className="px-3 pt-3 mt-auto border-t border-slate-100">
        {currentUser && (
          <Link
            href={role === 'RESEARCH_SCHOLAR' ? '/scholar/profile' : '/profile'}
            onClick={onClose}
            className="p-2.5 rounded-full hover:bg-slate-100/90 transition-all flex items-center gap-3 border border-slate-200/60 mb-2 group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-full overflow-hidden border border-slate-200 shrink-0 bg-slate-100">
              <img
                src={getProfileImageUrl(currentUser)}
                alt={currentUser.name || 'User'}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-slate-900 truncate leading-tight group-hover:text-[#0C4DA2]">{currentUser.name || 'Researcher'}</p>
              <p className="text-[10px] font-bold text-slate-400 truncate mt-0.5">{currentUser.department || (role === 'RESEARCH_SUPERVISOR' ? 'Research Supervisor' : 'Research Scholar')}</p>
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
                ? "bg-[#0C4DA2] text-white border-[#0C4DA2] shadow-sm shadow-[#0C4DA2]/25"
                : "bg-[#0C4DA2]/10 hover:bg-[#0C4DA2]/15 text-[#0C4DA2] border-[#0C4DA2]/25"
            )}
          >
            <div className={cn(
              "w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm transition-colors",
              isActive('/my-scholars') ? "bg-white text-[#0C4DA2]" : "bg-[#0C4DA2] text-white"
            )}>
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className={cn("text-xs font-black leading-tight", isActive('/my-scholars') ? "text-white" : "text-[#0C4DA2]")}>Supervision Panel</p>
              <p className={cn("text-[10px] font-bold mt-0.5", isActive('/my-scholars') ? "text-blue-100" : "text-blue-650/80")}>Manage Scholars & Advisory</p>
            </div>
          </Link>
        )}

        <button
          onClick={() => { logout(); onClose?.(); }}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-xs font-extrabold text-slate-500 hover:text-rose-600 hover:bg-rose-50/60 transition-all cursor-pointer text-left"
        >
          <LogOut className="w-4 h-4 shrink-0" />
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
      <aside className="hidden md:flex flex-col w-[260px] bg-white border-r border-borderStroke h-screen sticky top-0 z-40 shrink-0 font-sans">
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
              className="md:hidden fixed inset-0 z-50 bg-black/35 backdrop-blur-[1px]"
              onClick={() => setMobileSidebar(false)}
            />

            {/* Drawer */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              className="md:hidden fixed left-0 top-0 bottom-0 z-[51] w-[280px] bg-white border-r border-borderStroke shadow-2xl font-sans"
            >
              <SidebarContent onClose={() => setMobileSidebar(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
