import React, { useState, useEffect } from "react";
import {
  Shield,
  Zap,
  Lock,
  Terminal,
  Activity,
  Layers,
  FileCheck,
  CheckCircle,
  ArrowRight,
  Database,
  Cpu,
  BarChart3,
  Server,
  CreditCard,
  Copy,
  Check,
  Sun,
  Moon,
  Radar,
  Radio,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
  Eye,
  Crosshair,
  TrendingUp,
  Sliders,
  ChevronRight
} from "lucide-react";
import { NavItem } from "../components/Sidebar";
import { useTheme } from "../context/ThemeContext";

interface LandingPageProps {
  onNavigate: (tab: NavItem) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const { theme, toggleTheme } = useTheme();
  const [logVolume, setLogVolume] = useState<number>(30); // GB per day
  const [copied, setCopied] = useState(false);

  // Interactive Radar state
  const [selectedThreatNode, setSelectedThreatNode] = useState<{
    id: string;
    title: string;
    ip: string;
    technique: string;
    severity: string;
    action: string;
  }>({
    id: "NODE-1",
    title: "SSH Credential Guessing",
    ip: "198.51.100.42",
    technique: "T1110.001 (Password Guessing)",
    severity: "High",
    action: "iptables -I INPUT 1 -s 198.51.100.42 -j DROP"
  });

  // Interactive Attack Simulation Sandbox state
  const [activeSimulation, setActiveSimulation] = useState<"brute_force" | "priv_esc" | "c2_beacon">("brute_force");
  const [simulationStep, setSimulationStep] = useState<number>(3);
  const [simulating, setSimulating] = useState(false);

  // Interactive Architecture Tab state
  const [activeArchStage, setActiveArchStage] = useState<number>(0);

  // Interactive Terminal Tab
  const [activeTermTab, setActiveTermTab] = useState<"stream" | "rules" | "cases">("stream");

  const calculateCloudCost = (gb: number) => gb * 30 * 2.8; // ~$2.80 per GB typical cloud SIEM
  const cloudCostMonthly = calculateCloudCost(logVolume);
  const annualSavings = cloudCostMonthly * 12;

