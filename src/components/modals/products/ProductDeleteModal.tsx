"use client";

import { AlertTriangle } from "lucide-react";
import ModalShell from "@/components/modals/shared/ModalShell";

type ProductDeleteModalProps = {
  open: boolean;
  productName: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function ProductDeleteModal({
  open,
  productName,
  onCancel,
  onConfirm,
}: ProductDeleteModalProps) {
  return (
    <ModalShell
      open={open}
      overlayClassName="z-50 bg-black/60 backdrop-blur-sm"
      panelClassName="w-full max-w-sm rounded-2xl border border-red-400/35 bg-[#101722] p-5 text-center shadow-[0_18px_45px_rgba(0,0,0,0.55)]"
    >
      <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-red-500/20 text-red-300">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-semibold text-white">Are you sure?</h3>
      <p className="mt-1 text-sm text-slate-300">
        Delete {productName}? This action cannot be undone.
      </p>

      <div className="mt-5 flex justify-center gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-white/15 bg-white/[0.03] px-4 py-2 text-sm text-slate-200"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
        >
          Delete
        </button>
      </div>
    </ModalShell>
  );
}
