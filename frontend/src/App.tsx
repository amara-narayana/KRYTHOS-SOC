import React, { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Navbar } from "./components/Navbar";
import { Sidebar, NavItem } from "./components/Sidebar";

// Pages
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
          borderTopColor: "var(--accent-cyan)",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite"
        }} />
        <p style={{ marginTop: "16px", fontSize: "14px" }}>Initializing KRYTHOS Security Engine...</p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const renderContent = () => {
    switch (currentTab) {
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
      <Navbar />
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
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
};

export default App;
