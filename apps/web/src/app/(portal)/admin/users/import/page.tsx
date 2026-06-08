'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Upload, FileSpreadsheet, Loader2, CheckCircle, 
  XCircle, AlertCircle, Info, Download, Trash2
} from 'lucide-react';
import Link from 'next/link';

export default function BulkImportPage() {
  const router = useRouter();
  const { currentUser, importAdminUsers, isLoading } = useStore();
  
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [importReport, setImportReport] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isAdmin = currentUser?.role === 'INSTITUTE_ADMIN';

  useEffect(() => {
    if (currentUser && !isAdmin) {
      router.replace('/dashboard');
    }
  }, [currentUser, isAdmin, router]);

  if (!isAdmin) {
    return null;
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    setErrorMessage(null);
    setImportReport(null);
    const extension = selectedFile.name.split('.').pop()?.toLowerCase();
    if (extension !== 'csv' && extension !== 'xlsx') {
      setErrorMessage('Unsupported file type. Only CSV and XLSX formats are supported.');
      setFile(null);
      return;
    }
    setFile(selectedFile);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setErrorMessage(null);
      const report = await importAdminUsers(formData);
      setImportReport(report);
      setFile(null); // Clear file on completion
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during bulk import.');
    }
  };

  const handleClear = () => {
    setFile(null);
    setErrorMessage(null);
    setImportReport(null);
  };

  const downloadSampleTemplate = () => {
    // Generate CSV template in browser
    const headers = 'name,email,role,department,supervisor_email\n';
    const sampleData = 
      'Matheshwaran,mr9820@srmist.edu.in,SCHOLAR,CSE,ravi@srmist.edu.in\n' +
      'Lokesh,lokesh0212004@gmail.com,SCHOLAR,CSE,ravi@srmist.edu.in\n' +
      'Ravi,ravi@srmist.edu.in,SUPERVISOR,CSE,\n' +
      'Admin,admin@gmail.com,ADMIN,,\n';
    
    const blob = new Blob([headers + sampleData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "curiousbees_bulk_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 text-left select-none">
      
      {/* 🚀 Header */}
      <div className="border-b border-slate-100 pb-5">
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-1 text-[10px] font-extrabold text-slate-400 hover:text-primary uppercase tracking-widest transition-colors mb-2 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to directory</span>
        </Link>
        <h1 className="cb-page-title mt-1 font-display">Bulk User Import</h1>
        <p className="cb-page-subtitle">
          Upload spreadsheets in CSV or XLSX formats to provision hundreds of Scholars, Supervisors, and Admins at once.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Upload Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="cb-card p-6 bg-white/95 backdrop-blur-md border border-slate-100 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Upload className="w-4.5 h-4.5 text-primary" />
              <span>Upload Spreadsheet</span>
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div 
                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-all ${
                  dragActive ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-slate-350 hover:bg-slate-50/20'
                }`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
              >
                <input 
                  type="file" 
                  id="spreadsheet-upload"
                  onChange={handleFileChange}
                  accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  className="hidden" 
                />

                {!file ? (
                  <label 
                    htmlFor="spreadsheet-upload" 
                    className="flex flex-col items-center justify-center cursor-pointer space-y-2 text-center"
                  >
                    <div className="p-3 bg-slate-100 rounded-full text-slate-500">
                      <FileSpreadsheet className="w-8 h-8" />
                    </div>
                    <div className="text-xs">
                      <span className="font-bold text-primary hover:underline">Click to upload</span>
                      <span className="text-slate-450 font-semibold"> or drag & drop</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-semibold">Supports CSV and XLSX formats</p>
                  </label>
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-3 text-center w-full">
                    <div className="p-3 bg-primary/10 rounded-full text-primary">
                      <FileSpreadsheet className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 truncate max-w-xs">{file.name}</p>
                      <p className="text-[10px] text-slate-450 font-semibold">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleClear}
                        className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {errorMessage && (
                <div className="p-3 bg-red-55/60 border border-red-200 text-red-750 text-xs rounded-xl flex gap-2 items-start font-semibold">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {file && (
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 bg-primary hover:bg-[#004495] disabled:bg-primary/50 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md shadow-primary/20 flex items-center justify-center gap-2 border border-primary hover:border-[#004495]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Parsing & Writing Records...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Execute Bulk Provisioning</span>
                    </>
                  )}
                </button>
              )}
            </form>
          </div>

          {/* Report Display */}
          {importReport && (
            <div className="cb-card p-6 bg-white/95 backdrop-blur-md border border-slate-100 shadow-sm space-y-5">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
                <span>Import Analysis Log</span>
                <span className="text-[10px] bg-slate-100 text-slate-600 font-extrabold uppercase px-2 py-0.5 rounded-full">
                  Total Rows: {importReport.total}
                </span>
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 text-center">
                  <p className="text-[10px] text-emerald-600 font-extrabold uppercase tracking-wider">Success Count</p>
                  <p className="text-2xl font-black text-emerald-700 mt-1">{importReport.successCount}</p>
                </div>
                <div className="p-4 bg-red-50/50 rounded-xl border border-red-100 text-center">
                  <p className="text-[10px] text-red-500 font-extrabold uppercase tracking-wider">Failed Count</p>
                  <p className="text-2xl font-black text-red-700 mt-1">{importReport.failedCount}</p>
                </div>
              </div>

              {/* Success list */}
              {importReport.successes.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 text-emerald-700">
                    <CheckCircle className="w-4 h-4" />
                    <span>Successfully Provisioned ({importReport.successCount})</span>
                  </h4>
                  <div className="p-3 bg-slate-50 rounded-xl text-[10px] text-slate-600 font-semibold space-y-1 max-h-40 overflow-y-auto w-full border border-slate-100 font-mono">
                    {importReport.successes.map((item: string, idx: number) => (
                      <div key={idx} className="truncate">{item}</div>
                    ))}
                  </div>
                </div>
              )}

              {/* Errors list */}
              {importReport.errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 text-red-700">
                    <XCircle className="w-4 h-4" />
                    <span>Import Issues Detected ({importReport.failedCount})</span>
                  </h4>
                  <div className="border border-slate-100 rounded-xl overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50 text-[10px] font-bold text-slate-450 uppercase border-b border-slate-100">
                          <th className="p-2.5 pl-4">Row</th>
                          <th className="p-2.5">Reference Email</th>
                          <th className="p-2.5 pr-4 text-right">Reason</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-[10px] font-semibold text-slate-600 font-mono">
                        {importReport.errors.map((error: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="p-2.5 pl-4 text-slate-400 font-bold">{error.row}</td>
                            <td className="p-2.5 truncate max-w-xs">{error.email || '—'}</td>
                            <td className="p-2.5 pr-4 text-right text-red-600 font-sans font-bold">{error.message}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Documentation Panel */}
        <div className="space-y-6">
          <div className="cb-card p-6 bg-white/95 backdrop-blur-md border border-slate-100 shadow-sm space-y-4 text-slate-600">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Info className="w-4 h-4 text-primary" />
              <span>Import Instructions</span>
            </h3>

            <div className="text-xs leading-relaxed space-y-3 font-semibold text-slate-500">
              <p>To ensure flawless import processing, prepare your spreadsheet according to the strict validation schema below:</p>
              
              <ul className="list-disc pl-4 space-y-2">
                <li>
                  <strong className="text-slate-800">Email Domains:</strong> Every email must belong to one of the authorized domains configured.
                </li>
                <li>
                  <strong className="text-slate-800">Platform Roles:</strong> Valid roles are: <code className="bg-slate-100 px-1 py-0.5 rounded text-primary">SCHOLAR</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-primary">SUPERVISOR</code>, or <code className="bg-slate-100 px-1 py-0.5 rounded text-primary">ADMIN</code>.
                </li>
                <li>
                  <strong className="text-slate-800">Scholars Mapping:</strong> All scholars must have a valid supervisor email configured under the <code className="bg-slate-100 px-1 py-0.5 rounded text-primary">supervisor_email</code> column.
                </li>
                <li>
                  <strong className="text-slate-800">Department:</strong> Department name or code must exist in the database departments registry.
                </li>
              </ul>
            </div>

            <button
              onClick={downloadSampleTemplate}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 hover:border-slate-300 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Template (CSV)</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
