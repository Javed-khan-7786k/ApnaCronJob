import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/navigation/site-header";
import { SiteFooter } from "@/components/navigation/site-footer";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/terms")({
  head: () =>
    pageHead({
      title: "Terms of Service — AapnaCronJob",
      description: "Terms and conditions governing the use of AapnaCronJob scheduling services.",
    }),
  component: TermsPage,
});

export function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <SiteHeader />

      <main className="flex-1 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 space-y-8 font-sans text-xs leading-relaxed text-muted-foreground">
          <div>
            <span className="eyebrow block mb-1">Contractual Terms</span>
            <h1 className="font-display text-4xl font-extrabold tracking-tight text-foreground">
              Terms of Service
            </h1>
            <p className="mt-2 text-xs font-mono">Effective: October 2026</p>
          </div>

          <div className="space-y-6">
            <section className="space-y-2">
              <h2 className="font-display font-bold text-base text-foreground">1. Acceptance of Terms</h2>
              <p>
                By creating a AapnaCronJob account or using the scheduler API, you agree to comply with and be bound by these Terms of Service. If you are entering into this agreement on behalf of a company, you represent that you possess the authority to bind such entity.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-display font-bold text-base text-foreground">2. Permitted Use & Rate Limits</h2>
              <p>
                You agree not to use AapnaCronJob to initiate Distributed Denial of Service (DDoS) attacks, port scans, or unauthorized high-volume pings against third-party systems without documented consent. AapnaCronJob reserves the right to immediately suspend jobs that generate excessive network abuse.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-display font-bold text-base text-foreground">3. Service Level Agreement (SLA)</h2>
              <p>
                Paid Pro and Enterprise plans are backed by our 99.9% and 99.99% monthly availability SLAs. In the event of an unscheduled platform outage exceeding SLA thresholds, customers are eligible for prorated service fee credits upon request.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-display font-bold text-base text-foreground">4. Termination & Export</h2>
              <p>
                You may cancel your subscription or delete your account at any time. Upon account termination, all job definitions, encrypted authentication tokens, and execution history logs are permanently purged within 30 days.
              </p>
            </section>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
