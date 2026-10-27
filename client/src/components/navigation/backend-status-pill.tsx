import { useEffect, useState } from "react";
import { apiClient, type BackendHealth } from "@/lib/api-client";
import { DataStore } from "@/lib/data-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Server, RefreshCw, CheckCircle2, AlertTriangle, Database, Activity, Wifi } from "lucide-react";
import { toast } from "sonner";

export function BackendStatusPill() {
  const [health, setHealth] = useState<BackendHealth>({
    ok: false,
    status: "checking",
    latencyMs: 0,
    apiUrl: apiClient.getApiBaseUrl(),
  });
  const [syncing, setSyncing] = useState(false);
  const [checking, setChecking] = useState(false);
  const [open, setOpen] = useState(false);

  const checkStatus = async () => {
    setChecking(true);
    try {
      const res = await apiClient.checkHealth();
      setHealth(res);
      return res.ok;
    } finally {
      setChecking(false);
    }
  };

  const handleSyncData = async () => {
    setSyncing(true);
    toast.loading("Syncing data with Express + MongoDB backend...", { id: "sync-backend" });
    try {
      const ok = await DataStore.syncWithBackend();
      if (ok) {
        toast.success("Successfully synced all jobs, logs, and channels from backend!", { id: "sync-backend" });
      } else {
        toast.error("Could not reach backend at port 5000. Operating in offline cache mode.", { id: "sync-backend" });
      }
    } catch (err: any) {
      toast.error(`Sync error: ${err.message}`, { id: "sync-backend" });
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    async function initialProbe() {
      const ok = await checkStatus();
      if (ok && mounted) {
        // Automatically sync on initial load
        DataStore.syncWithBackend().catch(() => {});
      }
    }

    initialProbe();
    const timer = setInterval(checkStatus, 30000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  const formatUptime = (seconds?: number) => {
    if (!seconds) return "Just started";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-full border border-border bg-card/80 px-2.5 py-1 text-[11px] font-mono hover:bg-muted/60 transition-colors shadow-2xs"
          title="Click to view Backend API & Database status"
        >
          {health.status === "checking" ? (
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
          ) : health.ok ? (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
          ) : (
            <span className="h-2 w-2 rounded-full bg-rose-500" />
          )}

          <span className="text-muted-foreground hidden sm:inline">Backend:</span>
          <span className={health.ok ? "text-emerald-500 font-semibold" : "text-rose-500 font-semibold"}>
            {health.status === "checking" ? "Probing..." : health.ok ? `${health.latencyMs}ms` : "Offline"}
          </span>
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-md p-6 font-mono">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-foreground text-background">
              <Server className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold font-display">Backend Connection</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Express REST API & MongoDB Cluster Integration
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Connection Overview Card */}
          <div className={`p-4 rounded-lg border ${health.ok ? "bg-emerald-500/10 border-emerald-500/30" : "bg-rose-500/10 border-rose-500/30"}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {health.ok ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0" />
                )}
                <div>
                  <h4 className="text-xs font-bold text-foreground">
                    {health.ok ? "Backend Connected & Operational" : "Backend Server Not Responding"}
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    {health.ok ? "Sub-second scheduler engine listening at port 5000" : (health.error || "Connection refused")}
                  </p>
                </div>
              </div>
              <Badge variant={health.ok ? "default" : "destructive"} className="text-[10px]">
                {health.ok ? "ACTIVE" : "OFFLINE"}
              </Badge>
            </div>
          </div>

          {/* Details Table */}
          <div className="rounded-lg border border-border bg-card p-3 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Wifi className="h-3.5 w-3.5 text-cobalt" />
                API Base URL
              </span>
              <span className="font-semibold text-foreground text-[11px]">{health.apiUrl}</span>
            </div>

            <div className="flex items-center justify-between border-t border-border/60 pt-2">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-emerald-500" />
                Roundtrip Latency
              </span>
              <span className="font-semibold text-emerald-500">{health.latencyMs} ms</span>
            </div>

            <div className="flex items-center justify-between border-t border-border/60 pt-2">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Server className="h-3.5 w-3.5 text-amber-500" />
                Service Name
              </span>
              <span className="font-semibold text-foreground">{health.service || "aapna-cron-job"}</span>
            </div>

            <div className="flex items-center justify-between border-t border-border/60 pt-2">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Database className="h-3.5 w-3.5 text-violet-500" />
                Database Engine
              </span>
              <span className="font-semibold text-foreground">MongoDB (Port 27017)</span>
            </div>

            <div className="flex items-center justify-between border-t border-border/60 pt-2">
              <span className="text-muted-foreground">Server Uptime</span>
              <span className="font-semibold text-muted-foreground">{formatUptime(health.uptime)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2.5 pt-1">
            <Button
              type="button"
              variant="outline"
              disabled={checking}
              onClick={checkStatus}
              className="flex-1 h-9 text-xs font-mono border-border"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-2 ${checking ? "animate-spin" : ""}`} />
              Ping Backend
            </Button>

            <Button
              type="button"
              disabled={syncing || !health.ok}
              onClick={handleSyncData}
              className="flex-1 h-9 text-xs font-mono bg-foreground text-background hover:bg-foreground/90 font-semibold"
            >
              <Database className="h-3.5 w-3.5 mr-2" />
              {syncing ? "Syncing..." : "Sync Live Data"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
