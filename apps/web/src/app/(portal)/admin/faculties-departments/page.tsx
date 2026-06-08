'use client';

import React, { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { useRouter } from 'next/navigation';
import { Building, Building2, Plus, Search, Edit3, Trash2, X, Check, Loader2, ChevronRight, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminFacultiesDepartmentsPage() {
  const router = useRouter();
  const { currentUser, departments, fetchDepartments, createDepartment, updateDepartment, deleteDepartment } = useStore();

  const [faculties, setFaculties] = useState<any[]>([]);
  const [loadingFaculties, setLoadingFaculties] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFaculties, setExpandedFaculties] = useState<Record<string, boolean>>({});

  // Drawer States
  const [drawerType, setDrawerType] = useState<'FACULTY' | 'DEPARTMENT' | null>(null);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  // Form States (Faculty)
  const [facName, setFacName] = useState('');

  // Form States (Department)
  const [deptName, setDeptName] = useState('');
  const [deptCode, setDeptCode] = useState('');
  const [selectedFacultyId, setSelectedFacultyId] = useState('');
  const [deptDesc, setDeptDesc] = useState('');

  // Guard against non-admin access
  useEffect(() => {
    if (currentUser && currentUser.role !== 'INSTITUTE_ADMIN') {
      router.replace('/dashboard');
    }
  }, [currentUser, router]);

  const loadFaculties = async () => {
    setLoadingFaculties(true);
    try {
      const { apiFetch } = await import('@/lib/api-client');
      const res = await apiFetch('/api/faculties');
      if (res.ok) {
        const data = await res.json();
        setFaculties(data);
        // Expand all by default
        const exp: Record<string, boolean> = {};
        data.forEach((f: any) => { exp[f.id] = true; });
        setExpandedFaculties(exp);
      }
    } catch (e) {
      console.error('Failed to load faculties:', e);
    } finally {
      setLoadingFaculties(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'INSTITUTE_ADMIN') {
      loadFaculties();
      fetchDepartments();
    }
  }, [currentUser, fetchDepartments]);

  if (currentUser?.role !== 'INSTITUTE_ADMIN') return null;

  const toggleFaculty = (id: string) => {
    setExpandedFaculties(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // --- Actions: Faculty ---
  const handleOpenCreateFaculty = () => {
    setDrawerType('FACULTY');
    setEditingItem(null);
    setFacName('');
  };

  const handleOpenEditFaculty = (fac: any) => {
    setDrawerType('FACULTY');
    setEditingItem(fac);
    setFacName(fac.name);
  };

  const submitFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facName.trim()) return;
    setSaving(true);
    try {
      const { apiFetch } = await import('@/lib/api-client');
      if (editingItem) {
        await apiFetch(`/api/faculties/${editingItem.id}`, { method: 'PUT', body: JSON.stringify({ name: facName }) });
      } else {
        await apiFetch('/api/faculties', { method: 'POST', body: JSON.stringify({ name: facName }) });
      }
      setDrawerType(null);
      loadFaculties();
    } catch (err: any) { alert(err.message); } finally { setSaving(false); }
  };

  const deleteFaculty = async (id: string) => {
    if (!confirm('Are you sure you want to delete this faculty?')) return;
    try {
      const { apiFetch } = await import('@/lib/api-client');
      await apiFetch(`/api/faculties/${id}`, { method: 'DELETE' });
      loadFaculties();
    } catch (err: any) { alert(err.message); }
  };

  // --- Actions: Department ---
  const handleOpenCreateDept = (facultyId?: string) => {
    setDrawerType('DEPARTMENT');
    setEditingItem(null);
    setDeptName('');
    setDeptCode('');
    setSelectedFacultyId(facultyId || '');
    setDeptDesc('');
  };

  const handleOpenEditDept = (dept: any) => {
    setDrawerType('DEPARTMENT');
    setEditingItem(dept);
    setDeptName(dept.name);
    setDeptCode(dept.code);
    setSelectedFacultyId(dept.facultyId || '');
    setDeptDesc(dept.description || '');
  };

  const submitDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptName || !deptCode || !selectedFacultyId) return;
    setSaving(true);
    try {
      if (editingItem) {
        await updateDepartment(editingItem.id, { name: deptName, code: deptCode, facultyId: selectedFacultyId, description: deptDesc || undefined });
      } else {
        await createDepartment({ name: deptName, code: deptCode, facultyId: selectedFacultyId, description: deptDesc || undefined });
      }
      setDrawerType(null);
    } catch (err: any) { alert(err.message); } finally { setSaving(false); }
  };

  const removeDepartment = async (id: string) => {
    if (!confirm('Delete this department?')) return;
    try { await deleteDepartment(id); } catch (err: any) { alert(err.message); }
  };

  const filteredFaculties = faculties.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const orphanedDepartments = departments.filter(d => !d.facultyId);

  return (
    <div className="space-y-6 text-left select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between border-b border-slate-100 pb-5 gap-4">
        <div>
          <span className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-1.5">
            <Building className="w-4 h-4 text-primary" />
            <span>Institutional Governance</span>
          </span>
          <h1 className="cb-page-title mt-2 font-display">Faculties & Departments</h1>
          <p className="cb-page-subtitle">Manage the academic hierarchy of your institution in one place.</p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => handleOpenCreateDept()} className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer">
            <Building2 className="w-4 h-4" /> Add Dept
          </button>
          <button onClick={handleOpenCreateFaculty} className="px-4 py-2.5 bg-primary hover:bg-primary/95 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer">
            <Building className="w-4 h-4" /> Add Faculty
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="cb-card p-4 bg-white/95 backdrop-blur-md max-w-md">
        <div className="relative">
          <input type="text" placeholder="Search faculties..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="cb-input pl-9" />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3.5" />
        </div>
      </div>

      {/* List */}
      <div className="space-y-4">
        {loadingFaculties ? (
          <div className="cb-card p-12 text-center flex flex-col items-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
            <p className="text-xs font-bold text-slate-500">Loading hierarchy...</p>
          </div>
        ) : filteredFaculties.length === 0 ? (
          <div className="cb-card p-12 text-center">
            <Building className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-900">No Faculties Found</h3>
          </div>
        ) : (
          filteredFaculties.map(fac => {
            const isExpanded = !!expandedFaculties[fac.id];
            const facDepts = departments.filter(d => d.facultyId === fac.id);

            return (
              <div key={fac.id} className="cb-card overflow-hidden bg-white/95 backdrop-blur-md border border-slate-100">
                {/* Faculty Header */}
                <div className="p-4 bg-slate-50/50 flex items-center justify-between group">
                  <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => toggleFaculty(fac.id)}>
                    <button className="p-1 rounded hover:bg-slate-200 text-slate-400 transition-colors">
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 group-hover:text-primary transition-colors">{fac.name}</h3>
                      <p className="text-[10px] text-slate-500 font-semibold">{facDepts.length} Departments</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleOpenCreateDept(fac.id)} className="p-1.5 hover:bg-slate-200 text-slate-500 rounded-lg transition-colors cursor-pointer" title="Add Department to Faculty"><Plus className="w-4 h-4" /></button>
                    <button onClick={() => handleOpenEditFaculty(fac)} className="p-1.5 hover:bg-slate-200 text-slate-500 rounded-lg transition-colors cursor-pointer" title="Edit Faculty"><Edit3 className="w-4 h-4" /></button>
                    <button onClick={() => deleteFaculty(fac.id)} className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors cursor-pointer" title="Delete Faculty"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>

                {/* Departments List */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-slate-100">
                      {facDepts.length === 0 ? (
                        <div className="p-6 text-center text-xs text-slate-400 font-semibold italic bg-white">No departments added yet.</div>
                      ) : (
                        <div className="divide-y divide-slate-50 bg-white">
                          {facDepts.map(dept => (
                            <div key={dept.id} className="p-4 pl-12 flex items-center justify-between hover:bg-slate-50/50 transition-colors group/dept">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-0.5 rounded bg-slate-900 text-white text-[9px] font-black uppercase tracking-wider">{dept.code}</span>
                                  <h4 className="font-bold text-sm text-slate-800">{dept.name}</h4>
                                </div>
                                {dept.description && <p className="text-xs text-slate-500 mt-1 line-clamp-1">{dept.description}</p>}
                              </div>
                              <div className="flex items-center gap-2 opacity-0 group-hover/dept:opacity-100 transition-opacity">
                                <button onClick={() => handleOpenEditDept(dept)} className="p-1.5 hover:bg-slate-200 text-slate-500 rounded-lg transition-colors cursor-pointer"><Edit3 className="w-3.5 h-3.5" /></button>
                                <button onClick={() => removeDepartment(dept.id)} className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>

      {/* Drawer */}
      <AnimatePresence>
        {drawerType && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.3 }} exit={{ opacity: 0 }} onClick={() => setDrawerType(null)} className="fixed inset-0 bg-slate-900/30 backdrop-blur-[2px] z-50 cursor-pointer" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed inset-y-0 right-0 w-full sm:max-w-lg bg-white border-l border-slate-200 z-50 p-6 shadow-2xl flex flex-col overflow-y-auto">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                <div className="flex items-center space-x-2.5">
                  {drawerType === 'FACULTY' ? <Building className="w-5 h-5 text-primary" /> : <Building2 className="w-5 h-5 text-primary" />}
                  <div>
                    <h3 className="font-display font-bold text-sm text-[#0d3c61]">
                      {editingItem ? `Edit ${drawerType === 'FACULTY' ? 'Faculty' : 'Department'}` : `Create ${drawerType === 'FACULTY' ? 'Faculty' : 'Department'}`}
                    </h3>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">Academic Intranet Registry</p>
                  </div>
                </div>
                <button onClick={() => setDrawerType(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"><X className="w-5 h-5" /></button>
              </div>

              {drawerType === 'FACULTY' ? (
                <form onSubmit={submitFaculty} className="space-y-4 flex-1">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-slate-455 uppercase tracking-widest">Faculty Name *</label>
                    <input type="text" value={facName} onChange={e => setFacName(e.target.value)} required placeholder="e.g. Faculty of Engineering" className="cb-input w-full" />
                  </div>
                  <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                    <button type="button" onClick={() => setDrawerType(null)} className="px-4 py-2.5 border border-slate-200 rounded-lg text-slate-655 hover:bg-slate-50 text-xs font-bold uppercase cursor-pointer" disabled={saving}>Cancel</button>
                    <button type="submit" disabled={saving} className="px-5 py-2.5 bg-primary hover:bg-primary/95 text-white text-xs font-bold uppercase rounded-lg shadow-sm flex items-center space-x-1.5 cursor-pointer disabled:opacity-50">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}<span>{editingItem ? 'Update' : 'Create'}</span>
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={submitDepartment} className="space-y-4 flex-1">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-slate-455 uppercase tracking-widest">Faculty *</label>
                    <select value={selectedFacultyId} onChange={e => setSelectedFacultyId(e.target.value)} required className="w-full cb-input appearance-none bg-white pr-8 text-xs font-semibold cursor-pointer">
                      <option value="">Select Faculty...</option>
                      {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-slate-455 uppercase tracking-widest">Department Name *</label>
                    <input type="text" value={deptName} onChange={e => setDeptName(e.target.value)} required placeholder="e.g. Computing Technologies" className="cb-input w-full" />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-slate-455 uppercase tracking-widest">Department Code *</label>
                    <input type="text" value={deptCode} onChange={e => setDeptCode(e.target.value)} required placeholder="e.g. CTECH" className="cb-input w-full uppercase" />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-slate-455 uppercase tracking-widest">Description</label>
                    <textarea rows={5} value={deptDesc} onChange={e => setDeptDesc(e.target.value)} placeholder="Brief scope..." className="w-full px-3 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-200 outline-none focus:border-primary transition-all" />
                  </div>
                  <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                    <button type="button" onClick={() => setDrawerType(null)} className="px-4 py-2.5 border border-slate-200 rounded-lg text-slate-655 hover:bg-slate-50 text-xs font-bold uppercase cursor-pointer" disabled={saving}>Cancel</button>
                    <button type="submit" disabled={saving} className="px-5 py-2.5 bg-primary hover:bg-primary/95 text-white text-xs font-bold uppercase rounded-lg shadow-sm flex items-center space-x-1.5 cursor-pointer disabled:opacity-50">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}<span>{editingItem ? 'Update' : 'Create'}</span>
                    </button>
                  </div>
                </form>
              )}

            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
