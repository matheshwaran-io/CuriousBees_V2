'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { 
  Search, 
  Users, 
  UserCheck, 
  LogOut, 
  Hourglass,
  ShieldAlert,
  Loader2,
  Shield,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Logo from '@/components/Logo';

export default function VerificationPendingPage() {
  const router = useRouter();
  const { 
    currentUser, 
    syncUserSession, 
    requestSupervisor, 
    logout 
  } = useStore();

  const [supervisors, setSupervisors] = useState<any[]>([]);
  const [selectedSupervisor, setSelectedSupervisor] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loadingSupervisors, setLoadingSupervisors] = useState(true);

  // 1. Sync session on mount and poll periodically for approval status changes
  useEffect(() => {
    const checkStatus = async () => {
      const user = await syncUserSession();
      if (user && (user.approved || user.role === 'RESEARCH_SUPERVISOR' || user.role === 'INSTITUTION_ADMIN')) {
        const route = user.role === 'RESEARCH_SUPERVISOR' ? '/dashboard/supervisor'
          : user.role === 'INSTITUTION_ADMIN' ? '/admin'
          : '/dashboard/researcher';
        router.replace(route);
      }
    };
    
    checkStatus();
    const interval = setInterval(checkStatus, 6000); // Check every 6s for approval
    return () => clearInterval(interval);
  }, [syncUserSession, router]);

  // 2. Fetch supervisor directory from the dedicated /api/supervisors endpoint
  useEffect(() => {
    const fetchSupervisors = async () => {
      setLoadingSupervisors(true);
      try {
        const { apiFetch } = await import('@/lib/api-client');
        const query = searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : '';
        const res = await apiFetch(`/api/supervisors${query}`);
        if (res.ok) {
          const data = await res.json();
          console.info('[AUTH] Supervisor Count:', data.length);
          setSupervisors(data);
        } else {
          console.error('[AUTH] Failed to fetch supervisors:', res.status);
          setSupervisors([]);
        }
      } catch (e) {
        console.error('[AUTH] Supervisor fetch error:', e);
        setSupervisors([]);
      } finally {
        setLoadingSupervisors(false);
      }
    };
    fetchSupervisors();
  }, [searchTerm]);

  // 3. Handle mapping form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupervisor) {
      setErrorMsg('Please select a faculty supervisor.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await requestSupervisor(selectedSupervisor);
      await syncUserSession();
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to submit request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter supervisors based on search term (client-side secondary filter)
  const facultySupervisors = supervisors.filter(
    (s) =>
      s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingSupervisor = supervisors.find(s => s.id === currentUser?.supervisorId);

  return (
    <div className="bg-slate-50 min-h-screen flex items-center justify-center p-6 relative overflow-hidden font-sans w-full">
      {/* Decorative background grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />

      {/* Floating Sign Out Trigger */}
      <button 
        onClick={() => { logout(); router.push('/login'); }}
        className="absolute top-6 right-6 flex items-center space-x-1.5 px-3 py-1.5 border border-borderStroke rounded-lg text-xs font-bold text-textSecondary hover:text-primary hover:bg-slate-50 transition-all cursor-pointer z-20"
      >
        <LogOut className="w-3.5 h-3.5" />
        <span>Sign Out</span>
      </button>

      {/* Centered Glass Container Card */}
      <main className="w-full max-w-md relative z-10">
        <div className="bg-white border border-borderStroke rounded-xl p-8 shadow-xl flex flex-col items-center text-center space-y-6">
          
          {/* Logo container box */}
          <div className="w-16 h-16 rounded-xl overflow-hidden border border-borderStroke shadow-sm bg-slate-50 flex items-center justify-center">
            <Logo showText={false} size={42} />
          </div>

          {/* Dynamic State Rendering */}
          {currentUser?.supervisorId ? (
            /* STATE A: VERIFICATION IN PROGRESS */
            <div className="flex flex-col items-center w-full space-y-6">
              
              {/* Status Indicator */}
              <div className="relative w-14 h-14 flex items-center justify-center">
                <span className="absolute inset-0 rounded-full border-4 border-amber-500/20 pulse-ring" />
                <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center z-10 border border-amber-500/30">
                  <Hourglass className="w-4.5 h-4.5 text-amber-600 animate-spin-slow" />
                </div>
              </div>

              {/* Typography & Content */}
              <div className="space-y-2">
                <h1 className="font-display font-extrabold text-2xl text-black tracking-tight leading-tight">
                  Verification Pending
                </h1>
                
                {/* Status Badge */}
                <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200/50 px-3 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                    Awaiting Guide Approval
                  </span>
                </div>
              </div>

              <p className="text-xs text-textSecondary leading-relaxed font-semibold max-w-sm">
                Your profile was submitted to your Faculty Supervisor. Once they approve your request, this page will automatically refresh to load your scholar portal.
              </p>

              {pendingSupervisor && (
                <div className="p-3.5 rounded-lg bg-slate-50 border border-borderStroke/50 flex items-center space-x-3 text-left w-full">
                  {pendingSupervisor.image ? (
                    <img src={pendingSupervisor.image} alt="" className="w-9 h-9 rounded-full object-cover border border-borderStroke shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-[#0d3c61]/10 text-[#0d3c61] flex items-center justify-center font-bold text-sm shrink-0 border border-[#0d3c61]/25">
                      {pendingSupervisor.name?.charAt(0) || 'S'}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-black truncate leading-tight">{pendingSupervisor.name}</p>
                    <p className="text-[10px] text-textSecondary truncate mt-1">🏫 {pendingSupervisor.department}</p>
                  </div>
                </div>
              )}

              {/* Progress Loading bar */}
              <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 w-1/3 rounded-full animate-indeterminate" />
              </div>
            </div>
          ) : (
            /* STATE B: SUPERVISOR NOT LINKED FALLBACK */
            <div className="flex flex-col items-center w-full space-y-6">
              
              {/* Status Indicator */}
              <div className="relative w-14 h-14 flex items-center justify-center">
                <span className="absolute inset-0 rounded-full border-4 border-rose-500/25 animate-pulse" />
                <div className="w-10 h-10 bg-rose-50 rounded-full flex items-center justify-center z-10 border border-rose-500/30">
                  <AlertCircle className="w-5 h-5 text-rose-600" />
                </div>
              </div>

              <div className="space-y-2">
                <h1 className="font-display font-extrabold text-2xl text-black tracking-tight leading-tight">
                  Link Supervisor
                </h1>
                <p className="text-xs text-textSecondary font-semibold max-w-sm">
                  You must link your guide to verify your PhD enrollment before using CuriousBees tools.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="w-full space-y-4 text-left">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-textSecondary uppercase tracking-wider" htmlFor="supervisor-search">
                    Search Faculty Guides
                  </label>
                  
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-textSecondary/50 pointer-events-none">
                      <Search className="w-4 h-4" />
                    </span>
                    <input
                      id="supervisor-search"
                      type="text"
                      placeholder="Search by name or department..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-4 cb-input"
                    />
                  </div>

                  <div className="border border-borderStroke rounded-lg max-h-[140px] overflow-y-auto bg-white p-1 divide-y divide-slate-100 shadow-inner">
                    {facultySupervisors.length > 0 ? (
                      facultySupervisors.map((faculty) => (
                        <div
                          key={faculty.id}
                          onClick={() => setSelectedSupervisor(faculty.id)}
                          className={cn(
                            "flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors text-xs font-semibold",
                            selectedSupervisor === faculty.id 
                              ? 'bg-primary text-white' 
                              : 'hover:bg-slate-50 text-black'
                          )}
                        >
                          <div className="min-w-0">
                            <h4 className="truncate">{faculty.name}</h4>
                            <span className={cn(
                              "text-[9px] truncate block mt-0.5",
                              selectedSupervisor === faculty.id ? 'text-primary-foreground/80' : 'text-textSecondary'
                            )}>
                              🏫 {faculty.department}
                            </span>
                          </div>
                          {selectedSupervisor === faculty.id && (
                            <UserCheck className="w-4 h-4 text-white shrink-0 ml-2" />
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-xs text-textSecondary/40 flex flex-col items-center justify-center space-y-1.5">
                        <Users className="w-5 h-5 opacity-40" />
                        <span>No supervisor found.</span>
                      </div>
                    )}
                  </div>
                </div>

                {errorMsg && (
                  <div className="p-3 border border-rose-200 bg-rose-50 text-rose-700 text-xs font-semibold rounded-lg flex items-center space-x-2">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || !selectedSupervisor}
                  className="w-full py-3 flex items-center justify-center bg-primary hover:bg-[#004495]/95 text-white font-bold text-xs rounded-lg transition disabled:opacity-40 cursor-pointer border border-primary active:scale-[0.99] shadow"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      <span>Submitting Request...</span>
                    </>
                  ) : (
                    <span>Submit Supervisor Request</span>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Intranet notice */}
          <div className="pt-6 border-t border-borderStroke flex items-center justify-center gap-1.5 text-textSecondary/40 select-none">
            <Shield className="w-3.5 h-3.5 shrink-0" />
            <p className="text-[10px] font-bold uppercase tracking-wider">
              SRMIST Institutional Security Standard
            </p>
          </div>

        </div>
      </main>
    </div>
  );
}
