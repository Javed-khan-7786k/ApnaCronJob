/**
 * AapnaCronJob Production API Client
 * Dynamic API Base URL derived directly from environment configuration (VITE_API_URL).
 * Authenticates with Express & MongoDB backend to ensure all data is fetched live from database.
 */

const TOKEN_KEY = "aapnacronjob_token";

export function getApiBaseUrl(): string {
  // Check runtime localStorage override first if developer configured it in settings
  if (typeof window !== "undefined") {
    const runtimeUrl = window.localStorage.getItem("aapnacronjob_api_url");
    if (runtimeUrl) return runtimeUrl.replace(/\/+$/, "");
  }

  // Primary source of truth: Environment variable VITE_API_URL or VITE_API_BASE_URL
  const envUrl =
    (import.meta.env as Record<string, string | undefined>)["VITE_API_URL"] ||
    (import.meta.env as Record<string, string | undefined>)["VITE_API_BASE_URL"];
  if (envUrl) {
    return envUrl.replace(/\/+$/, "");
  }

  // Dynamic host fallback if running inside browser
  if (typeof window !== "undefined" && window.location) {
    return `${window.location.protocol}//${window.location.hostname}:5000/api`;
  }

  return "";
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) {
    window.localStorage.setItem(TOKEN_KEY, token);
  } else {
    window.localStorage.removeItem(TOKEN_KEY);
  }
}

export interface BackendHealth {
  ok: boolean;
  status: "connected" | "disconnected" | "checking";
  latencyMs: number;
  service?: string;
  uptime?: number;
  timestamp?: string;
  error?: string;
  apiUrl: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  token?: string;
  user?: any;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

class ApiError extends Error {
  status: number;
  data?: any;
  constructor(message: string, status: number = 500, data?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

async function request<T = any>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const baseUrl = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${cleanEndpoint}`;

  // Read stored user JWT token if logged in
  const token = getAuthToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const isJson = res.headers.get("content-type")?.includes("application/json");
    const json = isJson ? await res.json() : null;

    if (!res.ok) {
      const errorMsg = json?.error || json?.message || `Request failed with status ${res.status}`;
      throw new ApiError(errorMsg, res.status, json);
    }

    return (json || { success: true }) as ApiResponse<T>;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      throw new ApiError("Request timed out after 15 seconds", 408);
    }
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(err?.message || "Failed to communicate with backend server", 503);
  }
}

export const apiClient = {
  getApiBaseUrl,
  getAuthToken,
  setAuthToken,

  /**
   * Health Check Probe
   */
  async checkHealth(): Promise<BackendHealth> {
    const baseUrl = getApiBaseUrl();
    const probeUrl = `${baseUrl}/health`;
    const start = performance.now();

    try {
      const res = await fetch(probeUrl, {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      const latencyMs = Math.round(performance.now() - start);

      if (!res.ok) {
        return {
          ok: false,
          status: "disconnected",
          latencyMs,
          apiUrl: baseUrl,
          error: `HTTP ${res.status}: ${res.statusText}`,
        };
      }

      const json = await res.json();
      return {
        ok: true,
        status: "connected",
        latencyMs,
        service: json?.service || "aapna-cron-job",
        uptime: json?.uptime,
        timestamp: json?.timestamp,
        apiUrl: baseUrl,
      };
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - start);
      return {
        ok: false,
        status: "disconnected",
        latencyMs,
        apiUrl: baseUrl,
        error: err?.message || "Unable to reach backend server on port 5000",
      };
    }
  },

  /**
   * Authentication
   */
  auth: {
    async google(data: { email: string; name?: string; googleId?: string }) {
      const res = await request("/auth/google", {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (res.token) {
        setAuthToken(res.token);
      }
      return res;
    },

    async login(login: string, password: string) {
      const res = await request("/auth/login", {
        method: "POST",
        body: JSON.stringify({ login, password }),
      });
      if (res.token) {
        setAuthToken(res.token);
      }
      return res;
    },

    async register(data: {
      username: string;
      email: string;
      password: string;
      telegramChatId?: string;
    }) {
      const res = await request("/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (res.token) {
        setAuthToken(res.token);
      }
      return res;
    },

    async me() {
      return request("/auth/me", { method: "GET" });
    },

    async logout() {
      try {
        await request("/auth/logout", { method: "POST" });
      } finally {
        setAuthToken(null);
      }
    },

    async updateProfile(data: { telegramChatId?: string; telegramNotificationsEnabled?: boolean }) {
      return request("/auth/profile", {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },

    async changePassword(currentPassword: string, newPassword: string) {
      return request("/auth/password", {
        method: "PUT",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
    },
  },

  /**
   * Jobs Scheduling Engine
   */
  jobs: {
    async list(params?: {
      search?: string;
      tag?: string;
      status?: string;
      enabled?: boolean;
      page?: number;
      limit?: number;
    }) {
      const query = new URLSearchParams();
      if (params?.search) query.set("search", params.search);
      if (params?.tag) query.set("tag", params.tag);
      if (params?.status) query.set("status", params.status);
      if (params?.enabled !== undefined) query.set("enabled", String(params.enabled));
      if (params?.page) query.set("page", String(params.page));
      if (params?.limit) query.set("limit", String(params.limit));

      const qs = query.toString() ? `?${query.toString()}` : "";
      return request(`/jobs${qs}`, { method: "GET" });
    },

    async get(id: string) {
      return request(`/jobs/${encodeURIComponent(id)}`, { method: "GET" });
    },

    async create(jobData: any) {
      return request("/jobs", {
        method: "POST",
        body: JSON.stringify(jobData),
      });
    },

    async update(id: string, jobData: any) {
      return request(`/jobs/${encodeURIComponent(id)}`, {
        method: "PUT",
        body: JSON.stringify(jobData),
      });
    },

    async delete(id: string) {
      return request(`/jobs/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
    },

