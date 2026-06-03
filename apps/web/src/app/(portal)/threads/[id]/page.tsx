'use client';

import { useState, use } from 'react';
import { useStore } from '@/store/useStore';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateCommentSchema } from '@curiousbees/shared-utils';
import { 
  ArrowLeft, 
  MessageSquare, 
  Calendar, 
  Send, 
  GraduationCap, 
  UserSquare, 
  FileText,
  Bookmark,
  Share2,
  Paperclip
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface ThreadDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function ThreadDetailPage({ params }: ThreadDetailPageProps) {
  // Resolve params via standard React.use in Next.js 15
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  
  const router = useRouter();
  const { threads, addComment, currentUser } = useStore();
  const [commentInput, setCommentInput] = useState('');

  const thread = threads.find((t) => t.id === id);

  // Setup form validation
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(CreateCommentSchema),
    defaultValues: {
      content: '',
      threadId: id
    }
  });

  if (!thread) {
    return (
      <div className="glass-card rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/15">
        <h4 className="text-slate-900 dark:text-white font-bold text-lg">Proposal Not Found</h4>
        <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm max-w-sm mx-auto mt-2">
          This thread identifier does not match any portal discussion nodes.
        </p>
        <Link 
          href="/threads"
          className="mt-5 inline-block text-[10px] font-black uppercase tracking-wider text-srm-crimson dark:text-srm-gold border border-srm-crimson/20 dark:border-srm-gold/20 hover:border-srm-crimson dark:hover:border-srm-gold bg-srm-crimson/5 dark:bg-srm-gold/5 px-4 py-2 rounded-xl transition-all cursor-pointer"
        >
          Return to Feed
        </Link>
      </div>
    );
  }

  const handleCommentSubmit = async (data: any) => {
    try {
      await addComment(thread.id, data.content);
      reset(); // Clear input
    } catch (e: any) {
      alert(`Error submitting comment: ${e.message}`);
    }
  };

  const formatDate = (dateStr: string | Date) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getRoleBadge = (role: string) => {
    return role === 'RESEARCH_SUPERVISOR' 
      ? 'bg-srm-crimson/10 text-srm-crimson border-srm-crimson/20 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/30'
      : 'bg-srm-blue/10 text-srm-blue border-srm-blue/20 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/30';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 select-none">
      
      {/* 1. Navigation Header Row */}
      <div className="flex justify-between items-center text-left">
        <Link 
          href="/threads" 
          className="inline-flex items-center space-x-1.5 text-xs font-black uppercase tracking-wider text-slate-450 dark:text-slate-500 hover:text-slate-850 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" />
          <span>Back to Feed</span>
        </Link>

        <span className="text-[9px] text-slate-450 dark:text-slate-500 font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 px-3 py-1 rounded-full">
          NODE ID: {thread.id}
        </span>
      </div>

      {/* 2. Main Full Thread Article Card (Notion Layout) */}
      <motion.article 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900/15 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 text-left shadow-sm"
      >
        {/* Author Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 dark:border-slate-850 pb-5 gap-4">
          <div className="flex items-center space-x-3">
            <img 
              src={thread.author?.image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
              className="w-11 h-11 rounded-full object-cover border border-slate-200 dark:border-slate-800 shadow-sm shrink-0"
            />
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white leading-none">
                  {thread.author?.name}
                </h3>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase border leading-none ${getRoleBadge(thread.author?.role || '')}`}>
                  {thread.author?.role === 'RESEARCH_SUPERVISOR' ? (
                    <>
                      <GraduationCap className="w-2.5 h-2.5 mr-0.5" />
                      Faculty
                    </>
                  ) : (
                    <>
                      <UserSquare className="w-2.5 h-2.5 mr-0.5" />
                      Scholar
                    </>
                  )}
                </span>
              </div>
              <p className="text-[10px] text-slate-450 dark:text-slate-500 font-bold uppercase tracking-tight mt-1.5 leading-none">
                {thread.author?.department || 'SRM Institute'}
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right shrink-0">
            <p className="text-[10px] text-slate-450 dark:text-slate-500 font-black uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Published {formatDate(thread.createdAt)}</span>
            </p>
          </div>
        </div>

        {/* Content Body */}
        <div className="space-y-4">
          <h1 className="font-display font-black text-lg sm:text-xl text-slate-900 dark:text-white leading-tight">
            {thread.title}
          </h1>
          <div className="text-slate-650 dark:text-slate-350 text-xs leading-relaxed whitespace-pre-wrap font-sans bg-slate-50 dark:bg-slate-950/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-850/60 font-medium">
            {thread.content}
          </div>
        </div>

        {/* Dynamic File Attachment Mock */}
        <div className="space-y-2 text-left">
          <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">📎 References & Citations ({thread.tags.length > 2 ? 2 : 1})</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-850 rounded-xl flex items-center justify-between">
              <div className="flex items-center space-x-2 truncate">
                <FileText className="w-4 h-4 text-srm-crimson shrink-0" />
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-350 truncate">dst-serb-proposal-draft.pdf</span>
              </div>
              <span className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-600 shrink-0">3.4 MB</span>
            </div>
            {thread.tags.length > 2 && (
              <div className="p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-850 rounded-xl flex items-center justify-between">
                <div className="flex items-center space-x-2 truncate">
                  <Paperclip className="w-4 h-4 text-srm-blue shrink-0" />
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-350 truncate">gpgpu-docker-cluster-ssh.sh</span>
                </div>
                <span className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-600 shrink-0">12 KB</span>
              </div>
            )}
          </div>
        </div>

        {/* Tags footer section */}
        <div className="flex flex-wrap gap-1.5 pt-4 border-t border-slate-100 dark:border-slate-850/60">
          {thread.tags.map((tag) => (
            <span 
              key={tag}
              className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-555 dark:text-slate-400"
            >
              #{tag}
            </span>
          ))}
        </div>
      </motion.article>

      {/* 3. Comments conversation tree Section (Slack-style Nested Bubbles) */}
      <section className="space-y-6 text-left">
        <h3 className="font-display font-black text-sm uppercase tracking-wider text-slate-900 dark:text-white flex items-center space-x-2 border-b border-slate-100 dark:border-slate-850 pb-2">
          <MessageSquare className="w-4.5 h-4.5 text-srm-crimson dark:text-srm-gold" />
          <span>Discussion Thread ({thread.comments?.length || 0})</span>
        </h3>

        {/* Dynamic recursive comments map */}
        <div className="space-y-4">
          {thread.comments?.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-900/10 border border-slate-200 dark:border-slate-800 text-center">
              <p className="text-xs italic text-slate-400 dark:text-slate-500 font-semibold">No comments shared on this thread yet. Be the first to start the conversation!</p>
            </div>
          ) : (
            thread.comments?.map((comment) => (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                key={comment.id}
                className="p-4 bg-white dark:bg-slate-900/10 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-start space-x-3.5 shadow-sm"
              >
                <img 
                  src={comment.author?.image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
                  className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-800 shrink-0 shadow-sm" 
                />
                
                <div className="flex-1 space-y-2 min-w-0">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-white">{comment.author?.name}</span>
                      <span className={`inline-flex px-1.5 py-0.2 rounded-full text-[8px] font-black uppercase border leading-none ${getRoleBadge(comment.author?.role || '')}`}>
                        {comment.author?.role === 'RESEARCH_SUPERVISOR' ? 'Faculty' : 'Scholar'}
                      </span>
                    </div>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase">
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>
                  
                  <p className="text-slate-650 dark:text-slate-350 text-xs leading-relaxed font-sans font-medium">
                    {comment.content}
                  </p>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* 4. Add Comment Form card */}
        <div className="bg-white dark:bg-slate-900/15 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
          <form onSubmit={handleSubmit(handleCommentSubmit)} className="space-y-4">
            <div className="flex items-center space-x-2.5">
              <img 
                src={currentUser?.image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
                className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-800 shadow-sm" 
              />
              <span className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-widest">Adding response as <span className="text-srm-crimson dark:text-srm-gold">{currentUser?.name}</span></span>
            </div>

            <div className="relative">
              <textarea
                rows={3}
                {...register('content')}
                placeholder="Type your comment, resource sharing request, or peer inquiry..."
                className="w-full pl-4 pr-12 py-3 rounded-xl glass-input text-xs leading-relaxed font-sans font-semibold"
              />
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="absolute right-3 bottom-3.5 p-2 rounded-lg srm-gradient text-white hover:opacity-90 active:scale-95 transition-all shadow cursor-pointer"
              >
                {isSubmitting ? (
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent animate-spin rounded-full block" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
            {errors.content && <p className="text-[10px] text-red-500 font-semibold">{errors.content.message as string}</p>}
          </form>
        </div>

      </section>

    </div>
  );
}
