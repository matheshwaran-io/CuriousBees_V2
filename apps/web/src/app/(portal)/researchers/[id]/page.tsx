'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useResearchers } from '@/hooks/useResearchers';
import { useFollowStatus, useFollowUser, useUnfollowUser } from '@/hooks/useFollow';
import { useStore } from '@/store/useStore';
import { 
  ArrowLeft,
  MapPin, 
  Award,
  BookOpen,
  Network,
  Loader2,
  UserCheck,
  MessageSquare,
  FileText,
  Briefcase,
  Share2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AcademicProfileView } from '@/components/profile/AcademicProfileView';

export default function ResearcherProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { currentUser } = useStore();
  const id = params.id as string;

  const { data: directoryData, isLoading: isLoadingProfile } = useResearchers({ limit: 100 });
  const { data: followStatus, isLoading: isLoadingFollow } = useFollowStatus(id);
  
  const followMutation = useFollowUser();
  const unfollowMutation = useUnfollowUser();

  const researcher = (directoryData as any)?.items?.find((r: any) => r.id === id);
  const status = followStatus as any;

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  };

  if (isLoadingProfile || isLoadingFollow) {
    return (
      <div className="min-h-screen flex items-center justify-center gap-2 text-slate-500">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <span className="text-sm font-medium">Loading profile...</span>
      </div>
    );
  }

  if (!researcher) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">Researcher Not Found</h2>
        <button onClick={() => router.push('/researchers')} className="text-indigo-600 font-bold hover:underline">
          Return to Directory
        </button>
      </div>
    );
  }

  const handleFollowToggle = () => {
    if (status?.isFollowing) {
      unfollowMutation.mutate(id);
    } else {
      followMutation.mutate(id);
    }
  };

  const handleMessage = () => {
    router.push(`/nexus?userId=${id}`);
  };

  return (
    <div className="space-y-4">
      {/* Back Button */}
      <div className="max-w-[1240px] mx-auto px-4 md:px-8 pt-4">
        <button 
          onClick={() => router.push('/researchers')}
          className="flex items-center gap-2 text-[#6B7890] hover:text-[#004495] transition-colors text-xs font-bold uppercase tracking-wider cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Researcher Directory
        </button>
      </div>

      <AcademicProfileView
        user={researcher}
        isOwnProfile={currentUser?.id === id}
        isFollowing={status?.isFollowing}
        onFollowToggle={handleFollowToggle}
      />
    </div>
  );
}
