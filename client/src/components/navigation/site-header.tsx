import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Clock,
  Menu,
  X,
  ChevronDown,
  Terminal,
  Activity,
  Layers,
  Repeat,
  Bell,
  Webhook,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LiveClock } from "@/components/clock/live-clock";
import { BackendStatusPill } from "@/components/navigation/backend-status-pill";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/85 backdrop-blur-md">
      {/* 1. Minimal announcement bar */}
      <div className="border-b border-border/50 bg-paper-sunken px-4 py-1.5 text-center text-xs font-mono text-muted-foreground">
        <Link
          to="/changelog"
          className="inline-flex items-center gap-2 hover:text-foreground transition-colors group"
        >
          <span className="inline-block rounded-full bg-cobalt/15 px-2 py-0.5 text-[10px] font-semibold text-cobalt uppercase tracking-wider">
            v3.4 Release
          </span>
          <span className="truncate">
            Calendar view & exponential backoff retry engine are now live
          </span>
          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* 2. Premium Main Navbar */}
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-foreground text-background font-mono font-bold text-base transition-transform group-hover:scale-105">
              A
            </div>
            <div className="flex flex-col">
              <span className="font-display font-extrabold tracking-tight text-lg text-foreground leading-none">
                Aapna<span className="text-cobalt">CronJob</span>
              </span>
              <span className="text-[9px] font-mono tracking-widest text-muted-foreground uppercase leading-tight mt-0.5">
                Precision Scheduler
              </span>
            </div>
          </Link>


          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                  <span>Features</span>
                  <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 p-1.5">
                <DropdownMenuItem asChild>
                  <Link to="/features" className="flex items-center gap-2.5 p-2">
                    <Layers className="h-4 w-4 text-cobalt" />
                    <div>
                      <div className="font-semibold text-xs">All Features</div>
                      <div className="text-[10px] text-muted-foreground">Complete platform overview</div>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/features/cron-scheduler" className="flex items-center gap-2.5 p-2">
                    <Clock className="h-4 w-4 text-cobalt" />
                    <div>
                      <div className="font-semibold text-xs">Cron Scheduler</div>
                      <div className="text-[10px] text-muted-foreground">Sub-second precision cron engine</div>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/features/http-monitoring" className="flex items-center gap-2.5 p-2">
                    <Activity className="h-4 w-4 text-emerald-500" />
                    <div>
                      <div className="font-semibold text-xs">HTTP Monitoring</div>
                      <div className="text-[10px] text-muted-foreground">Global ping & uptime checks</div>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/features/retries" className="flex items-center gap-2.5 p-2">
                    <Repeat className="h-4 w-4 text-amber-500" />
                    <div>
                      <div className="font-semibold text-xs">Retries & Backoff</div>
                      <div className="text-[10px] text-muted-foreground">Exponential fault resilience</div>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/features/notifications" className="flex items-center gap-2.5 p-2">
                    <Bell className="h-4 w-4 text-rose-500" />
                    <div>
                      <div className="font-semibold text-xs">Multi-channel Alerts</div>
                      <div className="text-[10px] text-muted-foreground">Slack, Discord, PagerDuty</div>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/features/webhooks" className="flex items-center gap-2.5 p-2">
                    <Webhook className="h-4 w-4 text-purple-500" />
                    <div>
                      <div className="font-semibold text-xs">Webhooks & Payloads</div>
                      <div className="text-[10px] text-muted-foreground">HMAC-signed custom dispatches</div>
                    </div>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Link
              to="/integrations"
              className={`px-3 py-1.5 rounded-md transition-colors ${
                currentPath.startsWith("/integrations")
                  ? "text-foreground font-semibold bg-muted/60"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              }`}
            >
              Integrations
            </Link>

            <Link
              to="/pricing"
              className={`px-3 py-1.5 rounded-md transition-colors ${
                currentPath === "/pricing"
                  ? "text-foreground font-semibold bg-muted/60"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              }`}
            >
              Pricing
            </Link>

            <Link
              to="/docs"
              className={`px-3 py-1.5 rounded-md transition-colors ${
                currentPath.startsWith("/docs")
                  ? "text-foreground font-semibold bg-muted/60"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              }`}
            >
              Docs
            </Link>

            <Link
              to="/status"
              className={`px-3 py-1.5 rounded-md transition-colors ${
                currentPath === "/status"
                  ? "text-foreground font-semibold bg-muted/60"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Status
              </span>
            </Link>
          </nav>
        </div>

        {/* Right side: Backend Pill + Live Clock + Auth actions */}
        <div className="hidden lg:flex items-center gap-4">
          <BackendStatusPill />
          <LiveClock variant="header" />

          <div className="h-4 w-px bg-border" />

          <div className="flex items-center gap-2">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="font-mono text-xs">
                Sign In
              </Button>
            </Link>

            <Link to="/app">
              <Button size="sm" className="font-mono text-xs bg-foreground text-background hover:bg-foreground/90">
                Launch Console
              </Button>
            </Link>
          </div>
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden items-center gap-2">
          <Link to="/app">
            <Button size="sm" className="font-mono text-xs px-2.5 h-8">
              Console
            </Button>
          </Link>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-1.5 rounded-md border border-border text-foreground hover:bg-muted"
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileOpen && (
        <div className="md:hidden border-b border-border bg-background px-4 py-4 space-y-3 font-mono text-xs">
          <div className="pb-2 border-b border-border/60">
            <LiveClock variant="compact" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Link
              to="/features"
              onClick={() => setMobileOpen(false)}
              className="p-2 rounded border border-border/60 hover:bg-muted text-foreground"
            >
              Features
            </Link>
            <Link
              to="/pricing"
              onClick={() => setMobileOpen(false)}
              className="p-2 rounded border border-border/60 hover:bg-muted text-foreground"
            >
              Pricing
            </Link>
            <Link
              to="/integrations"
              onClick={() => setMobileOpen(false)}
              className="p-2 rounded border border-border/60 hover:bg-muted text-foreground"
            >
              Integrations
            </Link>
            <Link
              to="/docs"
              onClick={() => setMobileOpen(false)}
              className="p-2 rounded border border-border/60 hover:bg-muted text-foreground"
            >
              Documentation
            </Link>
            <Link
              to="/status"
              onClick={() => setMobileOpen(false)}
              className="p-2 rounded border border-border/60 hover:bg-muted text-foreground"
            >
              Service Status
            </Link>
            <Link
              to="/changelog"
              onClick={() => setMobileOpen(false)}
              className="p-2 rounded border border-border/60 hover:bg-muted text-foreground"
            >
              Changelog
            </Link>
          </div>

          <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-2">
            <Link
              to="/login"
              onClick={() => setMobileOpen(false)}
              className="flex-1 text-center py-2 rounded border border-border hover:bg-muted"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              onClick={() => setMobileOpen(false)}
              className="flex-1 text-center py-2 rounded bg-foreground text-background"
            >
              Register
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
