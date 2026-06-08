'use client';

import React, { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { useRouter } from 'next/navigation';
import { Building, Plus, Search, Edit3, Trash2, X, Check, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminFacultiesPage() {
  const router = useRouter();
  const { currentUser } = useStore();

  const [faculties, setFaculties] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  // Guard against non-admin access
  useEffect(() => {
    if (currentUser && currentUser.role !== 'INSTITUTE_ADMIN') {
      router.replace('/dashboard');
    }
  }, [currentUser, router]);

  const fetchFaculties = async () => {
    setLoading(true);
    try {
      const { apiFetch } = await import('@/lib/api-client');
      const res = await apiFetch('/api/faculties');
      if (res.ok) {
        const data = await res.json();
        setFaculties(data);
      }
    } catch (e) {
      console.error('Failed to load faculties:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'INSTITUTE_ADMIN') {
      fetchFaculties();
    }
  }, [currentUser]);

  if (currentUser?.role !== 'INSTITUTE_ADMIN') {
    return null;
  }

  const handleOpenCreate = () => {
    setEditingFaculty(null);
    setName('');
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (fac: any) => {
    setEditingFaculty(fac);
    setName(fac.name);
    setIsDrawerOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Name is required.');
      return;
    }

    setSaving(true);
    try {
      const { apiFetch } = await import('@/lib/api-client');
      if (editingFaculty) {
        const res = await apiFetch(`/api/faculties/${editingFaculty.id}`, {
          method: 'PUT',
          body: JSON.stringify({ name }),
        });
        if (!res.ok) throw new Error('Failed to update faculty');
      } else {
        const res = await apiFetch('/api/faculties', {
          method: 'POST',
          body: JSON.stringify({ name }),
        });
        if (!res.ok) throw new Error('Failed to create faculty');
      }
      setIsDrawerOpen(false);
      fetchFaculties();
    } catch (err: any) {
      alert(`Error saving faculty: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this faculty? All associated departments and profiles will be affected.')) {
      try {
        const { apiFetch } = await import('@/lib/api-client');
        const res = await apiFetch(`/api/faculties/${id}`, {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to delete faculty');
        fetchFaculties();
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const filteredFaculties = faculties.filter((f) =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 text-left select-none">
      
      {/* 🚀 Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5 gap-4">
        <div>
          <span className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-1.5">
            <Building className="w-4 h-4 text-primary" />
            <span>Institutional Governance</span>
          </span>
          <h1 className="cb-page-title mt-2 font-display">Manage University Faculties</h1>
          <p className="cb-page-subtitle">
            Configure institutional faculties that group departments, supervisor profiles, and scholars.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 bg-primary hover:bg-primary/95 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm transition-all duration-200 active:scale-95 flex items-center justify-center space-x-1.5 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Faculty</span>
        </button>
      </div>

      {/* 🚀 Search */}
      <div className="cb-card p-4 bg-white/95 backdrop-blur-md max-w-md">
        <div className="relative">
          <input
            type="text"
            placeholder="Search faculties..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="cb-input pl-9"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3.5" />
        </div>
      </div>

      {/* 🚀 Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && faculties.length === 0 ? (
          <div className="cb-card p-12 text-center bg-white/95 backdrop-blur-md md:col-span-2 lg:col-span-3">
            <Loader2 className="w-8 h-8 text-primary mx-auto mb-3 animate-spin" />
            <span className="text-xs font-bold text-slate-500">Loading Faculties...</span>
          </div>
        ) : filteredFaculties.length === 0 ? (
          <div className="cb-card p-12 text-center bg-white/95 backdrop-blur-md md:col-span-2 lg:col-span-3">
            <Building className="w-8 h-8 text-slate-355 mx-auto mb-3" />
            <h3 className="text-slate-900 font-bold text-sm">No Faculties Found</h3>
            <p className="text-slate-400 text-xs mt-1">
              Add your university's faculties to start organizing departments.
            </p>
          </div>
        ) : (
          filteredFaculties.map((fac) => (
            <div key={fac.id} className="cb-card p-5 bg-white/95 backdrop-blur-md flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-bold">
                    {fac._count?.departments || 0} Departments
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-sm leading-snug group-hover:text-primary transition-colors">
                  {fac.name}
                </h3>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-slate-100/50">
                <button
                  onClick={() => handleOpenEdit(fac)}
                  className="p-2 border border-slate-200 hover:border-slate-350 text-slate-655 hover:text-slate-800 rounded-lg transition-colors cursor-pointer"
                  title="Edit Faculty"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(fac.id)}
                  className="p-2 border border-slate-200 hover:border-red-200 text-slate-655 hover:text-red-655 rounded-lg transition-colors cursor-pointer"
                  title="Delete Faculty"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 🚀 Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
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
                  <Building className="w-5 h-5 text-primary" />
                  <div>
                    <h3 className="font-display font-bold text-sm text-[#0d3c61]">
                      {editingFaculty ? 'Edit Faculty' : 'Create Faculty'}
                    </h3>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                      Academic Intranet Registry
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 flex-1">
                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-slate-455 uppercase tracking-widest">
                    Faculty Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="e.g. Faculty of Engineering & Technology"
                    className="cb-input"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsDrawerOpen(false)}
                    className="px-4 py-2.5 border border-slate-200 rounded-lg text-slate-655 hover:bg-slate-50 transition-colors text-xs font-bold uppercase tracking-wider cursor-pointer"
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-primary hover:bg-primary/95 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                    disabled={saving}
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    <span>{editingFaculty ? 'Update' : 'Create'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
