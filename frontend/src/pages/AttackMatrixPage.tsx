import React, { useEffect, useState } from "react";
import { Grid, Shield, ExternalLink, CheckCircle2 } from "lucide-react";
import { api } from "../services/api";
import { AttackTechnique } from "../types";

export const AttackMatrixPage: React.FC = () => {
  const [techniques, setTechniques] = useState<AttackTechnique[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadMatrix = async () => {
      setLoading(true);
      try {
        const data = await api.getAttackMatrix();
        setTechniques(data);
      } catch (e) {
        console.error("Failed to load ATT&CK matrix", e);
      } finally {
        setLoading(false);
      }
    };
    loadMatrix();
  }, []);

  // Standard MITRE Enterprise tactics
  const tactics = [
    "Credential Access",
    "Privilege Escalation",
    "Defense Evasion",
    "Command and Control",
    "Persistence",
    "Execution"
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Title */}
      <div>
        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)" }}>
          MITRE ATT&CK® Enterprise Coverage Matrix
        </h1>
        <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "2px" }}>
          Defensive detection coverage mapped directly to adversary tactics and techniques
        </p>
      </div>

      {/* Coverage Summary Banner */}
      <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
            Active Coverage Status
          </div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "#ffffff", marginTop: "4px" }}>
            {techniques.length} Techniques Mapped &bull; {techniques.reduce((acc, t) => acc + t.rules_count, 0)} Active Rules
          </div>
        </div>

        <div style={{ display: "flex", gap: "16px", fontSize: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "10px", height: "10px", borderRadius: "2px", background: "var(--accent-cyan)" }} />
            <span>Implemented & Tested</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "10px", height: "10px", borderRadius: "2px", background: "var(--border-color)" }} />
            <span>Planned Roadmap</span>
          </div>
        </div>
      </div>

      {/* Tactic Matrix Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "14px"
      }}>
        {tactics.map((tactic) => {
          const matched = techniques.filter(
            (t) => t.tactic.toLowerCase().includes(tactic.toLowerCase()) || tactic.toLowerCase().includes(t.tactic.toLowerCase())
          );

          return (
            <div
              key={tactic}
              className="card"
              style={{
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                background: "var(--bg-secondary)"
              }}
            >
              <div style={{
                fontSize: "13px",
                fontWeight: 700,
                color: "#ffffff",
                borderBottom: "1px solid var(--border-color)",
                paddingBottom: "8px"
              }}>
                {tactic}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {matched.length > 0 ? (
                  matched.map((tech) => (
                    <div
                      key={tech.technique_id}
                      style={{
                        padding: "10px",
                        borderRadius: "6px",
                        backgroundColor: "var(--bg-card)",
                        border: "1px solid var(--accent-cyan)",
                        boxShadow: "0 0 10px rgba(14, 165, 233, 0.1)"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontFamily: "monospace", fontSize: "11px", fontWeight: 700, color: "var(--accent-cyan)" }}>
                          {tech.technique_id}
                        </span>
                        <span className="badge badge-info" style={{ fontSize: "10px" }}>
                          {tech.rules_count} rule{tech.rules_count > 1 ? "s" : ""}
                        </span>
                      </div>
                      <div style={{ fontSize: "12px", fontWeight: 600, color: "#ffffff", marginTop: "4px" }}>
                        {tech.technique_name}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "10px", color: "var(--success)", marginTop: "6px" }}>
                        <CheckCircle2 size={12} />
                        <span>Verified in Test Lab</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px dashed var(--border-color)",
                    color: "var(--text-muted)",
                    fontSize: "11px",
                    textAlign: "center"
                  }}>
                    Planned Roadmap
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
