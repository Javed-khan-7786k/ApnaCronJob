import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/navigation/site-header";
import { SiteFooter } from "@/components/navigation/site-footer";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/privacy")({
  head: () =>
    pageHead({
      title: "Privacy Policy — AapnaCronJob",
      description: "Our strict data collection, retention, and encryption policies.",
    }),
  component: PrivacyPage,
});

export function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <SiteHeader />

      <main className="flex-1 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 space-y-8 font-sans text-xs leading-relaxed text-muted-foreground">
          <div>
            <span className="eyebrow block mb-1">Legal & Compliance</span>
            <h1 className="font-display text-4xl font-extrabold tracking-tight text-foreground">
              Privacy Policy
            </h1>
            <p className="mt-2 text-xs font-mono">Last updated: October 2026</p>
          </div>

          <div className="space-y-6">
            <section className="space-y-2">
              <h2 className="font-display font-bold text-base text-foreground">
                1. Data Minimization & Collection
              </h2>
              <p>
                AapnaCronJob collects only information necessary to authenticate users, dispatch
                scheduled HTTP requests, and deliver incident alerts. We never sell, rent, or
                monetize your payload contents, scheduled endpoint URLs, or telemetry logs.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-display font-bold text-base text-foreground">
                2. Secret & Header Encryption
              </h2>
              <p>
                All sensitive HTTP headers, authorization bearer tokens, and webhook signing keys
                are stored in encrypted vaults using AES-256-GCM. Decryption keys are loaded into
                volatile runner memory only at dispatch time and discarded immediately.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-display font-bold text-base text-foreground">
                3. Execution Log Retention
              </h2>
              <p>
                Execution telemetry, HTTP status codes, response times, and failure snippets are
                retained for the duration specified by your plan (7 days for Hobby, 90 days for Pro,
                365 days for Enterprise). You may purge your history at any time via the Console.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-display font-bold text-base text-foreground">
                4. Sub-processors & Infrastructure
              </h2>
              <p>
                AapnaCronJob relies on SOC2 Type II certified cloud providers (AWS, Cloudflare) for
                hosting distributed runners and routing DNS. All transfers occur over encrypted TLS
                1.3 channels.
              </p>
            </section>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
