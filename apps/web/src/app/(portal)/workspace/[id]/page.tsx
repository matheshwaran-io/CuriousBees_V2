'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { 
  FolderOpen, 
  CheckSquare, 
  Megaphone, 
  UploadCloud, 
  Plus, 
  Calendar, 
  User, 
  ArrowLeft,
  Loader2,
  FileText,
  X,
  Check,
  Download,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function WorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.id as string;

  const { 
    currentUser, 
    activeWorkspace, 
    fetchWorkspaceDetails, 
    addWorkspaceFile, 
    addWorkspaceMilestone, 
    toggleWorkspaceMilestone, 
    addWorkspaceAnnouncement, 
    isLoading 
  } = useStore();

  // Local Form States
  const [activeTab, setActiveTab] = useState<'files' | 'milestones' | 'announcements'>('files');
  const [fileName, setFileName] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [showFileModal, setShowFileModal] = useState(false);

  const [milestoneTitle, setMilestoneTitle] = useState('');
  const [milestoneDesc, setMilestoneDesc] = useState('');
  const [milestoneDueDate, setMilestoneDueDate] = useState('');
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);

  const [announceTitle, setAnnounceTitle] = useState('');
  const [announceContent, setAnnounceContent] = useState('');
  const [showAnnounceModal, setShowAnnounceModal] = useState(false);

  useEffect(() => {
    if (workspaceId) {
      fetchWorkspaceDetails(workspaceId).catch(() => {
        router.push('/dashboard');
      });
    }
  }, [workspaceId, fetchWorkspaceDetails, router]);

  if (isLoading && !activeWorkspace) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">Synchronizing research hub secure node...</p>
      </div>
    );
  }

  if (!activeWorkspace) {
    return (
      <div className="text-center py-12 glass-panel rounded-xl max-w-md mx-auto my-12 space-y-4">
        <AlertTriangle className="w-12 h-12 text-error mx-auto" />
        <h3 className="font-display font-bold text-lg text-on-surface">Workspace Unavailable</h3>
        <p className="text-on-surface-variant text-xs font-semibold leading-relaxed">
          The requested research node does not exist or you do not have credential access clearance.
        </p>
        <button 
          onClick={() => router.push('/dashboard')} 
          className="px-6 py-2 bg-primary text-on-primary rounded-lg text-xs font-semibold hover:bg-on-primary-fixed-variant transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  // Find if current user is owner of workspace
  const userMemberRecord = activeWorkspace.members?.find(m => m.userId === currentUser?.id);
  const isOwner = userMemberRecord?.role === 'OWNER' || currentUser?.role === 'RESEARCH_SUPERVISOR' || currentUser?.role === 'INSTITUTION_ADMIN';

  // Handle file upload
  const handleUploadFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName || !fileUrl) return;

    try {
      // Simulate size in KB
      const simulatedSize = Math.floor(Math.random() * 8000) + 500;
      await addWorkspaceFile(workspaceId, fileName, fileUrl, simulatedSize);
      setFileName('');
      setFileUrl('');
      setShowFileModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  // Handle milestone add
  const handleCreateMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!milestoneTitle) return;

    try {
      await addWorkspaceMilestone(workspaceId, milestoneTitle, milestoneDesc, milestoneDueDate || undefined);
      setMilestoneTitle('');
      setMilestoneDesc('');
      setMilestoneDueDate('');
      setShowMilestoneModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  // Handle announcement add
  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announceTitle || !announceContent) return;

    try {
      await addWorkspaceAnnouncement(workspaceId, announceTitle, announceContent);
      setAnnounceTitle('');
      setAnnounceContent('');
      setShowAnnounceModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  // Get initials for member avatars
  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-stack-lg text-left select-none">
      
      {/* 🔙 BACK HEADER */}
      <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
        <button 
          onClick={() => router.back()} 
          className="flex items-center space-x-2 text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Workspaces</span>
        </button>
        <span className="text-[10px] font-bold text-primary uppercase tracking-widest font-mono flex items-center gap-1">
          <FolderOpen className="w-3.5 h-3.5" />
          <span>Workspace Secure Node</span>
        </span>
      </div>

      {/* 📄 WORKSPACE HEADER DETAILS (Stitch Spec Level 1 Container) */}
      <div className="glass-panel rounded-xl p-stack-lg relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="space-y-4 relative z-10">
          <span className="px-2.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/25 font-label-caps text-[10px] uppercase tracking-wider font-bold">
            Active Research Lab
          </span>
          <h1 className="font-display-lg text-headline-xl sm:text-[32px] font-bold text-on-surface tracking-tight leading-tight">
            {activeWorkspace.title}
          </h1>
          <p className="text-on-surface-variant text-xs sm:text-body-sm max-w-3xl leading-relaxed">
            {activeWorkspace.description || 'Shared institutional workspace for research peer collaboration, file management, and milestones tracking.'}
          </p>

          {/* Members ring */}
          <div className="pt-4 border-t border-outline-variant/20 flex flex-wrap items-center gap-stack-md">
            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase text-[10px] tracking-wider font-semibold">
              Research Group:
            </span>
            <div className="flex flex-wrap items-center gap-4">
              {activeWorkspace.members?.map((member) => (
                <div key={member.userId} className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 border border-outline-variant/30 overflow-hidden flex items-center justify-center shrink-0">
                    {member.user?.image ? (
                      <img src={member.user.image} alt={member.user.name || ''} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-primary">{getInitials(member.user?.name || '')}</span>
                    )}
                  </div>
                  <div className="text-left leading-none">
                    <p className="text-xs font-bold text-on-surface">{member.user?.name}</p>
                    <span className="text-[9px] text-on-surface-variant">
                      {member.role === 'OWNER' ? 'Principal Investigator' : 'Collaborator'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 🎛️ TAB TRIGGERS (Stitch Design aligned) */}
      <div className="flex gap-2 border-b border-outline-variant/30 pb-px">
        <button
          onClick={() => setActiveTab('files')}
          className={`flex items-center space-x-2 pb-3 px-4 font-label-md text-label-md font-semibold cursor-pointer border-b-2 transition-all ${
            activeTab === 'files' ? 'border-primary text-primary font-bold' : 'border-transparent text-on-surface-variant hover:text-primary'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Files & Artifacts</span>
        </button>
        <button
          onClick={() => setActiveTab('milestones')}
          className={`flex items-center space-x-2 pb-3 px-4 font-label-md text-label-md font-semibold cursor-pointer border-b-2 transition-all ${
            activeTab === 'milestones' ? 'border-primary text-primary font-bold' : 'border-transparent text-on-surface-variant hover:text-primary'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Milestones Checklist</span>
        </button>
        <button
          onClick={() => setActiveTab('announcements')}
          className={`flex items-center space-x-2 pb-3 px-4 font-label-md text-label-md font-semibold cursor-pointer border-b-2 transition-all ${
            activeTab === 'announcements' ? 'border-primary text-primary font-bold' : 'border-transparent text-on-surface-variant hover:text-primary'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>Announcements</span>
        </button>
      </div>

      {/* ⚡ TAB CONTENTS */}
      <div className="min-h-[300px] pt-4">
        
        {/* ── FILES TAB ── */}
        {activeTab === 'files' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-headline-md text-sm uppercase tracking-wider text-on-surface font-semibold">Shared Documents</h3>
              <button 
                onClick={() => setShowFileModal(true)} 
                className="flex items-center space-x-1.5 px-4 py-2 bg-primary hover:bg-primary-container hover:text-on-primary-container text-on-primary text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Upload Document</span>
              </button>
            </div>

            {activeWorkspace.files && activeWorkspace.files.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-gutter">
                {activeWorkspace.files.map((file) => (
                  <div 
                    key={file.id} 
                    className="glass-panel rounded-lg p-stack-sm flex items-start justify-between border border-outline-variant/30 hover:border-primary/50 transition-colors group"
                  >
                    <div className="flex items-start space-x-3 text-left min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-on-surface truncate group-hover:text-primary transition-colors" title={file.name}>
                          {file.name}
                        </h4>
                        <p className="text-[10px] text-on-surface-variant mt-0.5">
                          Uploaded by {file.uploadedBy?.name || 'Academic'} | {file.size} KB
                        </p>
                      </div>
                    </div>
                    <a 
                      href={file.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-xs font-semibold text-primary hover:underline shrink-0 ml-2 flex items-center gap-0.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center border border-dashed border-outline-variant/40 rounded-xl text-on-surface-variant bg-white/5 flex flex-col items-center justify-center space-y-2">
                <FolderOpen className="w-8 h-8 text-outline" />
                <span className="text-xs font-semibold">No files or scientific proposals shared yet.</span>
              </div>
            )}
          </div>
        )}

        {/* ── MILESTONES TAB ── */}
        {activeTab === 'milestones' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-headline-md text-sm uppercase tracking-wider text-on-surface font-semibold">Research Checklist</h3>
              {isOwner && (
                <button 
                  onClick={() => setShowMilestoneModal(true)} 
                  className="flex items-center space-x-1.5 px-4 py-2 bg-primary hover:bg-primary-container hover:text-on-primary-container text-on-primary text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Milestone</span>
                </button>
              )}
            </div>

            {activeWorkspace.milestones && activeWorkspace.milestones.length > 0 ? (
              <div className="glass-panel rounded-lg border border-outline-variant/30 divide-y divide-outline-variant/20 overflow-hidden bg-white">
                {activeWorkspace.milestones.map((milestone) => (
                  <div key={milestone.id} className="p-4 flex items-start space-x-3 text-left hover:bg-surface-container-low/20 transition-colors">
                    <input 
                      type="checkbox" 
                      checked={milestone.completed}
                      onChange={(e) => toggleWorkspaceMilestone(workspaceId, milestone.id, e.target.checked)}
                      className="w-4 h-4 rounded text-primary border-outline-variant focus:ring-primary focus:ring-offset-0 cursor-pointer mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-xs font-bold leading-tight ${milestone.completed ? 'line-through text-outline' : 'text-on-surface'}`}>
                        {milestone.title}
                      </h4>
                      {milestone.description && (
                        <p className={`text-xs mt-1 ${milestone.completed ? 'text-outline' : 'text-on-surface-variant'}`}>
                          {milestone.description}
                        </p>
                      )}
                      {milestone.dueDate && (
                        <div className="flex items-center text-[10px] text-outline mt-2">
                          <Calendar className="w-3.5 h-3.5 mr-1" />
                          <span>Due {new Date(milestone.dueDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center border border-dashed border-outline-variant/40 rounded-xl text-on-surface-variant bg-white/5 flex flex-col items-center justify-center space-y-2">
                <CheckSquare className="w-8 h-8 text-outline" />
                <span className="text-xs font-semibold">No milestone checks registered in this node.</span>
              </div>
            )}
          </div>
        )}

        {/* ── ANNOUNCEMENTS TAB ── */}
        {activeTab === 'announcements' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-headline-md text-sm uppercase tracking-wider text-on-surface font-semibold">Synergy Broadcasts</h3>
              <button 
                onClick={() => setShowAnnounceModal(true)} 
                className="flex items-center space-x-1.5 px-4 py-2 bg-primary hover:bg-primary-container hover:text-on-primary-container text-on-primary text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                <Megaphone className="w-4 h-4" />
                <span>Post Broadcast</span>
              </button>
            </div>

            {activeWorkspace.announcements && activeWorkspace.announcements.length > 0 ? (
              <div className="space-y-4">
                {activeWorkspace.announcements.map((announce) => (
                  <div 
                    key={announce.id} 
                    className="glass-panel rounded-lg p-stack-md border border-outline-variant/30 space-y-3 bg-white text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 border border-outline-variant/30 overflow-hidden flex items-center justify-center shrink-0">
                          {announce.author?.image ? (
                            <img src={announce.author.image} alt={announce.author.name || ''} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[11px] font-bold text-primary">{getInitials(announce.author?.name || '')}</span>
                          )}
                        </div>
                        <div className="text-left leading-none">
                          <h4 className="text-xs font-bold text-on-surface">{announce.author?.name}</h4>
                          <span className="text-[9px] text-outline">Posted {new Date(announce.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-xs font-bold text-primary">{announce.title}</h3>
                      <p className="text-xs text-on-surface-variant leading-relaxed">{announce.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center border border-dashed border-outline-variant/40 rounded-xl text-on-surface-variant bg-white/5 flex flex-col items-center justify-center space-y-2">
                <Megaphone className="w-8 h-8 text-outline" />
                <span className="text-xs font-semibold">No announcements broadcasted.</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── MODALS SECTION (Animated with Backdrop Blurs) ── */}
      <AnimatePresence>
        
        {/* MODAL 1: ADD FILE */}
        {showFileModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFileModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-panel bg-white/95 rounded-xl border border-outline-variant/40 p-stack-lg max-w-sm w-full shadow-2xl space-y-4 relative z-10 text-left"
            >
              <div className="flex justify-between items-center border-b border-outline-variant/30 pb-2">
                <h3 className="font-headline-md text-sm font-bold text-on-surface uppercase tracking-wider">Share Document</h3>
                <button onClick={() => setShowFileModal(false)} className="p-0.5 hover:bg-surface-container-high rounded transition">
                  <X className="w-4 h-4 text-outline" />
                </button>
              </div>
              <form onSubmit={handleUploadFile} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">File Name</label>
                  <input 
                    type="text" 
                    required
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    placeholder="e.g. ResearchDraft_V1.pdf"
                    className="w-full bg-transparent border-0 border-b border-outline-variant focus:border-primary focus:ring-0 py-2 font-body-sm text-body-sm text-on-surface placeholder:text-outline/70 transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Document URL</label>
                  <input 
                    type="url" 
                    required
                    value={fileUrl}
                    onChange={(e) => setFileUrl(e.target.value)}
                    placeholder="e.g. https://storage.srmist.edu/files/draft.pdf"
                    className="w-full bg-transparent border-0 border-b border-outline-variant focus:border-primary focus:ring-0 py-2 font-body-sm text-body-sm text-on-surface placeholder:text-outline/70 transition-colors"
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-4 border-t border-outline-variant/20">
                  <button 
                    type="button" 
                    onClick={() => setShowFileModal(false)}
                    className="px-4 py-2 border border-outline-variant/50 hover:bg-surface-container text-xs font-semibold rounded-lg transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-5 py-2 bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container rounded-lg text-xs font-semibold shadow transition cursor-pointer"
                  >
                    Upload Document
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* MODAL 2: ADD MILESTONE */}
        {showMilestoneModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMilestoneModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-panel bg-white/95 rounded-xl border border-outline-variant/40 p-stack-lg max-w-sm w-full shadow-2xl space-y-4 relative z-10 text-left"
            >
              <div className="flex justify-between items-center border-b border-outline-variant/30 pb-2">
                <h3 className="font-headline-md text-sm font-bold text-on-surface uppercase tracking-wider">New Research Milestone</h3>
                <button onClick={() => setShowMilestoneModal(false)} className="p-0.5 hover:bg-surface-container-high rounded transition">
                  <X className="w-4 h-4 text-outline" />
                </button>
              </div>
              <form onSubmit={handleCreateMilestone} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Milestone Title</label>
                  <input 
                    type="text" 
                    required
                    value={milestoneTitle}
                    onChange={(e) => setMilestoneTitle(e.target.value)}
                    placeholder="e.g. Literature Review Compilation"
                    className="w-full bg-transparent border-0 border-b border-outline-variant focus:border-primary focus:ring-0 py-2 font-body-sm text-body-sm text-on-surface placeholder:text-outline/70 transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Description</label>
                  <textarea 
                    value={milestoneDesc}
                    onChange={(e) => setMilestoneDesc(e.target.value)}
                    placeholder="Outline the detailed checklist objectives..."
                    className="w-full bg-transparent border border-outline-variant rounded-lg p-3 font-sans text-body-sm leading-relaxed text-on-surface placeholder:text-outline/70 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-colors resize-none h-[64px]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Due Date</label>
                  <input 
                    type="date" 
                    value={milestoneDueDate}
                    onChange={(e) => setMilestoneDueDate(e.target.value)}
                    className="w-full bg-transparent border-0 border-b border-outline-variant focus:border-primary focus:ring-0 py-2 font-body-sm text-body-sm text-on-surface transition-colors outline-none cursor-pointer"
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-4 border-t border-outline-variant/20">
                  <button 
                    type="button" 
                    onClick={() => setShowMilestoneModal(false)}
                    className="px-4 py-2 border border-outline-variant/50 hover:bg-surface-container text-xs font-semibold rounded-lg transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-5 py-2 bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container rounded-lg text-xs font-semibold shadow transition cursor-pointer"
                  >
                    Create Milestone
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* MODAL 3: ADD ANNOUNCEMENT */}
        {showAnnounceModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAnnounceModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-panel bg-white/95 rounded-xl border border-outline-variant/40 p-stack-lg max-w-sm w-full shadow-2xl space-y-4 relative z-10 text-left"
            >
              <div className="flex justify-between items-center border-b border-outline-variant/30 pb-2">
                <h3 className="font-headline-md text-sm font-bold text-on-surface uppercase tracking-wider">Synergy Broadcast</h3>
                <button onClick={() => setShowAnnounceModal(false)} className="p-0.5 hover:bg-surface-container-high rounded transition">
                  <X className="w-4 h-4 text-outline" />
                </button>
              </div>
              <form onSubmit={handleCreateAnnouncement} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Subject Title</label>
                  <input 
                    type="text" 
                    required
                    value={announceTitle}
                    onChange={(e) => setAnnounceTitle(e.target.value)}
                    placeholder="e.g. Weekly Sync Rescheduled"
                    className="w-full bg-transparent border-0 border-b border-outline-variant focus:border-primary focus:ring-0 py-2 font-body-sm text-body-sm text-on-surface placeholder:text-outline/70 transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Content Message</label>
                  <textarea 
                    required
                    value={announceContent}
                    onChange={(e) => setAnnounceContent(e.target.value)}
                    placeholder="Write the announcement details..."
                    className="w-full bg-transparent border border-outline-variant rounded-lg p-3 font-sans text-body-sm leading-relaxed text-on-surface placeholder:text-outline/70 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-colors resize-none h-[90px]"
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-4 border-t border-outline-variant/20">
                  <button 
                    type="button" 
                    onClick={() => setShowAnnounceModal(false)}
                    className="px-4 py-2 border border-outline-variant/50 hover:bg-surface-container text-xs font-semibold rounded-lg transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-5 py-2 bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container rounded-lg text-xs font-semibold shadow transition cursor-pointer"
                  >
                    Post Broadcast
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

      </AnimatePresence>

    </div>
  );
}
