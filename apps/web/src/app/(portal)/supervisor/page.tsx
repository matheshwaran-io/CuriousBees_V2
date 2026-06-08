'use client';

import React, { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { useRouter } from 'next/navigation';
import { 
  Users, Check, X, AlertCircle, Loader2, Award, 
  BookOpen, FileText, Mail, GraduationCap
} from 'lucide-react';
import AvatarRing from '@/components/AvatarRing';
import { motion, AnimatePresence } from 'framer-motion';

export default function SupervisorDashboardPage() {
  const router = useRouter();
  const { 
    currentUser,
    pendingApprovals,
    fetchPendingScholars,
    supervisorApproveScholar,
    supervisorRejectScholar,
    myScholars,
    fetchMyScholars,
    isLoading
  } = useStore();

  const [activeTab, setActiveTab] = useState<'pending' | 'scholars'>('pending');

  const isSupervisor = currentUser?.role === 'RESEARCH_SUPERVISOR';

  // Guard access
  useEffect(() => {
    if (currentUser && !isSupervisor) {
      router.replace('/dashboard');
    }
  }, [currentUser, isSupervisor, router]);

  useEffect(() => {
    if (isSupervisor) {
      fetchPendingScholars();
      fetchMyScholars();
    }
  }, [currentUser, isSupervisor, fetchPendingScholars, fetchMyScholars]);

  if (!isSupervisor) {
    return null;
  }

  const handleApprove = async (requestId: string) => {
    if (confirm('Are you sure you want to approve this scholar under your supervision?')) {
      try {
        await supervisorApproveScholar(requestId);
      } catch (err: any) {
        alert(`Error: ${err.message}`);
      }
    }
  };

  const handleReject = async (requestId: string) => {
    if (confirm('Are you sure you want to reject this scholar request?')) {
      try {
        await supervisorRejectScholar(requestId);
      } catch (err: any) {
        alert(`Error: ${err.message}`);
      }
    }
  };

  return (
    <div className="space-y-6 text-left select-none">
      
      {/* 🚀 Header */}
      <div className="border-b border-slate-100 pb-5">
        <span className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-1.5">
          <Users className="w-4 h-4 text-primary" />
          <span>Faculty Advisory Panel</span>
        </span>
        <h1 className="cb-page-title mt-2 font-display">Supervisor Dashboard</h1>
        <p className="cb-page-subtitle">
          Manage research scholars under your advisory, review pending supervision requests, and monitor candidate registrations.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="cb-card p-5 bg-white/95 backdrop-blur-md border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600 border border-amber-100">
            <Loader2 className={`w-5 h-5 ${pendingApprovals.length > 0 ? 'animate-spin' : ''}`} />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Pending Approvals</p>
            <p className="text-xl font-black text-slate-800 mt-0.5">{pendingApprovals.length}</p>
          </div>
        </div>

        <div className="cb-card p-5 bg-white/95 backdrop-blur-md border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-xl text-primary border border-primary/20">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Advised Scholars</p>
            <p className="text-xl font-black text-slate-800 mt-0.5">{myScholars.length}</p>
          </div>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="flex border-b border-slate-100">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'pending'
              ? 'border-primary text-primary'
              : 'border-transparent text-slate-450 hover:text-slate-700'
          }`}
        >
          Pending Scholars ({pendingApprovals.length})
        </button>
        <button
          onClick={() => setActiveTab('scholars')}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'scholars'
              ? 'border-primary text-primary'
              : 'border-transparent text-slate-450 hover:text-slate-700'
          }`}
        >
          My Scholars ({myScholars.length})
        </button>
      </div>

      {/* Main content tabs */}
      <div className="space-y-4">
        {activeTab === 'pending' ? (
          pendingApprovals.length === 0 ? (
            <div className="cb-card p-12 bg-white/95 border border-slate-100 shadow-sm text-center flex flex-col items-center justify-center space-y-3">
              <div className="p-3 bg-slate-50 text-slate-400 rounded-full border border-slate-100">
                <Check className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-750">No Pending Requests</p>
                <p className="text-[10px] text-slate-400 font-semibold mt-1">
                  You have approved all scholar supervision requests mapped to your account.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence mode="popLayout">
                {pendingApprovals.map((scholar: any) => (
                  <motion.div
                    key={scholar.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="cb-card p-5 bg-white/95 backdrop-blur-md border border-slate-100 shadow-sm flex flex-col justify-between gap-4 text-xs hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <AvatarRing
                          src={scholar.image || undefined}
                          name={scholar.name || undefined}
                          role='RESEARCH_SCHOLAR'
                          size="md"
                        />
                        <div>
                          <h4 className="font-bold text-slate-900 leading-snug">{scholar.name || 'Academic Scholar'}</h4>
                          <span className="text-[9px] bg-amber-50 text-amber-700 font-extrabold uppercase px-1.5 py-0.5 rounded border border-amber-200">
                            Awaiting Approval
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-3 space-y-2 text-slate-500 font-semibold">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] uppercase text-slate-400 font-extrabold tracking-wider">Email Address</span>
                        <a href={`mailto:${scholar.email}`} className="text-primary hover:underline flex items-center gap-1 font-mono">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{scholar.email}</span>
                        </a>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[10px] uppercase text-slate-400 font-extrabold tracking-wider">Department</span>
                        <span className="font-bold text-slate-700">{scholar.department || 'Computer Science'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100/60">
                      <button
                        onClick={() => handleReject(scholar.requestId)}
                        className="flex-1 py-2 bg-red-50 hover:bg-red-600 border border-red-200 text-red-700 hover:text-white rounded-xl text-[10px] font-bold uppercase cursor-pointer transition-all flex items-center justify-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Decline Scholar</span>
                      </button>
                      <button
                        onClick={() => handleApprove(scholar.requestId)}
                        className="flex-1 py-2 bg-primary hover:bg-[#0c4da2] border border-primary hover:border-[#0c4da2] text-white rounded-xl text-[10px] font-bold uppercase cursor-pointer transition-all flex items-center justify-center gap-1 shadow-md shadow-primary/10"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve Scholar</span>
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )
        ) : (
          myScholars.length === 0 ? (
            <div className="cb-card p-12 bg-white/95 border border-slate-100 shadow-sm text-center flex flex-col items-center justify-center space-y-3">
              <div className="p-3 bg-slate-50 text-slate-400 rounded-full border border-slate-100">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-750">No Approved Scholars</p>
                <p className="text-[10px] text-slate-400 font-semibold mt-1">
                  Once scholars map to you and you approve their requests, they will appear here.
                </p>
              </div>
            </div>
          ) : (
            <div className="cb-card bg-white/95 border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="cb-table-header text-[10px] uppercase tracking-wider text-slate-450 border-b border-slate-100 bg-slate-50/50">
                      <th className="p-4 pl-6">Scholar Candidate</th>
                      <th className="p-4">Department</th>
                      <th className="p-4">Contact Link</th>
                      <th className="p-4 pr-6 text-right">Academic Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/50">
                    {myScholars.map((scholar: any) => (
                      <tr key={scholar.id} className="cb-table-row text-xs hover:bg-slate-50/20 transition-colors">
                        <td className="p-4 pl-6">
                          <div className="flex items-center space-x-3">
                            <AvatarRing
                              src={scholar.image || undefined}
                              name={scholar.name || undefined}
                              role='RESEARCH_SCHOLAR'
                              size="sm"
                            />
                            <div>
                              <h4 className="font-bold text-slate-900 leading-snug">{scholar.name || 'Academic Scholar'}</h4>
                              <p className="text-[9px] text-slate-400 font-semibold">Registered Member</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-slate-650 font-bold">{scholar.department || 'Computer Science'}</td>
                        <td className="p-4">
                          <a href={`mailto:${scholar.email}`} className="text-primary font-semibold hover:underline flex items-center gap-1 font-mono text-[11px]">
                            <Mail className="w-3.5 h-3.5 text-slate-450" />
                            <span>{scholar.email}</span>
                          </a>
                        </td>
                        <td className="p-4 pr-6 text-right">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Check className="w-2.5 h-2.5" />
                            <span>Advised Scholar</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}
      </div>

    </div>
  );
}
