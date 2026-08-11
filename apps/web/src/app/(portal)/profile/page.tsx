'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useStore } from '@/store/useStore';
import { AcademicProfileView } from '@/components/profile/AcademicProfileView';
import { SRM_DEPARTMENTS } from '@curiousbees/shared-utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UpdateProfileSchema } from '@curiousbees/shared-utils';
import { UserRole } from '@curiousbees/types';
import { cn } from '@/lib/utils';
import { 
  BookOpen, 
  MapPin, 
  FileText, 
  Check, 
  Edit3, 
  Tag, 
  Plus, 
  X,
  Sparkles,
  GraduationCap,
  Award,
  Calendar,
  Layers,
  Search,
  Network,
  Activity,
  Download,
  Share2,
  Loader2,
  ArrowRight,
  User,
  Lock,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProfilePage() {
  const { currentUser, updateProfile, interestsList, roleOverride, threads, collaborators, fetchCollaborators } = useStore();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    currentUser?.interests?.map((i) => i.interest?.name || '') || []
  );
  const [newInterestInput, setNewInterestInput] = useState('');
  
  // Settings Tab state
  const [activeSettingsTab, setActiveSettingsTab] = useState<'identity' | 'domains' | 'security'>('identity');

  useEffect(() => {
    fetchCollaborators();
  }, [fetchCollaborators]);

  // Setup form validation via React Hook Form and Zod
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm({
    resolver: zodResolver(UpdateProfileSchema),
    defaultValues: {
      name: currentUser?.name || '',
      role: currentUser?.role || 'RESEARCH_SCHOLAR',
      department: currentUser?.department || '',
      bio: currentUser?.bio || '',
    }
  });

  // Keep form in sync when currentUser loads
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
      interests: selectedInterests
    };

    try {
      await updateProfile(payload);
      setIsEditing(false);
    } catch (e: any) {
      alert(`Error updating profile: ${e.message}`);
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

  // Filter threads made by current user
  const userThreads = threads.filter(t => t.authorId === currentUser?.id);

  // Initials for avatar
  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'CB';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  // Collaborators to display on the network graph
  const graphCollaborators = collaborators
    .filter((c: any) => c.id !== currentUser?.id)
    .slice(0, 3);

  // Fallback default network nodes if collaborators directory is empty
  const defaultNetwork = [
    { initials: 'JD', name: 'Dr. Jane Du' },
    { initials: 'AM', name: 'Dr. Alan M.' },
    { initials: 'KL', name: 'Dr. Kevin Lin' }
  ];

  const networkNodes = graphCollaborators.length >= 3 
    ? graphCollaborators.map((c: any) => ({ initials: getInitials(c.name), name: c.name || '' }))
    : defaultNetwork;

  // Render stats based on user role
  const isFaculty = roleOverride === 'RESEARCH_SUPERVISOR';
  const citationsVal = isFaculty ? 142 : 24;
  const publicationsVal = userThreads.length > 0 ? userThreads.length : (isFaculty ? 12 : 3);
  const thirdStatName = isFaculty ? 'Active Grants' : 'Synergy Matches';
  const thirdStatVal = isFaculty ? 8 : '94%';

  if (!isEditing) {
    return (
      <AcademicProfileView 
        user={currentUser} 
        isOwnProfile={true} 
        onEditClick={() => setIsEditing(true)} 
      />
    );
  }

  return (
    <div className="space-y-6 max-w-[1240px] mx-auto select-none pb-24 text-left">
      
      {/* 🚀 Profile Header Banner Card */}
      <div className="bg-white border border-[#E4E9F2] rounded-3xl overflow-hidden shadow-xs relative">
        <div className="h-32 w-full bg-[#001E4C] relative overflow-hidden flex items-center justify-end px-6">
          <svg className="absolute inset-0 w-full h-full opacity-15 pointer-events-none" xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
            <path d="M50 0 L93.3 25 L93.3 75 L50 100 L6.7 75 L6.7 25 Z" fill="none" stroke="#FFFFFF" strokeWidth="1" />
            <path d="M0 50 L43.3 75 L43.3 125 L0 150 L-43.3 125 L-43.3 75 Z" fill="none" stroke="#FFFFFF" strokeWidth="1" />
          </svg>
          <div className="relative z-10 flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-[#F5B800]" />
            <span>Profile Settings & Credential Control</span>
          </div>
        </div>

        <div className="p-6 md:p-8 pt-0 relative z-20 flex flex-col lg:flex-row items-start lg:items-end justify-between gap-6 -mt-12">
          {/* Avatar & User Details */}
          <div className="flex items-end gap-5">
            <div className="relative shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white shadow-md bg-[#001E4C] text-white font-extrabold flex items-center justify-center text-2xl sm:text-3xl ring-2 ring-[#F5B800]">
                {currentUser?.image ? (
                  <img 
                    src={currentUser.image} 
                    alt={currentUser.name || 'User Profile'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{getInitials(currentUser?.name)}</span>
                )}
              </div>
            </div>

            <div className="space-y-1.5 pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-sans text-xl sm:text-2xl font-extrabold text-[#17233D] leading-tight tracking-tight">
                  {currentUser?.name || 'Academic Scholar'}
                </h2>
                <span className="px-2.5 py-0.5 bg-[#EEF4FF] text-[#0B4EA2] border border-[#0B4EA2]/20 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
                  {isFaculty ? 'Research Supervisor' : 'Research Scholar'}
                </span>
                {currentUser?.approved && (
                  <span className="px-2.5 py-0.5 bg-[#FFF9E6] text-[#92400E] border border-[#F5B800]/40 rounded-full text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1">
                    <Check className="w-3 h-3 stroke-[3px] text-[#F5B800]" />
                    Verified
                  </span>
                )}
              </div>
              
              <p className="text-[#0B4EA2] text-xs font-bold uppercase tracking-wider">
                {currentUser?.department || 'Department of Computer Science & Engineering'} • SRMIST
              </p>

              {/* Research Tags */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {selectedInterests.slice(0, 4).map((interest) => (
                  <span 
                    key={interest}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#EEF4FF] border border-[#0B4EA2]/20 text-[#0B4EA2] rounded-lg text-[10px] font-bold uppercase tracking-wider"
                  >
                    <Tag className="w-3 h-3 text-[#0B4EA2]" />
                    {interest}
                  </span>
                ))}
              </div>

              {/* Buttons */}
              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="px-4 py-2 bg-[#0B4EA2] hover:bg-[#073B7A] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isEditing ? 'View Credentials Record' : 'Edit Profile Settings'}</span>
                </button>
                <button 
                  onClick={() => alert(`Shareable credential link: ${window.location.origin}/researchers/${currentUser?.id || ''}`)}
                  className="px-4 py-2 bg-white text-[#4A5568] border border-[#E4E9F2] hover:bg-[#EEF4FF] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5 text-[#0B4EA2]" />
                  <span>Share Credentials</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Stats Panel */}
          <div className="flex md:flex-row lg:flex-col gap-4 w-full md:w-auto lg:w-48 bg-[#F5F7FC] border border-[#E4E9F2] p-4 rounded-2xl text-center md:text-left justify-around shrink-0">
            <div>
              <div className="text-xl sm:text-2xl font-extrabold text-[#17233D]">{citationsVal}</div>
              <div className="text-[10px] font-bold text-[#6B7890] uppercase tracking-wider mt-0.5">Citations</div>
            </div>
            <div className="hidden md:block w-[1px] lg:h-[1px] lg:w-full bg-[#E4E9F2]" />
            <div>
              <div className="text-xl sm:text-2xl font-extrabold text-[#17233D]">{publicationsVal}</div>
              <div className="text-[10px] font-bold text-[#6B7890] uppercase tracking-wider mt-0.5">Publications</div>
            </div>
            <div className="hidden md:block w-[1px] lg:h-[1px] lg:w-full bg-[#E4E9F2]" />
            <div>
              <div className="text-xl sm:text-2xl font-extrabold text-[#17233D]">{thirdStatVal}</div>
              <div className="text-[10px] font-bold text-[#6B7890] uppercase tracking-wider mt-0.5">{thirdStatName}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── SETTINGS FORM & NAVIGATION ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
        {/* Left Navigation Menu */}
        <div className="lg:col-span-3 flex flex-col gap-1.5">
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
                className={cn(
                  "flex items-center space-x-3 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all text-left cursor-pointer",
                  isActive 
                    ? "bg-[#0B4EA2] text-white shadow-xs" 
                    : "bg-white text-[#4A5568] hover:bg-[#EEF4FF] hover:text-[#0B4EA2] border border-[#E4E9F2]"
                )}
              >
                <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-[#F5B800]" : "text-[#0B4EA2]")} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Settings Form Pane */}
        <div className="lg:col-span-9 bg-white border border-[#E4E9F2] rounded-3xl p-6 md:p-8 shadow-xs">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
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
                  <div className="border-b border-[#E4E9F2] pb-3">
                    <h3 className="text-sm font-extrabold text-[#17233D] uppercase tracking-wider">Academic Identity</h3>
                    <p className="text-xs text-[#6B7890] font-medium mt-0.5">Manage your display credentials, role designations, and research statement.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-[#17233D] uppercase tracking-wider">Full Name</label>
                      <input
                        type="text"
                        {...register('name')}
                        className="w-full bg-[#F5F7FC] border border-[#E4E9F2] rounded-xl p-3 text-xs font-bold text-[#17233D] outline-none focus:border-[#0B4EA2] focus:ring-2 focus:ring-[#0B4EA2]/20 transition-all"
                        placeholder="E.g. Dr. Ramesh Kumar"
                      />
                      {errors.name && <p className="text-xs text-red-500 font-bold mt-1">{errors.name.message as string}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-[#17233D] uppercase tracking-wider">Academic Role</label>
                      <select
                        {...register('role')}
                        className="w-full bg-[#F5F7FC] border border-[#E4E9F2] rounded-xl p-3 text-xs font-bold text-[#17233D] outline-none focus:border-[#0B4EA2] focus:ring-2 focus:ring-[#0B4EA2]/20 transition-all cursor-pointer"
                      >
                        <option value='RESEARCH_SCHOLAR'>Research Scholar</option>
                        <option value='RESEARCH_SUPERVISOR'>Research Supervisor</option>
                        <option value='INSTITUTE_ADMIN'>Institute Admin</option>
                        <option value='ADMIN'>Admin</option>
                      </select>
                      {errors.role && <p className="text-xs text-red-500 font-bold mt-1">{errors.role.message as string}</p>}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#17233D] uppercase tracking-wider">Academic Department</label>
                    <select
                      {...register('department')}
                      className="w-full bg-[#F5F7FC] border border-[#E4E9F2] rounded-xl p-3 text-xs font-bold text-[#17233D] outline-none focus:border-[#0B4EA2] focus:ring-2 focus:ring-[#0B4EA2]/20 transition-all cursor-pointer"
                    >
                      <option value="">Select SRMIST Department</option>
                      {SRM_DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                    {errors.department && <p className="text-xs text-red-500 font-bold mt-1">{errors.department.message as string}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#17233D] uppercase tracking-wider">Research Agenda / Biography</label>
                    <textarea
                      rows={4}
                      {...register('bio')}
                      className="w-full bg-[#F5F7FC] border border-[#E4E9F2] rounded-xl p-3 text-xs leading-relaxed text-[#17233D] placeholder:text-[#6B7890] outline-none focus:border-[#0B4EA2] focus:ring-2 focus:ring-[#0B4EA2]/20 transition-all"
                      placeholder="Outline your current research focus, lab specifications, and grant pipeline..."
                    />
                    {errors.bio && <p className="text-xs text-red-500 font-bold mt-1">{errors.bio.message as string}</p>}
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
                  <div className="border-b border-[#E4E9F2] pb-3">
                    <h3 className="text-sm font-extrabold text-[#17233D] uppercase tracking-wider">Research Focus Areas</h3>
                    <p className="text-xs text-[#6B7890] font-medium mt-0.5">Specify core research topics to index your profile in institutional discovery and collaboration directories.</p>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-[#17233D] uppercase tracking-wider">Selected Focus Tags (Max 8)</label>
                    
                    <div className="flex flex-wrap gap-2 p-4 bg-[#F5F7FC] border border-[#E4E9F2] rounded-2xl min-h-[60px]">
                      {selectedInterests.length === 0 ? (
                        <p className="text-[#6B7890] text-xs italic font-medium">No focus tags added yet. Choose from suggestions below or add custom tags.</p>
                      ) : (
                        selectedInterests.map((interest) => (
                          <span
                            key={interest}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#EEF4FF] border border-[#0B4EA2]/30 text-[#0B4EA2]"
                          >
                            <span>#{interest}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveInterest(interest)}
                              className="text-[#0B4EA2] hover:text-[#073B7A] cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
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
                        placeholder="Type research topic and press Enter..."
                        className="w-full bg-[#F5F7FC] border border-[#E4E9F2] rounded-xl pl-9 pr-12 py-3 text-xs font-bold text-[#17233D] outline-none focus:border-[#0B4EA2] focus:ring-2 focus:ring-[#0B4EA2]/20 transition-all"
                      />
                      <Tag className="w-4 h-4 text-[#6B7890] absolute left-3 top-3.5" />
                      <button
                        type="button"
                        onClick={() => handleAddInterest(newInterestInput)}
                        className="absolute right-2 top-2 px-3 py-1.5 rounded-lg bg-[#0B4EA2] text-white hover:bg-[#073B7A] text-xs font-bold transition-colors cursor-pointer"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-[#E4E9F2]">
                    <p className="text-xs font-bold text-[#6B7890] uppercase tracking-wider">Suggested SRMIST Domains</p>
                    <div className="flex flex-wrap gap-2">
                      {interestsList
                        .filter(item => !selectedInterests.includes(item))
                        .map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => handleAddInterest(tag)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#F5F7FC] hover:bg-[#EEF4FF] border border-[#E4E9F2] hover:border-[#0B4EA2]/30 text-[#4A5568] hover:text-[#0B4EA2] transition-all cursor-pointer"
                          >
                            + {tag}
                          </button>
                        ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* SECURITY TAB */}
              {activeSettingsTab === 'security' && (
                <motion.div
                  key="tab-security"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-5"
                >
                  <div className="border-b border-[#E4E9F2] pb-3">
                    <h3 className="text-sm font-extrabold text-[#17233D] uppercase tracking-wider">Account Security & Access</h3>
                    <p className="text-xs text-[#6B7890] font-medium mt-0.5">Verified institutional credentials and authentication mapping.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-[#17233D] uppercase tracking-wider">SRMIST Institutional Email</label>
                      <input
                        type="email"
                        disabled
                        value={currentUser?.email || ''}
                        className="w-full bg-[#F5F7FC] border border-[#E4E9F2] rounded-xl p-3 text-xs font-bold text-[#17233D] cursor-not-allowed font-mono opacity-80"
                      />
                      <p className="text-[11px] text-[#6B7890] font-semibold">Managed via SRMIST institutional identity system</p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-[#17233D] uppercase tracking-wider">Verification Clearance Status</label>
                      <div className="p-4 bg-[#FFF9E6] border border-[#F5B800]/40 rounded-2xl flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#F5B800] text-[#17233D] flex items-center justify-center shrink-0">
                          <Check className="w-5 h-5 stroke-[3px]" />
                        </div>
                        <div>
                          <p className="text-xs font-extrabold text-[#17233D]">Verified Researcher Record</p>
                          <p className="text-[11px] text-[#92400E] font-semibold">Institutional directory synchronization and guide authorization active.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-3 pt-6 border-t border-[#E4E9F2]">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-5 py-2.5 border border-[#E4E9F2] hover:bg-[#EEF4FF] text-[#4A5568] text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-[#0B4EA2] hover:bg-[#073B7A] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Save Settings</span>
                  </>
                )}
              </button>
            </div>

          </form>
        </div>
      </div>

    </div>
  );
}
