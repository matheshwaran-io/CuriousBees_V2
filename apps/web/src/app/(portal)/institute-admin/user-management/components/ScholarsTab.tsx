'use client';

import React, { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { Search, Plus, Upload, MoreVertical, Edit3, Trash2, CheckCircle2, XCircle, Ban, RefreshCcw, Loader2, Link as LinkIcon, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ScholarsTab() {
  const { addToast } = useStore();
  const [scholars, setScholars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState<any | null>(null);
  
  // Assign Supervisor logic
  const [faculties, setFaculties] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [supervisors, setSupervisors] = useState<any[]>([]);
  const [selFaculty, setSelFaculty] = useState('');
  const [selDept, setSelDept] = useState('');
  const [selSupervisor, setSelSupervisor] = useState('');
  const [assigning, setAssigning] = useState(false);

  // Add Scholar logic
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addFaculty, setAddFaculty] = useState('');
  const [addDept, setAddDept] = useState('');
  const [addSupervisor, setAddSupervisor] = useState('');
  const [adding, setAdding] = useState(false);

  // Import logic
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);

  const fetchScholars = async () => {
    setLoading(true);
    try {
      const { apiFetch } = await import('@/lib/api-client');
      const res = await apiFetch('/api/admin/scholars');
      if (res.ok) setScholars(await res.json());
    } catch (e: any) { addToast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  const fetchDependencies = async () => {
    try {
      const { apiFetch } = await import('@/lib/api-client');
      const fRes = await apiFetch('/api/faculties');
      if (fRes.ok) setFaculties(await fRes.json());
      const dRes = await apiFetch('/api/departments');
      if (dRes.ok) setDepartments(await dRes.json());
      const sRes = await apiFetch('/api/admin/supervisors'); // Using new route
      if (sRes.ok) setSupervisors(await sRes.json());
    } catch (e) { console.error('Failed to load deps', e); }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchScholars();
    fetchDependencies();
  }, []);

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const { apiMutate } = await import('@/lib/api-client');
      await apiMutate(`/api/admin/scholars/${id}/status`, 'PUT', { status });
      addToast(`Status updated to ${status}`, 'success');
      fetchScholars();
    } catch (e: any) { addToast(e.message, 'error'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this scholar?')) return;
    try {
      const { apiMutate } = await import('@/lib/api-client');
      await apiMutate(`/api/admin/scholars/${id}`, 'DELETE');
      addToast('Scholar deleted', 'success');
      fetchScholars();
    } catch (e: any) { addToast(e.message, 'error'); }
  };

  const submitAssignSupervisor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selSupervisor) return;
    setAssigning(true);
    try {
      const { apiMutate } = await import('@/lib/api-client');
      await apiMutate(`/api/admin/scholars/${showAssignModal.id}/supervisor`, 'PUT', { supervisorId: selSupervisor });
      addToast('Supervisor assigned successfully', 'success');
      setShowAssignModal(null);
      fetchScholars();
    } catch (e: any) { addToast(e.message, 'error'); }
    finally { setAssigning(false); }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      const { apiMutate } = await import('@/lib/api-client');
      const payload = {
        name: addName,
        email: addEmail,
        facultyId: addFaculty || undefined,
        departmentId: addDept || undefined,
        supervisorId: addSupervisor || undefined,
      };
      await apiMutate('/api/admin/scholars', 'POST', payload);
      addToast('Scholar added successfully', 'success');
      setShowAddModal(false);
      setAddName(''); setAddEmail(''); setAddFaculty(''); setAddDept(''); setAddSupervisor('');
      fetchScholars();
    } catch (e: any) { addToast(e.message, 'error'); }
    finally { setAdding(false); }
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) return;
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', importFile);
      const { apiFetch, readApiError } = await import('@/lib/api-client');
      const res = await apiFetch('/api/admin/scholars/import', { method: 'POST', body: formData });
      if (!res.ok) throw new Error(await readApiError(res));
      const data = await res.json();
      addToast(`Imported ${data.successCount} scholars. ${data.failedCount} failed.`, data.failedCount > 0 ? 'info' : 'success');
      setShowImportModal(false);
      setImportFile(null);
      fetchScholars();
    } catch (e: any) { addToast(e.message, 'error'); }
    finally { setImporting(false); }
  };

  const handleDownloadTemplate = () => {
    const headers = 'Name,Email,Faculty,Department,Supervisor\n';
    const example = 'John Doe,john.doe@example.com,Engineering,Computer Science,Dr. Smith\n';
    const blob = new Blob([headers + example], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'Scholars_Import_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredScholars = scholars.filter(s => 
    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <input type="text" placeholder="Search scholars by name or email..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="cb-input pl-10 w-full bg-white shadow-sm" />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowImportModal(true)} className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold uppercase rounded-lg shadow-sm flex items-center gap-2 cursor-pointer transition-colors">
            <Upload className="w-4 h-4" /> Import
          </button>
          <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-primary hover:bg-primary/95 text-white text-xs font-bold uppercase rounded-lg shadow-sm flex items-center gap-2 cursor-pointer transition-colors">
            <Plus className="w-4 h-4" /> Add Scholar
          </button>
        </div>
      </div>

      <div className="cb-card bg-white shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-black text-slate-500 tracking-wider">
              <tr>
                <th className="px-4 py-4">Scholar</th>
                <th className="px-4 py-4">Department</th>
                <th className="px-4 py-4">Supervisor</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Joined</th>
                <th className="px-4 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-500"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></td></tr>
              ) : filteredScholars.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-500">No scholars found.</td></tr>
              ) : filteredScholars.map(scholar => (
                <tr key={scholar.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-900">{scholar.name}</div>
                    <div className="text-xs text-slate-500">{scholar.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-semibold text-slate-700">{scholar.department || '-'}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">{scholar.faculty || '-'}</div>
                  </td>
                  <td className="px-4 py-3">
                    {scholar.supervisor ? (
                      <span className="text-sm font-semibold text-slate-700 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> {scholar.supervisor.name}</span>
                    ) : (
                      <span className="text-xs text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Unassigned</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-[10px] font-black uppercase tracking-wider rounded ${
                      scholar.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' :
                      scholar.status === 'SUSPENDED' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {scholar.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 font-semibold">
                    {new Date(scholar.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => {
                        setSelFaculty(scholar.departmentRef?.facultyId || '');
                        setSelDept(scholar.departmentId || '');
                        setSelSupervisor(scholar.supervisorId || '');
                        setShowAssignModal(scholar);
                      }} className="p-1.5 hover:bg-slate-200 text-slate-500 rounded transition-colors cursor-pointer" title="Assign Supervisor"><LinkIcon className="w-4 h-4" /></button>
                      
                      {scholar.status !== 'ACTIVE' && (
                        <button onClick={() => handleStatusChange(scholar.id, 'ACTIVE')} className="p-1.5 hover:bg-emerald-100 text-emerald-600 rounded transition-colors cursor-pointer" title="Activate"><CheckCircle2 className="w-4 h-4" /></button>
                      )}
                      {scholar.status !== 'SUSPENDED' && (
                        <button onClick={() => handleStatusChange(scholar.id, 'SUSPENDED')} className="p-1.5 hover:bg-amber-100 text-amber-600 rounded transition-colors cursor-pointer" title="Suspend"><Ban className="w-4 h-4" /></button>
                      )}
                      
                      <button onClick={() => handleDelete(scholar.id)} className="p-1.5 hover:bg-red-100 text-red-600 rounded transition-colors cursor-pointer" title="Delete"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign Supervisor Modal */}
      <AnimatePresence>
        {showAssignModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm cursor-pointer" onClick={() => setShowAssignModal(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col z-10 max-h-[100%]">
              <form onSubmit={submitAssignSupervisor} className="flex flex-col max-h-full">
                <div className="p-5 border-b border-slate-100 bg-slate-50 shrink-0">
                  <h3 className="font-display font-bold text-lg text-slate-900">Assign Supervisor</h3>
                  <p className="text-xs text-slate-500 mt-1">For <span className="font-bold text-slate-800">{showAssignModal.name}</span></p>
                </div>
                <div className="p-5 space-y-4 overflow-y-auto flex-1">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Faculty</label>
                    <select value={selFaculty} onChange={e => { setSelFaculty(e.target.value); setSelDept(''); setSelSupervisor(''); }} className="cb-input w-full cursor-pointer">
                      <option value="">Select Faculty...</option>
                      {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Department</label>
                    <select value={selDept} onChange={e => { setSelDept(e.target.value); setSelSupervisor(''); }} disabled={!selFaculty} className="cb-input w-full cursor-pointer disabled:opacity-50">
                      <option value="">Select Department...</option>
                      {departments.filter(d => d.facultyId === selFaculty).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Supervisor</label>
                    <select value={selSupervisor} onChange={e => setSelSupervisor(e.target.value)} disabled={!selDept} required className="cb-input w-full cursor-pointer disabled:opacity-50">
                      <option value="">Select Supervisor...</option>
                      {supervisors.filter(s => s.departmentId === selDept).map(s => <option key={s.id} value={s.id}>{s.name} ({s.email})</option>)}
                    </select>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 flex justify-end gap-3 border-t border-slate-100 shrink-0">
                  <button type="button" onClick={() => setShowAssignModal(null)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">Cancel</button>
                  <button type="submit" disabled={assigning || !selSupervisor} className="px-4 py-2 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50">
                    {assigning && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Confirm Assignment
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm cursor-pointer" onClick={() => setShowAddModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col z-10 max-h-[100%]">
              <form onSubmit={handleAddSubmit} className="flex flex-col max-h-full">
                <div className="p-5 border-b border-slate-100 bg-slate-50 shrink-0">
                  <h3 className="font-display font-bold text-lg text-slate-900">Add Scholar</h3>
                  <p className="text-xs text-slate-500 mt-1">Create a new scholar account.</p>
                </div>
                <div className="p-5 space-y-4 overflow-y-auto flex-1">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Name</label>
                    <input type="text" value={addName} onChange={e => setAddName(e.target.value)} required className="cb-input w-full" placeholder="John Doe" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Email</label>
                    <input type="email" value={addEmail} onChange={e => setAddEmail(e.target.value)} required className="cb-input w-full" placeholder="john@example.com" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Faculty</label>
                    <select value={addFaculty} onChange={e => { setAddFaculty(e.target.value); setAddDept(''); setAddSupervisor(''); }} className="cb-input w-full cursor-pointer">
                      <option value="">Select Faculty...</option>
                      {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Department</label>
                    <select value={addDept} onChange={e => { setAddDept(e.target.value); setAddSupervisor(''); }} disabled={!addFaculty} className="cb-input w-full cursor-pointer disabled:opacity-50">
                      <option value="">Select Department...</option>
                      {departments.filter(d => d.facultyId === addFaculty).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Supervisor</label>
                    <select value={addSupervisor} onChange={e => setAddSupervisor(e.target.value)} disabled={!addDept} className="cb-input w-full cursor-pointer disabled:opacity-50">
                      <option value="">Select Supervisor (Optional)...</option>
                      {supervisors.filter(s => s.departmentId === addDept).map(s => <option key={s.id} value={s.id}>{s.name} ({s.email})</option>)}
                    </select>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 flex justify-end gap-3 border-t border-slate-100 shrink-0">
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">Cancel</button>
                  <button type="submit" disabled={adding || !addName || !addEmail} className="px-4 py-2 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50">
                    {adding && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Add Scholar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {showImportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm cursor-pointer" onClick={() => setShowImportModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col z-10 max-h-[100%]">
              <div className="p-5 border-b border-slate-100 bg-slate-50 shrink-0">
                <h3 className="font-display font-bold text-lg text-slate-900">Import Scholars</h3>
                <p className="text-xs text-slate-500 mt-1">Upload a CSV or XLSX file containing Name, Email, Faculty, Department, and Supervisor.</p>
              </div>
              <div className="flex flex-col flex-1 overflow-y-auto max-h-full">
                <div className="p-5 space-y-4">
                  <button type="button" onClick={handleDownloadTemplate} className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer">
                    <Download className="w-4 h-4" /> Download Template
                  </button>
                  <div className="text-xs text-blue-800 bg-blue-50 p-3 rounded border border-blue-100 flex items-start gap-2">
                    <div className="mt-0.5 font-bold">ℹ️</div>
                    <p>Please make sure to enter valid data matching the template headers exactly.</p>
                  </div>
                  <form onSubmit={handleImportSubmit} className="space-y-4">
                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center bg-slate-50 relative group hover:border-primary/50 transition-colors cursor-pointer">
                      <input type="file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" onChange={e => setImportFile(e.target.files?.[0] || null)} required className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                      <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2 group-hover:text-primary transition-colors" />
                      <p className="text-sm font-semibold text-slate-700">Click or drag file to this area to upload</p>
                      <p className="text-xs text-slate-500 mt-1">{importFile ? importFile.name : 'Support for a single .csv or .xlsx upload.'}</p>
                    </div>
                    <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-6">
                      <button type="button" onClick={() => setShowImportModal(false)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">Cancel</button>
                      <button type="submit" disabled={importing || !importFile} className="px-4 py-2 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50">
                        {importing && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Upload & Import
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
