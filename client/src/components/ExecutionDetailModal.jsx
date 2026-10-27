import React, { useState } from 'react';
import { X, Copy, Check, RotateCw, Terminal, Clock, ShieldCheck, AlertCircle } from 'lucide-react';
import StatusBadge from './StatusBadge.jsx';
import api from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';

export function ExecutionDetailModal({ execution, isOpen, onClose, onRefresh }) {
  const [copied, setCopied] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const { showToast } = useToast();

  if (!isOpen || !execution) return null;

  const copyCurl = () => {
    const req = execution.requestDetails || {};
    const method = req.method || 'GET';
    const url = req.url || '';
    let curl = `curl -X ${method} "${url}"`;

    if (req.headers && typeof req.headers === 'object') {
      for (const [k, v] of Object.entries(req.headers)) {
        curl += ` \\\n  -H "${k}: ${v}"`;
      }
    }

    if (req.body && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
      curl += ` \\\n  -d '${req.body.replace(/'/g, "'\\''")}'`;
    }

    navigator.clipboard.writeText(curl);
    setCopied(true);
    showToast('cURL command copied to clipboard', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleManualRetry = async () => {
    try {
      setRetrying(true);
      const res = await api.post(`/executions/${execution._id}/retry`);
      showToast(res.data?.message || 'Retry executed successfully', 'success');
      if (onRefresh) onRefresh();
      onClose();
    } catch (err) {
      showToast(err.response?.data?.error || err.message, 'error');
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-850">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-slate-100">{execution.jobName || 'Execution Details'}</h2>
            <StatusBadge status={execution.status} />
            <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
              {execution.triggerSource}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors p-1"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-950/60 p-4 rounded-lg border border-slate-800 text-sm">
            <div>
              <div className="text-xs text-slate-400 font-medium">Scheduled For</div>
              <div className="font-mono text-slate-200 text-xs mt-1">
                {execution.scheduledFor ? new Date(execution.scheduledFor).toLocaleString() : 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Duration</div>
              <div className="font-mono text-slate-200 text-xs mt-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {execution.durationMs !== undefined ? `${execution.durationMs}ms` : '0ms'}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Attempts</div>
              <div className="font-mono text-slate-200 text-xs mt-1">
                {execution.attemptCount} / {execution.maxAttempts || 10}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">HTTP Status</div>
              <div className="font-mono text-xs mt-1">
                {execution.responseStatus ? (
                  <span className={execution.responseStatus >= 200 && execution.responseStatus < 300 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                    HTTP {execution.responseStatus}
                  </span>
                ) : (
                  <span className="text-slate-500">None</span>
                )}
              </div>
            </div>
          </div>

          {/* Occurrence ID */}
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 bg-slate-950 px-3 py-2 rounded border border-slate-800">
            <span className="truncate">Occurrence: {execution.occurrenceId}</span>
            {execution.workerId && <span className="shrink-0 text-slate-500 ml-2">Worker: {execution.workerId}</span>}
          </div>

          {/* Error Banner if Failed */}
          {execution.errorDetails?.message && (
            <div className="p-4 rounded-lg bg-rose-950/30 border border-rose-800/50 text-rose-200 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-sm">Execution Error</div>
                <div className="text-xs font-mono mt-1 whitespace-pre-wrap">{execution.errorDetails.message}</div>
              </div>
            </div>
          )}

          {/* Request Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" /> Request Payload
              </span>
              <button
                onClick={copyCurl}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy cURL'}
              </button>
            </div>
            <div className="terminal-window p-3 rounded-lg text-xs overflow-x-auto">
              <div className="text-emerald-400 font-bold">
                {execution.requestDetails?.method || 'GET'} <span className="text-slate-200">{execution.requestDetails?.url}</span>
              </div>
              {execution.requestDetails?.headers && Object.keys(execution.requestDetails.headers).length > 0 && (
                <div className="mt-2 text-slate-400">
                  <div className="text-slate-500 font-semibold mb-1">Headers:</div>
                  <pre className="text-slate-300 font-mono text-xs">{JSON.stringify(execution.requestDetails.headers, null, 2)}</pre>
                </div>
              )}
              {execution.requestDetails?.body && (
                <div className="mt-2">
                  <div className="text-slate-500 font-semibold mb-1">Body:</div>
                  <pre className="text-slate-300 font-mono text-xs">{execution.requestDetails.body}</pre>
                </div>
              )}
            </div>
          </div>

          {/* Response Preview Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-400" /> Response Output Preview
              </span>
              {execution.responseTruncated && (
                <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  Truncated to 64KB
                </span>
              )}
            </div>
            <div className="terminal-window p-3 rounded-lg text-xs max-h-56 overflow-y-auto">
              {execution.responseBody ? (
                <pre className="text-slate-200 font-mono text-xs whitespace-pre-wrap">{execution.responseBody}</pre>
              ) : (
                <span className="text-slate-500 italic">No response body captured.</span>
              )}
            </div>
          </div>

          {/* Execution Step Logs */}
          {Array.isArray(execution.logs) && execution.logs.length > 0 && (
            <div className="space-y-2">
              <span className="text-sm font-semibold text-slate-300">Lifecycle Audit Logs</span>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs font-mono space-y-1.5 max-h-40 overflow-y-auto">
                {execution.logs.map((log, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-slate-300">
                    <span className="text-slate-500 shrink-0">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                    <span className={log.level === 'ERROR' ? 'text-rose-400 font-bold' : log.level === 'WARN' ? 'text-amber-400' : 'text-slate-300'}>
                      {log.level}:
                    </span>
                    <span className="text-slate-200">{log.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-850 flex items-center justify-between">
          <div>
            {execution.nextRetryAt && (
              <span className="text-xs text-amber-400">
                Next retry attempt: {new Date(execution.nextRetryAt).toLocaleString()}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {['failed', 'retrying'].includes(execution.status) && (
              <button
                onClick={handleManualRetry}
                disabled={retrying}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded bg-amber-600 hover:bg-amber-500 text-white transition-colors disabled:opacity-50"
              >
                <RotateCw className={`w-3.5 h-3.5 ${retrying ? 'animate-spin' : ''}`} />
                {retrying ? 'Retrying...' : 'Manual Retry Now'}
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-medium rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExecutionDetailModal;
