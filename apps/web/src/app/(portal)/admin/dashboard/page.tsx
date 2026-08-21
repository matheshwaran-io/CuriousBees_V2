'use client';

/**
 * Admin Governance Dashboard — Institutional Command Center
 */

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import {
  Users,
  GraduationCap,
  UserCheck,
  Shield,
  ShieldAlert,
  FolderGit2,
  BookOpen,
  AlertTriangle,
  ArrowUpRight,
  RefreshCw,
  Loader2,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Lock,
  History,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function AdminDashboardPage() {
  const router = useRouter();
  const {
    currentUser,
    fetchAdminDashboardStats,
    fetchAdminNeedsAttention,
  } = useStore();

  const [stats, setStats] = useState<any>(null);
  const [needsAttention, setNeedsAttention] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Role Gate
  useEffect(() => {
    if (currentUser && currentUser.role !== 'INSTITUTE_ADMIN') {
      router.replace('/dashboard');
    }
  }, [currentUser, router]);

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [statsData, attentionData] = await Promise.all([
        fetchAdminDashboardStats(),
        fetchAdminNeedsAttention(),
      ]);
      setStats(statsData);
      setNeedsAttention(attentionData || []);
    } catch (err) {
      console.error('Failed to load admin dashboard data', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-[#0C4DA2] dark:text-[#3B82F6] animate-spin" />
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Loading institutional governance metrics...
        </p>
      </div>
    );
  }

  const kpis = [
    {
      title: 'Total Users',
      value: stats?.totalUsers ?? 0,
      icon: Users,
      href: '/admin/users',
      accent: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-100 dark:border-blue-900/40',
    },
    {
      title: 'Active Scholars',
      value: stats?.activeScholars ?? 0,
      icon: GraduationCap,
      href: '/admin/users?tab=SCHOLARS',
      accent: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-100 dark:border-indigo-900/40',
    },
    {
      title: 'Active Supervisors',
      value: stats?.activeSupervisors ?? 0,
      icon: UserCheck,
      href: '/admin/users?tab=SUPERVISORS',
      accent: 'text-teal-600 dark:text-teal-400',
      bg: 'bg-teal-50 dark:bg-teal-950/40 border-teal-100 dark:border-teal-900/40',
    },
    {
      title: 'Active Administrators',
      value: stats?.activeAdmins ?? 0,
      icon: Shield,
      href: '/admin/users?tab=ADMINS',
      accent: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-950/40 border-purple-100 dark:border-purple-900/40',
    },
    {
      title: 'Suspended Accounts',
      value: stats?.suspendedAccounts ?? 0,
      icon: ShieldAlert,
      href: '/admin/users?tab=SUSPENDED',
      accent: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-100 dark:border-rose-900/40',
    },
    {
      title: 'Active Workspaces',
      value: stats?.activeWorkspaces ?? 0,
      icon: FolderGit2,
      href: '/admin/research-workspaces',
      accent: 'text-cyan-600 dark:text-cyan-400',
      bg: 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-100 dark:border-cyan-900/40',
    },
    {
      title: 'Publications',
      value: stats?.publications ?? 0,
      icon: BookOpen,
      href: '/admin/publications',
      accent: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-900/40',
    },
    {
      title: 'Open Reports',
      value: stats?.openReports ?? 0,
      icon: AlertTriangle,
      href: '/admin/moderation',
      accent: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-100 dark:border-amber-900/40',
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-2 select-none">
      {/* Executive Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200/80 dark:border-white/[0.08] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#0C4DA2]/10 text-[#0C4DA2] dark:bg-blue-600/20 dark:text-[#3B82F6] border border-[#0C4DA2]/20">
              Institutional Governance
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-bold">•</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
              Live Database Telemetry
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-[#F5F7FA] tracking-tight mt-1">
            Institute Governance
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-[#A7B3C5] font-semibold mt-0.5">
            Monitor users, research activity, compliance and platform health.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-[#0B1728] border border-slate-200/80 dark:border-white/[0.08] text-slate-700 dark:text-[#F5F7FA] hover:bg-slate-50 dark:hover:bg-[#132238] transition-all shadow-2xs cursor-pointer"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', refreshing && 'animate-spin')} />
            <span>Refresh</span>
          </button>
          <Link
            href="/admin/settings"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold bg-[#0C4DA2] hover:bg-[#042654] dark:bg-[#2563EB] dark:hover:bg-blue-600 text-white transition-all shadow-sm cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>System Settings</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <Link
              key={idx}
              href={kpi.href}
              className="bg-white dark:bg-[#07111F] border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-4 transition-all duration-150 hover:shadow-md hover:border-slate-300 dark:hover:border-white/[0.16] flex flex-col justify-between group cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center border', kpi.bg)}>
                  <Icon className={cn('w-4 h-4', kpi.accent)} />
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-slate-900 dark:text-[#F5F7FA] tracking-tight">
                  {kpi.value.toLocaleString()}
                </div>
                <p className="text-[11px] font-bold text-slate-500 dark:text-[#A7B3C5] mt-0.5">
                  {kpi.title}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* NEEDS ATTENTION SECTION */}
      <div className="bg-white dark:bg-[#07111F] border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.08] pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-[#F5F7FA]">
                Needs Attention
              </h2>
              <p className="text-xs text-slate-500 dark:text-[#A7B3C5] font-semibold">
                Actionable governance items requiring administrative review
              </p>
            </div>
          </div>

          <span className="px-2.5 py-1 rounded-full text-xs font-black bg-slate-100 dark:bg-[#0E1E33] text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-white/[0.08]">
            {needsAttention.length} Pending
          </span>
        </div>

        {needsAttention.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-[#F5F7FA]">All systems clear</h3>
            <p className="text-xs text-slate-400 dark:text-[#718096] max-w-sm">
              There are currently no open reports, urgent security events, or suspended account reviews requiring attention.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-white/[0.06]">
            {needsAttention.map((item) => (
              <div
                key={item.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-[#0B1728] px-2 rounded-xl transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border',
                        item.severity === 'CRITICAL'
                          ? 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900/60'
                          : item.severity === 'HIGH'
                          ? 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900/60'
                          : 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-900/60'
                      )}
                    >
                      {item.severity}
                    </span>
                    <span className="text-xs font-black text-slate-900 dark:text-[#F5F7FA]">
                      {item.title}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-[#A7B3C5] font-medium leading-relaxed">
                    {item.description}
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-[#718096]">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(item.timestamp).toLocaleString()}</span>
                  </div>
                </div>

                <Link
                  href={item.actionUrl}
                  className="shrink-0 self-start sm:self-center flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#0C4DA2]/10 hover:bg-[#0C4DA2]/20 text-[#0C4DA2] dark:bg-blue-600/20 dark:hover:bg-blue-600/30 dark:text-[#3B82F6] transition-colors cursor-pointer"
                >
                  <span>Review</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* QUICK GOVERNANCE LAUNCHPAD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/admin/users"
          className="bg-white dark:bg-[#07111F] border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-4.5 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 dark:text-[#F5F7FA] group-hover:text-[#0C4DA2] dark:group-hover:text-[#3B82F6] transition-colors">
              User Management & Access Control →
            </h3>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-xs text-slate-500 dark:text-[#A7B3C5] font-medium mt-1 leading-relaxed">
            Search, filter, and inspect scholars, supervisors, and administrative accounts with audited suspension workflows.
          </p>
        </Link>

        <Link
          href="/admin/moderation"
          className="bg-white dark:bg-[#07111F] border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-4.5 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 dark:text-[#F5F7FA] group-hover:text-[#0C4DA2] dark:group-hover:text-[#3B82F6] transition-colors">
              Content Moderation Center →
            </h3>
            <ShieldAlert className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-xs text-slate-500 dark:text-[#A7B3C5] font-medium mt-1 leading-relaxed">
            Review abuse reports on posts, publications, and users. Resolve tickets with audited justifications.
          </p>
        </Link>

        <Link
          href="/admin/audit"
          className="bg-white dark:bg-[#07111F] border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-4.5 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 dark:text-[#F5F7FA] group-hover:text-[#0C4DA2] dark:group-hover:text-[#3B82F6] transition-colors">
              Immutable Audit Center →
            </h3>
            <History className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-xs text-slate-500 dark:text-[#A7B3C5] font-medium mt-1 leading-relaxed">
            Query the complete institutional audit trail tracking every administrative mutation and security event.
          </p>
        </Link>
      </div>
    </div>
  );
}
