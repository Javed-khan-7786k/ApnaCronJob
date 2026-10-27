import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
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
  FileText,
  Search,
  ExternalLink,
} from "lucide-react";
import { DataStore } from "@/lib/data-store";

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (
        (e.key === "k" && (e.metaKey || e.ctrlKey)) ||
        (e.key === "/" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName))
      ) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  const runCommand = (command: () => void) => {
    onOpenChange(false);
    command();
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a command, route, or job name..." />
      <CommandList className="max-h-96">
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Quick Actions">
          <CommandItem onSelect={() => runCommand(() => navigate({ to: "/app/jobs/new" }))}>
            <PlusCircle className="mr-2 h-4 w-4 text-cobalt" />
            <span>Create New Job</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="App Navigation">
          <CommandItem onSelect={() => runCommand(() => navigate({ to: "/app" }))}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Dashboard Overview</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate({ to: "/app/jobs" }))}>
            <Clock className="mr-2 h-4 w-4" />
            <span>Scheduled Jobs</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate({ to: "/app/calendar" }))}>
            <Calendar className="mr-2 h-4 w-4" />
            <span>Calendar Schedule</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate({ to: "/app/history" }))}>
            <History className="mr-2 h-4 w-4" />
            <span>Execution History</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate({ to: "/app/monitoring" }))}>
            <Activity className="mr-2 h-4 w-4 text-emerald-500" />
            <span>Monitoring & Health</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate({ to: "/app/notifications" }))}>
            <Bell className="mr-2 h-4 w-4" />
            <span>Notification Channels</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate({ to: "/app/integrations" }))}>
            <Blocks className="mr-2 h-4 w-4" />
            <span>Integrations</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate({ to: "/app/api-keys" }))}>
            <Key className="mr-2 h-4 w-4" />
            <span>API Keys</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate({ to: "/app/team" }))}>
            <Users className="mr-2 h-4 w-4" />
            <span>Team Members</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate({ to: "/app/billing" }))}>
            <CreditCard className="mr-2 h-4 w-4" />
            <span>Billing & Usage</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate({ to: "/app/settings" }))}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Workspace Settings</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Active Scheduled Jobs">
          {DataStore.getJobs()
            .slice(0, 5)
            .map((job) => (
              <CommandItem
                key={job.id}
                value={job.name}
                onSelect={() => runCommand(() => navigate({ to: `/app/jobs/${job.id}` }))}
              >
                <span className="h-2 w-2 rounded-full bg-cobalt mr-2" />
                <div className="flex flex-col">
                  <span className="font-medium text-xs">{job.name}</span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {job.cron} • {job.url}
                  </span>
                </div>
              </CommandItem>
            ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Documentation & Public">
          <CommandItem onSelect={() => runCommand(() => navigate({ to: "/docs" }))}>
            <FileText className="mr-2 h-4 w-4" />
            <span>Documentation Hub</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => navigate({ to: "/docs/cron-expressions" }))}
          >
            <Clock className="mr-2 h-4 w-4" />
            <span>Cron Syntax Guide</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate({ to: "/status" }))}>
            <Activity className="mr-2 h-4 w-4 text-emerald-500" />
            <span>Service Status</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
