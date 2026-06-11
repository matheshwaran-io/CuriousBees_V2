'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { SRM_DEPARTMENTS } from '@curiousbees/shared-utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UpdateProfileSchema } from '@curiousbees/shared-utils';
import { 
  Check, 
  Tag, 
  Plus, 
  X,
  User,
  Lock,
  Loader2,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardShell } from '@/components/shared/dashboard-shell';

export default function ScholarSettingsPage() {
  const router = useRouter();
  const { currentUser, updateProfile, interestsList } = useStore();
  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    currentUser?.interests?.map((i) => i.interest?.name || '') || []
  );
  const [newInterestInput, setNewInterestInput] = useState('');
  const [activeSettingsTab, setActiveSettingsTab] = useState<'identity' | 'domains' | 'security'>('identity');

  // Setup form validation
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm({
    resolver: zodResolver(UpdateProfileSchema),
    defaultValues: {
      name: currentUser?.name || '',
      role: currentUser?.role || 'RESEARCH_SCHOLAR',
      department: currentUser?.department || '',
      bio: currentUser?.bio || '',
    }
  });

  useEffect(() => {
    if (currentUser) {
      reset({
        name: currentUser.name || '',
        role: currentUser.role || 'RESEARCH_SCHOLAR',
        department: currentUser.department || '',
        bio: currentUser.bio || '',
      });
      setSelectedInterests(currentUser.interests?.map((i) => i.interest?.name || '') || []);
    }
  }, [currentUser, reset]);

  const onSubmit = async (data: any) => {
    const payload = {
      ...data,
      // Force SCHOLAR role to prevent escalations
      role: 'RESEARCH_SCHOLAR',
      interests: selectedInterests
    };

    try {
      await updateProfile(payload);
      router.push('/scholar/profile');
    } catch (e: any) {
      alert(`Error updating settings: ${e.message}`);
    }
  };

  const handleAddInterest = (name: string) => {
    const cleaned = name.trim();
    if (cleaned && !selectedInterests.includes(cleaned)) {
      if (selectedInterests.length >= 8) {
        alert('You can select up to 8 interests only.');
        return;
      }
      setSelectedInterests([...selectedInterests, cleaned]);
    }
    setNewInterestInput('');
  };

  const handleRemoveInterest = (name: string) => {
    setSelectedInterests(selectedInterests.filter(t => t !== name));
  };

  return (
    <DashboardShell>
      {/* Back to Profile navigation row */}
      <div className="text-left">
        <Link 
          href="/scholar/profile" 
          className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" />
          <span>Back to Profile</span>
        </Link>
      </div>

      {/* Page Title */}
      <div className="text-left">
        <span className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-primary" />
          <span>Scholar Portal Management</span>
        </span>
        <h2 className="cb-page-title mt-1.5 font-display">
          Account & Profile Settings
        </h2>
        <p className="cb-page-subtitle">
          Configure your research bio metadata, update domain interests, and audit security keys.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
        {/* Left Hand Tab Navigation Menu */}
        <div className="lg:col-span-3 flex flex-col gap-1">
          {([
            { id: 'identity', label: 'Identity & Bio', icon: User },
            { id: 'domains', label: 'Research Focus', icon: Tag },
            { id: 'security', label: 'Security & Access', icon: Lock }
          ] as const).map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSettingsTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSettingsTab(tab.id)}
                className={`flex items-center space-x-2.5 py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 text-left cursor-pointer ${
                  isActive 
                    ? 'bg-primary text-white shadow-sm' 
                    : 'text-slate-505 hover:text-slate-800 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Hand Settings Form Pane */}
        <div className="lg:col-span-9 cb-card bg-white p-6 min-h-[400px] flex flex-col justify-between">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 flex-grow flex flex-col justify-between">
            
            <div className="flex-grow">
              <AnimatePresence mode="wait">
                
                {/* IDENTITY TAB */}
                {activeSettingsTab === 'identity' && (
                  <motion.div
                    key="tab-identity"
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-5"
                  >
                    <div className="border-b border-slate-100 pb-2">
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-display">Academic Identity</h3>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Manage your display credentials</p>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
                        <input
                          type="text"
                          {...register('name')}
                          className="cb-input"
                          placeholder="E.g. Ramesh Kumar"
                        />
                        {errors.name && <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider mt-1">{errors.name.message as string}</p>}
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Academic Role</label>
                        <input
                          type="text"
                          disabled
                          value="PhD Research Scholar"
                          className="cb-input bg-slate-50 text-slate-450 border-slate-200 cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Academic Department</label>
                      <select
                        {...register('department')}
                        className="cb-input cursor-pointer"
                      >
                        <option value="">Select Department</option>
                        {SRM_DEPARTMENTS.map((dept) => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                      {errors.department && <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider mt-1">{errors.department.message as string}</p>}
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Research Biography</label>
                      <textarea
                        rows={4}
                        {...register('bio')}
                        className="w-full bg-white border border-slate-200 rounded-lg p-3 font-sans text-xs leading-relaxed text-slate-805 placeholder:text-slate-400 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-colors"
                        placeholder="Outline your research focus, lab specifications, and grant history..."
                      />
                      {errors.bio && <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider mt-1">{errors.bio.message as string}</p>}
                    </div>
                  </motion.div>
                )}

                {/* RESEARCH DOMAINS TAB */}
                {activeSettingsTab === 'domains' && (
                  <motion.div
                    key="tab-domains"
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-5"
                  >
                    <div className="border-b border-slate-100 pb-2">
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-display">Research Focus Areas</h3>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Specify domains that index your node in co-author matchmaking directories</p>
                    </div>

                    <div className="space-y-3">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Selected Domains (Max 8)</label>
                      
                      <div className="flex flex-wrap gap-1.5 p-3 bg-slate-50 border border-slate-200/50 rounded-xl">
                        {selectedInterests.length === 0 ? (
                          <p className="text-slate-400 text-xs italic font-semibold">No domains pinned yet. Select below or add custom ones.</p>
                        ) : (
                          selectedInterests.map((interest) => (
                            <span
                              key={interest}
                              className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-primary/5 border border-primary/20 text-primary"
                            >
                              <span>{interest}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveInterest(interest)}
                                className="ml-1 text-primary/60 hover:text-primary p-0.5 cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))
                        )}
                      </div>

                      <div className="relative mt-2">
                        <input
                          type="text"
                          value={newInterestInput}
                          onChange={(e) => setNewInterestInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddInterest(newInterestInput))}
                          placeholder="Type scientific discipline and press Enter..."
                          className="cb-input pl-8 pr-10"
                        />
                        <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3.5" />
                        <button
                          type="button"
                          onClick={() => handleAddInterest(newInterestInput)}
                          className="absolute right-1.5 top-1.5 p-1 rounded bg-slate-100 text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 pt-3 border-t border-slate-100">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Recommended Fields</p>
                      <div className="flex flex-wrap gap-1.5">
                        {interestsList
                          .filter(item => !selectedInterests.includes(item))
                          .map((tag) => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => handleAddInterest(tag)}
                              className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-slate-50 hover:bg-slate-100 border border-slate-200/50 text-slate-505 hover:text-primary transition-colors cursor-pointer"
                            >
                              + {tag}
                            </button>
                          ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* SECURITY & CREDENTIALS TAB */}
                {activeSettingsTab === 'security' && (
                  <motion.div
                    key="tab-security"
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-5"
                  >
                    <div className="border-b border-slate-100 pb-2">
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-display">Account Security</h3>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Secure authentication and gateway keys</p>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Registered Email</label>
                        <input
                          type="email"
                          disabled
                          value={currentUser?.email || ''}
                          className="cb-input select-all font-mono"
                        />
                        <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Managed via SRMIST institutional identity system</p>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Verification Clearance Status</label>
                        <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                            <Check className="w-4 h-4 stroke-[3px]" />
                          </div>
                          <div className="text-left">
                            <p className="text-xs font-bold text-slate-850">Clearance Node Confirmed</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Guide signatures & institutional directory synchronization complete.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>

            {/* Footer Save Row */}
            <div className="flex justify-end gap-2 pt-6 mt-6 border-t border-slate-100">
              <Link href="/scholar/profile">
                <button
                  type="button"
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-[10px] font-bold uppercase tracking-wider rounded-lg transition cursor-pointer"
                >
                  Cancel
                </button>
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-primary text-white hover:bg-primary/95 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Settings</span>
                  </>
                )}
              </button>
            </div>

          </form>
        </div>
      </div>
    </DashboardShell>
  );
}
