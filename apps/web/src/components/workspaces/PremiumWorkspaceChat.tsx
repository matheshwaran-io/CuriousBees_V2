'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Video, 
  Phone, 
  Info, 
  Plus, 
  Smile, 
  Paperclip, 
  Send, 
  Download, 
  Ban, 
  Mail, 
  Phone as PhoneIcon, 
  ChevronRight,
  Search,
  FileText,
  Zap,
  MoreHorizontal
} from 'lucide-react';
import AvatarRing from '@/components/AvatarRing';
import { useStore } from '@/store/useStore';

// --- MOCK DATA ---
const MOCK_SCHOLARS = [
  {
    id: '1',
    name: 'Sarah Jenkins',
    role: 'Doctoral Researcher',
    department: 'Quantum Information Systems',
    status: 'online',
    lastMessage: "I've uploaded the draft for the ...",
    time: '10:42 AM',
    email: 's.jenkins@uni.edu',
    phone: '+1 (555) 012-3456',
    projects: [
      { name: 'Quantum Decay Analysis', status: 'Active Development' },
      { name: 'Neural Mesh Networking', status: 'Peer Review' }
    ],
    avatarUrl: 'https://i.pravatar.cc/150?u=sarah'
  },
  {
    id: '2',
    name: 'Chen Wei',
    role: 'Research Assistant',
    department: 'Biomedical Engineering',
    status: 'offline',
    lastMessage: 'Regarding the sample sizes for ...',
    time: 'Yesterday',
    email: 'chen.wei@uni.edu',
    phone: '+1 (555) 987-6543',
    projects: [
      { name: 'CRISPR Gene Editing', status: 'Data Collection' }
    ],
    avatarUrl: 'https://i.pravatar.cc/150?u=chen'
  }
];

const MOCK_TEAMS = [
  {
    id: '3',
    name: 'Neural Network Team',
    lastMessage: 'You: Meeting tomorrow at 9am?',
    time: '2d ago',
    avatarUrl: 'https://i.pravatar.cc/150?u=team'
  }
];

const MOCK_MESSAGES = [
  {
    id: 'm1',
    sender: 'Sarah Jenkins',
    text: "Hi Professor, I've just finished the initial data processing for the Neural Network project. Should I upload the CSV files here or to the shared repository?",
    time: '10:30 AM',
    isMine: false
  },
  {
    id: 'm2',
    sender: 'You',
    text: "Excellent progress, Sarah. Please upload them to the shared repository under the 'Phase 1/Raw Data' directory so the whole team has access.",
    time: '10:35 AM',
    isMine: true
  },
  {
    id: 'm3',
    sender: 'Sarah Jenkins',
    text: "Understood. I've also uploaded the draft for the Quantum Computing paper to the 'Drafts' folder. Let me know when you have time for a quick review.",
    time: '10:42 AM',
    isMine: false,
    attachment: {
      name: 'Quantum_Computing_Draft_v1.docx',
      size: '2.4 MB',
      type: 'Word Document'
    }
  }
];

