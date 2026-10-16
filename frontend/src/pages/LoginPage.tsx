import React, { useState } from "react";
import { Shield, Lock, User as UserIcon, Mail, CheckCircle2, AlertCircle } from "lucide-react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";

export const LoginPage: React.FC = () => {
  const { bootstrapped, login, checkBootstrapStatus } = useAuth();
  const [mode, setMode] = useState<"login" | "register" | "bootstrap">(bootstrapped ? "login" : "bootstrap");
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (!bootstrapped) {
      setMode("bootstrap");
    }
  }, [bootstrapped]);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form fields
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === "bootstrap") {
        if (password !== passwordConfirm) {
          throw new Error("Passwords do not match");
        }
        await api.bootstrapAdmin({
          username,
          email,
          full_name: fullName,
          password,
          password_confirm: passwordConfirm,
        });
        await checkBootstrapStatus();
        setSuccessMsg("Administrator successfully created! Please log in.");
        setMode("login");
      } else if (mode === "register") {
        if (password !== passwordConfirm) {
          throw new Error("Passwords do not match");
        }
        await api.register({
          username,
          email,
          full_name: fullName,
          password,
          password_confirm: passwordConfirm,
        });
        setSuccessMsg("Registration successful! You may now log in with your credentials.");
        setMode("login");
      } else {
        const res = await api.login({
          username_or_email: username,
          password,
        });
        login(res.access_token, res.user);
      }
    } catch (err: any) {
      setError(err.message || "Operation failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "var(--bg-primary)",
      padding: "20px"
    }}>
      <div style={{
        maxWidth: "420px",
        width: "100%",
        backgroundColor: "#ffffff",
        border: "1px solid var(--border-color)",
        borderRadius: "12px",
        padding: "32px",
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)"
      }}>
        {/* Logo and Brand */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{
            width: "52px",
            height: "52px",
            background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
            borderRadius: "12px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 12px rgba(16, 185, 129, 0.35)",
            marginBottom: "12px"
          }}>
            <Shield size={26} color="#ffffff" />
          </div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", letterSpacing: "0.02em" }}>
            KRYTHOS <span style={{ color: "var(--accent-emerald)" }}>SOC</span>
          </h1>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
            Every Signal Connected. Every Threat Investigated.
          </p>
        </div>

        {/* First-Run Setup Banner */}
        {!bootstrapped && mode === "bootstrap" && (
          <div style={{
            backgroundColor: "#ecfdf5",
            border: "1px solid #10b981",
            borderRadius: "6px",
            padding: "12px",
            marginBottom: "20px",
            fontSize: "12px",
            color: "#065f46"
          }}>
            <strong>First-Run Setup:</strong> Initialize the primary system Administrator account.
          </div>
        )}

        {/* Mode Selector Tabs */}
        <div style={{
          display: "flex",
          backgroundColor: "var(--bg-secondary)",
          padding: "3px",
          borderRadius: "6px",
          marginBottom: "20px"
        }}>
          {!bootstrapped ? (
            <button
              type="button"
              style={{
                flex: 1,
                padding: "8px",
                border: "none",
                borderRadius: "4px",
                background: "rgba(14, 165, 233, 0.15)",
                color: "var(--accent-cyan)",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "default"
              }}
            >
              First-Run Administrator Setup
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => { setMode("login"); setError(null); }}
                style={{
                  flex: 1,
                  padding: "8px",
                  border: "none",
                  borderRadius: "4px",
                  background: mode === "login" ? "var(--bg-card)" : "transparent",
                  color: mode === "login" ? "var(--text-primary)" : "var(--text-secondary)",
                  fontSize: "13px",
                  fontWeight: mode === "login" ? 600 : 400,
                  cursor: "pointer"
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setMode("register"); setError(null); }}
                style={{
                  flex: 1,
                  padding: "8px",
                  border: "none",
                  borderRadius: "4px",
                  background: mode === "register" ? "var(--bg-card)" : "transparent",
                  color: mode === "register" ? "var(--text-primary)" : "var(--text-secondary)",
                  fontSize: "13px",
                  fontWeight: mode === "register" ? 600 : 400,
                  cursor: "pointer"
                }}
              >
                Register
              </button>
            </>
          )}
        </div>

        {error && (
          <div style={{
            backgroundColor: "rgba(239, 68, 68, 0.15)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            color: "#fca5a5",
            padding: "10px 14px",
            borderRadius: "6px",
            fontSize: "13px",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div style={{
            backgroundColor: "rgba(16, 185, 129, 0.15)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            color: "#86efac",
            padding: "10px 14px",
            borderRadius: "6px",
            fontSize: "13px",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {(mode === "register" || mode === "bootstrap") && (
            <>
              <div>
                <label style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="e.g. Jane Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  className="input-field"
                  placeholder="name@domain.local"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </>
          )}

          <div>
            <label style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
              {mode === "login" ? "Username or Email" : "Username"}
            </label>
            <input
              type="text"
              required
              className="input-field"
              placeholder={mode === "login" ? "Enter username or email" : "alphanumeric username"}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div>
            <label style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
              Password
            </label>
            <input
              type="password"
              required
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {(mode === "register" || mode === "bootstrap") && (
            <div>
              <label style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                Confirm Password
              </label>
              <input
                type="password"
                required
                className="input-field"
                placeholder="••••••••"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: "100%", justifyContent: "center", marginTop: "8px", height: "40px" }}
          >
            {loading ? "Processing..." : mode === "bootstrap" ? "Initialize Administrator" : mode === "register" ? "Create Account" : "Sign In to SOC"}
          </button>
        </form>
      </div>
    </div>
  );
};
