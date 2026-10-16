import React, { useEffect, useState } from "react";
import { Database, Plus, Download, Upload, ShieldCheck, X } from "lucide-react";
import { api } from "../services/api";
import { ThreatIndicator } from "../types";

export const ThreatIntelPage: React.FC = () => {
  const [iocs, setIocs] = useState<ThreatIndicator[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // New IOC form
  const [iocType, setIocType] = useState<"ip" | "domain" | "url" | "md5" | "sha256">("ip");
  const [iocValue, setIocValue] = useState("");
  const [threatType, setThreatType] = useState("c2_infrastructure");
  const [confidence, setConfidence] = useState(85);
  const [provenance, setProvenance] = useState("analyst_entry");
  const [description, setDescription] = useState("");

  const fetchIocs = async () => {
    setLoading(true);
    try {
      const data = await api.getIOCs();
      setIocs(data);
    } catch (e) {
      console.error("Failed to load IOCs", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIocs();
  }, []);

  const handleAddIoc = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.addIOC({
        ioc_type: iocType,
        value: iocValue.trim(),
        threat_type: threatType,
        confidence,
        provenance,
        description,
      });
      setShowAddModal(false);
      setIocValue("");
      setDescription("");
      fetchIocs();
    } catch (e: any) {
      alert(e.message || "Failed to add IOC");
    }
  };

  const handleExportCsv = () => {
    window.open("/api/v1/intelligence/iocs/export/csv", "_blank");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const fd = new FormData();
      fd.append("file", file);
      const token = localStorage.getItem("krythos_token");
      const res = await fetch("/api/v1/intelligence/iocs/import", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      const data = await res.json();
      alert(`Imported ${data.imported_count} indicators.`);
      fetchIocs();
    } catch (e) {
      alert("IOC file import failed");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Title & Actions */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)" }}>
            Local Threat Intelligence Store
          </h1>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "2px" }}>
            High-confidence indicators (IOCs) matched locally during log ingestion without external leakage
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <label className="btn-secondary" style={{ fontSize: "12px", cursor: "pointer" }}>
            <Upload size={14} />
            <span>Import IOC File</span>
            <input type="file" accept=".csv,.json" onChange={handleFileUpload} style={{ display: "none" }} />
          </label>

          <button onClick={handleExportCsv} className="btn-secondary" style={{ fontSize: "12px" }}>
            <Download size={14} />
            <span>Export CSV</span>
          </button>

          <button onClick={() => setShowAddModal(true)} className="btn-primary" style={{ fontSize: "12px" }}>
            <Plus size={14} />
            <span>Add Indicator</span>
          </button>
        </div>
      </div>

      {/* Local-First Privacy Guarantee Banner */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "10px 14px",
        borderRadius: "6px",
        background: "rgba(16, 185, 129, 0.1)",
        border: "1px solid rgba(16, 185, 129, 0.2)",
        fontSize: "12px",
        color: "#86efac"
      }}>
        <ShieldCheck size={16} color="var(--success)" />
        <span>
          <strong>Local-First Boundary Enforced:</strong> Indicators are matched strictly within the local KRYTHOS database. Telemetry and indicators are never sent to third-party cloud APIs.
        </span>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="soc-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Indicator Value</th>
              <th>Threat Type</th>
              <th>Confidence</th>
              <th>Provenance / Source</th>
              <th>Description</th>
              <th>First Seen</th>
              <th>Last Seen</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: "30px", color: "var(--text-muted)" }}>
                  Loading indicators...
                </td>
              </tr>
            ) : iocs.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: "30px", color: "var(--text-muted)" }}>
                  No indicators in store. Add or import IOCs to enable automatic match detections.
                </td>
              </tr>
            ) : (
              iocs.map((ioc) => (
                <tr key={ioc.id}>
                  <td>
                    <span className="badge badge-info" style={{ textTransform: "uppercase" }}>{ioc.ioc_type}</span>
                  </td>
                  <td style={{ fontFamily: "monospace", fontWeight: 600, color: "var(--accent-cyan)" }}>
                    {ioc.value}
                  </td>
                  <td style={{ textTransform: "capitalize", fontSize: "12px" }}>
                    {ioc.threat_type.replace("_", " ")}
                  </td>
                  <td style={{ fontSize: "12px" }}>{ioc.confidence}%</td>
                  <td style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{ioc.provenance}</td>
                  <td style={{ fontSize: "12px", color: "var(--text-muted)", maxWidth: "250px" }}>{ioc.description || "-"}</td>
                  <td style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "monospace" }}>
                    {new Date(ioc.first_seen).toISOString().slice(0, 10)}
                  </td>
                  <td style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "monospace" }}>
                    {new Date(ioc.last_seen).toISOString().slice(0, 10)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.75)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 100,
          padding: "20px"
        }}>
          <div style={{
            maxWidth: "480px",
            width: "100%",
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border-color)",
            borderRadius: "10px",
            padding: "24px"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#ffffff" }}>Add Threat Indicator</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddIoc} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                  Indicator Type
                </label>
                <select
                  value={iocType}
                  onChange={(e) => setIocType(e.target.value as any)}
                  className="input-field"
                >
                  <option value="ip">IP Address</option>
                  <option value="domain">Domain Name</option>
                  <option value="url">URL</option>
                  <option value="sha256">SHA256 File Hash</option>
                  <option value="md5">MD5 File Hash</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                  Indicator Value
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 198.51.100.99"
                  value={iocValue}
                  onChange={(e) => setIocValue(e.target.value)}
                  className="input-field"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                    Threat Type
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. c2_infrastructure"
                    value={threatType}
                    onChange={(e) => setThreatType(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div>
                  <label style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                    Confidence (1-100)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={confidence}
                    onChange={(e) => setConfidence(Number(e.target.value))}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                  Provenance / Feed Source
                </label>
                <input
                  type="text"
                  placeholder="e.g. internal_incident, blocklist_feed"
                  value={provenance}
                  onChange={(e) => setProvenance(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                  Description / Context
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cobalt Strike Command and Control node"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input-field"
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Indicator
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
