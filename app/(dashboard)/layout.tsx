"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import {
  Bell,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  RefreshCcw,
  Search,
  ShoppingCart,
  Tags,
  X,
} from "lucide-react";
import { Toaster } from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta-dashboard",
});

const navLinks = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Products", href: "/products", icon: Package },
  { label: "Categories", href: "/categories", icon: Tags },
  { label: "Orders", href: "/orders", icon: ShoppingCart },
  { label: "Restock Queue", href: "/restock", icon: RefreshCcw },
  { label: "Activity Log", href: "/logs", icon: ClipboardList },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function routeTitle(pathname: string) {
  if (pathname.startsWith("/dashboard")) return "Dashboard Overview";
  if (pathname.startsWith("/products")) return "Products";
  if (pathname.startsWith("/categories")) return "Categories";
  if (pathname.startsWith("/orders")) return "Orders";
  if (pathname.startsWith("/restock")) return "Restock Queue";
  if (pathname.startsWith("/logs")) return "Activity Log";
  return "InventIQ";
}

function initials(name?: string) {
  if (!name) return "IQ";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() || "").join("");
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, role, logout } = useAuth();
  const title = routeTitle(pathname);
  const avatar = initials(user?.name);
  const roleLabel = role === "admin" ? "Admin" : "Manager";

  return (
    <div
      className={`${jakarta.variable} min-h-screen bg-[#161B22] text-slate-100`}
      style={{ fontFamily: "var(--font-plus-jakarta-dashboard), sans-serif" }}
    >
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close menu overlay"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-30 bg-[#020409]/55 backdrop-blur-[1px] transition md:hidden"
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-[260px] border-r border-white/10 bg-[#0D1117] transition-transform duration-300 ease-out md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-indigo-400/80 via-indigo-400/40 to-transparent" />

        <div className="flex h-full flex-col px-4 pb-4 pt-5">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="relative grid h-10 w-10 place-items-center rounded-xl bg-indigo-500/20 text-indigo-200 ring-1 ring-indigo-400/40">
                <span className="text-sm font-bold">IQ</span>
                <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(74,222,128,0.7)]" />
              </div>
              <div>
                <p className="text-base font-semibold text-white">InventIQ</p>
                <p className="text-xs text-slate-400">Operational Control</p>
              </div>
            </div>

            <button
              type="button"
              className="inline-flex rounded-md p-2 text-slate-400 hover:bg-white/10 hover:text-white md:hidden"
              onClick={() => setMobileOpen(false)}
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="space-y-1.5">
            {navLinks.map((link, index) => {
              const active = isActive(pathname, link.href);
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`dash-nav-enter group relative flex items-center gap-3 rounded-xl border-l-2 px-3 py-2.5 text-sm font-medium transition-all duration-300 ${
                    active
                      ? "border-indigo-400 bg-indigo-500/25 text-white shadow-[inset_0_0_0_1px_rgba(99,102,241,0.35)]"
                      : "border-transparent text-slate-300 hover:border-indigo-400/50 hover:bg-white/6 hover:text-white"
                  }`}
                  style={{ animationDelay: `${120 + index * 60}ms` }}
                >
                  <Icon
                    className={`h-4 w-4 transition-transform duration-300 ${
                      active ? "text-indigo-200" : "text-slate-400 group-hover:scale-105"
                    }`}
                  />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm">
            <div className="mb-3 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-700 text-sm font-bold text-slate-100">
                {avatar}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">
                  {user?.name || "Inventory Admin"}
                </p>
                <span className="mt-1 inline-flex rounded-full border border-indigo-300/35 bg-indigo-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-200">
                  {user?.role || "manager"}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={logout}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-800/85 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-700 hover:text-white"
            >
              <LogOut className="h-3.5 w-3.5" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      <div className="md:pl-[260px]">
        <header className="sticky top-0 z-20 border-b border-white/10 bg-[#161B22]/85 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                className="inline-flex rounded-md border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10 hover:text-white md:hidden"
                onClick={() => setMobileOpen((v) => !v)}
                aria-label="Toggle menu"
              >
                <Menu className="h-5 w-5" />
              </button>

              <h1 className="truncate text-base font-semibold text-white sm:text-lg">
                {title}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative hidden md:block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  placeholder="Search inventory, products, orders..."
                  className="w-72 rounded-lg border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <button
                type="button"
                aria-label="Notifications"
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.9)]" />
              </button>

              <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2.5 py-1.5 sm:flex">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-indigo-500/30 text-xs font-semibold text-indigo-100">
                  {avatar}
                </span>
                <div className="flex min-w-0 items-center gap-2">
                  <span className="max-w-[120px] truncate text-sm text-slate-200">
                    {user?.name || "User"}
                  </span>
                  <span className="inline-flex rounded-full border border-indigo-300/35 bg-indigo-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-200">
                    {roleLabel}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main key={pathname} className="dash-page-enter p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#111827",
            color: "#E5E7EB",
            border: "1px solid rgba(99, 102, 241, 0.25)",
          },
        }}
      />
    </div>
  );
}
