import React, { useEffect, useState } from "react";
import { FileText, Download, ExternalLink, Shield, CheckCircle } from "lucide-react";
import { api } from "../services/api";

export const ReportsPage: React.FC = () => {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadReport = async () => {
      setLoading(true);
      try {
        const data = await api.getExecutiveReport();
        setSummary(data);
      } catch (e) {
        console.error("Failed to load report summary", e);
      } finally {
        setLoading(false);
      }
    };
    loadReport();
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Title */}
      <div>
        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)" }}>
          Reports & Evidence Documentation
        </h1>
        <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "2px" }}>
          Generate evidence-backed executive summaries, case post-mortems, and regulatory exports
        </p>
      </div>

      {/* Summary Card */}
      {summary && (
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid var(--border-color)", paddingBottom: "12px" }}>
            <div>
              <span className="badge badge-info" style={{ marginBottom: "6px" }}>Executive Telemetry</span>
              <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#ffffff" }}>
                {summary.report_title}
              </h2>
              <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                Generated: {new Date(summary.generated_at).toUTCString()}
              </div>
            </div>

            <button
              onClick={() => window.print()}
              className="btn-secondary"
              style={{ fontSize: "12px", gap: "6px" }}
            >
              <Download size={14} />
              <span>Print / Export PDF</span>
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
            <div className="card" style={{ background: "var(--bg-secondary)" }}>
              <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>Total Events</span>
              <div style={{ fontSize: "22px", fontWeight: 700, color: "#ffffff", marginTop: "4px" }}>
                {summary.total_events}
              </div>
            </div>
            <div className="card" style={{ background: "var(--bg-secondary)" }}>
              <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>Total Alerts</span>
              <div style={{ fontSize: "22px", fontWeight: 700, color: "#ffffff", marginTop: "4px" }}>
                {summary.total_alerts}
              </div>
            </div>
            <div className="card" style={{ background: "var(--bg-secondary)" }}>
              <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>Total Incidents</span>
              <div style={{ fontSize: "22px", fontWeight: 700, color: "#ffffff", marginTop: "4px" }}>
                {summary.total_cases}
              </div>
            </div>
            <div className="card" style={{ background: "var(--bg-secondary)" }}>
              <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>Active Rules</span>
              <div style={{ fontSize: "22px", fontWeight: 700, color: "var(--accent-cyan)", marginTop: "4px" }}>
                {summary.active_rules}
              </div>
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: "8px" }}>
              Alert Distribution by Severity
            </h3>
            <div style={{ display: "flex", gap: "12px" }}>
              {Object.entries(summary.alerts_by_severity || {}).map(([sev, count]) => (
                <div key={sev} style={{ padding: "8px 14px", borderRadius: "6px", background: "var(--bg-secondary)", fontSize: "13px" }}>
                  <span style={{ textTransform: "capitalize", color: "var(--text-muted)", marginRight: "8px" }}>{sev}:</span>
                  <strong style={{ color: "#ffffff" }}>{count as number}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Available Export Templates */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <div className="card">
          <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "6px" }}>
            Case Investigation Reports
          </h3>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "14px" }}>
            HTML formatted case reports including timeline notes, attached evidence hashes, and containment summaries.
          </p>
          <div style={{ fontSize: "12px", color: "var(--accent-cyan)" }}>
            Available directly within the <strong>Investigation Workbench</strong> for each case.
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "6px" }}>
            Audit History Export
          </h3>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "14px" }}>
            Compliance log of administrative actions, user role modifications, and detection rule state changes.
          </p>
          <div style={{ fontSize: "12px", color: "var(--accent-cyan)" }}>
            Accessible under the <strong>Administration</strong> tab for authorized Administrators.
          </div>
        </div>
      </div>
    </div>
  );
};
