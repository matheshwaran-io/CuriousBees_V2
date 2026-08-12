'use client';

import React, { useState } from 'react';
import { useResearchers } from '@/hooks/useResearchers';
import { useFollowUser, useUnfollowUser } from '@/hooks/useFollow';
import { SRM_DEPARTMENTS } from '@curiousbees/shared-utils';
import { useStore } from '@/store/useStore';
import { 
  Users, 
  Search, 
  MapPin, 
  Award,
  BookOpen,
  Network,
  Loader2,
  ChevronRight,
  UserCheck,
  Sparkles,
  Filter,
  ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function ResearchersDiscoveryPage() {
  const { currentUser } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedRole, setSelectedRole] = useState('');

  // Fetch from our backend API
  const { data, isLoading } = useResearchers({
    q: searchQuery,
    department: selectedDept,
    role: selectedRole,
    limit: 50
  });

  const followMutation = useFollowUser();
  const unfollowMutation = useUnfollowUser();

  const handleFollowToggle = (researcher: any) => {
    if (researcher.isFollowing) {
      unfollowMutation.mutate(researcher.id);
    } else {
      followMutation.mutate(researcher.id);
    }
  };

  const researchers = (data as any)?.items?.filter((r: any) => r.id !== currentUser?.id) || [];
  
  // Suggest peers based on shared interests > 0
  const suggestedPeers = researchers
    .filter((r: any) => r.sharedInterestCount > 0 && !r.isFollowing)
    .sort((a: any, b: any) => b.sharedInterestCount - a.sharedInterestCount)
    .slice(0, 3);

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 md:p-8 max-w-7xl mx-auto space-y-8 pb-32">
      {/* ─── HEADER SECTION ─── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-white/80 backdrop-blur-md border border-slate-200/80 p-6 md:p-8 rounded-3xl shadow-sm">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
              <Network className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              Academic Network
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            Researcher Network
          </h1>
          <p className="text-slate-600 max-w-2xl text-sm md:text-base leading-relaxed">
            Discover scholars and supervisors across SRMIST. Connect over shared research interests, follow active work, and foster cross-disciplinary collaboration.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/80 px-4 py-2.5 rounded-2xl">
          <Users className="w-5 h-5 text-indigo-600" />
          <div className="text-xs">
            <p className="font-bold text-slate-900">{researchers.length} Researchers</p>
            <p className="text-slate-500">Available in directory</p>
          </div>
        </div>
      </div>

      {/* ─── SUGGESTED PEERS ─── */}
      {suggestedPeers.length > 0 && !searchQuery && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider text-xs">
              Suggested Peers (Shared Focus)
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {suggestedPeers.map((peer: any) => (
              <motion.div 
                key={`suggested-${peer.id}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-indigo-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all flex flex-col justify-between relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Network className="w-20 h-20 text-indigo-600" />
                </div>
                
                <div className="space-y-4 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#0C4DA2] to-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-md overflow-hidden flex-shrink-0">
                      {peer.image ? (
                        <img src={peer.image} alt={peer.name} className="w-full h-full object-cover" />
                      ) : (
                        <span>{getInitials(peer.name)}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-slate-900 text-base truncate group-hover:text-indigo-600 transition-colors">
                        {peer.name}
                      </h3>
                      <p className="text-xs font-semibold text-indigo-600">
                        {peer.role === 'RESEARCH_SUPERVISOR' || peer.role === 'SUPERVISOR' ? 'Research Supervisor' : 'Research Scholar'}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{peer.department || 'SRMIST'}</p>
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                    <BookOpen className="w-3.5 h-3.5" />
                    {peer.sharedInterestCount} Shared Research Interests
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-5 relative z-10">
                  <button
                    onClick={() => handleFollowToggle(peer)}
                    disabled={followMutation.isPending || unfollowMutation.isPending}
                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5"
                  >
                    Follow
                  </button>
                  <Link 
                    href={`/researchers/${peer.id}`}
                    className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition-colors border border-slate-200 flex items-center gap-1"
                  >
                    Profile <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* ─── DIRECTORY SECTION ─── */}
      <section className="space-y-6">
        {/* Controls Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search researchers by name, department, or research interests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm font-medium transition-all"
            />
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white min-w-[150px] transition-all"
            >
              <option value="">All Roles</option>
              <option value="RESEARCH_SUPERVISOR">Supervisors</option>
              <option value="RESEARCH_SCHOLAR">Scholars</option>
            </select>

            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white min-w-[180px] max-w-[240px] transition-all"
            >
              <option value="">All Departments</option>
              {SRM_DEPARTMENTS.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Directory Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="text-sm font-medium text-slate-500">Loading researcher network...</p>
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
                  className="bg-white border border-slate-200/80 hover:border-indigo-300 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group"
                >
                  <Link href={`/researchers/${researcher.id}`} className="p-5 block space-y-4 flex-1">
                    <div className="flex items-start gap-3.5">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-slate-700 to-slate-900 text-white font-bold flex items-center justify-center text-sm shadow-sm overflow-hidden flex-shrink-0">
                        {researcher.image ? (
                          <img src={researcher.image} alt={researcher.name} className="w-full h-full object-cover" />
                        ) : (
                          <span>{getInitials(researcher.name)}</span>
                        )}
                      </div>
                      
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-slate-900 text-base truncate group-hover:text-indigo-600 transition-colors">
                          {researcher.name}
                        </h3>
                        <span className={cn(
                          "inline-block text-[11px] font-bold px-2 py-0.5 rounded-full mb-1",
                          researcher.role === 'RESEARCH_SUPERVISOR' 
                            ? "bg-amber-50 text-amber-700 border border-amber-200" 
                            : "bg-indigo-50 text-indigo-700 border border-indigo-100"
                        )}>
                          {researcher.role === 'RESEARCH_SUPERVISOR' || researcher.role === 'SUPERVISOR' ? 'Research Supervisor' : 'Research Scholar'}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-slate-500 truncate">
                          <MapPin className="w-3 h-3 flex-shrink-0 text-slate-400" />
                          <span className="truncate">{researcher.department || 'SRMIST'}</span>
                        </div>
                      </div>
                    </div>

                    {researcher.bio && (
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {researcher.bio}
                      </p>
                    )}

                    {researcher.researchInterests?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {researcher.researchInterests.slice(0, 3).map((interest: string) => (
                          <span key={interest} className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded-md text-[11px] font-medium text-slate-600 max-w-full truncate">
                            {interest}
                          </span>
                        ))}
                        {researcher.researchInterests.length > 3 && (
                          <span className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded-md text-[11px] font-medium text-slate-500">
                            +{researcher.researchInterests.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </Link>

                  <div className="px-5 pb-5 pt-2 border-t border-slate-100 flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleFollowToggle(researcher);
                      }}
                      disabled={followMutation.isPending || unfollowMutation.isPending}
                      className={cn(
                        "flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm",
                        researcher.isFollowing 
                          ? "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200" 
                          : "bg-indigo-600 text-white hover:bg-indigo-700"
                      )}
                    >
                      {researcher.isFollowing ? (
                        <>
                          <UserCheck className="w-3.5 h-3.5" /> Following
                        </>
                      ) : (
                        'Follow'
                      )}
                    </button>

                    <Link
                      href={`/researchers/${researcher.id}`}
                      className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors"
                    >
                      Profile
                    </Link>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center shadow-sm max-w-xl mx-auto space-y-4">
            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto text-indigo-600">
              <Search className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">No Researchers Found</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                No active scholars or supervisors matched your current search filters. Try clearing your search query or department selection.
              </p>
            </div>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedDept('');
                setSelectedRole('');
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
