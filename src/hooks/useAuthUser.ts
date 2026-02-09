import { useState } from "react";

export interface AuthUser {
  id?: number;
  name: string;
  email: string;
  is_verified?: boolean;
}

function readAuth() {
  const token = localStorage.getItem("accessToken");
  const storedUser = localStorage.getItem("user");

  if (!token || !storedUser) return { user: null as AuthUser | null, isAuthenticated: false };

  try {
    return { user: JSON.parse(storedUser) as AuthUser, isAuthenticated: true };
  } catch {
    return { user: null as AuthUser | null, isAuthenticated: false };
  }
}

export function useAuthUser() {
  const initial = readAuth();

  const [user, setUser] = useState<AuthUser | null>(initial.user);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(initial.isAuthenticated);

  const refreshFromStorage = () => {
    const next = readAuth();
    setUser(next.user);
    setIsAuthenticated(next.isAuthenticated);
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    setUser(null);
    setIsAuthenticated(false);
  };

  return { user, isAuthenticated, refreshFromStorage, logout };
}