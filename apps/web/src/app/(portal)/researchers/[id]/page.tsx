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
    <div className="min-h-[calc(100vh-4rem)] p-4 md:p-8 max-w-5xl mx-auto space-y-8 pb-32">
      {/* Back Button */}
      <button 
        onClick={() => router.push('/researchers')}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors text-xs font-bold uppercase tracking-wider"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Directory
      </button>

      {/* Profile Card Header */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 md:p-10 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-tr from-slate-700 to-slate-900 text-white font-bold flex items-center justify-center text-2xl shadow-md overflow-hidden flex-shrink-0">
              {researcher.image ? (
                <img src={researcher.image} alt={researcher.name} className="w-full h-full object-cover" />
              ) : (
                <span>{getInitials(researcher.name)}</span>
              )}
            </div>

            <div className="space-y-1.5">
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">{researcher.name}</h1>
              
              <div className="flex flex-wrap items-center gap-2.5 text-xs">
                <span className={cn(
                  "font-bold px-2.5 py-0.5 rounded-full",
                  researcher.role === 'RESEARCH_SUPERVISOR' 
                    ? "bg-amber-50 text-amber-700 border border-amber-200" 
                    : "bg-indigo-50 text-indigo-700 border border-indigo-100"
                )}>
                  {researcher.role === 'RESEARCH_SUPERVISOR' ? 'Faculty Supervisor' : 'Research Scholar'}
                </span>
                
                <span className="text-slate-400">•</span>
                
                <span className="flex items-center gap-1 text-slate-600 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> {researcher.department || 'SRMIST'}
                </span>
              </div>
              
              <div className="flex items-center gap-6 pt-3 text-xs">
                <div>
                  <span className="text-slate-900 font-extrabold text-sm">{status?.followersCount || 0}</span>
                  <span className="text-slate-500 ml-1 font-medium">Followers</span>
                </div>
                <div className="w-px h-4 bg-slate-200" />
                <div>
                  <span className="text-slate-900 font-extrabold text-sm">{status?.followingCount || 0}</span>
                  <span className="text-slate-500 ml-1 font-medium">Following</span>
                </div>
              </div>
            </div>
          </div>
          
          {currentUser?.id !== id && (
            <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3 pt-2 md:pt-0">
              <button
                onClick={handleFollowToggle}
                disabled={followMutation.isPending || unfollowMutation.isPending}
                className={cn(
                  "px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm",
                  status?.isFollowing
                    ? "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200" 
                    : "bg-indigo-600 text-white hover:bg-indigo-700"
                )}
              >
                {status?.isFollowing ? (
                  <><UserCheck className="w-4 h-4" /> Following</>
                ) : (
                  'Follow'
                )}
              </button>

              {researcher.role === 'RESEARCH_SUPERVISOR' && (currentUser?.role === 'RESEARCH_SCHOLAR' || !currentUser?.role) && (
                <button
                  onClick={async () => {
                    try {
                      const { apiFetch } = await import('@/lib/api-client');
                      await apiFetch('/api/users/request-supervisor', {
                        method: 'PUT',
                        body: JSON.stringify({ supervisorId: id }),
                      });
                      alert('Supervision request sent successfully to ' + researcher.name + '!');
                    } catch (err: any) {
                      alert(err.message || 'Failed to send supervision request.');
                    }
                  }}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white border border-amber-600 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <Award className="w-4 h-4" /> Request Supervision
                </button>
              )}

              <button 
                onClick={handleMessage}
                className="px-6 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4 text-slate-500" /> Message
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Column */}
        <div className="md:col-span-2 space-y-8">
          {/* Bio */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-slate-400" /> Academic Bio
            </h3>
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
              <p className="text-slate-700 leading-relaxed text-sm">
                {researcher.bio || `${researcher.name} is a ${researcher.role === 'RESEARCH_SUPERVISOR' ? 'faculty supervisor' : 'research scholar'} in the ${researcher.department || 'SRMIST'} department.`}
              </p>
            </div>
          </section>

          {/* Research Activity */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400" /> Research Activity & Output
            </h3>
            <div className="bg-white border border-slate-200/80 rounded-2xl p-8 text-center border-dashed shadow-sm">
              <p className="text-sm font-medium text-slate-500">Recent publications and research activity will be displayed here.</p>
            </div>
          </section>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-8">
          {/* Research Interests */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-slate-400" /> Research Focus Areas
            </h3>
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
              {researcher.sharedInterestCount > 0 && currentUser?.id !== id && (
                <div className="pb-4 border-b border-slate-100">
                  <p className="text-xs font-bold text-indigo-700 flex items-center gap-1.5 mb-2">
                    <Network className="w-3.5 h-3.5" /> {researcher.sharedInterestCount} Shared Interests
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {researcher.sharedInterests.map((interest: string) => (
                      <span key={`shared-${interest}`} className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg text-xs font-medium">
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex flex-wrap gap-1.5">
                {researcher.researchInterests?.map((interest: string) => {
                  if (researcher.sharedInterests?.includes(interest) && currentUser?.id !== id) return null;
                  return (
                    <span key={interest} className="px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-medium">
                      {interest}
                    </span>
                  );
                })}
                {!researcher.researchInterests?.length && (
                  <p className="text-xs text-slate-500">No research interests listed.</p>
                )}
              </div>
            </div>
          </section>

          {/* Collaboration Box */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-slate-400" /> Academic Collaboration
            </h3>
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                Connect and request alignment for co-authoring papers, joint proposal submissions, or workspace sharing.
              </p>
              <button className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-bold transition-colors border border-slate-200 flex items-center justify-center gap-2">
                Request Collaboration
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
