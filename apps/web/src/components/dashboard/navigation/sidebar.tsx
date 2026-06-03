'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap,
  BookOpen,
  Calendar,
  Settings,
  ShieldCheck,
  FileText,
  BarChart3
} from 'lucide-react';
import Logo from '@/components/Logo';

const NAV_CONFIG = {
  INSTITUTION_ADMIN: [
    { name: 'Overview', href: '/dashboard/admin', icon: LayoutDashboard },
    { name: 'User Management', href: '/dashboard/admin/users', icon: Users },
    { name: 'Institutions', href: '/dashboard/admin/institutions', icon: ShieldCheck },
    { name: 'Analytics', href: '/dashboard/admin/analytics', icon: BarChart3 },
    { name: 'Settings', href: '/dashboard/admin/settings', icon: Settings },
  ],
  RESEARCH_SUPERVISOR: [
    { name: 'Overview', href: '/dashboard/supervisor', icon: LayoutDashboard },
    { name: 'My Scholars', href: '/dashboard/supervisor/scholars', icon: GraduationCap },
    { name: 'Research Pipeline', href: '/dashboard/supervisor/pipeline', icon: BookOpen },
    { name: 'Meetings', href: '/dashboard/events', icon: Calendar },
    { name: 'Approvals', href: '/dashboard/supervisor/approvals', icon: FileText },
  ],
  RESEARCH_SCHOLAR: [
    { name: 'My Dashboard', href: '/dashboard/researcher', icon: LayoutDashboard },
    { name: 'My Research', href: '/dashboard/researcher/research', icon: BookOpen },
    { name: 'Collaborators', href: '/dashboard/researcher/collaborators', icon: Users },
    { name: 'Events', href: '/dashboard/events', icon: Calendar },
  ]
};

export function Sidebar() {
  const pathname = usePathname();
  const { currentUser } = useStore();
  const role = currentUser?.role || 'RESEARCH_SCHOLAR';
  
  const navItems = NAV_CONFIG[role];

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-surface border-r border-outline-variant/30 flex flex-col z-30 font-sans">
      <div className="h-16 flex items-center px-6 border-b border-outline-variant/30">
        <Logo className="h-6 w-auto" />
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-1">
        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 px-2">
          {role === 'INSTITUTION_ADMIN' ? 'Admin Portal' : role === 'RESEARCH_SUPERVISOR' ? 'Supervisor Portal' : 'Scholar Portal'}
        </div>
        
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group',
                isActive 
                  ? 'text-primary bg-primary/5' 
                  : 'text-foreground/80 hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className={cn('w-4 h-4', isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')} />
              <span>{item.name}</span>
              
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
