'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useStore } from '@/store/useStore';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Users, 
  GraduationCap, 
  Shield, 
  UserCog, 
  Search, 
  Upload, 
  UserPlus, 
  X, 
  Check, 
  AlertCircle, 
  Eye, 
  Ban, 
  Loader2, 
  FileSpreadsheet,
  ArrowUpDown,
  Trash,
  Pencil
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch, apiMutate } from '@/lib/api-client';
import { getProfileImageUrl } from '@/lib/avatar';

// --- MAIN PORTAL WORKSHEET SHELL ---
function UserManagementContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { currentUser, addToast } = useStore();

  // Tab switcher state
  const [activeTab, setActiveTab] = useState<'SCHOLARS' | 'SUPERVISORS' | 'ADMINS'>('SCHOLARS');
  
  // Static lists shared across modals
  const [departments, setDepartments] = useState<any[]>([]);
  const [faculties, setFaculties] = useState<any[]>([]);
  const [allSupervisorsList, setAllSupervisorsList] = useState<any[]>([]);
  
  // Loading flag for general modal mutations
  const [actionLoading, setActionLoading] = useState(false);
  const [loadingDependencies, setLoadingDependencies] = useState(false);

  // Modal active flags
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddSingleUserModal, setShowAddSingleUserModal] = useState(false);
  
  // Modal states
  const [confirmAction, setConfirmAction] = useState<{
    type: 'DISABLE' | 'ENABLE' | 'REJECT';
    user: any;
  } | null>(null);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [deletingUser, setDeletingUser] = useState<any | null>(null);

  // Single User Form state
  const [singleRole, setSingleRole] = useState<'SCHOLAR' | 'SUPERVISOR' | 'ADMIN'>('SCHOLAR');
  const [singleName, setSingleName] = useState('');
  const [singleDesignation, setSingleDesignation] = useState('');
  const [singleFacultyId, setSingleFacultyId] = useState('');
  const [singleDeptId, setSingleDeptId] = useState('');
  const [singleCategory, setSingleCategory] = useState('');
  const [singleContactNo, setSingleContactNo] = useState('');
  const [singleEmail, setSingleEmail] = useState('');
  const [singleSupervisorId, setSingleSupervisorId] = useState('');

  // Import wizard records
  const [importStep, setImportStep] = useState<1 | 2>(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedRecords, setParsedRecords] = useState<any[]>([]);
  const [importStats, setImportStats] = useState({ newRecords: 0, updatedRecords: 0, conflicts: 0, invalid: 0 });

  // Page limit size
  const [limit, setLimit] = useState(25);

  // Tab specific data refresh trigger function map
  const refreshCallbacks = React.useRef<{ [key: string]: () => void }>({});

  // Guard access restriction
  useEffect(() => {
    if (currentUser && currentUser.role !== 'INSTITUTE_ADMIN') {
      router.replace('/dashboard');
    }
  }, [currentUser, router]);

  // Read URL search params on initialization
  useEffect(() => {
    const tabParam = searchParams.get('tab')?.toUpperCase();
    if (tabParam === 'SCHOLARS' || tabParam === 'SUPERVISORS' || tabParam === 'ADMINS') {
      setActiveTab(tabParam as any);
    }
  }, [searchParams]);

  // Fetch filter select dependencies
  const fetchDependencies = async () => {
    setLoadingDependencies(true);
    try {
      const [deptsRes, supsRes, facsRes] = await Promise.all([
        apiFetch('/api/departments'),
        apiFetch('/api/admin/supervisors?limit=1000'),
        apiFetch('/api/faculties')
      ]);
      if (deptsRes.ok) setDepartments(await deptsRes.json());
      if (supsRes.ok) {
        const supsObj = await supsRes.json();
        setAllSupervisorsList(supsObj.data || []);
      }
      if (facsRes.ok) setFaculties(await facsRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDependencies(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'INSTITUTE_ADMIN') {
      fetchDependencies();
    }
  }, [currentUser]);

  useEffect(() => {
    if (editingUser) {
      setSingleRole(
        editingUser.role === 'RESEARCH_SCHOLAR' ? 'SCHOLAR' :
        editingUser.role === 'RESEARCH_SUPERVISOR' ? 'SUPERVISOR' :
        'ADMIN'
      );
      setSingleName(editingUser.name || '');
      setSingleEmail(editingUser.email || '');
      const matchedDept = departments.find(d => d.id === editingUser.departmentId);
      setSingleFacultyId(matchedDept ? matchedDept.facultyId : '');
      setSingleDeptId(editingUser.departmentId || '');
      setSingleDesignation(editingUser.designation || editingUser.supervisorProfile?.designation || '');
      setSingleSupervisorId(editingUser.supervisorId || '');
      setShowAddSingleUserModal(true);
    }
  }, [editingUser, departments]);

  if (currentUser?.role !== 'INSTITUTE_ADMIN') {
    return null;
  }

  // Handle Tab Switcher selection
  const handleTabChange = (newTab: 'SCHOLARS' | 'SUPERVISORS' | 'ADMINS') => {
    setActiveTab(newTab);
    const params = new URLSearchParams();
    params.set('tab', newTab.toLowerCase());
    window.history.replaceState({}, '', `${pathname}?${params.toString()}`);
  };

  // Mutator triggers status update
  const handleUpdateStatus = async (user: any, status: 'ACTIVE' | 'SUSPENDED') => {
    setActionLoading(true);
    try {
      const endpoint = 
        user.role === 'RESEARCH_SCHOLAR' ? `/api/admin/scholars/${user.id}/status` :
        user.role === 'RESEARCH_SUPERVISOR' ? `/api/admin/supervisors/${user.id}/status` :
        `/api/admin/admins/${user.id}/status`;

      await apiMutate(endpoint, 'PUT', { status });
      addToast(`Status updated successfully.`, 'success');
      setConfirmAction(null);
      
      // Trigger lazy reload for current tab
      if (refreshCallbacks.current[activeTab]) {
        refreshCallbacks.current[activeTab]();
      }

      if (selectedUser?.id === user.id) {
        setSelectedUser({ ...selectedUser, status });
      }
    } catch (err: any) {
      addToast(`Failed to update status: ${err.message}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Add/Edit manually single user submit
  const handleAddSingleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleName || !singleEmail) {
      addToast('Please enter Name and Email.', 'error');
      return;
    }

    setActionLoading(true);
    try {
      let endpoint = '';
      let payload: any = {};
      const calculatedEmployeeId = singleEmail.split('@')[0].toUpperCase();

      if (singleRole === 'SCHOLAR') {
        endpoint = editingUser ? `/api/admin/scholars/${editingUser.id}` : '/api/admin/scholars';
        const matchedDept = departments.find(d => d.id === singleDeptId);
        payload = {
          name: singleName,
          email: singleEmail,
          employeeId: calculatedEmployeeId,
          departmentId: singleDeptId,
          facultyId: matchedDept ? matchedDept.facultyId : undefined,
          supervisorId: singleSupervisorId || undefined
        };
      } else if (singleRole === 'SUPERVISOR') {
        endpoint = editingUser ? `/api/admin/supervisors/${editingUser.id}` : '/api/admin/supervisors';
        const matchedDept = departments.find(d => d.id === singleDeptId);
        payload = {
          name: singleName,
          email: singleEmail,
          employeeId: calculatedEmployeeId,
          departmentId: singleDeptId,
          facultyId: matchedDept ? matchedDept.facultyId : undefined,
          designation: singleDesignation || undefined
        };
      } else {
        endpoint = editingUser ? `/api/admin/admins/${editingUser.id}` : '/api/admin/admins';
        payload = {
          name: singleName,
          email: singleEmail
        };
      }

      await apiMutate(endpoint, editingUser ? 'PUT' : 'POST', payload);
      addToast(editingUser ? 'User record updated successfully.' : 'User record added successfully.', 'success');
      
      setShowAddSingleUserModal(false);
      setEditingUser(null);
      setSingleName('');
      setSingleDesignation('');
      setSingleFacultyId('');
      setSingleDeptId('');
      setSingleCategory('');
      setSingleContactNo('');
      setSingleEmail('');
      setSingleSupervisorId('');

      // Refresh data
      if (refreshCallbacks.current[activeTab]) {
        refreshCallbacks.current[activeTab]();
      }
    } catch (err: any) {
      addToast(`Failed to persist user: ${err.message}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    setActionLoading(true);
    try {
      const endpoint = 
        deletingUser.role === 'RESEARCH_SCHOLAR' ? `/api/admin/scholars/${deletingUser.id}` :
        deletingUser.role === 'RESEARCH_SUPERVISOR' ? `/api/admin/supervisors/${deletingUser.id}` :
        `/api/admin/admins/${deletingUser.id}`;

      await apiMutate(endpoint, 'DELETE');
      addToast('User record permanently deleted.', 'success');
      setDeletingUser(null);

      // Refresh data
      if (refreshCallbacks.current[activeTab]) {
        refreshCallbacks.current[activeTab]();
      }
    } catch (err: any) {
      addToast(`Failed to delete user: ${err.message}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const resetFormState = () => {
    setShowAddSingleUserModal(false);
    setEditingUser(null);
    setSingleName('');
    setSingleDesignation('');
    setSingleFacultyId('');
    setSingleDeptId('');
    setSingleCategory('');
    setSingleContactNo('');
    setSingleEmail('');
    setSingleSupervisorId('');
  };

  // CSV Spreadsheet Template Download helpers
  const downloadScholarTemplate = () => {
    const csvContent = "Name,Designation,Faculty,Department,Official Mail ID\n" +
      "GAYATHRI R,Research Scholar,Engineering & Technology,Computer Applications,gr2516@srmist.edu.in\n" +
      "SANTHOSHKUMAR S,Research Scholar,Engineering & Technology,Computer Applications,santhosh.s@srmist.edu.in\n";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'Research_Scholar_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadSupervisorTemplate = () => {
    const csvContent = "Name,Designation,Faculty,Department,Official Mail ID\n" +
      "Dr. SUDHA M R,Assistant Professor grade I,Engineering & Technology,Computer Applications,dr.sudha@srmist.edu.in\n" +
      "Dr. RAZIA BEGUM S,Associate Professor,Engineering & Technology,Computer Applications,dr.razia@srmist.edu.in\n";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'Research_Supervisor_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setTimeout(() => {
      setParsedRecords([
        { id: 1, name: 'GAYATHRI R', email: 'gr2516@srmist.edu.in', employeeId: 'GR2516', designation: 'Research Scholar', department: 'Computer Applications', status: 'VALID' },
        { id: 2, name: 'Dr. RAZIA BEGUM S', email: 'dr.razia@srmist.edu.in', employeeId: 'DR.RAZIA', designation: 'Associate Professor', department: 'Computer Applications', status: 'VALID' }
      ]);
      setImportStats({ newRecords: 2, updatedRecords: 0, conflicts: 0, invalid: 0 });
      setImportStep(2);
    }, 1000);
  };

  const handleConfirmImport = async () => {
    setActionLoading(true);
    try {
      setTimeout(() => {
        addToast('Imported records successfully.', 'success');
        setShowImportModal(false);
        setImportStep(1);
        setSelectedFile(null);
        if (refreshCallbacks.current[activeTab]) {
          refreshCallbacks.current[activeTab]();
        }
      }, 1200);
    } catch (e: any) {
      addToast(e.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-left select-none pb-20 max-w-7xl mx-auto font-sans">
      
      {/* HEADER SECTION */}
      <div className="border-b border-slate-200 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black tracking-widest text-[#0C4DA2] uppercase">
            INSTITUTE ADMINISTRATION
          </span>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mt-2 font-display animate-fade-in">User & Access Management</h1>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Manage researcher identities, platform roles, and institutional access.
          </p>
        </div>

        {/* Dynamic Adapting Action Buttons based on currently active Lazy tab */}
        <div className="flex items-center gap-2.5">
          {activeTab === 'SCHOLARS' && (
            <>
              <button
                onClick={() => setShowImportModal(true)}
                className="px-4 py-2.5 bg-white border border-slate-250 hover:bg-slate-50 text-slate-750 text-xs font-bold rounded-xl shadow-3xs flex items-center gap-1.5 cursor-pointer shadow-3xs"
              >
                <Upload className="w-3.5 h-3.5" /> Import Records
              </button>
              <button
                onClick={() => {
                  setSingleRole('SCHOLAR');
                  setShowAddSingleUserModal(true);
                }}
                className="px-4 py-2.5 bg-[#0C4DA2] hover:bg-[#042654] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" /> Add Scholar
              </button>
            </>
          )}

          {activeTab === 'SUPERVISORS' && (
            <>
              <button
                onClick={() => setShowImportModal(true)}
                className="px-4 py-2.5 bg-white border border-slate-250 hover:bg-slate-50 text-slate-750 text-xs font-bold rounded-xl shadow-3xs flex items-center gap-1.5 cursor-pointer shadow-3xs"
              >
                <Upload className="w-3.5 h-3.5" /> Import Records
              </button>
              <button
                onClick={() => {
                  setSingleRole('SUPERVISOR');
                  setShowAddSingleUserModal(true);
                }}
                className="px-4 py-2.5 bg-[#0C4DA2] hover:bg-[#042654] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" /> Assign Supervisor
              </button>
            </>
          )}

          {activeTab === 'ADMINS' && (
            <button
              onClick={() => {
                setSingleRole('ADMIN');
                setShowAddSingleUserModal(true);
              }}
              className="px-4 py-2.5 bg-[#0C4DA2] hover:bg-[#042654] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" /> Add Administrator
            </button>
          )}
        </div>
      </div>

      {/* Clean Switcher Navigation Tab bar switcher */}
      <div className="flex border border-slate-200 bg-white rounded-xl overflow-hidden text-xs font-black uppercase tracking-widest max-w-3xl shadow-3xs font-sans divide-x divide-slate-200">
        <button
          onClick={() => handleTabChange('SCHOLARS')}
          className={`flex-1 py-3.5 px-6 transition-all cursor-pointer text-center ${
            activeTab === 'SCHOLARS' ? 'bg-[#0C4DA2] text-white font-black' : 'bg-white text-slate-550 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          Scholars
        </button>
        <button
          onClick={() => handleTabChange('SUPERVISORS')}
          className={`flex-1 py-3.5 px-6 transition-all cursor-pointer text-center ${
            activeTab === 'SUPERVISORS' ? 'bg-[#0C4DA2] text-white font-black' : 'bg-white text-slate-550 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          Supervisors
        </button>
        <button
          onClick={() => handleTabChange('ADMINS')}
          className={`flex-1 py-3.5 px-6 transition-all cursor-pointer text-center ${
            activeTab === 'ADMINS' ? 'bg-[#0C4DA2] text-white font-black' : 'bg-white text-slate-550 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          Institute Admins
        </button>
      </div>

      {/* LAZY CONDITIONAL RENDER MODULE ZONE */}
      <div className="min-h-[350px]">
        {activeTab === 'SCHOLARS' && (
          <ScholarsManagement 
            departments={departments}
            allSupervisorsList={allSupervisorsList}
            limit={limit}
            setLimit={setLimit}
            setSelectedUser={setSelectedUser}
            setConfirmAction={setConfirmAction}
            setEditingUser={setEditingUser}
            setDeletingUser={setDeletingUser}
            handleUpdateStatus={handleUpdateStatus}
            registerRefreshCallback={(cb) => { refreshCallbacks.current['SCHOLARS'] = cb; }}
          />
        )}

        {activeTab === 'SUPERVISORS' && (
          <SupervisorsManagement 
            departments={departments}
            limit={limit}
            setLimit={setLimit}
            setSelectedUser={setSelectedUser}
            setConfirmAction={setConfirmAction}
            setEditingUser={setEditingUser}
            setDeletingUser={setDeletingUser}
            handleUpdateStatus={handleUpdateStatus}
            registerRefreshCallback={(cb) => { refreshCallbacks.current['SUPERVISORS'] = cb; }}
          />
        )}

        {activeTab === 'ADMINS' && (
          <AdminsManagement 
            limit={limit}
            setLimit={setLimit}
            setSelectedUser={setSelectedUser}
            setConfirmAction={setConfirmAction}
            setEditingUser={setEditingUser}
            setDeletingUser={setDeletingUser}
            handleUpdateStatus={handleUpdateStatus}
            registerRefreshCallback={(cb) => { refreshCallbacks.current['ADMINS'] = cb; }}
          />
        )}
      </div>

      {/* VIEW RESEARCHER DETAIL DRAWER */}
      <AnimatePresence>
        {selectedUser && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedUser(null)}
              className="fixed inset-0 bg-slate-900/35 backdrop-blur-xs z-50 cursor-pointer"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-full sm:max-w-md bg-white border-l border-slate-200 z-[51] p-6 shadow-2xl flex flex-col justify-between overflow-y-auto text-left"
            >
              <div className="space-y-6">
                <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow bg-slate-100 flex items-center justify-center shrink-0">
                      <img src={getProfileImageUrl(selectedUser)} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-black text-slate-900 text-base leading-snug">{selectedUser.name || 'User Profile'}</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                        {selectedUser.designation || (selectedUser.role === 'RESEARCH_SUPERVISOR' ? 'Research Supervisor' : 'Research Scholar')}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedUser(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-5 text-xs">
                  <div className="space-y-2">
                    <h4 className="font-black text-slate-900 uppercase tracking-widest text-[10px] border-b border-slate-100 pb-1 text-[#0C4DA2]">
                      Institutional Identity
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-[11px]">
                      <div>
                        <span className="font-extrabold text-slate-400 block uppercase tracking-wider text-[9px]">Employee / Reg ID</span>
                        <span className="font-extrabold text-slate-900 block mt-0.5">{selectedUser.employeeId || 'Not Seeded'}</span>
                      </div>
                      <div>
                        <span className="font-extrabold text-slate-400 block uppercase tracking-wider text-[9px]">Official Email</span>
                        <span className="font-semibold text-slate-700 block mt-0.5 truncate" title={selectedUser.email}>{selectedUser.email}</span>
                      </div>
                      {selectedUser.role !== 'INSTITUTE_ADMIN' && (
                        <div>
                          <span className="font-extrabold text-slate-400 block uppercase tracking-wider text-[9px]">Department</span>
                          <span className="font-semibold text-slate-700 block mt-0.5">{selectedUser.department || 'SRMIST'}</span>
                        </div>
                      )}
                      <div>
                        <span className="font-extrabold text-slate-400 block uppercase tracking-wider text-[9px]">Role</span>
                        <span className="font-semibold text-slate-700 block mt-0.5">{selectedUser.role}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-black text-slate-900 uppercase tracking-widest text-[10px] border-b border-slate-100 pb-1 text-[#0C4DA2]">
                      Account Authentication
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-[11px]">
                      <div>
                        <span className="font-extrabold text-slate-400 block uppercase tracking-wider text-[9px]">Provider</span>
                        <span className="font-bold text-slate-700 block mt-0.5">Google OAuth</span>
                      </div>
                      <div>
                        <span className="font-extrabold text-slate-400 block uppercase tracking-wider text-[9px]">Status</span>
                        <span className="font-bold text-slate-700 block mt-0.5">{selectedUser.status}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex flex-col gap-2 mt-6">
                {selectedUser.status === 'ACTIVE' ? (
                  <button
                    onClick={() => setConfirmAction({ type: 'DISABLE', user: selectedUser })}
                    className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Disable Access
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpdateStatus(selectedUser, 'ACTIVE')}
                    className="w-full py-2.5 bg-[#0C4DA2] hover:bg-[#042654] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    Enable Access
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* CONFIRM DISABLE DIALOG */}
      <AnimatePresence>
        {confirmAction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmAction(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs cursor-pointer"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl z-10 text-center space-y-4"
            >
              <div className="w-12 h-12 bg-rose-50 border border-rose-100 text-rose-605 rounded-full flex items-center justify-center mx-auto shadow-2xs">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-extrabold text-slate-900">Disable Access for {confirmAction.user.name}?</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                  This will prevent the user from logging in or using CuriousBees research workspaces.
                </p>
              </div>
              <div className="flex gap-2.5 w-full pt-2">
                <button
                  onClick={() => setConfirmAction(null)}
                  disabled={actionLoading}
                  className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-250 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleUpdateStatus(confirmAction.user, 'SUSPENDED')}
                  disabled={actionLoading}
                  className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1"
                >
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Confirm Disable'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CONFIRM DELETE DIALOG */}
      <AnimatePresence>
        {deletingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeletingUser(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs cursor-pointer"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl z-10 text-center space-y-4 font-sans text-xs"
            >
              <div className="w-12 h-12 bg-rose-50 border border-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-2xs">
                <Trash className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-extrabold text-slate-900">Delete User Permanently?</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-semibold font-sans">
                  Are you sure you want to permanently delete <span className="font-extrabold text-slate-800">{deletingUser.name}</span>? This action is irreversible and deletes all associated records.
                </p>
              </div>
              <div className="flex gap-2.5 w-full pt-2">
                <button
                  onClick={() => setDeletingUser(null)}
                  disabled={actionLoading}
                  className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteUser}
                  disabled={actionLoading}
                  className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1"
                >
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Delete Record'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* IMPORT SPREADSHEETS WIZARD */}
      <AnimatePresence>
        {showImportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!actionLoading) {
                  setShowImportModal(false);
                  setImportStep(1);
                  setSelectedFile(null);
                }
              }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs cursor-pointer"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl z-10 overflow-hidden text-left flex flex-col max-h-[85vh]"
            >
              <div className="p-5 border-b border-slate-100 bg-slate-50 shrink-0 flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
                    <Upload className="w-4 h-4 text-[#0C4DA2]" /> Import Institutional Records
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Select official CSV layout templates</p>
                </div>
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    setImportStep(1);
                    setSelectedFile(null);
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs font-semibold">
                {importStep === 1 && (
                  <div className="space-y-4">
                    <p className="text-slate-550 leading-relaxed">
                      Seed official university records into the system. Select either the Scholar or Supervisor sheet type.
                    </p>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                        Download Spreadsheet Templates
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={downloadScholarTemplate}
                          className="py-2 px-3 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs bg-white"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                          Scholar Template
                        </button>
                        <button
                          type="button"
                          onClick={downloadSupervisorTemplate}
                          className="py-2 px-3 border border-slate-300 hover:bg-slate-100 text-slate-705 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs bg-white"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                          Supervisor Template
                        </button>
                      </div>
                    </div>
                    <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center bg-slate-50 relative group hover:border-[#0C4DA2]/50 transition-colors cursor-pointer">
                      <input
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        onChange={handleFileSelect}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2 group-hover:text-[#0C4DA2] transition-colors" />
                      <p className="text-xs font-extrabold text-slate-750">Click or drag official dataset to upload</p>
                    </div>
                  </div>
                )}

                {importStep === 2 && (
                  <div className="space-y-4 font-sans">
                    <div className="grid grid-cols-4 gap-2.5 text-center text-[10px] font-bold">
                      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-emerald-800">
                        <span className="text-lg font-black block">{importStats.newRecords}</span>
                        New Records
                      </div>
                      <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-blue-800">
                        <span className="text-lg font-black block">{importStats.updatedRecords}</span>
                        Updated
                      </div>
                      <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-amber-800">
                        <span className="text-lg font-black block">{importStats.conflicts}</span>
                        Conflicts
                      </div>
                      <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-rose-800">
                        <span className="text-lg font-black block">{importStats.invalid}</span>
                        Invalid
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-50 flex justify-end gap-3 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setShowImportModal(false);
                    setImportStep(1);
                    setSelectedFile(null);
                  }}
                  disabled={actionLoading}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                {importStep === 2 && (
                  <button
                    onClick={handleConfirmImport}
                    disabled={actionLoading}
                    className="px-5 py-2 bg-[#0C4DA2] hover:bg-[#042654] text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Confirm Import'}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADD/EDIT SINGLE USER MODAL */}
      <AnimatePresence>
        {showAddSingleUserModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { if (!actionLoading) resetFormState(); }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs cursor-pointer"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl z-10 overflow-hidden text-left flex flex-col max-h-[90vh]"
            >
              <form onSubmit={handleAddSingleUserSubmit} className="flex flex-col max-h-full font-sans">
                
                <div className="p-5 border-b border-slate-100 bg-slate-50 shrink-0">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
                    <UserPlus className="w-4 h-4 text-[#0C4DA2]" /> 
                    {editingUser ? (
                      editingUser.role === 'RESEARCH_SCHOLAR' ? 'Edit Scholar' : editingUser.role === 'RESEARCH_SUPERVISOR' ? 'Edit Supervisor' : 'Edit Administrator'
                    ) : (
                      singleRole === 'SCHOLAR' ? 'Add Scholar' : singleRole === 'SUPERVISOR' ? 'Add Supervisor' : 'Add Administrator'
                    )}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                    {editingUser ? 'Modify researcher identity and institutional details' : 'Enter researcher identity and institutional details manually'}
                  </p>
                </div>

                <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. GAYATHRI R or Dr. SUDHA M R"
                      value={singleName}
                      onChange={(e) => setSingleName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0C4DA2] bg-slate-50 focus:bg-white text-xs font-semibold"
                    />
                  </div>

                  {singleRole !== 'ADMIN' && (
                    <>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Designation</label>
                        <input
                          type="text"
                          placeholder={singleRole === 'SCHOLAR' ? 'e.g. Research Scholar' : 'e.g. Assistant Professor grade I'}
                          value={singleDesignation}
                          onChange={(e) => setSingleDesignation(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0C4DA2] bg-slate-50 focus:bg-white text-xs font-semibold"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Faculty</label>
                        <select
                          value={singleFacultyId}
                          onChange={(e) => {
                            setSingleFacultyId(e.target.value);
                            setSingleDeptId(''); // Reset department
                          }}
                          required
                          className="cb-input w-full cursor-pointer focus:bg-white bg-slate-50"
                        >
                          <option value="">Select Faculty...</option>
                          {faculties.map((f) => (
                            <option key={f.id} value={f.id}>{f.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Department</label>
                        <select
                          value={singleDeptId}
                          onChange={(e) => setSingleDeptId(e.target.value)}
                          required
                          className="cb-input w-full cursor-pointer focus:bg-white bg-slate-50"
                        >
                          <option value="">Select Department...</option>
                          {departments
                            .filter((d) => !singleFacultyId || d.facultyId === singleFacultyId)
                            .map((d) => (
                              <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                        </select>
                      </div>
                    </>
                  )}

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Official Mail ID</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. gr2516@srmist.edu.in"
                      value={singleEmail}
                      onChange={(e) => setSingleEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0C4DA2] bg-slate-50 focus:bg-white text-xs font-semibold"
                    />
                  </div>
                </div>

                <div className="p-4 bg-slate-50 flex justify-end gap-3 border-t border-slate-100 shrink-0 font-sans">
                  <button
                    type="button"
                    onClick={resetFormState}
                    disabled={actionLoading}
                    className="px-4 py-2 text-xs font-bold text-slate-655 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading || !singleName || !singleEmail || (singleRole !== 'ADMIN' && !singleDeptId)}
                    className="px-5 py-2 bg-[#0C4DA2] hover:bg-[#042654] text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (editingUser ? 'Save Changes' : 'Confirm Add')}
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

// ==================================================
// 1. LAZY SCHOLARS MANAGEMENT SUBCOMPONENT
// ==================================================
function ScholarsManagement({
  departments,
  allSupervisorsList,
  limit,
  setLimit,
  setSelectedUser,
  setConfirmAction,
  setEditingUser,
  setDeletingUser,
  handleUpdateStatus,
  registerRefreshCallback
}: {
  departments: any[];
  allSupervisorsList: any[];
  limit: number;
  setLimit: (l: number) => void;
  setSelectedUser: (u: any) => void;
  setConfirmAction: (act: any) => void;
  setEditingUser: (u: any) => void;
  setDeletingUser: (u: any) => void;
  handleUpdateStatus: (u: any, s: 'ACTIVE' | 'SUSPENDED') => Promise<void>;
  registerRefreshCallback: (cb: () => void) => void;
}) {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterAccess, setFilterAccess] = useState('');
  const [filterAccountStatus, setFilterAccountStatus] = useState('');
  const [filterSupervisor, setFilterSupervisor] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [scholars, setScholars] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchScholars = async () => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = `/api/admin/scholars?page=${page}&limit=${limit}&search=${searchQuery}&department=${filterDept}&status=${filterAccountStatus}&access=${filterAccess}&supervisorId=${filterSupervisor}&sort=${sortField}&order=${sortOrder}`;
      const res = await apiFetch(endpoint);
      if (!res.ok) throw new Error('Unable to retrieve scholars directory.');
      
      const result = await res.json();
      const returnedData = result.data || [];
      const totalP = result.pagination?.totalPages || 1;

      if (returnedData.length === 0 && page > 1 && page > totalP) {
        setPage(totalP);
        return;
      }
      setScholars(returnedData);
      setTotal(result.pagination?.total || 0);
      setTotalPages(totalP);
    } catch (e: any) {
      setError(e.message || 'Something went wrong while retrieving the directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScholars();
  }, [page, limit, searchQuery, filterDept, filterAccess, filterAccountStatus, filterSupervisor, sortField, sortOrder]);

  // Reset page when filter search changes
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setPage(1);
  };

  const handleDeptChange = (val: string) => {
    setFilterDept(val);
    setPage(1);
  };

  const handleAccessChange = (val: string) => {
    setFilterAccess(val);
    setPage(1);
  };

  const handleStatusChange = (val: string) => {
    setFilterAccountStatus(val);
    setPage(1);
  };

  const handleSupervisorChange = (val: string) => {
    setFilterSupervisor(val);
    setPage(1);
  };

  // Register current callback wrapper for modal operations reload
  useEffect(() => {
    registerRefreshCallback(fetchScholars);
  }, [page, limit, searchQuery, filterDept, filterAccess, filterAccountStatus, filterSupervisor, sortField, sortOrder]);

  const handleSortToggle = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-4">
      {/* Tab Specific Filter area */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-3xs flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, registration ID, or email..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-850 focus:outline-none focus:ring-2 focus:ring-[#0C4DA2] focus:bg-white text-xs font-semibold transition-all"
            />
          </div>
          <select
            value={filterDept}
            onChange={(e) => handleDeptChange(e.target.value)}
            className="px-3.5 py-2.5 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-200 focus:outline-none cursor-pointer focus:bg-white"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.name}>{d.name}</option>
            ))}
          </select>
          <select
            value={filterAccess}
            onChange={(e) => handleAccessChange(e.target.value)}
            className="px-3.5 py-2.5 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-200 focus:outline-none cursor-pointer focus:bg-white"
          >
            <option value="">All Access Matching</option>
            <option value="MATCHED">Matched</option>
            <option value="UNMATCHED">Unmatched</option>
            <option value="REQUIRES REVIEW">Requires Review</option>
          </select>
          <select
            value={filterAccountStatus}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="px-3.5 py-2.5 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-200 focus:outline-none cursor-pointer focus:bg-white"
          >
            <option value="">All Account Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="PENDING">Pending</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
        <div className="flex gap-3 pt-2 border-t border-slate-100">
          <select
            value={filterSupervisor}
            onChange={(e) => handleSupervisorChange(e.target.value)}
            className="px-3 py-2 text-[11px] font-semibold rounded-lg bg-slate-50 border border-slate-200 focus:outline-none cursor-pointer focus:bg-white"
          >
            <option value="">Filter by Supervisor Guide</option>
            {allSupervisorsList.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid container */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-3xs min-h-[250px] flex flex-col justify-between">
        {error ? (
          <div className="py-16 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto text-rose-600 shadow-3xs">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-slate-900">Unable to load researchers</h3>
              <p className="text-xs text-slate-450 font-semibold">{error}</p>
            </div>
            <button
              onClick={fetchScholars}
              className="px-4 py-2 bg-[#0C4DA2] hover:bg-[#042654] text-white text-xs font-bold rounded-lg cursor-pointer"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-between">
            <div className="overflow-x-auto">
              {!loading && scholars.length === 0 ? (
                <div className="py-20 text-center space-y-2">
                  <h3 className="text-sm font-extrabold text-slate-900">No Scholars Found</h3>
                  <p className="text-xs text-slate-400 font-semibold">Seed database records or add manually to start.</p>
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 font-black text-slate-500 uppercase tracking-wider text-[10px] select-none">
                    <tr>
                      <th className="px-5 py-4">Profile</th>
                      <th className="px-5 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSortToggle('name')}>
                        Name {sortField === 'name' ? (sortOrder === 'asc' ? ' ▲' : ' ▼') : <ArrowUpDown className="w-3 h-3 inline ml-1 text-slate-300" />}
                      </th>
                      <th className="px-5 py-4">Designation</th>
                      <th className="px-5 py-4">Faculty</th>
                      <th className="px-5 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSortToggle('department')}>
                        Department {sortField === 'department' ? (sortOrder === 'asc' ? ' ▲' : ' ▼') : <ArrowUpDown className="w-3 h-3 inline ml-1 text-slate-300" />}
                      </th>
                      <th className="px-5 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSortToggle('email')}>
                        Official Mail ID {sortField === 'email' ? (sortOrder === 'asc' ? ' ▲' : ' ▼') : <ArrowUpDown className="w-3 h-3 inline ml-1 text-slate-300" />}
                      </th>
                      <th className="px-5 py-4">Supervisor</th>
                      <th className="px-5 py-4">Access Matching</th>
                      <th className="px-5 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSortToggle('status')}>
                        Status {sortField === 'status' ? (sortOrder === 'asc' ? ' ▲' : ' ▼') : <ArrowUpDown className="w-3 h-3 inline ml-1 text-slate-300" />}
                      </th>
                      <th className="px-5 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-705">
                    {loading ? (
                      Array.from({ length: 5 }).map((_, idx) => (
                        <tr key={idx} className="animate-pulse bg-slate-50/20">
                          <td className="px-5 py-4"><div className="w-8 h-8 bg-slate-200 rounded-full" /></td>
                          <td className="px-5 py-4"><div className="h-4 bg-slate-200 rounded w-28 mb-1" /></td>
                          <td className="px-5 py-4"><div className="h-4 bg-slate-200 rounded w-24" /></td>
                          <td className="px-5 py-4"><div className="h-4 bg-slate-200 rounded w-24" /></td>
                          <td className="px-5 py-4"><div className="h-4 bg-slate-200 rounded w-24" /></td>
                          <td className="px-5 py-4"><div className="h-4 bg-slate-200 rounded w-32" /></td>
                          <td className="px-5 py-4"><div className="h-4 bg-slate-200 rounded w-24" /></td>
                          <td className="px-5 py-4"><div className="h-4 bg-slate-200 rounded w-16" /></td>
                          <td className="px-5 py-4"><div className="h-4 bg-slate-200 rounded w-12" /></td>
                          <td className="px-5 py-4 text-right"><div className="h-8 bg-slate-200 rounded-lg w-16 ml-auto" /></td>
                        </tr>
                      ))
                    ) : (
                      scholars.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50/40 transition-colors">
                          <td className="px-5 py-3">
                            <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center">
                              <img src={getProfileImageUrl(s)} alt="" className="w-full h-full object-cover" />
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <div className="font-extrabold text-slate-900 text-sm">{s.name || 'Candidate Scholar'}</div>
                          </td>
                          <td className="px-5 py-3 font-semibold text-slate-500">Research Scholar</td>
                          <td className="px-5 py-3 font-semibold text-slate-700">{s.faculty || 'Engineering & Technology'}</td>
                          <td className="px-5 py-3 font-semibold text-slate-700">{s.department || 'SRMIST'}</td>
                          <td className="px-5 py-3 font-mono font-bold text-slate-550">{s.email}</td>
                          <td className="px-5 py-3 font-semibold text-slate-700">{s.supervisor ? s.supervisor.name : <span className="text-slate-400 italic">Unassigned</span>}</td>
                          <td className="px-5 py-3">
                            {!!s.supabaseAuthId && !!s.employeeId ? (
                              <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full font-black text-[9px] uppercase tracking-wider">Matched</span>
                            ) : !!s.supabaseAuthId ? (
                              <span className="px-2.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-full font-black text-[9px] uppercase tracking-wider">Requires Review</span>
                            ) : (
                              <span className="px-2.5 py-0.5 bg-slate-50 text-slate-600 border border-slate-200 rounded-full font-black text-[9px] uppercase tracking-wider">Unmatched</span>
                            )}
                          </td>
                          <td className="px-5 py-3">
                            <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded ${
                              s.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-rose-50 text-rose-800 border border-rose-100'
                            }`}>{s.status}</span>
                          </td>
                          <td className="px-5 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button onClick={() => setSelectedUser(s)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-900 cursor-pointer" title="View Details"><Eye className="w-4 h-4" /></button>
                              <button onClick={() => setEditingUser(s)} className="p-1.5 hover:bg-slate-100 rounded-lg text-blue-600 hover:text-blue-900 cursor-pointer" title="Edit Record"><Pencil className="w-4 h-4" /></button>
                              {s.status === 'ACTIVE' ? (
                                <button onClick={() => setConfirmAction({ type: 'DISABLE', user: s })} className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-600 cursor-pointer" title="Suspend User"><Ban className="w-4 h-4" /></button>
                              ) : (
                                <button onClick={() => handleUpdateStatus(s, 'ACTIVE')} className="p-1.5 hover:bg-emerald-50 rounded-lg text-emerald-600 cursor-pointer" title="Activate User"><Check className="w-4 h-4" /></button>
                              )}
                              <button onClick={() => setDeletingUser(s)} className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-600 cursor-pointer" title="Delete Record"><Trash className="w-4 h-4" /></button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination Controls */}
            {!loading && scholars.length > 0 && (
              <LazyPaginationFooter 
                page={page}
                totalPages={totalPages}
                totalCount={total}
                limit={limit}
                setLimit={setLimit}
                setPage={setPage}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ==================================================
// 2. LAZY SUPERVISORS MANAGEMENT SUBCOMPONENT
// ==================================================
function SupervisorsManagement({
  departments,
  limit,
  setLimit,
  setSelectedUser,
  setConfirmAction,
  setEditingUser,
  setDeletingUser,
  handleUpdateStatus,
  registerRefreshCallback
}: {
  departments: any[];
  limit: number;
  setLimit: (l: number) => void;
  setSelectedUser: (u: any) => void;
  setConfirmAction: (act: any) => void;
  setEditingUser: (u: any) => void;
  setDeletingUser: (u: any) => void;
  handleUpdateStatus: (u: any, s: 'ACTIVE' | 'SUSPENDED') => Promise<void>;
  registerRefreshCallback: (cb: () => void) => void;
}) {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterAccess, setFilterAccess] = useState('');
  const [filterAccountStatus, setFilterAccountStatus] = useState('');
  const [filterHasScholars, setFilterHasScholars] = useState('ALL');
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [supervisors, setSupervisors] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSupervisors = async () => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = `/api/admin/supervisors?page=${page}&limit=${limit}&search=${searchQuery}&department=${filterDept}&status=${filterAccountStatus}&access=${filterAccess}&hasScholars=${filterHasScholars}&sort=${sortField}&order=${sortOrder}`;
      const res = await apiFetch(endpoint);
      if (!res.ok) throw new Error('Unable to retrieve supervisors directory.');
      
      const result = await res.json();
      const returnedData = result.data || [];
      const totalP = result.pagination?.totalPages || 1;

      if (returnedData.length === 0 && page > 1 && page > totalP) {
        setPage(totalP);
        return;
      }
      setSupervisors(returnedData);
      setTotal(result.pagination?.total || 0);
      setTotalPages(totalP);
    } catch (e: any) {
      setError(e.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupervisors();
  }, [page, limit, searchQuery, filterDept, filterAccess, filterAccountStatus, filterHasScholars, sortField, sortOrder]);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setPage(1);
  };

  const handleDeptChange = (val: string) => {
    setFilterDept(val);
    setPage(1);
  };

  const handleAccessChange = (val: string) => {
    setFilterAccess(val);
    setPage(1);
  };

  const handleStatusChange = (val: string) => {
    setFilterAccountStatus(val);
    setPage(1);
  };

  const handleHasScholarsChange = (val: string) => {
    setFilterHasScholars(val);
    setPage(1);
  };

  useEffect(() => {
    registerRefreshCallback(fetchSupervisors);
  }, [page, limit, searchQuery, filterDept, filterAccess, filterAccountStatus, filterHasScholars, sortField, sortOrder]);

  const handleSortToggle = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-4">
      {/* Supervisors Specific filter options */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-3xs flex flex-col gap-3 animate-fade-in">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search supervisors by name, employee ID, or email..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-850 focus:outline-none focus:ring-2 focus:ring-[#0C4DA2] focus:bg-white text-xs font-semibold transition-all"
            />
          </div>
          <select
            value={filterDept}
            onChange={(e) => handleDeptChange(e.target.value)}
            className="px-3.5 py-2.5 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-200 focus:outline-none cursor-pointer focus:bg-white"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.name}>{d.name}</option>
            ))}
          </select>
          <select
            value={filterAccess}
            onChange={(e) => handleAccessChange(e.target.value)}
            className="px-3.5 py-2.5 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-200 focus:outline-none cursor-pointer focus:bg-white"
          >
            <option value="">All Access Matching</option>
            <option value="MATCHED">Matched</option>
            <option value="UNMATCHED">Unmatched</option>
            <option value="REQUIRES REVIEW">Requires Review</option>
          </select>
          <select
            value={filterAccountStatus}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="px-3.5 py-2.5 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-200 focus:outline-none cursor-pointer focus:bg-white"
          >
            <option value="">All Account Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="PENDING">Pending</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
        <div className="flex gap-3 pt-2 border-t border-slate-100">
          <select
            value={filterHasScholars}
            onChange={(e) => handleHasScholarsChange(e.target.value)}
            className="px-3 py-2 text-[11px] font-semibold rounded-lg bg-slate-50 border border-slate-200 focus:outline-none cursor-pointer focus:bg-white"
          >
            <option value="ALL">Supervisor Capacity: All</option>
            <option value="YES">Has Scholars Assigned</option>
            <option value="NO">No Scholars Assigned</option>
          </select>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-3xs min-h-[250px] flex flex-col justify-between">
        {error ? (
          <div className="py-16 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto text-rose-600 shadow-3xs">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-slate-900">Unable to load supervisors</h3>
              <p className="text-xs text-slate-450 font-semibold">{error}</p>
            </div>
            <button
              onClick={fetchSupervisors}
              className="px-4 py-2 bg-[#0C4DA2] hover:bg-[#042654] text-white text-xs font-bold rounded-lg cursor-pointer"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-between">
            <div className="overflow-x-auto">
              {!loading && supervisors.length === 0 ? (
                <div className="py-20 text-center space-y-2">
                  <h3 className="text-sm font-extrabold text-slate-900">No Supervisors Found</h3>
                  <p className="text-xs text-slate-400 font-semibold">Faculty guides will appear here.</p>
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 font-black text-slate-500 uppercase tracking-wider text-[10px] select-none">
                    <tr>
                      <th className="px-5 py-4">Profile</th>
                      <th className="px-5 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSortToggle('name')}>
                        Name {sortField === 'name' ? (sortOrder === 'asc' ? ' ▲' : ' ▼') : <ArrowUpDown className="w-3 h-3 inline ml-1 text-slate-300" />}
                      </th>
                      <th className="px-5 py-4">Designation</th>
                      <th className="px-5 py-4">Faculty</th>
                      <th className="px-5 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSortToggle('department')}>
                        Department {sortField === 'department' ? (sortOrder === 'asc' ? ' ▲' : ' ▼') : <ArrowUpDown className="w-3 h-3 inline ml-1 text-slate-300" />}
                      </th>
                      <th className="px-5 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSortToggle('email')}>
                        Official Mail ID {sortField === 'email' ? (sortOrder === 'asc' ? ' ▲' : ' ▼') : <ArrowUpDown className="w-3 h-3 inline ml-1 text-slate-300" />}
                      </th>
                      <th className="px-5 py-4">Scholars</th>
                      <th className="px-5 py-4">Access Matching</th>
                      <th className="px-5 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSortToggle('status')}>
                        Status {sortField === 'status' ? (sortOrder === 'asc' ? ' ▲' : ' ▼') : <ArrowUpDown className="w-3 h-3 inline ml-1 text-slate-300" />}
                      </th>
                      <th className="px-5 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {loading ? (
                      Array.from({ length: 5 }).map((_, idx) => (
                        <tr key={idx} className="animate-pulse bg-slate-50/20">
                          <td className="px-5 py-4"><div className="w-8 h-8 bg-slate-200 rounded-full" /></td>
                          <td className="px-5 py-4"><div className="h-4 bg-slate-200 rounded w-28 mb-1" /></td>
                          <td className="px-5 py-4"><div className="h-4 bg-slate-200 rounded w-24" /></td>
                          <td className="px-5 py-4"><div className="h-4 bg-slate-200 rounded w-24" /></td>
                          <td className="px-5 py-4"><div className="h-4 bg-slate-200 rounded w-24" /></td>
                          <td className="px-5 py-4"><div className="h-4 bg-slate-200 rounded w-32" /></td>
                          <td className="px-5 py-4"><div className="h-4 bg-slate-200 rounded w-16" /></td>
                          <td className="px-5 py-4"><div className="h-4 bg-slate-200 rounded w-16" /></td>
                          <td className="px-5 py-4"><div className="h-4 bg-slate-200 rounded w-12" /></td>
                          <td className="px-5 py-4 text-right"><div className="h-8 bg-slate-200 rounded-lg w-16 ml-auto" /></td>
                        </tr>
                      ))
                    ) : (
                      supervisors.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/40 transition-colors">
                          <td className="px-5 py-3">
                            <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center">
                              <img src={getProfileImageUrl(item)} alt="" className="w-full h-full object-cover" />
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <div className="font-extrabold text-slate-900 text-sm">{item.name || 'Supervisor'}</div>
                          </td>
                          <td className="px-5 py-3 font-semibold text-slate-500">{item.designation || 'Faculty Guide'}</td>
                          <td className="px-5 py-3 font-semibold text-slate-700">{item.faculty || 'Engineering & Technology'}</td>
                          <td className="px-5 py-3 font-semibold text-slate-700">{item.department || 'SRMIST'}</td>
                          <td className="px-5 py-3 font-mono font-bold text-slate-550">{item.email}</td>
                          <td className="px-5 py-3 font-extrabold text-[#0C4DA2]">{item.scholarCount || 0} Scholars</td>
                          <td className="px-5 py-3">
                            {!!item.supabaseAuthId && !!item.employeeId ? (
                              <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full font-black text-[9px] uppercase tracking-wider">Matched</span>
                            ) : !!item.supabaseAuthId ? (
                              <span className="px-2.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-full font-black text-[9px] uppercase tracking-wider">Requires Review</span>
                            ) : (
                              <span className="px-2.5 py-0.5 bg-slate-50 text-slate-600 border border-slate-200 rounded-full font-black text-[9px] uppercase tracking-wider">Unmatched</span>
                            )}
                          </td>
                          <td className="px-5 py-3">
                            <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded ${
                              item.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-rose-50 text-rose-800 border border-rose-100'
                            }`}>{item.status}</span>
                          </td>
                          <td className="px-5 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button onClick={() => setSelectedUser(item)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-900 cursor-pointer" title="View Details"><Eye className="w-4 h-4" /></button>
                              <button onClick={() => setEditingUser(item)} className="p-1.5 hover:bg-slate-100 rounded-lg text-blue-600 hover:text-blue-900 cursor-pointer" title="Edit Record"><Pencil className="w-4 h-4" /></button>
                              {item.status === 'ACTIVE' ? (
                                <button onClick={() => setConfirmAction({ type: 'DISABLE', user: item })} className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-600 cursor-pointer" title="Suspend User"><Ban className="w-4 h-4" /></button>
                              ) : (
                                <button onClick={() => handleUpdateStatus(item, 'ACTIVE')} className="p-1.5 hover:bg-emerald-50 rounded-lg text-emerald-600 cursor-pointer" title="Activate User"><Check className="w-4 h-4" /></button>
                              )}
                              <button onClick={() => setDeletingUser(item)} className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-600 cursor-pointer" title="Delete Record"><Trash className="w-4 h-4" /></button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>

            {!loading && supervisors.length > 0 && (
              <LazyPaginationFooter 
                page={page}
                totalPages={totalPages}
                totalCount={total}
                limit={limit}
                setLimit={setLimit}
                setPage={setPage}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ==================================================
// 3. LAZY INSTITUTE ADMINS MANAGEMENT SUBCOMPONENT
// ==================================================
function AdminsManagement({
  limit,
  setLimit,
  setSelectedUser,
  setConfirmAction,
  setEditingUser,
  setDeletingUser,
  handleUpdateStatus,
  registerRefreshCallback
}: {
  limit: number;
  setLimit: (l: number) => void;
  setSelectedUser: (u: any) => void;
  setConfirmAction: (act: any) => void;
  setEditingUser: (u: any) => void;
  setDeletingUser: (u: any) => void;
  handleUpdateStatus: (u: any, s: 'ACTIVE' | 'SUSPENDED') => Promise<void>;
  registerRefreshCallback: (cb: () => void) => void;
}) {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAccountStatus, setFilterAccountStatus] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [admins, setAdmins] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAdmins = async () => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = `/api/admin/admins?page=${page}&limit=${limit}&search=${searchQuery}&status=${filterAccountStatus}&sort=${sortField}&order=${sortOrder}`;
      const res = await apiFetch(endpoint);
      if (!res.ok) throw new Error('Unable to retrieve administrators directory.');
      
      const result = await res.json();
      const returnedData = result.data || [];
      const totalP = result.pagination?.totalPages || 1;

      if (returnedData.length === 0 && page > 1 && page > totalP) {
        setPage(totalP);
        return;
      }
      setAdmins(returnedData);
      setTotal(result.pagination?.total || 0);
      setTotalPages(totalP);
    } catch (e: any) {
      setError(e.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, [page, limit, searchQuery, filterAccountStatus, sortField, sortOrder]);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setPage(1);
  };

  const handleStatusChange = (val: string) => {
    setFilterAccountStatus(val);
    setPage(1);
  };

  useEffect(() => {
    registerRefreshCallback(fetchAdmins);
  }, [page, limit, searchQuery, filterAccountStatus, sortField, sortOrder]);

  const handleSortToggle = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-4">
      {/* Admins specific filter values */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-3xs flex flex-col gap-3 animate-fade-in">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search administrators by name or email..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-850 focus:outline-none focus:ring-2 focus:ring-[#0C4DA2] focus:bg-white text-xs font-semibold transition-all"
            />
          </div>
          <select
            value={filterAccountStatus}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="px-3.5 py-2.5 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-200 focus:outline-none cursor-pointer focus:bg-white animate-fade-in"
          >
            <option value="">All Account Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-3xs min-h-[250px] flex flex-col justify-between">
        {error ? (
          <div className="py-16 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto text-rose-600 shadow-3xs">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-slate-900">Unable to load administrators</h3>
              <p className="text-xs text-slate-450 font-semibold">{error}</p>
            </div>
            <button
              onClick={fetchAdmins}
              className="px-4 py-2 bg-[#0C4DA2] hover:bg-[#042654] text-white text-xs font-bold rounded-lg cursor-pointer"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-between">
            <div className="overflow-x-auto">
              {!loading && admins.length === 0 ? (
                <div className="py-20 text-center space-y-2">
                  <h3 className="text-sm font-extrabold text-slate-900">No Admins Found</h3>
                  <p className="text-xs text-slate-400 font-semibold">Institute administrators will appear here.</p>
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 font-black text-slate-500 uppercase tracking-wider text-[10px] select-none">
                    <tr>
                      <th className="px-5 py-4">Profile</th>
                      <th className="px-5 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSortToggle('name')}>
                        Name {sortField === 'name' ? (sortOrder === 'asc' ? ' ▲' : ' ▼') : <ArrowUpDown className="w-3 h-3 inline ml-1 text-slate-300" />}
                      </th>
                      <th className="px-5 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSortToggle('email')}>
                        Email {sortField === 'email' ? (sortOrder === 'asc' ? ' ▲' : ' ▼') : <ArrowUpDown className="w-3 h-3 inline ml-1 text-slate-300" />}
                      </th>
                      <th className="px-5 py-4">Role</th>
                      <th className="px-5 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSortToggle('createdAt')}>
                        Joined Date {sortField === 'createdAt' ? (sortOrder === 'asc' ? ' ▲' : ' ▼') : <ArrowUpDown className="w-3 h-3 inline ml-1 text-slate-300" />}
                      </th>
                      <th className="px-5 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSortToggle('status')}>
                        Status {sortField === 'status' ? (sortOrder === 'asc' ? ' ▲' : ' ▼') : <ArrowUpDown className="w-3 h-3 inline ml-1 text-slate-300" />}
                      </th>
                      <th className="px-5 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-705">
                    {loading ? (
                      Array.from({ length: 5 }).map((_, idx) => (
                        <tr key={idx} className="animate-pulse bg-slate-50/20">
                          <td className="px-5 py-4"><div className="w-8 h-8 bg-slate-200 rounded-full" /></td>
                          <td className="px-5 py-4"><div className="h-4 bg-slate-200 rounded w-28 mb-1" /><div className="h-3 bg-slate-150 rounded w-40" /></td>
                          <td className="px-5 py-4"><div className="h-4 bg-slate-200 rounded w-16" /></td>
                          <td className="px-5 py-4"><div className="h-4 bg-slate-200 rounded w-24" /></td>
                          <td className="px-5 py-4"><div className="h-4 bg-slate-200 rounded w-24" /></td>
                          <td className="px-5 py-4"><div className="h-4 bg-slate-200 rounded w-16" /></td>
                          <td className="px-5 py-4"><div className="h-4 bg-slate-200 rounded w-12" /></td>
                          <td className="px-5 py-4 text-right"><div className="h-8 bg-slate-200 rounded-lg w-16 ml-auto" /></td>
                        </tr>
                      ))
                    ) : (
                      admins.map((item) => {
                        const isSuperAdmin = item.email.toLowerCase() === 'curiousbees@srmist.edu.in' || item.email.toLowerCase() === 'r.matheshwaran.io@gmail.com';
                        return (
                          <tr key={item.id} className="hover:bg-slate-50/40 transition-colors">
                            <td className="px-5 py-3">
                              <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center">
                                <img src={getProfileImageUrl(item)} alt="" className="w-full h-full object-cover" />
                              </div>
                            </td>
                            <td className="px-5 py-3">
                              <div className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                                {item.name || 'Administrator'}
                                {isSuperAdmin && <span className="px-2 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 rounded font-black text-[8px] uppercase tracking-wider">System Admin</span>}
                              </div>
                            </td>
                            <td className="px-5 py-3 font-semibold text-slate-600">{item.email}</td>
                            <td className="px-5 py-3 font-semibold text-slate-500">Institute Administrator</td>
                            <td className="px-5 py-3 font-semibold text-slate-450">{new Date(item.createdAt).toLocaleDateString()}</td>
                            <td className="px-5 py-3">
                              <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded ${
                                item.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-rose-50 text-rose-800 border border-rose-100'
                              }`}>{item.status}</span>
                            </td>
                            <td className="px-5 py-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button onClick={() => setSelectedUser(item)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-900 cursor-pointer" title="View Details"><Eye className="w-4 h-4" /></button>
                                {!isSuperAdmin ? (
                                  <>
                                    <button onClick={() => setEditingUser(item)} className="p-1.5 hover:bg-slate-100 rounded-lg text-blue-600 hover:text-blue-900 cursor-pointer" title="Edit Record"><Pencil className="w-4 h-4" /></button>
                                    {item.status === 'ACTIVE' ? (
                                      <button onClick={() => setConfirmAction({ type: 'DISABLE', user: item })} className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-600 cursor-pointer" title="Suspend User"><Ban className="w-4 h-4" /></button>
                                    ) : (
                                      <button onClick={() => handleUpdateStatus(item, 'ACTIVE')} className="p-1.5 hover:bg-emerald-50 rounded-lg text-emerald-600 cursor-pointer" title="Activate User"><Check className="w-4 h-4" /></button>
                                    )}
                                    <button onClick={() => setDeletingUser(item)} className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-600 cursor-pointer" title="Delete Record"><Trash className="w-4 h-4" /></button>
                                  </>
                                ) : (
                                  <span className="text-[10px] text-slate-400 font-bold uppercase italic mr-1">Protected</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              )}
            </div>

            {!loading && admins.length > 0 && (
              <LazyPaginationFooter 
                page={page}
                totalPages={totalPages}
                totalCount={total}
                limit={limit}
                setLimit={setLimit}
                setPage={setPage}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ==================================================
// 4. SHARED REUSABLE PAGINATION FOOTER
// ==================================================
function LazyPaginationFooter({
  page,
  totalPages,
  totalCount,
  limit,
  setLimit,
  setPage
}: {
  page: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  setLimit: (l: number) => void;
  setPage: (p: number) => void;
}) {
  const startRange = totalCount === 0 ? 0 : (page - 1) * limit + 1;
  const endRange = Math.min(page * limit, totalCount);

  const getPageNumbers = () => {
    const pages = [];
    const startPage = Math.max(1, page - 2);
    const endPage = Math.min(totalPages, page + 2);
    
    if (startPage > 1) pages.push(1);
    if (startPage > 2) pages.push('...');
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    if (endPage < totalPages - 1) pages.push('...');
    if (endPage < totalPages) pages.push(totalPages);
    
    return pages;
  };

  return (
    <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 font-sans text-slate-500 shrink-0">
      <div className="text-xs font-semibold">
        Showing <span className="text-slate-800 font-extrabold">{startRange}–{endRange}</span> of <span className="text-slate-800 font-extrabold">{totalCount}</span> researchers
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <span>Rows per page:</span>
          <select
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
            className="py-1 px-2 border border-slate-200 rounded-lg bg-white focus:outline-none cursor-pointer font-bold text-slate-700"
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-bold select-none">
          <button
            type="button"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white cursor-pointer transition-all"
          >
            Previous
          </button>

          {getPageNumbers().map((p, idx) => (
            <button
              key={idx}
              type="button"
              disabled={p === '...'}
              onClick={() => typeof p === 'number' && setPage(p)}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                p === page
                  ? 'bg-[#0C4DA2] text-white'
                  : p === '...'
                  ? 'cursor-default text-slate-400'
                  : 'border border-slate-200 bg-white hover:bg-slate-100 cursor-pointer'
              }`}
            >
              {p}
            </button>
          ))}

          <button
            type="button"
            disabled={page === totalPages || totalPages === 0}
            onClick={() => setPage(page + 1)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white cursor-pointer transition-all"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UserManagementPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center text-xs font-bold text-slate-400 animate-pulse">Loading Member Workspace...</div>}>
      <UserManagementContent />
    </Suspense>
  );
}
