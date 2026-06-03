'use client';

import React from 'react';
import Link from 'next/link';
import { MessageSquare, Eye, Filter } from 'lucide-react';
import { Thread } from '@curiousbees/types';
import { formatDistanceToNow } from 'date-fns';

interface DiscussionFeedProps {
  threads: Thread[];
}

export default function DiscussionFeed({ threads }: DiscussionFeedProps) {
  
  // Custom mock threads matching high-fidelity Stitch mockup when DB has no threads
  const mockThreads = [
    {
      id: 'stitch-feed-1',
      title: 'Integrating LLMs into qualitative data analysis frameworks',
      content: 'We are looking for insights from the sociology department regarding the ethical boundaries of automated sentiment analysis on sensitive interview transcripts...',
      tag: 'Cross-Departmental',
      tagType: 'secondary', // secondary (yellow/amber)
      timeAgo: '2 hours ago',
      replies: 14,
      views: 120
    },
    {
      id: 'stitch-feed-2',
      title: 'NSF Horizon 2025: Collaborative Hubs for Quantum Materials',
      content: 'A new call has been released. Seeking PIs with expertise in topological insulators to form a consortium for the upcoming pre-proposal deadline.',
      tag: 'Grant Opportunity',
      tagType: 'primary', // primary (blue)
      timeAgo: 'Yesterday',
      replies: 5,
      views: 89
    }
  ];

  // Map database threads to Stitch dashboard list
  const displayThreads = threads.length > 0
    ? threads.slice(0, 3).map((t, idx) => {
        let tagType = 'primary';
        if (idx % 2 === 0) {
          tagType = 'secondary';
        }
        
        let relativeTime = 'Recently';
        try {
          if (t.createdAt) {
            relativeTime = formatDistanceToNow(new Date(t.createdAt)) + ' ago';
          }
        } catch (e) {}

        return {
          id: t.id,
          title: t.title,
          content: t.content,
          tag: t.tags?.[0] || 'Research',
          tagType,
          timeAgo: relativeTime,
          replies: t.comments?.length || 0,
          views: 120 - (idx * 24) // Simulated views for DB items
        };
      })
    : mockThreads;

  return (
    <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] select-none text-left">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary shrink-0" />
          <span>Discussion Feed</span>
        </h3>
        <button className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer p-1 hover:bg-surface-container rounded-full">
          <Filter className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4">
        {displayThreads.map((thread) => {
          const badgeClass = thread.tagType === 'secondary'
            ? 'bg-secondary/10 text-secondary'
            : 'bg-primary/10 text-primary';

          return (
            <div
              key={thread.id}
              className="pb-4 border-b border-outline-variant/30 last:border-0 last:pb-0 text-left"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2.5 py-1 rounded-full font-label-caps text-label-caps uppercase text-[10px] ${badgeClass}`}>
                  {thread.tag}
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  {thread.timeAgo}
                </span>
              </div>
              <Link href={`/threads/${thread.id}`}>
                <h4 className="font-label-md text-label-md text-on-surface hover:text-primary cursor-pointer mb-1 font-semibold leading-snug">
                  {thread.title}
                </h4>
              </Link>
              <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2 mb-3">
                {thread.content}
              </p>
              <div className="flex items-center gap-4 text-on-surface-variant font-body-sm text-body-sm">
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-4 h-4" /> {thread.replies} Replies
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" /> {thread.views} Views
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
