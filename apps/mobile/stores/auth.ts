import { create } from "zustand";
import type { Me } from "../lib/types";

export type AuthStatus = "loading" | "authenticated" | "anonymous";

interface AuthState {
  status: AuthStatus;
  user: Me | null;
  setUser: (user: Me) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  status: "loading",
  user: null,
  setUser: (user) => set({ user, status: "authenticated" }),
  clear: () => set({ user: null, status: "anonymous" }),
}));
