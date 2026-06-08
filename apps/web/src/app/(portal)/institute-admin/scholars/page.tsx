'use client';

import React, { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { useRouter } from 'next/navigation';
import {
  GraduationCap, Search, Plus, Edit2, Trash2, Lock, Unlock,
  Check, X, Loader2, AlertTriangle, UserCheck, ShieldCheck, RefreshCw
} from 'lucide-react';
import AvatarRing from '@/components/AvatarRing';
import { motion, AnimatePresence } from 'framer-motion';

const SUPERADMIN_EMAIL = 'r.matheshwaran.io@gmail.com';

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    APPROVED: { label: 'Active', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    ACTIVE:   { label: 'Active', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    PENDING:  { label: 'Pending', className: 'bg-amber-50 text-amber-700 border-amber-200' },
    PENDING_SUPERVISOR_APPROVAL: { label: 'Awaiting Supervisor', className: 'bg-sky-50 text-sky-700 border-sky-200' },
    PENDING_ADMIN_APPROVAL:      { label: 'Awaiting Admin', className: 'bg-violet-50 text-violet-700 border-violet-200' },
    REJECTED:  { label: 'Rejected', className: 'bg-red-50 text-red-700 border-red-200' },
    SUSPENDED: { label: 'Suspended', className: 'bg-zinc-100 text-zinc-700 border-zinc-300' },
  };
  const { label, className } = map[status] ?? { label: status, className: 'bg-slate-100 text-slate-600 border-slate-200' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${className}`}>
      {label}
    </span>
  );
}

export default function InstituteAdminScholarsPage() {
  const router = useRouter();
  const {
    currentUser,
    adminUsers,
    fetchAdminUsers,
    createAdminUser,
    updateAdminUser,
    deleteAdminUser,
    departments,
    fetchDepartments,
    supervisors,
    fetchSupervisors,
    isLoading,
    addToast,
  } = useStore();

  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deptFilter, setDeptFilter]   = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [processing, setProcessing]   = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '', email: '', departmentId: '', supervisorId: '', status: 'APPROVED',
  });

  const isAdmin = currentUser?.role === 'INSTITUTE_ADMIN';

  useEffect(() => {
    if (currentUser && !isAdmin) router.replace('/dashboard');
  }, [currentUser, isAdmin, router]);

  useEffect(() => {
    if (isAdmin) {
      fetchAdminUsers();
      fetchDepartments();
      fetchSupervisors();
    }
  }, [isAdmin, fetchAdminUsers, fetchDepartments, fetchSupervisors]);

  if (!isAdmin) return null;

  const scholars = adminUsers.filter(u => u.role === 'RESEARCH_SCHOLAR');

  const filtered = scholars.filter(u => {
    const term = search.toLowerCase();
    const matchSearch =
      (u.name || '').toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      (u.department || '').toLowerCase().includes(term);
    const matchStatus = !statusFilter || u.status === statusFilter;
    const matchDept   = !deptFilter || u.departmentId === deptFilter;
    return matchSearch && matchStatus && matchDept;
  });

  const resetForm = () => setForm({ name: '', email: '', departmentId: '', supervisorId: '', status: 'APPROVED' });

  const openCreate = () => { resetForm(); setEditingUser(null); setIsModalOpen(true); };
  const openEdit = (u: any) => {
    setForm({ name: u.name || '', email: u.email, departmentId: u.departmentId || '', supervisorId: u.supervisorId || '', status: u.status });
    setEditingUser(u);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) { addToast('Name and email are required.', 'error'); return; }
    try {
      if (editingUser) {
        await updateAdminUser(editingUser.id, { name: form.name, email: form.email, status: form.status as any, departmentId: form.departmentId || undefined, supervisorId: form.supervisorId || undefined });
      } else {
        await createAdminUser({ name: form.name, email: form.email, role: 'RESEARCH_SCHOLAR', departmentId: form.departmentId || undefined, supervisorId: form.supervisorId || undefined });
      }
      setIsModalOpen(false);
      resetForm();
    } catch (err: any) { addToast(err.message, 'error'); }
  };

  const handleDelete = async (u: any) => {
    if (u.email === SUPERADMIN_EMAIL) return;
    if (!confirm(`Delete ${u.email}? This is irreversible.`)) return;
    setProcessing(u.id);
    try { await deleteAdminUser(u.id); } catch (err: any) { addToast(err.message, 'error'); } finally { setProcessing(null); }
  };

  const handleToggleSuspend = async (u: any) => {
    if (u.email === SUPERADMIN_EMAIL) return;
    const isSuspended = u.status === 'SUSPENDED';
    setProcessing(u.id);
    try { await updateAdminUser(u.id, { status: isSuspended ? 'APPROVED' : 'SUSPENDED' }); } catch (err: any) { addToast(err.message, 'error'); } finally { setProcessing(null); }
  };

  const handleApprove = async (u: any) => {
    setProcessing(u.id);
    try { await updateAdminUser(u.id, { status: 'APPROVED' }); } catch (err: any) { addToast(err.message, 'error'); } finally { setProcessing(null); }
  };

  const getSupervisorName = (u: any) => {
    if (u.supervisor?.name) return u.supervisor.name;
    if (u.supervisorId) { const s = supervisors.find(sv => sv.id === u.supervisorId); return s?.name || u.supervisorEmail || '—'; }
    return null;
  };

  return (
    <div className="space-y-6 select-none">

      {/* Header */}
      <div className="border-b border-slate-100 pb-5 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-1.5">
            <GraduationCap className="w-4 h-4" />
            <span>Scholar Registry</span>
          </span>
          <h1 className="cb-page-title mt-2 font-display">Research Scholars</h1>
          <p className="cb-page-subtitle">
            Provision, manage, and assign supervisors for all Research Scholars in the institute.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { fetchAdminUsers(); addToast('Refreshed', 'info'); }}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 transition-all cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={openCreate}
            className="px-4 py-2.5 bg-primary hover:bg-[#004495] text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-primary/20 border border-primary"
          >
            <Plus className="w-4 h-4" />
            <span>Add Scholar</span>
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Scholars', value: scholars.length, color: 'text-primary' },
          { label: 'Active', value: scholars.filter(u => u.status === 'APPROVED' || u.status === 'ACTIVE').length, color: 'text-emerald-600' },
          { label: 'Pending Review', value: scholars.filter(u => ['PENDING','PENDING_SUPERVISOR_APPROVAL','PENDING_ADMIN_APPROVAL'].includes(u.status)).length, color: 'text-amber-600' },
          { label: 'No Supervisor', value: scholars.filter(u => !u.supervisorId).length, color: 'text-red-500' },
        ].map(stat => (
          <div key={stat.label} className="cb-card p-4 bg-white/95 backdrop-blur-md">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
            <h3 className={`text-2xl font-extrabold mt-0.5 font-display ${stat.color}`}>{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="cb-card p-4 bg-white/95 backdrop-blur-md grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3.5" />
          <input type="text" placeholder="Search name, email, department..." value={search} onChange={e => setSearch(e.target.value)} className="cb-input pl-9" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full px-3 h-[42px] text-xs font-semibold rounded-lg bg-white border border-slate-200 focus:outline-none cursor-pointer">
          <option value="">All Statuses</option>
          <option value="APPROVED">Active</option>
          <option value="PENDING">Pending</option>
          <option value="PENDING_SUPERVISOR_APPROVAL">Awaiting Supervisor</option>
          <option value="PENDING_ADMIN_APPROVAL">Awaiting Admin</option>
          <option value="REJECTED">Rejected</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
        <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className="w-full px-3 h-[42px] text-xs font-semibold rounded-lg bg-white border border-slate-200 focus:outline-none cursor-pointer">
          <option value="">All Departments</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      {/* Table */}
      {isLoading && scholars.length === 0 ? (
        <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="cb-card p-12 text-center">
          <GraduationCap className="w-8 h-8 mx-auto text-slate-300 mb-3" />
          <p className="text-sm font-bold text-slate-600">No scholars found</p>
          <p className="text-xs text-slate-400 mt-1">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden md:block cb-card overflow-hidden bg-white/95 backdrop-blur-md border border-slate-100">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-100 bg-slate-50/50">
                    <th className="p-4 pl-6">Scholar</th>
                    <th className="p-4">Department</th>
                    <th className="p-4">Supervisor</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 pr-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/50">
                  {filtered.map(u => {
                    const supName = getSupervisorName(u);
                    const isSuperadmin = u.email === SUPERADMIN_EMAIL;
                    const isProc = processing === u.id;
                    return (
                      <tr key={u.id} className="text-xs hover:bg-slate-50/30 transition-colors">
                        <td className="p-4 pl-6">
                          <div className="flex items-center gap-3">
                            <AvatarRing src={u.image || undefined} name={u.name || undefined} role={u.role} size="sm" />
                            <div>
                              <p className="font-bold text-slate-900">{u.name || 'Pre-Provisioned'}</p>
                              <p className="text-[10px] text-slate-400 font-semibold">{u.email}</p>
                              {!u.clerkId && <span className="text-[9px] bg-slate-100 text-slate-500 font-bold uppercase px-1.5 py-0.5 rounded">Not Linked</span>}
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-slate-600 font-semibold">{u.department || '—'}</td>
                        <td className="p-4">
                          {supName ? (
                            <div className="flex items-center gap-1.5">
                              <UserCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              <span className="font-semibold text-slate-700">{supName}</span>
                            </div>
                          ) : (
                            <span className="flex items-center gap-1 text-amber-600 font-semibold">
                              <AlertTriangle className="w-3 h-3" />No supervisor
                            </span>
                          )}
                        </td>
                        <td className="p-4"><StatusBadge status={u.status} /></td>
                        <td className="p-4 pr-6">
                          {isSuperadmin ? (
                            <span className="text-[10px] text-slate-400 font-bold flex items-center justify-end gap-1">
                              <ShieldCheck className="w-3.5 h-3.5 text-primary" />Protected
                            </span>
                          ) : (
                            <div className="flex items-center justify-end gap-1.5">
                              {(u.status === 'PENDING' || u.status === 'PENDING_ADMIN_APPROVAL') && (
                                <button onClick={() => handleApprove(u)} disabled={!!isProc} title="Approve" className="p-1.5 hover:bg-emerald-50 rounded-lg text-emerald-600 border border-transparent hover:border-emerald-200 transition-colors cursor-pointer disabled:opacity-50">
                                  {isProc ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                </button>
                              )}
                              <button onClick={() => openEdit(u)} title="Edit" className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-600 border border-transparent hover:border-slate-200 transition-colors cursor-pointer">
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => handleToggleSuspend(u)} disabled={!!isProc} title={u.status === 'SUSPENDED' ? 'Activate' : 'Suspend'} className={`p-1.5 rounded-lg border border-transparent transition-colors cursor-pointer disabled:opacity-50 ${u.status === 'SUSPENDED' ? 'hover:bg-emerald-50 text-emerald-600 hover:border-emerald-200' : 'hover:bg-amber-50 text-amber-600 hover:border-amber-200'}`}>
                                {u.status === 'SUSPENDED' ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                              </button>
                              <button onClick={() => handleDelete(u)} disabled={!!isProc} title="Delete" className="p-1.5 hover:bg-red-50 rounded-lg text-red-600 border border-transparent hover:border-red-200 transition-colors cursor-pointer disabled:opacity-50">
                                <Trash2 className="w-3.5 h-3.5" />
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
              const supName = getSupervisorName(u);
              const isSuperadmin = u.email === SUPERADMIN_EMAIL;
              const isProc = processing === u.id;
              return (
                <div key={u.id} className="cb-card p-5 bg-white/95 space-y-3">
                  <div className="flex items-center gap-3">
                    <AvatarRing src={u.image || undefined} name={u.name || undefined} role={u.role} size="md" />
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{u.name || 'Pre-Provisioned'}</p>
                      <p className="text-[10px] text-slate-400">{u.email}</p>
                    </div>
                  </div>
                  <div className="border-t border-slate-100 pt-3 space-y-2 text-xs">
                    <div className="flex justify-between"><span className="text-slate-400 font-semibold">Department:</span><span className="font-bold text-slate-700">{u.department || '—'}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400 font-semibold">Supervisor:</span><span className={`font-bold ${supName ? 'text-slate-700' : 'text-amber-600'}`}>{supName || 'None assigned'}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400 font-semibold">Status:</span><StatusBadge status={u.status} /></div>
                  </div>
                  {!isSuperadmin && (
                    <div className="border-t border-slate-100 pt-3 flex gap-2">
                      <button onClick={() => openEdit(u)} className="flex-1 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-[10px] font-bold uppercase cursor-pointer flex items-center justify-center gap-1"><Edit2 className="w-3 h-3"/>Edit</button>
                      <button onClick={() => handleToggleSuspend(u)} disabled={!!isProc} className={`flex-1 py-1.5 border rounded-lg text-[10px] font-bold uppercase cursor-pointer flex items-center justify-center gap-1 ${u.status === 'SUSPENDED' ? 'border-emerald-200 text-emerald-700' : 'border-amber-200 text-amber-700'}`}>{u.status === 'SUSPENDED' ? <><Unlock className="w-3 h-3"/>Activate</> : <><Lock className="w-3 h-3"/>Suspend</>}</button>
                      <button onClick={() => handleDelete(u)} disabled={!!isProc} className="flex-1 py-1.5 border border-red-200 text-red-700 hover:bg-red-50 rounded-lg text-[10px] font-bold uppercase cursor-pointer flex items-center justify-center gap-1"><Trash2 className="w-3 h-3"/>Delete</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 15 }} transition={{ duration: 0.2 }} className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-100">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-primary" />
                  {editingUser ? 'Edit Scholar' : 'Add Scholar'}
                </h3>
                <button onClick={() => { setIsModalOpen(false); setEditingUser(null); }} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-450 mb-1.5">Full Name</label>
                    <input type="text" required placeholder="e.g. Arjun Sharma" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="cb-input w-full" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-450 mb-1.5">Institutional Email</label>
                    <input type="email" required placeholder="arjun@srmist.edu.in" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="cb-input w-full" disabled={!!editingUser} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-450 mb-1.5">Department</label>
                      <select value={form.departmentId} onChange={e => setForm({...form, departmentId: e.target.value})} className="w-full px-3 h-[42px] text-xs font-semibold rounded-lg bg-white border border-slate-200 focus:outline-none cursor-pointer">
                        <option value="">No Department</option>
                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </div>
                    {editingUser && (
                      <div>
                        <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-450 mb-1.5">Account Status</label>
                        <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full px-3 h-[42px] text-xs font-semibold rounded-lg bg-white border border-slate-200 focus:outline-none cursor-pointer">
                          <option value="APPROVED">Active</option>
                          <option value="PENDING">Pending</option>
                          <option value="REJECTED">Rejected</option>
                          <option value="SUSPENDED">Suspended</option>
                        </select>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-450 mb-1.5">Assign Supervisor</label>
                    <select value={form.supervisorId} onChange={e => setForm({...form, supervisorId: e.target.value})} className="w-full px-3 h-[42px] text-xs font-semibold rounded-lg bg-white border border-slate-200 focus:outline-none cursor-pointer">
                      <option value="">No Supervisor Assigned</option>
                      {supervisors.map(s => <option key={s.id} value={s.id}>{s.name} ({s.email})</option>)}
                    </select>
                  </div>
                </div>
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button type="button" onClick={() => { setIsModalOpen(false); setEditingUser(null); }} className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-650 font-bold text-xs rounded-xl cursor-pointer transition-all">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-primary hover:bg-[#004495] text-white font-bold text-xs rounded-xl cursor-pointer transition-all border border-primary">
                    {editingUser ? 'Save Changes' : 'Add Scholar'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
