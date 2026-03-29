"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Ban,
  CalendarDays,
  Eye,
  Plus,
  Search,
  ShoppingCart,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  useCancelOrderMutation,
  useCreateOrderMutation,
  useGetOrdersQuery,
  useGetProductsQuery,
  useUpdateOrderStatusMutation,
} from "@/store/api";

type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled";

type Product = {
  _id: string;
  name: string;
  price: number;
  stockQuantity: number;
  active?: boolean;
  status?: string;
};

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

type Order = {
  _id: string;
  customerName?: string;
  items: OrderItem[];
  totalPrice: number;
  status: OrderStatus | string;
  placedAt?: string;
  createdAt?: string;
};

type OrderRow = {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  availableStock: number;
  removing?: boolean;
};

const PAGE_SIZE = 10;
const STATUS_STEPS: OrderStatus[] = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
];

const STATUS_TABS: Array<{ key: "all" | OrderStatus; label: string }> = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "confirmed", label: "Confirmed" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
];

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "BDT",
  maximumFractionDigits: 0,
});

function getErrorMessage(error: unknown, fallback: string) {
  return getApiErrorMessage(error, fallback);
}

function normalizeStatus(status: string | undefined): OrderStatus {
  const s = String(status || "pending").toLowerCase();
  if (
    s === "pending" ||
    s === "confirmed" ||
    s === "shipped" ||
    s === "delivered" ||
    s === "cancelled"
  ) {
    return s;
  }
  return "pending";
}

