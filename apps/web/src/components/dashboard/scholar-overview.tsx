'use client';

import React from 'react';
import Link from 'next/link';
import { Contact, MessageSquare } from 'lucide-react';
import { User } from '@curiousbees/types';

interface ScholarOverviewProps {
  activeScholars: User[];
  onMessageScholar: (name: string) => void;
}

export default function ScholarOverview({
  activeScholars,
  onMessageScholar
}: ScholarOverviewProps) {
  
  // Custom activity lists to cycle through to ensure high-fidelity mock behavior
  const mockActivities = [
    'Uploaded dataset for Chapter 4 validation.',
    'Completed literature review submission.',
    'Submitted draft of Federated learning edge performance analysis.',
    'Compiled benchmark comparisons for neural optimizer models.'
  ];

  if (activeScholars.length === 0) {
    return (
      <section className="space-y-stack-md select-none text-left">
        <h3 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
          <Contact className="w-5 h-5 text-primary" />
          <span>Assigned Scholars Overview</span>
        </h3>
        <div className="bg-surface-container-lowest border border-outline-variant p-8 rounded-xl text-center">
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            No scholars are currently assigned to you. Once scholars map themselves under your supervision, they will appear here.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-stack-md select-none text-left">
      <h3 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
        <Contact className="w-5 h-5 text-primary" />
        <span>Assigned Scholars Overview</span>
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-md">
        {activeScholars.map((scholar, idx) => {
          // alternate status badges to match the mockup
          const isOnTrack = idx % 2 === 1;
          const statusLabel = isOnTrack ? 'On Track' : 'In Progress';
          const statusClass = isOnTrack
            ? 'bg-primary-fixed text-primary'
            : 'bg-secondary-fixed text-secondary';
            
          const activity = mockActivities[idx % mockActivities.length];

          // Use the default image or fallback scholar avatars
          const scholarImage = scholar.image || (isOnTrack 
            ? "https://lh3.googleusercontent.com/aida-public/AB6AXuBfo-dEDdI9h_zmFYadOWfm0uj976cR7F8cYtDbAH3ifiPLZNJ-T5ej0iQAzOGlotpNQF9l-cEiBVEvB5xKAmwHKcipJXjM8Zql86Qbxr-DGC9tsJZlO0yZqYlHwQI-bCQIIVtZ4Vt5BpzHei4Ycpou4USdBaGHzhZI_ExAeDWTQc0h654yc1xLq3a9Y2QZGL2UfYViZYxReZQRgGUPyXLLv_Mi0o7C4VowsfoTjG58KpKygJULZwsNHY4UYWxVkPgP0MLn2JRqSUtT"
            : "https://lh3.googleusercontent.com/aida-public/AB6AXuDDiuJKvZzuvrjYgaL67mgaHd_OTAcCCTiItez_EsXmgA-imJMlRsc3ptrSmTT3heZeUcNYdYV2Rpzq3kkjjayvF9WYObS3hFaA3xWqz-cOb5fa9XedWWOhSb06jvMtaooNbDXRW1f1wSkLVpNXjVgeJjUQTk0_sXOotDMTbjzvcAQQ3YxuxVEdT9jPRj2eP88OTWVEIejzcx1DXBhKdHOlXOLRRN6QTSqzKdUSjvMn0WNBdbWkNv-pvtBoXmAdIZ8jTCVfl3-WIvrN"
          );

          return (
            <div
              key={scholar.id || scholar.email}
              className="bg-surface-container-lowest border border-outline-variant p-stack-md rounded-xl hover:shadow-sm transition-shadow flex flex-col justify-between min-h-[190px]"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <img
                      alt="Scholar Profile"
                      className="w-12 h-12 rounded-full border border-outline-variant object-cover shrink-0"
                      src={scholarImage}
                    />
                    <div>
                      <h4 className="font-label-md text-label-md text-on-surface font-semibold truncate max-w-[150px]">
                        {scholar.name || 'Research Scholar'}
                      </h4>
                      <p className="font-label-caps text-label-caps text-on-surface-variant">
                        Year {idx % 3 + 1} • {scholar.department || 'Data Science'}
                      </p>
                    </div>
                  </div>
                  <span className={`font-label-caps text-label-caps px-2 py-1 rounded-full text-[10px] shrink-0 ${statusClass}`}>
                    {statusLabel}
                  </span>
                </div>
                <div className="mb-4">
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    <span className="font-medium text-on-surface">Recent Activity:</span> {activity}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2 mt-auto">
                <Link href={`/researchers?search=${encodeURIComponent(scholar.name || '')}`} className="flex-1">
                  <button className="w-full bg-surface-container border border-outline-variant text-on-surface font-label-caps text-label-caps py-2 rounded hover:bg-surface-variant transition-colors cursor-pointer">
                    View Profile
                  </button>
                </Link>
                <button
                  onClick={() => onMessageScholar(scholar.name || 'Scholar')}
                  className="flex-1 bg-surface-container border border-outline-variant text-on-surface font-label-caps text-label-caps py-2 rounded hover:bg-surface-variant transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Message</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