  const handleCopyCmd = () => {
    navigator.clipboard.writeText("git clone https://github.com/amara-narayana/KRYTHOS-SOC.git && cd KRYTHOS-SOC && sudo bash scripts/install_service.sh");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const runInteractiveSimulation = (type: "brute_force" | "priv_esc" | "c2_beacon") => {
    setActiveSimulation(type);
    setSimulating(true);
    setSimulationStep(1);

    setTimeout(() => setSimulationStep(2), 600);
    setTimeout(() => {
      setSimulationStep(3);
      setSimulating(false);
    }, 1400);
  };

  const threatNodes = [
    {
      id: "NODE-1",
      title: "SSH Credential Guessing",
      ip: "198.51.100.42",
      technique: "T1110.001 (Password Guessing)",
      severity: "High",
      action: "iptables -I INPUT 1 -s 198.51.100.42 -j DROP",
      x: 75,
      y: 35
    },
    {
      id: "NODE-2",
      title: "Sudo Privilege Escalation",
      ip: "10.0.2.15",
      technique: "T1548.003 (Sudo Caching)",
      severity: "Critical",
      action: "passwd -l target_user",
      x: 30,
      y: 65
    },
    {
      id: "NODE-3",
      title: "Malicious Threat Intel Beacon",
      ip: "203.0.113.88",
      technique: "T1071.001 (Web Protocols)",
      severity: "Critical",
      action: "Retrospective IOC Sweep & Quarantine",
      x: 65,
      y: 80
    }
  ];

  const archStages = [
    {
      title: "Kernel Telemetry Ingestion",
      tech: "systemd-journald / syslog",
      latency: "< 0.4ms",
      desc: "Captures raw OS security streams including authentication, sudo command execution, SSH sessions, and login failures directly from the Linux kernel without agents.",
      metric: "10,000+ EPS throughput",
      color: "#10b981"
    },
    {
      title: "Zero-Allocation Normalizer",
      tech: "High-Performance Parsing Engine",
      latency: "< 0.2ms",
      desc: "Normalizes raw text streams into structured ECS/KRYTHOS security models with deterministic field extraction (Host, User, Source IP, Process, Action, Outcome).",
      metric: "100% JSON/Syslog schema coverage",
      color: "#059669"
    },
    {
      title: "Deterministic Rule Matrix",
      tech: "Sliding-Window Correlation Engine",
      latency: "< 0.5ms",
      desc: "Evaluates multi-event threshold windows, stateful attack sequences, password spraying detectors, and active Threat Intelligence IOC matching without black-box hallucinations.",
      metric: "Zero False Positives / MITRE Mapped",
      color: "#34d399"
    },
    {
      title: "Live SSE Push & Containment",
      tech: "PubSub Event Bus & Kernel Netfilter",
      latency: "Real-Time (< 1ms)",
      desc: "Pushes live events and alert broadcasts to connected analysts over Server-Sent Events (SSE) while executing real kernel firewall drops (`iptables DROP`) and account suspensions.",
      metric: "100% Local-First / Zero Cloud Egress",
      color: "#10b981"
    }
  ];

  return (
    <div style={{ maxWidth: "1320px", margin: "0 auto", paddingBottom: "80px" }}>
      {/* Hero Section with Cybernetic Glow */}
      <section style={{
        textAlign: "center",
        padding: "60px 24px 50px",
        background: theme === "dark"
          ? "radial-gradient(ellipse at top, rgba(16, 185, 129, 0.15) 0%, #090d16 70%)"
          : "radial-gradient(ellipse at top, #ecfdf5 0%, #ffffff 70%)",
        borderRadius: "20px",
        border: "1px solid var(--border-color)",
        marginBottom: "48px",
        position: "relative",
        overflow: "hidden",
        boxShadow: theme === "dark" ? "0 20px 60px rgba(0,0,0,0.6)" : "0 10px 40px rgba(0,0,0,0.03)"
      }}>
        {/* Background Cyber Grid Accent */}
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: theme === "dark"
            ? "radial-gradient(rgba(16, 185, 129, 0.1) 1px, transparent 1px)"
            : "radial-gradient(rgba(16, 185, 129, 0.15) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          pointerEvents: "none",
          opacity: 0.6
        }} />

