import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SiteHeader } from "@/components/navigation/site-header";
import { SiteFooter } from "@/components/navigation/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GoogleIcon, GitHubIcon } from "@/components/ui/social-icons";
import { apiClient } from "@/lib/api-client";
import { useDemoAuth } from "@/lib/demo-auth";
import { ShieldCheck, Loader2, UserPlus } from "lucide-react";
import { pageHead } from "@/lib/head";
import { toast } from "sonner";

export const Route = createFileRoute("/register")({
  head: () =>
    pageHead({
      title: "Create Account — AapnaCronJob",
      description:
        "Start scheduling jobs with sub-second precision. Sign up with Google, GitHub, or email.",
    }),
  component: RegisterPage,
});

export function RegisterPage() {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [workspace, setWorkspace] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { signUp } = useDemoAuth();
  const navigate = useNavigate();

  const handleGoogleSignUp = () => {
    setGoogleLoading(true);
    toast.loading("Connecting to Google OAuth...", { id: "google-signup" });
    const baseUrl = apiClient.getApiBaseUrl();
    window.location.href = `${baseUrl}/auth/google`;
  };

  const handleGitHubClick = (e: React.MouseEvent) => {
    // Show GitHub button, but strictly no action on click as requested
    e.preventDefault();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanPass = password.trim();

    if (!cleanName || !cleanEmail || !cleanPass) {
      toast.error("Please fill in your name, email, and password.");
      return;
    }

    if (cleanPass.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setSubmitting(true);
    try {
      await signUp({
        name: cleanName,
        username: username.trim(),
        email: cleanEmail,
        password: cleanPass,
        workspace: workspace.trim() || `${cleanName}'s Workspace`,
      });
      toast.success("Account registered successfully! Welcome to AapnaCronJob.");
      navigate({ to: "/app" });
    } catch (err: any) {
      toast.error(err.message || "Failed to create account. Please check your inputs.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <SiteHeader />

      <main className="flex-1 flex items-center justify-center py-16 px-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-foreground text-background font-mono font-bold text-lg shadow-sm">
              A
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
              Create your AapnaCronJob account
            </h1>
            <p className="text-xs text-muted-foreground font-sans">
              14-day Pro trial included. Real backend database registration.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 space-y-5 shadow-xs">
            {/* Social Logins: Active Google & Display-only GitHub */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <Button
                type="button"
                variant="outline"
                disabled={submitting || googleLoading}
                onClick={handleGoogleSignUp}
                className="h-10 font-mono text-xs font-medium border-border hover:bg-muted/70 transition-colors flex items-center justify-center gap-2 bg-background text-foreground"
                title="Sign up with Google"
              >
                {googleLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : (
                  <GoogleIcon className="h-4 w-4 shrink-0" />
                )}
                <span>Google</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleGitHubClick}
                className="h-10 font-mono text-xs font-medium border-border hover:bg-muted/40 transition-colors flex items-center justify-center gap-2 bg-background text-foreground cursor-default select-none"
                title="GitHub"
              >
                <GitHubIcon className="h-4 w-4 shrink-0" />
                <span>GitHub</span>
              </Button>
            </div>

            {/* Editorial Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-mono">
                <span className="bg-card px-2.5 text-muted-foreground tracking-wider">
                  Or register with email
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">
                  Full Name *
                </label>
                <Input
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!username) {
                      setUsername(
                        e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9_-]/g, "_")
                          .slice(0, 20),
                      );
                    }
                  }}
                  placeholder="e.g. Alex Rivera"
                  autoComplete="name"
                  required
                  className="text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">
                  Username (For Login)
                </label>
                <Input
                  value={username}
                  onChange={(e) =>
                    setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))
                  }
                  placeholder="e.g. alex_rivera"
                  autoComplete="username"
                  className="text-xs font-mono"
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
                  placeholder="e.g. alex@acme.dev"
                  autoComplete="email"
                  required
                  className="text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">
                  Password *
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  autoComplete="new-password"
                  required
                  className="text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">
                  Workspace / Team Name
                </label>
                <Input
                  value={workspace}
                  onChange={(e) => setWorkspace(e.target.value)}
                  placeholder="Acme Platform (optional)"
                  className="text-xs font-mono"
                />
              </div>

              <Button
                type="submit"
                disabled={submitting || googleLoading}
                className="w-full bg-foreground text-background font-mono text-xs font-semibold hover:bg-foreground/90 h-10 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Registering account in database...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="h-3.5 w-3.5" />
                    <span>Create Free Account</span>
                  </>
                )}
              </Button>

              <div className="rounded-lg border border-border bg-paper-sunken/60 p-3 text-[11px] font-mono text-muted-foreground flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  Direct MongoDB account creation with bcrypt password hashing and JWT sessions.
                </span>
              </div>

              <p className="text-[10px] text-muted-foreground text-center font-sans">
                By creating an account, you agree to our{" "}
                <Link to="/terms" className="underline hover:text-foreground">
                  Terms
                </Link>{" "}
                and{" "}
                <Link to="/privacy" className="underline hover:text-foreground">
                  Privacy Policy
                </Link>
                .
              </p>
            </form>
          </div>

          <div className="text-center text-xs font-sans text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-cobalt hover:underline font-semibold font-mono">
              Sign in
            </Link>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
