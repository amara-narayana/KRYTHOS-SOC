import React, { useState } from "react";
import {
  HelpCircle,
  Terminal,
  ShieldCheck,
  Cpu,
  BookOpen,
  AlertTriangle,
  Database,
  ExternalLink,
  Copy,
  Check
} from "lucide-react";

export const HelpPage: React.FC = () => {
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const copyToClipboard = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(cmd);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const cliCommands = [
    {
      group: "System & Core",
      commands: [
        { cmd: "krythos status", desc: "Check system health, database counts, and status" },
        { cmd: "krythos status --json", desc: "Machine-readable status output for automation" },
        { cmd: "krythos health", desc: "Test backend API connectivity and component readiness" },
        { cmd: "krythos setup --username admin --email admin@krythos.local", desc: "Bootstrap the first administrator account" },
      ]
    },
    {
      group: "Event Ingestion & Search",
      commands: [
        { cmd: "krythos ingest /path/to/events.json", desc: "Ingest and normalize JSON event array" },
        { cmd: "krythos ingest /path/to/events.jsonl", desc: "Stream-ingest newline-delimited JSON log records" },
        { cmd: "krythos ingest /path/to/auth.log --source-type linux_auth", desc: "Ingest Linux syslog/auth log" },
        { cmd: "krythos events search --category authentication --limit 20", desc: "Search normalized events via CLI" },
        { cmd: "krythos events show <EVENT_UUID>", desc: "Inspect normalized and raw payload of an event" },
      ]
    },
    {
      group: "Detection & Alerts",
      commands: [
        { cmd: "krythos rules list", desc: "List all registered detection rules and statuses" },
        { cmd: "krythos rules validate", desc: "Validate syntax and field constraints of all rules" },
        { cmd: "krythos detect run", desc: "Execute detection engine against unanalyzed events" },
        { cmd: "krythos alerts list --status new", desc: "List newly triggered alerts requiring triage" },
        { cmd: "krythos alerts show <ALERT_UUID>", desc: "View alert details, evidence events, and MITRE mapping" },
      ]
    },
    {
      group: "Cases & Incident Response",
      commands: [
        { cmd: "krythos cases list", desc: "List active investigation cases and priorities" },
        { cmd: "krythos cases create --title \"Brute Force Investigation\" --priority high", desc: "Create new incident case" },
        { cmd: "krythos cases show <CASE_UUID>", desc: "Inspect case timeline, findings, and linked evidence" },
        { cmd: "krythos report export --case-id <CASE_UUID> --format html", desc: "Generate standalone HTML incident report" },
      ]
    },
    {
      group: "Threat Intelligence & Maintenance",
      commands: [
        { cmd: "krythos ioc import /path/to/indicators.csv", desc: "Import local IP, domain, and hash IOCs" },
        { cmd: "krythos db check", desc: "Verify SQLite database integrity and WAL file status" },
        { cmd: "krythos db backup", desc: "Generate safe point-in-time database snapshot" },
      ]
    }
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "1200px" }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "10px" }}>
          <HelpCircle size={28} color="var(--accent-cyan)" />
          KRYTHOS Documentation & Operational Guide
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "4px" }}>
          Every Signal Connected. Every Threat Investigated. Local-first defensive SIEM platform.
        </p>
      </div>

      {/* Getting Started Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
        <div style={{
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border-color)",
          borderRadius: "8px",
          padding: "20px"
        }}>
          <h2 style={{ fontSize: "16px", fontWeight: 600, color: "var(--accent-cyan)", display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <BookOpen size={18} /> 1. Standard SOC Workflow
          </h2>
          <ol style={{ color: "var(--text-secondary)", fontSize: "13px", lineHeight: 1.7, paddingLeft: "18px", margin: 0 }}>
            <li><strong style={{ color: "var(--text-primary)" }}>Ingest Logs:</strong> Upload JSON, CSV, or Linux auth logs via GUI or <code>krythos ingest</code>.</li>
            <li><strong style={{ color: "var(--text-primary)" }}>Run Detections:</strong> Rule engine automatically analyzes new records or trigger via <code>krythos detect run</code>.</li>
            <li><strong style={{ color: "var(--text-primary)" }}>Triage Alerts:</strong> Review triggered alerts in <em>Alert Queue</em>, acknowledge, assign, or escalate.</li>
            <li><strong style={{ color: "var(--text-primary)" }}>Investigate Cases:</strong> Correlate evidence, log analyst notes, track checklist items in <em>Investigation Workbench</em>.</li>
            <li><strong style={{ color: "var(--text-primary)" }}>Generate Reports:</strong> Export cryptographically hashed, evidence-backed HTML reports.</li>
          </ol>
        </div>

        <div style={{
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border-color)",
          borderRadius: "8px",
          padding: "20px"
        }}>
          <h2 style={{ fontSize: "16px", fontWeight: 600, color: "var(--accent-cyan)", display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <ShieldCheck size={18} /> 2. Security & Local Privacy
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "13px", lineHeight: 1.6, margin: "0 0 10px 0" }}>
            KRYTHOS SOC is strictly engineered for local-first zero-cloud execution:
          </p>
          <ul style={{ color: "var(--text-secondary)", fontSize: "13px", lineHeight: 1.7, paddingLeft: "18px", margin: 0 }}>
            <li>No telemetry, logs, or indicators leave your machine.</li>
            <li>Passwords hashed using memory-hard <strong style={{ color: "var(--text-primary)" }}>Argon2id</strong>.</li>
            <li>Safe parameterized queries prevent SQL injection.</li>
            <li>Log payloads are sanitized and safe-rendered to prevent HTML/XSS injection.</li>
          </ul>
        </div>

        <div style={{
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border-color)",
          borderRadius: "8px",
          padding: "20px"
        }}>
          <h2 style={{ fontSize: "16px", fontWeight: 600, color: "var(--accent-cyan)", display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <Cpu size={18} /> 3. Local AI Integration
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "13px", lineHeight: 1.6, margin: "0 0 10px 0" }}>
            KRYTHOS includes an optional interface for offline LLMs (e.g., Ollama running Mistral or Llama3):
          </p>
          <ul style={{ color: "var(--text-secondary)", fontSize: "13px", lineHeight: 1.7, paddingLeft: "18px", margin: 0 }}>
            <li>Start Ollama locally: <code>ollama run mistral</code></li>
            <li>Configure endpoint in <em>Administration &rarr; System Settings</em> (default: <code>http://127.0.0.1:11434</code>).</li>
            <li>Assists with incident summaries and triage hypothesis generation.</li>
            <li>Always transparently tagged as <em>[AI-Assisted]</em>.</li>
          </ul>
        </div>
      </div>

      {/* CLI Reference Table */}
      <div style={{
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border-color)",
        borderRadius: "8px",
        padding: "20px"
      }}>
        <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
          <Terminal size={20} color="var(--accent-cyan)" />
          CLI Command Reference (<code>krythos</code>)
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {cliCommands.map((grp) => (
            <div key={grp.group}>
              <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--accent-cyan)", marginBottom: "8px" }}>
                {grp.group}
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {grp.commands.map((c) => (
                  <div
                    key={c.cmd}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      backgroundColor: "var(--bg-primary)",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: "1px solid var(--border-color)",
                      fontFamily: "monospace",
                      fontSize: "12px"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                      <span style={{ color: "var(--accent-cyan)", fontWeight: 600 }}>{c.cmd}</span>
                      <span style={{ color: "var(--text-muted)", fontFamily: "sans-serif" }}>&mdash; {c.desc}</span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(c.cmd)}
                      style={{
                        background: "none",
                        border: "none",
                        color: copiedCmd === c.cmd ? "var(--status-low)" : "var(--text-muted)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        padding: "4px"
                      }}
                      title="Copy command"
                    >
                      {copiedCmd === c.cmd ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Troubleshooting Section */}
      <div style={{
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border-color)",
        borderRadius: "8px",
        padding: "20px"
      }}>
        <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
          <AlertTriangle size={20} color="var(--status-medium)" />
          Troubleshooting & FAQs
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "14px", fontSize: "13px" }}>
          <div>
            <strong style={{ color: "var(--text-primary)" }}>Q: Backend port 8000 is already in use?</strong>
            <p style={{ color: "var(--text-secondary)", margin: "4px 0 0 0" }}>
              Run <code>scripts/healthcheck.sh</code> or set <code>KRYTHOS_PORT=8080</code> in your <code>.env</code> file.
            </p>
          </div>
          <div>
            <strong style={{ color: "var(--text-primary)" }}>Q: How do I recover admin access?</strong>
            <p style={{ color: "var(--text-secondary)", margin: "4px 0 0 0" }}>
              Run <code>krythos user create --username admin2 --email admin2@krythos.local --role Administrator</code> in your terminal. Direct CLI execution uses local database access without needing web credentials.
            </p>
          </div>
          <div>
            <strong style={{ color: "var(--text-primary)" }}>Q: Database file locked or WAL corruption?</strong>
            <p style={{ color: "var(--text-secondary)", margin: "4px 0 0 0" }}>
              Run <code>krythos db check</code>. KRYTHOS uses SQLite WAL mode to support simultaneous multi-reader and single-writer concurrency with zero locking contention.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
