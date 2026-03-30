"use client";

import { X } from "lucide-react";
import ModalShell from "@/components/modals/shared/ModalShell";

export type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";

type OrderItem = {
  product:
    | {
        _id: string;
        name: string;
        price?: number;
        stockQuantity?: number;
      }
    | string;
  quantity: number;
  unitPrice: number;
};

export type OrderDetailsModel = {
  _id: string;
  customerName?: string;
  items: OrderItem[];
  totalPrice: number;
  status: OrderStatus | string;
  placedAt?: string;
  createdAt?: string;
};

type OrderDetailModalProps = {
  open: boolean;
  selectedOrder: OrderDetailsModel | null;
  nextStatus: OrderStatus | "";
  updating: boolean;
  currencyFormatter: Intl.NumberFormat;
  onClose: () => void;
  onNextStatusChange: (status: OrderStatus) => void;
  onSaveStatus: () => void;
  onCancelOrder: (order: OrderDetailsModel, fromDetail: boolean) => void;
};

const STATUS_STEPS: OrderStatus[] = ["pending", "confirmed", "shipped", "delivered"];

function normalizeStatus(status: string | undefined): OrderStatus {
  const s = String(status || "pending").toLowerCase();
  if (s === "pending" || s === "confirmed" || s === "shipped" || s === "delivered" || s === "cancelled") {
    return s;
  }
  return "pending";
}

function statusText(status: string | undefined) {
  const s = normalizeStatus(status);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function canCancel(status: string | undefined) {
  const s = normalizeStatus(status);
  return s === "pending" || s === "confirmed";
}

function itemProductName(item: OrderItem) {
  if (typeof item.product === "string") return "Unknown Product";
  return item.product?.name || "Unknown Product";
}

function orderNumber(id: string) {
  return `#${id.slice(-4).toUpperCase()}`;
}

export default function OrderDetailModal({
  open,
  selectedOrder,
  nextStatus,
  updating,
  currencyFormatter,
  onClose,
  onNextStatusChange,
  onSaveStatus,
  onCancelOrder,
}: OrderDetailModalProps) {
  if (!open || !selectedOrder) return null;

  const currentStatus = normalizeStatus(selectedOrder.status);

  return (
    <ModalShell
      open={open}
      overlayClassName="bg-black/60 backdrop-blur-sm"
      panelClassName="product-modal-drop w-full max-w-3xl rounded-2xl border border-white/15 bg-[#101722] shadow-[0_24px_50px_rgba(0,0,0,0.55)]"
    >
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Order Details</h2>
          <p className="text-xs text-slate-400">
            {orderNumber(selectedOrder._id)} • {selectedOrder.customerName || "Walk-in Customer"}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-slate-400 hover:bg-white/10 hover:text-slate-200"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-5 px-5 py-5">
        <section>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-300">Items</h3>
          <div className="space-y-2">
            {(selectedOrder.items || []).map((item, idx) => (
              <div
                key={`${itemProductName(item)}-${idx}`}
                className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm"
              >
                <span className="text-slate-200">{itemProductName(item)}</span>
                <span className="text-slate-300">
                  {item.quantity} x {currencyFormatter.format(item.unitPrice || 0)}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-300">Timeline</h3>
          <div className="grid grid-cols-4 gap-2">
            {STATUS_STEPS.map((step, idx) => {
              const currentIndex = STATUS_STEPS.indexOf(currentStatus);
              const active = currentStatus !== "cancelled" && idx <= currentIndex;
              return (
                <div key={step} className="text-center">
                  <div className={`mx-auto h-3 w-3 rounded-full ${active ? "bg-indigo-400" : "bg-slate-600"}`} />
                  <p className="mt-1 text-[11px] capitalize text-slate-300">{step}</p>
                </div>
              );
            })}
          </div>
          {currentStatus === "cancelled" ? (
            <p className="mt-2 text-xs font-semibold text-red-300">Order cancelled</p>
          ) : null}
        </section>

        <section className="rounded-xl border border-white/10 bg-black/20 p-4">
          <div className="grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-end">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">Update Status</label>
              <select
                value={nextStatus}
                onChange={(event) => onNextStatusChange(event.target.value as OrderStatus)}
                disabled={currentStatus === "cancelled"}
                className="w-full rounded-xl border border-white/15 bg-[#0f141d] px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-indigo-400/70 disabled:opacity-50"
              >
                {(() => {
                  const options = currentStatus === "cancelled" ? [] : STATUS_STEPS.slice(STATUS_STEPS.indexOf(currentStatus));
                  return options.map((status) => (
                    <option key={status} value={status}>
                      {statusText(status)}
                    </option>
                  ));
                })()}
              </select>
            </div>

            <button
              type="button"
              onClick={onSaveStatus}
              disabled={updating || currentStatus === "cancelled"}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {updating ? "Updating..." : "Save Status"}
            </button>

            <button
              type="button"
              onClick={() => onCancelOrder(selectedOrder, true)}
              disabled={!canCancel(selectedOrder.status)}
              className="rounded-xl border border-red-400/45 bg-red-500/15 px-4 py-2 text-sm font-semibold text-red-200 disabled:opacity-40"
            >
              Cancel Order
            </button>
          </div>
        </section>
      </div>
    </ModalShell>
  );
}
