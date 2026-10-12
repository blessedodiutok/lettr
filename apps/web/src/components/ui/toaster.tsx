"use client";

import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { cn } from "../../lib/cn";
import { useToastStore } from "../../stores/toastStore";

const ICONS = { success: CheckCircle2, error: XCircle, info: Info };
const TONES = { success: "text-ok", error: "text-bad", info: "text-info" };

export function Toaster() {
  const { toasts, dismiss } = useToastStore();
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom,0px)+5rem)] z-[60] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:right-6 sm:left-auto sm:items-end">
      {toasts.map((t) => {
        const Icon = ICONS[t.tone];
        return (
          <div
            key={t.id}
            role={t.tone === "error" ? "alert" : "status"}
            className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-card border border-line bg-surface px-4 py-3 shadow-3 animate-in fade-in-0 slide-in-from-bottom-2"
          >
            <Icon className={cn("mt-0.5 size-5 shrink-0", TONES[t.tone])} aria-hidden />
            <p className="flex-1 text-sm font-medium text-ink">{t.message}</p>
            <button type="button" onClick={() => dismiss(t.id)} className="text-muted hover:text-ink" aria-label="Dismiss">
              <X className="size-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
