'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  UserPlus, 
  Check, 
  Tag, 
  ArrowRight
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
    currentUser,
    fetchSuggestedPeers, 
    fetchTrendingResearch, 
    followedUserIds,
    followedTopics,
    toggleFollowUser,
    toggleFollowTopic
  } = useStore();

  const [peers, setPeers] = useState<any[]>([]);
  const [trendingTags, setTrendingTags] = useState<Array<{ tag: string; count: number }>>([]);

  useEffect(() => {
    fetchSuggestedPeers().then(data => {
      setPeers(data || []);
    });

    fetchTrendingResearch().then(tags => {
      if (tags && tags.length > 0) {
        setTrendingTags(tags);
      } else {
        // Default high-quality research topics
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

  return (
    <aside className="w-full space-y-6 text-left pt-2 select-none">

      {/* ─── 1. RESEARCHERS YOU MAY WANT TO FOLLOW ─── */}
      <div className="bg-white/90 backdrop-blur-xl rounded-[28px] border border-slate-200/80 p-5 shadow-[0_8px_30px_rgb(12,77,162,0.03)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 leading-tight">
              Researchers You May Want to Follow
            </h3>
            <p className="text-[10px] font-semibold text-slate-400 mt-0.5">
              Based on your research domain & interests
            </p>
          </div>
          <Link href="/scholar/connections" className="text-[11px] font-bold text-[#0C4DA2] hover:underline shrink-0">
            View All
          </Link>
        </div>

        <div className="space-y-4">
          {peers.length === 0 ? (
            <p className="text-xs font-medium text-slate-400 italic py-2">
              Discovering relevant institutional researchers...
            </p>
          ) : (
            peers.slice(0, 5).map((peer) => {
              const name = peer.name || 'Scholar';
              const dept = peer.department || 'SRMIST';
              const roleLabel = peer.role || (peer.role === 'RESEARCH_SUPERVISOR' ? 'Research Supervisor' : 'Research Scholar');
              const isFollowed = !!followedUserIds[peer.id] || peer.isFollowing;
              const avatar = peer.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0C4DA2&color=fff&size=64`;
              const domainsList: string[] = peer.domains || peer.researchInterests || [];
              const reason = peer.reason || 'Active SRMIST Researcher';

              return (
                <div key={peer.id} className="p-3 rounded-2xl bg-slate-50/70 border border-slate-100 hover:border-slate-200 transition-all flex flex-col gap-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <Link href={`/researchers/${peer.id}`} className="flex items-center gap-3 min-w-0 flex-1 group">
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-white shadow-2xs shrink-0 bg-slate-200 ring-1 ring-slate-200 group-hover:ring-[#0C4DA2]/40 transition-all">
                        <img src={avatar} alt={name} className="w-full h-full object-cover" />
                      </div>
                      <div className="truncate min-w-0">
                        <h4 className="text-xs font-extrabold text-slate-900 truncate leading-tight group-hover:text-[#0C4DA2] transition-colors">
                          {name}
                        </h4>
                        <p className="text-[10px] font-bold text-slate-500 truncate mt-0.5">
                          {roleLabel} · {dept}
                        </p>
                      </div>
                    </Link>

                    {/* Optimistic Follow / Following Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFollowUser(peer.id);
                      }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all shrink-0 cursor-pointer ${
                        isFollowed 
                          ? 'bg-slate-200/80 text-slate-700 hover:bg-slate-300' 
                          : 'bg-[#0C4DA2] text-white hover:bg-[#042654] shadow-sm shadow-blue-900/20 active:scale-95'
                      }`}
                    >
                      {isFollowed ? 'Following' : 'Follow'}
                    </button>
                  </div>

                  {/* Domains Pill Tags */}
                  {domainsList.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {domainsList.slice(0, 3).map((domain, idx) => (
                        <span key={idx} className="text-[9px] font-bold bg-white text-[#0C4DA2] border border-slate-200 px-2 py-0.5 rounded-md">
                          {domain}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Recommendation Context Reason */}
                  <p className="text-[9px] font-bold text-[#0C4DA2] bg-blue-50/60 px-2 py-1 rounded-lg flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                    <span>{reason}</span>
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ─── 2. TRENDING RESEARCH TOPICS (#TAGS) ─── */}
      <div className="bg-white/90 backdrop-blur-xl rounded-[28px] border border-slate-200/80 p-5 shadow-[0_8px_30px_rgb(12,77,162,0.03)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 leading-tight">
              Trending Research Topics
            </h3>
            <p className="text-[10px] font-semibold text-slate-400 mt-0.5">
              Follow topics to personalize your feed
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {trendingTags.slice(0, 5).map((item) => {
            const cleanKey = item.tag.trim().toLowerCase().replace(/^#/, '');
            const isTopicFollowed = !!followedTopics[cleanKey];

            return (
              <div
                key={item.tag}
                className="flex items-center justify-between hover:bg-slate-50/80 p-2.5 rounded-2xl border border-transparent hover:border-slate-100 transition-all group"
              >
                <div 
                  onClick={() => onTagClick?.(item.tag)}
                  className="cursor-pointer min-w-0 flex-1 pr-2"
                >
                  <p className="text-xs font-black text-slate-900 group-hover:text-[#0C4DA2] truncate transition-colors">
                    #{item.tag}
                  </p>
                  <p className="text-[10px] font-semibold text-slate-400 mt-0.5">
                    {item.count} research interactions
                  </p>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFollowTopic(item.tag);
                  }}
                  className={`px-3 py-1 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                    isTopicFollowed
                      ? 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                      : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-[#0C4DA2] hover:text-white hover:border-[#0C4DA2]'
                  }`}
                >
                  {isTopicFollowed ? 'Following' : '+ Follow'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

    </aside>
  );
}
