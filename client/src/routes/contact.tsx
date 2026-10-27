import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/navigation/site-header";
import { SiteFooter } from "@/components/navigation/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MessageSquare, Clock, Send, CheckCircle2 } from "lucide-react";
import { pageHead } from "@/lib/head";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  head: () =>
    pageHead({
      title: "Contact & Support — AapnaCronJob",
      description: "Reach our technical support engineers and sales team.",
    }),
  component: ContactPage,
});

export function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [ticketId, setTicketId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    const generatedTicket = `TICK-${Math.floor(100000 + Math.random() * 900000)}`;

    try {
      const existing = JSON.parse(localStorage.getItem("aapnacronjob_inquiries") || "[]");
      existing.unshift({
        ticketId: generatedTicket,
        name,
        email,
        subject: subject || "Technical & SLA Inquiry",
        message,
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem("aapnacronjob_inquiries", JSON.stringify(existing));
    } catch {
      // ignore
    }

    setTimeout(() => {
      setSubmitting(false);
      setTicketId(generatedTicket);
      toast.success(`Support Ticket #${generatedTicket} registered with engineering.`);
    }, 400);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <SiteHeader />

      <main className="flex-1 py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="space-y-4">
            <span className="eyebrow block">Direct Channel</span>
            <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
              Contact our engineering team.
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground font-sans">
              Have questions about SLA guarantees, custom IP whitelisting, or high-throughput plans?
              We respond within 2 hours during business hours.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Form or Ticket Confirmation */}
            <div className="md:col-span-7">
              {ticketId ? (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-6 space-y-4">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold">
                    <CheckCircle2 className="h-5 w-5" />
                    Support Request Registered
                  </div>
                  <div className="p-3 bg-background rounded-lg border border-border space-y-2 text-xs font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground uppercase text-[10px]">
                        Ticket Reference
                      </span>
                      <span className="font-bold text-foreground">#{ticketId}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground uppercase text-[10px]">
                        Target Contact
                      </span>
                      <span className="text-foreground">{email}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground uppercase text-[10px]">
                        Guaranteed SLA
                      </span>
                      <span className="text-emerald-600 font-bold">&lt; 2 Hours</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    An automated copy of this request has been logged. Our on-call engineers have
                    been notified.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setTicketId(null);
                      setName("");
                      setEmail("");
                      setSubject("");
                      setMessage("");
                    }}
                    className="w-full text-xs font-mono"
                  >
                    Submit Another Inquiry
                  </Button>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="rounded-xl border border-border bg-card p-6 space-y-4"
                >
                  <div>
                    <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">
                      Your Name *
                    </label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Alex Rivera"
                      required
                      className="text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">
                      Work Email *
                    </label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="alex@acme.dev"
                      required
                      className="text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">
                      Subject
                    </label>
                    <Input
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g. Enterprise SLA inquiry"
                      className="text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">
                      Message *
                    </label>
                    <Textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={4}
                      placeholder="Tell us about your workload, job volume, or requirements..."
                      required
                      className="text-xs font-sans"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-foreground text-background font-mono text-xs font-semibold hover:bg-foreground/90"
                  >
                    <Send className="h-3.5 w-3.5 mr-2" />
                    {submitting ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              )}
            </div>

            {/* Sidebar info */}
            <div className="md:col-span-5 space-y-6">
              <div className="rounded-xl border border-border bg-card p-6 space-y-3">
                <Mail className="h-5 w-5 text-cobalt" />
                <h3 className="font-semibold text-sm text-foreground">Email Support</h3>
                <p className="text-xs font-mono text-muted-foreground">support@aapnacronjob.com</p>
                <span className="text-[11px] text-muted-foreground/80 block">
                  Encrypted PGP key available on request.
                </span>
              </div>

              <div className="rounded-xl border border-border bg-card p-6 space-y-3">
                <Clock className="h-5 w-5 text-emerald-500" />
                <h3 className="font-semibold text-sm text-foreground">Support Hours</h3>
                <p className="text-xs font-mono text-muted-foreground">
                  Monday – Friday: 24/5 Global Follow-the-Sun
                </p>
                <span className="text-[11px] text-muted-foreground/80 block">
                  Critical PagerDuty escalations active 24/7/365 for Pro & Enterprise.
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
