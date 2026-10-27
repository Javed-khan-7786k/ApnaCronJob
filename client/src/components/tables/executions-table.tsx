import { useState, useMemo } from "react";
import type { Execution, ExecutionStatus } from "@/types";
import { formatDuration, relativeLabel } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  ExternalLink,
  Code,
  Clock,
  Layers,
} from "lucide-react";

export function ExecutionsTable({ executions }: { executions: Execution[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedExec, setSelectedExec] = useState<Execution | null>(null);

  const filtered = useMemo(() => {
    return executions.filter((e) => {
      const matchSearch =
        e.jobName.toLowerCase().includes(search.toLowerCase()) ||
        e.id.toLowerCase().includes(search.toLowerCase()) ||
        (e.errorDetail && e.errorDetail.toLowerCase().includes(search.toLowerCase()));

      const matchStatus = statusFilter === "all" || e.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [executions, search, statusFilter]);

  const renderStatusBadge = (status: ExecutionStatus, httpStatus: number | null) => {
    if (status === "success") {
      return (
        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-mono text-xs font-semibold">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
          <span>HTTP {httpStatus ?? 200}</span>
        </span>
      );
    }
    if (status === "retrying") {
      return (
        <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-mono text-xs font-semibold">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span>Retrying ({httpStatus ?? "Timeout"})</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-danger font-mono text-xs font-semibold">
        <XCircle className="h-3.5 w-3.5 shrink-0" />
        <span>Failed ({httpStatus ?? "Err"})</span>
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search execution ID, job, or error..."
            className="pl-8 text-xs font-mono"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <Button
            type="button"
            variant={statusFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("all")}
            className="text-xs h-8"
          >
            All Runs ({executions.length})
          </Button>
          <Button
            type="button"
            variant={statusFilter === "success" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("success")}
            className="text-xs h-8"
          >
            Success
          </Button>
          <Button
            type="button"
            variant={statusFilter === "retrying" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("retrying")}
            className="text-xs h-8"
          >
            Retries
          </Button>
          <Button
            type="button"
            variant={statusFilter === "failed" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("failed")}
            className="text-xs h-8"
          >
            Failures
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="border-b border-border bg-paper-sunken/60 text-muted-foreground uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-3">Run ID</th>
                <th className="py-3 px-3">Job Name</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Duration</th>
                <th className="py-3 px-3">Executed</th>
                <th className="py-3 px-3">Attempt</th>
                <th className="py-3 px-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground">
                    No executions matched your criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedExec(item)}
                    className="hover:bg-muted/30 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-3 font-semibold text-foreground">{item.id}</td>
                    <td className="py-3 px-3 font-sans font-medium text-foreground">
                      {item.jobName}
                    </td>
                    <td className="py-3 px-3">{renderStatusBadge(item.status, item.httpStatus)}</td>
                    <td className="py-3 px-3 text-foreground">{formatDuration(item.durationMs)}</td>
                    <td className="py-3 px-3 text-muted-foreground">
                      {relativeLabel(item.startedMinutesAgo)}
                    </td>
                    <td className="py-3 px-3">
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[11px]">
                        #{item.attempt}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[11px] font-mono"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedExec(item);
                        }}
                      >
                        Inspect
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Execution Detail Modal */}
      <Dialog open={!!selectedExec} onOpenChange={() => setSelectedExec(null)}>
        <DialogContent className="max-w-lg font-mono text-xs">
          <DialogHeader>
            <DialogTitle className="font-display text-base">
              Execution Record {selectedExec?.id}
            </DialogTitle>
            <DialogDescription className="font-sans text-xs">
              Recorded execution metrics and network dispatch telemetry across runner nodes.
            </DialogDescription>
          </DialogHeader>

          {selectedExec && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-lg border border-border bg-paper-sunken">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase block">
                    Job Name
                  </span>
                  <span className="font-semibold text-foreground">{selectedExec.jobName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase block">
                    Status Code
                  </span>
                  <div>{renderStatusBadge(selectedExec.status, selectedExec.httpStatus)}</div>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase block">
                    Duration
                  </span>
                  <span className="text-foreground">
                    {formatDuration(selectedExec.durationMs)} ({selectedExec.durationMs}ms)
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase block">
                    Attempt Number
                  </span>
                  <span className="text-foreground">Attempt #{selectedExec.attempt}</span>
                </div>
              </div>

              {selectedExec.errorDetail ? (
                <div>
                  <span className="text-[10px] text-danger uppercase block mb-1">
                    Captured Error Detail
                  </span>
                  <div className="rounded border border-danger/30 bg-danger-soft/30 p-2.5 text-danger font-mono text-xs">
                    {selectedExec.errorDetail}
                  </div>
                </div>
              ) : (
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase block mb-1">
                    Response Headers (Simulated)
                  </span>
                  <div className="rounded border border-border bg-muted/40 p-2.5 text-muted-foreground font-mono text-[11px] space-y-1">
                    <div>content-type: application/json; charset=utf-8</div>
                    <div>server: cloudflare</div>
                    <div>cf-ray: 8df4a029c782-BOM</div>
                    <div>strict-transport-security: max-age=31536000</div>
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <Button variant="outline" size="sm" onClick={() => setSelectedExec(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
