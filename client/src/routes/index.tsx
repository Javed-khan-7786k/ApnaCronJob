import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Play,
  Copy,
  Terminal,
  Shield,
  Activity,
  Zap,
  Repeat,
  Bell,
  Webhook,
  Layers,
  ChevronDown,
  Sparkles,
  ExternalLink,
  Cpu,
  Globe,
  Radio,
  Lock,
} from "lucide-react";
import { SiteHeader } from "@/components/navigation/site-header";
import { SiteFooter } from "@/components/navigation/site-footer";
import { LiveClock } from "@/components/clock/live-clock";
import { HeroClockWatch } from "@/components/clock/hero-clock-watch";
import { CronEditor } from "@/components/cron/cron-editor";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { demoJobs, demoStatusServices, demoIntegrations } from "@/lib/demo-data";
import { humanizeCron, getNextRuns } from "@/lib/cron";
import { formatInZone, shortFutureLabel } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  component: IndexPage,
});

export function IndexPage() {
  const [heroCron, setHeroCron] = useState("*/10 * * * *");
  const [codeTab, setCodeTab] = useState<"curl" | "ts" | "py" | "tf">("curl");
  const [annualBilling, setAnnualBilling] = useState(false);

  // Next runs for hero schedule
  const nextHeroRuns = useMemo(() => {
    return getNextRuns(heroCron, { count: 4 });
  }, [heroCron]);

  // Copy code helper
  const copyCode = (code: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      toast.success("Snippet copied to clipboard");
    }
  };

  const codeSnippets = {
    curl: `curl -X POST https://api.aapnacronjob.com/v1/jobs \\
  -H "Authorization: Bearer crn_live_••••••••" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Nightly customer sync",
    "url": "https://api.acme.dev/sync/v2",
    "method": "POST",
    "cron": "0 2 * * *",
    "timezone": "UTC",
    "retry": { "max": 3, "backoff": "exponential" },
    "notify": { "channels": ["slack-ops", "pagerduty"] }
  }'`,
    ts: `import { AapnaCronJob } from "@aapnacronjob/sdk";

const client = new AapnaCronJob({ apiKey: process.env.AAPNACRONJOB_KEY });

const job = await client.jobs.create({
  name: "Nightly customer sync",
  url: "https://api.acme.dev/sync/v2",
  method: "POST",
  cron: "0 2 * * *",
  timezone: "UTC",
  retry: { maxAttempts: 3, strategy: "exponential" },
  alertOnFailure: true,
});

console.log(\`Job scheduled with ID: \${job.id}\`);`,
    py: `from aapnacronjob import AapnaCronJob

client = AapnaCronJob(api_key="crn_live_••••••••")

job = client.jobs.create(
    name="Nightly customer sync",
    url="https://api.acme.dev/sync/v2",
    method="POST",
    cron="0 2 * * *",
    timezone="UTC",
    max_retries=3,
    backoff="exponential"
)

print(f"Scheduled: {job.id}")`,
    tf: `resource "aapnacronjob_job" "nightly_sync" {
  name     = "Nightly customer sync"
  url      = "https://api.acme.dev/sync/v2"
  method   = "POST"
  cron     = "0 2 * * *"
  timezone = "UTC"

  retry_policy {
    max_retries = 3
    backoff     = "exponential"
  }

  notify_on_failure = true
}`,
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-cobalt selection:text-white">
      {/* 1 & 2. Announcement bar & Premium Navbar */}
      <SiteHeader />

      <main className="flex-1">
        {/* 3. EDITORIAL HERO SECTION WITH REAL RUNNING CLOCK WATCH */}
        <section className="relative overflow-hidden border-b border-border py-16 sm:py-24 lg:py-28 grid-texture">
          {/* Real Clock Watch in Hero Background for incredible depth and aesthetics */}
          <div className="absolute -right-16 top-1/2 -translate-y-1/2 opacity-10 dark:opacity-20 pointer-events-none scale-150 hidden xl:block">
            <HeroClockWatch />
          </div>

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Left Column: Headline & Action */}
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 font-mono text-xs text-muted-foreground shadow-xs">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-semibold text-foreground">
                    AapnaCronJob Precision Engine
                  </span>
                  <span className="opacity-60">•</span>
                  <span>Sub-second accuracy</span>
                </div>

                <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground leading-[1.05]">
                  Cron jobs you can{" "}
                  <span className="underline decoration-cobalt decoration-4 underline-offset-4">
                    trust
                  </span>{" "}
                  with your revenue.
                </h1>

                <p className="font-sans text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed">
                  Trigger webhooks and HTTP endpoints with guaranteed sub-second delivery, automatic
                  exponential retries, and instant alerts across Slack, Discord, and PagerDuty.
                  Never suffer silent cron failure again.
                </p>

                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <Link to="/app">
                    <Button
                      size="lg"
                      className="bg-foreground text-background font-mono text-sm font-semibold hover:bg-foreground/90 h-12 px-6"
                    >
                      Launch Console
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>

                  <Link to="/docs/quickstart">
                    <Button variant="outline" size="lg" className="font-mono text-sm h-12 px-5">
                      <Terminal className="h-4 w-4 mr-2" />
                      Quickstart Guide
                    </Button>
                  </Link>
                </div>

                <div className="pt-4 flex flex-wrap items-center gap-6 text-xs font-mono text-muted-foreground border-t border-border/60">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    99.99% SLA
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    Zero infrastructure
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    Multi-region failover
                  </span>
                </div>
              </div>

              {/* Right Column: Prominent Real Animated Luxury Clock Watch */}
              <div className="lg:col-span-5 flex flex-col items-center justify-center">
                <HeroClockWatch />
              </div>
            </div>
          </div>
        </section>

        {/* 4. LIVE CRON SCHEDULER PREVIEW (Interactive) */}
        <section className="border-b border-border py-16 bg-paper-sunken/40">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <span className="eyebrow block mb-1">Interactive Sandbox</span>
                <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  Try the scheduler expression engine
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground font-sans mt-1">
                  Change the expression below to test real-time parsing, plain-English translation,
                  and calculated next run times.
                </p>
              </div>

              <Link to="/docs/cron-expressions">
                <Button
                  variant="ghost"
                  size="sm"
                  className="font-mono text-xs text-muted-foreground hover:text-foreground"
                >
                  View Cron Syntax Cheatsheet →
                </Button>
              </Link>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
              <CronEditor
                value={heroCron}
                onChange={setHeroCron}
                timezone="UTC"
                showTimezoneSelect={true}
              />
            </div>
          </div>
        </section>

        {/* 5. VISUAL TIMELINE SHOWING SCHEDULED RUNS */}
        <section className="border-b border-border py-16 bg-background">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <span className="eyebrow block mb-1">Execution Pipeline</span>
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Next upcoming job executions
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground font-sans mt-1">
                Visual dispatch sequence across our globally distributed runner nodes.
              </p>
            </div>

            <div className="relative border-l border-border/80 pl-6 space-y-6 ml-3">
              {demoJobs.slice(0, 4).map((job, idx) => {
                const nextRuns = getNextRuns(job.cron, { count: 1 });
                const nextRun = nextRuns[0];
                const diffMs = nextRun ? nextRun.getTime() - Date.now() : 0;

                return (
                  <div key={job.id} className="relative group">
                    {/* Dot on timeline */}
                    <div className="absolute -left-[31px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-background bg-cobalt ring-2 ring-cobalt/20 group-hover:scale-125 transition-transform" />

                    <div className="rounded-xl border border-border bg-card p-4 transition-all hover:border-foreground/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-foreground">{job.name}</span>
                          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground uppercase">
                            {job.method}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-xs font-mono text-muted-foreground">
                          <span>
                            {job.cron} ({humanizeCron(job.cron)})
                          </span>
                          <span>•</span>
                          <span className="truncate max-w-[200px]">{job.url}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0 font-mono text-xs">
                        <div className="text-right">
                          <span className="block font-semibold text-foreground">
                            {nextRun ? formatInZone(nextRun, "UTC") : "—"}
                          </span>
                          <span className="block text-[11px] text-cobalt">
                            {shortFutureLabel(diffMs)}
                          </span>
                        </div>
                        <Link to="/app/jobs/$jobId" params={{ jobId: job.id }}>
                          <Button variant="outline" size="sm" className="h-7 text-xs font-mono">
                            View
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 6. PROBLEM / SOLUTION: WHY RELIABLE SCHEDULING MATTERS */}
        <section className="border-b border-border py-20 bg-paper-sunken/50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="eyebrow block mb-2">The Real Cost of Broken Crons</span>
              <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                Linux crontab was designed in 1987. Your modern stack deserves better.
              </h2>
              <p className="mt-3 text-sm sm:text-base text-muted-foreground font-sans">
                Traditional crontabs fail silently on server restarts, OOM crashes, or network
                timeouts, leaving database backups unmade and payment rolls stuck.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Problem Card */}
              <div className="rounded-xl border border-danger/30 bg-card p-6 space-y-4">
                <div className="flex items-center gap-2 text-danger">
                  <AlertTriangle className="h-5 w-5" />
                  <h3 className="font-mono text-sm uppercase tracking-wider font-bold">
                    The Pain of Local Crontabs
                  </h3>
                </div>
                <ul className="space-y-3 text-xs font-sans text-muted-foreground leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="text-danger font-bold">✕</span>
                    <span>
                      <strong>Silent Failure:</strong> A crashed cron job outputs nothing to Slack
                      or email. You only find out when a customer files a ticket.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-danger font-bold">✕</span>
                    <span>
                      <strong>No Retry Engine:</strong> If an API endpoint drops for 5 seconds
                      during maintenance, the run is lost until next scheduled cycle.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-danger font-bold">✕</span>
                    <span>
                      <strong>Server Bound:</strong> Server reboot or auto-scaling kill eliminates
                      the process mid-execution with zero telemetry.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-danger font-bold">✕</span>
                    <span>
                      <strong>No Audit Trail:</strong> Good luck determining who modified `crontab
                      -e` at 2 AM or what parameters were changed.
                    </span>
                  </li>
                </ul>
              </div>

              {/* Solution Card */}
              <div className="rounded-xl border border-emerald-500/30 bg-card p-6 space-y-4">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-5 w-5" />
                  <h3 className="font-mono text-sm uppercase tracking-wider font-bold">
                    The AapnaCronJob Architecture
                  </h3>
                </div>
                <ul className="space-y-3 text-xs font-sans text-muted-foreground leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span>
                      <strong>Sub-Second Global Dispatch:</strong> Multi-region runner cluster
                      executes HTTP dispatches with millisecond accuracy.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span>
                      <strong>Exponential Backoff Retries:</strong> Automatic 3-stage retry budget
                      saves runs from transient network glitches.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span>
                      <strong>Instant Multi-Channel Alerts:</strong> Real-time webhook notifications
                      to Slack, PagerDuty, Discord, and email.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span>
                      <strong>Full Audit & Logs:</strong> Every execution code, duration, response
                      body snippet, and configuration edit is tracked.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 7. FEATURE SHOWCASE (Asymmetric Editorial Grid) */}
        <section className="border-b border-border py-20 bg-background">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12">
              <span className="eyebrow block mb-1">Architectural Features</span>
              <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                Engineered for sub-second precision and total resilience
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Feature 1 (Large 2-column) */}
              <div className="md:col-span-2 rounded-xl border border-border bg-card p-8 flex flex-col justify-between space-y-6">
                <div>
                  <div className="h-10 w-10 rounded-lg border border-border bg-paper-sunken flex items-center justify-center text-cobalt mb-4">
                    <Radio className="h-5 w-5" />
                  </div>
                  <span className="eyebrow block mb-1">Distributed Runner Mesh</span>
                  <h3 className="font-display text-xl sm:text-2xl font-bold text-foreground">
                    Multi-region consensus dispatching
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground font-sans leading-relaxed">
                    Jobs are registered across globally synchronized Raft consensus nodes. If an
                    entire cloud region experiences an outage, alternate runner nodes in Frankfurt,
                    Singapore, or Oregon execute your dispatch with zero double-triggers.
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground border-t border-border/60 pt-4">
                  <span>Frankfurt (eu-central)</span>
                  <span>•</span>
                  <span>Mumbai (ap-south)</span>
                  <span>•</span>
                  <span>N. Virginia (us-east)</span>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="rounded-xl border border-border bg-card p-8 flex flex-col justify-between space-y-6">
                <div>
                  <div className="h-10 w-10 rounded-lg border border-border bg-paper-sunken flex items-center justify-center text-amber-500 mb-4">
                    <Repeat className="h-5 w-5" />
                  </div>
                  <span className="eyebrow block mb-1">Fault Resilience</span>
                  <h3 className="font-display text-xl font-bold text-foreground">
                    Exponential Backoff
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground font-sans leading-relaxed">
                    Custom retry intervals with jitter prevent thundering herds on recovery.
                    Configurable per-job thresholds.
                  </p>
                </div>
                <Link
                  to="/features/retries"
                  className="text-xs font-mono text-cobalt hover:underline"
                >
                  Learn about backoff models →
                </Link>
              </div>

              {/* Feature 3 */}
              <div className="rounded-xl border border-border bg-card p-8 flex flex-col justify-between space-y-6">
                <div>
                  <div className="h-10 w-10 rounded-lg border border-border bg-paper-sunken flex items-center justify-center text-rose-500 mb-4">
                    <Bell className="h-5 w-5" />
                  </div>
                  <span className="eyebrow block mb-1">Escalation Routing</span>
                  <h3 className="font-display text-xl font-bold text-foreground">
                    Incident Alerts
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground font-sans leading-relaxed">
                    Route warnings to Slack and critical failures directly to PagerDuty or Opsgenie
                    with full stack traces.
                  </p>
                </div>
                <Link
                  to="/features/notifications"
                  className="text-xs font-mono text-cobalt hover:underline"
                >
                  Configure notification rules →
                </Link>
              </div>

              {/* Feature 4 (Large 2-column) */}
              <div className="md:col-span-2 rounded-xl border border-border bg-card p-8 flex flex-col justify-between space-y-6">
                <div>
                  <div className="h-10 w-10 rounded-lg border border-border bg-paper-sunken flex items-center justify-center text-emerald-500 mb-4">
                    <Lock className="h-5 w-5" />
                  </div>
                  <span className="eyebrow block mb-1">Zero-Trust Security</span>
                  <h3 className="font-display text-xl sm:text-2xl font-bold text-foreground">
                    Encrypted headers & payload signing
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground font-sans leading-relaxed">
                    All Bearer tokens and custom Authorization headers are encrypted using envelope
                    AES-256-GCM encryption. Outgoing requests include an optional HMAC-SHA256
                    signature header so your webhook endpoints can verify authenticity.
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground border-t border-border/60 pt-4">
                  <span>TLS 1.3 Strict</span>
                  <span>•</span>
                  <span>X-AapnaCronJob-Signature</span>
                  <span>•</span>
                  <span>SOC2 Type II Ready</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 8. CRON EXPRESSION BUILDER PREVIEW */}
        <section className="border-b border-border py-20 bg-paper-sunken/40">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <span className="eyebrow block mb-1">Visual Syntax Helper</span>
                <h2 className="font-display text-3xl font-bold tracking-tight text-foreground">
                  Build complex cron schedules without memorizing syntax
                </h2>
                <p className="mt-3 text-sm text-muted-foreground font-sans leading-relaxed">
                  Whether you need every 15 minutes on weekdays, top of the hour during business
                  hours, or monthly billing rolls, our visual builder and human-readable translator
                  eliminate scheduling bugs.
                </p>

                <div className="mt-6 space-y-3 font-mono text-xs">
                  <div className="p-3 rounded-lg border border-border bg-card flex items-center justify-between">
                    <span>
                      <code>*/15 9-17 * * 1-5</code>
                    </span>
                    <span className="text-muted-foreground">Every 15 min, 9am-5pm Mon-Fri</span>
                  </div>
                  <div className="p-3 rounded-lg border border-border bg-card flex items-center justify-between">
                    <span>
                      <code>0 0 1,15 * *</code>
                    </span>
                    <span className="text-muted-foreground">1st and 15th of month at midnight</span>
                  </div>
                  <div className="p-3 rounded-lg border border-border bg-card flex items-center justify-between">
                    <span>
                      <code>30 8 * * 1</code>
                    </span>
                    <span className="text-muted-foreground">Every Monday at 08:30</span>
                  </div>
                </div>

                <div className="mt-6">
                  <Link to="/docs/cron-expressions">
                    <Button variant="outline" size="sm" className="font-mono text-xs">
                      Read Complete Syntax Documentation →
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <CronEditor
                  value="30 8 * * 1-5"
                  onChange={() => {}}
                  timezone="UTC"
                  showTimezoneSelect={false}
                />
              </div>
            </div>
          </div>
        </section>

        {/* 9. RETRY & FAILURE NOTIFICATIONS SECTION */}
        <section className="border-b border-border py-20 bg-background">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="eyebrow block mb-2">Resilient Pipelines</span>
              <h2 className="font-display text-3xl font-extrabold text-foreground">
                Never miss an outage or drop a retry
              </h2>
              <p className="mt-2 text-sm text-muted-foreground font-sans">
                Real-world webhooks fail. Networks blip. Deployments restart pods. We bridge the gap
                with smart retry strategies.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-xl border border-border bg-card p-6">
                <span className="font-mono text-xs text-cobalt font-bold block mb-1">STEP 1</span>
                <h3 className="font-semibold text-base text-foreground">Primary Dispatch</h3>
                <p className="mt-2 text-xs text-muted-foreground font-sans leading-relaxed">
                  Scheduled runner sends HTTP request to your destination with custom timeout (up to
                  15 min).
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-6">
                <span className="font-mono text-xs text-amber-500 font-bold block mb-1">
                  STEP 2
                </span>
                <h3 className="font-semibold text-base text-foreground">Exponential Backoff</h3>
                <p className="mt-2 text-xs text-muted-foreground font-sans leading-relaxed">
                  On HTTP 5xx or network timeout, runner automatically retries at 30s, 60s, 120s
                  with jitter.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-6">
                <span className="font-mono text-xs text-rose-500 font-bold block mb-1">STEP 3</span>
                <h3 className="font-semibold text-base text-foreground">Escalation Alert</h3>
                <p className="mt-2 text-xs text-muted-foreground font-sans leading-relaxed">
                  If all retries are exhausted, incident payload is instantly dispatched to your
                  Slack & PagerDuty channels.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 10. JOB HISTORY & EXECUTION LOGS PREVIEW */}
        <section className="border-b border-border py-20 bg-paper-sunken/40">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
              <div>
                <span className="eyebrow block mb-1">Observability</span>
                <h2 className="font-display text-3xl font-bold tracking-tight text-foreground">
                  Sub-millisecond execution logs
                </h2>
                <p className="text-sm text-muted-foreground font-sans mt-1">
                  Inspect every status code, latency metric, and error trace with zero retention
                  lock-in.
                </p>
              </div>
              <Link to="/app/history">
                <Button variant="outline" size="sm" className="font-mono text-xs">
                  Open Full History Console →
                </Button>
              </Link>
            </div>

            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="p-3 bg-paper-sunken border-b border-border flex items-center justify-between text-xs font-mono">
                <span className="text-muted-foreground">
                  Recent Executions Sample (Real-time Stream)
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Live Listener Active
                </span>
              </div>
              <div className="divide-y divide-border/60 text-xs font-mono">
                <div className="p-3.5 flex items-center justify-between hover:bg-muted/30">
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-600 font-semibold">200 OK</span>
                    <span className="font-semibold text-foreground">Nightly database backup</span>
                    <span className="text-muted-foreground">
                      https://api.acme.dev/internal/backup/run
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <span>41.2s</span>
                    <span>9 min ago</span>
                  </div>
                </div>

                <div className="p-3.5 flex items-center justify-between hover:bg-muted/30">
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-600 font-semibold">200 OK</span>
                    <span className="font-semibold text-foreground">SSL certificate sweep</span>
                    <span className="text-muted-foreground">
                      https://api.acme.dev/monitoring/tls/sweep
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <span>8.4s</span>
                    <span>13 min ago</span>
                  </div>
                </div>

                <div className="p-3.5 flex items-center justify-between hover:bg-muted/30">
                  <div className="flex items-center gap-3">
                    <span className="text-amber-500 font-semibold">Retry #1</span>
                    <span className="font-semibold text-foreground">Exchange rates refresh</span>
                    <span className="text-muted-foreground">https://api.acme.dev/forex/sync</span>
                  </div>
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <span>502 Gateway</span>
                    <span>22 min ago</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 11. WEBHOOK & HTTP REQUEST SCHEDULING */}
        <section className="border-b border-border py-20 bg-background">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-4">
                <span className="eyebrow block">Developer Flexibility</span>
                <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-foreground">
                  Custom HTTP methods, headers, and payloads
                </h2>
                <p className="text-sm text-muted-foreground font-sans leading-relaxed">
                  Trigger anything that speaks HTTP. Post complex JSON payloads to internal
                  microservices, invoke AWS Lambda via Function URLs, trigger GitHub Actions
                  repository dispatch events, or trigger Stripe billing webhooks.
                </p>
                <div className="grid grid-cols-2 gap-3 pt-2 font-mono text-xs">
                  <div className="p-3 rounded-lg border border-border bg-card">
                    <span className="font-semibold block text-foreground">Custom Verbs</span>
                    <span className="text-muted-foreground text-[11px]">
                      GET, POST, PUT, PATCH, DELETE, HEAD
                    </span>
                  </div>
                  <div className="p-3 rounded-lg border border-border bg-card">
                    <span className="font-semibold block text-foreground">Dynamic Tokens</span>
                    <span className="text-muted-foreground text-[11px]">
                      Timestamp & HMAC substitution
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-foreground text-background p-6 font-mono text-xs space-y-3">
                <div className="flex items-center justify-between border-b border-background/20 pb-2">
                  <span className="text-background/60">Outgoing Dispatch Payload Sample</span>
                  <Badge
                    variant="outline"
                    className="text-[10px] text-background border-background/40"
                  >
                    HTTP POST
                  </Badge>
                </div>
                <pre className="text-[11px] leading-relaxed text-background/90 overflow-x-auto">
                  {`POST /v2/billing/invoices/roll HTTP/1.1
Host: api.acme.dev
Authorization: Bearer acj_live_9a7d••••
Content-Type: application/json
X-AapnaCronJob-Signature: t=1730000000,v1=9f83...
User-Agent: AapnaCronJob-Runner/3.4 (https://aapnacronjob.com)

{
  "scheduled_at": "2026-10-27T02:00:00Z",
  "job_id": "job_invoice_roller",
  "execution_attempt": 1
}`}
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* 12. SERVICE UPTIME & HEALTH MONITORING */}
        <section className="border-b border-border py-20 bg-paper-sunken/40">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
              <div>
                <span className="eyebrow block mb-1">Global Infrastructure</span>
                <h2 className="font-display text-3xl font-bold tracking-tight text-foreground">
                  Enterprise uptime status
                </h2>
                <p className="text-sm text-muted-foreground font-sans mt-1">
                  Continuously measured across worldwide runner regions.
                </p>
              </div>
              <Link to="/status">
                <Button variant="outline" size="sm" className="font-mono text-xs">
                  Detailed Status Page →
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {demoStatusServices.map((svc) => (
                <div key={svc.id} className="rounded-xl border border-border bg-card p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-foreground font-mono truncate">
                      {svc.name}
                    </span>
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  </div>
                  <div className="text-xs font-mono text-muted-foreground">
                    <div>
                      90-Day: <span className="text-foreground font-semibold">{svc.uptime90d}</span>
                    </div>
                    <div className="text-[11px] opacity-70 capitalize mt-0.5">{svc.region}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 13. INTEGRATION SHOWCASE */}
        <section className="border-b border-border py-20 bg-background">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="eyebrow block mb-2">Ecosystem</span>
              <h2 className="font-display text-3xl font-extrabold text-foreground">
                Connects seamlessly with your existing stack
              </h2>
              <p className="mt-2 text-sm text-muted-foreground font-sans">
                Native integrations for notification routing, incident escalation, and workflow
                automation.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {demoIntegrations.map((intg) => (
                <div
                  key={intg.id}
                  className="rounded-xl border border-border bg-card p-5 flex flex-col justify-between hover:border-foreground/30 transition-colors"
                >
                  <div>
                    <span className="font-semibold text-sm text-foreground block font-mono">
                      {intg.name}
                    </span>
                    <span className="text-[10px] font-mono uppercase text-cobalt tracking-wider">
                      {intg.category}
                    </span>
                    <p className="mt-2 text-xs text-muted-foreground font-sans leading-relaxed">
                      {intg.description}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-[11px] font-mono">
                    <span className={intg.connected ? "text-emerald-600" : "text-muted-foreground"}>
                      {intg.connected ? "Connected" : "Available"}
                    </span>
                    <Link to="/app/integrations" className="text-cobalt hover:underline">
                      Configure →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 14. STEP-BY-STEP HOW IT WORKS */}
        <section className="border-b border-border py-20 bg-paper-sunken/40">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="eyebrow block mb-2">Simplicity First</span>
              <h2 className="font-display text-3xl font-extrabold text-foreground">
                Schedule production jobs in four simple steps
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="rounded-xl border border-border bg-card p-6">
                <span className="font-mono text-2xl font-bold text-cobalt block mb-2">01</span>
                <h3 className="font-semibold text-sm text-foreground">Define Endpoint</h3>
                <p className="mt-2 text-xs text-muted-foreground font-sans leading-relaxed">
                  Provide your target URL, HTTP method, and any necessary auth tokens or headers.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-6">
                <span className="font-mono text-2xl font-bold text-cobalt block mb-2">02</span>
                <h3 className="font-semibold text-sm text-foreground">Set Schedule</h3>
                <p className="mt-2 text-xs text-muted-foreground font-sans leading-relaxed">
                  Use presets or the visual cron builder to pick your intervals and target timezone.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-6">
                <span className="font-mono text-2xl font-bold text-cobalt block mb-2">03</span>
                <h3 className="font-semibold text-sm text-foreground">We Dispatch & Monitor</h3>
                <p className="mt-2 text-xs text-muted-foreground font-sans leading-relaxed">
                  Our distributed runner fleet executes your trigger on the exact second with
                  automatic retries.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-6">
                <span className="font-mono text-2xl font-bold text-cobalt block mb-2">04</span>
                <h3 className="font-semibold text-sm text-foreground">Instant Alerts</h3>
                <p className="mt-2 text-xs text-muted-foreground font-sans leading-relaxed">
                  Receive notifications in Slack, Discord, or PagerDuty if your endpoint returns
                  errors.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 15. DEVELOPER-FOCUSED CODE EXAMPLES */}
        <section className="border-b border-border py-20 bg-background">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-5 space-y-4">
                <span className="eyebrow block">Developer First</span>
                <h2 className="font-display text-3xl font-extrabold text-foreground">
                  Programmatic control via REST API and SDKs
                </h2>
                <p className="text-sm text-muted-foreground font-sans leading-relaxed">
                  Manage your scheduling fleet entirely through code. Integrate job creation into
                  your CI/CD pipelines, Docker setup, or Terraform infrastructure as code.
                </p>

                <div className="flex flex-wrap gap-2 pt-2">
                  <Button
                    type="button"
                    variant={codeTab === "curl" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCodeTab("curl")}
                    className="font-mono text-xs h-7"
                  >
                    cURL
                  </Button>
                  <Button
                    type="button"
                    variant={codeTab === "ts" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCodeTab("ts")}
                    className="font-mono text-xs h-7"
                  >
                    TypeScript
                  </Button>
                  <Button
                    type="button"
                    variant={codeTab === "py" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCodeTab("py")}
                    className="font-mono text-xs h-7"
                  >
                    Python
                  </Button>
                  <Button
                    type="button"
                    variant={codeTab === "tf" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCodeTab("tf")}
                    className="font-mono text-xs h-7"
                  >
                    Terraform
                  </Button>
                </div>

                <div className="pt-2">
                  <Link to="/docs/api">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="font-mono text-xs text-cobalt hover:underline p-0"
                    >
                      View complete OpenAPI Specification →
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-7">
                <div className="rounded-xl border border-border bg-foreground text-background p-5 font-mono text-xs relative group">
                  <div className="flex items-center justify-between border-b border-background/20 pb-2 mb-3">
                    <span className="text-background/60 text-[11px]">
                      {codeTab.toUpperCase()} Snippet
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyCode(codeSnippets[codeTab])}
                      className="h-6 text-[10px] text-background hover:bg-background/20 font-mono"
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy Code
                    </Button>
                  </div>
                  <pre className="overflow-x-auto text-[11px] leading-relaxed text-background/90 py-1">
                    {codeSnippets[codeTab]}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 16. SECURITY & RELIABILITY */}
        <section className="border-b border-border py-20 bg-paper-sunken/40">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="eyebrow block mb-2">Enterprise Security</span>
              <h2 className="font-display text-3xl font-extrabold text-foreground">
                Built to satisfy demanding compliance standards
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-xl border border-border bg-card p-6 space-y-2">
                <Shield className="h-6 w-6 text-cobalt mb-2" />
                <h3 className="font-semibold text-sm text-foreground">Envelope Key Encryption</h3>
                <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                  All auth headers and payload secrets are encrypted with AES-256-GCM. Keys are
                  segregated per workspace.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-6 space-y-2">
                <Globe className="h-6 w-6 text-emerald-500 mb-2" />
                <h3 className="font-semibold text-sm text-foreground">
                  Dedicated Static Egress IPs
                </h3>
                <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                  Whitelist our dedicated runner IP ranges directly in your AWS VPC or Cloudflare
                  firewall rules.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-6 space-y-2">
                <Activity className="h-6 w-6 text-amber-500 mb-2" />
                <h3 className="font-semibold text-sm text-foreground">Immutable Audit Trails</h3>
                <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                  Every job modification, manual trigger, and key generation event is permanently
                  logged with actor metadata.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 17. USE CASE SHOWCASE */}
        <section className="border-b border-border py-20 bg-background">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12">
              <span className="eyebrow block mb-1">Production Scenarios</span>
              <h2 className="font-display text-3xl font-extrabold text-foreground">
                Trusted across mission-critical workflows
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="rounded-xl border border-border bg-card p-6 space-y-2">
                <span className="font-mono text-xs text-cobalt font-bold">
                  DATABASE REPLICATION
                </span>
                <h3 className="font-semibold text-sm text-foreground">
                  Nightly Cold Storage Backups
                </h3>
                <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                  Invokes database snapshot triggers, verifies integrity checksums, and alerts DBA
                  teams on timeouts.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-6 space-y-2">
                <span className="font-mono text-xs text-emerald-600 font-bold">SECURITY & TLS</span>
                <h3 className="font-semibold text-sm text-foreground">SSL Expiry Sweeps</h3>
                <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                  Runs daily checks across 10,000+ customer custom domains to prevent catastrophic
                  certificate dropouts.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-6 space-y-2">
                <span className="font-mono text-xs text-purple-600 font-bold">
                  FINTECH & BILLING
                </span>
                <h3 className="font-semibold text-sm text-foreground">Monthly Invoicing Rollers</h3>
                <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                  Dispatches recurring subscription charges with strict idempotency keys and zero
                  double-charge risk.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-6 space-y-2">
                <span className="font-mono text-xs text-amber-600 font-bold">PERFORMANCE</span>
                <h3 className="font-semibold text-sm text-foreground">
                  Cache Warming & Revalidation
                </h3>
                <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                  Pre-generates heavy API queries and pre-warms CDN edge caches before peak morning
                  traffic spikes.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-6 space-y-2">
                <span className="font-mono text-xs text-rose-600 font-bold">HEALTH MONITORING</span>
                <h3 className="font-semibold text-sm text-foreground">High-Frequency Heartbeats</h3>
                <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                  Pings core internal microservices every 60 seconds with strict timeout alerting to
                  Slack.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-6 space-y-2">
                <span className="font-mono text-xs text-blue-600 font-bold">DATA PIPELINES</span>
                <h3 className="font-semibold text-sm text-foreground">ETL Batch Syncs</h3>
                <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                  Triggers Snowflake and BigQuery incremental ingestion jobs with execution duration
                  monitoring.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 18. PRICING PLANS WITH MONTHLY / YEARLY TOGGLE */}
        <section className="border-b border-border py-20 bg-paper-sunken/40">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="eyebrow block mb-2">Transparent Pricing</span>
              <h2 className="font-display text-3xl font-extrabold text-foreground">
                Predictable plans for hobbyists to hypergrowth teams
              </h2>

              <div className="mt-6 inline-flex items-center gap-3 p-1 rounded-full border border-border bg-card">
                <button
                  type="button"
                  onClick={() => setAnnualBilling(false)}
                  className={`px-3 py-1 text-xs font-mono rounded-full transition-colors ${
                    !annualBilling
                      ? "bg-foreground text-background font-semibold"
                      : "text-muted-foreground"
                  }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setAnnualBilling(true)}
                  className={`px-3 py-1 text-xs font-mono rounded-full transition-colors flex items-center gap-1.5 ${
                    annualBilling
                      ? "bg-foreground text-background font-semibold"
                      : "text-muted-foreground"
                  }`}
                >
                  <span>Yearly</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-600 px-1.5 py-0.2 rounded-full font-bold">
                    Save 20%
                  </span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* Hobby Plan */}
              <div className="rounded-xl border border-border bg-card p-6 flex flex-col justify-between space-y-6">
                <div>
                  <span className="eyebrow block">Developer</span>
                  <h3 className="font-display text-xl font-bold text-foreground">Hobby</h3>
                  <div className="mt-4 flex items-baseline">
                    <span className="font-mono text-4xl font-bold text-foreground">$0</span>
                    <span className="text-xs text-muted-foreground ml-1 font-mono">/ forever</span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground font-sans">
                    Essential scheduling for side projects and personal endpoints.
                  </p>

                  <ul className="mt-6 space-y-2.5 text-xs font-sans text-muted-foreground border-t border-border/60 pt-4">
                    <li className="flex items-center gap-2">✓ 10 scheduled jobs</li>
                    <li className="flex items-center gap-2">✓ 5-minute execution frequency</li>
                    <li className="flex items-center gap-2">✓ 7-day execution log retention</li>
                    <li className="flex items-center gap-2">✓ Email failure alerts</li>
                  </ul>
                </div>

                <Link to="/register">
                  <Button variant="outline" className="w-full font-mono text-xs">
                    Get Started Free
                  </Button>
                </Link>
              </div>

              {/* Pro Plan (Highlighted) */}
              <div className="rounded-xl border-2 border-cobalt bg-card p-6 flex flex-col justify-between space-y-6 relative shadow-md">
                <div className="absolute -top-3 right-6 rounded-full bg-cobalt px-3 py-0.5 text-[10px] font-mono font-bold text-white uppercase tracking-wider">
                  Most Popular
                </div>

                <div>
                  <span className="eyebrow block text-cobalt font-semibold">Scale</span>
                  <h3 className="font-display text-xl font-bold text-foreground">Professional</h3>
                  <div className="mt-4 flex items-baseline">
                    <span className="font-mono text-4xl font-bold text-foreground">
                      ${annualBilling ? "19" : "24"}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1 font-mono">/ month</span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground font-sans">
                    Production power for startups and engineering teams.
                  </p>

                  <ul className="mt-6 space-y-2.5 text-xs font-sans text-muted-foreground border-t border-border/60 pt-4">
                    <li className="flex items-center gap-2 font-medium text-foreground">
                      ✓ Unlimited scheduled jobs
                    </li>
                    <li className="flex items-center gap-2 font-medium text-foreground">
                      ✓ Sub-second precision (up to 1/sec)
                    </li>
                    <li className="flex items-center gap-2">✓ 90-day execution log retention</li>
                    <li className="flex items-center gap-2">
                      ✓ Slack, Discord, PagerDuty webhooks
                    </li>
                    <li className="flex items-center gap-2">✓ Exponential retry backoff</li>
                    <li className="flex items-center gap-2">✓ 5 team member seats</li>
                  </ul>
                </div>

                <Link to="/app">
                  <Button className="w-full bg-cobalt hover:bg-cobalt/90 text-white font-mono text-xs font-semibold">
                    Start 14-Day Free Trial
                  </Button>
                </Link>
              </div>

              {/* Enterprise Plan */}
              <div className="rounded-xl border border-border bg-card p-6 flex flex-col justify-between space-y-6">
                <div>
                  <span className="eyebrow block">Compliance</span>
                  <h3 className="font-display text-xl font-bold text-foreground">Enterprise</h3>
                  <div className="mt-4 flex items-baseline">
                    <span className="font-mono text-4xl font-bold text-foreground">
                      ${annualBilling ? "119" : "149"}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1 font-mono">/ month</span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground font-sans">
                    Dedicated infrastructure, compliance guarantees, and 24/7 SLA.
                  </p>

                  <ul className="mt-6 space-y-2.5 text-xs font-sans text-muted-foreground border-t border-border/60 pt-4">
                    <li className="flex items-center gap-2">✓ Dedicated static runner IPs</li>
                    <li className="flex items-center gap-2">✓ 99.99% contractual SLA</li>
                    <li className="flex items-center gap-2">✓ 1-year audit log retention</li>
                    <li className="flex items-center gap-2">✓ SAML / Okta SSO & SCIM</li>
                    <li className="flex items-center gap-2">✓ Dedicated Slack support channel</li>
                  </ul>
                </div>

                <Link to="/contact">
                  <Button variant="outline" className="w-full font-mono text-xs">
                    Contact Enterprise Sales
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 19. FAQ ACCORDION */}
        <section className="border-b border-border py-20 bg-background">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="eyebrow block mb-2">Answers</span>
              <h2 className="font-display text-3xl font-extrabold text-foreground">
                Frequently asked developer questions
              </h2>
            </div>

            <Accordion type="single" collapsible className="space-y-3 font-sans text-xs">
              <AccordionItem
                value="item-1"
                className="border border-border rounded-lg px-4 bg-card"
              >
                <AccordionTrigger className="text-sm font-semibold hover:no-underline py-4">
                  How does AapnaCronJob differ from traditional server crontabs?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pb-4">
                  Traditional crontabs run locally on a single machine. If the server restarts, runs
                  out of memory, or drops network connectivity, your cron job fails silently with
                  zero notifications. AapnaCronJob dispatches HTTP requests from a multi-region
                  runner cluster, retries on failure with exponential backoff, and alerts your team
                  instantly when endpoints fail.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="item-2"
                className="border border-border rounded-lg px-4 bg-card"
              >
                <AccordionTrigger className="text-sm font-semibold hover:no-underline py-4">
                  What timezones are supported?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pb-4">
                  Every standard IANA timezone is supported (e.g., America/New_York, Europe/London,
                  Asia/Kolkata). AapnaCronJob automatically adjusts for Daylight Saving Time (DST)
                  transitions, so your 09:00 AM daily reports run at 09:00 AM local time year-round.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="item-3"
                className="border border-border rounded-lg px-4 bg-card"
              >
                <AccordionTrigger className="text-sm font-semibold hover:no-underline py-4">
                  What happens when an endpoint fails or times out?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pb-4">
                  If your server returns an HTTP 5xx status or times out, AapnaCronJob triggers your
                  configured retry policy (up to 5 attempts with fixed or exponential backoff). If
                  all attempts fail, AapnaCronJob delivers an immediate incident payload to your
                  connected Slack, Discord, or PagerDuty channels.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="item-4"
                className="border border-border rounded-lg px-4 bg-card"
              >
                <AccordionTrigger className="text-sm font-semibold hover:no-underline py-4">
                  Can I whitelist AapnaCronJob's runner IP addresses?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pb-4">
                  Yes! All Pro and Enterprise accounts have access to published, static egress IP
                  ranges that you can add directly to your AWS Security Groups, Cloudflare WAF, or
                  firewall configurations.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="item-5"
                className="border border-border rounded-lg px-4 bg-card"
              >
                <AccordionTrigger className="text-sm font-semibold hover:no-underline py-4">
                  How fast can I get started with AapnaCronJob?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pb-4">
                  You can get started immediately in under 30 seconds. The developer console
                  includes full schedule inventory management, live telemetry streaming, audit
                  trails, and sub-second execution triggers ready for your endpoints.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>

        {/* 20. FINAL CTA SECTION */}
        <section className="py-20 bg-paper-sunken/60 text-center">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-6">
            <span className="eyebrow block">Zero Risk Setup</span>
            <h2 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
              Schedule your first production job in 30 seconds.
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground font-sans max-w-xl mx-auto">
              Join thousands of developers relying on AapnaCronJob for mission-critical backups,
              billing, webhooks, and endpoint health checks.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Link to="/app">
                <Button
                  size="lg"
                  className="bg-foreground text-background font-mono text-sm font-semibold hover:bg-foreground/90 h-12 px-8"
                >
                  Launch Console Now
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
              <Link to="/pricing">
                <Button variant="outline" size="lg" className="font-mono text-sm h-12 px-6">
                  Compare Plans
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* 21. Structured Footer */}
      <SiteFooter />
    </div>
  );
}
