'use client';

import React, { useState } from 'react';
import { Clock, Check, X, Eye, FileText, User } from 'lucide-react';
import { User as UserType, CollaborationRequest } from '@curiousbees/types';

interface ApprovalQueueProps {
  pendingApprovals: UserType[];
  collaborationRequests: CollaborationRequest[];
  onApproveScholar: (id: string) => Promise<any>;
  onDeclineScholar: (id: string) => Promise<any>;
  onAcceptCollaboration: (id: string) => Promise<any>;
  onDeclineCollaboration: (id: string) => Promise<any>;
}

export default function ApprovalQueue({
  pendingApprovals,
  collaborationRequests,
  onApproveScholar,
  onDeclineScholar,
  onAcceptCollaboration,
  onDeclineCollaboration
}: ApprovalQueueProps) {
  // Modal state
  const [selectedItem, setSelectedItem] = useState<{
    type: 'SCHOLAR' | 'COLLABORATION';
    scholar: UserType;
    details?: string;
    opportunityTitle?: string;
  } | null>(null);

  const getInitials = (name?: string | null) => {
    if (!name) return 'AS';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  const handleReviewScholar = (scholar: UserType) => {
    setSelectedItem({
      type: 'SCHOLAR',
      scholar,
      details: 'Requesting supervisor mapping to gain institutional intranet access and collaborate under your department guide.'
    });
  };

  const handleReviewCollaboration = (req: CollaborationRequest) => {
    if (req.scholar) {
      setSelectedItem({
        type: 'COLLABORATION',
        scholar: req.scholar as UserType,
        details: req.message || 'No custom message provided.',
        opportunityTitle: req.opportunity?.title || 'Synergy Collaboration'
      });
    }
  };

  const activeCollabs = collaborationRequests.filter((r) => r.status === 'PENDING');

  if (pendingApprovals.length === 0 && activeCollabs.length === 0) {
    return (
      <section className="glass-card rounded-xl border border-outline-variant overflow-hidden p-8 text-center select-none">
        <Clock className="w-10 h-10 text-on-surface-variant/40 mx-auto mb-3" />
        <h3 className="font-headline-md text-headline-md text-on-surface font-semibold mb-1">
          No Pending Requests
        </h3>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          You are all caught up! Scholars and synergy proposals will appear here when they request approval.
        </p>
      </section>
    );
  }

  return (
    <>
      <section className="glass-card rounded-xl border border-outline-variant overflow-hidden select-none text-left">
        <div className="border-b border-outline-variant p-stack-md bg-surface-container-low flex justify-between items-center">
          <h3 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
            <Clock className="w-5 h-5 text-error shrink-0" />
            <span>Pending Approval Requests</span>
          </h3>
          <span className="font-label-caps text-label-caps text-primary hover:underline cursor-default">
            Requires attention
          </span>
        </div>

        <div className="divide-y divide-outline-variant bg-surface-container-lowest">
          {/* 1. Scholar Intake Approvals */}
          {pendingApprovals.map((scholar) => (
            <div
              key={`scholar-app-${scholar.id}`}
              className="p-stack-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-surface-container-low/40 transition-colors"
            >
              <div className="flex items-center gap-stack-md min-w-0">
                <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-on-primary-fixed-variant font-label-md text-label-md font-bold shrink-0">
                  {getInitials(scholar.name)}
                </div>
                <div className="min-w-0">
                  <h4 className="font-label-md text-label-md text-on-surface font-semibold truncate">
                    {scholar.name || scholar.email}
                  </h4>
                  <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
                    Dept. of {scholar.department || 'Computer Science'} • PhD Scholar
                  </p>
                  <p className="font-body-sm text-body-sm text-on-surface mt-1 truncate">
                    <span className="font-semibold text-primary">Request:</span> Verify Intranet Credentials
                  </p>
                </div>
              </div>
              
              <div className="flex gap-stack-sm self-end sm:self-center shrink-0">
                <button
                  onClick={() => handleReviewScholar(scholar)}
                  className="bg-surface-container border border-outline-variant text-on-surface font-label-md text-label-md px-4 py-2 rounded hover:bg-surface-variant transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Review</span>
                </button>
                <button
                  onClick={() => onApproveScholar(scholar.id)}
                  className="bg-primary text-on-primary font-label-md text-label-md px-4 py-2 rounded hover:bg-primary-container transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Approve</span>
                </button>
                <button
                  onClick={() => onDeclineScholar(scholar.id)}
                  className="bg-surface-container border border-error/20 text-error hover:bg-error-container/20 font-label-md text-label-md px-4 py-2 rounded transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Decline</span>
                </button>
              </div>
            </div>
          ))}

          {/* 2. Collaboration/Synergy Requests */}
          {activeCollabs.map((req) => (
            <div
              key={`collab-app-${req.id}`}
              className="p-stack-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-surface-container-low/40 transition-colors"
            >
              <div className="flex items-center gap-stack-md min-w-0">
                <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container font-label-md text-label-md font-bold shrink-0">
                  {getInitials(req.scholar?.name)}
                </div>
                <div className="min-w-0">
                  <h4 className="font-label-md text-label-md text-on-surface font-semibold truncate">
                    {req.scholar?.name}
                  </h4>
                  <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
                    PhD Candidate • {req.scholar?.department || 'Research'}
                  </p>
                  <p className="font-body-sm text-body-sm text-on-surface mt-1 truncate">
                    <span className="font-semibold text-secondary">Synergy Proposal:</span>{' '}
                    {req.opportunity?.title}
                  </p>
                  {req.message && (
                    <p className="text-xs text-on-surface-variant italic border-l-2 border-outline-variant/60 pl-2 mt-1 line-clamp-2">
                      "{req.message}"
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-stack-sm self-end sm:self-center shrink-0">
                <button
                  onClick={() => handleReviewCollaboration(req)}
                  className="bg-surface-container border border-outline-variant text-on-surface font-label-md text-label-md px-4 py-2 rounded hover:bg-surface-variant transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Review</span>
                </button>
                <button
                  onClick={() => onAcceptCollaboration(req.id)}
                  className="bg-primary text-on-primary font-label-md text-label-md px-4 py-2 rounded hover:bg-primary-container transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Accept</span>
                </button>
                <button
                  onClick={() => onDeclineCollaboration(req.id)}
                  className="bg-surface-container border border-error/20 text-error hover:bg-error-container/20 font-label-md text-label-md px-4 py-2 rounded transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Decline</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Review Information Modal Overlay */}
      {selectedItem && (
        <div className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card bg-white dark:bg-inverse-surface rounded-xl border border-outline-variant shadow-lg max-w-lg w-full overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="p-6 border-b border-outline-variant bg-surface-container-low flex justify-between items-start">
              <div>
                <h3 className="font-headline-md text-headline-md text-on-surface font-bold">
                  {selectedItem.type === 'SCHOLAR'
                    ? 'Review Scholar Request'
                    : 'Review Synergy Proposal'}
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                  Evaluate credentials and details before approving workspace access.
                </p>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-container transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 flex-grow overflow-y-auto space-y-6 text-left">
              {/* Scholar Header card */}
              <div className="flex items-center gap-4 bg-surface-container-low p-4 rounded-lg border border-outline-variant/45">
                <div className="w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-headline-md font-bold">
                  {getInitials(selectedItem.scholar.name)}
                </div>
                <div>
                  <h4 className="font-label-md text-label-md text-on-surface font-semibold">
                    {selectedItem.scholar.name}
                  </h4>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {selectedItem.scholar.email}
                  </p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant font-medium">
                    Dept. of {selectedItem.scholar.department || 'N/A'} • PhD Candidate
                  </p>
                </div>
              </div>

              {/* Scholar Bio / Context */}
              {selectedItem.scholar.bio && (
                <div>
                  <h5 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider mb-2">
                    Scholar Bio
                  </h5>
                  <p className="font-body-sm text-body-sm text-on-surface bg-surface-container-lowest p-3 rounded border border-outline-variant/30">
                    {selectedItem.scholar.bio}
                  </p>
                </div>
              )}

              {/* Synergy Opportunity Context */}
              {selectedItem.type === 'COLLABORATION' && selectedItem.opportunityTitle && (
                <div>
                  <h5 className="font-label-caps text-label-caps text-secondary uppercase tracking-wider mb-2">
                    Target Opportunity
                  </h5>
                  <div className="bg-secondary-fixed/10 border border-secondary-fixed-dim/30 rounded p-3 text-secondary font-label-md text-label-md flex items-center gap-2">
                    <FileText className="w-4 h-4 text-secondary shrink-0" />
                    <span>{selectedItem.opportunityTitle}</span>
                  </div>
                </div>
              )}

              {/* Message Details */}
              <div>
                <h5 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider mb-2">
                  Request Message
                </h5>
                <p className="font-body-sm text-body-sm text-on-surface-variant italic bg-surface-container-lowest p-3 rounded border border-outline-variant/30 border-l-4 border-l-primary">
                  "{selectedItem.details}"
                </p>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="p-4 border-t border-outline-variant bg-surface-container-low flex justify-end gap-2">
              <button
                onClick={() => setSelectedItem(null)}
                className="bg-surface-container border border-outline-variant text-on-surface font-label-md text-label-md px-4 py-2 rounded hover:bg-surface-variant transition-colors cursor-pointer"
              >
                Close
              </button>

              {selectedItem.type === 'SCHOLAR' ? (
                <>
                  <button
                    onClick={() => {
                      onDeclineScholar(selectedItem.scholar.id);
                      setSelectedItem(null);
                    }}
                    className="bg-error text-on-error font-label-md text-label-md px-4 py-2 rounded hover:opacity-95 transition-colors cursor-pointer"
                  >
                    Decline Scholar
                  </button>
                  <button
                    onClick={() => {
                      onApproveScholar(selectedItem.scholar.id);
                      setSelectedItem(null);
                    }}
                    className="bg-primary text-on-primary font-label-md text-label-md px-4 py-2 rounded hover:bg-primary-container transition-colors cursor-pointer"
                  >
                    Approve Scholar
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      // Reject collaboration request
                      // The list matches the ID in activeCollabs. We need the req ID.
                      const targetReq = activeCollabs.find(
                        (r) => r.scholar?.id === selectedItem.scholar.id
                      );
                      if (targetReq) {
                        onDeclineCollaboration(targetReq.id);
                      }
                      setSelectedItem(null);
                    }}
                    className="bg-error text-on-error font-label-md text-label-md px-4 py-2 rounded hover:opacity-95 transition-colors cursor-pointer"
                  >
                    Decline Request
                  </button>
                  <button
                    onClick={() => {
                      const targetReq = activeCollabs.find(
                        (r) => r.scholar?.id === selectedItem.scholar.id
                      );
                      if (targetReq) {
                        onAcceptCollaboration(targetReq.id);
                      }
                      setSelectedItem(null);
                    }}
                    className="bg-primary text-on-primary font-label-md text-label-md px-4 py-2 rounded hover:bg-primary-container transition-colors cursor-pointer"
                  >
                    Accept Proposal
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
