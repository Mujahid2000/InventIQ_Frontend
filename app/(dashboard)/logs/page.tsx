"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Clock3,
  CopyCheck,
  FileClock,
  MinusCircle,
  Package,
  PlusCircle,
  ShoppingCart,
  SlidersHorizontal,
  Terminal,
  Trash2,
  User,
} from "lucide-react";
import toast from "react-hot-toast";
import { getApiErrorMessage } from "@/lib/api-error";
import { useLazyGetLogsQuery } from "@/store/api";

const PAGE_SIZE = 10;

type ActivityLog = {
  _id: string;
  action: string;
  entityType?: string;
  createdAt: string;
  details?: Record<string, unknown>;
  user?: {
    name?: string;
    email?: string;
  };
};

function getErrorMessage(error: unknown, fallback: string) {
  return getApiErrorMessage(error, fallback);
}

function formatAction(action: string) {
  return action
    .split("_")
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");
}

function formatRelativeTime(dateValue: string) {
  const now = Date.now();
  const then = new Date(dateValue).getTime();
  const diffSeconds = Math.max(0, Math.floor((now - then) / 1000));

  if (diffSeconds < 60) return `${diffSeconds}s ago`;
  const minutes = Math.floor(diffSeconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function dayLabel(dateValue: string) {
  const date = new Date(dateValue);
  const now = new Date();

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (target.getTime() === today.getTime()) return "Today";
  if (target.getTime() === yesterday.getTime()) return "Yesterday";

  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function compactEntityName(log: ActivityLog) {
  const details = log.details || {};
  const primaryId =
    (typeof details.product === "string" && details.product) ||
    (typeof details.order === "string" && details.order) ||
    (typeof details.category === "string" && details.category) ||
    (typeof details.entity === "string" && details.entity) ||
    (typeof details.id === "string" && details.id) ||
    "";

  const entityLabel =
    (log.entityType || "record").charAt(0).toUpperCase() +
    (log.entityType || "record").slice(1);

  if (!primaryId) return entityLabel;
  return `${entityLabel} #${primaryId.slice(-6)}`;
}

function actionMeta(action: string) {
  const normalized = action.toLowerCase();

  if (normalized.includes("delete") || normalized.includes("cancel")) {
    return {
      Icon: Trash2,
      dotClass: "bg-red-400",
      chipClass: "border-red-400/30 bg-red-500/10 text-red-200",
      textClass: "text-red-200",
    };
  }

  if (normalized.includes("create")) {
    return {
      Icon: PlusCircle,
      dotClass: "bg-emerald-400",
      chipClass: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
      textClass: "text-emerald-200",
    };
  }

  if (normalized.includes("restock") || normalized.includes("status") || normalized.includes("update")) {
    return {
      Icon: SlidersHorizontal,
      dotClass: "bg-amber-300",
      chipClass: "border-amber-300/30 bg-amber-500/10 text-amber-200",
      textClass: "text-amber-200",
    };
  }

  if (normalized.includes("order")) {
    return {
      Icon: ShoppingCart,
      dotClass: "bg-cyan-300",
      chipClass: "border-cyan-300/30 bg-cyan-500/10 text-cyan-200",
      textClass: "text-cyan-200",
    };
  }

  if (normalized.includes("product")) {
    return {
      Icon: Package,
      dotClass: "bg-indigo-300",
      chipClass: "border-indigo-300/30 bg-indigo-500/10 text-indigo-200",
      textClass: "text-indigo-200",
    };
  }

  if (normalized.includes("category")) {
    return {
      Icon: Box,
      dotClass: "bg-fuchsia-300",
      chipClass: "border-fuchsia-300/30 bg-fuchsia-500/10 text-fuchsia-200",
      textClass: "text-fuchsia-200",
    };
  }

  if (normalized.includes("approve") || normalized.includes("verify")) {
    return {
      Icon: CopyCheck,
      dotClass: "bg-emerald-300",
      chipClass: "border-emerald-300/30 bg-emerald-500/10 text-emerald-200",
      textClass: "text-emerald-200",
    };
  }

  if (normalized.includes("revert") || normalized.includes("rollback")) {
    return {
      Icon: MinusCircle,
      dotClass: "bg-orange-300",
      chipClass: "border-orange-300/30 bg-orange-500/10 text-orange-200",
      textClass: "text-orange-200",
    };
  }

  return {
    Icon: FileClock,
    dotClass: "bg-slate-300",
    chipClass: "border-slate-300/25 bg-slate-500/10 text-slate-200",
    textClass: "text-slate-200",
  };
}

export default function LogsPage() {
  const [getLogsRequest] = useLazyGetLogsQuery();

  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [newEntryIds, setNewEntryIds] = useState<string[]>([]);

  const knownIdsRef = useRef<Set<string>>(new Set());
  const hasFetchedRef = useRef(false);
  const timeoutsRef = useRef<number[]>([]);

  const trackNewEntries = useCallback((incoming: ActivityLog[]) => {
    if (!hasFetchedRef.current) {
      knownIdsRef.current = new Set(incoming.map((item) => item._id));
      hasFetchedRef.current = true;
      return;
    }

    const newIds = incoming
      .map((item) => item._id)
      .filter((id) => !knownIdsRef.current.has(id));

    if (newIds.length > 0) {
      setNewEntryIds((prev) => Array.from(new Set([...prev, ...newIds])));

      const timeoutId = window.setTimeout(() => {
        setNewEntryIds((prev) => prev.filter((id) => !newIds.includes(id)));
      }, 2200);

      timeoutsRef.current.push(timeoutId);
    }

    knownIdsRef.current = new Set([...knownIdsRef.current, ...incoming.map((item) => item._id)]);
  }, []);

  const fetchLogs = useCallback(
    async (pageToKeep = 1, showLoader = true) => {
      try {
        if (showLoader) setLoading(true);
        const limit = pageToKeep * PAGE_SIZE;
        const data = await getLogsRequest({ limit, page: 1 }).unwrap();
        const normalized = (Array.isArray(data) ? data : []) as ActivityLog[];
        trackNewEntries(normalized);
        setLogs(normalized);
        setPage(pageToKeep);
        setHasMore(normalized.length >= limit);
      } catch (error: unknown) {
        toast.error(getErrorMessage(error, "Failed to load activity logs."));
      } finally {
        if (showLoader) setLoading(false);
      }
    },
    [getLogsRequest, trackNewEntries],
  );

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore) return;

    const nextPage = page + 1;
    try {
      setLoadingMore(true);
      const data = await getLogsRequest({ limit: PAGE_SIZE, page: nextPage }).unwrap();
      const nextChunk = (Array.isArray(data) ? data : []) as ActivityLog[];

      setLogs((prev) => {
        const seen = new Set(prev.map((item) => item._id));
        const merged = [...prev, ...nextChunk.filter((item) => !seen.has(item._id))];
        knownIdsRef.current = new Set(merged.map((item) => item._id));
        return merged;
      });

      setPage(nextPage);
      setHasMore(nextChunk.length === PAGE_SIZE);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to load more logs."));
    } finally {
      setLoadingMore(false);
    }
  }, [getLogsRequest, hasMore, loadingMore, page]);

  useEffect(() => {
    fetchLogs(1, true);
  }, [fetchLogs]);

  useEffect(() => {
    if (!autoRefresh) return;

    const timer = window.setInterval(() => {
      fetchLogs(page, false);
    }, 30_000);

    return () => window.clearInterval(timer);
  }, [autoRefresh, fetchLogs, page]);

  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
      timeoutsRef.current = [];
    };
  }, [fetchLogs]);

  const groupedLogs = useMemo(() => {
    const map = new Map<string, ActivityLog[]>();
    logs.forEach((log) => {
      const label = dayLabel(log.createdAt);
      if (!map.has(label)) map.set(label, []);
      map.get(label)?.push(log);
    });
    return Array.from(map.entries()).map(([label, items]) => ({ label, items }));
  }, [logs]);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-white/10 bg-[#0d1520] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.35)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="inline-flex rounded-xl border border-cyan-400/25 bg-cyan-500/10 p-2.5 text-cyan-200">
              <Terminal className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-mono text-2xl font-semibold text-slate-100">Activity Stream</h1>
              <p className="text-xs text-slate-400">Live operational timeline</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAutoRefresh((prev) => !prev)}
              className={`relative inline-flex h-9 items-center rounded-full border px-2 text-xs font-semibold transition ${
                autoRefresh
                  ? "border-emerald-300/35 bg-emerald-500/15 text-emerald-200"
                  : "border-white/15 bg-white/[0.04] text-slate-300"
              }`}
            >
              <span
                className={`mr-2 h-4 w-4 rounded-full transition ${
                  autoRefresh ? "bg-emerald-300" : "bg-slate-500"
                }`}
              />
              Auto refresh {autoRefresh ? "ON" : "OFF"}
            </button>
            <button
              type="button"
              onClick={() => fetchLogs(page, true)}
              className="rounded-xl border border-white/15 bg-white/[0.03] px-3 py-2 text-sm text-slate-200 hover:bg-white/[0.08]"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#0b1119] p-4 md:p-5">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="h-20 animate-pulse rounded-xl border border-white/10 bg-white/5" />
            ))}
          </div>
        ) : groupedLogs.length === 0 ? (
          <p className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-slate-400">
            No recent logs found.
          </p>
        ) : (
          <div className="space-y-6">
            {groupedLogs.map((group) => (
              <section key={group.label}>
                <div className="mb-3 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.16em] text-slate-400">
                  <span className="h-px flex-1 bg-gradient-to-r from-cyan-400/20 to-transparent" />
                  {group.label}
                  <span className="h-px flex-1 bg-gradient-to-l from-cyan-400/20 to-transparent" />
                </div>

                <ol className="relative ml-1 space-y-3 border-l border-white/10 pl-5">
                  {group.items.map((log) => {
                    const meta = actionMeta(log.action || "");
                    const Icon = meta.Icon;
                    const isNew = newEntryIds.includes(log._id);

                    return (
                      <li
                        key={log._id}
                        className={`relative rounded-xl border border-white/10 bg-white/[0.03] p-3.5 transition ${
                          isNew ? "log-entry-new border-cyan-300/45" : ""
                        }`}
                      >
                        <span className={`absolute -left-[25px] top-5 h-3.5 w-3.5 rounded-full border-2 border-[#0b1119] ${meta.dotClass}`} />

                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="font-mono text-sm font-semibold text-slate-100">
                              <span className={meta.textClass}>{formatAction(log.action || "activity")}</span>{" "}
                              <span className="text-slate-300">{compactEntityName(log)}</span>
                            </p>
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                              <span
                                className="inline-flex items-center gap-1 text-slate-400"
                                title={new Date(log.createdAt).toLocaleString()}
                              >
                                <Clock3 className="h-3.5 w-3.5" />
                                {formatRelativeTime(log.createdAt)}
                              </span>
                              <span className="inline-flex items-center gap-1 text-slate-400">
                                <User className="h-3.5 w-3.5" />
                                {log.user?.name || log.user?.email || "System"}
                              </span>
                            </div>
                          </div>

                          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-semibold ${meta.chipClass}`}>
                            <Icon className="h-3.5 w-3.5" />
                            {(log.entityType || "system").toUpperCase()}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </section>
            ))}
          </div>
        )}

        {!loading && logs.length > 0 ? (
          <div className="mt-5 flex justify-center">
            <button
              type="button"
              onClick={loadMore}
              disabled={!hasMore || loadingMore}
              className="rounded-xl border border-white/15 bg-white/[0.03] px-4 py-2 text-sm font-medium text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loadingMore ? "Loading..." : hasMore ? "Load More" : "No More Logs"}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
