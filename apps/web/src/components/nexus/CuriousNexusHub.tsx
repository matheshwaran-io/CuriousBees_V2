'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  FolderOpen, 
  Search, 
  Plus, 
  FileText, 
  Image as ImageIcon, 
  Paperclip, 
  Send, 
  Info, 
  CheckCheck, 
  Check, 
  User, 
  Users, 
  BookOpen, 
  Calendar, 
  Award, 
  Trash2, 
  CornerUpLeft, 
  X, 
  Sparkles, 
  Layers, 
  CheckCircle2, 
  Clock, 
  FileDown, 
  Share2, 
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Megaphone,
  Network
} from 'lucide-react';
import { useStore } from '@/store/useStore';

interface CuriousNexusHubProps {
  initialView?: 'messages' | 'workspaces';
}

interface NexusMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: string;
  isMine: boolean;
  status: 'sent' | 'delivered' | 'read';
  attachment?: {
    type: 'pdf' | 'docx' | 'image';
    name: string;
    url: string;
    size: string;
  };
  reactions?: { emoji: string; count: number; userReacted?: boolean }[];
  replyTo?: { id: string; senderName: string; content: string };
}

export function CuriousNexusHub({ initialView = 'messages' }: CuriousNexusHubProps) {
  const { currentUser, workspaces, collaborators, threads } = useStore();

  // Active View State: 'messages' or 'workspaces'
  const [activeTab, setActiveTab] = useState<'messages' | 'workspaces'>(initialView);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'unread'>('all');
  
  // Selection States
  const [selectedConversationId, setSelectedConversationId] = useState<string>('c1');
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>('w1');
  const [showDetailsPane, setShowDetailsPane] = useState<boolean>(true);
  const [workspaceSubTab, setWorkspaceSubTab] = useState<'chat' | 'overview' | 'members' | 'files' | 'milestones' | 'announcements'>('overview');

  // New Chat Modal state
  const [showNewModal, setShowNewModal] = useState(false);

  // Attachment & Composer State
  const [messageInput, setMessageInput] = useState('');
  const [replyingTo, setReplyingTo] = useState<NexusMessage | null>(null);
  const [attachedFile, setAttachedFile] = useState<{ name: string; type: 'pdf' | 'docx' | 'image'; url: string; size: string } | null>(null);

  // ─── MOCK DIRECT CONVERSATIONS DATA ──────────────────────────────────────────
  const [conversations, setConversations] = useState([
    {
      id: 'c1',
      participant: {
        id: 'u1',
        name: 'Dr. Arun Kumar',
        role: 'RESEARCH_SUPERVISOR',
        department: 'Artificial Intelligence & Knowledge Systems',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        online: true,
        lastSeen: 'Active now',
        connectionStatus: 'Supervisor',
        sharedInterests: ['Knowledge Graphs', 'Neural Networks', 'NLP'],
      },
      lastMessage: 'Please review the methodology section in our research proposal PDF.',
      timestamp: '10:42 AM',
      unreadCount: 2,
    },
    {
      id: 'c2',
      participant: {
        id: 'u2',
        name: 'Dr. Jane Du',
        role: 'RESEARCH_SUPERVISOR',
        department: 'Bioinformatics & Machine Learning',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
        online: false,
        lastSeen: 'Active 15m ago',
        connectionStatus: 'Mutual Connection',
        sharedInterests: ['Bioinformatics', 'Machine Learning'],
      },
      lastMessage: 'I have attached the benchmark dataset for the protein folding trial.',
      timestamp: 'Yesterday',
      unreadCount: 0,
    },
    {
      id: 'c3',
      participant: {
        id: 'u3',
        name: 'Maddy S.',
        role: 'RESEARCH_SCHOLAR',
        department: 'Computer Applications & VLSI',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        online: true,
        lastSeen: 'Active now',
        connectionStatus: 'Follows You',
        sharedInterests: ['VLSI Design', 'Generative AI'],
      },
      lastMessage: 'Shall we schedule the literature review milestone presentation?',
      timestamp: 'Aug 9',
      unreadCount: 0,
    },
  ]);

  // ─── MOCK MESSAGES DICTIONARY ───────────────────────────────────────────────
  const [messagesDict, setMessagesDict] = useState<Record<string, NexusMessage[]>>({
    c1: [
      {
        id: 'm1',
        senderId: 'u1',
        senderName: 'Dr. Arun Kumar',
        content: 'Good morning! Have you finalized the experimental setup for the graph integration model?',
        timestamp: '10:15 AM',
        isMine: false,
        status: 'read',
      },
      {
        id: 'm2',
        senderId: 'current',
        senderName: 'You',
        content: 'Yes Dr. Arun, I completed the baseline tests last night with 94.2% accuracy.',
        timestamp: '10:20 AM',
        isMine: true,
        status: 'read',
      },
      {
        id: 'm3',
        senderId: 'u1',
        senderName: 'Dr. Arun Kumar',
        content: 'Excellent progress. Please review the methodology section in our research proposal PDF.',
        timestamp: '10:42 AM',
        isMine: false,
        status: 'read',
        attachment: {
          type: 'pdf',
          name: 'KnowledgeGraph_Methodology_Draft.pdf',
          url: '#',
          size: '2.4 MB',
        },
        reactions: [
          { emoji: '👍', count: 2, userReacted: true },
          { emoji: '🚀', count: 1, userReacted: false },
        ],
      },
    ],
    c2: [
      {
        id: 'm21',
        senderId: 'u2',
        senderName: 'Dr. Jane Du',
        content: 'I have attached the benchmark dataset for the protein folding trial.',
        timestamp: 'Yesterday 4:30 PM',
        isMine: false,
        status: 'read',
        attachment: {
          type: 'docx',
          name: 'Protein_Folding_Data_2026.docx',
          url: '#',
          size: '1.1 MB',
        },
      },
    ],
    c3: [
      {
        id: 'm31',
        senderId: 'u3',
        senderName: 'Maddy S.',
        content: 'Shall we schedule the literature review milestone presentation?',
        timestamp: 'Aug 9',
        isMine: false,
        status: 'read',
      },
    ],
  });

  // ─── MOCK WORKSPACES DATA ───────────────────────────────────────────────────
  const [workspaceList, setWorkspaceList] = useState([
    {
      id: 'w1',
      title: 'AI Medical Imaging Research',
      description: 'Developing multi-modal neural network architectures for early tumor classification using MRI dataset.',
      memberCount: 4,
      lastActivity: '12m ago',
      progress: 75,
      members: [
        { id: 'u1', name: 'Dr. Arun Kumar', role: 'Project Director', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
        { id: 'u2', name: 'Dr. Jane Du', role: 'Co-Investigator', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80' },
        { id: 'u3', name: 'Maddy S.', role: 'Lead Scholar', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
      ],
      files: [
        { id: 'f1', name: 'TumorSegmentation_Architecture_V2.pdf', size: '4.8 MB', uploadedBy: 'Dr. Arun Kumar', date: 'Aug 10' },
        { id: 'f2', name: 'MRI_Training_Set_Summary.xlsx', size: '1.2 MB', uploadedBy: 'Maddy S.', date: 'Aug 08' },
      ],
      milestones: [
        { id: 'ms1', title: 'Literature Review & State of Art', completed: true, dueDate: 'Jul 15' },
        { id: 'ms2', title: 'MRI Dataset Preprocessing & Cleaning', completed: true, dueDate: 'Aug 01' },
        { id: 'ms3', title: 'Model Architecture Implementation', completed: false, dueDate: 'Aug 20' },
        { id: 'ms4', title: 'Journal Manuscript Submission', completed: false, dueDate: 'Sep 15' },
      ],
      announcements: [
        { id: 'a1', title: 'Weekly Progress Review Scheduled', content: 'Our team sync will be held on Thursday at 3:00 PM in Lab 402.', author: 'Dr. Arun Kumar', date: 'Aug 10' },
      ],
    },
    {
      id: 'w2',
      title: 'Quantum Silicon Photonics Project',
      description: 'Next-generation optical inter-connects for low-latency quantum cryptographic key distribution.',
      memberCount: 3,
      lastActivity: '2h ago',
      progress: 40,
      members: [
        { id: 'u2', name: 'Dr. Jane Du', role: 'Lead Researcher', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80' },
      ],
      files: [
        { id: 'f3', name: 'Silicon_Interconnect_Design.pdf', size: '6.1 MB', uploadedBy: 'Dr. Jane Du', date: 'Aug 05' },
      ],
      milestones: [
        { id: 'ms21', title: 'Photonic Crystal Waveguide Design', completed: true, dueDate: 'Jul 28' },
        { id: 'ms22', title: 'Fabrication & Cleanroom Testing', completed: false, dueDate: 'Sep 01' },
      ],
      announcements: [
        { id: 'a2', title: 'Cleanroom Access Granted', content: 'Safety badges have been updated for all lab personnel.', author: 'Dr. Jane Du', date: 'Aug 05' },
      ],
    },
  ]);

  // Active Direct Conversation
  const activeConversation = useMemo(() => {
    return conversations.find((c) => c.id === selectedConversationId) || conversations[0];
  }, [conversations, selectedConversationId]);

  // Active Messages
  const activeMessages = useMemo(() => {
    return messagesDict[selectedConversationId] || [];
  }, [messagesDict, selectedConversationId]);

  // Active Workspace
  const activeWorkspace = useMemo(() => {
    return workspaceList.find((w) => w.id === selectedWorkspaceId) || workspaceList[0];
  }, [workspaceList, selectedWorkspaceId]);

  // Filtered Conversations
  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      const matchSearch = c.participant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.participant.department.toLowerCase().includes(searchQuery.toLowerCase());
      if (filterMode === 'unread') return matchSearch && c.unreadCount > 0;
      return matchSearch;
    });
  }, [conversations, searchQuery, filterMode]);

  // Filtered Workspaces
  const filteredWorkspaces = useMemo(() => {
    return workspaceList.filter((w) => {
      return w.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.description.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [workspaceList, searchQuery]);

  // Send Message Handler
  const handleSendMessage = () => {
    if (!messageInput.trim() && !attachedFile) return;

    const newMsg: NexusMessage = {
      id: `m_${Date.now()}`,
      senderId: 'current',
      senderName: currentUser?.name || 'You',
      content: messageInput,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMine: true,
      status: 'sent',
      replyTo: replyingTo ? { id: replyingTo.id, senderName: replyingTo.senderName, content: replyingTo.content } : undefined,
      attachment: attachedFile || undefined,
    };

    setMessagesDict((prev) => ({
      ...prev,
      [selectedConversationId]: [...(prev[selectedConversationId] || []), newMsg],
    }));

    // Update conversation last message
    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedConversationId
          ? { ...c, lastMessage: messageInput || attachedFile?.name || 'Sent an attachment', timestamp: 'Just now' }
          : c
      )
    );

    setMessageInput('');
    setReplyingTo(null);
    setAttachedFile(null);
  };

  // Add Reaction Handler
  const handleReact = (msgId: string, emoji: string) => {
    setMessagesDict((prev) => {
      const list = prev[selectedConversationId] || [];
      const updated = list.map((msg) => {
        if (msg.id !== msgId) return msg;
        const reactions = msg.reactions ? [...msg.reactions] : [];
        const existing = reactions.find((r) => r.emoji === emoji);
        if (existing) {
          if (existing.userReacted) {
            existing.count -= 1;
            existing.userReacted = false;
          } else {
            existing.count += 1;
            existing.userReacted = true;
          }
        } else {
          reactions.push({ emoji, count: 1, userReacted: true });
        }
        return { ...msg, reactions: reactions.filter((r) => r.count > 0) };
      });
      return { ...prev, [selectedConversationId]: updated };
    });
  };

  // Toggle Milestone Completion
  const handleToggleMilestone = (msId: string) => {
    setWorkspaceList((prev) =>
      prev.map((w) => {
        if (w.id !== selectedWorkspaceId) return w;
        return {
          ...w,
          milestones: w.milestones.map((ms) => (ms.id === msId ? { ...ms, completed: !ms.completed } : ms)),
        };
      })
    );
  };

  return (
    <div className="w-full h-[calc(100vh-5rem)] bg-[#F8FAFC] font-sans flex overflow-hidden border border-slate-200 rounded-2xl shadow-sm">
      
      {/* ─── PANE 1: CONVERSATIONS & WORKSPACES DIRECTORY (LEFT) ─── */}
      <div className="w-full md:w-80 lg:w-80 border-r border-slate-200 bg-white flex flex-col shrink-0">
        
        {/* Header Title & CTA */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <Network className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base font-black text-slate-900 tracking-tight leading-none flex items-center gap-1.5">
                Curious Nexus
              </h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Research Hub</p>
            </div>
          </div>

          <button
            onClick={() => setShowNewModal(true)}
            className="p-2 bg-[#3B82F6] hover:bg-blue-600 text-white rounded-xl shadow-sm transition-all text-xs font-bold flex items-center gap-1 cursor-pointer"
            title="Start New Conversation or Workspace"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Primary Tabs: [ Messages ] [ Workspaces ] ONLY */}
        <div className="p-2 bg-slate-50 border-b border-slate-100 flex gap-1">
          <button
            onClick={() => setActiveTab('messages')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'messages'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Messages
          </button>
          
          <button
            onClick={() => setActiveTab('workspaces')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'workspaces'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            Workspaces
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-3 border-b border-slate-100 space-y-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={activeTab === 'messages' ? 'Search researcher DMs...' : 'Search research workspaces...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
            />
          </div>

          {activeTab === 'messages' && (
            <div className="flex gap-1">
              <button
                onClick={() => setFilterMode('all')}
                className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                  filterMode === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterMode('unread')}
                className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                  filterMode === 'unread' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Unread
              </button>
            </div>
          )}
        </div>

        {/* Scrollable List Pane */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          
          {/* Messages Tab View */}
          {activeTab === 'messages' && (
            filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <MessageSquare className="w-8 h-8 mx-auto opacity-30" />
                <p className="text-xs font-medium">Your research conversations will appear here.</p>
              </div>
            ) : (
              filteredConversations.map((c) => {
                const isSelected = selectedConversationId === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => {
                      setSelectedConversationId(c.id);
                      setConversations(prev => prev.map(item => item.id === c.id ? { ...item, unreadCount: 0 } : item));
                    }}
                    className={`p-3 transition-all cursor-pointer flex items-start gap-3 relative ${
                      isSelected ? 'bg-blue-50/60 border-l-4 border-[#3B82F6]' : 'hover:bg-slate-50'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <img src={c.participant.avatar} alt={c.participant.name} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                      {c.participant.online && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
                      )}
                    </div>

                    {/* Meta */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <h3 className="text-xs font-bold text-slate-900 truncate">{c.participant.name}</h3>
                        <span className="text-[10px] text-slate-400 font-medium shrink-0 ml-1">{c.timestamp}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-normal truncate leading-tight">{c.lastMessage}</p>
                      
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-bold rounded">
                          {c.participant.connectionStatus}
                        </span>
                      </div>
                    </div>

                    {c.unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 bg-[#3B82F6] text-white text-[10px] font-bold rounded-full">
                        {c.unreadCount}
                      </span>
                    )}
                  </div>
                );
              })
            )
          )}

          {/* Workspaces Tab View */}
          {activeTab === 'workspaces' && (
            filteredWorkspaces.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <FolderOpen className="w-8 h-8 mx-auto opacity-30" />
                <p className="text-xs font-medium">Create a workspace to start collaborating on research.</p>
              </div>
            ) : (
              filteredWorkspaces.map((w) => {
                const isSelected = selectedWorkspaceId === w.id;
                return (
                  <div
                    key={w.id}
                    onClick={() => setSelectedWorkspaceId(w.id)}
                    className={`p-3 transition-all cursor-pointer flex items-start gap-3 ${
                      isSelected ? 'bg-blue-50/60 border-l-4 border-[#3B82F6]' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                      {w.title.slice(0, 2).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <h3 className="text-xs font-bold text-slate-900 truncate">{w.title}</h3>
                        <span className="text-[10px] text-slate-400 font-medium shrink-0 ml-1">{w.lastActivity}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-normal truncate leading-tight">{w.description}</p>
                      
                      <div className="flex items-center justify-between mt-2 text-[10px] text-slate-400 font-medium">
                        <span>{w.memberCount} Researchers</span>
                        <span className="text-blue-600 font-bold">{w.progress}% Done</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )
          )}
        </div>
      </div>

      {/* ─── PANE 2: ACTIVE CONVERSATION / WORKSPACE VIEW (CENTER) ─── */}
      <div className="flex-1 flex flex-col bg-white overflow-hidden min-w-0">
        
        {/* DIRECT MESSAGES ACTIVE VIEW */}
        {activeTab === 'messages' && (
          <div className="flex-1 flex flex-col h-full min-w-0">
            
            {/* Header */}
            <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-white z-10 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={activeConversation.participant.avatar}
                  alt={activeConversation.participant.name}
                  className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                />
                <div className="min-w-0">
                  <h2 className="text-sm font-bold text-slate-900 truncate flex items-center gap-1.5">
                    {activeConversation.participant.name}
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600 inline" />
                  </h2>
                  <p className="text-[11px] text-slate-500 truncate">
                    {activeConversation.participant.role.replace('_', ' ')} • {activeConversation.participant.lastSeen}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowDetailsPane(!showDetailsPane)}
                  className={`p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-all cursor-pointer ${
                    showDetailsPane ? 'bg-slate-100 text-slate-900' : ''
                  }`}
                  title="Toggle Research Details Panel"
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F8FAFC]/50">
              {activeMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
                  <MessageSquare className="w-10 h-10 opacity-30" />
                  <p className="text-xs font-semibold">Start the conversation with {activeConversation.participant.name}.</p>
                </div>
              ) : (
                activeMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.isMine ? 'items-end' : 'items-start'}`}
                  >
                    {/* Sender Name */}
                    <span className="text-[10px] font-bold text-slate-400 mb-1 px-1">
                      {msg.senderName} • {msg.timestamp}
                    </span>

                    {/* Bubble */}
                    <div className="group relative max-w-[85%] sm:max-w-[70%]">
                      
                      {/* Replying Context */}
                      {msg.replyTo && (
                        <div className="mb-1 p-2 bg-slate-100 border-l-2 border-blue-500 rounded text-[11px] text-slate-600">
                          <span className="font-bold text-blue-600 block">{msg.replyTo.senderName}</span>
                          <span className="truncate block">{msg.replyTo.content}</span>
                        </div>
                      )}

                      <div
                        className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                          msg.isMine
                            ? 'bg-[#3B82F6] text-white rounded-br-none'
                            : 'bg-white border border-slate-200 text-slate-900 rounded-bl-none'
                        }`}
                      >
                        {msg.content}

                        {/* Attachment Card */}
                        {msg.attachment && (
                          <div className={`mt-2.5 p-2.5 rounded-xl border flex items-center justify-between gap-3 ${
                            msg.isMine ? 'bg-white/10 border-white/20 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                          }`}>
                            <div className="flex items-center gap-2 min-w-0">
                              <FileText className="w-5 h-5 shrink-0 opacity-80" />
                              <div className="min-w-0">
                                <p className="font-bold text-[11px] truncate">{msg.attachment.name}</p>
                                <span className="text-[9px] opacity-75">{msg.attachment.size}</span>
                              </div>
                            </div>
                            <a
                              href={msg.attachment.url}
                              download
                              className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-all shrink-0"
                              title="Download Research Document"
                            >
                              <FileDown className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Hover Action Bar: Reactions & Reply */}
                      <div className={`absolute top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-slate-200 shadow-md rounded-full px-2 py-1 z-20 ${
                        msg.isMine ? '-left-24' : '-right-24'
                      }`}>
                        {['❤️', '👍', '🔥', '🚀', '💡'].map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => handleReact(msg.id, emoji)}
                            className="text-xs hover:scale-125 transition-transform cursor-pointer"
                          >
                            {emoji}
                          </button>
                        ))}
                        <button
                          onClick={() => setReplyingTo(msg)}
                          className="p-1 text-slate-400 hover:text-slate-700 transition-colors"
                          title="Reply"
                        >
                          <CornerUpLeft className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Displayed Reactions */}
                      {msg.reactions && msg.reactions.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {msg.reactions.map((r, i) => (
                            <span
                              key={i}
                              onClick={() => handleReact(msg.id, r.emoji)}
                              className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold border cursor-pointer flex items-center gap-1 ${
                                r.userReacted
                                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                                  : 'bg-white border-slate-200 text-slate-600'
                              }`}
                            >
                              <span>{r.emoji}</span>
                              <span>{r.count}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Status Double Ticks for Mine */}
                    {msg.isMine && (
                      <span className="text-[9px] text-slate-400 mt-0.5 flex items-center gap-0.5">
                        <CheckCheck className="w-3 h-3 text-blue-500" /> Read
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Composer Bar */}
            <div className="p-3 border-t border-slate-200 bg-white shrink-0">
              {/* Replying Banner */}
              {replyingTo && (
                <div className="mb-2 p-2 bg-slate-50 border-l-2 border-blue-500 rounded text-xs flex justify-between items-center">
                  <div>
                    <span className="font-bold text-blue-600 text-[11px] block">Replying to {replyingTo.senderName}</span>
                    <span className="text-slate-600 text-[11px] truncate block max-w-md">{replyingTo.content}</span>
                  </div>
                  <button onClick={() => setReplyingTo(null)} className="p-1 text-slate-400 hover:text-slate-700">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Attached File Banner */}
              {attachedFile && (
                <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded-lg text-xs flex justify-between items-center">
                  <div className="flex items-center gap-2 text-blue-800 font-medium">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>{attachedFile.name} ({attachedFile.size})</span>
                  </div>
                  <button onClick={() => setAttachedFile(null)} className="p-1 text-blue-500 hover:text-blue-800">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2">
                {/* File Attachment Button */}
                <label className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors cursor-pointer shrink-0">
                  <Paperclip className="w-4 h-4" />
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.docx,.pptx,.xlsx,image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setAttachedFile({
                          name: file.name,
                          type: file.type.includes('pdf') ? 'pdf' : 'docx',
                          url: '#',
                          size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
                        });
                      }
                    }}
                  />
                </label>

                <input
                  type="text"
                  placeholder={`Write a research message to ${activeConversation.participant.name}...`}
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1 py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                />

                <button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim() && !attachedFile}
                  className="p-2.5 bg-[#3B82F6] hover:bg-blue-600 disabled:opacity-40 text-white rounded-xl shadow-sm transition-all cursor-pointer shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        )}

        {/* WORKSPACE ACTIVE VIEW */}
        {activeTab === 'workspaces' && (
          <div className="flex-1 flex flex-col h-full min-w-0">
            
            {/* Header & Sub-Nav */}
            <div className="p-4 border-b border-slate-200 bg-white shrink-0">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">{activeWorkspace.title}</h2>
                  <p className="text-xs text-slate-500 mt-0.5">{activeWorkspace.description}</p>
                </div>
                <button
                  onClick={() => setShowDetailsPane(!showDetailsPane)}
                  className={`p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-all cursor-pointer ${
                    showDetailsPane ? 'bg-slate-100 text-slate-900' : ''
                  }`}
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>

              {/* Sub-Tabs */}
              <div className="flex gap-2 border-b border-slate-100 pb-1 text-xs font-bold overflow-x-auto">
                {[
                  { id: 'overview', label: 'Overview', icon: Layers },
                  { id: 'chat', label: 'Project Chat', icon: MessageSquare },
                  { id: 'members', label: 'Members', icon: Users },
                  { id: 'files', label: 'Files & PDFs', icon: FileText },
                  { id: 'milestones', label: 'Milestones', icon: CheckCircle2 },
                  { id: 'announcements', label: 'Announcements', icon: Megaphone },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setWorkspaceSubTab(tab.id as any)}
                    className={`py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                      workspaceSubTab === tab.id
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    <tab.icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sub-Tab Content View */}
            <div className="flex-1 overflow-y-auto p-6 bg-[#F8FAFC]/50">
              
              {/* OVERVIEW */}
              {workspaceSubTab === 'overview' && (
                <div className="space-y-6 max-w-3xl">
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-900 mb-2">Research Objective</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{activeWorkspace.description}</p>
                    
                    <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-700">Project Completion Status</span>
                      <span className="text-xs font-black text-blue-600">{activeWorkspace.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 mt-2">
                      <div className="bg-[#3B82F6] h-2 rounded-full" style={{ width: `${activeWorkspace.progress}%` }}></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white border border-slate-200 rounded-2xl p-4">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">ACTIVE MEMBERS</span>
                      <p className="text-2xl font-black text-slate-900 mt-1">{activeWorkspace.members.length}</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl p-4">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">RESEARCH FILES</span>
                      <p className="text-2xl font-black text-slate-900 mt-1">{activeWorkspace.files.length}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* PROJECT CHAT */}
              {workspaceSubTab === 'chat' && (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
                  <MessageSquare className="w-10 h-10 opacity-30" />
                  <p className="text-xs font-medium">Workspace discussion stream active for team members.</p>
                </div>
              )}

              {/* MEMBERS */}
              {workspaceSubTab === 'members' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl">
                  {activeWorkspace.members.map((m) => (
                    <div key={m.id} className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center gap-3 shadow-sm">
                      <img src={m.avatar} alt={m.name} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{m.name}</h4>
                        <p className="text-[10px] text-slate-500 font-medium">{m.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* FILES */}
              {workspaceSubTab === 'files' && (
                <div className="space-y-3 max-w-3xl">
                  {activeWorkspace.files.map((f) => (
                    <div key={f.id} className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">{f.name}</h4>
                          <p className="text-[10px] text-slate-400">{f.size} • Uploaded by {f.uploadedBy} on {f.date}</p>
                        </div>
                      </div>
                      <a href="#" className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1">
                        <FileDown className="w-3.5 h-3.5" /> Download
                      </a>
                    </div>
                  ))}
                </div>
              )}

              {/* MILESTONES */}
              {workspaceSubTab === 'milestones' && (
                <div className="space-y-3 max-w-3xl">
                  {activeWorkspace.milestones.map((ms) => (
                    <div
                      key={ms.id}
                      onClick={() => handleToggleMilestone(ms.id)}
                      className={`p-4 bg-white border rounded-2xl flex items-center justify-between cursor-pointer transition-all ${
                        ms.completed ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input type="checkbox" checked={ms.completed} readOnly className="w-4 h-4 accent-emerald-600 rounded" />
                        <div>
                          <h4 className={`text-xs font-bold ${ms.completed ? 'line-through text-slate-400' : 'text-slate-900'}`}>{ms.title}</h4>
                          <p className="text-[10px] text-slate-400">Due: {ms.dueDate}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${ms.completed ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                        {ms.completed ? 'Completed' : 'In Progress'}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* ANNOUNCEMENTS */}
              {workspaceSubTab === 'announcements' && (
                <div className="space-y-3 max-w-3xl">
                  {activeWorkspace.announcements.map((a) => (
                    <div key={a.id} className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-2">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-bold text-slate-900">{a.title}</h4>
                        <span className="text-[10px] text-slate-400">{a.date}</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{a.content}</p>
                      <p className="text-[10px] text-slate-400 font-bold">Posted by {a.author}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}
      </div>

      {/* ─── PANE 3: DETAILS & RESEARCH CONTEXT PANEL (RIGHT) ─── */}
      {showDetailsPane && (
        <div className="w-72 border-l border-slate-200 bg-slate-50 flex flex-col hidden lg:flex shrink-0 overflow-y-auto p-4 space-y-6">
          
          {activeTab === 'messages' ? (
            <>
              {/* Profile Card */}
              <div className="text-center bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <img
                  src={activeConversation.participant.avatar}
                  alt={activeConversation.participant.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-slate-100 mx-auto"
                />
                <h3 className="text-sm font-bold text-slate-900 mt-3">{activeConversation.participant.name}</h3>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">{activeConversation.participant.role.replace('_', ' ')}</p>
                <p className="text-[10px] text-slate-400 mt-1">{activeConversation.participant.department}</p>
                
                <div className="mt-3 inline-block px-2.5 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-full border border-blue-100">
                  {activeConversation.participant.connectionStatus}
                </div>
              </div>

              {/* Research Interests */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-2">
                <h4 className="text-xs font-bold text-slate-900 flex items-center justify-between">
                  <span>Shared Research Interests</span>
                  <span className="text-[10px] text-blue-600 font-bold">{activeConversation.participant.sharedInterests.length} shared</span>
                </h4>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {activeConversation.participant.sharedInterests.map((interest, idx) => (
                    <span key={idx} className="px-2 py-1 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-lg">
                      {interest}
                    </span>
                  ))}
                </div>
              </div>

              {/* Shared Files */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
                <h4 className="text-xs font-bold text-slate-900">Shared Documents & PDFs</h4>
                <div className="space-y-2">
                  <div className="p-2 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="text-[11px] font-medium text-slate-800 truncate">KnowledgeGraph_Methodology.pdf</span>
                    </div>
                    <FileDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Workspace Details */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
                <h3 className="text-sm font-bold text-slate-900">{activeWorkspace.title}</h3>
                <p className="text-xs text-slate-500">{activeWorkspace.description}</p>
                <div className="pt-2 border-t border-slate-100 flex justify-between text-xs font-bold text-slate-700">
                  <span>Team Size</span>
                  <span>{activeWorkspace.members.length} Researchers</span>
                </div>
              </div>
            </>
          )}

        </div>
      )}

      {/* ─── NEW CONVERSATION / WORKSPACE MODAL ─── */}
      <AnimatePresence>
        {showNewModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-base font-bold text-slate-900">Start Research Conversation</h3>
                <button onClick={() => setShowNewModal(false)} className="p-1 text-slate-400 hover:text-slate-700">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-500">Select a researcher from your mutual network or following connections:</p>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {conversations.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      setSelectedConversationId(c.id);
                      setActiveTab('messages');
                      setShowNewModal(false);
                    }}
                    className="p-3 border border-slate-100 hover:border-blue-200 rounded-xl flex items-center justify-between cursor-pointer hover:bg-blue-50/50 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <img src={c.participant.avatar} alt={c.participant.name} className="w-8 h-8 rounded-full object-cover" />
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{c.participant.name}</h4>
                        <p className="text-[10px] text-slate-400">{c.participant.department}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                      {c.participant.connectionStatus}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
