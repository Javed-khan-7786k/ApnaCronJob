import type {
  Job,
  Execution,
  ApiKey,
  AuditEntry,
  Integration,
  NotificationChannel,
  StatusService,
  TeamMember,
  HttpMethod,
  JobStatus,
  AuthMode,
} from "@/types";
import {
  demoIntegrations as initialIntegrations,
  demoStatusServices as initialStatusServices,
} from "./demo-data";
import { apiClient } from "./api-client";

const JOBS_STORAGE_KEY = "aapnacronjob_jobs";
const EXECUTIONS_STORAGE_KEY = "aapnacronjob_executions";
const CHANNELS_STORAGE_KEY = "aapnacronjob_channels";
const KEYS_STORAGE_KEY = "aapnacronjob_keys";
const TEAM_STORAGE_KEY = "aapnacronjob_team";
const AUDIT_STORAGE_KEY = "aapnacronjob_audit";
const SETTINGS_STORAGE_KEY = "aapnacronjob_settings";
const INTEGRATIONS_STORAGE_KEY = "aapnacronjob_integrations";

export interface WorkspaceSettings {
  workspaceName: string;
  supportEmail: string;
  defaultTimeout: number;
  twoFactor: boolean;
  enforceSso: boolean;
  timezone: string;
  retentionDays?: number | undefined;
}

const DEFAULT_SETTINGS: WorkspaceSettings = {
  workspaceName: "AapnaCronJob Production",
  supportEmail: "ops@apnascheduler.local",
  defaultTimeout: 60,
  twoFactor: true,
  enforceSso: false,
  timezone: "Asia/Kolkata",
  retentionDays: 30,
};

function getStorageItem<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

function setStorageItem<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

export function normalizeBackendJob(doc: any): Job {
  const id = String(doc._id || doc.id);
  const now = Date.now();
  const lastRunAt = doc.lastRunAt || null;
  const lastRunMinutesAgo = lastRunAt
    ? Math.max(0, Math.round((now - new Date(lastRunAt).getTime()) / 60000))
    : null;

  return {
    id,
    name: doc.name || "Untitled Job",
    description: doc.description || "",
    url: doc.targetUrl || doc.url || "",
    method: String(doc.httpMethod || doc.method || "GET").toUpperCase() as HttpMethod,
    cron:
      doc.scheduleType === "once"
        ? doc.cronExpression || ""
        : doc.cronExpression || doc.customCron || doc.cron || "0 * * * *",
    timezone: doc.timezone || "Asia/Kolkata",
    enabled: doc.enabled !== false,
    status: (doc.status === "paused"
      ? "paused"
      : doc.status === "running"
        ? "running"
        : doc.status === "retrying"
          ? "retrying"
          : doc.status === "failed"
            ? "failed"
            : "active") as JobStatus,
    createdAt: doc.createdAt || new Date().toISOString(),
    lastRunAt,
    lastRunMinutesAgo,
    lastStatus:
      doc.lastStatus === "success"
        ? "success"
        : doc.lastStatus === "running"
          ? "running"
          : doc.lastStatus === "retrying"
            ? "retrying"
            : doc.lastStatus === "failure" || doc.lastStatus === "failed"
              ? "failed"
              : null,
    lastDurationMs: doc.lastDurationMs || null,
    lastHttpStatus: doc.lastHttpStatus || null,
    successCount: Number(doc.successCount) || 0,
    failureCount: Number(doc.failureCount) || 0,
    timeoutSeconds: doc.timeoutMs
      ? Math.round(doc.timeoutMs / 1000)
      : Number(doc.timeoutSeconds) || 30,
    maxRetries:
      typeof doc.retryPolicy?.maxAttempts === "number"
        ? doc.retryPolicy.maxAttempts
        : typeof doc.maxRetries === "number"
          ? doc.maxRetries
          : 3,
    retryBackoff: doc.retryPolicy?.strategy === "fixed" ? "fixed" : "exponential",
    notifyEmail: doc.notifyEmail !== false,
    notifyWebhook: Boolean(doc.notifyWebhook),
    headers: Array.isArray(doc.headersList)
      ? doc.headersList.map((h: any) => ({ key: h.key || "", value: String(h.value ?? "") }))
      : doc.headers && typeof doc.headers === "object"
        ? Object.entries(doc.headers).map(([key, value]) => ({ key, value: String(value ?? "") }))
        : [],
    hasBody: Boolean(doc.hasBody || doc.body),
    body:
      typeof doc.body === "string" ? doc.body : doc.body ? JSON.stringify(doc.body, null, 2) : null,
    authMode: (doc.authMode || "none") as AuthMode,
    authToken: doc.authToken || undefined,
    tags: Array.isArray(doc.tags) ? doc.tags : [],
  };
}

