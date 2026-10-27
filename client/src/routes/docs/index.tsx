import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/navigation/site-header";
import { SiteFooter } from "@/components/navigation/site-footer";
import { Button } from "@/components/ui/button";
import { BookOpen, Terminal, Clock, Code, ArrowRight, Shield, Zap } from "lucide-react";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/docs/")({
  head: () =>
    pageHead({
      title: "Documentation Hub — AapnaCronJob",
      description: "Comprehensive guides, cron syntax references, and REST API documentation.",
    }),
  component: DocsIndexPage,
});

export function DocsIndexPage() {
  const sections = [
    {
      title: "Quickstart Guide",
      description: "Create and dispatch your first scheduled production job in under 3 minutes.",
      to: "/docs/quickstart",
      icon: Terminal,
    },
    {
      title: "Cron Syntax & Expressions",
      description: "Master 5-field cron notation, step values, lists, ranges, and timezone semantics.",
      to: "/docs/cron-expressions",
      icon: Clock,
    },
    {
      title: "REST API Reference",
      description: "Complete OpenAPI spec for programmatic job creation, execution polling, and audit extraction.",
      to: "/docs/api",
      icon: Code,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <SiteHeader />

      <main className="flex-1 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="max-w-3xl space-y-4">
            <span className="eyebrow block">Developer Documentation</span>
            <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
              AapnaCronJob Documentation
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground font-sans leading-relaxed">
              Everything you need to schedule, monitor, and troubleshoot HTTP triggers, webhooks, and background workflows.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {sections.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.title}
                  className="rounded-xl border border-border bg-card p-6 flex flex-col justify-between hover:border-foreground/30 transition-colors space-y-6"
                >
                  <div className="space-y-3">
                    <div className="h-10 w-10 rounded-lg border border-border bg-paper-sunken flex items-center justify-center text-cobalt">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h2 className="font-display font-bold text-lg text-foreground">
                      {s.title}
                    </h2>
                    <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                      {s.description}
                    </p>
                  </div>

                  <Link to={s.to}>
                    <Button variant="outline" className="w-full font-mono text-xs justify-between">
                      <span>Read Documentation</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>

          {/* Quick Code preview in docs */}
          <div className="rounded-xl border border-border bg-card p-8 space-y-4">
            <h3 className="font-display text-xl font-bold text-foreground">
              Core Architectural Guarantees
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-xs font-sans text-muted-foreground">
              <div className="p-4 rounded-lg border border-border bg-paper-sunken">
                <span className="font-bold text-foreground block mb-1">Sub-Second Dispatch</span>
                Dispatches are executed with atomic clock precision across multi-region consensus nodes.
              </div>
              <div className="p-4 rounded-lg border border-border bg-paper-sunken">
                <span className="font-bold text-foreground block mb-1">Zero Plaintext Secrets</span>
                Headers and auth credentials are encrypted using AES-256-GCM envelope encryption.
              </div>
              <div className="p-4 rounded-lg border border-border bg-paper-sunken">
                <span className="font-bold text-foreground block mb-1">Signed Payloads</span>
                Verify outgoing requests using the SHA-256 HMAC signature passed in `X-AapnaCronJob-Signature`.
              </div>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
