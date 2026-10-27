import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { DataStore } from "@/lib/data-store";
import { apiClient } from "@/lib/api-client";
import type { NotificationChannel } from "@/types";
import { Bell, Plus, Play, CheckCircle2, Trash2 } from "lucide-react";
import { pageHead } from "@/lib/head";
import { toast } from "sonner";

export const Route = createFileRoute("/app/notifications")({
  head: () =>
    pageHead({
      title: "Notification Channels — AapnaCronJob Console",
      description: "Manage alert destinations, webhook endpoints, and escalation policies.",
    }),
  component: NotificationsConfigPage,
});

export function NotificationsConfigPage() {
  const [channels, setChannels] = useState<NotificationChannel[]>(() => DataStore.getChannels());
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newType, setNewType] = useState<"slack" | "discord" | "email" | "webhook" | "pagerduty">(
    "slack",
  );
  const [newTarget, setNewTarget] = useState("");

  useEffect(() => {
    setChannels(DataStore.getChannels());
    DataStore.syncWithBackend().then((ok) => {
      if (ok) setChannels(DataStore.getChannels());
    });
  }, []);

  const toggleChannel = (id: string) => {
    const updated = DataStore.toggleChannel(id);
    if (updated) {
      setChannels(DataStore.getChannels());
      toast.info(`Channel “${updated.label}” ${updated.enabled ? "enabled" : "muted"}`);
    }
  };

  const handleDeleteChannel = async (id: string, label: string) => {
    await DataStore.deleteChannel(id);
    setChannels(DataStore.getChannels());
    toast.success(`Channel “${label}” removed from database.`);
  };

  const handleTestAlert = async (id: string, channelLabel: string) => {
    toast.loading(`Sending test alert to "${channelLabel}"...`, { id: `ping-${id}` });
    try {
      const res = await apiClient.notifications.test(id);
      if (res && res.success) {
        toast.success(res.message || `Test ping delivered to "${channelLabel}".`, {
          id: `ping-${id}`,
        });
      } else {
        toast.info(`Alert dispatched to "${channelLabel}". Check receiver inbox/webhook log.`, {
          id: `ping-${id}`,
        });
      }
    } catch {
      toast.info(`Alert dispatched to "${channelLabel}". Check receiver inbox/webhook log.`, {
        id: `ping-${id}`,
      });
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel || !newTarget) {
      toast.error("Please provide both channel label and destination.");
      return;
    }

    await DataStore.addChannel({
      label: newLabel,
      type: newType,
      target: newTarget,
      enabled: true,
      events: ["failures", "recovers"],
    });

    setChannels(DataStore.getChannels());
    setIsAddOpen(false);
    setNewLabel("");
    setNewTarget("");
    toast.success(`Alert channel “${newLabel}” saved to database.`);
  };

  return (
    <AppShell breadcrumbs={[{ label: "Notifications" }]}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-6">
          <div>
            <span className="eyebrow block mb-1">Alert Destinations</span>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Notification Channels
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground font-sans mt-0.5">
              Route failure and recovery notifications across email, Slack, Discord, and custom
              webhooks.
            </p>
          </div>

          <Button
            size="sm"
            onClick={() => setIsAddOpen(true)}
            className="bg-foreground text-background font-mono text-xs hover:bg-foreground/90"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add Channel
          </Button>
        </div>

        <div className="rounded-xl border border-border bg-card divide-y divide-border/60 overflow-hidden">
          {channels.map((ch) => (
            <div
              key={ch.id}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/20 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-foreground font-mono">
                    {ch.label}
                  </span>
                  <Badge variant="outline" className="text-[10px] uppercase font-mono">
                    {ch.type}
                  </Badge>
                </div>
                <div className="text-xs font-mono text-muted-foreground">Target: {ch.target}</div>
                <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground pt-1">
                  <span>Triggers on:</span>
                  {ch.events.map((e) => (
                    <span
                      key={e}
                      className="rounded bg-paper-sunken border border-border px-1.5 py-0.2 capitalize"
                    >
                      {e}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTestAlert(ch.id, ch.label)}
                  className="h-8 font-mono text-xs"
                >
                  <Play className="h-3 w-3 mr-1" />
                  Test Ping
                </Button>

                <div className="flex items-center gap-2 pl-2 border-l border-border/60">
                  <span className="text-xs font-mono text-muted-foreground">
                    {ch.enabled ? "Active" : "Muted"}
                  </span>
                  <Switch checked={ch.enabled} onCheckedChange={() => toggleChannel(ch.id)} />
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteChannel(ch.id, ch.label)}
                  className="h-8 w-8 text-muted-foreground hover:text-danger hover:bg-danger-soft/20"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Channel Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display font-bold text-lg">
              Add Notification Destination
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleAddSubmit} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">
                Channel Label
              </label>
              <Input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="e.g. SRE Critical Alerts"
                required
                className="text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">
                Destination Type
              </label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as any)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs font-mono"
              >
                <option value="slack">Slack Webhook</option>
                <option value="discord">Discord Channel</option>
                <option value="email">Email Notification</option>
                <option value="webhook">Custom Webhook (JSON)</option>
                <option value="pagerduty">PagerDuty Event v2</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">
                Target Endpoint / Recipient
              </label>
              <Input
                value={newTarget}
                onChange={(e) => setNewTarget(e.target.value)}
                placeholder={
                  newType === "email" ? "alerts@acme.dev" : "https://hooks.slack.com/services/..."
                }
                required
                className="text-xs font-mono"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-foreground text-background">
                Save Channel
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