export function PremiumWorkspaceChat() {
  const [activeTab, setActiveTab] = useState<'individual' | 'groups' | 'pending'>('individual');
  const [activeChat, setActiveChat] = useState(MOCK_SCHOLARS[0]);

  return (
    <div className="flex h-[calc(100vh-6rem)] w-full bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden font-sans text-left">
      
      {/* ─── PANE 1: LEFT SIDEBAR (Directory) ─── */}
      <div className="w-[300px] border-r border-slate-200 flex flex-col bg-[#FDFDFD] shrink-0">
        
        {/* Tabs */}
        <div className="flex items-center border-b border-slate-200 pt-4 px-2">
          {['individual', 'groups', 'pending'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`flex-1 pb-3 text-xs font-bold capitalize transition-colors relative ${
                activeTab === tab ? 'text-[#004495]' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <motion.div 
                  layoutId="activeTabIndicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#004495]"
                />
              )}
            </button>
          ))}
        </div>

        {/* Directory List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          
          {/* Active Scholars Section */}
          {(activeTab === 'individual' || activeTab === 'pending') && (
            <div>
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Scholars</span>
                <button className="text-[#004495] hover:bg-blue-50 p-1 rounded-md transition-colors">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-1">
                {MOCK_SCHOLARS.map(user => (
                  <div 
                    key={user.id}
                    onClick={() => setActiveChat(user)}
                    className={`flex items-center p-2.5 rounded-xl cursor-pointer transition-all ${
                      activeChat.id === user.id ? 'bg-[#004495]/5 border border-[#004495]/10 shadow-sm' : 'hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <img src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-full border border-slate-200" />
                      {user.status === 'online' && (
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></div>
                      )}
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-900 truncate">{user.name}</span>
                        <span className="text-[9px] font-semibold text-slate-400">{user.time}</span>
                      </div>
                      <p className={`text-xs truncate ${activeChat.id === user.id ? 'text-slate-600' : 'text-slate-500'}`}>
                        {user.lastMessage}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Teams Section */}
          {(activeTab === 'groups' || activeTab === 'individual') && (
            <div>
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Teams</span>
              </div>
              <div className="space-y-1">
                {MOCK_TEAMS.map(team => (
                  <div 
                    key={team.id}
                    className="flex items-center p-2.5 rounded-xl hover:bg-slate-50 border border-transparent cursor-pointer transition-all"
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <UsersIcon className="w-5 h-5" />
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-900 truncate">{team.name}</span>
                        <span className="text-[9px] font-semibold text-slate-400">{team.time}</span>
                      </div>
                      <p className="text-xs text-slate-500 truncate">{team.lastMessage}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Create Workspace Button (Bottom Anchor) */}
        <div className="p-4 border-t border-slate-200 bg-white">
          <button className="w-full bg-[#004495] hover:bg-[#003370] text-white py-2.5 rounded-xl text-xs font-bold shadow-md shadow-[#004495]/20 transition-all flex items-center justify-center gap-2">
            Create Workspace
          </button>
          <div className="mt-4 flex items-center justify-between text-slate-400">
            <button className="flex items-center gap-1.5 hover:text-slate-700 text-xs font-medium">
              <Info className="w-3.5 h-3.5" /> Help Center
            </button>
            <button className="hover:text-slate-700">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── PANE 2: CENTER CHAT ─── */}
      <div className="flex-1 flex flex-col bg-white relative min-w-0">
        
        {/* Chat Header */}
        <div className="h-16 border-b border-slate-200 flex items-center justify-between px-6 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img src={activeChat.avatarUrl} alt={activeChat.name} className="w-9 h-9 rounded-full border border-slate-200" />
              {activeChat.status === 'online' && (
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></div>
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-none">{activeChat.name}</h2>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`w-1.5 h-1.5 rounded-full ${activeChat.status === 'online' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                <span className="text-[10px] text-slate-500 font-medium capitalize">{activeChat.status}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <button className="hover:text-[#004495] hover:bg-blue-50 p-2 rounded-lg transition-colors"><Video className="w-5 h-5" /></button>
            <button className="hover:text-[#004495] hover:bg-blue-50 p-2 rounded-lg transition-colors"><Phone className="w-5 h-5" /></button>
            <div className="w-px h-5 bg-slate-200 mx-1"></div>
            <button className="hover:text-slate-700 p-2 rounded-lg transition-colors"><Info className="w-5 h-5" /></button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#FAFAFA]">
          
          <div className="flex justify-center mb-8">
            <span className="px-3 py-1 bg-white text-slate-500 text-[10px] font-bold uppercase tracking-wider rounded-full border border-slate-200 shadow-sm">
              Today
            </span>
          </div>

          {MOCK_MESSAGES.map((msg) => (
            <div key={msg.id} className={`flex w-full ${msg.isMine ? 'justify-end' : 'justify-start'}`}>
              <div className="flex gap-3 max-w-[75%]">
                {!msg.isMine && (
                  <img src={activeChat.avatarUrl} alt={msg.sender} className="w-8 h-8 rounded-full border border-slate-200 shrink-0 mt-1" />
                )}
                <div className={`flex flex-col ${msg.isMine ? 'items-end' : 'items-start'}`}>
                  
                  {/* Bubble */}
                  <div className={`p-4 rounded-2xl ${
                    msg.isMine 
                      ? 'bg-[#004495] text-white rounded-br-none shadow-md shadow-[#004495]/20' 
                      : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none shadow-sm'
                  }`}>
                    <p className={`text-[13px] leading-relaxed ${msg.isMine ? 'font-medium' : ''}`}>
                      {msg.text}
                    </p>
                    
                    {/* Attachment Block */}
                    {msg.attachment && (
                      <div className={`mt-3 p-3 rounded-xl border flex items-center justify-between gap-4 cursor-pointer hover:bg-black/5 transition-colors ${
                        msg.isMine ? 'border-white/20 bg-white/10' : 'border-slate-100 bg-slate-50'
                      }`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            msg.isMine ? 'bg-white/20' : 'bg-blue-50 text-[#004495]'
                          }`}>
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold truncate max-w-[180px]">{msg.attachment.name}</p>
                            <p className={`text-[10px] mt-0.5 ${msg.isMine ? 'text-blue-100' : 'text-slate-400'}`}>
                              {msg.attachment.size} • {msg.attachment.type}
                            </p>
                          </div>
                        </div>
                        <Download className={`w-4 h-4 shrink-0 ${msg.isMine ? 'text-white' : 'text-slate-400'}`} />
                      </div>
                    )}
                  </div>
                  
                  <span className="text-[9px] font-bold text-slate-400 mt-1.5 px-1 uppercase tracking-wider flex items-center gap-1">
                    {msg.time} {msg.isMine && '✓'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-slate-100 shrink-0">
          <div className="flex items-center gap-2 bg-[#F6F8FA] border border-slate-200 rounded-xl p-2 focus-within:border-[#004495] focus-within:ring-1 focus-within:ring-[#004495] transition-all">
            <button className="p-2 text-slate-400 hover:text-slate-700 transition-colors">
              <Plus className="w-5 h-5" />
            </button>
            <button className="p-2 text-slate-400 hover:text-slate-700 transition-colors">
              <Smile className="w-5 h-5" />
            </button>
            <input 
              type="text" 
              placeholder={`Type your message to ${activeChat.name.split(' ')[0]}...`}
              className="flex-1 bg-transparent border-none focus:outline-none text-sm text-slate-700 placeholder:text-slate-400 px-2 min-w-0"
            />
            <button className="p-2 text-slate-400 hover:text-slate-700 transition-colors">
              <Paperclip className="w-5 h-5" />
            </button>
            <button className="w-10 h-10 bg-[#004495] hover:bg-[#003370] text-white rounded-lg flex items-center justify-center shadow-md shadow-[#004495]/20 transition-all shrink-0">
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </div>
          <div className="flex items-center justify-between px-2 mt-2">
            <span className="text-[9px] text-slate-400 font-medium flex items-center gap-1">
              <Zap className="w-3 h-3" /> Press Enter to send
            </span>
            <span className="text-[9px] text-slate-400 font-medium flex items-center gap-1">
              🔒 End-to-end encrypted
            </span>
          </div>
        </div>
      </div>

      {/* ─── PANE 3: RIGHT SIDEBAR (Details) ─── */}
      <div className="w-[280px] border-l border-slate-200 bg-[#FDFDFD] flex flex-col shrink-0">
        <div className="flex-1 overflow-y-auto">
          
          {/* Profile Header */}
          <div className="flex flex-col items-center p-6 border-b border-slate-100 text-center">
            <div className="w-20 h-20 rounded-full border-2 border-white shadow-lg overflow-hidden bg-gradient-to-tr from-amber-200 to-amber-500 mb-4 p-0.5">
               <img src={activeChat.avatarUrl} alt={activeChat.name} className="w-full h-full rounded-full border border-white/50 bg-white" />
            </div>
            <h3 className="font-bold text-slate-900">{activeChat.name}</h3>
            <p className="text-xs font-bold text-[#004495] mt-0.5">{activeChat.role}</p>
            <p className="text-[10px] text-slate-500 mt-1">{activeChat.department}</p>
          </div>

          {/* Contact Info */}
          <div className="p-5 border-b border-slate-100">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Contact Info</h4>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-slate-700">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-xs font-medium truncate">{activeChat.email}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-700">
                <PhoneIcon className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-xs font-medium truncate">{activeChat.phone}</span>
              </div>
            </div>
          </div>

          {/* Current Projects */}
          <div className="p-5 border-b border-slate-100">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Current Projects</h4>
            <div className="space-y-3">
              {activeChat.projects.map((proj, idx) => (
                <div key={idx} className="bg-white border border-slate-200 p-3 rounded-xl shadow-sm">
                  <h5 className="text-xs font-bold text-slate-800">{proj.name}</h5>
                  <p className="text-[9px] font-semibold text-slate-500 mt-1">Status: {proj.status}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Shared Files */}
          <div className="p-5">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Shared Files</h4>
            <button className="w-full flex items-center justify-between text-xs font-bold text-[#004495] hover:text-[#003370] p-2 hover:bg-blue-50 rounded-lg transition-colors group">
              <span>View all attachments</span>
              <ChevronRight className="w-4 h-4 text-blue-300 group-hover:text-[#004495] transition-colors" />
            </button>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-slate-100 bg-white">
          <button className="w-full flex items-center justify-center gap-2 text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 py-2.5 rounded-xl text-xs font-bold transition-colors">
            <Ban className="w-4 h-4" />
            Restrict Access
          </button>
        </div>
      </div>
      
    </div>
  );
}

// Simple icon for Team since Lucide Users wasn't imported at top
function UsersIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
