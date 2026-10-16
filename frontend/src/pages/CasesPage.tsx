import React, { useEffect, useState } from "react";
import {
  Briefcase,
  Plus,
  FileText,
  CheckSquare,
  MessageSquare,
  Paperclip,
  CheckCircle,
  ExternalLink,
  X
} from "lucide-react";
import { api } from "../services/api";
import { IncidentCase } from "../types";
import { useAuth } from "../context/AuthContext";

export const CasesPage: React.FC = () => {
  const { user } = useAuth();
  const [cases, setCases] = useState<IncidentCase[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCase, setSelectedCase] = useState<IncidentCase | null>(null);

  // New Case Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newSeverity, setNewSeverity] = useState("high");
  const [newPriority, setNewPriority] = useState("high");

  // Note input
  const [noteContent, setNoteContent] = useState("");

  // Findings & resolution update
  const [findings, setFindings] = useState("");
  const [resolution, setResolution] = useState("");

  const fetchCases = async () => {
    setLoading(true);
    try {
      const res = await api.getCases();
      setCases(res.items);
      if (selectedCase) {
        const fresh = res.items.find((c) => c.case_id === selectedCase.case_id);
        if (fresh) setSelectedCase(fresh);
      }
    } catch (e) {
      console.error("Failed to load cases", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await api.createCase({
        title: newTitle,
        description: newDesc,
        severity: newSeverity,
        priority: newPriority,
      });
      setShowCreateModal(false);
      setNewTitle("");
      setNewDesc("");
      fetchCases();
      setSelectedCase(created);
    } catch (e) {
      alert("Failed to create case");
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase || !noteContent.trim()) return;
    try {
      await api.addCaseNote(selectedCase.case_id, noteContent.trim());
      setNoteContent("");
      // Refresh case details
      const fresh = await api.getCaseDetail(selectedCase.case_id);
      setSelectedCase(fresh);
      fetchCases();
    } catch (e) {
      alert("Failed to add note");
    }
  };

  const handleToggleChecklist = async (taskIndex: number) => {
    if (!selectedCase || !selectedCase.checklist) return;
    const updatedChecklist = [...selectedCase.checklist];
    updatedChecklist[taskIndex].completed = !updatedChecklist[taskIndex].completed;

    try {
      const updated = await api.updateCase(selectedCase.case_id, { checklist: updatedChecklist });
      setSelectedCase(updated);
      fetchCases();
    } catch (e) {
      alert("Failed to update checklist");
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedCase) return;
    try {
      const updated = await api.updateCase(selectedCase.case_id, { status: newStatus });
      setSelectedCase(updated);
      fetchCases();
    } catch (e) {
      alert("Failed to update status");
    }
  };

  const handleSaveFindings = async () => {
    if (!selectedCase) return;
    try {
      const updated = await api.updateCase(selectedCase.case_id, {
        findings,
        resolution_summary: resolution,
      });
      setSelectedCase(updated);
      fetchCases();
      alert("Findings and resolution saved successfully.");
    } catch (e) {
      alert("Failed to save findings");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Title & Action */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)" }}>
            Investigation Workbench
          </h1>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "2px" }}>
            Case lifecycle management, evidence binding, checklist execution, and executive reporting
          </p>
        </div>

        <button onClick={() => setShowCreateModal(true)} className="btn-primary" style={{ fontSize: "13px" }}>
          <Plus size={16} />
          <span>New Incident Case</span>
        </button>
      </div>

      {/* Main Grid: Cases List on Left, Active Investigation on Right */}
      <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: "20px" }}>
        {/* Left Column: Cases List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase" }}>
            All Active Cases ({cases.length})
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "75vh", overflowY: "auto" }}>
            {cases.map((c) => {
              const isSelected = selectedCase?.case_id === c.case_id;
              return (
                <div
                  key={c.case_id}
                  onClick={() => {
                    setSelectedCase(c);
                    setFindings(c.findings || "");
                    setResolution(c.resolution_summary || "");
                  }}
                  className="card"
                  style={{
                    padding: "14px",
                    cursor: "pointer",
                    backgroundColor: isSelected ? "var(--bg-hover)" : "var(--bg-card)",
                    borderColor: isSelected ? "var(--accent-cyan)" : "var(--border-color)",
                    transition: "all 0.15s ease"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <span style={{ fontSize: "12px", fontFamily: "monospace", color: "var(--accent-cyan)", fontWeight: 600 }}>
                      {c.case_id}
                    </span>
                    <span className={`badge badge-${c.severity}`}>{c.severity}</span>
                  </div>

                  <div style={{ fontWeight: 600, fontSize: "14px", color: "#ffffff", marginBottom: "4px" }}>
                    {c.title}
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", color: "var(--text-muted)" }}>
                    <span style={{ textTransform: "uppercase", fontWeight: 600, color: c.status === "closed" ? "var(--text-muted)" : "var(--success)" }}>
                      {c.status}
                    </span>
                    <span>Assigned: {c.assigned_to || "Unassigned"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Case Deep Dive */}
        {selectedCase ? (
          <div className="card" style={{ display: "flex", flexDirection: "column", gap: "20px", maxHeight: "80vh", overflowY: "auto" }}>
            {/* Header info */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid var(--border-color)", paddingBottom: "16px" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                  <span style={{ fontSize: "13px", fontFamily: "monospace", color: "var(--accent-cyan)", fontWeight: 700 }}>
                    {selectedCase.case_id}
                  </span>
                  <span className={`badge badge-${selectedCase.severity}`}>{selectedCase.severity}</span>
                  <span className="badge badge-info">{selectedCase.priority} priority</span>
                </div>
                <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#ffffff" }}>
                  {selectedCase.title}
                </h2>
                <p style={{ fontSize: "13px", color: "#cbd5e1", marginTop: "4px" }}>
                  {selectedCase.description}
                </p>
              </div>

              {/* Status workflow selector & HTML report button */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-end" }}>
                <select
                  value={selectedCase.status}
                  onChange={(e) => handleUpdateStatus(e.target.value)}
                  className="input-field"
                  style={{ fontSize: "12px", width: "150px" }}
                >
                  <option value="new">Status: New</option>
                  <option value="investigating">Status: Investigating</option>
                  <option value="contained">Status: Contained</option>
                  <option value="resolved">Status: Resolved</option>
                  <option value="closed">Status: Closed</option>
                </select>

                <a
                  href={`/api/v1/cases/${selectedCase.case_id}/report.html`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary"
                  style={{ fontSize: "11px", padding: "6px 10px", gap: "4px" }}
                >
                  <FileText size={12} />
                  <span>Generate Report</span>
                  <ExternalLink size={10} />
                </a>
              </div>
            </div>

            {/* Investigation Checklist */}
            <div>
              <h3 style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
                <CheckSquare size={14} />
                <span>Investigation Checklist</span>
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {selectedCase.checklist?.map((item, idx) => (
                  <label
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      background: "var(--bg-secondary)",
                      fontSize: "13px",
                      cursor: "pointer"
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => handleToggleChecklist(idx)}
                      style={{ cursor: "pointer", accentColor: "var(--accent-cyan)" }}
                    />
                    <span style={{ textDecoration: item.completed ? "line-through" : "none", color: item.completed ? "var(--text-muted)" : "var(--text-primary)" }}>
                      {item.task}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Findings & Resolution summary */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                  Incident Findings
                </label>
                <textarea
                  rows={4}
                  className="input-field"
                  placeholder="Document verified attack vectors, affected accounts, blast radius..."
                  value={findings}
                  onChange={(e) => setFindings(e.target.value)}
                  style={{ resize: "vertical", fontSize: "12px" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                  Resolution Summary
                </label>
                <textarea
                  rows={4}
                  className="input-field"
                  placeholder="Containment actions applied, credentials rotated, firewall rules blocked..."
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  style={{ resize: "vertical", fontSize: "12px" }}
                />
              </div>

              <div style={{ gridColumn: "span 2", textAlign: "right" }}>
                <button onClick={handleSaveFindings} className="btn-secondary" style={{ fontSize: "12px", padding: "6px 14px" }}>
                  Save Findings & Resolution
                </button>
              </div>
            </div>

            {/* Attached Evidence Items */}
            <div>
              <h3 style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                <Paperclip size={14} />
                <span>Attached Evidence Artifacts ({selectedCase.evidence?.length || 0})</span>
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {selectedCase.evidence?.map((ev) => (
                  <div
                    key={ev.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      background: "var(--bg-secondary)",
                      fontSize: "12px"
                    }}
                  >
                    <div>
                      <span className="badge badge-info" style={{ marginRight: "8px" }}>{ev.evidence_type}</span>
                      <span style={{ fontFamily: "monospace", color: "var(--accent-cyan)" }}>{ev.evidence_reference}</span>
                      <span style={{ color: "var(--text-muted)", marginLeft: "10px" }}>{ev.description}</span>
                    </div>
                    <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>
                      {new Date(ev.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Analyst Notes Timeline */}
            <div>
              <h3 style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                <MessageSquare size={14} />
                <span>Analyst Notes & Activity Timeline</span>
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px" }}>
                {selectedCase.notes?.map((n) => (
                  <div
                    key={n.id}
                    style={{
                      padding: "10px 14px",
                      borderRadius: "6px",
                      background: "var(--bg-secondary)",
                      borderLeft: "3px solid var(--accent-cyan)",
                      fontSize: "13px"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{n.author_username}</span>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                        {new Date(n.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p style={{ color: "#cbd5e1" }}>{n.content}</p>
                  </div>
                ))}
              </div>

              {/* Add Note Form */}
              <form onSubmit={handleAddNote} style={{ display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  placeholder="Add analyst investigation note or progress update..."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  className="input-field"
                  style={{ fontSize: "13px" }}
                />
                <button type="submit" className="btn-primary" style={{ whiteSpace: "nowrap", padding: "8px 16px" }}>
                  Add Note
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", padding: "60px" }}>
            Select an incident case to view investigation details, timeline, and evidence.
          </div>
        )}
      </div>

      {/* New Case Modal */}
      {showCreateModal && (
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
            maxWidth: "500px",
            width: "100%",
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border-color)",
            borderRadius: "10px",
            padding: "24px"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#ffffff" }}>Create Incident Case</h3>
              <button onClick={() => setShowCreateModal(false)} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateCase} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                  Incident Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Unauthorized Sudo Execution on Production Cluster"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                  Initial Description
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe initial trigger telemetry and scope..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="input-field"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                    Severity
                  </label>
                  <select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value)}
                    className="input-field"
                  >
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                    Priority
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="input-field"
                  >
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Case
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
