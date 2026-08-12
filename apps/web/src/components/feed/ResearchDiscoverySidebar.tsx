'use client';

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  UserPlus, 
  Check, 
  Calendar, 
  Sparkles, 
  ChevronRight, 
  BookOpen,
  ArrowUpRight,
  Filter
} from 'lucide-react';
import Link from 'next/link';
import { useStore } from '@/store/useStore';

interface ResearchDiscoverySidebarProps {
  onSearchChange?: (query: string) => void;
  onTagClick?: (tag: string) => void;
}

export default function ResearchDiscoverySidebar({
  onSearchChange,
  onTagClick
}: ResearchDiscoverySidebarProps) {
  const { 
    searchQuery, 
    setSearchQuery, 
    currentUser,
    fetchSuggestedPeers, 
    fetchTrendingResearch, 
    connectWithPeer, 
    addToast 
  } = useStore();

  // Extract current user's research interests as string array
  const currentUserInterests = (currentUser?.interests || []).map(
    (i: any) => i.interest?.name || i.name || ''
  ).filter(Boolean);

  const [peers, setPeers] = useState<any[]>([]);
  const [trendingTags, setTrendingTags] = useState<Array<{ tag: string; count: number }>>([]);
  const [followedPeers, setFollowedPeers] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchSuggestedPeers().then(data => {
      setPeers(data || []);
    });

    fetchTrendingResearch().then(tags => {
      if (tags && tags.length > 0) {
        setTrendingTags(tags);
      } else {
        // High quality academic defaults if backend initial DB is empty
        setTrendingTags([
          { tag: 'GenerativeAI', count: 142 },
          { tag: 'Bioinformatics', count: 98 },
          { tag: 'QuantumComputing', count: 76 },
          { tag: 'Cybersecurity', count: 64 },
          { tag: 'CleanEnergy', count: 45 }
        ]);
      }
    });
  }, [fetchSuggestedPeers, fetchTrendingResearch]);

  const handleFollowToggle = async (peerId: string, peerName: string) => {
    const nextState = !followedPeers[peerId];
    setFollowedPeers(prev => ({ ...prev, [peerId]: nextState }));

    try {
      await connectWithPeer(peerId);
      addToast(nextState ? `You are now following ${peerName}` : `Unfollowed ${peerName}`, 'info');
    } catch (err: any) {
      addToast(err.message || 'Failed to update follow status', 'error');
    }
  };

  const academicDomains = [
    'Artificial Intelligence',
    'Bioinformatics',
    'Cloud Computing',
    'Cybersecurity',
    'Data Science',
    'Robotics & Automation'
  ];

  return (
    <aside className="w-full space-y-4 text-left pt-3">

      {/* ─── 2. PEOPLE WITH SIMILAR INTERESTS ─── */}
      <div className="bg-slate-50/70 rounded-3xl border border-slate-200/70 p-4">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#0C4DA2]" />
            <span>Similar Interests</span>
          </h3>
          <Link href="/scholar/connections" className="text-[10px] font-bold text-[#0C4DA2] hover:underline">
            View All
          </Link>
        </div>
        {currentUserInterests.length > 0 && (
          <p className="text-[10px] font-medium text-slate-400 mb-3 pl-5.5">
            Based on your interest in {currentUserInterests.slice(0, 2).join(', ')}
          </p>
        )}

        <div className="space-y-3">
          {peers.length === 0 ? (
            <p className="text-xs font-medium text-slate-400 italic py-2">Discovering researchers with similar interests...</p>
          ) : (
            peers.slice(0, 4).map((peer) => {
              const name = peer.name || 'Scholar';
              const dept = peer.department || 'SRMIST';
              const roleLabel = peer.role === 'RESEARCH_SUPERVISOR' ? 'Supervisor' : 'Scholar';
              const isFollowed = followedPeers[peer.id];
              const avatar = peer.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0C4DA2&color=fff&size=64`;

              // Find shared interests between current user and this peer
              const peerInterests = (peer.interests || []).map((i: any) => i.interest?.name || i.name || '').filter(Boolean);
              const sharedInterests = peerInterests.filter((pi: string) => 
                currentUserInterests.some(ui => ui.toLowerCase() === pi.toLowerCase())
              );
              const displayInterest = sharedInterests[0] || peerInterests[0] || dept;

              return (
                <div key={peer.id} className="flex items-center justify-between gap-2">
                  <Link href={`/researchers/${peer.id}`} className="flex items-center gap-2.5 min-w-0 flex-1 group">
                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm shrink-0 bg-slate-200 ring-1 ring-slate-200 group-hover:ring-[#0C4DA2]/30 transition-all">
                      <img src={avatar} alt={name} className="w-full h-full object-cover" />
                    </div>
                    <div className="truncate min-w-0">
                      <p className="text-[13px] font-black text-slate-900 truncate leading-tight group-hover:text-[#0C4DA2] transition-colors">{name}</p>
                      <p className="text-[10px] font-semibold text-slate-400 truncate mt-0.5">{roleLabel} · {dept}</p>
                      {displayInterest && (
                        <p className={`text-[10px] font-bold truncate mt-0.5 ${sharedInterests.length > 0 ? 'text-[#0C4DA2]' : 'text-slate-400'}`}>
                          {sharedInterests.length > 0 ? `🎯 ${displayInterest}` : displayInterest}
                        </p>
                      )}
                    </div>
                  </Link>

                  <button
                    onClick={() => handleFollowToggle(peer.id, name)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all shrink-0 cursor-pointer active:scale-95 ${
                      isFollowed 
                        ? 'bg-slate-200 text-slate-700 hover:bg-slate-300 border border-slate-300' 
                        : 'bg-[#0C4DA2] text-white hover:bg-[#042654] shadow-sm'
                    }`}
                  >
                    {isFollowed ? 'Following' : 'Follow'}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ─── 3. TRENDING RESEARCH ─── */}
      <div className="bg-slate-50/70 rounded-3xl border border-slate-200/70 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-[#0C4DA2]" />
            <span>Trending Research</span>
          </h3>
        </div>

        <div className="space-y-3">
          {trendingTags.slice(0, 4).map((item) => (
            <div
              key={item.tag}
              onClick={() => onTagClick?.(item.tag)}
              className="flex items-center justify-between hover:bg-slate-100/80 p-2 rounded-2xl transition-all cursor-pointer group"
            >
              <div>
                <p className="text-xs font-extrabold text-slate-900 group-hover:text-[#0C4DA2]">
                  #{item.tag}
                </p>
                <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                  {item.count} research interactions
                </p>
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#0C4DA2] transition-colors" />
            </div>
          ))}
        </div>
      </div>

      {/* ─── 4. RESEARCH DOMAINS ─── */}
      <div className="bg-slate-50/70 rounded-3xl border border-slate-200/70 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5 text-[#0C4DA2]" />
            <span>Research Domains</span>
          </h3>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {academicDomains.map((domain) => (
            <button
              key={domain}
              onClick={() => onTagClick?.(domain)}
              className="px-3 py-1 bg-white border border-slate-200/80 text-slate-700 hover:text-[#0C4DA2] hover:border-[#0C4DA2]/40 rounded-full text-[11px] font-bold transition-all cursor-pointer shadow-2xs"
            >
              {domain}
            </button>
          ))}
        </div>
      </div>

      {/* ─── 5. UPCOMING EVENTS & SYMPOSIUMS ─── */}
      <div className="bg-slate-50/70 rounded-3xl border border-slate-200/70 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-amber-500" />
            <span>Upcoming Symposiums</span>
          </h3>
          <Link href="/events" className="text-[10px] font-bold text-[#0C4DA2] hover:underline">
            View All
          </Link>
        </div>

        <div className="space-y-2.5">
          <div className="bg-white p-3 rounded-2xl border border-slate-200/60 shadow-2xs">
            <span className="text-[9px] font-black uppercase tracking-wider bg-blue-50 text-[#0C4DA2] px-2 py-0.5 rounded-full">
              University Conference
            </span>
            <p className="text-xs font-bold text-slate-900 mt-1.5 leading-snug">
              SRMIST Annual Research Day & Innovation Expo
            </p>
            <p className="text-[10px] font-semibold text-slate-400 mt-1">
              Tomorrow · Tech Park Auditorium
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
