'use client';

import React, { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { useRouter } from 'next/navigation';
import { 
  ShieldAlert, 
  Users, 
  History, 
  UserCog, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Lock,
  LayoutDashboard
} from 'lucide-react';
import AvatarRing from '@/components/AvatarRing';

// Modular overview components
import ResearchVelocityCard from '@/components/admin/research-velocity-card';
import CollaborationsCard from '@/components/admin/collaborations-card';
import CampusDistributionChart from '@/components/admin/campus-distribution-chart';
import DataConsumptionCard from '@/components/admin/data-consumption-card';
import SystemHealthCard from '@/components/admin/system-health-card';
import AchievementsFeed from '@/components/admin/achievements-feed';

type AdminTab = 'overview' | 'users' | 'audit';

export default function AdminPage() {
  const router = useRouter();
  const { 
    currentUser, 
    adminUsers, 
    adminAuditLogs, 
    fetchAdminUsers, 
    fetchAdminAuditLogs, 
    changeUserRole, 
    isLoading 
  } = useStore();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Guard against non-admin access
  useEffect(() => {
    if (currentUser && currentUser.role !== 'INSTITUTION_ADMIN') {
      router.replace('/dashboard');
    }
  }, [currentUser, router]);

  // 2. Fetch admin data
  useEffect(() => {
    if (currentUser?.role === 'INSTITUTION_ADMIN') {
      fetchAdminUsers();
      fetchAdminAuditLogs();
    }
  }, [currentUser, fetchAdminUsers, fetchAdminAuditLogs]);

  if (currentUser?.role !== 'INSTITUTION_ADMIN') {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
        <Lock className="w-12 h-12 text-dangerAlert" />
        <h3 className="font-display font-light text-xl text-black">Access Unauthorized</h3>
        <p className="text-xs text-textSecondary">Only university administrators can access the admin control panel.</p>
        <button onClick={() => router.push('/dashboard')} className="px-4 py-2 bg-black text-white rounded-lg text-xs font-semibold">
          Return to Dashboard
        </button>
      </div>
    );
  }

  // Handle role modification
  const handleRoleChange = async (userId: string, newRole: any) => {
    try {
      await changeUserRole(userId, newRole);
      await fetchAdminUsers();
      await fetchAdminAuditLogs();
    } catch (err) {
      console.error(err);
    }
  };

  // Filter users based on search
  const filteredUsers = adminUsers.filter(
    (u) =>
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const tabs: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'users', label: 'User Moderation', icon: <Users className="w-4 h-4" /> },
    { id: 'audit', label: 'Audit Logs', icon: <History className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-8 text-left font-sans select-none">
      
      {/* 🚀 HEADER */}
      <div className="flex justify-between items-center border-b border-borderStroke pb-4">
        <div>
          <h1 className="font-display font-light text-2xl sm:text-3xl text-black tracking-tight flex items-center space-x-3">
            <ShieldAlert className="w-7 h-7 text-indigoElectric shrink-0" />
            <span>Admin Control Panel</span>
          </h1>
          <p className="text-textSecondary text-[13px] mt-1.5">
            Manage institutional user roles, audit security activity, and monitor the CuriousBees network.
          </p>
        </div>
      </div>

      {/* ⚡ SYSTEM STATS MATRIX */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white border border-borderStroke rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-textMuted uppercase tracking-wider">Total Members</p>
            <h4 className="font-display font-light text-3xl text-black mt-1 leading-none">{adminUsers.length}</h4>
          </div>
          <div className="w-[36px] h-[36px] bg-darkSurfaceMuted rounded-lg flex items-center justify-center text-textSecondary shrink-0">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-borderStroke rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-textMuted uppercase tracking-wider">Faculty Supervisors</p>
            <h4 className="font-display font-light text-3xl text-black mt-1 leading-none">
              {adminUsers.filter(u => u.role === 'RESEARCH_SUPERVISOR').length}
            </h4>
          </div>
          <div className="w-[36px] h-[36px] bg-darkSurfaceMuted rounded-lg flex items-center justify-center text-textSecondary shrink-0">
            <UserCog className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-borderStroke rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-textMuted uppercase tracking-wider">Audit Operations Logged</p>
            <h4 className="font-display font-light text-3xl text-black mt-1 leading-none">{adminAuditLogs.length}</h4>
          </div>
          <div className="w-[36px] h-[36px] bg-darkSurfaceMuted rounded-lg flex items-center justify-center text-textSecondary shrink-0">
            <History className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 🎛️ SUB TABS */}
      <div className="flex border-b border-borderStroke">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 pb-3.5 px-4 font-semibold text-xs uppercase tracking-wider cursor-pointer border-b-2 transition ${
              activeTab === tab.id
                ? 'border-black text-black'
                : 'border-transparent text-textMuted hover:text-black'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ⚡ TAB CONTENTS */}
      <div className="min-h-[400px]">

        {/* ─── OVERVIEW TAB ─── */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Full-width: Research Velocity */}
            <div className="sm:col-span-2 lg:col-span-2">
              <ResearchVelocityCard />
            </div>

            {/* System Health */}
            <div className="sm:col-span-1">
              <SystemHealthCard />
            </div>

            {/* Collaborations */}
            <div className="sm:col-span-1">
              <CollaborationsCard />
            </div>

            {/* Campus Distribution */}
            <div className="sm:col-span-1">
              <CampusDistributionChart />
            </div>

            {/* Data Consumption */}
            <div className="sm:col-span-1">
              <DataConsumptionCard />
            </div>

            {/* Full-width: Achievements Feed */}
            <div className="sm:col-span-2 lg:col-span-3">
              <AchievementsFeed />
            </div>
          </div>
        )}

        {/* ─── USERS MODERATION TAB ─── */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            
            {/* Search Input */}
            <div className="max-w-xs">
              <input
                type="text"
                placeholder="Search users name, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-[38px] px-3 bg-white border border-borderStroke focus:border-black rounded-lg text-xs text-black placeholder-textMuted outline-none"
              />
            </div>

            {isLoading && adminUsers.length === 0 ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="w-8 h-8 text-indigoElectric animate-spin" />
              </div>
            ) : (
              <div className="bg-white border border-borderStroke rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-borderStroke text-[11px] font-bold text-textSecondary bg-darkSurfaceMuted uppercase tracking-wider">
                      <th className="p-3">User</th>
                      <th className="p-3">Department</th>
                      <th className="p-3">Role</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Moderation Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-borderStroke">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="text-xs hover:bg-darkSurfaceMuted/40 transition">
                        <td className="p-3 flex items-center space-x-2.5">
                          <AvatarRing 
                            src={user.image || undefined} 
                            name={user.name || undefined}
                            role={user.role}
                            size="sm"
                          />
                          <div>
                            <h4 className="font-bold text-black">{user.name || 'Academic Member'}</h4>
                            <p className="text-[10px] text-textSecondary mt-0.5">{user.email}</p>
                          </div>
                        </td>
                        <td className="p-3 text-textSecondary">{user.department || 'Not Configured'}</td>
                        <td className="p-3 font-semibold text-black">{user.role}</td>
                        <td className="p-3">
                          {user.approved || user.role === 'RESEARCH_SUPERVISOR' || user.role === 'INSTITUTION_ADMIN' ? (
                            <span className="inline-flex items-center space-x-1 text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded">
                              <CheckCircle className="w-3 h-3" />
                              <span>Approved</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                              <XCircle className="w-3 h-3" />
                              <span>Pending Approval</span>
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                            className="bg-white border border-borderStroke rounded px-2.5 py-1 text-[11px] font-semibold text-black focus:border-black outline-none cursor-pointer"
                          >
                            <option value="RESEARCH_SCHOLAR">Scholar</option>
                            <option value="RESEARCH_SUPERVISOR">Faculty PI</option>
                            <option value="INSTITUTION_ADMIN">Admin</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          </div>
        )}

        {/* ─── AUDIT LOGS TAB ─── */}
        {activeTab === 'audit' && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-black uppercase tracking-wider">Intranet Security Audit Trail</h3>

            {isLoading && adminAuditLogs.length === 0 ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="w-8 h-8 text-indigoElectric animate-spin" />
              </div>
            ) : adminAuditLogs.length > 0 ? (
              <div className="bg-white border border-borderStroke rounded-xl divide-y divide-borderStroke">
                {adminAuditLogs.map((log) => (
                  <div key={log.id} className="p-4 text-xs text-left flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded bg-black text-white text-[9px] font-bold uppercase tracking-wider">
                          {log.action}
                        </span>
                        <span className="text-[10px] text-textMuted">
                          User ID: {log.userId || 'System'}
                        </span>
                      </div>
                      <p className="text-textSecondary font-medium">{log.details}</p>
                    </div>
                    <span className="text-[10px] text-textMuted shrink-0">
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center border border-dashed border-borderStroke rounded-2xl text-textMuted flex flex-col items-center justify-center space-y-2 bg-white">
                <History className="w-8 h-8" />
                <span className="text-xs">No audit logs recorded yet.</span>
              </div>
            )}

          </div>
        )}
      </div>

    </div>
  );
}
