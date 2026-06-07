'use client';

import { useSignUp, useClerk, useAuth } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, GraduationCap, ChevronRight, ChevronLeft, ShieldCheck,
  Mail, Lock, Eye, EyeOff, User, Building2, AlertCircle, Loader2,
  BadgeCheck, BookOpen, CreditCard, KeyRound, CheckCircle2, ArrowRight
} from 'lucide-react';
import { apiFetch } from '@/lib/api-client';

type Role = 'SCHOLAR' | 'SUPERVISOR';
type Step = 'role_select' | 'details' | 'verify_email' | 'syncing' | 'done';

interface Department { id: string; name: string; code: string; }
interface Supervisor { id: string; name: string | null; email: string; department: string | null; }

const FACULTY_DEPARTMENTS: Record<string, string[]> = {
  "Faculty of Engineering & Technology": [
    "Computing Technologies (CSE / IT / Swe)",
    "Electronics & Communication Engineering (ECE)",
    "Electrical & Electronics Engineering (EEE)",
    "Biotechnology & Bioengineering",
    "Mechanical Engineering",
    "Civil Engineering",
    "Chemical Engineering"
  ],
  "Faculty of Science & Humanities": [
    "Physics & Nanotechnology",
    "Chemistry & Materials Science",
    "Mathematics & Actuarial Science"
  ],
  "Faculty of Management": [
    "School of Management (SOM)"
  ],
  "Faculty of Law": [],
  "Faculty of Medicine & Health Sciences": [
    "Health Sciences & Research"
  ],
  "Faculty of Research Centers": []
};

