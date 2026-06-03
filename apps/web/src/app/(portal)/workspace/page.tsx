'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useStore } from '@/store/useStore';
import { FolderOpen, ArrowRight, Calendar, Users, Loader2 } from 'lucide-react';

export default function WorkspacesListPage() {
  const { workspaces, fetchWorkspaces, isLoading } = useStore();

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  return (
    <div className="space-y-stack-lg text-left select-none max-w-container-max mx-auto">
      
      {/* 🚀 HEADER SECTION */}
      <div className="flex justify-between items-center border-b border-outline-variant/30 pb-4">
        <div>
          <h1 className="font-display-lg text-headline-xl sm:text-[32px] font-bold text-on-surface tracking-tight">
            Research Workspaces
          </h1>
          <p className="text-on-surface-variant text-xs sm:text-body-sm mt-1">
            Active workspaces generated from supervisor-approved research collaboration opportunities.
          </p>
        </div>
        <div className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center text-primary shrink-0">
          <FolderOpen className="w-5 h-5" />
        </div>
      </div>

      {/* ⚡ ACTIVE WORKSPACES */}
      {isLoading && workspaces.length === 0 ? (
        <div className="min-h-[30vh] flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">Loading research workspaces...</p>
        </div>
      ) : workspaces.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
          {workspaces.map((workspace) => (
            <Link 
              key={workspace.id}
              href={`/workspace/${workspace.id}`}
              className="glass-panel rounded-xl p-5 hover:border-primary/50 hover:shadow-md transition-all flex flex-col justify-between group bg-white duration-200 cursor-pointer"
            >
              <div className="space-y-4 text-left">
                <div className="flex items-start justify-between">
                  <div className="w-9 h-9 bg-primary/10 text-primary rounded-lg flex items-center justify-center shrink-0">
                    <FolderOpen className="w-5 h-5" />
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-semibold bg-primary/10 text-primary border border-primary/25 uppercase tracking-wider font-bold">
                    Active Node
                  </span>
                </div>
                
                <div className="space-y-1">
                  <h3 className="font-display font-bold text-base sm:text-lg text-on-surface group-hover:text-primary transition-colors truncate">
                    {workspace.title}
                  </h3>
                  <p className="text-on-surface-variant text-xs sm:text-body-sm line-clamp-2 leading-relaxed font-medium">
                    {workspace.description || 'Dedicated workspace for research documents, milestone checklists, and group announcements.'}
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-6 border-t border-outline-variant/20 flex items-center justify-between">
                <div className="flex items-center space-x-4 text-[11px] text-on-surface-variant font-semibold">
                  <div className="flex items-center">
                    <Users className="w-3.5 h-3.5 mr-1 text-outline" />
                    <span>{workspace.members?.length || 0} Members</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-3.5 h-3.5 mr-1 text-outline" />
                    <span>Joined {new Date(workspace.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="w-[28px] h-[28px] rounded-lg border border-outline-variant/30 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition duration-200 shrink-0">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center border border-dashed border-outline-variant/30 rounded-xl text-on-surface-variant flex flex-col items-center justify-center space-y-3 bg-white/5">
          <FolderOpen className="w-12 h-12 text-outline/50" />
          <div className="space-y-1 max-w-sm mx-auto">
            <h4 className="text-base font-bold text-on-surface">No Active Workspaces</h4>
            <p className="text-xs text-on-surface-variant leading-relaxed font-semibold">
              Workspaces are automatically provisioned as soon as a faculty supervisor accepts a collaboration synergy request on an opportunity post.
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
