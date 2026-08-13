'use client';

import React from 'react';
import { BookOpen, Edit3 } from 'lucide-react';

interface ResearchSummaryCardProps {
  bio?: string | null;
  isOwnProfile?: boolean;
  onEditClick?: () => void;
}

export function ResearchSummaryCard({ bio, isOwnProfile, onEditClick }: ResearchSummaryCardProps) {
  const summaryText = bio || 'Researcher working on intelligent systems and applied machine learning, with a focus on developing practical AI solutions for real-world institutional and research problems.';

  return (
    <div className="bg-white border border-[#E4E9F2] rounded-2xl p-6 shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#0C4DA2]">
          <BookOpen className="w-4 h-4 text-[#0C4DA2]" />
          <span>Research Profile</span>
        </div>
        {isOwnProfile && onEditClick && (
          <button
            onClick={onEditClick}
            className="text-xs font-bold text-[#0C4DA2] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" /> Edit
          </button>
        )}
      </div>

      <p className="text-sm md:text-base font-medium text-[#17233D] leading-relaxed border-l-3 border-[#0C4DA2] pl-4 py-0.5">
        &ldquo;{summaryText}&rdquo;
      </p>
    </div>
  );
}