        {/* Top Controls: Badge & Theme Switcher */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "12px", marginBottom: "24px", flexWrap: "wrap", position: "relative", zIndex: 2 }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border-color)",
            padding: "6px 16px",
            borderRadius: "30px",
            fontSize: "12px",
            fontWeight: 600,
            color: "var(--accent-emerald)",
            boxShadow: "0 2px 8px var(--accent-emerald-glow)"
          }}>
            <span style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: "var(--accent-emerald)",
              boxShadow: "0 0 10px var(--accent-emerald)"
            }} className="animate-pulse" />
            <span>v0.1.0 Real-Time Production SIEM • Zero Cloud Egress • 100% Local-First</span>
          </div>

          <button
            onClick={toggleTheme}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border-color)",
              padding: "6px 14px",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--text-primary)",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
          >
            {theme === "dark" ? <Sun size={14} color="#34d399" /> : <Moon size={14} color="#059669" />}
            <span>{theme === "dark" ? "Light Mode" : "Cyber Dark"}</span>
          </button>
        </div>

        {/* Main Headline */}
        <h1 style={{
          fontSize: "46px",
          fontWeight: 800,
          color: "var(--text-primary)",
          lineHeight: 1.15,
          letterSpacing: "-0.025em",
          maxWidth: "920px",
          margin: "0 auto 18px",
          position: "relative",
          zIndex: 2
        }}>
          Every Signal Connected. <br />
          <span style={{
            background: "linear-gradient(135deg, #10b981 0%, #34d399 50%, #059669 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
          }}>
            Every Threat Investigated in Real-Time.
          </span>
        </h1>

        <p style={{
          fontSize: "18px",
          color: "var(--text-secondary)",
          maxWidth: "740px",
          margin: "0 auto 36px",
          lineHeight: 1.6,
          position: "relative",
          zIndex: 2
        }}>
          Tired of paying exorbitant per-gigabyte cloud SIEM bills? KRYTHOS runs locally on your infrastructure with live kernel telemetry streaming, deterministic MITRE ATT&CK correlation, and real kernel containment playbooks.
        </p>

        {/* Action Buttons */}
        <div style={{ display: "flex", justifyContent: "center", gap: "16px", flexWrap: "wrap", marginBottom: "44px", position: "relative", zIndex: 2 }}>
          <button
            onClick={() => onNavigate("dashboard")}
            className="btn-primary"
            style={{ padding: "14px 32px", fontSize: "15px", height: "50px" }}
          >
            <Shield size={20} />
            <span>Launch SOC Console</span>
            <ArrowRight size={18} />
          </button>

          <button
            onClick={() => onNavigate("pricing")}
            className="btn-secondary"
            style={{ padding: "14px 28px", fontSize: "15px", height: "50px" }}
          >
            <CreditCard size={18} color="var(--accent-emerald)" />
            <span>View Pricing & Editions</span>
          </button>

          <button
            onClick={handleCopyCmd}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "14px 22px",
              fontSize: "13px",
              fontFamily: "JetBrains Mono, monospace",
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border-color)",
              borderRadius: "6px",
              cursor: "pointer",
              color: "var(--text-primary)"
            }}
            title="Copy one-line installer command"
          >
            {copied ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
            <span>sudo bash scripts/install_service.sh</span>
          </button>
        </div>

        {/* Interactive Threat Detection Radar Graphic */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
          gap: "24px",
          maxWidth: "1080px",
          margin: "0 auto",
          textAlign: "left",
          position: "relative",
          zIndex: 2
        }}>
          {/* Radar Scanner View */}
          <div style={{
            backgroundColor: "#060911",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            borderRadius: "14px",
            padding: "24px",
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 10px 30px rgba(0,0,0,0.5)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Radar size={18} color="#10b981" />
                <span style={{ fontSize: "12px", fontWeight: 700, color: "#f8fafc", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  Live Defense Threat Radar
                </span>
              </div>
              <span style={{ fontSize: "11px", color: "#34d399", fontFamily: "JetBrains Mono, monospace" }}>
                SWEEP ACTIVE • 3 THREATS
              </span>
            </div>

            {/* Radar Scope */}
            <div style={{
              position: "relative",
              width: "100%",
              height: "260px",
              backgroundColor: "radial-gradient(circle, #0b1523 0%, #060911 100%)",
              borderRadius: "10px",
              border: "1px solid rgba(16, 185, 129, 0.2)",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              {/* Concentric rings */}
              <div style={{ position: "absolute", width: "70px", height: "70px", borderRadius: "50%", border: "1px solid rgba(16, 185, 129, 0.25)" }} />
              <div style={{ position: "absolute", width: "140px", height: "140px", borderRadius: "50%", border: "1px solid rgba(16, 185, 129, 0.2)" }} />
              <div style={{ position: "absolute", width: "220px", height: "220px", borderRadius: "50%", border: "1px solid rgba(16, 185, 129, 0.15)" }} />
              {/* Crosshairs */}
              <div style={{ position: "absolute", width: "100%", height: "1px", backgroundColor: "rgba(16, 185, 129, 0.15)" }} />
              <div style={{ position: "absolute", height: "100%", width: "1px", backgroundColor: "rgba(16, 185, 129, 0.15)" }} />

              {/* Sweeping radar needle */}
              <div style={{
                position: "absolute",
                width: "50%",
                height: "50%",
                top: 0,
                right: 0,
                transformOrigin: "bottom left",
                background: "linear-gradient(45deg, rgba(16, 185, 129, 0.4) 0%, transparent 60%)",
                animation: "radarSweep 4s linear infinite"
              }} />

              {/* Interactive Threat Blips */}
              {threatNodes.map((node) => {
                const isSelected = selectedThreatNode.id === node.id;
                return (
                  <button
                    key={node.id}
                    onClick={() => setSelectedThreatNode(node)}
                    style={{
                      position: "absolute",
                      left: `${node.x}%`,
                      top: `${node.y}%`,
                      transform: "translate(-50%, -50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 0
                    }}
                    title={`Click to inspect ${node.title}`}
                  >
                    <span style={{
                      display: "block",
                      width: isSelected ? "14px" : "10px",
                      height: isSelected ? "14px" : "10px",
                      borderRadius: "50%",
                      backgroundColor: node.severity === "Critical" ? "#ef4444" : "#f59e0b",
                      boxShadow: `0 0 12px ${node.severity === "Critical" ? "#ef4444" : "#f59e0b"}`
                    }} className="animate-pulse" />
                  </button>
                );
              })}
            </div>
            <div style={{ fontSize: "11px", color: "#64748b", marginTop: "10px", textAlign: "center" }}>
              Click any blip on the radar to inspect correlated telemetry & containment action
            </div>
          </div>

          {/* Real-Time Threat Inspection Card */}
          <div style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border-color)",
            borderRadius: "14px",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: "0 10px 30px rgba(0,0,0,0.05)"
          }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                    Detected Incident Target
                  </div>
                  <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)" }}>
                    {selectedThreatNode.title}
                  </h3>
                </div>
                <span className={`badge ${selectedThreatNode.severity === "Critical" ? "badge-critical" : "badge-high"}`}>
                  {selectedThreatNode.severity}
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px", margin: "16px 0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-color)", paddingBottom: "6px" }}>
                  <span style={{ color: "var(--text-muted)" }}>Target Entity:</span>
                  <code style={{ color: "var(--accent-emerald)", fontWeight: 600 }}>{selectedThreatNode.ip}</code>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-color)", paddingBottom: "6px" }}>
                  <span style={{ color: "var(--text-muted)" }}>ATT&CK Mapping:</span>
                  <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{selectedThreatNode.technique}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-color)", paddingBottom: "6px" }}>
                  <span style={{ color: "var(--text-muted)" }}>Detection Mechanism:</span>
                  <span style={{ color: "var(--accent-emerald)" }}>Sliding Window Threshold</span>
                </div>
              </div>

              <div style={{
                backgroundColor: theme === "dark" ? "#060911" : "#f1f5f9",
                borderRadius: "8px",
                padding: "12px",
                fontFamily: "JetBrains Mono, monospace",
                fontSize: "12px",
                color: theme === "dark" ? "#34d399" : "#047857",
                border: "1px solid var(--border-color)"
              }}>
                <div style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>
                  Automated Response Playbook
                </div>
                <code>{selectedThreatNode.action}</code>
              </div>
            </div>

            <button
              onClick={() => onNavigate("playbooks")}
              className="btn-primary"
              style={{ width: "100%", justifyContent: "center", marginTop: "16px" }}
            >
              <span>Execute Incident Playbook</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* Interactive Live Attack & Detection Sandbox */}
      <section style={{ marginBottom: "56px" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--accent-emerald)", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>
            <Crosshair size={16} /> Interactive Detection Sandbox
          </div>
          <h2 style={{ fontSize: "30px", fontWeight: 700, color: "var(--text-primary)" }}>
            Test the Deterministic Engine Live
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "15px", marginTop: "4px" }}>
            Trigger simulated attack payloads to observe instant telemetry normalization, sliding window correlation, and automated containment.
          </p>
        </div>

        {/* Attack Simulator Controls */}
        <div style={{ display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap", marginBottom: "24px" }}>
          <button
            onClick={() => runInteractiveSimulation("brute_force")}
            className={activeSimulation === "brute_force" ? "btn-primary" : "btn-secondary"}
            style={{ fontSize: "13px" }}
          >
            <Lock size={16} />
            <span>SSH Brute Force (T1110.001)</span>
          </button>

          <button
            onClick={() => runInteractiveSimulation("priv_esc")}
            className={activeSimulation === "priv_esc" ? "btn-primary" : "btn-secondary"}
            style={{ fontSize: "13px" }}
          >
            <Zap size={16} />
            <span>Sudo Privilege Escalation (T1548)</span>
          </button>

          <button
            onClick={() => runInteractiveSimulation("c2_beacon")}
            className={activeSimulation === "c2_beacon" ? "btn-primary" : "btn-secondary"}
            style={{ fontSize: "13px" }}
          >
            <Radio size={16} />
            <span>Threat Intel C2 Beacon (T1071)</span>
          </button>
        </div>

        {/* 3-Step Interactive Pipeline Visualization */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "16px",
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border-color)",
          borderRadius: "16px",
          padding: "28px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.03)"
        }}>
          {/* Step 1: Telemetry Arrival */}
          <div style={{
            padding: "20px",
            borderRadius: "10px",
            backgroundColor: simulationStep >= 1 ? "var(--bg-secondary)" : "transparent",
            border: `1px solid ${simulationStep >= 1 ? "var(--accent-emerald)" : "var(--border-color)"}`,
            transition: "all 0.3s ease"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <span style={{
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                backgroundColor: simulationStep >= 1 ? "var(--accent-emerald)" : "var(--border-color)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px",
                fontWeight: 700
              }}>1</span>
              <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
                Telemetry Ingestion
              </span>
            </div>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
              {activeSimulation === "brute_force" && "journald: 5 failed ssh logins for user root from 198.51.100.42 within 180s."}
              {activeSimulation === "priv_esc" && "sudo: unauthorized execution of /usr/bin/bash by non-wheel user jsmith."}
              {activeSimulation === "c2_beacon" && "netflow: outbound HTTP beacon to known C2 indicator 203.0.113.88:8080."}
            </p>
            <div style={{ fontSize: "11px", color: "var(--accent-emerald)", marginTop: "10px", fontWeight: 600 }}>
              ✓ Normalized to KRYTHOS Schema (&lt; 0.3ms)
            </div>
          </div>

          {/* Step 2: Correlation Engine */}
          <div style={{
            padding: "20px",
            borderRadius: "10px",
            backgroundColor: simulationStep >= 2 ? "var(--bg-secondary)" : "transparent",
            border: `1px solid ${simulationStep >= 2 ? "var(--accent-emerald)" : "var(--border-color)"}`,
            transition: "all 0.3s ease"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <span style={{
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                backgroundColor: simulationStep >= 2 ? "var(--accent-emerald)" : "var(--border-color)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px",
                fontWeight: 700
              }}>2</span>
              <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
                Deterministic Correlation
              </span>
            </div>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
              {activeSimulation === "brute_force" && "Rule KRY-AUTH-001 threshold met: 5/3 attempts. Severity evaluated as HIGH."}
              {activeSimulation === "priv_esc" && "Rule KRY-PRIV-001 single-event privilege escalation matched. Severity: HIGH."}
              {activeSimulation === "c2_beacon" && "Rule KRY-INTEL-001 IOC match confidence 100%. Severity: CRITICAL."}
            </p>
            <div style={{ fontSize: "11px", color: "var(--accent-emerald)", marginTop: "10px", fontWeight: 600 }}>
              ✓ Alert Generated & Suppressed for 300s
            </div>
          </div>

          {/* Step 3: Containment */}
          <div style={{
            padding: "20px",
            borderRadius: "10px",
            backgroundColor: simulationStep >= 3 ? "var(--bg-secondary)" : "transparent",
            border: `1px solid ${simulationStep >= 3 ? "var(--accent-emerald)" : "var(--border-color)"}`,
            transition: "all 0.3s ease"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <span style={{
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                backgroundColor: simulationStep >= 3 ? "var(--accent-emerald)" : "var(--border-color)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px",
                fontWeight: 700
              }}>3</span>
              <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
                Automated Containment
              </span>
            </div>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
              {activeSimulation === "brute_force" && "Kernel iptables drop rule executed. Attacker IP quarantined in Threat Intel."}
              {activeSimulation === "priv_esc" && "User session invalidated. OS account locked with passwd -l. Audit logged."}
              {activeSimulation === "c2_beacon" && "Egress boundary firewall drop applied. Retrospective historical scan initiated."}
            </p>
            <div style={{ fontSize: "11px", color: "var(--accent-emerald)", marginTop: "10px", fontWeight: 600 }}>
              ✓ Audit Trail Record Committed to SQLite
            </div>
          </div>
        </div>
      </section>

      {/* Interactive 4-Stage Architecture Pipeline */}
      <section style={{ marginBottom: "56px" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--accent-emerald)", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>
            <Layers size={16} /> Real-Time Architecture Pipeline
          </div>
          <h2 style={{ fontSize: "30px", fontWeight: 700, color: "var(--text-primary)" }}>
            Engineered for Sub-Millisecond Precision
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "15px", marginTop: "4px" }}>
            Click each architectural tier to reveal internal data-path mechanics, memory bounds, and latency benchmarks.
          </p>
        </div>

        {/* Architecture Navigation Steps */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "12px", marginBottom: "20px" }}>
          {archStages.map((stage, idx) => {
            const isActive = activeArchStage === idx;
            return (
              <button
                key={idx}
                onClick={() => setActiveArchStage(idx)}
                style={{
                  padding: "16px",
                  borderRadius: "10px",
                  border: `1px solid ${isActive ? "var(--accent-emerald)" : "var(--border-color)"}`,
                  backgroundColor: isActive ? "var(--bg-secondary)" : "var(--bg-card)",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.2s ease",
                  boxShadow: isActive ? "0 4px 12px var(--accent-emerald-glow)" : "none"
                }}
              >
                <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", marginBottom: "4px" }}>
                  Tier 0{idx + 1}
                </div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>
                  {stage.title}
                </div>
                <div style={{ fontSize: "11px", color: "var(--accent-emerald)", fontWeight: 600 }}>
                  Latency: {stage.latency}
                </div>
              </button>
            );
          })}
        </div>

        {/* Detailed Stage Blueprint Card */}
        <div className="card" style={{ padding: "32px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "28px", alignItems: "center" }}>
          <div>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--accent-emerald)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Technical Specification
            </span>
            <h3 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)", margin: "6px 0 12px" }}>
              {archStages[activeArchStage].title}
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.7, marginBottom: "20px" }}>
              {archStages[activeArchStage].desc}
            </p>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              <div style={{ backgroundColor: "var(--bg-secondary)", padding: "8px 14px", borderRadius: "6px", border: "1px solid var(--border-color)" }}>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>Underlying Tech</span>
                <strong style={{ fontSize: "13px", color: "var(--text-primary)" }}>{archStages[activeArchStage].tech}</strong>
              </div>
              <div style={{ backgroundColor: "var(--bg-secondary)", padding: "8px 14px", borderRadius: "6px", border: "1px solid var(--border-color)" }}>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>Benchmark</span>
                <strong style={{ fontSize: "13px", color: "var(--accent-emerald)" }}>{archStages[activeArchStage].metric}</strong>
              </div>
            </div>
          </div>

          <div style={{
            backgroundColor: "#060911",
            borderRadius: "12px",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            padding: "20px",
            fontFamily: "JetBrains Mono, monospace",
            fontSize: "12px",
            color: "#e2e8f0",
            boxShadow: "0 10px 30px rgba(0,0,0,0.4)"
          }}>
            <div style={{ color: "#64748b", borderBottom: "1px solid #1e293b", paddingBottom: "8px", marginBottom: "12px", fontSize: "11px" }}>
              // Pipeline Stage 0{activeArchStage + 1} Runtime Inspection
            </div>
            <div style={{ lineHeight: 1.8 }}>
              <div><span style={{ color: "#38bdf8" }}>const</span> stage = <span style={{ color: "#fcd34d" }}>"{archStages[activeArchStage].title}"</span>;</div>
              <div><span style={{ color: "#38bdf8" }}>const</span> engine = <span style={{ color: "#34d399" }}>KRYTHOS_CORE</span>;</div>
              <div><span style={{ color: "#38bdf8" }}>const</span> throughput = <span style={{ color: "#fcd34d" }}>"{archStages[activeArchStage].metric}"</span>;</div>
              <div><span style={{ color: "#38bdf8" }}>const</span> measured_latency = <span style={{ color: "#34d399" }}>"{archStages[activeArchStage].latency}"</span>;</div>
              <div>engine.verifyZeroCloudEgress(<span style={{ color: "#38bdf8" }}>true</span>); <span style={{ color: "#64748b" }}>// 100% air-gapped</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* Cloud SIEM Cost Savings Calculator */}
      <section style={{
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border-color)",
        borderRadius: "16px",
        padding: "36px",
        marginBottom: "56px",
        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.04)"
      }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "32px", alignItems: "center" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--accent-emerald)", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>
              <BarChart3 size={16} /> Cost Sovereignty Calculator
            </div>
            <h3 style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "12px" }}>
              Calculate What You Save vs. Cloud SIEMs
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.6, marginBottom: "24px" }}>
              Traditional cloud vendors charge $2.50 to $4.00 per GB for ingestion and retention fees. KRYTHOS runs locally on your existing hardware with $0 per-gigabyte costs.
            </p>

            <div style={{ marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "8px" }}>
                <span>Daily Security Telemetry Ingested:</span>
                <span style={{ color: "var(--accent-emerald)", fontWeight: 700 }}>{logVolume} GB / day</span>
              </div>
              <input
                type="range"
                min="5"
                max="250"
                step="5"
                value={logVolume}
                onChange={(e) => setLogVolume(Number(e.target.value))}
                style={{ width: "100%", accentColor: "#10b981", cursor: "pointer" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-muted)", marginTop: "6px" }}>
                <span>5 GB/day</span>
                <span>125 GB/day</span>
                <span>250 GB/day</span>
              </div>
            </div>

            {/* Visual comparison bar */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Estimated Legacy Cloud SIEM Ingest:</span>
                <span style={{ color: "#ef4444", fontWeight: 700 }}>${annualSavings.toLocaleString()} / year</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>KRYTHOS Local-First Platform:</span>
                <span style={{ color: "var(--accent-emerald)", fontWeight: 700 }}>$0 Ingestion Fees</span>
              </div>
            </div>
          </div>

          <div style={{
            backgroundColor: "var(--bg-secondary)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            borderRadius: "14px",
            padding: "32px",
            textAlign: "center",
            boxShadow: "0 4px 16px var(--accent-emerald-glow)"
          }}>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--accent-emerald-dark)", marginBottom: "6px" }}>
              Estimated Annual Ingestion Budget Retained
            </div>
            <div style={{ fontSize: "42px", fontWeight: 800, color: "var(--accent-emerald)", letterSpacing: "-0.02em", marginBottom: "8px" }}>
              ${annualSavings.toLocaleString()} <span style={{ fontSize: "16px", fontWeight: 500, color: "var(--text-muted)" }}>/ year</span>
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "24px" }}>
              Based on {logVolume * 30} GB/month average cloud index and query pricing.
            </div>

            <button
              onClick={() => onNavigate("pricing")}
              className="btn-primary"
              style={{ width: "100%", justifyContent: "center" }}
            >
              <span>Explore KRYTHOS Pricing & Editions</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* Security Architecture & Compliance Standards */}
      <section style={{
        textAlign: "center",
        borderTop: "1px solid var(--border-color)",
        paddingTop: "40px"
      }}>
        <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "20px" }}>
          Built Upon Proven Cyber Defense Standards
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: "32px", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 600, color: "var(--text-secondary)", fontSize: "14px" }}>
            <Shield size={18} color="var(--accent-emerald)" /> MITRE ATT&CK Matrix v14
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 600, color: "var(--text-secondary)", fontSize: "14px" }}>
            <Lock size={18} color="var(--accent-emerald)" /> Argon2id Password Hashing
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 600, color: "var(--text-secondary)", fontSize: "14px" }}>
            <Database size={18} color="var(--accent-emerald)" /> SQLite WAL High Concurrency
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 600, color: "var(--text-secondary)", fontSize: "14px" }}>
            <Cpu size={18} color="var(--accent-emerald)" /> 100% Air-Gapped Ready
          </div>
        </div>
      </section>
    </div>
  );
};
