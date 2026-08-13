'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { getProfileImageUrl } from '@/lib/avatar';
import { 
  Network, 
  Search, 
  Users, 
  ArrowUpRight, 
  Plus, 
  FileText, 
  UploadCloud, 
  Check, 
  X, 
  Clock, 
  ArrowLeft,
  Calendar,
  BookOpen,
  Send,
  MessageSquare,
  ShieldCheck,
  Download,
  Info,
  Activity,
  Award,
  BookMarked
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api-client';

interface CollaborationFile {
  name: string;
  url: string;
  size: string;
  uploadedBy: string;
  date: string;
}

export function CuriousNexusHub({ initialView = 'messages', initialUserId }: { initialView?: string; initialUserId?: string | null }) {
  const router = useRouter();
  const { 
    currentUser, 
    workspaces, 
    activeWorkspace, 
    myScholars,
    pendingApprovals,
    collaborationRequests,
    fetchWorkspaces,
    fetchWorkspaceDetails,
    addWorkspaceFile,
    fetchMyScholars,
    fetchPendingApprovals,
    fetchCollaborationRequests,
    approveScholar,
    declineScholar,
    updateCollaborationRequest,
    addToast,
    myCollaborations,
    myCollabRequests,
    fetchMyCollaborations,
    fetchMyCollabRequests,
    fetchCollabMessages,
    sendCollabMessage,
    acceptCollabRequest,
    declineCollabRequest
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [openedCollabId, setOpenedCollabId] = useState<string | null>(initialUserId ? initialUserId : null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [replyingTo, setReplyingTo] = useState<any | null>(null);
  
  // File Upload Modal States
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileUrl, setNewFileUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  // Resolved scholar's supervisor details
  const [supervisorProfile, setSupervisorProfile] = useState<any>(null);

  // Connection Role Check
  const isSupervisor = currentUser?.role === 'RESEARCH_SUPERVISOR';
  const isScholar = currentUser?.role === 'RESEARCH_SCHOLAR';
  const hasAccess = isSupervisor || isScholar;

  // Mount Fetching Data
  useEffect(() => {
    if (!currentUser) return;
    
    fetchWorkspaces();
    
    if (isSupervisor) {
      fetchMyScholars();
      fetchPendingApprovals();
    }
    
    // Controlled Research Collaborations
    fetchMyCollaborations();
    fetchMyCollabRequests();

    if (isScholar && currentUser.supervisorId) {
      apiFetch(`/api/users/${currentUser.supervisorId}/profile`)
        .then((res) => {
          if (res.ok) return res.json();
        })
        .then((data) => {
          if (data) setSupervisorProfile(data);
        })
        .catch((err) => console.error('Failed to fetch supervisor details:', err));
    }
  }, [currentUser, isSupervisor, isScholar]);

  // Compile Active Collaborations list
  const activeCollaborations = useMemo(() => {
    return myCollaborations.map((c) => {
      const partner = c.requesterId === currentUser?.id ? c.recipient : c.requester;
      return {
        id: c.id,
        type: c.workspaceId ? 'project' : 'collaboration',
        title: c.thread?.title ? `Collab: ${c.thread.title}` : `Research Collaboration`,
        partner: partner ? {
          id: partner.id,
          name: partner.name,
          role: partner.role,
          roleLabel: partner.role === 'RESEARCH_SUPERVISOR' ? 'Research Supervisor' : 'Research Scholar',
          department: partner.department || 'SRMIST',
          image: partner.image
        } : null,
        description: `Research collaboration focused on institutional research.`,
        topic: c.thread?.title || 'General Research',
        objective: 'Improve project-based research synergy and co-author publications.',
        status: c.status,
        workspaceId: c.workspaceId,
        startedAt: new Date(c.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        participants: [
          { id: currentUser?.id, name: currentUser?.name, role: currentUser?.role, image: currentUser?.image },
          partner ? { id: partner.id, name: partner.name, role: partner.role, image: partner.image } : null
        ].filter(Boolean)
      };
    });
  }, [currentUser, myCollaborations]);

  // Selected Collaboration Object
  const selectedCollab = useMemo(() => {
    if (!openedCollabId) return null;
    return activeCollaborations.find((c) => c.id === openedCollabId) || null;
  }, [activeCollaborations, openedCollabId]);

  // Sync workspace details when selecting a project collaboration
  useEffect(() => {
    if (selectedCollab && selectedCollab.type === 'project' && selectedCollab.workspaceId) {
      fetchWorkspaceDetails(selectedCollab.workspaceId);
    }
  }, [openedCollabId, selectedCollab]);

  // Load actual DB messages
  useEffect(() => {
    if (openedCollabId && selectedCollab) {
      fetchCollabMessages(openedCollabId).then((msgs) => {
        setMessages(msgs.map((m: any) => ({
          id: m.id,
          senderId: m.senderId,
          senderName: m.sender?.name || 'Unknown',
          senderImage: m.sender?.image || null,
          content: m.content,
          timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        })));
      });
    } else {
      setMessages([]);
    }
    setReplyingTo(null);
  }, [openedCollabId, fetchCollabMessages, selectedCollab]);

  // Filtered collaborations list (ONLY searches when collaborations exist)
  const filteredCollaborations = useMemo(() => {
    if (activeCollaborations.length === 0) return [];
    return activeCollaborations.filter((c) => {
      const q = searchQuery.toLowerCase();
      return (
        c.title?.toLowerCase().includes(q) ||
        c.partner?.name?.toLowerCase().includes(q) ||
        c.topic?.toLowerCase().includes(q) ||
        c.partner?.department?.toLowerCase().includes(q)
      );
    });
  }, [activeCollaborations, searchQuery]);

  // Compiled Timeline events dynamically for Research Activity
  const activityEvents = useMemo(() => {
    const events: any[] = [];
    if (!selectedCollab) return events;

    if (selectedCollab.type === 'project' && activeWorkspace) {
      activeWorkspace.files?.forEach((f: any) => {
        events.push({
          id: `file-${f.id}`,
          text: `${f.uploadedBy?.name || 'Collaborator'} uploaded research document "${f.name}".`,
          date: new Date(f.uploadedAt),
          icon: 'file'
        });
      });
      activeWorkspace.announcements?.forEach((a: any) => {
        events.push({
          id: `ann-${a.id}`,
          text: `${a.author?.name || 'Collaborator'} posted research update: "${a.title}".`,
          date: new Date(a.createdAt),
          icon: 'announcement'
        });
      });
      activeWorkspace.milestones?.forEach((m: any) => {
        events.push({
          id: `ms-${m.id}`,
          text: `Research milestone "${m.title}" ${m.completed ? 'completed' : 'updated'}.`,
          date: new Date(m.updatedAt || m.createdAt),
          icon: 'milestone'
        });
      });
    } else {
      // Advisory timeline from localStorage files
      const files = JSON.parse(localStorage.getItem(`curiousbees_files_${selectedCollab.id}`) || '[]');
      files.forEach((f: any, idx: number) => {
        events.push({
          id: `file-advisory-${idx}`,
          text: `${f.uploadedBy} shared reference document "${f.name}".`,
          date: new Date(f.date || Date.now()),
          icon: 'file'
        });
      });
      events.push({
        id: 'advisory-start',
        text: 'PhD Research Advisory connection established.',
        date: new Date(currentUser?.createdAt || Date.now()),
        icon: 'system'
      });
    }

    return events.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [selectedCollab, activeWorkspace, currentUser]);

  // Statistics calculation based on real backend data
  const stats = useMemo(() => {
    const activeCollabsCount = activeCollaborations.length;
    const activeProjectsCount = workspaces?.length || 0;
    const pendingCollabsCount = myCollabRequests?.received?.filter((r: any) => r.status === 'PENDING').length || 0;
    const pendingRequestsCount = (isSupervisor ? (pendingApprovals?.length || 0) : 0) + pendingCollabsCount;

    return {
      activeCollabsCount,
      activeProjectsCount,
      pendingRequestsCount
    };
  }, [activeCollaborations, workspaces, pendingApprovals, myCollabRequests, isSupervisor]);

  // Pending Actions
  const handleApproveScholar = async (scholarId: string) => {
    try {
      await approveScholar(scholarId);
      addToast('Research Scholar connection approved.', 'success');
      fetchPendingApprovals();
      fetchMyScholars();
    } catch (e: any) {
      addToast(`Approval failed: ${e.message}`, 'error');
    }
  };

  const handleDeclineScholar = async (scholarId: string) => {
    try {
      await declineScholar(scholarId);
      addToast('Scholar request declined.', 'info');
      fetchPendingApprovals();
    } catch (e: any) {
      addToast(`Request decline failed: ${e.message}`, 'error');
    }
  };

  const handleAcceptCollab = async (reqId: string) => {
    try {
      await acceptCollabRequest(reqId);
      addToast('Collaboration request accepted.', 'success');
      fetchMyCollabRequests();
      fetchMyCollaborations();
    } catch (e: any) {
      addToast(`Failed to accept request: ${e.message}`, 'error');
    }
  };

  const handleDeclineCollab = async (reqId: string) => {
    try {
      await declineCollabRequest(reqId);
      addToast('Collaboration request declined.', 'info');
      fetchMyCollabRequests();
    } catch (e: any) {
      addToast(`Failed to decline request: ${e.message}`, 'error');
    }
  };

  // Send Message Handler
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !openedCollabId || !currentUser) return;

    try {
      const msg = await sendCollabMessage(openedCollabId, messageInput);
      setMessages([...messages, {
        id: msg.id,
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderImage: currentUser.image,
        content: messageInput,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      setMessageInput('');
      setReplyingTo(null);
    } catch (err: any) {
      addToast(err.message || 'Failed to send message', 'error');
    }
  };

  // Upload Research File Handler
  const handleUploadFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim() || !newFileUrl.trim() || !selectedCollab) return;

    setUploading(true);
    const sizeInBytes = Math.floor(Math.random() * 5 * 1024 * 1024) + 1024 * 1024; // 1MB - 6MB

    try {
      if (selectedCollab.type === 'project' && selectedCollab.workspaceId) {
        // Upload to Workspace directly via NestJS API
        await addWorkspaceFile(selectedCollab.workspaceId, newFileName, newFileUrl, Math.floor(sizeInBytes / 1024));
        fetchWorkspaceDetails(selectedCollab.workspaceId);
      } else {
        // Advisory: Store locally in localStorage
        const advisoryFilesKey = `curiousbees_files_${selectedCollab.id}`;
        const existingFiles = JSON.parse(localStorage.getItem(advisoryFilesKey) || '[]');
        const newFile: CollaborationFile = {
          name: newFileName,
          url: newFileUrl,
          size: `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`,
          uploadedBy: currentUser?.name || 'You',
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        };
        localStorage.setItem(advisoryFilesKey, JSON.stringify([newFile, ...existingFiles]));
      }

      addToast(`Shared file "${newFileName}" successfully.`, 'success');
      setNewFileName('');
      setNewFileUrl('');
      setShowUploadModal(false);
    } catch (err: any) {
      addToast(`Upload failed: ${err.message}`, 'error');
    } finally {
      setUploading(false);
    }
  };

  // Get Advisory files from LocalStorage fallback
  const advisoryFilesList = useMemo(() => {
    if (!selectedCollab || selectedCollab.type !== 'advisory') return [];
    return JSON.parse(localStorage.getItem(`curiousbees_files_${selectedCollab.id}`) || '[]');
  }, [selectedCollab, showUploadModal]);

  // Deny Access Screen for General/Unapproved Users
  if (!hasAccess) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6 bg-slate-50">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-md w-full text-center shadow-sm space-y-5 text-left">
          <div className="w-14 h-14 bg-rose-50 border border-rose-100 text-[#ba1a1a] rounded-2xl flex items-center justify-center mx-auto">
            <X className="w-6 h-6 stroke-[3.5]" />
          </div>
          <div className="space-y-2 text-center">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Access Restricted</h2>
            <p className="text-xs text-slate-550 font-semibold leading-relaxed">
              Only registered Research Supervisors and Research Scholars have access to the Research Collaboration Workspace.
            </p>
          </div>
          <Link
            href="/feed"
            className="block w-full py-2.5 bg-[#0C4DA2] hover:bg-[#042654] text-white rounded-xl text-xs font-bold transition-all text-center"
          >
            Back to Feed
          </Link>
        </div>
      </div>
    );
  }

  // Render Detail View
  if (selectedCollab) {
    return (
      <div className="h-[calc(100vh-4rem)] p-4 md:p-6 max-w-7xl mx-auto flex flex-col gap-4 select-none text-left overflow-hidden">
        
        {/* Back Button */}
        <div>
          <button
            onClick={() => setOpenedCollabId(null)}
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl shadow-3xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Collaborations
          </button>
        </div>

        {/* A. Collaboration Header */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-3xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 rounded-full overflow-hidden border border-slate-200 shrink-0">
              <img src={getProfileImageUrl(selectedCollab.partner)} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 bg-[#0C4DA2]/10 text-[#0C4DA2] border border-[#0C4DA2]/20 rounded-full font-black text-[9px] uppercase tracking-wider">
                  {selectedCollab.type === 'advisory' ? 'PhD advisory' : 'Research project'}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full font-bold text-[9px] uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  {selectedCollab.status}
                </span>
              </div>
              <h2 className="text-lg font-black text-slate-900 mt-1 truncate leading-snug">
                {selectedCollab.title}
              </h2>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                Collaborator: <span className="text-slate-800 font-bold">{selectedCollab.partner?.name}</span> ({selectedCollab.partner?.roleLabel}) • {selectedCollab.partner?.department}
              </p>
            </div>
          </div>

          <div className="shrink-0">
            <Link
              href={selectedCollab.partner?.id && selectedCollab.partner?.id !== 'system' ? `/researchers/${selectedCollab.partner.id}` : '#'}
              className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-250 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              View Research Profile <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Content Layout Grid */}
        <div className="flex-1 min-h-0 flex flex-col">
          
          {/* B. Research Discussion */}
          <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-3xs flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-white shrink-0">
              <MessageSquare className="w-4 h-4 text-[#0C4DA2]" />
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">
                Research Discussion
              </h3>
            </div>

            {/* Messages stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
              {messages.map((msg: any) => {
                const isMine = msg.senderId === currentUser?.id;
                return (
                  <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 text-xs font-semibold leading-relaxed shadow-sm ${
                        isMine
                          ? 'bg-[#0C4DA2] text-white rounded-tr-sm'
                          : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm'
                      }`}
                    >
                      <div className="flex justify-between items-end gap-3 mb-1">
                        <span className={`text-[9px] font-black tracking-wide ${isMine ? 'text-blue-100' : 'text-slate-400'}`}>
                          {msg.senderName}
                        </span>
                        <span className={`text-[8px] font-bold ${isMine ? 'text-blue-200' : 'text-slate-400'}`}>
                          {msg.timestamp}
                        </span>
                      </div>
                      {msg.replyTo && (
                        <div className="mb-2 p-2 bg-slate-50/70 border-l-2 border-blue-500 rounded text-[10px] text-slate-500 font-medium">
                          <span className="font-extrabold text-[#0C4DA2] block">Replying to {msg.replyTo.senderName}</span>
                          <span className="truncate block mt-0.5">"{msg.replyTo.content}"</span>
                        </div>
                      )}
                      <p>{msg.content}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Messages Composer */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-100 bg-white shrink-0 space-y-2">
              {replyingTo && (
                <div className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-150 text-[11px]">
                  <div className="truncate">
                    <span className="font-bold text-[#0C4DA2]">Replying to {replyingTo.senderName}:</span>
                    <span className="text-slate-650 ml-1">"{replyingTo.content}"</span>
                  </div>
                  <button onClick={() => setReplyingTo(null)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={`Discuss methodology, guidelines or updates with ${selectedCollab.partner?.name}...`}
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0C4DA2] focus:bg-white text-xs font-semibold transition-all"
                />
                <button
                  type="submit"
                  className="p-2.5 bg-[#0C4DA2] hover:bg-[#042654] text-white rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>



        </div>

        {/* RESEARCH FILE UPLOAD MODAL */}
        <AnimatePresence>
          {showUploadModal && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 text-left"
              >
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
                    <UploadCloud className="w-4 h-4 text-[#0C4DA2]" /> Reference Research File
                  </h3>
                  <button onClick={() => setShowUploadModal(false)} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleUploadFile} className="space-y-4">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider">File Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Methodology_Draft.pdf"
                      value={newFileName}
                      onChange={(e) => setNewFileName(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0C4DA2] focus:bg-white text-xs font-semibold transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider">File URL</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. /files/methodology_v1.pdf"
                      value={newFileUrl}
                      onChange={(e) => setNewFileUrl(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0C4DA2] focus:bg-white text-xs font-semibold transition-all"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowUploadModal(false)}
                      className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-650 text-xs font-bold rounded-xl cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={uploading}
                      className="px-5 py-2 bg-[#0C4DA2] hover:bg-[#042654] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {uploading ? 'Sharing...' : 'Reference Document'}
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

  // Shared Pending Requests Component
  const pendingRequestsSection = ((isSupervisor && pendingApprovals?.length > 0) || myCollabRequests?.received?.filter((r: any) => r.status === 'PENDING').length > 0) ? (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-3xs space-y-4 max-w-4xl mx-auto w-full mb-8">
      <div className="border-b border-slate-100 pb-2">
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-amber-600" /> Pending Collaboration Requests
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Scholar Advisor mapping requests */}
        {pendingApprovals?.map((req: any) => (
          <div key={req.id} className="p-4 bg-amber-50/20 border border-amber-200/50 rounded-2xl flex flex-col justify-between gap-3 text-left">
            <div>
              <h4 className="text-xs font-extrabold text-slate-900">{req.name}</h4>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mt-0.5">{req.department || 'SRMIST'}</p>
              <p className="text-[11px] text-slate-600 mt-1 font-semibold">Scholar is requesting supervisor assignment.</p>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => handleApproveScholar(req.id)}
                className="flex-1 py-2 bg-[#0C4DA2] hover:bg-[#042654] text-white text-[10px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" /> Approve
              </button>
              <button
                onClick={() => handleDeclineScholar(req.id)}
                className="px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-500 text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
              >
                Decline
              </button>
            </div>
          </div>
        ))}

        {/* Project proposal requests */}
        {myCollabRequests?.received?.filter((r: any) => r.status === 'PENDING').map((req: any) => (
          <div key={req.id} className="p-4 bg-blue-50/15 border border-blue-200/40 rounded-2xl flex flex-col justify-between gap-3 text-left">
            <div>
              <div className="flex items-center gap-1 bg-blue-50/60 border border-blue-100 rounded px-1.5 py-0.5 w-max">
                <Users className="w-3 h-3 text-[#0C4DA2]" />
                <span className="text-[9px] font-extrabold text-[#0C4DA2] uppercase tracking-wider">Research Collaboration</span>
              </div>
              <h4 className="text-xs font-extrabold text-slate-900 mt-2">{req.requester?.name}</h4>
              <p className="text-[10px] font-bold text-slate-500 truncate mt-0.5">Focus: {req.thread?.title || 'Joint Project'}</p>
              {req.message && (
                <p className="text-[10px] text-slate-500 bg-white border border-slate-100 rounded-lg p-2 mt-2 leading-relaxed italic">
                  "{req.message}"
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => handleAcceptCollab(req.id)}
                className="flex-1 py-2 bg-[#0C4DA2] hover:bg-[#042654] text-white text-[10px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" /> Accept
              </button>
              <button
                onClick={() => handleDeclineCollab(req.id)}
                className="px-3 py-2 border border-slate-200 hover:bg-slate-55 text-slate-550 text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
              >
                Decline
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  ) : null;

  // Render Zero Collaborations (Empty State) or Active Collaborations Dashboard
  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 md:p-6 max-w-7xl mx-auto flex flex-col gap-6 pb-20 select-none text-left">
      
      {activeCollaborations.length === 0 ? (
        /* ==================================================
           3. EMPTY STATE — ZERO COLLABORATIONS
           ================================================== */
        <div className="w-full max-w-4xl mx-auto py-10 space-y-8 text-left">
          
          {/* Header */}
          <div className="border-b border-slate-200 pb-4">
            <span className="text-[11px] font-black tracking-widest text-[#0C4DA2] uppercase">CURIOUS NEXUS</span>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight mt-1">Research Collaboration Workspace</h1>
            <p className="text-xs text-slate-550 font-semibold mt-1">
              Your focused workspace for approved research collaborations with supervisors and scholars.
            </p>
          </div>

          {/* Compact Statistics Grid */}
          <div className="grid grid-cols-3 gap-4 font-sans">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs text-center">
              <span className="text-3xl font-black text-slate-900">{stats.activeCollabsCount}</span>
              <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider mt-1">Active Collaborations</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs text-center">
              <span className="text-3xl font-black text-slate-900">{stats.activeProjectsCount}</span>
              <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider mt-1">Active Research Projects</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs text-center">
              <span className="text-3xl font-black text-slate-900">{stats.pendingRequestsCount}</span>
              <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider mt-1">Pending Collaboration Requests</p>
            </div>
          </div>

          {/* Pending Requests Prominent Section */}
          {pendingRequestsSection}

          {/* Central Empty State Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center shadow-3xs flex flex-col items-center justify-center max-w-2xl mx-auto space-y-4">
            <div className="w-16 h-16 bg-blue-50 border border-blue-100 text-[#0C4DA2] rounded-2xl flex items-center justify-center shadow-3xs">
              <Network className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-extrabold text-slate-900">No active research collaborations</h3>
              <p className="text-xs md:text-sm text-slate-550 leading-relaxed font-semibold max-w-md mx-auto">
                Once you establish an approved research collaboration, your research discussions, updates and collaboration activity will appear here.
              </p>
            </div>
            <Link
              href="/researchers"
              className="px-5 py-2.5 bg-[#0C4DA2] hover:bg-[#042654] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 font-sans"
            >
              Explore Researchers →
            </Link>
          </div>

        </div>
      ) : (
        /* ==================================================
           4. ACTIVE COLLABORATIONS STATE
           ================================================== */
        <div className="w-full max-w-6xl mx-auto py-6 space-y-8 text-left">
          
          {/* Header */}
          <div className="border-b border-slate-200 pb-4">
            <span className="text-[11px] font-black tracking-widest text-[#0C4DA2] uppercase">CURIOUS NEXUS</span>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight mt-1">Research Collaboration Workspace</h1>
            <p className="text-xs text-slate-550 font-semibold mt-1">
              Your active research collaborations
            </p>
          </div>

          {/* Real Statistics Grid */}
          <div className="grid grid-cols-3 gap-4 font-sans">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs text-center">
              <span className="text-3xl font-black text-slate-900">{stats.activeCollabsCount}</span>
              <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider mt-1">Active Collaborations</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs text-center">
              <span className="text-3xl font-black text-slate-900">{stats.activeProjectsCount}</span>
              <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider mt-1">Active Research Projects</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs text-center">
              <span className="text-3xl font-black text-slate-900">{stats.pendingRequestsCount}</span>
              <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider mt-1">Pending Collaboration Requests</p>
            </div>
          </div>

          {/* Pending Requests Prominent Section */}
          {pendingRequestsSection}

          {/* Search bar */}
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search your collaborations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-850 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0C4DA2] text-xs font-semibold shadow-3xs transition-all animate-none"
            />
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {filteredCollaborations.length === 0 ? (
              <div className="col-span-full py-12 text-center bg-white border border-slate-200 rounded-3xl">
                <p className="text-xs font-semibold text-slate-450">No matching active collaborations found.</p>
              </div>
            ) : (
              filteredCollaborations.map((collab) => (
                <div
                  key={collab.id}
                  className="bg-white border border-slate-200 hover:border-slate-300 rounded-3xl p-6 shadow-3xs flex flex-col justify-between gap-5 transition-all hover:shadow-2xs"
                >
                  <div className="space-y-4">
                    {/* Header line */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="font-sans text-sm font-black text-slate-905 tracking-tight truncate max-w-[70%]">
                        {collab.title}
                      </h3>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-250 rounded-full font-black text-[9px] uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-pulse" />
                        {collab.status}
                      </span>
                    </div>

                    {/* Partner identity */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 shrink-0">
                        <img src={getProfileImageUrl(collab.partner)} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-black text-slate-900 leading-tight">
                          {collab.partner?.name}
                        </h4>
                        <p className="text-[10px] font-bold text-[#0C4DA2] uppercase tracking-wider mt-0.5">
                          {collab.partner?.roleLabel}
                        </p>
                      </div>
                    </div>

                    {/* Metadata lines */}
                    <div className="space-y-2.5 text-[10px]">
                      <div className="flex items-baseline gap-2">
                        <span className="font-bold text-slate-400 uppercase tracking-wide shrink-0">Topic:</span>
                        <span className="font-extrabold text-slate-700 truncate">{collab.topic}</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="font-bold text-slate-400 uppercase tracking-wide shrink-0">Research Area:</span>
                        <span className="font-extrabold text-slate-700 truncate">{collab.partner?.department}</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="font-bold text-slate-400 uppercase tracking-wide shrink-0">Started Date:</span>
                        <span className="font-extrabold text-slate-700">{collab.startedAt}</span>
                      </div>
                    </div>
                  </div>

                  {/* CTA button */}
                  <button
                    onClick={() => setOpenedCollabId(collab.id)}
                    className="w-full py-2.5 bg-[#0C4DA2] hover:bg-[#042654] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1 cursor-pointer font-sans"
                  >
                    Open Collaboration
                  </button>
                </div>
              ))
            )}
          </div>

        </div>
      )}

    </div>
  );
}
