import React, { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Briefcase,
  Database,
  HardDrive,
  RefreshCw,
  Server,
  Shield,
  ArrowUpRight
} from "lucide-react";
import { api } from "../services/api";
import { DashboardMetrics } from "../types";
import { NavItem } from "../components/Sidebar";

interface DashboardPageProps {
  onNavigate: (tab: NavItem) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMetrics = async () => {
    try {
      setRefreshing(true);
      const data = await api.getDashboardMetrics();
      setMetrics(data);
    } catch (e) {
      console.error("Failed to load dashboard metrics", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 15000); // 15s live refresh
    return () => clearInterval(interval);
  }, []);

  if (loading && !metrics) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
        Loading real SOC operational telemetry...
      </div>
    );
  }

  const sev = metrics?.open_alerts_by_severity;
  const maxVolume = Math.max(...(metrics?.event_volume_over_time?.map((v) => v.events) || [1]), 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)" }}>
            Security Operations Overview
          </h1>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "2px" }}>
            Real-time defensive posture, alert queues, and data source health
          </p>
        </div>

        <button
          onClick={loadMetrics}
          disabled={refreshing}
          className="btn-secondary"
          style={{ fontSize: "12px", padding: "6px 12px" }}
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "16px"
      }}>
        {/* Total Ingested Events */}
        <div className="metric-card" style={{ cursor: "pointer" }} onClick={() => onNavigate("events")}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>
              Total Events
            </span>
            <Database size={18} color="var(--accent-cyan)" />
          </div>
          <div style={{ fontSize: "28px", fontWeight: 700, margin: "12px 0 4px 0", color: "var(--text-primary)" }}>
            {metrics?.events_count.toLocaleString() || 0}
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "4px" }}>
            <span>Normalized in SQLite</span>
            <ArrowUpRight size={12} color="var(--accent-emerald)" />
          </div>
        </div>

        {/* Open Critical/High Alerts */}
        <div className="metric-card" style={{ cursor: "pointer" }} onClick={() => onNavigate("alerts")}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>
              Critical / High Alerts
            </span>
            <AlertTriangle size={18} color="var(--sev-critical)" />
          </div>
          <div style={{ fontSize: "28px", fontWeight: 700, margin: "12px 0 4px 0", color: "var(--sev-critical)" }}>
            {(sev?.critical || 0) + (sev?.high || 0)}
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "4px" }}>
            <span>{sev?.critical || 0} Critical, {sev?.high || 0} High</span>
            <ArrowUpRight size={12} color="var(--accent-emerald)" />
          </div>
        </div>

        {/* Active Incident Cases */}
        <div className="metric-card" style={{ cursor: "pointer" }} onClick={() => onNavigate("cases")}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>
              Active Incidents
            </span>
            <Briefcase size={18} color="#eab308" />
          </div>
          <div style={{ fontSize: "28px", fontWeight: 700, margin: "12px 0 4px 0", color: "var(--text-primary)" }}>
            {metrics?.active_cases || 0}
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "4px" }}>
            <span>Total cases: {metrics?.cases_count || 0}</span>
            <ArrowUpRight size={12} color="var(--accent-emerald)" />
          </div>
        </div>

        {/* Storage Utilization */}
        <div className="metric-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>
              Storage Used
            </span>
            <HardDrive size={18} color="var(--text-secondary)" />
          </div>
          <div style={{ fontSize: "28px", fontWeight: 700, margin: "12px 0 4px 0", color: "var(--text-primary)" }}>
            {metrics?.storage_utilization?.database_size_mb || 0} <span style={{ fontSize: "14px", color: "var(--text-muted)" }}>MB</span>
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
            Disk: {metrics?.storage_utilization?.disk_used_gb || 0}GB / {metrics?.storage_utilization?.disk_total_gb || 0}GB ({metrics?.storage_utilization?.disk_percent_used || 0}%)
          </div>
        </div>
      </div>

      {/* Row 2: Event Volume Timeline & Severity Breakdown */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "16px" }}>
        {/* Event Volume Over Time (Pure SVG Micro-Chart) */}
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
              Ingested Event Volume (Past 7 Days)
            </h3>
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Daily event density</span>
          </div>

          <div style={{
            display: "flex",
            alignItems: "flex-end",
            gap: "12px",
            height: "140px",
            padding: "10px 0",
            borderBottom: "1px solid var(--border-color)"
          }}>
            {metrics?.event_volume_over_time?.map((item, idx) => {
              const heightPercent = Math.max((item.events / maxVolume) * 100, 6);
              return (
                <div key={idx} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>{item.events}</span>
                  <div
                    title={`${item.date}: ${item.events} events`}
                    style={{
                      width: "100%",
                      height: `${heightPercent}%`,
                      background: "linear-gradient(180deg, var(--accent-cyan) 0%, rgba(14, 165, 233, 0.2) 100%)",
                      borderRadius: "4px 4px 0 0",
                      transition: "height 0.3s ease"
                    }}
                  />
                  <span style={{ fontSize: "10px", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                    {item.date.slice(5)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Open Alerts by Severity */}
        <div className="card">
          <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "16px" }}>
            Open Alerts by Severity
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="badge badge-critical">Critical</span>
              <span style={{ fontWeight: 700, fontSize: "16px" }}>{sev?.critical || 0}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="badge badge-high">High</span>
              <span style={{ fontWeight: 700, fontSize: "16px" }}>{sev?.high || 0}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="badge badge-medium">Medium</span>
              <span style={{ fontWeight: 700, fontSize: "16px" }}>{sev?.medium || 0}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="badge badge-low">Low</span>
              <span style={{ fontWeight: 700, fontSize: "16px" }}>{sev?.low || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Top Hosts, Most Triggered Rules, Data Source Health */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        {/* Top Affected Hosts */}
        <div className="card">
          <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "12px" }}>
            Top Targeted Hosts
          </h3>
          {metrics?.top_affected_hosts?.length ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {metrics.top_affected_hosts.map((h, i) => (
                <div
                  key={i}
                  onClick={() => onNavigate("entities")}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    background: "var(--bg-secondary)",
                    cursor: "pointer",
                    fontSize: "13px"
                  }}
                >
                  <span style={{ color: "var(--accent-cyan)", fontFamily: "monospace" }}>{h.host}</span>
                  <span style={{ fontWeight: 600 }}>{h.count} events</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>No host telemetry ingested yet.</div>
          )}
        </div>

        {/* Most Triggered Rules */}
        <div className="card">
          <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "12px" }}>
            Most Frequently Triggered Rules
          </h3>
          {metrics?.top_triggered_rules?.length ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {metrics.top_triggered_rules.map((r, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    background: "var(--bg-secondary)",
                    fontSize: "13px"
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{r.name}</span>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "monospace" }}>{r.rule_id}</span>
                  </div>
                  <span style={{ fontWeight: 700, color: "var(--sev-high)" }}>{r.count} alerts</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>No alert triggers recorded yet.</div>
          )}
        </div>
      </div>

      {/* Row 4: Data Source Health & Audit Activity */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        {/* Data Source Health */}
        <div className="card">
          <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "12px" }}>
            Data Source Telemetry Status
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {metrics?.data_source_health?.map((s) => (
              <div
                key={s.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  background: "var(--bg-secondary)",
                  fontSize: "13px"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Server size={14} color="var(--accent-cyan)" />
                  <span>{s.name}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{s.events_count} events</span>
                  <span style={{
                    fontSize: "11px",
                    color: s.status === "active" ? "var(--success)" : "var(--sev-medium)",
                    fontWeight: 600,
                    textTransform: "uppercase"
                  }}>
                    {s.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Audit Log */}
        <div className="card">
          <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "12px" }}>
            Recent Administrative Audit Trail
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {metrics?.recent_audit_activity?.map((a) => (
              <div
                key={a.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "12px",
                  padding: "6px 0",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.05)"
                }}
              >
                <div>
                  <span style={{ fontWeight: 600, color: "var(--accent-cyan)" }}>{a.username}</span>
                  <span style={{ color: "var(--text-secondary)", marginLeft: "8px" }}>{a.action}</span>
                </div>
                <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>
                  {new Date(a.created_at).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
