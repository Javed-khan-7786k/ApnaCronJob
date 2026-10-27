import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { JobForm } from "@/components/jobs/job-form";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/app/jobs/new")({
  head: () =>
    pageHead({
      title: "New Scheduled Job — AapnaCronJob Console",
      description: "Create a new scheduled HTTP endpoint or webhook.",
    }),
  component: NewJobPage,
});

export function NewJobPage() {
  return (
    <AppShell
      breadcrumbs={[
        { label: "Scheduled Jobs", to: "/app/jobs" },
        { label: "New Job" },
      ]}
    >
      <div className="space-y-6">
        <div className="border-b border-border/80 pb-6">
          <span className="eyebrow block mb-1">Create Job</span>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Configure New Scheduled Job
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-sans mt-0.5">
            Specify destination endpoint, authentication, cron expression, and retry backoff.
          </p>
        </div>

        <JobForm />
      </div>
    </AppShell>
  );
}
