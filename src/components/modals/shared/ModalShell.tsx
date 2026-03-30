"use client";

import type { MouseEvent, ReactNode } from "react";

type ModalShellProps = {
  open: boolean;
  children: ReactNode;
  overlayClassName?: string;
  panelClassName?: string;
  closeOnOverlayClick?: boolean;
  onClose?: () => void;
};

function cx(...parts: Array<string | undefined | null | false>) {
  return parts.filter(Boolean).join(" ");
}

export default function ModalShell({
  open,
  children,
  overlayClassName,
  panelClassName,
  closeOnOverlayClick = false,
  onClose,
}: ModalShellProps) {
  if (!open) return null;

  const handleOverlayClick = () => {
    if (closeOnOverlayClick) {
      onClose?.();
    }
  };

  const stopPropagation = (event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  return (
    <div
      className={cx("fixed inset-0 z-40 flex items-center justify-center p-4", overlayClassName)}
      onClick={handleOverlayClick}
      role="presentation"
    >
      <div className={panelClassName} onClick={stopPropagation} role="dialog" aria-modal="true">
        {children}
      </div>
    </div>
  );
}
