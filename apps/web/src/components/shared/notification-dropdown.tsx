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
  ChevronRight
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Notification } from '@curiousbees/types';

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

  const { notifications, fetchNotifications, markNotificationAsRead, markAllNotificationsAsRead } = useStore();

  useEffect(() => {
    fetchNotifications();
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

  const unreadCount = (notifications || []).filter(n => !n.isRead).length;

  const handleNotificationClick = (item: Notification) => {
    markNotificationAsRead(item.id);
    setIsOpen(false);
    const targetUrl = item.href || item.actionUrl || '/notifications';
    router.push(targetUrl);
  };

  const getIcon = (type?: string) => {
    switch(type) {
      case 'POST':
      case 'RESEARCH_PAPER': 
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'OPPORTUNITY': 
        return <Briefcase className="w-4 h-4 text-[#0C4DA2]" />;
      case 'COLLABORATION': 
        return <Users className="w-4 h-4 text-blue-700" />;
      case 'ADVISORY':
      case 'SUPERVISION': 
        return <Award className="w-4 h-4 text-amber-600" />;
      default: 
        return <Sparkles className="w-4 h-4 text-[#0C4DA2]" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2.5 rounded-full hover:bg-slate-100/80 hover:text-[#0C4DA2] transition-all relative cursor-pointer text-slate-600"
        title="Notifications"
        aria-label="Toggle notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 bg-[#0C4DA2] text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white ring-1 ring-blue-100">
            {unreadCount}
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
            className="absolute right-0 top-full mt-2 w-84 md:w-96 bg-white/95 backdrop-blur-2xl border border-slate-200/90 rounded-3xl z-50 overflow-hidden shadow-[0_16px_40px_rgba(12,77,162,0.12)] ring-1 ring-white flex flex-col select-none text-left"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-slate-900">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-black bg-[#0C4DA2]/10 text-[#0C4DA2] px-2 py-0.5 rounded-full">
                    {unreadCount} unread
                  </span>
                )}
              </div>

              {unreadCount > 0 && (
                <button
                  onClick={() => markAllNotificationsAsRead()}
                  className="text-[10px] uppercase font-black text-[#0C4DA2] hover:text-[#042654] tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Mark all read</span>
                </button>
              )}
            </div>

            {/* Notification Items from single source of truth */}
            <div className="flex-1 max-h-[360px] overflow-y-auto divide-y divide-slate-100 scrollbar-thin">
              {notifications.length > 0 ? (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`p-4 flex items-start gap-3.5 hover:bg-slate-50/80 transition-colors cursor-pointer group relative ${
                      !n.isRead ? 'bg-blue-50/30' : ''
                    }`}
                  >
                    <div className={`p-2 rounded-xl shrink-0 mt-0.5 shadow-2xs border ${
                      n.type === 'RESEARCH_PAPER' || n.type === 'POST' ? 'bg-blue-50 border-blue-100' :
                      n.type === 'OPPORTUNITY' ? 'bg-blue-50/80 border-blue-100' :
                      n.type === 'COLLABORATION' ? 'bg-blue-50/50 border-blue-100' :
                      n.type === 'ADVISORY' || n.type === 'SUPERVISION' ? 'bg-amber-50 border-amber-100' :
                      'bg-slate-50 border-slate-100'
                    }`}>
                      {getIcon(n.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <p className={`text-xs text-slate-900 group-hover:text-[#0C4DA2] transition-colors truncate ${
                          !n.isRead ? 'font-extrabold' : 'font-semibold'
                        }`}>
                          {n.title}
                        </p>
                        <span className="text-[10px] font-medium text-slate-400 shrink-0">
                          {n.time || formatRelativeTime(n.createdAt)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed font-normal">
                        {n.body}
                      </p>
                    </div>

                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-[#0C4DA2] shrink-0 mt-2" />
                    )}
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-slate-400 gap-2">
                  <Bell className="w-8 h-8 opacity-30 text-[#0C4DA2]" />
                  <p className="text-xs font-bold text-slate-600">All caught up!</p>
                  <p className="text-[11px] text-slate-400">You do not have any notifications right now.</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 bg-slate-50/80 border-t border-slate-100 text-center">
              <button 
                onClick={() => {
                  setIsOpen(false);
                  router.push('/notifications');
                }}
                className="text-[11px] font-bold text-[#0C4DA2] hover:text-[#042654] transition-colors flex items-center justify-center gap-1 w-full cursor-pointer py-1"
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
