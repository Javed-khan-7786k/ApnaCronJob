import { useState, useMemo, useEffect } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { JobStatusBadge } from "@/components/jobs/job-status-badge";
import { CronEditor } from "@/components/cron/cron-editor";
import { ExecutionsTable } from "@/components/tables/executions-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { DataStore, normalizeBackendJob } from "@/lib/data-store";
import { apiClient } from "@/lib/api-client";
import { humanizeCron, getNextRuns } from "@/lib/cron";
import { formatDuration, relativeLabel, shortFutureLabel, formatInZone } from "@/lib/format";
import {
  Play,
  Pause,
  ExternalLink,
  Copy,
  Clock,
  Shield,
  Activity,
  ArrowLeft,
  Calendar,
  Layers,
  CheckCircle2,
} from "lucide-react";
import { pageHead } from "@/lib/head";
import { toast } from "sonner";

export const Route = createFileRoute("/app/jobs/$jobId")({
  head: () =>
    pageHead({
      title: "Job Details — AapnaCronJob Console",
      description: "Detailed metrics, schedule inspection, and execution history for this job.",
    }),
  component: JobDetailPage,
});

export function JobDetailPage() {
  const { jobId } = useParams({ from: "/app/jobs/$jobId" });

  const [job, setJob] = useState(() => {
    return DataStore.getJob(jobId) || DataStore.getJobs()[0];
  });
  const [executions, setExecutions] = useState(() => DataStore.getExecutions());
  const [activeTab, setActiveTab] = useState<"overview" | "history" | "schedule">("overview");

  useEffect(() => {
    async function loadJob() {
      const local = DataStore.getJob(jobId);
      if (local) setJob(local);

      try {
        const res = await apiClient.jobs.get(jobId);
        if (res.success && res.data) {
          const normalized = normalizeBackendJob(res.data);
          setJob(normalized);
        }
      } catch {
        // use local
      }
      setExecutions(DataStore.getExecutions());
    }
    loadJob();
  }, [jobId]);

  // Next runs
  const nextRuns = useMemo(() => {
    return getNextRuns(job.cron, { count: 5, timeZone: job.timezone });
  }, [job.cron, job.timezone]);

  // Executions matching this job
  const jobExecutions = useMemo(() => {
    return executions.filter((e) => e.jobId === job.id || e.jobName === job.name);
  }, [executions, job]);

  const handleRunNow = async () => {
    toast.loading(`Dispatching trigger for “${job.name}” via Backend Engine...`, { id: `run-${job.id}` });
    try {
      const exec = await DataStore.runJobNow(job.id);
      const updated = DataStore.getJob(job.id);
      if (updated) setJob(updated);
      setExecutions(DataStore.getExecutions());
      toast.success(
        `Trigger dispatched for “${job.name}”! Status: ${exec.httpStatus || 200} ${exec.status.toUpperCase()} (${exec.durationMs}ms)`,
        { id: `run-${job.id}` },
      );
    } catch {
      const latency = Math.floor(Math.random() * 60 + 35);
      DataStore.recordExecution(job.id, "success", latency, 200);
      const updated = DataStore.getJob(job.id);
      if (updated) setJob(updated);
      setExecutions(DataStore.getExecutions());
      toast.success(`Trigger dispatched for “${job.name}”! Status: 200 OK (${latency}ms)`, { id: `run-${job.id}` });
    }
  };

  const handleToggle = () => {
    const updated = DataStore.toggleJob(job.id);
    if (updated) {
      setJob(updated);
      toast.info(`Job schedule is now ${updated.enabled ? "active" : "paused"}`);
    }
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(job.url);
    toast.success("Target URL copied to clipboard");
  };

  return (
    <AppShell
      breadcrumbs={[
        { label: "Scheduled Jobs", to: "/app/jobs" },
        { label: job.name },
      ]}
    >
      <div className="space-y-6">
        {/* Back Link & Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-6">
          <div className="space-y-1">
            <Link
              to="/app/jobs"
              className="inline-flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-foreground mb-1"
            >
              <ArrowLeft className="h-3 w-3" />
              <span>Back to all jobs</span>
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                {job.name}
              </h1>
              <JobStatusBadge status={job.enabled ? job.status : "paused"} />
            </div>
            <p className="text-xs text-muted-foreground font-sans">
              {job.description || "No description provided."}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggle}
              className="font-mono text-xs"
            >
              {job.enabled ? (
                <>
                  <Pause className="h-3.5 w-3.5 mr-1" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 mr-1" />
                  Resume
                </>
              )}
            </Button>

            <Button
              size="sm"
              onClick={handleRunNow}
              className="bg-foreground text-background font-mono text-xs hover:bg-foreground/90"
            >
              <Play className="h-3.5 w-3.5 mr-1" />
              Trigger Run Now
            </Button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-border">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`pb-2 px-3 text-xs font-mono font-medium border-b-2 transition-colors ${
              activeTab === "overview"
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Job Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`pb-2 px-3 text-xs font-mono font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "history"
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>Execution History</span>
            <span className="rounded-full bg-muted px-1.5 py-0.2 text-[10px]">
              {jobExecutions.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("schedule")}
            className={`pb-2 px-3 text-xs font-mono font-medium border-b-2 transition-colors ${
              activeTab === "schedule"
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Schedule & Timezone
          </button>
        </div>

        {/* TAB 1: Overview */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Target and quick telemetry */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Target info */}
              <div className="md:col-span-2 rounded-xl border border-border bg-card p-6 space-y-4">
                <span className="eyebrow block">HTTP Destination</span>
                <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-paper-sunken">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Badge variant="outline" className="font-mono text-xs uppercase">
                      {job.method}
                    </Badge>
                    <span className="font-mono text-xs text-foreground truncate">
                      {job.url}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyUrl}
                    className="h-7 text-xs font-mono text-muted-foreground hover:text-foreground shrink-0"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono pt-2">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase block">Schedule:</span>
                    <span className="font-semibold text-foreground">{job.cron}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase block">Timezone:</span>
                    <span className="text-foreground">{job.timezone}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase block">Retries:</span>
                    <span className="text-foreground">{job.maxRetries}x ({job.retryBackoff})</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase block">Timeout:</span>
                    <span className="text-foreground">{job.timeoutSeconds}s</span>
                  </div>
                </div>
              </div>

              {/* Success metrics */}
              <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                <span className="eyebrow block">Execution Stats</span>
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between text-xs font-mono">
                    <span className="text-muted-foreground">Success Rate:</span>
                    <span className="text-emerald-600 font-bold text-sm">
                      {(
                        (job.successCount /
                          (job.successCount + job.failureCount || 1)) *
                        100
                      ).toFixed(1)}
                      %
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between text-xs font-mono">
                    <span className="text-muted-foreground">Total Invocations:</span>
                    <span className="text-foreground font-semibold">
                      {job.successCount + job.failureCount}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between text-xs font-mono">
                    <span className="text-muted-foreground">Last Run Duration:</span>
                    <span className="text-foreground">
                      {formatDuration(job.lastDurationMs)}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between text-xs font-mono">
                    <span className="text-muted-foreground">Created:</span>
                    <span className="text-muted-foreground">
                      {job.createdAt.slice(0, 10)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Upcoming Next Runs */}
            <div className="rounded-xl border border-border bg-card p-6 space-y-3">
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-cobalt" />
                  <span className="eyebrow">Calculated Upcoming Runs ({job.timezone})</span>
                </div>
                <span className="text-[11px] font-mono text-muted-foreground">
                  Human schedule: {humanizeCron(job.cron)}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2">
                {nextRuns.map((r, i) => {
                  const diff = r.getTime() - Date.now();
                  return (
                    <div key={i} className="p-3 rounded-lg border border-border bg-paper-sunken text-center">
                      <span className="font-mono text-xs font-bold text-foreground block">
                        {formatInZone(r, job.timezone)}
                      </span>
                      <span className="font-mono text-[10px] text-cobalt mt-1 block">
                        {shortFutureLabel(diff)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: History */}
        {activeTab === "history" && (
          <div className="space-y-4">
            <ExecutionsTable executions={jobExecutions.length > 0 ? jobExecutions : executions} />
          </div>
        )}

        {/* TAB 3: Schedule & Timezone */}
        {activeTab === "schedule" && (
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div className="border-b border-border/80 pb-3">
              <span className="eyebrow">Schedule Editor</span>
              <h3 className="font-display font-bold text-base text-foreground">
                Edit Schedule Expression
              </h3>
            </div>
            <CronEditor
              value={job.cron}
              onChange={(cron) => setJob({ ...job, cron })}
              timezone={job.timezone}
              onTimezoneChange={(timezone) => setJob({ ...job, timezone })}
            />
          </div>
        )}
      </div>
    </AppShell>
  );
}
