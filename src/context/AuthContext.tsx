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

  // Initialize from localStorage if available
  useEffect(() => {
    const savedUserId = localStorage.getItem("haryana_police_cms_user");
    if (savedUserId) {
      const found = DEMO_USERS.find((u) => u.id === savedUserId);
      if (found) setCurrentUser(found);
    }
  }, []);

  const switchUser = (userId: string) => {
    const found = DEMO_USERS.find((u) => u.id === userId);
    if (found) {
      setCurrentUser(found);
      setIsAuthenticated(true);
      localStorage.setItem("haryana_police_cms_user", userId);
    }
  };

  const login = (pno: string, _pin: string) => {
    const found = DEMO_USERS.find((u) => u.pno === pno) || DEMO_USERS[0];
    setCurrentUser(found);
    setIsAuthenticated(true);
    localStorage.setItem("haryana_police_cms_user", found.id);
    return true;
  };

  const logout = () => {
    setIsAuthenticated(false);
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
