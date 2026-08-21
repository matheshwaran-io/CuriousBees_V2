'use client';

/**
 * Institutional Research Workspaces & Projects Oversight
 */

import React, { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { FolderGit2, Search, Users, FileText, CheckSquare, Loader2, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminWorkspacesPage() {
  const { fetchAdminWorkspaces } = useStore();
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const loadWorkspaces = async () => {
    setLoading(true);
    try {
      const res = await fetchAdminWorkspaces({ search, page, limit: 20 });
      setWorkspaces(res.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspaces();
  }, [page]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-2 select-none">
      {/* Header */}
      <div className="border-b border-slate-200/80 dark:border-white/[0.08] pb-4">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300 border border-cyan-200">
            Research Oversight
          </span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-[#F5F7FA] tracking-tight mt-1">
          Active Research Workspaces
        </h1>
        <p className="text-xs text-slate-500 dark:text-[#A7B3C5] font-semibold mt-0.5">
          Institutional oversight of active collaboration workspaces, milestone progress, and file repositories.
        </p>
      </div>

      {/* Filter bar */}
      <div className="bg-white dark:bg-[#07111F] border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-2xs">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            loadWorkspaces();
          }}
          className="relative w-full md:w-80"
        >
          <input
            type="text"
            placeholder="Search workspaces or projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 dark:bg-[#0B1728] border border-slate-200 dark:border-white/[0.08] rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-slate-800 dark:text-[#F5F7FA] focus:outline-none"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </form>
      </div>

      {/* Workspaces Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-3 py-20 flex flex-col items-center justify-center space-y-2 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-[#0C4DA2]" />
            <p className="text-xs font-bold">Querying workspaces...</p>
          </div>
        ) : workspaces.length === 0 ? (
          <div className="col-span-3 py-16 bg-white dark:bg-[#07111F] border border-slate-200/80 dark:border-white/[0.08] rounded-2xl flex flex-col items-center justify-center text-center space-y-2">
            <FolderGit2 className="w-10 h-10 text-slate-300 dark:text-slate-600" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-[#F5F7FA]">No research workspaces found</h3>
          </div>
        ) : (
          workspaces.map((ws) => (
            <div
              key={ws.id}
              className="bg-white dark:bg-[#07111F] border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-5 shadow-2xs space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 flex items-center justify-center font-bold">
                    <FolderGit2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-black text-slate-900 dark:text-[#F5F7FA] truncate">{ws.name}</h3>
                    <p className="text-[10px] text-slate-400">ID: {ws.id.slice(0, 10)}...</p>
                  </div>
                </div>
                {ws.description && (
                  <p className="text-xs text-slate-500 line-clamp-2 mt-2 leading-relaxed">
                    {ws.description}
                  </p>
                )}
              </div>

              <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-white/[0.06] text-xs text-slate-600 dark:text-[#A7B3C5]">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1 text-slate-400">
                    <Users className="w-3.5 h-3.5" /> Members
                  </span>
                  <span className="font-bold text-slate-800 dark:text-[#F5F7FA]">
                    {ws.members?.length || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1 text-slate-400">
                    <CheckSquare className="w-3.5 h-3.5" /> Milestones
                  </span>
                  <span className="font-bold text-slate-800 dark:text-[#F5F7FA]">
                    {ws._count?.milestones || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1 text-slate-400">
                    <FileText className="w-3.5 h-3.5" /> Documents
                  </span>
                  <span className="font-bold text-slate-800 dark:text-[#F5F7FA]">
                    {ws._count?.files || 0}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