function statusText(status: string | undefined) {
  const s = normalizeStatus(status);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function statusBadgeClass(status: string | undefined) {
  const s = normalizeStatus(status);
  if (s === "pending") return "bg-amber-500/20 text-amber-200";
  if (s === "confirmed") return "bg-blue-500/20 text-blue-200";
  if (s === "shipped") return "bg-purple-500/20 text-purple-200";
  if (s === "delivered") return "bg-emerald-500/20 text-emerald-200";
  return "bg-red-500/20 text-red-200 line-through";
}

function createOrderRow(): OrderRow {
  return {
    id: Math.random().toString(36).slice(2, 10),
    productId: "",
    quantity: 1,
    unitPrice: 0,
    availableStock: 0,
  };
}

function itemProductName(item: OrderItem) {
  if (typeof item.product === "string") return "Unknown Product";
  return item.product?.name || "Unknown Product";
}

function canCancel(status: string | undefined) {
  const s = normalizeStatus(status);
  return s === "pending" || s === "confirmed";
}

function orderNumber(id: string) {
  return `#${id.slice(-4).toUpperCase()}`;
}

function OrderSkeleton() {
  return (
    <>
      {Array.from({ length: 7 }).map((_, idx) => (
        <tr key={idx} className="border-b border-white/10">
          {Array.from({ length: 7 }).map((__, cellIdx) => (
            <td key={cellIdx} className="px-4 py-4">
              <div className="h-4 w-full animate-pulse rounded bg-white/10" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export default function OrdersPage() {
  const {
    data: ordersData,
    isLoading: ordersLoading,
    error: ordersError,
  } = useGetOrdersQuery();
  const {
    data: productsData,
    isLoading: productsLoading,
    error: productsError,
  } = useGetProductsQuery();
  const [createOrder] = useCreateOrderMutation();
  const [updateOrderStatus] = useUpdateOrderStatusMutation();
  const [cancelOrderMutation] = useCancelOrderMutation();

  const orders = useMemo(
    () => (Array.isArray(ordersData) ? (ordersData as Order[]) : []),
    [ordersData],
  );
  const products = useMemo(
    () => (Array.isArray(productsData) ? (productsData as Product[]) : []),
    [productsData],
  );
  const loading = ordersLoading || productsLoading;
  const lastLoadErrorRef = useRef("");

  const [activeTab, setActiveTab] = useState<"all" | OrderStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [page, setPage] = useState(1);

  const [createOpen, setCreateOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [orderRows, setOrderRows] = useState<OrderRow[]>([createOrderRow()]);
  const [placing, setPlacing] = useState(false);

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [nextStatus, setNextStatus] = useState<OrderStatus | "">("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const firstError = ordersError || productsError;
    if (!firstError) return;

    const message = getErrorMessage(firstError, "Failed to load orders.");
    if (lastLoadErrorRef.current === message) return;

    lastLoadErrorRef.current = message;
    toast.error(message);
  }, [ordersError, productsError]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim().toLowerCase());
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  const dateScopedOrders = useMemo(() => {
    if (!dateFilter) return orders;
    const start = new Date(`${dateFilter}T00:00:00`);
    const end = new Date(`${dateFilter}T23:59:59.999`);
    return orders.filter((order) => {
      const ts = new Date(order.placedAt || order.createdAt || Date.now());
      return ts >= start && ts <= end;
    });
  }, [orders, dateFilter]);

  const tabCounts = useMemo(() => {
    const counts: Record<"all" | OrderStatus, number> = {
      all: dateScopedOrders.length,
      pending: 0,
      confirmed: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };
    for (const order of dateScopedOrders) {
      const s = normalizeStatus(order.status);
      counts[s] += 1;
    }
    return counts;
  }, [dateScopedOrders]);

  const filteredOrders = useMemo(() => {
    const base =
      activeTab === "all"
        ? dateScopedOrders
        : dateScopedOrders.filter(
            (order) => normalizeStatus(order.status) === activeTab,
          );

    const searchFiltered = !debouncedSearchQuery
      ? base
      : base.filter((order) => {
          const customer = (order.customerName || "").toLowerCase();
          const readableOrderNumber = orderNumber(order._id).replace("#", "").toLowerCase();
          return (
            customer.includes(debouncedSearchQuery) ||
            readableOrderNumber.includes(debouncedSearchQuery)
          );
        });

    return [...searchFiltered].sort(
      (a, b) =>
        new Date(b.placedAt || b.createdAt || 0).getTime() -
        new Date(a.placedAt || a.createdAt || 0).getTime(),
    );
  }, [activeTab, dateScopedOrders, debouncedSearchQuery]);

  useEffect(() => {
    setPage(1);
  }, [activeTab, dateFilter, debouncedSearchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageStart = (page - 1) * PAGE_SIZE;
  const pagedOrders = useMemo(() => {
    return filteredOrders.slice(pageStart, pageStart + PAGE_SIZE);
  }, [filteredOrders, pageStart]);

  const pageCount = Math.min(pageStart + pagedOrders.length, filteredOrders.length);

  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, idx) => idx + 1);
    }
    if (page <= 4) return [1, 2, 3, 4, 5, -1, totalPages];
    if (page >= totalPages - 3) {
      return [1, -1, totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, -1, page - 1, page, page + 1, -1, totalPages];
  }, [page, totalPages]);

  function resetCreateForm() {
    setCustomerName("");
    setOrderRows([createOrderRow()]);
  }

  function addRow() {
    setOrderRows((prev) => [...prev, createOrderRow()]);
  }

  function removeRow(rowId: string) {
    if (orderRows.length === 1) {
      toast.error("At least one item row is required.");
      return;
    }
    setOrderRows((prev) => prev.map((row) => (row.id === rowId ? { ...row, removing: true } : row)));
    window.setTimeout(() => {
      setOrderRows((prev) => prev.filter((row) => row.id !== rowId));
    }, 180);
  }

  function handleProductSelect(rowId: string, productId: string) {
    if (!productId) {
      setOrderRows((prev) =>
        prev.map((row) =>
          row.id === rowId
            ? { ...row, productId: "", unitPrice: 0, availableStock: 0, quantity: 1 }
            : row,
        ),
      );
      return;
    }

    const duplicate = orderRows.some(
      (row) => row.id !== rowId && row.productId === productId,
    );
    if (duplicate) {
      toast.error("Already added");
      return;
    }

    const selected = products.find((p) => p._id === productId);
    if (!selected || selected.active === false) {
      toast.error("Product unavailable");
      return;
    }

    setOrderRows((prev) =>
      prev.map((row) =>
        row.id === rowId
          ? {
              ...row,
              productId,
              unitPrice: Number(selected.price || 0),
              availableStock: Number(selected.stockQuantity || 0),
              quantity: Math.max(1, row.quantity),
            }
          : row,
      ),
    );
  }

  function handleQuantityChange(rowId: string, value: string) {
    const nextQty = Math.max(1, Number(value || 1));
    setOrderRows((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, quantity: nextQty } : row)),
    );
  }

  const createSubtotal = useMemo(() => {
    return orderRows.reduce((sum, row) => {
      if (!row.productId) return sum;
      return sum + row.quantity * row.unitPrice;
    }, 0);
  }, [orderRows]);

  async function placeOrder() {
    if (!customerName.trim()) {
      toast.error("Customer name is required");
      return;
    }

    const rowsWithProduct = orderRows.filter((row) => row.productId);
    if (rowsWithProduct.length === 0) {
      toast.error("Add at least one product to the order");
      return;
    }

    const unique = new Set(rowsWithProduct.map((row) => row.productId));
    if (unique.size !== rowsWithProduct.length) {
      toast.error("Already added");
      return;
    }

    for (const row of rowsWithProduct) {
      const product = products.find((p) => p._id === row.productId);
      if (!product || product.active === false) {
        toast.error("Product unavailable");
        return;
      }
      if (row.quantity > Number(product.stockQuantity || 0)) {
        toast.error(`Only ${product.stockQuantity || 0} available`);
        return;
      }
    }

    setPlacing(true);
    try {
      await createOrder({
        customerName: customerName.trim(),
        items: rowsWithProduct.map((row) => ({
          product: row.productId,
          quantity: row.quantity,
        })),
      }).unwrap();

      toast.success("Order created successfully.");
      setCreateOpen(false);
      resetCreateForm();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to create order."));
    } finally {
      setPlacing(false);
    }
  }

  function openDetail(order: Order) {
    const s = normalizeStatus(order.status);
    const currentIndex = STATUS_STEPS.indexOf(s);
    const options =
      s === "cancelled" ? [] : STATUS_STEPS.slice(Math.max(0, currentIndex));
    setSelectedOrder(order);
    setNextStatus(options[0] || "");
    setDetailOpen(true);
  }

  async function handleStatusUpdate() {
    if (!selectedOrder || !nextStatus) return;
    setUpdating(true);
    try {
      await updateOrderStatus({ id: selectedOrder._id, status: nextStatus }).unwrap();
      toast.success("Order status updated.");
      setDetailOpen(false);
      setSelectedOrder(null);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Unable to update status."));
    } finally {
      setUpdating(false);
    }
  }

  async function cancelOrder(order: Order, fromDetail = false) {
    if (!canCancel(order.status)) {
      toast.error("Only pending or confirmed orders can be cancelled.");
      return;
    }
    const confirmed = window.confirm("Cancel this order?");
    if (!confirmed) return;

    try {
      await cancelOrderMutation({ id: order._id }).unwrap();
      toast.success("Order cancelled.");
      if (fromDetail) {
        setDetailOpen(false);
        setSelectedOrder(null);
      }
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to cancel order."));
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-white">Orders</h1>
              <span className="rounded-full border border-indigo-300/40 bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-200">
                {orders.length} total
              </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.key);
                    setPage(1);
                  }}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    activeTab === tab.key
                      ? "border-indigo-400/70 bg-indigo-500/25 text-indigo-100"
                      : "border-white/15 bg-white/[0.03] text-slate-300 hover:bg-white/[0.08]"
                  }`}
                >
                  {tab.label}
                  <span className="ml-1.5 rounded-full bg-black/25 px-2 py-0.5 text-[10px]">
                    {tabCounts[tab.key]}
                  </span>
                </button>
              ))}

              <label className="relative min-w-[260px] flex-1 sm:max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by customer or order #..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-full border border-white/15 bg-[#11161f] py-1.5 pl-9 pr-3 text-xs text-slate-100 outline-none transition placeholder:text-slate-400 focus:border-indigo-400/70 focus:ring-2 focus:ring-indigo-500/20"
                />
              </label>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="relative inline-flex items-center">
              <CalendarDays className="pointer-events-none absolute left-3 h-4 w-4 text-slate-400" />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  setPage(1);
                }}
                className="rounded-xl border border-white/15 bg-[#11161f] py-2 pl-9 pr-3 text-sm text-slate-100 outline-none transition focus:border-indigo-400/70 focus:ring-2 focus:ring-indigo-500/20"
              />
            </label>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
            >
              <Plus className="h-4 w-4" />
              Create Order
            </button>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.03] text-slate-300">
                <th className="px-4 py-3 font-medium">Order #</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Items</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <OrderSkeleton />
              ) : pagedOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-14 text-center text-slate-400">
                    No orders found.
                  </td>
                </tr>
              ) : (
                pagedOrders.map((order) => {
                  const s = normalizeStatus(order.status);
                  return (
                    <tr
                      key={order._id}
                      className="border-b border-white/10 transition hover:bg-white/[0.05]"
                    >
                      <td className="px-4 py-3">
                        <span className="rounded-lg border border-white/15 bg-black/20 px-2.5 py-1 font-mono text-xs text-slate-200">
                          {orderNumber(order._id)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-200">
                        {order.customerName || "Walk-in Customer"}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        <p>{order.items?.length || 0} item(s)</p>
                        <p className="text-xs text-slate-500">
                          {(order.items || [])
                            .slice(0, 2)
                            .map((item) => itemProductName(item))
                            .join(", ") || "-"}
                        </p>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-100">
                        {currency.format(order.totalPrice || 0)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(s)}`}>
                          {statusText(s)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {new Date(order.placedAt || order.createdAt || Date.now()).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openDetail(order)}
                            className="group relative inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/[0.03] text-slate-200 hover:border-indigo-400/70 hover:bg-indigo-500/20"
                            aria-label="View order"
                          >
                            <Eye className="h-4 w-4" />
                            <span className="pointer-events-none absolute -top-8 hidden rounded bg-black/80 px-2 py-1 text-xs text-white group-hover:block">
                              View/Edit
                            </span>
                          </button>

                          <button
                            type="button"
                            disabled={!canCancel(s)}
                            onClick={() => cancelOrder(order)}
                            className="group relative inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/[0.03] text-slate-200 disabled:opacity-40 hover:border-red-400/70 hover:bg-red-500/20"
                            aria-label="Cancel order"
                          >
                            <Ban className="h-4 w-4" />
                            <span className="pointer-events-none absolute -top-8 hidden rounded bg-black/80 px-2 py-1 text-xs text-white group-hover:block">
                              Cancel
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-white/10 px-4 py-3 text-sm text-slate-300 md:flex-row md:items-center md:justify-between">
          <p>
            Showing {pageCount} of {filteredOrders.length} orders
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className="rounded-lg border border-white/15 bg-white/[0.03] px-3 py-1.5 disabled:opacity-40"
            >
              Previous
            </button>

            {pageNumbers.map((n, idx) =>
              n === -1 ? (
                <span key={`ellipsis-${idx}`} className="px-1 text-slate-500">
                  ...
                </span>
              ) : (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPage(n)}
                  className={`h-8 w-8 rounded-lg border text-xs font-semibold ${
                    page === n
                      ? "border-indigo-400/70 bg-indigo-500/25 text-indigo-100"
                      : "border-white/15 bg-white/[0.03] text-slate-300"
                  }`}
                >
                  {n}
                </button>
              ),
            )}

            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              className="rounded-lg border border-white/15 bg-white/[0.03] px-3 py-1.5 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </section>

      {createOpen ? (
        <div className="fixed inset-0 z-40 flex items-start justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-6">
          <div className="product-modal-drop h-[calc(100vh-1.5rem)] w-full overflow-hidden rounded-2xl border border-white/15 bg-[#101722] shadow-[0_24px_50px_rgba(0,0,0,0.55)] sm:h-auto sm:max-w-5xl">
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <h2 className="text-xl font-semibold text-white">Create New Order</h2>
                <button
                  type="button"
                  onClick={() => {
                    setCreateOpen(false);
                    resetCreateForm();
                  }}
                  className="rounded-md p-1 text-slate-400 hover:bg-white/10 hover:text-slate-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
                <section>
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-300">
                    Customer Info
                  </h3>
                  <input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Customer Name"
                    className="w-full rounded-xl border border-white/15 bg-[#0f141d] px-3 py-2 text-slate-100 outline-none transition focus:border-indigo-400/70 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </section>

                <section>
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
                      Order Items
                    </h3>
                    <button
                      type="button"
                      onClick={addRow}
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
                              onChange={(e) => handleProductSelect(row.id, e.target.value)}
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
                              onChange={(e) => handleQuantityChange(row.id, e.target.value)}
                              className="w-full rounded-lg border border-white/15 bg-[#0f141d] px-2 py-2 text-sm text-slate-100 outline-none transition focus:border-indigo-400/70"
                            />
                            {hasStockIssue ? (
                              <p className="mt-1 text-[11px] font-semibold text-amber-300">
                                ⚠️ Only {row.availableStock} available
                              </p>
                            ) : null}
                          </div>

                          <div>
                            <label className="mb-1 block text-xs text-slate-400">Unit Price</label>
                            <div className="rounded-lg border border-white/10 bg-black/20 px-2 py-2 text-sm text-slate-200">
                              {currency.format(row.unitPrice || 0)}
                            </div>
                          </div>

                          <div>
                            <label className="mb-1 block text-xs text-slate-400">Row Total</label>
                            <div className="rounded-lg border border-white/10 bg-black/20 px-2 py-2 text-sm font-semibold text-slate-100">
                              {currency.format(rowTotal || 0)}
                            </div>
                          </div>

                          <div className="flex items-end justify-end">
                            <button
                              type="button"
                              onClick={() => removeRow(row.id)}
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
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-300">
                    Order Summary
                  </h3>
                  <div className="flex items-center justify-between text-sm text-slate-300">
                    <span>Subtotal</span>
                    <span>{currency.format(createSubtotal)}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-2">
                    <span className="text-sm text-slate-300">Total Price</span>
                    <span className="text-xl font-bold text-white">
                      {currency.format(createSubtotal)}
                    </span>
                  </div>
                </section>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-white/10 px-5 py-4">
                <button
                  type="button"
                  onClick={() => {
                    setCreateOpen(false);
                    resetCreateForm();
                  }}
                  className="rounded-xl border border-white/15 bg-white/[0.03] px-4 py-2 text-sm text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={placeOrder}
                  disabled={placing}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  <ShoppingCart className="h-4 w-4" />
                  {placing ? "Placing..." : "Place Order"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {detailOpen && selectedOrder ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="product-modal-drop w-full max-w-3xl rounded-2xl border border-white/15 bg-[#101722] shadow-[0_24px_50px_rgba(0,0,0,0.55)]">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <h2 className="text-xl font-semibold text-white">Order Details</h2>
                <p className="text-xs text-slate-400">
                  {orderNumber(selectedOrder._id)} • {selectedOrder.customerName || "Walk-in Customer"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDetailOpen(false);
                  setSelectedOrder(null);
                }}
                className="rounded-md p-1 text-slate-400 hover:bg-white/10 hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 px-5 py-5">
              <section>
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-300">
                  Items
                </h3>
                <div className="space-y-2">
                  {(selectedOrder.items || []).map((item, idx) => (
                    <div
                      key={`${itemProductName(item)}-${idx}`}
                      className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm"
                    >
                      <span className="text-slate-200">{itemProductName(item)}</span>
                      <span className="text-slate-300">
                        {item.quantity} x {currency.format(item.unitPrice || 0)}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-300">
                  Timeline
                </h3>
                <div className="grid grid-cols-4 gap-2">
                  {STATUS_STEPS.map((step, idx) => {
                    const current = normalizeStatus(selectedOrder.status);
                    const currentIndex = STATUS_STEPS.indexOf(current);
                    const active = current !== "cancelled" && idx <= currentIndex;
                    return (
                      <div key={step} className="text-center">
                        <div
                          className={`mx-auto h-3 w-3 rounded-full ${
                            active ? "bg-indigo-400" : "bg-slate-600"
                          }`}
                        />
                        <p className="mt-1 text-[11px] capitalize text-slate-300">{step}</p>
                      </div>
                    );
                  })}
                </div>
                {normalizeStatus(selectedOrder.status) === "cancelled" ? (
                  <p className="mt-2 text-xs font-semibold text-red-300">
                    Order cancelled
                  </p>
                ) : null}
              </section>

              <section className="rounded-xl border border-white/10 bg-black/20 p-4">
                <div className="grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-end">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-300">
                      Update Status
                    </label>
                    <select
                      value={nextStatus}
                      onChange={(e) => setNextStatus(e.target.value as OrderStatus)}
                      disabled={normalizeStatus(selectedOrder.status) === "cancelled"}
                      className="w-full rounded-xl border border-white/15 bg-[#0f141d] px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-indigo-400/70 disabled:opacity-50"
                    >
                      {(() => {
                        const current = normalizeStatus(selectedOrder.status);
                        const options =
                          current === "cancelled"
                            ? []
                            : STATUS_STEPS.slice(STATUS_STEPS.indexOf(current));
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
                    onClick={handleStatusUpdate}
                    disabled={
                      updating || normalizeStatus(selectedOrder.status) === "cancelled"
                    }
                    className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {updating ? "Updating..." : "Save Status"}
                  </button>

                  <button
                    type="button"
                    onClick={() => cancelOrder(selectedOrder, true)}
                    disabled={!canCancel(selectedOrder.status)}
                    className="rounded-xl border border-red-400/45 bg-red-500/15 px-4 py-2 text-sm font-semibold text-red-200 disabled:opacity-40"
                  >
                    Cancel Order
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
