import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SiteHeader } from "@/components/navigation/site-header";
import { SiteFooter } from "@/components/navigation/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GoogleIcon, GitHubIcon } from "@/components/ui/social-icons";
import { apiClient } from "@/lib/api-client";
import { useDemoAuth } from "@/lib/demo-auth";
import { ShieldCheck, Loader2, Lock } from "lucide-react";
import { pageHead } from "@/lib/head";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () =>
    pageHead({
      title: "Sign In — AapnaCronJob",
      description: "Sign in with Google, GitHub, or email credentials to access your AapnaCronJob scheduling console.",
    }),
  component: LoginPage,
});

export function LoginPage() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { signIn } = useDemoAuth();
  const navigate = useNavigate();

  const handleGoogleSignIn = () => {
    setGoogleLoading(true);
    toast.loading("Redirecting to Google secure authentication...", { id: "google-auth" });
    const baseUrl = apiClient.getApiBaseUrl();
    // Active real backend Google OAuth consent initiation
    window.location.href = `${baseUrl}/auth/google`;
  };

  const handleGitHubClick = (e: React.MouseEvent) => {
    // Show GitHub button, but strictly no action on click as requested
    e.preventDefault();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanLogin = login.trim();
    const cleanPassword = password.trim();

    if (!cleanLogin || !cleanPassword) {
      toast.error("Please enter both username/email and password.");
      return;
    }

    setSubmitting(true);
    try {
      await signIn({ login: cleanLogin, password: cleanPassword });
      toast.success("Welcome back! Successfully authenticated.");
      navigate({ to: "/app" });
    } catch (err: any) {
      toast.error(err.message || "Invalid username/email or password.");
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
              Sign in to AapnaCronJob
            </h1>
            <p className="text-xs text-muted-foreground font-sans">
              Sign in with your developer account or enter email credentials.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 space-y-5 shadow-xs">
            {/* Social Logins: Active Google & Display-only GitHub */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Active Google OAuth Button */}
              <Button
                type="button"
                variant="outline"
                disabled={submitting || googleLoading}
                onClick={handleGoogleSignIn}
                className="h-10 font-mono text-xs font-medium border-border hover:bg-muted/70 transition-colors flex items-center justify-center gap-2 bg-background text-foreground"
                title="Sign in with Google"
              >
                {googleLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : (
                  <GoogleIcon className="h-4 w-4 shrink-0" />
                )}
                <span>Google</span>
              </Button>

              {/* GitHub Button: Visible, but no action on click as requested */}
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
                  Or continue with credentials
                </span>
              </div>
            </div>

            {/* Email / Username Credentials Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">
                  Username or Email
                </label>
                <Input
                  type="text"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  placeholder="e.g. admin or ops@acme.dev"
                  autoComplete="username"
                  required
                  className="text-xs font-mono"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-mono uppercase text-muted-foreground">
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-[11px] font-mono text-cobalt hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
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
                    <span>Verifying credentials...</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-3.5 w-3.5" />
                    <span>Sign In to AapnaCronJob</span>
                  </>
                )}
              </Button>
            </form>

            <div className="rounded-lg border border-border bg-paper-sunken/60 p-3 text-[11px] font-mono text-muted-foreground flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>
                <strong className="text-foreground">Database Verified:</strong> Endpoints are secured via JWT bearer tokens and TLS 1.3 encrypted mesh.
              </span>
            </div>
          </div>

          <div className="text-center text-xs font-sans text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/register" className="text-cobalt hover:underline font-semibold font-mono">
              Register now
            </Link>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
