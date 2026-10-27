import { Badge } from "@/components/ui/badge";
import type { JobStatus, ExecutionStatus } from "@/types";

export function JobStatusBadge({
  status,
  className = "",
}: {
  status: JobStatus | ExecutionStatus | string;
  className?: string;
}) {
  switch (status) {
    case "active":
    case "success":
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[11px] font-medium text-emerald-600 dark:text-emerald-400 ${className}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span className="capitalize">{status}</span>
        </span>
      );

    case "running":
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border border-cobalt/30 bg-cobalt-soft/40 px-2.5 py-0.5 font-mono text-[11px] font-medium text-cobalt ${className}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-cobalt animate-ping" />
          <span>Running</span>
        </span>
      );

    case "retrying":
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 font-mono text-[11px] font-medium text-amber-600 dark:text-amber-400 ${className}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
          <span>Retrying</span>
        </span>
      );

    case "failed":
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border border-danger/30 bg-danger-soft/40 px-2.5 py-0.5 font-mono text-[11px] font-medium text-danger ${className}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-danger" />
          <span>Failed</span>
        </span>
      );

    case "paused":
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-2.5 py-0.5 font-mono text-[11px] font-medium text-muted-foreground ${className}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
          <span className="capitalize">{status}</span>
        </span>
      );
  }
}
