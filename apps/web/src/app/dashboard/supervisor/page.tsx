'use client';

import React, { useEffect, useState } from 'react';
import { DashboardShell } from '@/components/shared/dashboard-shell';
import { PageHeader } from '@/components/shared/page-header';
import { MetricCard } from '@/components/shared/metric-card';
import { GlassCard } from '@/components/shared/glass-card';
import { GraduationCap, Users, FileSignature, AlertCircle, Check, X, Loader2 } from 'lucide-react';
import { apiFetch } from '@/lib/api-client';
import { User } from '@curiousbees/types';

export default function SupervisorDashboard() {
  const [pendingScholars, setPendingScholars] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchPending = async () => {
    try {
      const res = await apiFetch('/api/supervisor/pending-scholars');
      const data = await res.json();
      setPendingScholars(data);
    } catch (err) {
      console.error('Failed to fetch pending scholars', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleAction = async (scholarId: string, action: 'approve' | 'reject') => {
    setActionLoading(scholarId);
    try {
      await apiFetch(`/api/supervisor/${action}/${scholarId}`, {
        method: 'PUT'
      });
      await fetchPending();
    } catch (err) {
      console.error(`Failed to ${action} scholar`, err);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <DashboardShell withBackground>
      <PageHeader 
        title="Supervisor Overview" 
        subtitle="Manage your scholars, review submissions, and track research pipelines."
        icon={<GraduationCap className="w-5 h-5" />}
        actions={
          <button className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">
            Schedule Meeting
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          title="Active Scholars" 
          value={8} 
          icon={<Users />}
          variant="primary"
        />
        <MetricCard 
          title="Pending Approvals" 
          value={pendingScholars.length} 
          icon={<FileSignature />}
          variant={pendingScholars.length > 0 ? "warning" : "default"}
          delta={pendingScholars.length > 0 ? "Requires attention" : "All caught up"}
          deltaType={pendingScholars.length > 0 ? "down" : "up"}
        />
        <MetricCard 
          title="Publications in Review" 
          value={3} 
          icon={<AlertCircle />}
          variant="info"
        />
        <MetricCard 
          title="Total Citations (Group)" 
          value={1240} 
          icon={<GraduationCap />}
          variant="success"
          delta="+45 this month"
          deltaType="up"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <GlassCard padding="lg">
            <h3 className="cb-section-title mb-4">Scholar Progress Tracker</h3>
            <div className="text-sm text-muted-foreground">
              Integration with backend required to display scholar progress.
            </div>
          </GlassCard>
        </div>
        
        <div className="space-y-6">
          <GlassCard padding="lg">
            <h3 className="cb-section-title mb-4 flex items-center justify-between">
              <span>Pending Approvals</span>
              <span className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs px-2 py-0.5 rounded-full font-bold">
                {pendingScholars.length}
              </span>
            </h3>
            
            {loading ? (
              <div className="flex justify-center p-4">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
              </div>
            ) : pendingScholars.length === 0 ? (
              <div className="text-sm text-slate-500 dark:text-slate-400 text-center p-4 border border-dashed border-slate-200 dark:border-slate-700/50 rounded-xl">
                No pending scholar requests.
              </div>
            ) : (
              <div className="space-y-3">
                {pendingScholars.map(scholar => (
                  <div key={scholar.id} className="p-3 border border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-sm text-slate-900 dark:text-white">{scholar.name || scholar.email}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{scholar.department || 'No department specified'}</div>
                    </div>
                    <div className="flex space-x-1">
                      <button 
                        onClick={() => handleAction(scholar.id, 'approve')}
                        disabled={actionLoading === scholar.id}
                        className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/40 rounded-lg transition-colors"
                        title="Approve Scholar"
                      >
                        {actionLoading === scholar.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      </button>
                      <button 
                        onClick={() => handleAction(scholar.id, 'reject')}
                        disabled={actionLoading === scholar.id}
                        className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:hover:bg-rose-900/40 rounded-lg transition-colors"
                        title="Reject Request"
                      >
                        {actionLoading === scholar.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </DashboardShell>
  );
}
