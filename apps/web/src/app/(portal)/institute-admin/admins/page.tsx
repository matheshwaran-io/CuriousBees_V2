'use client';

import React, { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { useRouter } from 'next/navigation';
import {
  Shield, Search, Lock, Unlock, Loader2, Check, ShieldCheck,
  AlertTriangle, RefreshCw, UserMinus, Crown
} from 'lucide-react';
import AvatarRing from '@/components/AvatarRing';
import { motion, AnimatePresence } from 'framer-motion';

const SUPERADMIN_EMAIL = 'r.matheshwaran.io@gmail.com';

function StatusBadge({ status }: { status: string }) {
  if (status === 'APPROVED' || status === 'ACTIVE')
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200"><Check className="w-2.5 h-2.5" />Active</span>;
  if (status === 'SUSPENDED')
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-zinc-100 text-zinc-700 border border-zinc-300"><Lock className="w-2.5 h-2.5" />Suspended</span>;
  return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-slate-100 text-slate-600 border border-slate-200">{status}</span>;
}

export default function InstituteAdminAdminsPage() {
  const router = useRouter();
  const {
    currentUser,
    adminUsers,
    fetchAdminUsers,
    updateAdminUser,
    isLoading,
    addToast,
  } = useStore();

  const [search, setSearch]         = useState('');
  const [processing, setProcessing] = useState<string | null>(null);
  const [demoteModal, setDemoteModal] = useState<any | null>(null);
  const [demoteRole, setDemoteRole]   = useState<'RESEARCH_SUPERVISOR' | 'RESEARCH_SCHOLAR'>('RESEARCH_SUPERVISOR');

  const isAdmin = currentUser?.role === 'INSTITUTE_ADMIN';

  useEffect(() => {
    if (currentUser && !isAdmin) router.replace('/dashboard');
  }, [currentUser, isAdmin, router]);

  useEffect(() => {
    if (isAdmin) fetchAdminUsers();
  }, [isAdmin, fetchAdminUsers]);

  if (!isAdmin) return null;

  const admins = adminUsers.filter(u => u.role === 'INSTITUTE_ADMIN');

  const filtered = admins.filter(u => {
    const term = search.toLowerCase();
    return (u.name || '').toLowerCase().includes(term) || u.email.toLowerCase().includes(term) || (u.department || '').toLowerCase().includes(term);
  });

  const handleToggleSuspend = async (u: any) => {
    if (u.email === SUPERADMIN_EMAIL) return;
    if (u.id === currentUser?.id) { addToast('You cannot suspend your own account.', 'error'); return; }
    const isSuspended = u.status === 'SUSPENDED';
    if (!confirm(`${isSuspended ? 'Activate' : 'Suspend'} admin ${u.email}?`)) return;
    setProcessing(u.id);
    try { await updateAdminUser(u.id, { status: isSuspended ? 'APPROVED' : 'SUSPENDED' }); } catch (err: any) { addToast(err.message, 'error'); } finally { setProcessing(null); }
  };

  const openDemoteModal = (u: any) => {
    if (u.email === SUPERADMIN_EMAIL || u.id === currentUser?.id) return;
    setDemoteRole('RESEARCH_SUPERVISOR');
    setDemoteModal(u);
  };

  const handleDemote = async () => {
    if (!demoteModal) return;
    setProcessing(demoteModal.id);
    try {
      await updateAdminUser(demoteModal.id, { role: demoteRole as any });
      setDemoteModal(null);
      addToast(`Admin demoted to ${demoteRole === 'RESEARCH_SUPERVISOR' ? 'Supervisor' : 'Scholar'}.`, 'success');
    } catch (err: any) { addToast(err.message, 'error'); } finally { setProcessing(null); }
  };

  return (
    <div className="space-y-6 select-none">

      {/* Header */}
      <div className="border-b border-slate-100 pb-5 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-1.5">
            <Shield className="w-4 h-4" />Admin Registry
          </span>
          <h1 className="cb-page-title mt-2 font-display">Institute Administrators</h1>
          <p className="cb-page-subtitle">
            View and manage all Institute Admin accounts. The superadmin account is permanently protected.
          </p>
        </div>
        <button onClick={() => { fetchAdminUsers(); addToast('Refreshed', 'info'); }} className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 transition-all cursor-pointer self-end" title="Refresh">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="cb-card p-5 bg-white/95 backdrop-blur-md">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Admins</p>
          <h3 className="text-2xl font-extrabold text-primary mt-0.5 font-display">{admins.length}</h3>
        </div>
        <div className="cb-card p-5 bg-white/95 backdrop-blur-md">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active</p>
          <h3 className="text-2xl font-extrabold text-emerald-600 mt-0.5 font-display">{admins.filter(u => u.status === 'APPROVED' || u.status === 'ACTIVE').length}</h3>
        </div>
        <div className="cb-card p-5 bg-white/95 backdrop-blur-md col-span-2 sm:col-span-1">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Suspended</p>
          <h3 className="text-2xl font-extrabold text-red-500 mt-0.5 font-display">{admins.filter(u => u.status === 'SUSPENDED').length}</h3>
        </div>
      </div>

      {/* Superadmin notice */}
      <div className="flex items-start gap-3 bg-primary/5 border border-primary/20 rounded-xl p-4 text-xs text-primary">
        <Crown className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
        <div>
          <p className="font-bold">Superadmin Protection Active</p>
          <p className="text-primary/70 mt-0.5">The account <span className="font-bold">{SUPERADMIN_EMAIL}</span> is permanently protected and cannot be modified, suspended, or demoted by any administrator.</p>
        </div>
      </div>

      {/* Filter */}
      <div className="cb-card p-4 bg-white/95 backdrop-blur-md">
        <div className="relative max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3.5" />
          <input type="text" placeholder="Search admins..." value={search} onChange={e => setSearch(e.target.value)} className="cb-input pl-9 w-full" />
        </div>
      </div>

      {/* Table */}
      {isLoading && admins.length === 0 ? (
        <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="cb-card p-12 text-center"><Shield className="w-8 h-8 mx-auto text-slate-300 mb-3" /><p className="text-sm font-bold text-slate-600">No admins found</p></div>
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden md:block cb-card overflow-hidden bg-white/95 backdrop-blur-md border border-slate-100">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-100 bg-slate-50/50">
                    <th className="p-4 pl-6">Administrator</th>
                    <th className="p-4">Department</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 pr-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/50">
                  {filtered.map(u => {
                    const isSA = u.email === SUPERADMIN_EMAIL;
                    const isSelf = u.id === currentUser?.id;
                    const isProc = processing === u.id;
                    return (
                      <tr key={u.id} className="text-xs hover:bg-slate-50/30 transition-colors">
                        <td className="p-4 pl-6">
                          <div className="flex items-center gap-3">
                            <AvatarRing src={u.image || undefined} name={u.name || undefined} role={u.role} size="sm" />
                            <div>
                              <p className="font-bold text-slate-900 flex items-center gap-1.5">
                                {u.name || 'Admin'}
                                {isSA && <span className="flex items-center gap-0.5 text-[9px] bg-primary/10 text-primary font-extrabold uppercase px-1.5 py-0.5 rounded"><Crown className="w-2.5 h-2.5" />Superadmin</span>}
                                {isSelf && !isSA && <span className="text-[9px] bg-slate-100 text-slate-500 font-extrabold uppercase px-1.5 py-0.5 rounded">You</span>}
                              </p>
                              <p className="text-[10px] text-slate-400">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-slate-600 font-semibold">{u.department || '—'}</td>
                        <td className="p-4"><StatusBadge status={u.status} /></td>
                        <td className="p-4 pr-6">
                          {isSA ? (
                            <span className="text-[10px] text-slate-400 font-bold flex items-center justify-end gap-1"><ShieldCheck className="w-3.5 h-3.5 text-primary" />Protected</span>
                          ) : isSelf ? (
                            <span className="text-[10px] text-slate-400 font-bold italic text-right block">Self Session</span>
                          ) : (
                            <div className="flex items-center justify-end gap-1.5">
                              <button onClick={() => handleToggleSuspend(u)} disabled={!!isProc} title={u.status === 'SUSPENDED' ? 'Activate' : 'Suspend'} className={`p-1.5 rounded-lg border border-transparent transition-colors cursor-pointer disabled:opacity-50 ${u.status === 'SUSPENDED' ? 'hover:bg-emerald-50 text-emerald-600 hover:border-emerald-200' : 'hover:bg-amber-50 text-amber-600 hover:border-amber-200'}`}>
                                {isProc ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : u.status === 'SUSPENDED' ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                              </button>
                              <button onClick={() => openDemoteModal(u)} disabled={!!isProc} title="Demote Admin" className="p-1.5 hover:bg-red-50 rounded-lg text-red-600 border border-transparent hover:border-red-200 transition-colors cursor-pointer disabled:opacity-50">
                                <UserMinus className="w-3.5 h-3.5" />
                              </button>
                            </div>
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
              const isSA = u.email === SUPERADMIN_EMAIL;
              const isSelf = u.id === currentUser?.id;
              const isProc = processing === u.id;
              return (
                <div key={u.id} className="cb-card p-5 bg-white/95 space-y-3">
                  <div className="flex items-center gap-3">
                    <AvatarRing src={u.image || undefined} name={u.name || undefined} role={u.role} size="md" />
                    <div>
                      <p className="font-bold text-slate-900 text-sm flex items-center gap-1.5">{u.name || 'Admin'}{isSA && <Crown className="w-3.5 h-3.5 text-primary" />}</p>
                      <p className="text-[10px] text-slate-400">{u.email}</p>
                    </div>
                  </div>
                  <div className="border-t border-slate-100 pt-3 space-y-2 text-xs">
                    <div className="flex justify-between"><span className="text-slate-400 font-semibold">Status:</span><StatusBadge status={u.status} /></div>
                  </div>
                  {!isSA && !isSelf && (
                    <div className="border-t border-slate-100 pt-3 flex gap-2">
                      <button onClick={() => handleToggleSuspend(u)} disabled={!!isProc} className={`flex-1 py-1.5 border rounded-lg text-[10px] font-bold uppercase cursor-pointer flex items-center justify-center gap-1 disabled:opacity-50 ${u.status === 'SUSPENDED' ? 'border-emerald-200 text-emerald-700' : 'border-amber-200 text-amber-700'}`}>
                        {u.status === 'SUSPENDED' ? <><Unlock className="w-3 h-3" />Activate</> : <><Lock className="w-3 h-3" />Suspend</>}
                      </button>
                      <button onClick={() => openDemoteModal(u)} disabled={!!isProc} className="flex-1 py-1.5 border border-red-200 text-red-700 hover:bg-red-50 rounded-lg text-[10px] font-bold uppercase cursor-pointer flex items-center justify-center gap-1 disabled:opacity-50">
                        <UserMinus className="w-3 h-3" />Demote
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Demote Confirmation Modal */}
      <AnimatePresence>
        {demoteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 15 }} transition={{ duration: 0.2 }} className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100">
              <div className="px-6 py-5 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-amber-500" />Demote Administrator</h3>
                <p className="text-xs text-slate-500 mt-1">Remove admin privileges from <span className="font-bold">{demoteModal.name || demoteModal.email}</span></p>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-450 mb-2">Assign New Role</label>
                  <div className="grid grid-cols-2 gap-3">
                    {(['RESEARCH_SUPERVISOR', 'RESEARCH_SCHOLAR'] as const).map(r => (
                      <button key={r} onClick={() => setDemoteRole(r)} className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all cursor-pointer ${demoteRole === r ? 'bg-primary text-white border-primary' : 'bg-white text-slate-700 border-slate-200 hover:border-primary/30'}`}>
                        {r === 'RESEARCH_SUPERVISOR' ? 'Supervisor' : 'Scholar'}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  This will immediately revoke admin access. The user will be redirected to their new role dashboard on next page load.
                </p>
              </div>
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
                <button onClick={() => setDemoteModal(null)} className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-650 font-bold text-xs rounded-xl cursor-pointer transition-all">Cancel</button>
                <button onClick={handleDemote} disabled={!!processing} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl cursor-pointer transition-all disabled:opacity-50 flex items-center gap-2">
                  {processing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserMinus className="w-3.5 h-3.5" />}
                  Confirm Demote
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
