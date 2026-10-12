// File: apps/web/src/hooks/useAuth.ts
// Authentication mutations and helpers

"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { apiClient } from "../lib/axios";
import type { AuthUser } from "../stores/authStore";
import { useAuthStore } from "../stores/authStore";

interface LoginInput {
  email: string;
  password: string;
}
interface SignupInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: "LANDLORD" | "TENANT";
  phone?: string;
}
interface VerifyOtpInput {
  userId: string;
  otp: string;
}
interface ResendOtpInput {
  userId: string;
}

interface AuthResponse {
  user: AuthUser;
  accessToken: string;
}

export function useLogin() {
  const { hydrate } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: async (input: LoginInput) => {
      const { data } = await apiClient.post<{ data: AuthResponse }>(
        "/api/auth/login",
        input,
      );
      return data.data;
    },
    onSuccess: (data) => {
      hydrate(data.user, data.accessToken);
      if (data.user.role === "LANDLORD") {
        router.push("/landlord/dashboard");
      } else {
        router.push("/dashboard");
      }
    },
  });
}

export function useSignup() {
  const router = useRouter();

  return useMutation({
    mutationFn: async (input: SignupInput) => {
      const { data } = await apiClient.post<{
        data: { userId: string; message: string };
      }>("/api/auth/signup", input);
      return data.data;
    },
    onSuccess: (data) => {
      router.push(`/verify-otp?userId=${data.userId}`);
    },
  });
}

export function useVerifyOtp() {
  const { hydrate } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: async (input: VerifyOtpInput) => {
      const { data } = await apiClient.post<{ data: AuthResponse }>(
        "/api/auth/verify-otp",
        input,
      );
      return data.data;
    },
    onSuccess: (data) => {
      hydrate(data.user, data.accessToken);
      if (data.user.role === "LANDLORD") {
        router.push("/landlord/dashboard");
      } else {
        router.push("/dashboard");
      }
    },
  });
}

export function useResendOtp() {
  return useMutation({
    mutationFn: async (input: ResendOtpInput) => {
      const { data } = await apiClient.post<{ data: { message: string } }>(
        "/api/auth/resend-otp",
        input,
      );
      return data.data;
    },
  });
}

export function useLogout() {
  const { logout } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: async () => {
      await apiClient.post("/api/auth/logout");
    },
    onSuccess: () => {
      logout();
      router.push("/");
    },
    onError: () => {
      // Even if the API call fails, clear local state
      logout();
      router.push("/");
    },
  });
}
