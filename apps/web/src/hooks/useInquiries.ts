"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, errorMessage } from "../lib/api";
import type { InquiryListItem, InquiryThread } from "../lib/types";
import { useAuthStore } from "../stores/authStore";
import { toast } from "../stores/toastStore";

export function useInquiries(status: "active" | "closed" | "all" = "active", listingId?: string) {
  const params = new URLSearchParams({ status, ...(listingId && { listingId }) });
  return useQuery({
    queryKey: ["inquiries", status, listingId],
    queryFn: () => api<InquiryListItem[]>("get", `/api/inquiries/my?${params}`),
    refetchInterval: 30_000,
  });
}

export function useUnreadMessages() {
  const authenticated = useAuthStore((s) => s.status === "authenticated" && s.user?.role !== "ADMIN");
  return useQuery({
    queryKey: ["unread-messages"],
    queryFn: () => api<{ unreadCount: number }>("get", "/api/inquiries/unread-count"),
    enabled: authenticated,
    refetchInterval: 30_000,
  });
}

export function useInquiry(id: string) {
  return useQuery({
    queryKey: ["inquiry", id],
    queryFn: () => api<InquiryThread>("get", `/api/inquiries/${id}`),
    enabled: Boolean(id),
    // Poll while the thread is open so replies appear without a refresh.
    refetchInterval: 8_000,
  });
}

export function useInquiryForListing(listingId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["inquiry-for-listing", listingId],
    queryFn: () => api<InquiryThread | null>("get", `/api/inquiries/for-listing/${listingId}`),
    enabled,
  });
}

function useApplyThread() {
  const queryClient = useQueryClient();
  return (thread: InquiryThread) => {
    queryClient.setQueryData(["inquiry", thread.id], thread);
    queryClient.invalidateQueries({ queryKey: ["inquiries"] });
    queryClient.invalidateQueries({ queryKey: ["inquiry-for-listing", thread.listingId] });
    queryClient.invalidateQueries({ queryKey: ["unread-messages"] });
    queryClient.invalidateQueries({ queryKey: ["listing", thread.listingId] });
  };
}

export function useCreateInquiry() {
  const apply = useApplyThread();
  return useMutation({
    mutationFn: (input: { listingId: string; message: string }) => api<InquiryThread>("post", "/api/inquiries", input),
    onSuccess: (thread) => {
      apply(thread);
      toast.success("Message sent. The landlord will reply here.");
    },
  });
}

export function useSendMessage(id: string) {
  const apply = useApplyThread();
  return useMutation({
    mutationFn: (message: string) => api<InquiryThread>("post", `/api/inquiries/${id}/message`, { message }),
    onSuccess: apply,
    onError: (error) => toast.error(errorMessage(error)),
  });
}

type ThreadAction =
  | { type: "scheduleInspection"; scheduledAt: string; notes?: string }
  | { type: "confirmInspection" }
  | { type: "completeInspection" }
  | { type: "makeOffer"; note?: string }
  | { type: "withdrawOffer" }
  | { type: "acceptOffer" }
  | { type: "declineOffer"; reason?: string }
  | { type: "close"; reason?: string };

const ACTION_REQUEST: Record<ThreadAction["type"], (a: ThreadAction) => { path: string; body?: unknown; done: string }> = {
  scheduleInspection: (a) => ({ path: "inspection", body: { scheduledAt: (a as { scheduledAt: string }).scheduledAt, notes: (a as { notes?: string }).notes }, done: "Inspection time proposed" }),
  confirmInspection: () => ({ path: "inspection/confirm", done: "Inspection confirmed" }),
  completeInspection: () => ({ path: "inspection/complete", done: "Inspection marked as done" }),
  makeOffer: (a) => ({ path: "offer", body: { note: (a as { note?: string }).note }, done: "Offer sent" }),
  withdrawOffer: () => ({ path: "offer/withdraw", done: "Offer withdrawn" }),
  acceptOffer: () => ({ path: "offer/accept", done: "Offer accepted — the home is held for you" }),
  declineOffer: (a) => ({ path: "offer/decline", body: { reason: (a as { reason?: string }).reason }, done: "Offer declined" }),
  close: (a) => ({ path: "close", body: { reason: (a as { reason?: string }).reason }, done: "Conversation closed" }),
};

export function useInquiryAction(id: string) {
  const apply = useApplyThread();
  return useMutation({
    mutationFn: (action: ThreadAction) => {
      const request = ACTION_REQUEST[action.type](action);
      return api<InquiryThread>("post", `/api/inquiries/${id}/${request.path}`, request.body ?? {});
    },
    onSuccess: (thread, action) => {
      apply(thread);
      toast.success(ACTION_REQUEST[action.type](action).done);
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
}
