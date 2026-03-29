"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import type { AuthUser } from "@/types";

const AUTH_TOKEN_KEY = "auth_token";
const AUTH_USER_KEY = "auth_user";

type AuthContextValue = {
  token: string | null;
  user: AuthUser | null;
  role: AuthUser["role"] | null;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/products",
  "/categories",
  "/orders",
  "/restock",
  "/logs",
];

const AUTH_PAGES = ["/login", "/signup"];

function setTokenCookie(token: string) {
  const oneWeek = 60 * 60 * 24 * 7;
  document.cookie = `${AUTH_TOKEN_KEY}=${encodeURIComponent(token)}; Path=/; Max-Age=${oneWeek}; SameSite=Lax`;
}

function clearTokenCookie() {
  document.cookie = `${AUTH_TOKEN_KEY}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const storedToken = window.localStorage.getItem(AUTH_TOKEN_KEY);
    const storedUser = window.localStorage.getItem(AUTH_USER_KEY);

    if (storedToken) {
      setToken(storedToken);
      setTokenCookie(storedToken);
    }

    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser) as Partial<AuthUser>;
        setUser(
          parsedUser && parsedUser.email
            ? {
                name: parsedUser.name || "",
                email: parsedUser.email,
                id: parsedUser.id,
                role: parsedUser.role === "admin" ? "admin" : "manager",
              }
            : null,
        );
      } catch {
        window.localStorage.removeItem(AUTH_USER_KEY);
      }
    }

    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || !pathname) return;

    const isProtectedRoute = PROTECTED_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    );
    const isAuthRoute = AUTH_PAGES.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`),
    );

    if (!token && isProtectedRoute) {
      router.replace("/login");
      return;
    }

    if (token && isAuthRoute) {
      router.replace("/dashboard");
    }
  }, [pathname, ready, router, token]);

  const login = useCallback(
    (nextToken: string, nextUser: AuthUser) => {
      const normalizedUser: AuthUser = {
        ...nextUser,
        role: nextUser.role === "admin" ? "admin" : "manager",
      };

      setToken(nextToken);
      setUser(normalizedUser);
      window.localStorage.setItem(AUTH_TOKEN_KEY, nextToken);
      window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(normalizedUser));
      setTokenCookie(nextToken);
      router.push("/dashboard");
    },
    [router],
  );

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
    window.localStorage.removeItem(AUTH_USER_KEY);
    clearTokenCookie();
    router.replace("/login");
  }, [router]);

  const isAuthenticated = useCallback(() => Boolean(token), [token]);
  const role = user?.role ?? null;

  const value = useMemo(
    () => ({ token, user, role, login, logout, isAuthenticated }),
    [token, user, role, login, logout, isAuthenticated],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
