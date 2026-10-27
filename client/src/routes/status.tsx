import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/navigation/site-header";
import { SiteFooter } from "@/components/navigation/site-footer";
import { Badge } from "@/components/ui/badge";
import { demoStatusServices } from "@/lib/demo-data";
import { apiClient } from "@/lib/api-client";
import { CheckCircle2, AlertTriangle, ShieldCheck, Activity } from "lucide-react";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/status")({
  head: () =>
    pageHead({
      title: "System Status — AapnaCronJob",
      description:
        "Live operational status of AapnaCronJob's global runners, APIs, and webhook dispatch network.",
    }),
  component: StatusPage,
});

export function StatusPage() {
  const [liveHealth, setLiveHealth] = useState<{
    status?: string;
    uptime?: number;
    timestamp?: string;
  } | null>(null);
  const [isLiveChecked, setIsLiveChecked] = useState(false);

  useEffect(() => {
    apiClient.system
      .getHealth()
      .then((res: any) => {
        if (res.status === "ok" || res.success) {
          setLiveHealth(res);
        }
        setIsLiveChecked(true);
      })
      .catch(() => {
        setIsLiveChecked(true);
      });
  }, []);

  const isHealthy = !isLiveChecked || (liveHealth && liveHealth.status === "ok");

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <SiteHeader />

      <main className="flex-1 py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Header & Overall Status Banner */}
          <div className="space-y-6">
            <div>
              <span className="eyebrow block">Real-time Telemetry</span>
              <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
                Service Status
              </h1>
            </div>

            <div
              className={`rounded-xl border p-5 flex items-center justify-between ${
                isHealthy
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                  : "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`h-3 w-3 rounded-full animate-pulse ${
                    isHealthy ? "bg-emerald-500" : "bg-amber-500"
                  }`}
                />
                <span className="font-display font-bold text-base sm:text-lg">
                  {isHealthy
                    ? "All Global Scheduler Systems Operational"
                    : "Partial Degradation or Cluster Offline"}
                </span>
              </div>
              <span className="font-mono text-xs font-semibold">
                {liveHealth?.uptime
                  ? `Uptime: ${Math.floor(liveHealth.uptime / 3600)}h ${Math.floor((liveHealth.uptime % 3600) / 60)}m`
                  : "99.99% 90-Day Uptime"}
              </span>
            </div>
          </div>

          {/* Service components list */}
          <div className="space-y-4">
            <h2 className="font-display text-xl font-bold text-foreground">
              Core Infrastructure Components
            </h2>

            <div className="rounded-xl border border-border bg-card divide-y divide-border/60 overflow-hidden">
              {demoStatusServices.map((svc) => (
                <div key={svc.id} className="p-4 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-sm text-foreground block font-mono">
                      {svc.name}
                    </span>
                    <span className="text-[11px] text-muted-foreground font-mono">
                      {svc.region} • 90d Uptime: {svc.uptime90d}
                    </span>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-mono font-medium ${
                      svc.status === "operational"
                        ? "text-emerald-600 bg-emerald-500/10"
                        : "text-amber-600 bg-amber-500/10"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        svc.status === "operational" ? "bg-emerald-500" : "bg-amber-500"
                      }`}
                    />
                    <span className="capitalize">{svc.status}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Incident History */}
          <div className="space-y-4">
            <h2 className="font-display text-xl font-bold text-foreground">Past Incidents</h2>

            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <div className="border-b border-border/60 pb-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-semibold text-foreground">
                    Transient Webhook Delivery Latency in us-east
                  </span>
                  <span className="text-muted-foreground">Oct 18, 2026</span>
                </div>
                <Badge variant="outline" className="mt-2 text-emerald-600 text-[10px] font-mono">
                  Resolved
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                Between 14:10 and 14:26 UTC, upstream transit provider packet loss in Virginia
                resulted in queued webhook deliveries. All retried dispatches completed with zero
                dropped triggers.
              </p>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
