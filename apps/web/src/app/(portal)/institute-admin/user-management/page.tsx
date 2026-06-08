'use client';

import React, { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { useRouter } from 'next/navigation';
import { Users, GraduationCap, Shield, UserCog } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ScholarsTab from './components/ScholarsTab';
import SupervisorsTab from './components/SupervisorsTab';
import AdminsTab from './components/AdminsTab';

export default function UserManagementPage() {
  const router = useRouter();
  const { currentUser } = useStore();
  const [activeTab, setActiveTab] = useState<'SCHOLARS' | 'SUPERVISORS' | 'ADMINS'>('SCHOLARS');

  useEffect(() => {
    if (currentUser && currentUser.role !== 'INSTITUTE_ADMIN') {
      router.replace('/dashboard');
    }
  }, [currentUser, router]);

  if (currentUser?.role !== 'INSTITUTE_ADMIN') return null;

  return (
    <div className="space-y-6 text-left select-none max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between border-b border-slate-100 pb-5 gap-4">
        <div>
          <span className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-1.5">
            <Users className="w-4 h-4 text-primary" />
            <span>Institute Administration</span>
          </span>
          <h1 className="cb-page-title mt-2 font-display">User Management</h1>
          <p className="cb-page-subtitle">Central hub for managing scholars, supervisors, and platform administrators.</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        {[
          { id: 'SCHOLARS', label: 'Scholars', icon: GraduationCap },
          { id: 'SUPERVISORS', label: 'Supervisors', icon: UserCog },
          { id: 'ADMINS', label: 'Administrators', icon: Shield },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-5 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="pt-2">
        <AnimatePresence mode="wait">
          {activeTab === 'SCHOLARS' && (
            <motion.div key="scholars" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <ScholarsTab />
            </motion.div>
          )}
          {activeTab === 'SUPERVISORS' && (
            <motion.div key="supervisors" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <SupervisorsTab />
            </motion.div>
          )}
          {activeTab === 'ADMINS' && (
            <motion.div key="admins" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <AdminsTab />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
