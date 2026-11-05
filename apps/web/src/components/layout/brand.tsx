"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { IS_SAMPLE_CONTENT } from "../../content/sample";
import { cn } from "../../lib/cn";
import { IS_DEMO } from "../../lib/demo";

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("font-display text-2xl font-semibold tracking-tight text-ink", className)} aria-label="Lettr home">
      Lettr<span className="text-brass">.</span>
    </Link>
  );
}

/** Marks fictitious marketing content outside production builds, and always in the demo. */
export function SampleMarker({ className }: { className?: string }) {
  if (!IS_SAMPLE_CONTENT || (process.env.NODE_ENV === "production" && !IS_DEMO)) return null;
  return (
    <span
      title={IS_DEMO ? "Made-up content for this demo" : "Placeholder content — replace with real data before launch"}
      className={cn("inline-flex items-center rounded-full border border-dashed border-warn/60 bg-warn-soft px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-warn", className)}
    >
      Sample content
    </span>
  );
}

const THEMES = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <div role="radiogroup" aria-label="Colour theme" className={cn("inline-flex rounded-control border border-line bg-surface p-0.5", className)}>
      {THEMES.map(({ value, label, icon: Icon }) => {
        const active = mounted && theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(value)}
            className={cn("inline-flex items-center gap-1.5 rounded-[6px] px-2.5 py-1 text-xs font-medium", active ? "bg-navy-soft text-navy" : "text-muted hover:text-ink")}
          >
            <Icon className="size-3.5" aria-hidden />
            {label}
          </button>
        );
      })}
    </div>
  );
}
