export type AuthUser = {
  id: number | string;
  name: string;
  email: string;
  is_verified?: boolean;
};

// Keys must stay in sync with useAuthUser.ts
const KEYS = {
  access:  "accessToken",
  refresh: "refreshToken",
  user:    "user",
} as const;

export function saveAuth(payload: { access: string; refresh?: string; user: AuthUser }) {
  localStorage.setItem(KEYS.access, payload.access);
  if (payload.refresh) localStorage.setItem(KEYS.refresh, payload.refresh);
  localStorage.setItem(KEYS.user, JSON.stringify(payload.user));
}

export function getAccessToken(): string | null {
  return localStorage.getItem(KEYS.access);
}

export function getUser(): AuthUser | null {
  const raw = localStorage.getItem(KEYS.user);
  if (!raw) return null;
  try { return JSON.parse(raw) as AuthUser; } catch { return null; }
}

export function logout() {
  localStorage.removeItem(KEYS.access);
  localStorage.removeItem(KEYS.refresh);
  localStorage.removeItem(KEYS.user);
}
