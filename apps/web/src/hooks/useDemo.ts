"use client";

import { useMutation } from "@tanstack/react-query";
import { api, errorMessage } from "../lib/api";
import type { Me } from "../lib/types";
import { homeFor } from "../stores/authStore";
import { toast } from "../stores/toastStore";

export type DemoPersona = "tenant" | "landlord" | "admin";

/** Sign in as a demo account. A full page load gives the new role a clean start. */
export function useDemoLogin() {
  return useMutation({
    mutationFn: (persona: DemoPersona) => api<{ user: Me; accessToken: string }>("post", "/api/demo/login", { persona }),
    onSuccess: ({ user }) => window.location.assign(homeFor(user.role)),
    onError: (error) => toast.error(errorMessage(error)),
  });
}

export function useDemoReset() {
  return useMutation({
    mutationFn: () => api<{ message: string }>("post", "/api/demo/reset", undefined, { timeout: 120_000 }),
    onSuccess: () => window.location.assign("/demo?reset=1"),
    onError: (error) => toast.error(errorMessage(error)),
  });
}
