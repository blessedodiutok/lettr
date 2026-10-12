// File: apps/web/src/stores/authStore.ts
// Zustand 5 store for authentication state
// Access token stored in memory only (never localStorage — XSS risk)
// Refresh token stored in httpOnly cookie (handled by the server)

"use client";

import { create } from "zustand";

export interface AuthUser {
  id: string;
  email: string;
  role: "LANDLORD" | "TENANT" | "ADMIN";
  firstName: string;
  lastName: string;
  /** Computed full name — derived from firstName + lastName */
  name: string;
  avatarUrl?: string | null;
  isEmailVerified: boolean;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: AuthUser) => void;
  setAccessToken: (token: string) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
  hydrate: (user: Omit<AuthUser, "name">, token: string) => void;
}

/** Normalise a raw API user (no `name`) into an AuthUser (with `name`) */
function withName(raw: Omit<AuthUser, "name">): AuthUser {
  return {
    ...raw,
    name: `${raw.firstName} ${raw.lastName}`.trim(),
  };
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isLoading: true,
  isAuthenticated: false,

  setUser: (user) => set({ user, isAuthenticated: true }),

  setAccessToken: (token) => set({ accessToken: token }),

  setLoading: (isLoading) => set({ isLoading }),

  logout: () =>
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
    }),

  hydrate: (raw, token) =>
    set({
      user: withName(raw),
      accessToken: token,
      isAuthenticated: true,
      isLoading: false,
    }),
}));
