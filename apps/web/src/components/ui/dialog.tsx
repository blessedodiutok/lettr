"use client";

import { X } from "lucide-react";
import { Dialog as RadixDialog } from "radix-ui";
import * as React from "react";
import { cn } from "../../lib/cn";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

/** Modal dialog. On phones it rises from the bottom as a sheet. */
export function Dialog({ open, onOpenChange, title, description, children, footer, size = "md" }: DialogProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-50 bg-navy-deep/50 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        <RadixDialog.Content
          className={cn(
            "fixed z-50 flex max-h-[92svh] w-full flex-col bg-surface shadow-3 outline-none",
            "inset-x-0 bottom-0 rounded-t-[20px] sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-media",
            "data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-8 sm:data-[state=open]:slide-in-from-bottom-2 sm:data-[state=open]:fade-in-0",
            { sm: "sm:max-w-md", md: "sm:max-w-lg", lg: "sm:max-w-2xl" }[size],
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b border-line px-5 pb-4 pt-5">
            <div className="min-w-0">
              <RadixDialog.Title className="font-display text-xl font-medium text-ink">{title}</RadixDialog.Title>
              {description ? (
                <RadixDialog.Description className="mt-1 text-sm text-muted">{description}</RadixDialog.Description>
              ) : (
                <RadixDialog.Description className="sr-only">{title}</RadixDialog.Description>
              )}
            </div>
            <RadixDialog.Close className="-mr-1 rounded-control p-1.5 text-muted hover:bg-surface-2 hover:text-ink" aria-label="Close">
              <X className="size-5" />
            </RadixDialog.Close>
          </div>
          <div className="overflow-y-auto px-5 py-5">{children}</div>
          {footer && <div className="flex flex-col-reverse gap-2 border-t border-line px-5 py-4 sm:flex-row sm:justify-end">{footer}</div>}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

interface ConfirmProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  tone?: "primary" | "danger";
  isLoading?: boolean;
  onConfirm: () => void;
}

/** A yes/no dialog for actions that are hard to undo. */
export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel, tone = "primary", isLoading, onConfirm }: ConfirmProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      size="sm"
      footer={
        <>
          <button type="button" onClick={() => onOpenChange(false)} className="h-10 rounded-control border border-line-strong px-4 text-sm font-semibold text-ink hover:bg-surface-2">
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(
              "h-10 rounded-control px-4 text-sm font-semibold disabled:opacity-60",
              tone === "danger" ? "bg-bad text-white" : "bg-navy text-on-navy hover:bg-navy-hover",
            )}
          >
            {isLoading ? "Working…" : confirmLabel}
          </button>
        </>
      }
    >
      <div className="text-[15px] leading-relaxed text-ink-2">{description}</div>
    </Dialog>
  );
}
