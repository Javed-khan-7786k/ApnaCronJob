export type JobStatus = "active" | "paused" | "running" | "retrying" | "failed";
export type ExecutionStatus = "success" | "failed" | "retrying";
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD";
export type AuthMode = "none" | "bearer" | "basic" | "header";

export interface Job {
  id: string;
  name: string;
  description: string;
  url: string;
  method: HttpMethod;
  cron: string;
  timezone: string;
  enabled: boolean;
  status: JobStatus;
  createdAt: string;
  lastRunAt: string | null;
  lastRunMinutesAgo: number | null;
  lastStatus: "success" | "failed" | "running" | "retrying" | null;
  lastDurationMs: number | null;
  lastHttpStatus: number | null;
  successCount: number;
  failureCount: number;
  timeoutSeconds: number;
  maxRetries: number;
  retryBackoff: "fixed" | "exponential";
  notifyEmail: boolean;
  notifyWebhook: boolean;
  headers: Array<{ key: string; value: string }>;
  hasBody: boolean;
  body?: string | null | undefined;
  authMode: AuthMode;
  authToken?: string | undefined;
  tags: string[];
}

export interface Execution {
  id: string;
  jobId: string;
  jobName: string;
  status: ExecutionStatus;
  startedMinutesAgo: number;
  durationMs: number;
  httpStatus: number | null;
  attempt: number;
  errorDetail: string | null;
}

export interface AuditEntry {
  id: string;
  minutesAgo: number;
  actor: string;
  action: string;
  target: string;
  kind:
    | "job.updated"
    | "job.created"
    | "job.deleted"
    | "settings.updated"
    | "key.created"
    | "key.revoked"
    | "member.added"
    | "member.invited"
    | "member.removed"
    | "channel.created"
    | "channel.deleted"
    | "plan.changed";
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "Owner" | "Admin" | "Editor" | "Viewer";
  status: "Active" | "Invited";
  initials: string;
}

export interface ApiKey {
  id: string;
  label: string;
  prefix: string;
  secretKey?: string | undefined;
  createdAt: string;
  createdMinutesAgo: number;
  lastUsedMinutesAgo: number | null;
  scopes: string[];
}

export interface Integration {
  id: string;
  name: string;
  category: "Webhooks" | "Messaging" | "Incident" | "Data" | "DevOps";
  description: string;
  connected: boolean;
  icon: "slack" | "discord" | "teams" | "pagerduty" | "zapier" | "github" | "linear" | "webhook";
}

export interface NotificationChannel {
  id: string;
  type: "email" | "webhook" | "slack" | "discord" | "pagerduty";
  label: string;
  target: string;
  events: Array<"failures" | "retries" | "recovers" | "warnings">;
  enabled: boolean;
}

export interface StatusService {
  id: string;
  name: string;
  status: "operational" | "degraded" | "outage";
  uptime90d: string;
  region: string;
}

export interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  type: "feature" | "improvement" | "fix";
  body: string;
}
