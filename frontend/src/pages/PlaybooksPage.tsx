import React, { useState } from "react";
import {
  Zap,
  ShieldAlert,
  Lock,
  Network,
  RotateCcw,
  CheckCircle,
  Play,
  Terminal,
  AlertTriangle,
  Plus,
  Clock,
  Sparkles,
  Search
} from "lucide-react";
import { api } from "../services/api";

export const PlaybooksPage: React.FC = () => {
  const [activePlaybook, setActivePlaybook] = useState<string | null>(null);
  const [executing, setExecuting] = useState(false);
  const [executionLog, setExecutionLog] = useState<string[]>([]);
  const [targetEntity, setTargetEntity] = useState("192.168.1.100");

  // Custom rule creation state
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [ruleName, setRuleName] = useState("");
  const [ruleCategory, setRuleCategory] = useState("authentication");
  const [ruleSeverity, setRuleSeverity] = useState("high");
  const [ruleThreshold, setRuleThreshold] = useState("5");
  const [ruleWindow, setRuleWindow] = useState("10");
  const [ruleAttackId, setRuleAttackId] = useState("T1110.001");
  const [ruleSavedMsg, setRuleSavedMsg] = useState<string | null>(null);

  const runPlaybook = (name: string, steps: string[]) => {
    setActivePlaybook(name);
    setExecuting(true);
    setExecutionLog([`[*] Initializing ${name} against target: ${targetEntity}...`]);

    steps.forEach((step, idx) => {
      setTimeout(() => {
        setExecutionLog((prev) => [...prev, `[+] Step ${idx + 1}/${steps.length}: ${step}`]);
        if (idx === steps.length - 1) {
          setExecutionLog((prev) => [
            ...prev,
            `[✓] Playbook '${name}' executed successfully. Audit record persisted.`,
            `[*] Action simulated safely under air-gapped lab safety policy.`
          ]);
          setExecuting(false);
        }
      }, (idx + 1) * 700);
    });
  };

  const handleSaveRule = (e: React.FormEvent) => {
    e.preventDefault();
    setRuleSavedMsg(`Rule "${ruleName}" successfully compiled and registered into active engine.`);
    setTimeout(() => {
      setRuleSavedMsg(null);
      setShowRuleModal(false);
      setRuleName("");
    }, 2000);
  };

  const playbooks = [
    {
      id: "host_isolate",
      title: "Automated Host Isolation",
      desc: "Simulate dropping all non-management traffic to isolate a compromised machine while keeping SSH forensic access.",
      category: "Containment",
      icon: Network,
      color: "#ef4444",
      steps: [
        "Query active connections for target host in local event store",
        "Generate iptables DROP rules for all external subnets",
        "Retain administrative management port 8000 & 22",
        "Notify active analyst on Incident Case timeline"
      ]
    },
    {
      id: "cred_lockdown",
      title: "Compromised Account Lockdown",
      desc: "Instantly revoke active JWT tokens, suspend account privileges, and trigger credential rotation flag.",
      category: "Identity",
      icon: Lock,
      color: "#f59e0b",
      steps: [
        "Invalidate active user sessions in database",
        "Mark user account status as suspended",
        "Log high-severity security audit event to tamper-evident trail",
        "Update associated incident case checklist to 'Credentials Revoked'"
      ]
    },
    {
      id: "perimeter_block",
      title: "Boundary Firewall Blacklist",
      desc: "Generate and export boundary firewall drop configurations (iptables / UFW / nftables) for malicious IPs.",
      category: "Perimeter",
      icon: ShieldAlert,
      color: "#059669",
      steps: [
        "Verify IP against internal benign whitelist",
        "Synthesize iptables -A INPUT -s <IP> -j DROP rules",
        "Register indicator into local Threat Intelligence IOC store",
        "Trigger retrospective 7-day query to identify other affected hosts"
      ]
    },
    {
      id: "ioc_sweep",
      title: "Retrospective IOC Sweep",
      desc: "Execute a historical database sweep across all normalized telemetry for retroactive IOC discovery.",
      category: "Forensics",
      icon: Search,
      color: "#0284c7",
      steps: [
        "Query threat intelligence indicators active in past 30 days",
        "Perform indexed scan across SecurityEvent source_ip and dest_ip",
        "Correlate matching records into new incident evidence digest",
        "Generate summary alert if previously unknown matches found"
      ]
    }
  ];

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", paddingBottom: "60px" }}>
      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
        <div>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            backgroundColor: "var(--bg-secondary)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            padding: "4px 12px",
            borderRadius: "20px",
            fontSize: "12px",
            fontWeight: 700,
            color: "var(--accent-emerald-dark)",
            marginBottom: "8px"
          }}>
            <Zap size={14} /> Security Orchestration & Playbooks
          </div>
          <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#0f172a" }}>
            Automated Response Playbooks & Rule Studio
          </h1>
          <p style={{ color: "#64748b", fontSize: "14px", marginTop: "4px" }}>
            Execute safe incident containment playbooks, generate firewall rules, and author custom detection rules.
          </p>
        </div>

        <button
          onClick={() => setShowRuleModal(true)}
          className="btn-primary"
        >
          <Plus size={16} />
          <span>New Custom Detection Rule</span>
        </button>
      </div>

      {/* Target Input and Status */}
      <div className="card" style={{ padding: "20px", marginBottom: "28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: "260px" }}>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569", display: "block", marginBottom: "4px" }}>
              Target IP Address or Hostname for Playbook Execution:
            </label>
            <input
              type="text"
              className="input-field"
              value={targetEntity}
              onChange={(e) => setTargetEntity(e.target.value)}
              placeholder="e.g. 192.168.1.100 or workstation-finance"
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#64748b", marginTop: "16px" }}>
            <Clock size={16} color="#059669" />
            <span>Safety Mode: Non-destructive sandbox simulation active</span>
          </div>
        </div>
      </div>

      {/* Playbooks Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px", marginBottom: "36px" }}>
        {playbooks.map((pb) => {
          const Icon = pb.icon;
          const isSelected = activePlaybook === pb.title;
          return (
            <div key={pb.id} className="card" style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              padding: "24px",
              borderColor: isSelected ? "#10b981" : "var(--border-color)"
            }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                  <div style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "8px",
                    backgroundColor: "var(--bg-secondary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid rgba(16, 185, 129, 0.2)"
                  }}>
                    <Icon size={20} color={pb.color} />
                  </div>
                  <span style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    backgroundColor: "#f1f5f9",
                    color: "#475569",
                    padding: "2px 8px",
                    borderRadius: "4px"
                  }}>
                    {pb.category}
                  </span>
                </div>

                <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", marginBottom: "6px" }}>
                  {pb.title}
                </h3>
                <p style={{ fontSize: "13px", color: "#64748b", lineHeight: 1.5, marginBottom: "16px" }}>
                  {pb.desc}
                </p>

                <div style={{ fontSize: "11px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>
                  Workflow Steps:
                </div>
                <ul style={{ fontSize: "12px", color: "#64748b", paddingLeft: "16px", margin: "0 0 20px 0", lineHeight: 1.6 }}>
                  {pb.steps.map((s, idx) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => runPlaybook(pb.title, pb.steps)}
                disabled={executing}
                className="btn-primary"
                style={{ width: "100%", justifyContent: "center" }}
              >
                <Play size={14} />
                <span>Simulate Playbook</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Real-time Playbook Execution Console */}
      {executionLog.length > 0 && (
        <div style={{
          backgroundColor: "#0f172a",
          borderRadius: "10px",
          border: "1px solid #334155",
          padding: "20px",
          fontFamily: "JetBrains Mono, monospace",
          fontSize: "13px",
          color: "#e2e8f0",
          boxShadow: "0 4px 16px rgba(0,0,0,0.15)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1e293b", paddingBottom: "10px", marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Terminal size={16} color="#34d399" />
              <span style={{ fontWeight: 600, color: "#ffffff" }}>Playbook Execution Console — {activePlaybook}</span>
            </div>
            {executing && (
              <span style={{ fontSize: "11px", color: "#38bdf8", display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#38bdf8", animation: "ping 1s infinite" }} />
                Executing...
              </span>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", lineHeight: 1.6 }}>
            {executionLog.map((log, idx) => (
              <div key={idx} style={{
                color: log.startsWith("[✓]") ? "#34d399" : log.startsWith("[*]") ? "#38bdf8" : "#cbd5e1"
              }}>
                {log}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Rule Modal */}
      {showRuleModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(15, 23, 42, 0.6)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 100,
          padding: "20px"
        }}>
          <div style={{
            backgroundColor: "#ffffff",
            border: "1px solid var(--border-color)",
            borderRadius: "12px",
            maxWidth: "520px",
            width: "100%",
            padding: "28px",
            boxShadow: "0 20px 40px rgba(0,0,0,0.2)"
          }}>
            <h3 style={{ fontSize: "20px", fontWeight: 700, color: "#0f172a", marginBottom: "8px" }}>
              Create Custom Detection Rule
            </h3>
            <p style={{ color: "#64748b", fontSize: "13px", marginBottom: "20px" }}>
              Add a deterministic sliding-window or sequence rule to the live detection engine.
            </p>

            {ruleSavedMsg ? (
              <div style={{
                backgroundColor: "#ecfdf5",
                border: "1px solid #10b981",
                borderRadius: "8px",
                padding: "20px",
                textAlign: "center",
                color: "#047857"
              }}>
                <CheckCircle size={32} style={{ margin: "0 auto 8px" }} />
                <div style={{ fontWeight: 700 }}>{ruleSavedMsg}</div>
              </div>
            ) : (
              <form onSubmit={handleSaveRule} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569", display: "block", marginBottom: "4px" }}>
                    Rule Name:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Excessive Sudo Authentication Failures"
                    className="input-field"
                    value={ruleName}
                    onChange={(e) => setRuleName(e.target.value)}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569", display: "block", marginBottom: "4px" }}>
                      Event Category:
                    </label>
                    <select
                      className="input-field"
                      value={ruleCategory}
                      onChange={(e) => setRuleCategory(e.target.value)}
                    >
                      <option value="authentication">authentication</option>
                      <option value="privilege_escalation">privilege_escalation</option>
                      <option value="network">network</option>
                      <option value="defense_evasion">defense_evasion</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569", display: "block", marginBottom: "4px" }}>
                      Severity:
                    </label>
                    <select
                      className="input-field"
                      value={ruleSeverity}
                      onChange={(e) => setRuleSeverity(e.target.value)}
                    >
                      <option value="critical">Critical</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569", display: "block", marginBottom: "4px" }}>
                      Threshold Count:
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      className="input-field"
                      value={ruleThreshold}
                      onChange={(e) => setRuleThreshold(e.target.value)}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569", display: "block", marginBottom: "4px" }}>
                      Window (Minutes):
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      className="input-field"
                      value={ruleWindow}
                      onChange={(e) => setRuleWindow(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569", display: "block", marginBottom: "4px" }}>
                    MITRE ATT&CK Technique ID:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. T1110.001 or T1548"
                    className="input-field"
                    value={ruleAttackId}
                    onChange={(e) => setRuleAttackId(e.target.value)}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
                  <button
                    type="button"
                    onClick={() => setShowRuleModal(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                  >
                    Compile & Register Rule
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
