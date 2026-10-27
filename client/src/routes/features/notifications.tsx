import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/navigation/site-header";
import { SiteFooter } from "@/components/navigation/site-footer";
import { Button } from "@/components/ui/button";
import { Bell, MessageSquare, AlertCircle, CheckCircle2 } from "lucide-react";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/features/notifications")({
  head: () =>
    pageHead({
      title: "Multi-Channel Notifications — AapnaCronJob",
      description:
        "Route failure alerts and recovery events to Slack, Discord, PagerDuty, and webhooks.",
    }),
  component: NotificationsFeaturePage,
});

export function NotificationsFeaturePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <SiteHeader />

      <main className="flex-1 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="eyebrow block text-rose-500 font-semibold">Alert Dispatch</span>
            <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
              Instant Multi-Channel Alerting
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground font-sans">
              Never miss a silent cron failure. Route rich incident cards to the channels your
              engineering team already watches.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-xl border border-border bg-card p-6 space-y-3">
              <MessageSquare className="h-6 w-6 text-cobalt" />
              <h3 className="font-semibold text-sm text-foreground">Slack & Discord Cards</h3>
              <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                Structured message attachments display endpoint URL, HTTP response code, duration,
                and error snippet with direct links into execution logs.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 space-y-3">
              <AlertCircle className="h-6 w-6 text-rose-500" />
              <h3 className="font-semibold text-sm text-foreground">
                PagerDuty Incident Escalation
              </h3>
              <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                Trigger on-call rotations when critical backend jobs fail repeatedly. Automatically
                resolves PagerDuty incidents when the next run recovers.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 space-y-3">
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              <h3 className="font-semibold text-sm text-foreground">Recovery Confirmations</h3>
              <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                Know when things go green again. AapnaCronJob dispatches an all-clear notification
                immediately after a previously failed job completes successfully.
              </p>
            </div>
          </div>

          <div className="text-center pt-8">
            <Link to="/app/notifications">
              <Button
                size="lg"
                className="bg-foreground text-background font-mono text-xs font-semibold hover:bg-foreground/90"
              >
                Configure Notification Channels →
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
