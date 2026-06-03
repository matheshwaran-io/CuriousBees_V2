'use client';

import React from 'react';
import Link from 'next/link';
import { Thread } from '@curiousbees/types';
import { MessageSquare, Calendar, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import GlassCard from './GlassCard';
import TagPill from './TagPill';

interface ThreadCardProps {
  thread: Thread;
}

export default function ThreadCard({ thread }: ThreadCardProps) {
  const formatDate = (dateStr: string | Date) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getInitials = (name?: string) => {
    if (!name) return 'RC';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="w-full text-left"
    >
      <GlassCard 
        hoverable={true} 
        className="p-5 md:p-6 relative group flex flex-col justify-between"
      >
        {/* Thread Author Profile & Title */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 select-none">
            <div className="flex items-center space-x-3">
              {/* Profile Avatar */}
              {thread.author?.image ? (
                <img src={thread.author.image} className="w-[32px] h-[32px] rounded-full object-cover border border-borderStroke" alt="" />
              ) : (
                <div className="w-[32px] h-[32px] rounded-full bg-darkSurfaceMuted border border-borderStroke flex items-center justify-center font-sans font-semibold text-black text-[11px]">
                  {getInitials(thread.author?.name || undefined)}
                </div>
              )}
              
              <div className="text-left font-sans">
                <div className="flex items-center space-x-2">
                  <span className="text-[13px] font-semibold text-black leading-none">
                    {thread.author?.name || 'Academic Scholar'}
                  </span>
                  <span className="bg-darkSurfaceMuted border border-borderStroke text-textSecondary text-[10px] px-1.5 py-0.5 rounded-full leading-none">
                    {thread.author?.role === 'RESEARCH_SUPERVISOR' ? 'Faculty' : 'Scholar'}
                  </span>
                </div>
                <p className="text-[11px] text-textMuted font-medium mt-1 leading-none">
                  {thread.author?.department?.split('(')[0].trim() || 'SRMIST'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center text-[12px] text-textMuted space-x-1.5 shrink-0 self-start sm:self-center">
              <Calendar className="w-3.5 h-3.5 text-textMuted shrink-0" />
              <span>{formatDate(thread.createdAt)}</span>
            </div>
          </div>

          {/* Thread Title & Preview */}
          <Link href={`/threads/${thread.id}`} className="block focus:outline-none mb-4 space-y-2">
            <h3 className="font-sans font-semibold text-[16px] text-black leading-snug">
              {thread.title}
            </h3>
            <p className="text-textSecondary font-sans font-normal text-[14px] leading-relaxed line-clamp-2">
              {thread.content}
            </p>
          </Link>
        </div>

        {/* Tags and Comments Bottom Row */}
        <div className="flex flex-wrap items-center justify-between border-t border-borderStroke pt-4 mt-2 gap-3">
          
          {/* Thread tags */}
          <div className="flex flex-wrap gap-1.5">
            {thread.tags.map((tag) => (
              <span key={tag} className="bg-darkSurfaceMuted border border-borderStroke text-textSecondary text-[12px] px-2.5 py-1 rounded-full leading-none font-medium">
                {tag}
              </span>
            ))}
          </div>

          {/* Comment Count & Link */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-[12px] text-textMuted space-x-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-textMuted shrink-0" />
              <span>{thread.comments?.length || thread._count?.comments || 0} comments</span>
            </div>

            <Link 
              href={`/threads/${thread.id}`} 
              className="flex items-center text-[13px] font-sans font-semibold text-black hover:text-textSecondary group-hover:translate-x-0.5 transition-all underline"
            >
              <span>View Thread</span>
              <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </div>

        </div>
      </GlassCard>
    </motion.div>
  );
}
