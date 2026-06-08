'use client';

import React, { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { useRouter } from 'next/navigation';
import { 
  UserCog, Search, CheckCircle, XCircle, AlertTriangle, ShieldCheck, 
  Lock, Unlock, Loader2, Plus, Trash2, Edit2, UserPlus, X, Check, ArrowRight
} from 'lucide-react';
import AvatarRing from '@/components/AvatarRing';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

// ─── Badges Components ───────────────────────────────────────────────────
function RoleBadge({ role }: { role: string }) {
  if (role === 'INSTITUTE_ADMIN' || role === 'INSTITUTE_ADMIN') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-rose-50 text-rose-700 border border-rose-200">
        Admin
      </span>
    );
  }
  if (role === 'RESEARCH_SUPERVISOR') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-purple-50 text-purple-700 border border-purple-200">
        Supervisor
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-blue-50 text-blue-700 border border-blue-200">
      Scholar
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'APPROVED' || status === 'ACTIVE') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <Check className="w-2.5 h-2.5" />
        <span>Approved</span>
      </span>
    );
  }
  if (status === 'PENDING') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-250">
        <Loader2 className="w-2.5 h-2.5 animate-spin" />
        <span>Pending</span>
      </span>
    );
  }
  if (status === 'REJECTED') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
        <XCircle className="w-2.5 h-2.5" />
        <span>Rejected</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-650 border border-zinc-300">
      <Lock className="w-2.5 h-2.5" />
      <span>Suspended</span>
    </span>
  );
}

