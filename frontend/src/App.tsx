import React, { useState } from "react";
import { Shield, Sun, Moon } from "lucide-react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { Navbar } from "./components/Navbar";
import { Sidebar, NavItem } from "./components/Sidebar";

// Pages
import { LandingPage } from "./pages/LandingPage";
import { PricingPage } from "./pages/PricingPage";
import { PlaybooksPage } from "./pages/PlaybooksPage";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { EventsPage } from "./pages/EventsPage";
import { LiveEventsPage } from "./pages/LiveEventsPage";
import { RulesPage } from "./pages/RulesPage";
import { AlertsPage } from "./pages/AlertsPage";
import { CasesPage } from "./pages/CasesPage";
import { EntityPage } from "./pages/EntityPage";
import { ThreatIntelPage } from "./pages/ThreatIntelPage";
import { AttackMatrixPage } from "./pages/AttackMatrixPage";
import { ReportsPage } from "./pages/ReportsPage";
import { AdminPage } from "./pages/AdminPage";
import { HelpPage } from "./pages/HelpPage";

const MainLayout: React.FC = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [currentTab, setCurrentTab] = useState<NavItem>("dashboard");

  if (loading) {
    return (
      <div style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--bg-primary)",
        color: "var(--text-secondary)"
      }}>
        <div style={{
          width: "36px",
          height: "36px",
          border: "3px solid var(--border-color)",
          borderTopColor: "var(--accent-emerald)",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite"
        }} />
        <p style={{ marginTop: "16px", fontSize: "14px", fontWeight: 500 }}>Initializing KRYTHOS Security Engine...</p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Public unauthenticated view for Landing and Pricing
  if (!isAuthenticated) {
    if (currentTab === "landing") {
      return (
        <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-primary)" }}>
          <header style={{
            height: "64px",
            backgroundColor: "var(--bg-card)",
            borderBottom: "1px solid var(--border-color)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 28px",
            position: "sticky",
            top: 0,
            zIndex: 50
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }} onClick={() => setCurrentTab("landing")}>
              <div style={{ background: "linear-gradient(135deg, #059669 0%, #10b981 100%)", padding: "8px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Shield size={20} color="#ffffff" />
              </div>
              <span style={{ fontWeight: 800, fontSize: "17px", color: "var(--text-primary)" }}>KRYTHOS <span style={{ color: "var(--accent-emerald)" }}>SOC</span></span>
            </div>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <button
                onClick={toggleTheme}
                title="Toggle Theme"
                style={{
                  background: "var(--bg-hover)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "6px",
                  padding: "6px 12px",
                  color: "var(--accent-emerald)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "13px",
                  fontWeight: 600
                }}
              >
                {theme === "dark" ? <Sun size={15} color="#34d399" /> : <Moon size={15} color="#059669" />}
                <span>{theme === "dark" ? "Light" : "Dark"}</span>
              </button>
              <button onClick={() => setCurrentTab("pricing")} style={{ background: "transparent", border: "none", color: "var(--text-secondary)", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>Subscriptions</button>
              <button onClick={() => setCurrentTab("dashboard")} className="btn-primary" style={{ padding: "8px 18px", fontSize: "13px" }}>Sign In to Console</button>
            </div>
          </header>
          <div style={{ padding: "32px 24px" }}>
            <LandingPage onNavigate={setCurrentTab} />
          </div>
        </div>
      );
    }

    if (currentTab === "pricing") {
      return (
        <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-primary)" }}>
          <header style={{
            height: "64px",
            backgroundColor: "var(--bg-card)",
            borderBottom: "1px solid var(--border-color)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 28px",
            position: "sticky",
            top: 0,
            zIndex: 50
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }} onClick={() => setCurrentTab("landing")}>
              <div style={{ background: "linear-gradient(135deg, #059669 0%, #10b981 100%)", padding: "8px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Shield size={20} color="#ffffff" />
              </div>
              <span style={{ fontWeight: 800, fontSize: "17px", color: "var(--text-primary)" }}>KRYTHOS <span style={{ color: "var(--accent-emerald)" }}>SOC</span></span>
            </div>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <button
                onClick={toggleTheme}
                title="Toggle Theme"
                style={{
                  background: "var(--bg-hover)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "6px",
                  padding: "6px 12px",
                  color: "var(--accent-emerald)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "13px",
                  fontWeight: 600
                }}
              >
                {theme === "dark" ? <Sun size={15} color="#34d399" /> : <Moon size={15} color="#059669" />}
                <span>{theme === "dark" ? "Light" : "Dark"}</span>
              </button>
              <button onClick={() => setCurrentTab("landing")} style={{ background: "transparent", border: "none", color: "var(--text-secondary)", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>Overview</button>
              <button onClick={() => setCurrentTab("dashboard")} className="btn-primary" style={{ padding: "8px 18px", fontSize: "13px" }}>Sign In to Console</button>
            </div>
          </header>
          <div style={{ padding: "32px 24px" }}>
            <PricingPage onNavigate={setCurrentTab} />
          </div>
        </div>
      );
    }

    return <LoginPage />;
  }

  const renderContent = () => {
    switch (currentTab) {
      case "landing":
        return <LandingPage onNavigate={setCurrentTab} />;
      case "pricing":
        return <PricingPage onNavigate={setCurrentTab} />;
      case "playbooks":
        return <PlaybooksPage />;
      case "dashboard":
        return <DashboardPage onNavigate={setCurrentTab} />;
      case "events":
        return <EventsPage />;
      case "live":
        return <LiveEventsPage />;
      case "rules":
        return <RulesPage />;
      case "alerts":
        return <AlertsPage />;
      case "cases":
        return <CasesPage />;
      case "entities":
        return <EntityPage />;
      case "intel":
        return <ThreatIntelPage />;
      case "attack":
        return <AttackMatrixPage />;
      case "reports":
        return <ReportsPage />;
      case "admin":
        return user?.role === "Administrator" ? <AdminPage /> : <DashboardPage onNavigate={setCurrentTab} />;
      case "help":
        return <HelpPage />;
      default:
        return <DashboardPage onNavigate={setCurrentTab} />;
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "var(--bg-primary)" }}>
      <Navbar onNavigate={setCurrentTab} />
      <div style={{ display: "flex", flex: 1 }}>
        <Sidebar currentTab={currentTab} onSelectTab={setCurrentTab} />
        <main style={{
          flex: 1,
          padding: "24px 32px",
          overflowY: "auto",
          maxWidth: "1600px",
          margin: "0 auto",
          width: "calc(100vw - 240px)",
          boxSizing: "border-box"
        }}>
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainLayout />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
