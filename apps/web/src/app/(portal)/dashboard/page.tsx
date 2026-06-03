'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { useStore } from '@/store/useStore';
import {
  GraduationCap,
  FileText,
  FlaskConical,
  Network,
  Users,
  Download,
  Plus,
  ArrowRight,
  ShieldAlert,
  BookOpen,
} from 'lucide-react';

// Shared design system
import { DashboardShell } from '@/components/shared/dashboard-shell';
import { PageHeader } from '@/components/shared/page-header';
import { DashboardGrid, GridWide } from '@/components/shared/dashboard-grid';
import { MetricCard } from '@/components/shared/metric-card';
import { SectionHeader } from '@/components/shared/section-header';

// Supervisor-specific components
import ApprovalQueue from '@/components/dashboard/approval-queue';
import ScholarOverview from '@/components/dashboard/scholar-overview';
import DiscussionPanel from '@/components/dashboard/discussion-panel';

// Scholar-specific components
import CollaborationMatching from '@/components/research/collaboration-matching';
import DiscussionFeed from '@/components/research/discussion-feed';
import TrendingClusters from '@/components/research/trending-clusters';
import UpcomingDeadlines from '@/components/research/upcoming-deadlines';
import Footer from '@/components/dashboard/footer';

export default function DashboardPage() {
  const {
    currentUser,
    threads,
    opportunities,
    roleOverride,
    collaborators,
    events,
    pendingApprovals,
    collaborationRequests,
    fetchPendingApprovals,
    fetchCollaborationRequests,
    approveScholar,
    declineScholar,
    updateCollaborationRequest,
    fetchCollaborators,
    fetchData,
  } = useStore();

  useEffect(() => {
    fetchData();
    fetchCollaborators();
    if (roleOverride === 'RESEARCH_SUPERVISOR' || currentUser?.role === 'RESEARCH_SUPERVISOR') {
      fetchPendingApprovals();
      fetchCollaborationRequests();
    }
  }, [fetchData, fetchCollaborators, fetchPendingApprovals, fetchCollaborationRequests, roleOverride, currentUser]);

  const isFaculty = currentUser?.role === 'RESEARCH_SUPERVISOR' || roleOverride === 'RESEARCH_SUPERVISOR';
  const activeScholars = collaborators.filter((c) => c.role !== 'RESEARCH_SUPERVISOR');
  const pendingCount = pendingApprovals.length + collaborationRequests.filter((r) => r.status === 'PENDING').length;

  // ─── SUPERVISOR VIEW ───────────────────────────────────────────────────────

  if (isFaculty) {
    return (
      <DashboardShell>
        <PageHeader
          title="Supervisor Overview"
          subtitle="Manage your scholars, review pending requests, and track collaborative impact."
          icon={<GraduationCap className="w-5 h-5" />}
          actions={
            <Link href="/opportunities">
              <button className="bg-primary hover:bg-primary/90 text-on-primary text-label-md font-semibold px-5 py-2.5 rounded-lg flex items-center gap-2 transition-all shadow-sm active:scale-95 cursor-pointer">
                <Plus className="w-4 h-4" />
                <span>New Initiative</span>
              </button>
            </Link>
          }
        />

        {/* Supervisor Metrics */}
        <DashboardGrid preset="3-col" gap="md">
          <MetricCard
            title="Active Scholars"
            value={activeScholars.length}
            icon={<Users className="w-4 h-4" />}
            variant="primary"
            delta="+2 this semester"
            deltaType="up"
          />
          <MetricCard
            title="Pending Reviews"
            value={pendingCount}
            icon={<FileText className="w-4 h-4" />}
            variant={pendingCount > 0 ? 'warning' : 'success'}
            description="Approvals + collaboration requests"
          />
          <MetricCard
            title="Total Citations"
            value="1,432"
            icon={<BookOpen className="w-4 h-4" />}
            variant="info"
            delta="+128 this quarter"
            deltaType="up"
            animate={false}
          />
        </DashboardGrid>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 flex flex-col gap-5">
            <ApprovalQueue
              pendingApprovals={pendingApprovals}
              collaborationRequests={collaborationRequests}
              onApproveScholar={approveScholar}
              onDeclineScholar={declineScholar}
              onAcceptCollaboration={(id) => updateCollaborationRequest(id, 'PUBLISHED')}
              onDeclineCollaboration={(id) => updateCollaborationRequest(id, 'REJECTED')}
            />
            <ScholarOverview
              activeScholars={activeScholars}
              onMessageScholar={(name) => alert(`Redirecting to live chat with ${name}...`)}
            />
          </div>
          <div className="lg:col-span-1">
            <DiscussionPanel threads={threads} />
          </div>
        </div>
      </DashboardShell>
    );
  }

  // ─── SCHOLAR VIEW ──────────────────────────────────────────────────────────

  return (
    <DashboardShell>
      <PageHeader
        title={`Welcome back, ${currentUser?.name?.split(' ')[0] || 'Researcher'}`}
        subtitle="Here is your research overview and daily insights."
        icon={<FlaskConical className="w-5 h-5" />}
        actions={
          <button
            onClick={() => alert('Generating academic telemetry report...')}
            className="px-4 py-2 border border-outline-variant rounded-lg text-on-surface hover:bg-surface-container transition-colors text-label-md font-medium flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4 text-on-surface-variant" />
            <span>Export Report</span>
          </button>
        }
      />

      {/* Scholar Metrics */}
      <DashboardGrid preset="3-col" gap="md">
        <MetricCard
          title="H-Index"
          value={24}
          icon={<Network className="w-4 h-4" />}
          variant="primary"
          delta="+3 this year"
          deltaType="up"
        />
        <MetricCard
          title="Total Citations"
          value={1842}
          icon={<BookOpen className="w-4 h-4" />}
          variant="info"
          delta="+212 this year"
          deltaType="up"
        />
        <MetricCard
          title="Publications"
          value={38}
          icon={<FileText className="w-4 h-4" />}
          variant="success"
          delta="+4 this year"
          deltaType="up"
        />
      </DashboardGrid>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <CollaborationMatching
            collaborators={collaborators}
            onInviteCollaborator={(name) => alert(`Synergy invitation dispatched to ${name}!`)}
          />
          <DiscussionFeed threads={threads} />
        </div>
        <div className="lg:col-span-1 space-y-5">
          <TrendingClusters />
          <UpcomingDeadlines />
        </div>
      </div>

      <Footer />
    </DashboardShell>
  );
}
