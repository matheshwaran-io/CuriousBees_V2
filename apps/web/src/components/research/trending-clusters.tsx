'use client';

import React from 'react';
import Link from 'next/link';
import { Network, Hexagon } from 'lucide-react';

interface TrendingClustersProps {
  clusters?: string[];
}

export default function TrendingClusters({
  clusters = [
    'Quantum Cognition',
    'Generative Molecular Design',
    'Neuro-symbolic AI',
    'Bio-mimetic Materials'
  ]
}: TrendingClustersProps) {
  return (
    <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] select-none text-left">
      <h3 className="font-headline-md text-headline-md text-on-surface mb-4 flex items-center gap-2">
        <Network className="w-5 h-5 text-primary shrink-0" />
        <span>Trending Clusters</span>
      </h3>
      <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">
        High-growth research areas in your network.
      </p>
      
      <div className="flex flex-wrap gap-2">
        {clusters.map((cluster) => (
          <Link
            key={cluster}
            href={`/search?query=${encodeURIComponent(cluster)}`}
            className="px-3 py-1.5 border border-outline-variant rounded-full font-label-md text-label-md text-on-surface hover:bg-surface-variant cursor-pointer transition-colors flex items-center gap-1.5 bg-white dark:bg-inverse-surface"
          >
            <Hexagon className="w-3.5 h-3.5 text-primary fill-primary/10 shrink-0" />
            <span>{cluster}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
