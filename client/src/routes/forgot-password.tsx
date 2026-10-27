import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/navigation/site-header";
import { SiteFooter } from "@/components/navigation/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, CheckCircle2, Mail } from "lucide-react";
import { pageHead } from "@/lib/head";
import { toast } from "sonner";

export const Route = createFileRoute("/forgot-password")({
  head: () =>
    pageHead({
      title: "Password Recovery — AapnaCronJob",
      description: "Recover your AapnaCronJob account credentials.",
    }),
  component: ForgotPasswordPage,
});

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSent(true);
    toast.success("Secure password reset token dispatched to your email address.");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <SiteHeader />

      <main className="flex-1 flex items-center justify-center py-16 px-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
              Recover your password
            </h1>
            <p className="text-xs text-muted-foreground font-sans">
              Enter your account email to receive a secure recovery link.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
            {sent ? (
              <div className="text-center space-y-4 py-4">
                <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
                <h2 className="font-display font-bold text-base text-foreground">
                  Check your inbox
                </h2>
                <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                  We sent a recovery token to <strong className="font-mono text-foreground">{email}</strong>. Check your spam folder if you do not receive the link within 2 minutes.
                </p>
                <div className="pt-2">
                  <Link to="/login">
                    <Button variant="outline" className="w-full font-mono text-xs">
                      Return to Sign In
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@acme.dev"
                    required
                    className="text-xs font-mono"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-foreground text-background font-mono text-xs font-semibold hover:bg-foreground/90 h-10"
                >
                  Send Recovery Link
                </Button>
              </form>
            )}
          </div>

          <div className="text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to sign in</span>
            </Link>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
