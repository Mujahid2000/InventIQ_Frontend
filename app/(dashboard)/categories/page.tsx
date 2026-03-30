"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Boxes,
  FolderOpen,
  Layers3,
  MoreVertical,
  Pencil,
  Plus,
  RefreshCw,
  Tag,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  CategoryDeleteModal,
  CategoryEditorModal,
} from "@/components/modals";
import type { CategoryFormValues } from "@/components/modals/categories/CategoryEditorModal";
import { getApiErrorMessage } from "@/lib/api-error";
import { useAuth } from "@/hooks/useAuth";
import {
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
  useGetCategoriesQuery,
  useUpdateCategoryMutation,
} from "@/store/api";

type Category = {
  _id: string;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  iconColor?: string;
  productCount?: number;
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
  return getApiErrorMessage(error, fallback);
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

  const {
    data: categoriesData,
    isLoading: loading,
    error: categoriesError,
    refetch,
  } = useGetCategoriesQuery();
  const [createCategory] = useCreateCategoryMutation();
  const [updateCategory] = useUpdateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();

  const categories = useMemo(() => {
    const list = Array.isArray(categoriesData) ? categoriesData : [];
    return (list as Category[]).map((category) => ({
      ...category,
      productCount: Number(category.productCount || 0),
    }));
  }, [categoriesData]);
  const error = categoriesError
    ? getErrorMessage(categoriesError, "Failed to load categories.")
    : null;

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorClosing, setEditorClosing] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteClosing, setDeleteClosing] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  const form = useForm<CategoryFormValues>({
    defaultValues: {
      name: "",
      description: "",
      iconColor: CARD_FALLBACK_COLOR,
    },
  });
  const { reset } = form;

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
        await updateCategory({ id: editingCategory._id, body: payload }).unwrap();
        toast.success("Category updated.");
      } else {
        await createCategory(payload).unwrap();
        toast.success("Category created.");
      }

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
      await deleteCategory({ id: deleteTarget._id }).unwrap();
      toast.success("Category deleted.");
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
            onClick={refetch}
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

      <CategoryEditorModal
        open={editorOpen}
        closing={editorClosing}
        editing={Boolean(editingCategory)}
        colorSwatches={COLOR_SWATCHES}
        form={form}
        onClose={closeEditor}
        onSubmit={handleSave}
      />

      <CategoryDeleteModal
        open={deleteOpen}
        closing={deleteClosing}
        deleting={deleting}
        onClose={closeDeleteModal}
        onConfirm={handleDelete}
      />
    </div>
  );
}
