import React from "react";
import {
  LayoutDashboard,
  Search,
  Radio,
  ShieldAlert,
  Bell,
  Briefcase,
  Users,
  Database,
  Grid,
  FileText,
  Settings,
  HelpCircle
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export type NavItem =
  | "dashboard"
  | "events"
  | "live"
  | "rules"
  | "alerts"
  | "cases"
  | "entities"
  | "intel"
  | "attack"
  | "reports"
  | "admin"
  | "help";

interface SidebarProps {
  currentTab: NavItem;
  onSelectTab: (tab: NavItem) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === "Administrator";

  const navItems = [
    { id: "dashboard", label: "Overview Dashboard", icon: LayoutDashboard },
    { id: "events", label: "Event Explorer", icon: Search },
    { id: "live", label: "Live Events Stream", icon: Radio },
    { id: "alerts", label: "Alert Queue", icon: Bell },
    { id: "cases", label: "Investigation Workbench", icon: Briefcase },
    { id: "entities", label: "Entity Analytics", icon: Users },
    { id: "rules", label: "Detection Rules", icon: ShieldAlert },
    { id: "intel", label: "Threat Intelligence", icon: Database },
    { id: "attack", label: "MITRE ATT&CK", icon: Grid },
    { id: "reports", label: "Reports & Evidence", icon: FileText },
    ...(isAdmin ? [{ id: "admin", label: "Administration", icon: Settings }] : []),
    { id: "help", label: "Help & CLI Guide", icon: HelpCircle },
  ];

  return (
    <aside style={{
      width: "240px",
      backgroundColor: "var(--bg-secondary)",
      borderRight: "1px solid var(--border-color)",
      display: "flex",
      flexDirection: "column",
      padding: "16px 8px",
      minHeight: "calc(100vh - 60px)",
      gap: "4px"
    }}>
      <div style={{
        fontSize: "11px",
        fontWeight: 600,
        color: "var(--text-muted)",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        padding: "0 12px 8px 12px"
      }}>
        Operations
      </div>

      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onSelectTab(item.id as NavItem)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 12px",
              borderRadius: "6px",
              border: "none",
              background: isActive ? "rgba(14, 165, 233, 0.15)" : "transparent",
              color: isActive ? "var(--accent-cyan-hover)" : "var(--text-secondary)",
              fontWeight: isActive ? 600 : 400,
              fontSize: "13px",
              cursor: "pointer",
              textAlign: "left",
              transition: "all 0.15s ease",
              width: "100%",
              borderLeft: isActive ? "3px solid var(--accent-cyan)" : "3px solid transparent"
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = "var(--bg-card)";
                e.currentTarget.style.color = "var(--text-primary)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "var(--text-secondary)";
              }
            }}
          >
            <Icon size={16} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </aside>
  );
};
