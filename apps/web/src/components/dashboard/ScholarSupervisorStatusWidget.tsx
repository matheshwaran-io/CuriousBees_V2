'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { apiFetch } from '@/lib/api-client';
import {
  UserCheck,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ShieldCheck,
  Search
} from 'lucide-react';

export function ScholarSupervisorStatusWidget() {
  const router = useRouter();
  const { currentUser } = useStore();
  const [latestRequest, setLatestRequest] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (currentUser?.role !== 'RESEARCH_SCHOLAR') return;

    const fetchScholarSupervision = async () => {
      setIsLoading(true);
      try {
        const res = await apiFetch('/api/supervisor-requests');
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            setLatestRequest(data[0]); // newest request
          }
        }
      } catch (err) {
        console.error('Failed to load scholar supervision status:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchScholarSupervision();
  }, [currentUser]);

  if (currentUser?.role !== 'RESEARCH_SCHOLAR' || isLoading) {
    return null;
  }

  const isApproved = currentUser?.approved && currentUser?.supervisorId;
  const isPending = latestRequest?.status === 'PENDING' && !isApproved;
  const isRejected = latestRequest?.status === 'REJECTED' && !isApproved;

  const supervisorName = isApproved
    ? (latestRequest?.supervisor?.name || currentUser?.supervisorEmail || 'Assigned Supervisor')
    : (latestRequest?.supervisor?.name || 'Research Supervisor');

  if (isApproved) {
    return (
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20 border border-emerald-200/80 dark:border-emerald-800/40 rounded-3xl p-5 shadow-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 rounded-md">
                Supervisor Assigned
              </span>
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-[#F5F7FA] mt-0.5">
              Dr. {supervisorName}
            </h4>
          </div>
        </div>
        {latestRequest?.supervisor?.id && (
          <button
            onClick={() => router.push(`/researchers/${latestRequest.supervisor.id}`)}
            className="px-4 py-2 bg-white dark:bg-[#101D30] border border-emerald-300 dark:border-emerald-700/40 text-emerald-800 dark:text-emerald-300 font-bold text-xs rounded-xl shadow-2xs hover:bg-emerald-50 dark:hover:bg-[#172942] transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <span>View Supervisor Profile</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/20 border border-amber-200/80 dark:border-amber-700/40 rounded-3xl p-5 shadow-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-[#0C4DA2] dark:bg-[#2563EB] text-white flex items-center justify-center shadow-xs">
            <Clock className="w-5 h-5 text-[#FFC828]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#855D00] dark:text-amber-300 bg-[#FFC828]/25 dark:bg-amber-900/40 px-2 py-0.5 rounded-md">
                Supervisor Request Pending
              </span>
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-[#F5F7FA] mt-0.5">
              Requested: Dr. {supervisorName}
            </h4>
          </div>
        </div>
        <div className="text-xs text-slate-500 dark:text-[#A7B3C5] font-medium hidden sm:block">
          Your request is currently awaiting supervisor review.
        </div>
      </div>
    );
  }

  if (isRejected || !latestRequest) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/20 border border-blue-200/80 dark:border-blue-800/40 rounded-3xl p-5 shadow-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-[#0C4DA2] dark:bg-[#2563EB] text-white flex items-center justify-center shadow-xs">
            <UserCheck className="w-5 h-5 text-[#FFC828]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#0C4DA2] dark:text-[#38BDF8] bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 rounded-md">
                {isRejected ? 'Supervisor Request Declined' : 'Supervisor Assignment Needed'}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-[#A7B3C5] mt-0.5">
              {isRejected
                ? 'Your previous request was declined. You can select another research supervisor.'
                : 'Select an SRMIST research supervisor to activate your research collaboration workspace.'}
            </p>
          </div>
        </div>
        <button
          onClick={() => router.push('/researchers')}
          className="px-4 py-2 bg-[#0C4DA2] dark:bg-[#2563EB] hover:bg-[#003370] dark:hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Find Supervisors</span>
        </button>
      </div>
    );
  }

  return null;
}
