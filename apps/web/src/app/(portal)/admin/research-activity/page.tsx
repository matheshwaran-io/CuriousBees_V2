'use client';

/**
 * Institutional Research Activity & Collaborations Overview
 */

import React, { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { BarChart3, FolderGit2, BookOpen, Users, Loader2 } from 'lucide-react';

export default function AdminResearchActivityPage() {
  const { fetchAdminResearchGovernance } = useStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminResearchGovernance().then((res) => {
      setData(res);
      setLoading(false);
    });
  }, [fetchAdminResearchGovernance]);

  if (loading || !data) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-2 text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin text-[#0C4DA2]" />
        <p className="text-xs font-bold">Querying institutional research activity...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-2 select-none">
      {/* Header */}
      <div className="border-b border-slate-200/80 dark:border-white/[0.08] pb-4">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300 border border-cyan-200">
            Research Governance
          </span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-[#F5F7FA] tracking-tight mt-1">
          Institutional Research Activity
        </h1>
        <p className="text-xs text-slate-500 dark:text-[#A7B3C5] font-semibold mt-0.5">
          High-level oversight of ongoing doctoral projects, interdisciplinary collaborations, and supervisor loads.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#07111F] border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center gap-2 text-cyan-600">
            <FolderGit2 className="w-5 h-5" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Active Workspaces</h3>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-[#F5F7FA] mt-2">
            {data.totalWorkspaces}
          </p>
        </div>

        <div className="bg-white dark:bg-[#07111F] border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center gap-2 text-emerald-600">
            <BookOpen className="w-5 h-5" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Verified Publications</h3>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-[#F5F7FA] mt-2">
            {data.totalPublications}
          </p>
        </div>

        <div className="bg-white dark:bg-[#07111F] border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center gap-2 text-teal-600">
            <Users className="w-5 h-5" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Active Faculty Supervisors</h3>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-[#F5F7FA] mt-2">
            {data.supervisorsWithScholars?.length || 0}
          </p>
        </div>
      </div>

      {/* Department Research Density */}
      <div className="bg-white dark:bg-[#07111F] border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-5 shadow-2xs space-y-4">
        <h3 className="text-sm font-black text-slate-900 dark:text-[#F5F7FA]">
          Departmental Scholar-to-Supervisor Ratios
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-white/[0.08] bg-slate-50/70 dark:bg-[#0B1728] text-[11px] font-black uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Faculty</th>
                <th className="py-3 px-4">Supervisors</th>
                <th className="py-3 px-4">Scholars</th>
                <th className="py-3 px-4">Total Users</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06]">
              {data.departments?.map((d: any) => (
                <tr key={d.id} className="hover:bg-slate-50/60 dark:hover:bg-[#0B1728]">
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-[#F5F7FA]">
                    {d.code} - {d.name}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-[#A7B3C5]">{d.faculty?.name || 'SRMIST'}</td>
                  <td className="py-3 px-4 text-teal-600 font-bold">{d._count.supervisorProfiles}</td>
                  <td className="py-3 px-4 text-blue-600 font-bold">{d._count.scholarProfiles}</td>
                  <td className="py-3 px-4 text-slate-800 dark:text-[#F5F7FA] font-semibold">{d._count.users}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
