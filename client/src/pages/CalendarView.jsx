import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, Play, RotateCw, ArrowRight } from 'lucide-react';
import api from '../api/client.js';
import StatusBadge from '../components/StatusBadge.jsx';
import { useToast } from '../context/ToastContext.jsx';

export function CalendarView() {
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [runningJobId, setRunningJobId] = useState(null);
  const { showToast } = useToast();

  const loadCalendarData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/jobs?enabled=true&limit=100');
      if (res.data?.success) {
        const jobs = res.data.data;
        const upcomingEvents = [];

        // For each active job, request upcoming previews
        await Promise.all(
          jobs.map(async (job) => {
            try {
              const prevRes = await api.post('/jobs/preview-schedule', {
                scheduleType: job.scheduleType,
                scheduleTime: job.scheduleTime,
                daysOfWeek: job.daysOfWeek,
                daysOfMonth: job.daysOfMonth,
                customCron: job.customCron,
                oneTimeRunAt: job.oneTimeRunAt,
                timezone: job.timezone,
              });
              if (prevRes.data?.success && Array.isArray(prevRes.data.previews)) {
                prevRes.data.previews.forEach((p) => {
                  upcomingEvents.push({
                    job,
                    date: new Date(p.date),
                    formatted: p.formatted,
                    relative: p.relative,
                  });
                });
              }
            } catch {
              // skip preview error
            }
          })
        );

        // Sort events chronologically
        upcomingEvents.sort((a, b) => a.date.getTime() - b.date.getTime());

        // Group by Day (YYYY-MM-DD)
        const groups = {};
        upcomingEvents.forEach((ev) => {
          const dayKey = ev.date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          });
          if (!groups[dayKey]) groups[dayKey] = [];
          groups[dayKey].push(ev);
        });

        setTimeline(Object.entries(groups).map(([day, events]) => ({ day, events })));
      }
    } catch (err) {
      showToast('Failed to load schedule timeline', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCalendarData();
  }, []);

  const handleRunNow = async (job) => {
    try {
      setRunningJobId(job._id);
      const res = await api.post(`/jobs/${job._id}/run`);
      showToast(`Triggered "${job.name}": status ${res.data.status}`, 'success');
      loadCalendarData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Execution failed', 'error');
    } finally {
      setRunningJobId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-emerald-400" /> Schedule Calendar & Timeline
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Visual forecast of upcoming job executions across configured timezones
          </p>
        </div>

        <button
          onClick={loadCalendarData}
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 transition-colors"
          title="Refresh forecast"
        >
          <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading && timeline.length === 0 ? (
        <div className="py-20 text-center text-xs text-slate-400">
          Calculating timeline forecasts...
        </div>
      ) : timeline.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-xs text-slate-400">
          No upcoming scheduled runs found. Ensure you have enabled active jobs.
        </div>
      ) : (
        <div className="space-y-6">
          {timeline.map(({ day, events }) => (
            <div key={day} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 font-semibold text-xs text-emerald-400 flex items-center justify-between">
                <span>{day}</span>
                <span className="text-[11px] font-mono text-slate-500">{events.length} run{events.length > 1 ? 's' : ''} scheduled</span>
              </div>

              <div className="divide-y divide-slate-800/60 p-2">
                {events.map((ev, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between gap-4 text-xs hover:bg-slate-850/40 rounded-lg transition-colors">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="font-mono text-xs font-bold text-slate-200 bg-slate-950 px-2.5 py-1 rounded border border-slate-800 shrink-0">
                        {ev.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-slate-200 truncate">{ev.job.name}</div>
                        <div className="text-[11px] font-mono text-slate-400 truncate mt-0.5">{ev.job.targetUrl}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">{ev.relative}</span>
                      <button
                        onClick={() => handleRunNow(ev.job)}
                        disabled={runningJobId === ev.job._id}
                        title="Trigger immediate execution"
                        className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-300 transition-colors text-[11px] disabled:opacity-50"
                      >
                        <Play className={`w-3 h-3 ${runningJobId === ev.job._id ? 'animate-spin' : ''}`} />
                        <span>Run Now</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CalendarView;
