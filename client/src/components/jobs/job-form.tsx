import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import type { Job, HttpMethod, AuthMode } from "@/types";
import { CronEditor } from "@/components/cron/cron-editor";
import { COMMON_TIMEZONES } from "@/components/clock/live-clock";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { DataStore } from "@/lib/data-store";
import { apiClient } from "@/lib/api-client";
import {
  Clock,
  Globe,
  Plus,
  Trash2,
  Play,
  Save,
  Shield,
  Bell,
  Sliders,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

export interface JobFormProps {
  initialJob?: Partial<Job>;
  isEditing?: boolean;
  onSave?: (job: Job) => void;
}

export function JobForm({ initialJob, isEditing = false, onSave }: JobFormProps) {
  const navigate = useNavigate();

  const [name, setName] = useState(initialJob?.name || "");
  const [description, setDescription] = useState(initialJob?.description || "");
  const [url, setUrl] = useState(initialJob?.url || "");
  const [method, setMethod] = useState<HttpMethod>(initialJob?.method || "GET");
  const [cron, setCron] = useState(initialJob?.cron || "0 2 * * *");
  const [timezone, setTimezone] = useState(initialJob?.timezone || "Asia/Kolkata");
  const [enabled, setEnabled] = useState(initialJob?.enabled ?? true);
  const [timeoutSeconds, setTimeoutSeconds] = useState(initialJob?.timeoutSeconds || 60);
  const [maxRetries, setMaxRetries] = useState(initialJob?.maxRetries ?? 3);
  const [retryBackoff, setRetryBackoff] = useState<"fixed" | "exponential">(
    initialJob?.retryBackoff || "exponential",
  );
  const [authMode, setAuthMode] = useState<AuthMode>(initialJob?.authMode || "bearer");
  const [authToken, setAuthToken] = useState(initialJob?.authToken || "");
  const [headers, setHeaders] = useState<Array<{ key: string; value: string }>>(
    initialJob?.headers || [{ key: "Content-Type", value: "application/json" }],
  );
  const [body, setBody] = useState(initialJob?.body || "");
  const [notifyEmail, setNotifyEmail] = useState(initialJob?.notifyEmail ?? true);
  const [notifyWebhook, setNotifyWebhook] = useState(initialJob?.notifyWebhook ?? false);

  const [testing, setTesting] = useState(false);

  const addHeader = () => {
    setHeaders([...headers, { key: "", value: "" }]);
  };

  const removeHeader = (index: number) => {
    setHeaders(headers.filter((_, i) => i !== index));
  };

  const updateHeader = (index: number, key: string, value: string) => {
    const next = [...headers];
    next[index] = { key, value };
    setHeaders(next);
  };

  const handleTestRequest = async () => {
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      toast.error("Please enter a valid HTTP/HTTPS URL");
      return;
    }
    setTesting(true);
    try {
      const headerObj = headers.reduce(
        (acc, h) => {
          if (h.key && h.key.trim()) acc[h.key.trim()] = h.value;
          return acc;
        },
        {} as Record<string, string>,
      );

      const res = await apiClient.jobs.testRequest({
        url: url.trim(),
        method,
        headers: headerObj,
        body: body || undefined,
      });

      const probeResult = (res as any)?.result || (res as any)?.data;
      if (res && res.success && probeResult) {
        if (probeResult.success) {
          toast.success(
            `Endpoint probe: HTTP ${probeResult.statusCode} (${probeResult.durationMs}ms)`,
          );
        } else {
          toast.error(
            `Probe returned ${probeResult.statusCode || "failure"}: ${probeResult.error || "Non-2xx status code"}`,
          );
        }
      } else {
        toast.error(`Endpoint probe failed: ${res?.error || "Connection error"}`);
      }
    } catch (err: any) {
      toast.error(`Endpoint probe error: ${err.message || "Failed to reach host"}`);
    } finally {
      setTesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter a job name.");
      return;
    }
    if (!url.trim()) {
      toast.error("Please enter a target URL.");
      return;
    }

    const savedJob: Job = {
      id: initialJob?.id || `job_${Date.now()}`,
      name,
      description,
      url,
      method,
      cron,
      timezone,
      enabled,
      status: enabled ? "active" : "paused",
      createdAt: initialJob?.createdAt || new Date().toISOString(),
      lastRunAt: initialJob?.lastRunAt ?? null,
      lastRunMinutesAgo: initialJob?.lastRunMinutesAgo ?? null,
      lastStatus: initialJob?.lastStatus ?? null,
      lastDurationMs: initialJob?.lastDurationMs ?? null,
      lastHttpStatus: initialJob?.lastHttpStatus ?? null,
      successCount: initialJob?.successCount ?? 0,
      failureCount: initialJob?.failureCount ?? 0,
      timeoutSeconds,
      maxRetries,
      retryBackoff,
      notifyEmail,
      notifyWebhook,
      headers,
      hasBody: method !== "GET" && method !== "HEAD",
      body: method !== "GET" && method !== "HEAD" ? body : null,
      authMode,
      authToken:
        authToken && authToken !== "••••••••••••••••"
          ? authToken
          : initialJob?.authToken || undefined,
      tags: initialJob?.tags || ["custom"],
    };

    try {
      const persisted = await DataStore.saveJob(savedJob);
      if (onSave) onSave(persisted);
      toast.success(
        isEditing
          ? `Job “${name}” updated in database!`
          : `Job “${name}” saved directly to MongoDB database!`,
      );
      navigate({ to: "/app/jobs" });
    } catch (err: any) {
      toast.error(`Failed to save job: ${err.message || "Error occurred while saving"}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl">
      {/* 1. Basic Information */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="border-b border-border/80 pb-3">
          <span className="eyebrow">Step 1</span>
          <h2 className="font-display text-lg font-bold text-foreground">Job Identity & Target</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">
              Job Name *
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Nightly database backup"
              required
              className="text-sm"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">
              Description
            </label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief context for teammates"
              className="text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">
              HTTP Method
            </label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as HttpMethod)}
              className="w-full h-9 rounded-md border border-border bg-background px-3 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-cobalt"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="PATCH">PATCH</option>
              <option value="DELETE">DELETE</option>
              <option value="HEAD">HEAD</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">
              Target Endpoint URL *
            </label>
            <div className="flex gap-2">
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://api.yourdomain.com/v1/jobs/run"
                required
                className="text-xs font-mono flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTestRequest}
                disabled={testing}
                className="font-mono text-xs whitespace-nowrap"
              >
                <Play className="h-3 w-3 mr-1" />
                {testing ? "Testing..." : "Test Ping"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Schedule & Timezone */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="border-b border-border/80 pb-3 flex items-center justify-between">
          <div>
            <span className="eyebrow">Step 2</span>
            <h2 className="font-display text-lg font-bold text-foreground">
              Cron Schedule & Timezone
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground">Timezone:</span>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="h-7 text-xs font-mono rounded border border-border bg-background px-2"
            >
              {COMMON_TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.value}
                </option>
              ))}
            </select>
          </div>
        </div>

        <CronEditor
          value={cron}
          onChange={setCron}
          timezone={timezone}
          onTimezoneChange={setTimezone}
          showTimezoneSelect={false}
        />
      </div>

      {/* 3. Headers & Authentication */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="border-b border-border/80 pb-3">
          <span className="eyebrow">Step 3</span>
          <h2 className="font-display text-lg font-bold text-foreground">
            Authentication & Headers
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">
              Auth Mode
            </label>
            <select
              value={authMode}
              onChange={(e) => setAuthMode(e.target.value as AuthMode)}
              className="w-full h-9 rounded-md border border-border bg-background px-3 text-xs font-mono"
            >
              <option value="none">None (Public)</option>
              <option value="bearer">Bearer Token</option>
              <option value="basic">Basic Auth</option>
              <option value="header">Custom Header</option>
            </select>
          </div>

          {authMode !== "none" && (
            <div className="md:col-span-2">
              <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">
                Secret Token / Key
              </label>
              <Input
                type="password"
                value={authToken}
                onChange={(e) => setAuthToken(e.target.value)}
                placeholder="Secret is encrypted via AES-256-GCM"
                className="text-xs font-mono"
              />
              <span className="text-[10px] text-muted-foreground mt-0.5 block">
                Stored in encrypted vault. Never exposed in plain text.
              </span>
            </div>
          )}
        </div>

        {/* Custom Headers list */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase text-muted-foreground">
              Request Headers
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addHeader}
              className="h-7 text-xs font-mono"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Header
            </Button>
          </div>

          <div className="space-y-2">
            {headers.map((h, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Input
                  value={h.key}
                  onChange={(e) => updateHeader(idx, e.target.value, h.value)}
                  placeholder="Header Name (e.g. X-Custom-Key)"
                  className="text-xs font-mono flex-1"
                />
                <Input
                  value={h.value}
                  onChange={(e) => updateHeader(idx, h.key, e.target.value)}
                  placeholder="Header Value"
                  className="text-xs font-mono flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeHeader(idx)}
                  className="h-8 w-8 text-muted-foreground hover:text-danger"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Body if POST/PUT/PATCH */}
        {method !== "GET" && method !== "HEAD" && (
          <div className="pt-2">
            <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">
              Request Payload (JSON or Raw)
            </label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              className="font-mono text-xs"
              placeholder="{}"
            />
          </div>
        )}
      </div>

      {/* 4. Reliability & Failover */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="border-b border-border/80 pb-3">
          <span className="eyebrow">Step 4</span>
          <h2 className="font-display text-lg font-bold text-foreground">
            Retry Backoff & Alert Policies
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">
              Max Retry Attempts
            </label>
            <select
              value={maxRetries}
              onChange={(e) => setMaxRetries(Number(e.target.value))}
              className="w-full h-9 rounded-md border border-border bg-background px-3 text-xs font-mono"
            >
              <option value={0}>0 (No retry)</option>
              <option value={1}>1 Retry</option>
              <option value={2}>2 Retries</option>
              <option value={3}>3 Retries (Recommended)</option>
              <option value={5}>5 Retries</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">
              Backoff Strategy
            </label>
            <select
              value={retryBackoff}
              onChange={(e) => setRetryBackoff(e.target.value as any)}
              className="w-full h-9 rounded-md border border-border bg-background px-3 text-xs font-mono"
            >
              <option value="fixed">Fixed Interval (30s)</option>
              <option value="exponential">Exponential (30s, 60s, 120s)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">
              Execution Timeout
            </label>
            <select
              value={timeoutSeconds}
              onChange={(e) => setTimeoutSeconds(Number(e.target.value))}
              className="w-full h-9 rounded-md border border-border bg-background px-3 text-xs font-mono"
            >
              <option value={15}>15 seconds</option>
              <option value={30}>30 seconds</option>
              <option value={60}>60 seconds (Standard)</option>
              <option value={300}>5 minutes (Long running)</option>
              <option value={600}>10 minutes</option>
            </select>
          </div>
        </div>

        <div className="border-t border-border/60 pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-semibold text-xs text-foreground block">
                Email notification on failure
              </span>
              <span className="text-[11px] text-muted-foreground">
                Alert on-call engineers when retry budget is exhausted
              </span>
            </div>
            <Switch checked={notifyEmail} onCheckedChange={setNotifyEmail} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="font-semibold text-xs text-foreground block">
                Webhook / Slack alert dispatch
              </span>
              <span className="text-[11px] text-muted-foreground">
                Push failure payload to configured workspace notification channels
              </span>
            </div>
            <Switch checked={notifyWebhook} onCheckedChange={setNotifyWebhook} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="font-semibold text-xs text-foreground block">
                Enable Job Immediately
              </span>
              <span className="text-[11px] text-muted-foreground">
                When enabled, the schedule begins ticking right after creation
              </span>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>
        </div>
      </div>

      {/* Submit / Cancel Buttons */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate({ to: "/app/jobs" })}
          className="font-mono text-xs"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="bg-foreground text-background font-mono text-xs hover:bg-foreground/90 px-6"
        >
          <Save className="h-4 w-4 mr-1.5" />
          {isEditing ? "Update Job Schedule" : "Create Scheduled Job"}
        </Button>
      </div>
    </form>
  );
}
