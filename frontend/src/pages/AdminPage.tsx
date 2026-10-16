import React, { useEffect, useState } from "react";
import { Settings, Users, Shield, Save, CheckCircle, AlertCircle } from "lucide-react";
import { api } from "../services/api";
import { User } from "../types";

export const AdminPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [settingsData, setSettingsData] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  // Settings form
  const [retentionDays, setRetentionDays] = useState(90);
  const [maxBatch, setMaxBatch] = useState(1000);
  const [aiEnabled, setAiEnabled] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [uList, sObj, aList] = await Promise.all([
        api.getUsers(),
        api.getSettings(),
        api.getAuditLogs(30),
      ]);
      setUsers(uList);
      setSettingsData(sObj);
      setRetentionDays(sObj.log_retention_days || 90);
      setMaxBatch(sObj.max_event_batch_size || 1000);
      setAiEnabled(sObj.ai_enabled);
      setAuditLogs(aList);
    } catch (e) {
      console.error("Failed to load admin data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChangeRole = async (userId: number, newRole: string) => {
    try {
      const updated = await api.updateUserRole(userId, newRole);
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
    } catch (e: any) {
      alert(e.message || "Failed to update role");
    }
  };

  const handleToggleActive = async (userId: number, currentStatus: boolean) => {
    try {
      const updated = await api.toggleUserActive(userId, !currentStatus);
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
    } catch (e: any) {
      alert(e.message || "Failed to toggle status");
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateSettings({
        log_retention_days: retentionDays,
        max_event_batch_size: maxBatch,
        ai_enabled: aiEnabled,
      });
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 3000);
      loadData();
    } catch (e) {
      alert("Failed to save settings");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Title */}
      <div>
        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)" }}>
          Platform Administration
        </h1>
        <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "2px" }}>
          Role-based access control, retention policies, and immutable system audit logging
        </p>
      </div>

      {savedMsg && (
        <div style={{
          backgroundColor: "rgba(16, 185, 129, 0.15)",
          border: "1px solid var(--success)",
          color: "#86efac",
          padding: "10px 14px",
          borderRadius: "6px",
          fontSize: "13px"
        }}>
          System operational settings saved successfully.
        </div>
      )}

      {/* Grid: User Management & System Configuration */}
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "20px" }}>
        {/* User Accounts Management */}
        <div className="card">
          <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
            <Users size={16} color="var(--accent-cyan)" />
            <span>User Accounts & RBAC</span>
          </h3>

          <div className="table-container">
            <table className="soc-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Full Name</th>
                  <th>Role Assignment</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Toggle</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>{u.username}</td>
                    <td style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{u.full_name}</td>
                    <td>
                      <select
                        value={u.role}
                        onChange={(e) => handleChangeRole(u.id, e.target.value)}
                        className="input-field"
                        style={{ fontSize: "12px", padding: "4px 8px" }}
                      >
                        <option value="Administrator">Administrator</option>
                        <option value="Analyst">Analyst</option>
                        <option value="Viewer">Viewer</option>
                      </select>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, fontSize: "12px", color: u.is_active ? "var(--success)" : "var(--sev-critical)" }}>
                        {u.is_active ? "Active" : "Deactivated"}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        onClick={() => handleToggleActive(u.id, u.is_active)}
                        className="btn-secondary"
                        style={{ fontSize: "11px", padding: "4px 8px" }}
                      >
                        {u.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* System Settings Form */}
        <div className="card">
          <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
            <Settings size={16} color="var(--accent-cyan)" />
            <span>Operational Policies</span>
          </h3>

          <form onSubmit={handleSaveSettings} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div>
              <label style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                Log Retention Limit (Days)
              </label>
              <input
                type="number"
                min="1"
                max="365"
                value={retentionDays}
                onChange={(e) => setRetentionDays(Number(e.target.value))}
                className="input-field"
              />
            </div>

            <div>
              <label style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                Max Ingestion Batch Size
              </label>
              <input
                type="number"
                min="10"
                max="5000"
                value={maxBatch}
                onChange={(e) => setMaxBatch(Number(e.target.value))}
                className="input-field"
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "4px" }}>
              <input
                type="checkbox"
                id="aiCheck"
                checked={aiEnabled}
                onChange={(e) => setAiEnabled(e.target.checked)}
                style={{ cursor: "pointer", accentColor: "var(--accent-cyan)" }}
              />
              <label htmlFor="aiCheck" style={{ fontSize: "13px", color: "var(--text-primary)", cursor: "pointer" }}>
                Enable Local AI Assistant (Ollama)
              </label>
            </div>

            <div style={{ marginTop: "12px" }}>
              <button type="submit" className="btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                <Save size={14} />
                <span>Save Operational Settings</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* System Audit Trail Table */}
      <div className="card">
        <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "12px" }}>
          Immutable Security Audit History
        </h3>
        <div className="table-container">
          <table className="soc-table">
            <thead>
              <tr>
                <th>Timestamp (UTC)</th>
                <th>Operator</th>
                <th>Action</th>
                <th>Resource Type</th>
                <th>Resource ID</th>
                <th>Source IP</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log) => (
                <tr key={log.id}>
                  <td style={{ fontFamily: "monospace", fontSize: "11px", color: "var(--text-muted)" }}>
                    {new Date(log.created_at).toISOString().replace("T", " ").slice(0, 19)}
                  </td>
                  <td style={{ fontWeight: 600, color: "var(--accent-cyan)" }}>{log.username}</td>
                  <td style={{ fontFamily: "monospace", fontSize: "12px" }}>{log.action}</td>
                  <td>{log.resource_type || "-"}</td>
                  <td style={{ fontFamily: "monospace", fontSize: "11px" }}>{log.resource_id || "-"}</td>
                  <td style={{ fontFamily: "monospace", fontSize: "11px" }}>{log.ip_address || "127.0.0.1"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
