export type UserRole = "Administrator" | "Analyst" | "Viewer";

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
}

export interface SecurityEvent {
  id: number;
  event_id: string;
  timestamp: string;
  source_type: string;
  source_id?: string;
  host?: string;
  username?: string;
  source_ip?: string;
  destination_ip?: string;
  event_category: string;
  action: string;
  outcome: string;
  severity: "informational" | "low" | "medium" | "high" | "critical";
  process_name?: string;
  raw_payload?: string;
  normalized_payload?: Record<string, any>;
  ingested_at: string;
}

export interface DetectionRule {
  id: number;
  rule_id: string;
  version: string;
  name: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  confidence: number;
  rule_type: string;
  logic_definition: Record<string, any>;
  mitre_attack_id?: string;
  mitre_tactic?: string;
  mitre_technique?: string;
  enabled: boolean;
  suppression_window_seconds: number;
  last_triggered_at?: string;
}

export interface Alert {
  id: number;
  alert_id: string;
  rule_id: string;
  rule_name: string;
  severity: "low" | "medium" | "high" | "critical";
  confidence: number;
  title: string;
  description: string;
  explanation: string;
  entities?: {
    users?: string[];
    hosts?: string[];
    ips?: string[];
  };
  supporting_event_ids: string[];
  mitre_attack_id?: string;
  status: "new" | "acknowledged" | "investigating" | "resolved" | "closed" | "false_positive";
  assigned_to?: string;
  case_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CaseNote {
  id: number;
  case_id: string;
  user_id?: number;
  author_username: string;
  content: string;
  created_at: string;
}

export interface CaseEvidence {
  id: number;
  case_id: string;
  evidence_type: string;
  evidence_reference: string;
  description?: string;
  metadata_json?: Record<string, any>;
  created_at: string;
}

export interface IncidentCase {
  id: number;
  case_id: string;
  title: string;
  description: string;
  severity: string;
  status: "new" | "investigating" | "contained" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "critical";
  assigned_to?: string;
  findings?: string;
  resolution_summary?: string;
  checklist?: Array<{ task: string; completed: boolean }>;
  created_at: string;
  updated_at: string;
  closed_at?: string;
  notes: CaseNote[];
  evidence: CaseEvidence[];
}

export interface ThreatIndicator {
  id: number;
  ioc_type: "ip" | "domain" | "url" | "md5" | "sha256";
  value: string;
  threat_type: string;
  confidence: number;
  provenance: string;
  description?: string;
  first_seen: string;
  last_seen: string;
  expires_at?: string;
  created_at: string;
}

export interface DashboardMetrics {
  events_count: number;
  alerts_count: number;
  cases_count: number;
  open_alerts_by_severity: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  active_cases: number;
  event_volume_over_time: Array<{ date: string; events: number }>;
  top_affected_hosts: Array<{ host: string; count: number }>;
  top_triggered_rules: Array<{ rule_id: string; name: string; count: number }>;
  data_source_health: Array<{
    id: number;
    source_type: string;
    name: string;
    status: string;
    events_count: number;
    last_event_at?: string;
  }>;
  storage_utilization: {
    database_size_mb: number;
    disk_total_gb: number;
    disk_used_gb: number;
    disk_free_gb: number;
    disk_percent_used: number;
  };
  recent_audit_activity: Array<{
    id: number;
    username: string;
    action: string;
    resource_type?: string;
    created_at: string;
  }>;
}

export interface EntitySummary {
  entity_type: string;
  entity_value: string;
  events_count: number;
  alerts_count: number;
  cases_count: number;
  risk_score: number;
  first_seen?: string;
  last_seen?: string;
  recent_events: any[];
  related_alerts: any[];
  threat_intel_matches: any[];
}

export interface AttackTechnique {
  technique_id: string;
  technique_name: string;
  tactic: string;
  rules_count: number;
  implemented: boolean;
  tested: boolean;
}
