"use client";

// Browser API client. Requests go to same-origin /api (rewritten to the API by
// Next.js), carry the in-memory access token, and transparently refresh it once
// when it expires.

import { getApiErrorMessage } from "@lettr/utils";
import axios, { type AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "../stores/authStore";

export const http = axios.create({ baseURL: "", withCredentials: true, timeout: 20_000 });

http.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing: Promise<string | null> | null = null;

/** Exchange the refresh cookie for a new access token. Shared by concurrent callers. */
export function refreshAccessToken(): Promise<string | null> {
  refreshing ??= axios
    .post<{ data: { accessToken: string } | null }>("/api/auth/refresh", {}, { withCredentials: true })
    .then((res) => {
      const token = res.data.data?.accessToken ?? null;
      if (token) useAuthStore.getState().setAccessToken(token);
      return token;
    })
    .catch(() => null)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retried?: boolean };
    const isAuthCall = original?.url?.startsWith("/api/auth/");
    if (error.response?.status !== 401 || !original || original._retried || isAuthCall) throw error;

    original._retried = true;
    const token = await refreshAccessToken();
    if (!token) {
      useAuthStore.getState().clear();
      throw error;
    }
    original.headers.Authorization = `Bearer ${token}`;
    return http(original);
  },
);

/** Call the API and unwrap { success, data }. */
export async function api<T>(method: "get" | "post" | "put" | "patch" | "delete", url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const response = await http.request<{ data: T }>({ method, url, data, ...config });
  return response.data.data;
}

export const errorMessage = getApiErrorMessage;

/** The API's machine-readable error code, e.g. EMAIL_NOT_VERIFIED. */
export function errorCode(error: unknown): string | undefined {
  return (error as { response?: { data?: { code?: string } } })?.response?.data?.code;
}

export function errorData<T>(error: unknown): T | undefined {
  return (error as { response?: { data?: { data?: T } } })?.response?.data?.data;
}
