import React, { useState } from "react";
import { Users, Server, Globe, Search, ShieldAlert, AlertTriangle, Activity } from "lucide-react";
import { api } from "../services/api";
import { EntitySummary } from "../types";

export const EntityPage: React.FC = () => {
  const [entityType, setEntityType] = useState<"user" | "host" | "ip">("user");
  const [entityValue, setEntityValue] = useState("");
  const [summary, setSummary] = useState<EntitySummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entityValue.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await api.getEntitySummary(entityType, entityValue.trim());
      setSummary(res);
    } catch (e) {
      console.error("Entity search failed", e);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Title */}
      <div>
        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)" }}>
          Entity Analytics & Risk Scoring
        </h1>
        <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "2px" }}>
          Correlate historical telemetry, evaluate explainable risk scores, and view threat intelligence matches
        </p>
      </div>

      {/* Search Bar */}
      <div className="card" style={{ padding: "16px" }}>
        <form onSubmit={handleSearch} style={{ display: "flex", gap: "10px" }}>
          <select
            value={entityType}
            onChange={(e) => setEntityType(e.target.value as any)}
            className="input-field"
            style={{ width: "160px" }}
          >
            <option value="user">User Account</option>
            <option value="host">Host / Asset</option>
            <option value="ip">IP Address</option>
          </select>

          <div style={{ position: "relative", flex: 1 }}>
            <input
              type="text"
              placeholder={
                entityType === "user" ? "Enter username (e.g. admin_svc, operator)..." :
                entityType === "host" ? "Enter hostname (e.g. auth-primary-01)..." :
                "Enter IP address (e.g. 198.51.100.42)..."
              }
              value={entityValue}
              onChange={(e) => setEntityValue(e.target.value)}
              className="input-field"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary" style={{ padding: "8px 24px" }}>
            <Search size={16} />
            <span>{loading ? "Searching..." : "Lookup Entity"}</span>
          </button>
        </form>
      </div>

      {/* Results Display */}
      {summary ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Header Card with Risk Gauge */}
          <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {entityType === "user" ? <Users size={20} color="var(--accent-cyan)" /> :
                 entityType === "host" ? <Server size={20} color="var(--accent-cyan)" /> :
                 <Globe size={20} color="var(--accent-cyan)" />}
                <span style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
                  {summary.entity_type} Profile
                </span>
              </div>
              <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#ffffff", marginTop: "4px", fontFamily: "monospace" }}>
                {summary.entity_value}
              </h2>
              <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>
                First Seen: {summary.first_seen ? new Date(summary.first_seen).toUTCString() : "Never"} &bull; Last Seen: {summary.last_seen ? new Date(summary.last_seen).toUTCString() : "Never"}
              </div>
            </div>

            {/* Risk Score Pill */}
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
                Calculated Risk Score
              </div>
              <div style={{
                fontSize: "36px",
                fontWeight: 800,
                color: summary.risk_score >= 70 ? "var(--sev-critical)" : summary.risk_score >= 40 ? "var(--sev-medium)" : "var(--success)"
              }}>
                {summary.risk_score} <span style={{ fontSize: "14px", color: "var(--text-muted)" }}>/ 100</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
            <div className="metric-card">
              <span style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase" }}>Total Events Observed</span>
              <div style={{ fontSize: "24px", fontWeight: 700, margin: "8px 0", color: "#ffffff" }}>
                {summary.events_count}
              </div>
            </div>
            <div className="metric-card">
              <span style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase" }}>Associated Alerts</span>
              <div style={{ fontSize: "24px", fontWeight: 700, margin: "8px 0", color: summary.alerts_count > 0 ? "var(--sev-high)" : "#ffffff" }}>
                {summary.alerts_count}
              </div>
            </div>
            <div className="metric-card">
              <span style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase" }}>Threat Intel Matches</span>
              <div style={{ fontSize: "24px", fontWeight: 700, margin: "8px 0", color: summary.threat_intel_matches.length > 0 ? "var(--sev-critical)" : "#ffffff" }}>
                {summary.threat_intel_matches.length}
              </div>
            </div>
          </div>

          {/* Threat Intel Matches Banner if any */}
          {summary.threat_intel_matches.length > 0 && (
            <div className="card" style={{ borderColor: "var(--sev-critical)", background: "rgba(239, 68, 68, 0.08)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--sev-critical)", fontWeight: 700, marginBottom: "8px" }}>
                <AlertTriangle size={18} />
                <span>CONFIRMED THREAT INTELLIGENCE MATCH</span>
              </div>
              {summary.threat_intel_matches.map((match, i) => (
                <div key={i} style={{ fontSize: "13px", color: "#fecaca" }}>
                  Indicator matched classified as <strong>'{match.threat_type}'</strong> with {match.confidence}% confidence (Source: {match.provenance}).
                </div>
              ))}
            </div>
          )}

          {/* Recent Events Table */}
          <div className="card">
            <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "12px" }}>
              Recent Security Events for {summary.entity_value}
            </h3>
            <div className="table-container">
              <table className="soc-table">
                <thead>
                  <tr>
                    <th>Timestamp (UTC)</th>
                    <th>Action</th>
                    <th>Outcome</th>
                    <th>Severity</th>
                    <th>Host</th>
                    <th>Source IP</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.recent_events.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)" }}>No events observed.</td></tr>
                  ) : (
                    summary.recent_events.map((e, idx) => (
                      <tr key={idx}>
                        <td style={{ fontFamily: "monospace", fontSize: "12px" }}>{e.timestamp.slice(0, 19).replace("T", " ")}</td>
                        <td style={{ fontFamily: "monospace" }}>{e.action}</td>
                        <td style={{ fontWeight: 600, color: e.outcome === "success" ? "var(--success)" : "var(--sev-critical)" }}>{e.outcome}</td>
                        <td><span className={`badge badge-${e.severity}`}>{e.severity}</span></td>
                        <td>{e.host || "-"}</td>
                        <td style={{ fontFamily: "monospace" }}>{e.source_ip || "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : searched && !loading ? (
        <div className="card" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
          No records or activity found for "{entityValue}".
        </div>
      ) : null}
    </div>
  );
};
