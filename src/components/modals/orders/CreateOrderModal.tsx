"use client";

import { Plus, ShoppingCart, X } from "lucide-react";
import ModalShell from "@/components/modals/shared/ModalShell";

export type OrderRow = {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  availableStock: number;
  removing?: boolean;
};

type ProductOption = {
  _id: string;
  name: string;
  stockQuantity: number;
};

type CreateOrderModalProps = {
  open: boolean;
  customerName: string;
  orderRows: OrderRow[];
  products: ProductOption[];
  createSubtotal: number;
  placing: boolean;
  currencyFormatter: Intl.NumberFormat;
  onClose: () => void;
  onCustomerNameChange: (value: string) => void;
  onAddRow: () => void;
  onRemoveRow: (rowId: string) => void;
  onProductSelect: (rowId: string, productId: string) => void;
  onQuantityChange: (rowId: string, value: string) => void;
  onPlaceOrder: () => void;
};

export default function CreateOrderModal({
  open,
  customerName,
  orderRows,
  products,
  createSubtotal,
  placing,
  currencyFormatter,
  onClose,
  onCustomerNameChange,
  onAddRow,
  onRemoveRow,
  onProductSelect,
  onQuantityChange,
  onPlaceOrder,
}: CreateOrderModalProps) {
  return (
    <ModalShell
      open={open}
      overlayClassName="items-start justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-6"
      panelClassName="product-modal-drop h-[calc(100vh-1.5rem)] w-full overflow-hidden rounded-2xl border border-white/15 bg-[#101722] shadow-[0_24px_50px_rgba(0,0,0,0.55)] sm:h-auto sm:max-w-5xl"
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="text-xl font-semibold text-white">Create New Order</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-white/10 hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          <section>
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-300">Customer Info</h3>
            <input
              value={customerName}
              onChange={(event) => onCustomerNameChange(event.target.value)}
              placeholder="Customer Name"
              className="w-full rounded-xl border border-white/15 bg-[#0f141d] px-3 py-2 text-slate-100 outline-none transition focus:border-indigo-400/70 focus:ring-2 focus:ring-indigo-500/20"
            />
          </section>

          <section>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Order Items</h3>
              <button
                type="button"
                onClick={onAddRow}
                className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-200 hover:bg-white/[0.08]"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Product
              </button>
            </div>

            <div className="space-y-2">
              {orderRows.map((row) => {
                const rowTotal = row.quantity * row.unitPrice;
                const hasStockIssue = row.productId && row.quantity > row.availableStock;
                return (
                  <div
                    key={row.id}
                    className={`grid grid-cols-1 gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3 md:grid-cols-[2.2fr_0.8fr_0.8fr_0.9fr_auto] ${
                      row.removing ? "order-item-exit" : "order-item-enter"
                    }`}
                  >
                    <div>
                      <label className="mb-1 block text-xs text-slate-400">Product</label>
                      <select
                        value={row.productId}
                        onChange={(event) => onProductSelect(row.id, event.target.value)}
                        className="w-full rounded-lg border border-white/15 bg-[#0f141d] px-2 py-2 text-sm text-slate-100 outline-none transition focus:border-indigo-400/70"
                      >
                        <option value="">Select product</option>
                        {products.map((product) => (
                          <option key={product._id} value={product._id}>
                            {product.name} ({product.stockQuantity} in stock)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs text-slate-400">Quantity</label>
                      <input
                        type="number"
                        min="1"
                        value={row.quantity}
                        onChange={(event) => onQuantityChange(row.id, event.target.value)}
                        className="w-full rounded-lg border border-white/15 bg-[#0f141d] px-2 py-2 text-sm text-slate-100 outline-none transition focus:border-indigo-400/70"
                      />
                      {hasStockIssue ? (
                        <p className="mt-1 text-[11px] font-semibold text-amber-300">⚠️ Only {row.availableStock} available</p>
                      ) : null}
                    </div>

                    <div>
                      <label className="mb-1 block text-xs text-slate-400">Unit Price</label>
                      <div className="rounded-lg border border-white/10 bg-black/20 px-2 py-2 text-sm text-slate-200">
                        {currencyFormatter.format(row.unitPrice || 0)}
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs text-slate-400">Row Total</label>
                      <div className="rounded-lg border border-white/10 bg-black/20 px-2 py-2 text-sm font-semibold text-slate-100">
                        {currencyFormatter.format(rowTotal || 0)}
                      </div>
                    </div>

                    <div className="flex items-end justify-end">
                      <button
                        type="button"
                        onClick={() => onRemoveRow(row.id)}
                        className="rounded-lg border border-red-400/40 bg-red-500/15 p-2 text-red-300 hover:bg-red-500/25"
                        aria-label="Remove row"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-xl border border-white/10 bg-black/20 p-4">
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-300">Order Summary</h3>
            <div className="flex items-center justify-between text-sm text-slate-300">
              <span>Subtotal</span>
              <span>{currencyFormatter.format(createSubtotal)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-2">
              <span className="text-sm text-slate-300">Total Price</span>
              <span className="text-xl font-bold text-white">{currencyFormatter.format(createSubtotal)}</span>
            </div>
          </section>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-white/10 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/15 bg-white/[0.03] px-4 py-2 text-sm text-slate-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onPlaceOrder}
            disabled={placing}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            <ShoppingCart className="h-4 w-4" />
            {placing ? "Placing..." : "Place Order"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
