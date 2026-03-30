"use client";

import { Check, Loader2, Tag, X } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import ModalShell from "@/components/modals/shared/ModalShell";

export type CategoryFormValues = {
  name: string;
  description: string;
  iconColor: string;
};

type ColorSwatch = {
  label: string;
  hex: string;
};

type CategoryEditorModalProps = {
  open: boolean;
  closing: boolean;
  editing: boolean;
  colorSwatches: ColorSwatch[];
  form: UseFormReturn<CategoryFormValues>;
  onClose: () => void;
  onSubmit: (values: CategoryFormValues) => void | Promise<void>;
};

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) return `rgba(99,102,241,${alpha})`;

  const int = Number.parseInt(normalized, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function CategoryEditorModal({
  open,
  closing,
  editing,
  colorSwatches,
  form,
  onClose,
  onSubmit,
}: CategoryEditorModalProps) {
  const {
    register,
    watch,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  const watchedName = watch("name") || "";
  const watchedDescription = watch("description") || "";
  const watchedIconColor = watch("iconColor") || colorSwatches[0]?.hex || "#6366F1";

  return (
    <ModalShell
      open={open}
      overlayClassName="bg-black/70 backdrop-blur-sm"
      panelClassName={`w-full max-w-[480px] rounded-2xl border border-white/10 bg-[#161B22] p-7 shadow-[0_24px_60px_rgba(0,0,0,0.45)] ${
        closing ? "cat-modal-exit" : "cat-modal-enter"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-xl font-semibold text-white">
          {editing ? "Edit Category" : "Add New Category"}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1.5 text-slate-400 transition hover:bg-white/5 hover:text-slate-200"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="my-4 h-px bg-white/10" />

      <form onSubmit={handleSubmit((values) => void onSubmit(values))} className="space-y-4">
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
          {errors.name ? <p className="mt-1 text-xs text-red-300">{errors.name.message}</p> : null}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-300">Description (optional)</label>
          <textarea
            rows={3}
            {...register("description")}
            className="w-full resize-none rounded-xl border border-white/10 bg-[#0D1117] px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-indigo-400/70 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">Icon Color</label>
          <div className="flex flex-wrap items-center gap-2">
            {colorSwatches.map((swatch) => {
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
                <p className="truncate text-sm font-semibold text-white">{watchedName.trim() || "Category Name"}</p>
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
            onClick={onClose}
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
    </ModalShell>
  );
}
