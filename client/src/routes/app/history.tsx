import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { ExecutionsTable } from "@/components/tables/executions-table";
import { DataStore } from "@/lib/data-store";
import { History, Activity, Zap, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pageHead } from "@/lib/head";
import { toast } from "sonner";

export const Route = createFileRoute("/app/history")({
  head: () =>
    pageHead({
      title: "Execution History — AapnaCronJob Console",
      description: "Searchable log of all dispatched HTTP executions and status codes.",
    }),
  component: HistoryPage,
});

export function HistoryPage() {
  const [executions, setExecutions] = useState(() => DataStore.getExecutions());

  const handleRefresh = async () => {
    toast.loading("Refreshing telemetry from MongoDB...", { id: "refresh-logs" });
    await DataStore.syncWithBackend();
    setExecutions(DataStore.getExecutions());
    toast.success("Execution logs refreshed from database.", { id: "refresh-logs" });
  };

  useEffect(() => {
    setExecutions(DataStore.getExecutions());
    DataStore.syncWithBackend().then((ok) => {
      if (ok) setExecutions(DataStore.getExecutions());
    });
  }, []);

  return (
    <AppShell breadcrumbs={[{ label: "Execution History" }]}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-6">
          <div>
            <span className="eyebrow block mb-1">Execution Telemetry</span>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Execution Logs & Audit Stream
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground font-sans mt-0.5">
              Detailed logs of every HTTP trigger, status code, response time, and retry attempt
              across all active runners.
            </p>
          </div>

          <Button variant="outline" size="sm" onClick={handleRefresh} className="font-mono text-xs">
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Refresh Telemetry
          </Button>
        </div>

        <ExecutionsTable executions={executions} />
      </div>
    </AppShell>
  );
}
