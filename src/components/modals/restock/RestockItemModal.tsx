"use client";

import type { FormEvent } from "react";
import { PlusCircle } from "lucide-react";
import ModalShell from "@/components/modals/shared/ModalShell";

type RestockItem = {
  product: {
    name: string;
  };
  currentStock: number;
};

type RestockItemModalProps = {
  open: boolean;
  targetItem: RestockItem | null;
  newStock: string;
  nextStockPreview: number;
  saving: boolean;
  onClose: () => void;
  onStockChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export default function RestockItemModal({
  open,
  targetItem,
  newStock,
  nextStockPreview,
  saving,
  onClose,
  onStockChange,
  onSubmit,
}: RestockItemModalProps) {
  if (!open || !targetItem) return null;

  return (
    <ModalShell
      open={open}
      overlayClassName="bg-black/60 backdrop-blur-sm"
      panelClassName="product-modal-drop w-full max-w-md rounded-2xl border border-white/15 bg-[#101722] p-5 shadow-[0_24px_50px_rgba(0,0,0,0.55)]"
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Restock Item</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-slate-400 hover:bg-white/10 hover:text-slate-200"
        >
          <PlusCircle className="h-5 w-5 rotate-45" />
        </button>
      </div>

      <div className="mb-4 rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <p className="text-sm text-slate-300">Product</p>
        <p className="text-base font-semibold text-white">{targetItem.product?.name}</p>
        <p className="mt-2 text-xs text-slate-400">
          Current stock: <span className="font-semibold text-slate-200">{targetItem.currentStock}</span>
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-300">New Stock Quantity</label>
          <input
            type="number"
            min="0"
            value={newStock}
            onChange={(event) => onStockChange(event.target.value)}
            className="w-full rounded-xl border border-white/15 bg-[#0f141d] px-3 py-2 text-slate-100 outline-none transition focus:border-emerald-400/70 focus:ring-2 focus:ring-emerald-500/20"
            required
          />
        </div>

        <div className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          After restock: <strong>{nextStockPreview} units</strong>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/15 bg-white/[0.03] px-4 py-2 text-sm text-slate-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? "Confirming..." : "Confirm Restock"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
