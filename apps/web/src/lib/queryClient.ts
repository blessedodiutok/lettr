// File: apps/web/src/lib/queryClient.ts
// TanStack Query client configuration
// staleTime: how long data is considered fresh before re-fetching
// gcTime: how long unused data stays in cache

import { QueryClient } from "@tanstack/react-query";

export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute — data is fresh for 1 min
        gcTime: 5 * 60 * 1000, // 5 minutes — cache cleared after 5 min unused
        retry: 1, // Retry once on failure
        refetchOnWindowFocus: false, // Don't refetch every time user switches tabs
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

// Browser singleton — one QueryClient for the entire browser session
let browserQueryClient: QueryClient | undefined;

export function getQueryClient(): QueryClient {
  if (typeof window === "undefined") {
    // Server: always create a new client (never share between requests)
    return makeQueryClient();
  }
  // Browser: reuse the same client instance
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}
