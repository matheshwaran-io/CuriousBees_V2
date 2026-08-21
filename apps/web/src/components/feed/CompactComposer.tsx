'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Paperclip, 
  Image as ImageIcon, 
  BookOpen, 
  Briefcase, 
  Hash, 
  Send, 
  X, 
  Sparkles, 
  Check, 
  Loader2,
  GraduationCap,
  MessageSquare,
  Award,
  Megaphone,
  HelpCircle,
  FileText,
  Users,
  BarChart3,
  AtSign,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { supabase, getStoragePublicUrl } from '@/lib/supabase';
import { getProfileImageUrl } from '@/lib/avatar';

const POST_TYPES = [
  { id: 'RESEARCH_UPDATE', label: 'Research Update', icon: MessageSquare, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { id: 'PUBLICATION', label: 'Publication', icon: BookOpen, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  { id: 'QUESTION', label: 'Research Question', icon: HelpCircle, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { id: 'COLLABORATION_REQUEST', label: 'Collaboration', icon: Users, color: 'text-[#0C4DA2] bg-blue-50 border-blue-200' },
  { id: 'ACHIEVEMENT', label: 'Achievement', icon: Award, color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
  { id: 'ANNOUNCEMENT', label: 'Announcement', icon: Megaphone, color: 'text-rose-600 bg-rose-50 border-rose-200' },
  { id: 'OPPORTUNITY', label: 'Opportunity', icon: Briefcase, color: 'text-teal-600 bg-teal-50 border-teal-200' },
];

interface CompactComposerProps {
  onPostCreated?: () => void;
}

export default function CompactComposer({ onPostCreated }: CompactComposerProps) {
  const { currentUser, createThread, addToast } = useStore();
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState('RESEARCH_UPDATE');
  const [tagsInput, setTagsInput] = useState('');
  const [isPaper, setIsPaper] = useState(false);
  const [journal, setJournal] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [attachment, setAttachment] = useState<{ name: string; size: string; url: string; type: string } | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const typeMenuRef = useRef<HTMLDivElement>(null);

  const avatarUrl = getProfileImageUrl(currentUser);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.max(textareaRef.current.scrollHeight, 52) + 'px';
    }
  }, [content]);

  // Close type menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (typeMenuRef.current && !typeMenuRef.current.contains(e.target as Node)) {
        setShowTypeMenu(false);
      }
    };
    if (showTypeMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showTypeMenu]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      addToast('File size must be less than 10MB', 'error');
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `post-attachments/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const publicUrl = getStoragePublicUrl('avatars', filePath);
      const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
      
      setAttachment({
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        url: publicUrl,
        type: isPdf ? 'pdf' : 'image'
      });

      if (isPdf) {
        setIsPaper(true);
      }
      addToast('Attachment uploaded successfully', 'success');
    } catch (err: any) {
      addToast(`Upload failed: ${err.message}`, 'error');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      addToast('Please write something to share', 'error');
      return;
    }

    if (content.trim().length < 10) {
      addToast('Your post must be at least 10 characters', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const parsedTags = tagsInput
        .split(/[,#\s]+/)
        .map(t => t.trim().replace(/^#/, ''))
        .filter(Boolean);

      // Also extract inline hashtags from content
      const inlineTags = content.match(/#\w+/g)?.map(t => t.replace('#', '')) || [];
      const allTags = Array.from(new Set([...parsedTags, ...inlineTags]));
      if (allTags.length === 0) allTags.push('Research');

      const contentText = content.replace(/#\w+/g, '').trim();
      const firstLine = contentText.split('\n')[0];
      const postTitle = firstLine.length > 55 
        ? firstLine.substring(0, 55) + '...' 
        : (firstLine.length >= 5 ? firstLine : 'Research Update');

      await createThread(postTitle, content, allTags, {
        type: postType,
        isPaper: isPaper || postType === 'PUBLICATION',
        paperJournal: journal || null,
        attachments: attachment ? [attachment] : []
      });

      setContent('');
      setTagsInput('');
      setJournal('');
      setAttachment(null);
      setIsPaper(false);
      setIsFocused(false);
      setPostType('RESEARCH_UPDATE');
      addToast('Research update published!', 'success');
      onPostCreated?.();
    } catch (err: any) {
      addToast(`Failed to publish: ${err.message}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddTag = () => {
    setContent(prev => prev + (prev.endsWith(' ') || prev.length === 0 ? '#' : ' #'));
    textareaRef.current?.focus();
  };

  const activeType = POST_TYPES.find(t => t.id === postType) || POST_TYPES[0];
  const charCount = content.length;
  const charLimit = 2500;
  const isOverLimit = charCount > charLimit;
  const canPost = content.trim().length >= 10 && !isOverLimit && !isSubmitting;

  // Filter post types based on role
  const availableTypes = POST_TYPES.filter(type => {
    if (type.id === 'ANNOUNCEMENT' && currentUser?.role !== 'RESEARCH_SUPERVISOR' && currentUser?.role !== 'INSTITUTE_ADMIN') return false;
    if (type.id === 'QUESTION' && currentUser?.role === 'RESEARCH_SUPERVISOR') return false;
    return true;
  });

  return (
    <>
      {/* Hidden file inputs */}
      <input 
        ref={fileInputRef}
        type="file" 
        className="hidden" 
        accept=".pdf,.doc,.docx"
        onChange={handleFileUpload} 
      />
      <input 
        ref={photoInputRef}
        type="file" 
        className="hidden" 
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileUpload} 
      />

      {/* ─── X-STYLE INLINE COMPOSER ─── */}
      <div className={`bg-white dark:bg-[#132238] border-b border-slate-200/80 dark:border-white/[0.08] transition-all ${isFocused ? 'border-b-[#0C4DA2]/20 dark:border-b-blue-500/30' : ''}`}>
        <div className="flex gap-3 p-4 pb-0">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 mt-0.5 border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
            <img src={avatarUrl} alt={currentUser?.name || 'User'} className="w-full h-full object-cover" />
          </div>

          {/* Textarea Area */}
          <div className="flex-1 min-w-0">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onFocus={() => setIsFocused(true)}
              placeholder="What's on your research mind?"
              className="w-full bg-transparent border-none resize-none text-[15px] text-slate-900 dark:text-[#F5F7FA] font-medium placeholder:text-slate-400 dark:placeholder:text-[#718096] placeholder:font-medium focus:outline-none min-h-[52px] leading-relaxed py-2.5"
              rows={1}
            />

            {/* Post Type Indicator (shown when focused) */}
            <AnimatePresence>
              {isFocused && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="mb-2"
                >
                  <div className="relative inline-block" ref={typeMenuRef}>
                    <button
                      type="button"
                      onClick={() => setShowTypeMenu(!showTypeMenu)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border transition-all cursor-pointer ${activeType.color} dark:bg-[#0B1728] dark:border-white/[0.12]`}
                    >
                      <activeType.icon className="w-3 h-3" />
                      <span>{activeType.label}</span>
                      <svg className={`w-3 h-3 transition-transform ${showTypeMenu ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                    </button>

                    {/* Type Dropdown */}
                    <AnimatePresence>
                      {showTypeMenu && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -4 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -4 }}
                          transition={{ duration: 0.15 }}
                          className="absolute left-0 top-full mt-1 w-52 bg-white dark:bg-[#101D30] rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.35)] border border-slate-200/80 dark:border-white/[0.10] py-1.5 z-30"
                        >
                          {availableTypes.map(type => (
                            <button
                              key={type.id}
                              onClick={() => {
                                setPostType(type.id);
                                setIsPaper(type.id === 'PUBLICATION');
                                setShowTypeMenu(false);
                              }}
                              className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-left text-xs font-bold transition-colors cursor-pointer ${
                                postType === type.id 
                                  ? 'bg-[#0C4DA2]/5 dark:bg-blue-600/20 text-[#0C4DA2] dark:text-[#3B82F6]' 
                                  : 'text-slate-700 dark:text-[#A7B3C5] hover:bg-slate-50 dark:hover:bg-[#172942]'
                              }`}
                            >
                              <type.icon className="w-4 h-4 shrink-0" />
                              <span>{type.label}</span>
                              {postType === type.id && <Check className="w-3.5 h-3.5 ml-auto text-[#0C4DA2] dark:text-[#3B82F6]" />}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Attachment Preview */}
            {attachment && (
              <div className="flex items-center gap-2 mb-2 bg-slate-50 dark:bg-[#0B1728] border border-slate-200/80 dark:border-white/[0.08] rounded-xl px-3 py-2">
                <FileText className="w-4 h-4 text-[#0C4DA2] dark:text-[#3B82F6] shrink-0" />
                <span className="text-xs font-bold text-slate-700 dark:text-[#F5F7FA] truncate flex-1">{attachment.name}</span>
                <span className="text-[10px] text-slate-400 dark:text-[#718096] font-medium shrink-0">{attachment.size}</span>
                <button 
                  onClick={() => { setAttachment(null); setIsPaper(false); }}
                  className="text-slate-400 hover:text-rose-500 transition-colors cursor-pointer p-0.5 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-full shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Journal field for publications */}
            <AnimatePresence>
              {isFocused && (postType === 'PUBLICATION' || isPaper) && (
                <motion.input
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  type="text"
                  value={journal}
                  onChange={(e) => setJournal(e.target.value)}
                  placeholder="Journal name (e.g., Nature, IEEE Trans.)"
                  className="w-full bg-transparent border-none text-xs text-slate-600 dark:text-[#E2E8F0] font-medium placeholder:text-slate-400 dark:placeholder:text-[#718096] focus:outline-none mb-2 pb-2 border-b border-slate-100 dark:border-white/[0.08]"
                />
              )}
            </AnimatePresence>

            {/* ─── BOTTOM ACTION BAR: Icon-only buttons + Post ─── */}
            <div className="flex items-center justify-between py-2.5 border-t border-slate-100 dark:border-white/[0.08]">
              {/* Left: Icon-only action buttons */}
              <div className="flex items-center gap-0.5">
                {/* Photo Upload */}
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-[#0C4DA2] dark:text-[#3B82F6] hover:bg-[#0C4DA2]/10 dark:hover:bg-blue-600/20 transition-all cursor-pointer disabled:opacity-40"
                  title="Photo"
                >
                  <ImageIcon className="w-[18px] h-[18px]" />
                </button>

                {/* PDF / Document Upload */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-[#0C4DA2] dark:text-[#3B82F6] hover:bg-[#0C4DA2]/10 dark:hover:bg-blue-600/20 transition-all cursor-pointer disabled:opacity-40"
                  title="PDF / Document"
                >
                  <FileText className="w-[18px] h-[18px]" />
                </button>

                {/* Paper / Publication */}
                <button
                  type="button"
                  onClick={() => { 
                    setPostType('PUBLICATION'); 
                    setIsPaper(true); 
                    setIsFocused(true);
                    textareaRef.current?.focus(); 
                  }}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                    postType === 'PUBLICATION' ? 'text-[#0C4DA2] dark:text-[#3B82F6] bg-[#0C4DA2]/10 dark:bg-blue-600/20' : 'text-[#0C4DA2] dark:text-[#3B82F6] hover:bg-[#0C4DA2]/10 dark:hover:bg-blue-600/20'
                  }`}
                  title="Research Paper"
                >
                  <BookOpen className="w-[18px] h-[18px]" />
                </button>

                {/* Hashtag */}
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-[#0C4DA2] dark:text-[#3B82F6] hover:bg-[#0C4DA2]/10 dark:hover:bg-blue-600/20 transition-all cursor-pointer"
                  title="Add Hashtag"
                >
                  <Hash className="w-[18px] h-[18px]" />
                </button>

                {/* Collaboration */}
                <button
                  type="button"
                  onClick={() => { 
                    setPostType('COLLABORATION_REQUEST'); 
                    setIsFocused(true);
                    textareaRef.current?.focus(); 
                  }}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                    postType === 'COLLABORATION_REQUEST' ? 'text-[#0C4DA2] dark:text-[#3B82F6] bg-[#0C4DA2]/10 dark:bg-blue-600/20' : 'text-[#0C4DA2] dark:text-[#3B82F6] hover:bg-[#0C4DA2]/10 dark:hover:bg-blue-600/20'
                  }`}
                  title="Collaboration Request"
                >
                  <Users className="w-[18px] h-[18px]" />
                </button>

                {/* Achievement */}
                <button
                  type="button"
                  onClick={() => { 
                    setPostType('ACHIEVEMENT'); 
                    setIsFocused(true);
                    textareaRef.current?.focus(); 
                  }}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                    postType === 'ACHIEVEMENT' ? 'text-amber-500 dark:text-[#F4B740] bg-amber-50 dark:bg-amber-950/30' : 'text-[#0C4DA2] dark:text-[#3B82F6] hover:bg-[#0C4DA2]/10 dark:hover:bg-blue-600/20'
                  }`}
                  title="Achievement"
                >
                  <Award className="w-[18px] h-[18px]" />
                </button>

                {/* Uploading indicator */}
                {isUploading && (
                  <div className="w-9 h-9 flex items-center justify-center">
                    <Loader2 className="w-4 h-4 text-[#0C4DA2] dark:text-[#3B82F6] animate-spin" />
                  </div>
                )}

                {/* Character count (shown when typing) */}
                {charCount > 0 && (
                  <span className={`text-[10px] font-bold ml-1 ${isOverLimit ? 'text-rose-500' : charCount > 2200 ? 'text-amber-500' : 'text-slate-400 dark:text-[#718096]'}`}>
                    {charCount}/{charLimit}
                  </span>
                )}
              </div>

              {/* Right: Post button */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canPost}
                className="px-5 py-2 bg-[#0C4DA2] dark:bg-[#2563EB] hover:bg-[#0a3f8a] dark:hover:bg-blue-600 text-white text-[13px] font-extrabold rounded-full transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : null}
                <span>Post</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
