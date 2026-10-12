"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useEffect } from "react";
import { Toaster } from "../components/ui/toaster";
import { api, refreshAccessToken } from "../lib/api";
import { getQueryClient } from "../lib/queryClient";
import type { Me } from "../lib/types";
import { useAuthStore } from "../stores/authStore";

/** Restore the session from the refresh cookie on every page load. */
function SessionRestorer() {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = await refreshAccessToken();
      if (cancelled) return;
      if (!token) {
        useAuthStore.getState().clear();
        return;
      }
      try {
        const me = await api<Me>("get", "/api/auth/me");
        if (!cancelled) useAuthStore.getState().setSession(me, token);
      } catch {
        if (!cancelled) useAuthStore.getState().clear();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  return (
    <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <SessionRestorer />
        {children}
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
