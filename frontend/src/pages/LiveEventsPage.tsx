import React, { useEffect, useState, useRef } from "react";
import {
  Play,
  Pause,
  Radio,
  Trash2,
  Activity,
  ShieldAlert,
  Terminal,
  Filter,
  CheckCircle,
  RefreshCw
} from "lucide-react";
import { api } from "../services/api";
import { SecurityEvent } from "../types";

export const LiveEventsPage: React.FC = () => {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [streamStatus, setStreamStatus] = useState<"connected" | "connecting" | "polling">("connecting");
  const [collectorInfo, setCollectorInfo] = useState<{
    running: boolean;
    source: string;
    events_captured: number;
    alerts_triggered: number;
    platform: string;
  } | null>(null);

  // Filters
  const [filterAction, setFilterAction] = useState("");
  const [filterOutcome, setFilterOutcome] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("");
  const [latestAlertToast, setLatestAlertToast] = useState<string | null>(null);

  const maxBuffer = 150;
  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;

  // Fetch collector status
  const loadCollectorStatus = async () => {
    try {
      const status = await api.getCollectorStatus();
      setCollectorInfo(status);
    } catch {
      // ignore
    }
  };

  // Initial load of latest events from DB
  const loadInitialEvents = async () => {
    try {
      const res = await api.getEvents({ page_size: 25, sort_by: "timestamp", sort_desc: true });
      if (res && res.items) {
        setEvents(res.items);
      }
    } catch (e) {
      console.error("Failed to load initial events", e);
    }
  };

  useEffect(() => {
    loadCollectorStatus();
    loadInitialEvents();

    const statusInterval = setInterval(loadCollectorStatus, 4000);

    // Setup Server-Sent Events (SSE) for true zero-latency push
    let es: EventSource | null = null;
    try {
      es = new EventSource("/api/v1/events/stream");

      es.onopen = () => {
        setStreamStatus("connected");
      };

      es.onmessage = (e) => {
        if (isPausedRef.current) return;
        try {
          const payload = JSON.parse(e.data);
          if (payload.type === "live_event" && payload.event) {
            const newEvt = payload.event as SecurityEvent;
            setEvents((prev) => {
              if (prev.some((item) => item.event_id === newEvt.event_id)) return prev;
              return [newEvt, ...prev].slice(0, maxBuffer);
            });

            // If alerts were generated with this live event
            if (payload.alerts && payload.alerts.length > 0) {
              const topAlert = payload.alerts[0];
              setLatestAlertToast(`🚨 ${topAlert.severity.toUpperCase()} ALERT: ${topAlert.title}`);
              setTimeout(() => setLatestAlertToast(null), 5000);
            }
          }
        } catch {
          // ignore keep-alives or non-JSON comments
        }
      };

      es.onerror = () => {
        setStreamStatus("polling");
      };
    } catch {
      setStreamStatus("polling");
    }

    // Polling fallback if SSE is disconnected
    const fallbackPoll = setInterval(async () => {
      if (streamStatus === "polling" && !isPausedRef.current) {
        try {
          const res = await api.getEvents({ page_size: 10, sort_by: "timestamp", sort_desc: true });
          if (res.items.length) {
            setEvents((prev) => {
              const existingIds = new Set(prev.map((e) => e.event_id));
              const newOnes = res.items.filter((item) => !existingIds.has(item.event_id));
              if (!newOnes.length) return prev;
              return [...newOnes, ...prev].slice(0, maxBuffer);
            });
          }
        } catch {
          // ignore
        }
      }
    }, 3000);

    return () => {
      if (es) es.close();
      clearInterval(statusInterval);
      clearInterval(fallbackPoll);
    };
  }, []);

  const filteredEvents = events.filter((evt) => {
    if (filterAction && !evt.action.toLowerCase().includes(filterAction.toLowerCase())) return false;
    if (filterOutcome && evt.outcome !== filterOutcome) return false;
    if (filterSeverity && evt.severity !== filterSeverity) return false;
    return true;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Alert Notification Toast */}
      {latestAlertToast && (
        <div style={{
          backgroundColor: "#fef2f2",
          border: "1px solid #ef4444",
          color: "#991b1b",
          padding: "12px 20px",
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          fontWeight: 600,
          boxShadow: "0 4px 12px rgba(239, 68, 68, 0.2)",
          animation: "slideDown 0.3s ease-out"
        }}>
          <ShieldAlert size={20} color="#ef4444" className="animate-pulse" />
          <span>{latestAlertToast}</span>
        </div>
      )}

      {/* Header & Controls */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
              <Radio size={22} color={isPaused ? "#94a3b8" : "#059669"} className={isPaused ? "" : "animate-pulse"} />
              Live Telemetry Stream
            </h1>
            <span style={{
              fontSize: "11px",
              fontWeight: 700,
              padding: "3px 8px",
              borderRadius: "12px",
              backgroundColor: streamStatus === "connected" ? "#ecfdf5" : "#fef3c7",
              color: streamStatus === "connected" ? "#047857" : "#b45309",
              border: `1px solid ${streamStatus === "connected" ? "#a7f3d0" : "#fde68a"}`
            }}>
              {streamStatus === "connected" ? "SSE REAL-TIME PUSH ACTIVE" : "STREAM SYNCING"}
            </span>
          </div>
          <p style={{ fontSize: "13px", color: "#64748b", marginTop: "2px" }}>
            Zero-delay security pipeline streaming kernel, auth, and terminal activity directly into your SOC.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={isPaused ? "btn-primary" : "btn-secondary"}
            style={{ fontSize: "12px", gap: "6px" }}
          >
            {isPaused ? <Play size={14} /> : <Pause size={14} />}
            <span>{isPaused ? "Resume Stream" : "Pause Stream"}</span>
          </button>

          <button
            onClick={() => setEvents([])}
            className="btn-secondary"
            style={{ fontSize: "12px", gap: "6px" }}
          >
            <Trash2 size={14} />
            <span>Clear Buffer</span>
          </button>
        </div>
      </div>

      {/* Live System Collector Status Banner */}
      <div className="card" style={{ padding: "16px 20px", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Activity size={18} color="#059669" className="animate-pulse" />
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#1e293b" }}>
                OS Watcher: {collectorInfo?.source || "systemd-journald"}
              </span>
            </div>
            <div style={{ fontSize: "12px", color: "#64748b" }}>
              Total Captured: <strong style={{ color: "#0f172a" }}>{collectorInfo?.events_captured ?? events.length}</strong> events
            </div>
            <div style={{ fontSize: "12px", color: "#64748b" }}>
              Alerts Triggered: <strong style={{ color: "#ef4444" }}>{collectorInfo?.alerts_triggered ?? 0}</strong>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#475569", backgroundColor: "#ffffff", padding: "6px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}>
            <Terminal size={14} color="#059669" />
            <span>Test live stream in terminal: <code style={{ backgroundColor: "#f1f5f9", padding: "2px 4px", borderRadius: "3px", fontWeight: 600 }}>sudo whoami</code></span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 600, color: "#475569" }}>
          <Filter size={14} color="#059669" /> Filter:
        </div>
        <input
          type="text"
          placeholder="Filter by action (e.g. sudo, ssh)..."
          className="input-field"
          style={{ width: "220px", padding: "6px 10px", fontSize: "12px" }}
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
        />
        <select
          className="input-field"
          style={{ width: "140px", padding: "6px 10px", fontSize: "12px" }}
          value={filterOutcome}
          onChange={(e) => setFilterOutcome(e.target.value)}
        >
          <option value="">All Outcomes</option>
          <option value="success">Success</option>
          <option value="failure">Failure</option>
          <option value="unknown">Unknown</option>
        </select>
        <select
          className="input-field"
          style={{ width: "140px", padding: "6px 10px", fontSize: "12px" }}
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value)}
        >
          <option value="">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
          <option value="informational">Informational</option>
        </select>
        {(filterAction || filterOutcome || filterSeverity) && (
          <button
            onClick={() => {
              setFilterAction("");
              setFilterOutcome("");
              setFilterSeverity("");
            }}
            className="btn-secondary"
            style={{ fontSize: "11px", padding: "4px 8px" }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Stream Table */}
      <div className="table-container">
        <table className="soc-table">
          <thead>
            <tr>
              <th>Timestamp (UTC)</th>
              <th>Host</th>
              <th>User</th>
              <th>Source IP</th>
              <th>Action</th>
              <th>Outcome</th>
              <th>Severity</th>
              <th>Raw Telemetry Snapshot</th>
            </tr>
          </thead>
          <tbody>
            {filteredEvents.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: "48px 20px", color: "#64748b" }}>
                  <Activity size={28} color="#059669" style={{ margin: "0 auto 10px", opacity: 0.7 }} className="animate-pulse" />
                  <div style={{ fontWeight: 600, color: "#1e293b", marginBottom: "4px" }}>
                    Live Telemetry Stream Listening...
                  </div>
                  <div style={{ fontSize: "12px" }}>
                    Perform any action in terminal (such as <code>sudo ls</code>) or wait for incoming system telemetry.
                  </div>
                </td>
              </tr>
            ) : (
              filteredEvents.map((evt) => (
                <tr key={evt.event_id} style={{ transition: "background-color 0.2s" }}>
                  <td style={{ color: "#475569", fontFamily: "JetBrains Mono, monospace", fontSize: "12px" }}>
                    {evt.timestamp ? new Date(evt.timestamp).toISOString().replace("T", " ").replace("Z", "") : "-"}
                  </td>
                  <td style={{ fontWeight: 600, color: "#0f172a" }}>{evt.host || "localhost"}</td>
                  <td style={{ color: "#059669", fontFamily: "JetBrains Mono, monospace", fontWeight: 600 }}>
                    {evt.username || "-"}
                  </td>
                  <td style={{ fontFamily: "JetBrains Mono, monospace", color: "#334155" }}>
                    {evt.source_ip || "-"}
                  </td>
                  <td style={{ fontFamily: "JetBrains Mono, monospace", fontWeight: 600 }}>
                    {evt.action}
                  </td>
                  <td>
                    <span style={{
                      fontWeight: 600,
                      color: evt.outcome === "success" ? "#059669" : evt.outcome === "failure" ? "#dc2626" : "#64748b"
                    }}>
                      {evt.outcome}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-${evt.severity}`}>{evt.severity}</span>
                  </td>
                  <td style={{ maxWidth: "340px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#64748b", fontSize: "11px", fontFamily: "JetBrains Mono, monospace" }}>
                    {evt.raw_payload || "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
