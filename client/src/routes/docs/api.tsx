import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/navigation/site-header";
import { SiteFooter } from "@/components/navigation/site-footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Code, Terminal, Key, Shield } from "lucide-react";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/docs/api")({
  head: () =>
    pageHead({
      title: "REST API Reference — AapnaCronJob Docs",
      description:
        "Complete REST API reference for programmatic scheduling and telemetry extraction.",
    }),
  component: ApiDocPage,
});

export function ApiDocPage() {
  const endpoints = [
    {
      method: "GET",
      path: "/v1/jobs",
      description: "List all scheduled jobs in your workspace with pagination and status filters.",
    },
    {
      method: "POST",
      path: "/v1/jobs",
      description: "Create a new scheduled job with target URL, cron schedule, and retry policies.",
    },
    {
      method: "GET",
      path: "/v1/jobs/:id",
      description:
        "Retrieve a specific job's configuration, metrics, and latest execution outcome.",
    },
    {
      method: "POST",
      path: "/v1/jobs/:id/trigger",
      description: "Trigger an immediate execution outside the normal schedule.",
    },
    {
      method: "DELETE",
      path: "/v1/jobs/:id",
      description: "Permanently delete a scheduled job and cancel pending retries.",
    },
    {
      method: "GET",
      path: "/v1/executions",
      description: "Stream historical execution logs, status codes, and latency measurements.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <SiteHeader />

      <main className="flex-1 py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-12">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-2">
              <Link to="/docs" className="hover:text-foreground">
                Docs
              </Link>
              <span>/</span>
              <span>REST API</span>
            </div>
            <h1 className="font-display text-4xl font-extrabold tracking-tight text-foreground">
              REST API Reference
            </h1>
            <p className="mt-2 text-sm text-muted-foreground font-sans">
              Base URL:{" "}
              <code className="rounded bg-paper-sunken border border-border px-1.5 py-0.5 font-mono text-xs text-foreground">
                https://api.aapnacronjob.com
              </code>
            </p>
          </div>

          {/* Authentication section */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-3">
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5 text-cobalt" />
              <h2 className="font-display font-bold text-lg text-foreground">Authentication</h2>
            </div>
            <p className="text-xs text-muted-foreground font-sans leading-relaxed">
              Authenticate all API requests using a Bearer token in the standard HTTP{" "}
              <code className="font-mono text-foreground">Authorization</code> header. You can
              generate and rotate keys under{" "}
              <Link to="/app/api-keys" className="text-cobalt underline">
                Console &gt; API Keys
              </Link>
              .
            </p>
            <pre className="rounded bg-paper-sunken border border-border/80 p-3 font-mono text-[11px] text-foreground">
              Authorization: Bearer crn_live_a89f4b321c8e
            </pre>
          </div>

          {/* Endpoints List */}
          <div className="space-y-4">
            <h2 className="font-display text-2xl font-bold text-foreground">Endpoints</h2>

            <div className="space-y-4">
              {endpoints.map((ep) => (
                <div
                  key={ep.path + ep.method}
                  className="rounded-xl border border-border bg-card p-5 space-y-2 hover:border-foreground/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className={`font-mono text-[10px] ${
                        ep.method === "GET"
                          ? "text-emerald-600 border-emerald-500/30"
                          : ep.method === "POST"
                            ? "text-cobalt border-cobalt/30"
                            : "text-rose-600 border-rose-500/30"
                      }`}
                    >
                      {ep.method}
                    </Badge>
                    <code className="font-mono text-xs font-semibold text-foreground">
                      {ep.path}
                    </code>
                  </div>
                  <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                    {ep.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-border">
            <Link to="/docs/cron-expressions">
              <Button variant="ghost" size="sm" className="font-mono text-xs">
                ← Cron Syntax Guide
              </Button>
            </Link>
            <Link to="/app">
              <Button size="sm" className="font-mono text-xs bg-foreground text-background">
                Test API in Developer Console →
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
