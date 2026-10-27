import { useState, type ReactNode } from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  Clock,
  PlusCircle,
  LayoutDashboard,
  Calendar,
  History,
  Activity,
  Bell,
  Blocks,
  Key,
  Users,
  CreditCard,
  Settings,
  Shield,
  FileText,
  Search,
  ChevronDown,
  Menu,
  X,
  ExternalLink,
  LogOut,
  ChevronRight,
  Sparkles,
  Command as CommandIcon,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LiveClock } from "@/components/clock/live-clock";
import { DemoBanner } from "@/components/feedback/demo-banner";
import { CommandPalette } from "@/components/navigation/command-palette";
import { BackendStatusPill } from "@/components/navigation/backend-status-pill";
import { useDemoAuth } from "@/lib/demo-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface NavItem {
  label: string;
  to: string;
  icon: typeof LayoutDashboard;
  badge?: string;
}

interface NavGroup {
  heading: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    heading: "Core Scheduling",
    items: [
      { label: "Dashboard", to: "/app", icon: LayoutDashboard },
      { label: "Jobs", to: "/app/jobs", icon: Clock },
      { label: "New Job", to: "/app/jobs/new", icon: PlusCircle },
      { label: "Calendar", to: "/app/calendar", icon: Calendar },
      { label: "Execution History", to: "/app/history", icon: History },
    ],
  },
  {
    heading: "Reliability & Alerts",
    items: [
      { label: "Monitoring", to: "/app/monitoring", icon: Activity },
      { label: "Notifications", to: "/app/notifications", icon: Bell },
      { label: "Integrations", to: "/app/integrations", icon: Blocks },
    ],
  },
  {
    heading: "Developer & Security",
    items: [
      { label: "API Keys", to: "/app/api-keys", icon: Key },
      { label: "Audit Logs", to: "/app/audit-logs", icon: FileText },
    ],
  },
  {
    heading: "Workspace",
    items: [
      { label: "Team", to: "/app/team", icon: Users },
      { label: "Billing & Usage", to: "/app/billing", icon: CreditCard },
      { label: "Settings", to: "/app/settings", icon: Settings },
    ],
  },
];

