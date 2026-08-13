'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { 
  LogOut, 
  Hourglass,
  Shield,
  AlertCircle
} from 'lucide-react';
import Logo from '@/components/Logo';

export default function VerificationPendingPage() {
  const router = useRouter();
  const { 
    currentUser, 
    syncUserSession, 
    logout 
  } = useStore();

  // Poll periodically for approval status changes
  useEffect(() => {
    const checkStatus = async () => {
      const user = await syncUserSession({ force: true });
      if (user && (user.status === 'ACTIVE' || user.approved)) {
        const route = user.role === 'INSTITUTE_ADMIN' ? '/admin/dashboard' : useStore.getState().dashboardRoute;
        router.replace(route);
      }
    };
    
    checkStatus();
    const interval = setInterval(checkStatus, 6000); // Check every 6s for approval
    return () => clearInterval(interval);
  }, [syncUserSession, router]);

  const isSupervisorPending = currentUser?.role === 'RESEARCH_SUPERVISOR';
  const [requests, setRequests] = React.useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = React.useState(false);
  const [cancelling, setCancelling] = React.useState(false);
  const [showDetailsModal, setShowDetailsModal] = React.useState(false);

  // Fetch current scholar supervision request details
  useEffect(() => {
    if (currentUser?.role === 'RESEARCH_SCHOLAR') {
      const fetchRequest = async () => {
        setLoadingRequests(true);
        try {
          const { apiFetch } = await import('@/lib/api-client');
          const res = await apiFetch('/api/supervisor-requests');
          if (res.ok) {
            const data = await res.json();
            setRequests(data);
          }
        } catch (e) {
          console.error(e);
        } finally {
          setLoadingRequests(false);
        }
      };
      fetchRequest();
    }
  }, [currentUser]);

  const latestRequest = requests[0];
  const isRejected = currentUser?.status === 'REJECTED';

  const handleCancelRequest = async () => {
    if (!latestRequest?.id) return;
    setCancelling(true);
    try {
      const { apiFetch } = await import('@/lib/api-client');
      const res = await apiFetch(`/api/supervisor-requests/${latestRequest.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await syncUserSession({ force: true });
        router.replace('/onboarding');
      }
    } catch (e) {
      console.error('Failed to cancel request:', e);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen flex items-center justify-center p-6 relative overflow-hidden font-sans w-full">
      {/* Decorative background grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />

      {/* Floating Sign Out Trigger */}
      <button 
        onClick={() => { logout(); router.push('/sign-in'); }}
        className="absolute top-6 right-6 flex items-center space-x-1.5 px-3 py-1.5 border border-borderStroke rounded-lg text-xs font-bold text-textSecondary hover:text-primary hover:bg-slate-50 transition-all cursor-pointer z-20"
      >
        <LogOut className="w-3.5 h-3.5" />
        <span>Sign Out</span>
      </button>

      {/* Centered Glass Container Card */}
      <main className="w-full max-w-lg relative z-10">
        <div className="bg-white border border-borderStroke rounded-xl p-8 shadow-xl flex flex-col items-center text-center space-y-6">
          
          {/* Logo container box */}
          <div className="w-16 h-16 rounded-xl overflow-hidden border border-borderStroke shadow-sm bg-slate-50 flex items-center justify-center">
            <Logo showText={false} size={42} />
          </div>

          <div className="flex flex-col items-center w-full space-y-6">
            
            {/* Status Indicator */}
            <div className="relative w-14 h-14 flex items-center justify-center">
              <span className={`absolute inset-0 rounded-full border-4 ${isRejected ? 'border-red-500/20' : 'border-amber-500/20'} pulse-ring`} />
              <div className={`w-10 h-10 ${isRejected ? 'bg-red-50 border-red-500/30' : 'bg-amber-50 border-amber-500/30'} rounded-full flex items-center justify-center z-10 border`}>
                {isRejected ? (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                ) : (
                  <Hourglass className="w-4.5 h-4.5 text-amber-600 animate-spin-slow" />
                )}
              </div>
            </div>

            {/* Typography & Content */}
            <div className="space-y-2">
              <h1 className="font-display font-extrabold text-2xl text-black tracking-tight leading-tight">
                {isRejected 
                  ? 'Request Not Approved' 
                  : isSupervisorPending 
                  ? 'Awaiting Administrator Review' 
                  : 'Waiting for Supervisor Approval'}
              </h1>
              
              {/* Status Badge */}
              <div className={`inline-flex items-center gap-1.5 ${isRejected ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200/50'} px-3 py-1 rounded-full border`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isRejected ? 'bg-red-500' : 'bg-amber-500 animate-pulse'}`} />
                <span className={`text-[10px] font-bold ${isRejected ? 'text-red-700' : 'text-amber-700'} uppercase tracking-wider`}>
                  {isRejected ? '● Rejected' : (isSupervisorPending ? '● Awaiting Admin Approval' : '● Pending Approval')}
                </span>
              </div>
            </div>

            <p className="text-xs text-textSecondary leading-relaxed font-semibold max-w-sm">
              {isRejected 
                ? 'Your supervision request was not approved by the selected supervisor. You may choose another Research Supervisor to proceed.'
                : (isSupervisorPending 
                    ? 'Your request to join as a Research Supervisor is being reviewed by the Institutional Administrator. This page will refresh automatically once approved.'
                    : 'Your request has been submitted to your Research Supervisor. You will receive full research portal access as soon as your supervisor approves your request.'
                  )
              }
            </p>

            {/* Supervisor Request Details Card */}
            {!isSupervisorPending && latestRequest?.supervisor && (
              <div className="p-4 rounded-xl bg-slate-50 border border-borderStroke text-left w-full space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-textSecondary">Target Supervisor</span>
                  <span className="text-[10px] font-bold text-textSecondary">
                    Submitted: {new Date(latestRequest.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-[#0b4ea2]/10 text-[#0b4ea2] flex items-center justify-center font-bold text-sm shrink-0 border border-[#0b4ea2]/25">
                    {latestRequest.supervisor.name?.charAt(0).toUpperCase() || 'S'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-black truncate leading-tight">{latestRequest.supervisor.name}</p>
                    <p className="text-[10px] text-textSecondary truncate mt-0.5">{latestRequest.supervisor.department || 'Department Guide'}</p>
                    <p className="text-[10px] text-[#0b4ea2] font-semibold truncate">{latestRequest.supervisor.email}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-end gap-2">
                  <button
                    onClick={() => setShowDetailsModal(true)}
                    className="px-3 py-1.5 bg-white border border-borderStroke rounded-lg text-xs font-bold text-black hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    View Request
                  </button>
                  {!isRejected && (
                    <button
                      onClick={handleCancelRequest}
                      disabled={cancelling}
                      className="px-3 py-1.5 bg-white border border-rose-200 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {cancelling ? 'Cancelling...' : 'Cancel Request'}
                    </button>
                  )}
                </div>
              </div>
            )}

            {isRejected && (
              <button
                onClick={() => router.push('/onboarding')}
                className="w-full py-3 bg-[#0b4ea2] text-white rounded-xl font-bold text-xs hover:bg-[#001e4c] transition-all cursor-pointer shadow-md"
              >
                Choose Another Supervisor →
              </button>
            )}

            {/* Progress Loading bar */}
            {!isRejected && (
              <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 w-1/3 rounded-full animate-indeterminate" />
              </div>
            )}
          </div>

        </div>
      </main>

      {/* Details Modal */}
      {showDetailsModal && latestRequest && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-borderStroke shadow-2xl max-w-md w-full p-6 space-y-4 text-left font-sans">
            <h3 className="font-display font-extrabold text-lg text-black">Supervision Request Summary</h3>
            <div className="space-y-2 text-xs text-textSecondary">
              <p><strong>Supervisor:</strong> {latestRequest.supervisor?.name} ({latestRequest.supervisor?.email})</p>
              <p><strong>Department:</strong> {latestRequest.supervisor?.department || 'N/A'}</p>
              <p><strong>Request Status:</strong> {latestRequest.status}</p>
              <p><strong>Submitted Date:</strong> {new Date(latestRequest.createdAt).toLocaleString()}</p>
            </div>
            <div className="pt-4 flex justify-end">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 bg-[#0b4ea2] text-white rounded-lg font-bold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