// ─── Main Page Component ─────────────────────────────────────────────────
export default function AdminUsersPage() {
  const router = useRouter();
  const {
    currentUser,
    adminUsers,
    fetchAdminUsers,
    createAdminUser,
    updateAdminUser,
    deleteAdminUser,
    suspendUserToggle,
    departments,
    fetchDepartments,
    supervisors,
    fetchSupervisors,
    isLoading
  } = useStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'RESEARCH_SCHOLAR',
    departmentId: '',
    supervisorId: '',
    status: 'PENDING'
  });

  const isAdmin = currentUser?.role === 'INSTITUTE_ADMIN';

  // Guard against non-admin access
  useEffect(() => {
    if (currentUser && !isAdmin) {
      router.replace('/dashboard');
    }
  }, [currentUser, isAdmin, router]);

  useEffect(() => {
    if (isAdmin) {
      fetchAdminUsers();
      fetchDepartments();
      fetchSupervisors();
    }
  }, [currentUser, isAdmin, fetchAdminUsers, fetchDepartments, fetchSupervisors]);

  if (!isAdmin) {
    return null;
  }

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.role) {
      alert('Name, Email and Role are required.');
      return;
    }
    try {
      await createAdminUser({
        name: formData.name,
        email: formData.email,
        role: formData.role as any,
        departmentId: formData.departmentId || undefined,
        supervisorId: formData.role === 'RESEARCH_SCHOLAR' ? (formData.supervisorId || undefined) : undefined
      });
      setIsCreateOpen(false);
      resetForm();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      await updateAdminUser(editingUser.id, {
        name: formData.name,
        email: formData.email,
        role: formData.role as any,
        status: formData.status as any,
        departmentId: formData.departmentId || undefined,
        supervisorId: formData.role === 'RESEARCH_SCHOLAR' ? (formData.supervisorId || undefined) : undefined
      });
      setEditingUser(null);
      resetForm();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleDelete = async (userId: string, email: string) => {
    if (confirm(`Are you absolutely sure you want to delete user ${email}? This action is irreversible.`)) {
      try {
        await deleteAdminUser(userId);
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const handleSuspendToggle = async (userId: string, currentSuspended: boolean, status: string) => {
    const isSusp = currentSuspended || status === 'SUSPENDED';
    const action = isSusp ? 'unsuspend' : 'suspend';
    if (confirm(`Are you sure you want to ${action} this user?`)) {
      try {
        if (action === 'suspend') {
          await updateAdminUser(userId, { status: 'SUSPENDED' });
        } else {
          await updateAdminUser(userId, { status: 'APPROVED' });
        }
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const handleApprove = async (userId: string) => {
    try {
      await updateAdminUser(userId, { status: 'APPROVED' });
    } catch (err: any) {
      alert(err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      role: 'RESEARCH_SCHOLAR',
      departmentId: '',
      supervisorId: '',
      status: 'PENDING'
    });
  };

  const openCreate = () => {
    resetForm();
    setIsCreateOpen(true);
  };

  const openEdit = (user: any) => {
    setFormData({
      name: user.name || '',
      email: user.email,
      role: user.role,
      departmentId: user.departmentId || '',
      supervisorId: user.supervisorId || '',
      status: user.status
    });
    setEditingUser(user);
  };

  const filteredUsers = adminUsers.filter((user) => {
    const matchesSearch =
      (user.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.department?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesRole = !roleFilter || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6 text-left select-none">
      
      {/* 🚀 Header */}
      <div className="border-b border-slate-100 pb-5 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-1.5">
            <UserCog className="w-4 h-4 text-primary" />
            <span>User Provisioning & Security</span>
          </span>
          <h1 className="cb-page-title mt-2 font-display">Authorized Account Directory</h1>
          <p className="cb-page-subtitle">
            Pre-provision accounts, edit organizational structures, assign research supervisors, and approve pending entries.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/users/import"
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 hover:border-slate-300 text-slate-800 font-bold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-sm"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Bulk Import</span>
          </Link>
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-primary hover:bg-[#004495] text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-primary/20 border border-primary hover:border-[#004495]"
          >
            <Plus className="w-4 h-4" />
            <span>Provision User</span>
          </button>
        </div>
      </div>

      {/* 🚀 Search & Filters */}
      <div className="cb-card p-5 bg-white/95 backdrop-blur-md grid grid-cols-1 sm:grid-cols-2 gap-4 shadow-sm border border-slate-100">
        <div className="relative">
          <input
            type="text"
            placeholder="Search name, email, department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="cb-input pl-9"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3.5" />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="w-full px-3 h-[42px] text-xs font-semibold rounded-lg bg-white border border-slate-200 focus:outline-none transition-all cursor-pointer"
        >
          <option value="">All Roles</option>
          <option value='RESEARCH_SCHOLAR'>Scholar</option>
          <option value='RESEARCH_SUPERVISOR'>Supervisor</option>
          <option value='INSTITUTE_ADMIN'>Admin</option>
        </select>
      </div>

      {/* 🚀 Users Table */}
      {isLoading && adminUsers.length === 0 ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : (
        <>
          {/* Desktop View */}
          <div className="hidden md:block cb-card overflow-hidden bg-white/95 backdrop-blur-md border border-slate-100 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="cb-table-header text-[10px] uppercase tracking-wider text-slate-450 border-b border-slate-100 bg-slate-50/50">
                    <th className="p-4 pl-6">User Details</th>
                    <th className="p-4">Org Department</th>
                    <th className="p-4">Platform Role</th>
                    <th className="p-4">Supervisor Map</th>
                    <th className="p-4">Access Status</th>
                    <th className="p-4 pr-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/50">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="cb-table-row text-xs hover:bg-slate-50/20 transition-colors">
                      <td className="p-4 pl-6">
                        <div className="flex items-center space-x-3">
                          <AvatarRing
                            src={user.image || undefined}
                            name={user.name || undefined}
                            role={user.role}
                            size="sm"
                          />
                          <div>
                            <h4 className="font-bold text-slate-900 leading-snug flex items-center gap-1.5">
                              <span>{user.name || 'Pre-Provisioned Account'}</span>
                              {!user.clerkId && (
                                <span className="text-[9px] bg-slate-100 text-slate-500 font-extrabold uppercase px-1.5 py-0.5 rounded">
                                  Not Linked
                                </span>
                              )}
                            </h4>
                            <p className="text-[10px] text-slate-400 font-semibold">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      
                      <td className="p-4 text-slate-650 font-bold">{user.department || '—'}</td>
                      
                      <td className="p-4">
                        <RoleBadge role={user.role} />
                      </td>

                      <td className="p-4 text-slate-500">
                        {user.role === 'RESEARCH_SCHOLAR' ? (
                          user.supervisor ? (
                            <div>
                              <p className="font-bold text-slate-700 leading-none">{user.supervisor.name}</p>
                              <p className="text-[9px] text-slate-400 font-semibold">{user.supervisor.email}</p>
                            </div>
                          ) : user.supervisorEmail ? (
                            <span className="text-[10px] font-semibold text-slate-500 italic">{user.supervisorEmail}</span>
                          ) : (
                            <span className="text-amber-600 font-semibold text-[10px] flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              <span>No supervisor</span>
                            </span>
                          )
                        ) : (
                          <span className="text-slate-350 italic">—</span>
                        )}
                      </td>

                      <td className="p-4">
                        <StatusBadge status={user.status} />
                      </td>

                      <td className="p-4 pr-6 text-right">
                        {user.id !== currentUser.id ? (
                          <div className="flex items-center justify-end gap-1.5">
                            {user.status === 'PENDING' && (
                              <button
                                onClick={() => handleApprove(user.id)}
                                title="Quick Approve"
                                className="p-1.5 hover:bg-emerald-50 rounded-lg text-emerald-600 border border-transparent hover:border-emerald-200 transition-colors cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => openEdit(user)}
                              title="Edit User"
                              className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-600 border border-transparent hover:border-slate-200 transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleSuspendToggle(user.id, !!user.suspended, user.status)}
                              title={user.status === 'SUSPENDED' ? 'Activate Account' : 'Suspend Account'}
                              className={`p-1.5 rounded-lg border border-transparent transition-colors cursor-pointer ${
                                user.status === 'SUSPENDED'
                                  ? 'hover:bg-emerald-50 text-emerald-600 hover:border-emerald-200'
                                  : 'hover:bg-amber-50 text-amber-600 hover:border-amber-200'
                              }`}
                            >
                              {user.status === 'SUSPENDED' ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => handleDelete(user.id, user.email)}
                              title="Delete User"
                              className="p-1.5 hover:bg-red-50 rounded-lg text-red-600 border border-transparent hover:border-red-200 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-bold italic pr-2">Self Session</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile View */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {filteredUsers.map((user) => (
              <div key={user.id} className="cb-card p-5 bg-white/95 backdrop-blur-md space-y-4 shadow-sm border border-slate-100">
                <div className="flex items-center gap-3">
                  <AvatarRing
                    src={user.image || undefined}
                    name={user.name || undefined}
                    role={user.role}
                    size="md"
                  />
                  <div>
                    <h4 className="font-bold text-slate-900 leading-snug flex items-center gap-1.5">
                      <span>{user.name || 'Candidate Account'}</span>
                      {!user.clerkId && (
                        <span className="text-[9px] bg-slate-100 text-slate-500 font-extrabold uppercase px-1.5 py-0.5 rounded">
                          Not Linked
                        </span>
                      )}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-semibold">{user.email}</p>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-450 font-semibold">Department:</span>
                    <span className="font-bold text-slate-700">{user.department || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-450 font-semibold">Role:</span>
                    <RoleBadge role={user.role} />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-450 font-semibold">Status:</span>
                    <StatusBadge status={user.status} />
                  </div>
                  {user.role === 'RESEARCH_SCHOLAR' && (
                    <div className="flex justify-between items-start">
                      <span className="text-slate-450 font-semibold">Supervisor:</span>
                      <span className="font-bold text-slate-700 text-right">
                        {user.supervisor?.name || user.supervisorEmail || 'None'}
                      </span>
                    </div>
                  )}
                </div>

                {user.id !== currentUser.id && (
                  <div className="border-t border-slate-100 pt-3 flex items-center gap-2 justify-end">
                    {user.status === 'PENDING' && (
                      <button
                        onClick={() => handleApprove(user.id)}
                        className="flex-1 py-1.5 bg-emerald-55 hover:bg-emerald-600 border border-emerald-250 text-emerald-700 hover:text-white rounded-lg text-[10px] font-bold uppercase cursor-pointer transition-all flex items-center justify-center gap-1"
                      >
                        <Check className="w-3 h-3" />
                        <span>Approve</span>
                      </button>
                    )}
                    <button
                      onClick={() => openEdit(user)}
                      className="px-3 py-1.5 border border-slate-200 text-slate-650 hover:bg-slate-50 rounded-lg text-[10px] font-bold uppercase cursor-pointer transition-all flex items-center justify-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleSuspendToggle(user.id, !!user.suspended, user.status)}
                      className={`px-3 py-1.5 border text-slate-750 hover:bg-slate-50 rounded-lg text-[10px] font-bold uppercase cursor-pointer transition-all flex items-center justify-center gap-1 ${
                        user.status === 'SUSPENDED' ? 'border-emerald-200 text-emerald-700' : 'border-amber-200 text-amber-700'
                      }`}
                    >
                      {user.status === 'SUSPENDED' ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                      <span>{user.status === 'SUSPENDED' ? 'Activate' : 'Suspend'}</span>
                    </button>
                    <button
                      onClick={() => handleDelete(user.id, user.email)}
                      className="px-3 py-1.5 border border-red-200 text-red-700 hover:bg-red-50 rounded-lg text-[10px] font-bold uppercase cursor-pointer transition-all flex items-center justify-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* 🚀 Modals */}
      <AnimatePresence>
        {(isCreateOpen || editingUser) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-100 text-slate-800"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-primary" />
                  <span>{editingUser ? 'Edit User Credentials' : 'Provision New User'}</span>
                </h3>
                <button
                  onClick={() => {
                    setIsCreateOpen(false);
                    setEditingUser(null);
                  }}
                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={editingUser ? handleEditSubmit : handleCreateSubmit}>
                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                  {/* Name field */}
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-450 mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. Ravichandran V"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="cb-input w-full"
                    />
                  </div>

                  {/* Email field */}
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-450 mb-1.5">
                      Institutional Email Address
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. ravichandran@srmist.edu.in"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="cb-input w-full"
                    />
                  </div>

                  {/* Role and status field */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-450 mb-1.5">
                        Platform Role
                      </label>
                      <select
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        className="w-full px-3 h-[42px] text-xs font-semibold rounded-lg bg-white border border-slate-200 focus:outline-none transition-all cursor-pointer"
                      >
                        <option value='RESEARCH_SCHOLAR'>Scholar</option>
                        <option value='RESEARCH_SUPERVISOR'>Supervisor</option>
                        <option value='INSTITUTE_ADMIN'>Admin</option>
                      </select>
                    </div>

                    {editingUser ? (
                      <div>
                        <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-450 mb-1.5">
                          Account Status
                        </label>
                        <select
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                          className="w-full px-3 h-[42px] text-xs font-semibold rounded-lg bg-white border border-slate-200 focus:outline-none transition-all cursor-pointer"
                        >
                          <option value="PENDING">Pending Approval</option>
                          <option value="APPROVED">Approved / Active</option>
                          <option value="REJECTED">Rejected</option>
                          <option value="SUSPENDED">Suspended</option>
                        </select>
                      </div>
                    ) : (
                      <div className="flex flex-col justify-center">
                        <span className="text-[10px] text-slate-400 font-bold italic leading-relaxed pt-2">
                          Status defaults to PENDING for Scholars, APPROVED for Supervisors/Admins.
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Department select */}
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-450 mb-1.5">
                      Academic Department
                    </label>
                    <select
                      value={formData.departmentId}
                      onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                      className="w-full px-3 h-[42px] text-xs font-semibold rounded-lg bg-white border border-slate-200 focus:outline-none transition-all cursor-pointer"
                    >
                      <option value="">No Department Mapping</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name} ({dept.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Supervisor map (only shown for scholar role) */}
                  {formData.role === 'RESEARCH_SCHOLAR' && (
                    <div className="animate-fade-in">
                      <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-450 mb-1.5">
                        Research Supervisor
                      </label>
                      <select
                        value={formData.supervisorId}
                        onChange={(e) => setFormData({ ...formData, supervisorId: e.target.value })}
                        className="w-full px-3 h-[42px] text-xs font-semibold rounded-lg bg-white border border-slate-200 focus:outline-none transition-all cursor-pointer"
                      >
                        <option value="">No Supervisor Assigned</option>
                        {supervisors.map((sup) => (
                          <option key={sup.id} value={sup.id}>
                            {sup.name} ({sup.email})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreateOpen(false);
                      setEditingUser(null);
                    }}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-650 font-bold text-xs rounded-xl cursor-pointer transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary hover:bg-[#004495] text-white font-bold text-xs rounded-xl cursor-pointer transition-all border border-primary hover:border-[#004495]"
                  >
                    {editingUser ? 'Save Changes' : 'Create Account'}
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
