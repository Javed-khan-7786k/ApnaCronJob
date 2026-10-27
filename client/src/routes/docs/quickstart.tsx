import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/navigation/site-header";
import { SiteFooter } from "@/components/navigation/site-footer";
import { Button } from "@/components/ui/button";
import { Terminal, Check, Copy } from "lucide-react";
import { pageHead } from "@/lib/head";
import { toast } from "sonner";

export const Route = createFileRoute("/docs/quickstart")({
  head: () =>
    pageHead({
      title: "Quickstart Guide — AapnaCronJob Docs",
      description: "Get started with AapnaCronJob in under 3 minutes.",
    }),
  component: QuickstartDocPage,
});

export function QuickstartDocPage() {
  const copySnippet = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Command copied");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <SiteHeader />

      <main className="flex-1 py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-12">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-2">
              <Link to="/docs" className="hover:text-foreground">Docs</Link>
              <span>/</span>
              <span>Quickstart</span>
            </div>
            <h1 className="font-display text-4xl font-extrabold tracking-tight text-foreground">
              Quickstart Guide
            </h1>
            <p className="mt-2 text-sm text-muted-foreground font-sans">
              Learn how to schedule an HTTP endpoint, configure retry rules, and inspect logs in 3 simple steps.
            </p>
          </div>

          <div className="space-y-8 text-xs font-sans text-muted-foreground leading-relaxed">
            {/* Step 1 */}
            <div className="rounded-xl border border-border bg-card p-6 space-y-3">
              <span className="font-mono text-xs font-bold text-cobalt block">STEP 1</span>
              <h2 className="font-display text-lg font-bold text-foreground">
                Expose an HTTP endpoint or webhook handler
              </h2>
              <p>
                Your destination server needs an accessible URL that accepts HTTP GET or POST requests. For example, a Next.js route handler or an AWS Lambda Function URL:
              </p>
              <pre className="rounded bg-paper-sunken border border-border/80 p-3 font-mono text-[11px] text-foreground overflow-x-auto">
{`// app/api/cron/sync/route.ts (Next.js App Router)
export async function POST(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== \`Bearer \${process.env.CRON_SECRET}\`) {
    return new Response("Unauthorized", { status: 401 });
  }

  await runNightlyDatabaseSync();
  return Response.json({ success: true, timestamp: Date.now() });
}`}
              </pre>
            </div>

            {/* Step 2 */}
            <div className="rounded-xl border border-border bg-card p-6 space-y-3">
              <span className="font-mono text-xs font-bold text-cobalt block">STEP 2</span>
              <h2 className="font-display text-lg font-bold text-foreground">
                Create a schedule in the console or via cURL
              </h2>
              <p>
                You can create the job via the UI at <Link to="/app/jobs/new" className="text-cobalt underline">/app/jobs/new</Link> or dispatch it via our REST API:
              </p>
              <pre className="rounded bg-paper-sunken border border-border/80 p-3 font-mono text-[11px] text-foreground overflow-x-auto">
{`curl -X POST https://api.aapnacronjob.com/v1/jobs \\
  -H "Authorization: Bearer acj_live_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Nightly Database Sync",
    "url": "https://yourdomain.com/api/cron/sync",
    "method": "POST",
    "cron": "0 2 * * *",
    "timezone": "America/New_York",
    "retry": { "maxAttempts": 3, "backoff": "exponential" }
  }'`}
              </pre>
            </div>

            {/* Step 3 */}
            <div className="rounded-xl border border-border bg-card p-6 space-y-3">
              <span className="font-mono text-xs font-bold text-cobalt block">STEP 3</span>
              <h2 className="font-display text-lg font-bold text-foreground">
                Inspect execution history and verify alerts
              </h2>
              <p>
                Head to your dashboard to see upcoming scheduled dispatches, latency graphs, and response payload inspections in real time.
              </p>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-border">
            <Link to="/docs">
              <Button variant="ghost" size="sm" className="font-mono text-xs">
                ← Documentation Hub
              </Button>
            </Link>
            <Link to="/docs/cron-expressions">
              <Button size="sm" className="font-mono text-xs bg-foreground text-background">
                Cron Syntax Guide →
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
