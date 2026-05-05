import { useState } from "react";

export interface AuthUser {
  id?: number;
  name: string;
  email: string;
  is_verified?: boolean;
}

function readAuth() {
  const token = localStorage.getItem("accessToken");
  const raw   = localStorage.getItem("user");
  if (!token || !raw) return { user: null as AuthUser | null, isAuthenticated: false };
  try {
    return { user: JSON.parse(raw) as AuthUser, isAuthenticated: true };
  } catch {
    return { user: null as AuthUser | null, isAuthenticated: false };
  }
}

export function useAuthUser() {
  // Pass an initializer function so readAuth() only runs once, not on every render
  const [user, setUser] = useState<AuthUser | null>(() => readAuth().user);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => readAuth().isAuthenticated);

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
