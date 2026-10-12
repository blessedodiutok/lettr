// File: apps/web/src/components/BottomSheet.tsx
// Mobile-style drawer that slides up from the bottom
// Used for filter panels and quick-action menus on narrow screens

"use client";

import { X } from "lucide-react";
import * as React from "react";
import { cn } from "../lib/utils";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function BottomSheet({
  open,
  onClose,
  title,
  children,
  className,
}: BottomSheetProps) {
  // Escape key dismiss
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Body scroll lock
  React.useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-(--z-overlay)",
          "bg-black/40 backdrop-blur-[2px]",
          "transition-opacity duration-300",
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none",
        )}
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title ?? "Bottom sheet"}
        className={cn(
          "fixed bottom-0 inset-x-0 z-(--z-modal)",
          "bg-card text-card-foreground",
          "rounded-t-2xl",
          "border-t border-border",
          "shadow-(--shadow-xl)",
          "transition-transform duration-300 ease-out",
          open ? "translate-y-0" : "translate-y-full",
          "max-h-[90svh] flex flex-col",
          className,
        )}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div aria-hidden="true" className="w-10 h-1 rounded-full bg-border" />
        </div>

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0">
            <h2 className="font-semibold text-base text-foreground">{title}</h2>
            <button
              onClick={onClose}
              aria-label="Close"
              className="
                p-1.5 rounded-(--radius-md)
                text-muted-foreground
                hover:bg-muted
                transition-colors duration-150
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
              "
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">
          {children}
        </div>
      </div>
    </>
  );
}
