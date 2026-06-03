'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useStore } from '@/store/useStore';
import { SRM_DEPARTMENTS } from '@curiousbees/shared-utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UpdateProfileSchema } from '@curiousbees/shared-utils';
import { UserRole } from '@curiousbees/types';
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
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProfilePage() {
  const { currentUser, updateProfile, interestsList, roleOverride, threads, collaborators, fetchCollaborators } = useStore();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    currentUser?.interests?.map((i) => i.interest?.name || '') || []
  );
  const [newInterestInput, setNewInterestInput] = useState('');

  useEffect(() => {
    fetchCollaborators();
  }, [fetchCollaborators]);

  // Setup form validation via React Hook Form and Zod
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm({
    resolver: zodResolver(UpdateProfileSchema),
    defaultValues: {
      name: currentUser?.name || '',
      role: currentUser?.role || 'PHD_SCHOLAR',
      department: currentUser?.department || '',
      bio: currentUser?.bio || '',
    }
  });

  // Keep form in sync when currentUser loads
  useEffect(() => {
    if (currentUser) {
      reset({
        name: currentUser.name || '',
        role: currentUser.role || 'PHD_SCHOLAR',
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

  // Initials for avatar and network graph
  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'CB';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  // Collaborators to display on the network graph
  const graphCollaborators = collaborators
    .filter(c => c.id !== currentUser?.id)
    .slice(0, 3);

  // Fallback default network nodes if collaborators directory is empty
  const defaultNetwork = [
    { initials: 'JD', name: 'Dr. Jane Du' },
    { initials: 'AM', name: 'Dr. Alan M.' },
    { initials: 'KL', name: 'Dr. Kevin Lin' }
  ];

  const networkNodes = graphCollaborators.length >= 3 
    ? graphCollaborators.map(c => ({ initials: getInitials(c.name), name: c.name || '' }))
    : defaultNetwork;

  // Render stats based on user role
  const isFaculty = roleOverride === 'FACULTY';
  const citationsVal = isFaculty ? 142 : 24;
  const publicationsVal = userThreads.length > 0 ? userThreads.length : (isFaculty ? 12 : 3);
  const thirdStatName = isFaculty ? 'Active Grants' : 'Workspace Synergy';
  const thirdStatVal = isFaculty ? 8 : '94%';

  return (
    <div className="space-y-stack-lg max-w-container-max mx-auto select-none">
      
      {/* 🚀 Profile Header Banner (Stitch Spec Level 1 Container) */}
      <div className="glass-panel rounded-xl p-stack-lg mb-stack-lg relative overflow-hidden text-left">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col lg:flex-row gap-stack-lg items-start lg:items-center relative z-10">
          
          {/* Avatar Area */}
          <div className="relative shrink-0">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-surface shadow-sm shrink-0 bg-primary-container flex items-center justify-center">
              {currentUser?.image ? (
                <img 
                  src={currentUser.image} 
                  alt={currentUser.name || 'User Profile'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-4xl font-display font-bold text-primary">
                  {getInitials(currentUser?.name)}
                </span>
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center text-primary shadow">
              <Sparkles className="w-4 h-4 text-secondary-fixed-dim fill-secondary-fixed-dim" />
            </div>
          </div>

          {/* User Bio and Basic Information */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-stack-sm mb-stack-xs">
              <h2 className="font-display-lg text-headline-xl sm:text-[36px] font-bold text-on-surface leading-tight tracking-tight">
                {currentUser?.name || 'Academic Scholar'}
              </h2>
              <span className="px-3 py-1 bg-secondary-container/20 text-on-secondary-container rounded-full font-label-caps text-label-caps border border-secondary-container/30">
                {isFaculty ? 'Principal Investigator' : 'PhD Research Scholar'}
              </span>
            </div>
            
            <p className="font-body-lg text-body-lg text-on-surface-variant mb-stack-md">
              {currentUser?.department || 'Department of Computing Technologies'} • SRMIST
            </p>

            {/* Top 3 Research Interests Tags */}
            <div className="flex flex-wrap gap-stack-sm mb-stack-md">
              {selectedInterests.slice(0, 3).map((interest) => (
                <span 
                  key={interest}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full font-label-caps text-[11px] border border-primary/20"
                >
                  <Tag className="w-3 h-3" />
                  {interest}
                </span>
              ))}
              {selectedInterests.length === 0 && (
                <span className="text-xs text-on-surface-variant italic font-medium">
                  No research domains pinned. Click edit to add focus areas.
                </span>
              )}
            </div>

            {/* CTA / Operations Buttons */}
            <div className="flex flex-wrap gap-stack-sm">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-6 py-2 bg-primary text-on-primary rounded-lg font-label-md text-label-md hover:bg-on-primary-fixed-variant transition-colors shadow-sm flex items-center gap-1.5"
              >
                <Edit3 className="w-4 h-4" />
                <span>{isEditing ? 'Cancel Edit' : 'Edit Profile'}</span>
              </button>
              <button 
                onClick={() => alert(`Share link generated: ${window.location.origin}/profile/${currentUser?.id || ''}`)}
                className="px-6 py-2 bg-transparent text-primary border border-primary rounded-lg font-label-md text-label-md hover:bg-primary/5 transition-colors flex items-center gap-1.5"
              >
                <Share2 className="w-4 h-4" />
                <span>Share Profile</span>
              </button>
            </div>
          </div>

          {/* Quick Stats Widget Panel */}
          <div className="flex md:flex-row lg:flex-col gap-stack-md w-full lg:w-auto lg:ml-auto glass-overlay p-stack-md rounded-lg border border-outline-variant/30 text-center lg:text-left justify-around lg:justify-start">
            <div className="px-2">
              <div className="font-headline-xl text-headline-xl text-primary font-bold">{citationsVal}</div>
              <div className="font-label-caps text-label-caps text-on-surface-variant uppercase text-[10px] tracking-wider font-semibold">Citations</div>
            </div>
            <div className="w-[1px] lg:h-[1px] lg:w-full bg-outline-variant/30 my-1"></div>
            <div className="px-2">
              <div className="font-headline-xl text-headline-xl text-primary font-bold">{publicationsVal}</div>
              <div className="font-label-caps text-label-caps text-on-surface-variant uppercase text-[10px] tracking-wider font-semibold">Publications</div>
            </div>
            <div className="w-[1px] lg:h-[1px] lg:w-full bg-outline-variant/30 my-1"></div>
            <div className="px-2">
              <div className="font-headline-xl text-headline-xl text-primary font-bold">{thirdStatVal}</div>
              <div className="font-label-caps text-label-caps text-on-surface-variant uppercase text-[10px] tracking-wider font-semibold">{thirdStatName}</div>
            </div>
          </div>

        </div>
      </div>

      {/* ⚡ Transition Panel (Bento Grid vs. Edit Form) */}
      <AnimatePresence mode="wait">
        {!isEditing ? (
          <motion.div
            key="profile-display"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-gutter text-left"
          >
            {/* ── LEFT COLUMN: Biography & Skills Matrix ── */}
            <div className="lg:col-span-1 flex flex-col gap-gutter">
              
              {/* Biography Block */}
              <div className="glass-panel rounded-xl p-stack-md flex flex-col justify-between">
                <div>
                  <h3 className="font-headline-md text-headline-md text-on-surface mb-stack-sm flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    <span>Biography</span>
                  </h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed whitespace-pre-line">
                    {currentUser?.bio || 
                      'Introduce your scientific projects, grant pipelines, and collaboration requirements. Hit Edit Profile to complete your details.'}
                  </p>
                </div>
                
                {/* Additional metadata info block */}
                <div className="mt-stack-md pt-stack-sm border-t border-outline-variant/30 flex justify-between items-center text-[11px] text-on-surface-variant">
                  <span className="flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>Verified Guide</span>
                  </span>
                  <span className="font-mono">{currentUser?.email}</span>
                </div>
              </div>

              {/* Skills Matrix / Research Domains */}
              <div className="glass-panel rounded-xl p-stack-md">
                <h3 className="font-headline-md text-headline-md text-on-surface mb-stack-md flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" />
                  <span>Skills Matrix</span>
                </h3>
                <div className="space-y-stack-sm">
                  {selectedInterests.length > 0 ? (
                    selectedInterests.map((interest, idx) => {
                      // Simulated descending proficiency scores for realistic design display
                      const proficiencies = ['90%', '85%', '75%', '60%', '50%'];
                      const labels = ['Advanced', 'Advanced', 'Proficient', 'Proficient', 'Intermediate'];
                      const profVal = proficiencies[idx] || '45%';
                      const labelVal = labels[idx] || 'Competent';
                      
                      return (
                        <div key={interest}>
                          <div className="flex justify-between font-label-caps text-[12px] mb-1">
                            <span className="text-on-surface font-semibold">{interest}</span>
                            <span className="text-primary font-bold">{labelVal}</span>
                          </div>
                          <div className="h-1.5 w-full bg-surface-variant rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full transition-all duration-500" 
                              style={{ width: profVal }}
                            ></div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-6 text-xs text-on-surface-variant italic">
                      No research skills defined. Update your focus tags to populate the matrix.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── RIGHT COLUMN: Collaboration Network & Publications ── */}
            <div className="lg:col-span-2 flex flex-col gap-gutter">
              
              {/* Collaboration Network Panel */}
              <div className="glass-panel rounded-xl p-stack-md min-h-[300px] flex flex-col justify-between">
                <div className="flex justify-between items-center mb-stack-sm">
                  <h3 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
                    <Network className="w-5 h-5 text-primary" />
                    <span>Collaboration Network</span>
                  </h3>
                  <Link 
                    href="/researchers"
                    className="text-primary text-label-md font-label-md hover:underline font-semibold"
                  >
                    Find Peers
                  </Link>
                </div>
                
                {/* Network Graph Simulator Box */}
                <div className="flex-grow min-h-[220px] bg-surface-container-low rounded-lg border border-outline-variant/50 relative overflow-hidden flex items-center justify-center">
                  <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#004495 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                  
                  {/* Center Node (Self) */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-primary text-on-primary rounded-full flex flex-col items-center justify-center shadow-lg z-10 border-2 border-surface">
                    <span className="font-display font-bold text-xs leading-none">{getInitials(currentUser?.name)}</span>
                    <span className="text-[7px] font-label-caps uppercase mt-0.5 opacity-80">Self</span>
                  </div>

                  {/* SVG Connection Lines */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
                    <line stroke="#c3c6d6" strokeWidth="1.5" strokeDasharray="4 4" x1="50%" y1="50%" x2="30%" y2="25%" />
                    <line stroke="#c3c6d6" strokeWidth="1.5" strokeDasharray="4 4" x1="50%" y1="50%" x2="72%" y2="35%" />
                    <line stroke="#c3c6d6" strokeWidth="1.5" strokeDasharray="4 4" x1="50%" y1="50%" x2="42%" y2="80%" />
                  </svg>

                  {/* Node 1 */}
                  <div className="absolute top-[18%] left-[24%] w-10 h-10 bg-surface text-on-surface rounded-full flex flex-col items-center justify-center shadow border border-outline-variant z-10 hover:scale-105 transition-transform" title={networkNodes[0].name}>
                    <span className="font-display font-semibold text-[10px] text-primary">{networkNodes[0].initials}</span>
                    <span className="text-[6px] text-on-surface-variant leading-none mt-0.5 truncate max-w-[32px]">{networkNodes[0].name.split(' ')[0]}</span>
                  </div>

                  {/* Node 2 */}
                  <div className="absolute top-[28%] right-[20%] w-11 h-11 bg-secondary-container/20 text-on-secondary-container rounded-full flex flex-col items-center justify-center shadow border border-secondary-container/30 z-10 hover:scale-105 transition-transform" title={networkNodes[1].name}>
                    <span className="font-display font-semibold text-[10px] text-on-secondary-container">{networkNodes[1].initials}</span>
                    <span className="text-[6px] text-on-surface-variant leading-none mt-0.5 truncate max-w-[36px]">{networkNodes[1].name.split(' ')[0]}</span>
                  </div>

                  {/* Node 3 */}
                  <div className="absolute bottom-[16%] left-[38%] w-10 h-10 bg-surface text-on-surface rounded-full flex flex-col items-center justify-center shadow border border-outline-variant z-10 hover:scale-105 transition-transform" title={networkNodes[2].name}>
                    <span className="font-display font-semibold text-[10px] text-primary">{networkNodes[2].initials}</span>
                    <span className="text-[6px] text-on-surface-variant leading-none mt-0.5 truncate max-w-[32px]">{networkNodes[2].name.split(' ')[0]}</span>
                  </div>
                </div>
              </div>

              {/* Publications & Discussion Proposals list */}
              <div className="glass-panel rounded-xl p-stack-md text-left">
                <div className="flex justify-between items-center mb-stack-md">
                  <h3 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary" />
                    <span>Recent Activity & Publications</span>
                  </h3>
                  <Link 
                    href="/threads" 
                    className="text-primary text-label-md font-label-md hover:underline flex items-center gap-1 font-semibold"
                  >
                    <span>View All Feed</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                
                <div className="space-y-stack-sm">
                  {userThreads.length > 0 ? (
                    userThreads.slice(0, 3).map((thread) => (
                      <div 
                        key={thread.id} 
                        className="p-stack-sm rounded-lg border border-outline-variant/30 hover:bg-surface-container-low transition-colors group cursor-pointer"
                      >
                        <div className="flex gap-3 items-start">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                            <Layers className="w-4.5 h-4.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <Link href={`/threads/${thread.id}`}>
                              <h4 className="font-headline-md text-headline-md text-on-surface group-hover:text-primary transition-colors text-sm font-semibold leading-snug truncate">
                                {thread.title}
                              </h4>
                            </Link>
                            <p className="font-body-sm text-[12px] text-on-surface-variant mt-1">
                              Published {new Date(thread.createdAt).toLocaleDateString()} • Stage Proposal
                            </p>
                            <div className="flex gap-2 mt-2">
                              <span className="text-[10px] text-on-surface-variant font-label-caps px-2 py-0.5 bg-surface-variant rounded font-semibold">
                                {thread.tags?.[0] || 'General'}
                              </span>
                              <span className="text-[10px] text-primary font-label-caps px-2 py-0.5 bg-primary/10 rounded flex items-center gap-1 font-bold">
                                {thread.comments?.length || 0} Discussions
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <>
                      {/* Placeholder publications for premium visual richness */}
                      <div className="p-stack-sm rounded-lg border border-outline-variant/30 hover:bg-surface-container-low transition-colors group cursor-pointer">
                        <div className="flex gap-3 items-start">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                            <Layers className="w-4.5 h-4.5" />
                          </div>
                          <div>
                            <h4 className="font-headline-md text-headline-md text-on-surface group-hover:text-primary transition-colors text-sm font-semibold leading-snug">
                              Quantum Error Correction in Synthetic DNA Sequencing
                            </h4>
                            <p className="font-body-sm text-[12px] text-on-surface-variant mt-1">
                              Nature Computational Science • Published Oct 2023
                            </p>
                            <div className="flex gap-2 mt-2">
                              <span className="text-[10px] text-on-surface-variant font-label-caps px-2 py-0.5 bg-surface-variant rounded font-semibold">
                                Peer Reviewed
                              </span>
                              <span className="text-[10px] text-primary font-label-caps px-2 py-0.5 bg-primary/10 rounded flex items-center gap-1 font-bold">
                                42 Citations
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-stack-sm rounded-lg border border-outline-variant/30 hover:bg-surface-container-low transition-colors group cursor-pointer">
                        <div className="flex gap-3 items-start">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                            <Layers className="w-4.5 h-4.5" />
                          </div>
                          <div>
                            <h4 className="font-headline-md text-headline-md text-on-surface group-hover:text-primary transition-colors text-sm font-semibold leading-snug">
                              Algorithmic Approaches to Protein Folding via Qubits
                            </h4>
                            <p className="font-body-sm text-[12px] text-on-surface-variant mt-1">
                              Journal of Bioinformatics • Published May 2023
                            </p>
                            <div className="flex gap-2 mt-2">
                              <span className="text-[10px] text-on-surface-variant font-label-caps px-2 py-0.5 bg-surface-variant rounded font-semibold">
                                Open Access
                              </span>
                              <span className="text-[10px] text-primary font-label-caps px-2 py-0.5 bg-primary/10 rounded flex items-center gap-1 font-bold">
                                18 Citations
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

            </div>

          </motion.div>
        ) : (
          /* ── PROFILE EDITOR FORM ── */
          <motion.div
            key="profile-edit"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-gutter text-left"
          >
            {/* Form Editor Left Card */}
            <form 
              onSubmit={handleSubmit(onSubmit)} 
              className="lg:col-span-8 glass-panel rounded-xl p-stack-lg border border-outline-variant/30 space-y-6 bg-white"
            >
              <span className="text-[11px] font-bold text-primary uppercase tracking-widest block border-b border-outline-variant/30 pb-2">
                ⚙️ Update Academic Biography & Roles
              </span>

              <div className="space-y-4">
                {/* 1. Name */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Full Name</label>
                  <input
                    type="text"
                    {...register('name')}
                    className="w-full bg-transparent border-0 border-b border-outline-variant focus:border-primary focus:ring-0 py-2 font-body-md text-body-md text-on-surface placeholder:text-outline transition-colors"
                    placeholder="E.g. Dr. Ramesh Kumar"
                  />
                  {errors.name && <p className="text-[11px] text-error mt-1 font-semibold">{errors.name.message as string}</p>}
                </div>

                {/* 2. Role Switch */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Portal Academic Role</label>
                  <select
                    {...register('role')}
                    className="w-full bg-transparent border-0 border-b border-outline-variant focus:border-primary focus:ring-0 py-2 font-body-md text-body-md text-on-surface transition-colors cursor-pointer"
                  >
                    <option value="PHD_SCHOLAR">PhD Scholar</option>
                    <option value="FACULTY">Verified Faculty Guide</option>
                  </select>
                  {errors.role && <p className="text-[11px] text-error mt-1 font-semibold">{errors.role.message as string}</p>}
                </div>

                {/* 3. Department Selection */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Academic Department</label>
                  <select
                    {...register('department')}
                    className="w-full bg-transparent border-0 border-b border-outline-variant focus:border-primary focus:ring-0 py-2 font-body-md text-body-md text-on-surface transition-colors cursor-pointer"
                  >
                    <option value="">Select Department</option>
                    {SRM_DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                  {errors.department && <p className="text-[11px] text-error mt-1 font-semibold">{errors.department.message as string}</p>}
                </div>

                {/* 4. Bio rich description */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Research Biography</label>
                  <textarea
                    rows={6}
                    {...register('bio')}
                    className="w-full bg-transparent border border-outline-variant rounded-lg p-3 font-sans text-body-sm leading-relaxed text-on-surface placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-colors"
                    placeholder="Outline your research focus, grants secured, and lab equipment availability..."
                  />
                  {errors.bio && <p className="text-[11px] text-error mt-1 font-semibold">{errors.bio.message as string}</p>}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant/30">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider text-on-surface-variant hover:bg-surface-container-high transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider text-on-primary bg-primary hover:bg-primary-container transition-all flex items-center gap-1.5 cursor-pointer shadow"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4 shrink-0" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Form Editor Right Card: Research Domains Editor */}
            <div className="lg:col-span-4 glass-panel rounded-xl p-stack-lg bg-white flex flex-col justify-between space-y-6">
              <div>
                <h3 className="font-headline-md text-headline-md text-on-surface mb-stack-sm flex items-center gap-2 border-b border-outline-variant/30 pb-2">
                  <Tag className="w-4.5 h-4.5 text-primary" />
                  <span>Research Domains</span>
                </h3>

                <p className="text-xs text-on-surface-variant leading-relaxed mb-4">
                  Define your scholarly focus areas. Pinned fields index your node inside the Expert Collaborators Directory search.
                </p>

                {/* Current Tag Pool */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {selectedInterests.length === 0 ? (
                    <p className="text-on-surface-variant text-xs italic leading-relaxed">No domains pinned yet. Add some below.</p>
                  ) : (
                    selectedInterests.map((interest) => (
                      <span
                        key={interest}
                        className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-primary/5 border border-primary/20 text-primary"
                      >
                        <span>{interest}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveInterest(interest)}
                          className="ml-1 text-primary/60 hover:text-primary p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))
                  )}
                </div>

                {/* Input for new tag */}
                <div className="relative">
                  <input
                    type="text"
                    value={newInterestInput}
                    onChange={(e) => setNewInterestInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddInterest(newInterestInput))}
                    placeholder="Type focus area and press Enter..."
                    className="w-full bg-transparent border-0 border-b border-outline-variant focus:border-primary focus:ring-0 pl-7 pr-10 py-2 font-body-sm text-body-sm text-on-surface placeholder:text-outline transition-colors"
                  />
                  <Tag className="w-3.5 h-3.5 text-outline absolute left-1 top-3" />
                  <button
                    type="button"
                    onClick={() => handleAddInterest(newInterestInput)}
                    className="absolute right-1.5 top-1.5 p-1 rounded bg-surface-container-high text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Suggestions Area */}
              <div className="pt-4 border-t border-outline-variant/30 space-y-3">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Suggested Fields</p>
                <div className="flex flex-wrap gap-1.5">
                  {interestsList
                    .filter(item => !selectedInterests.includes(item))
                    .map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleAddInterest(tag)}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/30 text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                      >
                        + {tag}
                      </button>
                    ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
