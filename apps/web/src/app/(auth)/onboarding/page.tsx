'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { 
  LogOut, 
  ShieldAlert,
  Loader2,
  Shield,
  GraduationCap,
  Briefcase,
  Search,
  Users,
  UserCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Logo from '@/components/Logo';

export default function OnboardingPage() {
  const router = useRouter();
  const { 
    currentUser, 
    syncUserSession, 
    logout 
  } = useStore();

  const [role, setRole] = useState<'RESEARCH_SCHOLAR' | 'RESEARCH_SUPERVISOR' | null>(null);
  const [supervisors, setSupervisors] = useState<any[]>([]);
  const [selectedSupervisor, setSelectedSupervisor] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loadingSupervisors, setLoadingSupervisors] = useState(false);

  // Check if they are already onboarded
  useEffect(() => {
    if (currentUser && currentUser.status !== 'ONBOARDING') {
      const route = 
        currentUser.status === 'APPROVED' 
          ? (currentUser.role === 'INSTITUTION_ADMIN' ? '/admin/dashboard' : '/dashboard')
          : '/verification-pending';
      router.replace(route);
    }
  }, [currentUser, router]);

  // Fetch supervisors when role is set to Scholar
  useEffect(() => {
    if (role === 'RESEARCH_SCHOLAR') {
      const fetchSupervisors = async () => {
        setLoadingSupervisors(true);
        try {
          const { apiFetch } = await import('@/lib/api-client');
          const query = searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : '';
          const res = await apiFetch(`/api/supervisors${query}`);
          if (res.ok) {
            const data = await res.json();
            setSupervisors(data);
          } else {
            setSupervisors([]);
          }
        } catch (e) {
          setSupervisors([]);
        } finally {
          setLoadingSupervisors(false);
        }
      };
      fetchSupervisors();
    }
  }, [role, searchTerm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) {
      setErrorMsg('Please select a role.');
      return;
    }
    if (role === 'RESEARCH_SCHOLAR' && !selectedSupervisor) {
      setErrorMsg('Please select a faculty supervisor.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const { apiFetch } = await import('@/lib/api-client');
      const res = await apiFetch('/api/users/onboard', {
        method: 'PUT',
        body: JSON.stringify({
          role,
          supervisorId: role === 'RESEARCH_SCHOLAR' ? selectedSupervisor : undefined,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to complete onboarding');
      }

      await syncUserSession({ force: true });
      router.replace('/verification-pending');
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to submit onboarding details.');
      setIsSubmitting(false);
    }
  };

  const facultySupervisors = supervisors.filter(
    (s) =>
      s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

          <div className="space-y-2">
            <h1 className="font-display font-extrabold text-2xl text-black tracking-tight leading-tight">
              Complete Your Profile
            </h1>
            <p className="text-xs text-textSecondary font-semibold max-w-sm">
              Please select your role within the institution to proceed.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="w-full space-y-6 text-left">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('RESEARCH_SCHOLAR')}
                className={cn(
                  "p-4 rounded-xl border flex flex-col items-center text-center gap-3 transition-all",
                  role === 'RESEARCH_SCHOLAR' 
                    ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/50" 
                    : "border-borderStroke hover:border-primary/50 hover:bg-slate-50 bg-white"
                )}
              >
                <div className={cn("p-2 rounded-full", role === 'RESEARCH_SCHOLAR' ? "bg-primary text-white" : "bg-slate-100 text-textSecondary")}>
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={cn("text-xs font-bold", role === 'RESEARCH_SCHOLAR' ? "text-primary" : "text-black")}>Research Scholar</h3>
                  <p className="text-[9px] text-textSecondary mt-0.5 leading-tight">I am pursuing my PhD</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRole('RESEARCH_SUPERVISOR')}
                className={cn(
                  "p-4 rounded-xl border flex flex-col items-center text-center gap-3 transition-all",
                  role === 'RESEARCH_SUPERVISOR' 
                    ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/50" 
                    : "border-borderStroke hover:border-primary/50 hover:bg-slate-50 bg-white"
                )}
              >
                <div className={cn("p-2 rounded-full", role === 'RESEARCH_SUPERVISOR' ? "bg-primary text-white" : "bg-slate-100 text-textSecondary")}>
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={cn("text-xs font-bold", role === 'RESEARCH_SUPERVISOR' ? "text-primary" : "text-black")}>Faculty Guide</h3>
                  <p className="text-[9px] text-textSecondary mt-0.5 leading-tight">I supervise scholars</p>
                </div>
              </button>
            </div>

            {role === 'RESEARCH_SCHOLAR' && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="block text-[11px] font-bold text-textSecondary uppercase tracking-wider" htmlFor="supervisor-search">
                  Select Faculty Supervisor
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
                    className="w-full pl-9 pr-4 cb-input py-2 text-sm border-borderStroke rounded-lg focus:ring-2 focus:ring-primary/20"
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
                      {loadingSupervisors ? (
                        <Loader2 className="w-4 h-4 animate-spin opacity-40" />
                      ) : (
                        <>
                          <Users className="w-5 h-5 opacity-40" />
                          <span>No supervisor found.</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 border border-rose-200 bg-rose-50 text-rose-700 text-xs font-semibold rounded-lg flex items-center space-x-2 animate-in fade-in">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !role || (role === 'RESEARCH_SCHOLAR' && !selectedSupervisor)}
              className="w-full py-3 flex items-center justify-center bg-primary hover:bg-[#004495]/95 text-white font-bold text-xs rounded-lg transition disabled:opacity-40 cursor-pointer border border-primary active:scale-[0.99] shadow"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  <span>Saving Profile...</span>
                </>
              ) : (
                <span>Complete Registration</span>
              )}
            </button>
          </form>

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
