import type { AuthUser } from "@/types";

export const AUTH_TOKEN_KEY = "auth_token";
export const AUTH_USER_KEY = "auth_user";

function normalizeUser(value: Partial<AuthUser> | null): AuthUser | null {
  if (!value?.email) return null;

  return {
    id: value.id,
    name: value.name || "",
    email: value.email,
    role: value.role === "admin" ? "admin" : "manager",
  };
}

export function setTokenCookie(token: string) {
  if (typeof document === "undefined") return;

  const oneWeek = 60 * 60 * 24 * 7;
  document.cookie = `${AUTH_TOKEN_KEY}=${encodeURIComponent(token)}; Path=/; Max-Age=${oneWeek}; SameSite=Lax`;
}

export function clearTokenCookie() {
  if (typeof document === "undefined") return;

  document.cookie = `${AUTH_TOKEN_KEY}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function readStoredAuth() {
  if (typeof window === "undefined") {
    return { token: null as string | null, user: null as AuthUser | null };
  }

  const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
  const rawUser = window.localStorage.getItem(AUTH_USER_KEY);

  let user: AuthUser | null = null;

  if (rawUser) {
    try {
      user = normalizeUser(JSON.parse(rawUser) as Partial<AuthUser>);
    } catch {
      window.localStorage.removeItem(AUTH_USER_KEY);
    }
  }

  return { token, user };
}

export function persistAuth(token: string, user: AuthUser) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(AUTH_TOKEN_KEY, token);
    window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  }
  setTokenCookie(token);
}

export function clearStoredAuth() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
    window.localStorage.removeItem(AUTH_USER_KEY);
  }
  clearTokenCookie();
}
