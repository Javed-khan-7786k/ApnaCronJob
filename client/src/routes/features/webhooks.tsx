import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/navigation/site-header";
import { SiteFooter } from "@/components/navigation/site-footer";
import { Button } from "@/components/ui/button";
import { Webhook, Lock, Terminal, Shield } from "lucide-react";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/features/webhooks")({
  head: () =>
    pageHead({
      title: "Webhook Scheduling — AapnaCronJob",
      description: "Cryptographically signed outgoing webhooks with HMAC-SHA256 headers.",
    }),
  component: WebhooksFeaturePage,
});

export function WebhooksFeaturePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <SiteHeader />

      <main className="flex-1 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="eyebrow block text-purple-500 font-semibold">Integrations</span>
            <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
              Secure Webhook Scheduling
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground font-sans">
              Deliver custom JSON payloads to any HTTPS target with cryptographic HMAC signatures
              and replay defense.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-xl border border-border bg-card p-6 space-y-3">
              <Lock className="h-6 w-6 text-cobalt" />
              <h3 className="font-semibold text-sm text-foreground">HMAC-SHA256 Signatures</h3>
              <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                Every dispatched webhook contains an `X-AapnaCronJob-Signature` header calculated
                using your secret key. Verify authenticity on your receiving backend effortlessly.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 space-y-3">
              <Terminal className="h-6 w-6 text-purple-500" />
              <h3 className="font-semibold text-sm text-foreground">Dynamic Payload Variables</h3>
              <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                Interpolate dynamic execution metadata into request bodies: `{"{{timestamp}}"}`, `
                {"{{job_id}}"}`, `{"{{attempt}}"}`, and `{"{{scheduled_time}}"}`.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 space-y-3">
              <Shield className="h-6 w-6 text-emerald-500" />
              <h3 className="font-semibold text-sm text-foreground">Replay Attack Prevention</h3>
              <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                Timestamp validation within signatures prevents bad actors from intercepting and
                replaying historical webhook dispatches against your systems.
              </p>
            </div>
          </div>

          <div className="text-center pt-8">
            <Link to="/app/integrations">
              <Button
                size="lg"
                className="bg-foreground text-background font-mono text-xs font-semibold hover:bg-foreground/90"
              >
                Explore Connected Integrations →
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
