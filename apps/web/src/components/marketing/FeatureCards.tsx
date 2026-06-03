'use client';

import React from 'react';
import { Search, Network, Activity } from 'lucide-react';

export default function FeatureCards() {
  return (
    <section className="py-stack-lg z-10">
      <h2 className="font-headline-xl text-headline-xl text-center mb-stack-lg">Platform Capabilities</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
        
        {/* Feature 1 */}
        <div className="glass-panel p-stack-lg rounded-xl flex flex-col gap-stack-sm hover:shadow-md transition-shadow text-left">
          <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-stack-sm shrink-0">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="font-headline-md text-headline-md text-on-surface">Research Discovery</h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
            Navigate the vast SRMIST knowledge base using AI-powered semantic search to uncover hidden connections across disciplines.
          </p>
        </div>

        {/* Feature 2 */}
        <div className="glass-panel p-stack-lg rounded-xl flex flex-col gap-stack-sm hover:shadow-md transition-shadow text-left">
          <div className="w-12 h-12 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center mb-stack-sm shrink-0">
            <Network className="w-6 h-6 text-secondary" />
          </div>
          <h3 className="font-headline-md text-headline-md text-on-surface">Workspaces</h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
            Create secure project sandboxes for inter-disciplinary teams. Share data, co-author papers, and manage resources centrally.
          </p>
        </div>

        {/* Feature 3 */}
        <div className="glass-panel p-stack-lg rounded-xl flex flex-col gap-stack-sm hover:shadow-md transition-shadow text-left">
          <div className="w-12 h-12 rounded-lg bg-tertiary/10 text-tertiary flex items-center justify-center mb-stack-sm shrink-0">
            <Activity className="w-6 h-6 text-tertiary" />
          </div>
          <h3 className="font-headline-md text-headline-md text-on-surface">Analytics</h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
            Track citation impacts, monitor h-index growth, and visualize departmental performance with beautiful, precise metrics.
          </p>
        </div>

      </div>
    </section>
  );
}
