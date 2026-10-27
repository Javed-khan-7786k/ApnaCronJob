import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/navigation/site-header";
import { SiteFooter } from "@/components/navigation/site-footer";
import { CronEditor } from "@/components/cron/cron-editor";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle2, Shield, Globe, ArrowRight } from "lucide-react";
import { pageHead } from "@/lib/head";
import { useState } from "react";

export const Route = createFileRoute("/features/cron-scheduler")({
  head: () =>
    pageHead({
      title: "Cron Scheduler Engine — AapnaCronJob",
      description: "Sub-second precision cron scheduling with timezone and DST support.",
    }),
  component: CronSchedulerFeaturePage,
});

export function CronSchedulerFeaturePage() {
  const [cron, setCron] = useState("0 */4 * * *");

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <SiteHeader />

      <main className="flex-1 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="eyebrow block text-cobalt font-semibold">Core Engine</span>
            <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
              Precision Cron Job Scheduler
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground font-sans">
              Deploy high-precision schedules across global regions without managing servers, systemd timers, or local crontabs.
            </p>
          </div>

          {/* Interactive sandbox */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-xs max-w-4xl mx-auto">
            <div className="mb-4">
              <span className="eyebrow block">Live Expression Playground</span>
              <h3 className="font-display text-lg font-bold">Test the parser & next-run preview</h3>
            </div>
            <CronEditor value={cron} onChange={setCron} timezone="UTC" />
          </div>

          {/* Technical Deep Dive Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-xl border border-border bg-card p-6 space-y-3">
              <Clock className="h-6 w-6 text-cobalt" />
              <h3 className="font-semibold text-sm text-foreground">Sub-Second Dispatch</h3>
              <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                Atomic clock synchronization ensures dispatches execute within milliseconds of the target second.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 space-y-3">
              <Globe className="h-6 w-6 text-emerald-500" />
              <h3 className="font-semibold text-sm text-foreground">Timezone & DST Compensation</h3>
              <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                Native support for all IANA timezones. Handles spring-forward and fall-back clock shifts flawlessly.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 space-y-3">
              <Shield className="h-6 w-6 text-amber-500" />
              <h3 className="font-semibold text-sm text-foreground">No Duplicate Executions</h3>
              <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                Distributed leader leases guarantee that only one runner instance dispatches a scheduled event.
              </p>
            </div>
          </div>

          <div className="text-center pt-8">
            <Link to="/app/jobs/new">
              <Button size="lg" className="bg-foreground text-background font-mono text-xs font-semibold hover:bg-foreground/90">
                Create Your First Scheduled Job →
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
