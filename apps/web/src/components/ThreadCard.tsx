'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Thread } from '@curiousbees/types';
import { MessageSquare, Calendar, ChevronRight, Heart, Repeat, Bookmark, Handshake } from 'lucide-react';
import { motion } from 'framer-motion';
import { useStore } from '@/store/useStore';

interface ThreadCardProps {
  thread: Thread;
}

export default function ThreadCard({ thread }: ThreadCardProps) {
  const router = useRouter();
  const [likesCount, setLikesCount] = useState(thread._count?.likes || 0);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const formatDate = (dateStr: string | Date) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getInitials = (name?: string) => {
    if (!name) return 'RC';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  const { currentUser, workspaces } = useStore();

  const hasValidRelationship = React.useMemo(() => {
    const author = thread.author;
    if (!currentUser || !author) return false;
    if (currentUser.id === author.id) return true;

    // 1. Direct Supervisor-Scholar relationship
    if (currentUser.supervisorId === author.id || author.supervisorId === currentUser.id) {
      return true;
    }

    // 2. Shared Workspace project collaboration
    const sharesWorkspace = workspaces.some((ws) => 
      ws.members?.some((m: any) => m.userId === author.id)
    );
    if (sharesWorkspace) {
      return true;
    }

    return false;
  }, [currentUser, thread.author, workspaces]);

  const handleCollaborate = () => {
    if (thread.author?.id) {
      if (hasValidRelationship) {
        router.push(`/nexus?userId=${thread.author.id}`);
      } else {
        router.push(`/researchers/${thread.author.id}`);
      }
    }
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm hover:shadow-md transition-all group"
    >
      <div className="flex items-start space-x-4">
        {/* Author Avatar */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-700 to-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
          {thread.author?.image ? (
            <img src={thread.author.image} alt={thread.author.name || ''} className="w-full h-full object-cover" />
          ) : (
            <span>{getInitials(thread.author?.name || undefined)}</span>
          )}
        </div>

        {/* Content Wrapper */}
        <div className="flex-1 min-w-0">
          
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
            <div>
              <Link href={`/researchers/${thread.author?.id || '#'}`} className="font-bold text-slate-900 text-sm hover:text-indigo-600 transition-colors">
                {thread.author?.name || 'Anonymous Researcher'}
              </Link>
              <p className="text-[11px] font-medium text-slate-500">
                {thread.author?.role === 'RESEARCH_SUPERVISOR' ? 'Research Supervisor' : 'Research Scholar'} • {thread.author?.department || 'SRMIST'}
              </p>
            </div>

            <div className="flex items-center text-[10px] text-slate-400 font-bold uppercase space-x-1.5 shrink-0 self-start sm:self-center">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{formatDate(thread.createdAt)}</span>
            </div>
          </div>

          {/* Thread Title & Preview */}
          <Link href={`/threads/${thread.id}`} className="block focus:outline-none mb-3 space-y-1">
            <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug">
              {thread.title}
            </h3>
            <p className="text-slate-600 font-sans font-normal text-xs leading-relaxed line-clamp-3">
              {thread.content}
            </p>
          </Link>

          {/* Thread tags */}
          {thread.tags && thread.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {thread.tags.map((tag) => (
                <span key={tag} className="bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Engagement Bar */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-semibold text-slate-500">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => {
                  setIsLiked(!isLiked);
                  setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
                }}
                className={`flex items-center gap-1 hover:text-red-500 transition-colors ${isLiked ? 'text-red-500 font-bold' : ''}`}
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                <span>{likesCount}</span>
              </button>

              <Link href={`/threads/${thread.id}`} className="flex items-center gap-1 hover:text-indigo-600 transition-colors">
                <MessageSquare className="w-4 h-4" />
                <span>{thread.comments?.length || thread._count?.comments || 0}</span>
              </Link>

              <button className="flex items-center gap-1 hover:text-indigo-600 transition-colors">
                <Repeat className="w-4 h-4" />
                <span>{thread._count?.shares || 0}</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCollaborate}
                className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-100 transition-colors"
              >
                <Handshake className="w-3.5 h-3.5 text-indigo-600" />
                <span>Collaborate</span>
              </button>

              <button
                onClick={() => setIsSaved(!isSaved)}
                className={`p-1.5 rounded-lg hover:bg-slate-100 transition-colors ${isSaved ? 'text-indigo-600' : 'text-slate-400'}`}
              >
                <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>

        </div>
      </div>
    </motion.div>
  );
}
