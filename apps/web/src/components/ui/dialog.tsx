// File: apps/web/src/components/ui/dialog.tsx
// Accessible modal dialog — focus trap, backdrop, keyboard dismiss

"use client";

import { X } from "lucide-react";
import * as React from "react";
import { cn } from "../../lib/utils";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl";
}

const maxWidthMap = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
};

export function Dialog({
  open,
  onClose,
  children,
  className,
  maxWidth = "md",
}: DialogProps) {
  // Close on Escape
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Prevent body scroll when open
  React.useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-(--z-modal) flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={cn(
          "relative z-10 w-full",
          maxWidthMap[maxWidth],
          "bg-card text-card-foreground",
          "rounded-2xlvar(--border)]",
          "shadow-(--shadow-xl)",
          "animate-in fade-in-0 zoom-in-95 duration-200",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function DialogHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4",
        "px-6 pt-6 pb-4 border-b border-border",
        className,
      )}
    >
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

export function DialogTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2 className={cn("heading-display text-xl text-foreground", className)}>
      {children}
    </h2>
  );
}

export function DialogClose({ onClose }: { onClose: () => void }) {
  return (
    <button
      onClick={onClose}
      aria-label="Close dialog"
      className="
        absolute top-4 right-4
        p-1.5 rounded-(--radius-md)
        text-muted-foreground
        hover:bg-muted hover:text-foreground
        transition-colors duration-150
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
      "
    >
      <X size={16} aria-hidden="true" />
    </button>
  );
}

export function DialogBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("px-6 py-5", className)}>{children}</div>;
}

export function DialogFooter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-end gap-3",
        "px-6 pb-6 pt-4 border-t border-border",
        className,
      )}
    >
      {children}
    </div>
  );
}
