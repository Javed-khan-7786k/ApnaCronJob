import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  Play,
  Pause,
  Copy,
  Edit,
  Trash2,
  ExternalLink,
  RotateCw,
  Clock,
  Tag,
} from 'lucide-react';
import api from '../api/client.js';
import StatusBadge from '../components/StatusBadge.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import { useToast } from '../context/ToastContext.jsx';

export function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [enabledFilter, setEnabledFilter] = useState('');
  const [deleteJobTarget, setDeleteJobTarget] = useState(null);
  const [runningJobId, setRunningJobId] = useState(null);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const loadJobs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      if (enabledFilter) params.append('enabled', enabledFilter);

      const res = await api.get(`/jobs?${params.toString()}`);
      if (res.data?.success) {
        setJobs(res.data.data);
      }
    } catch (err) {
      showToast('Failed to fetch scheduled jobs', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, [statusFilter, enabledFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadJobs();
  };

  const handleRunNow = async (job) => {
    try {
      setRunningJobId(job._id);
      const res = await api.post(`/jobs/${job._id}/run`);
      showToast(`Manual run completed for "${job.name}" with status ${res.data.status}`, 'success');
      loadJobs();
    } catch (err) {
      showToast(err.response?.data?.error || 'Manual execution failed', 'error');
    } finally {
      setRunningJobId(null);
    }
  };

  const handleToggle = async (job) => {
    try {
      const res = await api.post(`/jobs/${job._id}/toggle`);
      showToast(`Job ${res.data.data.enabled ? 'enabled' : 'paused'} successfully`, 'success');
      loadJobs();
    } catch (err) {
      showToast('Failed to toggle job state', 'error');
    }
  };

  const handleDuplicate = async (job) => {
    try {
      const res = await api.post(`/jobs/${job._id}/duplicate`);
      showToast(`Duplicated job as "${res.data.data.name}"`, 'success');
      loadJobs();
    } catch (err) {
      showToast('Failed to duplicate job', 'error');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteJobTarget) return;
    try {
      await api.delete(`/jobs/${deleteJobTarget._id}`);
      showToast(`Job "${deleteJobTarget.name}" deleted successfully`, 'success');
      setDeleteJobTarget(null);
      loadJobs();
    } catch (err) {
      showToast('Failed to delete job', 'error');
    }
  };

  return (
    <div className="space-y-5">
      {/* Header and Create Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Scheduled Jobs</h2>
          <p className="text-xs text-slate-400 mt-1">
            Configure HTTP target webhooks, recurrence rules, retries, and failure alerts
          </p>
        </div>
        <Link
          to="/jobs/new"
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" /> Create New Job
        </Link>
      </div>

      {/* Filters Bar */}
      <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by job name, URL or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </form>

        <div className="flex items-center gap-2 shrink-0">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Statuses</option>
            <option value="success">Success</option>
            <option value="failure">Failure</option>
            <option value="retrying">Retrying</option>
            <option value="never_run">Never Run</option>
          </select>

          <select
            value={enabledFilter}
            onChange={(e) => setEnabledFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="">All States</option>
            <option value="true">Active Only</option>
            <option value="false">Paused Only</option>
          </select>

          <button
            onClick={loadJobs}
            title="Refresh list"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Jobs List / Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {loading && jobs.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading jobs...</div>
        ) : jobs.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500 space-y-2">
            <div>No scheduled jobs found matching your filters.</div>
            <div>
              <Link to="/jobs/new" className="text-emerald-400 underline font-medium">Create your first job</Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Job Name & Target URL</th>
                  <th className="py-3 px-4">Schedule</th>
                  <th className="py-3 px-4">Next Run</th>
                  <th className="py-3 px-4">Last Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {jobs.map((job) => (
                  <tr key={job._id} className="hover:bg-slate-850 transition-colors">
                    <td className="py-3.5 px-4 max-w-xs sm:max-w-md">
                      <div className="font-semibold text-slate-100 flex items-center gap-2 truncate">
                        <span>{job.name}</span>
                        {!job.enabled && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                            Paused
                          </span>
                        )}
                      </div>
                      <div className="font-mono text-[11px] text-slate-400 truncate mt-0.5 flex items-center gap-1.5">
                        <span className="font-bold text-emerald-400">{job.httpMethod}</span>
                        <span className="truncate">{job.targetUrl}</span>
                      </div>
                      {Array.isArray(job.tags) && job.tags.length > 0 && (
                        <div className="flex items-center gap-1 mt-1.5">
                          {job.tags.map((t, idx) => (
                            <span key={idx} className="text-[10px] bg-slate-800/80 text-slate-400 px-1.5 py-0.2 rounded">
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-medium capitalize text-slate-200">{job.scheduleType}</div>
                      <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                        {job.scheduleType === 'custom' ? job.customCron : (job.cronExpression || job.scheduleTime || 'Once')}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {job.enabled && job.nextRunAt ? (
                        <div>
                          <div className="text-slate-200 font-mono text-xs">
                            {new Date(job.nextRunAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {new Date(job.nextRunAt).toLocaleDateString()}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">None</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={job.lastStatus} />
                      {job.lastRunAt && (
                        <div className="text-[10px] text-slate-500 mt-1">
                          Last: {new Date(job.lastRunAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Run Now */}
                        <button
                          onClick={() => handleRunNow(job)}
                          disabled={runningJobId === job._id}
                          title="Run Job Now"
                          className="p-1.5 rounded bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-300 transition-colors disabled:opacity-50"
                        >
                          <Play className={`w-3.5 h-3.5 ${runningJobId === job._id ? 'animate-spin' : ''}`} />
                        </button>

                        {/* Toggle Enable/Pause */}
                        <button
                          onClick={() => handleToggle(job)}
                          title={job.enabled ? 'Pause Job' : 'Enable Job'}
                          className={`p-1.5 rounded transition-colors ${
                            job.enabled
                              ? 'bg-slate-800 hover:bg-amber-600 hover:text-white text-slate-300'
                              : 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white border border-emerald-500/30'
                          }`}
                        >
                          {job.enabled ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => navigate(`/jobs/edit/${job._id}`)}
                          title="Edit Job"
                          className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        {/* Duplicate */}
                        <button
                          onClick={() => handleDuplicate(job)}
                          title="Duplicate Job"
                          className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => setDeleteJobTarget(job)}
                          title="Delete Job"
                          className="p-1.5 rounded bg-slate-800 hover:bg-rose-600 hover:text-white text-slate-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteJobTarget}
        title="Delete Scheduled Job"
        message={`Are you sure you want to permanently delete "${deleteJobTarget?.name}"? All associated future executions will stop.`}
        confirmText="Delete Job"
        isDestructive={true}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteJobTarget(null)}
      />
    </div>
  );
}

export default Jobs;
