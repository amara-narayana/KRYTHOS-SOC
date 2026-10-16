import React, { useEffect, useState } from "react";
import { Search, Download, Filter, ChevronLeft, ChevronRight, Eye, X } from "lucide-react";
import { api } from "../services/api";
import { SecurityEvent } from "../types";

export const EventsPage: React.FC = () => {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [loading, setLoading] = useState(false);

  // Filters
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [severity, setSeverity] = useState("");
  const [outcome, setOutcome] = useState("");
  const [host, setHost] = useState("");
  const [username, setUsername] = useState("");

  // Inspect Modal
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);
  const [viewTab, setViewTab] = useState<"normalized" | "raw">("normalized");

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await api.getEvents({
        query,
        event_category: category,
        severity,
        outcome,
        host,
        username,
        page,
        page_size: pageSize,
      });
      setEvents(res.items);
      setTotal(res.total);
    } catch (e) {
      console.error("Failed to fetch events", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [page, pageSize, category, severity, outcome]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchEvents();
  };

  const handleExportCsv = () => {
    const qs = new URLSearchParams({
      query,
      event_category: category,
      severity,
      limit: "1000",
    }).toString();
    window.open(`/api/v1/events/export/csv?${qs}`, "_blank");
  };

  const totalPages = Math.max(Math.ceil(total / pageSize), 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Title & Actions */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)" }}>
            Event Explorer
          </h1>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "2px" }}>
            Search, filter, and inspect normalized security logs across all endpoints
          </p>
        </div>

        <button onClick={handleExportCsv} className="btn-secondary" style={{ fontSize: "12px", gap: "6px" }}>
          <Download size={14} />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: "16px" }}>
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Top text search */}
          <div style={{ display: "flex", gap: "10px" }}>
            <div style={{ position: "relative", flex: 1 }}>
              <Search size={16} color="var(--text-muted)" style={{ position: "absolute", left: "12px", top: "11px" }} />
              <input
                type="text"
                placeholder="Search raw payload, host, user, IP, action..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="input-field"
                style={{ paddingLeft: "36px" }}
              />
            </div>
            <button type="submit" className="btn-primary" style={{ padding: "8px 20px" }}>
              Search
            </button>
          </div>

          {/* Structured dropdown filters */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "10px" }}>
            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1); }}
              className="input-field"
              style={{ fontSize: "12px" }}
            >
              <option value="">All Categories</option>
              <option value="authentication">Authentication</option>
              <option value="privilege_escalation">Privilege Escalation</option>
              <option value="network">Network</option>
              <option value="process">Process</option>
              <option value="system">System</option>
            </select>

            <select
              value={severity}
              onChange={(e) => { setSeverity(e.target.value); setPage(1); }}
              className="input-field"
              style={{ fontSize: "12px" }}
            >
              <option value="">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
              <option value="informational">Informational</option>
            </select>

            <select
              value={outcome}
              onChange={(e) => { setOutcome(e.target.value); setPage(1); }}
              className="input-field"
              style={{ fontSize: "12px" }}
            >
              <option value="">All Outcomes</option>
              <option value="success">Success</option>
              <option value="failure">Failure</option>
              <option value="unknown">Unknown</option>
            </select>

            <input
              type="text"
              placeholder="Filter Host..."
              value={host}
              onChange={(e) => setHost(e.target.value)}
              className="input-field"
              style={{ fontSize: "12px" }}
            />

            <input
              type="text"
              placeholder="Filter User..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-field"
              style={{ fontSize: "12px" }}
            />
          </div>
        </form>
      </div>

      {/* Events Table */}
      <div className="table-container">
        <table className="soc-table">
          <thead>
            <tr>
              <th>Timestamp (UTC)</th>
              <th>Host</th>
              <th>User</th>
              <th>Source IP</th>
              <th>Category</th>
              <th>Action</th>
              <th>Outcome</th>
              <th>Severity</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} style={{ textAlign: "center", padding: "30px", color: "var(--text-muted)" }}>
                  Executing query...
                </td>
              </tr>
            ) : events.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: "center", padding: "30px", color: "var(--text-muted)" }}>
                  No security events found matching criteria.
                </td>
              </tr>
            ) : (
              events.map((evt) => (
                <tr key={evt.event_id}>
                  <td style={{ color: "var(--text-secondary)", fontFamily: "monospace", fontSize: "12px" }}>
                    {new Date(evt.timestamp).toISOString().replace("T", " ").replace("Z", "")}
                  </td>
                  <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>{evt.host || "-"}</td>
                  <td style={{ color: "var(--accent-cyan)", fontFamily: "monospace" }}>{evt.username || "-"}</td>
                  <td style={{ fontFamily: "monospace" }}>{evt.source_ip || "-"}</td>
                  <td style={{ textTransform: "capitalize" }}>{evt.event_category}</td>
                  <td style={{ fontFamily: "monospace" }}>{evt.action}</td>
                  <td>
                    <span style={{
                      fontWeight: 600,
                      color: evt.outcome === "success" ? "var(--success)" : evt.outcome === "failure" ? "var(--sev-critical)" : "var(--text-muted)"
                    }}>
                      {evt.outcome}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-${evt.severity}`}>{evt.severity}</span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      onClick={() => setSelectedEvent(evt)}
                      title="Inspect Normalized & Raw Event"
                      style={{
                        background: "transparent",
                        border: "1px solid var(--border-color)",
                        borderRadius: "4px",
                        color: "var(--text-secondary)",
                        padding: "4px 8px",
                        cursor: "pointer"
                      }}
                    >
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px", color: "var(--text-muted)" }}>
        <div>
          Showing {events.length ? (page - 1) * pageSize + 1 : 0} to{" "}
          {Math.min(page * pageSize, total)} of {total} events
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="btn-secondary"
            style={{ padding: "6px 10px" }}
          >
            <ChevronLeft size={14} />
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page >= totalPages}
            className="btn-secondary"
            style={{ padding: "6px 10px" }}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
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
            maxWidth: "750px",
            width: "100%",
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border-color)",
            borderRadius: "10px",
            padding: "24px",
            maxHeight: "85vh",
            display: "flex",
            flexDirection: "column"
          }}>
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "12px", marginBottom: "16px" }}>
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)" }}>
                  Event Inspection: <span style={{ color: "var(--accent-cyan)", fontFamily: "monospace" }}>{selectedEvent.event_id}</span>
                </h3>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                  {new Date(selectedEvent.timestamp).toUTCString()}
                </span>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            {/* View Toggle */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
              <button
                onClick={() => setViewTab("normalized")}
                className={viewTab === "normalized" ? "btn-primary" : "btn-secondary"}
                style={{ fontSize: "12px", padding: "4px 12px" }}
              >
                Normalized Schema
              </button>
              <button
                onClick={() => setViewTab("raw")}
                className={viewTab === "raw" ? "btn-primary" : "btn-secondary"}
                style={{ fontSize: "12px", padding: "4px 12px" }}
              >
                Raw Log Payload
              </button>
            </div>

            {/* Content Display */}
            <div style={{ flex: 1, overflowY: "auto", background: "var(--bg-primary)", padding: "16px", borderRadius: "6px", border: "1px solid var(--border-color)" }}>
              {viewTab === "normalized" ? (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "13px" }}>
                  <div><strong style={{ color: "var(--text-muted)" }}>Host:</strong> {selectedEvent.host || "-"}</div>
                  <div><strong style={{ color: "var(--text-muted)" }}>User:</strong> {selectedEvent.username || "-"}</div>
                  <div><strong style={{ color: "var(--text-muted)" }}>Source IP:</strong> {selectedEvent.source_ip || "-"}</div>
                  <div><strong style={{ color: "var(--text-muted)" }}>Dest IP:</strong> {selectedEvent.destination_ip || "-"}</div>
                  <div><strong style={{ color: "var(--text-muted)" }}>Category:</strong> {selectedEvent.event_category}</div>
                  <div><strong style={{ color: "var(--text-muted)" }}>Action:</strong> {selectedEvent.action}</div>
                  <div><strong style={{ color: "var(--text-muted)" }}>Outcome:</strong> {selectedEvent.outcome}</div>
                  <div><strong style={{ color: "var(--text-muted)" }}>Severity:</strong> {selectedEvent.severity}</div>
                  <div style={{ gridColumn: "span 2", marginTop: "10px" }}>
                    <strong style={{ color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Normalized Attributes (JSON):</strong>
                    <pre style={{ fontSize: "11px", color: "var(--accent-cyan)", overflowX: "auto" }}>
                      {JSON.stringify(selectedEvent.normalized_payload || {}, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <pre style={{ fontSize: "12px", color: "#f8fafc", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                  {selectedEvent.raw_payload || "No raw payload stored."}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
