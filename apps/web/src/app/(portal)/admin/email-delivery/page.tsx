'use client';

/**
 * Brevo Email Delivery Status & Governance Monitor
 */

import React, { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { Mail, CheckCircle2, AlertCircle, RefreshCw, Send, Loader2, Server, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function EmailDeliveryPage() {
  const { fetchAdminEmailStats } = useStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchAdminEmailStats();
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading || !data) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-2 text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin text-[#0C4DA2]" />
        <p className="text-xs font-bold">Checking Brevo email gateway telemetry...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-2 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-white/[0.08] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200">
              Communication Infrastructure
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-[#F5F7FA] tracking-tight mt-1">
            Email Delivery & Brevo Status
          </h1>
          <p className="text-xs text-slate-500 dark:text-[#A7B3C5] font-semibold mt-0.5">
            Monitor institutional transactional email delivery, supervision notifications, and delivery rates.
          </p>
        </div>

        <button
          onClick={loadData}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-[#0B1728] border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-[#F5F7FA] hover:bg-slate-50 transition-all cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* Gateway Status Banner */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#07111F] border border-slate-200/80 dark:border-white/[0.08] shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center font-bold">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-slate-900 dark:text-[#F5F7FA]">
                Provider: {data.provider}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                {data.status}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Sender Address: <strong className="text-slate-700 dark:text-slate-300">{data.senderEmail}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3.5 py-2 rounded-xl border border-emerald-200 dark:border-emerald-900/40">
          <CheckCircle2 className="w-4 h-4" />
          <span>Transactional API Connected</span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#07111F] border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-4.5 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 block uppercase">Emails Dispatched</span>
          <p className="text-2xl font-black text-slate-900 dark:text-[#F5F7FA] mt-1">{data.stats.emailsSent}</p>
        </div>
        <div className="bg-white dark:bg-[#07111F] border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-4.5 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 block uppercase">Delivered</span>
          <p className="text-2xl font-black text-emerald-600 mt-1">{data.stats.emailsDelivered}</p>
        </div>
        <div className="bg-white dark:bg-[#07111F] border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-4.5 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 block uppercase">Bounces / Failed</span>
          <p className="text-2xl font-black text-slate-700 dark:text-slate-300 mt-1">{data.stats.emailsFailed}</p>
        </div>
        <div className="bg-white dark:bg-[#07111F] border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-4.5 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 block uppercase">Push Notification Tokens</span>
          <p className="text-2xl font-black text-blue-600 mt-1">{data.stats.activePushDevices}</p>
        </div>
      </div>

      {/* Recent Dispatches Table */}
      <div className="bg-white dark:bg-[#07111F] border border-slate-200/80 dark:border-white/[0.08] rounded-2xl overflow-hidden shadow-2xs space-y-3 p-5">
        <h3 className="text-sm font-black text-slate-900 dark:text-[#F5F7FA]">Recent Automated Dispatches</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-white/[0.08] bg-slate-50/70 dark:bg-[#0B1728] text-[11px] font-black uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Recipient</th>
                <th className="py-3 px-4">Template / Trigger</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Dispatched At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06]">
              {data.recentLogs.map((log: any) => (
                <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-[#0B1728]">
                  <td className="py-3 px-4 font-bold text-slate-800 dark:text-[#F5F7FA]">{log.recipient}</td>
                  <td className="py-3 px-4 text-slate-600 dark:text-[#A7B3C5] font-mono text-[11px]">{log.template}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {log.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-[11px]">{new Date(log.timestamp).toLocaleTimeString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
