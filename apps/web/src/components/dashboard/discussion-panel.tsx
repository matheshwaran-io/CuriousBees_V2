'use client';

import React from 'react';
import Link from 'next/link';
import { MessageSquare, MoreVertical } from 'lucide-react';
import { Thread } from '@curiousbees/types';
import { formatDistanceToNow } from 'date-fns';

interface DiscussionPanelProps {
  threads: Thread[];
}

export default function DiscussionPanel({ threads }: DiscussionPanelProps) {
  
  // Custom mock fallbacks for when database has few threads or to keep fidelity to Stitch mockup
  const mockThreads = [
    {
      id: 'stitch-thread-1',
      title: 'Quantum Computing Applications in Biotech',
      content: "Dr. Verma's team is looking for ML specialists to assist with analyzing folding patterns generated from the new quantum sim...",
      tag: 'Cross-Department',
      replies: 4,
      activity: 'Active 2h ago',
      borderClass: 'border-primary',
      tagClass: 'text-primary'
    },
    {
      id: 'stitch-thread-2',
      title: 'DST SERB - Core Research Grant 2024',
      content: 'The institutional office has opened preliminary review slots for the upcoming SERB grant cycle. Submit draft abstracts by Friday.',
      tag: 'Grant Opportunity',
      replies: 12,
      activity: 'Active 1d ago',
      borderClass: 'border-secondary',
      tagClass: 'text-secondary'
    },
    {
      id: 'stitch-thread-3',
      title: 'Ethics in Autonomous Systems',
      content: 'Join the virtual roundtable discussing the recent IEEE guidelines on autonomous vehicle ethics protocols.',
      tag: 'Seminar Series',
      replies: 0,
      activity: 'No replies yet',
      borderClass: 'border-outline-variant',
      tagClass: 'text-on-surface-variant'
    }
  ];

  // Map database threads to Stitch panel. If DB threads are available, use them and enrich with Stitch styling.
  const displayThreads = threads.length > 0 
    ? threads.slice(0, 3).map((t, idx) => {
        let borderClass = 'border-outline-variant';
        let tagClass = 'text-on-surface-variant';
        if (idx === 0) {
          borderClass = 'border-primary';
          tagClass = 'text-primary';
        } else if (idx === 1) {
          borderClass = 'border-secondary';
          tagClass = 'text-secondary';
        }
        
        let relativeTime = 'Active recently';
        try {
          if (t.createdAt) {
            relativeTime = `Active ${formatDistanceToNow(new Date(t.createdAt))} ago`;
          }
        } catch (e) {}

        return {
          id: t.id,
          title: t.title,
          content: t.content,
          tag: t.tags?.[0] || 'Research',
          replies: t.comments?.length || 0,
          activity: t.comments && t.comments.length > 0 ? relativeTime : 'No replies yet',
          borderClass,
          tagClass
        };
      })
    : mockThreads;

  return (
    <section className="glass-card rounded-xl border border-outline-variant p-stack-md h-full flex flex-col select-none text-left">
      <div className="flex justify-between items-center mb-stack-md border-b border-outline-variant pb-2">
        <h3 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-secondary shrink-0" />
          <span>Ecosystem Discussions</span>
        </h3>
        <button className="p-1 hover:bg-surface-container rounded-full text-on-surface-variant transition-colors cursor-pointer">
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-col gap-stack-md flex-grow overflow-y-auto">
        {displayThreads.map((thread) => (
          <div key={thread.id} className={`border-l-2 ${thread.borderClass} pl-3 text-left`}>
            <span className={`font-label-caps text-label-caps uppercase tracking-wider text-[10px] ${thread.tagClass}`}>
              {thread.tag}
            </span>
            <Link href={`/threads/${thread.id}`}>
              <h4 className="font-label-md text-label-md text-on-surface font-semibold mt-1 cursor-pointer hover:underline line-clamp-2 leading-tight">
                {thread.title}
              </h4>
            </Link>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 line-clamp-2">
              {thread.content}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="font-label-caps text-label-caps text-on-surface-variant text-[10px]">
                {thread.replies > 0 ? `${thread.replies} Replies` : 'No replies yet'}
              </span>
              {thread.replies > 0 && (
                <>
                  <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                  <span className="font-label-caps text-label-caps text-on-surface-variant text-[10px]">
                    {thread.activity}
                  </span>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <Link href="/threads" className="mt-stack-md block">
        <button className="w-full py-2 border border-outline-variant rounded font-label-md text-label-md text-on-surface hover:bg-surface-container transition-colors cursor-pointer">
          Explore All Discussions
        </button>
      </Link>
    </section>
  );
}