export function AppShell({
  children,
  breadcrumbs = [],
}: {
  children: ReactNode;
  breadcrumbs?: Array<{ label: string; to?: string }>;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const navigate = useNavigate();
  const { user, signOut, state } = useDemoAuth();

  useEffect(() => {
    if (state === "signed-out") {
      navigate({ to: "/login" });
    }
  }, [state, navigate]);

  const initials = (user?.name || user?.email || "U")
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("") || "U";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans antialiased">
      {/* Top Demo Banner */}
      <DemoBanner />

      {/* Main Shell Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Collapsible Sidebar */}
        <aside className="hidden lg:flex w-64 flex-col border-r border-border bg-paper-sunken/40 shrink-0">
          {/* Workspace Switcher Header */}
          <div className="h-16 border-b border-border/80 px-4 flex items-center justify-between">
            <Link to="/app" className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded border border-border bg-foreground text-background font-mono font-bold text-sm">
                A
              </div>
              <div className="flex flex-col">
                <span className="font-display font-bold text-sm text-foreground leading-tight">
                  Aapna<span className="text-cobalt">CronJob</span>
                </span>
                <span className="text-[10px] font-mono text-muted-foreground leading-none">
                  Console v3.4
                </span>
              </div>
            </Link>


            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 px-2 py-1 rounded border border-border/80 bg-background text-[11px] font-mono hover:bg-muted">
                  <span className="truncate max-w-[80px]">{user?.workspace || "Acme Dev"}</span>
                  <ChevronDown className="h-3 w-3 opacity-60" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 text-xs font-mono">
                <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
                <DropdownMenuItem className="flex items-center justify-between font-semibold">
                  <span>Acme Platform (Prod)</span>
                  <CheckCircle2 className="h-3.5 w-3.5 text-cobalt" />
                </DropdownMenuItem>
                <DropdownMenuItem>Acme Staging</DropdownMenuItem>
                <DropdownMenuItem>Personal Dev</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate({ to: "/app/settings" })}>
                  Workspace Settings
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Quick Create Action in Sidebar */}
          <div className="p-3">
            <Link to="/app/jobs/new">
              <Button size="sm" className="w-full bg-foreground text-background font-mono text-xs hover:bg-foreground/90">
                <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
                New Scheduled Job
              </Button>
            </Link>
          </div>

          {/* Navigation Groups */}
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-5 text-xs">
            {NAV_GROUPS.map((group) => (
              <div key={group.heading}>
                <span className="eyebrow block px-2 mb-1.5 opacity-70">
                  {group.heading}
                </span>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      item.to === "/app"
                        ? currentPath === "/app"
                        : currentPath.startsWith(item.to);

                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-md font-medium transition-colors ${
                          isActive
                            ? "bg-foreground text-background font-semibold"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${isActive ? "text-background" : "text-muted-foreground"}`} />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <Badge variant="outline" className="text-[10px] py-0 px-1 font-mono">
                            {item.badge}
                          </Badge>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* User profile & bottom status */}
          <div className="border-t border-border/80 p-3 bg-background/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cobalt text-cobalt-foreground text-xs font-mono font-semibold">
                  {initials}
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="font-medium text-xs text-foreground truncate">
                    {user?.name || "Operator"}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono truncate">
                    {user?.email || "Signed in"}
                  </span>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={() => {
                  signOut();
                  navigate({ to: "/" });
                }}
                title="Sign out of console session"
              >
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </aside>

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top Bar with Breadcrumbs, Live Clock & Search */}
          <header className="h-16 border-b border-border bg-background px-4 sm:px-6 flex items-center justify-between gap-4 shrink-0">
            {/* Mobile menu button & breadcrumbs */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-1.5 rounded-md border border-border text-foreground hover:bg-muted"
                aria-label="Open navigation sidebar"
              >
                <Menu className="h-5 w-5" />
              </button>

              {/* Breadcrumbs */}
              <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs font-mono">
                <Link to="/app" className="text-muted-foreground hover:text-foreground">
                  Console
                </Link>
                {breadcrumbs.map((b, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <ChevronRight className="h-3 w-3 text-muted-foreground/60" />
                    {b.to ? (
                      <Link to={b.to} className="text-muted-foreground hover:text-foreground">
                        {b.label}
                      </Link>
                    ) : (
                      <span className="font-semibold text-foreground">{b.label}</span>
                    )}
                  </div>
                ))}
              </nav>
            </div>

            {/* Right Header items */}
            <div className="flex items-center gap-3">
              {/* Command Palette Trigger Button */}
              <button
                onClick={() => setCommandPaletteOpen(true)}
                className="hidden sm:flex items-center gap-2 rounded-md border border-border bg-paper-sunken px-2.5 py-1 text-xs font-mono text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <Search className="h-3.5 w-3.5" />
                <span>Search or Cmd+K</span>
                <kbd className="rounded border border-border bg-background px-1 text-[10px]">
                  ⌘K
                </kbd>
              </button>

              {/* Backend Live Status Indicator */}
              <BackendStatusPill />

              {/* Running Digital Header Clock */}
              <div className="hidden md:block">
                <LiveClock variant="header" />
              </div>

              {/* Notification Popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 relative text-muted-foreground hover:text-foreground"
                    aria-label="Notifications"
                  >
                    <Bell className="h-4 w-4" />
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-cobalt animate-ping" />
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-cobalt" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 p-0 text-xs font-mono">
                  <div className="p-3 border-b border-border flex items-center justify-between">
                    <span className="font-semibold text-foreground">Live Telemetry Alerts</span>
                    <Badge variant="outline" className="text-[10px]">3 New</Badge>
                  </div>

                  <div className="divide-y divide-border/60 max-h-64 overflow-y-auto">
                    <div className="p-3 hover:bg-muted/40 transition-colors">
                      <div className="flex items-center justify-between text-danger font-medium text-[11px]">
                        <span>SSL Sweep • Timeout</span>
                        <span>12m ago</span>
                      </div>
                      <p className="mt-1 text-muted-foreground text-[11px] font-sans">
                        Request timed out after 60s. Exponential retry 1 of 2 queued.
                      </p>
                    </div>
                    <div className="p-3 hover:bg-muted/40 transition-colors">
                      <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-medium text-[11px]">
                        <span>DB Backup • Success</span>
                        <span>9h ago</span>
                      </div>
                      <p className="mt-1 text-muted-foreground text-[11px] font-sans">
                        Backup completed in 41.2s. 1.4 GB archive stored safely.
                      </p>
                    </div>
                  </div>
                  <div className="p-2 border-t border-border bg-muted/20 text-center">
                    <Link
                      to="/app/notifications"
                      className="text-[11px] text-cobalt hover:underline"
                    >
                      Configure alert dispatch rules →
                    </Link>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Public Website Link */}
              <Link to="/">
                <Button variant="ghost" size="sm" className="hidden sm:inline-flex text-xs font-mono text-muted-foreground">
                  <span>Home</span>
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </div>
          </header>

          {/* Main Route Content */}
          <main className="flex-1 overflow-y-auto bg-background p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl space-y-6">
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Mobile Sidebar Dialog / Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-xs"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative flex w-72 flex-col bg-background border-r border-border p-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <span className="font-display font-bold text-sm">AAPNACRONJOB CONSOLE</span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1 rounded-md text-muted-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="py-2">
              <Link
                to="/app/jobs/new"
                onClick={() => setSidebarOpen(false)}
              >
                <Button size="sm" className="w-full bg-foreground text-background font-mono text-xs">
                  <PlusCircle className="h-3.5 w-3.5 mr-1" />
                  New Job
                </Button>
              </Link>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 text-xs font-mono py-2">
              {NAV_GROUPS.map((group) => (
                <div key={group.heading}>
                  <span className="eyebrow block mb-1 opacity-70">
                    {group.heading}
                  </span>
                  <div className="space-y-0.5">
                    {group.items.map((item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md ${
                          currentPath === item.to
                            ? "bg-foreground text-background font-semibold"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        }`}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-border">
              <LiveClock variant="compact" />
            </div>
          </div>
        </div>
      )}

      {/* Command Palette */}
      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
      />
    </div>
  );
}
