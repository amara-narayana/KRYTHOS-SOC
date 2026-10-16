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
  HelpCircle,
  Zap,
  CreditCard,
  Globe
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export type NavItem =
  | "landing"
  | "dashboard"
  | "events"
  | "live"
  | "rules"
  | "alerts"
  | "cases"
  | "playbooks"
  | "entities"
  | "intel"
  | "attack"
  | "reports"
  | "pricing"
  | "admin"
  | "help";

interface SidebarProps {
  currentTab: NavItem;
  onSelectTab: (tab: NavItem) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === "Administrator";

  const mainNavItems = [
    { id: "dashboard", label: "Overview Dashboard", icon: LayoutDashboard },
    { id: "events", label: "Event Explorer", icon: Search },
    { id: "live", label: "Live Events Stream", icon: Radio },
    { id: "alerts", label: "Alert Queue", icon: Bell },
    { id: "cases", label: "Investigation Workbench", icon: Briefcase },
    { id: "playbooks", label: "Response Playbooks", icon: Zap },
    { id: "entities", label: "Entity Analytics", icon: Users },
    { id: "rules", label: "Detection Rules", icon: ShieldAlert },
    { id: "intel", label: "Threat Intelligence", icon: Database },
    { id: "attack", label: "MITRE ATT&CK", icon: Grid },
    { id: "reports", label: "Reports & Evidence", icon: FileText },
  ];

  const platformItems = [
    { id: "landing", label: "Public Landing Page", icon: Globe },
    { id: "pricing", label: "Subscription Plans", icon: CreditCard },
    ...(isAdmin ? [{ id: "admin", label: "Administration", icon: Settings }] : []),
    { id: "help", label: "Help & CLI Guide", icon: HelpCircle },
  ];

  const renderNavButton = (item: { id: string; label: string; icon: any }) => {
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
          padding: "9px 12px",
          borderRadius: "6px",
          border: "none",
          background: isActive ? "rgba(16, 185, 129, 0.12)" : "transparent",
          color: isActive ? "#047857" : "var(--text-secondary)",
          fontWeight: isActive ? 600 : 500,
          fontSize: "13px",
          cursor: "pointer",
          textAlign: "left",
          transition: "all 0.15s ease",
          width: "100%",
          borderLeft: isActive ? "3px solid #10b981" : "3px solid transparent"
        }}
        onMouseEnter={(e) => {
          if (!isActive) {
            e.currentTarget.style.backgroundColor = "var(--bg-secondary)";
            e.currentTarget.style.color = "#0f172a";
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = "var(--text-secondary)";
          }
        }}
      >
        <Icon size={16} color={isActive ? "#059669" : "var(--text-muted)"} />
        <span>{item.label}</span>
      </button>
    );
  };

  return (
    <aside style={{
      width: "240px",
      backgroundColor: "#ffffff",
      borderRight: "1px solid var(--border-color)",
      display: "flex",
      flexDirection: "column",
      padding: "16px 8px",
      minHeight: "calc(100vh - 64px)",
      gap: "4px",
      boxShadow: "1px 0 3px rgba(0, 0, 0, 0.02)"
    }}>
      <div style={{
        fontSize: "11px",
        fontWeight: 700,
        color: "var(--text-muted)",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        padding: "0 12px 6px 12px"
      }}>
        SOC Operations
      </div>

      {mainNavItems.map(renderNavButton)}

      <div style={{
        fontSize: "11px",
        fontWeight: 700,
        color: "var(--text-muted)",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        padding: "16px 12px 6px 12px",
        borderTop: "1px solid var(--border-color)",
        marginTop: "8px"
      }}>
        Platform & Commercial
      </div>

      {platformItems.map(renderNavButton)}
    </aside>
  );
};
