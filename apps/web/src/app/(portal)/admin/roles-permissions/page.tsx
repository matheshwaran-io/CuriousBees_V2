'use client';

/**
 * Roles & Permissions Visual Capability Matrix
 */

import React, { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { Lock, Shield, Check, Minus, Info, Loader2, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function RolesPermissionsPage() {
  const { fetchAdminRolesMatrix } = useStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminRolesMatrix().then((res) => {
      setData(res);
      setLoading(false);
    });
  }, [fetchAdminRolesMatrix]);

  if (loading || !data) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-2 text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin text-[#0C4DA2]" />
        <p className="text-xs font-bold">Loading institutional roles matrix...</p>
      </div>
    );
  }

  // Group capabilities by category
  const categories: Record<string, any[]> = {};
  data.capabilities.forEach((cap: any) => {
    if (!categories[cap.category]) categories[cap.category] = [];
    categories[cap.category].push(cap);
  });

  const renderCell = (val: boolean | string) => {
    if (val === true) {
      return (
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
          <Check className="w-4 h-4" />
        </span>
      );
    }
    if (val === false) {
      return (
        <span className="inline-flex items-center justify-center w-6 h-6 text-slate-300 dark:text-slate-600">
          <Minus className="w-4 h-4" />
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 dark:bg-[#132238] text-slate-700 dark:text-[#A7B3C5]">
        {val}
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-2 select-none">
      {/* Header */}
      <div className="border-b border-slate-200/80 dark:border-white/[0.08] pb-4">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#0C4DA2]/10 text-[#0C4DA2] dark:bg-blue-600/20 dark:text-[#3B82F6] border border-[#0C4DA2]/20">
            Access Control
          </span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-[#F5F7FA] tracking-tight mt-1">
          Roles & Permissions Matrix
        </h1>
        <p className="text-xs text-slate-500 dark:text-[#A7B3C5] font-semibold mt-0.5">
          Authoritative institutional permission matrix enforced at edge, API, and database layers.
        </p>
      </div>

      {/* Role Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#07111F] border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-4.5 space-y-2 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center font-black text-xs">
              RS
            </div>
            <h3 className="text-sm font-black text-slate-900 dark:text-[#F5F7FA]">Research Scholar</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-[#A7B3C5] leading-relaxed">
            Conducts research, authors publications, submits progress updates, and collaborates under an assigned faculty supervisor.
          </p>
        </div>

        <div className="bg-white dark:bg-[#07111F] border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-4.5 space-y-2 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 flex items-center justify-center font-black text-xs">
              RP
            </div>
            <h3 className="text-sm font-black text-slate-900 dark:text-[#F5F7FA]">Research Supervisor</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-[#A7B3C5] leading-relaxed">
            Directly authenticates, mentors scholars, accepts/rejects supervision applications, and oversees PhD projects. No admin approval required.
          </p>
        </div>

        <div className="bg-white dark:bg-[#07111F] border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-4.5 space-y-2 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center font-black text-xs">
              IA
            </div>
            <h3 className="text-sm font-black text-slate-900 dark:text-[#F5F7FA]">Institute Admin</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-[#A7B3C5] leading-relaxed">
            Institutional governance authority. Governs users, enforces content moderation, configures faculties, and monitors immutable audit logs.
          </p>
        </div>
      </div>

      {/* Permissions Table */}
      <div className="bg-white dark:bg-[#07111F] border border-slate-200/80 dark:border-white/[0.08] rounded-2xl overflow-hidden shadow-2xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200/80 dark:border-white/[0.08] bg-slate-50/70 dark:bg-[#0B1728] text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <th className="py-3.5 px-4 w-1/3">Capability</th>
              <th className="py-3.5 px-4 text-center">Scholar</th>
              <th className="py-3.5 px-4 text-center">Supervisor</th>
              <th className="py-3.5 px-4 text-center">Institute Admin</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06] text-xs">
            {Object.entries(categories).map(([category, caps]) => (
              <React.Fragment key={category}>
                <tr className="bg-slate-50/50 dark:bg-[#0E1E33]/40">
                  <td colSpan={4} className="py-2.5 px-4 text-[10px] font-black uppercase tracking-widest text-[#0C4DA2] dark:text-[#3B82F6]">
                    {category}
                  </td>
                </tr>
                {caps.map((cap) => (
                  <tr key={cap.id} className="hover:bg-slate-50/60 dark:hover:bg-[#0B1728] transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900 dark:text-[#F5F7FA]">{cap.capability}</p>
                      <p className="text-[11px] text-slate-400 dark:text-[#718096] mt-0.5">{cap.description}</p>
                    </td>
                    <td className="py-3 px-4 text-center">{renderCell(cap.scholar)}</td>
                    <td className="py-3 px-4 text-center">{renderCell(cap.supervisor)}</td>
                    <td className="py-3 px-4 text-center">{renderCell(cap.admin)}</td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
