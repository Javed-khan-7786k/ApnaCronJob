import React, { useState, useEffect } from 'react';
import { AlertOctagon, RotateCw, Play, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../api/client.js';
import StatusBadge from '../components/StatusBadge.jsx';
import ExecutionDetailModal from '../components/ExecutionDetailModal.jsx';
import { useToast } from '../context/ToastContext.jsx';

export function FailedJobs() {
  const [failedList, setFailedList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [retryingId, setRetryingId] = useState(null);
  const [selectedExecution, setSelectedExecution] = useState(null);
  const { showToast } = useToast();

  const loadFailedJobs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/executions?status=failed&limit=50');
      if (res.data?.success) {
        setFailedList(res.data.data);
      }
    } catch (err) {
      showToast('Failed to load Dead Letter Queue', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFailedJobs();
  }, []);

  const handleManualRetry = async (exec) => {
    try {
      setRetryingId(exec._id);
      const res = await api.post(`/executions/${exec._id}/retry`);
      showToast(`Manual retry executed: ${res.data?.message || 'Done'}`, 'success');
      loadFailedJobs();
    } catch (err) {
      showToast(err.response?.data?.error || 'Retry attempt failed', 'error');
    } finally {
      setRetryingId(null);
    }
  };

  const handleRetryAll = async () => {
    if (failedList.length === 0) return;
    try {
      setLoading(true);
      for (const item of failedList.slice(0, 10)) {
        await api.post(`/executions/${item._id}/retry`);
      }
      showToast('Triggered retries for top failed executions', 'success');
      loadFailedJobs();
    } catch (err) {
      showToast('Failed to retry all items', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-rose-500" /> Dead Letter Queue & Failed Executions
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Executions that exhausted all 10 retry attempts or failed due to permanent HTTP / network errors
          </p>
        </div>

        <div className="flex items-center gap-2">
          {failedList.length > 0 && (
            <button
              onClick={handleRetryAll}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
            >
              <RotateCw className="w-3.5 h-3.5" /> Retry All ({failedList.length})
            </button>
          )}
          <button
            onClick={loadFailedJobs}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 transition-colors"
            title="Refresh queue"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading && failedList.length === 0 ? (
        <div className="py-20 text-center text-xs text-slate-400">Loading failed jobs queue...</div>
      ) : failedList.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-16 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-200">Dead Letter Queue is Empty!</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            All recent scheduled jobs and HTTP keepalive pings have executed without exhausted failures.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {failedList.map((item) => (
            <div
              key={item._id}
              className="bg-slate-900 border border-rose-900/40 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-200 text-sm">{item.jobName || 'Unnamed Job'}</span>
                  <StatusBadge status={item.status} />
                  <span className="text-[10px] font-mono text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-800/40">
                    Attempts: {item.attemptCount} / {item.maxAttempts}
                  </span>
                </div>

                <div className="text-slate-400 font-mono text-[11px] truncate">
                  Target: {item.requestDetails?.url || 'N/A'}
                </div>

                {item.errorDetails?.message && (
                  <div className="text-rose-300 font-mono text-[11px] bg-rose-950/20 p-2 rounded border border-rose-900/30">
                    {item.errorDetails.message}
                  </div>
                )}

                <div className="text-slate-500 text-[10px]">
                  Failed At: {new Date(item.completedAt || item.createdAt).toLocaleString()}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setSelectedExecution(item)}
                  className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
                >
                  Inspect
                </button>
                <button
                  onClick={() => handleManualRetry(item)}
                  disabled={retryingId === item._id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white font-semibold transition-colors disabled:opacity-50"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${retryingId === item._id ? 'animate-spin' : ''}`} />
                  <span>{retryingId === item._id ? 'Retrying...' : 'Retry Now'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Execution Details Modal */}
      <ExecutionDetailModal
        execution={selectedExecution}
        isOpen={!!selectedExecution}
        onClose={() => setSelectedExecution(null)}
        onRefresh={loadFailedJobs}
      />
    </div>
  );
}

export default FailedJobs;
