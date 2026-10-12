"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api } from "../lib/api";
import type { Me } from "../lib/types";
import { homeFor, useAuthStore } from "../stores/authStore";
import { toast } from "../stores/toastStore";

interface SessionResponse {
  user: Me;
  accessToken: string;
}

/** Only follow same-site relative redirects after login. */
export function safeNext(next: string | null | undefined): string | null {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : null;
}

export function useLogin() {
  const setSession = useAuthStore((s) => s.setSession);
  const router = useRouter();
  return useMutation({
    mutationFn: (input: { email: string; password: string; next?: string | null }) =>
      api<SessionResponse>("post", "/api/auth/login", { email: input.email, password: input.password }),
    onSuccess: (data, input) => {
      setSession(data.user, data.accessToken);
      router.replace(safeNext(input.next) ?? homeFor(data.user.role));
      router.refresh();
    },
  });
}

export function useSignup() {
  return useMutation({
    mutationFn: (input: { email: string; password: string; firstName: string; lastName: string; role: "LANDLORD" | "TENANT"; phone?: string }) =>
      api<{ userId: string; email: string; message: string }>("post", "/api/auth/signup", input),
  });
}

export function useVerifyOtp() {
  const setSession = useAuthStore((s) => s.setSession);
  const router = useRouter();
  return useMutation({
    mutationFn: (input: { userId: string; otp: string; next?: string | null }) =>
      api<SessionResponse>("post", "/api/auth/verify-otp", { userId: input.userId, otp: input.otp }),
    onSuccess: (data, input) => {
      setSession(data.user, data.accessToken);
      toast.success("Your email is verified. Welcome to Lettr.");
      router.replace(safeNext(input.next) ?? homeFor(data.user.role));
      router.refresh();
    },
  });
}

export function useResendOtp() {
  return useMutation({
    mutationFn: (userId: string) => api<{ message: string }>("post", "/api/auth/resend-otp", { userId }),
    onSuccess: (data) => toast.info(data.message),
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (email: string) => api<{ message: string }>("post", "/api/auth/forgot-password", { email }),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (input: { token: string; password: string }) => api<{ message: string }>("post", "/api/auth/reset-password", input),
  });
}

export function useChangePassword() {
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  return useMutation({
    mutationFn: (input: { currentPassword: string; newPassword: string }) =>
      api<{ accessToken: string }>("post", "/api/auth/change-password", input),
    onSuccess: (data) => {
      setAccessToken(data.accessToken);
      toast.success("Password changed. Other devices have been signed out.");
    },
  });
}

export function useLogout() {
  const clear = useAuthStore((s) => s.clear);
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: () => api("post", "/api/auth/logout"),
    onSettled: () => {
      clear();
      queryClient.clear();
      router.replace("/");
      router.refresh();
    },
  });
}
