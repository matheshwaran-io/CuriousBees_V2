import React from 'react';
import { 
  MapPin, 
  CheckCircle,
  Share2,
  MessageSquare,
  Network,
  BookOpen,
  FolderOpen,
  Globe,
  Award,
  ArrowRight,
  ExternalLink,
  Edit3
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { useState, useEffect } from 'react';

interface PremiumProfileViewProps {
  user: any;
  isOwnProfile: boolean;
  onEditClick: () => void;
}

export function PremiumProfileView({ user, isOwnProfile, onEditClick }: PremiumProfileViewProps) {
  const { collabStatuses, fetchCollabStatus, sendCollabRequest, addToast } = useStore();
  const [isCollaborating, setIsCollaborating] = useState(false);

  useEffect(() => {
    if (user?.id && !isOwnProfile) {
      fetchCollabStatus(user.id);
    }
  }, [user?.id, isOwnProfile, fetchCollabStatus]);

  const collabState = collabStatuses[user?.id]?.status || 'NONE';
  const collabId = collabStatuses[user?.id]?.collaborationId;

  const handleCollabRequest = async () => {
    if (isOwnProfile || !user?.id) return;

    if (collabState === 'ACTIVE' && collabId) {
      window.location.href = `/nexus?collab=${collabId}`;
      return;
    }

    if (collabState === 'PENDING_SENT' || collabState === 'PENDING_RECEIVED') {
      window.location.href = `/nexus?view=requests`;
      return;
    }

    const defaultMsg = `I would like to explore potential research collaborations with you.`;
    const customMessage = window.prompt(`Send a collaboration request to ${user.name || 'this researcher'}`, defaultMsg);
    if (customMessage === null) return;

    setIsCollaborating(true);
    try {
      await sendCollabRequest(user.id, undefined, customMessage);
      addToast(`Collaboration request sent to ${user.name || 'researcher'}`, 'success');
    } catch (err: any) {
      addToast(err.message || 'Collaboration request failed', 'error');
    } finally {
      setIsCollaborating(false);
    }
  };
  
  // Safe fallbacks for user data
  const name = user?.name || 'Academic Scholar';
  const role = user?.role ? user.role.replace('_', ' ') : 'Research Scholar';
  const department = user?.department || 'Artificial Intelligence & Knowledge Systems';
  const bio = user?.bio || 'Building intelligent systems for research collaboration, academic networking, and knowledge discovery. Focused on bridging the gap between raw data and actionable scholarly insights.';
  
  // Safe extraction of interests/skills
  const interests = user?.interests?.map((i: any) => i.interest?.name || i.name || i) || ['Artificial Intelligence', 'Machine Learning', 'Knowledge Graphs', 'NLP'];
  if (interests.length === 0) {
    interests.push('Artificial Intelligence', 'Machine Learning', 'Knowledge Graphs', 'NLP');
  }

  // Profile Avatar Initials
  const getInitials = (n: string) => {
    return n.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  };

  return (
    <div className="w-full max-w-[1200px] mx-auto pb-12 font-sans bg-[#F9FAFB] min-h-screen">
      
      {/* ─── HERO BANNER & AVATAR ─── */}
      <div className="relative">
        {/* Banner */}
        <div className="h-48 w-full bg-gradient-to-br from-slate-800 via-slate-600 to-slate-400"></div>
        
        {/* Avatar */}
        <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 flex justify-center">
          <div className="relative">
            <div className="w-32 h-32 rounded-full border-4 border-[#F9FAFB] shadow-xl overflow-hidden bg-white flex items-center justify-center text-4xl font-bold text-slate-300">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={name} className="w-full h-full object-cover" />
              ) : (
                <span>{getInitials(name)}</span>
              )}
            </div>
            {/* Online Status Indicator */}
            <div className="absolute bottom-1 right-1 w-7 h-7 bg-emerald-500 border-4 border-[#F9FAFB] rounded-full"></div>
          </div>
        </div>
      </div>

      {/* ─── PROFILE HEADER ─── */}
      <div className="mt-20 px-6 text-center">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase flex items-center justify-center gap-2">
          {name}
          <CheckCircle className="w-6 h-6 text-slate-800" />
        </h1>
        
        <div className="mt-4 flex flex-col items-center justify-center gap-2 text-sm text-slate-600 font-medium">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-slate-400" /> <span className="capitalize">{role.toLowerCase()}</span>
          </div>
          <div className="flex items-center gap-2">
            <Network className="w-4 h-4 text-slate-400" /> <span>{department}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-slate-400" /> <span>SRM Institute of Science and Technology • Chennai, India</span>
          </div>
        </div>

        <p className="mt-6 max-w-2xl mx-auto text-sm text-slate-500 leading-relaxed">
          {bio}
        </p>

        {/* Skills/Interests */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {interests.map((skill: string, idx: number) => (
            <span key={idx} className="px-3 py-1.5 bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-bold rounded-lg shadow-sm">
              {skill}
            </span>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          {isOwnProfile ? (
            <button onClick={onEditClick} className="w-full sm:w-auto px-12 py-3 bg-[#3B82F6] hover:bg-blue-600 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2">
              <Edit3 className="w-4 h-4" /> Edit Profile
            </button>
          ) : (
            <button 
              onClick={handleCollabRequest}
              disabled={isCollaborating}
              className={`w-full sm:w-auto px-12 py-3 text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 ${
                collabState === 'ACTIVE'
                  ? 'bg-[#0C4DA2] hover:bg-blue-800 shadow-blue-500/20'
                  : collabState === 'PENDING_SENT'
                  ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20'
                  : collabState === 'PENDING_RECEIVED'
                  ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20'
                  : 'bg-[#3B82F6] hover:bg-blue-600 shadow-blue-500/20'
              }`}
            >
              <Network className="w-4 h-4" /> 
              {collabState === 'ACTIVE' ? 'Open Collab' : 
               collabState === 'PENDING_SENT' ? 'Request Sent' :
               collabState === 'PENDING_RECEIVED' ? 'Review Request' :
               'Collaborate'}
            </button>
          )}
          
          {!isOwnProfile && (
            <button className="w-full sm:w-auto px-8 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2">
              <MessageSquare className="w-4 h-4" /> Message
            </button>
          )}
          
          <button className="w-full sm:w-auto px-8 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2">
            <Share2 className="w-4 h-4" /> Share Profile
          </button>
        </div>
      </div>

      {/* ─── METRICS ROW ─── */}
      <div className="mt-12 px-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { icon: BookOpen, count: '24', label: 'PUBLICATIONS' },
            { icon: FolderOpen, count: '08', label: 'PROJECTS' },
            { icon: Network, count: '24', label: 'COLLABORATIONS' },
            { icon: Globe, count: '05', label: 'DOMAINS' },
            { icon: Award, count: '850+', label: 'CITATIONS' },
          ].map((stat, idx) => (
            <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-sm">
              <div className="w-8 h-8 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                <stat.icon className="w-4 h-4 text-slate-600" />
              </div>
              <h3 className="text-2xl font-black text-slate-900">{stat.count}</h3>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── MAIN CONTENT ─── */}
      <div className="mt-8 px-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Ecosystem & Portfolio */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Featured Ecosystem Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-8 relative overflow-hidden shadow-sm">
            <div className="absolute -right-10 -top-10 text-slate-50/50">
              <Network className="w-64 h-64" />
            </div>
            
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-4">
                <span className="px-3 py-1 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-full uppercase tracking-wider">Featured Ecosystem</span>
                <div className="flex items-center gap-1.5 text-emerald-600 text-[10px] font-bold uppercase tracking-wider">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> Active Development
                </div>
              </div>
              
              <h2 className="text-2xl font-black text-slate-900 leading-tight mb-3">
                CuriousBees Research Collaboration Ecosystem
              </h2>
              <p className="text-sm text-slate-500 leading-relaxed max-w-lg mb-8">
                An end-to-end intelligent platform leveraging Knowledge Graphs and NLP to identify high-impact collaboration opportunities across multidisciplinary academic departments.
              </p>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>Development Progress</span>
                  <span>75%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-[#3B82F6] h-2 rounded-full" style={{ width: '75%' }}></div>
                </div>
              </div>

              <button className="mt-8 text-[#3B82F6] font-bold text-sm flex items-center gap-2 hover:text-blue-700 transition-colors">
                View Documentation <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 3-Column Bottom Area */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Latest Publications */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-black text-slate-900">Latest Publications</h3>
                <span className="text-[10px] font-bold text-[#3B82F6] cursor-pointer">View All</span>
              </div>
              
              <div className="space-y-6">
                <div>
                  <p className="text-[9px] font-bold text-[#3B82F6] uppercase tracking-widest mb-1">NATURE QUANTUM • 2024</p>
                  <h4 className="text-sm font-bold text-slate-900 leading-tight">Neural Knowledge Graph Integration for Cross-Domain Academic Research Discovery</h4>
                  <p className="text-[11px] text-slate-500 mt-2 italic">Kumar, A., Zhang, L., et al.</p>
                  <div className="flex items-center gap-3 mt-3 text-[10px] text-slate-400 font-bold">
                    <span className="flex items-center gap-1">👁 1.2k</span>
                    <span className="flex items-center gap-1">❞ 86</span>
                  </div>
                </div>
                <div className="h-px bg-slate-100"></div>
                <div>
                  <p className="text-[9px] font-bold text-[#3B82F6] uppercase tracking-widest mb-1">IEEE AI TRANS • 2023</p>
                  <h4 className="text-sm font-bold text-slate-900 leading-tight">Optimizing Scholarly Networking via Multi-Agent Reinforcement Learning</h4>
                  <p className="text-[11px] text-slate-500 mt-2 italic">Kumar, A., Sharma, R.</p>
                  <div className="flex items-center gap-3 mt-3 text-[10px] text-slate-400 font-bold">
                    <span className="flex items-center gap-1">👁 840</span>
                    <span className="flex items-center gap-1">❞ 42</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Expertise */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-black text-slate-900 mb-6">Expertise</h3>
              
              <div className="space-y-5">
                <div>
                  <div className="flex justify-between text-[11px] font-bold text-slate-800 mb-1.5">
                    <span>Machine Learning</span>
                    <span className="text-slate-400">Expert</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div className="bg-slate-800 h-1.5 rounded-full" style={{ width: '90%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] font-bold text-slate-800 mb-1.5">
                    <span>Python & PyTorch</span>
                    <span className="text-slate-400">Advanced</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div className="bg-slate-800 h-1.5 rounded-full" style={{ width: '80%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] font-bold text-slate-800 mb-1.5">
                    <span>NLP & LLMs</span>
                    <span className="text-slate-400">Advanced</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div className="bg-slate-800 h-1.5 rounded-full" style={{ width: '75%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Journey */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-black text-slate-900 mb-6">Journey</h3>
              
              <div className="relative border-l border-slate-200 ml-2 space-y-6">
                <div className="relative pl-6">
                  <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 bg-[#3B82F6] rounded-full"></div>
                  <p className="text-[9px] font-bold text-[#3B82F6] uppercase tracking-widest mb-1">2026 (EXPECTED)</p>
                  <h4 className="text-xs font-bold text-slate-900">Ph.D. Completion</h4>
                  <p className="text-[10px] text-slate-500">SRM University • AI Lab</p>
                </div>
                
                <div className="relative pl-6">
                  <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 bg-slate-300 rounded-full"></div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">2025</p>
                  <h4 className="text-xs font-bold text-slate-900">Senior Research Fellow</h4>
                  <p className="text-[10px] text-slate-500">DST Grant</p>
                </div>
              </div>
            </div>
            
          </div>
        </div>

        {/* Right Col: Academic Hub */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2">ACADEMIC HUB</h3>
          
          <a href="#" className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl hover:border-slate-300 transition-colors shadow-sm group">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-xl">🎓</div>
              <span className="text-sm font-bold text-slate-900">Google Scholar</span>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
          </a>
          
          <a href="#" className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl hover:border-slate-300 transition-colors shadow-sm group">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 font-serif font-bold italic">R</div>
              <span className="text-sm font-bold text-slate-900">ResearchGate</span>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
          </a>

          <a href="#" className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl hover:border-slate-300 transition-colors shadow-sm group">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-lime-50 rounded-lg flex items-center justify-center text-lime-600 font-bold">iD</div>
              <span className="text-sm font-bold text-slate-900">ORCID iD</span>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
          </a>
        </div>
        
      </div>
    </div>
  );
}
