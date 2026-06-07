'use client';

import React from 'react';
import { DashboardShell } from '@/components/shared/dashboard-shell';
import { useStore } from '@/store/useStore';

export default function InstituteAdminDashboard() {
  const { currentUser } = useStore();

  return (
    <DashboardShell>
      <div className="cb-card p-6 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20 backdrop-blur-md">
        <h1 className="text-2xl font-bold">Institute Admin Dashboard</h1>
        <p>Welcome, {currentUser?.name}</p>
        <div className="mt-4">
          <p>This is the dedicated dashboard for institutional administrators.</p>
          <a href="/admin/approval-requests" className="mt-4 inline-block px-4 py-2 bg-primary text-white rounded">
            Manage Approval Requests
          </a>
        </div>
      </div>
    </DashboardShell>
  );
}
