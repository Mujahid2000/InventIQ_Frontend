"use client";

import type { UseFormReturn } from "react-hook-form";
import ModalShell from "@/components/modals/shared/ModalShell";

export type ProductFormValues = {
  name: string;
  category: string;
  price: number;
  stockQuantity: number;
  minStockThreshold: number;
  isActive: boolean;
};

type CategoryOption = {
  _id: string;
  name: string;
};

type ProductFormModalProps = {
  open: boolean;
  editing: boolean;
  categorySearch: string;
  onCategorySearchChange: (value: string) => void;
  categories: CategoryOption[];
  form: UseFormReturn<ProductFormValues>;
  onClose: () => void;
  onSubmit: (values: ProductFormValues) => void | Promise<void>;
};

export default function ProductFormModal({
  open,
  editing,
  categorySearch,
  onCategorySearchChange,
  categories,
  form,
  onClose,
  onSubmit,
}: ProductFormModalProps) {
  const {
    register,
    setValue,
    watch,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  const activeFormStatus = watch("isActive");
  const isActive = activeFormStatus === true;

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      overlayClassName="items-start justify-center bg-black/55 pt-16 backdrop-blur-sm"
      panelClassName="product-modal-drop w-full max-w-3xl rounded-2xl border border-white/15 bg-[#101722] p-5 shadow-[0_24px_50px_rgba(0,0,0,0.55)]"
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">{editing ? "Edit Product" : "Add New Product"}</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md px-2 py-1 text-slate-400 hover:bg-white/10 hover:text-slate-200"
        >
          Close
        </button>
      </div>

      <form onSubmit={handleSubmit((values) => void onSubmit(values))} className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium text-slate-300">Product Name</label>
          <input
            {...register("name", {
              required: "Product name is required",
              minLength: { value: 2, message: "At least 2 characters" },
            })}
            className="w-full rounded-xl border border-white/15 bg-[#0f141d] px-3 py-2 text-slate-100 outline-none transition focus:border-indigo-400/70 focus:ring-2 focus:ring-indigo-500/20"
          />
          {errors.name ? <p className="mt-1 text-xs text-red-300">{errors.name.message}</p> : null}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-300">Category</label>
          <input
            value={categorySearch}
            onChange={(event) => onCategorySearchChange(event.target.value)}
            placeholder="Search category..."
            className="mb-2 w-full rounded-xl border border-white/15 bg-[#0f141d] px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-indigo-400/70 focus:ring-2 focus:ring-indigo-500/20"
          />
          <select
            {...register("category", { required: "Category is required" })}
            className="w-full rounded-xl border border-white/15 bg-[#0f141d] px-3 py-2 text-slate-100 outline-none transition focus:border-indigo-400/70 focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">Select category</option>
            {categories.map((category) => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </select>
          {errors.category ? <p className="mt-1 text-xs text-red-300">{errors.category.message}</p> : null}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-300">Price</label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">৳</span>
            <input
              type="number"
              step="0.01"
              min="0"
              {...register("price", {
                required: "Price is required",
                valueAsNumber: true,
                min: { value: 0, message: "Price cannot be negative" },
              })}
              className="w-full rounded-xl border border-white/15 bg-[#0f141d] py-2 pl-8 pr-3 text-slate-100 outline-none transition focus:border-indigo-400/70 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          {errors.price ? <p className="mt-1 text-xs text-red-300">{errors.price.message}</p> : null}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-300">Stock Quantity</label>
          <input
            type="number"
            min="0"
            {...register("stockQuantity", {
              required: "Stock quantity is required",
              valueAsNumber: true,
              min: { value: 0, message: "Stock cannot be negative" },
            })}
            className="w-full rounded-xl border border-white/15 bg-[#0f141d] px-3 py-2 text-slate-100 outline-none transition focus:border-indigo-400/70 focus:ring-2 focus:ring-indigo-500/20"
          />
          {errors.stockQuantity ? <p className="mt-1 text-xs text-red-300">{errors.stockQuantity.message}</p> : null}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-300">Min Stock Threshold</label>
          <input
            type="number"
            min="0"
            {...register("minStockThreshold", {
              required: "Threshold is required",
              valueAsNumber: true,
              min: { value: 0, message: "Threshold cannot be negative" },
            })}
            className="w-full rounded-xl border border-white/15 bg-[#0f141d] px-3 py-2 text-slate-100 outline-none transition focus:border-indigo-400/70 focus:ring-2 focus:ring-indigo-500/20"
          />
          {errors.minStockThreshold ? (
            <p className="mt-1 text-xs text-red-300">{errors.minStockThreshold.message}</p>
          ) : null}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-300">Status</label>
          <button
            type="button"
            onClick={() =>
              setValue("isActive", !isActive, {
                shouldValidate: true,
                shouldDirty: true,
              })
            }
            className={`inline-flex h-10 w-full items-center justify-between rounded-xl border px-3 transition ${
              isActive
                ? "border-emerald-400/50 bg-emerald-500/20"
                : "border-red-400/50 bg-red-500/20"
            }`}
            aria-pressed={isActive}
          >
            <span
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition ${
                isActive ? "border-emerald-300/60 bg-emerald-500/35" : "border-red-300/60 bg-red-500/30"
              }`}
            >
              <span
                className={`absolute left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  isActive ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </span>

            <span className="ml-3 text-sm font-medium text-slate-100">
              {isActive ? "Active" : "Inactive"}
            </span>
          </button>
          <input type="hidden" {...register("isActive")} />
        </div>

        <div className="mt-1 flex justify-end gap-2 md:col-span-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/15 bg-white/[0.03] px-4 py-2 text-sm text-slate-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isSubmitting ? "Saving..." : "Save Product"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
