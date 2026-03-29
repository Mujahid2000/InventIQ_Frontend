"use client";

import { useCallback, useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { clearStoredAuth, persistAuth } from "@/lib/auth-storage";
import { loginSuccess, logout as logoutAction } from "@/store/authSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import type { AuthUser } from "@/types";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/products",
  "/categories",
  "/orders",
  "/restock",
  "/logs",
];

const AUTH_PAGES = ["/login", "/signup"];

function normalizeUser(user: AuthUser): AuthUser {
  return {
    ...user,
    role: user.role === "admin" ? "admin" : "manager",
  };
}

function isProtectedRoute(pathname: string) {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function isAuthRoute(pathname: string) {
  return AUTH_PAGES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export function useAuth() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();

  const { token, user, initialized } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!initialized || !pathname) return;

    if (!token && isProtectedRoute(pathname)) {
      router.replace("/login");
      return;
    }

    if (token && isAuthRoute(pathname)) {
      router.replace("/dashboard");
    }
  }, [initialized, pathname, router, token]);

  const login = useCallback(
    (nextToken: string, nextUser: AuthUser) => {
      const normalizedUser = normalizeUser(nextUser);

      dispatch(loginSuccess({ token: nextToken, user: normalizedUser }));
      persistAuth(nextToken, normalizedUser);
      router.push("/dashboard");
    },
    [dispatch, router],
  );

  const logout = useCallback(() => {
    dispatch(logoutAction());
    clearStoredAuth();
    router.replace("/login");
  }, [dispatch, router]);

  const isAuthenticated = useCallback(() => Boolean(token), [token]);
  const role = user?.role ?? null;

  return useMemo(
    () => ({ token, user, role, login, logout, isAuthenticated, initialized }),
    [token, user, role, login, logout, isAuthenticated, initialized],
  );
}
