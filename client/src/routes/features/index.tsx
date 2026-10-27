import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/navigation/site-header";
import { SiteFooter } from "@/components/navigation/site-footer";
import { Button } from "@/components/ui/button";
import {
  Clock,
  Activity,
  Repeat,
  Bell,
  Webhook,
  Shield,
  Layers,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Globe,
} from "lucide-react";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/features/")({
  head: () =>
    pageHead({
      title: "Platform Features — AapnaCronJob",
      description:
        "Explore AapnaCronJob's distributed cron engine, HTTP monitoring, and exponential retry system.",
    }),
  component: FeaturesOverviewPage,
});

export function FeaturesOverviewPage() {
  const featureList = [
    {
      title: "Cron Scheduler",
      tagline: "Sub-Second Precision Engine",
      description:
        "Execute HTTP and webhook triggers with millisecond accuracy across globally distributed runner nodes.",
      to: "/features/cron-scheduler",
      icon: Clock,
      color: "text-cobalt",
      highlights: [
        "5-field standard cron syntax",
        "Timezone aware with DST compensation",
        "Zero double-execution guarantee",
      ],
    },
    {
      title: "HTTP Health Monitoring",
      tagline: "Global Endpoint Verification",
      description:
        "Continuous pinging, SSL certificate expiration audits, and response payload validation.",
      to: "/features/http-monitoring",
      icon: Activity,
      color: "text-emerald-500",
      highlights: [
        "Response time latency graphs",
        "TLS handshake validation",
        "Configurable HTTP status matchers",
      ],
    },
    {
      title: "Retries & Fault Handling",
      tagline: "Automated Self-Healing",
      description:
        "Exponential backoff algorithms with jitter protect against transient network failures without thundering herds.",
      to: "/features/retries",
      icon: Repeat,
      color: "text-amber-500",
      highlights: [
        "Up to 5 automated retries",
        "Fixed or exponential backoff",
        "Per-attempt status logging",
      ],
    },
    {
      title: "Multi-Channel Notifications",
      tagline: "Instant Incident Routing",
      description:
        "Dispatch urgent alerts to Slack, Discord, PagerDuty, or custom webhooks the second an endpoint fails.",
      to: "/features/notifications",
      icon: Bell,
      color: "text-rose-500",
      highlights: [
        "Channel escalation policies",
        "Recovery confirmation alerts",
        "Customizable alert bodies",
      ],
    },
    {
      title: "Webhook Scheduling",
      tagline: "Secure Outgoing Dispatches",
      description:
        "Send POST, PUT, and PATCH payloads signed with HMAC-SHA256 headers for cryptographically verified execution.",
      to: "/features/webhooks",
      icon: Webhook,
      color: "text-purple-500",
      highlights: [
        "Dynamic timestamp variables",
        "Custom encrypted headers",
        "Payload replay protection",
      ],
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <SiteHeader />

      <main className="flex-1 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <span className="eyebrow block">Platform Architecture</span>
            <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
              Built for engineering teams who cannot afford silent failures.
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground font-sans">
              Discover how AapnaCronJob combines a modern developer interface with carrier-grade
              distributed scheduling.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featureList.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="rounded-xl border border-border bg-card p-6 flex flex-col justify-between space-y-6 hover:border-foreground/30 transition-colors"
                >
                  <div className="space-y-4">
                    <div className="h-10 w-10 rounded-lg border border-border bg-paper-sunken flex items-center justify-center">
                      <Icon className={`h-5 w-5 ${f.color}`} />
                    </div>
                    <div>
                      <span className="eyebrow block text-cobalt">{f.tagline}</span>
                      <h2 className="font-display text-xl font-bold text-foreground">{f.title}</h2>
                    </div>
                    <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                      {f.description}
                    </p>

                    <ul className="space-y-2 border-t border-border/60 pt-4 text-xs font-sans text-muted-foreground">
                      {f.highlights.map((h, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Link to={f.to}>
                    <Button variant="outline" className="w-full font-mono text-xs justify-between">
                      <span>Explore {f.title}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>

          {/* Bottom CTA */}
          <div className="mt-20 rounded-2xl border border-border bg-paper-sunken p-8 sm:p-12 text-center space-y-4">
            <h3 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
              Ready to test drive the entire suite?
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground font-sans max-w-xl mx-auto">
              Launch our developer console with schedule inventory, live telemetry history, and
              timezone preferences.
            </p>
            <div className="pt-2">
              <Link to="/app">
                <Button
                  size="lg"
                  className="bg-foreground text-background font-mono text-xs font-semibold hover:bg-foreground/90"
                >
                  Open Developer Console Now →
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
