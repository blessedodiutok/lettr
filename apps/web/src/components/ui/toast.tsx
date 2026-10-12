// File: apps/web/src/components/ui/toast.tsx
// Lightweight toast notification — success, error, info, warning

"use client";

import { AlertTriangle, CheckCircle, Info, X, XCircle } from "lucide-react";
import * as React from "react";

import { cn } from "../../lib/utils";

type ToastVariant = "success" | "error" | "info" | "warning";

interface ToastProps {
  message: string;
  variant?: ToastVariant;
  onDismiss?: () => void;
  className?: string;
}

const variantConfig: Record<
  ToastVariant,
  {
    icon: React.ReactNode;
    classes: string;
  }
> = {
  success: {
    icon: <CheckCircle size={16} aria-hidden="true" />,

    classes:
      "bg-[var(--color-success-50)] border-[var(--color-success-200)] text-[var(--color-success-700)]",
  },

  error: {
    icon: <XCircle size={16} aria-hidden="true" />,

    classes:
      "bg-[var(--color-danger-50)] border-[var(--color-danger-200)] text-[var(--color-danger-700)]",
  },

  info: {
    icon: <Info size={16} aria-hidden="true" />,

    classes:
      "bg-[var(--color-primary-50)] border-[var(--color-primary-200)] text-[var(--color-primary-700)]",
  },

  warning: {
    icon: <AlertTriangle size={16} aria-hidden="true" />,

    classes:
      "bg-[var(--color-warning-50)] border-[var(--color-warning-200)] text-[var(--color-warning-700)]",
  },
};

export function Toast({
  message,
  variant = "info",
  onDismiss,
  className,
}: ToastProps) {
  const { icon, classes } = variantConfig[variant];

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        "flex items-start gap-3",
        "px-4 py-3",
        "rounded-lg",
        "border",
        "shadow-(--shadow-md)",
        "text-sm font-medium",
        "animate-in slide-in-from-top-2 duration-200",
        classes,
        className,
      )}
    >
      <span className="shrink-0 mt-0.5">{icon}</span>

      <p className="flex-1 leading-snug">{message}</p>

      {onDismiss && (
        <button
          onClick={onDismiss}
          aria-label="Dismiss notification"
          className="
            shrink-0
            -mr-1
            -mt-0.5
            p-0.5
            rounded
            opacity-70
            hover:opacity-100
            transition-opacity
          "
        >
          <X size={14} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (!toasts.length) return null;

  return (
    <div
      aria-label="Notifications"
      className="
        fixed
        top-4
        right-4
        z-(--z-toast)
        flex
        flex-col
        gap-2
        w-full
        max-w-sm
        pointer-events-none
      "
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast
            message={toast.message}
            variant={toast.variant}
            onDismiss={() => onDismiss(toast.id)}
          />
        </div>
      ))}
    </div>
  );
}

export function useToast() {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  function toast(message: string, variant: ToastVariant = "info") {
    const id = Math.random().toString(36).slice(2);

    setToasts((prev) => [
      ...prev,
      {
        id,
        message,
        variant,
      },
    ]);

    setTimeout(() => dismiss(id), 4000);
  }

  function dismiss(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  return {
    toasts,

    dismiss,

    success: (msg: string) => toast(msg, "success"),

    error: (msg: string) => toast(msg, "error"),

    info: (msg: string) => toast(msg, "info"),

    warning: (msg: string) => toast(msg, "warning"),
  };
}
