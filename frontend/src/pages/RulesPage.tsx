import React, { useEffect, useState } from "react";
import { ShieldAlert, Play, CheckCircle, XCircle, Code, ChevronDown, ChevronUp } from "lucide-react";
import { api } from "../services/api";
import { DetectionRule } from "../types";
import { useAuth } from "../context/AuthContext";

export const RulesPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "Administrator";
  const [rules, setRules] = useState<DetectionRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedRule, setExpandedRule] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<string | null>(null);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const res = await api.getRules();
      setRules(res);
    } catch (e) {
      console.error("Failed to load rules", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleToggleRule = async (rule: DetectionRule) => {
    if (!isAdmin) return;
    try {
      const updated = await api.updateRule(rule.rule_id, { enabled: !rule.enabled });
      setRules((prev) => prev.map((r) => (r.rule_id === rule.rule_id ? updated : r)));
    } catch (e) {
      alert("Failed to toggle rule");
    }
  };

  const handleRunDetections = async () => {
    setRunning(true);
    setRunResult(null);
    try {
      const res = await api.runDetections(1000);
      setRunResult(`Evaluated ${res.evaluated_events} events. Generated ${res.alerts_generated} new alerts.`);
      fetchRules();
    } catch (e) {
      setRunResult("Detection evaluation failed.");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Title & Test Action */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)" }}>
            Deterministic Detection Rules
          </h1>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "2px" }}>
            Sliding window thresholds, sequence correlations, and MITRE ATT&CK enterprise alignments
          </p>
        </div>

        <button
          onClick={handleRunDetections}
          disabled={running}
          className="btn-primary"
          style={{ fontSize: "13px" }}
        >
          <Play size={14} className={running ? "animate-spin" : ""} />
          <span>{running ? "Evaluating..." : "Run Detection Engine Now"}</span>
        </button>
      </div>

      {runResult && (
        <div style={{
          backgroundColor: "rgba(14, 165, 233, 0.15)",
          border: "1px solid var(--accent-cyan)",
          color: "#e0f2fe",
          padding: "10px 14px",
          borderRadius: "6px",
          fontSize: "13px"
        }}>
          {runResult}
        </div>
      )}

      {/* Rules Table */}
      <div className="table-container">
        <table className="soc-table">
          <thead>
            <tr>
              <th>Rule ID</th>
              <th>Rule Name & Description</th>
              <th>Type</th>
              <th>Severity</th>
              <th>Confidence</th>
              <th>MITRE ATT&CK</th>
              <th>Last Triggered</th>
              <th>State</th>
              <th style={{ textAlign: "right" }}>Inspect</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} style={{ textAlign: "center", padding: "30px", color: "var(--text-muted)" }}>
                  Loading detection rules...
                </td>
              </tr>
            ) : (
              rules.map((rule) => {
                const isExpanded = expandedRule === rule.rule_id;
                return (
                  <React.Fragment key={rule.rule_id}>
                    <tr>
                      <td style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--accent-cyan)" }}>
                        {rule.rule_id}
                      </td>
                      <td style={{ maxWidth: "300px" }}>
                        <div style={{ fontWeight: 600, color: "#ffffff" }}>{rule.name}</div>
                        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                          {rule.description}
                        </div>
                      </td>
                      <td style={{ textTransform: "capitalize", fontSize: "12px", color: "var(--text-secondary)" }}>
                        {rule.rule_type.replace("_", " ")}
                      </td>
                      <td>
                        <span className={`badge badge-${rule.severity}`}>{rule.severity}</span>
                      </td>
                      <td style={{ fontSize: "12px" }}>{rule.confidence}%</td>
                      <td>
                        {rule.mitre_attack_id ? (
                          <div>
                            <span className="badge badge-info">{rule.mitre_attack_id}</span>
                            <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>
                              {rule.mitre_tactic}
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>-</span>
                        )}
                      </td>
                      <td style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                        {rule.last_triggered_at
                          ? new Date(rule.last_triggered_at).toLocaleString()
                          : "Never"}
                      </td>
                      <td>
                        <button
                          onClick={() => handleToggleRule(rule)}
                          disabled={!isAdmin}
                          title={isAdmin ? "Toggle rule state" : "Administrator role required to toggle"}
                          style={{
                            background: "transparent",
                            border: "none",
                            cursor: isAdmin ? "pointer" : "default",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            fontSize: "12px",
                            fontWeight: 600,
                            color: rule.enabled ? "var(--success)" : "var(--text-muted)"
                          }}
                        >
                          {rule.enabled ? <CheckCircle size={16} /> : <XCircle size={16} />}
                          <span>{rule.enabled ? "Enabled" : "Disabled"}</span>
                        </button>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          onClick={() => setExpandedRule(isExpanded ? null : rule.rule_id)}
                          style={{
                            background: "transparent",
                            border: "1px solid var(--border-color)",
                            borderRadius: "4px",
                            color: "var(--text-secondary)",
                            padding: "4px 8px",
                            cursor: "pointer"
                          }}
                        >
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      </td>
                    </tr>

                    {/* Logic Definition Expansion Row */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={9} style={{ backgroundColor: "var(--bg-primary)", padding: "16px" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                              <strong style={{ color: "var(--accent-cyan)" }}>Rule Logic Specification (JSON):</strong>
                              <span style={{ color: "var(--text-muted)" }}>
                                Suppression Window: {rule.suppression_window_seconds}s
                              </span>
                            </div>
                            <pre style={{
                              background: "var(--bg-secondary)",
                              padding: "12px",
                              borderRadius: "6px",
                              border: "1px solid var(--border-color)",
                              fontSize: "12px",
                              color: "#f8fafc",
                              overflowX: "auto"
                            }}>
                              {JSON.stringify(rule.logic_definition, null, 2)}
                            </pre>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
