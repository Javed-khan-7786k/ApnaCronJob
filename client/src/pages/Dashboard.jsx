import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  CheckCircle,
  AlertOctagon,
  RotateCw,
  Calendar,
  Activity,
  Play,
  ArrowRight,
  ShieldCheck,
  Server,
} from 'lucide-react';
import api from '../api/client.js';
import StatusBadge from '../components/StatusBadge.jsx';
import ExecutionDetailModal from '../components/ExecutionDetailModal.jsx';
import { useToast } from '../context/ToastContext.jsx';

export function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentExecutions, setRecentExecutions] = useState([]);
  const [activeJobs, setActiveJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExecution, setSelectedExecution] = useState(null);
  const [runningJobId, setRunningJobId] = useState(null);
  const { showToast } = useToast();

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, execRes, jobsRes] = await Promise.all([
        api.get('/system/stats'),
        api.get('/executions?limit=6'),
        api.get('/jobs?enabled=true&limit=5'),
      ]);

      if (statsRes.data?.success) setStats(statsRes.data.data);
      if (execRes.data?.success) setRecentExecutions(execRes.data.data);
      if (jobsRes.data?.success) setActiveJobs(jobsRes.data.data);
    } catch (err) {
      showToast('Failed to load dashboard statistics', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleRunNow = async (job) => {
    try {
      setRunningJobId(job._id);
      const res = await api.post(`/jobs/${job._id}/run`);
      showToast(`Triggered "${job.name}": status ${res.data.status}`, 'success');
      loadDashboardData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to trigger job', 'error');
    } finally {
      setRunningJobId(null);
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <RotateCw className="w-6 h-6 animate-spin text-emerald-400" />
          <span className="text-sm">Connecting to Apna Scheduler OS...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner / System Status */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            Scheduler Overview
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Render Keepalive &bull; Distributed Retries &bull; Asia/Kolkata Timezone Engine
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-950 border border-slate-800">
            <span className={`w-2 h-2 rounded-full ${stats?.databaseConnected ? 'bg-emerald-400' : 'bg-rose-400'}`} />
            <span className="text-slate-300">MongoDB Atlas: {stats?.databaseConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-950 border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300">Engine: Active ({stats?.uptimeSeconds || 0}s)</span>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Jobs */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="text-xs text-slate-400 font-medium">Total Jobs</div>
          <div className="mt-2 text-2xl font-bold text-slate-100">{stats?.totalJobs || 0}</div>
          <div className="mt-1 text-[11px] text-emerald-400">{stats?.enabledJobs || 0} enabled</div>
        </div>

        {/* Upcoming in 24h */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="text-xs text-slate-400 font-medium">Upcoming (24h)</div>
          <div className="mt-2 text-2xl font-bold text-sky-400">{stats?.upcomingCount || 0}</div>
          <div className="mt-1 text-[11px] text-slate-400">Scheduled queues</div>
        </div>

        {/* Success 24h */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="text-xs text-slate-400 font-medium">Success (24h)</div>
          <div className="mt-2 text-2xl font-bold text-emerald-400">{stats?.success24h || 0}</div>
          <div className="mt-1 text-[11px] text-slate-400">HTTP ok executions</div>
        </div>

        {/* Failures 24h */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="text-xs text-slate-400 font-medium">Failures (24h)</div>
          <div className="mt-2 text-2xl font-bold text-rose-400">{stats?.failed24h || 0}</div>
          <div className="mt-1 text-[11px] text-slate-400">Terminal failures</div>
        </div>

        {/* Retrying Active */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="text-xs text-slate-400 font-medium">Active Retries</div>
          <div className="mt-2 text-2xl font-bold text-amber-400">{stats?.retryingCount || 0}</div>
          <div className="mt-1 text-[11px] text-slate-400">In backoff cycle</div>
        </div>

        {/* Last Success */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="text-xs text-slate-400 font-medium">Last Success</div>
          <div className="mt-2 text-xs font-semibold text-slate-200 truncate" title={stats?.lastSuccess?.jobName || 'None'}>
            {stats?.lastSuccess?.jobName || 'None yet'}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            {stats?.lastSuccess?.durationMs ? `${stats.lastSuccess.durationMs}ms` : '-'}
          </div>
        </div>
      </div>

      {/* Two Column Layout: Active Schedules & Recent Executions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Active Scheduled Jobs */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" /> Active Schedules
            </h3>
            <Link to="/jobs" className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="mt-3 flex-1 divide-y divide-slate-800/60">
            {activeJobs.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No active jobs. Click <Link to="/jobs/new" className="text-emerald-400 underline">Create Job</Link> to schedule your first URL.
              </div>
            ) : (
              activeJobs.map((job) => (
                <div key={job._id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-slate-200 truncate">{job.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono truncate mt-0.5">{job.targetUrl}</div>
                    <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                      <span>Schedule: {job.scheduleType}</span>
                      <span>&bull;</span>
                      <span>Next: {job.nextRunAt ? new Date(job.nextRunAt).toLocaleTimeString() : 'N/A'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={job.lastStatus} />
                    <button
                      onClick={() => handleRunNow(job)}
                      disabled={runningJobId === job._id}
                      title="Run Now"
                      className="p-1.5 rounded bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-300 transition-colors disabled:opacity-50"
                    >
                      <Play className={`w-3.5 h-3.5 ${runningJobId === job._id ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Recent Executions Log */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Activity className="w-4 h-4 text-sky-400" /> Recent Execution Stream
            </h3>
            <Link to="/executions" className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 font-medium">
              View History <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="mt-3 flex-1 divide-y divide-slate-800/60">
            {recentExecutions.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No execution history yet. Runs triggered by the scheduler or manually will appear here.
              </div>
            ) : (
              recentExecutions.map((exec) => (
                <div
                  key={exec._id}
                  onClick={() => setSelectedExecution(exec)}
                  className="py-3 flex items-center justify-between gap-3 text-xs hover:bg-slate-800/30 px-2 rounded-lg cursor-pointer transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-slate-200 truncate flex items-center gap-2">
                      {exec.jobName || 'Job Execution'}
                      <span className="text-[10px] text-slate-500 font-mono">({exec.triggerSource})</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                      {exec.responseStatus ? `HTTP ${exec.responseStatus}` : 'No response'} &bull; {exec.durationMs}ms &bull; Attempt {exec.attemptCount}/{exec.maxAttempts}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <StatusBadge status={exec.status} />
                    <span className="text-[11px] text-slate-500 font-mono">
                      {new Date(exec.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Execution Details Modal */}
      <ExecutionDetailModal
        execution={selectedExecution}
        isOpen={!!selectedExecution}
        onClose={() => setSelectedExecution(null)}
        onRefresh={loadDashboardData}
      />
    </div>
  );
}

export default Dashboard;
