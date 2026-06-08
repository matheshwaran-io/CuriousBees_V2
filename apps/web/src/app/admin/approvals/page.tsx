'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckSquare, Loader2, UserCheck, UserX, Clock, RefreshCw, Mail, Building2 } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface PendingUser {
  id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  bio?: string;
  createdAt: string;
}

export default function AdminApprovalsPage() {
  const [pending, setPending] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [done, setDone] = useState<{ id: string; result: 'approved' | 'declined' }[]>([]);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/users/admin`, {
        headers: { 'x-admin-bypass': 'true' }
      });
      if (res.ok) {
        const all: PendingUser[] = await res.json();
        setPending(all.filter(u => u.role === 'SUPERVISOR'
          ? (u as any).status === 'PENDING_ADMIN_APPROVAL'
          : (u as any).status === 'PENDING_ADMIN_APPROVAL'
        ));
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPending(); }, []);

  const handle = async (userId: string, action: 'approve' | 'decline', role: string) => {
    setActionLoading(userId + action);
    try {
      const endpoint = role === 'SUPERVISOR'
        ? (action === 'approve' ? '/api/users/approve-supervisor' : '/api/users/decline-supervisor')
        : (action === 'approve' ? '/api/users/approve-scholar' : '/api/users/decline-scholar');
      await fetch(`${API_URL}${endpoint}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-bypass': 'true' },
        body: JSON.stringify({ supervisorId: userId, scholarId: userId }),
      });
      setDone(d => [...d, { id: userId, result: action === 'approve' ? 'approved' : 'declined' }]);
      setTimeout(() => {
        setPending(p => p.filter(u => u.id !== userId));
        setDone(d => d.filter(e => e.id !== userId));
      }, 1200);
    } catch { /* silent */ }
    finally { setActionLoading(null); }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-amber-500" /> Approval Requests
          </h1>
          <p className="text-slate-500 text-sm mt-1">{pending.length} pending registration{pending.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={fetchPending}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:border-blue-300 hover:text-blue-600 transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
        </div>
      ) : pending.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-3">
            <CheckSquare className="w-6 h-6 text-emerald-500" />
          </div>
          <p className="font-semibold text-slate-700">All caught up!</p>
          <p className="text-sm text-slate-400 mt-1">No pending approval requests.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map((user, i) => {
            const isDone = done.find(d => d.id === user.id);
            return (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{
                  opacity: isDone ? 0 : 1,
                  y: 0,
                  scale: isDone ? 0.98 : 1
                }}
                transition={{ delay: i * 0.04, duration: 0.3 }}
                className="bg-white border border-slate-200/70 rounded-2xl p-5 flex items-center gap-5 shadow-sm"
              >
                {/* Avatar */}
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
                  {user.name?.[0]?.toUpperCase() || '?'}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-slate-800 text-sm">{user.name}</p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border
                      ${user.role === 'SUPERVISOR' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-purple-50 text-purple-700 border-purple-100'}`}>
                      {user.role}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <Mail className="w-3 h-3" />{user.email}
                    </span>
                    {user.department && (
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <Building2 className="w-3 h-3" />{user.department}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <Clock className="w-3 h-3" />
                      {new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                    </span>
                  </div>
                  {user.bio && <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">{user.bio}</p>}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {isDone ? (
                    <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border
                      ${isDone.result === 'approved'
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                        : 'bg-red-50 text-red-600 border-red-100'}`}>
                      {isDone.result === 'approved' ? '✓ Approved' : '✗ Declined'}
                    </span>
                  ) : (
                    <>
                      <button
                        onClick={() => handle(user.id, 'decline', user.role)}
                        disabled={!!actionLoading}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer"
                      >
                        {actionLoading === user.id + 'decline'
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <UserX className="w-3.5 h-3.5" />}
                        Decline
                      </button>
                      <button
                        onClick={() => handle(user.id, 'approve', user.role)}
                        disabled={!!actionLoading}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer shadow-sm shadow-emerald-600/20"
                      >
                        {actionLoading === user.id + 'approve'
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <UserCheck className="w-3.5 h-3.5" />}
                        Approve
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
