'use client';

import React, { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { Search, Plus, Upload, Trash2, CheckCircle2, Ban, Loader2, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SupervisorsTab() {
  const { addToast } = useStore();
  const [supervisors, setSupervisors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // Add Supervisor logic
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addFaculty, setAddFaculty] = useState('');
  const [addDept, setAddDept] = useState('');
  const [addDesignation, setAddDesignation] = useState('');
  const [addEmployeeId, setAddEmployeeId] = useState('');
  const [adding, setAdding] = useState(false);
  
  // Dependencies
  const [faculties, setFaculties] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);

  // Import logic
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);

  const fetchSupervisors = async () => {
    setLoading(true);
    try {
      const { apiFetch } = await import('@/lib/api-client');
      const res = await apiFetch('/api/admin/supervisors');
      if (res.ok) setSupervisors(await res.json());
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
    } catch (e) { console.error('Failed to load deps', e); }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { 
    fetchSupervisors(); 
    fetchDependencies();
  }, []);

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const { apiMutate } = await import('@/lib/api-client');
      await apiMutate(`/api/admin/supervisors/${id}/status`, 'PUT', { status });
      addToast(`Status updated to ${status}`, 'success');
      fetchSupervisors();
    } catch (e: any) { addToast(e.message, 'error'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this supervisor?')) return;
    try {
      const { apiMutate } = await import('@/lib/api-client');
      await apiMutate(`/api/admin/supervisors/${id}`, 'DELETE');
      addToast('Supervisor deleted', 'success');
      fetchSupervisors();
    } catch (e: any) { addToast(e.message, 'error'); }
  };

  const filtered = supervisors.filter(s => 
    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        designation: addDesignation || undefined,
        employeeId: addEmployeeId || undefined,
      };
      await apiMutate('/api/admin/supervisors', 'POST', payload);
      addToast('Supervisor added successfully', 'success');
      setShowAddModal(false);
      setAddName(''); setAddEmail(''); setAddFaculty(''); setAddDept(''); setAddDesignation(''); setAddEmployeeId('');
      fetchSupervisors();
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
      const res = await apiFetch('/api/admin/supervisors/import', { method: 'POST', body: formData });
      if (!res.ok) throw new Error(await readApiError(res));
      const data = await res.json();
      addToast(`Imported ${data.successCount} supervisors. ${data.failedCount} failed.`, data.failedCount > 0 ? 'info' : 'success');
      setShowImportModal(false);
      setImportFile(null);
      fetchSupervisors();
    } catch (e: any) { addToast(e.message, 'error'); }
    finally { setImporting(false); }
  };

  const handleDownloadTemplate = () => {
    const headers = 'Name,Email,Faculty,Department,Designation,EmployeeId\n';
    const example = 'Dr. Jane Smith,jane.smith@example.com,Engineering,Computer Science,Associate Professor,EMP-001\n';
    const blob = new Blob([headers + example], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'Supervisors_Import_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <input type="text" placeholder="Search supervisors..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="cb-input pl-10 w-full bg-white shadow-sm" />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowImportModal(true)} className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold uppercase rounded-lg shadow-sm flex items-center gap-2 cursor-pointer transition-colors">
            <Upload className="w-4 h-4" /> Import
          </button>
          <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-primary hover:bg-primary/95 text-white text-xs font-bold uppercase rounded-lg shadow-sm flex items-center gap-2 cursor-pointer transition-colors">
            <Plus className="w-4 h-4" /> Add Supervisor
          </button>
        </div>
      </div>

      <div className="cb-card bg-white shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-black text-slate-500 tracking-wider">
              <tr>
                <th className="px-4 py-4">Supervisor</th>
                <th className="px-4 py-4">Department</th>
                <th className="px-4 py-4">Scholars</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-500"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-500">No supervisors found.</td></tr>
              ) : filtered.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-900">{item.name}</div>
                    <div className="text-xs text-slate-500">{item.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-semibold text-slate-700">{item.department || '-'}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">{item.faculty || '-'}</div>
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-700">{item.scholarCount}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-[10px] font-black uppercase tracking-wider rounded ${item.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {item.status !== 'ACTIVE' && (
                        <button onClick={() => handleStatusChange(item.id, 'ACTIVE')} className="p-1.5 hover:bg-emerald-100 text-emerald-600 rounded transition-colors cursor-pointer" title="Activate"><CheckCircle2 className="w-4 h-4" /></button>
                      )}
                      {item.status !== 'SUSPENDED' && (
                        <button onClick={() => handleStatusChange(item.id, 'SUSPENDED')} className="p-1.5 hover:bg-amber-100 text-amber-600 rounded transition-colors cursor-pointer" title="Suspend"><Ban className="w-4 h-4" /></button>
                      )}
                      <button onClick={() => handleDelete(item.id)} className="p-1.5 hover:bg-red-100 text-red-600 rounded transition-colors cursor-pointer" title="Delete"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm cursor-pointer" onClick={() => setShowAddModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col z-10 max-h-[100%]">
              <form onSubmit={handleAddSubmit} className="flex flex-col max-h-full">
                <div className="p-5 border-b border-slate-100 bg-slate-50 shrink-0">
                  <h3 className="font-display font-bold text-lg text-slate-900">Add Supervisor</h3>
                  <p className="text-xs text-slate-500 mt-1">Create a new supervisor account.</p>
                </div>
                <div className="p-5 space-y-4 overflow-y-auto flex-1">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Name</label>
                    <input type="text" value={addName} onChange={e => setAddName(e.target.value)} required className="cb-input w-full" placeholder="Dr. John Doe" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Email</label>
                    <input type="email" value={addEmail} onChange={e => setAddEmail(e.target.value)} required className="cb-input w-full" placeholder="john@example.com" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Faculty</label>
                    <select value={addFaculty} onChange={e => { setAddFaculty(e.target.value); setAddDept(''); }} className="cb-input w-full cursor-pointer">
                      <option value="">Select Faculty...</option>
                      {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Department</label>
                    <select value={addDept} onChange={e => setAddDept(e.target.value)} disabled={!addFaculty} className="cb-input w-full cursor-pointer disabled:opacity-50">
                      <option value="">Select Department...</option>
                      {departments.filter(d => d.facultyId === addFaculty).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Designation</label>
                      <input type="text" value={addDesignation} onChange={e => setAddDesignation(e.target.value)} className="cb-input w-full" placeholder="e.g. Professor" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Employee ID</label>
                      <input type="text" value={addEmployeeId} onChange={e => setAddEmployeeId(e.target.value)} className="cb-input w-full" placeholder="e.g. EMP-123" />
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 flex justify-end gap-3 border-t border-slate-100 shrink-0">
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">Cancel</button>
                  <button type="submit" disabled={adding || !addName || !addEmail} className="px-4 py-2 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50">
                    {adding && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Add Supervisor
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
                <h3 className="font-display font-bold text-lg text-slate-900">Import Supervisors</h3>
                <p className="text-xs text-slate-500 mt-1">Upload a CSV or XLSX file containing Name, Email, Faculty, Department, Designation, and EmployeeId.</p>
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
