import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "../types";
import { api } from "../services/api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  bootstrapped: boolean;
  loading: boolean;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  checkBootstrapStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("krythos_token"));
  const [bootstrapped, setBootstrapped] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);

  const checkBootstrapStatus = async () => {
    try {
      const res = await api.getAuthStatus();
      setBootstrapped(res.bootstrapped);
    } catch (e) {
      // ignore
    }
  };

  const refreshUser = async () => {
    const savedToken = localStorage.getItem("krythos_token");
    if (!savedToken) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await api.getCurrentUser();
      setUser(me);
    } catch {
      localStorage.removeItem("krythos_token");
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        await Promise.all([checkBootstrapStatus(), refreshUser()]);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem("krythos_token", newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem("krythos_token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        bootstrapped,
        loading,
        isAuthenticated: !!token && !!user,
        login,
        logout,
        refreshUser,
        checkBootstrapStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
