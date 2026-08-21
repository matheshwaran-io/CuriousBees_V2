'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  CheckCircle, 
  FileText, 
  Briefcase, 
  Users, 
  Award, 
  Sparkles, 
  Calendar,
  ChevronRight
} from 'lucide-react';
import { useStore } from '@/store/useStore';
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

export function NotificationDropdown() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences>(getStoredNotificationPreferences());

  const { notifications, unreadCount, fetchNotifications, markNotificationAsRead, markAllNotificationsAsRead } = useStore();

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

  // Close on outside click safely
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Only notifications allowed by Settings
  const allowedNotifications = React.useMemo(() => {
    return (notifications || []).filter(n => isNotificationAllowedByPreferences(n, preferences));
  }, [notifications, preferences]);



  const handleNotificationClick = (item: Notification) => {
    markNotificationAsRead(item.id);
    setIsOpen(false);
    const targetUrl = item.href || item.actionUrl || '/notifications';
    router.push(targetUrl);
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
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2.5 rounded-full hover:bg-slate-100/80 dark:hover:bg-[#132238] hover:text-[#0C4DA2] dark:hover:text-[#3B82F6] transition-all relative cursor-pointer text-slate-600 dark:text-[#A7B3C5]"
        title="Notifications"
        aria-label="Toggle notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 bg-[#0C4DA2] dark:bg-[#2563EB] text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-[#07111F] ring-1 ring-blue-100 dark:ring-blue-900/30">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute right-0 top-full mt-2 w-84 md:w-96 bg-white dark:bg-[#101D30] border border-slate-200 dark:border-white/[0.12] rounded-3xl z-50 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.25)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.6)] flex flex-col select-none text-left"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/[0.08] bg-slate-50/80 dark:bg-[#0B1728]">
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-[#F5F7FA]">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-black bg-[#0C4DA2]/10 dark:bg-blue-600/20 text-[#0C4DA2] dark:text-[#3B82F6] px-2 py-0.5 rounded-full">
                    {unreadCount} unread
                  </span>
                )}
              </div>

              {unreadCount > 0 && (
                <button
                  onClick={() => markAllNotificationsAsRead()}
                  className="text-[10px] uppercase font-black text-[#0C4DA2] dark:text-[#3B82F6] hover:text-[#042654] dark:hover:text-blue-300 tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Mark all read</span>
                </button>
              )}
            </div>

            {/* Notification Items from single source of truth */}
            <div className="flex-1 max-h-[360px] overflow-y-auto divide-y divide-slate-100 dark:divide-white/[0.06] scrollbar-thin">
              {allowedNotifications.length > 0 ? (
                allowedNotifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`p-4 flex items-start gap-3.5 hover:bg-slate-50/80 dark:hover:bg-[#132238] transition-colors cursor-pointer group relative ${
                      !n.isRead ? 'bg-blue-50/30 dark:bg-blue-600/10' : ''
                    }`}
                  >
                    <div className={`p-2 rounded-xl shrink-0 mt-0.5 shadow-2xs border ${getIconBoxStyle(n)}`}>
                      {getIcon(n)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <p className={`text-xs text-slate-900 dark:text-[#F5F7FA] group-hover:text-[#0C4DA2] dark:group-hover:text-[#3B82F6] transition-colors truncate ${
                          !n.isRead ? 'font-extrabold' : 'font-semibold'
                        }`}>
                          {n.title}
                        </p>
                        <span className="text-[10px] font-medium text-slate-400 dark:text-[#718096] shrink-0">
                          {n.time || formatRelativeTime(n.createdAt)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-[#A7B3C5] line-clamp-2 leading-relaxed font-normal">
                        {n.body}
                      </p>
                    </div>

                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-[#0C4DA2] dark:bg-[#3B82F6] shrink-0 mt-2" />
                    )}
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-slate-400 dark:text-[#718096] gap-2">
                  <Bell className="w-8 h-8 opacity-30 text-[#0C4DA2] dark:text-[#3B82F6]" />
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300">All caught up!</p>
                  <p className="text-[11px] text-slate-400 dark:text-[#718096]">You do not have any notifications right now.</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 bg-slate-50/80 dark:bg-[#0B1728] border-t border-slate-100 dark:border-white/[0.08] text-center">
              <button 
                onClick={() => {
                  setIsOpen(false);
                  router.push('/notifications');
                }}
                className="text-[11px] font-bold text-[#0C4DA2] dark:text-[#3B82F6] hover:text-[#042654] dark:hover:text-blue-300 transition-colors flex items-center justify-center gap-1 w-full cursor-pointer py-1"
              >
                <span>View all notifications</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
