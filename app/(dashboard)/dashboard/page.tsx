"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  Boxes,
  Clock3,
  DollarSign,
} from "lucide-react";
import { getApiErrorMessage } from "@/lib/api-error";
import { useAuth } from "@/hooks/useAuth";
import {
  useGetDashboardStatsQuery,
  useGetLogsQuery,
  useGetOrdersQuery,
  useGetProductsQuery,
} from "@/store/api";

type StatsResponse = {
  totalOrdersToday: number;
  pendingOrders: number;
  completedOrders: number;
  lowStockCount: number;
  revenueToday: number;
  recentProducts: Array<{
    _id: string;
    name: string;
    stockQuantity: number;
    status: string;
  }>;
};

type Order = {
  _id: string;
  status?: string;
  totalPrice?: number;
  placedAt?: string;
  createdAt?: string;
};

type Product = {
  _id: string;
  name: string;
  category?: { _id?: string; name?: string } | string;
  stockQuantity: number;
  minStockThreshold: number;
  status?: string;
};

type Log = {
  _id: string;
  action: string;
  entityType?: string;
  createdAt: string;
  user?: { name?: string; email?: string };
};

type Trend = {
  totalOrdersToday: number;
  pendingOrders: number;
  lowStockCount: number;
  revenueToday: number;
};

type WeeklyPoint = {
  key: string;
  label: string;
  orders: number;
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
});

function buildWeekSeries(orders: Order[]): WeeklyPoint[] {
  const now = new Date();
  const days = Array.from({ length: 7 }, (_, idx) => {
    const date = new Date(now);
    date.setDate(now.getDate() - (6 - idx));
    return {
      key: date.toISOString().slice(0, 10),
      label: date.toLocaleDateString("en-US", { weekday: "short" }),
      orders: 0,
    };
  });

  const byKey = new Map(days.map((d) => [d.key, d]));
  for (const order of orders) {
    const raw = order.placedAt || order.createdAt;
    if (!raw) continue;
    const key = new Date(raw).toISOString().slice(0, 10);
    const bucket = byKey.get(key);
    if (bucket) bucket.orders += 1;
  }
  return days;
}

function formatTrend(value: number) {
  const sign = value >= 0 ? "↑" : "↓";
  return `${sign} ${Math.abs(value).toFixed(1)}%`;
}

function getStatusLabel(product: Product) {
  if (product.stockQuantity <= 0 || product.status === "Out of Stock") {
    return "Out of Stock";
  }
  if (product.stockQuantity <= product.minStockThreshold) {
    return "Low Stock";
  }
  return "Active";
}

function categoryName(product: Product) {
  if (!product.category) return "Uncategorized";
  if (typeof product.category === "string") return "Uncategorized";
  return product.category.name || "Uncategorized";
}

function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(target);
  const previousRef = useRef(target);

  useEffect(() => {
    const startValue = previousRef.current;
    const start = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      const next = startValue + (target - startValue) * eased;
      setValue(next);
      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      }
    };

    raf = requestAnimationFrame(tick);
    previousRef.current = target;
    return () => cancelAnimationFrame(raf);
  }, [duration, target]);

  return value;
}

