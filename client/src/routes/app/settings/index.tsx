import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DataStore } from "@/lib/data-store";
import { apiClient, type BackendHealth } from "@/lib/api-client";
import { Settings, Globe, Shield, Save, Server, RefreshCw, CheckCircle2, AlertTriangle, Database, Wifi } from "lucide-react";
import { pageHead } from "@/lib/head";
import { toast } from "sonner";

export const Route = createFileRoute("/app/settings/")({
  head: () =>
    pageHead({
      title: "Workspace Settings — AapnaCronJob Console",
      description: "Configure workspace name, defaults, and data retention rules.",
    }),
  component: SettingsGeneralPage,
});

export function SettingsGeneralPage() {
  const currentSettings = DataStore.getSettings();
  const [workspaceName, setWorkspaceName] = useState(currentSettings.workspaceName);
  const [supportEmail, setSupportEmail] = useState(currentSettings.supportEmail);
  const [defaultTimeout, setDefaultTimeout] = useState(currentSettings.defaultTimeout);

  const [backendHealth, setBackendHealth] = useState<BackendHealth>({
    ok: false,
    status: "checking",
    latencyMs: 0,
    apiUrl: apiClient.getApiBaseUrl(),
  });
  const [probing, setProbing] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const s = DataStore.getSettings();
    setWorkspaceName(s.workspaceName);
    setSupportEmail(s.supportEmail);
    setDefaultTimeout(s.defaultTimeout);

    checkBackend();
  }, []);

  const checkBackend = async () => {
    setProbing(true);
    try {
      const res = await apiClient.checkHealth();
      setBackendHealth(res);
      return res;
    } finally {
      setProbing(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    toast.loading("Syncing data from backend (port 5000)...", { id: "sync-settings" });
    try {
      const ok = await DataStore.syncWithBackend();
      if (ok) {
        toast.success("All jobs, executions, and channels synchronized from MongoDB!", { id: "sync-settings" });
      } else {
        toast.error("Could not reach backend server. Using local cache.", { id: "sync-settings" });
      }
    } catch (err: any) {
      toast.error(`Sync error: ${err.message}`, { id: "sync-settings" });
    } finally {
      setSyncing(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    DataStore.saveSettings({
      workspaceName,
      supportEmail,
      defaultTimeout,
    });
    toast.success("Workspace general settings saved successfully.");
  };

  return (
    <AppShell breadcrumbs={[{ label: "Settings" }]}>
      <div className="space-y-6 max-w-4xl">
        <div className="border-b border-border/80 pb-6">
          <span className="eyebrow block mb-1">Configuration</span>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Workspace Settings
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-sans mt-0.5">
            Manage defaults, retention windows, and backend database connections.
          </p>
        </div>

        {/* Settings Sub-nav tabs */}
        <div className="flex items-center gap-3 border-b border-border text-xs font-mono">
          <Link
            to="/app/settings"
            className="pb-2 px-3 border-b-2 border-foreground text-foreground font-semibold"
          >
            General
          </Link>
          <Link
            to="/app/settings/timezone"
            className="pb-2 px-3 border-b-2 border-transparent text-muted-foreground hover:text-foreground"
          >
            Timezone & Clock
          </Link>
          <Link
            to="/app/settings/security"
            className="pb-2 px-3 border-b-2 border-transparent text-muted-foreground hover:text-foreground"
          >
            Security & Authentication
          </Link>
        </div>

        {/* General Form */}
        <form onSubmit={handleSave} className="rounded-xl border border-border bg-card p-6 space-y-4 shadow-xs">
          <h2 className="text-sm font-bold font-display uppercase tracking-wider text-foreground">
            General Properties
          </h2>

          <div>
            <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">
              Workspace Name
            </label>
            <Input
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              className="text-xs font-mono max-w-md"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">
              Primary Notification Email
            </label>
            <Input
              type="email"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              className="text-xs font-mono max-w-md"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">
              Default Job Execution Timeout (seconds)
            </label>
            <Input
              type="number"
              value={defaultTimeout}
              onChange={(e) => setDefaultTimeout(Number(e.target.value))}
              className="text-xs font-mono max-w-xs"
            />
          </div>

          <div className="pt-2">
            <Button type="submit" className="bg-foreground text-background font-mono text-xs hover:bg-foreground/90 font-semibold">
              <Save className="h-3.5 w-3.5 mr-1.5" />
              Save Changes
            </Button>
          </div>
        </form>

        {/* Backend Integration Card */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4 shadow-xs font-mono">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-foreground text-background">
                <Server className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold font-display text-foreground">Backend Server Connection</h3>
                <p className="text-xs text-muted-foreground font-sans">
                  Express API Gateway & MongoDB Cluster status
                </p>
              </div>
            </div>

            <Badge variant={backendHealth.ok ? "default" : "destructive"} className="text-[10px]">
              {backendHealth.ok ? "CONNECTED (PORT 5000)" : "DISCONNECTED"}
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
            <div className="rounded-lg border border-border bg-paper-sunken/40 p-3 sm:col-span-2 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">Active REST API Base URL (From .env: VITE_API_URL)</span>
                <span className="text-[10px] text-cobalt font-semibold font-mono">Dynamic Environment Config</span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  value={backendHealth.apiUrl}
                  onChange={(e) => {
                    const url = e.target.value;
                    setBackendHealth((prev) => ({ ...prev, apiUrl: url }));
                  }}
                  className="text-xs font-mono bg-background"
                  placeholder="http://localhost:5000/api"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    window.localStorage.setItem("aapnacronjob_api_url", backendHealth.apiUrl);
                    toast.success("API URL updated. Testing probe...");
                    checkBackend();
                  }}
                  className="text-xs font-mono shrink-0"
                >
                  Save URL
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    window.localStorage.removeItem("aapnacronjob_api_url");
                    const envUrl = apiClient.getApiBaseUrl();
                    setBackendHealth((prev) => ({ ...prev, apiUrl: envUrl }));
                    toast.success("Reset to environment variable (VITE_API_URL)");
                    checkBackend();
                  }}
                  className="text-xs font-mono shrink-0 text-muted-foreground"
                >
                  Reset to .env
                </Button>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-paper-sunken/40 p-3">
              <span className="text-[11px] text-muted-foreground block mb-0.5">Roundtrip Latency</span>
              <span className="font-semibold text-emerald-500">{backendHealth.latencyMs} ms</span>
            </div>

            <div className="rounded-lg border border-border bg-paper-sunken/40 p-3">
              <span className="text-[11px] text-muted-foreground block mb-0.5">Service Identifier</span>
              <span className="font-semibold text-foreground">{backendHealth.service || "aapna-cron-job"}</span>
            </div>

            <div className="rounded-lg border border-border bg-paper-sunken/40 p-3 sm:col-span-2">
              <span className="text-[11px] text-muted-foreground block mb-0.5">Database Cluster</span>
              <span className="font-semibold text-foreground">MongoDB Local (Port 27017 / apna_scheduler)</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={probing}
              onClick={checkBackend}
              className="text-xs font-mono border-border"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${probing ? "animate-spin" : ""}`} />
              Test Connection
            </Button>

            <Button
              type="button"
              disabled={syncing || !backendHealth.ok}
              onClick={handleSync}
              className="text-xs font-mono bg-foreground text-background hover:bg-foreground/90 font-semibold"
            >
              <Database className="h-3.5 w-3.5 mr-1.5" />
              {syncing ? "Syncing with Database..." : "Sync Jobs & Telemetry from Backend"}
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
