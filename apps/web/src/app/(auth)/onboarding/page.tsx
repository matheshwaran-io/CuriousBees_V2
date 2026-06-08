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
  UserCheck,
  Building,
  Hash,
  Award,
  BookOpen
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

  const [role, setRole] = useState<'SCHOLAR' | 'SUPERVISOR' | null>(null);
  
  // Academic selections
  const [faculties, setFaculties] = useState<any[]>([]);
  const [selectedFacultyId, setSelectedFacultyId] = useState('');
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('');
  
  // Role-specific fields
  // Supervisor
  const [designation, setDesignation] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [maxScholars, setMaxScholars] = useState(5);
  
  // Scholar
  const [researchArea, setResearchArea] = useState('');
  const [supervisors, setSupervisors] = useState<any[]>([]);
  const [selectedSupervisorId, setSelectedSupervisorId] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loadingFaculties, setLoadingFaculties] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingSupervisors, setLoadingSupervisors] = useState(false);

  // Check if they are already onboarded
  useEffect(() => {
    if (currentUser && currentUser.onboardingCompleted) {
      const route = 
        currentUser.status === 'ACTIVE' 
          ? (currentUser.role === 'INSTITUTE_ADMIN' ? '/admin/dashboard' : '/dashboard')
          : '/verification-pending';
      router.replace(route);
    }
  }, [currentUser, router]);

  // Fetch faculties on mount
  useEffect(() => {
    const fetchFaculties = async () => {
      setLoadingFaculties(true);
      try {
        const { apiFetch } = await import('@/lib/api-client');
        const res = await apiFetch('/api/faculties');
        if (res.ok) {
          const data = await res.json();
          setFaculties(data);
        }
      } catch (e) {
        console.error('Failed to load faculties:', e);
      } finally {
        setLoadingFaculties(false);
      }
    };
    fetchFaculties();
  }, []);

  // Fetch departments when faculty changes
  useEffect(() => {
    if (!selectedFacultyId) {
      setDepartments([]);
      setSelectedDepartmentId('');
      return;
    }
    const fetchDepartments = async () => {
      setLoadingDepartments(true);
      try {
        const { apiFetch } = await import('@/lib/api-client');
        const res = await apiFetch(`/api/departments?facultyId=${selectedFacultyId}`);
        if (res.ok) {
          const data = await res.json();
          setDepartments(data);
        }
      } catch (e) {
        console.error('Failed to load departments:', e);
      } finally {
        setLoadingDepartments(false);
      }
    };
    fetchDepartments();
  }, [selectedFacultyId]);

  // Fetch supervisors when department/faculty is selected (for scholars)
  useEffect(() => {
    if (role !== 'SCHOLAR' || !selectedFacultyId || !selectedDepartmentId) {
      setSupervisors([]);
      setSelectedSupervisorId('');
      return;
    }
    const fetchSupervisors = async () => {
      setLoadingSupervisors(true);
      try {
        const { apiFetch } = await import('@/lib/api-client');
        const res = await apiFetch(`/api/supervisors?facultyId=${selectedFacultyId}&departmentId=${selectedDepartmentId}`);
        if (res.ok) {
          const data = await res.json();
          setSupervisors(data);
        }
      } catch (e) {
        console.error('Failed to load supervisors:', e);
      } finally {
        setLoadingSupervisors(false);
      }
    };
    fetchSupervisors();
  }, [role, selectedFacultyId, selectedDepartmentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) {
      setErrorMsg('Please select a role.');
      return;
    }
    if (!selectedFacultyId || !selectedDepartmentId) {
      setErrorMsg('Please select your Faculty and Department.');
      return;
    }

    if (role === 'SUPERVISOR') {
      if (!designation || !employeeId) {
        setErrorMsg('Please provide your Designation and Employee ID.');
        return;
      }
    } else {
      if (!researchArea || !selectedSupervisorId) {
        setErrorMsg('Please provide your Research Area and select a supervisor.');
        return;
      }
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const { apiFetch } = await import('@/lib/api-client');
      const endpoint = role === 'SUPERVISOR' 
        ? '/api/users/onboarding/supervisor' 
        : '/api/users/onboarding/scholar';

      const body = role === 'SUPERVISOR' 
        ? {
            facultyId: selectedFacultyId,
            departmentId: selectedDepartmentId,
            designation,
            employeeId,
            maxScholars: Number(maxScholars),
          }
        : {
            facultyId: selectedFacultyId,
            departmentId: selectedDepartmentId,
            researchArea,
            supervisorId: selectedSupervisorId,
          };

      const res = await apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(body),
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
      <main className="w-full max-w-lg relative z-10 my-8">
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
              Setup your institutional profile to start collaborating.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="w-full space-y-6 text-left">
            {/* Step 1: Role Selection */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-textSecondary uppercase tracking-wider">
                Select Your Role
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => { setRole('SCHOLAR'); setErrorMsg(''); }}
                  className={cn(
                    "p-4 rounded-xl border flex flex-col items-center text-center gap-3 transition-all",
                    role === 'SCHOLAR' 
                      ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/50" 
                      : "border-borderStroke hover:border-primary/50 hover:bg-slate-50 bg-white"
                  )}
                >
                  <div className={cn("p-2 rounded-full", role === 'SCHOLAR' ? "bg-primary text-white" : "bg-slate-100 text-textSecondary")}>
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className={cn("text-xs font-bold", role === 'SCHOLAR' ? "text-primary" : "text-black")}>Research Scholar</h3>
                    <p className="text-[9px] text-textSecondary mt-0.5 leading-tight">I am pursuing my PhD</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => { setRole('SUPERVISOR'); setErrorMsg(''); }}
                  className={cn(
                    "p-4 rounded-xl border flex flex-col items-center text-center gap-3 transition-all",
                    role === 'SUPERVISOR' 
                      ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/50" 
                      : "border-borderStroke hover:border-primary/50 hover:bg-slate-50 bg-white"
                  )}
                >
                  <div className={cn("p-2 rounded-full", role === 'SUPERVISOR' ? "bg-primary text-white" : "bg-slate-100 text-textSecondary")}>
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className={cn("text-xs font-bold", role === 'SUPERVISOR' ? "text-primary" : "text-black")}>Faculty Guide</h3>
                    <p className="text-[9px] text-textSecondary mt-0.5 leading-tight">I supervise scholars</p>
                  </div>
                </button>
              </div>
            </div>

            {role && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                {/* Step 2: Academic Registry */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-textSecondary uppercase tracking-wider" htmlFor="faculty-select">
                      Faculty
                    </label>
                    <div className="relative">
                      <select
                        id="faculty-select"
                        value={selectedFacultyId}
                        onChange={(e) => setSelectedFacultyId(e.target.value)}
                        className="w-full cb-input py-2 pl-3 pr-8 text-xs border border-borderStroke rounded-lg bg-white font-semibold focus:ring-2 focus:ring-primary/20 appearance-none"
                      >
                        <option value="">Select Faculty...</option>
                        {faculties.map((f) => (
                          <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                      </select>
                      {loadingFaculties && (
                        <span className="absolute right-2.5 top-2.5">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-textSecondary uppercase tracking-wider" htmlFor="department-select">
                      Department
                    </label>
                    <div className="relative">
                      <select
                        id="department-select"
                        value={selectedDepartmentId}
                        onChange={(e) => setSelectedDepartmentId(e.target.value)}
                        disabled={!selectedFacultyId}
                        className="w-full cb-input py-2 pl-3 pr-8 text-xs border border-borderStroke rounded-lg bg-white font-semibold focus:ring-2 focus:ring-primary/20 appearance-none disabled:bg-slate-50 disabled:text-slate-400"
                      >
                        <option value="">Select Department...</option>
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                      {loadingDepartments && (
                        <span className="absolute right-2.5 top-2.5">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Step 3: Supervisor Details */}
                {role === 'SUPERVISOR' && (
                  <div className="space-y-4 border-t border-slate-100 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-textSecondary uppercase tracking-wider" htmlFor="designation">
                          Designation
                        </label>
                        <input
                          id="designation"
                          type="text"
                          placeholder="e.g. Professor"
                          value={designation}
                          onChange={(e) => setDesignation(e.target.value)}
                          className="w-full cb-input py-2 px-3 text-xs border border-borderStroke rounded-lg focus:ring-2 focus:ring-primary/20"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-textSecondary uppercase tracking-wider" htmlFor="employee-id">
                          Employee ID / Code
                        </label>
                        <input
                          id="employee-id"
                          type="text"
                          placeholder="e.g. EMP12345"
                          value={employeeId}
                          onChange={(e) => setEmployeeId(e.target.value)}
                          className="w-full cb-input py-2 px-3 text-xs border border-borderStroke rounded-lg focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-bold text-textSecondary uppercase tracking-wider" htmlFor="max-scholars">
                        Max Scholars Capacity
                      </label>
                      <input
                        id="max-scholars"
                        type="number"
                        min="1"
                        max="20"
                        value={maxScholars}
                        onChange={(e) => setMaxScholars(Number(e.target.value))}
                        className="w-40 cb-input py-2 px-3 text-xs border border-borderStroke rounded-lg focus:ring-2 focus:ring-primary/20"
                      />
                      <p className="text-[10px] text-textSecondary font-semibold">Maximum scholars you can guide at full capacity.</p>
                    </div>
                  </div>
                )}

                {/* Step 3: Scholar Details */}
                {role === 'SCHOLAR' && (
                  <div className="space-y-4 border-t border-slate-100 pt-4">
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-bold text-textSecondary uppercase tracking-wider" htmlFor="research-area">
                        Research Area / Domain
                      </label>
                      <input
                        id="research-area"
                        type="text"
                        placeholder="e.g. Deep Learning in Bio-informatics"
                        value={researchArea}
                        onChange={(e) => setResearchArea(e.target.value)}
                        className="w-full cb-input py-2 px-3 text-xs border border-borderStroke rounded-lg focus:ring-2 focus:ring-primary/20"
                      />
                    </div>

                    {selectedFacultyId && selectedDepartmentId && (
                      <div className="space-y-2">
                        <label className="block text-[11px] font-bold text-textSecondary uppercase tracking-wider">
                          Select Academic Supervisor
                        </label>
                        <div className="border border-borderStroke rounded-lg max-h-[160px] overflow-y-auto bg-white p-1 divide-y divide-slate-100 shadow-inner">
                          {supervisors.length > 0 ? (
                            supervisors.map((sup) => {
                              const atCapacity = sup.currentScholars >= sup.maxScholars;
                              return (
                                <div
                                  key={sup.id}
                                  onClick={() => !atCapacity && setSelectedSupervisorId(sup.id)}
                                  className={cn(
                                    "flex items-center justify-between p-2.5 rounded-md transition-colors text-xs font-semibold",
                                    atCapacity 
                                      ? "opacity-50 cursor-not-allowed bg-slate-50 text-slate-400"
                                      : selectedSupervisorId === sup.id 
                                        ? 'bg-primary text-white' 
                                        : 'hover:bg-slate-50 text-black cursor-pointer'
                                  )}
                                >
                                  <div className="min-w-0">
                                    <h4 className="font-bold flex items-center gap-1.5">
                                      <span>{sup.name}</span>
                                      <span className={cn(
                                        "text-[9px] px-1.5 py-0.5 rounded-full font-extrabold uppercase border tracking-wider",
                                        selectedSupervisorId === sup.id 
                                          ? "bg-white/20 text-white border-transparent"
                                          : atCapacity 
                                            ? "bg-red-50 text-red-600 border-red-200" 
                                            : "bg-slate-100 text-slate-600 border-slate-200"
                                      )}>
                                        {sup.designation}
                                      </span>
                                    </h4>
                                    <span className={cn(
                                      "text-[9px] block mt-1",
                                      selectedSupervisorId === sup.id ? 'text-primary-foreground/80' : 'text-textSecondary'
                                    )}>
                                      Capacity: {sup.currentScholars} / {sup.maxScholars} scholars mapped
                                    </span>
                                  </div>
                                  <div className="shrink-0 flex items-center">
                                    {selectedSupervisorId === sup.id && (
                                      <UserCheck className="w-4.5 h-4.5 text-white ml-2" />
                                    )}
                                    {atCapacity && (
                                      <span className="text-[8px] bg-red-100 text-red-700 font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full">
                                        Full Capacity
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="text-center py-8 text-xs text-textSecondary/40 flex flex-col items-center justify-center space-y-2">
                              {loadingSupervisors ? (
                                <Loader2 className="w-4 h-4 animate-spin opacity-45" />
                              ) : (
                                <>
                                  <Users className="w-5 h-5 opacity-45" />
                                  <span>No supervisors registered in this department.</span>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
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
              disabled={
                isSubmitting || 
                !role || 
                !selectedFacultyId || 
                !selectedDepartmentId || 
                (role === 'SUPERVISOR' && (!designation || !employeeId)) ||
                (role === 'SCHOLAR' && (!researchArea || !selectedSupervisorId))
              }
              className="w-full py-3 flex items-center justify-center bg-primary hover:bg-[#004495]/95 text-white font-bold text-xs rounded-lg transition disabled:opacity-40 cursor-pointer border border-primary active:scale-[0.99] shadow"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4.5 h-4.5 animate-spin mr-2" />
                  <span>Registering Profile...</span>
                </>
              ) : (
                <span>Complete Onboarding Registration</span>
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
