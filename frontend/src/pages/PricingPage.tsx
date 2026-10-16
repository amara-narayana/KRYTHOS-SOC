import React, { useState } from "react";
import {
  Check,
  Shield,
  Zap,
  Star,
  Lock,
  Building,
  HelpCircle,
  CreditCard,
  CheckCircle2,
  X,
  Sparkles
} from "lucide-react";
import { NavItem } from "../components/Sidebar";

interface PricingPageProps {
  onNavigate: (tab: NavItem) => void;
}

export const PricingPage: React.FC<PricingPageProps> = ({ onNavigate }) => {
  const [annualBilling, setAnnualBilling] = useState(true);
  const [selectedPlanModal, setSelectedPlanModal] = useState<string | null>(null);
  const [licenseKey, setLicenseKey] = useState("");
  const [activationSuccess, setActivationSuccess] = useState(false);

  const handleActivate = (e: React.FormEvent) => {
    e.preventDefault();
    if (licenseKey.trim()) {
      setActivationSuccess(true);
      setTimeout(() => {
        setSelectedPlanModal(null);
        setActivationSuccess(false);
        setLicenseKey("");
      }, 2500);
    }
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", paddingBottom: "60px" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          backgroundColor: "var(--bg-secondary)",
          border: "1px solid rgba(16, 185, 129, 0.3)",
          padding: "6px 16px",
          borderRadius: "30px",
          fontSize: "12px",
          fontWeight: 700,
          color: "var(--accent-emerald-dark)",
          marginBottom: "16px"
        }}>
          <Sparkles size={14} /> Transparent Local-First Subscriptions
        </div>
        <h1 style={{ fontSize: "36px", fontWeight: 800, color: "#0f172a", marginBottom: "12px" }}>
          Predictable Security Pricing. Zero Ingestion Penalties.
        </h1>
        <p style={{ color: "#64748b", fontSize: "16px", maxWidth: "600px", margin: "0 auto 24px" }}>
          Start free forever on your local workstation. Upgrade when you need distributed multi-VM sensors, automated playbooks, or compliance SLA.
        </p>

        {/* Billing Switch */}
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          backgroundColor: "#f1f5f9",
          padding: "4px",
          borderRadius: "30px",
          border: "1px solid var(--border-color)"
        }}>
          <button
            onClick={() => setAnnualBilling(false)}
            style={{
              padding: "8px 20px",
              borderRadius: "24px",
              border: "none",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              backgroundColor: !annualBilling ? "#ffffff" : "transparent",
              color: !annualBilling ? "#0f172a" : "#64748b",
              boxShadow: !annualBilling ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              transition: "all 0.15s ease"
            }}
          >
            Monthly Billing
          </button>
          <button
            onClick={() => setAnnualBilling(true)}
            style={{
              padding: "8px 20px",
              borderRadius: "24px",
              border: "none",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              backgroundColor: annualBilling ? "#ffffff" : "transparent",
              color: annualBilling ? "#059669" : "#64748b",
              boxShadow: annualBilling ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.15s ease"
            }}
          >
            <span>Annual Billing</span>
            <span style={{
              backgroundColor: "#d1fae5",
              color: "#047857",
              fontSize: "10px",
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: "12px"
            }}>
              SAVE 20%
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px", marginBottom: "60px" }}>
        {/* Tier 1: Community Edition */}
        <div className="card" style={{
          padding: "32px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          position: "relative"
        }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a" }}>Community Edition</h3>
              <span style={{
                backgroundColor: "#e2e8f0",
                color: "#475569",
                fontSize: "11px",
                fontWeight: 700,
                padding: "3px 8px",
                borderRadius: "4px"
              }}>
                CURRENT PLAN
              </span>
            </div>
            <p style={{ color: "#64748b", fontSize: "13px", marginBottom: "20px" }}>
              Ideal for individual security engineers, home labs, and single Kali Linux workstations.
            </p>
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "24px" }}>
              <span style={{ fontSize: "36px", fontWeight: 800, color: "#0f172a" }}>$0</span>
              <span style={{ color: "#64748b", fontSize: "14px" }}>forever free</span>
            </div>

            <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "20px", marginBottom: "24px" }}>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "12px" }}>
                Included Features:
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px", color: "#334155" }}>
                <li style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Check size={16} color="#059669" /> Unlimited local log ingestion (JSON, CSV, Syslog)
                </li>
                <li style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Check size={16} color="#059669" /> 6 deterministic MITRE ATT&CK rules
                </li>
                <li style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Check size={16} color="#059669" /> Real-time Alert Queue & triage
                </li>
                <li style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Check size={16} color="#059669" /> Investigation Workbench & timeline notes
                </li>
                <li style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Check size={16} color="#059669" /> Standalone HTML incident reports
                </li>
                <li style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Check size={16} color="#059669" /> Local Threat Intelligence IOC database
                </li>
                <li style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Check size={16} color="#059669" /> Full <code>krythos</code> CLI tool included
                </li>
              </ul>
            </div>
          </div>

          <button
            onClick={() => onNavigate("dashboard")}
            className="btn-secondary"
            style={{ width: "100%", justifyContent: "center" }}
          >
            Access Active Console
          </button>
        </div>

        {/* Tier 2: Professional SOC Analyst */}
        <div className="card" style={{
          padding: "32px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          position: "relative",
          borderColor: "#10b981",
          boxShadow: "0 8px 24px rgba(16, 185, 129, 0.12)"
        }}>
          {/* Top Banner */}
          <div style={{
            position: "absolute",
            top: "-12px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "#059669",
            color: "#ffffff",
            fontSize: "11px",
            fontWeight: 700,
            padding: "4px 16px",
            borderRadius: "20px",
            letterSpacing: "0.05em",
            boxShadow: "0 2px 6px rgba(5, 150, 105, 0.4)"
          }}>
            RECOMMENDED FOR ANALYSTS
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", marginTop: "4px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a" }}>Professional SOC Analyst</h3>
            </div>
            <p style={{ color: "#64748b", fontSize: "13px", marginBottom: "20px" }}>
              For blue teams, detection engineers, and incident responders requiring automated playbooks.
            </p>
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "24px" }}>
              <span style={{ fontSize: "36px", fontWeight: 800, color: "#0f172a" }}>
                ${annualBilling ? "39" : "49"}
              </span>
              <span style={{ color: "#64748b", fontSize: "14px" }}>/ month {annualBilling && "(billed annually)"}</span>
            </div>

            <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "20px", marginBottom: "24px" }}>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#059669", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "12px" }}>
                Everything in Community, Plus:
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px", color: "#334155" }}>
                <li style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Check size={16} color="#059669" /> Custom Rule Builder & Sigma transpiler
                </li>
                <li style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Check size={16} color="#059669" /> Live Incident Response Playbook Orchestration
                </li>
                <li style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Check size={16} color="#059669" /> Multi-VM agent forwarder daemon
                </li>
                <li style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Check size={16} color="#059669" /> Automated scheduled PDF/HTML audit reports
                </li>
                <li style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Check size={16} color="#059669" /> Advanced entity risk factor breakdowns
                </li>
                <li style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Check size={16} color="#059669" /> Priority offline Ollama prompt library
                </li>
              </ul>
            </div>
          </div>

          <button
            onClick={() => setSelectedPlanModal("Professional SOC Analyst")}
            className="btn-primary"
            style={{ width: "100%", justifyContent: "center" }}
          >
            Start 14-Day Free Trial
          </button>
        </div>

        {/* Tier 3: Enterprise Defense Cluster */}
        <div className="card" style={{
          padding: "32px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          position: "relative"
        }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a" }}>Enterprise Defense</h3>
              <span style={{
                backgroundColor: "#ecfdf5",
                color: "#047857",
                fontSize: "11px",
                fontWeight: 700,
                padding: "3px 8px",
                borderRadius: "4px"
              }}>
                MULTI-NODE
              </span>
            </div>
            <p style={{ color: "#64748b", fontSize: "13px", marginBottom: "20px" }}>
              For MSSPs, defense contractors, and distributed enterprise networks.
            </p>
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "24px" }}>
              <span style={{ fontSize: "36px", fontWeight: 800, color: "#0f172a" }}>
                ${annualBilling ? "199" : "249"}
              </span>
              <span style={{ color: "#64748b", fontSize: "14px" }}>/ month {annualBilling && "(billed annually)"}</span>
            </div>

            <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "20px", marginBottom: "24px" }}>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "12px" }}>
                Everything in Professional, Plus:
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px", color: "#334155" }}>
                <li style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Check size={16} color="#059669" /> Distributed multi-sensor cluster synchronization
                </li>
                <li style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Check size={16} color="#059669" /> Real automated endpoint isolation playbooks
                </li>
                <li style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Check size={16} color="#059669" /> LDAP / Active Directory SSO integration
                </li>
                <li style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Check size={16} color="#059669" /> Air-gapped compliance verification audit trail
                </li>
                <li style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Check size={16} color="#059669" /> 24/7 dedicated SOC architectural SLA
                </li>
              </ul>
            </div>
          </div>

          <button
            onClick={() => setSelectedPlanModal("Enterprise Defense")}
            className="btn-secondary"
            style={{ width: "100%", justifyContent: "center" }}
          >
            Request Enterprise Evaluation
          </button>
        </div>
      </div>

      {/* Feature Comparison Table */}
      <div style={{ marginBottom: "60px" }}>
        <h2 style={{ fontSize: "24px", fontWeight: 700, color: "#0f172a", textAlign: "center", marginBottom: "24px" }}>
          Full Feature & Capability Matrix
        </h2>
        <div className="table-container">
          <table className="soc-table">
            <thead>
              <tr>
                <th>Capability / Feature</th>
                <th style={{ textAlign: "center" }}>Community ($0)</th>
                <th style={{ textAlign: "center" }}>Professional ($39/mo)</th>
                <th style={{ textAlign: "center" }}>Enterprise ($199/mo)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Local Ingestion Limits</strong></td>
                <td style={{ textAlign: "center" }}>Unlimited Local</td>
                <td style={{ textAlign: "center" }}>Unlimited Multi-VM</td>
                <td style={{ textAlign: "center" }}>Unlimited Distributed</td>
              </tr>
              <tr>
                <td><strong>Deterministic Detections</strong></td>
                <td style={{ textAlign: "center" }}>6 Built-in Core Rules</td>
                <td style={{ textAlign: "center" }}>Unlimited + Sigma Transpiler</td>
                <td style={{ textAlign: "center" }}>Custom MSSP Packs</td>
              </tr>
              <tr>
                <td><strong>Incident Response Workbench</strong></td>
                <td style={{ textAlign: "center" }}><Check size={16} color="#059669" style={{ margin: "0 auto" }} /></td>
                <td style={{ textAlign: "center" }}><Check size={16} color="#059669" style={{ margin: "0 auto" }} /></td>
                <td style={{ textAlign: "center" }}><Check size={16} color="#059669" style={{ margin: "0 auto" }} /></td>
              </tr>
              <tr>
                <td><strong>Automated Playbooks</strong></td>
                <td style={{ textAlign: "center", color: "#94a3b8" }}>Manual Only</td>
                <td style={{ textAlign: "center" }}>Interactive Live Playbooks</td>
                <td style={{ textAlign: "center" }}>Real Automated Isolation</td>
              </tr>
              <tr>
                <td><strong>MITRE ATT&CK Matrix</strong></td>
                <td style={{ textAlign: "center" }}><Check size={16} color="#059669" style={{ margin: "0 auto" }} /></td>
                <td style={{ textAlign: "center" }}><Check size={16} color="#059669" style={{ margin: "0 auto" }} /></td>
                <td style={{ textAlign: "center" }}><Check size={16} color="#059669" style={{ margin: "0 auto" }} /></td>
              </tr>
              <tr>
                <td><strong>Offline Privacy (Zero Egress)</strong></td>
                <td style={{ textAlign: "center" }}><Check size={16} color="#059669" style={{ margin: "0 auto" }} /></td>
                <td style={{ textAlign: "center" }}><Check size={16} color="#059669" style={{ margin: "0 auto" }} /></td>
                <td style={{ textAlign: "center" }}><Check size={16} color="#059669" style={{ margin: "0 auto" }} /></td>
              </tr>
              <tr>
                <td><strong>CLI (<code>krythos</code>) Full Access</strong></td>
                <td style={{ textAlign: "center" }}><Check size={16} color="#059669" style={{ margin: "0 auto" }} /></td>
                <td style={{ textAlign: "center" }}><Check size={16} color="#059669" style={{ margin: "0 auto" }} /></td>
                <td style={{ textAlign: "center" }}><Check size={16} color="#059669" style={{ margin: "0 auto" }} /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Activation / Checkout Modal */}
      {selectedPlanModal && (
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
            maxWidth: "480px",
            width: "100%",
            padding: "32px",
            boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            position: "relative"
          }}>
            <button
              onClick={() => setSelectedPlanModal(null)}
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                background: "none",
                border: "none",
                color: "#64748b",
                cursor: "pointer"
              }}
            >
              <X size={20} />
            </button>

            <div style={{
              width: "48px",
              height: "48px",
              backgroundColor: "var(--bg-secondary)",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "16px"
            }}>
              <CreditCard size={24} color="#059669" />
            </div>

            <h3 style={{ fontSize: "20px", fontWeight: 700, color: "#0f172a", marginBottom: "8px" }}>
              Upgrade to {selectedPlanModal}
            </h3>
            <p style={{ color: "#64748b", fontSize: "13px", lineHeight: 1.5, marginBottom: "20px" }}>
              Activate a 14-day evaluation license or apply an offline license key voucher.
            </p>

            {activationSuccess ? (
              <div style={{
                backgroundColor: "#ecfdf5",
                border: "1px solid #10b981",
                borderRadius: "8px",
                padding: "20px",
                textAlign: "center"
              }}>
                <CheckCircle2 size={36} color="#059669" style={{ margin: "0 auto 8px" }} />
                <h4 style={{ color: "#047857", fontWeight: 700, fontSize: "16px" }}>License Key Validated!</h4>
                <p style={{ color: "#065f46", fontSize: "13px", marginTop: "4px" }}>
                  Your system has been upgraded to <strong>{selectedPlanModal}</strong>.
                </p>
              </div>
            ) : (
              <form onSubmit={handleActivate} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569", display: "block", marginBottom: "4px" }}>
                    License Key or Promo Voucher:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. KRYTHOS-PRO-EVAL-2026"
                    className="input-field"
                    value={licenseKey}
                    onChange={(e) => setLicenseKey(e.target.value)}
                  />
                  <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
                    Tip: Enter <code>KRYTHOS-PRO-2026</code> to unlock evaluation tier.
                  </div>
                </div>

                <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                  <button
                    type="button"
                    onClick={() => setLicenseKey("KRYTHOS-PRO-2026")}
                    className="btn-secondary"
                    style={{ flex: 1, justifyContent: "center", fontSize: "12px" }}
                  >
                    Auto-Fill Demo Key
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    style={{ flex: 1, justifyContent: "center" }}
                  >
                    Activate License
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