export function normalizeBackendExecution(doc: any): Execution {
  const startedAt = doc.startedAt || doc.createdAt;
  const startedMinutesAgo = startedAt
    ? Math.max(0, Math.round((Date.now() - new Date(startedAt).getTime()) / 60000))
    : 0;
  const status =
    doc.status === "completed" || doc.status === "success"
      ? "success"
      : doc.status === "retrying"
        ? "retrying"
        : "failed";

  return {
    id: String(doc._id || doc.id),
    jobId: String(doc.jobId || doc.job?._id || ""),
    jobName: doc.jobName || doc.job?.name || "Dispatched Task",
    status,
    startedMinutesAgo,
    durationMs: typeof doc.durationMs === "number" ? doc.durationMs : Number(doc.durationMs) || 0,
    httpStatus:
      doc.responseStatus !== undefined && doc.responseStatus !== null
        ? Number(doc.responseStatus)
        : doc.httpStatus !== undefined && doc.httpStatus !== null
          ? Number(doc.httpStatus)
          : status === "success"
            ? 200
            : null,
    attempt: Number(doc.attempt) || 1,
    errorDetail:
      doc.errorDetail ||
      doc.errorMessage ||
      (doc.error ? String(doc.error) : null) ||
      (status === "failed" && !doc.responseStatus ? "Network or execution error" : null),
  };
}

