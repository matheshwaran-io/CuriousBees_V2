'use client';

import { useSignUp } from '@clerk/nextjs';
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

type Role = 'RESEARCH_SCHOLAR' | 'RESEARCH_SUPERVISOR';
type Step = 'role_select' | 'details' | 'verify_email' | 'syncing' | 'done';

interface Department { id: string; name: string; code: string; }
interface Supervisor { id: string; name: string | null; email: string; department: string | null; }

export default function SignUpPage() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();

  const [step, setStep] = useState<Step>('role_select');
  const [role, setRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');

  // Form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [supervisorId, setSupervisorId] = useState('');
  const [employeeId, setEmployeeId] = useState('');

  const [departments, setDepartments] = useState<Department[]>([]);
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);

  // Fetch departments and approved supervisors
  useEffect(() => {
    apiFetch('/api/departments', { skipAuth: true }).then(r => r.ok && r.json().then(setDepartments)).catch(() => {});
    apiFetch('/api/users/supervisors', { skipAuth: true }).then(r => r.ok && r.json().then(setSupervisors)).catch(() => {});
  }, []);

  const validateSrmEmail = (e: string) => {
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
    if (!isLoaded || !role) return;
    setError('');
    const domainError = validateSrmEmail(email);
    if (domainError) { setError(domainError); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (!departmentId) { setError('Please select your department.'); return; }
    if (role === 'RESEARCH_SCHOLAR' && !supervisorId) { setError('Please select your research supervisor.'); return; }
    if (role === 'RESEARCH_SUPERVISOR' && !employeeId.trim()) { setError('Please enter your Employee ID.'); return; }

    setIsLoading(true);
    try {
      await signUp.create({
        emailAddress: email,
        password,
        firstName: fullName.split(' ')[0] || fullName,
        lastName: fullName.split(' ').slice(1).join(' ') || '',
      });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setStep('verify_email');
    } catch (err: any) {
      const msg = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || 'Registration failed.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
    setError('');
    setIsLoading(true);
    try {
      const result = await signUp.attemptEmailAddressVerification({ code: verificationCode });
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        setStep('syncing');
        // Get Clerk token and POST to /api/users/register
        const token = await window.Clerk?.session?.getToken();
        if (!token) throw new Error('Session token not available.');
        const regRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/users/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ name: fullName, role, departmentId, supervisorId: role === 'RESEARCH_SCHOLAR' ? supervisorId : undefined, employeeId: role === 'RESEARCH_SUPERVISOR' ? employeeId : undefined }),
        });
        if (!regRes.ok) {
          const data = await regRes.json();
          throw new Error(data?.message || 'Registration sync failed.');
        }
        setStep('done');
        setTimeout(() => router.push('/approval-pending'), 1500);
      } else {
        setError('Verification incomplete. Please retry.');
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
                    onClick={() => handleRoleSelect('RESEARCH_SCHOLAR')}
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
                    onClick={() => handleRoleSelect('RESEARCH_SUPERVISOR')}
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
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${role === 'RESEARCH_SCHOLAR' ? 'bg-blue-500/15 text-blue-400' : 'bg-purple-500/15 text-purple-400'}`}>
                    {role === 'RESEARCH_SCHOLAR' ? <GraduationCap className="w-5 h-5" /> : <Users className="w-5 h-5" />}
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-white tracking-tight">
                      {role === 'RESEARCH_SCHOLAR' ? 'Scholar Registration' : 'Supervisor Registration'}
                    </h1>
                    <p className="text-white/40 text-sm">Fill in your details below</p>
                  </div>
                </div>

                <form id="signup-details-form" onSubmit={handleDetailsSubmit} className="space-y-4">
                  {/* Full Name */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3.5 w-4 h-4 text-white/25" />
                      <input id="signup-name" type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Dr. / Mr. / Ms. Full Name" required className={`${inputClass} pl-10`} />
                    </div>
                  </div>

                  {/* SRM Email */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">SRM Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-white/25" />
                      <input id="signup-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@srmist.edu.in" required className={`${inputClass} pl-10`} />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-white/25" />
                      <input id="signup-password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 8 characters" required className={`${inputClass} pl-10 pr-10`} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3.5 text-white/30 hover:text-white/60 transition-colors">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-white/25" />
                      <input id="signup-confirm-password" type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repeat password" required className={`${inputClass} pl-10`} />
                    </div>
                  </div>

                  {/* Department */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Department</label>
                    <div className="relative">
                      <Building2 className="absolute left-3.5 top-3.5 w-4 h-4 text-white/25 pointer-events-none" />
                      <select id="signup-department" value={departmentId} onChange={e => setDepartmentId(e.target.value)} required className={`${selectClass} pl-10`}>
                        <option value="" className="bg-[#0d1525]">Select Department</option>
                        {departments.map(d => (
                          <option key={d.id} value={d.id} className="bg-[#0d1525]">{d.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Scholar: Supervisor Dropdown */}
                  {role === 'RESEARCH_SCHOLAR' && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Research Supervisor</label>
                      <div className="relative">
                        <BookOpen className="absolute left-3.5 top-3.5 w-4 h-4 text-white/25 pointer-events-none" />
                        <select id="signup-supervisor" value={supervisorId} onChange={e => setSupervisorId(e.target.value)} required className={`${selectClass} pl-10`}>
                          <option value="" className="bg-[#0d1525]">Select Supervisor</option>
                          {supervisors.map(s => (
                            <option key={s.id} value={s.id} className="bg-[#0d1525]">{s.name || s.email} {s.department ? `— ${s.department}` : ''}</option>
                          ))}
                        </select>
                      </div>
                      {supervisors.length === 0 && (
                        <p className="text-[10px] text-amber-400/60">No approved supervisors found. Please contact admin.</p>
                      )}
                    </div>
                  )}

                  {/* Supervisor: Employee ID */}
                  {role === 'RESEARCH_SUPERVISOR' && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Employee ID</label>
                      <div className="relative">
                        <CreditCard className="absolute left-3.5 top-3.5 w-4 h-4 text-white/25" />
                        <input id="signup-employee-id" type="text" value={employeeId} onChange={e => setEmployeeId(e.target.value)} placeholder="e.g. SRM20240001" required className={`${inputClass} pl-10`} />
                      </div>
                    </div>
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
                      disabled={isLoading}
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