function StatCard({
  title,
  value,
  trend,
  icon,
  accent,
  delay,
  valuePrefix,
}: {
  title: string;
  value: number;
  trend: number;
  icon: React.ReactNode;
  accent: "blue" | "amber" | "red" | "green";
  delay: number;
  valuePrefix?: string;
}) {
  const animated = useCountUp(value);
  const isPositive = trend >= 0;
  const valueText = valuePrefix
    ? `${valuePrefix}${Math.round(animated).toLocaleString()}`
    : Math.round(animated).toLocaleString();

  const accents = {
    blue: "bg-cyan-400/15 text-cyan-300 ring-cyan-400/30",
    amber: "bg-amber-400/15 text-amber-300 ring-amber-400/30",
    red: "bg-rose-400/15 text-rose-300 ring-rose-400/30",
    green: "bg-emerald-400/15 text-emerald-300 ring-emerald-400/30",
  };

  return (
    <article
      className="dash-stat-enter rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(0,0,0,0.32)]"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className={`rounded-xl p-2.5 ring-1 ${accents[accent]}`}>{icon}</div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
            isPositive
              ? "bg-emerald-400/15 text-emerald-300"
              : "bg-rose-400/15 text-rose-300"
          }`}
        >
          {formatTrend(trend)}
        </span>
      </div>
      <p className="text-sm text-slate-300">{title}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-white">{valueText}</p>
    </article>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();

  const {
    data: statsData,
    isLoading: statsLoading,
    error: statsError,
  } = useGetDashboardStatsQuery(undefined, { pollingInterval: 30_000 });
  const {
    data: ordersData,
    isLoading: ordersLoading,
    error: ordersError,
  } = useGetOrdersQuery(undefined, { pollingInterval: 30_000 });
  const {
    data: productsData,
    isLoading: productsLoading,
    error: productsError,
  } = useGetProductsQuery(undefined, { pollingInterval: 30_000 });
  const {
    data: logsData,
    isLoading: logsLoading,
    error: logsError,
  } = useGetLogsQuery({ limit: 5, page: 1 }, { pollingInterval: 30_000 });

  const stats = useMemo(
    () => (statsData ? (statsData as StatsResponse) : null),
    [statsData],
  );
  const orders = useMemo(
    () => (Array.isArray(ordersData) ? (ordersData as Order[]) : []),
    [ordersData],
  );
  const products = useMemo(
    () => (Array.isArray(productsData) ? (productsData as Product[]) : []),
    [productsData],
  );
  const logs = useMemo(
    () => (Array.isArray(logsData) ? (logsData as Log[]) : []),
    [logsData],
  );

  const loading = statsLoading || ordersLoading || productsLoading || logsLoading;
  const firstError = statsError || ordersError || productsError || logsError;
  const error = firstError
    ? getApiErrorMessage(firstError, "Unable to load dashboard data.")
    : null;

  const trends: Trend = {
    totalOrdersToday: 0,
    pendingOrders: 0,
    lowStockCount: 0,
    revenueToday: 0,
  };

  const weeklySeries = useMemo(() => buildWeekSeries(orders), [orders]);

  const orderStatusData = useMemo(() => {
    const counts = orders.reduce<Record<string, number>>((acc, order) => {
      const status = (order.status || "pending").toLowerCase();
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const rows = [
      {
        key: "confirmed",
        label: "Confirmed",
        value: counts.confirmed || 0,
        color: "#6366F1",
      },
      {
        key: "pending",
        label: "Pending",
        value: counts.pending || 0,
        color: "#F59E0B",
      },
      {
        key: "shipped",
        label: "Shipped",
        value: counts.shipped || 0,
        color: "#10B981",
      },
      {
        key: "cancelled",
        label: "Cancelled",
        value: counts.cancelled || 0,
        color: "#EF4444",
      },
    ];

    return rows.filter((row) => row.value > 0);
  }, [orders]);

  const topProducts = useMemo(() => {
    return [...products]
      .sort((a, b) => {
        const aWeight = a.stockQuantity <= a.minStockThreshold ? -1 : 1;
        const bWeight = b.stockQuantity <= b.minStockThreshold ? -1 : 1;
        if (aWeight !== bWeight) return aWeight - bWeight;
        return a.name.localeCompare(b.name);
      })
      .slice(0, 10);
  }, [products]);

  const todayLabel = useMemo(() => dateFormatter.format(new Date()), []);

  if (loading) {
    return <p className="text-slate-300">Loading dashboard...</p>;
  }

  if (error || !stats) {
    return (
      <div className="rounded-xl border border-rose-400/40 bg-rose-500/10 p-4 text-rose-200">
        {error || "Dashboard failed to load."}
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <section className="rounded-2xl border border-white/10 bg-gradient-to-r from-indigo-500/10 via-cyan-500/5 to-transparent p-5">
        <h2 className="dash-gradient-text text-3xl font-semibold tracking-tight">
          Good morning, {user?.name || "Operator"} 👋
        </h2>
        <p className="mt-1 text-sm text-slate-300">{todayLabel}</p>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Orders Today"
          value={stats.totalOrdersToday}
          trend={trends.totalOrdersToday}
          icon={<Boxes className="h-5 w-5" />}
          accent="blue"
          delay={70}
        />
        <StatCard
          title="Pending Orders"
          value={stats.pendingOrders}
          trend={trends.pendingOrders}
          icon={<Clock3 className="h-5 w-5" />}
          accent="amber"
          delay={130}
        />
        <StatCard
          title="Low Stock Items"
          value={stats.lowStockCount}
          trend={trends.lowStockCount}
          icon={<AlertTriangle className="h-5 w-5" />}
          accent="red"
          delay={190}
        />
        <StatCard
          title="Revenue Today"
          value={stats.revenueToday || 0}
          trend={trends.revenueToday}
          icon={<DollarSign className="h-5 w-5" />}
          accent="green"
          delay={250}
          valuePrefix="৳"
        />
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-5">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm xl:col-span-3">
          <h3 className="mb-4 text-lg font-semibold text-white">Orders This Week</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklySeries}>
                <defs>
                  <linearGradient id="ordersAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
                <XAxis dataKey="label" stroke="#94A3B8" tickLine={false} axisLine={false} />
                <YAxis
                  stroke="#94A3B8"
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ stroke: "rgba(99,102,241,0.45)", strokeWidth: 1 }}
                  contentStyle={{
                    background: "rgba(15, 23, 42, 0.95)",
                    border: "1px solid rgba(99, 102, 241, 0.35)",
                    borderRadius: "12px",
                  }}
                  labelStyle={{ color: "#E2E8F0", fontWeight: 600 }}
                  itemStyle={{ color: "#C7D2FE" }}
                />
                <Area
                  type="monotone"
                  dataKey="orders"
                  stroke="#818CF8"
                  strokeWidth={3}
                  fill="url(#ordersAreaGradient)"
                  dot={{ r: 3, strokeWidth: 0, fill: "#A5B4FC" }}
                  activeDot={{ r: 5, fill: "#6366F1" }}
                  animationDuration={1100}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm xl:col-span-2">
          <h3 className="mb-4 text-lg font-semibold text-white">Order Status Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  contentStyle={{
                    background: "rgba(15, 23, 42, 0.95)",
                    border: "1px solid rgba(99, 102, 241, 0.35)",
                    borderRadius: "12px",
                  }}
                  labelStyle={{ color: "#E2E8F0", fontWeight: 600 }}
                  itemStyle={{ color: "#CBD5E1" }}
                />
                <Pie
                  data={orderStatusData.length ? orderStatusData : [{ label: "No Data", value: 1, color: "#334155", key: "none" }]}
                  dataKey="value"
                  nameKey="label"
                  innerRadius={62}
                  outerRadius={94}
                  paddingAngle={2}
                  animationDuration={1000}
                  animationBegin={120}
                >
                  {(orderStatusData.length
                    ? orderStatusData
                    : [{ label: "No Data", value: 1, color: "#334155", key: "none" }]
                  ).map((entry) => (
                    <Cell key={entry.key} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {(orderStatusData.length
              ? orderStatusData
              : [{ key: "none", label: "No Data", value: 1, color: "#334155" }]
            ).map((segment) => (
              <div
                key={segment.key}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-slate-200"
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: segment.color }}
                />
                <span>{segment.label}</span>
                <span className="text-slate-400">{segment.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
        <h3 className="mb-4 text-lg font-semibold text-white">Product Stock Overview</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-slate-300">
                <th className="px-3 py-2 font-medium">Product</th>
                <th className="px-3 py-2 font-medium">Category</th>
                <th className="px-3 py-2 font-medium">Stock</th>
                <th className="px-3 py-2 font-medium">Threshold</th>
                <th className="px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-slate-400">
                    No products available.
                  </td>
                </tr>
              ) : (
                topProducts.map((product, index) => {
                const status = getStatusLabel(product);
                const outOfStock = status === "Out of Stock";
                const lowStock = status === "Low Stock";
                return (
                  <tr
                    key={product._id}
                    className={`border-b border-white/6 transition hover:bg-white/8 ${
                      index % 2 === 0 ? "bg-white/[0.02]" : ""
                    } ${
                      outOfStock
                        ? "border-l-2 border-l-rose-400/80"
                        : lowStock
                          ? "border-l-2 border-l-amber-400/80"
                          : "border-l-2 border-l-transparent"
                    }`}
                  >
                    <td className="px-3 py-3 font-medium text-slate-100">{product.name}</td>
                    <td className="px-3 py-3 text-slate-300">{categoryName(product)}</td>
                    <td className="px-3 py-3 text-slate-300">{product.stockQuantity}</td>
                    <td className="px-3 py-3 text-slate-300">{product.minStockThreshold}</td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          outOfStock
                            ? "bg-rose-400/20 text-rose-200"
                            : lowStock
                              ? "bg-amber-400/20 text-amber-200"
                              : "bg-emerald-400/20 text-emerald-200"
                        }`}
                      >
                        {status}
                      </span>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
          <Link href="/logs" className="text-sm font-medium text-indigo-300 hover:text-indigo-200">
            View All
          </Link>
        </div>

        {logs.length === 0 ? (
          <p className="text-sm text-slate-400">No recent activity logged.</p>
        ) : (
          <ol className="space-y-4">
            {logs.slice(0, 5).map((log, idx) => (
              <li key={log._id} className="relative pl-8">
                <span className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                {idx < logs.length - 1 ? (
                  <span className="absolute left-[4px] top-4 h-[calc(100%+0.75rem)] w-px bg-white/10" />
                ) : null}

                <p className="text-sm text-slate-100">
                  <span className="font-medium text-white">{log.action.replaceAll("_", " ")}</span>
                  {" "}by {log.user?.name || log.user?.email || "System"}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {new Date(log.createdAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
