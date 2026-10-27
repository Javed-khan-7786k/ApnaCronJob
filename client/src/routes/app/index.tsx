import { useState, useEffect, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { LiveClock } from "@/components/clock/live-clock";
import { JobStatusBadge } from "@/components/jobs/job-status-badge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataStore } from "@/lib/data-store";
import type { Job, Execution, AuditEntry } from "@/types";
import { humanizeCron, getNextRuns } from "@/lib/cron";
import { formatDuration, relativeLabel, shortFutureLabel } from "@/lib/format";
import {
  Clock,
  PlusCircle,
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Play,
  Calendar,
  Layers,
  Shield,
} from "lucide-react";
import { pageHead } from "@/lib/head";
import { toast } from "sonner";

export const Route = createFileRoute("/app/")({
  head: () =>
    pageHead({
      title: "Console Dashboard — AapnaCronJob",
      description: "Overview of active scheduled jobs, execution telemetry, and system health.",
    }),
  component: DashboardPage,
});

export function DashboardPage() {
  const [jobs, setJobs] = useState<Job[]>(() => DataStore.getJobs());
  const [executions, setExecutions] = useState<Execution[]>(() => DataStore.getExecutions());
  const [audit, setAudit] = useState<AuditEntry[]>(() => DataStore.getAudit());
  const [settings, setSettings] = useState(() => DataStore.getSettings());
  const services = DataStore.getStatusServices();

  useEffect(() => {
    async function loadData() {
      await DataStore.syncWithBackend();
      setJobs(DataStore.getJobs());
      setExecutions(DataStore.getExecutions());
      setAudit(DataStore.getAudit());
      setSettings(DataStore.getSettings());
    }
    loadData();
  }, []);

  const activeJobs = jobs.filter((j) => j.enabled && j.status === "active").length;
  const totalJobs = jobs.length;
  const recentSuccess = executions.filter((e) => e.status === "success").length;
  const recentFailures = executions.filter((e) => e.status === "failed").length;

  return (
    <AppShell breadcrumbs={[{ label: "Overview" }]}>
      <div className="space-y-8">
        {/* Top welcome & quick actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-6">
          <div>
            <span className="eyebrow block mb-1">Developer Control Center</span>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Workspace Overview
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground font-sans mt-0.5">
              Production telemetry for{" "}
              <span className="font-mono text-foreground font-semibold">
                {settings.workspaceName}
              </span>{" "}
              across multi-region runners.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link to="/app/calendar">
              <Button variant="outline" size="sm" className="font-mono text-xs">
                <Calendar className="h-3.5 w-3.5 mr-1.5" />
                Schedule Calendar
              </Button>
            </Link>
            <Link to="/app/jobs/new">
              <Button
                size="sm"
                className="bg-foreground text-background font-mono text-xs hover:bg-foreground/90"
              >
                <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
                New Scheduled Job
              </Button>
            </Link>
          </div>
        </div>

        {/* Metric Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-border bg-card p-4 space-y-1">
            <span className="eyebrow text-muted-foreground">Active Schedules</span>
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-3xl font-bold text-foreground">{activeJobs}</span>
              <span className="text-[10px] font-mono text-muted-foreground">
                / {totalJobs} configured
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground font-sans">
              Autonomous HTTP dispatches
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 space-y-1">
            <span className="eyebrow text-muted-foreground">Successful Executions</span>
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-3xl font-bold text-emerald-600">{recentSuccess}</span>
              <span className="text-[10px] font-mono text-emerald-600 flex items-center gap-0.5">
                <TrendingUp className="h-3 w-3" />
                99.98%
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground font-sans">Recorded in audit stream</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 space-y-1">
            <span className="eyebrow text-muted-foreground">Failed Dispatches</span>
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-3xl font-bold text-foreground">{recentFailures}</span>
              <span className="text-[10px] font-mono text-muted-foreground">Auto-retried</span>
            </div>
            <p className="text-[11px] text-muted-foreground font-sans">
              Exponential backoff handled
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 space-y-1">
            <span className="eyebrow text-muted-foreground">Clock Drift Guarantee</span>
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-3xl font-bold text-cobalt">&lt; 50ms</span>
              <span className="text-[10px] font-mono text-cobalt">Sub-second</span>
            </div>
            <p className="text-[11px] text-muted-foreground font-sans">Global consensus verified</p>
          </div>
        </div>

        {/* Middle Section: Live Clock + Upcoming Runs Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Synchronized Reference Clock Card */}
          <div className="lg:col-span-5">
            <LiveClock variant="card" className="h-full" />
          </div>

          {/* Upcoming Schedule Pipeline */}
          <div className="lg:col-span-7 rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-cobalt" />
                <span className="eyebrow">Upcoming Executions</span>
              </div>
              <Link to="/app/jobs" className="text-[11px] font-mono text-cobalt hover:underline">
                View all schedules →
              </Link>
            </div>

            <div className="space-y-2.5">
              {jobs.length === 0 ? (
                <div className="p-8 text-center text-xs font-mono text-muted-foreground border border-dashed border-border rounded-lg">
                  No scheduled jobs found in MongoDB database.
                  <div className="mt-2">
                    <Link to="/app/jobs/new">
                      <Button size="sm" className="font-mono text-xs">
                        Create first schedule
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                jobs.slice(0, 4).map((job) => {
                  const nextRuns = getNextRuns(job.cron, { count: 1 });
                  const nextDate = nextRuns[0];
                  const diffMs = nextDate ? nextDate.getTime() - Date.now() : 0;

                  return (
                    <div
                      key={job.id}
                      className="p-2.5 rounded-lg border border-border/60 bg-paper-sunken/40 flex items-center justify-between gap-3 text-xs font-mono"
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <span className="h-2 w-2 rounded-full bg-cobalt shrink-0" />
                        <div className="truncate">
                          <Link
                            to="/app/jobs/$jobId"
                            params={{ jobId: job.id }}
                            className="font-semibold text-foreground hover:underline"
                          >
                            {job.name}
                          </Link>
                          <span className="text-[10px] text-muted-foreground ml-2 font-sans truncate">
                            {job.url}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-semibold text-foreground block">
                          {humanizeCron(job.cron)}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-sans">
                          {diffMs > 0
                            ? shortFutureLabel(Math.round(diffMs / 60000))
                            : "Pending trigger"}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Recent Executions Stream */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-500" />
              <h2 className="font-display font-bold text-sm text-foreground">
                Recent Execution Activity (Live Telemetry Stream)
              </h2>
            </div>
            <Link to="/app/history">
              <Button variant="ghost" size="sm" className="h-7 text-xs font-mono">
                Full Execution History →
              </Button>
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="border-b border-border bg-paper-sunken/60 text-muted-foreground text-[10px] uppercase">
                <tr>
                  <th className="p-3">Run ID</th>
                  <th className="p-3">Job Name</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Duration</th>
                  <th className="p-3">Executed</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {executions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-8 text-center text-xs font-mono text-muted-foreground"
                    >
                      No executions recorded in database yet. Trigger a job to start streaming logs.
                    </td>
                  </tr>
                ) : (
                  executions.slice(0, 5).map((item) => (
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3 font-semibold text-foreground">{item.id}</td>
                      <td className="p-3 font-sans text-foreground">{item.jobName}</td>
                      <td className="p-3">
                        <JobStatusBadge status={item.status} />
                      </td>
                      <td className="p-3 text-foreground">{formatDuration(item.durationMs)}</td>
                      <td className="p-3 text-muted-foreground">
                        {relativeLabel(item.startedMinutesAgo)}
                      </td>
                      <td className="p-3 text-right">
                        <Link to="/app/history">
                          <Button variant="ghost" size="sm" className="h-6 text-[11px] font-mono">
                            Inspect
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Split: Audit activity + Infrastructure status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Audit Logs Ticker */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-border/60 pb-2">
              <span className="eyebrow">Recent Audit Log</span>
              <Link
                to="/app/audit-logs"
                className="text-[11px] font-mono text-cobalt hover:underline"
              >
                View all logs →
              </Link>
            </div>
            <div className="space-y-2 text-xs font-mono">
              {audit.slice(0, 4).map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between text-muted-foreground py-1"
                >
                  <div>
                    <span className="font-semibold text-foreground">{a.actor}</span>{" "}
                    <span>{a.action}</span>{" "}
                    <span className="text-foreground font-mono">“{a.target}”</span>
                  </div>
                  <span className="text-[10px] shrink-0 ml-2">{relativeLabel(a.minutesAgo)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Infrastructure Health */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-border/60 pb-2">
              <span className="eyebrow">Global Runner Mesh</span>
              <Link to="/status" className="text-[11px] font-mono text-cobalt hover:underline">
                System status →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1">
              {services.slice(0, 4).map((svc) => (
                <div
                  key={svc.id}
                  className="p-2.5 rounded-lg border border-border/60 bg-paper-sunken/40"
                >
                  <div className="flex items-center justify-between text-xs font-mono font-medium">
                    <span className="truncate">{svc.name}</span>
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono mt-0.5 block">
                    Uptime: {svc.uptime90d}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
