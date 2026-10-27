import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/navigation/site-header";
import { SiteFooter } from "@/components/navigation/site-footer";
import { Button } from "@/components/ui/button";
import { Activity, ShieldCheck, Zap, Globe, AlertTriangle } from "lucide-react";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/features/http-monitoring")({
  head: () =>
    pageHead({
      title: "HTTP Health Monitoring — AapnaCronJob",
      description:
        "Continuous global endpoint monitoring, SSL certificate audits, and latency tracking.",
    }),
  component: HttpMonitoringFeaturePage,
});

export function HttpMonitoringFeaturePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <SiteHeader />

      <main className="flex-1 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="eyebrow block text-emerald-500 font-semibold">
              Reliability & Uptime
            </span>
            <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
              HTTP Endpoint Health Monitoring
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground font-sans">
              Verify that your microservices, APIs, and webhooks are active, responsive, and
              returning expected status codes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="rounded-xl border border-border bg-card p-6 space-y-3">
              <Zap className="h-6 w-6 text-cobalt" />
              <h3 className="font-semibold text-base text-foreground">
                Sub-Millisecond Latency Profiling
              </h3>
              <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                Track DNS resolution time, TCP handshake duration, and Time to First Byte (TTFB)
                across every run. Catch performance degradations before they cause service downtime.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 space-y-3">
              <ShieldCheck className="h-6 w-6 text-emerald-500" />
              <h3 className="font-semibold text-base text-foreground">SSL/TLS Certificate Guard</h3>
              <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                Audits certificate expiry dates, cipher suite negotiation, and chain validity.
                Receive proactive notifications 30, 14, and 7 days prior to certificate expiration.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 space-y-3">
              <Globe className="h-6 w-6 text-purple-500" />
              <h3 className="font-semibold text-base text-foreground">Multi-Region Probing</h3>
              <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                Probe endpoints from North America, Europe, and Asia-Pacific. Identify localized
                routing failures or CDN edge cache faults instantly.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 space-y-3">
              <AlertTriangle className="h-6 w-6 text-amber-500" />
              <h3 className="font-semibold text-base text-foreground">Response Body Assertions</h3>
              <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                Validate that returning JSON matches expected schemas or specific regex patterns,
                avoiding false-positive 200 OK responses on internal application crashes.
              </p>
            </div>
          </div>

          <div className="text-center pt-8">
            <Link to="/app/monitoring">
              <Button
                size="lg"
                className="bg-foreground text-background font-mono text-xs font-semibold hover:bg-foreground/90"
              >
                Explore Monitoring Dashboard →
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
