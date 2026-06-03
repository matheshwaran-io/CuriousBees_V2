'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { signInWithGoogle } from '@/lib/firebase';
import Link from 'next/link';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  ArrowLeft, 
  Lock, 
  Info, 
  CheckCircle, 
  Activity, 
  LogOut,
  Shield,
  Beaker,
  Network,
  Users,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import Logo from '@/components/Logo';
import RoleSelector from '@/components/auth/RoleSelector';
import FacultySelect from '@/components/auth/FacultySelect';
import DepartmentSelect from '@/components/auth/DepartmentSelect';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// Form validation schema
const SignupSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Full Name must be at least 2 characters')
    .max(50, 'Full Name cannot exceed 50 characters')
    .refine((val) => val.trim().length > 0, 'Full name cannot be blank'),
  faculty: z.string().min(1, 'Please select a faculty'),
  department: z.string().min(1, 'Please select a department'),
  role: z.enum(['FACULTY', 'PHD_SCHOLAR']),
  supervisorEmail: z.string().optional()
}).superRefine((data, ctx) => {
  if (data.role === 'PHD_SCHOLAR') {
    if (!data.supervisorEmail) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['supervisorEmail'],
        message: 'Research Supervisor email is required for scholars'
      });
    } else if (!data.supervisorEmail.toLowerCase().endsWith('@srmist.edu.in')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['supervisorEmail'],
        message: 'Supervisor email must be a valid SRMIST email (@srmist.edu.in)'
      });
    }
  }
});

