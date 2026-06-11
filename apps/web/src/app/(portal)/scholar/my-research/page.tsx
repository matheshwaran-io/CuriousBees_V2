'use client';

import React, { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Check, 
  X, 
  Edit3, 
  Trash2, 
  Calendar, 
  FileText, 
  Globe,
  FileSpreadsheet, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  MessageSquare,
  Sparkles,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardShell } from '@/components/shared/dashboard-shell';

export default function ScholarMyResearchPage() {
  const {
    currentUser,
    publications,
    reports,
    supervisors,
    fetchPublications,
    createPublication,
    updatePublication,
    deletePublication,
    fetchReports,
    submitReport,
    fetchSupervisors,
    isLoading
  } = useStore();

  const [activeTab, setActiveTab] = useState<'publications' | 'reports'>('publications');
  const [isPubDrawerOpen, setIsPubDrawerOpen] = useState(false);
  const [isReportDrawerOpen, setIsReportDrawerOpen] = useState(false);
  
  // Publications Search term
  const [pubSearchTerm, setPubSearchTerm] = useState('');
  const [editingPub, setEditingPub] = useState<any | null>(null);

  // Publications Form states
  const [pubTitle, setPubTitle] = useState('');
  const [pubAuthors, setPubAuthors] = useState('');
  const [pubDoi, setPubDoi] = useState('');
  const [pubPublisher, setPubPublisher] = useState('');
  const [pubYear, setPubYear] = useState(new Date().getFullYear());
  const [pubStatus, setPubStatus] = useState('PUBLISHED');

  // Scholar Submit Report Form states
  const [reportTitle, setReportTitle] = useState('');
  const [reportDesc, setReportDesc] = useState('');
  const [reportEvidenceUrl, setReportEvidenceUrl] = useState('');
  const [selectedSupervisorId, setSelectedSupervisorId] = useState('');

  useEffect(() => {
    if (currentUser) {
      fetchPublications(currentUser.id);
      fetchReports();
      fetchSupervisors();
    }
  }, [currentUser, fetchPublications, fetchReports, fetchSupervisors]);

  // Set default supervisor
  useEffect(() => {
    if (currentUser?.supervisorId) {
      setSelectedSupervisorId(currentUser.supervisorId);
    }
  }, [currentUser]);

  // Publications Submission
  const handleOpenPubCreate = () => {
    setEditingPub(null);
    setPubTitle('');
    setPubAuthors(currentUser?.name || '');
    setPubDoi('');
    setPubPublisher('');
    setPubYear(new Date().getFullYear());
    setPubStatus('PUBLISHED');
    setIsPubDrawerOpen(true);
  };

  const handleOpenPubEdit = (pub: any) => {
    setEditingPub(pub);
    setPubTitle(pub.title);
    setPubAuthors(pub.authors);
    setPubDoi(pub.doi || '');
    setPubPublisher(pub.publisher || '');
    setPubYear(pub.year);
    setPubStatus(pub.status);
    setIsPubDrawerOpen(true);
  };

  const handlePubSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pubTitle || !pubAuthors || !pubYear) {
      alert('Please fill out all required fields.');
      return;
    }

    try {
      if (editingPub) {
        await updatePublication(editingPub.id, {
          title: pubTitle,
          authors: pubAuthors,
          doi: pubDoi || undefined,
          publisher: pubPublisher || undefined,
          year: Number(pubYear),
          status: pubStatus
        });
      } else {
        await createPublication({
          title: pubTitle,
          authors: pubAuthors,
          doi: pubDoi || undefined,
          publisher: pubPublisher || undefined,
          year: Number(pubYear),
          status: pubStatus
        });
      }
      setIsPubDrawerOpen(false);
    } catch (err: any) {
      alert(`Error saving publication: ${err.message}`);
    }
  };

  const handlePubDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this publication?')) {
      try {
        await deletePublication(id);
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const handleOpenReportSubmit = () => {
    setReportTitle('');
    setReportDesc('');
    setReportEvidenceUrl('');
    setReportSupervisor();
    setIsReportDrawerOpen(true);
  };

  const setReportSupervisor = () => {
    if (currentUser?.supervisorId) {
      setSelectedSupervisorId(currentUser.supervisorId);
    } else if (supervisors.length > 0) {
      setSelectedSupervisorId(supervisors[0].id);
    } else {
      setSelectedSupervisorId('');
    }
  }

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTitle || !selectedSupervisorId) {
      alert('Please fill out all required fields.');
      return;
    }

    try {
      await submitReport({
        title: reportTitle,
        description: reportDesc || undefined,
        evidenceUrl: reportEvidenceUrl || undefined,
        supervisorId: selectedSupervisorId
      });
      setIsReportDrawerOpen(false);
    } catch (err: any) {
      alert(`Error submitting report: ${err.message}`);
    }
  };

  const filteredPubs = publications.filter(
    (p) =>
      p.title.toLowerCase().includes(pubSearchTerm.toLowerCase()) ||
      p.authors.toLowerCase().includes(pubSearchTerm.toLowerCase())
  );

  return (
    <DashboardShell>
      {/* 🚀 Notion-style Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#001E4C] via-[#002868] to-[#004495] cb-honeycomb-dark border border-[#004495]/15 p-6 md:p-8 shadow-xl text-left">
        <div className="absolute right-0 top-0 w-96 h-96 bg-[#FEC727]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-12 bottom-0 w-72 h-72 bg-[#004495]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 flex-1 min-w-0">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#FEC727]/25 text-[#FEC727] border border-[#FEC727]/30 text-[10px] font-bold uppercase tracking-wider">
              Research Portfolio
            </span>
            <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-white tracking-tight leading-tight">
              Publications & Progress Reports
            </h1>
            <p className="text-xs sm:text-sm text-white/80 font-medium max-w-xl leading-relaxed">
              Log your co-authored publications, track academic indexation DOIs, and dispatch periodic progress journals directly to your supervisor.
            </p>
          </div>
        </div>
      </div>

      {/* 🎛️ TAB TRIGGERS */}
      <div className="flex gap-1 bg-slate-100/80 border border-slate-200/50 p-1 rounded-xl max-w-sm text-left">
        <button
          onClick={() => setActiveTab('publications')}
          className={`flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 flex-1 cursor-pointer select-none ${
            activeTab === 'publications' 
              ? 'bg-white text-primary shadow-sm border border-slate-200/50' 
              : 'text-slate-505 hover:text-slate-800 hover:bg-white/40'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>My Publications</span>
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 flex-1 cursor-pointer select-none ${
            activeTab === 'reports' 
              ? 'bg-white text-primary shadow-sm border border-slate-200/50' 
              : 'text-slate-505 hover:text-slate-800 hover:bg-white/40'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Advisory Reports</span>
        </button>
      </div>

      {/* ⚡ TAB CONTENT */}
      <div className="pt-2 text-left">
        <AnimatePresence mode="wait">
          
          {/* PUBLICATIONS TAB */}
          {activeTab === 'publications' && (
            <motion.div
              key="publications-tab"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center mb-1 gap-4">
                <div className="cb-card p-2 bg-white/95 backdrop-blur-md max-w-sm flex-1">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search title, authors..."
                      value={pubSearchTerm}
                      onChange={(e) => setPubSearchTerm(e.target.value)}
                      className="w-full h-8 px-3 pl-8 text-xs font-semibold rounded-lg bg-transparent border-none text-slate-800 focus:outline-none placeholder:text-slate-400"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>
                </div>

                <button
                  onClick={handleOpenPubCreate}
                  className="px-4 py-2 bg-primary hover:bg-primary/95 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Publication</span>
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {filteredPubs.length === 0 ? (
                  <div className="cb-card p-12 text-center bg-white/95 backdrop-blur-md">
                    <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-slate-900 font-bold text-sm">No Publications Logged</h3>
                    <p className="text-slate-505 text-xs mt-1">
                      Log your journals, patents, and manuscripts to represent your academic output.
                    </p>
                  </div>
                ) : (
                  filteredPubs.map((pub) => (
                    <div key={pub.id} className="cb-card p-5 bg-white/95 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider border ${
                            pub.status === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                            pub.status === 'UNDER_REVIEW' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                            pub.status === 'SUBMITTED' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                            'bg-slate-50 text-slate-650 border-slate-100'
                          }`}>
                            {pub.status.replace('_', ' ')}
                          </span>
                          {pub.doi && (
                            <span className="text-[10px] text-slate-400 flex items-center gap-1 font-semibold">
                              <Globe className="w-3 h-3 text-slate-400" />
                              DOI: {pub.doi}
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-slate-900 text-sm leading-snug truncate">{pub.title}</h3>
                        <p className="text-xs text-slate-500 font-medium">Authors: {pub.authors}</p>
                        
                        <div className="flex items-center space-x-3 text-[10px] text-slate-400 font-semibold pt-1">
                          {pub.publisher && (
                            <span className="flex items-center gap-1">
                              <FileText className="w-3.5 h-3.5" />
                              {pub.publisher}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            Year: {pub.year}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0 self-end md:self-center">
                        <button
                          onClick={() => handleOpenPubEdit(pub)}
                          className="p-2 border border-slate-200 hover:border-slate-350 text-slate-600 hover:text-slate-800 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handlePubDelete(pub.id)}
                          className="p-2 border border-slate-200 hover:border-red-200 text-slate-600 hover:text-red-650 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* PROGRESS REPORTS TAB */}
          {activeTab === 'reports' && (
            <motion.div
              key="reports-tab"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center mb-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Advisory Review Log</h3>
                <button
                  onClick={handleOpenReportSubmit}
                  className="px-4 py-2 bg-primary hover:bg-primary/95 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Submit Progress Report</span>
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {reports.length === 0 ? (
                  <div className="cb-card p-12 text-center bg-white/95 backdrop-blur-md">
                    <FileSpreadsheet className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-slate-900 font-bold text-sm">No Progress Reports Logged</h3>
                    <p className="text-slate-505 text-xs mt-1">
                      No reports submitted yet. Submit a new progress report above.
                    </p>
                  </div>
                ) : (
                  reports.map((report) => (
                    <div key={report.id} className="cb-card p-5 bg-white/95 backdrop-blur-md flex flex-col justify-between gap-4">
                      <div className="space-y-2 text-left">
                        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider flex items-center gap-1 border ${
                            report.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                            report.status === 'REJECTED' ? 'bg-red-50 text-red-750 border-red-100' :
                            report.status === 'NEEDS_INFO' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                            'bg-slate-50 text-slate-650 border-slate-100'
                          }`}>
                            {report.status === 'APPROVED' && <CheckCircle2 className="w-3 h-3" />}
                            {report.status === 'REJECTED' && <AlertCircle className="w-3 h-3" />}
                            {report.status === 'NEEDS_INFO' && <AlertCircle className="w-3 h-3" />}
                            <span>{report.status}</span>
                          </span>

                          <span className="text-[10px] text-slate-400 font-semibold">
                            Submitted: {new Date(report.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <h3 className="font-bold text-slate-905 text-sm">{report.title}</h3>
                        {report.description && <p className="text-xs text-slate-505 font-semibold leading-relaxed">{report.description}</p>}
                        
                        <div className="flex items-center space-x-4 text-[10px] text-slate-400 font-bold pt-1">
                          {report.evidenceUrl && (
                            <a
                              href={report.evidenceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline flex items-center gap-1"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>View Evidence Document</span>
                            </a>
                          )}
                          <span>Supervisor reviewer: {report.supervisor?.name || 'Assigned Supervisor'}</span>
                        </div>

                        {report.feedback && (
                          <div className="bg-slate-550 border border-slate-150 p-2.5 rounded-lg text-xs text-slate-600 mt-2 flex items-start gap-2">
                            <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold text-slate-700 block mb-0.5">Supervisor Feedback:</span>
                              <p className="font-medium">{report.feedback}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* 🚀 PUBLICATIONS DRAWER */}
      <AnimatePresence>
        {isPubDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPubDrawerOpen(false)}
              className="fixed inset-0 bg-slate-900/30 backdrop-blur-[2px] z-50 cursor-pointer"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-full sm:max-w-lg bg-white border-l border-slate-200 z-50 p-6 shadow-2xl flex flex-col overflow-y-auto text-left"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                <div className="flex items-center space-x-2.5">
                  <BookOpen className="w-5 h-5 text-primary" />
                  <div>
                    <h3 className="font-display font-bold text-sm text-[#0c4da2]">
                      {editingPub ? 'Edit Publication' : 'Add New Publication'}
                    </h3>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                      Academic Intranet Logs
                    </p>
                  </div>
                </div>
                <button onClick={() => setIsPubDrawerOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handlePubSubmit} className="space-y-4 flex-1">
                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-slate-450 uppercase tracking-widest">Title *</label>
                  <input
                    type="text"
                    value={pubTitle}
                    onChange={(e) => setPubTitle(e.target.value)}
                    required
                    placeholder="e.g. A Deep Analysis of VLSI Layout Algorithms"
                    className="cb-input"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-slate-450 uppercase tracking-widest">Authors (Comma-separated) *</label>
                  <input
                    type="text"
                    value={pubAuthors}
                    onChange={(e) => setPubAuthors(e.target.value)}
                    required
                    placeholder="e.g. John Doe, Ramesh Kumar"
                    className="cb-input"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-slate-450 uppercase tracking-widest">DOI (Digital Object Identifier)</label>
                  <input
                    type="text"
                    value={pubDoi}
                    onChange={(e) => setPubDoi(e.target.value)}
                    placeholder="e.g. 10.1093/bioinformatics/btg239"
                    className="cb-input"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-slate-450 uppercase tracking-widest">Publisher / Journal</label>
                  <input
                    type="text"
                    value={pubPublisher}
                    onChange={(e) => setPubPublisher(e.target.value)}
                    placeholder="e.g. IEEE Transactions, Nature Communications"
                    className="cb-input"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-slate-450 uppercase tracking-widest">Year *</label>
                    <input
                      type="number"
                      value={pubYear}
                      onChange={(e) => setPubYear(Number(e.target.value))}
                      required
                      min={1900}
                      max={new Date().getFullYear() + 2}
                      className="cb-input"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-slate-450 uppercase tracking-widest">Status *</label>
                    <select
                      value={pubStatus}
                      onChange={(e) => setPubStatus(e.target.value)}
                      className="w-full px-3 h-[42px] text-xs font-semibold rounded-lg bg-white border border-slate-200 focus:outline-none transition-all cursor-pointer"
                    >
                      <option value="DRAFT">Draft</option>
                      <option value="SUBMITTED">Submitted</option>
                      <option value="UNDER_REVIEW">Under Review</option>
                      <option value="PUBLISHED">Published</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsPubDrawerOpen(false)}
                    className="px-4 py-2.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors text-xs font-bold uppercase tracking-wider cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-primary hover:bg-primary/95 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>{editingPub ? 'Update' : 'Publish'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 🚀 REPORTS DRAWER */}
      <AnimatePresence>
        {isReportDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsReportDrawerOpen(false)}
              className="fixed inset-0 bg-slate-900/30 backdrop-blur-[2px] z-50 cursor-pointer"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-full sm:max-w-lg bg-white border-l border-slate-200 z-50 p-6 shadow-2xl flex flex-col overflow-y-auto text-left"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                <div className="flex items-center space-x-2.5">
                  <FileSpreadsheet className="w-5 h-5 text-primary" />
                  <div>
                    <h3 className="font-display font-bold text-sm text-[#0c4da2]">Submit Progress Report</h3>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">Academic Intranet System</p>
                  </div>
                </div>
                <button onClick={() => setIsReportDrawerOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleReportSubmit} className="space-y-4 flex-1">
                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-slate-450 uppercase tracking-widest">Report Title *</label>
                  <input
                    type="text"
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                    required
                    placeholder="e.g. Monthly Progress Report - June 2026"
                    className="cb-input"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-slate-450 uppercase tracking-widest">Supervisor / Faculty Guide *</label>
                  <select
                    value={selectedSupervisorId}
                    onChange={(e) => setSelectedSupervisorId(e.target.value)}
                    required
                    className="w-full px-3 h-[42px] text-xs font-semibold rounded-lg bg-white border border-slate-200 focus:outline-none transition-all cursor-pointer text-slate-800"
                  >
                    <option value="">Select Supervisor</option>
                    {supervisors.map((sv) => (
                      <option key={sv.id} value={sv.id}>
                        {sv.name} ({sv.department})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-slate-450 uppercase tracking-widest">Evidence / Document Link (PDF, Drive)</label>
                  <input
                    type="url"
                    value={reportEvidenceUrl}
                    onChange={(e) => setReportEvidenceUrl(e.target.value)}
                    placeholder="e.g. https://drive.google.com/file/d/..."
                    className="cb-input"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-slate-455 uppercase tracking-widest">Progress Summary & Scope</label>
                  <textarea
                    rows={6}
                    value={reportDesc}
                    onChange={(e) => setReportDesc(e.target.value)}
                    placeholder="Briefly summarize your progress, milestones hit, and any challenges..."
                    className="w-full px-3 py-2 text-xs leading-relaxed font-sans font-semibold rounded-lg bg-white border border-slate-200 outline-none focus:border-primary transition-all"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsReportDrawerOpen(false)}
                    className="px-4 py-2.5 border border-slate-200 rounded-lg text-slate-655 hover:bg-slate-50 transition-colors text-xs font-bold uppercase tracking-wider cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-primary hover:bg-primary/95 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>Submit</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </DashboardShell>
  );
}
