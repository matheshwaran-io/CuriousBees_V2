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
import { getProfileImageUrl } from '@/lib/avatar';

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

      {/* ─── 1. RESEARCHERS YOU MAY KNOW ─── */}
      <div className="bg-white/90 dark:bg-[#132238] backdrop-blur-xl rounded-[28px] border border-slate-200/80 dark:border-white/[0.08] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.25)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-[#F5F7FA] leading-tight">
              Researchers You May Know
            </h3>
            <p className="text-[10px] font-semibold text-slate-400 dark:text-[#718096] mt-0.5">
              Based on your research domain & interests
            </p>
          </div>
          <Link href="/scholar/connections" className="text-[11px] font-bold text-[#0C4DA2] dark:text-[#3B82F6] hover:underline shrink-0">
            View All
          </Link>
        </div>

        <div className="space-y-3">
          {peers.length === 0 ? (
            <p className="text-xs font-medium text-slate-400 dark:text-[#718096] italic py-2">
              Discovering relevant institutional researchers...
            </p>
          ) : (
            peers.slice(0, 5).map((peer) => {
              const name = peer.name || 'Scholar';
              const dept = peer.department || 'SRMIST';
              const roleLabel = peer.role || (peer.role === 'RESEARCH_SUPERVISOR' ? 'Research Supervisor' : 'Research Scholar');
              const avatar = getProfileImageUrl(peer);
              const domainsList: string[] = peer.domains || peer.researchInterests || [];

              return (
                <Link 
                  key={peer.id} 
                  href={`/researchers/${peer.id}`}
                  className="p-3 rounded-2xl bg-slate-50/70 dark:bg-[#0B1728] border border-slate-100 dark:border-white/[0.06] hover:border-slate-200 dark:hover:border-white/[0.12] hover:bg-slate-100/60 dark:hover:bg-[#101D30] transition-all flex flex-col gap-2 group block"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-white dark:border-slate-700 shadow-2xs shrink-0 bg-slate-200 dark:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-700 group-hover:ring-[#0C4DA2]/40 transition-all">
                      <img src={avatar} alt={name} className="w-full h-full object-cover" />
                    </div>
                    <div className="truncate min-w-0 flex-1">
                      <h4 className="text-xs font-extrabold text-slate-900 dark:text-[#F5F7FA] truncate leading-tight group-hover:text-[#0C4DA2] dark:group-hover:text-[#3B82F6] transition-colors">
                        {name}
                      </h4>
                      <p className="text-[10px] font-bold text-slate-500 dark:text-[#A7B3C5] truncate mt-0.5">
                        {roleLabel} · {dept}
                      </p>
                    </div>
                  </div>

                  {/* Domains Pill Tags */}
                  {domainsList.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {domainsList.slice(0, 3).map((domain, idx) => (
                        <span key={idx} className="text-[9px] font-bold bg-white dark:bg-[#101D30] text-[#0C4DA2] dark:text-[#38BDF8] border border-slate-200 dark:border-white/[0.08] px-2 py-0.5 rounded-md">
                          {domain}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              );
            })
          )}
        </div>
      </div>

      {/* ─── 2. TRENDING RESEARCH TOPICS (#TAGS) ─── */}
      <div className="bg-white/90 dark:bg-[#132238] backdrop-blur-xl rounded-[28px] border border-slate-200/80 dark:border-white/[0.08] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.25)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-[#F5F7FA] leading-tight">
              Trending Research Topics
            </h3>
            <p className="text-[10px] font-semibold text-slate-400 dark:text-[#718096] mt-0.5">
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
                className="flex items-center justify-between hover:bg-slate-50/80 dark:hover:bg-[#101D30] p-2.5 rounded-2xl border border-transparent hover:border-slate-100 dark:hover:border-white/[0.06] transition-all group"
              >
                <div 
                  onClick={() => onTagClick?.(item.tag)}
                  className="cursor-pointer min-w-0 flex-1 pr-2"
                >
                  <p className="text-xs font-black text-slate-900 dark:text-[#F5F7FA] group-hover:text-[#0C4DA2] dark:group-hover:text-[#3B82F6] truncate transition-colors">
                    #{item.tag}
                  </p>
                  <p className="text-[10px] font-semibold text-slate-400 dark:text-[#718096] mt-0.5">
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
                      ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-700/40 hover:bg-amber-100'
                      : 'bg-slate-100 dark:bg-[#0B1728] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/[0.08] hover:bg-[#0C4DA2] dark:hover:bg-[#2563EB] hover:text-white hover:border-[#0C4DA2]'
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
