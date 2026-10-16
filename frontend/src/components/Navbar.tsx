import React from "react";
import { Shield, Sparkles, LogOut, CreditCard, Globe, Sun, Moon } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { NavItem } from "./Sidebar";

interface NavbarProps {
  onNavigate?: (tab: NavItem) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header style={{
      height: "64px",
      backgroundColor: "#ffffff",
      borderBottom: "1px solid var(--border-color)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 24px",
      position: "sticky",
      top: 0,
      zIndex: 50,
      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)"
    }}>
      {/* Brand */}
      <div 
        style={{ display: "flex", alignItems: "center", gap: "12px", cursor: onNavigate ? "pointer" : "default" }}
        onClick={() => onNavigate && onNavigate("landing")}
      >
        <div style={{
          background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
          padding: "8px",
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 2px 8px rgba(16, 185, 129, 0.3)"
        }}>
          <Shield size={22} color="#ffffff" />
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: "17px", letterSpacing: "0.03em", color: "#0f172a" }}>
            KRYTHOS <span style={{ color: "var(--accent-emerald)", fontWeight: 700 }}>SOC</span>
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", letterSpacing: "0.02em" }}>
            Every Signal Connected. Every Threat Investigated.
          </div>
        </div>
      </div>

      {/* Center Links (Landing, Subscriptions) */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {onNavigate && (
          <>
            <button
              onClick={() => onNavigate("landing")}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-secondary)",
                fontSize: "13px",
                fontWeight: 600,
                padding: "6px 12px",
                borderRadius: "6px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.15s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--bg-secondary)";
                e.currentTarget.style.color = "var(--accent-emerald-dark)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "var(--text-secondary)";
              }}
            >
              <Globe size={15} />
              <span>Public Landing</span>
            </button>

            <button
              onClick={() => onNavigate("pricing")}
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                color: "var(--accent-emerald-dark)",
                fontSize: "13px",
                fontWeight: 600,
                padding: "6px 14px",
                borderRadius: "6px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.15s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(16, 185, 129, 0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "var(--bg-secondary)";
              }}
            >
              <CreditCard size={15} />
              <span>Subscriptions</span>
            </button>
          </>
        )}
      </div>

      {/* Right User & Status */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {/* Dark/Light Mode Switcher */}
        <button
          onClick={toggleTheme}
          title={theme === "dark" ? "Switch to Light Mode" : "Switch to Cyber Dark Mode"}
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-color)",
            borderRadius: "6px",
            padding: "5px 10px",
            color: "var(--accent-emerald)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "12px",
            fontWeight: 600,
            transition: "all 0.15s ease"
          }}
        >
          {theme === "dark" ? <Sun size={14} color="#34d399" /> : <Moon size={14} color="#059669" />}
          <span>{theme === "dark" ? "Light" : "Dark"}</span>
        </button>

        {/* Live Status Pill */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          fontSize: "12px",
          fontWeight: 600,
          color: "var(--accent-emerald-dark)",
          backgroundColor: "var(--bg-secondary)",
          padding: "5px 12px",
          borderRadius: "20px",
          border: "1px solid rgba(16, 185, 129, 0.3)"
        }}>
          <span style={{
            width: "7px",
            height: "7px",
            borderRadius: "50%",
            backgroundColor: "var(--accent-emerald)",
            boxShadow: "0 0 6px var(--accent-emerald)"
          }} />
          Local Engine Active
        </div>

        {/* User Info */}
        {user && (
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>
                {user.full_name || user.username}
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
                background: "#ffffff",
                border: "1px solid var(--border-color)",
                borderRadius: "6px",
                padding: "6px 10px",
                color: "var(--text-secondary)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "12px",
                fontWeight: 500,
                transition: "all 0.15s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#dc2626";
                e.currentTarget.style.borderColor = "#f87171";
                e.currentTarget.style.backgroundColor = "#fee2e2";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--text-secondary)";
                e.currentTarget.style.borderColor = "var(--border-color)";
                e.currentTarget.style.backgroundColor = "#ffffff";
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