export const DataStore = {
  // Synchronize entire state with the live Express + MongoDB backend
  async syncWithBackend(): Promise<boolean> {
    try {
      const health = await apiClient.checkHealth();
      if (!health.ok) return false;

      // 1. Sync Jobs from MongoDB
      const jobsRes = await apiClient.jobs.list({ limit: 100 });
      if (jobsRes.success && Array.isArray(jobsRes.data)) {
        const backendJobs = jobsRes.data.map(normalizeBackendJob);
        setStorageItem(JOBS_STORAGE_KEY, backendJobs);
      }

      // 2. Sync Executions from MongoDB
      const execRes = await apiClient.executions.list({ limit: 50 });
      if (execRes.success && Array.isArray(execRes.data)) {
        const backendExecs = execRes.data.map(normalizeBackendExecution);
        setStorageItem(EXECUTIONS_STORAGE_KEY, backendExecs);
      }

      // 3. Sync Notification Channels from MongoDB
      const chanRes = await apiClient.notifications.list();
      if (chanRes.success && Array.isArray(chanRes.data)) {
        const backendChans: NotificationChannel[] = chanRes.data.map((c: any) => ({
          id: String(c._id || c.id),
          type: c.type || "webhook",
          label: c.label || "Alert Channel",
          target: c.target || "",
          events: Array.isArray(c.events) ? c.events : ["failures"],
          enabled: c.enabled !== false,
        }));
        setStorageItem(CHANNELS_STORAGE_KEY, backendChans);
      }

      // 4. Sync API Keys from MongoDB
      const keysRes = await apiClient.apiKeys.list();
      if (keysRes.success && Array.isArray(keysRes.data)) {
        const backendKeys: ApiKey[] = keysRes.data.map((k: any) => {
          const createdAt = k.createdAt || new Date().toISOString();
          const createdMinutesAgo = Math.max(
            0,
            Math.round((Date.now() - new Date(createdAt).getTime()) / 60000),
          );
          return {
            id: String(k._id || k.id),
            label: k.label || "API Key",
            prefix: k.prefix || "crn_live_****",
            createdAt,
            createdMinutesAgo,
            lastUsedMinutesAgo: k.lastUsedAt
              ? Math.max(0, Math.round((Date.now() - new Date(k.lastUsedAt).getTime()) / 60000))
              : null,
            scopes: Array.isArray(k.scopes) ? k.scopes : ["jobs:read"],
          };
        });
        setStorageItem(KEYS_STORAGE_KEY, backendKeys);
      }

      // 5. Sync Team Members from MongoDB
      const teamRes = await apiClient.team.list();
      if (teamRes.success && Array.isArray(teamRes.data)) {
        const backendTeam: TeamMember[] = teamRes.data.map((m: any) => ({
          id: String(m._id || m.id),
          name: m.name || "Team Member",
          email: m.email || "",
          role: m.role || "Editor",
          status: m.status || "Active",
          initials: m.initials || "MB",
        }));
        setStorageItem(TEAM_STORAGE_KEY, backendTeam);
      }

      // 6. Sync Audit Logs from MongoDB
      const auditRes = await apiClient.auditLogs.list({ limit: 50 });
      if (auditRes.success && Array.isArray(auditRes.data)) {
        const backendAudit: AuditEntry[] = auditRes.data.map((a: any) => ({
          id: String(a._id || a.id),
          minutesAgo: Math.max(
            0,
            Math.round(
              (Date.now() - new Date(a.createdAt || a.timestamp || Date.now()).getTime()) / 60000,
            ),
          ),
          actor: a.username || a.user?.username || "Admin",
          action: a.action?.toLowerCase()?.replace(/_/g, " ") || "performed operation",
          target: a.targetId
            ? String(a.targetId)
            : a.details?.name || a.details?.label || "Resource",
          kind: "job.updated",
        }));
        setStorageItem(AUDIT_STORAGE_KEY, backendAudit);
      }

      // 7. Sync Workspace Settings from MongoDB
      try {
        const settingsRes = await apiClient.system.getSettings();
        if (settingsRes.success && settingsRes.data) {
          const s = settingsRes.data;
          const current = this.getSettings();
          const syncedSettings: WorkspaceSettings = {
            ...current,
            workspaceName: s.workspaceName || current.workspaceName,
            supportEmail: s.supportEmail || current.supportEmail,
            defaultTimeout: s.defaultTimeout || current.defaultTimeout,
            retentionDays: s.retentionDays || current.retentionDays,
          };
          setStorageItem(SETTINGS_STORAGE_KEY, syncedSettings);
        }
      } catch {
        // quiet settings fallback
      }

      return true;
    } catch (err: any) {
      console.warn("Backend synchronization notice:", err?.message || err);
      return false;
    }
  },

  // Jobs
  getJobs(): Job[] {
    return getStorageItem<Job[]>(JOBS_STORAGE_KEY, []);
  },

  getJob(id: string): Job | undefined {
    const jobs = this.getJobs();
    return jobs.find((j) => j.id === id);
  },

  async saveJob(job: Job): Promise<Job> {
    const jobs = this.getJobs();
    const index = jobs.findIndex((j) => j.id === job.id);
    const isNew = index < 0 || job.id.startsWith("job_") || job.id.startsWith("tmp_");

    const payload = {
      name: job.name,
      description: job.description,
      targetUrl: job.url,
      httpMethod: job.method,
      scheduleType: job.cron ? "custom" : "once",
      customCron: job.cron || undefined,
      cronExpression: job.cron || undefined,
      timezone: job.timezone || "Asia/Kolkata",
      enabled: job.enabled,
      timeoutMs: (job.timeoutSeconds || 30) * 1000,
      retryPolicy: {
        maxAttempts: typeof job.maxRetries === "number" ? job.maxRetries : 3,
        strategy: job.retryBackoff || "exponential",
      },
      headers: job.headers.reduce(
        (acc, h) => {
          if (h.key && h.key.trim()) acc[h.key.trim()] = h.value;
          return acc;
        },
        {} as Record<string, string>,
      ),
      body: job.body || null,
      authMode: job.authMode,
      authToken: job.authToken,
      tags: job.tags,
    };

    let persistedJob = job;

    if (isNew) {
      const res = await apiClient.jobs.create(payload);
      if (res && res.success && res.data) {
        persistedJob = normalizeBackendJob(res.data);
      } else {
        throw new Error(res?.error || "Failed to create job in database");
      }
    } else {
      const res = await apiClient.jobs.update(job.id, payload);
      if (res && res.success && res.data) {
        persistedJob = normalizeBackendJob(res.data);
      } else {
        throw new Error(res?.error || "Failed to update job in database");
      }
    }

    const currentJobs = this.getJobs();
    const existingIndex = currentJobs.findIndex((j) => j.id === job.id || j.id === persistedJob.id);
    let updatedJobs: Job[];
    if (existingIndex >= 0) {
      updatedJobs = [...currentJobs];
      updatedJobs[existingIndex] = persistedJob;
    } else {
      updatedJobs = [persistedJob, ...currentJobs];
    }
    setStorageItem(JOBS_STORAGE_KEY, updatedJobs);

    this.addAudit({
      id: `au_${Date.now()}`,
      minutesAgo: 0,
      actor: "You",
      action: isNew ? "created job in database" : "updated job in database",
      target: persistedJob.name,
      kind: isNew ? "job.created" : "job.updated",
    });

    return persistedJob;
  },

  async toggleJob(id: string): Promise<Job | undefined> {
    const jobs = this.getJobs();
    const target = jobs.find((j) => j.id === id);
    if (!target) return undefined;

    const nextEnabled = !target.enabled;
    const optimistic: Job = {
      ...target,
      enabled: nextEnabled,
      status: nextEnabled ? "active" : "paused",
    };

    // Update locally immediately
    const updatedJobs = jobs.map((j) => (j.id === id ? optimistic : j));
    setStorageItem(JOBS_STORAGE_KEY, updatedJobs);

    try {
      const res = await apiClient.jobs.toggle(id);
      if (res.success && res.data) {
        const synced = normalizeBackendJob(res.data);
        const finalJobs = this.getJobs().map((j) => (j.id === id ? synced : j));
        setStorageItem(JOBS_STORAGE_KEY, finalJobs);
        return synced;
      }
    } catch (err: any) {
      console.warn("Backend toggle notice:", err.message);
    }

    return optimistic;
  },

  async deleteJob(id: string): Promise<void> {
    const jobs = this.getJobs();
    const target = jobs.find((j) => j.id === id);

    // Call backend API first; if it fails, throw error and preserve local state
    await apiClient.jobs.delete(id);

    const updated = jobs.filter((j) => j.id !== id);
    setStorageItem(JOBS_STORAGE_KEY, updated);

    if (target) {
      this.addAudit({
        id: `au_${Date.now()}`,
        minutesAgo: 0,
        actor: "You",
        action: "deleted job from database",
        target: target.name,
        kind: "job.deleted",
      });
    }
  },

  // Executions
  getExecutions(): Execution[] {
    return getStorageItem<Execution[]>(EXECUTIONS_STORAGE_KEY, []);
  },

  recordExecution(
    jobId: string,
    status: "success" | "failed" | "retrying" = "success",
    durationMs: number = 120,
    httpStatus: number = 200,
  ): Execution {
    const jobs = this.getJobs();
    const job = jobs.find((j) => j.id === jobId);
    const exec: Execution = {
      id: `run_${Date.now().toString(36)}`,
      jobId,
      jobName: job?.name || "Dispatched Task",
      status,
      startedMinutesAgo: 0,
      durationMs,
      httpStatus,
      attempt: 1,
      errorDetail:
        status === "failed" ? `HTTP ${httpStatus} error returned from ${job?.url}` : null,
    };

    const current = this.getExecutions();
    setStorageItem(EXECUTIONS_STORAGE_KEY, [exec, ...current]);
    return exec;
  },

  async runJobNow(jobId: string): Promise<Execution> {
    const res: any = await apiClient.jobs.runNow(jobId);
    if (res && res.success && (res.data || res.executionId)) {
      const executionData = res.data || {
        _id: res.executionId,
        jobId,
        status: res.status || "completed",
        responseStatus: res.responseStatus || res.statusCode || 200,
        durationMs: res.durationMs || 150,
        startedAt: new Date().toISOString(),
      };
      const normalized = normalizeBackendExecution(executionData);
      const current = this.getExecutions();
      setStorageItem(EXECUTIONS_STORAGE_KEY, [normalized, ...current]);

      // Re-sync jobs to get latest run timestamp and metrics from database
      this.syncWithBackend().catch(() => {});
      return normalized;
    }
    throw new Error(res?.error || "Failed to trigger job execution on backend");
  },

  clearExecutions(): void {
    setStorageItem(EXECUTIONS_STORAGE_KEY, []);
  },

  // Notification Channels
  getChannels(): NotificationChannel[] {
    return getStorageItem<NotificationChannel[]>(CHANNELS_STORAGE_KEY, []);
  },

  saveChannels(channels: NotificationChannel[]): void {
    setStorageItem(CHANNELS_STORAGE_KEY, channels);
  },

  async addChannel(data: Omit<NotificationChannel, "id">): Promise<NotificationChannel> {
    const res = await apiClient.notifications.create(data);
    if (!res || !res.success || !res.data) {
      throw new Error(res?.error || "Failed to create alert channel in database");
    }

    const newChannel: NotificationChannel = {
      id: String(res.data._id || res.data.id),
      type: res.data.type || data.type,
      label: res.data.label || data.label,
      target: res.data.target || data.target,
      events: res.data.events || data.events,
      enabled: res.data.enabled !== false,
    };

    const channels = this.getChannels();
    this.saveChannels([newChannel, ...channels]);
    this.addAudit({
      id: `au_${Date.now()}`,
      minutesAgo: 0,
      actor: "You",
      action: "created alert channel in database",
      target: newChannel.label,
      kind: "channel.created",
    });

    return newChannel;
  },

  toggleChannel(id: string): NotificationChannel | undefined {
    const channels = this.getChannels();
    const target = channels.find((c) => c.id === id);
    if (!target) return undefined;
    const updated = channels.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c));
    this.saveChannels(updated);
    return { ...target, enabled: !target.enabled };
  },

  async deleteChannel(id: string): Promise<void> {
    const channels = this.getChannels();
    const target = channels.find((c) => c.id === id);

    await apiClient.notifications.delete(id);

    this.saveChannels(channels.filter((c) => c.id !== id));
    if (target) {
      this.addAudit({
        id: `au_${Date.now()}`,
        minutesAgo: 0,
        actor: "You",
        action: "deleted alert channel from database",
        target: target.label,
        kind: "channel.deleted",
      });
    }
  },

  // API Keys
  getApiKeys(): ApiKey[] {
    return getStorageItem<ApiKey[]>(KEYS_STORAGE_KEY, []);
  },

  saveApiKeys(keys: ApiKey[]): void {
    setStorageItem(KEYS_STORAGE_KEY, keys);
  },

  async addApiKey(
    label: string,
    scopes: string[] = ["jobs:read", "jobs:write", "runs:dispatch"],
  ): Promise<ApiKey> {
    const res = await apiClient.apiKeys.create({ label, scopes });
    if (!res || !res.success || !res.data) {
      throw new Error(res?.error || "Failed to generate API key in database");
    }

    const newKey: ApiKey = {
      id: String(res.data._id || res.data.id),
      label: res.data.label || label,
      prefix:
        res.data.prefix ||
        (res.data.secretKey ? res.data.secretKey.substring(0, 13) : "crn_live_****"),
      secretKey: res.data.secretKey,
      createdAt: res.data.createdAt || new Date().toISOString(),
      createdMinutesAgo: 0,
      lastUsedMinutesAgo: null,
      scopes: res.data.scopes || scopes,
    };

    const keys = this.getApiKeys();
    this.saveApiKeys([newKey, ...keys]);
    this.addAudit({
      id: `au_${Date.now()}`,
      minutesAgo: 0,
      actor: "You",
      action: "generated API key in database",
      target: newKey.label,
      kind: "key.created",
    });

    return newKey;
  },

  async revokeApiKey(id: string): Promise<void> {
    const keys = this.getApiKeys();
    const target = keys.find((k) => k.id === id);

    // Call backend API first; if it fails, throw error and keep key visible in UI
    await apiClient.apiKeys.delete(id);

    this.saveApiKeys(keys.filter((k) => k.id !== id));
    if (target) {
      this.addAudit({
        id: `au_${Date.now()}`,
        minutesAgo: 0,
        actor: "You",
        action: "revoked API key in database",
        target: target.label,
        kind: "key.revoked",
      });
    }
  },

  // Team
  getTeam(): TeamMember[] {
    return getStorageItem<TeamMember[]>(TEAM_STORAGE_KEY, []);
  },

  saveTeam(members: TeamMember[]): void {
    setStorageItem(TEAM_STORAGE_KEY, members);
  },

  async inviteMember(
    name: string,
    email: string,
    role: TeamMember["role"] = "Editor",
  ): Promise<TeamMember> {
    const initials =
      name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || "MB";

    const res = await apiClient.team.invite({ name, email, role });
    if (!res || !res.success || !res.data) {
      throw new Error(res?.error || "Failed to invite team member in database");
    }

    const newMember: TeamMember = {
      id: String(res.data._id || res.data.id),
      name: res.data.name || name,
      email: res.data.email || email,
      role: res.data.role || role,
      status: res.data.status || "Active",
      initials: res.data.initials || initials,
    };

    const team = this.getTeam();
    this.saveTeam([...team, newMember]);
    this.addAudit({
      id: `au_${Date.now()}`,
      minutesAgo: 0,
      actor: "You",
      action: "invited team member in database",
      target: email,
      kind: "member.invited",
    });

    return newMember;
  },

  async removeMember(id: string): Promise<void> {
    const team = this.getTeam();
    const target = team.find((m) => m.id === id);

    await apiClient.team.remove(id);

    this.saveTeam(team.filter((m) => m.id !== id));
    if (target) {
      this.addAudit({
        id: `au_${Date.now()}`,
        minutesAgo: 0,
        actor: "You",
        action: "removed team member from database",
        target: target.name,
        kind: "member.removed",
      });
    }
  },

  // Audit Logs
  getAudit(): AuditEntry[] {
    return getStorageItem<AuditEntry[]>(AUDIT_STORAGE_KEY, []);
  },

  addAudit(entry: AuditEntry): void {
    const list = this.getAudit();
    setStorageItem(AUDIT_STORAGE_KEY, [entry, ...list.slice(0, 75)]);
  },

  // Workspace Settings
  getSettings(): WorkspaceSettings {
    return getStorageItem<WorkspaceSettings>(SETTINGS_STORAGE_KEY, DEFAULT_SETTINGS);
  },

  saveSettings(partial: Partial<WorkspaceSettings>): WorkspaceSettings {
    const current = this.getSettings();
    const updated = { ...current, ...partial };
    setStorageItem(SETTINGS_STORAGE_KEY, updated);
    this.addAudit({
      id: `au_${Date.now()}`,
      minutesAgo: 0,
      actor: "You",
      action: "updated workspace settings",
      target: updated.workspaceName,
      kind: "settings.updated",
    });
    apiClient.system
      .updateSettings({
        workspaceName: updated.workspaceName,
        supportEmail: updated.supportEmail,
        defaultTimeout: updated.defaultTimeout,
        retentionDays: updated.retentionDays ?? 30,
      })
      .catch(() => {});
    return updated;
  },

  // Status Services & Integrations
  getStatusServices(): StatusService[] {
    return initialStatusServices;
  },

  getIntegrations(): Integration[] {
    return getStorageItem<Integration[]>(INTEGRATIONS_STORAGE_KEY, initialIntegrations);
  },

  toggleIntegration(id: string): Integration | undefined {
    const list = this.getIntegrations();
    const target = list.find((i) => i.id === id);
    if (!target) return undefined;
    const updated = list.map((i) => (i.id === id ? { ...i, connected: !i.connected } : i));
    setStorageItem(INTEGRATIONS_STORAGE_KEY, updated);
    apiClient.integrations.toggle(id).catch(() => {});
    return { ...target, connected: !target.connected };
  },
};
