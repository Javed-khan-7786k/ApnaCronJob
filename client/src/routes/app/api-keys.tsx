import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { DataStore } from "@/lib/data-store";
import type { ApiKey } from "@/types";
import { relativeLabel } from "@/lib/format";
import { Key, Plus, Copy, Trash2, ShieldCheck } from "lucide-react";
import { pageHead } from "@/lib/head";
import { toast } from "sonner";

export const Route = createFileRoute("/app/api-keys")({
  head: () =>
    pageHead({
      title: "API Keys — AapnaCronJob Console",
      description: "Manage secret keys and scopes for programmatic REST API access.",
    }),
  component: ApiKeysManagementPage,
});

export function ApiKeysManagementPage() {
  const [keys, setKeys] = useState<ApiKey[]>(() => DataStore.getApiKeys());
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [selectedScopes, setSelectedScopes] = useState<string[]>(["jobs:read", "jobs:write"]);

  const [newlyCreatedKey, setNewlyCreatedKey] = useState<ApiKey | null>(null);

  useEffect(() => {
    setKeys(DataStore.getApiKeys());
    DataStore.syncWithBackend().then((ok) => {
      if (ok) setKeys(DataStore.getApiKeys());
    });
  }, []);

  const copyPrefix = (prefix: string) => {
    navigator.clipboard.writeText(`${prefix}••••••••••••••••`);
    toast.success("API key prefix copied to clipboard");
  };

  const copyFullKey = (keyText: string) => {
    navigator.clipboard.writeText(keyText);
    toast.success("Full secret key copied to clipboard!");
  };

  const handleRevoke = async (id: string, keyLabel: string) => {
    await DataStore.revokeApiKey(id);
    setKeys(DataStore.getApiKeys());
    toast.info(`API Key “${keyLabel}” revoked in database.`);
  };

  const toggleScope = (scope: string) => {
    if (selectedScopes.includes(scope)) {
      setSelectedScopes(selectedScopes.filter((s) => s !== scope));
    } else {
      setSelectedScopes([...selectedScopes, scope]);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) {
      toast.error("Please enter a token label.");
      return;
    }

    const created = await DataStore.addApiKey(label, selectedScopes);
    setKeys(DataStore.getApiKeys());
    setIsCreateOpen(false);
    setLabel("");
    if (created.secretKey) {
      setNewlyCreatedKey(created);
    }
    toast.success(`Production API Key “${created.label}” generated.`);
  };

  return (
    <AppShell breadcrumbs={[{ label: "API Keys" }]}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-6">
          <div>
            <span className="eyebrow block mb-1">Developer Credentials</span>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              API Keys
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground font-sans mt-0.5">
              Programmatic tokens for CI/CD pipelines, Terraform providers, and internal scripts.
            </p>
          </div>

          <Button
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            className="bg-foreground text-background font-mono text-xs hover:bg-foreground/90"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Generate New Key
          </Button>
        </div>

        <div className="rounded-xl border border-border bg-card divide-y divide-border/60 overflow-hidden">
          {keys.map((k) => (
            <div
              key={k.id}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-mono"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground text-sm font-sans">{k.label}</span>
                  <code className="rounded bg-paper-sunken border border-border px-1.5 py-0.5 text-muted-foreground">
                    {k.prefix}••••••••
                  </code>
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-muted-foreground">Scopes:</span>
                  {k.scopes.map((s) => (
                    <Badge key={s} variant="outline" className="text-[10px] font-mono">
                      {s}
                    </Badge>
                  ))}
                  <span className="text-muted-foreground ml-2">
                    • Last used: {relativeLabel(k.lastUsedMinutesAgo)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyPrefix(k.prefix)}
                  className="h-7 text-xs font-mono"
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copy
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRevoke(k.id, k.label)}
                  className="h-7 text-xs font-mono text-danger hover:text-danger hover:bg-danger/10"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Revoke
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Generate Key Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display font-bold text-lg">
              Generate Production API Key
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">
                Key Name / Description
              </label>
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. GitHub Actions Deployer"
                required
                className="text-xs font-mono"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-mono uppercase text-muted-foreground">
                Permissions / Scopes
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {["jobs:read", "jobs:write", "executions:read", "keys:manage"].map((scope) => (
                  <label
                    key={scope}
                    className="flex items-center gap-2 border border-border p-2 rounded-md cursor-pointer hover:bg-muted/30"
                  >
                    <input
                      type="checkbox"
                      checked={selectedScopes.includes(scope)}
                      onChange={() => toggleScope(scope)}
                      className="rounded"
                    />
                    <span>{scope}</span>
                  </label>
                ))}
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-foreground text-background">
                Generate Token
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Secret Key Revelation Modal */}
      <Dialog open={!!newlyCreatedKey} onOpenChange={(open) => !open && setNewlyCreatedKey(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display font-bold text-lg text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              API Key Generated Successfully
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-xs text-muted-foreground">
              Please copy your API key now. For security purposes,{" "}
              <strong className="text-foreground">you will not be able to see it again</strong>.
            </p>
            <div className="p-3 bg-muted/50 rounded-md border border-border flex items-center justify-between gap-2">
              <code className="text-xs font-mono font-bold text-foreground break-all select-all">
                {newlyCreatedKey?.secretKey}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => newlyCreatedKey?.secretKey && copyFullKey(newlyCreatedKey.secretKey)}
                className="shrink-0 h-8"
              >
                <Copy className="h-3.5 w-3.5 mr-1" />
                Copy
              </Button>
            </div>
            <DialogFooter>
              <Button
                className="w-full bg-foreground text-background"
                onClick={() => setNewlyCreatedKey(null)}
              >
                I have saved my key
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
