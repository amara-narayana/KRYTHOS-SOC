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
  Search,
  Activity
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

  const runPlaybook = async (id: string, name: string) => {
    setActivePlaybook(name);
    setExecuting(true);
    const ts = new Date().toLocaleTimeString();
    setExecutionLog([
      `[${ts}] [*] Initializing real-time execution of '${name}'...`,
      `[${ts}] [*] Target: ${targetEntity}`,
      `[${ts}] [*] Security Policy: Live Production Enforcement`
    ]);

    try {
      let res: any;
      if (id === "perimeter_block") {
        setExecutionLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] [+] Applying boundary firewall block...`]);
        res = await api.blockIP(targetEntity, "Manual analyst quarantine via Playbook");
        setExecutionLog((prev) => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] [+] Firewall Command: ${res.firewall_command || "N/A"}`,
          `[${new Date().toLocaleTimeString()}] [+] OS Status: ${res.os_status}`,
          res.stdout ? `[${new Date().toLocaleTimeString()}] [+] Output: ${res.stdout}` : "",
          res.stderr ? `[${new Date().toLocaleTimeString()}] [!] Notice: ${res.stderr}` : "",
          `[${new Date().toLocaleTimeString()}] [+] Threat Indicator Registered (IOC ID: #${res.ioc_id})`,
          `[${new Date().toLocaleTimeString()}] [✓] Action completed. Tamper-evident Audit Log #${res.audit_id} committed.`
        ].filter(Boolean));

      } else if (id === "host_isolate") {
        setExecutionLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] [+] Applying kernel network isolation policy...`]);
        res = await api.isolateHost(targetEntity, "Manual host isolation via Playbook");
        setExecutionLog((prev) => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] [+] Isolation Rule: ${res.isolation_command || "N/A"}`,
          `[${new Date().toLocaleTimeString()}] [+] OS Kernel Status: ${res.os_status}`,
          `[${new Date().toLocaleTimeString()}] [✓] Host containment policy active. Audit Log #${res.audit_id} committed.`
        ]);

      } else if (id === "cred_lockdown") {
        setExecutionLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] [+] Suspending user credentials and revoking active sessions...`]);
        res = await api.lockoutUser(targetEntity, "Suspended via Incident Response Playbook");
        setExecutionLog((prev) => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] [+] KRYTHOS Database User Suspended: ${res.db_account_suspended ? "YES" : "User not in web DB"}`,
          `[${new Date().toLocaleTimeString()}] [+] OS Status: ${res.os_account_status}`,
          res.os_command ? `[${new Date().toLocaleTimeString()}] [+] OS Command: ${res.os_command}` : "",
          `[${new Date().toLocaleTimeString()}] [✓] User revoked. Audit Log #${res.audit_id} committed.`
        ].filter(Boolean));

      } else if (id === "ioc_sweep") {
        setExecutionLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] [+] Scanning security event database against active IOCs...`]);
        res = await api.sweepIOCs();
        setExecutionLog((prev) => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] [+] Threat Indicators Evaluated: ${res.indicators_evaluated}`,
          `[${new Date().toLocaleTimeString()}] [+] Correlated Matches Found: ${res.matching_events_count}`,
          ...(res.matched_events.slice(0, 3).map((e: any) =>
            `[${new Date().toLocaleTimeString()}]  --> Matched Event ${e.event_id}: IP ${e.source_ip || e.destination_ip} (${e.action})`
          )),
          `[${new Date().toLocaleTimeString()}] [✓] Historical sweep completed. Audit Log #${res.audit_id} committed.`
        ]);
      }
    } catch (err: any) {
      setExecutionLog((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] [!] Execution Error: ${err.message || String(err)}`
      ]);
    } finally {
      setExecuting(false);
    }
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const generatedRuleId = `KRY-CUST-${Date.now().toString().slice(-4)}`;
      const payload = {
        rule_id: generatedRuleId,
        name: ruleName,
        description: `Custom production rule monitoring ${ruleCategory} thresholds.`,
        severity: ruleSeverity,
        confidence: 90,
        rule_type: "threshold",
        mitre_attack_id: ruleAttackId,
        mitre_tactic: "Custom Defense",
        mitre_technique: ruleAttackId,
        suppression_window_seconds: 300,
        logic_definition: {
          category: ruleCategory,
          outcome: "failure",
          threshold: parseInt(ruleThreshold),
          window_seconds: parseInt(ruleWindow) * 60
        }
      };

      await api.createRule(payload);
      setRuleSavedMsg(`Rule '${ruleName}' (${generatedRuleId}) compiled and registered into live detection engine.`);
      setTimeout(() => {
        setRuleSavedMsg(null);
        setShowRuleModal(false);
        setRuleName("");
      }, 2500);
    } catch (err: any) {
      alert(`Failed to save rule: ${err.message || String(err)}`);
    }
  };

  const playbooks = [
    {
      id: "perimeter_block",
      title: "Boundary Firewall Blacklist",
      desc: "Applies real-time boundary firewall drop rules (iptables / UFW / netsh) to block malicious IPs and registers indicators into Threat Intel store.",
      category: "Perimeter",
      icon: ShieldAlert,
      color: "#059669",
      targetHint: "Enter IP address (e.g. 198.51.100.42)",
      steps: [
        "Validate target IPv4 / IPv6 syntax and verify internal whitelists",
        "Execute kernel iptables / UFW firewall drop rule",
        "Register indicator into local Threat Intelligence IOC database",
        "Log tamper-evident audit record to forensic trail"
      ]
    },
    {
      id: "host_isolate",
      title: "Automated Host Isolation",
      desc: "Executes real kernel network containment rules dropping all external traffic while retaining administrative Web UI (8000) and SSH (22).",
      category: "Containment",
      icon: Network,
      color: "#ef4444",
      targetHint: "Enter host IP or hostname (e.g. 192.168.1.100)",
      steps: [
        "Setup dedicated KRYTHOS_ISOLATE network filter chain",
        "Permit loopback (lo) and administrative access on port 8000 & 22",
        "Drop all unauthorized inbound and outbound packets",
        "Record containment timestamp to forensic audit database"
      ]
    },
    {
      id: "cred_lockdown",
      title: "Compromised Account Lockdown",
      desc: "Instantly suspends user account privileges in KRYTHOS database, revokes active tokens, and executes OS user lockout.",
      category: "Identity",
      icon: Lock,
      color: "#f59e0b",
      targetHint: "Enter target username (e.g. jsmith or admin)",
      steps: [
        "Set user is_active=False in KRYTHOS database",
        "Invalidate active JWT sessions and authentication tokens",
        "Execute Linux OS account lock (passwd -l / usermod -L)",
        "Persist high-severity audit record for compliance verification"
      ]
    },
    {
      id: "ioc_sweep",
      title: "Retrospective IOC Sweep",
      desc: "Executes a live query across all ingested security events matching any active Threat Intelligence indicators.",
      category: "Forensics",
      icon: Search,
      color: "#0284c7",
      targetHint: "Applies across all indicators in database",
      steps: [
        "Retrieve all active threat indicators from local threat intel store",
        "Scan indexed source_ip, destination_ip, and username fields",
        "Correlate historical matches into incident evidence digest",
        "Report identified matches with instant forensic drilldown"
      ]
    }
  ];

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", paddingBottom: "40px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <Zap size={24} color="#059669" />
            <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#0f172a" }}>
              Incident Response Playbooks & Rules
            </h1>
          </div>
          <p style={{ color: "#64748b", fontSize: "14px" }}>
            Production-grade incident orchestration. Zero simulation — executes real OS firewall, account lockout, and IOC sweep actions.
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
              Target IP Address / Host / Username for Playbook Execution:
            </label>
            <input
              type="text"
              className="input-field"
              value={targetEntity}
              onChange={(e) => setTargetEntity(e.target.value)}
              placeholder="e.g. 192.168.1.100, kali, or bad_actor_ip"
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#059669", marginTop: "16px", fontWeight: 600 }}>
            <Activity size={16} color="#059669" className="animate-pulse" />
            <span>Operational Mode: LIVE PRODUCTION (Real System Enforcement)</span>
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
                  Orchestration Steps:
                </div>
                <ul style={{ fontSize: "12px", color: "#64748b", paddingLeft: "16px", margin: "0 0 20px 0", lineHeight: 1.6 }}>
                  {pb.steps.map((s, idx) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => runPlaybook(pb.id, pb.title)}
                disabled={executing}
                className="btn-primary"
                style={{ width: "100%", justifyContent: "center" }}
              >
                <Play size={14} />
                <span>Execute Playbook</span>
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
              <span style={{ fontWeight: 600, color: "#ffffff" }}>Playbook Live Execution Console — {activePlaybook}</span>
            </div>
            {executing && (
              <span style={{ fontSize: "11px", color: "#38bdf8", display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#38bdf8", animation: "ping 1s infinite" }} />
                Executing in real time...
              </span>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", lineHeight: 1.6 }}>
            {executionLog.map((log, idx) => (
              <div key={idx} style={{
                color: log.includes("[✓]") ? "#34d399" : log.includes("[*]") ? "#38bdf8" : log.includes("[!]") ? "#f87171" : "#cbd5e1"
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
              Add a deterministic sliding-window rule directly to the live detection engine.
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
