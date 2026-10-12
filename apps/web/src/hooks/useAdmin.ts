"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, errorMessage, http } from "../lib/api";
import { toast } from "../stores/toastStore";

export interface AdminPage<T> {
  items: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface AdminOverview {
  users: Record<string, number>;
  listings: Record<string, number>;
  pendingVerifications: number;
  openDisputes: number;
  escrow: { count: number; total: number };
  payoutIssues: number;
  released: { count: number; total: number; platformFees: number };
}

export function useAdminOverview() {
  return useQuery({ queryKey: ["admin", "overview"], queryFn: () => api<AdminOverview>("get", "/api/admin/overview") });
}

export function useAdminList<T>(resource: "users" | "listings" | "payments" | "audit-log", params: { q?: string; status?: string; page?: number }) {
  const query = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== "").map(([k, v]) => [k, String(v)]));
  return useQuery({
    queryKey: ["admin", resource, params],
    queryFn: () => api<AdminPage<T>>("get", `/api/admin/${resource}?${query}`),
    placeholderData: keepPreviousData,
  });
}

export function useAdminQuery<T>(key: string, path: string) {
  return useQuery({ queryKey: ["admin", key], queryFn: () => api<T>("get", path) });
}

/** Any admin write; refreshes every admin view afterwards. */
export function useAdminMutation(done: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ method, path, body }: { method: "patch" | "post"; path: string; body?: unknown }) => api(method, path, body ?? {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      toast.success(done);
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
}

/** Open a private verification document. It needs the admin's token, so it's fetched rather than linked. */
export async function openVerificationDocument(id: string) {
  const viewer = window.open("", "_blank");
  try {
    const response = await http.get(`/api/admin/verifications/${id}/document`, { responseType: "blob" });
    const url = URL.createObjectURL(response.data as Blob);
    if (viewer) viewer.location.href = url;
    else window.location.href = url;
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch (error) {
    viewer?.close();
    toast.error(errorMessage(error, "We couldn't open that document."));
  }
}
