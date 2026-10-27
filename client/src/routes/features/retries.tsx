import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/navigation/site-header";
import { SiteFooter } from "@/components/navigation/site-footer";
import { Button } from "@/components/ui/button";
import { Repeat, ShieldAlert, Cpu, Sparkles } from "lucide-react";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/features/retries")({
  head: () =>
    pageHead({
      title: "Retries & Fault Handling — AapnaCronJob",
      description: "Automated retry engine with exponential backoff and jitter algorithms.",
    }),
  component: RetriesFeaturePage,
});

export function RetriesFeaturePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <SiteHeader />

      <main className="flex-1 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="eyebrow block text-amber-500 font-semibold">Self-Healing</span>
            <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
              Exponential Backoff & Smart Retries
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground font-sans">
              Protect your infrastructure from transient hiccups. Configure automatic retries with
              mathematically sound backoff curves and jitter.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-xl border border-border bg-card p-6 space-y-3">
              <Repeat className="h-6 w-6 text-cobalt" />
              <h3 className="font-semibold text-sm text-foreground">Full Decorrelated Jitter</h3>
              <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                Applies AWS recommended decorrelated jitter formulas to randomize retry timestamps,
                eliminating synchronized request stampedes on recovering servers.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 space-y-3">
              <Cpu className="h-6 w-6 text-amber-500" />
              <h3 className="font-semibold text-sm text-foreground">Configurable Retry Budgets</h3>
              <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                Set retry counts from 0 to 5 per individual job. Distinguish between idempotent
                endpoints and non-idempotent webhooks safely.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 space-y-3">
              <ShieldAlert className="h-6 w-6 text-rose-500" />
              <h3 className="font-semibold text-sm text-foreground">Smart Error Classification</h3>
              <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                Automatically retries HTTP 502, 503, 504, and network timeouts. Immediately halts
                retries on client errors (400, 401, 403, 404) to avoid log spam.
              </p>
            </div>
          </div>

          <div className="text-center pt-8">
            <Link to="/app">
              <Button
                size="lg"
                className="bg-foreground text-background font-mono text-xs font-semibold hover:bg-foreground/90"
              >
                Test Retry Engine in Developer Console →
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
