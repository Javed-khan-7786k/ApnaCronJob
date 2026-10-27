import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataStore } from "@/lib/data-store";
import { Blocks, CheckCircle2, Plus } from "lucide-react";
import { pageHead } from "@/lib/head";
import { toast } from "sonner";

export const Route = createFileRoute("/app/integrations")({
  head: () =>
    pageHead({
      title: "Workspace Integrations — AapnaCronJob Console",
      description: "Manage connected services, Slack bots, and webhook connectors.",
    }),
  component: ConnectedIntegrationsPage,
});

export function ConnectedIntegrationsPage() {
  const [integrations, setIntegrations] = useState(() => DataStore.getIntegrations());

  useEffect(() => {
    DataStore.syncWithBackend().then(() => {
      setIntegrations(DataStore.getIntegrations());
    });
  }, []);

  const toggleConnect = (id: string) => {
    const updated = DataStore.toggleIntegration(id);
    if (updated) {
      setIntegrations(DataStore.getIntegrations());
      toast.info(
        `Integration “${updated.name}” ${updated.connected ? "connected" : "disconnected"}`,
      );
    }
  };

  return (
    <AppShell breadcrumbs={[{ label: "Integrations" }]}>
      <div className="space-y-6">
        <div className="border-b border-border/80 pb-6">
          <span className="eyebrow block mb-1">Ecosystem</span>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Connected Integrations
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-sans mt-0.5">
            Manage your messaging bots, incident escalators, and automated dispatch hooks.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {integrations.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-border bg-card p-5 flex flex-col justify-between space-y-4 hover:border-foreground/30 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-display font-bold text-base text-foreground">
                    {item.name}
                  </span>
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {item.category}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="pt-3 border-t border-border/60 flex items-center justify-between">
                <span
                  className={`text-xs font-mono font-semibold ${item.connected ? "text-emerald-600" : "text-muted-foreground"}`}
                >
                  {item.connected ? "● Connected" : "○ Disconnected"}
                </span>

                <Button
                  variant={item.connected ? "outline" : "default"}
                  size="sm"
                  onClick={() => toggleConnect(item.id)}
                  className="font-mono text-xs h-7"
                >
                  {item.connected ? "Disconnect" : "Connect"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
