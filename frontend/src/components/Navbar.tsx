import React from "react";
import { Shield, Activity, LogOut, User as UserIcon } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header style={{
      height: "60px",
      backgroundColor: "var(--bg-secondary)",
      borderBottom: "1px solid var(--border-color)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 24px",
      position: "sticky",
      top: 0,
      zIndex: 50
    }}>
      {/* Brand */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{
          background: "linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%)",
          padding: "8px",
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 0 16px rgba(14, 165, 233, 0.3)"
        }}>
          <Shield size={20} color="#ffffff" />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: "16px", letterSpacing: "0.05em", color: "#f8fafc" }}>
            KRYTHOS <span style={{ color: "var(--accent-cyan)", fontWeight: 400 }}>SOC</span>
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", letterSpacing: "0.02em" }}>
            Every Signal Connected. Every Threat Investigated.
          </div>
        </div>
      </div>

      {/* Right User & Status */}
      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        {/* Live Status Pill */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          fontSize: "12px",
          color: "var(--success)",
          backgroundColor: "rgba(16, 185, 129, 0.1)",
          padding: "4px 10px",
          borderRadius: "20px",
          border: "1px solid rgba(16, 185, 129, 0.2)"
        }}>
          <span style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            backgroundColor: "var(--success)",
            boxShadow: "0 0 8px var(--success)"
          }} />
          Local Engine Active
        </div>

        {/* User Info */}
        {user && (
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
                {user.full_name}
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "4px" }}>
                <span className={`badge ${
                  user.role === "Administrator" ? "badge-critical" :
                  user.role === "Analyst" ? "badge-high" : "badge-low"
                }`} style={{ fontSize: "10px", padding: "1px 6px" }}>
                  {user.role}
                </span>
              </div>
            </div>

            <button
              onClick={logout}
              title="Logout"
              style={{
                background: "transparent",
                border: "1px solid var(--border-color)",
                borderRadius: "6px",
                padding: "6px 10px",
                color: "var(--text-secondary)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "12px",
                transition: "all 0.15s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#f87171";
                e.currentTarget.style.borderColor = "#f87171";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--text-secondary)";
                e.currentTarget.style.borderColor = "var(--border-color)";
              }}
            >
              <LogOut size={14} />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
