"use client";

// Session state. The access token lives only in memory; the refresh token is
// an httpOnly cookie the browser sends to /api/auth automatically.

import { create } from "zustand";
import type { Me } from "../lib/types";

export type AuthStatus = "loading" | "authenticated" | "anonymous";

interface AuthState {
  status: AuthStatus;
  user: Me | null;
  accessToken: string | null;
  setSession: (user: Me, accessToken: string) => void;
  setAccessToken: (accessToken: string) => void;
  setUser: (user: Me) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  status: "loading",
  user: null,
  accessToken: null,
  setSession: (user, accessToken) => set({ user, accessToken, status: "authenticated" }),
  setAccessToken: (accessToken) => set({ accessToken }),
  setUser: (user) => set({ user }),
  clear: () => set({ user: null, accessToken: null, status: "anonymous" }),
}));

/** Where each role lands after signing in. */
export function homeFor(role: Me["role"] | undefined): string {
  if (role === "LANDLORD") return "/landlord/dashboard";
  if (role === "ADMIN") return "/admin";
  return "/dashboard";
}
