'use client';

import React, { useState, useEffect } from 'react';

export default function ResearchStats() {
  const [stats, setStats] = useState({ departments: 0, researchers: 0, collaborations: 0, projects: 0 });

  useEffect(() => {
    const duration = 1500;
    const steps = 30;
    const stepTime = duration / steps;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      setStats({
        departments: Math.min(Math.floor((42 / steps) * currentStep), 42),
        researchers: Math.min(Math.floor((5000 / steps) * currentStep), 5000),
        collaborations: Math.min(Math.floor((850 / steps) * currentStep), 850),
        projects: Math.min(Math.floor((12400 / steps) * currentStep), 12400),
      });

      if (currentStep >= steps) clearInterval(interval);
    }, stepTime);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-stack-lg border-y border-outline-variant/20 my-stack-lg relative z-10 bg-white/50 backdrop-blur-sm rounded-xl">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter text-center divide-y md:divide-y-0 md:divide-x divide-outline-variant/30">
        
        <div className="p-stack-md">
          <div className="font-display-lg text-headline-xl font-bold text-primary mb-stack-xs">
            {stats.researchers}+
          </div>
          <div className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">
            Active Researchers
          </div>
        </div>

        <div className="p-stack-md">
          <div className="font-display-lg text-headline-xl font-bold text-primary mb-stack-xs">
            {stats.projects}+
          </div>
          <div className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">
            Research Projects
          </div>
        </div>

        <div className="p-stack-md">
          <div className="font-display-lg text-headline-xl font-bold text-primary mb-stack-xs">
            {stats.collaborations}+
          </div>
          <div className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">
            Collaborations
          </div>
        </div>

        <div className="p-stack-md">
          <div className="font-display-lg text-headline-xl font-bold text-primary mb-stack-xs">
            {stats.departments}
          </div>
          <div className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">
            Departments
          </div>
        </div>

      </div>
    </section>
  );
}
