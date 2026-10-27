import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/navigation/site-header";
import { SiteFooter } from "@/components/navigation/site-footer";
import { CronEditor } from "@/components/cron/cron-editor";
import { Button } from "@/components/ui/button";
import { Clock, Check, HelpCircle } from "lucide-react";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/docs/cron-expressions")({
  head: () =>
    pageHead({
      title: "Cron Expression Syntax Guide — AapnaCronJob Docs",
      description: "Master standard 5-field cron syntax, step intervals, lists, ranges, and timezone rules.",
    }),
  component: CronExpressionsDocPage,
});

export function CronExpressionsDocPage() {
  const [testCron, setTestCron] = useState("*/15 9-17 * * 1-5");

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <SiteHeader />

      <main className="flex-1 py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-12">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-2">
              <Link to="/docs" className="hover:text-foreground">Docs</Link>
              <span>/</span>
              <span>Cron Syntax</span>
            </div>
            <h1 className="font-display text-4xl font-extrabold tracking-tight text-foreground">
              Cron Expression Syntax Guide
            </h1>
            <p className="mt-2 text-sm text-muted-foreground font-sans">
              AapnaCronJob adheres to the standard 5-field Unix cron specification with microsecond dispatch accuracy.
            </p>
          </div>

          {/* Interactive Tester */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-3">
            <span className="eyebrow block">Live Syntax Tester</span>
            <CronEditor value={testCron} onChange={setTestCron} timezone="UTC" />
          </div>

          {/* 5-Field Table */}
          <div className="space-y-4">
            <h2 className="font-display text-2xl font-bold text-foreground">
              The 5 Cron Fields
            </h2>
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-paper-sunken border-b border-border text-muted-foreground uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Position</th>
                    <th className="p-3">Field</th>
                    <th className="p-3">Allowed Values</th>
                    <th className="p-3">Special Characters</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  <tr>
                    <td className="p-3 font-bold text-foreground">1</td>
                    <td className="p-3">Minute</td>
                    <td className="p-3">0 – 59</td>
                    <td className="p-3">* , - /</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-foreground">2</td>
                    <td className="p-3">Hour</td>
                    <td className="p-3">0 – 23 (24h format)</td>
                    <td className="p-3">* , - /</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-foreground">3</td>
                    <td className="p-3">Day of Month</td>
                    <td className="p-3">1 – 31</td>
                    <td className="p-3">* , - /</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-foreground">4</td>
                    <td className="p-3">Month</td>
                    <td className="p-3">1 – 12</td>
                    <td className="p-3">* , - /</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-foreground">5</td>
                    <td className="p-3">Day of Week</td>
                    <td className="p-3">0 – 6 (0 = Sunday, 6 = Saturday)</td>
                    <td className="p-3">* , - /</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Special characters explanation */}
          <div className="space-y-4 text-xs font-sans text-muted-foreground leading-relaxed">
            <h2 className="font-display text-2xl font-bold text-foreground">
              Special Operators
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-border bg-card">
                <code className="font-mono text-sm font-bold text-cobalt block mb-1">* (Asterisk)</code>
                Matches all values in the field. E.g. `*` in the hour field means "every hour".
              </div>
              <div className="p-4 rounded-xl border border-border bg-card">
                <code className="font-mono text-sm font-bold text-cobalt block mb-1">, (Comma)</code>
                Separates list values. E.g. `1,15,30` in the minute field runs at minutes 1, 15, and 30.
              </div>
              <div className="p-4 rounded-xl border border-border bg-card">
                <code className="font-mono text-sm font-bold text-cobalt block mb-1">- (Hyphen)</code>
                Defines ranges. E.g. `9-17` in the hour field specifies every hour from 9:00 through 17:00.
              </div>
              <div className="p-4 rounded-xl border border-border bg-card">
                <code className="font-mono text-sm font-bold text-cobalt block mb-1">/ (Slash)</code>
                Specifies step values. E.g. `*/10` in minute means "every 10 minutes".
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-border">
            <Link to="/docs/quickstart">
              <Button variant="ghost" size="sm" className="font-mono text-xs">
                ← Quickstart Guide
              </Button>
            </Link>
            <Link to="/docs/api">
              <Button size="sm" className="font-mono text-xs bg-foreground text-background">
                REST API Reference →
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
