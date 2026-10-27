import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/navigation/site-header";
import { SiteFooter } from "@/components/navigation/site-footer";
import { Button } from "@/components/ui/button";
import { Shield, Clock, Heart, Users, ArrowRight } from "lucide-react";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/about")({
  head: () =>
    pageHead({
      title: "About Us — AapnaCronJob",
      description: "Our mission to provide developers with reliable, silent-failure-free cron infrastructure.",
    }),
  component: AboutPage,
});

export function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <SiteHeader />

      <main className="flex-1 py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="space-y-4">
            <span className="eyebrow block">Our Mission</span>
            <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
              Built for developers who care about silent failures.
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground font-sans leading-relaxed">
              We started AapnaCronJob after experiencing a 3-day database backup outage caused by an unannounced server restart. Local crontab didn't tell us; customer tickets did.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            <div className="rounded-xl border border-border bg-card p-6 space-y-3">
              <Clock className="h-6 w-6 text-cobalt" />
              <h2 className="font-display font-bold text-lg text-foreground">
                Obsessed with Sub-Second Time
              </h2>
              <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                Time isn't approximate. When you schedule a job for 02:00:00 UTC, it shouldn't execute at 02:00:38. Our distributed runner fleet uses synchronized atomic reference clocks to guarantee punctuality.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 space-y-3">
              <Shield className="h-6 w-6 text-emerald-500" />
              <h2 className="font-display font-bold text-lg text-foreground">
                Editorial Design Clarity
              </h2>
              <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                Developer tools shouldn't feel cluttered or noisy. We prioritize clean typography, high information density, and instant comprehension over decorative animations and bloated dashboards.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-paper-sunken p-8 space-y-4">
            <h3 className="font-display text-xl font-bold text-foreground">
              The Engineering Team
            </h3>
            <p className="text-xs text-muted-foreground font-sans leading-relaxed">
              AapnaCronJob is built by a distributed team of systems engineers, distributed database alumni, and frontend designers across San Francisco, London, Berlin, and Bengaluru.
            </p>
            <div className="pt-2">
              <Link to="/contact">
                <Button variant="outline" className="font-mono text-xs">
                  Get in Touch with our Founders →
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
