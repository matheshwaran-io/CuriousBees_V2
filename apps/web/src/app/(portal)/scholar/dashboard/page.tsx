'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useStore } from '@/store/useStore';
import {
  BookOpen,
  Calendar as CalendarIcon,
  FolderOpen,
  Briefcase,
  Megaphone,
  Bell,
  Plus,
  ArrowRight,
  TrendingUp,
  ChevronRight,
  Sparkles,
  ClipboardList,
  GraduationCap,
  Award,
  Users,
  CheckCircle2,
  Bookmark
} from 'lucide-react';
import { DashboardShell } from '@/components/shared/dashboard-shell';
import AvatarRing from '@/components/AvatarRing';
import { getRolePrefix } from '@/lib/auth/permissions';

export default function ScholarDashboard() {
  const {
    currentUser,
    opportunities,
    workspaces,
    publications,
    reports,
    events,
    notifications,
    peers,
    fetchSuggestedPeers,
    connectWithPeer,
    fetchWorkspaces,
    fetchPublications,
    fetchReports,
    fetchEvents,
    fetchNotifications,
  } = useStore();

  const [currentDate] = useState(new Date());
  const hasFetched = React.useRef(false);

  useEffect(() => {
    if (!currentUser || hasFetched.current) return;
    hasFetched.current = true;
    fetchWorkspaces();
    fetchPublications(currentUser.id);
    fetchReports();
    fetchEvents();
    fetchNotifications();
    fetchSuggestedPeers();
  }, [currentUser, fetchWorkspaces, fetchPublications, fetchReports, fetchEvents, fetchNotifications, fetchSuggestedPeers]);

  const prefix = '/scholar';

  // ─── ResearchGate Profile Strength Metric ─────────────────────────────────
  const hasBio = !!currentUser?.bio;
  const hasDepartment = !!currentUser?.department;
  const hasInterests = (currentUser?.interests?.length || 0) > 0;
  const hasPubs = publications.length > 0;
  const hasReports = reports.length > 0;
  
  let profileStrength = 30;
  if (hasBio) profileStrength += 15;
  if (hasDepartment) profileStrength += 15;
  if (hasInterests) profileStrength += 15;
  if (hasPubs) profileStrength += 15;
  if (hasReports) profileStrength += 10;

  // ─── Mini Calendar Grid Logic ─────────────────────────────────────────────
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const daysArray = [
    ...Array(firstDayIndex).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1)
  ];

  const hasEventOnDay = (day: number | null) => {
    if (!day) return false;
    const targetDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.some(ev => ev.date === targetDateStr);
  };

  return (
    <DashboardShell>
      {/* 🚀 1. NOTION-STYLE HERO HEADER */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#001E4C] via-[#002868] to-[#004495] cb-honeycomb-dark border border-[#004495]/15 p-6 md:p-8 shadow-xl text-left">
        <div className="absolute right-0 top-0 w-96 h-96 bg-[#FEC727]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-12 bottom-0 w-72 h-72 bg-[#004495]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 flex-1 min-w-0">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#FEC727]/25 text-[#FEC727] border border-[#FEC727]/30 text-[10px] font-bold uppercase tracking-wider">
              Research Scholar Portal
            </span>
            <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-white tracking-tight leading-tight">
              Welcome back, {currentUser?.name?.split(' ')[0] || 'Scholar'}!
            </h1>
            <p className="text-xs sm:text-sm text-white/80 font-medium max-w-xl leading-relaxed">
              Academic node online. Access co-authored workspaces, log publications, and coordinate research milestones.
            </p>
          </div>

          {currentUser && (
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex items-center gap-4 shrink-0 shadow-lg w-full md:w-auto">
              <AvatarRing
                src={currentUser.image}
                name={currentUser.name || undefined}
                role={currentUser.role}
                size="md"
              />
              <div className="text-left min-w-0">
                <h4 className="text-xs font-bold text-white truncate max-w-[150px]">{currentUser.name}</h4>
                <p className="text-[10px] text-white/60 font-medium truncate max-w-[150px]">{currentUser.email}</p>
                <span className="inline-flex items-center px-2 py-0.5 rounded bg-[#FEC727]/20 text-[#FEC727] border border-[#FEC727]/25 text-[8px] font-bold uppercase tracking-wider mt-1.5">
                  {currentUser.department?.split('(')[0].trim() || 'SRMIST'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 🚀 2. METRICS & RESEARCHGATE STRENGTH GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Completion Block */}
        <div className="cb-card p-5 bg-white flex flex-col justify-between lg:col-span-1 text-left">
          <div className="space-y-1.5 border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-800">
              Profile Completion
            </h3>
          </div>

          <div className="space-y-5 mt-4">
            <div className="space-y-2">
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                <div className="h-full bg-[#FEC727] rounded-full transition-all duration-500" style={{ width: `${profileStrength}%` }} />
              </div>
              <div className="flex justify-between items-center text-[11px] font-bold text-slate-600">
                <span>{profileStrength}% Complete</span>
                <Link href={`${prefix}/settings`} className="text-primary hover:underline font-semibold">Edit Info</Link>
              </div>
            </div>

            <div className="flex flex-col gap-3 text-xs font-semibold text-slate-700">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className={`w-4 h-4 ${hasBio ? 'text-[#059669]' : 'text-slate-300'}`} />
                <span className={!hasBio ? 'text-slate-400' : ''}>Academic History Verified</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className={`w-4 h-4 ${hasPubs ? 'text-[#059669]' : 'text-slate-300'}`} />
                <span className={!hasPubs ? 'text-slate-400' : ''}>Link ResearchGate Account</span>
              </div>
              <div className="flex items-center gap-2.5">
                {hasInterests ? (
                  <CheckCircle2 className="w-4 h-4 text-[#059669]" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-slate-300 shrink-0" />
                )}
                <span className={!hasInterests ? 'text-slate-400' : ''}>Complete Interests Tags</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Metric Cards */}
        <div className="cb-card p-5 bg-white flex flex-col justify-between text-left">
          <div className="flex items-start justify-between">
            <span className="cb-metric-label">Publications Logged</span>
            <div className="w-8 h-8 rounded-lg bg-[#004495]/5 border border-[#004495]/10 text-primary flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1 mt-2">
            <div className="cb-metric-value">{publications.length}</div>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Academic Journals & Patents</p>
          </div>
          <div className="text-[10px] text-[#059669] font-bold flex items-center gap-1 mt-3">
            <span>+2 logged this semester</span>
          </div>
        </div>

        <div className="cb-card p-5 bg-white flex flex-col justify-between text-left">
          <div className="flex items-start justify-between">
            <span className="cb-metric-label">Submitted Reports</span>
            <div className="w-8 h-8 rounded-lg bg-[#004495]/5 border border-[#004495]/10 text-primary flex items-center justify-center shrink-0">
              <ClipboardList className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1 mt-2">
            <div className="cb-metric-value">{reports.length}</div>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Milestone Progress Logs</p>
          </div>
          <div className="text-[10px] text-[#0055cc] font-bold flex items-center gap-1 mt-3">
            <span>Advisory validation active</span>
          </div>
        </div>
      </div>

      {/* 🚀 3. MAIN WORKSPACE CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Span 2) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Active Workspaces */}
          <div className="cb-card p-5 bg-white text-left space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-primary shrink-0" />
                <span>My Active Workspaces</span>
              </h3>
              <Link href={`${prefix}/workspaces`} className="text-[10px] font-bold text-primary hover:text-primary/80 flex items-center gap-0.5 transition-colors">
                <span>View All</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            {workspaces.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs font-medium bg-slate-50/50 border border-dashed border-slate-200 rounded-xl">
                You are not mapped to any active research workspaces yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {workspaces.slice(0, 4).map((ws) => {
                  const total = ws.milestones?.length || 0;
                  const completed = ws.milestones?.filter(m => m.completed).length || 0;
                  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

                  return (
                    <Link key={ws.id} href={`${prefix}/workspaces/${ws.id}`} className="group block">
                      <div className="p-4 border border-[#004495]/10 rounded-xl hover:border-primary bg-slate-50/30 hover:bg-white transition-all duration-200 hover:shadow-sm space-y-3 h-full flex flex-col justify-between">
                        <h4 className="text-xs font-bold text-slate-900 group-hover:text-primary transition-colors line-clamp-1 leading-tight">{ws.title}</h4>
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                            <span>Milestones</span>
                            <span className="text-primary">{percent}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                            <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${percent}%` }} />
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Funded Vacancies */}
          <div className="cb-card p-5 bg-white text-left space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-primary shrink-0" />
                <span>Funding Slots & Projects</span>
              </h3>
              <Link href={`${prefix}/opportunities`} className="text-[10px] font-bold text-primary hover:text-primary/80 flex items-center gap-0.5 transition-colors">
                <span>View All</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            {opportunities.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs font-medium bg-slate-50/50 border border-dashed border-slate-200 rounded-xl">
                No funded doctoral positions listed yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100/70">
                {opportunities.slice(0, 3).map((opp) => (
                  <div key={opp.id} className="py-3.5 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-1 leading-tight">{opp.title}</h4>
                      <p className="text-[10px] text-slate-500 font-medium mt-1 truncate">
                        🏫 {opp.department?.split('(')[0]} • <span className="text-primary font-semibold">#{opp.researchDomain}</span>
                      </p>
                    </div>
                    <Link href={`${prefix}/opportunities`} className="px-3 py-1.5 rounded-lg border border-[#004495]/20 hover:border-primary hover:bg-primary/5 text-[9px] font-bold uppercase tracking-wider shrink-0 transition-all">
                      Apply
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (Span 1) */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="cb-card p-5 bg-white text-left space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 border-b border-slate-100/80 pb-3">
              <Sparkles className="w-4 h-4 text-[#FEC727] animate-pulse shrink-0" />
              <span>Scholar Actions</span>
            </h3>
            <div className="flex flex-col gap-2">
              <Link href={`${prefix}/my-research`} className="w-full block">
                <button className="w-full py-2.5 bg-primary hover:bg-primary/95 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg shadow-sm flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-[0.98]">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Log Publication</span>
                </button>
              </Link>
              <Link href={`${prefix}/my-research`} className="w-full block">
                <button className="w-full py-2.5 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-350 text-slate-700 text-[10px] font-bold uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-[0.98]">
                  <ClipboardList className="w-3.5 h-3.5 text-slate-400" />
                  <span>Submit Progress Log</span>
                </button>
              </Link>
            </div>
          </div>

          {/* Mini calendar events */}
          <div className="cb-card p-5 bg-white text-left space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 border-b border-slate-100 pb-3">
              <CalendarIcon className="w-4 h-4 text-primary shrink-0" />
              <span>Calendar & Timetable</span>
            </h3>

            <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-200/50">
              <div className="text-center text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                {monthName} {year}
              </div>
              <div className="grid grid-cols-7 gap-1 text-center font-bold text-[9px] text-slate-400 mb-1">
                {dayNames.map(d => <span key={d}>{d}</span>)}
              </div>
              <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-bold text-slate-750">
                {daysArray.map((day, idx) => {
                  if (day === null) return <span key={`empty-${idx}`} />;
                  const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;
                  const hasEvents = hasEventOnDay(day);

                  return (
                    <div 
                      key={`day-${day}`} 
                      className={`relative w-6 h-6 flex items-center justify-center rounded-full mx-auto font-mono text-[9.5px] ${
                        isToday 
                          ? 'bg-primary text-white scale-110 shadow-sm font-bold' 
                          : hasEvents 
                          ? 'bg-primary/5 text-primary border border-primary/20 font-bold' 
                          : 'hover:bg-slate-100 cursor-pointer font-medium'
                      }`}
                    >
                      <span>{day}</span>
                      {hasEvents && !isToday && (
                        <span className="absolute bottom-0.5 w-1 h-1 bg-primary rounded-full" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2.5">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Timetable Ingestion</p>
              {events.length === 0 ? (
                <p className="text-[11px] text-slate-400 italic">No scheduled calendar events.</p>
              ) : (
                events.slice(0, 2).map((ev) => (
                  <div key={ev.id} className="text-xs flex gap-2 items-start leading-snug">
                    <span className="px-2 py-0.5 rounded bg-primary/5 text-primary text-[9px] font-mono font-bold shrink-0">{ev.date.substring(5)}</span>
                    <span className="font-semibold text-slate-700 truncate">{ev.title}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Broadcasts */}
          <div className="cb-card p-5 bg-white text-left space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Megaphone className="w-4 h-4 text-primary shrink-0" />
              <span>Campus Announcements</span>
            </h3>

            <div className="bg-amber-50/30 border border-amber-250/20 p-4 rounded-xl space-y-2">
              <h4 className="text-xs font-bold text-amber-800 leading-snug flex items-center gap-1">
                <Megaphone className="w-3.5 h-3.5 text-amber-700 animate-bounce shrink-0" />
                <span>Advisory Notice</span>
              </h4>
              <p className="text-[11px] text-slate-600 leading-relaxed font-semibold">
                Please complete your monthly progress logs and submit any co-authored publications before the semester audits.
              </p>
            </div>
          </div>

          {/* Suggested Collaborators */}
          <div className="cb-card p-5 bg-white text-left space-y-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center border-b border-slate-100/80 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Users className="w-4 h-4 text-primary shrink-0" />
                <span>Suggested Collaborators</span>
              </h3>
              <Link href={`${prefix}/connections`} className="text-[10px] font-bold text-primary hover:text-primary/80 transition-colors">
                View all
              </Link>
            </div>
            <div className="flex flex-col gap-3">
              {peers?.slice(0, 3).map((peer) => (
                <div key={peer.id} className="flex items-center justify-between gap-2 group">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img src={peer.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(peer.name)}&background=random`} className="w-8 h-8 rounded-full shrink-0 group-hover:ring-2 ring-primary/20 transition-all" alt="" />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{peer.name}</h4>
                      <p className="text-[10px] text-slate-500 truncate">{peer.role?.replace('_', ' ') || 'Researcher'}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => connectWithPeer(peer.id)}
                    className="px-3 py-1 text-[10px] font-bold rounded-full border border-slate-200 hover:border-primary text-slate-600 hover:text-primary transition-all shrink-0 bg-slate-50 group-hover:bg-white"
                  >
                    {peer.connectionStatus === 'connected' ? 'Connected' : peer.connectionStatus === 'pending' ? 'Pending' : 'Follow'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Your Interests */}
          <div className="cb-card p-5 bg-white text-left space-y-4 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 border-b border-slate-100/80 pb-3">
              <Bookmark className="w-4 h-4 text-primary shrink-0" />
              <span>Your Interests</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {currentUser?.interests?.map((tag: string) => (
                <span key={tag} className="px-2.5 py-1 text-[10px] font-bold bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200 transition-colors cursor-pointer">
                  #{tag}
                </span>
              ))}
              {(!currentUser?.interests || currentUser.interests.length === 0) && (
                <p className="text-xs text-slate-400 italic">No interests added yet.</p>
              )}
            </div>
          </div>

          {/* Recent Notifications */}
          <div className="cb-card p-5 bg-white text-left space-y-4 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 border-b border-slate-100/80 pb-3">
              <Bell className="w-4 h-4 text-primary shrink-0" />
              <span>Notifications</span>
            </h3>
            <div className="space-y-3">
              {notifications?.slice(0, 3).map((notif: any) => (
                <div key={notif.id} className="flex gap-2.5 items-start group cursor-pointer">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0 group-hover:scale-125 transition-transform" />
                  <div>
                    <h4 className="text-xs font-semibold text-slate-800 leading-snug group-hover:text-primary transition-colors">{notif.title}</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">{notif.message}</p>
                  </div>
                </div>
              ))}
              {(!notifications || notifications.length === 0) && (
                <p className="text-xs text-slate-400 italic">No new notifications.</p>
              )}
            </div>
          </div>
        </div>

      </div>
    </DashboardShell>
  );
}
