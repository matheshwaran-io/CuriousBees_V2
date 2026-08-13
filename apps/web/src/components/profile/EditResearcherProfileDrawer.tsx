'use client';

import React, { useState, useEffect } from 'react';
import { X, Lock, Save, Loader2, BookOpen, Layers, Globe, Shield, AlertCircle } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { STAGES } from './ResearchLifecycle';

interface EditResearcherProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onOpenLinksEditor: () => void;
  onSuccess: () => void;
}

export function EditResearcherProfileDrawer({
  isOpen,
  onClose,
  user,
  onOpenLinksEditor,
  onSuccess,
}: EditResearcherProfileDrawerProps) {
  const { updateProfile, updateResearchProfile } = useStore();

  const [activeTab, setActiveTab] = useState<'IDENTITY' | 'RESEARCH' | 'LINKS' | 'ACADEMIC'>('RESEARCH');

  // Form State
  const [bio, setBio] = useState('');
  const [interestsText, setInterestsText] = useState('');
  const [researchTitle, setResearchTitle] = useState('');
  const [researchArea, setResearchArea] = useState('');
  const [abstract, setAbstract] = useState('');
  const [currentStage, setCurrentStage] = useState('PROPOSAL');
  const [status, setStatus] = useState('ACTIVE');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setBio(user.bio || '');
      const existingInterests = Array.isArray(user.interests)
        ? user.interests.map((i: any) => i.interest?.name || i.name || i).join(', ')
        : (user.researchInterests || []).join(', ');
      setInterestsText(existingInterests);

      if (user.researchProfile) {
        setResearchTitle(user.researchProfile.title || '');
        setResearchArea(user.researchProfile.researchArea || '');
        setAbstract(user.researchProfile.abstract || '');
        setCurrentStage(user.researchProfile.currentStage || 'PROPOSAL');
        setStatus(user.researchProfile.status || 'ACTIVE');
      }
    }
  }, [user]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      // 1. Update Base User Profile (Bio & Interests)
      const interestsArray = interestsText
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      await updateProfile({
        bio: bio.trim(),
        interests: interestsArray,
      });

      // 2. Update Research Profile
      if (researchTitle.trim()) {
        await updateResearchProfile({
          title: researchTitle.trim(),
          researchArea: researchArea.trim() || 'Computer Science',
          abstract: abstract.trim(),
          currentStage,
          status,
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSupervisor = user?.role === 'RESEARCH_SUPERVISOR';
  const registrationId = user?.employeeId || user?.scholarProfile?.registrationNo || user?.id?.substring(0, 8);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-[#E4E9F2] shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-lg font-extrabold text-[#17233D]">Edit Institutional Profile</h3>
            <p className="text-xs text-slate-500 font-medium">
              Update researcher-owned details. Institutional credentials are read-only.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/30 px-6 gap-2 pt-2">
          <button
            onClick={() => setActiveTab('RESEARCH')}
            className={`px-4 py-2.5 text-xs font-extrabold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'RESEARCH'
                ? 'border-[#0C4DA2] text-[#0C4DA2]'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Research Profile
          </button>
          <button
            onClick={() => setActiveTab('IDENTITY')}
            className={`px-4 py-2.5 text-xs font-extrabold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'IDENTITY'
                ? 'border-[#0C4DA2] text-[#0C4DA2]'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Identity (Locked)
          </button>
          <button
            onClick={() => setActiveTab('LINKS')}
            className={`px-4 py-2.5 text-xs font-extrabold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'LINKS'
                ? 'border-[#0C4DA2] text-[#0C4DA2]'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            External Links
          </button>
          <button
            onClick={() => setActiveTab('ACADEMIC')}
            className={`px-4 py-2.5 text-xs font-extrabold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'ACADEMIC'
                ? 'border-[#0C4DA2] text-[#0C4DA2]'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Academic Record
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 text-red-900 border border-red-200 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {activeTab === 'RESEARCH' && (
            <form id="edit-profile-form" onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Research Bio / Summary</label>
                <textarea
                  rows={3}
                  placeholder="Describe your research focus, methodology, or academic statement..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full text-xs font-semibold p-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#0C4DA2]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Research Interests (Comma-Separated)
                </label>
                <input
                  type="text"
                  placeholder="Artificial Intelligence, Knowledge Graphs, NLP"
                  value={interestsText}
                  onChange={(e) => setInterestsText(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#0C4DA2]"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#0C4DA2]">Current Research Project</h4>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Research Project Title</label>
                  <input
                    type="text"
                    placeholder="e.g. AI-Based Research Collaboration Framework"
                    value={researchTitle}
                    onChange={(e) => setResearchTitle(e.target.value)}
                    className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#0C4DA2]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Research Area</label>
                    <input
                      type="text"
                      placeholder="e.g. Artificial Intelligence"
                      value={researchArea}
                      onChange={(e) => setResearchArea(e.target.value)}
                      className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#0C4DA2]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Current Research Stage</label>
                    <select
                      value={currentStage}
                      onChange={(e) => setCurrentStage(e.target.value)}
                      className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#0C4DA2]"
                    >
                      {STAGES.map((stg) => (
                        <option key={stg.id} value={stg.id}>
                          {stg.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Research Abstract</label>
                  <textarea
                    rows={3}
                    placeholder="Short summary of current project methodology and goals..."
                    value={abstract}
                    onChange={(e) => setAbstract(e.target.value)}
                    className="w-full text-xs font-semibold p-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#0C4DA2]"
                  />
                </div>
              </div>
            </form>
          )}

          {activeTab === 'IDENTITY' && (
            <div className="space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 text-xs font-extrabold text-slate-700">
                <Lock className="w-4 h-4 text-amber-600" />
                <span>Institution-Controlled Credentials</span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                These credentials are generated directly from official SRMIST institutional records and cannot be altered directly by the user.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Institutional Name</span>
                  <span className="text-xs font-extrabold text-slate-800">{user?.name}</span>
                </div>

                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Role</span>
                  <span className="text-xs font-extrabold text-[#0C4DA2]">
                    {isSupervisor ? 'Research Supervisor' : 'Research Scholar'}
                  </span>
                </div>

                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Department</span>
                  <span className="text-xs font-extrabold text-slate-800">{user?.department || 'Computer Science'}</span>
                </div>

                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">
                    {isSupervisor ? 'Employee ID' : 'Registration ID'}
                  </span>
                  <span className="text-xs font-mono font-extrabold text-slate-800">{registrationId}</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'LINKS' && (
            <div className="text-center py-8 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-3">
              <Globe className="w-8 h-8 text-[#0C4DA2] mx-auto" />
              <div className="space-y-1">
                <h4 className="text-sm font-extrabold text-[#17233D]">Manage External Research Profiles</h4>
                <p className="text-xs text-slate-500">
                  Configure ORCID, Google Scholar, ResearchGate, GitHub, and LinkedIn profile URLs.
                </p>
              </div>
              <button
                onClick={onOpenLinksEditor}
                className="px-5 py-2.5 bg-[#0C4DA2] hover:bg-[#042654] text-white font-extrabold text-xs rounded-xl shadow-2xs transition-all inline-flex items-center gap-2 cursor-pointer"
              >
                <Globe className="w-4 h-4" />
                <span>Open Links Manager</span>
              </button>
            </div>
          )}

          {activeTab === 'ACADEMIC' && (
            <div className="space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 text-xs font-extrabold text-slate-700">
                <Shield className="w-4 h-4 text-[#0C4DA2]" />
                <span>Institutional Affiliation & Registration</span>
              </div>
              <div className="space-y-2 text-xs text-slate-600 font-medium">
                <p>● Institution: SRM Institute of Science and Technology</p>
                <p>● Campus: Kattankulathur Main Campus</p>
                <p>● Record Status: Active Verified Researcher</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-extrabold rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>

          {activeTab === 'RESEARCH' && (
            <button
              type="submit"
              form="edit-profile-form"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-[#0C4DA2] hover:bg-[#042654] text-white text-xs font-extrabold rounded-xl shadow-2xs transition-all flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
