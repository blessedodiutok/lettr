// File: apps/web/src/app/providers.tsx
// Client-side providers — QueryClient, ThemeProvider
// Separated from layout.tsx because providers need "use client"

"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider } from "next-themes";
import { getQueryClient } from "../lib/queryClient";

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <ThemeProvider
      attribute="data-theme" /* matches [data-theme="dark"] in globals.css */
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange /* prevents flash on theme switch */
    >
      <QueryClientProvider client={queryClient}>
        {children}
        {process.env.NODE_ENV === "development" && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </QueryClientProvider>
    </ThemeProvider>
  );
}
