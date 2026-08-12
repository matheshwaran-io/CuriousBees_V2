'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Settings, User, ChevronRight, ShieldCheck, Sparkles } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { RoleBadge } from './role-badge';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export function ProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const { currentUser, logout } = useStore();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside safely
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

  if (!currentUser) return null;

  const initials = currentUser.name
    ? currentUser.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  const handleNavigate = (path: string) => {
    setIsOpen(false);
    router.push(path);
  };

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
    router.push('/sign-in');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full p-0.5 hover:ring-2 hover:ring-[#0C4DA2]/30 transition-all cursor-pointer select-none group"
        title="User Profile Menu"
        aria-label="Toggle user profile menu"
      >
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0C4DA2] to-blue-700 text-white flex items-center justify-center font-black text-xs uppercase overflow-hidden shadow-md border-2 border-white group-hover:scale-105 transition-transform">
          {currentUser.image ? (
            <img src={currentUser.image} alt={currentUser.name || 'Avatar'} className="w-full h-full object-cover" />
          ) : (
            <span>{initials}</span>
          )}
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute right-0 top-full mt-2 w-72 bg-white/95 backdrop-blur-2xl border border-slate-200/90 rounded-3xl z-50 overflow-hidden shadow-[0_16px_40px_rgba(12,77,162,0.12)] ring-1 ring-white p-2.5 flex flex-col select-none"
          >
            {/* Header info */}
            <div className="p-3.5 bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-2xl border border-slate-100/80 mb-2">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-[#0C4DA2] text-white font-black text-xs flex items-center justify-center shrink-0 border-2 border-white shadow-sm">
                  {currentUser.image ? (
                    <img src={currentUser.image} alt="" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <span>{initials}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black text-slate-900 truncate leading-snug">{currentUser.name || 'Researcher'}</p>
                  <p className="text-[11px] font-medium text-slate-500 truncate">{currentUser.email}</p>
                </div>
              </div>
              <div className="pt-1 flex items-center justify-between">
                <RoleBadge role={currentUser.role} size="sm" />
                <span className="text-[10px] font-extrabold text-[#0C4DA2] flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-[#0C4DA2]" />
                  <span>Verified</span>
                </span>
              </div>
            </div>

            {/* Menu Links */}
            <div className="flex flex-col gap-1">
              <button
                onClick={() => handleNavigate('/profile')}
                className="flex items-center justify-between px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:text-[#0C4DA2] hover:bg-blue-50/50 rounded-xl transition-all w-full text-left cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <User className="w-4 h-4 text-slate-400 group-hover:text-[#0C4DA2] transition-colors" />
                  <span>My Profile</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#0C4DA2] group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                onClick={() => handleNavigate('/profile')}
                className="flex items-center justify-between px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:text-[#0C4DA2] hover:bg-blue-50/50 rounded-xl transition-all w-full text-left cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <Settings className="w-4 h-4 text-slate-400 group-hover:text-[#0C4DA2] transition-colors" />
                  <span>Settings</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#0C4DA2] group-hover:translate-x-0.5 transition-all" />
              </button>

              <div className="h-px bg-slate-100 my-1 w-full" />

              <button
                onClick={handleLogout}
                className="flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-all w-full text-left cursor-pointer group"
              >
                <LogOut className="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform" />
                <span>Sign Out</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
