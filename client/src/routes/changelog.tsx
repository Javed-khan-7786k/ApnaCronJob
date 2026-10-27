import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/navigation/site-header";
import { SiteFooter } from "@/components/navigation/site-footer";
import { Badge } from "@/components/ui/badge";
import { demoChangelog } from "@/lib/demo-data";
import { Sparkles, ArrowRight, GitCommit } from "lucide-react";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/changelog")({
  head: () =>
    pageHead({
      title: "Product Changelog — AapnaCronJob",
      description: "Latest feature releases, performance improvements, and bug fixes in AapnaCronJob.",
    }),
  component: ChangelogPage,
});

export function ChangelogPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <SiteHeader />

      <main className="flex-1 py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="space-y-4">
            <span className="eyebrow block">Releases & Updates</span>
            <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
              Product Changelog
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground font-sans">
              Discover the newest capabilities, speed improvements, and reliability updates shipped to AapnaCronJob.
            </p>
          </div>

          <div className="relative border-l border-border/80 pl-6 space-y-10 ml-3">
            {demoChangelog.map((entry) => (
              <div key={entry.version} className="relative group space-y-3">
                {/* Dot */}
                <div className="absolute -left-[31px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-background bg-cobalt ring-2 ring-cobalt/20" />

                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono text-base font-bold text-foreground">
                    v{entry.version}
                  </span>
                  <span className="text-xs font-mono text-muted-foreground">
                    {entry.date}
                  </span>
                  <Badge
                    variant="outline"
                    className={`font-mono text-[10px] capitalize ${
                      entry.type === "feature"
                        ? "text-cobalt border-cobalt/30"
                        : entry.type === "improvement"
                        ? "text-emerald-600 border-emerald-500/30"
                        : "text-amber-600 border-amber-500/30"
                    }`}
                  >
                    {entry.type}
                  </Badge>
                </div>

                <div className="rounded-xl border border-border bg-card p-6 space-y-2">
                  <h2 className="font-display font-bold text-lg text-foreground">
                    {entry.title}
                  </h2>
                  <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                    {entry.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
