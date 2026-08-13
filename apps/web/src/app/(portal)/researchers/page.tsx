'use client';

import React, { useState } from 'react';
import { useResearchers } from '@/hooks/useResearchers';
import { useFollowUser, useUnfollowUser, useToggleFollowNotifications } from '@/hooks/useFollow';
import { SRM_DEPARTMENTS } from '@curiousbees/shared-utils';
import { useStore } from '@/store/useStore';
import { 
  Users, 
  Search, 
  MapPin, 
  Network, 
  Loader2, 
  UserCheck, 
  Sparkles, 
  ArrowUpRight,
  Bell,
  BellOff,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { getProfileImageUrl } from '@/lib/avatar';

export default function ResearchersDiscoveryPage() {
  const { currentUser } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedRole, setSelectedRole] = useState('');

  // Fetch from backend API
  const { data, isLoading } = useResearchers({
    q: searchQuery,
    department: selectedDept,
    role: selectedRole,
    limit: 50
  });

  const followMutation = useFollowUser();
  const unfollowMutation = useUnfollowUser();
  const toggleNotifyMutation = useToggleFollowNotifications();

  const handleFollowToggle = (researcher: any) => {
    if (researcher.isFollowing) {
      unfollowMutation.mutate(researcher.id);
    } else {
      followMutation.mutate(researcher.id);
    }
  };

  const handleNotificationToggle = (researcher: any) => {
    const nextState = !researcher.notificationsEnabled;
    toggleNotifyMutation.mutate({ userId: researcher.id, enabled: nextState });
  };

  const researchers = (data as any)?.items?.filter((r: any) => r.id !== currentUser?.id) || [];
  const totalCount = (data as any)?.pagination?.total ?? researchers.length;
  
  // Suggest peers based on shared interests > 0
  const suggestedPeers = researchers
    .filter((r: any) => r.sharedInterestCount > 0 && !r.isFollowing)
    .sort((a: any, b: any) => b.sharedInterestCount - a.sharedInterestCount)
    .slice(0, 3);

  const getInitials = (name: string) => {
    if (!name) return 'R';
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 md:p-8 max-w-7xl mx-auto space-y-8 pb-32 select-none text-left">
      
      {/* ─── 1. HEADER SECTION ─── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-white/90 backdrop-blur-xl border border-slate-200/80 p-6 md:p-8 rounded-3xl shadow-sm">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-[#0C4DA2]/10 text-[#0C4DA2] rounded-xl border border-blue-100">
              <Network className="w-5 h-5" />
            </span>
            <span className="text-xs font-black uppercase tracking-widest text-[#0C4DA2]">
              ACADEMIC NETWORK
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight font-display">
            Researcher Network
          </h1>
          <p className="text-slate-600 max-w-2xl text-sm md:text-base leading-relaxed font-medium">
            Discover Research Supervisors and Scholars across CuriousBees. Explore research profiles, follow researchers you care about, and stay updated on their latest publications and research activity.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/80 px-4 py-3 rounded-2xl shrink-0">
          <Users className="w-5 h-5 text-[#0C4DA2]" />
          <div className="text-xs">
            <p className="font-extrabold text-slate-900">{totalCount} Researchers</p>
            <p className="text-slate-500 font-medium">Across CuriousBees</p>
          </div>
        </div>
      </div>

      {/* ─── 2. SUGGESTED PEERS ─── */}
      {suggestedPeers.length > 0 && !searchQuery && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#0C4DA2]" />
            <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest">
              Suggested Peers (Shared Focus)
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {suggestedPeers.map((peer: any) => (
              <motion.div 
                key={`suggested-${peer.id}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between relative overflow-hidden group"
              >
                <div className="space-y-4 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200">
                      <img src={getProfileImageUrl(peer)} alt={peer.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-extrabold text-slate-900 text-base truncate group-hover:text-[#0C4DA2] transition-colors">
                        {peer.name}
                      </h3>
                      <span className={cn(
                        "inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-full mb-0.5",
                        peer.role === 'RESEARCH_SUPERVISOR' || peer.role === 'SUPERVISOR'
                          ? "bg-amber-50 text-amber-700 border border-amber-200" 
                          : "bg-blue-50 text-[#0C4DA2] border border-blue-100"
                      )}>
                        {peer.role === 'RESEARCH_SUPERVISOR' || peer.role === 'SUPERVISOR' ? 'Research Supervisor' : 'Research Scholar'}
                      </span>
                      <p className="text-xs text-slate-500 truncate font-medium">{peer.department || 'SRMIST'}</p>
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0C4DA2] bg-blue-50/70 px-2.5 py-1 rounded-lg border border-blue-100">
                    <BookOpen className="w-3.5 h-3.5" />
                    {peer.sharedInterestCount} Shared Research Interests
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-5 relative z-10">
                  <button
                    onClick={() => handleFollowToggle(peer)}
                    disabled={followMutation.isPending || unfollowMutation.isPending}
                    className="flex-1 py-2 bg-[#0C4DA2] hover:bg-[#042654] text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    Follow
                  </button>
                  <Link 
                    href={`/researchers/${peer.id}`}
                    className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition-colors border border-slate-200 flex items-center gap-1 cursor-pointer"
                  >
                    Profile <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* ─── 3. SEARCH & CONTROLS SECTION ─── */}
      <section className="space-y-6">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search researchers by name, department, or research interests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0C4DA2] focus:bg-white text-xs md:text-sm font-semibold transition-all"
            />
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs md:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#0C4DA2] focus:bg-white min-w-[170px] transition-all cursor-pointer"
            >
              <option value="">All Roles</option>
              <option value="RESEARCH_SUPERVISOR">Research Supervisors</option>
              <option value="RESEARCH_SCHOLAR">Research Scholars</option>
            </select>

            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs md:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#0C4DA2] focus:bg-white min-w-[180px] max-w-[240px] transition-all cursor-pointer"
            >
              <option value="">All Departments</option>
              {SRM_DEPARTMENTS.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ─── 4. DIRECTORY GRID ─── */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 text-[#0C4DA2] animate-spin" />
            <p className="text-sm font-bold text-slate-500">Loading researcher network...</p>
          </div>
        ) : researchers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence>
              {researchers.map((researcher: any) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.2 }}
                  key={`dir-${researcher.id}`}
                  className="bg-white border border-slate-200/80 hover:border-blue-300 rounded-2xl shadow-2xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group"
                >
                  <Link href={`/researchers/${researcher.id}`} className="p-5 block space-y-4 flex-1 cursor-pointer">
                    <div className="flex items-start gap-3.5">
                      <div className="w-12 h-12 rounded-full bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200">
                        <img src={getProfileImageUrl(researcher)} alt={researcher.name} className="w-full h-full object-cover" />
                      </div>
                      
                      <div className="min-w-0 flex-1">
                        <h3 className="font-extrabold text-slate-900 text-base truncate group-hover:text-[#0C4DA2] transition-colors">
                          {researcher.name}
                        </h3>
                        <span className={cn(
                          "inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-full mb-1",
                          researcher.role === 'RESEARCH_SUPERVISOR' || researcher.role === 'SUPERVISOR'
                            ? "bg-amber-50 text-amber-700 border border-amber-200" 
                            : "bg-blue-50 text-[#0C4DA2] border border-blue-100"
                        )}>
                          {researcher.role === 'RESEARCH_SUPERVISOR' || researcher.role === 'SUPERVISOR' ? 'Research Supervisor' : 'Research Scholar'}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-slate-500 truncate font-medium">
                          <MapPin className="w-3 h-3 flex-shrink-0 text-slate-400" />
                          <span className="truncate">{researcher.department || 'SRMIST'}</span>
                        </div>
                      </div>
                    </div>

                    {researcher.bio && (
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-normal">
                        {researcher.bio}
                      </p>
                    )}

                    {researcher.researchInterests?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {researcher.researchInterests.slice(0, 3).map((interest: string) => (
                          <span key={interest} className="px-2 py-0.5 bg-slate-50 border border-slate-200/80 rounded-md text-[11px] font-bold text-slate-600 max-w-full truncate">
                            {interest}
                          </span>
                        ))}
                        {researcher.researchInterests.length > 3 && (
                          <span className="px-2 py-0.5 bg-slate-50 border border-slate-200/80 rounded-md text-[11px] font-bold text-slate-500">
                            +{researcher.researchInterests.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </Link>

                  {/* Card Actions: Follow + Notification Bell Toggle */}
                  <div className="px-5 pb-5 pt-3 border-t border-slate-100 flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleFollowToggle(researcher);
                      }}
                      disabled={followMutation.isPending || unfollowMutation.isPending}
                      className={cn(
                        "flex-1 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer",
                        researcher.isFollowing 
                          ? "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200" 
                          : "bg-[#0C4DA2] text-white hover:bg-[#042654]"
                      )}
                    >
                      {researcher.isFollowing ? (
                        <>
                          <UserCheck className="w-3.5 h-3.5 text-emerald-600" /> Following
                        </>
                      ) : (
                        'Follow'
                      )}
                    </button>

                    {/* Notification Bell Control for Followed Researcher */}
                    {researcher.isFollowing && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleNotificationToggle(researcher);
                        }}
                        disabled={toggleNotifyMutation.isPending}
                        title={researcher.notificationsEnabled ? "Notifications ON (Click to mute)" : "Notifications OFF (Click to enable)"}
                        className={cn(
                          "p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center",
                          researcher.notificationsEnabled
                            ? "bg-blue-50 text-[#0C4DA2] border-blue-200 hover:bg-blue-100"
                            : "bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100 hover:text-slate-600"
                        )}
                      >
                        {researcher.notificationsEnabled ? (
                          <Bell className="w-4 h-4 text-[#0C4DA2]" />
                        ) : (
                          <BellOff className="w-4 h-4 text-slate-400" />
                        )}
                      </button>
                    )}

                    <Link
                      href={`/researchers/${researcher.id}`}
                      className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors cursor-pointer"
                    >
                      View Profile
                    </Link>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          /* Empty State */
          <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center shadow-sm max-w-xl mx-auto space-y-4">
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto text-[#0C4DA2]">
              <Search className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-extrabold text-slate-900">
                {searchQuery || selectedDept || selectedRole ? 'No Researchers Found' : 'No Researchers Available'}
              </h3>
              <p className="text-xs md:text-sm text-slate-500 max-w-md mx-auto font-medium">
                {searchQuery || selectedDept || selectedRole
                  ? 'No researchers match your current search or filters. Try adjusting your search criteria.'
                  : 'Research Supervisors and Scholars will appear here once they are available in CuriousBees.'}
              </p>
            </div>
            {(searchQuery || selectedDept || selectedRole) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedDept('');
                  setSelectedRole('');
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
