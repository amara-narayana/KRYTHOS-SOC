import React, { useEffect, useState, useRef } from "react";
import { Play, Pause, Radio, Trash2, ArrowDownCircle } from "lucide-react";
import { api } from "../services/api";
import { SecurityEvent } from "../types";

export const LiveEventsPage: React.FC = () => {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [lastTimestamp, setLastTimestamp] = useState<string | null>(null);
  const maxBuffer = 100;
  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;

  const pollLatestEvents = async () => {
    if (isPausedRef.current) return;
    try {
      const res = await api.getEvents({ page_size: 15, sort_by: "timestamp", sort_desc: true });
      if (res.items.length) {
        setEvents((prev) => {
          const existingIds = new Set(prev.map((e) => e.event_id));
          const newOnes = res.items.filter((item) => !existingIds.has(item.event_id));
          if (!newOnes.length) return prev;
          const combined = [...newOnes, ...prev];
          return combined.slice(0, maxBuffer);
        });
        setLastTimestamp(new Date().toLocaleTimeString());
      }
    } catch (e) {
      console.error("Live events poll failed", e);
    }
  };

  useEffect(() => {
    pollLatestEvents();
    const interval = setInterval(pollLatestEvents, 3000); // Poll every 3 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Title & Controls */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
            <Radio size={20} color={isPaused ? "var(--text-muted)" : "var(--accent-cyan)"} className={isPaused ? "" : "animate-pulse"} />
            Live Ingestion Stream
          </h1>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "2px" }}>
            Real-time feed of arriving telemetry (Bounded buffer: {maxBuffer} events max)
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {lastTimestamp && (
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              Last poll: {lastTimestamp}
            </span>
          )}

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
              <th>Raw Snapshot</th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                  Waiting for incoming events... Start ingestion via CLI or upload logs.
                </td>
              </tr>
            ) : (
              events.map((evt) => (
                <tr key={evt.event_id}>
                  <td style={{ color: "var(--text-secondary)", fontFamily: "monospace", fontSize: "12px" }}>
                    {new Date(evt.timestamp).toISOString().replace("T", " ").replace("Z", "")}
                  </td>
                  <td style={{ fontWeight: 600 }}>{evt.host || "-"}</td>
                  <td style={{ color: "var(--accent-cyan)", fontFamily: "monospace" }}>{evt.username || "-"}</td>
                  <td style={{ fontFamily: "monospace" }}>{evt.source_ip || "-"}</td>
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
                  <td style={{ maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--text-muted)", fontSize: "11px" }}>
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