export default function SignUpPage() {
  const { signUp } = useSignUp();
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authLoaded && isSignedIn) {
      router.push('/dashboard');
    }
  }, [authLoaded, isSignedIn, router]);

  const { setActive } = useClerk();

  const [step, setStep] = useState<Step>('role_select');
  const [role, setRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');

  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [faculty, setFaculty] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [supervisorId, setSupervisorId] = useState('');
  const [employeeId, setEmployeeId] = useState('');

  const [departments, setDepartments] = useState<Department[]>([]);
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);

  // Fetch departments and approved supervisors once
  useEffect(() => {
    apiFetch('/api/departments', { skipAuth: true }).then(r => { if(r.ok) r.json().then(setDepartments) }).catch(() => {});
    apiFetch('/api/users/supervisors', { skipAuth: true }).then(r => { if(r.ok) r.json().then(setSupervisors) }).catch(() => {});
  }, []);

  const [isSupervisorDropdownOpen, setIsSupervisorDropdownOpen] = useState(false);
  const [supervisorSearchQuery, setSupervisorSearchQuery] = useState('');

  // Departments shown are filtered by manually chosen faculty
  const filteredDepartments = departments.filter(d => {
    return faculty ? FACULTY_DEPARTMENTS[faculty]?.includes(d.name) : true;
  });

  // Supervisors are filtered by chosen department
  const selectedDept = departments.find(d => d.id === departmentId);
  const filteredSupervisors = supervisors.filter(s => {
    return selectedDept && s.department && s.department.toLowerCase() === selectedDept.name.toLowerCase();
  });

  const selectedSupervisorObj = supervisors.find(s => s.id === supervisorId);
  const selectedSupervisorName = selectedSupervisorObj ? (selectedSupervisorObj.name || selectedSupervisorObj.email) : '';

  const searchedSupervisors = filteredSupervisors.filter(s =>
    (s.name || s.email || '').toLowerCase().includes(supervisorSearchQuery.toLowerCase())
  );

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const container = document.getElementById('supervisor-dropdown-container');
      if (container && !container.contains(e.target as Node)) {
        setIsSupervisorDropdownOpen(false);
      }
    };
    if (isSupervisorDropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isSupervisorDropdownOpen]);

  const validateSrmEmail = (e: string) => {
    if (e === 'mr9820' || e === 'mr9820@srmist.edu.in') return '';
    if (e && !e.toLowerCase().endsWith('@srmist.edu.in')) {
      return 'Only SRM Institute email addresses are allowed (@srmist.edu.in).';
    }
    return '';
  };

  const handleRoleSelect = (r: Role) => {
    setRole(r);
    setStep('details');
    setError('');
  };

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUp || !role) return;
    setError('');
    const domainError = validateSrmEmail(email);
    if (domainError) { setError(domainError); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (!firstName.trim()) { setError('Please enter your First Name.'); return; }
    if (!lastName.trim()) { setError('Please enter your Last Name.'); return; }
    if (!faculty) { setError('Please select your Faculty.'); return; }
    if (!departmentId) { setError('Please select your department.'); return; }

    if (role === 'SCHOLAR') {
      if (!employeeId.trim()) { setError('Please enter your Registration Number.'); return; }
      if (!supervisorId) { setError('Please select your Research Supervisor.'); return; }
    } else {
      if (!employeeId.trim()) { setError('Please enter your Employee ID.'); return; }
    }

    setIsLoading(true);
    console.log(`[FRONTEND TRACE] Attempting signUp.create for email: ${email}`);
    try {
      const result = await (signUp as any).create({
        emailAddress: email,
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      console.log("EXACT_SIGNUP_CREATE_RETURN", result);
      console.log("EXACT_WINDOW_CLERK_SIGNUP", typeof window !== 'undefined' ? (window as any).Clerk?.client?.signUp : null);
      
      console.log(`[FRONTEND TRACE] signUp.create SUCCESS`);
      const clientSignUp = (window as any).Clerk?.client?.signUp;
      if (clientSignUp && typeof clientSignUp.prepareEmailAddressVerification === 'function') {
        await clientSignUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      } else if (typeof (signUp as any).prepareEmailAddressVerification === 'function') {
        await (signUp as any).prepareEmailAddressVerification({ strategy: 'email_code' });
      } else {
        throw new Error('prepareEmailAddressVerification is not available on signUp resource');
      }
      console.log(`[FRONTEND TRACE] Email verification prepared`);
      setStep('verify_email');
    } catch (err: any) {
      console.error(`[FRONTEND TRACE] signUp.create FAILED:`, err);
      const msg = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || 'Registration failed.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUp) return;
    setError('');
    setIsLoading(true);
    try {
      let result: any = null;
      const clientSignUp = (window as any).Clerk?.client?.signUp;
      
      if (clientSignUp && typeof clientSignUp.attemptEmailAddressVerification === 'function') {
        result = await clientSignUp.attemptEmailAddressVerification({ code: verificationCode });
      } else if (typeof (signUp as any).attemptEmailAddressVerification === 'function') {
        result = await (signUp as any).attemptEmailAddressVerification({ code: verificationCode });
      } else {
        throw new Error('attemptEmailAddressVerification is not available on signUp resource');
      }
      console.log("EXACT_SIGNUP_ATTEMPT_RETURN", result);
      
      let finalStatus = result?.status;
      let finalSessionId = result?.createdSessionId;
      
      if (!finalStatus && typeof window !== 'undefined') {
         const clientSignUp = (window as any).Clerk?.client?.signUp;
         if (clientSignUp && clientSignUp.status) {
            finalStatus = clientSignUp.status;
            finalSessionId = clientSignUp.createdSessionId;
            result = clientSignUp;
         } else if ((window as any).Clerk?.session) {
            finalStatus = 'complete';
            finalSessionId = (window as any).Clerk.session.id;
         } else if ((window as any).Clerk?.client?.activeSessions?.length > 0) {
            finalStatus = 'complete';
            finalSessionId = (window as any).Clerk.client.activeSessions[0].id;
         } else if ((window as any).Clerk?.client?.sessions?.length > 0) {
            finalStatus = 'complete';
            finalSessionId = (window as any).Clerk.client.sessions[0].id;
         }
      }

      console.log(`[FRONTEND TRACE] attemptEmailAddressVerification status: ${finalStatus}`);
      console.log(`[FRONTEND TRACE] missingFields:`, result?.missingFields);
      console.log(`[FRONTEND TRACE] unverifiedFields:`, result?.unverifiedFields);

      if (finalStatus === 'complete') {
        console.log(`[FRONTEND TRACE] setting Active session: ${finalSessionId}`);
        await setActive({ session: finalSessionId });
        setStep('syncing');
        // Get Clerk token and POST to /api/users/register
        const token = await window.Clerk?.session?.getToken();
        if (!token) throw new Error('Session token not available.');
        const regRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/users/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            name: `${firstName.trim()} ${lastName.trim()}`,
            role,
            departmentId,
            supervisorId: role === 'SCHOLAR' ? supervisorId : undefined,
            employeeId: employeeId.trim(),
            faculty
          }),
        });
        if (!regRes.ok) {
          const rawText = await regRes.text();
          let data: any = {};
          try { data = JSON.parse(rawText); } catch (e) {}
          console.error(`[FRONTEND TRACE] Registration sync failed. Status: ${regRes.status} ${regRes.statusText}. Response text:`, rawText);
          throw new Error(data?.message || `Registration sync failed (${regRes.status}): ${rawText.substring(0, 100)}`);
        }
        const targetPath = role === 'SCHOLAR' ? '/awaiting-supervisor-approval' : '/approval-pending';
        console.log(`[FRONTEND TRACE] Sync successful, redirecting to ${targetPath}`);
        // We use window.location.href instead of router.push to ensure a full layout reload
        // which guarantees the layout.tsx fetch auth logic runs cleanly on the newly authenticated session.
        window.location.href = targetPath;
        setStep('done');
      } else {
        const missing = result?.missingFields?.join(', ') || 'unknown';
        const unverified = result?.unverifiedFields?.join(', ') || 'none';
        setError(`Verification incomplete. Missing fields: ${missing}. Unverified fields: ${unverified}`);
      }
    } catch (err: any) {
      const msg = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || err?.message || 'Verification failed.';
      setError(msg);
      setStep('verify_email');
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = `w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-transparent transition-all duration-200`;
  const selectClass = `${inputClass} cursor-pointer appearance-none`;

  const steps = ['role_select', 'details', 'verify_email'];
  const currentStepIdx = steps.indexOf(step);
  const progressPct = step === 'done' || step === 'syncing' ? 100 : (currentStepIdx / (steps.length - 1)) * 100;

  return (
    <div className="min-h-screen bg-[#070b14] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-blue-600/8 rounded-full blur-[100px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-lg tracking-tight">CuriousBees</span>
          </div>
          <p className="text-white/40 text-xs font-medium tracking-wider uppercase">Join the Research Portal</p>
        </motion.div>

        {/* Progress Bar (not shown on role select) */}
        {step !== 'role_select' && step !== 'syncing' && step !== 'done' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
            <div className="flex justify-between text-[10px] text-white/30 font-bold uppercase tracking-wider mb-2">
              <span>Role</span><span>Details</span><span>Verify</span>
            </div>
            <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            </div>
          </motion.div>
        )}

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-8 shadow-2xl"
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/40 to-transparent rounded-full" />

          <AnimatePresence mode="wait">

            {/* ── STEP 1: ROLE SELECTION ── */}
            {step === 'role_select' && (
              <motion.div key="role" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }}>
                <div className="mb-8">
                  <h1 className="text-xl font-bold text-white tracking-tight">Join CuriousBees</h1>
                  <p className="text-white/40 text-sm mt-1">Select your role to begin registration</p>
                </div>
                <p className="text-xs text-white/40 font-semibold uppercase tracking-wider mb-4">I am a...</p>
                <div className="space-y-3">
                  <motion.button
                    id="role-scholar-btn"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => handleRoleSelect('SCHOLAR')}
                    className="w-full p-5 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-blue-500/10 hover:border-blue-500/30 text-left flex items-center gap-4 transition-all duration-200 cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-400/20 flex items-center justify-center text-blue-400 group-hover:bg-blue-500/20 transition-colors shrink-0">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white">Research Scholar</p>
                      <p className="text-xs text-white/40 mt-0.5">PhD / Research candidate under a supervisor</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-blue-400 transition-colors shrink-0" />
                  </motion.button>

                  <motion.button
                    id="role-supervisor-btn"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => handleRoleSelect('SUPERVISOR')}
                    className="w-full p-5 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-purple-500/10 hover:border-purple-500/30 text-left flex items-center gap-4 transition-all duration-200 cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-400/20 flex items-center justify-center text-purple-400 group-hover:bg-purple-500/20 transition-colors shrink-0">
                      <Users className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white">Research Supervisor</p>
                      <p className="text-xs text-white/40 mt-0.5">Faculty member / Research guide</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-purple-400 transition-colors shrink-0" />
                  </motion.button>
                </div>

                <div className="mt-6 p-3.5 rounded-xl bg-amber-500/8 border border-amber-400/15 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-300/70">Only <strong className="text-amber-300">@srmist.edu.in</strong> email addresses are accepted.</p>
                </div>
              </motion.div>
            )}

            {/* ── STEP 2: DETAILS FORM ── */}
            {step === 'details' && role && (
              <motion.div key="details" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${role === 'SCHOLAR' ? 'bg-blue-500/15 text-blue-400' : 'bg-purple-500/15 text-purple-400'}`}>
                    {role === 'SCHOLAR' ? <GraduationCap className="w-5 h-5" /> : <Users className="w-5 h-5" />}
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-white tracking-tight">
                      {role === 'SCHOLAR' ? 'Scholar Registration' : 'Supervisor Registration'}
                    </h1>
                    <p className="text-white/40 text-sm">Fill in your details below</p>
                  </div>
                </div>

                <form id="signup-details-form" onSubmit={handleDetailsSubmit} className="space-y-4">
                  <div id="clerk-captcha"></div>
                  {role === 'SUPERVISOR' ? (
                    // Supervisor specific fields
                    <>
                      {/* Employee ID */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Employee ID</label>
                        <div className="relative">
                          <CreditCard className="absolute left-3.5 top-3.5 w-4 h-4 text-white/25 pointer-events-none" />
                          <input
                            id="signup-employee-id"
                            type="text"
                            value={employeeId}
                            onChange={e => setEmployeeId(e.target.value)}
                            placeholder="e.g. SRM20240001"
                            required
                            className={`${inputClass} pl-10`}
                          />
                        </div>
                      </div>

                      {/* First Name & Last Name (grid side-by-side) */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">First Name</label>
                          <div className="relative">
                            <User className="absolute left-3.5 top-3.5 w-4 h-4 text-white/25 pointer-events-none" />
                            <input
                              id="signup-firstname"
                              type="text"
                              value={firstName}
                              onChange={e => setFirstName(e.target.value)}
                              placeholder="First Name"
                              required
                              className={`${inputClass} pl-10`}
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Last Name</label>
                          <div className="relative">
                            <User className="absolute left-3.5 top-3.5 w-4 h-4 text-white/25 pointer-events-none" />
                            <input
                              id="signup-lastname"
                              type="text"
                              value={lastName}
                              onChange={e => setLastName(e.target.value)}
                              placeholder="Last Name"
                              required
                              className={`${inputClass} pl-10`}
                            />
                          </div>
                        </div>
                      </div>

                      {/* SRM Email */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">SRM Email</label>
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-white/25 pointer-events-none" />
                          <input
                            id="signup-email"
                            type="text"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="you@srmist.edu.in"
                            required
                            className={`${inputClass} pl-10`}
                          />
                        </div>
                      </div>

                      {/* Password */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Password</label>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-white/25 pointer-events-none" />
                          <input
                            id="signup-password"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="Min. 8 characters"
                            required
                            className={`${inputClass} pl-10 pr-10`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-3.5 text-white/30 hover:text-white/60 transition-colors"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Confirm Password */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Confirm Password</label>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-white/25 pointer-events-none" />
                          <input
                            id="signup-confirm-password"
                            type={showPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            placeholder="Repeat password"
                            required
                            className={`${inputClass} pl-10`}
                          />
                        </div>
                      </div>

                      {/* Faculty Dropdown */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Faculty</label>
                        <div className="relative">
                          <Building2 className="absolute left-3.5 top-3.5 w-4 h-4 text-white/25 pointer-events-none" />
                          <select
                            id="signup-faculty"
                            value={faculty}
                            onChange={e => { setFaculty(e.target.value); setDepartmentId(''); }}
                            required
                            className={`${selectClass} pl-10`}
                          >
                            <option value="" className="bg-[#0d1525]">Select Faculty</option>
                            {Object.keys(FACULTY_DEPARTMENTS).map(f => (
                              <option key={f} value={f} className="bg-[#0d1525]">{f}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Department Dropdown - ONLY appears if Faculty is selected */}
                      {faculty && (
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Department</label>
                          <div className="relative">
                            <Building2 className="absolute left-3.5 top-3.5 w-4 h-4 text-white/25 pointer-events-none" />
                            <select
                              id="signup-department"
                              value={departmentId}
                              onChange={e => setDepartmentId(e.target.value)}
                              required
                              className={`${selectClass} pl-10`}
                            >
                              <option value="" className="bg-[#0d1525]">Select Department</option>
                              {filteredDepartments.map(d => (
                                <option key={d.id} value={d.id} className="bg-[#0d1525]">{d.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    // Scholar specific fields (Redesigned)
                    <>
                      {/* Registration Number */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Registration Number</label>
                        <div className="relative">
                          <CreditCard className="absolute left-3.5 top-3.5 w-4 h-4 text-white/25 pointer-events-none" />
                          <input
                            id="signup-registration-number"
                            type="text"
                            value={employeeId}
                            onChange={e => setEmployeeId(e.target.value)}
                            placeholder="e.g. RA2411003010001"
                            required
                            className={`${inputClass} pl-10`}
                          />
                        </div>
                      </div>

                      {/* First Name & Last Name (grid side-by-side) */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">First Name</label>
                          <div className="relative">
                            <User className="absolute left-3.5 top-3.5 w-4 h-4 text-white/25 pointer-events-none" />
                            <input
                              id="signup-firstname"
                              type="text"
                              value={firstName}
                              onChange={e => setFirstName(e.target.value)}
                              placeholder="First Name"
                              required
                              className={`${inputClass} pl-10`}
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Last Name</label>
                          <div className="relative">
                            <User className="absolute left-3.5 top-3.5 w-4 h-4 text-white/25 pointer-events-none" />
                            <input
                              id="signup-lastname"
                              type="text"
                              value={lastName}
                              onChange={e => setLastName(e.target.value)}
                              placeholder="Last Name"
                              required
                              className={`${inputClass} pl-10`}
                            />
                          </div>
                        </div>
                      </div>

                      {/* SRM Email */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">SRM Email</label>
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-white/25 pointer-events-none" />
                          <input
                            id="signup-email"
                            type="text"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="you@srmist.edu.in"
                            required
                            className={`${inputClass} pl-10`}
                          />
                        </div>
                      </div>

                      {/* Password */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Password</label>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-white/25 pointer-events-none" />
                          <input
                            id="signup-password"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="Min. 8 characters"
                            required
                            className={`${inputClass} pl-10 pr-10`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-3.5 text-white/30 hover:text-white/60 transition-colors"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Confirm Password */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Confirm Password</label>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-white/25 pointer-events-none" />
                          <input
                            id="signup-confirm-password"
                            type={showPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            placeholder="Repeat password"
                            required
                            className={`${inputClass} pl-10`}
                          />
                        </div>
                      </div>

                      {/* Faculty Dropdown */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Faculty</label>
                        <div className="relative">
                          <Building2 className="absolute left-3.5 top-3.5 w-4 h-4 text-white/25 pointer-events-none" />
                          <select
                            id="signup-faculty"
                            value={faculty}
                            onChange={e => { setFaculty(e.target.value); setDepartmentId(''); setSupervisorId(''); }}
                            required
                            className={`${selectClass} pl-10`}
                          >
                            <option value="" className="bg-[#0d1525]">Select Faculty</option>
                            {Object.keys(FACULTY_DEPARTMENTS).map(f => (
                              <option key={f} value={f} className="bg-[#0d1525]">{f}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Department Dropdown - ONLY appears if Faculty is selected */}
                      {faculty && (
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Department</label>
                          <div className="relative">
                            <Building2 className="absolute left-3.5 top-3.5 w-4 h-4 text-white/25 pointer-events-none" />
                            <select
                              id="signup-department"
                              value={departmentId}
                              onChange={e => { setDepartmentId(e.target.value); setSupervisorId(''); }}
                              required
                              className={`${selectClass} pl-10`}
                            >
                              <option value="" className="bg-[#0d1525]">Select Department</option>
                              {filteredDepartments.map(d => (
                                <option key={d.id} value={d.id} className="bg-[#0d1525]">{d.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}

                      {/* Research Supervisor Dropdown - ONLY appears if Department is selected */}
                      {faculty && departmentId && (
                        <div className="space-y-1 relative" id="supervisor-dropdown-container">
                          <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Research Supervisor</label>
                          <div className="relative">
                            <BookOpen className="absolute left-3.5 top-3.5 w-4 h-4 text-white/25 pointer-events-none" />
                            <button
                              id="signup-supervisor-trigger"
                              type="button"
                              onClick={() => setIsSupervisorDropdownOpen(!isSupervisorDropdownOpen)}
                              className={`${inputClass} pl-10 text-left flex items-center justify-between cursor-pointer`}
                            >
                              <span className={selectedSupervisorName ? 'text-white' : 'text-white/30'}>
                                {selectedSupervisorName || 'Select Supervisor'}
                              </span>
                              <ChevronRight className={`w-4 h-4 text-white/30 transition-transform duration-200 shrink-0 ${isSupervisorDropdownOpen ? 'rotate-90' : ''}`} />
                            </button>
                          </div>

                          <AnimatePresence>
                            {isSupervisorDropdownOpen && (
                              <motion.div
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.15 }}
                                className="absolute z-50 w-full mt-1.5 bg-[#090e18] border border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-60 flex flex-col"
                              >
                                <div className="p-2 border-b border-white/10 bg-[#090e18]">
                                  <input
                                    id="signup-supervisor-search"
                                    type="text"
                                    value={supervisorSearchQuery}
                                    onChange={e => setSupervisorSearchQuery(e.target.value)}
                                    placeholder="Search by name or email..."
                                    className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  />
                                </div>
                                <div className="overflow-y-auto flex-1 py-1 custom-scrollbar">
                                  {searchedSupervisors.length > 0 ? (
                                    searchedSupervisors.map(s => (
                                      <button
                                        key={s.id}
                                        type="button"
                                        onClick={() => {
                                          setSupervisorId(s.id);
                                          setIsSupervisorDropdownOpen(false);
                                          setSupervisorSearchQuery('');
                                        }}
                                        className={`w-full text-left px-4 py-2.5 text-xs transition-colors flex flex-col gap-0.5 hover:bg-blue-500/10 ${
                                          supervisorId === s.id ? 'bg-blue-500/20 text-white font-medium' : 'text-white/70'
                                        }`}
                                      >
                                        <span className="font-semibold text-white">{s.name || 'Unnamed Supervisor'}</span>
                                        <span className="text-[10px] text-white/40">{s.email}</span>
                                      </button>
                                    ))
                                  ) : (
                                    <div className="px-4 py-3 text-xs text-white/40 text-center">
                                      No approved supervisors found
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                          {filteredSupervisors.length === 0 && (
                            <p className="text-[10px] text-amber-400/60 mt-1">No approved supervisors found in this department.</p>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {error && (
                    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                      <p className="text-xs text-red-300">{error}</p>
                    </motion.div>
                  )}

                  <div className="flex gap-3 pt-1">
                    <button type="button" onClick={() => { setStep('role_select'); setError(''); }} className="px-4 py-3 rounded-xl border border-white/10 hover:bg-white/[0.04] text-white/60 text-sm font-medium transition-all flex items-center gap-1.5 cursor-pointer">
                      <ChevronLeft className="w-4 h-4" /> Back
                    </button>
                    <button
                      id="signup-submit-btn"
                      type="submit"
                      disabled={isLoading || (role === 'SCHOLAR' && !supervisorId)}
                      className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-blue-600/25"
                    >
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Continue</span><ArrowRight className="w-4 h-4" /></>}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* ── STEP 3: EMAIL VERIFICATION ── */}
            {step === 'verify_email' && (
              <motion.div key="verify" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
                <div className="mb-6">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-400/20 flex items-center justify-center mb-4">
                    <KeyRound className="w-5 h-5 text-blue-400" />
                  </div>
                  <h1 className="text-xl font-bold text-white tracking-tight">Verify Your Email</h1>
                  <p className="text-white/40 text-sm mt-1">Enter the 6-digit code sent to <span className="text-white/70 font-medium">{email}</span></p>
                </div>
                <form onSubmit={handleVerifyEmail} className="space-y-4">
                  <input
                    id="verify-code-input"
                    type="text"
                    inputMode="numeric"
                    value={verificationCode}
                    onChange={e => setVerificationCode(e.target.value)}
                    placeholder="000000"
                    maxLength={6}
                    required
                    autoFocus
                    className={`${inputClass} text-center text-2xl tracking-[0.5em] font-bold`}
                  />
                  {error && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                      <p className="text-xs text-red-300">{error}</p>
                    </motion.div>
                  )}
                  <button
                    id="verify-submit-btn"
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-blue-600/25"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Verify & Register</span><BadgeCheck className="w-4 h-4" /></>}
                  </button>
                </form>
              </motion.div>
            )}

            {/* ── SYNCING VIEW ── */}
            {step === 'syncing' && (
              <motion.div key="syncing" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
                <Loader2 className="w-10 h-10 text-blue-400 animate-spin mx-auto mb-4" />
                <h2 className="text-lg font-bold text-white">Setting up your account...</h2>
                <p className="text-white/40 text-sm mt-1">Syncing with the institution database</p>
              </motion.div>
            )}

            {/* ── DONE VIEW ── */}
            {step === 'done' && (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }} className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-400/20 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                </motion.div>
                <h2 className="text-lg font-bold text-white">Registration Submitted!</h2>
                <p className="text-white/40 text-sm mt-1">Redirecting to approval status page...</p>
              </motion.div>
            )}

          </AnimatePresence>
        </motion.div>

        {/* Sign in link */}
        {(step === 'role_select' || step === 'details') && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-center mt-6 text-xs text-white/30">
            Already have an account?{' '}
            <Link href="/sign-in" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
              Sign In
            </Link>
          </motion.p>
        )}

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-center mt-4 text-[10px] text-white/15 font-medium tracking-wider uppercase">
          SRMIST • Institutional Research Portal • Secured by Clerk
        </motion.p>
      </div>
    </div>
  );
}
