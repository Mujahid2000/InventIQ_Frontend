"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import {
  AlertTriangle,
  Boxes,
  Check,
  FolderOpen,
  Layers3,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  RefreshCw,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/axios";
import { useAuth } from "@/hooks/useAuth";

type Category = {
  _id: string;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  iconColor?: string;
  productCount?: number;
};

type CategoryFormValues = {
  name: string;
  description: string;
  iconColor: string;
};

const COLOR_SWATCHES = [
  { label: "Indigo", hex: "#6366F1" },
  { label: "Green", hex: "#22C55E" },
  { label: "Amber", hex: "#F59E0B" },
  { label: "Pink", hex: "#EC4899" },
  { label: "Teal", hex: "#14B8A6" },
  { label: "Coral", hex: "#FB7185" },
];

const CARD_FALLBACK_COLOR = COLOR_SWATCHES[0].hex;

function getErrorMessage(error: unknown, fallback: string) {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response?: { data?: { message?: string } } }).response
      ?.data?.message === "string"
  ) {
    return (error as { response: { data: { message: string } } }).response.data
      .message;
  }
  return fallback;
}

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) return `rgba(99,102,241,${alpha})`;

  const int = Number.parseInt(normalized, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function formatDate(dateValue?: string) {
  if (!dateValue) return "Unknown";
  return new Date(dateValue).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function resolveColor(category: Category, index: number) {
  if (category.iconColor) return category.iconColor;
  return COLOR_SWATCHES[index % COLOR_SWATCHES.length]?.hex || CARD_FALLBACK_COLOR;
}

export default function CategoriesPage() {
  const { role } = useAuth();
  const isManager = role === "manager";
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorClosing, setEditorClosing] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteClosing, setDeleteClosing] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormValues>({
    defaultValues: {
      name: "",
      description: "",
      iconColor: CARD_FALLBACK_COLOR,
    },
  });

  const watchedName = watch("name") || "";
  const watchedDescription = watch("description") || "";
  const watchedIconColor = watch("iconColor") || CARD_FALLBACK_COLOR;

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get<Category[]>("/api/categories");

      const list = (Array.isArray(data) ? data : []).map((category) => ({
        ...category,
        productCount: Number(category.productCount || 0),
      }));

      setCategories(list);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to load categories."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const stats = useMemo(() => {
    const totalCategories = categories.length;
    const activeCategories = categories.filter(
      (category) => Number(category.productCount || 0) > 0,
    ).length;
    const totalProducts = categories.reduce(
      (sum, category) => sum + Number(category.productCount || 0),
      0,
    );

    return { totalCategories, activeCategories, totalProducts };
  }, [categories]);

  function openAddEditor() {
    setEditingCategory(null);
    reset({
      name: "",
      description: "",
      iconColor: CARD_FALLBACK_COLOR,
    });
    setEditorClosing(false);
    setEditorOpen(true);
  }

  function openEditEditor(category: Category, index: number) {
    setEditingCategory(category);
    reset({
      name: category.name || "",
      description: category.description || "",
      iconColor: resolveColor(category, index),
    });
    setEditorClosing(false);
    setEditorOpen(true);
  }

  function closeEditor() {
    setEditorClosing(true);
    window.setTimeout(() => {
      setEditorOpen(false);
      setEditorClosing(false);
      setEditingCategory(null);
    }, 150);
  }

  async function handleSave(values: CategoryFormValues) {
    const payload = {
      name: values.name.trim(),
      description: values.description.trim(),
      iconColor: values.iconColor,
    };

    try {
      if (editingCategory) {
        await api.put(`/api/categories/${editingCategory._id}`, payload);
        toast.success("Category updated.");
      } else {
        await api.post("/api/categories", payload);
        toast.success("Category created.");
      }

      await fetchCategories();
      closeEditor();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Could not save category."));
    }
  }

  function openDeleteModal(category: Category) {
    setDeleteTarget(category);
    setDeleteClosing(false);
    setDeleteOpen(true);
  }

  function closeDeleteModal() {
    setDeleteClosing(true);
    window.setTimeout(() => {
      setDeleteOpen(false);
      setDeleteClosing(false);
      setDeleteTarget(null);
      setDeleting(false);
    }, 150);
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      await api.delete(`/api/categories/${deleteTarget._id}`);
      toast.success("Category deleted.");
      await fetchCategories();
      closeDeleteModal();
    } catch (err: unknown) {
      setDeleting(false);
      toast.error(getErrorMessage(err, "Could not delete category."));
    }
  }

  return (
    <div className="space-y-6 text-slate-100">
      <section className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-white/10 bg-[#161B22]/65 p-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Categories</h1>
          <p className="mt-1 text-[13px] text-slate-400">
            Manage your product categories
          </p>
        </div>
        <button
          type="button"
          onClick={openAddEditor}
          className="inline-flex items-center gap-2 rounded-xl bg-[#6366F1] px-4 py-2 text-sm font-semibold text-white transition duration-200 hover:scale-[1.02] hover:brightness-110"
        >
          <Plus className="h-4 w-4" />
          Add Category
        </button>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <article className="rounded-xl border border-white/10 bg-[#161B22] p-4">
          <div className="inline-flex rounded-lg bg-indigo-500/20 p-2 text-indigo-300">
            <Layers3 className="h-4 w-4" />
          </div>
          <p className="mt-3 text-[22px] font-bold text-white">{stats.totalCategories}</p>
          <p className="text-xs text-slate-400">Total Categories</p>
        </article>

        <article className="rounded-xl border border-white/10 bg-[#161B22] p-4">
          <div className="inline-flex rounded-lg bg-emerald-500/20 p-2 text-emerald-300">
            <FolderOpen className="h-4 w-4" />
          </div>
          <p className="mt-3 text-[22px] font-bold text-white">{stats.activeCategories}</p>
          <p className="text-xs text-slate-400">Active Categories</p>
        </article>

        <article className="rounded-xl border border-white/10 bg-[#161B22] p-4">
          <div className="inline-flex rounded-lg bg-sky-500/20 p-2 text-sky-300">
            <Boxes className="h-4 w-4" />
          </div>
          <p className="mt-3 text-[22px] font-bold text-white">{stats.totalProducts}</p>
          <p className="text-xs text-slate-400">Total Products across all categories</p>
        </article>
      </section>

      {loading ? (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={idx}
              className="h-52 animate-pulse rounded-2xl border border-white/10 bg-[#161B22]"
            />
          ))}
        </section>
      ) : error ? (
        <section className="rounded-2xl border border-red-400/25 bg-red-500/10 p-6 text-center">
          <p className="text-sm text-red-200">{error}</p>
          <button
            type="button"
            onClick={fetchCategories}
            className="mt-3 inline-flex items-center gap-2 rounded-lg border border-red-300/35 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-100 transition hover:bg-red-500/20"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </section>
      ) : categories.length === 0 ? (
        <section className="rounded-2xl border border-white/10 bg-[#161B22] p-8 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-[#0D1117]">
            <div className="relative h-10 w-10">
              <span className="absolute left-0 top-0 h-4 w-4 rounded-md bg-indigo-400/50" />
              <span className="absolute right-0 top-1 h-5 w-5 rounded-full bg-teal-400/40" />
              <span className="absolute bottom-0 left-2 h-4 w-6 rounded-lg bg-pink-400/40" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-white">No categories yet</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
            Create your first category to start organizing products
          </p>
          <button
            type="button"
            onClick={openAddEditor}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#6366F1] px-4 py-2 text-sm font-semibold text-white transition duration-200 hover:scale-[1.02] hover:brightness-110"
          >
            <Plus className="h-4 w-4" />
            Add Category
          </button>
        </section>
      ) : (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {categories.map((category, index) => {
            const color = resolveColor(category, index);
            return (
              <article
                key={category._id}
                className="cat-card-enter rounded-2xl border border-white/10 bg-[#161B22] p-4 transition-all duration-200 ease-out hover:-translate-y-1 hover:border-indigo-400/75"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{
                      backgroundColor: hexToRgba(color, 0.2),
                      color,
                      border: `1px solid ${hexToRgba(color, 0.4)}`,
                    }}
                  >
                    <Tag className="h-4 w-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-[15px] font-semibold text-white">{category.name}</h3>
                    <span className="mt-1 inline-flex rounded-full bg-indigo-500/20 px-2 py-0.5 text-[11px] font-medium text-indigo-200">
                      {Number(category.productCount || 0)} products
                    </span>
                  </div>
                </div>

                <p className="cat-line-clamp-2 mt-4 min-h-10 text-[12px] leading-relaxed text-slate-400">
                  {category.description?.trim() || "No description added yet."}
                </p>

                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                  <p className="text-[11px] text-slate-500">Created: {formatDate(category.createdAt)}</p>
                  <div className="flex items-center gap-1.5">
                    <MoreVertical className="h-4 w-4 text-slate-500" />
                    <button
                      type="button"
                      onClick={() => openEditEditor(category, index)}
                      className="rounded-md p-1.5 text-slate-400 transition hover:bg-white/5 hover:text-indigo-200"
                      aria-label={`Edit ${category.name}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    {!isManager ? (
                      <button
                        type="button"
                        onClick={() => openDeleteModal(category)}
                        className="rounded-md p-1.5 text-slate-400 transition hover:bg-red-500/10 hover:text-red-300"
                        aria-label={`Delete ${category.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {editorOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div
            className={`w-full max-w-[480px] rounded-2xl border border-white/10 bg-[#161B22] p-7 shadow-[0_24px_60px_rgba(0,0,0,0.45)] ${
              editorClosing ? "cat-modal-exit" : "cat-modal-enter"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-xl font-semibold text-white">
                {editingCategory ? "Edit Category" : "Add New Category"}
              </h2>
              <button
                type="button"
                onClick={closeEditor}
                className="rounded-md p-1.5 text-slate-400 transition hover:bg-white/5 hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="my-4 h-px bg-white/10" />

            <form onSubmit={handleSubmit(handleSave)} className="space-y-4">
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-300">Category Name *</label>
                  <span className="text-xs text-slate-500">{watchedName.length}/30</span>
                </div>
                <input
                  {...register("name", {
                    required: "Category name is required",
                    minLength: { value: 2, message: "At least 2 characters required" },
                    maxLength: { value: 30, message: "Maximum 30 characters" },
                  })}
                  className="w-full rounded-xl border border-white/10 bg-[#0D1117] px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-indigo-400/70 focus:ring-2 focus:ring-indigo-500/20"
                />
                {errors.name ? (
                  <p className="mt-1 text-xs text-red-300">{errors.name.message}</p>
                ) : null}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">
                  Description (optional)
                </label>
                <textarea
                  rows={3}
                  {...register("description")}
                  className="w-full resize-none rounded-xl border border-white/10 bg-[#0D1117] px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-indigo-400/70 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Icon Color</label>
                <div className="flex flex-wrap items-center gap-2">
                  {COLOR_SWATCHES.map((swatch) => {
                    const selected = watchedIconColor === swatch.hex;
                    return (
                      <button
                        key={swatch.hex}
                        type="button"
                        title={swatch.label}
                        onClick={() =>
                          setValue("iconColor", swatch.hex, {
                            shouldValidate: true,
                            shouldDirty: true,
                          })
                        }
                        className={`relative h-8 w-8 rounded-full transition ${
                          selected ? "ring-2 ring-white ring-offset-2 ring-offset-[#161B22]" : ""
                        }`}
                        style={{ backgroundColor: swatch.hex }}
                      >
                        {selected ? (
                          <Check className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 text-white" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
                <input type="hidden" {...register("iconColor")} />
              </div>

              <div className="rounded-xl border border-white/10 bg-[#0D1117] p-3">
                <p className="mb-2 text-xs uppercase tracking-[0.14em] text-slate-500">Live Preview</p>
                <div className="rounded-xl border border-white/10 bg-[#161B22] p-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg"
                      style={{
                        backgroundColor: hexToRgba(watchedIconColor, 0.2),
                        color: watchedIconColor,
                        border: `1px solid ${hexToRgba(watchedIconColor, 0.4)}`,
                      }}
                    >
                      <Tag className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">
                        {watchedName.trim() || "Category Name"}
                      </p>
                      <span className="inline-flex rounded-full bg-indigo-500/20 px-2 py-0.5 text-[11px] text-indigo-200">
                        0 products
                      </span>
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-slate-400">
                    {watchedDescription.trim() || "Description preview will appear here."}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeEditor}
                  className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2 text-sm text-slate-300 transition hover:bg-white/[0.06]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#6366F1] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {isSubmitting ? "Saving..." : "Save Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {deleteOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div
            className={`w-full max-w-[380px] rounded-2xl border border-white/10 bg-[#161B22] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.45)] ${
              deleteClosing ? "cat-modal-exit" : "cat-modal-enter"
            }`}
          >
            <div className="mx-auto mb-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-red-500/20 text-red-300">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <h3 className="text-center text-lg font-semibold text-white">Delete Category?</h3>
            <p className="mt-2 text-center text-sm leading-relaxed text-slate-400">
              This will not delete the products inside. Are you sure you want to continue?
            </p>

            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={closeDeleteModal}
                className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2 text-sm text-slate-300 transition hover:bg-white/[0.06]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-60"
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <style jsx>{`
        @keyframes catCardIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes catModalIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes catModalOut {
          from {
            opacity: 1;
            transform: scale(1);
          }
          to {
            opacity: 0;
            transform: scale(0.95);
          }
        }

        .cat-card-enter {
          opacity: 0;
          animation: catCardIn 360ms cubic-bezier(0.2, 0.65, 0.2, 1) forwards;
        }

        .cat-modal-enter {
          animation: catModalIn 150ms ease-out forwards;
        }

        .cat-modal-exit {
          animation: catModalOut 150ms ease-in forwards;
        }

        .cat-line-clamp-2 {
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
      `}</style>
    </div>
  );
}
