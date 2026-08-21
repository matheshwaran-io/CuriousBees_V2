'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { 
  Bell, 
  CheckCircle2, 
  FileText, 
  Briefcase, 
  Users, 
  Award, 
  Sparkles, 
  Calendar,
  ExternalLink,
  Search
} from 'lucide-react';
import { Notification } from '@curiousbees/types';
import { 
  getStoredNotificationPreferences, 
  isNotificationAllowedByPreferences, 
  resolveNotificationCategory,
  NotificationPreferences 
} from '@/lib/notifications';

function formatRelativeTime(dateInput: Date | string | undefined): string {
  if (!dateInput) return 'Recently';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return 'Recently';
    const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return `${Math.floor(diffSec / 86400)}d ago`;
  } catch {
    return 'Recently';
  }
}

type FilterCategory = 'ALL' | 'UNREAD' | 'RESEARCH' | 'OPPORTUNITIES' | 'COLLABORATION' | 'SYSTEM';

export default function NotificationsPage() {
  const router = useRouter();
  const { notifications, unreadCount, fetchNotifications, markNotificationAsRead, markAllNotificationsAsRead, currentUser } = useStore();
  
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [preferences, setPreferences] = useState<NotificationPreferences>(getStoredNotificationPreferences());

  useEffect(() => {
    fetchNotifications();

    const handlePrefUpdate = () => {
      setPreferences(getStoredNotificationPreferences());
    };

    window.addEventListener('storage', handlePrefUpdate);
    window.addEventListener('cb-preferences-updated', handlePrefUpdate);
    return () => {
      window.removeEventListener('storage', handlePrefUpdate);
      window.removeEventListener('cb-preferences-updated', handlePrefUpdate);
    };
  }, [fetchNotifications]);

  // Notifications allowed by user's Settings
  const allowedNotifications = useMemo(() => {
    return (notifications || []).filter(n => isNotificationAllowedByPreferences(n, preferences));
  }, [notifications, preferences]);


  // Filtered Notifications for current tab and search
  const filteredNotifications = useMemo(() => {
    return allowedNotifications.filter(n => {
      const category = resolveNotificationCategory(n);
      
      // 1. Filter category
      if (activeFilter === 'UNREAD' && n.isRead) return false;
      if (activeFilter === 'RESEARCH' && category !== 'RESEARCH') return false;
      if (activeFilter === 'OPPORTUNITIES' && category !== 'OPPORTUNITIES') return false;
      if (activeFilter === 'COLLABORATION' && category !== 'COLLABORATION') return false;
      if (activeFilter === 'SYSTEM' && !(category === 'SYSTEM' || category === 'ADVISORY' || category === 'EVENTS')) return false;

      // 2. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = (n.title || '').toLowerCase().includes(q);
        const matchesBody = (n.body || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesBody) return false;
      }

      return true;
    });
  }, [allowedNotifications, activeFilter, searchQuery]);

  // Date Grouping Helper (TODAY, YESTERDAY, EARLIER)
  const groupedNotifications = useMemo(() => {
    const today: Notification[] = [];
    const yesterday: Notification[] = [];
    const earlier: Notification[] = [];

    const now = Date.now();

    filteredNotifications.forEach(n => {
      const notifTime = n.createdAt ? new Date(n.createdAt).getTime() : now;
      if (isNaN(notifTime)) {
        today.push(n);
        return;
      }
      const diffHours = Math.max(0, (now - notifTime) / (1000 * 60 * 60));

      if (diffHours < 24) {
        today.push(n);
      } else if (diffHours < 48) {
        yesterday.push(n);
      } else {
        earlier.push(n);
      }
    });

    return [
      { group: 'TODAY', items: today },
      { group: 'YESTERDAY', items: yesterday },
      { group: 'EARLIER', items: earlier },
    ].filter(g => g.items.length > 0);
  }, [filteredNotifications]);

  const handleItemClick = (notif: Notification) => {
    markNotificationAsRead(notif.id);
    let target = notif.href || notif.actionUrl;
    if (!target) {
      const category = resolveNotificationCategory(notif);
      if (category === 'ADVISORY') {
        target = currentUser?.role === 'RESEARCH_SUPERVISOR' ? '/my-scholars' : '/my-research';
      } else if (category === 'RESEARCH') {
        target = '/feed';
      } else if (category === 'OPPORTUNITIES') {
        target = '/opportunities';
      } else if (category === 'COLLABORATION') {
        target = '/scholar/connections';
      } else if (category === 'EVENTS') {
        target = '/events';
      } else {
        target = '/notifications';
      }
    }
    if (target) {
      router.push(target);
    }
  };

  const getIcon = (notif: Notification) => {
    const category = resolveNotificationCategory(notif);
    switch(category) {
      case 'RESEARCH': 
        return <FileText className="w-4 h-4 text-blue-600 dark:text-[#3B82F6]" />;
      case 'OPPORTUNITIES': 
        return <Briefcase className="w-4 h-4 text-[#0C4DA2] dark:text-[#38BDF8]" />;
      case 'COLLABORATION': 
        return <Users className="w-4 h-4 text-blue-700 dark:text-[#60A5FA]" />;
      case 'ADVISORY': 
        return <Award className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'EVENTS': 
        return <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      default: 
        return <Sparkles className="w-4 h-4 text-[#0C4DA2] dark:text-[#3B82F6]" />;
    }
  };

  const getTypeLabel = (notif: Notification) => {
    const category = resolveNotificationCategory(notif);
    switch(category) {
      case 'RESEARCH': return 'Research Paper';
      case 'OPPORTUNITIES': return 'Opportunity';
      case 'COLLABORATION': return 'Collaboration';
      case 'ADVISORY': return 'Advisory Update';
      case 'EVENTS': return 'Event';
      default: return 'System';
    }
  };

  const getIconBoxStyle = (notif: Notification) => {
    const category = resolveNotificationCategory(notif);
    switch(category) {
      case 'RESEARCH': return 'bg-blue-50 dark:bg-blue-950/40 border-blue-100 dark:border-blue-900/40';
      case 'OPPORTUNITIES': return 'bg-blue-50/80 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900/40';
      case 'COLLABORATION': return 'bg-blue-50/50 dark:bg-blue-950/40 border-blue-100 dark:border-blue-900/40';
      case 'ADVISORY': return 'bg-amber-50 dark:bg-amber-950/40 border-amber-100 dark:border-amber-900/40';
      case 'EVENTS': return 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-900/40';
      default: return 'bg-slate-50 dark:bg-[#0B1728] border-slate-100 dark:border-white/[0.08]';
    }
  };

  return (
    <div className="space-y-6 text-left select-none max-w-4xl mx-auto pb-16">
      
      {/* ─── 1. HEADER ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/90 dark:bg-[#101D30] backdrop-blur-xl p-6 md:p-8 rounded-[32px] border border-slate-200/80 dark:border-white/[0.08] shadow-[0_8px_30px_rgb(12,77,162,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-black uppercase tracking-widest bg-[#0C4DA2]/10 dark:bg-blue-600/20 text-[#0C4DA2] dark:text-[#3B82F6] px-3 py-1 rounded-full flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5" />
              SYSTEM NOTIFICATIONS
            </span>
            {unreadCount > 0 && (
              <span className="text-[10px] font-black text-white bg-[#0C4DA2] dark:bg-[#2563EB] px-2.5 py-0.5 rounded-full">
                {unreadCount} Unread
              </span>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-[#F5F7FA] tracking-tight font-display">Notification Center</h1>
          <p className="text-xs md:text-sm font-medium text-slate-500 dark:text-[#A7B3C5] mt-1">
            Review recent updates, paper publications, grant announcements, and collaboration requests.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={() => markAllNotificationsAsRead()}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-[#0B1728] hover:bg-slate-200/70 dark:hover:bg-[#172942] text-[#0C4DA2] dark:text-[#3B82F6] border border-slate-200/60 dark:border-white/[0.08] rounded-2xl text-xs font-bold transition-all cursor-pointer shrink-0 self-start sm:self-auto"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Mark all as read</span>
          </button>
        )}
      </div>

      {/* ─── 2. FILTER PILLS & SEARCH BAR ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'UNREAD', label: `Unread (${unreadCount})` },
            { id: 'RESEARCH', label: 'Research' },
            { id: 'OPPORTUNITIES', label: 'Opportunities' },
            { id: 'COLLABORATION', label: 'Collaboration' },
            { id: 'SYSTEM', label: 'System' },
          ].map((cat) => {
            const isSelected = activeFilter === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveFilter(cat.id as FilterCategory)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all border whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-[#0C4DA2] dark:bg-[#2563EB] text-white border-[#0C4DA2] dark:border-[#2563EB] shadow-2xs'
                    : 'bg-white dark:bg-[#101D30] text-slate-600 dark:text-[#A7B3C5] border-slate-200/80 dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-[#172942]'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative shrink-0 sm:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter notifications..."
            className="w-full pl-9 pr-3 py-2 bg-white dark:bg-[#101D30] border border-slate-200/80 dark:border-white/[0.08] rounded-2xl text-xs font-bold text-slate-800 dark:text-[#F5F7FA] placeholder:text-slate-400 dark:placeholder:text-[#718096] focus:outline-none focus:border-[#0C4DA2] dark:focus:border-[#2563EB] focus:ring-1 focus:ring-[#0C4DA2] dark:focus:ring-[#2563EB] shadow-2xs transition-colors"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 dark:text-[#718096] absolute left-3 top-3" />
        </div>
      </div>

      {/* ─── 3. NOTIFICATION GROUPS / LIST ─── */}
      {groupedNotifications.length === 0 ? (
        /* Empty State */
        <div className="bg-white/90 dark:bg-[#101D30] backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] p-12 text-center rounded-[32px] shadow-sm flex flex-col items-center justify-center min-h-[300px]">
          <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 flex items-center justify-center text-[#0C4DA2] dark:text-[#3B82F6] mb-3">
            <Bell className="w-6 h-6 opacity-60" />
          </div>
          <h3 className="text-slate-900 dark:text-[#F5F7FA] font-extrabold text-base">All caught up!</h3>
          <p className="text-slate-500 dark:text-[#A7B3C5] text-xs mt-1 max-w-sm font-medium">
            {activeFilter !== 'ALL' || searchQuery
              ? 'No notifications match your selected filter.'
              : 'You do not have any notifications right now.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedNotifications.map((group) => (
            <div key={group.group} className="space-y-3">
              {/* Date Group Heading */}
              <div className="flex items-center gap-2 px-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-[#718096]">
                  {group.group}
                </span>
                <div className="h-px bg-slate-200/70 dark:bg-white/[0.08] flex-1" />
              </div>

              {/* Items in Group */}
              <div className="space-y-2.5">
                {group.items.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => handleItemClick(notif)}
                    className={`p-4 md:p-5 rounded-2xl border transition-all cursor-pointer group flex items-start gap-4 shadow-2xs hover:shadow-xs ${
                      !notif.isRead 
                        ? 'bg-blue-50/40 dark:bg-[#101D30] border-blue-200/80 dark:border-blue-500/30' 
                        : 'bg-white dark:bg-[#132238] border-slate-200/80 dark:border-white/[0.08] hover:bg-slate-50/80 dark:hover:bg-[#172942]'
                    }`}
                  >
                    {/* Icon Box */}
                    <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 border shadow-2xs ${getIconBoxStyle(notif)}`}>
                      {getIcon(notif)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-3 mb-1 flex-wrap">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-[#0B1728] text-slate-600 dark:text-[#A7B3C5] border border-slate-200/60 dark:border-white/[0.08]">
                            {getTypeLabel(notif)}
                          </span>
                          <h4 className={`text-xs md:text-sm text-slate-900 dark:text-[#F5F7FA] group-hover:text-[#0C4DA2] dark:group-hover:text-[#3B82F6] transition-colors truncate ${
                            !notif.isRead ? 'font-extrabold' : 'font-semibold'
                          }`}>
                            {notif.title}
                          </h4>
                        </div>

                        <span className="text-[10px] font-medium text-slate-400 dark:text-[#718096] shrink-0">
                          {notif.time || formatRelativeTime(notif.createdAt)}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-[#A7B3C5] font-normal leading-relaxed">
                        {notif.body}
                      </p>

                      {/* Optional Action / Link button */}
                      {(notif.href || notif.actionUrl) && (
                        <div className="mt-2.5">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0C4DA2] dark:text-[#3B82F6] group-hover:underline">
                            <span>View details</span>
                            <ExternalLink className="w-3 h-3" />
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Unread dot */}
                    {!notif.isRead && (
                      <span className="w-2.5 h-2.5 rounded-full bg-[#0C4DA2] dark:bg-[#3B82F6] shrink-0 mt-2.5 animate-pulse" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
