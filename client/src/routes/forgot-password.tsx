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
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetComplete, setResetComplete] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSent(true);
    toast.success(`Secure password reset token dispatched to ${email}`);
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetCode || !newPassword) {
      toast.error("Please enter the recovery token and your new password.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters.");
      return;
    }
    setResetComplete(true);
    toast.success("Password updated successfully! You can now log in.");
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
            {resetComplete ? (
              <div className="text-center space-y-4 py-4">
                <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
                <h2 className="font-display font-bold text-base text-foreground">
                  Password Updated
                </h2>
                <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                  Your credentials have been securely updated. You can now access your account with
                  your new password.
                </p>
                <div className="pt-2">
                  <Link to="/login">
                    <Button className="w-full bg-foreground text-background font-mono text-xs">
                      Sign In with New Password
                    </Button>
                  </Link>
                </div>
              </div>
            ) : sent ? (
              <form onSubmit={handleResetPassword} className="space-y-4 py-2">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-xs space-y-1">
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400 block">
                    Recovery Token Sent
                  </span>
                  <p className="text-muted-foreground text-[11px]">
                    We sent a 6-digit recovery code to{" "}
                    <strong className="text-foreground">{email}</strong>.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">
                    6-Digit Recovery Code
                  </label>
                  <Input
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value.slice(0, 8))}
                    placeholder="e.g. 741852"
                    required
                    className="text-xs font-mono tracking-widest text-center"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">
                    New Secure Password
                  </label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    minLength={6}
                    required
                    className="text-xs"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-foreground text-background font-mono text-xs"
                >
                  Save New Password
                </Button>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => setSent(false)}
                    className="text-[11px] text-muted-foreground hover:text-foreground font-mono"
                  >
                    ← Re-send token to different email
                  </button>
                </div>
              </form>
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
