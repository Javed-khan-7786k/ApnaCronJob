import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/navigation/site-header";
import { SiteFooter } from "@/components/navigation/site-footer";
import { Button } from "@/components/ui/button";
import { Check, HelpCircle, ArrowRight } from "lucide-react";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/pricing")({
  head: () =>
    pageHead({
      title: "Pricing & Plans — AapnaCronJob",
      description: "Predictable, transparent pricing for teams of any size. Zero lock-in.",
    }),
  component: PricingPage,
});

export function PricingPage() {
  const [annual, setAnnual] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <SiteHeader />

      <main className="flex-1 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-4">
            <span className="eyebrow block">Straightforward Pricing</span>
            <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
              Simple, transparent pricing for mission-critical scheduling.
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground font-sans">
              No hidden surge charges, no opaque credit tokens. Pay for the concurrency and reliability you need.
            </p>

            <div className="pt-4 flex justify-center">
              <div className="inline-flex items-center gap-3 p-1 rounded-full border border-border bg-card">
                <button
                  type="button"
                  onClick={() => setAnnual(false)}
                  className={`px-4 py-1.5 text-xs font-mono rounded-full transition-colors ${
                    !annual ? "bg-foreground text-background font-semibold" : "text-muted-foreground"
                  }`}
                >
                  Monthly billing
                </button>
                <button
                  type="button"
                  onClick={() => setAnnual(true)}
                  className={`px-4 py-1.5 text-xs font-mono rounded-full transition-colors flex items-center gap-1.5 ${
                    annual ? "bg-foreground text-background font-semibold" : "text-muted-foreground"
                  }`}
                >
                  <span>Annual billing</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-600 px-1.5 py-0.5 rounded-full font-bold">
                    Save 20%
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Hobby */}
            <div className="rounded-xl border border-border bg-card p-8 flex flex-col justify-between space-y-6">
              <div>
                <span className="eyebrow block text-muted-foreground">Free Tier</span>
                <h2 className="font-display text-2xl font-bold text-foreground">Hobby</h2>
                <div className="mt-4 flex items-baseline">
                  <span className="font-mono text-4xl font-extrabold text-foreground">$0</span>
                  <span className="text-xs text-muted-foreground font-mono ml-1">/ month</span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground font-sans">
                  Ideal for personal projects, experiments, and simple pings.
                </p>

                <div className="mt-6 border-t border-border/80 pt-6 space-y-3 text-xs font-sans">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500" />
                    <span>Up to 10 active jobs</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500" />
                    <span>5-minute minimum interval</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500" />
                    <span>7 days execution log retention</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500" />
                    <span>Email incident alerts</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground/60">
                    <span>✕ No team collaboration</span>
                  </div>
                </div>
              </div>

              <Link to="/register">
                <Button variant="outline" className="w-full font-mono text-xs">
                  Create Free Account
                </Button>
              </Link>
            </div>

            {/* Pro */}
            <div className="rounded-xl border-2 border-cobalt bg-card p-8 flex flex-col justify-between space-y-6 relative shadow-lg">
              <div className="absolute -top-3 right-6 rounded-full bg-cobalt px-3 py-0.5 text-[10px] font-mono font-bold text-white uppercase tracking-wider">
                Production Standard
              </div>

              <div>
                <span className="eyebrow block text-cobalt font-semibold">Scaling</span>
                <h2 className="font-display text-2xl font-bold text-foreground">Pro</h2>
                <div className="mt-4 flex items-baseline">
                  <span className="font-mono text-4xl font-extrabold text-foreground">
                    ${annual ? "19" : "24"}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono ml-1">/ month</span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground font-sans">
                  For growing web applications, SaaS, and mission-critical workflows.
                </p>

                <div className="mt-6 border-t border-border/80 pt-6 space-y-3 text-xs font-sans">
                  <div className="flex items-center gap-2 font-medium text-foreground">
                    <Check className="h-4 w-4 text-cobalt" />
                    <span>Unlimited active jobs</span>
                  </div>
                  <div className="flex items-center gap-2 font-medium text-foreground">
                    <Check className="h-4 w-4 text-cobalt" />
                    <span>1-second minimum precision</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-cobalt" />
                    <span>90 days execution log retention</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-cobalt" />
                    <span>Slack, Discord, & PagerDuty alerts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-cobalt" />
                    <span>Exponential retry backoff engine</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-cobalt" />
                    <span>5 workspace team seats</span>
                  </div>
                </div>
              </div>

              <Link to="/app">
                <Button className="w-full bg-cobalt hover:bg-cobalt/90 text-white font-mono text-xs font-semibold">
                  Start 14-Day Free Trial
                </Button>
              </Link>
            </div>

            {/* Enterprise */}
            <div className="rounded-xl border border-border bg-card p-8 flex flex-col justify-between space-y-6">
              <div>
                <span className="eyebrow block text-muted-foreground">Compliance</span>
                <h2 className="font-display text-2xl font-bold text-foreground">Enterprise</h2>
                <div className="mt-4 flex items-baseline">
                  <span className="font-mono text-4xl font-extrabold text-foreground">
                    ${annual ? "119" : "149"}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono ml-1">/ month</span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground font-sans">
                  For regulated industries, high-volume queues, and custom SLAs.
                </p>

                <div className="mt-6 border-t border-border/80 pt-6 space-y-3 text-xs font-sans">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500" />
                    <span>Dedicated static runner IP ranges</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500" />
                    <span>99.99% contractual uptime SLA</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500" />
                    <span>1-year audit log retention</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500" />
                    <span>SAML / Okta SSO & SCIM directory sync</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500" />
                    <span>Dedicated Slack engineer channel</span>
                  </div>
                </div>
              </div>

              <Link to="/contact">
                <Button variant="outline" className="w-full font-mono text-xs">
                  Talk to Enterprise Sales
                </Button>
              </Link>
            </div>
          </div>

          {/* Feature Comparison Table */}
          <div className="mt-20 max-w-5xl mx-auto">
            <h3 className="font-display text-2xl font-bold text-center mb-8">
              Full Feature Comparison
            </h3>

            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-paper-sunken border-b border-border text-muted-foreground text-[10px] uppercase">
                  <tr>
                    <th className="p-3">Capability</th>
                    <th className="p-3 text-center">Hobby</th>
                    <th className="p-3 text-center text-cobalt font-bold">Pro</th>
                    <th className="p-3 text-center">Enterprise</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  <tr>
                    <td className="p-3 font-semibold text-foreground">Scheduled Jobs</td>
                    <td className="p-3 text-center text-muted-foreground">10</td>
                    <td className="p-3 text-center font-bold text-foreground">Unlimited</td>
                    <td className="p-3 text-center font-bold text-foreground">Unlimited</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-foreground">Execution Interval</td>
                    <td className="p-3 text-center text-muted-foreground">5 min</td>
                    <td className="p-3 text-center font-bold text-foreground">1 sec</td>
                    <td className="p-3 text-center font-bold text-foreground">Sub-second</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-foreground">Execution Log History</td>
                    <td className="p-3 text-center text-muted-foreground">7 days</td>
                    <td className="p-3 text-center text-foreground">90 days</td>
                    <td className="p-3 text-center text-foreground">365 days</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-foreground">Retry Strategies</td>
                    <td className="p-3 text-center text-muted-foreground">Fixed (1x)</td>
                    <td className="p-3 text-center text-foreground">Exponential (up to 5x)</td>
                    <td className="p-3 text-center text-foreground">Custom backoff & jitter</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-foreground">Static Egress IPs</td>
                    <td className="p-3 text-center text-muted-foreground">✕</td>
                    <td className="p-3 text-center text-foreground">Shared Pool</td>
                    <td className="p-3 text-center font-bold text-emerald-600">Dedicated IPs</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-foreground">Uptime SLA</td>
                    <td className="p-3 text-center text-muted-foreground">Best effort</td>
                    <td className="p-3 text-center text-foreground">99.9%</td>
                    <td className="p-3 text-center font-bold text-emerald-600">99.99% Contractual</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
