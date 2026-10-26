"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { UserSession } from "@/types";
import { DEMO_USERS } from "@/lib/mockData";

interface AuthContextType {
  currentUser: UserSession;
  switchUser: (userId: string) => void;
  availableUsers: UserSession[];
  isAuthenticated: boolean;
  logout: () => void;
  login: (pno: string, pin: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserSession>(DEMO_USERS[0]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);

  // Initialize from localStorage if available on mount
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        if (
          params.get("autologin") === "true" ||
          params.get("auto") === "1" ||
          params.get("login") === "true" ||
          params.has("autologin")
        ) {
          localStorage.removeItem("cms_demo_logged_out");
          const targetUserId =
            params.get("user") ||
            localStorage.getItem("haryana_police_cms_user") ||
            "usr_sho_1";
          const found =
            DEMO_USERS.find((u) => u.id === targetUserId) ||
            DEMO_USERS.find((u) => u.role === "SHO") ||
            DEMO_USERS[0];
          setCurrentUser(found);
          setIsAuthenticated(true);
          localStorage.setItem("haryana_police_cms_user", found.id);
          return;
        }
      }
      setIsAuthenticated(localStorage.getItem("cms_demo_logged_out") !== "true");
      const savedUserId = localStorage.getItem("haryana_police_cms_user");
      if (savedUserId) {
        const found = DEMO_USERS.find((u) => u.id === savedUserId);
        if (found && found.id !== currentUser.id) {
          setCurrentUser(found);
        }
      }
    } catch {}
  }, []);

  const switchUser = (userId: string) => {
    const found = DEMO_USERS.find((u) => u.id === userId);
    if (found) {
      setCurrentUser(found);
      setIsAuthenticated(true);
      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem("cms_demo_logged_out");
          localStorage.setItem("haryana_police_cms_user", userId);
          window.dispatchEvent(new CustomEvent("cms_user_switched", { detail: found }));
        } catch {}
      }
    }
  };

  const login = (pno: string, _pin: string) => {
    const clean = pno.trim().toLowerCase();
    const cleanAlphaNum = clean.replace(/[^a-z0-9]/gi, "");
    const found =
      DEMO_USERS.find(
        (u) =>
          u.pno.toLowerCase() === clean ||
          u.pno.toLowerCase().replace(/[^a-z0-9]/gi, "") === cleanAlphaNum ||
          u.pno.toLowerCase().endsWith(clean) ||
          clean.endsWith(u.pno.toLowerCase())
      ) || DEMO_USERS[0];
    setCurrentUser(found);
    setIsAuthenticated(true);
    localStorage.removeItem("cms_demo_logged_out");
    localStorage.setItem("haryana_police_cms_user", found.id);
    return true;
  };

  const logout = () => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("cms_demo_logged_out", "true");
        localStorage.removeItem("haryana_police_cms_user");
      } catch {}
    }
    setIsAuthenticated(false);
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        switchUser,
        availableUsers: DEMO_USERS,
        isAuthenticated,
        logout,
        login,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
