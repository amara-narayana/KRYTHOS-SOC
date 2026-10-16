import React, { useState } from "react";
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
  Check
} from "lucide-react";
import { NavItem } from "../components/Sidebar";

interface LandingPageProps {
  onNavigate: (tab: NavItem) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const [logVolume, setLogVolume] = useState<number>(25); // GB per day
  const [copied, setCopied] = useState(false);

  const calculateCloudCost = (gb: number) => gb * 30 * 2.5; // ~$2.50 per GB typical cloud SIEM ingest
  const cloudCostMonthly = calculateCloudCost(logVolume);
  const annualSavings = (cloudCostMonthly - 0) * 12;

  const handleCopyCmd = () => {
    navigator.clipboard.writeText("git clone https://github.com/amara-narayana/KRYTHOS-SOC.git && cd KRYTHOS-SOC && ./scripts/start.sh");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", paddingBottom: "60px" }}>
      {/* Hero Section */}
      <section style={{
        textAlign: "center",
        padding: "60px 20px 48px",
        background: "radial-gradient(ellipse at top, #ecfdf5 0%, #ffffff 70%)",
        borderRadius: "16px",
        border: "1px solid var(--border-color)",
        marginBottom: "40px",
        position: "relative",
        overflow: "hidden"
      }}>
        {/* Glow badge */}
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          backgroundColor: "#ffffff",
          border: "1px solid #a7f3d0",
          padding: "6px 16px",
          borderRadius: "30px",
          fontSize: "12px",
          fontWeight: 600,
          color: "#047857",
          boxShadow: "0 2px 6px rgba(16, 185, 129, 0.15)",
          marginBottom: "24px"
        }}>
          <span style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            backgroundColor: "#10b981",
            boxShadow: "0 0 8px #10b981"
          }} />
          v0.1.0 Production Ready • Zero Cloud Egress • 100% Local-First
        </div>

        <h1 style={{
          fontSize: "44px",
          fontWeight: 800,
          color: "#0f172a",
          lineHeight: 1.15,
          letterSpacing: "-0.02em",
          maxWidth: "850px",
          margin: "0 auto 16px"
        }}>
          The High-Precision <span style={{
            background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
          }}>Local-First SIEM</span> & Security Operations Platform
        </h1>

        <p style={{
          fontSize: "18px",
          color: "#475569",
          maxWidth: "680px",
          margin: "0 auto 32px",
          lineHeight: 1.6
        }}>
          Stop paying extortionate per-gigabyte cloud ingestion bills. Ingest, normalize, correlate, and investigate security threats in real-time with zero-latency deterministic detections and full data sovereignty.
        </p>

        {/* Action CTAs */}
        <div style={{ display: "flex", justifyContent: "center", gap: "16px", flexWrap: "wrap", marginBottom: "40px" }}>
          <button
            onClick={() => onNavigate("dashboard")}
            className="btn-primary"
            style={{ padding: "12px 28px", fontSize: "15px", height: "48px" }}
          >
            <Shield size={18} />
            <span>Launch SOC Console</span>
            <ArrowRight size={16} />
          </button>

          <button
            onClick={() => onNavigate("pricing")}
            className="btn-secondary"
            style={{ padding: "12px 24px", fontSize: "15px", height: "48px" }}
          >
            <CreditCard size={18} color="#059669" />
            <span>View Subscription Plans</span>
          </button>

          <button
            onClick={handleCopyCmd}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 20px",
              fontSize: "13px",
              fontFamily: "JetBrains Mono, monospace",
              backgroundColor: "#ffffff",
              border: "1px solid var(--border-color)",
              borderRadius: "6px",
              cursor: "pointer",
              color: "#334155"
            }}
            title="Copy clone & start command"
          >
            {copied ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
            <span>git clone ... && ./scripts/start.sh</span>
          </button>
        </div>

        {/* Live Interactive Telemetry Preview */}
        <div style={{
          maxWidth: "880px",
          margin: "0 auto",
          backgroundColor: "#0f172a",
          borderRadius: "10px",
          border: "1px solid #334155",
          padding: "16px 20px",
          textAlign: "left",
          boxShadow: "0 20px 40px -15px rgba(15, 23, 42, 0.3)",
          fontFamily: "JetBrains Mono, monospace",
          fontSize: "12px",
          color: "#e2e8f0"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #1e293b", paddingBottom: "10px", marginBottom: "12px" }}>
            <div style={{ display: "flex", gap: "6px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#ef4444" }} />
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#f59e0b" }} />
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#10b981" }} />
            </div>
            <div style={{ fontSize: "11px", color: "#64748b" }}>KRYTHOS Real-Time Kernel Stream — localhost:8000</div>
          </div>
          <div style={{ lineHeight: 1.8 }}>
            <div><span style={{ color: "#34d399" }}>[INFO]</span> Ingestion pipeline initialized. Sources: Linux Auth, Syslog, JSON, CSV.</div>
            <div><span style={{ color: "#38bdf8" }}>[STREAM]</span> auth.log &rarr; Accepted password for <span style={{ color: "#fcd34d" }}>amar</span> from 127.0.0.1 port 54320 ssh2</div>
            <div><span style={{ color: "#f87171" }}>[ALERT]</span> <span style={{ color: "#fbbf24", fontWeight: "bold" }}>KRY-AUTH-001</span>: Repeated Failed Logins detected on host <span style={{ color: "#ffffff" }}>kali</span> (4 attempts in 10m window)</div>
            <div><span style={{ color: "#a78bfa" }}>[MITRE]</span> Mapped to Technique: <span style={{ textDecoration: "underline" }}>T1110.001 (Password Guessing)</span> | Severity: <span style={{ color: "#f87171", fontWeight: "bold" }}>HIGH</span></div>
            <div><span style={{ color: "#34d399" }}>[SOC]</span> Evidence attached to Case <span style={{ color: "#38bdf8" }}>CASE-2026-0001</span>. Automated response available.</div>
          </div>
        </div>
      </section>

      {/* 4 Pillars of KRYTHOS Defense */}
      <section style={{ marginBottom: "50px" }}>
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <h2 style={{ fontSize: "28px", fontWeight: 700, color: "#0f172a" }}>
            Engineered for Modern Cyber Defense Operations
          </h2>
          <p style={{ color: "#64748b", fontSize: "15px", marginTop: "6px" }}>
            A complete defensive stack providing enterprise detection capabilities without the cloud tax.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
          <div className="card" style={{ padding: "28px" }}>
            <div style={{
              width: "44px",
              height: "44px",
              backgroundColor: "var(--bg-secondary)",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "16px",
              border: "1px solid rgba(16, 185, 129, 0.2)"
            }}>
              <Lock size={22} color="#059669" />
            </div>
            <h3 style={{ fontSize: "17px", fontWeight: 700, color: "#0f172a", marginBottom: "8px" }}>
              100% Data Sovereignty
            </h3>
            <p style={{ fontSize: "13px", color: "#64748b", lineHeight: 1.6 }}>
              Air-gapped and local-first by design. No logs, credentials, or telemetry ever exit your boundary. Fully compliant with strict offline and classified requirements.
            </p>
          </div>

          <div className="card" style={{ padding: "28px" }}>
            <div style={{
              width: "44px",
              height: "44px",
              backgroundColor: "var(--bg-secondary)",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "16px",
              border: "1px solid rgba(16, 185, 129, 0.2)"
            }}>
              <Zap size={22} color="#059669" />
            </div>
            <h3 style={{ fontSize: "17px", fontWeight: 700, color: "#0f172a", marginBottom: "8px" }}>
              Deterministic Detection Engine
            </h3>
            <p style={{ fontSize: "13px", color: "#64748b", lineHeight: 1.6 }}>
              Sliding-window threshold rules, sequence correlations, and multi-source event chaining. Zero black-box AI hallucinations—every alert references exact log evidence.
            </p>
          </div>

          <div className="card" style={{ padding: "28px" }}>
            <div style={{
              width: "44px",
              height: "44px",
              backgroundColor: "var(--bg-secondary)",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "16px",
              border: "1px solid rgba(16, 185, 129, 0.2)"
            }}>
              <FileCheck size={22} color="#059669" />
            </div>
            <h3 style={{ fontSize: "17px", fontWeight: 700, color: "#0f172a", marginBottom: "8px" }}>
              Evidence Locker & Case Triage
            </h3>
            <p style={{ fontSize: "13px", color: "#64748b", lineHeight: 1.6 }}>
              Structured investigation timelines, checklist workflows, and one-click export of cryptographically hashed HTML executive incident reports.
            </p>
          </div>

          <div className="card" style={{ padding: "28px" }}>
            <div style={{
              width: "44px",
              height: "44px",
              backgroundColor: "var(--bg-secondary)",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "16px",
              border: "1px solid rgba(16, 185, 129, 0.2)"
            }}>
              <Terminal size={22} color="#059669" />
            </div>
            <h3 style={{ fontSize: "17px", fontWeight: 700, color: "#0f172a", marginBottom: "8px" }}>
              Unified GUI & CLI Architecture
            </h3>
            <p style={{ fontSize: "13px", color: "#64748b", lineHeight: 1.6 }}>
              Full operational parity between the web dashboard and the rich <code>krythos</code> terminal client. Automate with bash scripts or triage visually.
            </p>
          </div>
        </div>
      </section>

      {/* Cloud SIEM Cost Savings Calculator */}
      <section style={{
        backgroundColor: "#ffffff",
        border: "1px solid var(--border-color)",
        borderRadius: "16px",
        padding: "36px",
        marginBottom: "50px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.03)"
      }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "32px", alignItems: "center" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#059669", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>
              <BarChart3 size={16} /> Cost Sovereignty Calculator
            </div>
            <h3 style={{ fontSize: "24px", fontWeight: 700, color: "#0f172a", marginBottom: "12px" }}>
              Calculate What You Save vs. Legacy Cloud SIEMs
            </h3>
            <p style={{ color: "#64748b", fontSize: "14px", lineHeight: 1.6, marginBottom: "20px" }}>
              Traditional cloud vendors charge $2.50 to $4.00 per GB for ingestion, retention, and query fees. KRYTHOS runs locally on your existing hardware with zero ingestion fees.
            </p>

            <div style={{ marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", fontWeight: 600, color: "#0f172a", marginBottom: "8px" }}>
                <span>Daily Security Log Ingestion:</span>
                <span style={{ color: "#059669" }}>{logVolume} GB / day</span>
              </div>
              <input
                type="range"
                min="5"
                max="200"
                step="5"
                value={logVolume}
                onChange={(e) => setLogVolume(Number(e.target.value))}
                style={{ width: "100%", accentColor: "#10b981", cursor: "pointer" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>
                <span>5 GB/day</span>
                <span>100 GB/day</span>
                <span>200 GB/day</span>
              </div>
            </div>
          </div>

          <div style={{
            backgroundColor: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: "12px",
            padding: "28px",
            textAlign: "center"
          }}>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "#047857", marginBottom: "4px" }}>
              Estimated Annual Ingestion Cost Avoided
            </div>
            <div style={{ fontSize: "40px", fontWeight: 800, color: "#059669", letterSpacing: "-0.02em", marginBottom: "8px" }}>
              ${annualSavings.toLocaleString()} <span style={{ fontSize: "16px", fontWeight: 500, color: "#047857" }}>/ year</span>
            </div>
            <div style={{ fontSize: "12px", color: "#475569", marginBottom: "20px" }}>
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

      {/* Security Architecture & Compliance Badges */}
      <section style={{
        textAlign: "center",
        borderTop: "1px solid var(--border-color)",
        paddingTop: "40px"
      }}>
        <div style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "20px" }}>
          Built Upon Proven Cyber Defense Standards
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: "32px", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 600, color: "#334155", fontSize: "14px" }}>
            <Shield size={18} color="#059669" /> MITRE ATT&CK Matrix v14
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 600, color: "#334155", fontSize: "14px" }}>
            <Lock size={18} color="#059669" /> Argon2id Password Hashing
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 600, color: "#334155", fontSize: "14px" }}>
            <Database size={18} color="#059669" /> SQLite WAL Concurrency
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 600, color: "#334155", fontSize: "14px" }}>
            <Cpu size={18} color="#059669" /> 100% Air-Gapped Ready
          </div>
        </div>
      </section>
    </div>
  );
};
