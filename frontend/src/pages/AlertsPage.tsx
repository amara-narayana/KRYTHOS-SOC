import React, { useEffect, useState } from "react";
import {
  Bell,
  CheckCircle,
  AlertOctagon,
  Sparkles,
  Link,
  ChevronRight,
  X,
  Filter,
  UserCheck
} from "lucide-react";
import { api } from "../services/api";
import { Alert } from "../types";
import { useAuth } from "../context/AuthContext";

export const AlertsPage: React.FC = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);
  const [severityFilter, setSeverityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  // AI Assistant drawer
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Action state
  const [linkingCaseId, setLinkingCaseId] = useState("");

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await api.getAlerts({
        severity: severityFilter,
        status: statusFilter,
      });
      setAlerts(res.items);
    } catch (e) {
      console.error("Failed to fetch alerts", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [severityFilter, statusFilter]);

  const handleUpdateStatus = async (alertId: string, newStatus: string) => {
    try {
      const updated = await api.updateAlertStatus(alertId, newStatus, user?.username);
      setAlerts((prev) => prev.map((a) => (a.alert_id === alertId ? updated : a)));
      if (selectedAlert?.alert_id === alertId) {
        setSelectedAlert(updated);
      }
    } catch (e) {
      alert("Failed to update status");
    }
  };

  const handleLinkCase = async (alertId: string) => {
    if (!linkingCaseId.trim()) return;
    try {
      const updated = await api.updateAlertStatus(alertId, "investigating", user?.username, linkingCaseId.trim());
      setAlerts((prev) => prev.map((a) => (a.alert_id === alertId ? updated : a)));
      if (selectedAlert?.alert_id === alertId) setSelectedAlert(updated);
      setLinkingCaseId("");
    } catch (e) {
      alert("Failed to link case");
    }
  };

  const handleRequestAiAssist = async (alertId: string) => {
    setAiLoading(true);
    setAiAnalysis(null);
    try {
      const data = await api.getAlertAiAssist(alertId);
      setAiAnalysis(data);
    } catch (e) {
      console.error("AI Assist failed", e);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Title */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)" }}>
            Security Alert Queue
          </h1>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "2px" }}>
            Triage, investigate, and link evidence-backed security detections to incident cases
          </p>
        </div>

        {/* Filter chips */}
        <div style={{ display: "flex", gap: "8px" }}>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="input-field"
            style={{ fontSize: "12px", width: "130px" }}
          >
            <option value="">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field"
            style={{ fontSize: "12px", width: "140px" }}
          >
            <option value="">All Statuses</option>
            <option value="new">New</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="investigating">Investigating</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Main Alerts Table */}
      <div className="table-container">
        <table className="soc-table">
          <thead>
            <tr>
              <th>Alert ID</th>
              <th>Title</th>
              <th>Rule ID</th>
              <th>Severity</th>
              <th>Confidence</th>
              <th>Status</th>
              <th>Assigned</th>
              <th>Case</th>
              <th>Triggered (UTC)</th>
              <th style={{ textAlign: "right" }}>Triage</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} style={{ textAlign: "center", padding: "30px", color: "var(--text-muted)" }}>
                  Loading alerts...
                </td>
              </tr>
            ) : alerts.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign: "center", padding: "30px", color: "var(--text-muted)" }}>
                  No alerts in queue matching criteria.
                </td>
              </tr>
            ) : (
              alerts.map((alt) => (
                <tr
                  key={alt.alert_id}
                  onClick={() => setSelectedAlert(alt)}
                  style={{ cursor: "pointer" }}
                >
                  <td style={{ fontWeight: 600, color: "var(--accent-cyan)", fontFamily: "monospace" }}>
                    {alt.alert_id}
                  </td>
                  <td style={{ fontWeight: 600, maxWidth: "260px" }}>{alt.title}</td>
                  <td style={{ fontFamily: "monospace", fontSize: "11px", color: "var(--text-muted)" }}>
                    {alt.rule_id}
                  </td>
                  <td>
                    <span className={`badge badge-${alt.severity}`}>{alt.severity}</span>
                  </td>
                  <td style={{ fontSize: "12px" }}>{alt.confidence}%</td>
                  <td>
                    <span style={{
                      fontWeight: 600,
                      fontSize: "12px",
                      textTransform: "capitalize",
                      color: alt.status === "new" ? "var(--sev-high)" : alt.status === "investigating" ? "var(--accent-cyan)" : "var(--success)"
                    }}>
                      {alt.status}
                    </span>
                  </td>
                  <td style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                    {alt.assigned_to || "-"}
                  </td>
                  <td>
                    {alt.case_id ? (
                      <span style={{ color: "var(--accent-cyan)", fontFamily: "monospace", fontSize: "12px" }}>
                        {alt.case_id}
                      </span>
                    ) : (
                      <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>Unlinked</span>
                    )}
                  </td>
                  <td style={{ color: "var(--text-muted)", fontSize: "11px", fontFamily: "monospace" }}>
                    {new Date(alt.created_at).toISOString().replace("T", " ").slice(0, 19)}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      className="btn-secondary"
                      style={{ padding: "4px 8px", fontSize: "11px" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAlert(alt);
                      }}
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Selected Alert Details Drawer */}
      {selectedAlert && (
        <div style={{
          position: "fixed",
          right: 0,
          top: "60px",
          bottom: 0,
          width: "550px",
          backgroundColor: "var(--bg-card)",
          borderLeft: "1px solid var(--border-color)",
          zIndex: 60,
          padding: "24px",
          overflowY: "auto",
          boxShadow: "-8px 0 24px rgba(0,0,0,0.5)",
          display: "flex",
          flexDirection: "column",
          gap: "16px"
        }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid var(--border-color)", paddingBottom: "12px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span className={`badge badge-${selectedAlert.severity}`}>{selectedAlert.severity}</span>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "monospace" }}>
                  {selectedAlert.alert_id}
                </span>
              </div>
              <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#ffffff", marginTop: "6px" }}>
                {selectedAlert.title}
              </h2>
            </div>
            <button
              onClick={() => { setSelectedAlert(null); setAiAnalysis(null); }}
              style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Quick Triage Action Buttons */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              onClick={() => handleUpdateStatus(selectedAlert.alert_id, "acknowledged")}
              className="btn-secondary"
              style={{ fontSize: "12px", padding: "6px 12px" }}
            >
              <CheckCircle size={14} color="var(--accent-cyan)" />
              <span>Acknowledge</span>
            </button>

            <button
              onClick={() => handleUpdateStatus(selectedAlert.alert_id, "resolved")}
              className="btn-secondary"
              style={{ fontSize: "12px", padding: "6px 12px" }}
            >
              <UserCheck size={14} color="var(--success)" />
              <span>Resolve</span>
            </button>

            <button
              onClick={() => handleRequestAiAssist(selectedAlert.alert_id)}
              disabled={aiLoading}
              className="btn-primary"
              style={{ fontSize: "12px", padding: "6px 12px" }}
            >
              <Sparkles size={14} />
              <span>{aiLoading ? "Analyzing..." : "AI Assistant Triage"}</span>
            </button>
          </div>

          {/* Link to Case */}
          <div className="card" style={{ padding: "12px", background: "var(--bg-secondary)" }}>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "6px" }}>
              Link to Investigation Case:
            </span>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type="text"
                placeholder="e.g. CASE-2026-0001"
                value={linkingCaseId}
                onChange={(e) => setLinkingCaseId(e.target.value)}
                className="input-field"
                style={{ fontSize: "12px" }}
              />
              <button
                onClick={() => handleLinkCase(selectedAlert.alert_id)}
                className="btn-secondary"
                style={{ fontSize: "12px", whiteSpace: "nowrap" }}
              >
                <Link size={14} />
                <span>Link Case</span>
              </button>
            </div>
          </div>

          {/* AI Assistance Drawer Output */}
          {aiAnalysis && (
            <div className="card" style={{ padding: "16px", border: "1px solid var(--accent-cyan)", background: "rgba(14, 165, 233, 0.05)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                <Sparkles size={16} color="var(--accent-cyan)" />
                <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--accent-cyan)", textTransform: "uppercase" }}>
                  AI-Assisted Investigation Guidance
                </span>
                <span style={{ fontSize: "10px", color: "var(--text-muted)", marginLeft: "auto" }}>
                  Model: {aiAnalysis.model || "Local Provider"}
                </span>
              </div>

              {aiAnalysis.executive_summary && (
                <p style={{ fontSize: "13px", color: "#f8fafc", marginBottom: "10px", lineHeight: "1.5" }}>
                  {aiAnalysis.executive_summary}
                </p>
              )}

              {aiAnalysis.observed_facts && (
                <div style={{ marginBottom: "8px" }}>
                  <strong style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "uppercase" }}>Observed Facts:</strong>
                  <ul style={{ paddingLeft: "18px", fontSize: "12px", color: "#cbd5e1", marginTop: "4px" }}>
                    {aiAnalysis.observed_facts.map((fact: string, i: number) => (
                      <li key={i}>{fact}</li>
                    ))}
                  </ul>
                </div>
              )}

              {aiAnalysis.suggested_actions && (
                <div>
                  <strong style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "uppercase" }}>Recommended Next Steps:</strong>
                  <ul style={{ paddingLeft: "18px", fontSize: "12px", color: "var(--accent-cyan)", marginTop: "4px" }}>
                    {aiAnalysis.suggested_actions.map((act: string, i: number) => (
                      <li key={i}>{act}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Deterministic Explanation */}
          <div>
            <h4 style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "6px" }}>
              Detection Engine Explanation
            </h4>
            <div style={{
              backgroundColor: "var(--bg-primary)",
              border: "1px solid var(--border-color)",
              padding: "12px",
              borderRadius: "6px",
              fontSize: "13px",
              color: "#f8fafc",
              lineHeight: "1.5"
            }}>
              {selectedAlert.explanation}
            </div>
          </div>

          {/* Entities Involved */}
          <div>
            <h4 style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "6px" }}>
              Associated Entities
            </h4>
            <div style={{ backgroundColor: "var(--bg-primary)", padding: "10px", borderRadius: "6px", border: "1px solid var(--border-color)", fontSize: "12px" }}>
              {selectedAlert.entities?.users?.length ? (
                <div style={{ marginBottom: "4px" }}>
                  <strong style={{ color: "var(--text-secondary)" }}>Target Users:</strong>{" "}
                  {selectedAlert.entities.users.map((u) => (
                    <span key={u} className="badge badge-info" style={{ marginRight: "4px" }}>{u}</span>
                  ))}
                </div>
              ) : null}
              {selectedAlert.entities?.ips?.length ? (
                <div>
                  <strong style={{ color: "var(--text-secondary)" }}>Network IPs:</strong>{" "}
                  {selectedAlert.entities.ips.map((ip) => (
                    <span key={ip} className="badge badge-high" style={{ marginRight: "4px" }}>{ip}</span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          {/* Supporting Events References */}
          <div>
            <h4 style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "6px" }}>
              Supporting Evidence Events ({selectedAlert.supporting_event_ids?.length || 0})
            </h4>
            <div style={{ maxHeight: "150px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "4px" }}>
              {selectedAlert.supporting_event_ids?.map((id) => (
                <div
                  key={id}
                  style={{
                    padding: "6px 10px",
                    borderRadius: "4px",
                    background: "var(--bg-secondary)",
                    fontFamily: "monospace",
                    fontSize: "11px",
                    color: "var(--accent-cyan)"
                  }}
                >
                  {id}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
