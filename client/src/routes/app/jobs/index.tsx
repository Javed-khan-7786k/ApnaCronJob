import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { JobsTable } from "@/components/tables/jobs-table";
import { Button } from "@/components/ui/button";
import { DataStore } from "@/lib/data-store";
import { PlusCircle, Clock } from "lucide-react";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/app/jobs/")({
  head: () =>
    pageHead({
      title: "Scheduled Jobs — AapnaCronJob Console",
      description: "Manage, filter, and monitor all active and paused cron jobs.",
    }),
  component: JobsListPage,
});

export function JobsListPage() {
  return (
    <AppShell breadcrumbs={[{ label: "Scheduled Jobs" }]}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-6">
          <div>
            <span className="eyebrow block mb-1">Schedule Inventory</span>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              All Scheduled Jobs
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground font-sans mt-0.5">
              Manage your HTTP triggers, execution frequencies, and error policies.
            </p>
          </div>

          <Link to="/app/jobs/new">
            <Button
              size="sm"
              className="bg-foreground text-background font-mono text-xs hover:bg-foreground/90"
            >
              <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
              New Scheduled Job
            </Button>
          </Link>
        </div>

        <JobsTable initialJobs={DataStore.getJobs()} />
      </div>
    </AppShell>
  );
}
