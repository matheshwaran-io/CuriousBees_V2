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
  ShieldAlert
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Logo from '@/components/Logo';

export default function VerificationPendingPage() {
  const router = useRouter();
  const { 
    currentUser, 
    syncUserSession, 
    collaborators, 
    fetchCollaborators, 
    requestSupervisor, 
    logout 
  } = useStore();

  const [selectedSupervisor, setSelectedSupervisor] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Sync session on mount and poll periodically for approval status changes
  useEffect(() => {
    const checkStatus = async () => {
      const user = await syncUserSession();
      if (user && (user.isApproved || user.role === 'FACULTY' || user.role === 'ADMIN')) {
        router.replace('/dashboard');
      }
    };
    
    checkStatus();
    const interval = setInterval(checkStatus, 6000); // Check every 6s
    return () => clearInterval(interval);
  }, [syncUserSession, router]);

  // 2. Fetch faculty list in background for potential supervisor mapping
  useEffect(() => {
    fetchCollaborators('', 'FACULTY');
  }, [fetchCollaborators]);

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

  // Filter supervisors based on search term
  const facultySupervisors = collaborators.filter(
    (c) =>
      c.role === 'FACULTY' &&
      (c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.department?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const pendingSupervisor = collaborators.find(c => c.id === currentUser?.supervisorId);

  // SVG Hexagon background inline style matching Stitch specs
  const hexagonBgStyle = {
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='103.9' viewBox='0 0 60 103.9' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l30 17.3v34.6L30 69.3 0 52V17.3z' fill='%23004495' fill-opacity='0.03' fill-rule='evenodd'/%3E%3C/svg%3E")`,
    backgroundSize: '60px 103.9px'
  };

  return (
    <div 
      className="bg-background min-h-screen flex items-center justify-center p-margin-mobile md:p-margin-desktop relative overflow-hidden select-none w-full"
      style={hexagonBgStyle}
    >
      {/* Glow Blur Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-secondary-container/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Floating Sign Out Trigger */}
      <button 
        onClick={() => { logout(); router.push('/login'); }}
        className="absolute top-8 right-8 flex items-center space-x-1.5 px-3 py-1.5 border border-outline-variant/30 rounded-lg text-xs font-semibold text-on-surface-variant hover:text-primary hover:bg-surface-container transition-all cursor-pointer z-20"
      >
        <LogOut className="w-3.5 h-3.5" />
        <span>Sign Out</span>
      </button>

      {/* Centered Glass Container Card */}
      <main className="w-full max-w-lg relative z-10">
        <div className="glass-panel rounded-xl p-stack-lg flex flex-col items-center text-center">
          
          {/* Logo container box */}
          <div className="w-24 h-24 mb-stack-md rounded-lg overflow-hidden border border-outline-variant/20 shadow-sm bg-surface-container-lowest flex items-center justify-center">
            <Logo showText={false} size={64} />
          </div>

          {/* Dynamic State Rendering */}
          {currentUser?.supervisorId ? (
            /* STATE A: VERIFICATION IN PROGRESS */
            <div className="flex flex-col items-center w-full">
              {/* Status Indicator */}
              <div className="relative w-16 h-16 mb-stack-md flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-secondary-fixed pulse-ring" />
                <div className="w-12 h-12 bg-secondary-fixed rounded-full flex items-center justify-center z-10 shadow-sm">
                  <Hourglass className="w-5 h-5 text-on-secondary-fixed" />
                </div>
              </div>

              {/* Typography & Content */}
              <h1 className="font-display font-bold text-headline-xl text-on-surface mb-stack-sm tracking-tight leading-tight">
                Registration Submitted Successfully
              </h1>

              {/* Status Badge */}
              <div className="inline-flex items-center gap-2 bg-secondary-container/20 px-4 py-1.5 rounded-full mb-stack-lg border border-secondary-container/30">
                <span className="w-2 h-2 rounded-full bg-secondary-fixed-dim animate-pulse" />
                <span className="font-label-caps text-label-caps text-on-secondary-container uppercase tracking-wider">
                  Awaiting Verification
                </span>
              </div>

              <p className="font-body-md text-body-md text-on-surface-variant max-w-md mx-auto leading-relaxed mb-6">
                Your registration request has been sent to your Research Supervisor for verification. You will be granted full access to the CuriousBees dashboard once your supervisor approves your profile. This page will automatically refresh once access is granted.
              </p>

              {pendingSupervisor && (
                <div className="mb-stack-md p-4 rounded-lg bg-surface border border-outline-variant/20 flex items-center space-x-3 text-left w-full max-w-[400px]">
                  {pendingSupervisor.image ? (
                    <img src={pendingSupervisor.image} alt="" className="w-10 h-10 rounded-full object-cover border border-outline-variant/10 shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                      {pendingSupervisor.name?.charAt(0) || 'S'}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-on-surface truncate">{pendingSupervisor.name}</p>
                    <p className="text-[11px] text-on-surface-variant truncate">🏫 {pendingSupervisor.department}</p>
                  </div>
                </div>
              )}

              {/* Progress Bar */}
              <div className="w-full h-1 bg-surface-variant rounded-full mt-stack-lg overflow-hidden">
                <div className="h-full bg-secondary-fixed-dim w-1/3 rounded-full animate-[pulse_2s_ease-in-out_infinite]" />
              </div>
            </div>
          ) : (
            /* STATE B: SUPERVISOR NOT LINKED FALLBACK */
            <div className="flex flex-col items-center w-full">
              {/* Status Indicator */}
              <div className="relative w-16 h-16 mb-stack-md flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-error/20 animate-ping" />
                <div className="w-12 h-12 bg-error-container rounded-full flex items-center justify-center z-10 shadow-sm border border-error/10">
                  <ShieldAlert className="w-5 h-5 text-error" />
                </div>
              </div>

              <h1 className="font-display font-bold text-headline-xl text-on-surface mb-stack-sm tracking-tight leading-tight">
                Select Research Supervisor
              </h1>
              
              <p className="font-body-md text-body-md text-on-surface-variant max-w-md mx-auto leading-relaxed mb-6">
                Before accessing your workspace, you must specify your academic supervisor. Search for their name below to submit a verification request.
              </p>

              <form onSubmit={handleSubmit} className="w-full max-w-[400px] space-y-stack-md text-left">
                <div className="space-y-2">
                  <label className="block font-label-caps text-label-caps text-on-surface-variant font-semibold" htmlFor="supervisor-search">
                    Search Faculty Guides
                  </label>
                  
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-outline pointer-events-none">
                      <Search className="w-4 h-4" />
                    </span>
                    <input
                      id="supervisor-search"
                      type="text"
                      placeholder="Search by name or department..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full h-11 pl-9 pr-4 input-underline text-on-surface text-sm outline-none"
                    />
                  </div>

                  <div className="border border-outline-variant/30 rounded-lg max-h-[160px] overflow-y-auto bg-surface p-1 divide-y divide-outline-variant/10">
                    {facultySupervisors.length > 0 ? (
                      facultySupervisors.map((faculty) => (
                        <div
                          key={faculty.id}
                          onClick={() => setSelectedSupervisor(faculty.id)}
                          className={cn(
                            "flex items-center justify-between p-2.5 rounded-md cursor-pointer transition",
                            selectedSupervisor === faculty.id 
                              ? 'bg-primary text-on-primary font-semibold' 
                              : 'hover:bg-surface-container-high/40 text-on-surface'
                          )}
                        >
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold truncate">{faculty.name}</h4>
                            <span className={cn(
                              "text-[10px] truncate block mt-0.5",
                              selectedSupervisor === faculty.id ? 'text-primary-fixed-dim' : 'text-on-surface-variant'
                            )}>
                              🏫 {faculty.department}
                            </span>
                          </div>
                          {selectedSupervisor === faculty.id && (
                            <UserCheck className="w-4 h-4 text-on-primary shrink-0 ml-2" />
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-xs text-outline flex flex-col items-center justify-center space-y-2">
                        <Users className="w-5 h-5 text-outline" />
                        <span>No supervisor found.</span>
                      </div>
                    )}
                  </div>
                </div>

                {errorMsg && (
                  <div className="p-3 border border-error/20 bg-error-container/30 text-error text-xs font-semibold rounded-lg flex items-center space-x-2">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || !selectedSupervisor}
                  className="w-full h-11 flex items-center justify-center bg-primary hover:bg-primary-container text-on-primary font-semibold text-sm rounded-lg transition disabled:opacity-40 cursor-pointer border border-primary active:scale-[0.99]"
                >
                  {isSubmitting ? 'Submitting Request...' : 'Submit Supervisor Request'}
                </button>
              </form>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
