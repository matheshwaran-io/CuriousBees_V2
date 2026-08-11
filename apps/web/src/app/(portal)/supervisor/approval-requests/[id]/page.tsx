'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { apiFetch } from '@/lib/api-client';
import { DashboardShell } from '@/components/shared/dashboard-shell';
import {
  ShieldAlert,
  Check,
  X,
  User,
  Mail,
  BookOpen,
  Calendar,
  Loader2,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SupervisorApprovalRequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = params?.id as string;
  const { currentUser } = useStore();

  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<'approve' | 'reject' | null>(null);
  const [showConfirm, setShowConfirm] = useState<'approve' | 'reject' | null>(null);
  const [actionComplete, setActionComplete] = useState<'approved' | 'rejected' | null>(null);

  useEffect(() => {
    if (!requestId) return;
    const fetchRequest = async () => {
      setLoading(true);
      try {
        const res = await apiFetch(`/api/supervisor-requests/${requestId}`);
        if (res.ok) {
          const data = await res.json();
          setRequest(data);
        } else if (res.status === 403) {
          setError('You are not authorized to view this request.');
        } else if (res.status === 404) {
          setError('This supervision request was not found.');
        } else {
          setError('Failed to load request details.');
        }
      } catch (e) {
        setError('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchRequest();
  }, [requestId]);

  const handleApprove = async () => {
    setActionLoading('approve');
    try {
      const res = await apiFetch(`/api/supervisor-requests/${requestId}/approve`, {
        method: 'PUT',
      });
      if (res.ok) {
        setActionComplete('approved');
        setShowConfirm(null);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.message || 'Failed to approve request.');
      }
    } catch (e) {
      setError('Network error during approval.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    setActionLoading('reject');
    try {
      const res = await apiFetch(`/api/supervisor-requests/${requestId}/reject`, {
        method: 'PUT',
      });
      if (res.ok) {
        setActionComplete('rejected');
        setShowConfirm(null);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.message || 'Failed to reject request.');
      }
    } catch (e) {
      setError('Network error during rejection.');
    } finally {
      setActionLoading(null);
    }
  };

  const getInitials = (name?: string | null) => {
    if (!name) return 'RS';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-[#0b4ea2]" />
            <p className="text-xs font-bold text-textSecondary uppercase tracking-wider">Loading Request...</p>
          </div>
        </div>
      </DashboardShell>
    );
  }

  if (error) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="bg-white border border-borderStroke rounded-xl p-8 max-w-sm text-center space-y-4 shadow-sm">
            <ShieldAlert className="w-10 h-10 text-rose-500 mx-auto" />
            <h2 className="text-lg font-display font-extrabold text-black">Access Denied</h2>
            <p className="text-xs text-textSecondary font-semibold">{error}</p>
            <button
              onClick={() => router.push('/approval-requests')}
              className="px-4 py-2 bg-[#0b4ea2] text-white rounded-lg font-bold text-xs cursor-pointer"
            >
              Go to Approval Queue
            </button>
          </div>
        </div>
      </DashboardShell>
    );
  }

  if (actionComplete) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="bg-white border border-borderStroke rounded-xl p-8 max-w-sm text-center space-y-4 shadow-sm">
            <div className={cn(
              "w-12 h-12 rounded-full mx-auto flex items-center justify-center",
              actionComplete === 'approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
            )}>
              {actionComplete === 'approved' ? <Check className="w-6 h-6" /> : <X className="w-6 h-6" />}
            </div>
            <h2 className="text-lg font-display font-extrabold text-black">
              {actionComplete === 'approved' ? 'Request Approved!' : 'Request Rejected'}
            </h2>
            <p className="text-xs text-textSecondary font-semibold">
              {actionComplete === 'approved'
                ? `${request?.scholar?.name || 'The scholar'} now has full access to the CuriousBees research portal under your supervision.`
                : `${request?.scholar?.name || 'The scholar'} has been notified and can select another supervisor.`}
            </p>
            <button
              onClick={() => router.push('/approval-requests')}
              className="px-4 py-2 bg-[#0b4ea2] text-white rounded-lg font-bold text-xs cursor-pointer"
            >
              Back to Approval Queue
            </button>
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="max-w-2xl mx-auto w-full space-y-6">
        {/* Back Navigation */}
        <button
          onClick={() => router.push('/approval-requests')}
          className="flex items-center gap-1.5 text-xs font-bold text-textSecondary hover:text-[#0b4ea2] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Approval Queue</span>
        </button>

        {/* Header */}
        <div className="bg-white border border-borderStroke rounded-xl overflow-hidden shadow-sm">
          <div className="p-5 border-b border-borderStroke bg-slate-50/50">
            <h1 className="text-base font-display font-extrabold text-[#0b4ea2]">
              Supervision Request Review
            </h1>
            <p className="text-[11px] text-textSecondary font-semibold mt-1">
              Review the scholar&apos;s profile and approve or reject their supervision request.
            </p>
          </div>

          {/* Scholar Details Card */}
          <div className="p-5 space-y-5">
            {/* Scholar Profile Section */}
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-borderStroke/50">
              <div className="w-12 h-12 rounded-full bg-[#0b4ea2]/10 text-[#0b4ea2] flex items-center justify-center font-display font-extrabold text-base shrink-0 border border-[#0b4ea2]/25">
                {getInitials(request?.scholar?.name)}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-black">{request?.scholar?.name || 'Research Scholar'}</h3>
                <p className="text-[11px] text-textSecondary font-semibold mt-0.5">{request?.scholar?.email}</p>
                <div className="mt-1">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 bg-[#EEF4FF] text-[#0b4ea2] border border-[#0b4ea2]/20 rounded-full">
                    Research Scholar
                  </span>
                </div>
              </div>
            </div>

            {/* Detail Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-textSecondary flex items-center gap-1">
                  <BookOpen className="w-3 h-3" /> Department
                </label>
                <p className="text-xs font-bold text-black bg-slate-50 p-2.5 rounded-lg border border-borderStroke/40">
                  {request?.scholar?.department || 'Not specified'}
                </p>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-textSecondary flex items-center gap-1">
                  <Mail className="w-3 h-3" /> Email
                </label>
                <p className="text-xs font-bold text-[#0b4ea2] bg-slate-50 p-2.5 rounded-lg border border-borderStroke/40">
                  {request?.scholar?.email}
                </p>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-textSecondary flex items-center gap-1">
                  <BookOpen className="w-3 h-3" /> Research Area
                </label>
                <p className="text-xs font-bold text-black bg-slate-50 p-2.5 rounded-lg border border-borderStroke/40">
                  {request?.scholar?.scholarProfile?.researchArea || 'Not specified'}
                </p>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-textSecondary flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Submitted
                </label>
                <p className="text-xs font-bold text-black bg-slate-50 p-2.5 rounded-lg border border-borderStroke/40">
                  {new Date(request?.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>

            {/* Scholar Bio */}
            {request?.scholar?.bio && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-textSecondary">Scholar Bio</label>
                <p className="text-xs text-black font-semibold bg-slate-50 p-3 rounded-lg border border-borderStroke/40 leading-relaxed">
                  {request.scholar.bio}
                </p>
              </div>
            )}

            {/* Status Badge */}
            <div className="flex items-center justify-between p-3 bg-amber-50/50 rounded-lg border border-amber-200/50">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-textSecondary">Request Status</span>
              <span className={cn(
                "text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full",
                request?.status === 'PENDING' && 'bg-amber-100 text-amber-700 border border-amber-200',
                request?.status === 'APPROVED' && 'bg-emerald-100 text-emerald-700 border border-emerald-200',
                request?.status === 'REJECTED' && 'bg-rose-100 text-rose-700 border border-rose-200',
              )}>
                ● {request?.status}
              </span>
            </div>
          </div>

          {/* Action Footer */}
          {request?.status === 'PENDING' && (
            <div className="p-4 border-t border-borderStroke bg-slate-50/50 flex justify-end gap-3">
              <button
                onClick={() => setShowConfirm('reject')}
                className="px-4 py-2.5 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                Reject Request
              </button>
              <button
                onClick={() => setShowConfirm('approve')}
                className="px-5 py-2.5 bg-[#0b4ea2] text-white hover:bg-[#001e4c] rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <Check className="w-3.5 h-3.5" />
                Approve Request
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-borderStroke shadow-2xl max-w-sm w-full p-6 space-y-4 text-center font-sans">
            <div className={cn(
              "w-12 h-12 rounded-full mx-auto flex items-center justify-center",
              showConfirm === 'approve' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-200'
            )}>
              {showConfirm === 'approve' ? <Check className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
            </div>
            <h3 className="font-display font-extrabold text-base text-black">
              {showConfirm === 'approve' ? 'Approve Supervision Request?' : 'Reject Supervision Request?'}
            </h3>
            <p className="text-xs text-textSecondary font-semibold leading-relaxed">
              {showConfirm === 'approve'
                ? `This will assign ${request?.scholar?.name || 'the scholar'} to your supervision and activate their CuriousBees research portal.`
                : `This will reject ${request?.scholar?.name || 'the scholar'}'s request. They will be able to select another supervisor.`}
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowConfirm(null)}
                disabled={!!actionLoading}
                className="flex-1 px-4 py-2.5 bg-white border border-borderStroke text-black rounded-lg text-xs font-bold cursor-pointer hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={showConfirm === 'approve' ? handleApprove : handleReject}
                disabled={!!actionLoading}
                className={cn(
                  "flex-1 px-4 py-2.5 rounded-lg text-xs font-bold cursor-pointer transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50",
                  showConfirm === 'approve'
                    ? 'bg-[#0b4ea2] text-white hover:bg-[#001e4c]'
                    : 'bg-rose-600 text-white hover:bg-rose-700'
                )}
              >
                {actionLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : showConfirm === 'approve' ? (
                  'Approve'
                ) : (
                  'Reject'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
