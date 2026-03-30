"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Ban,
  CalendarDays,
  Eye,
  Plus,
  Search,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  CreateOrderModal,
  OrderDetailModal,
} from "@/components/modals";
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

      <CreateOrderModal
        open={createOpen}
        customerName={customerName}
        orderRows={orderRows}
        products={products}
        createSubtotal={createSubtotal}
        placing={placing}
        currencyFormatter={currency}
        onClose={() => {
          setCreateOpen(false);
          resetCreateForm();
        }}
        onCustomerNameChange={setCustomerName}
        onAddRow={addRow}
        onRemoveRow={removeRow}
        onProductSelect={handleProductSelect}
        onQuantityChange={handleQuantityChange}
        onPlaceOrder={placeOrder}
      />

      <OrderDetailModal
        open={detailOpen}
        selectedOrder={selectedOrder}
        nextStatus={nextStatus}
        updating={updating}
        currencyFormatter={currency}
        onClose={() => {
          setDetailOpen(false);
          setSelectedOrder(null);
        }}
        onNextStatusChange={setNextStatus}
        onSaveStatus={handleStatusUpdate}
        onCancelOrder={cancelOrder}
      />
    </div>
  );
}