    async runNow(id: string) {
      return request(`/jobs/${encodeURIComponent(id)}/run`, {
        method: "POST",
      });
    },

    async toggle(id: string) {
      return request(`/jobs/${encodeURIComponent(id)}/toggle`, {
        method: "POST",
      });
    },

    async duplicate(id: string) {
      return request(`/jobs/${encodeURIComponent(id)}/duplicate`, {
        method: "POST",
      });
    },

    async validateCron(cron: string) {
      return request("/jobs/validate-cron", {
        method: "POST",
        body: JSON.stringify({ cron }),
      });
    },
  },

  /**
   * Executions & Telemetry
   */
  executions: {
    async list(params?: {
      jobId?: string;
      status?: string;
      triggerSource?: string;
      page?: number;
      limit?: number;
    }) {
      const query = new URLSearchParams();
      if (params?.jobId) query.set("jobId", params.jobId);
      if (params?.status) query.set("status", params.status);
      if (params?.triggerSource) query.set("triggerSource", params.triggerSource);
      if (params?.page) query.set("page", String(params.page));
      if (params?.limit) query.set("limit", String(params.limit));

      const qs = query.toString() ? `?${query.toString()}` : "";
      return request(`/executions${qs}`, { method: "GET" });
    },

    async get(id: string) {
      return request(`/executions/${encodeURIComponent(id)}`, { method: "GET" });
    },
  },

  /**
   * Notification Channels
   */
  notifications: {
    async list() {
      return request("/notifications", { method: "GET" });
    },

    async create(data: {
      type: string;
      label: string;
      target: string;
      events?: string[];
      enabled?: boolean;
    }) {
      return request("/notifications", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    async delete(id: string) {
      return request(`/notifications/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
    },

    async test(id: string) {
      return request(`/notifications/${encodeURIComponent(id)}/test`, {
        method: "POST",
      });
    },
  },

  /**
   * API Keys
   */
  apiKeys: {
    async list() {
      return request("/api-keys", { method: "GET" });
    },

    async create(data: { label: string; scopes?: string[] }) {
      return request("/api-keys", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    async delete(id: string) {
      return request(`/api-keys/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
    },
  },

  /**
   * Team Collaborators
   */
  team: {
    async list() {
      return request("/team", { method: "GET" });
    },

    async invite(data: { name: string; email: string; role?: string }) {
      return request("/team/invite", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    async remove(id: string) {
      return request(`/team/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
    },
  },

  /**
   * Audit Logs
   */
  auditLogs: {
    async list(params?: { action?: string; limit?: number }) {
      const query = new URLSearchParams();
      if (params?.action) query.set("action", params.action);
      if (params?.limit) query.set("limit", String(params.limit));
      const qs = query.toString() ? `?${query.toString()}` : "";
      return request(`/audit-logs${qs}`, { method: "GET" });
    },
  },

  /**
   * Integrations Hub
   */
  integrations: {
    async list() {
      return request("/integrations", { method: "GET" });
    },
    async toggle(id: string) {
      return request(`/integrations/${encodeURIComponent(id)}/toggle`, { method: "POST" });
    },
    async updateConfig(id: string, config: any) {
      return request(`/integrations/${encodeURIComponent(id)}/config`, {
        method: "PUT",
        body: JSON.stringify({ config }),
      });
    },
  },

  /**
   * Cluster Monitoring
   */
  monitoring: {
    async overview() {
      return request("/monitoring/overview", { method: "GET" });
    },
  },

  /**
   * System & Keep-Alive Self-Pinger
   */
  system: {
    async getSelfPinger() {
      return request("/system/self-pinger", { method: "GET" });
    },
    async updateSelfPinger(data: { enabled?: boolean; intervalMs?: number; targetUrl?: string }) {
      return request("/system/self-pinger", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    async pingNow() {
      return request("/system/self-pinger/ping-now", { method: "POST" });
    },
    async getHealth() {
      return request("/health", { method: "GET" });
    },
    async getSettings() {
      return request("/system/settings", { method: "GET" });
    },
    async updateSettings(data: {
      workspaceName?: string | undefined;
      supportEmail?: string | undefined;
      defaultTimeout?: number | undefined;
      retentionDays?: number | undefined;
    }) {
      return request("/system/settings", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
  },
};
