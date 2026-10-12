"use client";

import { useCallback } from "react";
import { api } from "../lib/api";
import type { Me } from "../lib/types";
import { useAuthStore } from "../stores/authStore";

/** Reload the signed-in user after server-side changes (verification, payouts). */
export function useRefreshMe() {
  const setUser = useAuthStore((s) => s.setUser);
  return useCallback(async () => {
    const me = await api<Me>("get", "/api/auth/me");
    setUser(me);
    return me;
  }, [setUser]);
}
