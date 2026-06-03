'use client';

import React from 'react';
import Link from 'next/link';
import { Network, UserPlus } from 'lucide-react';
import { User } from '@curiousbees/types';

interface CollaborationMatchingProps {
  collaborators: User[];
  onInviteCollaborator: (name: string) => void;
}

export default function CollaborationMatching({
  collaborators,
  onInviteCollaborator
}: CollaborationMatchingProps) {
  
  // Custom mock collaborators to match high fidelity Stitch visuals when DB has no matches
  const mockMatches = [
    {
      name: 'Dr. Elias Vance',
      department: 'Cognitive Neuroscience',
      matchScore: '92% Match',
      tag: 'Neural Nets',
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuACmnRmND37XuryzG3gehMlY9w2bBapj_AG-rrZMJFpx3rPnjoepnOPOyyjymgtgQjazRTLUmgSMx6eYth54q6TM9MfZGJOHDRKYNRw2phwRd1A8c0Xfy5CfvzQv4a85-ZrnhT0nFYfBC5-Gz4j06kKPLk5M81i3JJkv8Hzt1IQzvNbNvJod3vGkt3qb9gdgS132SQ3FLdko4gcdk5L7HcbHq0RjQ32fFxJ11XBweK_spXsEYL9rugwW9wCHc8B7fHPHdifPQfVWtZ6"
    },
    {
      name: 'Dr. Sarah Lin',
      department: 'Computational Biology',
      matchScore: '88% Match',
      tag: 'Genomics',
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBhotPj-RkthtKKDLP4am8pJVBideZ2ln9SoWoHXShRVgTUOiMMpuCncpp2Am3mmuY44sjbsJGTuai2iSUSpT-dX4OdS5UYcfai-sjlL1nYbYGQ0Re990b3Lc4sxWcYqchb0YFAj51rZK69w8Qx8fTrz7EKwu9xw9WXFE4Qca0q5oq8SU_4SBIgJbqgvksiiGQapuLpPPb7pyGpS5foUlCOvgJ-utJJMUmwg1GtXilfvmxa9aZkaml3DvDGtVw483WrboeTijNtz6l_"
    }
  ];

  // Map database collaborators. If there are researchers, display the top 2.
  const displayCollaborators = collaborators.length > 0
    ? collaborators.slice(0, 2).map((collab, idx) => ({
        name: collab.name || 'Scholar Researcher',
        department: collab.department || 'SRMIST Research Office',
        matchScore: idx === 0 ? '92% Match' : '88% Match',
        tag: collab.interests?.[0]?.interest?.name || 'Topological Insulators',
        image: collab.image || (idx === 0 ? mockMatches[0].image : mockMatches[1].image)
      }))
    : mockMatches;

  return (
    <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] select-none text-left">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
          <Network className="w-5 h-5 text-primary shrink-0" />
          <span>Collaboration Matching</span>
        </h3>
        <Link href="/researchers" className="text-primary font-label-md text-label-md hover:underline">
          View All Network
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {displayCollaborators.map((collab) => (
          <div
            key={collab.name}
            className="border border-outline-variant/50 rounded-lg p-4 flex items-start gap-4 hover:bg-surface-container-low transition-colors text-left"
          >
            <img
              alt="Researcher"
              className="w-12 h-12 rounded-full object-cover shrink-0"
              src={collab.image}
            />
            <div className="flex-1 min-w-0">
              <h4 className="font-label-md text-label-md text-on-surface font-semibold truncate">
                {collab.name}
              </h4>
              <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
                {collab.department}
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="px-2 py-0.5 bg-primary-container/20 text-primary-container rounded-full font-label-caps text-[10px] uppercase shrink-0">
                  {collab.matchScore}
                </span>
                <span className="px-2 py-0.5 bg-surface-variant text-on-surface-variant rounded-full font-label-caps text-[10px] uppercase truncate max-w-[100px]">
                  {collab.tag}
                </span>
              </div>
            </div>
            
            <button
              onClick={() => onInviteCollaborator(collab.name)}
              className="bg-surface-variant hover:bg-tertiary hover:text-on-tertiary text-on-surface w-8 h-8 rounded flex items-center justify-center transition-colors shrink-0 cursor-pointer"
            >
              <UserPlus className="w-4.5 h-4.5" />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
