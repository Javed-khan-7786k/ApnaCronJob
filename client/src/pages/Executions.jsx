import React, { useState, useEffect } from 'react';
import {
  History,
  RotateCw,
  Search,
  Filter,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Terminal,
} from 'lucide-react';
import api from '../api/client.js';
import StatusBadge from '../components/StatusBadge.jsx';
import ExecutionDetailModal from '../components/ExecutionDetailModal.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import { useToast } from '../context/ToastContext.jsx';

export function Executions() {
  const [executions, setExecutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [triggerFilter, setTriggerFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedExecution, setSelectedExecution] = useState(null);
  const [purgeModalOpen, setPurgeModalOpen] = useState(false);
  const { showToast } = useToast();

  const loadExecutions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', '25');
      if (statusFilter) params.append('status', statusFilter);
      if (triggerFilter) params.append('triggerSource', triggerFilter);

      const res = await api.get(`/executions?${params.toString()}`);
      if (res.data?.success) {
        setExecutions(res.data.data);
        setTotalPages(res.data.pagination.pages || 1);
        setTotalCount(res.data.pagination.total || 0);
      }
    } catch (err) {
      showToast('Failed to load executions', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExecutions();
  }, [page, statusFilter, triggerFilter]);

  const handleRowClick = async (exec) => {
    try {
      const res = await api.get(`/executions/${exec._id}`);
      if (res.data?.success) {
        setSelectedExecution(res.data.data);
      }
    } catch {
      setSelectedExecution(exec);
    }
  };

  const handlePurge = async () => {
    try {
      const res = await api.delete('/executions/purge?days=30');
      showToast(res.data.message || 'Purged older executions', 'success');
      setPurgeModalOpen(false);
      loadExecutions();
    } catch (err) {
      showToast('Failed to purge executions', 'error');
    }
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-400" /> Execution History
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Full audit log of automated and manual HTTP runs, retries, durations, and outputs
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPurgeModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-rose-950/40 hover:text-rose-300 text-slate-400 text-xs transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" /> Purge Old Logs
          </button>
          <button
            onClick={loadExecutions}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 transition-colors"
            title="Refresh list"
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Statuses</option>
            <option value="completed">Completed (Success)</option>
            <option value="failed">Failed</option>
            <option value="retrying">Retrying</option>
            <option value="running">Running</option>
            <option value="pending">Pending</option>
          </select>

          <select
            value={triggerFilter}
            onChange={(e) => { setTriggerFilter(e.target.value); setPage(1); }}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Triggers</option>
            <option value="scheduler">Scheduler Engine</option>
            <option value="manual">Manual Dashboard</option>
            <option value="tick">External Tick / Backup</option>
            <option value="telegram">Telegram Bot</option>
            <option value="retry">Retry Loop</option>
          </select>
        </div>

        <div className="text-slate-400 text-[11px] font-mono">
          Showing {executions.length} of {totalCount} records
        </div>
      </div>

      {/* Executions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {loading && executions.length === 0 ? (
          <div className="py-20 text-center text-xs text-slate-400">Loading execution records...</div>
        ) : executions.length === 0 ? (
          <div className="py-20 text-center text-xs text-slate-500">No execution records found matching filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Job Name & Trigger</th>
                  <th className="py-3 px-4">Status & Code</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Attempts</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {executions.map((exec) => (
                  <tr
                    key={exec._id}
                    onClick={() => handleRowClick(exec)}
                    className="hover:bg-slate-850 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-200">{exec.jobName || 'Unnamed Job'}</div>
                      <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                        Trigger: {exec.triggerSource} &bull; ID: {exec.occurrenceId.substring(0, 18)}...
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={exec.status} />
                        {exec.responseStatus && (
                          <span className={`font-mono text-xs font-bold ${
                            exec.responseStatus >= 200 && exec.responseStatus < 300 ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            HTTP {exec.responseStatus}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono whitespace-nowrap">
                      {exec.durationMs !== undefined ? `${exec.durationMs}ms` : '-'}
                    </td>

                    <td className="py-3 px-4 font-mono whitespace-nowrap">
                      {exec.attemptCount} / {exec.maxAttempts || 10}
                    </td>

                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap font-mono text-[11px]">
                      {new Date(exec.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
            <div>Page {page} of {totalPages}</div>
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

      {/* Execution Details Modal */}
      <ExecutionDetailModal
        execution={selectedExecution}
        isOpen={!!selectedExecution}
        onClose={() => setSelectedExecution(null)}
        onRefresh={loadExecutions}
      />

      {/* Purge Modal */}
      <ConfirmModal
        isOpen={purgeModalOpen}
        title="Purge Historical Executions"
        message="This will delete completed and failed execution logs older than 30 days to optimize database storage. This action cannot be undone."
        confirmText="Purge Executions"
        isDestructive={true}
        onConfirm={handlePurge}
        onCancel={() => setPurgeModalOpen(false)}
      />
    </div>
  );
}

export default Executions;
