import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import type { Job, JobStatus } from "@/types";
import { JobStatusBadge } from "@/components/jobs/job-status-badge";
import { humanizeCron, getNextRuns } from "@/lib/cron";
import { formatDuration, relativeLabel, shortFutureLabel } from "@/lib/format";
import { DataStore } from "@/lib/data-store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Search,
  MoreVertical,
  Play,
  Pause,
  ExternalLink,
  Trash2,
  Copy,
  Clock,
  ArrowUpDown,
  Filter,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

export interface JobsTableProps {
  initialJobs?: Job[];
  onJobSelect?: (job: Job) => void;
}

export function JobsTable({ initialJobs }: JobsTableProps) {
  const [jobs, setJobs] = useState<Job[]>(() => {
    const stored = DataStore.getJobs();
    return stored && stored.length > 0 ? stored : initialJobs || [];
  });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<"name" | "lastRun" | "rate">("name");
  const [sortAsc, setSortAsc] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);

  const navigate = useNavigate();

  // Reload on mount to sync with storage and live Express/MongoDB backend
  useEffect(() => {
    setJobs(DataStore.getJobs());
    DataStore.syncWithBackend().then((ok) => {
      if (ok) {
        setJobs(DataStore.getJobs());
      }
    });
  }, []);

  // Filter and sort jobs
  const filteredJobs = useMemo(() => {
    return jobs
      .filter((j) => {
        const matchesSearch =
          j.name.toLowerCase().includes(search.toLowerCase()) ||
          j.url.toLowerCase().includes(search.toLowerCase()) ||
          j.cron.includes(search);

        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "active" && j.enabled && j.status === "active") ||
          (statusFilter === "paused" && (!j.enabled || j.status === "paused")) ||
          (statusFilter === "failed" && j.lastStatus === "failed");

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortField === "name") diff = a.name.localeCompare(b.name);
        else if (sortField === "lastRun") {
          const aM = a.lastRunMinutesAgo ?? 999999;
          const bM = b.lastRunMinutesAgo ?? 999999;
          diff = aM - bM;
        } else if (sortField === "rate") {
          const aRate = a.successCount / (a.successCount + a.failureCount || 1);
          const bRate = b.successCount / (b.successCount + b.failureCount || 1);
          diff = aRate - bRate;
        }
        return sortAsc ? diff : -diff;
      });
  }, [jobs, search, statusFilter, sortField, sortAsc]);

  // Actions
  const handleToggleEnable = async (id: string) => {
    const updated = await DataStore.toggleJob(id);
    if (!updated) return;
    setJobs(DataStore.getJobs());
    toast.success(`Job “${updated.name}” ${updated.enabled ? "resumed" : "paused"}`);
  };

  const handleRunNow = async (job: Job) => {
    toast.loading(`Triggering run for “${job.name}” via Backend Engine...`, {
      id: `run-${job.id}`,
    });
    try {
      const exec = await DataStore.runJobNow(job.id);
      setJobs(DataStore.getJobs());
      toast.success(
        `Dispatched “${job.name}” (${exec.httpStatus || 200} ${exec.status.toUpperCase()} • ${exec.durationMs}ms). Recorded in MongoDB.`,
        { id: `run-${job.id}` },
      );
    } catch (err: any) {
      toast.error(`Failed to trigger “${job.name}”: ${err.message || "Execution failed"}`, {
        id: `run-${job.id}`,
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!jobToDelete) return;
    try {
      await DataStore.deleteJob(jobToDelete.id);
      setJobs(DataStore.getJobs());
      toast.success(`Job “${jobToDelete.name}” deleted permanently.`);
      setJobToDelete(null);
    } catch (err: any) {
      toast.error(`Failed to delete job: ${err.message || "Error occurred"}`);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredJobs.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredJobs.map((j) => j.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search jobs, URLs, or cron..."
            className="pl-8 text-xs font-mono"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <Button
            type="button"
            variant={statusFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("all")}
            className="text-xs h-8"
          >
            All ({jobs.length})
          </Button>
          <Button
            type="button"
            variant={statusFilter === "active" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("active")}
            className="text-xs h-8"
          >
            Active
          </Button>
          <Button
            type="button"
            variant={statusFilter === "paused" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("paused")}
            className="text-xs h-8"
          >
            Paused
          </Button>
          <Button
            type="button"
            variant={statusFilter === "failed" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("failed")}
            className="text-xs h-8"
          >
            Has Failures
          </Button>
        </div>
      </div>

      {/* Bulk actions banner if items selected */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-cobalt/30 bg-cobalt-soft/30 p-2.5 px-4 text-xs font-mono">
          <span>{selectedIds.size} job(s) selected</span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                selectedIds.forEach((id) => {
                  const target = jobs.find((j) => j.id === id);
                  if (target) DataStore.saveJob({ ...target, enabled: false, status: "paused" });
                });
                setJobs(DataStore.getJobs());
                toast.success(`Paused ${selectedIds.size} selected jobs.`);
                setSelectedIds(new Set());
              }}
              className="h-7 text-xs"
            >
              Pause Selected
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                selectedIds.forEach((id) => DataStore.deleteJob(id));
                setJobs(DataStore.getJobs());
                toast.success(`Deleted ${selectedIds.size} selected jobs.`);
                setSelectedIds(new Set());
              }}
              className="h-7 text-xs"
            >
              Delete Selected
            </Button>
          </div>
        </div>
      )}

      {/* Desktop Table View */}
      <div className="hidden md:block rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-left text-xs font-mono">
          <thead className="border-b border-border bg-paper-sunken/60 text-muted-foreground uppercase text-[10px] tracking-wider">
            <tr>
              <th className="py-3 px-3 w-8">
                <Checkbox
                  checked={selectedIds.size === filteredJobs.length && filteredJobs.length > 0}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Select all jobs"
                />
              </th>
              <th className="py-3 px-3">
                <button
                  onClick={() => {
                    setSortField("name");
                    setSortAsc(!sortAsc);
                  }}
                  className="flex items-center gap-1 hover:text-foreground"
                >
                  <span>Job Name & Target</span>
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="py-3 px-3">Schedule</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-3">
                <button
                  onClick={() => {
                    setSortField("lastRun");
                    setSortAsc(!sortAsc);
                  }}
                  className="flex items-center gap-1 hover:text-foreground"
                >
                  <span>Last Run</span>
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="py-3 px-3">Next Run</th>
              <th className="py-3 px-3">
                <button
                  onClick={() => {
                    setSortField("rate");
                    setSortAsc(!sortAsc);
                  }}
                  className="flex items-center gap-1 hover:text-foreground"
                >
                  <span>Success Rate</span>
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="py-3 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {filteredJobs.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-muted-foreground">
                  No jobs matched your filters.
                </td>
              </tr>
            ) : (
              filteredJobs.map((job) => {
                const nextRuns = getNextRuns(job.cron, { count: 1 });
                const nextRun = nextRuns[0];
                const nextMs = nextRun ? nextRun.getTime() - Date.now() : null;
                const totalRuns = job.successCount + job.failureCount;
                const successRate = totalRuns
                  ? ((job.successCount / totalRuns) * 100).toFixed(1)
                  : "100.0";

                return (
                  <tr key={job.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="py-3 px-3">
                      <Checkbox
                        checked={selectedIds.has(job.id)}
                        onCheckedChange={() => toggleSelectOne(job.id)}
                        aria-label={`Select ${job.name}`}
                      />
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex flex-col font-sans">
                        <Link
                          to="/app/jobs/$jobId"
                          params={{ jobId: job.id }}
                          className="font-semibold text-foreground hover:text-cobalt hover:underline text-xs"
                        >
                          {job.name}
                        </Link>
                        <div className="flex items-center gap-2 mt-0.5 font-mono text-[11px] text-muted-foreground">
                          <span className="font-semibold text-foreground/80 uppercase">
                            {job.method}
                          </span>
                          <span className="truncate max-w-[220px]">{job.url}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground">{job.cron}</span>
                        <span className="text-[10px] text-muted-foreground font-sans truncate max-w-[150px]">
                          {humanizeCron(job.cron)}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <JobStatusBadge status={job.enabled ? job.status : "paused"} />
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex flex-col">
                        <span className="text-foreground">
                          {relativeLabel(job.lastRunMinutesAgo)}
                        </span>
                        {job.lastDurationMs != null && (
                          <span className="text-[10px] text-muted-foreground">
                            {formatDuration(job.lastDurationMs)}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="text-foreground">
                        {job.enabled ? shortFutureLabel(nextMs) : "Paused"}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`font-semibold ${
                            Number(successRate) > 95
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-amber-600"
                          }`}
                        >
                          {successRate}%
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          ({job.successCount}/{totalRuns})
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRunNow(job)}
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          title="Trigger Run Now"
                        >
                          <Play className="h-3.5 w-3.5" />
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            >
                              <MoreVertical className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40 text-xs font-mono">
                            <DropdownMenuItem
                              onClick={() => navigate({ to: `/app/jobs/${job.id}` })}
                            >
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleEnable(job.id)}>
                              {job.enabled ? "Pause Schedule" : "Resume Schedule"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                navigator.clipboard.writeText(job.url);
                                toast.success("URL copied");
                              }}
                            >
                              Copy Endpoint URL
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-danger focus:text-danger"
                              onClick={() => setJobToDelete(job)}
                            >
                              Delete Job
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List View */}
      <div className="md:hidden space-y-3">
        {filteredJobs.map((job) => (
          <div key={job.id} className="rounded-lg border border-border bg-card p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <Link
                  to="/app/jobs/$jobId"
                  params={{ jobId: job.id }}
                  className="font-semibold text-sm text-foreground hover:underline"
                >
                  {job.name}
                </Link>
                <div className="text-xs font-mono text-muted-foreground mt-0.5 truncate max-w-[240px]">
                  {job.method} {job.url}
                </div>
              </div>
              <JobStatusBadge status={job.enabled ? job.status : "paused"} />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono border-t border-border/60 pt-2 text-muted-foreground">
              <div>
                <span className="text-[10px] uppercase block">Schedule:</span>
                <span className="text-foreground">{job.cron}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase block">Last Run:</span>
                <span className="text-foreground">{relativeLabel(job.lastRunMinutesAgo)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-border/60 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRunNow(job)}
                className="h-7 text-xs font-mono"
              >
                <Play className="h-3 w-3 mr-1" />
                Run Now
              </Button>

              <Link to="/app/jobs/$jobId" params={{ jobId: job.id }}>
                <Button variant="ghost" size="sm" className="h-7 text-xs font-mono">
                  Details →
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Confirmation Dialog for Deletion */}
      <AlertDialog open={!!jobToDelete} onOpenChange={() => setJobToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete scheduled job?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete “{jobToDelete?.name}”? All future scheduled
              executions, retry rules, and alert hooks for this job will be stopped.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-danger text-danger-foreground hover:bg-danger/90"
            >
              Delete Job
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
