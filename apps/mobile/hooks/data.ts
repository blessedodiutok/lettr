// React Query hooks for every screen. Mutations refresh the affected data and
// show the API's own message when something fails.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, errorMessage } from "../lib/api";
import type { AppNotification, InquiryListItem, InquiryThread, Listing, Me, Payment, Tenancy, TenancyDetail } from "../lib/types";
import { useAuthStore } from "../stores/auth";
import { toast } from "../stores/toast";

const useSignedIn = () => useAuthStore((s) => s.status === "authenticated");

// ── Listings ───────────────────────────────────────────────────────────────

export function useListingSearch(params: Record<string, string | undefined>) {
  const query = new URLSearchParams(Object.entries(params).filter((entry): entry is [string, string] => Boolean(entry[1])));
  const ready = useAuthStore((s) => s.status !== "loading");
  return useQuery({
    queryKey: ["listings", params],
    queryFn: () => api<{ listings: Listing[]; pagination: { total: number } }>("get", `/api/listings?${query}`),
    enabled: ready,
  });
}

export function useListing(id: string) {
  const ready = useAuthStore((s) => s.status !== "loading");
  return useQuery({ queryKey: ["listing", id], queryFn: () => api<Listing>("get", `/api/listings/${id}`), enabled: Boolean(id) && ready });
}

export function useSavedListings() {
  return useQuery({ queryKey: ["saved"], queryFn: () => api<Array<{ listing: Listing }>>("get", "/api/listings/tenant/saved"), enabled: useSignedIn() });
}

export function useToggleSave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, saved }: { id: string; saved: boolean }) => api(saved ? "delete" : "post", `/api/listings/${id}/save`),
    onSuccess: (_d, { saved }) => {
      toast.success(saved ? "Removed from saved homes" : "Saved");
      qc.invalidateQueries({ queryKey: ["listings"] });
      qc.invalidateQueries({ queryKey: ["listing"] });
      qc.invalidateQueries({ queryKey: ["saved"] });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
}

export function useMyListings() {
  return useQuery({ queryKey: ["my-listings"], queryFn: () => api<Listing[]>("get", "/api/listings/landlord/mine"), enabled: useSignedIn() });
}

// ── Inquiries ──────────────────────────────────────────────────────────────

export function useInquiries(status: "active" | "closed" = "active") {
  return useQuery({
    queryKey: ["inquiries", status],
    queryFn: () => api<InquiryListItem[]>("get", `/api/inquiries/my?status=${status}`),
    enabled: useSignedIn(),
    refetchInterval: 30_000,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ["unread"],
    queryFn: () => api<{ unreadCount: number }>("get", "/api/inquiries/unread-count"),
    enabled: useSignedIn(),
    refetchInterval: 30_000,
  });
}

export function useInquiry(id: string) {
  return useQuery({ queryKey: ["inquiry", id], queryFn: () => api<InquiryThread>("get", `/api/inquiries/${id}`), refetchInterval: 8_000 });
}

export function useInquiryForListing(listingId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["inquiry-for-listing", listingId],
    queryFn: () => api<InquiryThread | null>("get", `/api/inquiries/for-listing/${listingId}`),
    enabled,
  });
}

function useApplyThread() {
  const qc = useQueryClient();
  return (thread: InquiryThread) => {
    qc.setQueryData(["inquiry", thread.id], thread);
    qc.invalidateQueries({ queryKey: ["inquiries"] });
    qc.invalidateQueries({ queryKey: ["unread"] });
    qc.invalidateQueries({ queryKey: ["inquiry-for-listing", thread.listingId] });
  };
}

export function useCreateInquiry() {
  const apply = useApplyThread();
  return useMutation({
    mutationFn: (body: { listingId: string; message: string }) => api<InquiryThread>("post", "/api/inquiries", body),
    onSuccess: apply,
  });
}

export function useSendMessage(id: string) {
  const apply = useApplyThread();
  return useMutation({
    mutationFn: (message: string) => api<InquiryThread>("post", `/api/inquiries/${id}/message`, { message }),
    onSuccess: apply,
    onError: (e) => toast.error(errorMessage(e)),
  });
}

/** POST /api/inquiries/:id/<path> — inspection, offer and close actions. */
export function useThreadAction(id: string) {
  const apply = useApplyThread();
  return useMutation({
    mutationFn: ({ path, body }: { path: string; body?: unknown; done: string }) => api<InquiryThread>("post", `/api/inquiries/${id}/${path}`, body ?? {}),
    onSuccess: (thread, { done }) => {
      apply(thread);
      toast.success(done);
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
}

// ── Tenancies and payments ─────────────────────────────────────────────────

export function useTenancies() {
  return useQuery({ queryKey: ["tenancies"], queryFn: () => api<Tenancy[]>("get", "/api/tenancy/my"), enabled: useSignedIn() });
}

export function useTenancy(id: string) {
  return useQuery({ queryKey: ["tenancy", id], queryFn: () => api<TenancyDetail>("get", `/api/tenancy/${id}`) });
}

export function useTenancyAction(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ action, body }: { action: "sign" | "handover" | "confirm-move-in" | "cancel"; body?: unknown; done: string }) =>
      api<TenancyDetail>("post", `/api/tenancy/${id}/${action}`, body ?? {}),
    onSuccess: (tenancy, { done }) => {
      qc.setQueryData(["tenancy", id], tenancy);
      qc.invalidateQueries({ queryKey: ["tenancies"] });
      qc.invalidateQueries({ queryKey: ["payments"] });
      toast.success(done);
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
}

export function useRaiseDispute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ paymentId, reason }: { paymentId: string; reason: string }) => api("post", `/api/payments/${paymentId}/disputes`, { reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tenancy"] });
      toast.success("Dispute raised. The payout is paused while Lettr reviews it.");
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
}

export function usePayments() {
  return useQuery({ queryKey: ["payments"], queryFn: () => api<Payment[]>("get", "/api/payments/my"), enabled: useSignedIn() });
}

export function useInitiatePayment() {
  return useMutation({
    mutationFn: (listingId: string) =>
      api<{ paymentId: string; authorizationUrl: string; simulated: boolean; breakdown: Listing["moveInCost"] }>("post", "/api/payments/initiate", { listingId }),
  });
}

export function usePaymentStatus(paymentId: string) {
  return useQuery({
    queryKey: ["payment-status", paymentId],
    queryFn: () => api<Payment>("post", `/api/payments/${paymentId}/verify`),
    refetchInterval: (q) => (["PENDING", "PROCESSING"].includes(q.state.data?.status ?? "PENDING") ? 3000 : false),
  });
}

// ── Account ────────────────────────────────────────────────────────────────

export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: () => api<{ notifications: AppNotification[]; unreadCount: number }>("get", "/api/notifications"),
    enabled: useSignedIn(),
    refetchInterval: 45_000,
  });
}

export function useMarkNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id?: string) => (id ? api("patch", `/api/notifications/${id}/read`) : api("patch", "/api/notifications/read-all")),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

export function useUpdateProfile() {
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: (body: unknown) => api<Me>("put", "/api/users/me", body),
    onSuccess: (user) => {
      setUser(user);
      toast.success("Profile saved");
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
}
