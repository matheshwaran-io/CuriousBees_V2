'use client';

import React, { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { useRouter } from 'next/navigation';
import { ShieldCheck, UserCheck, Search, Loader2, Check, X, Building2, UserX, Clock } from 'lucide-react';
import AvatarRing from '@/components/AvatarRing';

export default function SupervisorRequestsPage() {
  const router = useRouter();
  const {
    currentUser,
    pendingSupervisors,
    fetchPendingSupervisors,
    approveSupervisor,
    declineSupervisor,
    isLoading
  } = useStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Security check: Only Admins can access
  useEffect(() => {
    if (currentUser && currentUser.role !== 'INSTITUTE_ADMIN') {
      router.replace('/dashboard');
    }
  }, [currentUser, router]);

  useEffect(() => {
    if (currentUser?.role === 'INSTITUTE_ADMIN') {
      fetchPendingSupervisors();
    }
  }, [currentUser, fetchPendingSupervisors]);

  if (currentUser?.role !== 'INSTITUTE_ADMIN') {
    return null;
  }

  const handleApprove = async (id: string) => {
    if (confirm('Approve this supervisor account?')) {
      setProcessingId(id);
      try {
        await approveSupervisor(id);
      } finally {
        setProcessingId(null);
      }
    }
  };

  const handleDecline = async (id: string) => {
    if (confirm('Decline this supervisor registration? This will mark their account as REJECTED.')) {
      setProcessingId(id);
      try {
        await declineSupervisor(id);
      } finally {
        setProcessingId(null);
      }
    }
  };

  const filteredRequests = pendingSupervisors.filter((sup) => {
    const term = searchTerm.toLowerCase();
    return (
      (sup.name || '').toLowerCase().includes(term) ||
      sup.email.toLowerCase().includes(term) ||
      (sup.employeeId || '').toLowerCase().includes(term) ||
      (sup.department || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 text-left select-none">
      
      {/* Header */}
      <div className="border-b border-slate-100 pb-5">
        <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-amber-500" />
          <span>Action Required</span>
        </span>
        <h1 className="cb-page-title mt-2 font-display">Supervisor Requests</h1>
        <p className="cb-page-subtitle">
          Review and approve pending registrations from incoming Research Supervisors.
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="cb-card p-5 bg-white/95 backdrop-blur-md flex items-center gap-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 text-amber-600 rounded-xl">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pending Approvals</p>
            <h3 className="text-xl font-bold text-slate-800 mt-0.5">{pendingSupervisors.length}</h3>
          </div>
        </div>

        <div className="cb-card p-5 bg-white/95 backdrop-blur-md flex items-center gap-4">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 rounded-xl">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Verification Policy</p>
            <h3 className="text-sm font-semibold text-slate-800 mt-1">Manual ID Verification</h3>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="cb-card p-5 bg-white/95 backdrop-blur-md">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Search by name, email, Employee ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="cb-input pl-9"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3.5" />
        </div>
      </div>

      {/* Main List */}
      {isLoading && pendingSupervisors.length === 0 ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="cb-card p-12 text-center text-slate-450 font-sans">
          <ShieldCheck className="w-8 h-8 mx-auto text-emerald-400 mb-3" />
          <p className="text-sm font-bold text-slate-700">All caught up!</p>
          <p className="text-xs font-medium mt-1">No pending supervisor requests at the moment.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block cb-card overflow-hidden bg-white/95 backdrop-blur-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="cb-table-header text-[10px] uppercase tracking-wider text-slate-450 border-b border-slate-100">
                    <th className="p-4 pl-6">Applicant Info</th>
                    <th className="p-4">Department</th>
                    <th className="p-4">Employee ID</th>
                    <th className="p-4 pr-6 text-right font-bold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/50">
                  {filteredRequests.map((sup) => (
                    <tr key={sup.id} className="cb-table-row text-xs hover:bg-slate-50/20 transition-colors">
                      <td className="p-4 pl-6 flex items-center space-x-3">
                        <AvatarRing src={sup.image} name={sup.name || undefined} role={sup.role} size="sm" />
                        <div>
                          <h4 className="font-bold text-slate-900 leading-snug">{sup.name || 'N/A'}</h4>
                          <p className="text-[10px] text-slate-400 font-semibold">{sup.email}</p>
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{sup.department || 'Not Specified'}</span>
                        </div>
                      </td>

                      <td className="p-4 text-slate-700 font-mono font-bold text-[11px] tracking-wide">
                        {sup.employeeId || 'N/A'}
                      </td>

                      <td className="p-4 pr-6 text-right space-x-2">
                        <button
                          onClick={() => handleDecline(sup.id)}
                          disabled={processingId === sup.id}
                          className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors inline-flex items-center gap-1.5 border bg-red-50 border-red-200 text-red-700 hover:bg-red-100/60 disabled:opacity-50 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                          <span>Decline</span>
                        </button>
                        <button
                          onClick={() => handleApprove(sup.id)}
                          disabled={processingId === sup.id}
                          className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors inline-flex items-center gap-1.5 border bg-emerald-50 border-emerald-250 text-emerald-700 hover:bg-emerald-100/60 disabled:opacity-50 cursor-pointer"
                        >
                          {processingId === sup.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                          <span>Approve</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {filteredRequests.map((sup) => (
              <div key={sup.id} className="cb-card p-5 bg-white/95 backdrop-blur-md space-y-4">
                <div className="flex items-center gap-3">
                  <AvatarRing src={sup.image} name={sup.name || undefined} role={sup.role} size="md" />
                  <div>
                    <h4 className="font-bold text-slate-900 leading-snug">{sup.name || 'N/A'}</h4>
                    <p className="text-[10px] text-slate-400 font-semibold">{sup.email}</p>
                  </div>
                </div>

                <div className="border-t border-slate-100/70 pt-3 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-semibold flex items-center gap-1.5"><Building2 className="w-3 h-3"/> Department:</span>
                    <span className="font-bold text-slate-700">{sup.department || 'Not Specified'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-semibold">Employee ID:</span>
                    <span className="font-bold font-mono text-[11px] text-slate-800 tracking-wide">{sup.employeeId || 'N/A'}</span>
                  </div>
                </div>

                <div className="border-t border-slate-100/70 pt-3 flex gap-2">
                  <button
                    onClick={() => handleDecline(sup.id)}
                    disabled={processingId === sup.id}
                    className="flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 border bg-red-50 border-red-200 text-red-700 hover:bg-red-100/60 disabled:opacity-50 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                    <span>Decline</span>
                  </button>
                  <button
                    onClick={() => handleApprove(sup.id)}
                    disabled={processingId === sup.id}
                    className="flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 border bg-emerald-50 border-emerald-250 text-emerald-700 hover:bg-emerald-100/60 disabled:opacity-50 cursor-pointer"
                  >
                    {processingId === sup.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                    <span>Approve</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

    </div>
  );
}
