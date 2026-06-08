'use client';

import React, { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { useRouter } from 'next/navigation';
import {
  UserCog, Search, Lock, Unlock, Check, X, Loader2,
  ArrowUpDown, Award, Users, BookOpen, ShieldAlert, ShieldCheck, RefreshCw, Clock
} from 'lucide-react';
import AvatarRing from '@/components/AvatarRing';

const SUPERADMIN_EMAIL = 'r.matheshwaran.io@gmail.com';

function StatusBadge({ status }: { status: string }) {
  if (status === 'APPROVED' || status === 'ACTIVE')
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200"><Check className="w-2.5 h-2.5" />Active</span>;
  if (status === 'SUSPENDED')
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-zinc-100 text-zinc-700 border border-zinc-300"><Lock className="w-2.5 h-2.5" />Suspended</span>;
  if (status === 'PENDING' || status === 'PENDING_ADMIN_APPROVAL')
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-50 text-amber-700 border border-amber-200"><Clock className="w-2.5 h-2.5" />Pending</span>;
  return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-slate-100 text-slate-600 border border-slate-200">{status}</span>;
}

export default function InstituteAdminSupervisorsPage() {
  const router = useRouter();
  const {
    currentUser,
    adminUsers,
    fetchAdminUsers,
    updateAdminUser,
    pendingSupervisors,
    fetchPendingSupervisors,
    approveSupervisor,
    declineSupervisor,
    isLoading,
    addToast,
  } = useStore();

  const [search, setSearch]           = useState('');
  const [sortLoad, setSortLoad]       = useState<'asc' | 'desc' | null>(null);
  const [processing, setProcessing]   = useState<string | null>(null);
  const [activeTab, setActiveTab]     = useState<'active' | 'pending'>('active');

  const isAdmin = currentUser?.role === 'INSTITUTE_ADMIN';

  useEffect(() => {
    if (currentUser && !isAdmin) router.replace('/dashboard');
  }, [currentUser, isAdmin, router]);

  useEffect(() => {
    if (isAdmin) { fetchAdminUsers(); fetchPendingSupervisors(); }
  }, [isAdmin, fetchAdminUsers, fetchPendingSupervisors]);

  if (!isAdmin) return null;

  const allSupervisors = adminUsers.filter(u => u.role === 'RESEARCH_SUPERVISOR');

  const getScholarCount = (supervisorId: string) =>
    adminUsers.filter(u => u.role === 'RESEARCH_SCHOLAR' && u.supervisorId === supervisorId).length;

  const getScholars = (supervisorId: string) =>
    adminUsers.filter(u => u.role === 'RESEARCH_SCHOLAR' && u.supervisorId === supervisorId);

  let filtered = allSupervisors.filter(u => {
    const term = search.toLowerCase();
    return (u.name || '').toLowerCase().includes(term) || u.email.toLowerCase().includes(term) || (u.department || '').toLowerCase().includes(term);
  });

  if (sortLoad) {
    filtered = [...filtered].sort((a, b) => {
      const diff = getScholarCount(a.id) - getScholarCount(b.id);
      return sortLoad === 'asc' ? diff : -diff;
    });
  }

  const handleToggleSuspend = async (u: any) => {
    if (u.email === SUPERADMIN_EMAIL) return;
    const isSuspended = u.status === 'SUSPENDED';
    if (!confirm(`${isSuspended ? 'Activate' : 'Suspend'} this supervisor?`)) return;
    setProcessing(u.id);
    try { await updateAdminUser(u.id, { status: isSuspended ? 'APPROVED' : 'SUSPENDED' }); } catch (err: any) { addToast(err.message, 'error'); } finally { setProcessing(null); }
  };

  const handleApprove = async (id: string) => {
    setProcessing(id);
    try { await approveSupervisor(id); } catch (err: any) { addToast(err.message, 'error'); } finally { setProcessing(null); }
  };

  const handleDecline = async (id: string) => {
    if (!confirm('Decline this supervisor registration?')) return;
    setProcessing(id);
    try { await declineSupervisor(id); } catch (err: any) { addToast(err.message, 'error'); } finally { setProcessing(null); }
  };

  const totalScholarsAdvised = adminUsers.filter(u => u.role === 'RESEARCH_SCHOLAR' && u.supervisorId).length;
  const avgLoad = allSupervisors.length > 0 ? (totalScholarsAdvised / allSupervisors.length).toFixed(1) : '0';
  const peakLoad = allSupervisors.reduce((m, s) => Math.max(m, getScholarCount(s.id)), 0);

  return (
    <div className="space-y-6 select-none">

      {/* Header */}
      <div className="border-b border-slate-100 pb-5 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-1.5">
            <Award className="w-4 h-4" />Faculty Directory
          </span>
          <h1 className="cb-page-title mt-2 font-display">Research Supervisors</h1>
          <p className="cb-page-subtitle">Monitor advisory workload, manage supervisor access, and handle registration requests.</p>
        </div>
        <button onClick={() => { fetchAdminUsers(); fetchPendingSupervisors(); addToast('Refreshed', 'info'); }} className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 transition-all cursor-pointer self-end" title="Refresh">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Supervisors', value: allSupervisors.length, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Scholars Advised', value: totalScholarsAdvised, icon: BookOpen, color: 'text-teal-600', bg: 'bg-teal-50' },
          { label: 'Avg. Load', value: `${avgLoad}/guide`, icon: ArrowUpDown, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Pending Requests', value: pendingSupervisors.length, icon: Clock, color: 'text-rose-600', bg: 'bg-rose-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="cb-card p-5 bg-white/95 backdrop-blur-md flex items-center gap-4">
            <div className={`p-3 ${bg} ${color} rounded-xl shrink-0`}><Icon className="w-5 h-5" /></div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{label}</p>
              <h3 className="text-xl font-bold text-slate-800 mt-0.5">{value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Tab Toggle */}
      <div className="flex border-b border-slate-100 gap-1">
        {(['active', 'pending'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-3 px-4 font-bold text-[11px] uppercase tracking-wider cursor-pointer border-b-2 transition-all ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-700'}`}>
            {tab === 'active' ? `Active Supervisors (${allSupervisors.length})` : `Pending Requests (${pendingSupervisors.length})`}
          </button>
        ))}
      </div>

      {/* Active Tab */}
      {activeTab === 'active' && (
        <>
          {/* Filters */}
          <div className="cb-card p-4 bg-white/95 backdrop-blur-md flex flex-col sm:flex-row gap-3 items-center">
            <div className="relative flex-1 w-full">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3.5" />
              <input type="text" placeholder="Search supervisors, department..." value={search} onChange={e => setSearch(e.target.value)} className="cb-input pl-9 w-full" />
            </div>
            <button onClick={() => setSortLoad(sl => sl === null ? 'desc' : sl === 'desc' ? 'asc' : null)} className="px-4 h-[42px] border border-slate-200 rounded-lg bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-2 cursor-pointer whitespace-nowrap">
              <ArrowUpDown className="w-3.5 h-3.5" />
              {sortLoad === 'desc' ? 'High→Low Load' : sortLoad === 'asc' ? 'Low→High Load' : 'Sort by Load'}
            </button>
          </div>

          {isLoading && allSupervisors.length === 0 ? (
            <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <div className="cb-card p-12 text-center"><UserCog className="w-8 h-8 mx-auto text-slate-300 mb-3" /><p className="text-sm font-bold text-slate-600">No supervisors found</p></div>
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden md:block cb-card overflow-hidden bg-white/95 backdrop-blur-md border border-slate-100">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-100 bg-slate-50/50">
                        <th className="p-4 pl-6">Supervisor</th>
                        <th className="p-4">Department</th>
                        <th className="p-4">Advising Load</th>
                        <th className="p-4">Scholars</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 pr-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/50">
                      {filtered.map(u => {
                        const cnt = getScholarCount(u.id);
                        const scholars = getScholars(u.id);
                        const isSA = u.email === SUPERADMIN_EMAIL;
                        const isProc = processing === u.id;
                        return (
                          <tr key={u.id} className="text-xs hover:bg-slate-50/30 transition-colors">
                            <td className="p-4 pl-6">
                              <div className="flex items-center gap-3">
                                <AvatarRing src={u.image || undefined} name={u.name || undefined} role={u.role} size="sm" />
                                <div>
                                  <p className="font-bold text-slate-900 flex items-center gap-1.5">{u.name || 'Faculty'}{isSA && <ShieldCheck className="w-3.5 h-3.5 text-primary" />}</p>
                                  <p className="text-[10px] text-slate-400">{u.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4 text-slate-600 font-semibold">{u.department || 'General'}</td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-800">{cnt}</span>
                                <div className="w-20 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                  <div className={`h-1.5 rounded-full ${cnt >= 4 ? 'bg-rose-500' : cnt >= 2 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(cnt / 5 * 100, 100)}%` }} />
                                </div>
                                <span className="text-[10px] text-slate-400">({cnt}/5)</span>
                              </div>
                            </td>
                            <td className="p-4">
                              {scholars.length === 0 ? (
                                <span className="text-[10px] text-slate-400 italic">None</span>
                              ) : (
                                <div className="flex -space-x-1.5">
                                  {scholars.slice(0, 4).map(s => <AvatarRing key={s.id} src={s.image} name={s.name || undefined} role={s.role} size="sm" className="border-2 border-white" />)}
                                  {cnt > 4 && <div className="w-7 h-7 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-500">+{cnt - 4}</div>}
                                </div>
                              )}
                            </td>
                            <td className="p-4"><StatusBadge status={u.status} /></td>
                            <td className="p-4 pr-6">
                              {isSA ? (
                                <span className="text-[10px] text-slate-400 font-bold flex items-center justify-end gap-1"><ShieldCheck className="w-3.5 h-3.5 text-primary" />Protected</span>
                              ) : (
                                <button onClick={() => handleToggleSuspend(u)} disabled={!!isProc} className={`ml-auto px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase flex items-center gap-1.5 border cursor-pointer transition-colors disabled:opacity-50 ${u.status === 'SUSPENDED' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                                  {isProc ? <Loader2 className="w-3 h-3 animate-spin" /> : u.status === 'SUSPENDED' ? <><Unlock className="w-3 h-3" />Activate</> : <><Lock className="w-3 h-3" />Suspend</>}
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile */}
              <div className="grid grid-cols-1 gap-4 md:hidden">
                {filtered.map(u => {
                  const cnt = getScholarCount(u.id);
                  const isSA = u.email === SUPERADMIN_EMAIL;
                  const isProc = processing === u.id;
                  return (
                    <div key={u.id} className="cb-card p-5 bg-white/95 space-y-3">
                      <div className="flex items-center gap-3">
                        <AvatarRing src={u.image || undefined} name={u.name || undefined} role={u.role} size="md" />
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{u.name || 'Faculty'}</p>
                          <p className="text-[10px] text-slate-400">{u.email}</p>
                        </div>
                      </div>
                      <div className="border-t border-slate-100 pt-3 space-y-2 text-xs">
                        <div className="flex justify-between"><span className="text-slate-400 font-semibold">Department:</span><span className="font-bold">{u.department || 'General'}</span></div>
                        <div className="flex justify-between"><span className="text-slate-400 font-semibold">Advising Load:</span><span className="font-bold">{cnt} / 5 scholars</span></div>
                        <div className="flex justify-between"><span className="text-slate-400 font-semibold">Status:</span><StatusBadge status={u.status} /></div>
                      </div>
                      {!isSA && (
                        <div className="border-t border-slate-100 pt-3">
                          <button onClick={() => handleToggleSuspend(u)} disabled={!!isProc} className={`w-full py-2 rounded-lg text-[10px] font-bold uppercase flex items-center justify-center gap-1.5 border cursor-pointer transition-colors disabled:opacity-50 ${u.status === 'SUSPENDED' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                            {u.status === 'SUSPENDED' ? <><Unlock className="w-3 h-3" />Activate</> : <><Lock className="w-3 h-3" />Suspend</>}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}

      {/* Pending Tab */}
      {activeTab === 'pending' && (
        <>
          {isLoading && pendingSupervisors.length === 0 ? (
            <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
          ) : pendingSupervisors.length === 0 ? (
            <div className="cb-card p-12 text-center">
              <ShieldCheck className="w-8 h-8 mx-auto text-emerald-400 mb-3" />
              <p className="text-sm font-bold text-slate-700">All caught up!</p>
              <p className="text-xs text-slate-400 mt-1">No pending supervisor registrations.</p>
            </div>
          ) : (
            <div className="cb-card overflow-hidden bg-white/95 backdrop-blur-md border border-slate-100">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-100 bg-slate-50/50">
                      <th className="p-4 pl-6">Applicant</th>
                      <th className="p-4">Department</th>
                      <th className="p-4">Employee ID</th>
                      <th className="p-4 pr-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/50">
                    {pendingSupervisors.map(sup => {
                      const isProc = processing === sup.id;
                      return (
                        <tr key={sup.id} className="text-xs hover:bg-slate-50/30 transition-colors">
                          <td className="p-4 pl-6">
                            <div className="flex items-center gap-3">
                              <AvatarRing src={sup.image} name={sup.name || undefined} role={sup.role} size="sm" />
                              <div>
                                <p className="font-bold text-slate-900">{sup.name || 'N/A'}</p>
                                <p className="text-[10px] text-slate-400">{sup.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-slate-600 font-semibold">{sup.department || 'Not specified'}</td>
                          <td className="p-4 font-mono font-bold text-[11px] text-slate-700">{(sup as any).employeeId || 'N/A'}</td>
                          <td className="p-4 pr-6 text-right space-x-2">
                            <button onClick={() => handleDecline(sup.id)} disabled={!!isProc} className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase border bg-red-50 border-red-200 text-red-700 hover:bg-red-100/60 disabled:opacity-50 cursor-pointer inline-flex items-center gap-1.5">
                              <X className="w-3 h-3" />Decline
                            </button>
                            <button onClick={() => handleApprove(sup.id)} disabled={!!isProc} className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase border bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100/60 disabled:opacity-50 cursor-pointer inline-flex items-center gap-1.5">
                              {isProc ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}Approve
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
