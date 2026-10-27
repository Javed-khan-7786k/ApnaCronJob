import React, { useState, useEffect } from 'react';
import { ShieldAlert, RotateCw, ChevronLeft, ChevronRight, User, Terminal } from 'lucide-react';
import api from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';

export function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const { showToast } = useToast();

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', '30');
      if (actionFilter) params.append('action', actionFilter);

      const res = await api.get(`/audit-logs?${params.toString()}`);
      if (res.data?.success) {
        setLogs(res.data.data);
        setTotalPages(res.data.pagination.pages || 1);
      }
    } catch (err) {
      showToast('Failed to load audit logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, [page, actionFilter]);

  return (
    <div className="space-y-5 text-xs">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-emerald-400" /> Security & Audit Trail
          </h2>
          <p className="text-slate-400 mt-0.5">
            Tamper-evident logs of user authentication, job changes, manual runs, and administrative actions
          </p>
        </div>

        <button
          onClick={loadAuditLogs}
          className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 transition-colors"
          title="Refresh audit trail"
        >
          <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filter */}
      <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
        <select
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
          className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-300 focus:outline-none focus:border-emerald-500"
        >
          <option value="">All Actions</option>
          <option value="USER_LOGIN">User Logins</option>
          <option value="USER_REGISTER">User Registrations</option>
          <option value="JOB_CREATE">Job Creations</option>
          <option value="JOB_UPDATE">Job Updates</option>
          <option value="JOB_DELETE">Job Deletions</option>
          <option value="JOB_RUN_NOW">Manual Run Now</option>
          <option value="JOB_ENABLE">Job Enabled</option>
          <option value="JOB_PAUSE">Job Paused</option>
        </select>

        <span className="text-[11px] font-mono text-slate-500">
          Showing page {page} of {totalPages}
        </span>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {loading && logs.length === 0 ? (
          <div className="py-20 text-center text-slate-400">Loading audit records...</div>
        ) : logs.length === 0 ? (
          <div className="py-20 text-center text-slate-500">No audit logs found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Target Type & ID</th>
                  <th className="py-3 px-4">Details</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300 font-mono text-[11px]">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-850 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-100 font-sans">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700 text-xs">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {log.username || 'system'}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {log.targetType}: {log.targetId ? log.targetId.substring(0, 12) + '...' : '-'}
                    </td>
                    <td className="py-3 px-4 text-slate-400 max-w-xs truncate">
                      {log.details ? JSON.stringify(log.details) : '-'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="p-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
            <span className="text-slate-400 text-[11px]">Page {page} of {totalPages}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AuditLogs;
