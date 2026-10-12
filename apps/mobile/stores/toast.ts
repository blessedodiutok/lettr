import { create } from "zustand";

export type ToastTone = "success" | "error" | "info";

interface ToastState {
  message: string | null;
  tone: ToastTone;
  show: (tone: ToastTone, message: string) => void;
  hide: () => void;
}

let timer: ReturnType<typeof setTimeout> | undefined;

export const useToastStore = create<ToastState>((set) => ({
  message: null,
  tone: "info",
  show: (tone, message) => {
    if (timer) clearTimeout(timer);
    set({ tone, message });
    timer = setTimeout(() => set({ message: null }), tone === "error" ? 6000 : 3500);
  },
  hide: () => set({ message: null }),
}));

export const toast = {
  success: (message: string) => useToastStore.getState().show("success", message),
  error: (message: string) => useToastStore.getState().show("error", message),
  info: (message: string) => useToastStore.getState().show("info", message),
};
