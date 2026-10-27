import { ShieldCheck, Activity, Globe, X } from "lucide-react";
import { useState } from "react";
import { Link } from "@tanstack/react-router";

export function DemoBanner({ className = "" }: { className?: string }) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div
      className={`relative flex items-center justify-between border-b border-border bg-paper-sunken/80 px-4 py-1.5 text-xs font-mono text-foreground backdrop-blur-xs ${className}`}
      role="status"
      aria-label="Engine Status"
    >
      <div className="flex items-center gap-2 overflow-hidden">
        <span className="flex h-2 w-2 shrink-0 rounded-full bg-emerald-500 animate-pulse" />
        <span className="font-semibold text-foreground tracking-wide shrink-0">
          AAPNACRONJOB RUNNER ENGINE:
        </span>
        <span className="text-muted-foreground truncate">
          Active • 4 Runner Regions Online (Frankfurt, Mumbai, Virginia, Oregon) • Sub-second Precision Guard
        </span>
      </div>

      <div className="flex items-center gap-3 shrink-0 ml-3">
        <Link
          to="/status"
          className="inline-flex items-center gap-1 text-[11px] text-cobalt hover:underline"
        >
          <Activity className="h-3 w-3" />
          <span>System Status (99.99%)</span>
        </Link>
        <button
          onClick={() => setDismissed(true)}
          className="text-muted-foreground hover:text-foreground p-0.5 rounded"
          title="Dismiss status bar"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
