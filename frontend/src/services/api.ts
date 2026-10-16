import {
  User,
  SecurityEvent,
  DetectionRule,
  Alert,
  IncidentCase,
  ThreatIndicator,
  DashboardMetrics,
  EntitySummary,
  AttackTechnique
} from "../types";

const API_BASE = "/api/v1";

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem("krythos_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    "Content-Type": "application/json",
    ...getAuthHeader(),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem("krythos_token");
    localStorage.removeItem("krythos_user");
  }

  if (!response.ok) {
    let errorMsg = `Error ${response.status}: ${response.statusText}`;
    try {
      const errJson = await response.json();
      if (errJson.detail) {
        errorMsg = typeof errJson.detail === "string" ? errJson.detail : JSON.stringify(errJson.detail);
      }
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

export const api = {
  // Auth & System
  getAuthStatus: () => request<{ bootstrapped: boolean; registration_allowed: boolean }>("/auth/status"),
  getHealth: () => request<{ status: string; app_name: string; version: string; database: string }>("/health"),
  login: (credentials: { username_or_email: string; password: string }) =>
    request<{ access_token: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    }),
  register: (payload: any) =>
    request<User>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  bootstrapAdmin: (payload: any) =>
    request<User>("/auth/bootstrap-admin", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getCurrentUser: () => request<User>("/auth/me"),
  changePassword: (payload: any) =>
    request<{ message: string }>("/auth/change-password", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // Users (Admin)
  getUsers: () => request<User[]>("/users"),
  updateUserRole: (userId: number, role: string) =>
    request<User>(`/users/${userId}/role`, {
      method: "PUT",
      body: JSON.stringify({ role }),
    }),
  toggleUserActive: (userId: number, isActive: boolean) =>
    request<User>(`/users/${userId}/status?is_active=${isActive}`, {
      method: "PUT",
    }),

  // Dashboard
  getDashboardMetrics: () => request<DashboardMetrics>("/dashboard/metrics"),

  // Events
  getEvents: (params: Record<string, any>) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") {
        qs.append(k, String(v));
      }
    });
    return request<{ total: number; page: number; page_size: number; pages: number; items: SecurityEvent[] }>(
      `/events?${qs.toString()}`
    );
  },
  getEventDetail: (eventId: string) => request<SecurityEvent>(`/events/${eventId}`),

  // Ingestion
  ingestBatch: (records: any[], sourceType = "ui_batch") =>
    request<{ status: string; ingested: number }>("/ingestion/batch", {
      method: "POST",
      body: JSON.stringify(records),
    }),
  uploadLogFile: async (file: File, sourceType?: string) => {
    const fd = new FormData();
    fd.append("file", file);
    if (sourceType) fd.append("source_type", sourceType);

    const token = localStorage.getItem("krythos_token");
    const res = await fetch(`${API_BASE}/ingestion/upload`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: fd,
    });
    if (!res.ok) throw new Error("Log upload failed");
    return res.json();
  },

  // Detection Rules
  getRules: () => request<DetectionRule[]>("/detections/rules"),
  updateRule: (ruleId: string, payload: Partial<DetectionRule>) =>
    request<DetectionRule>(`/detections/rules/${ruleId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  runDetections: (limit = 1000) =>
    request<{ evaluated_events: number; alerts_generated: number }>("/detections/run", {
      method: "POST",
      body: JSON.stringify({ limit }),
    }),

  // Alerts
  getAlerts: (params: Record<string, any> = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v) qs.append(k, String(v));
    });
    return request<{ total: number; page: number; items: Alert[] }>(`/alerts?${qs.toString()}`);
  },
  getAlertDetail: (alertId: string) => request<Alert>(`/alerts/${alertId}`),
  updateAlertStatus: (alertId: string, status: string, assignedTo?: string, caseId?: string) =>
    request<Alert>(`/alerts/${alertId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status, assigned_to: assignedTo, case_id: caseId }),
    }),
  getAlertAiAssist: (alertId: string) => request<any>(`/alerts/${alertId}/ai-assist`),

  // Cases
  getCases: (params: Record<string, any> = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v) qs.append(k, String(v));
    });
    return request<{ total: number; items: IncidentCase[] }>(`/cases?${qs.toString()}`);
  },
  getCaseDetail: (caseId: string) => request<IncidentCase>(`/cases/${caseId}`),
  createCase: (payload: { title: string; description: string; severity?: string; priority?: string; alert_ids?: string[] }) =>
    request<IncidentCase>("/cases", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateCase: (caseId: string, payload: any) =>
    request<IncidentCase>(`/cases/${caseId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  addCaseNote: (caseId: string, content: string) =>
    request<any>(`/cases/${caseId}/notes`, {
      method: "POST",
      body: JSON.stringify({ content }),
    }),
  addCaseEvidence: (caseId: string, evidenceType: string, evidenceRef: string, description?: string) =>
    request<any>(`/cases/${caseId}/evidence`, {
      method: "POST",
      body: JSON.stringify({
        evidence_type: evidenceType,
        evidence_reference: evidenceRef,
        description,
      }),
    }),

  // Entities
  getEntitySummary: (type: string, value: string) =>
    request<EntitySummary>(`/entities/summary?entity_type=${type}&entity_value=${encodeURIComponent(value)}`),

  // Threat Intel & ATT&CK
  getIOCs: () => request<ThreatIndicator[]>("/intelligence/iocs"),
  addIOC: (payload: any) =>
    request<ThreatIndicator>("/intelligence/iocs", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getAttackMatrix: () => request<AttackTechnique[]>("/intelligence/attack-matrix"),

  // Detection Rules
  createRule: (payload: any) =>
    request<DetectionRule>("/detections/rules", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // Live Telemetry Collector
  getCollectorStatus: () => request<{
    running: boolean;
    source: string;
    events_captured: number;
    alerts_triggered: number;
    last_event_at: string | null;
    platform: string;
  }>("/events/collector/status"),
  restartCollector: () => request<any>("/events/collector/restart", { method: "POST" }),

  // Playbooks & Incident Response (Live Actions)
  blockIP: (ip: string, reason = "Analyst incident response") =>
    request<any>("/playbooks/block-ip", {
      method: "POST",
      body: JSON.stringify({ ip, reason }),
    }),
  isolateHost: (host: string, reason = "Host containment policy") =>
    request<any>("/playbooks/isolate-host", {
      method: "POST",
      body: JSON.stringify({ host, reason }),
    }),
  lockoutUser: (username: string, reason = "Compromised credential mitigation") =>
    request<any>("/playbooks/lockout-user", {
      method: "POST",
      body: JSON.stringify({ username, reason }),
    }),
  sweepIOCs: () => request<any>("/playbooks/sweep-iocs", { method: "POST" }),

  // Reports & Settings
  getExecutiveReport: () => request<any>("/reports/summary"),
  getSettings: () => request<any>("/settings"),
  updateSettings: (payload: any) =>
    request<any>("/settings", {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  getAuditLogs: (limit = 50) => request<any[]>(`/settings/audit-logs?limit=${limit}`),
};
