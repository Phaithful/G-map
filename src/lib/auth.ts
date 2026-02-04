export type AuthUser = {
  id: number | string;
  name: string;
  email: string;
  is_verified?: boolean;
};

type AuthPayload = {
  access: string;
  refresh?: string;
  user: AuthUser;
};

const KEY = "gmap_auth";

export function saveAuth(payload: AuthPayload) {
  localStorage.setItem(KEY, JSON.stringify(payload));
}

export function getAuth(): AuthPayload | null {
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthPayload;
  } catch {
    return null;
  }
}

export function getUser(): AuthUser | null {
  return getAuth()?.user ?? null;
}

export function getAccessToken(): string | null {
  return getAuth()?.access ?? null;
}

export function logout() {
  localStorage.removeItem(KEY);
}
