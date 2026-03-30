"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import {
  PackageOpen,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  ProductDeleteModal,
  ProductFormModal,
} from "@/components/modals";
import type { ProductFormValues } from "@/components/modals/products/ProductFormModal";
import { getApiErrorMessage } from "@/lib/api-error";
import { useAuth } from "@/hooks/useAuth";
import {
  useCreateProductMutation,
  useDeleteProductMutation,
  useGetCategoriesQuery,
  useGetProductsQuery,
  useUpdateProductMutation,
} from "@/store/api";

type Category = {
  _id: string;
  name: string;
};

type Product = {
  _id: string;
  name: string;
  category: Category | string;
  price: number;
  stockQuantity: number;
  minStockThreshold: number;
  status?: string;
  active?: boolean;
};

const PAGE_SIZE = 10;

function getErrorMessage(error: unknown, fallback: string) {
  return getApiErrorMessage(error, fallback);
}

function categoryName(product: Product) {
  return typeof product.category === "string"
    ? "Unknown"
    : product.category?.name || "Unknown";
}

function categoryId(product: Product) {
  return typeof product.category === "string"
    ? product.category
    : product.category?._id || "";
}

function isOutOfStock(product: Product) {
  return (
    product.active === false ||
    product.stockQuantity <= 0 ||
    product.status === "Out of Stock"
  );
}

function isLowStock(product: Product) {
  return !isOutOfStock(product) && product.stockQuantity <= product.minStockThreshold;
}

function statusLabel(product: Product) {
  return isOutOfStock(product) ? "Out of Stock" : "Active";
}

