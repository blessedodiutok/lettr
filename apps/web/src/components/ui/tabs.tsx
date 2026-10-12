// File: apps/web/src/components/ui/tabs.tsx
// Accessible tabs component — keyboard navigable

"use client";

import * as React from "react";
import { cn } from "../../lib/utils";

interface Tab {
  id: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  const listRef = React.useRef<HTMLDivElement>(null);

  function handleKeyDown(e: React.KeyboardEvent, tabId: string) {
    const ids = tabs.map((t) => t.id);
    const currentIndex = ids.indexOf(tabId);
    if (e.key === "ArrowRight") {
      onChange(ids[(currentIndex + 1) % ids.length]);
    } else if (e.key === "ArrowLeft") {
      onChange(ids[(currentIndex - 1 + ids.length) % ids.length]);
    }
  }

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-orientation="horizontal"
      className={cn(
        "flex items-center gap-1",
        "bg-muted rounded-lg p-1",
        className,
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, tab.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5",
              "text-sm font-medium rounded-(--radius-md)",
              "transition-all duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isActive
                ? "bg-white text-foreground shadow-(--shadow-sm)"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={cn(
                  "inline-flex items-center justify-center",
                  "min-w-4.5 h-4.5 px-1 rounded-full",
                  "text-[10px] font-semibold",
                  isActive
                    ? "bg-(--color-primary-100) text-(--color-primary-700)"
                    : "bg-border text-muted-foreground",
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

interface TabPanelProps {
  id: string;
  activeTab: string;
  children: React.ReactNode;
  className?: string;
}

export function TabPanel({
  id,
  activeTab,
  children,
  className,
}: TabPanelProps) {
  if (id !== activeTab) return null;
  return (
    <div role="tabpanel" tabIndex={0} className={className}>
      {children}
    </div>
  );
}
