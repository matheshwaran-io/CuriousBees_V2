'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Network, BookOpen, ExternalLink } from 'lucide-react';
import { getProfileImageUrl } from '@/lib/avatar';

interface ResearchCollaborationsCardProps {
  collaborations?: any[];
  currentUserId?: string;
}

export function ResearchCollaborationsCard({ collaborations = [], currentUserId }: ResearchCollaborationsCardProps) {
  const router = useRouter();

  if (!collaborations || collaborations.length === 0) {
    return (
      <div className="bg-white border border-[#E4E9F2] rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#0C4DA2]">
            <Network className="w-4 h-4 text-[#0C4DA2]" />
            <span>Active Research Collaborations</span>
          </div>
        </div>

        <div className="text-center py-6 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <p className="text-xs font-bold text-slate-500">No active research collaborations yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#E4E9F2] rounded-2xl p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#0C4DA2]">
          <Network className="w-4 h-4 text-[#0C4DA2]" />
          <span>Active Research Collaborations ({collaborations.length})</span>
        </div>
      </div>

      <div className="space-y-3 pt-1">
        {collaborations.map((collab) => {
          const partner = collab.recipient?.id === currentUserId ? collab.requester : collab.recipient || collab.partner;

          return (
            <div
              key={collab.id}
              className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-200 hover:bg-blue-50/30 transition-all flex items-center justify-between gap-4 flex-wrap"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full border border-slate-200 overflow-hidden bg-white shrink-0">
                  <img src={getProfileImageUrl(partner)} alt={partner?.name || 'Collaborator'} className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-extrabold text-[#17233D] truncate">{partner?.name || 'Collaborating Researcher'}</h4>
                  <p className="text-[11px] text-slate-500 font-medium truncate">
                    {collab.topic || partner?.department || 'Active Collaboration'}
                  </p>
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 mt-0.5">
                    ● ACTIVE
                  </span>
                </div>
              </div>

              <button
                onClick={() => router.push(`/nexus?collab=${collab.id}`)}
                className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Open Nexus</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