type SignupFormValues = z.infer<typeof SignupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const { 
    currentUser, 
    syncUserSession, 
    updateProfile, 
    collaborators, 
    fetchCollaborators, 
    requestSupervisor, 
    logout 
  } = useStore();

  const [authLoading, setAuthLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync user session on mount
  useEffect(() => {
    syncUserSession();
  }, [syncUserSession]);

  // Redirect if already fully registered
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role && currentUser.department) {
        if (currentUser.role === 'PHD_SCHOLAR' && !currentUser.isApproved) {
          router.replace('/verification-pending');
        } else {
          router.replace('/dashboard');
        }
      }
    }
  }, [currentUser, router]);

  // Fetch faculty advisors in background to validate supervisor inputs
  useEffect(() => {
    fetchCollaborators('', 'FACULTY');
  }, [fetchCollaborators]);

  // Setup form control
  const { 
    register, 
    handleSubmit, 
    control, 
    watch, 
    setValue,
    setError,
    formState: { errors } 
  } = useForm<SignupFormValues>({
    resolver: zodResolver(SignupSchema),
    defaultValues: {
      fullName: currentUser?.name || '',
      faculty: '',
      department: '',
      role: 'PHD_SCHOLAR',
      supervisorEmail: ''
    }
  });

  // Keep form fields synced if currentUser changes (e.g. after Google SSO completes)
  useEffect(() => {
    if (currentUser) {
      if (currentUser.name) setValue('fullName', currentUser.name);
      if (currentUser.role) {
        const defaultRole = currentUser.role === 'FACULTY' ? 'FACULTY' : 'PHD_SCHOLAR';
        setValue('role', defaultRole);
      }
      if (currentUser.department) {
        setValue('department', currentUser.department);
      }
    }
  }, [currentUser, setValue]);

  const selectedRole = watch('role');
  const selectedFaculty = watch('faculty');

  // Trigger Google Authentication flow
  const handleGoogleAuth = async () => {
    setErrorMsg(null);
    setAuthLoading(true);
    try {
      await signInWithGoogle();
      await syncUserSession();
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || 'Authentication failed. Make sure you select a valid @srmist.edu.in account.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Perform signup profile submission
  const onSubmit = async (data: SignupFormValues) => {
    if (!currentUser) return;
    
    setErrorMsg(null);
    setSubmitLoading(true);

    try {
      // 1. Verify supervisor validity for Scholars
      let matchedSupervisorId: string | null = null;
      if (data.role === 'PHD_SCHOLAR') {
        const supervisorEmailClean = data.supervisorEmail?.trim().toLowerCase();
        
        // Find supervisor in our collaborators state
        const supervisor = collaborators.find(
          c => c.role === 'FACULTY' && c.email.toLowerCase() === supervisorEmailClean
        );

        if (!supervisor) {
          setError('supervisorEmail', {
            type: 'manual',
            message: 'Supervisor email is not registered as a Faculty Guide. They must log in first.'
          });
          setSubmitLoading(false);
          return;
        }
        matchedSupervisorId = supervisor.id;
      }

      // 2. Save profile information to backend
      await updateProfile({
        name: data.fullName,
        role: data.role,
        department: data.department,
        bio: currentUser.bio || '',
        interests: currentUser.interests?.map(i => i.interest?.name || '') || []
      });

      // 3. Map supervisor if Scholar
      if (data.role === 'PHD_SCHOLAR' && matchedSupervisorId) {
        await requestSupervisor(matchedSupervisorId);
        await syncUserSession(); // Sync latest supervisor state
        router.push('/verification-pending');
      } else {
        await syncUserSession(); // Sync latest profile role
        router.push('/dashboard');
      }
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || 'Failed to complete registration profile.');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Inline CSS background styling matching Stitch hex pattern
  const hexBgStyle = {
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='100' viewBox='0 0 60 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 10L60 27.5V62.5L30 80L0 62.5V27.5L30 10ZM30 15L5 29.5V58L30 72.5L55 58V29.5L30 15Z' fill='%23004495' fill-opacity='0.03' fill-rule='evenodd'/%3E%3C/svg%3E")`
  };

  return (
    <div 
      className="bg-background text-on-background min-h-screen flex items-center justify-center p-margin-mobile md:p-margin-desktop font-body-md antialiased select-none"
      style={hexBgStyle}
    >
      {/* Back to Home Link */}
      <Link 
        href="/" 
        className="absolute top-8 left-8 flex items-center space-x-2 text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors z-20"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Home</span>
      </Link>

      {/* Main Glassmorphic Container Panel */}
      <main className="w-full max-w-[1200px] flex flex-col md:flex-row rounded-xl overflow-hidden glass-panel border border-outline-variant shadow-sm min-h-[700px] text-left">
        
        {/* Left Side: Branding / Intro */}
        <section className="w-full md:w-5/12 bg-primary text-on-primary p-stack-lg md:p-stack-xl flex flex-col justify-between relative overflow-hidden shrink-0">
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-container to-surface-tint opacity-80 z-0"></div>
          
          {/* Logo & Headline */}
          <div className="relative z-10 space-y-stack-lg">
            <div className="mb-stack-lg">
              <Logo theme="dark" size={48} showText={true} />
            </div>
            
            <div className="space-y-stack-md">
              <h1 className="font-display-lg text-4xl sm:text-display-lg font-bold text-on-primary tracking-tight leading-none">
                Join the Network.
              </h1>
              <p className="font-body-lg text-body-lg text-primary-fixed max-w-sm leading-relaxed">
                Access high-performance research environments, collaborative workspaces, and institutional analytics.
              </p>
            </div>

            {/* Core Features List */}
            <div className="space-y-stack-md pt-6">
              <div className="flex items-start gap-stack-sm text-left">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 text-secondary-container">
                  <Beaker className="w-5 h-5 text-secondary-container" />
                </div>
                <div>
                  <h3 className="font-label-md text-label-md text-primary-fixed font-semibold">Advanced Tools</h3>
                  <p className="font-body-sm text-body-sm text-primary-fixed-dim mt-0.5">Designed for complex academic rigor.</p>
                </div>
              </div>
              <div className="flex items-start gap-stack-sm text-left">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 text-secondary-container">
                  <Network className="w-5 h-5 text-secondary-container" />
                </div>
                <div>
                  <h3 className="font-label-md text-label-md text-primary-fixed font-semibold">Collaborative Ecosystem</h3>
                  <p className="font-body-sm text-body-sm text-primary-fixed-dim mt-0.5">Connect with researchers globally.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-stack-xl">
            <p className="font-body-sm text-body-sm text-primary-fixed-dim opacity-80">
              © 2026 SRMIST Institutional Research Office.
            </p>
          </div>
        </section>

        {/* Right Side: Form Card */}
        <section className="w-full md:w-7/12 bg-surface p-stack-lg md:p-stack-xl flex flex-col justify-center overflow-y-auto">
          <div className="max-w-[480px] mx-auto w-full py-4">
            
            {/* Header titles */}
            <div className="mb-stack-lg">
              <h2 className="font-display font-bold text-headline-xl text-on-surface mb-stack-xs hidden md:block tracking-tight leading-tight">
                Create Account
              </h2>
              <h2 className="font-display font-bold text-headline-xl-mobile text-on-surface mb-stack-xs md:hidden tracking-tight leading-tight">
                Create Account
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant mt-1.5">
                {!currentUser ? 'Step 1 of 2: Enterprise SSO Identity Check' : 'Step 2 of 2: Researcher Profile Setup'}
              </p>
            </div>

            {/* Error Message Box */}
            <AnimatePresence mode="wait">
              {errorMsg && (
                <motion.div 
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  className="overflow-hidden mb-6"
                >
                  <div className="bg-error-container border border-error/30 text-error rounded-lg p-4 flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                    <p className="text-[13px] font-semibold leading-relaxed">{errorMsg}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Dynamic View rendering depending on Auth state */}
            {!currentUser ? (
              
              /* ── STAGE A: SSO AUTHENTICATION REQUIRED ── */
              <div className="space-y-6 text-left py-4">
                <div className="p-4 bg-surface-container-low border border-outline-variant/30 rounded-lg flex items-start space-x-3 select-none">
                  <Lock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-[13.5px] text-on-surface-variant leading-relaxed">
                    CuriousBees requires enterprise authentication. Please sign in using your verified **SRM IST Google Workspace** account to establish your collaborative node.
                  </p>
                </div>

                <button
                  onClick={handleGoogleAuth}
                  disabled={authLoading}
                  className="w-full h-12 bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md rounded-lg flex items-center justify-center space-x-3 shadow hover:opacity-90 active:scale-[0.99] transition-all duration-150 cursor-pointer disabled:opacity-50"
                >
                  {authLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path fill="#ffffff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#ffffff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#ffffff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" />
                      <path fill="#ffffff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                  )}
                  <span>Sign In with SRM Google Account</span>
                </button>
                
                <div className="text-center pt-2">
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Already have an account? <Link className="text-primary hover:underline font-semibold font-label-md" href="/login">Sign In</Link>
                  </p>
                </div>
              </div>

            ) : (

              /* ── STAGE B: PROFILE SETUP FORM ── */
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-stack-md text-left">
                
                {/* 1. Institutional Email (Readonly) */}
                <div className="relative pt-6">
                  <label className="absolute top-0 left-0 font-label-caps text-label-caps text-outline transition-all" htmlFor="email">
                    Institutional Email
                  </label>
                  <div className="relative">
                    <input 
                      type="email" 
                      id="email" 
                      name="email"
                      disabled
                      value={currentUser.email}
                      className="w-full input-underline text-outline font-body-md select-text pr-8"
                    />
                    <span className="absolute right-0 top-1/2 -translate-y-1/2 text-outline">
                      <Lock className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <p className="mt-1 font-body-sm text-[11px] text-outline">
                    Pre-filled via Enterprise Google SSO
                  </p>
                </div>

                {/* 2. Full Name */}
                <div className="relative pt-6">
                  <label 
                    className="absolute top-0 left-0 font-label-caps text-label-caps text-on-surface-variant transition-all" 
                    htmlFor="fullName"
                  >
                    Full Name
                  </label>
                  <input 
                    type="text" 
                    id="fullName" 
                    placeholder="Dr. Jane Doe"
                    {...register('fullName')}
                    className={cn(
                      "w-full input-underline text-on-surface font-body-md",
                      errors.fullName && "border-error focus:border-error"
                    )}
                  />
                  {errors.fullName && (
                    <p className="text-[11px] text-error font-semibold mt-1">{errors.fullName.message}</p>
                  )}
                </div>

                {/* 3. Faculty Select */}
                <Controller
                  name="faculty"
                  control={control}
                  render={({ field }) => (
                    <FacultySelect
                      value={field.value}
                      onChange={field.onChange}
                      error={errors.faculty?.message}
                    />
                  )}
                />

                {/* 4. Department Select */}
                <Controller
                  name="department"
                  control={control}
                  render={({ field }) => (
                    <DepartmentSelect
                      facultyValue={selectedFaculty}
                      value={field.value}
                      onChange={field.onChange}
                      error={errors.department?.message}
                    />
                  )}
                />

                {/* 5. Role Segmented Selector */}
                <Controller
                  name="role"
                  control={control}
                  render={({ field }) => (
                    <RoleSelector
                      value={field.value}
                      onChange={(val) => {
                        field.onChange(val);
                        // Clear supervisor email if they switch to Faculty
                        if (val === 'FACULTY') {
                          setValue('supervisorEmail', '');
                        }
                      }}
                    />
                  )}
                />

                {/* 6. Research Supervisor Email (Scholar Only) */}
                <AnimatePresence>
                  {selectedRole === 'PHD_SCHOLAR' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="relative pt-6 p-4 bg-surface-container-low border border-outline-variant rounded-lg space-y-3 mt-2">
                        <div className="flex items-center gap-1">
                          <Info className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="font-label-caps text-label-caps text-primary font-bold">Required for Scholars</span>
                        </div>
                        
                        <div className="relative pt-6">
                          <label 
                            className="absolute top-0 left-0 font-label-caps text-label-caps text-on-surface-variant transition-all" 
                            htmlFor="supervisorEmail"
                          >
                            Research Supervisor Email
                          </label>
                          <input 
                            type="email" 
                            id="supervisorEmail" 
                            placeholder="supervisor@srmist.edu.in"
                            {...register('supervisorEmail')}
                            className={cn(
                              "w-full input-underline text-on-surface font-body-md",
                              errors.supervisorEmail && "border-error focus:border-error"
                            )}
                          />
                          {errors.supervisorEmail && (
                            <p className="text-[11px] text-error font-semibold mt-1">{errors.supervisorEmail.message}</p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Actions Button */}
                <div className="pt-stack-md flex flex-col gap-stack-sm">
                  <button 
                    type="submit"
                    disabled={submitLoading}
                    className="w-full bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md py-3 rounded transition-colors flex justify-center items-center gap-2 shadow cursor-pointer disabled:opacity-50"
                  >
                    {submitLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <span>Complete Registration</span>
                        <CheckCircle className="w-[18px] h-[18px]" />
                      </>
                    )}
                  </button>
                </div>

                <div className="text-center mt-stack-md flex justify-between items-center text-xs">
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Already have an account? <Link className="text-primary hover:underline font-semibold font-label-md" href="/login">Sign In</Link>
                  </p>
                  
                  <button
                    type="button"
                    onClick={() => logout()}
                    className="text-on-surface-variant hover:text-primary transition flex items-center space-x-1 cursor-pointer font-semibold"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>

              </form>
            )}

            <div className="mt-stack-lg flex items-center justify-center gap-2 text-outline select-none">
              <Shield className="w-4 h-4 text-outline shrink-0" />
              <p className="font-label-caps text-label-caps text-[10px]">
                Secure Authentication managed via Enterprise Google SSO
              </p>
            </div>

          </div>
        </section>
      </main>
    </div>
  );
}
