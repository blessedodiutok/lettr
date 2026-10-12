// API client for the app. Identifies itself as mobile so auth endpoints return
// the refresh token in the body, keeps tokens in SecureStore, and refreshes the
// access token once when it expires.

import { getApiErrorMessage } from "@lettr/utils";
import axios, { type AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from "axios";
import { clearTokens, getAccessToken, getRefreshToken, saveTokens } from "./tokens";

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000";
export const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL ?? "http://localhost:3000";

export const http = axios.create({
  baseURL: API_URL,
  timeout: 20_000,
  headers: { "X-Client-Platform": "mobile" },
});

http.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing: Promise<string | null> | null = null;
let onSignedOut: (() => void) | null = null;

/** Called when the session can't be refreshed, so the app can show the signed-out state. */
export function setSignedOutHandler(handler: () => void) {
  onSignedOut = handler;
}

export function refreshSession(): Promise<string | null> {
  refreshing ??= (async () => {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) return null;
    try {
      const res = await axios.post<{ data: { accessToken: string; refreshToken: string } | null }>(
        `${API_URL}/api/auth/refresh`,
        { refreshToken },
        { headers: { "X-Client-Platform": "mobile" }, timeout: 20_000 },
      );
      if (!res.data.data) return null;
      await saveTokens(res.data.data.accessToken, res.data.data.refreshToken);
      return res.data.data.accessToken;
    } catch (error) {
      // Offline: keep the tokens and try again later. Rejected: sign out.
      if ((error as AxiosError).response?.status === 401) await clearTokens();
      return null;
    }
  })().finally(() => {
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
    const token = await refreshSession();
    if (!token) {
      onSignedOut?.();
      throw error;
    }
    original.headers.Authorization = `Bearer ${token}`;
    return http(original);
  },
);

export async function api<T>(method: "get" | "post" | "put" | "patch" | "delete", url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const response = await http.request<{ data: T }>({ method, url, data, ...config });
  return response.data.data;
}

export const errorMessage = getApiErrorMessage;

export function errorCode(error: unknown): string | undefined {
  return (error as { response?: { data?: { code?: string } } })?.response?.data?.code;
}

export function errorData<T>(error: unknown): T | undefined {
  return (error as { response?: { data?: { data?: T } } })?.response?.data?.data;
}