function stockProgress(product: Product) {
  if (product.stockQuantity <= 0) return 0;
  if (product.minStockThreshold <= 0) return 100;
  return Math.min(100, (product.stockQuantity / product.minStockThreshold) * 100);
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, idx) => (
        <tr key={idx} className="border-b border-white/10">
          {Array.from({ length: 8 }).map((__, cellIdx) => (
            <td key={cellIdx} className="px-4 py-3">
              <div className="h-4 w-full animate-pulse rounded bg-white/10" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export default function ProductsPage() {
  const { role } = useAuth();
  const isManager = role === "manager";

  const {
    data: productsData,
    isLoading: productsLoading,
    error: productsError,
  } = useGetProductsQuery();
  const {
    data: categoriesData,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useGetCategoriesQuery();
  const [createProduct] = useCreateProductMutation();
  const [updateProduct] = useUpdateProductMutation();
  const [deleteProduct] = useDeleteProductMutation();

  const products = useMemo(
    () => (Array.isArray(productsData) ? (productsData as Product[]) : []),
    [productsData],
  );
  const categories = useMemo(
    () => (Array.isArray(categoriesData) ? (categoriesData as Category[]) : []),
    [categoriesData],
  );
  const loading = productsLoading || categoriesLoading;

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [categorySearch, setCategorySearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const lastLoadErrorRef = useRef("");

  const form = useForm<ProductFormValues>({
    defaultValues: {
      name: "",
      category: "",
      price: 0,
      stockQuantity: 0,
      minStockThreshold: 0,
      isActive: true,
    },
  });
  const { reset } = form;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim().toLowerCase());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const firstError = productsError || categoriesError;
    if (!firstError) return;

    const message = getErrorMessage(firstError, "Failed to load products.");
    if (lastLoadErrorRef.current === message) return;

    lastLoadErrorRef.current = message;
    toast.error(message);
  }, [productsError, categoriesError]);

  const filteredCategories = useMemo(() => {
    const q = categorySearch.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((cat) => cat.name.toLowerCase().includes(q));
  }, [categories, categorySearch]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        !debouncedSearch || product.name.toLowerCase().includes(debouncedSearch);
      const matchesCategory =
        categoryFilter === "all" || categoryId(product) === categoryFilter;
      const label = statusLabel(product);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "Active" && label === "Active") ||
        (statusFilter === "Out of Stock" && label === "Out of Stock");

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, debouncedSearch, categoryFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));

  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const paginatedProducts = useMemo(() => {
    return filteredProducts.slice(pageStart, pageStart + PAGE_SIZE);
  }, [filteredProducts, pageStart]);

  const visibleCount = Math.min(pageStart + paginatedProducts.length, filteredProducts.length);

  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, idx) => idx + 1);
    }
    if (currentPage <= 4) return [1, 2, 3, 4, 5, -1, totalPages];
    if (currentPage >= totalPages - 3) {
      return [1, -1, totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, -1, currentPage - 1, currentPage, currentPage + 1, -1, totalPages];
  }, [currentPage, totalPages]);

  function openAddModal() {
    setEditingProduct(null);
    setCategorySearch("");
    reset({
      name: "",
      category: "",
      price: 0,
      stockQuantity: 0,
      minStockThreshold: 0,
      isActive: true,
    });
    setFormOpen(true);
  }

  function openEditModal(product: Product) {
    setEditingProduct(product);
    const selectedCategoryName =
      categories.find((cat) => cat._id === categoryId(product))?.name || "";
    setCategorySearch(selectedCategoryName);
    reset({
      name: product.name,
      category: categoryId(product),
      price: Number(product.price || 0),
      stockQuantity: Number(product.stockQuantity || 0),
      minStockThreshold: Number(product.minStockThreshold || 0),
      isActive: !isOutOfStock(product),
    });
    setFormOpen(true);
  }

  async function onSubmit(values: ProductFormValues) {
    if (!values.category) {
      toast.error("Please select a category.");
      return;
    }

    try {
      const finalStock = Math.max(0, Number(values.stockQuantity || 0));
      const payload = {
        name: values.name.trim(),
        category: values.category,
        price: Math.max(0, Number(values.price || 0)),
        stockQuantity: finalStock,
        minStockThreshold: Math.max(0, Number(values.minStockThreshold || 0)),
        status: values.isActive && finalStock > 0 ? "In Stock" : "Out of Stock",
        active: values.isActive,
      };

      if (editingProduct) {
        await updateProduct({ id: editingProduct._id, body: payload }).unwrap();
        toast.success("Product updated successfully.");
      } else {
        await createProduct(payload).unwrap();
        toast.success("Product created successfully.");
      }

      setFormOpen(false);
      setEditingProduct(null);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to save product."));
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteProduct({ id: deleteTarget._id }).unwrap();
      toast.success("Product deleted.");
      setDeleteTarget(null);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to delete product."));
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-white">Products</h1>
            <span className="inline-flex items-center rounded-full border border-indigo-300/40 bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-200">
              {products.length} total
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-[230px_170px_170px_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search products..."
                className="w-full rounded-xl border border-white/15 bg-[#11161f] py-2 pl-9 pr-3 text-sm text-slate-100 outline-none transition focus:border-indigo-400/70 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-white/15 bg-[#11161f] px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-indigo-400/70 focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-white/15 bg-[#11161f] px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-indigo-400/70 focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="all">All Status</option>
              <option value="Active">Active</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>

            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:scale-[1.01] hover:bg-indigo-500"
            >
              <Plus className="h-4 w-4" />
              Add Product
            </button>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.03] text-slate-300">
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">Product Name</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3 font-medium">Threshold</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <SkeletonRows />
              ) : paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-14">
                    <div className="mx-auto flex max-w-sm flex-col items-center text-center">
                      <div className="mb-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                        <PackageOpen className="h-10 w-10 text-slate-400" />
                      </div>
                      <p className="text-lg font-semibold text-slate-100">No products found</p>
                      <p className="mt-1 text-sm text-slate-400">
                        Try adjusting filters or add a new product.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((product, idx) => {
                  const out = isOutOfStock(product);
                  const low = isLowStock(product);
                  const progress = stockProgress(product);

                  return (
                    <tr
                      key={product._id}
                      className={`border-b border-white/10 transition hover:bg-white/[0.05] ${
                        low ? "border-l-2 border-l-amber-400" : "border-l-2 border-l-transparent"
                      }`}
                    >
                      <td className="px-4 py-3 text-slate-400">{pageStart + idx + 1}</td>
                      <td className="px-4 py-3 font-medium text-slate-100">{product.name}</td>
                      <td className="px-4 py-3 text-slate-300">{categoryName(product)}</td>
                      <td className="px-4 py-3 text-slate-300">৳ {Number(product.price || 0).toFixed(2)}</td>
                      <td className="px-4 py-3 text-slate-300">
                        <p>{product.stockQuantity}</p>
                        <div className="mt-1 h-1.5 w-32 overflow-hidden rounded-full bg-slate-700/70">
                          <div
                            className={`h-full rounded-full ${
                              out ? "bg-red-400" : low ? "bg-amber-400" : "bg-emerald-400"
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-300">{product.minStockThreshold}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            out
                              ? "bg-red-500/20 text-red-200"
                              : "bg-emerald-500/20 text-emerald-200"
                          }`}
                        >
                          {statusLabel(product)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(product)}
                            className="group relative inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/[0.03] text-slate-200 transition hover:border-indigo-400/70 hover:bg-indigo-500/20"
                            aria-label="Edit product"
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="pointer-events-none absolute -top-8 hidden rounded bg-black/80 px-2 py-1 text-xs text-white group-hover:block">
                              Edit
                            </span>
                          </button>

                          {!isManager ? (
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(product)}
                              className="group relative inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/[0.03] text-slate-200 transition hover:border-red-400/70 hover:bg-red-500/20"
                              aria-label="Delete product"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="pointer-events-none absolute -top-8 hidden rounded bg-black/80 px-2 py-1 text-xs text-white group-hover:block">
                                Delete
                              </span>
                            </button>
                          ) : null}
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
            Showing {visibleCount} of {filteredProducts.length} products
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1}
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
                    currentPage === n
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
              disabled={currentPage >= totalPages}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              className="rounded-lg border border-white/15 bg-white/[0.03] px-3 py-1.5 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </section>

      <ProductFormModal
        open={formOpen}
        editing={Boolean(editingProduct)}
        categorySearch={categorySearch}
        onCategorySearchChange={setCategorySearch}
        categories={filteredCategories}
        form={form}
        onClose={() => setFormOpen(false)}
        onSubmit={onSubmit}
      />

      <ProductDeleteModal
        open={Boolean(deleteTarget)}
        productName={deleteTarget?.name || "this product"}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
