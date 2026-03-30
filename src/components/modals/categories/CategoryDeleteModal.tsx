"use client";

import { AlertTriangle, Loader2 } from "lucide-react";
import ModalShell from "@/components/modals/shared/ModalShell";

type CategoryDeleteModalProps = {
  open: boolean;
  closing: boolean;
  deleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function CategoryDeleteModal({
  open,
  closing,
  deleting,
  onClose,
  onConfirm,
}: CategoryDeleteModalProps) {
  return (
    <ModalShell
      open={open}
      overlayClassName="z-50 bg-black/70 backdrop-blur-sm"
      panelClassName={`w-full max-w-[380px] rounded-2xl border border-white/10 bg-[#161B22] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.45)] ${
        closing ? "cat-modal-exit" : "cat-modal-enter"
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
          onClick={onClose}
          className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2 text-sm text-slate-300 transition hover:bg-white/[0.06]"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={deleting}
          className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-60"
        >
          {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {deleting ? "Deleting..." : "Delete"}
        </button>
      </div>
    </ModalShell>
  );
}
