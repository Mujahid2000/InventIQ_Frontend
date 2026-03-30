"use client";

import { FormEvent, useMemo, useState } from "react";
import { PackageOpen } from "lucide-react";
import toast from "react-hot-toast";
import { RestockItemModal } from "@/components/modals";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  useDeleteRestockItemMutation,
  useGetRestockQueueQuery,
  useUpdateRestockItemMutation,
} from "@/store/api";

type QueueItem = {
  _id: string;
  product: {
    _id: string;
    name: string;
    category?: { _id?: string; name?: string } | string;
    stockQuantity: number;
    minStockThreshold: number;
  };
  currentStock: number;
  minStockThreshold: number;
  priority: "High" | "Medium" | "Low" | string;
  status: string;
};

function getErrorMessage(error: unknown, fallback: string) {
  return getApiErrorMessage(error, fallback);
}

function priorityBadgeClass(priority: string) {
  if (priority === "High") return "bg-red-500/20 text-red-200 restock-high-pulse";
  if (priority === "Medium") return "bg-amber-500/20 text-amber-200";
  return "bg-emerald-500/20 text-emerald-200";
}

function statusLabel(raw: string) {
  if (!raw) return "Pending";
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function categoryText(item: QueueItem) {
  const c = item.product?.category;
  if (!c) return "Uncategorized";
  if (typeof c === "string") return "Uncategorized";
  return c.name || "Uncategorized";
}

function cardAccentClass(priority: string) {
  if (priority === "High") return "border-l-red-400";
  if (priority === "Medium") return "border-l-amber-400";
  return "border-l-emerald-400";
}

function progressFillClass(priority: string) {
  if (priority === "High") return "bg-red-400";
  if (priority === "Medium") return "bg-amber-400";
  return "bg-emerald-400";
}

function stockNumberClass(item: QueueItem) {
  if (item.currentStock <= 0) return "text-red-300";
  if (item.currentStock <= item.minStockThreshold) return "text-amber-300";
  return "text-emerald-300";
}

function stockRatioPercent(item: QueueItem) {
  if (item.minStockThreshold <= 0) return 100;
  return Math.max(
    0,
    Math.min(100, (item.currentStock / item.minStockThreshold) * 100),
  );
}

export default function RestockPage() {
  const {
    data: itemsData,
    isLoading: loading,
    refetch,
  } = useGetRestockQueueQuery();
  const [updateRestockItem] = useUpdateRestockItemMutation();
  const [deleteRestockItem] = useDeleteRestockItemMutation();

  const items = useMemo(
    () => (Array.isArray(itemsData) ? (itemsData as QueueItem[]) : []),
    [itemsData],
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [targetItem, setTargetItem] = useState<QueueItem | null>(null);
  const [newStock, setNewStock] = useState("");
  const [saving, setSaving] = useState(false);

  function openRestockModal(item: QueueItem) {
    setTargetItem(item);
    setNewStock(String(item.currentStock));
    setModalOpen(true);
  }

  const nextStockPreview = useMemo(() => {
    if (!targetItem) return 0;
    const desiredStock = Number(newStock || targetItem.currentStock);
    if (Number.isNaN(desiredStock) || desiredStock < 0)
      return targetItem.currentStock;
    return desiredStock;
  }, [newStock, targetItem]);

  async function handleRestock(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!targetItem) return;

    const desiredStock = Number(newStock);
    if (Number.isNaN(desiredStock) || desiredStock < 0) {
      toast.error("Enter a valid stock quantity.");
      return;
    }

    const amount = desiredStock - targetItem.currentStock;
    if (amount <= 0) {
      toast.error("New stock quantity must be greater than current stock.");
      return;
    }

    setSaving(true);
    try {
      await updateRestockItem({ id: targetItem._id, amount }).unwrap();
      await deleteRestockItem({ id: targetItem._id }).unwrap();
      toast.success("Item restocked and removed from queue.");
      setModalOpen(false);
      setTargetItem(null);
      setNewStock("");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to restock item."));
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(item: QueueItem) {
    const confirmed = window.confirm(
      `Remove "${item.product?.name || "this item"}" from queue?`,
    );
    if (!confirmed) return;

    try {
      await deleteRestockItem({ id: item._id }).unwrap();
      toast.success("Queue item removed.");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to remove item."));
    }
  }

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => a.currentStock - b.currentStock),
    [items],
  );

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-white">Restock Queue</h1>
              <span className="inline-flex items-center rounded-full border border-red-300/35 bg-red-500/20 px-3 py-1 text-xs font-semibold text-red-200 restock-high-pulse">
                {sortedItems.length} items
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-400">
              Items below minimum stock threshold
            </p>
          </div>

          <button
            type="button"
            onClick={refetch}
            className="rounded-xl border border-white/15 bg-white/[0.03] px-3 py-2 text-sm text-slate-200 hover:bg-white/[0.08]"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="h-56 animate-pulse rounded-2xl border border-white/10 bg-white/5"
            />
          ))
        ) : sortedItems.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-white/10 bg-white/5 p-10 text-center">
            <div className="mx-auto mb-3 inline-flex rounded-2xl border border-white/10 bg-white/5 p-4">
              <PackageOpen className="h-10 w-10 text-slate-400" />
            </div>
            <p className="text-lg font-semibold text-slate-100">Queue is clear</p>
            <p className="mt-1 text-sm text-slate-400">
              No urgent restock items right now.
            </p>
          </div>
        ) : (
          sortedItems.map((item, idx) => (
            <article
              key={item._id}
              className={`restock-card-enter rounded-2xl border border-white/10 border-l-4 ${cardAccentClass(item.priority)} bg-white/5 p-4 backdrop-blur-sm`}
              style={{ animationDelay: `${80 + idx * 50}ms` }}
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    {item.product?.name || "Unknown product"}
                  </h2>
                  <span className="mt-1 inline-flex rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-[11px] text-slate-300">
                    {categoryText(item)}
                  </span>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${priorityBadgeClass(item.priority)}`}
                >
                  {item.priority}
                </span>
              </div>

              <p className={`text-4xl font-bold tracking-tight ${stockNumberClass(item)}`}>
                {item.currentStock}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Min: {item.minStockThreshold} units
              </p>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800/70">
                <div
                  className={`h-full rounded-full ${progressFillClass(item.priority)}`}
                  style={{ width: `${stockRatioPercent(item)}%` }}
                />
              </div>

              <p className="mt-2 text-xs text-slate-400">
                Status: {statusLabel(item.status)}
              </p>

              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openRestockModal(item)}
                  className="flex-1 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
                >
                  Restock
                </button>
                <button
                  type="button"
                  onClick={() => handleRemove(item)}
                  className="flex-1 rounded-xl border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-200 hover:bg-red-500/20"
                >
                  Remove
                </button>
              </div>
            </article>
          ))
        )}
      </div>

      <RestockItemModal
        open={modalOpen}
        targetItem={targetItem}
        newStock={newStock}
        nextStockPreview={nextStockPreview}
        saving={saving}
        onClose={() => setModalOpen(false)}
        onStockChange={setNewStock}
        onSubmit={handleRestock}
      />
    </div>
  );
}
